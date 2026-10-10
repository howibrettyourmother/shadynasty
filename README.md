# SHADYNASTY · Dynasty. Degeneracy. Shoeys.

Live: https://howibrettyourmother.github.io/shadynasty/

A static, zero-upkeep league site for the SHADYNASTY dynasty league. Everything is computed in the browser from the free public
[Sleeper API](https://docs.sleeper.com/) (walking `previous_league_id` back to 2021) plus dynasty superflex values from
[FantasyCalc](https://fantasycalc.com). No backend, no AI at runtime, no manual data entry.

Tabs: Home (hero + rotating roast headline, live hooks: leader, blowout, worst score, Tank Watch leader, playoff bubble, worst drop ever; image card grid; standings; live scores) · Recap (seeded roast recap + weekly awards) · Power
(formula rankings + dynasty team value, KTC link) · Race (Monte Carlo playoff / #1 seed odds, luck, schedule, bench, boom/bust) ·
Teams (roster with values, picks owned, all-time record, trades) · Fleece Factory (value-balanced trade ideas) · Trades (every trade,
points since + current value) · History (champions, final standings, all-time table) · Records (scores, blowouts, streaks, H2H) ·
Hall of Shame · Arcade (Shoey Chug + Mo Problems, both with leaderboards; Tank Watch).

Shoey Chug lives in `chug/` (served at /shadynasty/chug/): a static canvas+DOM mash game. Leaderboard: Cloudflare Worker `shoey-chug-scores` (own KV namespace, separate from Mo Problems), source and admin script in the shoey-chug-worker folder outside this repo.

Caching: finished seasons are summarized once into localStorage; the slim Sleeper players map is kept for a week; values for a day.
Smoke test: `python3 smoke.py` (serve the folder on :18802 first).
