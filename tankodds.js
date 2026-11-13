// SHADYNASTY canonical tank odds: ONE Monte Carlo for every rookie-pick number on the site AND on Tank Watch
// (tank-for-jeremiah-smith loads this same file), so the odds always agree. Pure functions, no DOM, no globals except SNTank.
// Draft order rule (bylaws): non-playoff teams pick first by LOWEST max PF (Sleeper potential points, weeks 1-14),
// then playoff teams by finish (champ picks last). Seeds: wins, then points for.
(function(){'use strict';
function seeded(seed){let a=seed>>>0;return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function hashStr(s){let h=2166136261;for(const c of s)h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0}
function rng(seed){return seeded(hashStr(String(seed)))}
function randn(r){let u=0,v=0;while(!u)u=r();while(!v)v=r();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v)}
// T: {rid:{max}} (max = Sleeper season max PF so far). M: matchups for weeks 1..pws-1 (index = week-1).
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
// convenience: straight from Sleeper rosters. Returns {rid: {p1, top3, po, eSlot, slot[], seed[], ...}}
function fromSleeper(lg,rosters,M,N){const T={};(rosters||[]).forEach(r=>{const s=r.settings||{};T[r.roster_id]={max:(+s.ppts||0)+(+s.ppts_decimal||0)/100}});
  const st=lg.settings||{};return simTank(T,M,+st.last_scored_leg||0,+st.playoff_week_start||15,+st.playoff_teams||6,N||4000)}
window.SNTank={simTank,fromSleeper,rng,randn,N:4000,VERSION:1};
})();
