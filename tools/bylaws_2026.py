# Applies the Oct 2026 Sleeper-alignment + cleanup edits to the 2021 bylaws (office/bylaws.json built by build_office.py). Writes office/bylaws.json + office/changelog.json.
import json,subprocess
subprocess.run(['python3','tools/build_office.py'],check=True,capture_output=True)
B=json.load(open('office/bylaws.json'));S={s['id']:s for s in B['sections']};LOG=[]
def rep(sec,old,new,why,kind='Sleeper alignment'):
  hit=0
  for b in S[sec]['b']:
    if 'x' in b and old in b['x']: b['x']=b['x'].replace(old,new);hit+=1
    for r in b.get('rows',[]):
      for i,c in enumerate(r):
        if old in c: r[i]=c.replace(old,new);hit+=1
  assert hit,(sec,old);LOG.append({'sec':S[sec]['title'],'kind':kind,'from':old,'to':new,'why':why})
def add(sec,after,blocks,why,kind='Sleeper alignment'):
  bl=S[sec]['b'];i=next(k for k,b in enumerate(bl) if after in b.get('x',''))+1 if after else len(bl)
  bl[i:i]=blocks;LOG.append({'sec':S[sec]['title'],'kind':kind,'from':'','to':' / '.join(b.get('x','(table)') for b in blocks),'why':why})
P=lambda x:{'t':'p','d':0,'x':x};LI=lambda x,d=1:{'t':'li','d':d,'x':x}
T='Typo / formatting'
# Summary
rep('league-summary','23 roster spots with and 2 injury reserve spots during in-season','23 roster spots and 2 injury reserve spots during the season','Removed stray "with".',T)
rep('league-summary','6 team playoff during weeks 14-16; top seeds','6 team playoff during Weeks 15-17; top seeds','Sleeper playoffs start Week 15 (3 rounds).')
rep('league-summary','6 team playoff during weeks 14-16, seeds','6 team playoff during Weeks 15-17, seeds','Toilet Bowl runs alongside the playoffs, Weeks 15-17.')
rep('league-summary','Biannual FAAB budget of $100 is given on league start. Resets','FAAB budget of $100, processed weekly on Tuesday nights with a 2-day clear period. Resets','Sleeper: FAAB $100, weekly waivers (Tuesday night), 2-day clear; "Biannual" was misleading (it resets twice a year).')
rep('league-summary','Annual Fee: $100','Annual Fee: $100 (less any applicable LeagueSafe fees)','Duplicate line merged into a clarification.',T)
# Calendar table rebuilt
cal=S['general-league-calendar']['b'][0];old=[r[:] for r in cal['rows']]
cal['rows']=[['Date','Event'],['August 29th, 2021 @ 7:30 PM EDT','Inaugural League Startup Draft (historical)'],
 ['[NFL Preseason]','Waivers process weekly on Tuesday nights (FAAB, 2-day clear period)'],
 ['[Kickoff of Final Preseason Week]','Cutdown Deadline to 23 roster spots + IR'],
 ['[NFL Week 1]','Regular season begins (Weeks 1-14); FAAB resets to $100; weekly Tuesday-night waivers continue'],
 ['[NFL Week 4]','Taxi squad deadline'],
 ['[NFL Week 14]','Final regular season week; Trading closes at the end of Week 14'],
 ['[NFL Week 15]','First Round of Playoffs & Toilet Bowl'],
 ['[NFL Week 16]','Second Round of Playoffs & Toilet Bowl'],
 ['[NFL Week 17]','Championship & Toilet Bowl Championship'],
 ['[Tuesday after NFL Week 17]','Trading Reopens'],
 ['[NFL Playoffs]','Waivers continue to process weekly on Tuesday nights'],
 ['[After the Super Bowl]','Waivers enter offseason cycle [last day of the month, 9 a.m. CT]'],
 ['January 31 each year','LeagueSafe Payouts [or earlier]'],
 ['February 15 each year','League Reset: Roster Limits increased to 25; FAAB resets to $100'],
 ['[2 weeks post NFL Draft]','Rookie/FA draft (4 rounds) begins, Taxi Squad unlocks'],
 ['[2 weeks post Rookie Draft]','Cutdown Deadline to 23 roster spots']]
LOG.append({'sec':'General League Calendar','kind':'Sleeper alignment + formatting','from':'Old timeline: daily in-season waivers; Wed 12:05 AM PST / Wed 9 a.m. CT waivers; trading closed after Week 10; playoffs Weeks 14-16; one-off 2022 dates; mismatched brackets "[NFL Preseason}" "[Super Bowl}", "9.m.", "ToiletBowl"','to':'Weekly Tuesday-night FAAB waivers (2-day clear); taxi deadline Week 4; trading closes after Week 14; playoffs/Toilet Bowl Weeks 15-17; recurring annual dates; brackets and typos fixed','why':'Matches Sleeper: playoff_week_start 15, trade_deadline 14, daily_waivers off, waiver_clear_days 2, taxi_deadline 4, draft_rounds 4.'})
# Scoring typos + DST
rep('scoring','Interceptions: -1 points each','Interceptions thrown: -1 point each','Grammar; clarifies it is a QB interception.',T)
rep('scoring','Fumbles lost: -2 point each','Fumbles lost: -2 points each','Grammar.',T)
add('scoring',None,[P('Team defense (DST) scoring (from Sleeper):'),*[LI(x,2) for x in ['Sack: 1 point; Interception: 2 points; Fumble recovery: 2 points; Forced fumble: 1 point','Defensive, special teams or fumble-return TD: 6 points; Safety: 2 points; Blocked kick: 2 points','Points allowed: 0 = 10; 1-6 = 7; 7-13 = 4; 14-20 = 1; 21-27 = 0; 28-34 = -1; 35+ = -4']]],'Bylaws listed a DST starter but no DST scoring; documented exactly as configured in Sleeper (no rule change).')
# Rosters / IR / Taxi
rep('rosters',"The NFL’s Official Injury Status must be either IR, Suspended, Out, Covid-19, or DNR (Holdout). IR must be in-season.","The NFL’s Official Injury Status must be IR, Out, Suspended, COVID-19, or DNR (Holdout). Doubtful and NA players are not IR-eligible. IR must be in-season.",'Sleeper reserve settings: Out/Suspended/DNR/COVID allowed; Doubtful and NA not allowed.')
add('rosters','IR locked during offseason',[P('Taxi Squad'),LI('Each team has 4 taxi squad slots.'),LI('2026 season: taxi squad is limited to first-year rookies.'),LI('Starting with the 2027 season (league-approved): players in their first or second NFL season are taxi-eligible.'),LI('Taxi squad deadline: Week 4. Taxi squad unlocks with the rookie/FA draft.')],'Bylaws had no taxi rules; Sleeper: 4 slots, rookies only (taxi_years 1, vets not allowed), deadline Week 4. 2027 two-year eligibility was approved by the league (Sleeper to be changed to 2 years for 2027).')
rep('lineups','Lineups','Lineups','') if False else None
# Regular season / playoffs
rr='regular-season-playoffs-and-toilet-bowl'
rep(rr,'The season consists of 13 Regular Season Weeks (Weeks 1-13) and 3 Playoff Weeks (Weeks 14-16)','The season consists of 14 Regular Season Weeks (Weeks 1-14) and 3 Playoff Weeks (Weeks 15-17)','Sleeper playoff_week_start = 15; also fixes the contradiction with the 14-week League Summary.')
rep(rr,'The playoffs will occur over 3 weeks (weeks 14, 15, and 16), concluding in Week 16 of the NFL regular season.','The playoffs will occur over 3 weeks (Weeks 15, 16, and 17), concluding in Week 17 of the NFL regular season.','Sleeper playoff weeks 15-17.')
rep(rr,'Week 14/Round 1:','Week 15/Round 1:','Round 1 is Week 15.');rep(rr,'Week 15/Round 2:','Week 16/Round 2:','Round 2 is Week 16.');rep(rr,'Week 16/Round 3:','Week 17/Round 3:','Championship is Week 17.')
rep(rr,'seeds determined in the same manner as detailed in 7.3.1.','seeds determined in the same manner as the playoff seeding above.','Dangling section reference "7.3.1" (document has no numbered sections).',T)
# Trading
rep('trading','Trading will be locked from Week 10 completion until the end of playoffs.','Trading will be locked from Week 14 completion until the end of playoffs.','Sleeper trade_deadline = 14.')
# Waivers
f='free-agent-acquisition-waivers'
rep(f,'Each owner starts the season with $100 FAAB to spend on Free Agents.','Each owner starts the season with $100 FAAB to spend on Free Agents. Waivers process weekly on Tuesday nights, and dropped players stay on waivers for 2 days before clearing.','Sleeper: FAAB $100, weekly waiver day (Tuesday night), waiver_clear_days 2, daily waivers off.')
rep(f,'Free Agency Auction Budget (FAAB)','Free Agent Acquisition Budget (FAAB)','Name made consistent with the League Summary.',T)
# Rookie draft
rep('annual-rookie-fa-draft','The draft will be conducted via Sleeper','The draft will be conducted via Sleeper and is 4 rounds.','Sleeper draft_rounds = 4 (not previously stated).')
# Typos elsewhere
rep('teams-ownership-and-replacement','Leaving owners who are encouraged','Leaving owners are encouraged','Grammar.',T)
rep('refunds','banned for banning appropriate behavior','banned for violating the conduct rules','Garbled phrase.',T)
rep('startup-draft','(or pause for to be determined circumstances)','(or pause for circumstances to be determined)','Grammar.',T)
rep('rule-changes','Changes will be cataloged and dated in section 27. Changelog.','Changes will be cataloged and dated in the Changelog section below.','The referenced "section 27" did not exist; Changelog section added.',T)
W='League-approved single tiebreaker order (Oct 2026): record, points for, head-to-head, coin flip; points against dropped.'
rep('tie-breakers','Unless otherwise specified, rankings and tie breakers are handled according to this order:','All standings, playoff seeding and Toilet Bowl seeding ties are broken in this order:',W,'League-approved rule change')
rep('tie-breakers','Winning percentage','1) Record (winning percentage)',W,'League-approved rule change')
rep('tie-breakers','Total points scored','2) Total points for',W,'League-approved rule change')
rep('tie-breakers','Head-to-head matchup results','3) Head-to-head record',W,'League-approved rule change')
rep('tie-breakers','Coin flip','4) Coin flip',W,'League-approved rule change')
rep(rr,'Overall Record > Total Points For > Total Points against > Head to Head Record.','Record (winning percentage) > Total Points For > Head-to-Head Record > Coin Flip (see Tie Breakers).',W,'League-approved rule change')
rep(rr,'Ties will be broken by who has the most total points scored in a regular season. If there is still a tie then it will be broken by who has the most total points scored against them. If there is still a tie then it will be broken by the head to head record of teams.','Ties will be broken by most total regular season points for, then head-to-head record, then a coin flip. Points against is not used.',W,'League-approved rule change')
B['updated']='2026-10';B['updated_label']='Last updated October 2026 (aligned to Sleeper settings)'
B['sections'].append({'id':'changelog','title':'Changelog','b':[P('October 2026: bylaws aligned to the live Sleeper settings (all differences previously approved by the league) and typos/formatting fixed. Changes:')]+[LI(f"{c['sec']}: {c['why'] or c['to']}") for c in LOG]})
json.dump(B,open('office/bylaws.json','w'),ensure_ascii=False,indent=0);json.dump(LOG,open('office/changelog.json','w'),ensure_ascii=False,indent=1)
print(len(LOG),'changes')
