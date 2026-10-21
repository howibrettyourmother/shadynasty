// LEGALLY JOE: league leaderboard Worker (own KV namespace). board:<main|test> = {v,top:[...],updated}. Higher s is better.
// Sanity: score must fit the run time (distance pts <= 90/s + glitter*5 + bags*25). Rate limits per device and per IP.
const ID_RE = /^[a-z0-9]{8,16}$/, UID_RE = /^[0-9]{3,24}$/, AV_RE = /^[a-f0-9]{0,40}$/, BOARDS = new Set(['main', 'test']);
const PER_TEAM = 10, MAX_KEEP = 300, MAX_DEV_HOUR = 40, MAX_IP_HOUR = 80, MIN_GAP_MS = 4000;
const cleanName = n => String(n || '').replace(/[\u0000-\u001f\u007f<>"`\\]/g, '').replace(/\s+/g, ' ').trim().slice(0, 32);
export function valid(e) {
  try {
    if (!e || e.v !== 1) return false;
    if (!ID_RE.test(String(e.id || '')) || !ID_RE.test(String(e.dev || '')) || !UID_RE.test(String(e.uid || '')) || !AV_RE.test(String(e.av || ''))) return false;
    if (!cleanName(e.n)) return false;
    for (const x of [e.s, e.t, e.g, e.b]) if (!Number.isInteger(x) || x < 0) return false;
    const sec = e.t / 1000;
    if (e.t < 1000 || e.t > 3600000 || e.s < 1) return false;
    if (e.g > 4 * sec + 6 || e.b > sec / 2 + 3) return false;
    if (e.s > 90 * sec + e.g * 5 + e.b * 25 + 50) return false;
    return true;
  } catch { return false }
}
const clean = (e, ts) => ({ id: e.id, uid: String(e.uid), n: cleanName(e.n), av: String(e.av || ''), s: e.s, t: e.t, g: e.g, b: e.b, dev: e.dev, ts });
export function insert(top, ent) {
  if (top.some(x => x.id === ent.id)) return { changed: false, top, reason: 'dup' };
  const all = [...top, ent].sort((a, b) => b.s - a.s || a.ts - b.ts), per = {}, out = [];
  for (const x of all) { per[x.uid] = (per[x.uid] || 0) + 1; if (per[x.uid] <= PER_TEAM) out.push(x) }
  const next = out.slice(0, MAX_KEEP);
  return next.some(x => x.id === ent.id) ? { changed: true, top: next, reason: 'ok' } : { changed: false, top, reason: 'below-cut' };
}
const teamBest = top => { const s = new Set(), o = []; for (const x of top) if (!s.has(x.uid)) { s.add(x.uid); o.push(x) } return o };
const pub = x => ({ id: x.id, uid: x.uid, n: x.n, av: x.av, s: x.s, t: x.t, ts: x.ts });
async function sha(s) { const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)); return [...new Uint8Array(b)].slice(0, 8).map(x => x.toString(16).padStart(2, '0')).join('') }
function cors(req, env, board) {
  const o = req.headers.get('Origin') || '', ok = (env.ALLOWED_ORIGINS || '').split(',').map(x => x.trim()).filter(Boolean);
  const allowed = ok.includes(o) || (board === 'test' && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(o));
  const h = { 'Vary': 'Origin', 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' };
  if (allowed) Object.assign(h, { 'Access-Control-Allow-Origin': o, 'Access-Control-Allow-Methods': 'GET,POST,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Max-Age': '86400' });
  else h['Access-Control-Allow-Origin'] = '*';
  return { h, allowed };
}
const json = (o, s, h) => new Response(JSON.stringify(o), { status: s || 200, headers: h });
const view = (top, uid, limit) => ({ top: top.slice(0, limit).map(pub), teams: teamBest(top).slice(0, 20).map(pub), mine: uid ? top.filter(x => x.uid === uid).slice(0, PER_TEAM).map(pub) : undefined, count: top.length });
export default {
  async fetch(req, env) {
    const url = new URL(req.url), board = BOARDS.has(url.searchParams.get('board')) ? url.searchParams.get('board') : 'main', c = cors(req, env, board);
    if (req.method === 'OPTIONS') return new Response(null, { status: c.allowed ? 204 : 403, headers: c.h });
    if (url.pathname === '/') return json({ ok: true, service: 'legally-scores', endpoints: ['GET /scores?board=main&limit=10&uid=', 'POST /scores'] }, 200, c.h);
    if (url.pathname !== '/scores') return json({ ok: false, error: 'not found' }, 404, c.h);
    const K = 'board:' + board, limit = Math.max(1, Math.min(50, parseInt(url.searchParams.get('limit') || '10', 10) || 10));
    const doc = (await env.LJ.get(K, { type: 'json' })) || { v: 1, top: [] }, top = doc.top || [];
    if (req.method === 'GET') { const u = url.searchParams.get('uid'); return json({ ok: true, board, updated: doc.updated || 0, ...view(top, UID_RE.test(u || '') ? u : '', limit) }, 200, c.h) }
    if (req.method !== 'POST') return json({ ok: false, error: 'method' }, 405, c.h);
    if (!c.allowed) return json({ ok: false, error: 'origin not allowed' }, 403, c.h);
    let e; try { const t = await req.text(); if (t.length > 1500) throw 0; e = JSON.parse(t) } catch { return json({ ok: false, error: 'bad json' }, 400, c.h) }
    if (!valid(e)) return json({ ok: false, error: 'implausible score' }, 422, c.h);
    const now = Date.now(), hr = Math.floor(now / 3600000), ip = await sha((req.headers.get('CF-Connecting-IP') || 'x') + '|legally');
    const kd = `rl:${board}:d:${e.dev}:${hr}`, ki = `rl:${board}:i:${ip}:${hr}`, kl = `rl:${board}:last:${e.dev}`;
    const [nd, ni, last] = await Promise.all([env.LJ.get(kd), env.LJ.get(ki), env.LJ.get(kl)]);
    if ((+nd || 0) >= MAX_DEV_HOUR || (+ni || 0) >= MAX_IP_HOUR || (last && now - +last < MIN_GAP_MS)) return json({ ok: false, error: 'rate limited, try later' }, 429, c.h);
    const ent = clean(e, Math.floor(now / 1000)), r = insert(top, ent);
    const w = [env.LJ.put(kd, String((+nd || 0) + 1), { expirationTtl: 3900 }), env.LJ.put(ki, String((+ni || 0) + 1), { expirationTtl: 3900 }), env.LJ.put(kl, String(now), { expirationTtl: 120 })];
    if (r.changed) w.push(env.LJ.put(K, JSON.stringify({ v: 1, top: r.top, updated: ent.ts })));
    await Promise.all(w);
    const t = r.top, i = t.findIndex(x => x.id === ent.id), tb = teamBest(t);
    return json({ ok: true, changed: r.changed, reason: r.reason, rank: i + 1, teamPlace: tb.findIndex(x => x.uid === ent.uid) + 1, ...view(t, ent.uid, limit) }, 200, c.h);
  }
};
