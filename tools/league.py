#!/usr/bin/env python3
"""Shared league-id resolver for the Python tools. Same rule as config.js (which stays the single source of truth for
ROOT / COMMISH: they are read from it). Walks ROOT forward through Sleeper's yearly renewals (previous_league_id) and
returns the league the site should use right now. Env SN_LEAGUE overrides."""
import json, os, re, urllib.request
HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
API = 'https://api.sleeper.app/v1/'
def _cfg(key):
    with open(os.path.join(HERE, 'config.js')) as f:
        m = re.search(key + r":'(\d+)'", f.read())
    return m.group(1)
ROOT, COMMISH = _cfg('ROOT'), _cfg('COMMISH')
def _get(p):
    req = urllib.request.Request(API + p, headers={'User-Agent': 'shadynasty-tools/1.0'})
    with urllib.request.urlopen(req, timeout=60) as r: return json.load(r)
def resolve():
    if os.environ.get('SN_LEAGUE'): return os.environ['SN_LEAGUE']
    try:
        st = _get('state/nfl'); lid = ROOT; lg = _get('league/' + lid)
        top = max(int(st.get('season') or 0), int(st.get('league_season') or 0), int(st.get('league_create_season') or 0)) + 1
        for y in range(int(lg['season']) + 1, top + 1):
            try: ls = _get('user/%s/leagues/nfl/%d' % (COMMISH, y)) or []
            except Exception: ls = []
            nx = next((l for l in ls if str(l.get('previous_league_id')) == str(lid)), None)
            if not nx: break
            if lg.get('status') != 'complete' and nx.get('status') == 'pre_draft': break
            lid, lg = nx['league_id'], nx
        return lid
    except Exception:
        return ROOT
if __name__ == '__main__': print(resolve())
