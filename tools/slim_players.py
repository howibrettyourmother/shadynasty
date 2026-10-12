#!/usr/bin/env python3
"""Build data/players.json for SHADYNASTY: a slim copy of Sleeper's ~15 MB /v1/players/nfl plus this week's projections.
Same idea as Weasel Hub's slim file (Brett's private hub), scoped to this league:
  p  : every fantasy-position player (QB/RB/WR/TE/K/DEF) plus any id that ever appeared in this league (rosters, starters,
       trades, waivers, drafts since 2021), as {n: name, p: positions, t: team}. Players on an NFL team also carry their
       Sleeper injury fields: i = injury_status, b = body part, s = roster status when not Active, e = espn_id.
  pj : this week's Sleeper (Rotowire) projections scored with the league's own scoring settings, for players on an NFL team.
The browser prefers this file (tiny, gzipped by Pages) and falls back to Sleeper direct when it's missing, stale or incomplete.
Fails loudly (non-zero exit) on implausible Sleeper data so a bad run never overwrites a good file."""
import json, os, sys, time, urllib.request
LEAGUE = os.environ.get('SN_LEAGUE', '1312055708249767936')
API = 'https://api.sleeper.app'
HIST = 'tools/hist_ids.json'   # player ids per COMPLETED season (immutable, so each past season is walked once)
def get(path):
    req = urllib.request.Request(API + path, headers={'User-Agent': 'shadynasty-slim/1.0', 'Accept-Encoding': 'identity'})
    for i in range(3):
        try:
            with urllib.request.urlopen(req, timeout=120) as r:
                return json.load(r)
        except Exception as e:
            if i == 2: raise
            time.sleep(3)
def season_ids(lg):
    lid, ids = lg['league_id'], set()
    last = int((lg.get('settings') or {}).get('last_scored_leg') or 0)
    for r in get('/v1/league/%s/rosters' % lid) or []:
        ids.update(r.get('players') or []); ids.update(r.get('reserve') or []); ids.update(r.get('taxi') or [])
    for w in range(1, max(last, 1) + 1):
        for m in get('/v1/league/%s/matchups/%d' % (lid, w)) or []: ids.update(m.get('players') or [])
    for w in range(1, 19):
        for t in get('/v1/league/%s/transactions/%d' % (lid, w)) or []:
            ids.update((t.get('adds') or {}).keys()); ids.update((t.get('drops') or {}).keys())
    for d in get('/v1/league/%s/drafts' % lid) or []:
        for p in get('/v1/draft/%s/picks' % d['draft_id']) or []:
            if p.get('player_id'): ids.add(p['player_id'])
    return ids
state = get('/v1/state/nfl')
season, week = str(state.get('league_season') or state.get('season')), int(state.get('display_week') or state.get('week') or 1)
hist = {}
try: hist = json.load(open(HIST))
except Exception: pass
ids, lid, cur = set(), LEAGUE, None
while lid and lid != '0':
    lg = get('/v1/league/' + lid)
    if cur is None: cur = lg
    if lg.get('status') == 'complete':
        if lid not in hist: hist[lid] = sorted(season_ids(lg))
        ids.update(hist[lid])
    else:
        ids.update(season_ids(lg))
    lid = lg.get('previous_league_id')
allp = get('/v1/players/nfl')
if not isinstance(allp, dict) or len(allp) < 5000:
    sys.exit('players file looks wrong: %r entries' % (len(allp) if hasattr(allp, '__len__') else allp))
want = {'QB', 'RB', 'WR', 'TE', 'K', 'DEF'}; out = {}
for pid, p in allp.items():
    fp = [x for x in (p.get('fantasy_positions') or [p.get('position')]) if x]
    if not any(x in want for x in fp) and pid not in ids: continue
    if p.get('position') == 'DEF': name = ((p.get('first_name') or '') + ' ' + (p.get('last_name') or '')).strip() + ' D/ST'
    else: name = p.get('full_name') or ((p.get('first_name') or '') + ' ' + (p.get('last_name') or '')).strip()
    x = {'n': name, 'p': fp, 't': p.get('team') or 'FA'}
    if p.get('team'):
        if p.get('injury_status'): x['i'] = p['injury_status']; x['b'] = p.get('injury_body_part') or ''
        if p.get('status') and p.get('status') != 'Active': x['s'] = p['status']
        if p.get('espn_id'): x['e'] = str(p['espn_id'])
    out[pid] = x
cur_ids = set()
for r in get('/v1/league/%s/rosters' % LEAGUE) or []: cur_ids.update(r.get('players') or [])
miss = [i for i in cur_ids if i not in out]
if len(out) < 2000 or len(miss) > 3: sys.exit('only %d players, %d current rostered missing; refusing to write' % (len(out), len(miss)))
# this week's projections, scored with the league's scoring settings (fallback: Sleeper's own PPR number)
ss = (cur or {}).get('scoring_settings') or {}
pj = {}
if (state.get('season_type') == 'regular') and week >= 1:
    q = '&'.join('position[]=' + x for x in ['QB', 'RB', 'WR', 'TE', 'K', 'DEF'])
    try:
        for x in get('/projections/nfl/%s/%d?season_type=regular&%s' % (season, week, q)) or []:
            s, pid = x.get('stats') or {}, x.get('player_id')
            if not pid or pid not in out or out[pid]['t'] == 'FA': continue
            v = 0.0
            for k, w in ss.items():
                if not w: continue
                sv = s.get(k)
                if sv is None and k == 'fgmiss': sv = sum(s.get(z, 0) for z in ('fgmiss_0_19', 'fgmiss_20_29', 'fgmiss_30_39', 'fgmiss_40_49', 'fgmiss_50p'))
                if sv is None: continue
                v += sv * w
            if v == 0 and s.get('pts_ppr'): v = s['pts_ppr']
            if v > 0.05: pj[pid] = round(v, 2)
    except Exception as e:
        print('projections unavailable:', e)
os.makedirs('data', exist_ok=True)
with open('data/players.json', 'w') as f:
    json.dump({'at': int(time.time() * 1000), 'season': season, 'week': week, 'n': len(out), 'p': out, 'pj': pj}, f, separators=(',', ':'))
with open(HIST, 'w') as f: json.dump(hist, f, separators=(',', ':'))
print('wrote %d players (%d league ids), %d projections for week %d' % (len(out), len(ids), len(pj), week))
