'use strict';
// SHADYNASTY (Dynasty. Degeneracy. Shoeys.): everything is computed in the browser from the free public Sleeper API (+ FantasyCalc dynasty SF values).
const API='https://api.sleeper.app/v1/',LEAGUE='1312055708249767936',BRETT='603082868373135360';
const KTC='https://keeptradecut.com/dynasty/power-rankings/league-overview?leagueId='+LEAGUE+'&platform=Sleeper';
const GAME='https://howibrettyourmother.github.io/mo-morehouse-mo-problems/',TANK='https://howibrettyourmother.github.io/tank-for-jeremiah-smith/';
const ELIG={QB:['QB'],RB:['RB'],WR:['WR'],TE:['TE'],K:['K'],DEF:['DEF'],FLEX:['RB','WR','TE'],WRRB_FLEX:['RB','WR'],REC_FLEX:['WR','TE'],SUPER_FLEX:['QB','RB','WR','TE'],IDP_FLEX:['DL','LB','DB'],DL:['DL'],LB:['LB'],DB:['DB']};
const $=s=>document.querySelector(s);
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=n=>(+n||0).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
const int=n=>Math.round(+n||0).toLocaleString('en-US');
const num=(a,b)=>(+a||0)+(+b||0)/100;
const clean=s=>String(s||'').replace(/\u{1F3C6}/gu,'').trim();
const j=u=>fetch(API+u).then(r=>{if(!r.ok)throw new Error(u+' '+r.status);return r.json()});
const SS=(()=>{try{sessionStorage.setItem('_t','1');sessionStorage.removeItem('_t');return sessionStorage}catch(e){return null}})();
async function jc(u){const k='sn:'+u;if(SS){const v=SS.getItem(k);if(v)try{return JSON.parse(v)}catch(e){}}const d=await j(u);if(SS)try{SS.setItem(k,JSON.stringify(d))}catch(e){}return d}
const LS={get(k){try{return JSON.parse(localStorage.getItem(k)||'null')}catch(e){return null}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v));return true}catch(e){return false}}};
async function pool(fns,n){const out=new Array(fns.length);let i=0;await Promise.all(Array.from({length:Math.min(n||8,fns.length)},async()=>{while(i<fns.length){const k=i++;out[k]=await fns[k]()}}));return out}
// ---- players: one big download per week at most; only a slim id -> {n,p,t} subset is kept in localStorage ----
async function playersFor(ids){
  const k='sn:players';let c=LS.get(k);if(!c||Date.now()-c.at>7*864e5)c={at:Date.now(),p:{}};const have=c.p;
  if(!ids.every(i=>have[i])){
    if(!playersFor.slim)playersFor.slim=fetch(API+'players/nfl').then(r=>{if(!r.ok)throw new Error('players '+r.status);return r.json()}).then(all=>{const m={};
      for(const i in all){const p=all[i];m[i]={n:p.position==='DEF'?((p.first_name||'')+' '+(p.last_name||'')).trim()+' D/ST':(p.full_name||((p.first_name||'')+' '+(p.last_name||'')).trim()),p:(p.fantasy_positions&&p.fantasy_positions.length?p.fantasy_positions:[p.position]).filter(Boolean),t:p.team||'FA'}}return m}).catch(e=>{playersFor.slim=null;throw e});
    const m=await playersFor.slim;ids.forEach(i=>{if(!have[i])have[i]=m[i]||{n:'Player '+i,p:[],t:''}});
    if(!LS.set(k,c)){c.p={};ids.forEach(i=>c.p[i]=have[i]);LS.set(k,c)}}
  return have}
let PL={};const pn=id=>esc((PL[id]||{}).n||'Player '+id);
function optimal(slots,players,pp,P){const left=new Set(players),order=slots.map((s,i)=>({s,i,e:ELIG[s]||[s]})).sort((a,b)=>a.e.length-b.e.length);let tot=0;
  for(const o of order){let best=null,bp=-1;for(const id of left){const p=P[id];if(p&&p.p.some(x=>o.e.includes(x))&&(pp[id]||0)>bp){bp=pp[id]||0;best=id}}if(best){left.delete(best);tot+=bp}}return tot}
// ---- FantasyCalc dynasty superflex values (CORS-open, free). Cached 24h. ----
async function values(){const k='sn:fc3';const c=LS.get(k);if(c&&Date.now()-c.at<864e5)return c;
  try{const d=await fetch('https://api.fantasycalc.com/values/current?isDynasty=true&numQbs=2&numTeams=12&ppr=1').then(r=>{if(!r.ok)throw 0;return r.json()});
    const v={at:Date.now(),p:{},pk:{},a:{}};for(const x of d){const pl=x.player||{};if(pl.position==='PICK'){v.pk[pl.name]=x.value}else if(pl.sleeperId){v.p[pl.sleeperId]=x.value;if(pl.maybeAge)v.a[pl.sleeperId]=Math.round(pl.maybeAge*10)/10}}
    LS.set(k,v);return v}catch(e){return c||{at:0,p:{},pk:{},a:{}}}}
const ORD=['','1st','2nd','3rd','4th','5th'];
function pickVal(V,season,round){return V.pk[season+' '+ORD[round]]||V.pk[season+' '+ORD[round]+' (Mid)']||(V.pk[(+season-1)+' '+ORD[round]]||0)*0.9||0}
// ---------------- data model ----------------
const D={};
async function chain(){if(D.chain)return D.chain;const cache=LS.get('sn:chain')||{},out=[];let id=LEAGUE;
  while(id&&id!=='0'){let lg=cache[id];if(!lg||lg.status!=='complete'){lg=await j('league/'+id);if(lg.status==='complete')cache[id]=lg}out.push(lg);id=lg.previous_league_id}
  LS.set('sn:chain',cache);return D.chain=out}
function teamsOf(users,rosters){const U=Object.fromEntries(users.map(u=>[u.user_id,u])),T={};
  for(const r of rosters){const u=U[r.owner_id]||{},s=r.settings||{},un=u.username||u.display_name||'';
    T[r.roster_id]={rid:r.roster_id,uid:r.owner_id||'r'+r.roster_id,owner:u.display_name||'Orphan',team:clean(u.metadata&&u.metadata.team_name)||u.display_name||('Team '+r.roster_id),
      av:u.avatar?'https://sleepercdn.com/avatars/thumbs/'+u.avatar:'',w:s.wins||0,l:s.losses||0,t:s.ties||0,pf:num(s.fpts,s.fpts_decimal),pa:num(s.fpts_against,s.fpts_against_decimal),max:num(s.ppts,s.ppts_decimal),
      joe:/^joebags85$/i.test(un),wz:r.owner_id===BRETT,players:r.players||[],starters:r.starters||[],streak:(r.metadata&&r.metadata.streak)||''}}
  return T}
// compact season summary; completed seasons are cached forever in localStorage
async function season(lg){const done=lg.status==='complete',id=lg.league_id,key='sn:s5:'+id;if(done){const c=LS.get(key);if(c)return c}
  const st=lg.settings||{},last=+st.last_scored_leg||0,pws=+st.playoff_week_start||15,leg=done?18:Math.max(1,+(D.state&&D.state.leg)||last+1);
  const g=done?jc:j;
  const [users,rosters,wb,drafts]=await Promise.all([g('league/'+id+'/users'),g('league/'+id+'/rosters'),g('league/'+id+'/winners_bracket').catch(()=>[]),jc('league/'+id+'/drafts').catch(()=>[])]);
  const M=await pool(Array.from({length:last},(_,k)=>()=>jc('league/'+id+'/matchups/'+(k+1)).catch(()=>[])),8);
  const TX=await pool(Array.from({length:leg},(_,k)=>()=>(done||k+1<leg?jc:j)('league/'+id+'/transactions/'+(k+1)).catch(()=>[])),8);
  // several drafts can exist per season (mocks, 1-round extras): use the newest multi-round one that actually has picks
  const cands=(drafts||[]).filter(d=>d.status==='complete'&&String(d.season)===String(lg.season)&&(!d.settings||+d.settings.rounds>1)).sort((a,b)=>(b.start_time||0)-(a.start_time||0));
  let picks={};for(const dr of cands){try{const [dd,dp]=await Promise.all([jc('draft/'+dr.draft_id),jc('draft/'+dr.draft_id+'/picks')]);if(!dp||!dp.length)continue;const s2r=dd.slot_to_roster_id||{};
    for(const p of dp){const o=s2r[String(p.draft_slot)];if(o!=null)picks[lg.season+'|'+p.round+'|'+o]=[p.player_id,p.roster_id]}break}catch(e){}}
  const ids=new Set();M.forEach(w=>w.forEach(m=>(m.players||[]).forEach(p=>ids.add(p))));const P=await playersFor([...ids]);
  const slots=(lg.roster_positions||[]).filter(s=>!['BN','IR','TAXI'].includes(s));
  const wk=M.map(w=>w.map(m=>{const pp=m.players_points||{};return[m.roster_id,m.matchup_id,+m.points||0,Math.round(optimal(slots,m.players||[],pp,P)*100)/100]}));
  const sp={},top=M.map(()=>({}));M.forEach((w,wi)=>w.forEach(m=>{const s=(m.starters||[]),pts=m.starters_points||[];const R=sp[m.roster_id]=sp[m.roster_id]||{};
    let hi=null;s.forEach((pid,i)=>{if(!pid||pid==='0')return;const v=+pts[i]||0;(R[pid]=R[pid]||[]).push([wi+1,v]);if(!hi||v>hi[1])hi=[pid,v]});top[wi][m.roster_id]=hi}));
  const trades=[];TX.flat().filter(t=>t&&t.type==='trade'&&t.status==='complete').forEach(t=>trades.push({id:t.transaction_id,season:lg.season,leg:+t.leg||1,at:t.status_updated||t.created,rids:t.roster_ids||[],adds:t.adds||{},picks:(t.draft_picks||[]).map(p=>({s:p.season,r:p.round,o:p.roster_id,to:p.owner_id,from:p.previous_owner_id}))}));
  const drops=[];TX.flat().filter(t=>t&&(t.type==='waiver'||t.type==='free_agent')&&t.status==='complete'&&t.drops).forEach(t=>{for(const [pid,rid] of Object.entries(t.drops))drops.push({pid,rid:+rid,season:lg.season,leg:+t.leg||1,at:t.status_updated||t.created})});
  const place={};let champ=null;for(const m of wb||[]){if(!m.p||!m.w)continue;place[m.w]=m.p;place[m.l]=m.p+1;if(m.p===1)champ=m.w}
  const S={id,season:lg.season,done,last,pws,teams:teamsOf(users,rosters),wk,sp,top,trades,drops,picks,place,champ,name:lg.name};
  if(done&&!LS.set(key,S)){delete S.sp;LS.set(key,S);S.sp=sp}   // storage full: keep the rest, rebuild starter points next time
  return S}
async function current(){if(D.cur)return D.cur;
  const [state,lg,users,rosters,tp]=await Promise.all([j('state/nfl'),j('league/'+LEAGUE),j('league/'+LEAGUE+'/users'),j('league/'+LEAGUE+'/rosters'),j('league/'+LEAGUE+'/traded_picks').catch(()=>[])]);
  D.state=state;const T=teamsOf(users,rosters);return D.cur={state,lg,T,tp}}
async function all(){if(D.all)return D.all;return D.all=(async()=>{const ch=await chain();await current();
  const S=await pool(ch.map(lg=>()=>season(lg)),2);S.sort((a,b)=>+a.season-+b.season);
  const ids=new Set();S.forEach(s=>{s.trades.forEach(t=>Object.keys(t.adds).forEach(p=>ids.add(p)));Object.values(s.picks).forEach(p=>ids.add(p[0]));(s.drops||[]).forEach(d=>ids.add(d.pid));Object.values(s.teams).forEach(t=>t.players.forEach(p=>ids.add(p)));s.top.forEach(w=>Object.values(w).forEach(h=>h&&ids.add(h[0])))});
  PL=await playersFor([...ids]);return S})().catch(e=>{D.all=null;throw e})}
// games list across seasons (regular season only for records)
function games(S,opt){const out=[];for(const s of S)s.wk.forEach((w,wi)=>{const week=wi+1;if(!(opt&&opt.all)&&week>=s.pws)return;const by={};w.forEach(e=>{if(e[1]!=null)(by[e[1]]=by[e[1]]||[]).push(e)});
  for(const k in by){const [a,b]=by[k];if(!b)continue;const A=s.teams[a[0]],B=s.teams[b[0]];if(!A||!B)continue;out.push({s:s.season,week,a:{...A,p:a[2],o:a[3]},b:{...B,p:b[2],o:b[3]},po:week>=s.pws})}});return out}
// ---------------- shared UI ----------------
const SHOEY=(c)=>`<svg class="shoey ${c||''}" viewBox="0 0 120 96" aria-hidden="true"><use href="#shoey"/></svg>`;
const SPIN=t=>`<div class="spin">${SHOEY('wob')}<div>${esc(t||'Pouring the stats into a shoe…')}</div></div>`;
const tag=t=>'';   // no team labels (too repetitive)
const photo=(k,cap,cls,kind)=>secImg(k,cap,cls,kind);
function rng(seed){return seeded(hashStr(String(seed)))}
const pickOf=(arr,seed)=>arr[Math.floor(rng(seed)()*arr.length)];
const ktcBtn=`<a class="ktc" href="${KTC}" target="_blank" rel="noopener">📊 KTC League Power Rankings ↗</a>`;
const credit=`<div class="credit">Player &amp; pick values: <a href="https://fantasycalc.com" target="_blank" rel="noopener">FantasyCalc</a> dynasty superflex (12 teams), refreshed daily. Stats: public <a href="https://docs.sleeper.com/" target="_blank" rel="noopener">Sleeper API</a>.</div>`;
function teamValue(T,V,tp,lg){const season=+lg.season,RD=+lg.settings.draft_rounds||4,out={};
  for(const t of Object.values(T)){const pv=t.players.reduce((a,p)=>a+(V.p[p]||0),0);out[t.rid]={pv,kv:0,picks:[]}}
  for(let s=season+1;s<=season+3;s++)for(let r=1;r<=RD;r++)for(const t of Object.values(T)){let own=t.rid;const tr=(tp||[]).find(x=>+x.season===s&&+x.round===r&&x.roster_id===t.rid);if(tr)own=tr.owner_id;
    if(!out[own])continue;const v=pickVal(V,s,r);out[own].kv+=v;out[own].picks.push({s,r,o:t.rid,v})}
  for(const k in out)out[k].tot=out[k].pv+out[k].kv;return out}
// ---------------- pages ----------------
const R={};
const HOMECARDS=[['#recap','📰','RECAP','Who owes a shoey this week','recap'],['#power','⚡','POWER RANKINGS','A formula that hates your team','power'],['#race','🏁','PLAYOFF RACE','Your odds, simulated 3,000 times','race'],
 ['#tank','🚽','TANK WATCH','The race to be worst on purpose','tank'],['#draft','🎓','DRAFT ROOM','Mock 2027 rookie draft. The tank is on the clock.','draft'],['#teams','👥','TEAMS','Rosters, picks, rivals and receipts','teams'],['#fleece','🧶','FLEECE FACTORY','Trades you should send tonight','fleece'],
 ['#trades','🔁','TRADES & DROPS','Every deal and every dumb drop','trades'],['#history','🏛️','HISTORY','Champions and cautionary tales','history'],['#records','📕','RECORD BOOK','Highs, lows and who owns who','records'],
 ['#shame','🍺','HALL OF SHAME','Frame it. Never forget it.','shame'],['#arcade','🕹️','ARCADE','Mo Morehouse, mo problems','arcade']];
// Per-section images: img/sec/<key>-{720,1200}.webp. Banners sit at the top of each page (Power/Draft/Shame show theirs inline with a caption instead).
const SECIMG={home:{ok:1,alt:'Five cheerleaders in gold and black under stadium lights, one raising a shoey'},
 recap:{ok:1,alt:'Two fans at a sports bar laughing and pointing at a lopsided scoreboard',mood:'laugh'},
 power:{ok:1,alt:'Cheerleaders amazed at a player flexing on the field',mood:'swoon'},
 race:{ok:1,alt:'A woman waving a checkered flag as football helmets race down the track',mood:'swoon'},
 tank:{ok:1,alt:'Cheerleaders laughing at a football-shaped tank sinking in the mud',mood:'laugh'},
 draft:{ok:1,alt:'Cheerleaders hyped in front of a glowing draft board',mood:'swoon'},
 teams:{ok:1,alt:'Ring girls standing between two rival mascots in a boxing ring',mood:'swoon'},
 fleece:{ok:1,alt:'A sly car-lot dealer leaning on a giant golden football',mood:'swoon'},
 trades:{ok:1,alt:'Cheerleaders laughing at a man holding a terrible trade slip',mood:'laugh'},
 history:{ok:1,alt:'A librarian in a toga holding scrolls among old record books',mood:'swoon'},
 records:{ok:1,alt:'Cheerleaders amazed at a giant glowing scoreboard',mood:'swoon'},
 shame:{ok:1,alt:'Cheerleaders holding their noses at a moldy football and a burning dumpster',mood:'laugh'},
 arcade:{ok:1,alt:'Neon arcade cheerleaders playing retro football games, one with a shoey',mood:'swoon'},
 drops:{ok:1,alt:'Cheerleaders holding their noses at a jersey thrown in the trash',mood:'laugh'}};
const secSrc=(k,w)=>`img/sec/${k}-${w}.webp?v=3`;
const banner=(k,alt)=>{const x=SECIMG[k];return x&&x.ok?`<figure class="secb"><img src="${secSrc(k,720)}" srcset="${secSrc(k,720)} 720w, ${secSrc(k,1200)} 1200w" sizes="(min-width:1000px) 976px, 100vw" width="720" height="405" loading="lazy" decoding="async" alt="${esc(alt||x.alt||'')}"></figure>`:''};
// captioned inline photo (used inside cards); kind = caption color ('laugh' red / 'swoon' pink), defaults to the image's mood
function secImg(k,cap,cls,kind){const x=SECIMG[k]||{};kind=kind||x.mood||'swoon';return`<figure class="rphoto ${kind} ${cls||''}"><img src="${secSrc(k,720)}" srcset="${secSrc(k,720)} 720w, ${secSrc(k,1200)} 1200w" sizes="(min-width:760px) 300px, 92vw" width="720" height="405" loading="lazy" decoding="async" alt="${esc(x.alt||'')}"><figcaption>${cap}</figcaption></figure>`}
R.home=async el=>{const {state,lg,T}=await current();const leg=+state.leg||1,last=+lg.settings.last_scored_leg||0,wk=lg.status==='in_season'?Math.max(1,leg):last||1;
  const [M,LM]=await Promise.all([j('league/'+LEAGUE+'/matchups/'+wk).catch(()=>[]),last?jc('league/'+LEAGUE+'/matchups/'+last).catch(()=>[]):[]]);const by={};M.forEach(m=>{if(m.matchup_id!=null)(by[m.matchup_id]=by[m.matchup_id]||[]).push(m)});
  const rows=Object.values(T).sort((a,b)=>b.w-a.w||b.pf-a.pf),pt=+lg.settings.playoff_teams||6;
  const box=g=>{const [a,b]=g.map(m=>({...T[m.roster_id],p:+m.points||0}));if(!a||!b)return'';const lead=a.p===b.p?null:a.p>b.p?a:b;
    const side=x=>`<div class="sb-t${x===lead?' lead':''}"><span class="nm">${x.av?`<img class="av" src="${esc(x.av)}" alt="" loading="lazy" referrerpolicy="no-referrer">`:''}${esc(x.team)}${tag(x)}</span><b>${fmt(x.p)}</b></div>`;
    return`<div class="sb">${side(a)}${side(b)}</div>`};
  const H=await headlines(T,lg);
  // live hooks
  const hk=[],B=x=>`<b>${esc(x)}</b>`,rec=t=>`${t.w}-${t.l}${t.t?'-'+t.t:''}`,lead=rows[0];
  if(lead)hk.push(['#power','👑','STANDINGS LEADER',lead.team,`${rec(lead)} · ${fmt(lead.pf)} PF. Everyone is chasing ${B(lead.team)}.`,'gold']);
  const lb={};LM.forEach(m=>m.matchup_id!=null&&(lb[m.matchup_id]=lb[m.matchup_id]||[]).push(m));const G=Object.values(lb).filter(g=>g.length===2).map(([a,b])=>a.points>=b.points?[a,b]:[b,a]).sort((x,y)=>(y[0].points-y[1].points)-(x[0].points-x[1].points));
  if(G[0]&&T[G[0][0].roster_id]&&T[G[0][1].roster_id]){const [w,l]=G[0];hk.push(['#recap/'+last,'💥',`WEEK ${last} BLOWOUT`,`+${fmt(w.points-l.points)}`,`${B(T[w.roster_id].team)} ${fmt(w.points)}, ${B(T[l.roster_id].team)} ${fmt(l.points)}. Thoughts and prayers.`,'red'])}
  const lo=[...LM].filter(m=>T[m.roster_id]).sort((a,b)=>a.points-b.points)[0];if(lo)hk.push(['#recap/'+last,'🥾',`WEEK ${last} WORST SCORE`,fmt(lo.points),`${B(T[lo.roster_id].team)} owes the league a shoey.`,'red']);
  const tk=rows.slice(pt).sort((a,b)=>a.max-b.max)[0];if(tk)hk.push(['#tank','🚽','TANK WATCH LEADER',tk.team,`Lowest max PF outside the playoff spots (${fmt(tk.max)}). Pole position for the 1.01.`,'pink']);
  const ins=rows[pt-1],out=rows[pt];if(ins&&out){const gb=ins.w-out.w;hk.push(['#race','🏁','PLAYOFF BUBBLE',`#${pt} vs #${pt+1}`,`${B(ins.team)} (${rec(ins)}) holds the last spot. ${B(out.team)} (${rec(out)}) is ${gb>0?gb+' game'+(gb>1?'s':'')+' back':'tied and lurking'}.`,''])}
  hk.push(['#trades','🗑️','WORST DROP OF ALL TIME','<span id="hk-drop-p">Digging…</span>','<span id="hk-drop-l">Loading the crime scene from every season since 2021…</span>','red',1]);
  const hook=([h,i,t,v,l,c,raw])=>`<a class="hook ${c}" href="${h}"><span class="hk-t">${i} ${t}</span><span class="hk-v">${raw?v:esc(v)}</span><span class="hk-l">${l}</span></a>`;
  el.innerHTML=`<section class="hx"><img class="hx-i" src="img/sec/home-720.webp?v=3" srcset="img/sec/home-720.webp?v=3 720w, img/sec/home-1200.webp?v=3 1200w" sizes="(min-width:1000px) 1000px, 100vw" width="1200" height="675" alt="${esc(SECIMG.home.alt)}" fetchpriority="high" decoding="async">
   <div class="hc"><svg class="shoey hx-s" viewBox="0 0 120 96" aria-hidden="true"><use href="#shoey"/></svg><h1 class="hx-h">SHADYNASTY</h1><div class="hx-t">Est. 2021 · Dynasty. Degeneracy. Shoeys.</div>
   <div class="hx-k"><div class="ticker" id="ticker" aria-live="polite">${H[0]||''}</div></div>
   <div class="hx-c"><a href="#recap">📰 Week ${last||wk} roast</a><a href="#race">🏁 Playoff odds</a><a href="#shame">🍺 Hall of Shame</a></div></div></section>
  <section class="panel"><h2>🔥 THE BIG STORIES</h2><div class="hooks">${hk.map(hook).join('')}</div></section>
  <section class="panel"><h2>🗺️ PICK YOUR POISON</h2><div class="cards">${HOMECARDS.map(([h,i,n,t,im])=>`<a class="card" href="${h}"><span class="cth"><img src="img/th/${im}.webp?v=3" width="400" height="250" loading="lazy" decoding="async" alt="${esc((SECIMG[im]||{}).alt||'')}"><span class="ci">${i}</span></span><span class="cb"><b>${n}</b><small>${t}</small></span></a>`).join('')}</div></section>
  <section class="panel"><h2>📋 STANDINGS</h2><div class="tw"><table><thead><tr><th>#</th><th>TEAM</th><th>W-L</th><th>PF</th><th class="hs">PA</th><th class="hs">MAX PF</th></tr></thead><tbody>
  ${rows.map((t,i)=>`<tr class="${i<pt?'po':''}"><td>${i+1}</td><td class="tm"><a href="#team/${t.rid}">${esc(t.team)}</a>${tag(t)}<span class="ow">@${esc(t.owner)}</span></td><td>${rec(t)}</td><td>${fmt(t.pf)}</td><td class="hs">${fmt(t.pa)}</td><td class="hs">${fmt(t.max)}</td></tr>`).join('')}</tbody></table></div><div class="hint">Top ${pt} make the playoffs (highlighted).</div></section>
  <section class="panel"><h2>🏟️ WEEK ${wk} ${last>=wk?'FINAL':'LIVE'}</h2><div class="hint">${last>=wk?'Final scores.':'Live from Sleeper. Refreshes every minute while you watch.'}</div><div class="sbs">${Object.values(by).map(box).join('')||'<div class="hint">No matchups this week.</div>'}</div></section>`;
  const dp=el.querySelector('#hk-drop-p'),dl=el.querySelector('#hk-drop-l');
  Promise.all([all(),values()]).then(([S,V])=>{const d=dropsList(S,V)[0];if(!d||!dp)return;
    dp.textContent=(PL[d.pid]||{}).n||'Player '+d.pid;dl.innerHTML=`${B(d.team)} cut him in ${d.season}. ${fmt(d.pts)} starter pts for other teams since${d.to?` (mostly ${esc(d.to)})`:''}. Hold your nose.`}).catch(()=>{if(dl)dl.textContent='The evidence is loading slowly. Tap for the full list.'});
  let i=0;clearInterval(R.tick);R.tick=setInterval(()=>{const t=$('#ticker');if(!t){clearInterval(R.tick);return}const HH=H.concat(R.facts||[]);i=(i+1)%HH.length;t.classList.remove('in');void t.offsetWidth;t.innerHTML=HH[i];t.classList.add('in')},6000);
  clearTimeout(R.live);if(last<wk&&location.hash.replace('#','')in{'':1,home:1})R.live=setTimeout(()=>{if((location.hash||'#home')==='#home'&&!document.hidden)route()},60000)};
async function headlines(T,lg){const last=+lg.settings.last_scored_leg||0,out=[],v=(s,x)=>s.replace(/\{(\w+)\}/g,(m,k)=>x[k]!=null?`<b>${esc(x[k])}</b>`:m),J=(Object.values(T).find(t=>t.joe)||{}).team||'Joe';
  if(last){const M=await jc('league/'+LEAGUE+'/matchups/'+last).catch(()=>[]);const s=[...M].sort((a,b)=>b.points-a.points),hi=s[0],lo=s[s.length-1],r=rng('hl'+last);const P=a=>a[Math.floor(r()*a.length)];
    if(hi)out.push(v(P(HB.high),{T:T[hi.roster_id].team,s:fmt(hi.points)}));if(lo)out.push(v(P(HB.low),{T:T[lo.roster_id].team,s:fmt(lo.points)}));
    const by={};M.forEach(m=>m.matchup_id!=null&&(by[m.matchup_id]=by[m.matchup_id]||[]).push(m));const G=Object.values(by).filter(g=>g.length===2).map(([a,b])=>a.points>=b.points?[a,b]:[b,a]).sort((x,y)=>(y[0].points-y[1].points)-(x[0].points-x[1].points));
    if(G[0])out.push(v(P(HB.blow),{T:T[G[0][0].roster_id].team,O:T[G[0][1].roster_id].team,m:fmt(G[0][0].points-G[0][1].points)}));const c=G[G.length-1];if(c)out.push(v(P(HB.close),{T:T[c[0].roster_id].team,O:T[c[1].roster_id].team,m:fmt(c[0].points-c[1].points)}));
    const jt=Object.values(T).find(t=>t.joe);if(jt)out.push(v(P(HB.joe),{J,n:jt.w}));
    for(const t of Object.values(T)){const m=/^(\d+)([WL])$/.exec(t.streak);if(m&&+m[1]>=3)out.push(v(HB.streak[m[2]==='W'?0:1],{T:t.team,n:m[1]}))}}
  return out.length?out:['Welcome to SHADYNASTY. Where rebuilds go to die.']}
R.recap=async(el,arg)=>{const {lg,T}=await current();const last=+lg.settings.last_scored_leg||0;if(!last){el.innerHTML='<section class="panel"><h2>📰 RECAP</h2><div class="hint">Recaps start after week 1.</div></section>';return}
  const week=Math.min(last,Math.max(1,+arg||last));const rows=Object.values(T).map(t=>({rid:t.rid,team:t.team,joe:t.joe,weasel:t.wz}));
  el.innerHTML=`<section class="panel" id="recap"><h2>📰 WEEK ${week} RECAP</h2><div class="weeks">${Array.from({length:last},(_,i)=>`<a class="wk${i+1===week?' on':''}" href="#recap/${i+1}">WK ${i+1}</a>`).join('')}</div><div id="rb">${SPIN('Writing the roasts…')}</div></section>`;
  const Dd=await recapData(lg,rows,week);PL=Object.assign(PL,await playersFor([]));el.querySelector('#rb').innerHTML=renderRecap(lg,rows,Dd).replace(/👟🍺/,SHOEY('sm'))};
R.power=async el=>{const {lg,T,tp}=await current();const last=+lg.settings.last_scored_leg||0;
  const [M,V]=await Promise.all([Promise.all(Array.from({length:last},(_,k)=>jc('league/'+LEAGUE+'/matchups/'+(k+1)))),values()]);
  const TV=teamValue(T,V,tp,lg),ts=Object.values(T);const ap={};ts.forEach(t=>ap[t.rid]={w:0,l:0,rec:[]});
  M.forEach(w=>w.forEach(a=>{w.forEach(b=>{if(a.roster_id!==b.roster_id){if(a.points>b.points)ap[a.roster_id].w++;else if(a.points<b.points)ap[a.roster_id].l++}});ap[a.roster_id].rec.push(+a.points||0)}));
  const mx=f=>Math.max(1e-9,...ts.map(f));const pct=t=>ap[t.rid].w/Math.max(1,ap[t.rid].w+ap[t.rid].l),form=t=>{const r=ap[t.rid].rec.slice(-3);return r.reduce((a,b)=>a+b,0)/Math.max(1,r.length)};
  const sc=t=>100*(0.35*pct(t)+0.2*t.pf/mx(x=>x.pf)+0.15*form(t)/mx(form)+0.1*t.max/mx(x=>x.max)+0.2*TV[t.rid].tot/mx(x=>TV[x.rid].tot));
  const list=ts.map(t=>({t,s:sc(t)})).sort((a,b)=>b.s-a.s),J=(ts.find(t=>t.joe)||{}).team;
  const blurb=(t,r)=>{const tier=t.joe?'joe':r<=4?'top':r<=8?'mid':'low';const s=pickOf(PB[tier],'pr'+last+t.rid);
    return s.replace(/\{(\w+)\}/g,(m,k)=>`<b>${esc({T:t.team,r,ap:ap[t.rid].w+'-'+ap[t.rid].l,f:fmt(form(t)),pf:fmt(t.pf),J}[k])}</b>`)};
  const vr=[...ts].sort((a,b)=>TV[b.rid].tot-TV[a.rid].tot);
  el.innerHTML=`<section class="panel"><h2>⚡ POWER RANKINGS · WEEK ${last}</h2><div class="hint">Formula: 35% all-play win%, 20% points for, 15% last-3-week form, 10% max PF, 20% dynasty value (FantasyCalc SF roster + picks).</div>${ktcBtn}
  ${list.map(({t,s},i)=>`<article class="pr${i===0?' first':''}${t.wz?' wzc':''}"><div class="rk">${i+1}</div><div class="pb"><div class="pn"><a href="#team/${t.rid}">${esc(t.team)}</a>${tag(t)}</div>
   <div class="ps">${t.w}-${t.l} · all-play ${ap[t.rid].w}-${ap[t.rid].l} · ${fmt(t.pf)} PF · value ${int(TV[t.rid].tot)} · score ${s.toFixed(1)}</div><div class="pbl">${blurb(t,i+1)}</div>
   ${i===0?photo('power','#1 IN THE POWER RANKINGS. THE SQUAD IS ALL IN.'):''}</div></article>`).join('')}</section>
  <section class="panel" id="value"><h2>💰 DYNASTY TEAM VALUE</h2><div class="hint">Total FantasyCalc superflex value of every rostered player plus owned ${+lg.season+1}–${+lg.season+3} picks.</div>${ktcBtn}
  <div class="tw"><table><thead><tr><th>#</th><th>TEAM</th><th>PLAYERS</th><th>PICKS</th><th>TOTAL</th></tr></thead><tbody>${vr.map((t,i)=>`<tr class="${t.wz?'wz':''}"><td>${i+1}</td><td class="tm"><a href="#team/${t.rid}">${esc(t.team)}</a>${tag(t)}</td><td>${int(TV[t.rid].pv)}</td><td>${int(TV[t.rid].kv)}</td><td><b>${int(TV[t.rid].tot)}</b></td></tr>`).join('')}</tbody></table></div>${credit}</section>`};
R.teams=async el=>{const {T}=await current();el.innerHTML=`<section class="panel"><h2>👥 TEAMS</h2><div class="tg">${Object.values(T).sort((a,b)=>a.team.localeCompare(b.team)).map(t=>`<a class="tc${t.wz?' wzc':''}" href="#team/${t.rid}">${t.av?`<img class="av" src="${esc(t.av)}" alt="" loading="lazy" referrerpolicy="no-referrer">`:''}<span><b>${esc(t.team)}</b>${tag(t)}<br><small>@${esc(t.owner)} · ${t.w}-${t.l}</small></span></a>`).join('')}</div></section>`};
R.team=async(el,rid)=>{rid=+rid;const {lg,T,tp}=await current();const t=T[rid];if(!t){location.hash='#teams';return}
  el.innerHTML=`<section class="panel">${SPIN()}</section>`;const [S,V]=await Promise.all([all(),values()]);const TV=teamValue(T,V,tp,lg)[rid];
  const pos=['QB','RB','WR','TE','K','DEF'];const ro=[...t.players].sort((a,b)=>(V.p[b]||0)-(V.p[a]||0));
  const at={w:0,l:0,t:0,pf:0,ttl:0,po:0,seasons:[]};for(const s of S){const x=Object.values(s.teams).find(y=>y.uid===t.uid);if(!x)continue;at.w+=x.w;at.l+=x.l;at.t+=x.t;at.pf+=x.pf;if(s.champ===x.rid)at.ttl++;if(s.place[x.rid])at.po++;at.seasons.push([s.season,x.w+'-'+x.l,s.place[x.rid]?'#'+s.place[x.rid]+' (playoffs)':s.done?'missed':'in progress'])}
  const tr=tradeList(S,T,V).filter(x=>x.sides.some(sd=>sd.rid===rid));
  el.innerHTML=`<section class="panel"><div class="th">${t.av?`<img class="av big" src="${esc(t.av)}" alt="" referrerpolicy="no-referrer">`:''}<div><h2>${esc(t.team)}</h2><div class="hint">@${esc(t.owner)}${tag(t)}</div></div></div>
   <div class="stats"><div><b>${t.w}-${t.l}${t.t?'-'+t.t:''}</b><span>${lg.season} record</span></div><div><b>${fmt(t.pf)}</b><span>PF</span></div><div><b>${at.w}-${at.l}</b><span>all-time (reg. season)</span></div><div><b>${at.po}</b><span>playoff trips</span></div><div><b>${at.ttl}</b><span>titles</span></div><div><b>${int(TV.tot)}</b><span>dynasty value</span></div></div>
   ${rivals(S,t)}
   <h3>ROSTER</h3><div class="tw"><table class="mini"><thead><tr><th>PLAYER</th><th>POS</th><th>NFL</th><th>VALUE</th></tr></thead><tbody>${ro.map(p=>`<tr class="${t.starters.includes(p)?'st':''}"><td>${pn(p)}</td><td>${esc(((PL[p]||{}).p||[])[0]||'')}</td><td>${esc((PL[p]||{}).t||'')}</td><td>${V.p[p]?int(V.p[p]):'–'}</td></tr>`).join('')}</tbody></table></div><div class="hint">Bold = current starters.</div>
   <h3>DRAFT PICKS OWNED</h3><div class="chips">${TV.picks.sort((a,b)=>a.s-b.s||a.r-b.r).map(p=>`<span class="chip">${p.s} R${p.r}${p.o!==rid?` <small>via ${esc(T[p.o].team)}</small>`:''} · ${int(p.v)}</span>`).join('')||'None. Bold.'}</div>
   <h3>SEASON BY SEASON</h3><div class="tw"><table class="mini"><tbody>${at.seasons.map(s=>`<tr><td>${s[0]}</td><td>${s[1]}</td><td>${s[2]}</td></tr>`).join('')}</tbody></table></div>
   <h3>TRADES (${tr.length})</h3>${tr.map(t=>tradeCard(t)).join('')||'<div class="hint">Never traded. Commitment or cowardice?</div>'}${credit}</section>`};
// trades: who's winning = starter points for the new team since the deal (+ points by players drafted with acquired picks); also current value
function tradeList(S,T,V){const bySeason=Object.fromEntries(S.map(s=>[s.season,s])),out=[];
  const ptsFor=(rid,pid,season,leg)=>{let t=0;for(const s of S){if(+s.season<+season||!s.sp)continue;const a=(s.sp[rid]||{})[pid];if(a)for(const [w,p] of a)if(+s.season>+season||w>=leg)t+=p}return t};
  const nm=(s,rid)=>{const x=(bySeason[s]||{}).teams;return x&&x[rid]?x[rid].team:(T[rid]||{}).team||'Team '+rid};
  for(const s of S)for(const tr of s.trades){const sides=tr.rids.map(rid=>({rid,team:nm(s.season,rid),cur:(T[rid]||{}).team,players:[],picks:[],pts:0,val:0}));const sd=r=>sides.find(x=>x.rid===r);
    for(const [pid,rid] of Object.entries(tr.adds)){const x=sd(rid);if(!x)continue;const p=ptsFor(rid,pid,s.season,tr.leg);x.players.push({pid,p});x.pts+=p;x.val+=V.p[pid]||0}
    for(const pk of tr.picks){const x=sd(pk.to);if(!x)continue;const d=(bySeason[pk.s]||{}).picks;const got=d&&d[pk.s+'|'+pk.r+'|'+pk.o];let p=0,v=0,who=null;
      if(got){who=got[0];p=ptsFor(pk.to,who,pk.s,1);v=V.p[who]||0}else v=pickVal(V,pk.s,pk.r);x.picks.push({...pk,who,p,orig:nm(s.season,pk.o)});x.pts+=p;x.val+=v}
    const srt=[...sides].sort((a,b)=>b.pts-a.pts);out.push({...tr,sides,gap:sides.length>1?srt[0].pts-srt[1].pts:0,win:srt[0],lose:srt[1]})}
  return out.sort((a,b)=>b.at-a.at)}
function tradeCard(t,mode,rank){const lop=t.gap>=100,ev=t.gap<15;const line=t.sides.length===2?(mode?pickOf(mode==='fl'?TB.fleece:TB.dis,t.id):lop?pickOf(TB.lop,t.id):ev?pickOf(TB.even,t.id):'').replace(/\{(\w+)\}/g,(m,k)=>`<b>${esc({W:(t.cw||t.win).team,L:(t.cl||t.lose).team,d:fmt(t.gap),c:int(t.margin||0)}[k])}</b>`):'';
  const vw=[...t.sides].sort((a,b)=>b.val-a.val)[0];
  return`<article class="trade${lop?' lop':''}"><div class="tdh">${rank?`<span class="rank">#${rank}</span>`:''}${t.season} · WEEK ${t.leg}${mode?` · margin ${int(t.margin)}`:''}${lop?' · <span class="pill red">LOPSIDED</span>':''}</div>${t.sides.map(sd=>`<div class="tside${sd===t.win&&t.gap>0?' win':''}"><div class="tn">${esc(sd.team)} got</div><ul>${sd.players.map(p=>`<li>${pn(p.pid)} <small>${fmt(p.p)} pts</small></li>`).join('')}${sd.picks.map(p=>`<li>${p.s} R${p.r} pick <small>(${esc(p.orig)}’s)</small>${p.who?` → ${pn(p.who)} <small>${fmt(p.p)} pts</small>`:' <small>not drafted yet</small>'}</li>`).join('')||'<li><small>nothing</small></li>'}</ul><div class="tsc">${fmt(sd.pts)} pts for them since · value now ${int(sd.val)}</div></div>`).join('')}
   <div class="tv">Winning on points: <b>${esc(t.win.team)}</b>${t.sides.length>1?` (+${fmt(t.gap)})`:''} · on current value: <b>${esc(vw.team)}</b></div>${line?`<div class="rl">${line}</div>`:''}</article>`}
R.trades=async el=>{el.innerHTML=`<section class="panel">${SPIN('Digging up every trade since 2021…')}</section>`;const [S,V]=await Promise.all([all(),values()]);const {T}=await current();const L=tradeList(S,T,V);
  el.innerHTML=dropsPanel(S,V)+`<section class="panel"><h2>🔁 TRADE HISTORY (${L.length})</h2>${banner('trades')}<div class="hint">“Winning” = points the acquired players scored <b>as starters for their new team</b> since the deal (picks count the player drafted with them), plus who holds more FantasyCalc superflex value today.</div>${L.map(t=>tradeCard(t)).join('')}${credit}</section>`};
R.history=async el=>{el.innerHTML=`<section class="panel">${SPIN('Rewinding the tape…')}</section>`;const [S,V]=await Promise.all([all(),values()]);const {T}=await current();const TL=tradeList(S,T,V),DL=dropsList(S,V);
  const AT={};for(const s of S)for(const t of Object.values(s.teams)){const a=AT[t.uid]=AT[t.uid]||{name:t.owner,team:t.team,w:0,l:0,t:0,pf:0,ttl:0,po:0,last:0,joe:t.joe,wz:t.wz,n:0};a.w+=t.w;a.l+=t.l;a.t+=t.t;a.pf+=t.pf;a.n++;if(s.champ===t.rid)a.ttl++;if(s.place[t.rid])a.po++;a.team=t.team;a.name=t.owner}
  for(const s of S){if(!s.done)continue;const r=Object.values(s.teams).sort((a,b)=>a.w-b.w||a.pf-b.pf)[0];if(r&&AT[r.uid])AT[r.uid].last++}
  const at=Object.values(AT).sort((a,b)=>b.w/(b.w+b.l||1)-a.w/(a.w+a.l||1));
  el.innerHTML=`<section class="panel"><h2>🏛️ LEAGUE HISTORY</h2>${[...S].reverse().map(s=>{const tm=Object.values(s.teams),fin=tm.filter(t=>s.place[t.rid]).sort((a,b)=>s.place[a.rid]-s.place[b.rid]),rest=tm.filter(t=>!s.place[t.rid]).sort((a,b)=>b.w-a.w||b.pf-a.pf);const ch=s.teams[s.champ];
    return`<details class="ssn"${!s.done?' open':''}><summary><b>${s.season}</b> ${ch?`· champion: <b class="gold">${esc(ch.team)}</b> <small>@${esc(ch.owner)}</small>`:s.done?'':'· in progress'}</summary>
     ${ch?`<div class="champ">${ch.wz?'':'🏆 '}${esc(ch.team)} won it all in ${s.season}. ${pickOf(['Respect. Begrudgingly.','Frame the screenshot, it might never happen again.','The rest of the league is still salty.','Earned it. Mostly. Some luck. OK, a lot of luck.'],s.season)}</div>`:''}
     ${yearMoves(s,TL,DL)}<div class="tw"><table class="mini"><thead><tr><th>FINISH</th><th>TEAM</th><th>W-L</th><th>PF</th></tr></thead><tbody>${[...fin,...rest].map((t,i)=>`<tr class="${t.wz?'wz':''}"><td>${s.place[t.rid]?'#'+s.place[t.rid]:s.done?'#'+(i+1):'–'}</td><td class="tm">${esc(t.team)}<span class="ow">@${esc(t.owner)}</span></td><td>${t.w}-${t.l}</td><td>${fmt(t.pf)}</td></tr>`).join('')}</tbody></table></div></details>`}).join('')}</section>
   <section class="panel"><h2>📜 ALL-TIME STANDINGS</h2><div class="hint">Regular season, ${S[0].season}–${S[S.length-1].season}, by manager.</div><div class="tw"><table><thead><tr><th>MANAGER</th><th>W-L</th><th>WIN%</th><th class="hs">PF</th><th>PO</th><th>TITLES</th><th>LAST</th></tr></thead><tbody>
   ${at.map(a=>`<tr class="${a.wz?'wz':''}"><td class="tm">${esc(a.team)}${tag(a)}<span class="ow">@${esc(a.name)} · ${a.n} seasons</span></td><td>${a.w}-${a.l}</td><td>${(100*a.w/Math.max(1,a.w+a.l)).toFixed(1)}%</td><td class="hs">${fmt(a.pf)}</td><td>${a.po}</td><td>${a.ttl}</td><td>${a.last}</td></tr>`).join('')}</tbody></table></div></section>`};
R.records=async el=>{el.innerHTML=`<section class="panel">${SPIN('Opening the record book…')}</section>`;const S=await all();const {T}=await current();const G=games(S);
  const sc=[];G.forEach(g=>{sc.push({...g.a,s:g.s,week:g.week,opp:g.b});sc.push({...g.b,s:g.s,week:g.week,opp:g.a})});
  const li=(a,f)=>`<ol class="rec">${a.map(f).join('')}</ol>`;const when=x=>`<small>${x.s} wk ${x.week}</small>`;
  const hi=[...sc].sort((a,b)=>b.p-a.p).slice(0,10),lo=[...sc].sort((a,b)=>a.p-b.p).slice(0,10),bl=[...G].sort((a,b)=>Math.abs(b.a.p-b.b.p)-Math.abs(a.a.p-a.b.p)).slice(0,10),cl=[...G].filter(g=>g.a.p!==g.b.p).sort((a,b)=>Math.abs(a.a.p-a.b.p)-Math.abs(b.a.p-b.b.p)).slice(0,10);
  const wl=g=>g.a.p>=g.b.p?[g.a,g.b]:[g.b,g.a];
  // streaks by manager
  const seq={};G.slice().sort((a,b)=>+a.s-+b.s||a.week-b.week).forEach(g=>{for(const [x,y] of [[g.a,g.b],[g.b,g.a]])(seq[x.uid]=seq[x.uid]||{t:x,r:[]}).r.push(x.p>y.p?'W':x.p<y.p?'L':'T')});
  const streak=c=>Object.values(seq).map(v=>{let b=0,n=0;v.r.forEach(r=>{n=r===c?n+1:0;b=Math.max(b,n)});return{t:v.t,n:b}}).sort((a,b)=>b.n-a.n).slice(0,5);
  // head to head between current managers
  const cur=Object.values(T),h={};G.forEach(g=>{const k=g.a.uid+'|'+g.b.uid,k2=g.b.uid+'|'+g.a.uid;h[k]=h[k]||[0,0];h[k2]=h[k2]||[0,0];if(g.a.p>g.b.p){h[k][0]++;h[k2][1]++}else if(g.b.p>g.a.p){h[k][1]++;h[k2][0]++}});
  const ab=t=>esc((t.owner||'').slice(0,6));
  el.innerHTML=`<section class="panel"><h2>📕 RECORD BOOK</h2><div class="hint">Regular-season games, ${S[0].season}–present.</div>
   <h3>HIGHEST SCORES</h3>${li(hi,x=>`<li><b>${fmt(x.p)}</b> ${esc(x.team)} vs ${esc(x.opp.team)} ${when(x)}</li>`)}
   <h3>LOWEST SCORES</h3>${li(lo,x=>`<li><b>${fmt(x.p)}</b> ${esc(x.team)} vs ${esc(x.opp.team)} ${when(x)}</li>`)}
   <h3>BIGGEST BLOWOUTS</h3>${li(bl,g=>{const [w,l]=wl(g);return`<li><b>+${fmt(w.p-l.p)}</b> ${esc(w.team)} ${fmt(w.p)} – ${esc(l.team)} ${fmt(l.p)} ${when(g)}</li>`})}
   <h3>CLOSEST GAMES</h3>${li(cl,g=>{const [w,l]=wl(g);return`<li><b>${fmt(w.p-l.p)}</b> ${esc(w.team)} ${fmt(w.p)} – ${esc(l.team)} ${fmt(l.p)} ${when(g)}</li>`})}
   <h3>LONGEST WIN STREAKS</h3>${li(streak('W'),x=>`<li><b>${x.n}</b> ${esc(x.t.owner)}</li>`)}
   <h3>LONGEST LOSING STREAKS</h3>${li(streak('L'),x=>`<li><b>${x.n}</b> ${esc(x.t.owner)}</li>`)}
   <h3>HEAD-TO-HEAD (row vs column, W-L)</h3><div class="tw h2h"><table><thead><tr><th></th>${cur.map(c=>`<th>${ab(c)}</th>`).join('')}</tr></thead><tbody>${cur.map(r=>`<tr><th>${ab(r)}</th>${cur.map(c=>{if(c===r)return'<td class="x">—</td>';const v=h[r.uid+'|'+c.uid]||[0,0];return`<td class="${v[0]>v[1]?'up':v[0]<v[1]?'dn':''}">${v[0]}-${v[1]}</td>`}).join('')}</tr>`).join('')}</tbody></table></div></section>`};
R.shame=async el=>{el.innerHTML=`<section class="panel">${SPIN('Pouring the shoeys…')}</section>`;const [S,V]=await Promise.all([all(),values()]);const {T}=await current();const G=games(S);
  const sc=[];G.forEach(g=>{sc.push({...g.a,s:g.s,week:g.week,opp:g.b});sc.push({...g.b,s:g.s,week:g.week,opp:g.a})});
  const badge=SHOEY('badge'),cap=k=>`<small class="sc">${esc(pickOf(SB,k))}</small>`;
  const lo=[...sc].sort((a,b)=>a.p-b.p).slice(0,8),bl=[...G].map(g=>g.a.p>=g.b.p?{w:g.a,l:g.b,g}:{w:g.b,l:g.a,g}).sort((a,b)=>(b.w.p-b.l.p)-(a.w.p-a.l.p)).slice(0,8);
  const bench=[...sc].map(x=>({...x,d:x.o-x.p})).sort((a,b)=>b.d-a.d).slice(0,8);
  const ugly=rankTrades(tradeList(S,T,V)).worst;
  const lasts=S.filter(s=>s.done).map(s=>({s:s.season,t:Object.values(s.teams).sort((a,b)=>a.w-b.w||a.pf-b.pf)[0]}));
  el.innerHTML=`<section class="panel shame"><h2>🍺 HALL OF SHAME</h2>${photo('shame','THE SQUAD HAS SEEN YOUR LINEUPS.','top')}
   <h3>LOWEST SCORES EVER</h3><ol class="rec sh">${lo.map((x,i)=>`<li>${badge}<div><b>${fmt(x.p)}</b> ${esc(x.team)}${tag(x)} vs ${esc(x.opp.team)} <small>${x.s} wk ${x.week}</small>${cap('lo'+i+x.s+x.week)}</div></li>`).join('')}</ol>
   <h3>WORST BLOWOUT LOSSES</h3><ol class="rec sh">${bl.map((x,i)=>`<li>${badge}<div><b>-${fmt(x.w.p-x.l.p)}</b> ${esc(x.l.team)}${tag(x.l)} got buried by ${esc(x.w.team)} <small>${x.g.s} wk ${x.g.week}</small>${cap('bl'+i+x.g.s)}</div></li>`).join('')}</ol>
   <h3>BIGGEST BENCH BLUNDERS</h3><ol class="rec sh">${bench.map((x,i)=>`<li>${badge}<div><b>${fmt(x.d)}</b> pts left on the bench by ${esc(x.team)}${tag(x)} <small>${x.s} wk ${x.week} · scored ${fmt(x.p)}, could have had ${fmt(x.o)}${x.opp.p>x.p&&x.opp.p<x.o?' and WON':''}</small></div></li>`).join('')}</ol>
   <h3>WORST TRADES OF ALL TIME</h3>${ugly.map((t,i)=>tradeCard(t,'dis',i+1)).join('')}
   <h3>WORST DROPS OF ALL TIME</h3>${dropsList(S,V).slice(0,10).map((d,i)=>dropItem(d,i)).join('')}
   <h3>LAST-PLACE FINISHES</h3><ol class="rec sh">${lasts.map(x=>`<li>${badge}<div><b>${x.s}</b> ${esc(x.t.team)}${tag(x.t)} <small>@${esc(x.t.owner)} · ${x.t.w}-${x.t.l}</small></div></li>`).join('')}</ol></section>`};
R.arcade=async el=>{el.innerHTML=`<section class="panel arcade"><h2>🕹️ ARCADE</h2>
  <a class="big" href="${GAME}">🎮 MOREHOUSE MORE PROBLEMS<small>Survive Joe's rebuild. Canvas shooter, plays great on iPhone.</small></a>
  <h3>MO PROBLEMS LEADERBOARD</h3><div id="lb">${SPIN('Loading high scores…')}</div></section>`;
  try{const d=await fetch('https://morehouse-scores.brettwilson08.workers.dev/scores?board=main&mode=all&limit=10').then(r=>r.json());el.querySelector('#lb').innerHTML=`<ol class="rec">${(d.top||[]).slice(0,10).map(x=>`<li><b>${int(x.s)}</b> ${esc(x.n)}</li>`).join('')}</ol><a class="ktc" href="${GAME}">PLAY AND BEAT IT →</a>`}
  catch(e){el.querySelector('#lb').innerHTML=`<div class="hint">Leaderboard is napping. <a href="${GAME}">Open the game</a> to see it.</div>`}};
// ---------------- router ----------------
const TABS=[['home','🏠','HOME'],['recap','📰','RECAP'],['power','⚡','POWER'],['teams','👥','TEAMS'],['trades','🔁','TRADES'],['history','🏛️','HISTORY'],['records','📕','RECORDS'],['shame','🍺','SHAME'],['arcade','🕹️','ARCADE']];
async function route(){const h=(location.hash||'#home').slice(1).split('/'),k=R[h[0]]?h[0]:'home',el=$('#view');
  document.querySelectorAll('#tabs a').forEach(a=>a.classList.toggle('on',a.dataset.k===k||(k==='team'&&a.dataset.k==='teams')));
  const on=document.querySelector('#tabs a.on');if(on&&on.scrollIntoView)try{on.scrollIntoView({block:'nearest',inline:'center'})}catch(e){}
  if(!el.firstChild||el.dataset.k!==k)el.innerHTML=`<section class="panel">${SPIN()}</section>`;el.dataset.k=k;const tok=route.tok=(route.tok||0)+1;
  const box=document.createElement('div');try{await R[k](box,h[1]);if(tok!==route.tok)return;el.replaceChildren(...box.childNodes);addBanner(k);if(R.after)R.after(k)}
  catch(e){console.warn(e);if(tok===route.tok)el.innerHTML=`<section class="panel">${SHOEY('sm')}<div class="hint">Sleeper fumbled that one (${esc(e.message||e)}). Pull to refresh in a minute.</div></section>`}
  if(h[0]!==route.last){window.scrollTo(0,0);route.last=h[0]}}
function addBanner(k){const b=k==='team'?'teams':k;if(['home','trades','power','draft','shame'].includes(b)||!SECIMG[b])return;const h=document.querySelector('#view .panel h2');if(!h||document.querySelector('#view .secb'))return;const a=h.parentElement.classList.contains('panel')?h:h.parentElement.closest('.panel>*')||h;a.insertAdjacentHTML('afterend',banner(b))}
$('#tabs').innerHTML=TABS.map(([k,i,n])=>`<a href="#${k}" data-k="${k}"><span>${i}</span>${n}</a>`).join('');
// R pages write into a detached box; the ticker needs to find #ticker after insertion
R.after=k=>{if(k==='home'){const t=$('#ticker');if(t)t.classList.add('in')}};
addEventListener('hashchange',route);
// ---------------- PLAYOFF RACE: Monte Carlo over the real remaining schedule ----------------
function randn(r){let u=0,v=0;while(!u)u=r();while(!v)v=r();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v)}
function simRace(T,M,upto,pws,pt,N){const ids=Object.keys(T).map(Number),sc={},base={};ids.forEach(i=>{sc[i]=[];base[i]={w:0,pf:0}});
  for(let w=1;w<=upto;w++){const by={};(M[w-1]||[]).forEach(m=>{sc[m.roster_id].push(+m.points||0);base[m.roster_id].pf+=+m.points||0;if(m.matchup_id!=null)(by[m.matchup_id]=by[m.matchup_id]||[]).push(m)});
    Object.values(by).forEach(([a,b])=>{if(!b)return;if(a.points>b.points)base[a.roster_id].w++;else if(b.points>a.points)base[b.roster_id].w++;else{base[a.roster_id].w+=.5;base[b.roster_id].w+=.5}})}
  const all=ids.flatMap(i=>sc[i]),lmu=all.reduce((a,b)=>a+b,0)/Math.max(1,all.length)||110,P={};
  ids.forEach(i=>{const s=sc[i],n=s.length,mu=n?s.reduce((a,b)=>a+b,0)/n:lmu,sd=n>1?Math.sqrt(s.reduce((a,b)=>a+(b-mu)**2,0)/(n-1)):22;P[i]={mu:(mu*n+lmu*2)/(n+2),sd:Math.max(12,Math.min(40,sd||22))}});
  const sched=[];for(let w=upto+1;w<pws;w++){const by={};(M[w-1]||[]).forEach(m=>{if(m.matchup_id!=null)(by[m.matchup_id]=by[m.matchup_id]||[]).push(m.roster_id)});sched.push(Object.values(by).filter(g=>g.length===2))}
  const r=rng('race'+upto),po={},s1={};ids.forEach(i=>{po[i]=0;s1[i]=0});
  for(let k=0;k<N;k++){const w={},pf={};ids.forEach(i=>{w[i]=base[i].w;pf[i]=base[i].pf});
    for(const wk of sched){const pts={};for(const [a,b] of wk){pts[a]=P[a].mu+P[a].sd*randn(r);pts[b]=P[b].mu+P[b].sd*randn(r);pf[a]+=pts[a];pf[b]+=pts[b];if(pts[a]>pts[b])w[a]++;else w[b]++}}
    const o=[...ids].sort((a,b)=>w[b]-w[a]||pf[b]-pf[a]);o.slice(0,pt).forEach(i=>po[i]++);s1[o[0]]++}
  const out={};ids.forEach(i=>out[i]={po:po[i]/N,s1:s1[i]/N,mu:P[i].mu,sd:P[i].sd,w:base[i].w});return out}
const pc=x=>x>=0.995?'>99%':x>0&&x<0.005?'<1%':Math.round(x*100)+'%';
R.race=async el=>{const {lg,T}=await current();const last=+lg.settings.last_scored_leg||0,pws=+lg.settings.playoff_week_start||15,pt=+lg.settings.playoff_teams||6;
  const M=await pool(Array.from({length:pws-1},(_,k)=>()=>(k<last?jc:jc)('league/'+LEAGUE+'/matchups/'+(k+1)).catch(()=>[])),8);
  const now=simRace(T,M,last,pws,pt,3000),prev=last>1?simRace(T,M,last-1,pws,pt,3000):null;
  const ts=Object.values(T).sort((a,b)=>now[b.rid].po-now[a.rid].po||now[b.rid].s1-now[a.rid].s1);
  const mv=t=>{if(!prev)return'';const d=Math.round((now[t.rid].po-prev[t.rid].po)*100);return d>=3?`<span class="mv up">▲${d}</span>`:d<=-3?`<span class="mv dn">▼${-d}</span>`:'<span class="mv eq">–</span>'};
  // luck & consistency
  const ap={},bench={};Object.values(T).forEach(t=>{ap[t.rid]=0;bench[t.rid]=0});const slots=(lg.roster_positions||[]).filter(s=>!['BN','IR','TAXI'].includes(s));
  const ids=new Set();M.slice(0,last).forEach(w=>w.forEach(m=>(m.players||[]).forEach(p=>ids.add(p))));const P=await playersFor([...ids]);
  M.slice(0,last).forEach(w=>{w.forEach(a=>{ap[a.roster_id]+=w.filter(b=>b.roster_id!==a.roster_id&&b.points<a.points).length/(w.length-1);bench[a.roster_id]+=Math.max(0,optimal(slots,a.players||[],a.players_points||{},P)-(+a.points||0))})});
  const avgPA=Object.values(T).reduce((a,t)=>a+t.pa,0)/Object.keys(T).length;
  const lk=Object.values(T).map(t=>({t,luck:t.w-ap[t.rid],sched:avgPA-t.pa,bench:bench[t.rid],cv:now[t.rid].sd/Math.max(1,now[t.rid].mu)})).sort((a,b)=>b.luck-a.luck);
  const boom=x=>x.cv<0.15?'🧱 STEADY':x.cv<0.22?'🎢 SWINGY':'💣 BOOM/BUST';
  el.innerHTML=`<section class="panel"><h2>🏁 PLAYOFF RACE · AFTER WEEK ${last}</h2><div class="hint">${pt} playoff spots. 3,000 simulated finishes of the real remaining schedule (weeks ${last+1}–${pws-1}), each team scoring like it has so far (shrunk toward the league average). Seeds by wins, then points for. Arrows = playoff-odds change since last week.</div>
   <div class="tw"><table><thead><tr><th></th><th>TEAM</th><th>W-L</th><th>PLAYOFFS</th><th>#1 SEED</th></tr></thead><tbody>${ts.map((t,i)=>`<tr class="${i<pt?'po':''}${t.wz?' wz':''}"><td>${mv(t)}</td><td class="tm"><a href="#team/${t.rid}">${esc(t.team)}</a>${tag(t)}<span class="bar"><i style="width:${Math.round(now[t.rid].po*100)}%"></i></span><span class="ow">${fmt(now[t.rid].mu)}/wk ± ${fmt(now[t.rid].sd)}</span></td><td>${t.w}-${t.l}</td><td><b>${pc(now[t.rid].po)}</b></td><td>${pc(now[t.rid].s1)}</td></tr>`).join('')}</tbody></table></div></section>
  <section class="panel"><h2>🍀 LUCK &amp; CONSISTENCY</h2><div class="hint"><b>Luck</b> = actual wins minus all-play expected wins. <b>Schedule</b> = points against vs league average (positive = soft schedule). <b>Bench</b> = season points left on the bench. <b>Style</b> from week-to-week swing.</div>
   <div class="tw"><table><thead><tr><th>#</th><th>TEAM</th><th>LUCK</th><th>SCHED</th><th>BENCH</th><th class="hs">STYLE</th></tr></thead><tbody>${lk.map((x,i)=>`<tr class="${x.t.wz?'wz':''}"><td>${i+1}</td><td class="tm">${esc(x.t.team)}${tag(x.t)}<span class="ow">${x.luck>1?'Horseshoe up somewhere.':x.luck<-1?'Robbed weekly. Pour one out.':'Gets what they deserve.'}</span></td><td class="${x.luck>0?'up':'dn'}">${x.luck>0?'+':''}${x.luck.toFixed(1)}</td><td>${x.sched>0?'+':''}${fmt(x.sched)}</td><td>${fmt(x.bench)}</td><td class="hs">${boom(x)}</td></tr>`).join('')}</tbody></table></div></section>`};
TABS.splice(3,0,['race','🏁','RACE']);$('#tabs').innerHTML=TABS.map(([k,i,n])=>`<a href="#${k}" data-k="${k}"><span>${i}</span>${n}</a>`).join('');
// all-time fun facts get added to the Home ticker once the history is loaded (instant when cached)
R.after=k=>{if(k!=='home')return;const t=$('#ticker');if(t)t.classList.add('in');
  (all().then(S=>{const G=games(S),h={},nm={};G.forEach(g=>{for(const [x,y] of [[g.a,g.b],[g.b,g.a]]){nm[x.uid]=x.team;const k=x.uid+'|'+y.uid;h[k]=h[k]||[0,0];h[k][x.p>y.p?0:1]++}});
    const cur=new Set(Object.values(D.cur.T).map(t=>t.uid));Object.values(D.cur.T).forEach(t=>nm[t.uid]=t.team);const F=[];
    for(const k in h){const [a,b]=k.split('|');if(!cur.has(a)||!cur.has(b))continue;const [w,l]=h[k];if(w===0&&l>=3)F.push(`<b>${esc(nm[a])}</b> is 0-${l} all-time against <b>${esc(nm[b])}</b>. Owned.`);else if(w>=5&&l===0)F.push(`<b>${esc(nm[a])}</b> is ${w}-0 all-time against <b>${esc(nm[b])}</b>. Daddy.`)}
    const sc=[];G.forEach(g=>{sc.push(g.a);sc.push(g.b)});const top=[...sc].sort((a,b)=>b.p-a.p)[0],bot=[...sc].sort((a,b)=>a.p-b.p)[0];
    if(top)F.push(`All-time record: <b>${esc(top.team)}</b> once dropped <b>${fmt(top.p)}</b>.`);if(bot)F.push(`All-time low: <b>${esc(bot.team)}</b> once scored <b>${fmt(bot.p)}</b>. The shoey is still warm.`);
    R.facts=F.sort(()=>0).filter((_,i)=>i%Math.max(1,Math.ceil(F.length/8))===0)}).catch(()=>{}))};
// ---------------- THE FLEECE FACTORY: value-balanced trade ideas that fix a need on both sides ----------------
const FP={
 gen:["{A}, you need a {pa}. {B} needs a {pb}. Do the math, cowards.","{A} gets {Y}, {B} gets {X}. Within {d}% on value. Nobody gets fleeced. Allegedly.","Both rosters get better. Which means one of you will still find a way to screw it up.","{B} has {Y} gathering dust at {pa}. {A} has {X} doing nothing. Make the call.","Fair on paper. Someone will still cry about it in the group chat.","This deal fixes {A}'s {pa} hole and {B}'s {pb} problem. Accept before someone sober reviews it."],
 cont:["{A} is contending. {Y} helps now. {X} helps {B} later. Win-win, unless you're the guy who loses.","Contender tax: {A} buys {Y} for the stretch run and {B} gets younger. Classic dynasty."],
 joe:["Joe, take this deal before you trade for another 2029 4th.","Joe, this is a REAL trade, with REAL players. Try it. Just once.","Joe gets {Y}. Year 6 of the rebuild starts now. Again.","Joe, accept this and we promise to stop roasting you for a week. (We won't.)"]};
const NEED={QB:2,RB:3,WR:4,TE:1};
R.fleece=async el=>{const {lg,T,tp}=await current();const V=await values();const ts=Object.values(T);
  await playersFor(ts.flatMap(t=>t.players)).then(P=>{PL=Object.assign(PL,P)});
  const pos=pid=>((PL[pid]||{}).p||[])[0],val=pid=>V.p[pid]||0,age=pid=>V.a[pid]||0,ns=Object.keys(NEED),TV=teamValue(T,V,tp,lg);
  // "assets that matter": top-60 rostered players by superflex value, plus 1st-round picks
  const ranked=ts.flatMap(t=>t.players).filter(p=>val(p)>0&&ns.includes(pos(p))).sort((a,b)=>val(b)-val(a)),top=new Set(ranked.slice(0,60));
  const info={};for(const t of ts){const by={};ns.forEach(k=>by[k]=t.players.filter(p=>pos(p)===k&&val(p)>0).sort((a,b)=>val(b)-val(a)));
    const sv={};ns.forEach(k=>sv[k]=by[k].slice(0,NEED[k]).reduce((x,p)=>x+val(p),0));const core=t.players.filter(p=>val(p)>0).sort((a,b)=>val(b)-val(a)).slice(0,12);
    info[t.rid]={t,by,sv,age:core.reduce((x,p)=>x+(age(p)||26),0)/Math.max(1,core.length)}}
  const avg={};ns.forEach(k=>avg[k]=ts.reduce((x,t)=>x+info[t.rid].sv[k],0)/ts.length||1);
  for(const t of ts){const I=info[t.rid];I.ratio={};ns.forEach(k=>I.ratio[k]=I.sv[k]/avg[k]);const o=[...ns].sort((x,y)=>I.ratio[x]-I.ratio[y]);
    I.need=o.filter(k=>I.ratio[k]<1).slice(0,2);if(!I.need.length)I.need=o.slice(0,1);I.surplus=[...o].reverse().filter(k=>I.ratio[k]>=1).slice(0,2);
    const pct=(t.w+.5*t.t)/Math.max(1,t.w+t.l+t.t);I.mode=(pct>=0.5&&I.age>=24.5)||pct>=0.65?'CONTENDER':pct<0.4||I.age<24.5?'REBUILDER':'TWEENER';
    const A=x=>({k:'p',id:x,v:val(x),pos:pos(x),age:age(x),big:top.has(x)});
    // what this team can move: players at its strong spots (never its last starter there), plus picks
    I.give=I.surplus.flatMap(k=>I.by[k].slice(I.ratio[k]>1.25?0:1).filter(p=>val(p)>=900)).map(A);
    I.picks=TV[t.rid].picks.filter(p=>p.v>=900).map(p=>({k:'k',id:p.s+'-'+p.r+'-'+p.o,v:p.v,pos:'PICK',s:p.s,r:p.r,o:p.o,big:p.r===1,age:0}));
    I.all=t.players.filter(p=>val(p)>=900&&ns.includes(pos(p))).map(A)}
  const combos=(arr,n)=>{const out=[];const f=(i,cur)=>{if(cur.length&&cur.length<=n)out.push(cur);if(cur.length===n)return;for(let j=i;j<arr.length;j++)f(j+1,cur.concat([arr[j]]))};f(0,[]);return out};
  const sum=x=>x.reduce((a,b)=>a+b.v,0),used={},CAP=2;
  const lab=x=>x.k==='p'?`${pn(x.id)} <small>${esc(x.pos)}${x.age?' · '+x.age:''} · ${int(x.v)}</small>`:`${x.s} ${ORD[x.r]}${x.o?` <small>(${esc((T[x.o]||{}).team||'')}’s)</small>`:''} <small>· ${int(x.v)}</small>`;
  const sug={};
  const order=[...ts].sort((a,b)=>TV[b.rid].tot-TV[a.rid].tot);
  for(const t of order){const A=info[t.rid],cand=[];
    for(const u of ts){if(u===t)continue;const B=info[u.rid];
      // anchor: a top-60 player B can spare at A's need
      const anchors=B.all.filter(x=>x.big&&A.need.includes(x.pos)&&(B.ratio[x.pos]>=1||B.mode==='REBUILDER'&&x.age>=27));
      if(!anchors.length)continue;
      const aPool=[...A.give.filter(x=>B.need.includes(x.pos)||x.big),...A.picks].sort((x,y)=>y.v-x.v).slice(0,7);
      const bExtra=B.all.filter(x=>!anchors.includes(x)&&x.v>=900&&x.v<val(anchors[0].id)).sort((x,y)=>y.v-x.v).slice(0,5).concat(B.picks.slice(0,3));
      for(const an of anchors.slice(0,2))for(const add of [[],...bExtra.map(x=>[x])]){const get=[an,...add],gv=sum(get);
        for(const give of combos(aPool,3)){const n=give.length+get.length;if(n<3||give.length>3||get.length>2)continue;
          if(!give.some(x=>x.big))continue;if(!give.some(x=>x.k==='k'?B.mode!=='CONTENDER':B.need.includes(x.pos)))continue;
          const v=sum(give),d=Math.abs(v-gv)/Math.max(v,gv);if(d>0.10)continue;
          if([...give,...get].some(x=>(used[x.id]||0)>=CAP))continue;
          let sc=(gv+v)/4000+(1.1-A.ratio[an.pos])*2-d*3;
          const ga=give.filter(x=>x.k==='p').reduce((a,x)=>a+x.age,0)/Math.max(1,give.filter(x=>x.k==='p').length)||22;
          if(A.mode==='CONTENDER'&&B.mode!=='CONTENDER'&&an.age>ga)sc+=1.2;if(A.mode==='REBUILDER'&&B.mode==='CONTENDER'&&an.age<ga)sc+=1.2;if(A.mode===B.mode&&A.mode!=='TWEENER')sc-=.6;
          cand.push({u,give,get,v,gv,d,sc,need:an.pos})}}}
    cand.sort((a,b)=>b.sc-a.sc);const out=[];for(const c of cand){if(out.some(o=>o.u===c.u))continue;if([...c.give,...c.get].some(x=>(used[x.id]||0)>=CAP))continue;
      out.push(c);[...c.give,...c.get].forEach(x=>used[x.id]=(used[x.id]||0)+1);if(out.length===2)break}sug[t.rid]=out}
  const pitch=(t,c)=>{const A=info[t.rid],k=t.joe?'joe':A.mode==='CONTENDER'?'cont':A.mode==='REBUILDER'?'reb':'gen';
    // age-aware: only say the partner "gets younger" when what they receive really is younger (picks count as age 21)
    const av=x=>x.reduce((s,y)=>s+(y.k==='k'?21:(y.age||26)),0)/Math.max(1,x.length),younger=av(c.give)<av(c.get)-0.3;
    const arr=FP[k].concat(FP.gen).filter(l=>!/younger/.test(l)||younger);
    const nm=x=>x.k==='p'?(PL[x.id]||{}).n:x.s+' '+ORD[x.r];
    return pickOf(arr,'fl'+t.rid+c.get[0].id).replace(/\{(\w+)\}/g,(m,q)=>`<b>${esc({A:t.team,B:c.u.team,X:nm(c.give[0]),Y:nm(c.get[0]),pa:c.need,pb:c.give[0].pos,d:Math.round(c.d*100)}[q])}</b>`)};
  el.innerHTML=`<section class="panel"><h2>🧶 THE FLEECE FACTORY</h2><div class="hint"><b>Blockbusters only.</b> Every idea has at least one top-60 superflex asset or a 1st on <b>each</b> side, comes as 2-for-1, 2-for-2 or 3-for-2, lands within 10% on FantasyCalc value and fills a real weak spot. Contenders buy proven vets with youth and picks; rebuilders cash vets in. Suggestions from public values only.</div>${ktcBtn}
  ${order.map(t=>{const A=info[t.rid];return`<article class="fl"><div class="pn"><a href="#team/${t.rid}">${esc(t.team)}</a> <span class="pill ${A.mode==='CONTENDER'?'gold':A.mode==='REBUILDER'?'':'pink'}">${A.mode}</span></div>
    <div class="ps">Core age ${A.age.toFixed(1)} · strong: ${A.surplus.map(k=>`${k} ${Math.round(A.ratio[k]*100)}%`).join(', ')||'nothing, lol'} · weak: ${A.need.map(k=>`${k} ${Math.round(A.ratio[k]*100)}%`).join(', ')}</div>
    ${sug[t.rid].length?sug[t.rid].map(c=>`<div class="deal"><div class="dl"><span>${esc(t.team)} gets · ${int(c.gv)}</span><ul>${c.get.map(x=>`<li>${lab(x)}</li>`).join('')}</ul></div><div class="dl"><span>${esc(c.u.team)} gets · ${int(c.v)}</span><ul>${c.give.map(x=>`<li>${lab(x)}</li>`).join('')}</ul></div><div class="rl">${pitch(t,c)}</div></div>`).join(''):'<div class="hint">No blockbuster fits right now. Either the roster is perfect or nobody wants your guys. (It’s the second one.)</div>'}</article>`}).join('')}${credit}</section>`};
FP.reb=["{A} is rebuilding. Sell {X} while somebody still believes in him.","Cash out, {A}. {X} won't be worth this when the rebuild finally ends in 2031.","{A} turns a vet into a pile of future. Very Joe of you."];
FP.cont=["{A} is all-in. Push the chips: {Y} wins weeks, {X} wins press conferences.","Contender move: {A} buys {Y} for the stretch run and {B} gets younger. Classic dynasty.","Contender move: {A} buys {Y} for the stretch run. {B} gets a pile of talent to flip. Everybody wins, allegedly.","{A}, rings aren't won with draft picks. Go get {Y}."];
FP.gen=["{A} needs a {pa}. {B} needs a {pb}. This is a real trade, not a lowball. Send it.","{A} gets {Y}, {B} gets {X}. Within {d}% on value. Somebody still gets fleeced, we just don't know who yet.","Blockbuster alert: {Y} for {X}. The group chat is going to melt down.","Fair on paper. Someone will still cry about it in the group chat."];

TABS.splice(6,0,['fleece','🧶','FLEECE']);TABS.splice(3,0,['tank','🚽','TANK']);TABS.splice(4,0,['draft','🎓','DRAFT']);
$('#tabs').innerHTML=TABS.map(([k,i,n])=>`<a href="#${k}" data-k="${k}"><span>${i}</span>${n}</a>`).join('');

// ---------------- BEST & WORST TRADES / WORST DROPS ----------------
TB.fleece=["{W} robbed {L} blind. Margin {c}. Somebody check {L}'s phone for malware.","Heist of the century: {W} over {L}. {L} still thinks it was fair.","{W} should send {L} a thank-you card. Margin {c}.","{L} got fleeced so hard it's now a sweater. {W} wears it proudly.","{W} won this deal so bad the commissioner should review it.","{L} accepted this sober. Allegedly."];
TB.dis=["{L} gave away the farm and got a coupon. Margin {c}.","{L} hit 'accept' and the whole league heard a flush.","This is the trade {L} lies about at the bar.","{L} traded like it was 2 a.m. and the waiver wire was closed forever.","Somewhere {W} is still laughing about this one. {L} isn't.","{L} should have their trade button taken away. Permanently."];
const DB=["{T} dropped {P} in {s}. {P} went on to score {pts} for other teams. Brilliant.","{T} cut {P}. {P} said thanks and dropped {pts} for somebody else.","{T} released {P} into the wild. The wild scored {pts}.","{P} after leaving {T}: {pts} points and a FantasyCalc value of {v}. Oops.","{T} needed a roster spot for a kicker, apparently. Bye, {P}.","{T} dropped {P}. Every other manager in the league said a little prayer of thanks."];
const DBJ=["Joe dropped {P}. Of course he did. {pts} points later, the rebuild continues.","Joe cut {P} to make room for… nobody knows. {P}: {pts} points elsewhere. Year 6 starts now.","Peak Joe: dropping {P}, who then scored {pts} for other people."];
function rankTrades(L){const two=L.filter(t=>t.sides.length===2).map(t=>{const sc=t.sides.map(s=>s.pts+s.val/25),w=sc[0]>=sc[1]?0:1;
    return{...t,cw:t.sides[w],cl:t.sides[1-w],margin:Math.abs(sc[0]-sc[1]),share:Math.abs(sc[0]-sc[1])/Math.max(1,sc[0]+sc[1])}});
  const best=[...two].sort((a,b)=>b.margin-a.margin).slice(0,5),ids=new Set(best.map(t=>t.id));
  const worst=[...two].filter(t=>!ids.has(t.id)&&t.margin>50).sort((a,b)=>b.margin*b.share-a.margin*a.share).slice(0,5);return{best,worst}}
function bestWorst(L){const {best,worst}=rankTrades(L);
  return`<section class="panel"><h2>🏆 BEST &amp; WORST TRADES OF ALL TIME</h2><div class="hint">Margin = starter points gained for the new team since the deal + current FantasyCalc value ÷ 25 (so 2,500 value ≈ 100 points). <b>Fleeces</b> are the biggest margins; <b>disasters</b> are the most one-sided of the rest.</div>
   <h3>TOP 5 FLEECES</h3>${best.map((t,i)=>tradeCard(t,'fl',i+1)).join('')}<h3>TOP 5 DISASTERS</h3>${worst.map((t,i)=>tradeCard(t,'dis',i+1)).join('')}</section>`}
function dropsList(S,V){const by=Object.fromEntries(S.map(s=>[s.season,s])),best={};
  for(const s of S)for(const d of s.drops||[]){let pts=0,to={};for(const x of S){if(+x.season<+d.season||!x.sp)continue;for(const rid in x.sp){if(+rid===d.rid)continue;const a=x.sp[rid][d.pid];if(a)for(const [w,p] of a)if(+x.season>+d.season||w>d.leg){pts+=p;to[rid]=(to[rid]||0)+p}}}
    const v=V.p[d.pid]||0,score=pts+v/25;if(score<=0)continue;const t=s.teams[d.rid]||{},k=d.pid;
    if(!best[k]||score>best[k].score){const tr=Object.entries(to).sort((a,b)=>b[1]-a[1])[0];best[k]={...d,pts,v,score,team:t.team||'Team '+d.rid,joe:t.joe,to:tr?nmAt(by,s.season,+tr[0]):null}}}
  return Object.values(best).sort((a,b)=>b.score-a.score)}
function nmAt(by,season,rid){for(const s of Object.values(by).sort((a,b)=>+b.season-+a.season)){if(+s.season>=+season&&s.teams[rid])return s.teams[rid].team}return 'Team '+rid}
function dropItem(d,i){const line=pickOf(d.joe?DBJ:DB,'dr'+d.pid+d.rid).replace(/\{(\w+)\}/g,(m,k)=>`<b>${esc({T:d.team,P:(PL[d.pid]||{}).n||'Player '+d.pid,s:d.season,pts:fmt(d.pts),v:int(d.v)}[k])}</b>`);
  return`<article class="trade lop"><div class="tdh"><span class="rank">#${i+1}</span>${d.season} · WEEK ${d.leg}</div><div class="tside"><div class="tn">${esc(d.team)} dropped ${pn(d.pid)}</div>
   <div class="tsc">${fmt(d.pts)} starter pts for other teams since${d.to?` (mostly ${esc(d.to)})`:''} · value now ${int(d.v)}</div></div><div class="rl">${line}</div></article>`}
function dropsPanel(S,V){const L=dropsList(S,V).slice(0,10);return`<section class="panel"><h2>🗑️ WORST DROPS OF ALL TIME</h2><div class="hint">Waiver and free-agent drops since ${S[0].season}, ranked by starter points the player scored for <b>other</b> teams after the drop + current FantasyCalc value ÷ 25.</div>${banner('drops')}${L.map(dropItem).join('')}</section>`}

// per-season best trade / worst trade / worst drop for the History tab
function yearMoves(s,TL,DL){const {best,worst}=rankTrades(TL.filter(t=>t.season===s.season));const b=best[0],w=worst[0]||best[1],d=DL.find(x=>x.season===s.season);
  if(!b&&!d)return'';return`<div class="ym">${b?`<h3>BEST TRADE OF ${s.season}</h3>${tradeCard(b,'fl')}`:''}${w?`<h3>WORST TRADE OF ${s.season}</h3>${tradeCard(w,'dis')}`:''}${d?`<h3>WORST DROP OF ${s.season}</h3>${dropItem(d,0).replace(/<span class="rank">#1<\/span>/,'')}`:''}</div>`}

R.tank=async el=>{el.innerHTML=`<section class="panel tankp"><h2>🚽 TANK WATCH</h2><div class="hint">The race to the bottom for the 1.01: lowest max PF among non-playoff teams picks first. Live from Sleeper. <a href="${TANK}" target="_blank" rel="noopener">Open full screen ↗</a></div></section>
   <iframe id="tankf" class="tankf" src="${TANK}?embed=1" title="Tank Watch" loading="eager"></iframe>`;
  clearInterval(R.tf);R.tf=setInterval(()=>{const f=document.getElementById('tankf');if(!f){clearInterval(R.tf);return}try{const d=f.contentDocument;if(d&&d.body){const h=Math.max(d.body.scrollHeight,d.documentElement.scrollHeight);if(Math.abs(h-f.offsetHeight)>4)f.style.height=h+'px'}}catch(e){f.style.height='85vh'}},400)};

// Rival Report: all-time regular-season H2H for this manager (min 2 games)
function rivals(S,t){const h={};games(S).forEach(g=>{for(const [x,y] of [[g.a,g.b],[g.b,g.a]]){if(x.uid!==t.uid)continue;const r=h[y.uid]=h[y.uid]||{w:0,l:0,team:y.team,pf:0,pa:0};r.team=y.team;r.pf+=x.p;r.pa+=y.p;if(x.p>y.p)r.w++;else if(y.p>x.p)r.l++}});
  const cur=Object.fromEntries(Object.values(D.cur.T).map(x=>[x.uid,x.team]));const L=Object.entries(h).filter(([u,r])=>r.w+r.l>=2&&cur[u]).map(([u,r])=>({...r,team:cur[u],pct:r.w/(r.w+r.l)}));if(!L.length)return'';
  const nem=[...L].sort((a,b)=>a.pct-b.pct||b.l-a.l)[0],vic=[...L].sort((a,b)=>b.pct-a.pct||b.w-a.w)[0];
  const NL=["{O} owns {T}. Pays rent in their head every week.","{T} is {r} against {O}. That's not a rivalry, that's a hostage situation.","{O} sees {T} on the schedule and starts planning the victory lap."],
        VL=["{T} is {r} against {O}. Free win, every time.","{O} is {T}'s personal ATM. {r} all-time.","{T} gets to bully {O} at {r}. Somebody call HR."];
  const f=(arr,r,k)=>pickOf(arr,k+t.uid+r.team).replace(/\{(\w+)\}/g,(m,q)=>`<b>${esc({T:t.team,O:r.team,r:r.w+'-'+r.l}[q])}</b>`);
  return`<h3>RIVAL REPORT</h3><div class="stats rv"><div><span>😈 NEMESIS</span><b>${esc(nem.team)}</b><span>${nem.w}-${nem.l} all-time</span></div><div><span>🎯 FAVORITE VICTIM</span><b>${esc(vic.team)}</b><span>${vic.w}-${vic.l} all-time</span></div></div><div class="rl">${f(NL,nem,'n')}</div><div class="rl">${f(VL,vic,'v')}</div>`}

// ---------------- DRAFT ROOM: snapshot mock of the 2027 rookie draft ----------------
// 2027 superflex rookie board: consensus of DraftSharks + Dynasty Nerds SF, as of Oct 2026. Order uses Tank Watch logic.
const BOARD27=[["Jeremiah Smith", "WR", "Ohio State"], ["Dante Moore", "QB", "Oregon"], ["Arch Manning", "QB", "Texas"], ["Darian Mensah", "QB", "Miami"], ["Trinidad Chambliss", "QB", "Ole Miss"], ["Jadan Baugh", "RB", "Florida"], ["Kewan Lacy", "RB", "Ole Miss"], ["Cam Coleman", "WR", "Texas"], ["Charlie Becker", "WR", "Indiana"], ["Jamari Johnson", "TE", "Oregon"], ["Drew Mestemaker", "QB", "Oklahoma State"], ["CJ Carr", "QB", "Notre Dame"], ["Julian Sayin", "QB", "Ohio State"], ["KJ Duff", "WR", "Rutgers"], ["Ahmad Hardy", "RB", "Missouri"], ["Ryan Coleman-Williams", "WR", "Alabama"], ["Nick Marsh", "WR", "Indiana"], ["Trey'Dez Green", "TE", "LSU"], ["Jayden Maiava", "QB", "USC"], ["Nate Frazier", "RB", "Georgia"], ["LaNorris Sellers", "QB", "South Carolina"], ["Reed Harris", "WR", "Arizona State"], ["Bryant Wesco Jr.", "WR", "Clemson"], ["Mark Fletcher Jr.", "RB", "Miami"]];
const DRL={one:["{T} takes {P} at 1.01. Jeremiah Smith, welcome to the rebuild. Bring a helmet.","{T} finally wins something: the 1.01. {P} is already asking for a trade."],
 joe:["Joe sprints to the podium for {P}. The tank worked. Nothing else has.","Joe takes {P}. Year 6 of the rebuild has a pulse.","{P} to Joe. Somebody check on {P}'s agent."],
 qb:["{T} grabs {P}. Superflex math says yes, the group chat says reach.","{P} to {T}. Two-QB leagues make everyone desperate."],
 gen:["{T} takes {P}. Bold. Wrong, probably, but bold.","{P} to {T}. Instant upgrade over whoever was rotting on that bench.","{T} turns in the card for {P} and immediately checks Twitter for validation.","{T} drafts {P}. See you on the trade block in two years.","{P} goes to {T}. The war room is high-fiving. The war room is one guy on a couch.","{T} takes {P}. Somewhere a dynasty podcaster just sighed."]};
R.draft=async el=>{const {lg,T,tp}=await current();const wb=await j('league/'+LEAGUE+'/winners_bracket').catch(()=>[]);const fin={};(wb||[]).forEach(m=>{if(m.p&&m.w){fin[m.w]=m.p;fin[m.l]=m.p+1}});const pt=+lg.settings.playoff_teams||6,ts=Object.values(T),NEXT=String(+lg.season+1);
  const seeds=[...ts].sort((a,b)=>b.w-a.w||b.pf-a.pf),po=new Set(seeds.slice(0,pt).map(t=>t.rid));
  // playoff teams: bracket finish once it exists (champion picks x.12), else projected seed
  const P6=seeds.slice(0,pt).map((t,i)=>({t,k:fin[t.rid]||(Object.keys(fin).length?pt+1:i+1)+(fin[t.rid]?0:i/100)})).sort((a,b)=>b.k-a.k).map(x=>x.t);
  const order=[...ts.filter(t=>!po.has(t.rid)).sort((a,b)=>a.max-b.max),...P6];
  const own=(r,rid)=>{const x=(tp||[]).find(p=>String(p.season)===NEXT&&+p.round===r&&p.roster_id===rid);return x?x.owner_id:rid};
  const picks=[];for(let r=1;r<=2;r++)order.forEach((t,i)=>{const o=T[own(r,t.rid)]||t;picks.push({r,n:i+1,orig:t,o})});
  const line=(p,k)=>{const P=BOARD27[k];const arr=k===0?DRL.one:p.o.joe?DRL.joe:P[1]==='QB'?DRL.qb.concat(DRL.gen):DRL.gen;return pickOf(arr,'dr27'+k+p.o.rid).replace(/\{(\w+)\}/g,(m,q)=>`<b>${esc({T:p.o.team,P:P[0]}[q])}</b>`)};
  el.innerHTML=`<section class="panel"><h2>🎓 DRAFT ROOM · ${NEXT} MOCK</h2><div class="hint">Snapshot mock of the May ${NEXT} rookie draft. Order: non-playoff teams by <b>lowest max PF</b> (Tank Watch rules), then playoff teams by projected finish from current standings. Traded picks from Sleeper. Board: consensus of DraftSharks + Dynasty Nerds SF, <b>as of Oct 2026</b>. Changes every week; nobody hold us to this.</div>
   ${picks.map((p,k)=>`${k===0||k===12?`<h3>ROUND ${p.r}</h3>`:''}<article class="dp${k===0?' first':''}"><div class="dn">${p.r}.${String(p.n).padStart(2,'0')}</div><div class="db"><div class="dpp">${esc(BOARD27[k][0])} <small>${BOARD27[k][1]} · ${esc(BOARD27[k][2])}</small></div><div class="dt"><a href="#team/${p.o.rid}">${esc(p.o.team)}</a>${p.o.rid!==p.orig.rid?` <small>(via ${esc(p.orig.team)})</small>`:''}</div><div class="rl">${line(p,k)}</div>${k===0?photo('draft','THE 1.01. THE SQUAD SAW THIS COMING.'):''}</div></article>`).join('')}</section>`};
route();   // last: every R.* page above is registered before the first render
