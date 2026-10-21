# SHADYNASTY · Dynasty. Degeneracy. Shoeys.

Live: https://howibrettyourmother.github.io/shadynasty/

A static, zero-upkeep league site for the SHADYNASTY dynasty league. Everything is computed in the browser from the free public
[Sleeper API](https://docs.sleeper.com/) (walking `previous_league_id` back to 2021) plus dynasty superflex values from
[FantasyCalc](https://fantasycalc.com). No backend, no AI at runtime, no manual data entry.

Tabs: Home (hero + rotating roast headline, live hooks: leader, blowout, worst score, Tank Watch leader, playoff bubble, worst drop ever; image card grid; standings; live scores) · Recap (seeded roast recap + weekly awards) · Power
(formula rankings + dynasty team value, KTC link) · Race (Monte Carlo playoff / #1 seed odds, luck, schedule, bench, boom/bust) ·
Teams (roster with values, picks owned, all-time record, trades) · Fleece Factory (value-balanced trade ideas) · Trades (every trade,
points since + current value) · History (champions, final standings, all-time table) · Records (scores, blowouts, streaks, H2H) ·
Hall of Shame · Arcade (Shoey Chug + Mo Problems, both with leaderboards; Shady Bowl retro football in `arcade/shady-bowl/`, local saves only; Tank Watch).

Shoey Chug lives in `chug/` (served at /shadynasty/chug/): a static canvas+DOM mash game. Leaderboard: Cloudflare Worker `shoey-chug-scores` (own KV namespace, separate from Mo Problems), source and admin script in the shoey-chug-worker folder outside this repo.

Live: Home shows a league-wide live scoreboard on game days (win odds, who's left per matchup, Monday-night math, dead bodies in lineups) using the ESPN public scoreboard + Sleeper projections; Recap has weekly report cards for every team. Header ↻ (and pull-to-refresh in the installed app) force-refreshes everything.

Data: `data/players.json` is a slim copy of Sleeper's ~15 MB players file plus this week's projections, rebuilt every 30-60 min by `.github/workflows/players.yml` (`tools/slim_players.py`). The site falls back to Sleeper direct if it's missing or stale. Injury precedence: Sleeper's players file is authoritative; ESPN game-day inactives can only add an Out, never clear one.

Round 2 (`hq2.js`/`hq2.css`): Race tab Tank Race (4,000-run Monte Carlo of the rest of the regular season + the 6-team bracket → odds at every rookie pick slot under the max-PF draft order, incl. 1.01 odds by current pick owner); Recap tab Season Awards (season-to-date blowout, unluckiest loss, luckiest win, bench, best/worst week, PA magnet, lineup guru, rollercoaster; tap a card for the team burst); Rivalries (`#rivalry`, `#rivalry/<userId>-<userId>`: every current manager pair across the previous_league_id chain, series/points/streak/biggest wins/every meeting; linked from the H2H grid and History).

Caching: every Sleeper call goes through one cache with in-flight dedupe and per-endpoint TTLs (game days Sun/Mon/Thu ET: state/live matchups 60 s, rosters 2 min; other days 5-10 min; finished weeks of this season 12 h in localStorage; ?_= busts and ↻ clears everything). The Home "worst drop" hook is cached 12 h and computed after first paint. Finished seasons are summarized once into localStorage; the slim Sleeper players map is kept for a week; values for a day.
Smoke test: `python3 smoke.py` (serve the folder on :18802 first).

- Wilson Weasels (the heel) gets `heel.js`: a ~3.6s villain entrance (blackout, lightning, red smoke/embers, weasel rising with glowing lenses, title card). Tap to skip; reduced-motion = static card; thunder only if sound is on and after a gesture.
