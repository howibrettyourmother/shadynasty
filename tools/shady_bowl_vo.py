#!/usr/bin/env python3
"""Pre-render the Shady Bowl announcer with a neural voice (edge-tts) into arcade/shady-bowl/vo/.
Keys (must match v2.js): seg:<norm>  fixed template pieces / literal lines, name:<norm> team + starter names,
num:<n> numbers, roast:<norm> this week's real-results roast lines (also written to vo/roast.json).
Only missing clips are rendered; orphans are deleted. Re-run whenever lines.js changes or league data updates."""
import asyncio, hashlib, json, os, re, subprocess, sys, urllib.request
VOICE = os.environ.get('SB_VOICE', 'en-US-GuyNeural'); RATE = '+15%'; PITCH = '-3Hz'
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); GAME = os.path.join(ROOT, 'arcade/shady-bowl'); VO = os.path.join(GAME, 'vo')
LEAGUE = '1312055708249767936'; API = 'https://api.sleeper.app/v1/'
def get(p):
    with urllib.request.urlopen(urllib.request.Request(API + p, headers={'User-Agent': 'shadybowl-vo'}), timeout=60) as r: return json.load(r)
def norm(s):
    s = str(s).lower().replace('\u2018', "'").replace('\u2019', "'")
    s = re.sub(r"[^a-z0-9' ]+", ' ', s).replace("'", '')
    return re.sub(r'\s+', ' ', s).strip()
def spoken(s):
    s = re.sub(r'[\U0001F000-\U0001FFFF\u2600-\u27BF\uFE0F]', '', str(s))
    s = re.sub(r'\bTD\b', 'touchdown', s); s = re.sub(r'\bINT\b', 'interception', s); s = re.sub(r'\byds\b', 'yards', s)
    s = re.sub(r'^[\s!.,?\-:]+', '', s)
    return re.sub(r'\s+', ' ', s).strip()
js = subprocess.run(['node', '-e', """global.window={};eval(require('fs').readFileSync(process.argv[1],'utf8')+
';console.log(JSON.stringify({GEN,FLAVOR,JOE_LINES,RIVAL,VO_EXTRA,TEAMS}))')""", os.path.join(GAME, 'lines.js')], capture_output=True, text=True, check=True)
L = json.loads(js.stdout); want = {}
def addk(k, text):
    if norm(k.split(':', 1)[1]) or k.startswith('num:'): want.setdefault(k, spoken(text))
tpls = []
def walk(v):
    if isinstance(v, str): tpls.append(v)
    elif isinstance(v, list): [walk(x) for x in v]
    elif isinstance(v, dict): [walk(x) for x in v.values()]
for k in ('GEN', 'FLAVOR', 'JOE_LINES', 'RIVAL', 'VO_EXTRA'): walk(L[k])
for t in tpls:
    for part in re.split(r'(\{\w+\})', t):
        if re.fullmatch(r'\{\w+\}', part) or not norm(part): continue
        addk('seg:' + norm(part), part)
for n in range(0, 151): addk('num:%d' % n, str(n))
names = {t['team'] for t in L['TEAMS']} | {'the QB', 'the RB', 'the slot', 'WR1', 'WR2'}
roast = None
try:
    users = get('league/%s/users' % LEAGUE); rosters = get('league/%s/rosters' % LEAGUE); state = get('state/nfl')
    for u in users:
        n = ((u.get('metadata') or {}).get('team_name') or '').replace('\U0001F3C6', '').strip()
        if n: names.add(n)
    P = json.load(open(os.path.join(ROOT, 'data/players.json')))['p']
    for r in rosters:
        for x in r.get('starters') or []:
            if x in P and P[x]['p'] and P[x]['p'][0] in ('QB', 'RB', 'WR', 'TE'):
                parts = P[x]['n'].split(' '); names.add(' '.join(parts[1:]) or parts[0])
    # weekly roast (same rules as roasts() in v2.js)
    team = {}
    for u in users:
        team[u['user_id']] = ((u.get('metadata') or {}).get('team_name') or '').replace('\U0001F3C6', '').strip() or next((t['team'] for t in L['TEAMS'] if t['id'] == u['user_id']), 'Somebody')
    rid = {r['roster_id']: r['owner_id'] for r in rosters}; name = lambda i: team.get(rid.get(i), 'Somebody')
    st = state.get('season_type'); wk = (state['week'] if st == 'regular' else 18 if st == 'post' else 1) - 1
    ms = get('league/%s/matchups/%d' % (LEAGUE, wk)) if wk >= 1 else []
    if any((m.get('points') or 0) > 0 for m in ms):
        by, rows = {}, []
        for m in ms:
            by.setdefault(m['matchup_id'], []).append(m)
            bench = [x for x in m.get('players') or [] if x not in (m.get('starters') or [])]; pp = m.get('players_points') or {}; best = None
            for i, s in enumerate(m.get('starters') or []):
                sp = (m.get('starters_points') or [0] * 99)[i] or 0; ps = P.get(s, {}).get('p', [None])[0]
                if not ps: continue
                for b in bench:
                    if b in P and P[b]['p'][0] == ps and (pp.get(b) or 0) - sp > ((best and best['d']) or 3): best = {'d': (pp.get(b) or 0) - sp, 'b': P[b]['n'], 's': P[s]['n']}
            rows.append({'id': m['roster_id'], 'pts': m.get('points') or 0, 'bench': best})
        games = []
        for p in by.values():
            if len(p) == 2:
                a, b = p; games.append({'w': a, 'l': b} if (a['points'] or 0) >= (b['points'] or 0) else {'w': b, 'l': a})
        f = lambda n: '%.1f' % n; lines, tags = [], {}
        def add(s, ids):
            lines.append(s)
            for i in ids: tags.setdefault(rid.get(i), []).append(s)
        blow = max(games, key=lambda g: g['w']['points'] - g['l']['points'], default=None)
        if blow: add('%s beat the living shit out of %s, %s to %s. That\'s not a matchup, that\'s a fucking crime scene.' % (name(blow['w']['roster_id']), name(blow['l']['roster_id']), f(blow['w']['points']), f(blow['l']['points'])), [blow['w']['roster_id'], blow['l']['roster_id']])
        hi = max(rows, key=lambda r: r['pts']); add('%s dropped %s in week %d. Hottest fucking lineup in the league, and they won\'t shut up about it.' % (name(hi['id']), f(hi['pts']), wk), [hi['id']])
        lo = min(rows, key=lambda r: r['pts']); add('%s put up a pathetic %s. A kicker and a prayer would\'ve scored more.' % (name(lo['id']), f(lo['pts'])), [lo['id']])
        bl = max([r for r in rows if r['bench']], key=lambda r: r['bench']['d'], default=None)
        if bl: add('%s left %s points rotting on the bench with %s sitting there while %s took a dump. Benching genius.' % (name(bl['id']), f(bl['bench']['d']), bl['bench']['b'], bl['bench']['s']), [bl['id']])
        bad = max(games, key=lambda g: g['l']['points'], default=None)
        if bad and bad is not blow: add('%s scored %s and still fucking lost. The fantasy gods took a dump on that roster.' % (name(bad['l']['roster_id']), f(bad['l']['points'])), [bad['l']['roster_id']])
        close = min(games, key=lambda g: g['w']['points'] - g['l']['points'], default=None)
        if close and close['w']['points'] - close['l']['points'] < 6: add('%s lost by %s. Choked like a week 14 playoff lineup.' % (name(close['l']['roster_id']), f(close['w']['points'] - close['l']['points'])), [close['l']['roster_id']])
        roast = {'wk': wk, 'lines': lines, 'tags': tags}
        for s in lines: addk('roast:' + norm(s), s)
except Exception as e:
    print('league data unavailable, skipping names/roast:', e, file=sys.stderr)
for n in names: addk('name:' + norm(n), n)
fn = lambda text: hashlib.sha1(('%s|%s|%s|%s' % (VOICE, RATE, PITCH, text)).encode()).hexdigest()[:12] + '.mp3'
os.makedirs(VO, exist_ok=True)
keys = {k: fn(t) for k, t in want.items() if t}
todo = {f: want[k] for k, f in keys.items() if not os.path.exists(os.path.join(VO, f))}
async def render():
    import edge_tts
    sem = asyncio.Semaphore(6); bad = []
    async def one(f, text):
        async with sem:
            for i in range(3):
                try:
                    tmp = os.path.join(VO, f + '.raw.mp3'); await edge_tts.Communicate(text, VOICE, rate=RATE, pitch=PITCH).save(tmp)
                    trim = 'silenceremove=start_periods=1:start_threshold=-50dB,areverse,silenceremove=start_periods=1:start_threshold=-50dB,areverse'
                    pr = await asyncio.create_subprocess_exec('ffmpeg', '-loglevel', 'error', '-y', '-i', tmp, '-af', trim, '-ac', '1', '-ar', '24000', '-b:a', '40k', os.path.join(VO, f))
                    await pr.wait(); os.remove(tmp)
                    if os.path.getsize(os.path.join(VO, f)) > 500: return
                except Exception as e: err = e
                await asyncio.sleep(2)
            bad.append(f)
            try: os.remove(os.path.join(VO, f))
            except OSError: pass
    await asyncio.gather(*(one(f, t) for f, t in todo.items()))
    return bad
bad = asyncio.run(render()) if todo else []
keys = {k: f for k, f in keys.items() if f not in bad}
live = set(keys.values())
for f in os.listdir(VO):
    if f.endswith('.mp3') and f not in live: os.remove(os.path.join(VO, f))
json.dump({'voice': VOICE, 'rate': RATE, 'n': len(keys), 'keys': dict(sorted(keys.items()))}, open(os.path.join(VO, 'index.json'), 'w'), separators=(',', ':'))
if roast: json.dump(roast, open(os.path.join(VO, 'roast.json'), 'w'), separators=(',', ':'))
size = sum(os.path.getsize(os.path.join(VO, f)) for f in live)
print('voice %s: %d keys, %d rendered, %d failed, %.1f MB' % (VOICE, len(keys), len(todo), len(bad), size / 1e6))
