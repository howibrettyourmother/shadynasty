#!/usr/bin/env python3
"""SHADYNASTY HQ smoke test: every page at phone + desktop sizes, plus stale-data checks.

Usage:
  python3 tools/smoke.py [BASE] [--shots DIR] [--phone-only]
  python3 tools/smoke.py --stale-only      (no browser needed; what .github/workflows/stale-check.yml runs daily)
  BASE defaults to the live site. For a local copy: python3 -m http.server 18802 (repo root), then
  python3 tools/smoke.py http://127.0.0.1:18802/index.html
Needs: pip install playwright (uses /usr/bin/google-chrome if present, else playwright's chromium).
Exit code 1 if any page FAILs. Stale-data problems are WARN (they mean "update something", not "site broken"),
except a slim players file older than 7 days, which is a FAIL (the site then falls back to Sleeper's 15 MB file).
"""
import asyncio, json, os, re, sys, time, urllib.request

args = [a for a in sys.argv[1:] if not a.startswith('--')]
BASE = args[0] if args else 'https://howibrettyourmother.github.io/shadynasty/index.html'
SHOTS = sys.argv[sys.argv.index('--shots') + 1] if '--shots' in sys.argv else ''
if SHOTS in args: args.remove(SHOTS)
ROOT = BASE.rsplit('/', 1)[0] + '/'
LOCAL = '127.0.0.1' in BASE or 'localhost' in BASE
ROUTES = ['home', 'recap', 'matchups', 'power', 'race', 'scenarios', 'tank', 'draft', 'teams', 'team/1', 'analyzer', 'fleece',
          'trades', 'history', 'records', 'rivalry', 'shame', 'arcade', 'memes', 'office',
          # aliases and deep links that must keep working
          'ledger', 'deadline', 'clinch', 'machine', 'trades/team=1', 'bogus']
GROUP = {'home': 'week', 'recap': 'week', 'matchups': 'week', 'power': 'week', 'race': 'race', 'scenarios': 'race', 'tank': 'race',
         'draft': 'race', 'teams': 'dyn', 'team': 'dyn', 'analyzer': 'dyn', 'fleece': 'dyn', 'trades': 'dyn', 'history': 'hist',
         'records': 'hist', 'rivalry': 'hist', 'shame': 'hist', 'arcade': 'fun', 'memes': 'fun', 'office': 'fun'}
# ESPN 403s "HeadlessChrome"; use real browser UAs
UA = {'phone': 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
      'desktop': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36'}
BAD = ['undefined', 'NaN', '{T}', '{W}', '{P}', '[object', 'Infinity']
fails, warns = [], []

def get(url):
    r = urllib.request.Request(url, headers={'User-Agent': UA['desktop']})
    with urllib.request.urlopen(r, timeout=30) as f: return json.load(f)

def stale_checks(page_info):
    # 1) slim players file freshness
    try:
        d = get(ROOT + 'data/players.json?_=%d' % time.time())
        age = (time.time() * 1000 - d['at']) / 36e5
        st = get('https://api.sleeper.app/v1/state/nfl')
        msg = 'data/players.json is %.1f h old (week %s, Sleeper says week %s)' % (age, d.get('week'), st.get('week'))
        if age > 168: fails.append('STALE ' + msg + ': the players workflow has not committed in 7+ days')
        elif age > 48: warns.append(msg + ': check .github/workflows/players.yml runs')
        elif st.get('season_type') == 'regular' and d.get('week') and st.get('week') and int(d['week']) < int(st['week']): warns.append(msg + ': projections are a week behind')
        else: print('ok   ' + msg)
    except Exception as e: warns.append('could not read data/players.json: %s' % e)
    # 2) rookie board year vs the league's next draft
    lg_season = page_info.get('season')
    try:
        app = urllib.request.urlopen(urllib.request.Request(ROOT + 'app.js?_=%d' % time.time(), headers={'User-Agent': UA['desktop']}), timeout=30).read().decode()
        by = re.search(r'BOARD_YEAR=(\d{4})', app); asof = re.search(r"BOARD_ASOF='([^']*)'", app)
        if by and lg_season and int(by.group(1)) != int(lg_season) + 1:
            warns.append('rookie board is the %s class but the next draft is %d: update BOARD27/BOARD_YEAR/BOARD_ASOF in app.js' % (by.group(1), int(lg_season) + 1))
        else: print('ok   rookie board %s, as of %s' % (by and by.group(1), asof and asof.group(1)))
    except Exception as e: warns.append('could not read app.js: %s' % e)
    # 3) league config follows the newest season
    try:
        st = get('https://api.sleeper.app/v1/state/nfl')
        if lg_season and int(lg_season) < int(st['league_season']):
            warns.append('site is on the %s league but Sleeper is in %s: fine until the new league drafts; config.js auto-switches then' % (lg_season, st['league_season']))
        else: print('ok   league %s (%s, %s)' % (page_info.get('league'), lg_season, page_info.get('status')))
    except Exception as e: warns.append('could not check league season: %s' % e)
    # 4) bye map came from ESPN (browser runs only), not the hard-coded fallback
    if page_info.get('byes', 0) is None: pass
    elif page_info.get('byes', 0) >= 28: print('ok   bye map from ESPN (%d teams)' % page_info['byes'])
    else: warns.append('bye map not loaded from ESPN (%s teams); the Trainer\'s Room is using BYE_FALLBACK' % page_info.get('byes'))

async def run_size(b, name, vp):
    mobile = name == 'phone'
    ctx = await b.new_context(viewport=vp, device_scale_factor=2 if mobile else 1, is_mobile=mobile, has_touch=mobile, user_agent=UA[name])
    p = await ctx.new_page(); errs = []
    p.on('pageerror', lambda e: errs.append('PAGEERROR ' + str(e)[:200]))
    p.on('console', lambda m: m.type == 'error' and errs.append(m.text[:200]))
    p.on('response', lambda r: r.status >= 400 and 'favicon' not in r.url and errs.append('%d %s' % (r.status, r.url[:150])))
    info = {}
    await p.goto(BASE + '#home')
    for r in ROUTES:
        errs.clear(); t0 = time.time()
        await p.evaluate("h=>location.hash='#'+h", r)
        good = True
        try:
            await p.wait_for_function("!document.querySelector('#view .spin')&&document.querySelector('#view .panel')", timeout=90000)
            await p.wait_for_timeout(1200)
        except Exception: good = False
        txt = await p.inner_text('#view'); xo = await p.evaluate('document.documentElement.scrollWidth-innerWidth')
        nav = await p.evaluate("(()=>{const g=document.querySelector('#grp a.on'),t=document.querySelector('#tabs a.on');return [g&&g.dataset.g,t&&t.dataset.k,location.hash]})()")
        bad = [w for w in BAD if re.search(r'(^|[^A-Za-z])' + re.escape(w) + r'([^A-Za-z]|$)', txt)]
        if 'fumbled' in txt: bad.append('error panel')
        key = r.split('/')[0]; want = GROUP.get(key)
        if want and nav[0] != want: bad.append('nav group %s (want %s)' % (nav[0], want))
        e = [x for x in errs if not (LOCAL and ('workers.dev' in x or 'CORS' in x or 'ERR_FAILED' in x))]
        ok = good and xo <= 1 and not bad and not e
        print('%s %-7s #%-15s %5.1fs %6d chars %s%s' % ('PASS' if ok else 'FAIL', name, r, time.time() - t0, len(txt), nav[2], '' if ok else ' :: ' + '; '.join(bad + e + ([] if good else ['never finished loading']) + (['overflow %dpx' % xo] if xo > 1 else []))[:400]))
        if not ok: fails.append('%s #%s' % (name, r))
        if SHOTS:
            os.makedirs(SHOTS, exist_ok=True); await p.screenshot(path=os.path.join(SHOTS, '%s-%s.png' % (name, r.replace('/', '-'))))
        if r == 'power' and mobile:
            info = await p.evaluate("""(async()=>{const C=window.SN_CFG;if(C&&C.ready)await C.ready;const lg=await (await fetch(C.API+'league/'+C.LEAGUE)).json();
              let byes=0;try{await byeMap(lg.season);byes=(JSON.parse(localStorage.getItem('sn:bye:'+lg.season)||'{}').n)||0}catch(e){}
              return {league:C.LEAGUE,season:lg.season,status:lg.status,byes}})()""")
    await ctx.close(); return info

async def main():
    from playwright.async_api import async_playwright
    async with async_playwright() as pw:
        exe = '/usr/bin/google-chrome' if os.path.exists('/usr/bin/google-chrome') else None
        b = await pw.chromium.launch(executable_path=exe) if exe else await pw.chromium.launch()
        info = await run_size(b, 'phone', {'width': 390, 'height': 844})
        if '--phone-only' not in sys.argv: await run_size(b, 'desktop', {'width': 1366, 'height': 900})
        await b.close()
    print('--- stale-data checks'); stale_checks(info or {})
    for w in warns: print('WARN ' + w)
    print('ALL PASS' if not fails else 'FAILED: ' + ', '.join(fails))
    sys.exit(1 if fails else 0)

def stale_only():
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    from league import resolve
    lid = resolve(); lg = get('https://api.sleeper.app/v1/league/' + lid)
    print('--- stale-data checks (no browser)'); stale_checks({'league': lid, 'season': lg.get('season'), 'status': lg.get('status'), 'byes': None})
    for w in warns: print('WARN ' + w)
    print('ALL PASS' if not fails else 'FAILED: ' + ', '.join(fails))
    sys.exit(1 if fails else 0)

if '--stale-only' in sys.argv: stale_only()
else: asyncio.run(main())
