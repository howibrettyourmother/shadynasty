# SHADYNASTY · Dynasty. Degeneracy. Shoeys.

Live: https://howibrettyourmother.github.io/shadynasty/

A static, zero-upkeep league site for the SHADYNASTY dynasty league. Everything is computed in the browser from the free public
[Sleeper API](https://docs.sleeper.com/) (walking `previous_league_id` back to 2021) plus dynasty superflex values from
[FantasyCalc](https://fantasycalc.com). No backend, no AI at runtime, no manual data entry.

Navigation: five groups (bottom bar on phones, header row on desktop), each with its own pages up top:
- 🏈 **This Week**: Home (hero, stretch-run strip: deadline countdown / Playoff Machine / Shoey Ledger leader, live scores, standings with clinch badges, big stories, group cards) · Recap (roast recap, weekly awards, report cards, season awards, **Shoey Ledger**) · Matchups · Power (formula rankings, dynasty team value, Trainer's Room)
- 🏁 **Race**: Odds (`#race`: playoff / #1 seed odds, **Clinch Watch** with magic/elimination numbers, Tank Race, Toilet Bowl, SOS, all-play) · Machine (`#scenarios`: pick winners of any remaining game, odds re-run; scenarios are shareable links) · Tank (Tank Watch embed) · Draft (Draft Room mock)
- 💎 **Dynasty**: Teams · Analyzer · Fleece (Fleece Factory, topped by the **Deadline Desk**: countdown + buyer/bubble/seller board) · Trades
- 📚 **History**: History · Records · Rivalries · Hall of Shame
- 🎉 **Fun**: Arcade · Memes · League Office

Every old URL still works, including deep links like `#team/3`, `#trades/team=3`, `#rivalry/<uid>-<uid>`, `#scenarios/<picks>`. Section aliases: `#ledger`, `#deadline`, `#clinch`, `#machine`.

League config (`config.js`): one file holds the league root/commissioner ids for the site, the games (`chug/`, `arcade/*`) and the Python tools (`tools/league.py` reads it). It walks Sleeper's yearly renewals (`previous_league_id`) and switches to the new league once the old one is complete or the new one has drafted, so a new season needs no code change. `?league=<id>` overrides for testing.

Odds (`tankodds.js`): one seeded 4,000-run simulation of the rest of the regular season + bracket. It feeds Race odds, Clinch Watch's companion numbers, the Playoff Machine, Tank Race, the Draft Room order, projected-slot pick values (FantasyCalc early/mid/late prices weighted by slot odds) and the separate Tank Watch site, so every page shows the same numbers.

Code layout: classic scripts loaded in order, sharing globals: `config.js` → `tankodds.js` → `roast.js` → `app.js` (core: data layer, router, base pages) → `entrance.js` → `hq2.js` → `office.js` → `memes.js` → `hq3.js` → `hq4.js` (values banner, clinch math, Playoff Machine, Deadline Desk, Shoey Ledger) → `hq5.js` (grouped nav, home cards, aliases, canonical draft order). Later files extend pages by wrapping `R.<page>` / `R.after`. `app.js` (~200 KB) is deliberately not split further: dozens of later wrappers depend on its globals and load order, there's no build step to catch a broken reference, and a split would cost extra requests for no user-visible gain. New features go in a new `hqN.js` instead. Bump the `?v=` on any file you change in `index.html`.

Shoey Chug lives in `chug/` (served at /shadynasty/chug/): a static canvas+DOM mash game. Leaderboard: Cloudflare Worker `shoey-chug-scores` (own KV namespace, separate from Mo Problems), source and admin script in the shoey-chug-worker folder outside this repo.

Live: Home shows a league-wide live scoreboard on game days (win odds, who's left per matchup, Monday-night math, dead bodies in lineups) using the ESPN public scoreboard + Sleeper projections; Recap has weekly report cards for every team. Header ↻ (and pull-to-refresh in the installed app) force-refreshes everything.

Data: `data/players.json` is a slim copy of Sleeper's ~15 MB players file plus this week's projections, rebuilt by `.github/workflows/players.yml` (`tools/slim_players.py`). The cron asks for every 30 min on game days and hourly otherwise, but GitHub throttles scheduled runs, so in practice it refreshes **every 4-8 hours**. Live scores, rosters and standings never wait on it: they come straight from Sleeper/ESPN in the browser. The job skips its commit when nothing but the timestamp changed. The site falls back to Sleeper direct if it's missing or stale. Injury precedence: Sleeper's players file is authoritative; ESPN game-day inactives can only add an Out, never clear one.

Round 2 (`hq2.js`/`hq2.css`): Race tab Tank Race (4,000-run Monte Carlo of the rest of the regular season + the 6-team bracket → odds at every rookie pick slot under the max-PF draft order, incl. 1.01 odds by current pick owner); Recap tab Season Awards (season-to-date blowout, unluckiest loss, luckiest win, bench, best/worst week, PA magnet, lineup guru, rollercoaster; tap a card for the team burst); Rivalries (`#rivalry`, `#rivalry/<userId>-<userId>`: every current manager pair across the previous_league_id chain, series/points/streak/biggest wins/every meeting; linked from the H2H grid and History).

Caching: every Sleeper call goes through one cache with in-flight dedupe and per-endpoint TTLs (game days Sun/Mon/Thu ET: state/live matchups 60 s, rosters 2 min; other days 5-10 min; finished weeks of this season 12 h in localStorage; ?_= busts and ↻ clears everything). The Home "worst drop" hook is cached 12 h and computed after first paint. Finished seasons are summarized once into localStorage; the slim Sleeper players map is kept for a week; values for a day.
Smoke test: `python3 tools/smoke.py [BASE] [--shots DIR]` loads every page and alias at phone (390x844) and desktop (1366x900) sizes and fails on console errors, HTTP errors, horizontal overflow, `undefined`/`NaN` text or a wrong nav group. It then runs stale-data checks: players file age, rookie board year vs the next draft, league season, ESPN bye map. BASE defaults to the live site; for a local copy run `python3 -m http.server 18802` and pass `http://127.0.0.1:18802/index.html`. `python3 tools/smoke.py --stale-only` (no browser) runs daily in `.github/workflows/stale-check.yml` and fails if the players file is 7+ days old. `python3 smoke.py` still works and runs the same script.

Each season: refresh the rookie board (`BOARD27`, `BOARD_YEAR`, `BOARD_ASOF` in `app.js`). The smoke test warns when it's out of date, and the Draft Room hides the stale board instead of showing last year's names.

- Wilson Weasels (the villain) gets `entrance.js`: a ~3.6s villain entrance (blackout, lightning, red smoke/embers, weasel rising with glowing lenses, title card). Tap to skip; reduced-motion = static card; thunder only if sound is on and after a gesture.
