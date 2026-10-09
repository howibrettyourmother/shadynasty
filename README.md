# SHADYNASTY · Dynasty. Degeneracy. Shoeys.

Live: https://howibrettyourmother.github.io/shadynasty/

A static, zero-upkeep league site for the SHADYNASTY dynasty league. Everything is computed in the browser from the free public
[Sleeper API](https://docs.sleeper.com/) (walking `previous_league_id` back to 2021) plus dynasty superflex values from
[FantasyCalc](https://fantasycalc.com). No backend, no AI at runtime, no manual data entry.

Tabs: Home (live scores, standings, rotating headlines + all-time facts) · Recap (seeded roast recap + weekly awards) · Power
(formula rankings + dynasty team value, KTC link) · Race (Monte Carlo playoff / #1 seed odds, luck, schedule, bench, boom/bust) ·
Teams (roster with values, picks owned, all-time record, trades) · Fleece Factory (value-balanced trade ideas) · Trades (every trade,
points since + current value) · History (champions, final standings, all-time table) · Records (scores, blowouts, streaks, H2H) ·
Hall of Shame · Arcade (Mo Problems + leaderboard, Tank Watch).

Caching: finished seasons are summarized once into localStorage; the slim Sleeper players map is kept for a week; values for a day.
Smoke test: `python3 smoke.py` (serve the folder on :18802 first).
