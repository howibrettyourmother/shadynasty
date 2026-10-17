'use strict';
// SHADYNASTY HQ round 2: Tank Race (rookie pick-slot odds, Race tab) + Season Awards (Recap tab). Loaded after app.js, before the first render.
// ---------------- TANK RACE: Monte Carlo of the rest of the regular season + the playoff bracket, then the max-PF draft order ----------------
// Draft order rule: non-playoff teams pick first by LOWEST max PF (record only decides who makes the playoffs), then playoff teams by finish (champ picks last).
function simTank(T,M,last,pws,pt,N){const ids=Object.keys(T).map(Number),sc={},base={};ids.forEach(i=>{sc[i]=[];base[i]={w:0,pf:0,mx:0,g:0}});
  for(let w=1;w<=last;w++){const by={};(M[w-1]||[]).forEach(m=>{if(!base[m.roster_id])return;sc[m.roster_id].push(+m.points||0);base[m.roster_id].pf+=+m.points||0;base[m.roster_id].g++;if(m.matchup_id!=null)(by[m.matchup_id]=by[m.matchup_id]||[]).push(m)});
    Object.values(by).forEach(([a,b])=>{if(!b)return;if(a.points>b.points)base[a.roster_id].w++;else if(b.points>a.points)base[b.roster_id].w++;else{base[a.roster_id].w+=.5;base[b.roster_id].w+=.5}})}
  // Sleeper's season max PF (ppts) is the authoritative running total; the per-week bench gap is (max - pf) / games
  ids.forEach(i=>{base[i].mx=T[i].max||base[i].pf});
  const all=ids.flatMap(i=>sc[i]),lmu=all.reduce((a,b)=>a+b,0)/Math.max(1,all.length)||110,P={};
  ids.forEach(i=>{const s=sc[i],n=s.length,mu=n?s.reduce((a,b)=>a+b,0)/n:lmu,sd=n>1?Math.sqrt(s.reduce((a,b)=>a+(b-mu)**2,0)/(n-1)):22,gap=n?Math.max(0,(base[i].mx-base[i].pf)/n):18;
    P[i]={mu:(mu*n+lmu*2)/(n+2),sd:Math.max(12,Math.min(40,sd||22)),gap}});
  const sched=[];for(let w=last+1;w<pws;w++){const by={};(M[w-1]||[]).forEach(m=>{if(m.matchup_id!=null)(by[m.matchup_id]=by[m.matchup_id]||[]).push(m.roster_id)});sched.push(Object.values(by).filter(g=>g.length===2))}
  const r=rng('tank'+last),n=ids.length,out={};ids.forEach(i=>out[i]={po:0,seed:new Array(n).fill(0),slot:new Array(n).fill(0)});
  const game=(a,b,MU)=>(MU[a]+P[a].sd*randn(r))>(MU[b]+P[b].sd*randn(r))?[a,b]:[b,a];
  for(let k=0;k<N;k++){const w={},pf={},mx={},MU={};ids.forEach(i=>{w[i]=base[i].w;pf[i]=base[i].pf;mx[i]=base[i].mx;MU[i]=P[i].mu*(1+0.05*randn(r))});
    for(const wk of sched)for(const [a,b] of wk){const pa=MU[a]+P[a].sd*randn(r),pb=MU[b]+P[b].sd*randn(r);pf[a]+=pa;pf[b]+=pb;
      mx[a]+=pa+Math.max(0,P[a].gap+7*randn(r));mx[b]+=pb+Math.max(0,P[b].gap+7*randn(r));if(pa>pb)w[a]++;else w[b]++}
    const o=[...ids].sort((a,b)=>w[b]-w[a]||pf[b]-pf[a]);o.forEach((i,s)=>out[i].seed[s]++);const po=o.slice(0,pt),non=o.slice(pt).sort((a,b)=>mx[a]-mx[b]);
    // playoff finish: 6-team Sleeper bracket (1-2 byes; 3v6, 4v5; 1 v 4/5 winner, 2 v 3/6 winner; final, 3rd and 5th place games). Other sizes: by seed.
    let fin;if(pt===6){const [w45,l45]=game(po[3],po[4],MU),[w36,l36]=game(po[2],po[5],MU),[a1,b1]=game(po[0],w45,MU),[a2,b2]=game(po[1],w36,MU),[c,ru]=game(a1,a2,MU),[t3,t4]=game(b1,b2,MU),[t5,t6]=game(l45,l36,MU);fin=[c,ru,t3,t4,t5,t6]}
    else fin=po.slice();
    po.forEach(i=>out[i].po++);[...non,...fin.slice().reverse()].forEach((i,s)=>out[i].slot[s]++)}
  ids.forEach(i=>{const x=out[i];x.po/=N;x.seed=x.seed.map(v=>v/N);x.slot=x.slot.map(v=>v/N);x.eSeed=x.seed.reduce((a,v,s)=>a+v*(s+1),0);x.eSlot=x.slot.reduce((a,v,s)=>a+v*(s+1),0);
    x.mSeed=x.seed.indexOf(Math.max(...x.seed))+1;x.p1=x.slot[0];x.top3=x.slot[0]+x.slot[1]+x.slot[2];x.mu=P[i].mu;x.gap=P[i].gap});return out}
const TKR={one:["{T} is the 1.01 favorite. Low ceiling, high hopes.","{T} leads the tank race. The lineup potential of a bye week.","Pole position for the 1.01: {T}. Every bench zero is a step closer."],
  near:["{T} is lurking. One more quiet week and the 1.01 is in play.","{T} keeps the max PF low and the draft dreams high."],
  safe:["{T} is too good to tank and too scared to contend. Pick 7-ish forever."]};
async function tankHTML(lg,T,tp){const last=+lg.settings.last_scored_leg||0,pws=+lg.settings.playoff_week_start||15,pt=+lg.settings.playoff_teams||6,n=Object.keys(T).length,NEXT=String(+lg.season+1);
  if(lg.status!=='in_season'||last>=pws-1)return'';
  const M=await pool(Array.from({length:pws-1},(_,k)=>()=>jc('league/'+LEAGUE+'/matchups/'+(k+1)).catch(()=>[])),8);
  const S=simTank(T,M,last,pws,pt,4000),ts=Object.values(T).sort((a,b)=>S[a.rid].eSlot-S[b.rid].eSlot);
  const own=rid=>{const x=(tp||[]).find(p=>String(p.season)===NEXT&&+p.round===1&&p.roster_id===rid);return x&&x.owner_id!==rid?T[x.owner_id]:null};
  const fav=ts[0],r=rng('tk'+last),pk=a=>a[Math.floor(r()*a.length)];
  // 1.01 odds by who actually holds the pick (traded 1sts follow the owner)
  const byOwner={};ts.forEach(t=>{const o=own(t.rid)||t;byOwner[o.rid]=(byOwner[o.rid]||0)+S[t.rid].p1});const ob=Object.entries(byOwner).sort((a,b)=>b[1]-a[1]).filter(x=>x[1]>=0.005).slice(0,4);
  const cell=v=>`<i style="opacity:${v<0.005?0.06:Math.min(1,0.18+v*1.6).toFixed(2)}" title="${pc(v)}"></i>`;
  const row=t=>{const x=S[t.rid],o=own(t.rid);return`<div class="tk-r${t.wz?' wz':''}" data-fx="${t.rid}"><div class="tk-h"><a href="#team/${t.rid}">${esc(t.team)}</a><span class="tk-p">${pc(x.p1)}</span></div>
    <div class="tk-s">Proj seed <b>#${x.mSeed}</b> <small>(avg ${x.eSeed.toFixed(1)})</small> · Playoffs <b>${pc(x.po)}</b> · Top-3 pick <b>${pc(x.top3)}</b> · Avg pick <b>${x.eSlot.toFixed(1)}</b>${o?` · <span class="tk-o">pick owned by ${esc(o.team)}</span>`:''}</div>
    <div class="tk-g">${x.slot.map(cell).join('')}</div></div>`};
  return`<section class="panel tank2" id="tankrace"><h2>🚽 TANK RACE · ${NEXT} ROOKIE PICK ODDS</h2>
   <div class="hint">4,000 simulated finishes of weeks ${last+1}–${pws-1} plus the playoff bracket. Each team scores like it has so far (shrunk toward the league average, with week-to-week swing), and its max PF grows by that score plus its usual bench gap. Draft order: the ${n-pt} non-playoff teams pick first by <b>lowest max PF</b> (record only gets you into the playoffs), then playoff teams by finish. Big number = odds at the <b>1.01</b>. Strip = odds at picks 1 → ${n}.</div>
   <div class="tk-lead"><b>${esc(fav.team)}</b>: ${esc(pk(TKR.one).replace('{T}',fav.team))}${ts[1]?` <span class="tk-n">${esc(pk(TKR.near).replace('{T}',ts[1].team))}</span>`:''}</div>
   ${ob.length&&ts.some(t=>own(t.rid))?`<div class="tk-own">1.01 odds by who holds the pick: ${ob.map(([rid,v])=>`<b>${esc(T[rid].team)}</b> ${pc(v)}`).join(' · ')}</div>`:''}
   <div class="tk-ax"><span>1</span><span>${Math.ceil(n/2)}</span><span>${n}</span></div>
   ${ts.map(row).join('')}
   <div class="hint">Tap a team for its surprise. Odds move every week; nobody hold us to this.</div></section>`}
{const _r2=R.race;R.race=async(el,arg)=>{await _r2(el,arg);if(arg&&/^\d{4}$/.test(arg))return;const c=await current();
  const box=document.createElement('div');box.innerHTML=`<section class="panel" id="tankrace">${SPIN('Simulating the tank…')}</section>`;
  const first=[...el.querySelectorAll('section.panel')].find(s=>/PLAYOFF RACE/.test(s.textContent));if(first)first.after(box);else el.prepend(box);
  tankHTML(c.lg,c.T,c.tp).then(h=>{box.innerHTML=h}).catch(e=>{console.warn(e);box.innerHTML=''})}}
// ---------------- SEASON AWARDS (Recap tab): season-to-date, recomputed from Sleeper matchups each week ----------------
const SAR={blow:["{T} beat {O} by {m}. That wasn't a game, it was a public service announcement.","{m}-point margin over {O}. {T} kept scoring after the whistle."],
 unlucky:["{T} scored {p} in week {w} and still lost. Some weeks the universe just picks a side.","{p} points and an L. {T} has filed a complaint with the schedule."],
 lucky:["{T} won with {p} in week {w}. Somebody check the horseshoe for fingerprints.","A win with {p}. {T} would like you to stop asking how."],
 bench:["{T} left {b} on the bench in week {w}. The right answers were right there.","{b} bench points in one week. {T} studied for the wrong test."],
 best:["{T} dropped {p} in week {w}. Season high, and they will remind you.","{p} in week {w}. {T} briefly looked like a dynasty."],
 worst:["{T} posted {p} in week {w}. The shoe remembers.","{p}. Week {w}. {T} would like to move on, and we won't let them."],
 magnet:["{T} has given up {pa} this season. Every opponent saves their best week for them.","{pa} points against. {T} is the league's favorite opponent."],
 heart:["{T} lost to {O} by {m}. One extra point in garbage time.","Lost by {m}. {T} will be replaying that one for a while."],
 bench2:["{T} has left {b} on the bench all season. The bench is outscoring some starting lineups.","{b} season bench points. {T} keeps the best players well rested."],
 coach:["{T} has started {e} of their best possible lineup. Set it and win it.","{e} lineup efficiency. {T} actually reads the injury report."],
 swing:["{T}: ±{sd} a week. Season high or season low? Nobody knows, including them.","Swings of ±{sd}. {T} is a weekly coin flip with a jersey."]};
async function seasonAwards(lg,T){const last=+lg.settings.last_scored_leg||0;if(!last)return'';const pws=+lg.settings.playoff_week_start||15,upto=Math.min(last,pws-1);
  const M=await pool(Array.from({length:upto},(_,k)=>()=>jc('league/'+LEAGUE+'/matchups/'+(k+1)).catch(()=>[])),8);
  const slots=(lg.roster_positions||[]).filter(s=>!['BN','IR','TAXI'].includes(s)),ids=new Set();M.forEach(w=>w.forEach(m=>(m.players||[]).forEach(p=>ids.add(p))));const P=await playersFor([...ids]);
  const G=[],X=[],tot={};Object.values(T).forEach(t=>tot[t.rid]={pts:[],bench:0,opt:0,pf:0});
  M.forEach((w,wi)=>{const by={};w.forEach(m=>{if(!T[m.roster_id])return;const pts=+m.points||0,opt=Math.max(pts,optimal(slots,m.players||[],m.players_points||{},P)),x={t:T[m.roster_id],w:wi+1,pts,bench:opt-pts};X.push(x);
      const a=tot[m.roster_id];a.pts.push(pts);a.bench+=opt-pts;a.opt+=opt;a.pf+=pts;if(m.matchup_id!=null)(by[m.matchup_id]=by[m.matchup_id]||[]).push(x)});
    Object.values(by).forEach(g=>{if(g.length!==2)return;const [a,b]=g[0].pts>=g[1].pts?g:[g[1],g[0]];if(a.pts===b.pts)return;a.opp=b;b.opp=a;a.won=1;b.won=0;G.push({w:a,l:b,m:a.pts-b.pts})})});
  if(!X.length)return'';const mx=(a,f)=>a.length?a.reduce((b,x)=>f(x)>f(b)?x:b):null,W=X.filter(x=>x.won===1),L=X.filter(x=>x.won===0);
  const TS=Object.values(T).map(t=>{const a=tot[t.rid],n=a.pts.length,mu=a.pf/Math.max(1,n);return{t,b:a.bench,e:a.opt?a.pf/a.opt:0,sd:n>1?Math.sqrt(a.pts.reduce((s,v)=>s+(v-mu)**2,0)/(n-1)):0}});
  const blow=mx(G,g=>g.m),heart=mx(G,g=>-g.m),r=rng('sa'+last),pk=a=>a[Math.floor(r()*a.length)];
  const A=[['blow','💥','BIGGEST BLOWOUT',blow&&{t:blow.w.t,o:blow.l.t,w:blow.w.w,m:blow.m,p:blow.w.pts},x=>'won by '+fmt(x.m)+' · wk '+x.w],
    ['unlucky','🚨','UNLUCKIEST LOSS',mx(L,x=>x.pts),x=>fmt(x.pts)+' in a loss · wk '+x.w],
    ['lucky','🍀','LUCKIEST WIN',mx(W,x=>-x.pts),x=>fmt(x.pts)+' in a win · wk '+x.w],
    ['heart','💔','HEARTBREAKER',heart&&{t:heart.l.t,o:heart.w.t,w:heart.w.w,m:heart.m,p:heart.l.pts},x=>'lost by '+fmt(x.m)+' · wk '+x.w],
    ['best','🔥','BEST SINGLE WEEK',mx(X,x=>x.pts),x=>fmt(x.pts)+' pts · wk '+x.w],
    ['worst','🥾','WORST SINGLE WEEK',mx(X,x=>-x.pts),x=>fmt(x.pts)+' pts · wk '+x.w],
    ['bench','🪑','MOST LEFT ON THE BENCH (ONE WEEK)',mx(X,x=>x.bench),x=>fmt(x.bench)+' bench pts · wk '+x.w],
    ['bench2','🛋️','BENCH HOARDER (SEASON)',mx(TS,x=>x.b),x=>fmt(x.b)+' left on the bench'],
    ['magnet','🧲','POINTS-AGAINST MAGNET',mx(Object.values(T).map(t=>({t,pa:t.pa})),x=>x.pa),x=>fmt(x.pa)+' PA'],
    ['coach','🧠','LINEUP GURU',mx(TS,x=>x.e),x=>Math.round(x.e*1000)/10+'% of max lineup'],
    ['swing','🎢','ROLLERCOASTER',mx(TS,x=>x.sd),x=>'±'+fmt(x.sd)+' week to week']];
  const fill=(s,x)=>s.replace(/\{T\}/g,x.t.team).replace(/\{O\}/g,x.o?x.o.team:'').replace(/\{w\}/g,x.w).replace(/\{m\}/g,fmt(x.m)).replace(/\{p\}/g,fmt(x.pts!=null?x.pts:x.p)).replace(/\{b\}/g,fmt(x.bench!=null?x.bench:x.b)).replace(/\{pa\}/g,fmt(x.pa)).replace(/\{e\}/g,Math.round((x.e||0)*1000)/10+'%').replace(/\{sd\}/g,fmt(x.sd));
  return`<section class="panel sawp" id="sawards"><h2>📜 ${esc(lg.season)} SEASON AWARDS · THROUGH WEEK ${upto}</h2><div class="hint">Season to date, straight from Sleeper's box scores. Recomputed every week. Tap a card for that team's surprise.</div>
   <div class="awg">${A.filter(a=>a[3]).map(([k,ic,nm,x,st])=>`<div class="aw aw-${k}${x.t.wz?' wz':''}" data-fx="${x.t.rid}"><div class="awh"><span class="awi">${ic}</span><b>${nm}</b></div><a class="awt" href="#team/${x.t.rid}">${esc(x.t.team)}</a><div class="aws">${st(x)}${x.o?' vs '+esc(x.o.team):''}</div><p class="awr">${esc(fill(pk(SAR[k]),x))}</p></div>`).join('')}</div></section>`}
{const _r3=R.recap;R.recap=async(el,arg)=>{await _r3(el,arg);const c=await current();if(!(+c.lg.settings.last_scored_leg))return;
  const box=document.createElement('div');box.innerHTML=`<section class="panel">${SPIN('Engraving the season awards…')}</section>`;const rc=el.querySelector('#recap');if(rc)rc.before(box);else el.append(box);
  seasonAwards(c.lg,c.T).then(h=>{box.innerHTML=h}).catch(e=>{console.warn(e);box.innerHTML=''})}}
