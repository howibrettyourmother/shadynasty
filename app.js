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
// one shared download of Sleeper's big players file per page view (released after a minute so old iPhones get the memory back)
const RAWP=()=>RAWP.p||(RAWP.p=fetch(API+'players/nfl').then(r=>{if(!r.ok)throw new Error('players '+r.status);return r.json()}).then(x=>{setTimeout(()=>{RAWP.p=null},60000);return x},e=>{RAWP.p=null;throw e}));
async function playersFor(ids){
  const k='sn:players';let c=LS.get(k);if(!c||Date.now()-c.at>7*864e5)c={at:Date.now(),p:{}};const have=c.p;
  if(!ids.every(i=>have[i])){
    if(!playersFor.slim)playersFor.slim=RAWP().then(all=>{const m={};
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
const D={};try{for(let i=localStorage.length-1;i>=0;i--){const k=localStorage.key(i);if(k&&(k.indexOf('sn:s5:')===0||k.indexOf('sn:s6:')===0||k.indexOf('sn:s7:')===0))localStorage.removeItem(k)}}catch(e){}
async function chain(){if(D.chain)return D.chain;const cache=LS.get('sn:chain')||{},out=[];let id=LEAGUE;
  while(id&&id!=='0'){let lg=cache[id];if(!lg||lg.status!=='complete'){lg=await j('league/'+id);if(lg.status==='complete')cache[id]=lg}out.push(lg);id=lg.previous_league_id}
  LS.set('sn:chain',cache);return D.chain=out}
function teamsOf(users,rosters){const U=Object.fromEntries(users.map(u=>[u.user_id,u])),T={};
  for(const r of rosters){const u=U[r.owner_id]||{},s=r.settings||{},un=u.username||u.display_name||'';
    T[r.roster_id]={rid:r.roster_id,uid:r.owner_id||'r'+r.roster_id,owner:u.display_name||'Orphan',team:clean(u.metadata&&u.metadata.team_name)||u.display_name||('Team '+r.roster_id),
      av:r.owner_id===BRETT?'img/weasel-av.webp':u.avatar?'https://sleepercdn.com/avatars/thumbs/'+u.avatar:'',w:s.wins||0,l:s.losses||0,t:s.ties||0,pf:num(s.fpts,s.fpts_decimal),pa:num(s.fpts_against,s.fpts_against_decimal),max:num(s.ppts,s.ppts_decimal),
      joe:/^joebags85$/i.test(un),wz:r.owner_id===BRETT,players:r.players||[],starters:r.starters||[],streak:(r.metadata&&r.metadata.streak)||''}}
  return T}
// compact season summary; completed seasons are cached forever in localStorage
async function season(lg){const done=lg.status==='complete',id=lg.league_id,key='sn:s8:'+id;if(done){const c=LS.get(key);if(c)return c}
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
  const adds=[];TX.flat().filter(t=>t&&(t.type==='waiver'||t.type==='free_agent')&&t.status==='complete'&&t.adds).forEach(t=>{let fb=+(t.settings&&t.settings.waiver_bid)||0;for(const [pid,rid] of Object.entries(t.adds)){adds.push([pid,+rid,+t.leg||1,t.type==='waiver'?1:0,fb,t.status_updated||t.created||0]);fb=0}});
  const drops=[];TX.flat().filter(t=>t&&(t.type==='waiver'||t.type==='free_agent')&&t.status==='complete'&&t.drops).forEach(t=>{for(const [pid,rid] of Object.entries(t.drops))drops.push({pid,rid:+rid,season:lg.season,leg:+t.leg||1,at:t.status_updated||t.created})});
  const place={};let champ=null;for(const m of wb||[]){if(!m.p||!m.w)continue;place[m.w]=m.p;place[m.l]=m.p+1;if(m.p===1)champ=m.w}
  const S={id,season:lg.season,done,last,pws,teams:teamsOf(users,rosters),wk,sp,top,trades,drops,adds,pob:(wb||[]).filter(m=>m.t1&&m.t2&&m.w&&(!m.p||m.p===1)).map(m=>[m.t1,m.t2,m.w]),picks,place,champ,name:lg.name};
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
 ['#tank','🚽','TANK WATCH','The race to be worst on purpose','tank'],['#draft','🎓','DRAFT ROOM','Mock 2027 rookie draft. The tank is on the clock.','draft'],['#teams','👥','TEAMS','Contend or rebuild? Positional heatmap, pick hoards, every roster','teamsov'],['#fleece','🧶','FLEECE FACTORY','Trades you should send tonight','fleece'],
 ['#trades','🔁','TRADES & WAIVERS','Waiver steals, dumb drops, every deal, who can\'t stop clicking','trades'],['#history','🏛️','HISTORY','Champions and cautionary tales','history'],['#records','📕','RECORD BOOK','Highs, lows and the all-time head-to-head grid','records'],
 ['#shame','🍺','HALL OF SHAME','Frame it. Never forget it.','shame'],['#arcade','🕹️','ARCADE','Shoey Chug + Mo Problems','arcade']];
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
 drops:{ok:1,alt:'Cheerleaders holding their noses at a jersey thrown in the trash',mood:'laugh'},
 waivers:{ok:1,alt:'A fan pulling a glowing gold football out of a 75%-off bargain bin as cheerleaders cheer',mood:'swoon'},window:{ok:1,alt:'Two fans looking up at a giant golden hourglass in a stadium',mood:'swoon'},
 posgrid:{ok:1,alt:'A cheerleader pointing and laughing at an empty circle on a play chalkboard',mood:'laugh'},picks:{ok:1,alt:'A smug guy lounging on a pile of golden tickets while cheerleaders gasp and a broke fan shows empty pockets',mood:'swoon'},
 h2h:{ok:1,alt:'Red and blue rival crowds face off as two fans hold up a scorecard',mood:'swoon'},habits:{ok:1,alt:'Two fans pointing and laughing at a frazzled guy on two phones in a blizzard of slips and energy drink cans',mood:'laugh'},
 teamsov:{ok:1,alt:'Three cheerleaders amazed at a front-office wall of roster charts',mood:'swoon'}};
const secSrc=(k,w)=>`img/sec/${k}-${w}.webp?v=4`;
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
  <section class="panel"><h2>🗺️ PICK YOUR POISON</h2><div class="cards">${HOMECARDS.map(([h,i,n,t,im])=>`<a class="card" href="${h}"><span class="cth"><img src="img/th/${im}.webp?v=4" width="400" height="250" loading="lazy" decoding="async" alt="${esc((SECIMG[im]||{}).alt||'')}"><span class="ci">${i}</span></span><span class="cb"><b>${n}</b><small>${t}</small></span></a>`).join('')}</div></section>
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
// ---- WEEKLY AWARDS (top of Recap): computed from that week's Sleeper matchups ----
const AWR={owed:["{T} put up {p}. Lowest in the league. Lace up the shoe, the beer is owed.","{p} points. {T} owes a shoey and an apology to everyone who watched.","{T} scored {p}. The shoe is warm and waiting."],
 bench:["{T} left {b} points on the bench. The lineup was set by a golden retriever.","{b} bench points. {T} had the answers and turned in a blank test.","{T} benched {b} points. Sit-start advice: try starting the good ones."],
 robbed:["{T} dropped {p} and still lost. Call the league office. Call your mom.","{p} points and an L. {T} got mugged in broad daylight.","{T} scored {p} and lost. The fantasy gods are just mean sometimes."],
 lucky:["{T} won with {p}. That's not a win, that's a clerical error.","{p} points and a W. {T} should buy a lottery ticket immediately.","{T} scored {p} and won anyway. Horseshoe confirmed."],
 boom:["{T} hung {p}. Absolute bodybag week.","{p} points. {T} was cooking with gas.","{T} went for {p}. Somebody check his lineup for PEDs."],
 heart:["{T} lost by {m}. One kneel-down from glory.","Lost by {m}. {T} will be thinking about that one in the shower all week."],
 bag:["{T} won by {m}. That wasn't a matchup, it was a hate crime.","{m}-point margin. {T} ran it up and didn't apologize."]};
async function weeklyAwards(lg,T,week){const M=await jc('league/'+LEAGUE+'/matchups/'+week).catch(()=>[]);if(!M.length)return'<div class="hint">No scores for this week yet.</div>';
  const slots=(lg.roster_positions||[]).filter(s=>!['BN','IR','TAXI'].includes(s));const ids=new Set();M.forEach(m=>(m.players||[]).forEach(p=>ids.add(p)));const P=await playersFor([...ids]);
  const r=rng('aw'+week),pk=a=>a[Math.floor(r()*a.length)];
  const X=M.filter(m=>T[m.roster_id]).map(m=>{const o=m.matchup_id!=null&&M.find(x=>x.matchup_id===m.matchup_id&&x.roster_id!==m.roster_id);const pts=+m.points||0;
    return{t:T[m.roster_id],pts,opp:o?+o.points||0:null,bench:Math.max(0,optimal(slots,m.players||[],m.players_points||{},P)-pts)}});
  const W=X.filter(x=>x.opp!=null&&x.pts>x.opp),L=X.filter(x=>x.opp!=null&&x.pts<x.opp),by=(a,f)=>a.length?a.reduce((b,x)=>f(x)>f(b)?x:b):null;
  const A=[['owed','👟🍺','SHOEY OWED',by(X,x=>-x.pts),x=>fmt(x.pts)+' pts'],['bench','🪑','BENCH WARMER',by(X,x=>x.bench),x=>fmt(x.bench)+' left on bench'],['robbed','🚨','ROBBED',by(L,x=>x.pts),x=>fmt(x.pts)+' in a loss'],
    ['lucky','🍀','LUCKY BASTARD',by(W,x=>-x.pts),x=>fmt(x.pts)+' in a win'],['boom','💥','BOOM',by(X,x=>x.pts),x=>fmt(x.pts)+' pts'],['heart','💔','HEARTBREAKER',by(L,x=>-(x.opp-x.pts)),x=>'lost by '+fmt(x.opp-x.pts)],['bag','⚰️','BODYBAG',by(W,x=>x.pts-x.opp),x=>'won by '+fmt(x.pts-x.opp)]];
  return'<div class="awg">'+A.filter(a=>a[3]).map(([k,ic,nm,x,st])=>{const line=pk(AWR[k]).replace(/\{T\}/g,x.t.team).replace(/\{p\}/g,fmt(x.pts)).replace(/\{b\}/g,fmt(x.bench)).replace(/\{m\}/g,fmt(Math.abs((x.opp||0)-x.pts)));
    return`<div class="aw aw-${k}${x.t.wz?' wz':''}"><div class="awh"><span class="awi">${ic}</span><b>${nm}</b></div><a class="awt" href="#team/${x.t.rid}">${esc(x.t.team)}</a>${tag(x.t)}<div class="aws">${st(x)}</div><p class="awr">${esc(line)}</p></div>`}).join('')+'</div>'}
R.recap=async(el,arg)=>{const {lg,T}=await current();const last=+lg.settings.last_scored_leg||0;if(!last){el.innerHTML='<section class="panel"><h2>📰 RECAP</h2><div class="hint">Recaps start after week 1.</div></section>';return}
  const week=Math.min(last,Math.max(1,+arg||last));const rows=Object.values(T).map(t=>({rid:t.rid,team:t.team,joe:t.joe,weasel:t.wz}));
  el.innerHTML=`<section class="panel awp" id="awards"><h2>🏅 WEEK ${week} AWARDS</h2><div id="awb">${SPIN('Engraving the trophies…')}</div></section><section class="panel" id="recap"><h2>📰 WEEK ${week} RECAP</h2><div class="weeks">${Array.from({length:last},(_,i)=>`<a class="wk${i+1===week?' on':''}" href="#recap/${i+1}">WK ${i+1}</a>`).join('')}</div><div id="rb">${SPIN('Writing the roasts…')}</div></section>`;
  const awb=el.querySelector('#awb');weeklyAwards(lg,T,week).then(h=>{awb.innerHTML=h}).catch(()=>{awb.innerHTML='<div class="hint">Awards unavailable right now.</div>'});
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
R.teams=async el=>{const {T}=await current();el.innerHTML=`<section class="panel" id="tlist"><h2>👥 TEAMS</h2>${banner('teams')}<div class="tg">${Object.values(T).sort((a,b)=>a.team.localeCompare(b.team)).map(t=>`<a class="tc${t.wz?' wzc':''}" href="#team/${t.rid}">${t.av?`<img class="av" src="${esc(t.av)}" alt="" loading="lazy" referrerpolicy="no-referrer">`:''}<span><b>${esc(t.team)}</b>${tag(t)}<br><small>@${esc(t.owner)} · ${t.w}-${t.l}</small></span></a>`).join('')}</div></section>`};
// ---- MANAGER TRADING CARD (team pages) ----
const MCR={good:["{T}: certified menace. Collect this card, then hide it from your league mates.","Rookie card energy. {T} is going to cost you a 1st in every trade talk.","{T} wins a lot and lets everyone hear about it. Mint condition ego."],
 mid:["{T}: the .500 card everyone has three of. Still worth a stick of gum.","Holo-foil mediocrity. {T} is never great, never dead, always annoying.","{T} is the card you'd trade in a 3-for-1 and forget about."],
 bad:["{T}: misprint. Factory defect. The card company issued an apology.","This card is worth less than the gum it came with. {T}, buddy.","{T}'s card comes pre-creased. Common, Series 'Rebuild', no resale value."]};
function mgrCard(S,t,at,tr,ro,V){const rid=t.rid,g=at.w+at.l+at.t||1,pct=at.w/g;
  const h={};games(S).forEach(gm=>{for(const [x,y] of [[gm.a,gm.b],[gm.b,gm.a]]){if(x.uid!==t.uid)continue;const r=h[y.uid]=h[y.uid]||{w:0,l:0};if(x.p>y.p)r.w++;else if(y.p>x.p)r.l++}});
  const cur=Object.fromEntries(Object.values(D.cur.T).map(x=>[x.uid,x.team]));const L=Object.entries(h).filter(([u,r])=>r.w+r.l>=2&&cur[u]).map(([u,r])=>({...r,team:cur[u],pct:r.w/(r.w+r.l)}));
  const nem=L.length?[...L].sort((a,b)=>a.pct-b.pct||b.l-a.l)[0]:null;
  const td=tr.map(x=>{const me=x.sides.find(sd=>sd.rid===rid);const ot=x.sides.filter(sd=>sd!==me).sort((a,b)=>b.pts-a.pts)[0];return me&&ot?{x,me,ot,d:me.pts-ot.pts}:null}).filter(Boolean).sort((a,b)=>b.d-a.d);
  const got=sd=>{const a=[...sd.players].sort((p,q)=>q.p-p.p).map(p=>pn(p.pid));sd.picks.forEach(k=>a.push(k.who?pn(k.who):k.s+' R'+k.r));return a.slice(0,2).join(' + ')||'nothing'};
  const best=td.length&&td[0].d>0?td[0]:null,worst=td.length&&td[td.length-1].d<0?td[td.length-1]:null,top=ro[0];
  const tier=pct>=0.58?'good':pct>=0.45?'mid':'bad',line=pickOf(MCR[tier],'mc'+t.uid).replace(/\{T\}/g,t.team);
  const rarity=t.wz?'COMMISH EDITION':at.ttl?'🏆 '+at.ttl+'x CHAMP':pct>=0.58?'RARE':pct>=0.45?'UNCOMMON':'COMMON';
  return`<div class="mcard${t.wz?' wz':''}"><div class="mc-in"><div class="mc-top"><img class="mc-bg" src="${secSrc('teams',720)}" alt="" loading="lazy" decoding="async">${t.av?`<img class="mc-av" src="${esc(t.av)}" alt="" referrerpolicy="no-referrer">`:'<span class="mc-av mc-ph">🏈</span>'}<span class="mc-rar">${rarity}</span><span class="mc-no">#${String(rid).padStart(2,'0')}</span></div>
   <div class="mc-nm">${esc(t.team)}</div><div class="mc-ow">@${esc(t.owner)} · SHADYNASTY ${esc(D.cur.lg.season)}</div>
   <div class="mc-st"><div><b>${at.w}-${at.l}${at.t?'-'+at.t:''}</b><span>ALL-TIME</span></div><div><b>${at.po}</b><span>PLAYOFF TRIPS</span></div><div><b>${Math.round(pct*1000)/10}%</b><span>WIN PCT</span></div></div>
   <dl class="mc-dl"><dt>NEMESIS</dt><dd>${nem?`${esc(nem.team)} <small>(${nem.w}-${nem.l})</small>`:'None yet'}</dd>
   <dt>TOP PLAYER</dt><dd>${top?pn(top)+` <small>${int(V.p[top]||0)}</small>`:'–'}</dd>
   <dt>BEST TRADE</dt><dd>${best?`Got ${got(best.me)} <small>${best.x.season}, +${fmt(best.d)}</small>`:'Never won one'}</dd>
   <dt>WORST TRADE</dt><dd>${worst?`Got ${got(worst.me)} <small>${worst.x.season}, ${fmt(worst.d)}</small>`:'Never got fleeced. Yet.'}</dd></dl>
   <p class="mc-r">${esc(line)}</p></div></div>`}
R.team=async(el,rid)=>{rid=+rid;const {lg,T,tp}=await current();const t=T[rid];if(!t){location.hash='#teams';return}
  el.innerHTML=`<section class="panel">${SPIN()}</section>`;const [S,V]=await Promise.all([all(),values()]);const TV=teamValue(T,V,tp,lg)[rid];
  const pos=['QB','RB','WR','TE','K','DEF'];const ro=[...t.players].sort((a,b)=>(V.p[b]||0)-(V.p[a]||0));
  const at={w:0,l:0,t:0,pf:0,ttl:0,po:0,seasons:[]};for(const s of S){const x=Object.values(s.teams).find(y=>y.uid===t.uid);if(!x)continue;at.w+=x.w;at.l+=x.l;at.t+=x.t;at.pf+=x.pf;if(s.champ===x.rid)at.ttl++;if(s.place[x.rid])at.po++;at.seasons.push([s.season,x.w+'-'+x.l,s.place[x.rid]?'#'+s.place[x.rid]+' (playoffs)':s.done?'missed':'in progress'])}
  const tr=tradeList(S,T,V).filter(x=>x.sides.some(sd=>sd.rid===rid));
  el.innerHTML=`<section class="panel"><div class="th">${t.av?`<img class="av big" src="${esc(t.av)}" alt="" referrerpolicy="no-referrer">`:''}<div><h2>${esc(t.team)}</h2><div class="hint">@${esc(t.owner)}${tag(t)}</div></div></div>
   <div class="stats"><div><b>${t.w}-${t.l}${t.t?'-'+t.t:''}</b><span>${lg.season} record</span></div><div><b>${fmt(t.pf)}</b><span>PF</span></div><div><b>${at.w}-${at.l}</b><span>all-time (reg. season)</span></div><div><b>${at.po}</b><span>playoff trips</span></div><div><b>${at.ttl}</b><span>titles</span></div><div><b>${int(TV.tot)}</b><span>dynasty value</span></div></div>
   ${mgrCard(S,t,at,tr,ro,V)}
   ${rivals(S,t)}
   <h3>ROSTER</h3><div class="tw"><table class="mini"><thead><tr><th>PLAYER</th><th>POS</th><th>NFL</th><th>VALUE</th></tr></thead><tbody>${ro.map(p=>`<tr class="${t.starters.includes(p)?'st':''}"><td>${pn(p)}</td><td>${esc(((PL[p]||{}).p||[])[0]||'')}</td><td>${esc((PL[p]||{}).t||'')}</td><td>${V.p[p]?int(V.p[p]):'–'}</td></tr>`).join('')}</tbody></table></div><div class="hint">Bold = current starters.</div>
   <h3>DRAFT PICKS OWNED</h3><div class="chips">${TV.picks.sort((a,b)=>a.s-b.s||a.r-b.r).map(p=>`<span class="chip">${p.s} R${p.r}${p.o!==rid?` <small>via ${esc(T[p.o].team)}</small>`:''} · ${int(p.v)}</span>`).join('')||'None. Bold.'}</div>
   <h3>SEASON BY SEASON</h3><div class="tw"><table class="mini"><tbody>${at.seasons.map(s=>`<tr><td>${s[0]}</td><td>${s[1]}</td><td>${s[2]}</td></tr>`).join('')}</tbody></table></div>
   <h3>TRADES (${tr.length})</h3>${tr.length>8?fBar('tt',{teams:[...new Map(tr.flatMap(x=>x.sides).filter(sd=>sd.rid!==rid).map(sd=>[String(sd.rid),(T[sd.rid]||{}).team||sd.team])).entries()].sort((a,b)=>a[1].localeCompare(b[1])),teamLabel:'Trade partner',teamAll:'All partners',seasons:seasonsOf(tr),sorts:TSORT,toggles:TTOG,meta:tradeMeta(tr),cmp:TCMP,noun:'trade',none:'No trades match.'}):''}<div data-fl="tt">${tr.map((t,i)=>withI(tradeCard(t),i)).join('')}</div>${tr.length?'':'<div class="hint">Never traded. Commitment or cowardice?</div>'}${credit}</section>`};
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
  return`<article class="trade${lop?' lop':''}"><div class="tdh">${rank?`<span class="rank">#${rank}</span>`:''}${t.season} · WEEK ${t.leg}${mode?` · margin ${int(t.margin)}`:''}${lop?' · <span class="pill red">LOPSIDED</span>':''}</div>${t.sides.map(sd=>`<div class="tside${sd===t.win&&t.gap>0?' win':''}"><div class="tn">${esc(sd.team)} got</div><ul>${(sd.players.map(p=>`<li>${pn(p.pid)} <small>${fmt(p.p)} pts</small></li>`).join('')+sd.picks.map(p=>`<li>${p.s} R${p.r} pick <small>(${esc(p.orig)}’s)</small>${p.who?` → ${pn(p.who)} <small>${fmt(p.p)} pts</small>`:' <small>not drafted yet</small>'}</li>`).join(''))||'<li><small>nothing</small></li>'}</ul><div class="tsc">${fmt(sd.pts)} pts for them since · value now ${int(sd.val)}</div></div>`).join('')}
   <div class="tv">Winning on points: <b>${esc(t.win.team)}</b>${t.sides.length>1?` (+${fmt(t.gap)})`:''} · on current value: <b>${esc(vw.team)}</b></div>${line?`<div class="rl">${line}</div>`:''}</article>`}
// ---- shared list filter (Trade History, team-page trades, Waiver Wire Wins, Worst Drops, Fleece Factory) ----
// fBar(id,o) renders the bar + registers metadata; the list container is <div data-fl="id"> whose children carry data-i.
// fAuto(root) wires every registered bar found under root (called from R.after once the page is in #view). Pure client-side.
const FL={};
function fBar(id,o){const Q=o.Q||{},opt=(v,l,cur)=>`<option value="${esc(v)}"${String(cur||'')===String(v)?' selected':''}>${esc(l)}</option>`;FL[id]=o;
  const r1=(o.teams?`<select data-f="team" aria-label="${esc(o.teamLabel||'Team')}">${opt('',o.teamAll||'All teams',Q.team)}${o.teams.map(([v,l])=>opt(v,l,Q.team)).join('')}</select>`:'')+(o.seasons?`<select data-f="s" aria-label="Season">${opt('','All seasons',Q.s)}${o.seasons.map(x=>opt(x,x,Q.s)).join('')}</select>`:'');
  const r2=`<input data-f="q" type="search" placeholder="${esc(o.ph||'Player or pick')}" value="${esc(Q.q||'')}" autocomplete="off" autocapitalize="off" spellcheck="false">`+(o.sorts?`<select data-f="sort" aria-label="Sort">${o.sorts.map(([v,l])=>opt(v,l,Q.sort||o.sorts[0][0])).join('')}</select>`:'');
  return`<div class="tf" data-tf="${id}">${r1?`<div class="tf-r">${r1}</div>`:''}<div class="tf-r">${r2}</div>${o.toggles?`<div class="tf-r tf-c">${o.toggles.map(([k,l])=>`<button type="button" class="chip${Q[k]?' on':''}" data-f="${k}">${l}</button>`).join('')}</div>`:''}<div class="tf-n"><span data-f="n"></span> <a href="#" data-f="reset">Reset</a></div></div>`}
function fAuto(root){(root||document).querySelectorAll('[data-tf]').forEach(bar=>{const id=bar.getAttribute('data-tf'),o=FL[id];if(!o||bar._w)return;bar._w=1;
  const box=(root||document).querySelector('[data-fl="'+id+'"]');if(!box)return;const els=[...box.querySelectorAll('[data-i]')],M=o.meta.map((m,i)=>({f:{},rids:[],s:'',...m,el:els[i],txt:m.txt||(els[i]?els[i].textContent.toLowerCase():'')})).filter(m=>m.el),total=M.length;
  const g=k=>bar.querySelector('[data-f="'+k+'"]'),tg=[...bar.querySelectorAll('button[data-f]')],none=document.createElement('div'),more=document.createElement('button');
  none.className='hint';none.textContent=o.none||'Nothing matches.';none.style.display='none';more.type='button';more.className='chip tf-more';more.style.display='none';box.parentNode.insertBefore(none,box.nextSibling);box.parentNode.insertBefore(more,none.nextSibling);
  let all=false,last='';const def=o.sorts?o.sorts[0][0]:'';
  const st=()=>{const r={team:g('team')?g('team').value:'',s:g('s')?g('s').value:'',q:g('q').value.trim(),sort:g('sort')?g('sort').value:def};tg.forEach(b=>r[b.getAttribute('data-f')]=b.classList.contains('on')?'1':'');return r};
  const apply=()=>{const S=st(),q=S.q.toLowerCase().split(/\s+/).filter(Boolean),act=S.team||S.s||q.length||tg.some(b=>b.classList.contains('on'));
    if(o.cmp&&S.sort!==last){last=S.sort;const fr=document.createDocumentFragment();[...M].sort(o.cmp[S.sort]||(()=>0)).forEach(m=>fr.appendChild(m.el));box.appendChild(fr)}
    const order=o.cmp?[...M].sort(o.cmp[S.sort]||(()=>0)):M;let n=0,shown=0;
    for(const m of order){const ok=(!S.team||m.rids.includes(S.team))&&(!S.s||m.s===S.s)&&tg.every(b=>!b.classList.contains('on')||m.f[b.getAttribute('data-f')])&&q.every(w=>m.txt.includes(w));
      if(ok)n++;const vis=ok&&(all||act||!o.limit||n<=o.limit);m.el.style.display=vis?'':'none';if(vis)shown++}
    const noun=o.noun||'item',pl=x=>x===1?noun:(o.nouns||noun+'s');g('n').textContent=shown<n?`Top ${shown} of ${n} ${pl(n)}`:`${n} of ${total} ${pl(total)}`;
    more.style.display=shown<n?'':'none';more.textContent=`Show all ${n} ↓`;none.style.display=n?'none':'';if(o.onState)o.onState(S)};
  let tm=0;g('q').addEventListener('input',()=>{clearTimeout(tm);tm=setTimeout(apply,80)});['team','s','sort'].forEach(k=>g(k)&&g(k).addEventListener('change',apply));
  tg.forEach(b=>b.addEventListener('click',()=>{b.classList.toggle('on');apply()}));more.addEventListener('click',()=>{all=true;apply()});
  g('reset').addEventListener('click',e=>{e.preventDefault();['team','s'].forEach(k=>g(k)&&(g(k).value=''));g('q').value='';if(g('sort'))g('sort').value=def;tg.forEach(b=>b.classList.remove('on'));all=false;apply()});apply()})}
const withI=(html,i)=>html.replace(/^(\s*<article)/,'$1 data-i="'+i+'"');
function tradeMeta(L){return L.map(t=>{const sides=t.sides,assets=sides.reduce((a,x)=>a+x.players.length+x.picks.length,0),vs=sides.map(x=>x.val).sort((a,b)=>b-a);
  const txt=sides.map(x=>[x.team,x.cur||'',...x.players.map(p=>(PL[p.pid]||{}).n||''),...x.picks.map(p=>`${p.s} R${p.r} ${p.s} round ${p.r} pick ${p.who?(PL[p.who]||{}).n||'':''}`)].join(' ')).join(' ').toLowerCase();
  return{rids:sides.map(x=>String(x.rid)),s:String(t.season),txt,f:{pk:sides.some(x=>x.picks.length),bb:assets>=3},at:t.at||0,lop:(t.gap||0)+(vs.length>1?(vs[0]-vs[1])/100:0)}})}
const TCMP={new:(a,b)=>b.at-a.at,old:(a,b)=>a.at-b.at,lop:(a,b)=>b.lop-a.lop},TSORT=[['new','Newest'],['old','Oldest'],['lop','Most lopsided']],TTOG=[['pk','🎟️ Involves picks'],['bb','💥 Blockbusters (3+)']];
const seasonsOf=L=>[...new Set(L.map(x=>String(x.season)))].sort((a,b)=>b-a);
R.trades=async (el,arg)=>{el.innerHTML=`<section class="panel">${SPIN('Digging up every trade since 2021…')}</section>`;const [S,V]=await Promise.all([all(),values()]);const {T}=await current();const L=tradeList(S,T,V);
  const Q=Object.fromEntries(new URLSearchParams(arg||'')),seasons=[...new Set(S.map(x=>String(x.season)).concat(L.map(t=>String(t.season))))].sort((a,b)=>b-a),rids=Object.keys(T).sort((a,b)=>T[a].team.localeCompare(T[b].team));
  const opt=(v,l,cur)=>`<option value="${esc(v)}"${String(cur||'')===String(v)?' selected':''}>${esc(l)}</option>`;
  el.innerHTML=dropsPanel(S,V)+`<section class="panel"><h2>🔁 TRADE HISTORY (${L.length})</h2>${banner('trades')}<div class="hint">“Winning” = points the acquired players scored <b>as starters for their new team</b> since the deal (picks count the player drafted with them), plus who holds more FantasyCalc superflex value today.</div>
  ${fBar('th',{teams:rids.map(r=>[r,T[r].team]),seasons,sorts:TSORT,toggles:TTOG,Q,meta:tradeMeta(L),cmp:TCMP,noun:'trade',none:'No trades match. This league is more cowardly than we thought.',onState:st=>{const qs=Object.entries(st).filter(([k,v])=>v&&!(k==='sort'&&v==='new')).map(([k,v])=>k+'='+encodeURIComponent(v)).join('&');try{history.replaceState(null,'','#trades'+(qs?'/'+qs:''))}catch(e){}}})}
  <div id="tl" data-fl="th">${L.map((t,i)=>withI(tradeCard(t),i)).join('')}</div>${credit}</section>`};
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
   <h3>WORST DROPS OF ALL TIME</h3>${dropsList(S,V).slice(0,5).map((d,i)=>dropItem(d,i)).join('')}<div class="hint"><a href="#trades">Full list with filters on Trades →</a></div>
   <h3>LAST-PLACE FINISHES</h3><ol class="rec sh">${lasts.map(x=>`<li>${badge}<div><b>${x.s}</b> ${esc(x.t.team)}${tag(x.t)} <small>@${esc(x.t.owner)} · ${x.t.w}-${x.t.l}</small></div></li>`).join('')}</ol></section>`};
R.arcade=async el=>{const MO='https://morehouse-scores.brettwilson08.workers.dev/scores?board=main&mode=all&limit=5',SC='https://shoey-chug-scores.brettwilson08.workers.dev/scores?board=main&limit=5';
  const card=(href,img,alt,badge,title,blurb,lbT,id,cta)=>`<article class="hl"><a class="hl-im" href="${href}"><img src="img/th/${img}.webp?v=1" width="800" height="500" loading="lazy" decoding="async" alt="${alt}"><i>${badge}</i></a>
    <div class="hl-b"><h3 class="hl-t"><a href="${href}">${title}</a></h3><p class="hl-p">${blurb}</p><h4>${lbT}</h4><div id="${id}" class="hl-lb">${SPIN('Loading the board…')}</div><a class="ktc play" href="${href}">${cta}</a></div></article>`;
  el.innerHTML=`<section class="panel arcade"><h2>🕹️ ARCADE</h2><div class="heads">
  ${card('chug/','chug-800','A white sneaker overflowing with beer','NEW','🍺 SHOEY CHUG','Mash the glowing Chug Zone to drain a beer out of a sneaker in under 15 seconds. Pop the burps, dodge Joe, the ref\u2019s flag and the Commish\u2019s call, or spew all over the cheer squad. One unlucky owner drinks from a stiletto.','FASTEST SHOEYS','sclb','CHUG AND BEAT IT →')}
  ${card(GAME,'mo-800','Mo Morehouse Mo Problems title screen: a crying cartoon GM and the crowned Wilson Weasels final boss card','CLASSIC','🎮 MO MOREHOUSE MO PROBLEMS','Survival shooter. Blast busts, rejected trades and 4th-round picks, catch rare hope off the waiver wire, then face the final boss: the Wilson Weasels.','MO PROBLEMS HIGH SCORES','molb','SURVIVE THE REBUILD →')}
  </div></section>`;
  const nap=(n,h)=>{n.innerHTML=`<div class="hint">Board is napping. <a href="${h}">Open the game</a> to see it.</div>`},ol=(a,f,empty)=>a.length?`<ol class="rec">${a.map(f).join('')}</ol>`:`<div class="hint">${empty}</div>`;
  const sc=el.querySelector('#sclb'),mo=el.querySelector('#molb'),get=u=>fetch(u).then(r=>{if(!r.ok)throw Error(r.status);return r.json()});
  get(SC).then(d=>{sc.innerHTML=ol((d.top||[]).slice(0,5),x=>`<li><b>${(x.ms/1000).toFixed(2)}s</b> ${x.st?'👠 ':''}${esc(x.n)}</li>`,'Nobody has chugged yet. Set the time to beat.')}).catch(()=>nap(sc,'chug/'));
  get(MO).then(d=>{mo.innerHTML=ol((d.top||[]).slice(0,5),x=>`<li><b>${int(x.s)}</b> ${esc(x.n)}</li>`,'No scores yet. Go survive.')}).catch(()=>nap(mo,GAME))};
// ---------------- router ----------------
const TABS=[['home','🏠','HOME'],['recap','📰','RECAP'],['power','⚡','POWER'],['teams','👥','TEAMS'],['trades','🔁','TRADES'],['history','🏛️','HISTORY'],['records','📕','RECORDS'],['shame','🍺','SHAME'],['arcade','🕹️','ARCADE']];
async function route(){const h=(location.hash||'#home').slice(1).split('/'),k=R[h[0]]?h[0]:'home',el=$('#view');
  document.querySelectorAll('#tabs a').forEach(a=>a.classList.toggle('on',a.dataset.k===k||(k==='team'&&a.dataset.k==='teams')));
  const on=document.querySelector('#tabs a.on'),tb=$('#tabs');if(on&&tb){const x=on.offsetLeft-(tb.clientWidth-on.offsetWidth)/2;try{tb.scrollTo({left:Math.max(0,x),behavior:route.navd?'smooth':'auto'})}catch(e){tb.scrollLeft=Math.max(0,x)}route.navd=1}
  if(!el.firstChild||el.dataset.k!==k)el.innerHTML=`<section class="panel">${SPIN()}</section>`;el.dataset.k=k;const tok=route.tok=(route.tok||0)+1;
  const box=document.createElement('div');try{await R[k](box,h[1]);if(tok!==route.tok)return;el.replaceChildren(...box.childNodes);addBanner(k);if(R.after)R.after(k)}
  catch(e){console.warn(e);if(tok===route.tok)el.innerHTML=`<section class="panel">${SHOEY('sm')}<div class="hint">Sleeper fumbled that one (${esc(e.message||e)}). Pull to refresh in a minute.</div></section>`}
  if(h[0]!==route.last){window.scrollTo(0,0);route.last=h[0]}}
function addBanner(k){const b=k==='team'?'teams':k;if(['home','trades','power','draft','shame'].includes(b)||k==='teams'||!SECIMG[b])return;const h=document.querySelector('#view .panel h2');if(!h||document.querySelector('#view .secb'))return;const a=h.parentElement.classList.contains('panel')?h:h.parentElement.closest('.panel>*')||h;a.insertAdjacentHTML('afterend',banner(b))}
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
  // strength of schedule: opponents' season PPG (so far = weeks played, remaining = Sleeper's future matchups)
  const gp=t=>Math.max(1,t.w+t.l+t.t),ppg=rid=>T[rid]?T[rid].pf/gp(T[rid]):0,oppOf=(w,rid)=>{const me=(w||[]).find(m=>m.roster_id===rid);if(!me||me.matchup_id==null)return null;const o=w.find(m=>m.matchup_id===me.matchup_id&&m.roster_id!==rid);return o?o.roster_id:null};
  const sosR=Object.values(T).map(t=>{const past=[],fut=[];M.forEach((w,wi)=>{const o=oppOf(w,t.rid);if(o==null)return;(wi<last?past:fut).push(o)});
    const av=a=>a.length?a.reduce((x,o)=>x+ppg(o),0)/a.length:null,rec=past.reduce((r,o)=>{r[0]+=T[o].w;r[1]+=T[o].l;return r},[0,0]);
    return{t,so:av(past),rem:av(fut),nf:fut.length,rec}}).sort((a,b)=>(b.so||0)-(a.so||0));
  const hasFut=sosR.some(x=>x.nf>0),lgPPG=Object.values(T).reduce((a,t)=>a+ppg(t.rid),0)/Object.keys(T).length;
  const remS=hasFut?[...sosR].filter(x=>x.rem!=null).sort((a,b)=>b.rem-a.rem):[];
  const sr=rng('sos'+last),sP=a=>a[Math.floor(sr()*a.length)];
  const cup=sosR[sosR.length-1],hard=sosR[0],cupR=remS[remS.length-1],hardR=remS[0];
  const sosHTML=!last?'':`<section class="panel sos"><h2>📅 STRENGTH OF SCHEDULE</h2><div class="hint"><b>So far</b> = average season PPG of the opponents each team has already played (their combined record alongside). <b>Left</b> = same for the opponents still on Sleeper's schedule${hasFut?` (weeks ${last+1}–${pws-1})`:''}. League average ${fmt(lgPPG)}/wk. Toughest first.</div>
   <div class="tw"><table><thead><tr><th>#</th><th>TEAM</th><th>SO FAR</th><th class="hs">OPP W-L</th><th>LEFT</th></tr></thead><tbody>${sosR.map((x,i)=>{const d=x.so-lgPPG,rr=hasFut&&x.rem!=null?x.rem-lgPPG:null;return`<tr class="${x.t.wz?'wz':''}"><td>${i+1}</td><td class="tm"><a href="#team/${x.t.rid}">${esc(x.t.team)}</a>${tag(x.t)}<span class="ow">${x===hard?'Toughest slate in the league':x===cup?'🧁 Cupcake schedule':'Opps '+x.rec[0]+'-'+x.rec[1]}</span></td><td class="sv ${d>0?'sh':'se'}">${fmt(x.so)}</td><td class="hs">${x.rec[0]}-${x.rec[1]}</td><td class="sv ${rr==null?'':rr>0?'sh':'se'}">${rr==null?'–':fmt(x.rem)}</td></tr>`}).join('')}</tbody></table></div>
   ${hasFut?'':'<div class="hint">Sleeper hasn\'t posted the remaining matchups yet, so this is season-to-date only.</div>'}
   <div class="sosr"><p>🧁 <b>${esc(cup.t.team)}</b>: ${esc(sP(["Cupcake schedule. Opponents averaging "+fmt(cup.so)+" a week. Every win comes with an asterisk.","Has played the league's JV squad all year ("+fmt(cup.so)+"/wk). Don't print the banner yet.","Easiest schedule in the league. The record is fake and the points are a cry for help."]))}</p>
   <p>🫡 <b>${esc(hard.t.team)}</b>: ${esc(sP(["Toughest slate so far ("+fmt(hard.so)+"/wk from opponents). Genuinely: rough draw, man.","Has seen the league's best every single week. Sympathy, for once.","Opponents averaging "+fmt(hard.so)+". That record deserves a hug, not a roast."]))}</p>
   ${hasFut&&cupR&&hardR?`<p>📆 Rest of the way: <b>${esc(cupR.t.team)}</b> gets the softest road (${fmt(cupR.rem)}/wk); <b>${esc(hardR.t.team)}</b> gets the gauntlet (${fmt(hardR.rem)}/wk).</p>`:''}</div></section>`;
  // "What If" standings: all-play record (vs every team, every week) next to the real one
  const apR={};Object.values(T).forEach(t=>apR[t.rid]=[0,0,0]);M.slice(0,last).forEach(w=>w.forEach(a=>{if(!apR[a.roster_id])return;w.forEach(b=>{if(b.roster_id===a.roster_id)return;const r=apR[a.roster_id];if(a.points>b.points)r[0]++;else if(a.points<b.points)r[1]++;else r[2]++})}));
  const wi=Object.values(T).map(t=>{const r=apR[t.rid],g=r[0]+r[1]+r[2]||1,pct=(r[0]+r[2]/2)/g;return{t,r,pct,d:t.w-pct*gp(t)}}).sort((a,b)=>b.pct-a.pct);
  const luckiest=[...wi].sort((a,b)=>b.d-a.d)[0],unluckiest=[...wi].sort((a,b)=>a.d-b.d)[0],wr=rng('wi'+last),wP=a=>a[Math.floor(wr()*a.length)];
  const wiHTML=!last?'':`<section class="panel whatif"><h2>🔮 WHAT IF: ALL-PLAY STANDINGS</h2><div class="hint">Every team vs every other team, every week: the record you'd have if the schedule didn't exist. <b>Luck</b> = real wins minus all-play expected wins.</div>
   <div class="tw"><table><thead><tr><th>#</th><th>TEAM</th><th>ALL-PLAY</th><th>REAL</th><th>LUCK</th></tr></thead><tbody>${wi.map((x,i)=>`<tr class="${x.t.wz?'wz':''}"><td>${i+1}</td><td class="tm"><a href="#team/${x.t.rid}">${esc(x.t.team)}</a>${tag(x.t)}<span class="ow">${Math.round(x.pct*1000)/10}% vs the field</span></td><td class="sv">${x.r[0]}-${x.r[1]}${x.r[2]?'-'+x.r[2]:''}</td><td class="sv">${x.t.w}-${x.t.l}</td><td class="sv ${x.d>=0.5?'se':x.d<=-0.5?'sh':''}">${x.d>0?'+':''}${x.d.toFixed(1)}</td></tr>`).join('')}</tbody></table></div>
   <div class="sosr"><p>🍀 <b>${esc(luckiest.t.team)}</b> (${luckiest.d>0?'+':''}${luckiest.d.toFixed(1)}): ${esc(wP(["Schedule-fueled fraud. Every week they found the one guy having a worse day.","Living off the schedule maker. Buy a lottery ticket, then give the money back.","The record says contender. The all-play says 'got lucky with who they drew'."]))}</p>
   <p>🪦 <b>${esc(unluckiest.t.team)}</b> (${unluckiest.d>0?'+':''}${unluckiest.d.toFixed(1)}): ${esc(wP(unluckiest.pct>=0.5?["Scores like a playoff team, gets the record of a tanker. The universe owes this man a beer.","Always drawing the week's top scorer. Genuinely cursed.","The all-play says they're good. The real standings say 'lol'. Pour one out."]:["Bad AND unlucky. Even the schedule maker is piling on.","Already bad, somehow robbed on top of it. The fantasy gods are bullies.","The rare double: a weak roster and the worst luck in the league. Brutal."]))}</p></div></section>`;
  const boom=x=>x.cv<0.15?'🧱 STEADY':x.cv<0.22?'🎢 SWINGY':'💣 BOOM/BUST';
  el.innerHTML=`<section class="panel"><h2>🏁 PLAYOFF RACE · AFTER WEEK ${last}</h2><div class="hint">${pt} playoff spots. 3,000 simulated finishes of the real remaining schedule (weeks ${last+1}–${pws-1}), each team scoring like it has so far (shrunk toward the league average). Seeds by wins, then points for. Arrows = playoff-odds change since last week.</div>
   <div class="tw"><table><thead><tr><th></th><th>TEAM</th><th>W-L</th><th>PLAYOFFS</th><th>#1 SEED</th></tr></thead><tbody>${ts.map((t,i)=>`<tr class="${i<pt?'po':''}${t.wz?' wz':''}"><td>${mv(t)}</td><td class="tm"><a href="#team/${t.rid}">${esc(t.team)}</a>${tag(t)}<span class="bar"><i style="width:${Math.round(now[t.rid].po*100)}%"></i></span><span class="ow">${fmt(now[t.rid].mu)}/wk ± ${fmt(now[t.rid].sd)}</span></td><td>${t.w}-${t.l}</td><td><b>${pc(now[t.rid].po)}</b></td><td>${pc(now[t.rid].s1)}</td></tr>`).join('')}</tbody></table></div></section>
  ${sosHTML}${wiHTML}
  <section class="panel"><h2>🍀 LUCK &amp; CONSISTENCY</h2><div class="hint"><b>Luck</b> = actual wins minus all-play expected wins. <b>Schedule</b> = points against vs league average (positive = soft schedule). <b>Bench</b> = season points left on the bench. <b>Style</b> from week-to-week swing.</div>
   <div class="tw"><table><thead><tr><th>#</th><th>TEAM</th><th>LUCK</th><th>SCHED</th><th>BENCH</th><th class="hs">STYLE</th></tr></thead><tbody>${lk.map((x,i)=>`<tr class="${x.t.wz?'wz':''}"><td>${i+1}</td><td class="tm">${esc(x.t.team)}${tag(x.t)}<span class="ow">${x.luck>1?'Horseshoe up somewhere.':x.luck<-1?'Robbed weekly. Pour one out.':'Gets what they deserve.'}</span></td><td class="${x.luck>0?'up':'dn'}">${x.luck>0?'+':''}${x.luck.toFixed(1)}</td><td>${x.sched>0?'+':''}${fmt(x.sched)}</td><td>${fmt(x.bench)}</td><td class="hs">${boom(x)}</td></tr>`).join('')}</tbody></table></div></section>`};
TABS.splice(3,0,['race','🏁','RACE']);$('#tabs').innerHTML=TABS.map(([k,i,n])=>`<a href="#${k}" data-k="${k}"><span>${i}</span>${n}</a>`).join('');
// ---- INJURIES (Race tab): live Injury Report from Sleeper players/nfl (slim injured-only cache, 12h) + all-time "Most Screwed by the Injury Gods" estimate ----
const INJW={Out:1,IR:1,PUP:1,Doubtful:0.75,Questionable:0.35};
// slim 12h cache: injured players league-wide + NFL team for every rostered player (the full file is several MB, too big for localStorage)
async function injuries(ros){const k='sn:inj2';const c=LS.get(k);if(c&&Date.now()-c.at<12*36e5&&(ros||[]).every(p=>c.tm[p]!==undefined))return c;
  const all=await RAWP(),m={},tm={};
  for(const i in all){const p=all[i],s=p&&p.injury_status;if(s&&INJW[s])m[i]=[s,p.injury_body_part||'',p.full_name||((p.first_name||'')+' '+(p.last_name||'')).trim(),p.position||'',p.team||'FA']}
  for(const i of ros||[]){const p=all[i];tm[i]=p&&p.team?p.team:''}
  const o={at:Date.now(),m,tm};LS.set(k,o);return o}
const IRB={top:["{T} is basically fielding a MASH unit. {n} guys down, about {p} pts a week watching from a stretcher.","{T}'s training room has more talent than their starting lineup right now.","The injury gods picked {T} this week. {p} pts a week in street clothes."],
 mid:["{T} is limping, not dead. Yet.","{T} has a couple guys on the injury report and a GM who will blame them for everything."],
 none:["Fully healthy. {T} has no excuses left. None."]};
const IGR={tm:["{T}: {w} starter-weeks lost, ~{p} pts gone. Somebody check the trainer's credentials.","{T} has spent more time in the injury tent than the playoffs.","{T} has buried more starters than a 1990s Raiders GM.","Injury gods have {T} on speed dial. ~{p} pts gone up in smoke."],
 season:["{T} in {s}: ~{p} pts lost to the tent. That season never stood a chance.","{s} {T}: not a fantasy team, a waiting room."],
 blow:["{P} went down for {w} week(s) and took ~{p} of {T}'s points with him.","Losing {P} cost {T} about {p} points. The sound you hear is a grown man crying.","{T} drafted {P} and the injury gods said 'lol no'."]};
function injuryGods(S,T){const out={by:{},seasons:[],blows:[]},uidName=Object.fromEntries(Object.values(T).map(t=>[t.uid,t.team]));
  for(const s of S){if(!s.sp)continue;const reg=Math.min(s.last,(s.pws||15)-1);
    const moved={};for(const t of s.trades||[])for(const [pid,rid] of Object.entries(t.adds||{}))for(const r of t.rids)if(String(r)!==String(rid))(moved[r+'|'+pid]=moved[r+'|'+pid]||[]).push(t.leg);
    for(const d of s.drops||[])(moved[d.rid+'|'+d.pid]=moved[d.rid+'|'+d.pid]||[]).push(d.leg);
    for(const rid in s.sp){const tm=s.teams[rid]||{},uid=tm.uid||'r'+rid,name=uidName[uid]||tm.team||'Team '+rid;let segP=0,segW=0;
      for(const pid in s.sp[rid]){const wk={};for(const [w,p] of s.sp[rid][pid])wk[w]=p;const mv=moved[rid+'|'+pid]||[];
        let w=5;while(w<=reg){const prior=[w-4,w-3,w-2,w-1].filter(x=>wk[x]>0);if(prior.length<3||!(wk[w]===undefined||wk[w]===0)){w++;continue}
          const avg=prior.reduce((a,x)=>a+wk[x],0)/prior.length;if(avg<10){w++;continue}
          let e=w;while(e<=reg&&!(wk[e]>0))e++;const lost=e-w,back=e<=reg;if(mv.some(l=>l>=w-1&&l<=e)){w=e+1;continue}   // traded or dropped: not an injury
          const startedZero=wk[w]===0;if(lost<2&&!startedZero){w=e+1;continue}   // a single missing week is probably a bye
          if(!back&&lost>8){w=e+1;continue}   // vanished for the rest of the year without a return: too ambiguous
          const p=avg*lost,b={uid,name,season:s.season,pid,w,lost,p,avg};out.blows.push(b);segP+=p;segW+=lost;
          const a=out.by[uid]=out.by[uid]||{uid,name,p:0,w:0,n:0};a.p+=p;a.w+=lost;a.n++;w=e+1}}
      if(segP)out.seasons.push({uid,name,season:s.season,p:segP,w:segW})}}
  out.board=Object.values(out.by).sort((a,b)=>b.p-a.p);out.seasons.sort((a,b)=>b.p-a.p);out.blows.sort((a,b)=>b.p-a.p);out.blows=out.blows.slice(0,10);out.seasons=out.seasons.slice(0,5);delete out.by;return out}
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
  el.innerHTML=`<section class="panel"><h2>🧶 THE FLEECE FACTORY</h2><div class="hint"><b>Blockbusters only.</b> Every idea has at least one top-60 superflex asset or a 1st on <b>each</b> side, comes as 2-for-1, 2-for-2 or 3-for-2, lands within 10% on FantasyCalc value and fills a real weak spot (same idea as the <a href="#teams">Positional Strength</a> heatmap on Teams). Contenders buy proven vets with youth and picks; rebuilders cash vets in. Suggestions from public values only.</div>${ktcBtn}
  ${fBar('ff',{teams:[...order].sort((a,b)=>a.team.localeCompare(b.team)).map(t=>[String(t.rid),t.team]),teamAll:'Any team',teamLabel:'Involves team',ph:'Player, pick or position',meta:order.map(t=>({rids:[String(t.rid),...sug[t.rid].map(c=>String(c.u.rid))],s:''})),noun:'team',none:'No deals match. Try a different name.'})}<div data-fl="ff">${order.map((t,ti)=>{const A=info[t.rid];return`<article data-i="${ti}" class="fl"><div class="pn"><a href="#team/${t.rid}">${esc(t.team)}</a> <span class="pill ${A.mode==='CONTENDER'?'gold':A.mode==='REBUILDER'?'':'pink'}">${A.mode}</span></div>
    <div class="ps">Core age ${A.age.toFixed(1)} · strong: ${A.surplus.map(k=>`${k} ${Math.round(A.ratio[k]*100)}%`).join(', ')||'nothing, lol'} · weak: ${A.need.map(k=>`${k} ${Math.round(A.ratio[k]*100)}%`).join(', ')}</div>
    ${sug[t.rid].length?sug[t.rid].map(c=>`<div class="deal"><div class="dl"><span>${esc(t.team)} gets · ${int(c.gv)}</span><ul>${c.get.map(x=>`<li>${lab(x)}</li>`).join('')}</ul></div><div class="dl"><span>${esc(c.u.team)} gets · ${int(c.v)}</span><ul>${c.give.map(x=>`<li>${lab(x)}</li>`).join('')}</ul></div><div class="rl">${pitch(t,c)}</div></div>`).join(''):'<div class="hint">No blockbuster fits right now. Either the roster is perfect or nobody wants your guys. (It’s the second one.)</div>'}</article>`}).join('')}</div>${credit}</section>`};
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
function dropsPanel(S,V){const L=dropsList(S,V).slice(0,30),cur=D.cur?D.cur.T:{};const tms=[...new Map(L.map(d=>[String(d.rid),(cur[d.rid]||{}).team||d.team])).entries()].sort((a,b)=>a[1].localeCompare(b[1]));
  return`<section class="panel"><h2>🗑️ WORST DROPS OF ALL TIME</h2><div class="hint">Waiver and free-agent drops since ${S[0].season}, ranked by starter points the player scored for <b>other</b> teams after the drop + current FantasyCalc value ÷ 25.</div>${banner('drops')}
  ${fBar('wd',{teams:tms,seasons:seasonsOf(L),sorts:[['worst','Worst first'],['new','Newest']],ph:'Player',meta:L.map(d=>({rids:[String(d.rid)],s:String(d.season),txt:[d.team,d.to||'',(PL[d.pid]||{}).n||''].join(' ').toLowerCase(),sc:d.score,at:+d.season*100+d.leg})),cmp:{worst:(a,b)=>b.sc-a.sc,new:(a,b)=>b.at-a.at},limit:10,noun:'drop',none:'No drops match. Clean hands, for once.'})}
  <div data-fl="wd">${L.map((d,i)=>withI(dropItem(d,i),i)).join('')}</div></section>`}

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
const BOARD27=[["Jeremiah Smith", "WR", "Ohio State"], ["Dante Moore", "QB", "Oregon"], ["Arch Manning", "QB", "Texas"], ["Darian Mensah", "QB", "Miami"], ["Trinidad Chambliss", "QB", "Ole Miss"], ["Jadan Baugh", "RB", "Florida"], ["Kewan Lacy", "RB", "Ole Miss"], ["Cam Coleman", "WR", "Texas"], ["Charlie Becker", "WR", "Indiana"], ["Jamari Johnson", "TE", "Oregon"], ["Drew Mestemaker", "QB", "Oklahoma State"], ["CJ Carr", "QB", "Notre Dame"], ["Julian Sayin", "QB", "Ohio State"], ["KJ Duff", "WR", "Rutgers"], ["Ahmad Hardy", "RB", "Missouri"], ["Ryan Coleman-Williams", "WR", "Alabama"], ["Nick Marsh", "WR", "Indiana"], ["Trey'Dez Green", "TE", "LSU"], ["Jayden Maiava", "QB", "USC"], ["Nate Frazier", "RB", "Georgia"], ["LaNorris Sellers", "QB", "South Carolina"], ["Reed Harris", "WR", "Arizona State"], ["Bryant Wesco Jr.", "WR", "Clemson"], ["Mark Fletcher Jr.", "RB", "Miami"], ["Antwan Raymond", "RB", "Rutgers"]];
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
   ${picks.map((p,k)=>`${k===0||k===12?`<h3>ROUND ${p.r}</h3>`:''}<article class="dp${k===0?' first':''}"><div class="dn">${p.r}.${String(p.n).padStart(2,'0')}</div><div class="db"><div class="dpp">${esc(BOARD27[k][0])} <small>${BOARD27[k][1]} · ${esc(BOARD27[k][2])}</small></div><div class="dt"><a href="#team/${p.o.rid}">${esc(p.o.team)}</a>${p.o.rid!==p.orig.rid?` <small>(via ${esc(p.orig.team)})</small>`:''}</div><div class="rl">${line(p,k)}</div>${k===0?photo('draft','THE 1.01. THE SQUAD SAW THIS COMING.'):''}</div></article>`).join('')}${tb213(lg,T,seeds,pt)}</section>`};
// ---- THE TRAINER'S ROOM (Power tab, lazy): live Injury Report + Bye Week Hell. ALL-TIME INJURY GODS lives on History. ----
// 2026 NFL bye weeks, from the NFL's official schedule release (https://www.nfl.com/_amp/2026-nfl-schedule-release-every-team-bye-week),
// cross-checked with FOX Sports' 2026 bye list. No byes in weeks 1-4, 12, 15-18. Keys are Sleeper team abbreviations.
const BYE26={CAR:5,KC:5,CIN:6,DET:6,MIA:6,MIN:6,BUF:7,JAX:7,LAC:7,WAS:7,HOU:8,NO:8,NYG:8,SF:8,PIT:9,TEN:9,CHI:10,DEN:10,PHI:10,TB:10,ATL:11,CLE:11,GB:11,LAR:11,NE:11,SEA:11,BAL:13,IND:13,LV:13,NYJ:13,ARI:14,DAL:14};
const BWH={top:["{T} has {n} starters on bye and a GM who forgot what a calendar is. ~{p} pts in sweatpants this week.","Bye week hell, starring {T}. ~{p} pts sitting on a couch. Start your backup kicker, maybe.","{T} built a roster where everybody takes the same week off. That's not strategy, that's a group chat."],
 up:["{T}: week {w} is a funeral. {n} starters out, ~{p} pts gone. Plan now or cry later."]};
function likelyStarters(slots,pids,avg,P){const left=new Set(pids),out=new Set(),order=slots.map(s=>({s,e:ELIG[s]||[s]})).sort((a,b)=>a.e.length-b.e.length);
  for(const o of order){let best=null,bp=-1;for(const id of left){const p=P[id];const v=avg(id);if(p&&p.p.some(x=>o.e.includes(x))&&v>bp){bp=v;best=id}}if(best){left.delete(best);out.add(best)}}return out}
function godsHTML(){return`<section class="panel"><h2>⚰️ MOST SCREWED BY THE INJURY GODS</h2><div class="hint"><b>Estimate</b> based on scoring gaps, not official injury reports: a regular starter (3+ starts in the prior 4 weeks, 10+ pts avg) who suddenly vanishes from the lineup for 2+ weeks (or starts and scores 0) counts as hurt. Points lost = weeks missed × his prior average. Trades and drops are excluded; byes and benchings can sneak in.</div><div id="injg">${SPIN('Counting the bodies since 2021…')}</div></section>`}
async function fillGods(ng,S,T){const r=(arr,key,x)=>pickOf(arr,key).replace(/\{(\w+)\}/g,(m,k)=>x[k]!=null?`<b>${esc(x[k])}</b>`:m);
  const k='sn:igods1',sig=S.map(s=>s.season+':'+s.last).join(',');let G=LS.get(k);if(!G||G.sig!==sig){G={sig,...injuryGods(S,T)};LS.set(k,G)}
  const ids=G.blows.map(b=>b.pid).filter(p=>!PL[p]);if(ids.length)Object.assign(PL,await playersFor(ids));
  ng.innerHTML=G.board.length?`<h3>ALL-TIME (BY MANAGER)</h3><ol class="rec ig">${G.board.map((a,i)=>`<li><div><b>~${int(a.p)}</b> pts lost · ${esc(a.name)} <small>${a.w} starter-weeks · ${a.n} injuries</small>${i<3?`<div class="rl">${r([IGR.tm[(i+G.sig.length)%IGR.tm.length]],'ig'+a.uid,{T:a.name,w:a.w,p:int(a.p)})}</div>`:''}</div></li>`).join('')}</ol>
    ${G.seasons.length?`<h3>WORST SINGLE SEASON</h3><ol class="rec ig">${G.seasons.map((x,i)=>`<li><div><b>~${int(x.p)}</b> pts · ${esc(x.name)} <small>${x.season} · ${x.w} starter-weeks</small>${i===0?`<div class="rl">${r(IGR.season,'igs'+x.uid+x.season,{T:x.name,s:x.season,p:int(x.p)})}</div>`:''}</div></li>`).join('')}</ol>`:''}
    ${G.blows.length?`<h3>WORST SINGLE INJURY BLOW</h3><ol class="rec ig">${G.blows.slice(0,5).map((x,i)=>`<li><div><b>~${int(x.p)}</b> pts · ${pn(x.pid)} <small>${esc(x.name)} · ${x.season} wk ${x.w}${x.lost>1?'–'+(x.w+x.lost-1):''} · ${x.lost} wk × ${fmt(x.avg)}</small>${i===0?`<div class="rl">${r(IGR.blow,'igb'+x.pid+x.season,{T:x.name,P:(PL[x.pid]||{}).n||'Player '+x.pid,w:x.lost,p:int(x.p)})}</div>`:''}</div></li>`).join('')}</ol>`:''}`
    :'<div class="hint">No clear injury gaps found. Either everyone is healthy or everyone is lying.</div>'}
function trainerHTML(){return`<section class="panel trainer"><h2>🩹 THE TRAINER'S ROOM</h2><div class="hint">Who's in street clothes this week: Sleeper injury tags (Out, IR, PUP, Doubtful, Questionable) plus NFL byes. Production = each player's average this season (or a dynasty-value guess if he hasn't scored). Likely starters (best lineup by average) count full, bench guys 25%. Injury weights: Out/IR/PUP 100%, Doubtful 75%, Questionable 35%.</div><div id="trn">${SPIN('Checking the training room…')}</div></section>`}
async function fillTrainer(nd){const {lg,T,state}=await current();const r=(arr,key,x)=>pickOf(arr,key).replace(/\{(\w+)\}/g,(m,k)=>x[k]!=null?`<b>${esc(x[k])}</b>`:m);
  const wk=Math.max(1,+(state&&(state.display_week||state.week))||1),last=+lg.settings.last_scored_leg||0,slots=(lg.roster_positions||[]).filter(s=>!['BN','IR','TAXI'].includes(s));
  const ros=[...new Set(Object.values(T).flatMap(t=>t.players||[]))];
  const [IN,V,P,M]=await Promise.all([injuries(ros),values().catch(()=>({p:{}})),playersFor(ros),pool(Array.from({length:last},(_,k)=>()=>jc('league/'+LEAGUE+'/matchups/'+(k+1)).catch(()=>[])),8)]);
  const IM=IN.m,TM=IN.tm||{},A={};M.forEach(w=>w.forEach(m=>{const pp=m.players_points||{};for(const pid in pp){const v=+pp[pid]||0;if(v>0){const a=A[pid]=A[pid]||[0,0];a[0]+=v;a[1]++}}}));
  const avg=p=>A[p]?A[p][0]/A[p][1]:Math.min(16,(V.p[p]||0)/450),est=p=>!A[p],team=p=>TM[p]||(P[p]||{}).t||'',nm=p=>(P[p]||{}).n||'Player '+p;
  const lastWk=Math.max(...Object.values(BYE26)),weeks=[];for(let w=wk+1;w<=lastWk;w++)if(Object.values(BYE26).includes(w))weeks.push(w);
  const rows=Object.values(T).map(t=>{const ls=likelyStarters(slots,t.players||[],avg,P),wt=p=>ls.has(p)?1:0.25;
    const bye=(t.players||[]).filter(p=>BYE26[team(p)]===wk).map(p=>({p,s:ls.has(p),x:avg(p)*wt(p)})).sort((a,b)=>b.x-a.x);
    const hurt=(t.players||[]).filter(p=>IM[p]&&BYE26[team(p)]!==wk).map(p=>({p,i:IM[p],s:ls.has(p),x:avg(p)*INJW[IM[p][0]]*wt(p)})).sort((a,b)=>b.x-a.x);
    const fut=weeks.map(w=>{const o=[...ls].filter(p=>BYE26[team(p)]===w);return{w,n:o.length,pts:o.reduce((a,p)=>a+avg(p),0),o}});const worst=fut.slice().sort((a,b)=>b.pts-a.pts)[0];
    return{t,bye,hurt,bx:bye.reduce((a,b)=>a+b.x,0),ix:hurt.reduce((a,b)=>a+b.x,0),fut,worst}}).map(o=>({...o,x:o.bx+o.ix})).sort((a,b)=>b.x-a.x);
  const pill=s=>`<span class="pill${s==='Questionable'?'':' red'}">${esc(s)}</span>`,ln=(h,tag2)=>`<div class="ip">${h.s?'⭐ ':''}<b>${esc(nm(h.p))}</b> ${tag2} <small>${fmt(avg(h.p))}${est(h.p)?'*':''}/wk</small></div>`;
  const w0=rows[0],maxPts=Math.max(1,...rows.flatMap(o=>o.fut.map(f=>f.pts)));
  const heat=weeks.length?`<div class="tw"><table class="heat"><thead><tr><th>TEAM</th>${weeks.map(w=>`<th>${w}</th>`).join('')}</tr></thead><tbody>${rows.slice().sort((a,b)=>(b.worst?b.worst.pts:0)-(a.worst?a.worst.pts:0)).map(o=>`<tr><td class="tm">${esc(o.t.team)}</td>${o.fut.map(f=>`<td style="background:rgba(227,38,46,${(f.pts/maxPts*0.85).toFixed(2)})" title="${f.n} starters, ${fmt(f.pts)} pts">${f.n||''}</td>`).join('')}</tr>`).join('')}</tbody></table></div><div class="hint">Likely starters on bye per remaining week; redder = more points out.</div>`:'';
  nd.innerHTML=`<h3>THIS WEEK (WEEK ${wk}): POINTS SIDELINED</h3><ol class="rec inj">${rows.map((o,i)=>`<li><div class="ih"><b>${fmt(o.x)}</b> pts sidelined · <span>${esc(o.t.team)}</span><small class="sub">${fmt(o.bx)} on bye · ${fmt(o.ix)} hurt</small></div>
    ${o.bye.length||o.hurt.length?`<div class="ipl">${o.bye.slice(0,4).map(h=>ln(h,'<span class="pill bye">BYE</span>')).join('')}${o.hurt.slice(0,4).map(h=>ln(h,pill(h.i[0])+' '+esc(h.i[1]||''))).join('')}${o.bye.length+o.hurt.length>8||o.bye.length>4||o.hurt.length>4?`<div class="ip"><small>+${Math.max(0,o.bye.length-4)+Math.max(0,o.hurt.length-4)} more on the trainer's table</small></div>`:''}</div>`:'<div class="ip"><small>Fully healthy and nobody on bye. No excuses.</small></div>'}
    ${i===0&&o.x>0?`<div class="rl">${r(o.bye.filter(b=>b.s).length?BWH.top:IRB.top,'bw'+o.t.rid+wk,{T:o.t.team,n:o.bye.filter(b=>b.s).length||o.hurt.length,p:fmt(o.x)})}</div>`:''}</li>`).join('')}</ol>
    <div class="hint">⭐ = likely starter. * = hasn't scored this season, guessed from dynasty value.</div>
    <h3>🔥 BYE WEEK HELL: WORST WEEK AHEAD</h3>${weeks.length?`<ol class="rec ig">${rows.filter(o=>o.worst).sort((a,b)=>b.worst.pts-a.worst.pts).map((o,i)=>`<li><div><b>Week ${o.worst.w}</b>: ${o.worst.n} starter${o.worst.n===1?'':'s'} out, ~${int(o.worst.pts)} pts · ${esc(o.t.team)}<small>${o.worst.o.map(p=>esc(nm(p))).join(', ')||'nobody'}</small>${i===0&&o.worst.n?`<div class="rl">${r(BWH.up,'bu'+o.t.rid+wk,{T:o.t.team,w:o.worst.w,n:o.worst.n,p:int(o.worst.pts)})}</div>`:''}</div></li>`).join('')}</ol>${heat}`:'<div class="hint">No byes left this season. Every excuse from here on is a lie.</div>'}`;
  return w0}
{const _pw=R.power;R.power=async el=>{await _pw(el);el.insertAdjacentHTML('beforeend',trainerHTML());const n=el.querySelector('#trn');
  setTimeout(()=>fillTrainer(n).catch(e=>{n.innerHTML=`<div class="hint">The trainer's room is locked (${esc(e.message||e)}). Try again in a bit.</div>`}),0)};
 const _hi=R.history;R.history=async el=>{await _hi(el);el.insertAdjacentHTML('beforeend',godsHTML());const n=el.querySelector('#injg');
  Promise.all([all(),current()]).then(([S,c])=>fillGods(n,S,c.T)).catch(e=>{n.innerHTML=`<div class="hint">Sleeper fumbled the injury history (${esc(e.message||e)}).</div>`})}}
// ---- TOILET BOWL + the supplemental 2.13 ----
// League rule: the Toilet Bowl champ (winner of Sleeper's losers/consolation bracket, p=1; winners advance) earns a supplemental 2.13
// rookie pick. Sleeper can't do one-off picks, so the Commish parks "Tim Tebow" (Sleeper id 559) on the champ's roster and swaps in the
// real rookie mid-draft. Trophy names: Sleeper league.metadata.trophy_loser_banner_text wins when present; this map is the fallback.
const TOILET_BOWL_TROPHY={2021:'THE APPLEBEES SUPPLEMENTAL DRAFT PICK BONER BOWL PRESENTED BY MAZDA ®',2022:'Arby’s Supplemental 2.13 Draft Pick Boner Bowl Presented by FTX ®',
  2023:'Dunder Mifflin Celebrity Rabies Awareness for the Cure Toilet Bowl Champion',2024:'The Zoolander Bowl for Teams Who Can’t Play Good',
  2025:'Preparation H® “Ring of Fire” SHADYNASTY Toilet Trophy ft. Pepto-Bismol',2026:'Polymarket "Market Says You\'re Cooked: 99.7% Yes" 2.13 Toilet Bowl'};
const TB_TBA='Trophy name TBA by the Commish';
// What each champ took with the 2.13 (rookie draft the following May), from Sleeper commissioner transactions: Tebow parked on the
// champ's roster after the season, then a commish add of the rookie on draft day. 2023's champ dropped Tebow himself and no
// draft-window commish add exists. Brett confirms the pick was used: BigDitka35 grabbed it as a free agent right after the 2024 draft
// (ended 5/24/24). Brett says it was neither of the 5/26/24 FA adds (Jaheim Bell, Cade Stover); he's researching it.
const TB_PICK={2021:'8130',2022:'10857',2023:'Will Shipley',2024:'12499',2025:'13278'};
const tbName=(season,lg)=>{const m=lg&&lg.metadata&&lg.metadata.trophy_loser_banner_text;const v=m||TOILET_BOWL_TROPHY[season];return v&&v!=='TBD'?v:''};
const TBR={champ:["{T} won the {Y} Toilet Bowl. Best of the worst, and they want a parade for it.","{T}: champion of the losers. The 2.13 is the participation trophy with upside.","{T} ran the table in the bracket nobody watches. Somebody get this man a plunger with a ribbon on it.","{T} won the consolation bracket like it was the Super Bowl. That's the energy we need.","{T}: {Y} Toilet Bowl champ. Peaked in the bracket where the prize is a plaque shaped like a toilet seat."],
 out:["{T} is out of the title hunt. Season over, shoey on deck.","{T} got bounced. Clean out your locker and your browser history.","{T}: eliminated. The dynasty is now a 'dynasty'."],
 tbout:["{T} lost in the Toilet Bowl. Can't even win the losers bracket.","{T} got flushed. Not even good at being bad.","{T} is out of the Toilet Bowl. There is no lower floor. They found one anyway."]};
function tb213(lg,T,seeds,pt){const nxt=BOARD27[24],non=seeds.slice(pt);const c=D.tbChamp&&T[D.tbChamp]?T[D.tbChamp]:non[0];if(!c||!nxt)return'';
  return`<h3>SUPPLEMENTAL</h3><article class="dp tbp"><div class="dn">2.13</div><div class="db"><div class="dpp">${esc(nxt[0])} <small>${nxt[1]} · ${esc(nxt[2])}</small></div><div class="dt"><span class="pill tb">🚽 TOILET BOWL CHAMP</span> <a href="#team/${c.rid}">${esc(c.team)}</a> <small>(${D.tbChamp?'won it':'projected: best record outside the playoff spots'})</small></div><div class="rl">The Commish parks Tim Tebow on the winner's roster and swaps in the real pick mid-draft. Win the bracket nobody watches, get a free 2nd.</div></div></article>`}
function bracketHTML(br,T,sc,pws,kind){const rounds={};br.forEach(m=>(rounds[m.r]=rounds[m.r]||[]).push(m));const nm=rid=>rid&&T[rid]?esc(T[rid].team):'';
  const lab=m=>m.p===1?(kind==='tb'?'🚽 TOILET BOWL FINAL':'🏆 CHAMPIONSHIP'):m.p?(kind==='tb'?'Consolation · ':'')+m.p+(m.p===3?'rd':'th')+' place':'';
  const from=(f)=>f?(f.w?'Winner of M'+f.w:'Loser of M'+f.l):'TBD';
  return Object.keys(rounds).sort((a,b)=>a-b).map(r=>{const wk=pws+(+r)-1,S=sc[wk]||{};return`<div class="br-r"><h4>ROUND ${r} · WEEK ${wk}</h4>${rounds[r].sort((a,b)=>(a.p||0)-(b.p||0)||a.m-b.m).map(m=>{
    const row=(rid,f)=>`<div class="br-t${m.w&&m.w===rid?' w':m.w&&rid&&m.w!==rid?' l':''}"><span>${rid?nm(rid):`<i>${from(f)}</i>`}</span><b>${rid&&S[rid]!=null?fmt(S[rid]):''}</b></div>`;
    return`<div class="br-m${m.p===1?' fin':''}"><div class="br-h">M${m.m}${lab(m)?' · '+lab(m):''}</div>${row(m.t1,m.t1_from)}${row(m.t2,m.t2_from)}</div>`}).join('')}</div>`}).join('')}
async function playoffsHTML(lg,T,live){const id=lg.league_id,pws=+lg.settings.playoff_week_start||15,g=live?j:jc;
  const [wb,lb]=await Promise.all([g('league/'+id+'/winners_bracket').catch(()=>[]),g('league/'+id+'/losers_bracket').catch(()=>[])]);if(!(wb||[]).length&&!(lb||[]).length)return'';
  const last=+lg.settings.last_scored_leg||0,sc={};await Promise.all([0,1,2].map(async k=>{const wk=pws+k;if(wk>Math.max(last+1,pws))return;const M=await (wk<=last?jc:j)('league/'+id+'/matchups/'+wk).catch(()=>[]);sc[wk]={};M.forEach(m=>sc[wk][m.roster_id]=+m.points||0)}));
  const fin=(lb||[]).find(m=>m.p===1&&m.w),ch=fin&&T[fin.w],name=tbName(lg.season,lg),r=rng('tb'+lg.season);
  const outs=[];(wb||[]).forEach(m=>{if(m.l&&!m.p&&T[m.l])outs.push(pickOf(TBR.out,'o'+m.l+lg.season).replace(/\{T\}/g,T[m.l].team))});(lb||[]).forEach(m=>{if(m.l&&!m.p&&T[m.l])outs.push(pickOf(TBR.tbout,'t'+m.l+lg.season).replace(/\{T\}/g,T[m.l].team))});
  return`<section class="panel tbowl"><h2>🚽 THE ${lg.season} TOILET BOWL</h2><div class="tb-ban${name?'':' tba'}">${esc(name||TB_TBA)}</div>
   <div class="tb-prize">🏅 Prize: the <b>supplemental 2.13</b> in the ${+lg.season+1} rookie draft</div>
   ${ch?`<div class="tb-ch">👑 <b>${esc(ch.team)}</b> wins the Toilet Bowl. <span>${esc(pickOf(TBR.champ,'c'+lg.season).replace(/\{T\}/g,ch.team).replace(/\{Y\}/g,lg.season))}</span></div>`:''}
   <div class="br">${bracketHTML(lb||[],T,sc,pws,'tb')}</div></section>
   <section class="panel"><h2>🏆 ${lg.season} PLAYOFFS</h2><div class="br">${bracketHTML(wb||[],T,sc,pws,'po')}</div>
   ${outs.length?`<h3>ELIMINATED</h3><ul class="tb-out">${outs.map(o=>`<li class="rl">${esc(o)}</li>`).join('')}</ul>`:''}</section>`}
function tbTeaser(lg,T,pt){const seeds=Object.values(T).sort((a,b)=>b.w-a.w||b.pf-a.pf),non=seeds.slice(pt),cut=seeds[pt-1],name=tbName(lg.season,lg);if(!non.length)return'';
  return`<section class="panel tbowl"><h2>🚽 TOILET BOWL RACE: WHO'S PLAYING FOR THE 2.13</h2><div class="tb-ban${name?'':' tba'}">${esc(name||TB_TBA)}</div>
   <div class="hint">If the season ended today, these ${non.length} miss the playoffs and fall into the Toilet Bowl (winners advance; the champ earns the supplemental <b>2.13</b>). The top two get first-round byes. Bracket goes live here once the playoffs start (week ${+lg.settings.playoff_week_start||15}).</div>
   <ol class="rec tbr">${non.map((t,i)=>`<li class="${t.wz?'wz':''}"><div><b>${i+pt+1}.</b> <a href="#team/${t.rid}">${esc(t.team)}</a>${tag(t)} <small>${t.w}-${t.l}${t.t?'-'+t.t:''} · ${fmt(t.pf)} PF${cut?` · ${cut.w-t.w>0?(cut.w-t.w)+' GB of #'+pt:'tied with #'+pt}`:''}</small>${i<2?' <span class="pill tb">BYE</span>':''}</div></li>`).join('')}</ol></section>`}
{const _rc=R.race;R.race=async(el,arg)=>{const c=await current(),lg=c.lg,pt=+lg.settings.playoff_teams||6;
  if(arg&&/^\d{4}$/.test(arg)&&arg!==String(lg.season)){const L=(await chain()).find(x=>String(x.season)===arg);if(!L){location.hash='#race';return}el.innerHTML=`<section class="panel">${SPIN('Unclogging the archives…')}</section>`;
    const [u,r]=await Promise.all([jc('league/'+L.league_id+'/users'),jc('league/'+L.league_id+'/rosters')]);const h=await playoffsHTML(L,teamsOf(u,r),false);el.innerHTML=(h||'<section class="panel"><div class="hint">No bracket for that season.</div></section>')+`<section class="panel"><a class="kt" href="#race">← Back to the ${esc(lg.season)} race</a></section>`;return}
  await _rc(el,arg);const last=+lg.settings.last_scored_leg||0,pws=+lg.settings.playoff_week_start||15,on=lg.status==='post_season'||lg.status==='complete'||last>=pws-1;
  if(!on){const f=el.querySelector('section.panel');if(f)f.insertAdjacentHTML('afterend',tbTeaser(lg,c.T,pt));else el.insertAdjacentHTML('afterbegin',tbTeaser(lg,c.T,pt));return}
  el.insertAdjacentHTML('afterbegin','<div id="tbx">'+`<section class="panel">${SPIN('Plunging the brackets…')}</section>`+'</div>');const x=el.querySelector('#tbx');
  playoffsHTML(lg,c.T,true).then(h=>{x.innerHTML=h||tbTeaser(lg,c.T,pt)}).catch(()=>{x.innerHTML=tbTeaser(lg,c.T,pt)})}}
// History: Toilet Bowl Hall of Fame (every completed season: trophy name, champ, record, what they took with the 2.13)
async function tbHall(T){const L=(await chain()).filter(l=>l.status==='complete').sort((a,b)=>a.season-b.season);const cur=Object.fromEntries(Object.values(T).map(t=>[t.uid,t]));
  const rows=await Promise.all(L.map(async l=>{const [lb,u,r]=await Promise.all([jc('league/'+l.league_id+'/losers_bracket').catch(()=>[]),jc('league/'+l.league_id+'/users'),jc('league/'+l.league_id+'/rosters')]);
    const f=(lb||[]).find(m=>m.p===1&&m.w);if(!f)return null;const tm=teamsOf(u,r)[f.w];if(!tm)return null;return{season:l.season,name:tbName(l.season,l),tm,now:cur[tm.uid],pick:TB_PICK[l.season]}}));
  const H=rows.filter(Boolean).reverse();if(!H.length)return'';const ids=H.map(h=>h.pick).filter(p=>p&&/^\d+$/.test(p)&&!PL[p]);if(ids.length)Object.assign(PL,await playersFor(ids));
  return`<section class="panel tbowl"><h2>🚽 TOILET BOWL HALL OF FAME</h2><div class="hint">Champions of the bracket nobody watches. Each one earned the supplemental 2.13 in the next rookie draft (Sleeper can't do one-off picks, so the Commish parks Tim Tebow on their roster and swaps in the rookie on draft day). Trophy names straight from the Commish's Sleeper trophies.</div>
   ${H.map(h=>`<div class="tbh"><div class="tb-ban">${esc(h.name||TB_TBA)}</div><div class="tbh-b">${h.tm.av?`<img class="av" src="${esc(h.tm.av)}" alt="" referrerpolicy="no-referrer">`:''}<div><b class="gold">${h.season}</b> · <a href="#team/${(h.now||h.tm).rid}">${esc((h.now||h.tm).team)}</a> <small>@${esc(h.tm.owner)} · ${h.tm.w}-${h.tm.l} regular season</small>
     <div class="tbh-p">2.13 (${+h.season+1}): ${h.pick?`<b>${/^\d+$/.test(h.pick)?pn(h.pick):esc(h.pick)}</b>`:'<i>unconfirmed</i>'} · <a href="#race/${h.season}">bracket</a></div></div></div><div class="rl">${esc(TBR.champ[(+h.season)%TBR.champ.length].replace(/\{T\}/g,(h.now||h.tm).team).replace(/\{Y\}/g,h.season))}</div></div>`).join('')}</section>`}
{const _dr=R.draft;R.draft=async el=>{const lb=await j('league/'+LEAGUE+'/losers_bracket').catch(()=>[]);const f=(lb||[]).find(m=>m.p===1&&m.w);D.tbChamp=f?f.w:null;return _dr(el)}}
{const _h2=R.history;R.history=async el=>{await _h2(el);const c=await current();const box=document.createElement('div');el.appendChild(box);
  tbHall(c.T).then(h=>{box.innerHTML=h}).catch(()=>{})}}
// ================= LEAGUE INTEL (final batch): waiver wins, window, positional strength, pick inventory, H2H grid, tendencies =================
const abbr=n=>{const w=String(n||'?').replace(/[^A-Za-z0-9 ]/g,' ').trim().split(/\s+/).filter(Boolean);return(w.length>1?w.slice(0,3).map(x=>x[0]).join(''):(w[0]||'?').slice(0,3)).toUpperCase()};
const POS4=['QB','RB','WR','TE'];
// ---- 1) WAIVER WIRE WINS: starter points for the team that added him, until he was dropped or traded away ----
function waiverWins(S){const ev={};   // pid -> sorted moves away from a roster: [season,leg,rid]
  for(const s of S){for(const d of s.drops||[])(ev[d.pid]=ev[d.pid]||[]).push([+s.season,d.leg,d.rid]);
    for(const t of s.trades||[])for(const [pid,to] of Object.entries(t.adds||{}))for(const r of t.rids)if(+r!==+to)(ev[pid]=ev[pid]||[]).push([+s.season,t.leg,+r])}
  const out=[];for(const s of S)for(const [pid,rid,leg,wv,bid] of s.adds||[]){const end=(ev[pid]||[]).filter(e=>e[2]===rid&&(e[0]>+s.season||(e[0]===+s.season&&e[1]>=leg))).sort((a,b)=>a[0]-b[0]||a[1]-b[1])[0];
    let pts=0,wks=0;for(const x of S){const yr=+x.season;if(yr<+s.season||!x.sp)continue;if(end&&yr>end[0])break;const a=(x.sp[rid]||{})[pid];if(!a)continue;
      for(const [w,p] of a){if(yr===+s.season&&w<leg)continue;if(end&&yr===end[0]&&w>=end[1])continue;pts+=p;wks++}}
    if(pts>0)out.push({pid,rid,season:s.season,leg,wv,bid,pts,wks,team:(s.teams[rid]||{}).team||'Team '+rid,uid:(s.teams[rid]||{}).uid})}
  const best={};for(const x of out){const k=x.pid+'|'+x.rid;if(!best[k]||x.pts>best[k].pts)best[k]=x}return Object.values(best).sort((a,b)=>b.pts-a.pts)}
const WWR=["{T} found {P} on the wire and got {pts} starter points out of him. Scouting department of one.","{P} cost {T} nothing but a click. {pts} points later, that's a heist.","{T} plucked {P} off the scrap heap. The rest of the league was asleep."];
function wwItem(x,i,cur){const line=pickOf(WWR,'ww'+x.pid+x.rid).replace(/\{(\w+)\}/g,(m,k)=>`<b>${esc({T:cur||x.team,P:(PL[x.pid]||{}).n||'Player '+x.pid,pts:fmt(x.pts)}[k])}</b>`);
  return`<article class="trade ww"><div class="tdh"><span class="rank">#${i+1}</span>${x.season} · WEEK ${x.leg} · ${x.wv?'waiver'+(x.bid?' $'+x.bid:''):'free agent'}</div><div class="tside"><div class="tn">${esc(cur||x.team)} added ${pn(x.pid)}</div>
   <div class="tsc">${fmt(x.pts)} starter pts in ${x.wks} start${x.wks===1?'':'s'} for them</div></div>${i<3?`<div class="rl">${line}</div>`:''}</article>`}
function wwPanel(S,T){const L=waiverWins(S),cs=String(S[S.length-1].season),now=L.filter(x=>String(x.season)===cs).slice(0,5),at=L.slice(0,30);const curN=Object.fromEntries(Object.values(T).map(t=>[t.uid,t.team]));
  return`<section class="panel"><h2>🪄 WAIVER WIRE WINS</h2>${banner('waivers')}<div class="hint">Free-agent and waiver pickups ranked by points scored <b>as a starter for the team that added him</b>, until he was dropped or traded. The flip side of Worst Drops.</div>
   <h3>THIS SEASON (${cs})</h3>${now.length?now.map((x,i)=>wwItem(x,i,curN[x.uid])).join(''):'<div class="hint">No pickup has started a game yet.</div>'}<h3>ALL-TIME</h3>${fBar('ww',{teams:Object.values(T).sort((a,b)=>a.team.localeCompare(b.team)).map(t=>[t.uid,t.team]),seasons:seasonsOf(at),sorts:[['pts','Most points'],['new','Newest']],ph:'Player',meta:at.map(x=>({rids:[String(x.uid)],s:String(x.season),txt:[x.team,curN[x.uid]||'',(PL[x.pid]||{}).n||''].join(' ').toLowerCase(),pts:x.pts,at:+x.season*100+x.leg,f:{wv:!!x.wv}})),cmp:{pts:(a,b)=>b.pts-a.pts,new:(a,b)=>b.at-a.at},toggles:[['wv','💸 Waiver claims only']],limit:8,noun:'pickup',none:'No pickups match.'})}<div data-fl="ww">${at.map((x,i)=>withI(wwItem(x,i,curN[x.uid]),i)).join('')}</div></section>`}
// ---- 2) ROSTER AGE & WINDOW (value-weighted age vs total FantasyCalc value) ----
const WNR={Contender:"Old, loaded and out of excuses. Ring or bust.",Fringe:"Young and dangerous. The window is opening; don't trade it shut.",Purgatory:"Old AND bad. The worst zip code in dynasty.",Rebuild:"Young, cheap and 'two years away'. Every year."};
function windowData(T,V,tp,lg){const TV=teamValue(T,V,tp,lg),ts=Object.values(T).map(t=>{let vs=0,va=0;t.players.forEach(p=>{const v=V.p[p]||0,a=V.a[p];if(v&&a){vs+=v;va+=v*a}});return{t,age:vs?va/vs:0,val:TV[t.rid].pv,tot:TV[t.rid].tot}});
  const med=a=>{const x=[...a].sort((p,q)=>p-q);return(x[(x.length-1)>>1]+x[x.length>>1])/2},mA=med(ts.map(x=>x.age)),mV=med(ts.map(x=>x.val));
  ts.forEach(x=>x.z=x.val>=mV?(x.age>=mA?'Contender':'Fringe'):(x.age>=mA?'Purgatory':'Rebuild'));return{ts,mA,mV}}
function windowPanel(W,S){const {ts,mA,mV}=W,W0=340,H0=250,pad=26,ax=ts.map(x=>x.age),vv=ts.map(x=>x.val),a0=Math.min(...ax)-0.3,a1=Math.max(...ax)+0.3,v0=Math.min(...vv)*0.92,v1=Math.max(...vv)*1.05;
  const X=a=>pad+(a-a0)/(a1-a0)*(W0-pad-8),Y=v=>H0-pad-(v-v0)/(v1-v0)*(H0-pad-8),col={Contender:'#ffc72c',Fringe:'#7dff9a',Purgatory:'#ff8a8a',Rebuild:'#8fd3ff'};
  const miss={};for(const s of S)if(s.done)for(const t of Object.values(s.teams))if(!s.place[t.rid])miss[t.uid]=(miss[t.uid]||0)+1;
  const perp=ts.filter(x=>(x.z==='Rebuild'||x.z==='Purgatory')&&(miss[x.t.uid]||0)>=3).sort((a,b)=>(miss[b.t.uid]||0)-(miss[a.t.uid]||0));
  const PR=["{T}: {n} straight-ish seasons of 'next year'. The rebuild has a rebuild.","{T} has missed the playoffs {n} times and is still 'accumulating assets'. For what, the heat death of the universe?","{T}'s window isn't closed. It was bricked over in {n} seasons of tanking."];
  return`<section class="panel" id="win"><h2>⏳ ROSTER AGE &amp; WINDOW</h2>${banner('window')}<div class="hint">X = roster age weighted by FantasyCalc value (older to the right). Y = total player value. Lines split the league at the median, so the quadrants are relative: <b style="color:#ffc72c">Contender</b> (loaded, older), <b style="color:#7dff9a">Fringe</b> (loaded, young: window opening), <b style="color:#ff8a8a">Purgatory</b> (old and thin), <b style="color:#8fd3ff">Rebuild</b> (young and thin).</div>
   <div class="wnd"><svg viewBox="0 0 ${W0} ${H0}" role="img" aria-label="Roster age vs value scatter"><line x1="${X(mA)}" y1="4" x2="${X(mA)}" y2="${H0-pad}" class="wq"/><line x1="${pad}" y1="${Y(mV)}" x2="${W0-6}" y2="${Y(mV)}" class="wq"/>
    <text x="${W0-8}" y="14" text-anchor="end" class="wl">CONTENDER</text><text x="${pad+4}" y="14" class="wl">FRINGE</text><text x="${W0-8}" y="${H0-pad-6}" text-anchor="end" class="wl">PURGATORY</text><text x="${pad+4}" y="${H0-pad-6}" class="wl">REBUILD</text>
    <text x="${W0/2}" y="${H0-6}" text-anchor="middle" class="wa">younger ← age → older</text><text x="10" y="${H0/2}" text-anchor="middle" class="wa" transform="rotate(-90 10 ${H0/2})">value</text>
    ${(()=>{const L=[],pts=ts.map(x=>[X(x.age),Y(x.val)]);ts.forEach(x=>{const px=X(x.age),py=Y(x.val),w=abbr(x.t.team).length*5.5+2;const C=[[px,py-8,'middle'],[px,py+15,'middle'],[px+8,py+3,'start'],[px-8,py+3,'end'],[px,py-17,'middle'],[px+8,py-8,'start'],[px-8,py-8,'end']];
     const box=c=>{const x0=c[2]==='middle'?c[0]-w/2:c[2]==='start'?c[0]:c[0]-w;return[x0,c[1]-8,x0+w,c[1]+1]},ov=(a,b)=>a[0]<b[2]&&b[0]<a[2]&&a[1]<b[3]&&b[1]<a[3];
     let pick=C[0];for(const c of C){const b=box(c);if(!L.some(q=>ov(q,b))&&!pts.some(([qx,qy])=>ov([qx-5,qy-5,qx+5,qy+5],b))){pick=c;break}}L.push(box(pick));x.lb=pick});return''})()}${ts.map(x=>`<g><circle cx="${X(x.age).toFixed(1)}" cy="${Y(x.val).toFixed(1)}" r="5.5" fill="${col[x.z]}" stroke="#000" stroke-width="1"/><text x="${x.lb[0].toFixed(1)}" y="${x.lb[1].toFixed(1)}" text-anchor="${x.lb[2]}" class="wn">${esc(abbr(x.t.team))}</text></g>`).join('')}</svg></div>
   <div class="tw"><table class="mini"><thead><tr><th>TEAM</th><th>ZONE</th><th>AGE</th><th>VALUE</th></tr></thead><tbody>${[...ts].sort((a,b)=>b.val-a.val).map(x=>`<tr class="${x.t.wz?'wz':''}"><td class="tm"><a href="#team/${x.t.rid}">${esc(x.t.team)}</a> <small class="mute">${esc(abbr(x.t.team))}</small></td><td style="color:${col[x.z]}">${x.z}</td><td>${x.age.toFixed(1)}</td><td>${int(x.val)}</td></tr>`).join('')}</tbody></table></div>
   ${perp.length?`<h3>PERPETUAL REBUILDERS</h3>${perp.slice(0,3).map(x=>`<div class="rl">${esc(pickOf(PR,'pr'+x.t.uid).replace(/\{T\}/g,x.t.team).replace(/\{n\}/g,miss[x.t.uid]))}</div>`).join('')}`:''}
   <div class="hint">${Object.keys(WNR).map(z=>`<b style="color:${col[z]}">${z}:</b> ${WNR[z]}`).join(' ')}</div></section>`}
// ---- 3) POSITIONAL STRENGTH (value by position, ranked 1-12) ----
function posData(T,V,P){const ts=Object.values(T),m={};ts.forEach(t=>{m[t.rid]={QB:0,RB:0,WR:0,TE:0};t.players.forEach(p=>{const pos=((P[p]||{}).p||[])[0];if(m[t.rid][pos]!=null)m[t.rid][pos]+=V.p[p]||0})});
  const rk={};POS4.forEach(pos=>{[...ts].sort((a,b)=>m[b.rid][pos]-m[a.rid][pos]).forEach((t,i)=>{(rk[t.rid]=rk[t.rid]||{})[pos]=i+1})});return{m,rk}}
function posPanel(T,PD){const n=Object.keys(T).length,{m,rk}=PD,heat=r=>{const f=(r-1)/Math.max(1,n-1);const h=Math.round(130-130*f);return`hsl(${h},70%,${28+8*(1-Math.abs(f-.5)*2)}%)`};
  const ts=Object.values(T).sort((a,b)=>POS4.reduce((x,p)=>x+rk[a.rid][p],0)-POS4.reduce((x,p)=>x+rk[b.rid][p],0));
  return`<section class="panel" id="pos"><h2>🧩 POSITIONAL STRENGTH</h2>${banner('posgrid')}<div class="hint">Each team's rank (1 = best of ${n}) by total FantasyCalc superflex value at each position. 🔥 = surplus (top 2), 🆘 = starving (bottom 2). Surplus meets starving? That's a trade: see the <a href="#fleece">Fleece Factory</a>.</div>
   <div class="tw"><table class="pgrid"><thead><tr><th>TEAM</th>${POS4.map(p=>`<th>${p}</th>`).join('')}</tr></thead><tbody>${ts.map(t=>`<tr class="${t.wz?'wz':''}"><td class="tm"><a href="#team/${t.rid}">${esc(t.team)}</a></td>${POS4.map(p=>{const r=rk[t.rid][p];return`<td style="background:${heat(r)}" title="${int(m[t.rid][p])}">${r}${r<=2?' 🔥':r>=n-1?' 🆘':''}</td>`}).join('')}</tr>`).join('')}</tbody></table></div></section>`}
// ---- 4) DRAFT PICK INVENTORY (next two rookie drafts, rounds 1-3) ----
function pickInv(T,tp,lg){const y0=+lg.season+1,ys=[y0,y0+1],own={};Object.values(T).forEach(t=>own[t.rid]=[]);
  ys.forEach(y=>[1,2,3].forEach(r=>Object.values(T).forEach(t=>{const tr=(tp||[]).find(x=>+x.season===y&&+x.round===r&&x.roster_id===t.rid);const o=tr?tr.owner_id:t.rid;if(own[o])own[o].push({y,r,orig:t.rid})})));return{ys,own}}
function projSlots(T,lg){const pt=+lg.settings.playoff_teams||6,seeds=Object.values(T).sort((a,b)=>b.w-a.w||b.pf-a.pf),po=seeds.slice(0,pt),non=seeds.slice(pt).sort((a,b)=>a.max-b.max);const o={};[...non,...po.reverse()].forEach((t,i)=>o[t.rid]=i+1);return o}
function picksPanel(T,tp,lg){const {ys,own}=pickInv(T,tp,lg),sl=projSlots(T,lg),ts=Object.values(T);
  const cnt=t=>own[t.rid].length,firsts=t=>own[t.rid].filter(p=>p.r===1).length,sorted=[...ts].sort((a,b)=>firsts(b)-firsts(a)||cnt(b)-cnt(a));
  const hoard=sorted[0],farm=sorted[sorted.length-1];
  const cell=(t,y,r)=>{const L=own[t.rid].filter(p=>p.y===y&&p.r===r);if(!L.length)return'<td class="pk0">–</td>';
    return`<td class="pk">${L.map(p=>p.orig===t.rid?(y===ys[0]&&r===1?`1.${String(sl[p.orig]).padStart(2,'0')}`:'own'):`<span class="via" title="via ${esc(T[p.orig].team)}">${y===ys[0]&&r===1?`1.${String(sl[p.orig]).padStart(2,'0')}`:esc(abbr(T[p.orig].team))}</span>`).join('<br>')}</td>`};
  return`<section class="panel" id="pinv"><h2>🎟️ DRAFT PICK INVENTORY</h2>${banner('picks')}<div class="hint">Who owns the ${ys[0]} and ${ys[1]} 1sts, 2nds and 3rds, from Sleeper's traded picks. "own" = their own pick; <b style="color:#ffc72c">gold</b> = acquired (shows the original team). ${ys[0]} 1sts show a <b>projected slot</b> from today's order (non-playoff teams by lowest max PF, then playoff teams by seed).</div>
   <div class="tw"><table class="pinv"><thead><tr><th>TEAM</th>${ys.map(y=>[1,2,3].map(r=>`<th>${String(y).slice(2)} R${r}</th>`).join('')).join('')}<th>#</th></tr></thead><tbody>${sorted.map(t=>`<tr class="${t.wz?'wz':''}"><td class="tm"><a href="#team/${t.rid}">${esc(t.team)}</a></td>${ys.map(y=>[1,2,3].map(r=>cell(t,y,r)).join('')).join('')}<td><b>${cnt(t)}</b></td></tr>`).join('')}</tbody></table></div>
   <div class="rl">🐿️ <b>${esc(hoard.team)}</b> is hoarding: ${firsts(hoard)} firsts, ${cnt(hoard)} picks in rounds 1-3. ${firsts(hoard)>=3?'Draft-pick dragon sitting on a pile of gold.':'Squirrel energy.'}</div>
   <div class="rl">🚜 <b>${esc(farm.team)}</b> sold the farm: ${firsts(farm)} first${firsts(farm)===1?'':'s'}, ${cnt(farm)} picks total. ${firsts(farm)===0?'All in. The future is a rumor.':'Living for today.'}</div></section>`}
// ---- 5) HEAD-TO-HEAD GRID (all-time, keyed on owner id; tap a cell for details) ----
function h2hData(S){const G=games(S,{all:true}),h={};G.forEach(g=>{if(g.po)return;for(const [x,y] of [[g.a,g.b],[g.b,g.a]]){const k=x.uid+'|'+y.uid,r=h[k]=h[k]||{w:0,l:0,t:0,pw:0,pl:0,pf:0,pa:0,n:0,last:null};
    {if(x.p>y.p)r.w++;else if(y.p>x.p)r.l++;else r.t++;r.pf+=x.p;r.pa+=y.p;r.n++}
    if(!r.last||+g.s>+r.last.s||(+g.s===+r.last.s&&g.week>r.last.week))r.last={s:g.s,week:g.week,p:x.p,o:y.p}}});
  for(const s of S)for(const [a,b,w] of s.pob||[]){const A=s.teams[a],B=s.teams[b];if(!A||!B)continue;for(const [x,y] of [[A,B],[B,A]]){const k=x.uid+'|'+y.uid,r=h[k]=h[k]||{w:0,l:0,t:0,pw:0,pl:0,pf:0,pa:0,n:0,last:null};if(+w===+x.rid)r.pw++;else r.pl++}}return h}
function h2hPanel(S,T){const h=h2hData(S),cur=Object.values(T).sort((a,b)=>a.team.localeCompare(b.team));D.h2h={h,T:Object.fromEntries(cur.map(t=>[t.uid,t]))};
  const bg=r=>{const g=r.w+r.l;if(!g)return'';const f=r.w/g;return`background:hsla(${Math.round(f*130)},70%,38%,${0.25+Math.abs(f-.5)*1.1})`};
  return`<section class="panel"><h2>🤝 HEAD-TO-HEAD GRID</h2>${banner('h2h')}<div class="hint">Every manager vs every manager, all-time regular season (playoff record in small print), keyed on the Sleeper owner so renamed teams carry their history. Read across: <b>row</b> vs column. Tap a cell for details.</div>
   <div class="tw h2x"><table><thead><tr><th>vs</th>${cur.map(c=>`<th title="${esc(c.team)}">${esc(abbr(c.team))}</th>`).join('')}</tr></thead><tbody>${cur.map(r=>`<tr><th title="${esc(r.team)}">${esc(r.team)}</th>${cur.map(c=>{if(c===r)return'<td class="x">·</td>';const v=h[r.uid+'|'+c.uid];if(!v)return'<td class="x">–</td>';
     return`<td data-k="${esc(r.uid+'|'+c.uid)}" style="${bg(v)}">${v.w}-${v.l}${v.pw+v.pl?`<small>${v.pw}-${v.pl}p</small>`:''}</td>`}).join('')}</tr>`).join('')}</tbody></table></div><div id="h2hd" class="h2hd hint">Tap any cell.</div></section>`}
document.addEventListener('click',e=>{const td=e.target.closest&&e.target.closest('.h2x td[data-k]');if(!td||!D.h2h)return;const k=td.getAttribute('data-k'),[a,b]=k.split('|'),r=D.h2h.h[k],A=D.h2h.T[a],B=D.h2h.T[b],box=document.getElementById('h2hd');if(!r||!box)return;
  document.querySelectorAll('.h2x td.on').forEach(x=>x.classList.remove('on'));td.classList.add('on');
  box.innerHTML=`<b>${esc(A.team)}</b> vs <b>${esc(B.team)}</b>: ${r.w}-${r.l}${r.t?'-'+r.t:''} regular season${r.pw+r.pl?`, ${r.pw}-${r.pl} in the playoffs`:''}. Avg score ${fmt(r.n?r.pf/r.n:0)} – ${fmt(r.n?r.pa/r.n:0)}.${r.last?` Last met ${r.last.s} week ${r.last.week}: ${fmt(r.last.p)} – ${fmt(r.last.o)}.`:''} ${r.w-r.l>=3?'Landlord status.':r.l-r.w>=3?'Pays rent every time.':''}`});
// ---- 6) MANAGER TENDENCIES ----
function habitsData(S,T){const M={};const g=uid=>M[uid]=M[uid]||{uid,tr:0,ad:0,dr:0,faab:0,bids:0,seasons:new Set()};
  for(const s of S){const sx=s.season;Object.values(s.teams).forEach(t=>g(t.uid).seasons.add(sx));const u=rid=>(s.teams[rid]||{}).uid||'r'+rid;
    (s.trades||[]).forEach(t=>t.rids.forEach(r=>g(u(r)).tr++));(s.adds||[]).forEach(([pid,rid,leg,wv,bid])=>{const m=g(u(rid));m.ad++;if(wv){m.faab+=bid;m.bids++}});(s.drops||[]).forEach(d=>g(u(d.rid)).dr++)}
  const cur=Object.fromEntries(Object.values(T).map(t=>[t.uid,t]));return Object.values(M).filter(m=>cur[m.uid]).map(m=>{const n=m.seasons.size||1;return{...m,t:cur[m.uid],n,tps:m.tr/n,aps:m.ad/n,fps:m.faab/n,churn:(m.ad+m.dr)/n}})}
function habitsPanel(S,T,lg){const H=habitsData(S,T);if(!H.length)return'';const faab=+lg.settings.waiver_type===2;
  const top=(f,d)=>[...H].sort((a,b)=>d*(f(b)-f(a)))[0],lab={};const put=(x,l)=>{(lab[x.uid]=lab[x.uid]||[]).push(l)};
  put(top(x=>x.tps,1),'📞 Trade Addict');put(top(x=>x.churn,1),'🌪️ Churn Machine');if(faab)put(top(x=>x.fps,1),'🐋 FAAB Whale');put(top(x=>x.churn,-1),'👻 Ghost');put(top(x=>x.tps,-1),'🗿 Set and Forget');put(top(x=>x.aps,1),'🦅 Waiver Hawk');
  const rows=[...H].sort((a,b)=>b.churn-a.churn);
  return`<section class="panel"><h2>🧠 MANAGER TENDENCIES</h2>${banner('habits')}<div class="hint">Per-season averages since each manager joined (${S[0].season}–${S[S.length-1].season}). Moves = waiver + free-agent adds; churn = adds + drops.${faab?' FAAB = average waiver dollars spent per season (budget $'+(+lg.settings.waiver_budget||100)+', but FAAB can be traded, so whales go past it).':''}</div>
   <div class="chips">${Object.entries(lab).map(([u,l])=>`<span class="chip"><b>${l.join(' · ')}</b> ${esc(H.find(x=>x.uid===u).t.team)}</span>`).join('')}</div>
   <div class="tw"><table class="mini hab"><thead><tr><th>MANAGER</th><th>TRADES</th><th>ADDS</th>${faab?'<th>FAAB</th>':''}<th>CHURN</th></tr></thead><tbody>${rows.map(x=>`<tr class="${x.t.wz?'wz':''}"><td class="tm"><a href="#team/${x.t.rid}">${esc(x.t.team)}</a><span class="ow">@${esc(x.t.owner)} · ${x.n} season${x.n>1?'s':''}</span>${lab[x.uid]?`<span class="ow">${lab[x.uid].join(' · ')}</span>`:''}</td><td>${x.tps.toFixed(1)}</td><td>${x.aps.toFixed(1)}</td>${faab?`<td>$${Math.round(x.fps)}</td>`:''}<td>${x.churn.toFixed(1)}</td></tr>`).join('')}</tbody></table></div></section>`}
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('[data-jump]');if(!b)return;const t=document.getElementById(b.getAttribute('data-jump'));if(t)window.scrollTo(0,t.getBoundingClientRect().top+window.pageYOffset-130)});
// ---- placements ----
// Teams: League Overview (window, positional strength, pick inventory) above the team list, lazy-filled after the list renders
{const _tm=R.teams;R.teams=async el=>{await _tm(el);const c=await current();const box=document.createElement('div');box.innerHTML=banner('teamsov')+`<section class="panel">${SPIN('Appraising every roster…')}</section>`;el.insertBefore(box,el.firstChild);
  (async()=>{const V=await values();const ros=[...new Set(Object.values(c.T).flatMap(t=>t.players||[]))];const P=await playersFor(ros);const S=await all().catch(()=>[]);
    box.innerHTML=banner('teamsov')+'<div class="chips jump">'+[['win','⏳ Window'],['pos','🧩 Positions'],['pinv','🎟️ Picks'],['tlist','👥 All teams']].map(([k,l])=>`<button class="chip" data-jump="${k}">${l}</button>`).join('')+'</div>'+windowPanel(windowData(c.T,V,c.tp,c.lg),S)+posPanel(c.T,posData(c.T,V,P))+picksPanel(c.T,c.tp,c.lg)})().catch(e=>{box.innerHTML=`<section class="panel"><div class="hint">League overview unavailable (${esc(e.message||e)}).</div></section>`})}}
// Trades: Waiver Wire Wins next to Worst Drops (side by side on desktop), then Trade History, then Tendencies
{const _trd=R.trades;R.trades=async(el,arg)=>{await _trd(el,arg);const [S,c]=await Promise.all([all(),current()]);const d=el.querySelector('section.panel');
  const pair=document.createElement('div');pair.className='pair';pair.innerHTML=wwPanel(S,c.T);if(d){d.parentNode.insertBefore(pair,d);pair.appendChild(d)}else el.insertBefore(pair,el.firstChild);
  el.insertAdjacentHTML('beforeend',habitsPanel(S,c.T,c.lg))}}
// Records: the old inline matrix becomes a full Head-to-Head Grid panel
{const _rec=R.records;R.records=async el=>{await _rec(el);const [S,c]=await Promise.all([all(),current()]);el.querySelectorAll('.h2h').forEach(x=>{const h=x.previousElementSibling;if(h&&h.tagName==='H3')h.remove();x.remove()});el.insertAdjacentHTML('beforeend',h2hPanel(S,c.T))}}
// ---- nav: tabs grouped by use (this week · rosters & deals · legacy · fun), home cards in the same order ----
const NAVG=[['home','recap','power','race','tank'],['teams','fleece','trades','draft'],['history','records','shame'],['arcade']];
{const by=Object.fromEntries(TABS.map(t=>[t[0],t])),seen=new Set(NAVG.flat()),groups=NAVG.map(g=>g.filter(k=>by[k]).map(k=>by[k]));const extra=TABS.filter(t=>!seen.has(t[0]));if(extra.length)groups[groups.length-1].push(...extra);
  TABS.length=0;groups.forEach(g=>TABS.push(...g));
  $('#tabs').innerHTML=groups.filter(g=>g.length).map(g=>g.map(([k,i,n])=>`<a href="#${k}" data-k="${k}"><span>${i}</span>${n}</a>`).join('')).join('<i class="tsep" aria-hidden="true"></i>');
  const ord=NAVG.flat(),pos=h=>{const i=ord.indexOf(h.slice(1));return i<0?99:i};HOMECARDS.sort((a,b)=>pos(a[0])-pos(b[0]))}
// wire shared list filters once each page lands in #view (wraps every earlier R.after)
{const _af=R.after;R.after=k=>{if(_af)_af(k);fAuto($('#view'))}}
route();   // last: every R.* page above is registered before the first render
