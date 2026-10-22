// LESSHOUSE: league leaderboard Worker (own KV namespace). board:<main|test> = {v,top:[...],updated}. Higher s is better.
// Sanity: score must fit shots and levels cleared; run time must fit shots. Rate limits per device and per IP.
const ID_RE = /^[a-z0-9]{8,16}$/, UID_RE = /^[0-9]{3,24}$/, AV_RE = /^[a-f0-9]{0,40}$/, BOARDS = new Set(['main', 'test']);
const PER_TEAM = 10, MAX_KEEP = 300, MAX_DEV_HOUR = 40, MAX_IP_HOUR = 80, MIN_GAP_MS = 4000;
const cleanName = n => String(n || '').replace(/[\u0000-\u001f\u007f<>"`\\]/g, '').replace(/\s+/g, ' ').trim().slice(0, 32);
export function valid(e) {   // v2 = LESSHOUSE slingshot: s score, t run ms, lv levels cleared (0-5), sh shots fired
  try {
    if (!e || e.v !== 2) return false;
    if (!ID_RE.test(String(e.id || '')) || !ID_RE.test(String(e.dev || '')) || !UID_RE.test(String(e.uid || '')) || !AV_RE.test(String(e.av || ''))) return false;
    if (!cleanName(e.n)) return false;
    for (const x of [e.s, e.t, e.lv, e.sh]) if (!Number.isInteger(x) || x < 0) return false;
    if ((e.m !== undefined && e.m !== 'o' && e.m !== 'd') || e.s < 1 || e.lv > 5 || e.sh < 1 || e.sh > 40 || e.sh < e.lv) return false;
    if (e.t < e.sh * 600 || e.t > 4 * 3600000) return false;
    if (e.s > e.sh * 16000 + e.lv * 10000 + 10000) return false;
    return true;
  } catch { return false }
}
const clean = (e, ts) => ({ id: e.id, uid: String(e.uid), n: cleanName(e.n), av: String(e.av || ''), s: e.s, t: e.t, lv: e.lv, sh: e.sh, m: e.m === 'd' ? 'd' : 'o', dev: e.dev, ts });
// week key = date (YYYY-MM-DD) of the most recent Monday 00:00 America/New_York
export function weekKey(ms) { const f = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'short' }).formatToParts(new Date(ms)), g = k => f.find(x => x.type === k).value;
  const dow = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].indexOf(g('weekday')), d = new Date(Date.UTC(+g('year'), +g('month') - 1, +g('day') - dow)); return d.toISOString().slice(0, 10) }
export function insert(top, ent) {
  if (top.some(x => x.id === ent.id)) return { changed: false, top, reason: 'dup' };
  const all = [...top, ent].sort((a, b) => b.s - a.s || a.ts - b.ts), per = {}, out = [];
  for (const x of all) { per[x.uid] = (per[x.uid] || 0) + 1; if (per[x.uid] <= PER_TEAM) out.push(x) }
  const next = out.slice(0, MAX_KEEP);
  return next.some(x => x.id === ent.id) ? { changed: true, top: next, reason: 'ok' } : { changed: false, top, reason: 'below-cut' };
}
const teamBest = top => { const s = new Set(), o = []; for (const x of top) if (!s.has(x.uid)) { s.add(x.uid); o.push(x) } return o };
const pub = x => ({ id: x.id, uid: x.uid, n: x.n, av: x.av, s: x.s, t: x.t, lv: x.lv, m: x.m, ts: x.ts });
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
const view = (top, uid, limit, wk, wtop) => ({ week: { key: wk, top: (wtop || []).slice(0, limit).map(pub) }, top: top.slice(0, limit).map(pub), teams: teamBest(top).slice(0, 20).map(pub), mine: uid ? top.filter(x => x.uid === uid).slice(0, PER_TEAM).map(pub) : undefined, count: top.length });
export default {
  async fetch(req, env) {
    const url = new URL(req.url), board = BOARDS.has(url.searchParams.get('board')) ? url.searchParams.get('board') : 'main', c = cors(req, env, board);
    if (req.method === 'OPTIONS') return new Response(null, { status: c.allowed ? 204 : 403, headers: c.h });
    if (url.pathname === '/') return json({ ok: true, service: 'legally-scores', endpoints: ['GET /scores?board=main&limit=10&uid=', 'POST /scores'] }, 200, c.h);
    if (url.pathname !== '/scores') return json({ ok: false, error: 'not found' }, 404, c.h);
    const K = 'board:' + board, limit = Math.max(1, Math.min(50, parseInt(url.searchParams.get('limit') || '10', 10) || 10));
    const wk = weekKey(Date.now()), KW = K + ':w:' + wk;
    const [doc0, wdoc0] = await Promise.all([env.LJ.get(K, { type: 'json' }), env.LJ.get(KW, { type: 'json' })]), doc = doc0 || { v: 1, top: [] }, top = doc.top || [], wtop = (wdoc0 && wdoc0.top) || [];
    if (req.method === 'GET') { const u = url.searchParams.get('uid'); return json({ ok: true, board, updated: doc.updated || 0, ...view(top, UID_RE.test(u || '') ? u : '', limit, wk, wtop) }, 200, c.h) }
    if (req.method !== 'POST') return json({ ok: false, error: 'method' }, 405, c.h);
    if (!c.allowed) return json({ ok: false, error: 'origin not allowed' }, 403, c.h);
    let e; try { const t = await req.text(); if (t.length > 1500) throw 0; e = JSON.parse(t) } catch { return json({ ok: false, error: 'bad json' }, 400, c.h) }
    if (!valid(e)) return json({ ok: false, error: 'implausible score' }, 422, c.h);
    const now = Date.now(), hr = Math.floor(now / 3600000), ip = await sha((req.headers.get('CF-Connecting-IP') || 'x') + '|lesshouse');
    const kd = `rl:${board}:d:${e.dev}:${hr}`, ki = `rl:${board}:i:${ip}:${hr}`, kl = `rl:${board}:last:${e.dev}`;
    const [nd, ni, last] = await Promise.all([env.LJ.get(kd), env.LJ.get(ki), env.LJ.get(kl)]);
    if ((+nd || 0) >= MAX_DEV_HOUR || (+ni || 0) >= MAX_IP_HOUR || (last && now - +last < MIN_GAP_MS)) return json({ ok: false, error: 'rate limited, try later' }, 429, c.h);
    const ent = clean(e, Math.floor(now / 1000)), r = insert(top, ent), rw = insert(wtop, ent);
    const w = [env.LJ.put(kd, String((+nd || 0) + 1), { expirationTtl: 3900 }), env.LJ.put(ki, String((+ni || 0) + 1), { expirationTtl: 3900 }), env.LJ.put(kl, String(now), { expirationTtl: 120 })];
    if (r.changed) w.push(env.LJ.put(K, JSON.stringify({ v: 1, top: r.top, updated: ent.ts })));
    if (rw.changed) w.push(env.LJ.put(KW, JSON.stringify({ v: 1, top: rw.top, updated: ent.ts }), { expirationTtl: 60 * 86400 }));
    await Promise.all(w);
    const t = r.top, i = t.findIndex(x => x.id === ent.id), tb = teamBest(t);
    return json({ ok: true, changed: r.changed, reason: r.reason, rank: i + 1, weekRank: rw.top.findIndex(x => x.id === ent.id) + 1, teamPlace: tb.findIndex(x => x.uid === ent.uid) + 1, ...view(t, ent.uid, limit, wk, rw.top) }, 200, c.h);
  }
};
