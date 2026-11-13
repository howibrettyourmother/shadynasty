'use strict';
// SHADYNASTY HQ round 4 ("premium"): data-health banners, stretch-run tools, navigation. Loaded after every other page script.
(function(){
// ---------------- values-unavailable banner (FantasyCalc down / stale) ----------------
const VPAGES=new Set(['power','analyzer','teams','team','fleece','trades','draft','tank']);
const vBanner=k=>{const v=$('#view');if(!v||!VPAGES.has(k)||!D.vState||D.vState==='ok'||v.querySelector('.vwarn.fc'))return;
  const when=D.vAt?new Date(D.vAt).toLocaleDateString('en-US',{month:'short',day:'numeric'}):'';
  v.insertAdjacentHTML('afterbegin',`<div class="vwarn fc" role="status">${D.vState==='none'
    ?'⚠️ <b>Dynasty values didn\'t load</b> (FantasyCalc isn\'t answering). Player and pick values show as 0, so value-based rankings, trade grades and ideas are off until it\'s back.'
    :`⚠️ <b>Dynasty values are from ${esc(when)}</b>. FantasyCalc isn't answering, so these are the last ones we saved.`} <button type="button" class="chip" data-vretry>↻ Retry</button></div>`)};
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('[data-vretry]');if(b){try{localStorage.removeItem('sn:fc3')}catch(x){}fullRefresh()}});
{const _a=R.after;R.after=k=>{if(_a)_a(k);vBanner(k);setTimeout(()=>vBanner(k),1500)}}
})();
// ======================= STAGE B: STRETCH-RUN TOOLS =======================
(function(){
const pad2=n=>String(n).padStart(2,'0'),rec=t=>`${t.w}-${t.l}${t.t?'-'+t.t:''}`;
const seasonM=async()=>{const {lg}=await current();const pws=+lg.settings.playoff_week_start||15;
  return pool(Array.from({length:pws-1},(_,k)=>()=>jc('league/'+LEAGUE+'/matchups/'+(k+1)).catch(()=>[])),8)};
const ctx=async()=>{const c=await current(),st=c.lg.settings||{},pws=+st.playoff_week_start||15,last=Math.min(+st.last_scored_leg||0,pws-1),pt=+st.playoff_teams||6;
  const M=await seasonM();return{...c,M,pws,last,pt,n:Object.keys(c.T).length}};
// remaining regular-season games [{w,a,b,k}] (k = lock key used by tankodds.js)
const remGames=(M,last,pws)=>{const g=[];for(let w=last+1;w<pws;w++){const by={};(M[w-1]||[]).forEach(m=>{if(m.matchup_id!=null)(by[m.matchup_id]=by[m.matchup_id]||[]).push(m.roster_id)});
  Object.values(by).filter(p=>p.length===2).forEach(([a,b])=>g.push({w,a,b,k:w+':'+Math.min(a,b)+'-'+Math.max(a,b)}))}return g};
// ---- clinch / elimination: strict math (no guessing). A tie in wins could go either way on points for, so a tie never counts as safe.
function clinch(T,games,pt,locks){const ids=Object.keys(T).map(Number),W={},Rm={};ids.forEach(i=>{W[i]=T[i].w+(T[i].t||0)/2;Rm[i]=0});
  games.forEach(g=>{const L=locks&&locks[g.k];if(L!=null){W[+L]++}else{Rm[g.a]++;Rm[g.b]++}});
  const out={},ord=[...ids].sort((a,b)=>W[b]-W[a]||T[b].pf-T[a].pf);
  ids.forEach(i=>{const threats=ids.filter(j=>j!==i&&W[j]+Rm[j]>=W[i]).length,ahead=ids.filter(j=>j!==i&&W[j]>W[i]+Rm[i]).length;
    const o={W:W[i],R:Rm[i],po:threats<pt,bye:threats<2,one:threats<1,elim:ahead>=pt,byeOut:ahead>=2,pos:ord.indexOf(i)+1};
    // magic number vs the first team out (in-position teams) / elimination number vs the last team in (teams outside)
    const first=ord[pt],lastIn=ord[pt-1];
    if(!o.po&&!o.elim){if(o.pos<=pt&&first!=null){o.magic=Math.max(1,W[first]+Rm[first]-W[i]+1);o.vs=first}
      else if(lastIn!=null){o.tragic=Math.max(1,W[i]+Rm[i]-W[lastIn]+1);o.vs=lastIn}}
    out[i]=o});return out}
const chip=(c,T)=>c.one?'<span class="cl z" title="Clinched the #1 seed">🔒 #1 SEED</span>':c.bye?'<span class="cl y" title="Clinched a first-round bye">🔒 BYE</span>':c.po?'<span class="cl x" title="Clinched a playoff spot">✅ IN</span>':c.elim?'<span class="cl e" title="Mathematically eliminated from the playoffs">❌ OUT</span>':
  c.magic?`<span class="cl m" title="Any combination of ${c.magic} ${esc(T[c.vs]?T[c.vs].team:'')} losses + your wins locks a spot ahead of them">Magic # ${c.magic}</span>`:c.tragic?`<span class="cl t" title="Any combination of ${c.tragic} of your losses + ${esc(T[c.vs]?T[c.vs].team:'')} wins and you're out of the race with them">Elim # ${c.tragic}</span>`:'';
const badge=c=>c.one?'<sup class="clb z" title="Clinched #1 seed">z</sup>':c.bye?'<sup class="clb y" title="Clinched bye">y</sup>':c.po?'<sup class="clb x" title="Clinched playoffs">x</sup>':c.elim?'<sup class="clb e" title="Eliminated">e</sup>':'';
// expose for other modules / home
window.SNRace={ctx,remGames,clinch,chip,badge};

// ---------------- 🔮 PLAYOFF MACHINE (#scenarios): pick winners, re-run the canonical sim ----------------
const LK=()=>'sn:scen:'+LEAGUE;
const enc=(locks,G)=>G.filter(g=>locks[g.k]!=null).map(g=>g.w+'.'+g.a+'-'+g.b+'.'+locks[g.k]).join(',');
const dec=(s,G)=>{const L={};String(s||'').split(',').forEach(x=>{const m=/^(\d+)\.(\d+)-(\d+)\.(\d+)$/.exec(x);if(!m)return;const g=G.find(g=>g.w===+m[1]&&((g.a===+m[2]&&g.b===+m[3])||(g.a===+m[3]&&g.b===+m[2])));if(g&&(+m[4]===g.a||+m[4]===g.b))L[g.k]=+m[4]});return L};
R.scenarios=async(el,arg)=>{const C=await ctx(),{T,M,pws,last,pt,lg}=C;
  if(!['in_season'].includes(lg.status)||last>=pws-1){el.innerHTML=`<section class="panel"><h2>🔮 PLAYOFF MACHINE</h2><div class="hint">The regular season is over, so there's nothing left to pick. The bracket lives on the <a href="#race">Race</a> page.</div></section>`;return}
  const G=remGames(M,last,pws),weeks=[...new Set(G.map(g=>g.w))];let locks=arg?dec(decodeURIComponent(arg),G):(LS.get(LK())||{});
  Object.keys(locks).forEach(k=>{if(!G.some(g=>g.k===k))delete locks[k]});
  let wk=weeks[0];const N=SNTank.N,base=SNTank.simTank(T,M,last,pws,pt,N),ppg=t=>t.pf/Math.max(1,t.w+t.l+t.t);
  el.innerHTML=`<div class="pm-wrap"><section class="panel pm"><h2>🔮 PLAYOFF MACHINE</h2><div class="hint">Pick the winners of any remaining game and watch everyone's odds move. Same ${N.toLocaleString()}-run simulation as the <a href="#race">Playoff Race</a> and <a href="#tank">Tank Race</a>, with your picks forced. <b>Clinched / eliminated</b> is strict math: ties go to points for, so a tie never counts as safe. Share a scenario with the link button.</div>
    <div class="pm-wk" role="tablist"></div><div class="pm-g"></div>
    <div class="pm-act"><button type="button" class="pmb" data-a="chalk">⭐ Favorites win this week</button><button type="button" class="pmb" data-a="clrw">Clear this week</button><button type="button" class="pmb" data-a="clr">Clear all</button><button type="button" class="pmb" data-a="share">🔗 Copy scenario link</button></div></section>
    <section class="panel"><h2>📊 WHAT YOUR PICKS DO</h2><div class="pm-sum hint"></div><div class="tw"><table class="pm-t"><thead><tr><th>#</th><th>TEAM</th><th>W-L</th><th>PLAYOFFS</th><th class="hs">BYE</th><th class="hs">#1</th><th>STATUS</th></tr></thead><tbody></tbody></table></div>
    <div class="hint">W-L includes your picks. Arrows compare to no picks. Magic # = your wins + their losses needed to finish ahead of the first team out; Elim # = your losses + their wins that knock you out of reach of the last team in.</div></section></div>`;
  const root=el.querySelector('.pm-wrap');
  const wkEl=root.querySelector('.pm-wk'),gEl=root.querySelector('.pm-g'),tb=root.querySelector('.pm-t tbody'),sum=root.querySelector('.pm-sum');
  const save=()=>{LS.set(LK(),locks);try{const s=enc(locks,G);history.replaceState(null,'','#scenarios'+(s?'/'+s:''))}catch(e){}};
  const drawWeeks=()=>{wkEl.innerHTML=weeks.map(w=>{const n=G.filter(g=>g.w===w&&locks[g.k]!=null).length,t=G.filter(g=>g.w===w).length;return`<button type="button" role="tab" class="pmb${w===wk?' on':''}" data-w="${w}">WK ${w}${n?` <small>${n}/${t}</small>`:''}</button>`}).join('')};
  const drawGames=()=>{gEl.innerHTML=G.filter(g=>g.w===wk).map(g=>{const A=T[g.a],B=T[g.b],L=locks[g.k];if(!A||!B)return'';
    const side=(X,o)=>`<button type="button" class="pm-s${L===X.rid?' win':L===o.rid?' lose':''}" data-k="${g.k}" data-r="${X.rid}" aria-pressed="${L===X.rid}"><b>${esc(X.team)}</b><small>${rec(X)} · ${fmt(ppg(X))}/wk</small></button>`;
    return`<div class="pm-m">${side(A,B)}<span class="pm-v">vs</span>${side(B,A)}</div>`}).join('')||'<div class="hint">No games that week.</div>'};
  const run=()=>{const S=Object.keys(locks).length?SNTank.simTank(T,M,last,pws,pt,N,locks):base,CL=clinch(T,G,pt,locks);
    const ids=Object.keys(T).map(Number).sort((a,b)=>S[b].po-S[a].po||S[b].seed[0]-S[a].seed[0]||CL[b].W-CL[a].W||T[b].pf-T[a].pf);
    const d=(a,b)=>{const x=Math.round((a-b)*100);return x>=1?`<span class="mv up">▲${x}</span>`:x<=-1?`<span class="mv dn">▼${-x}</span>`:''};
    const by=x=>x.seed[0]+x.seed[1];
    tb.innerHTML=ids.map((i,k)=>{const t=T[i],s=S[i],b=base[i],c=CL[i],wl=c.W-t.w-(t.t||0)/2;return`<tr class="${k<pt?'po':''}${t.wz?' wz':''}"><td>${k+1}</td><td class="tm"><a href="#team/${i}">${esc(t.team)}</a>${badge(c)}</td><td>${t.w+wl}-${t.l+(G.filter(g=>locks[g.k]!=null&&(g.a===i||g.b===i)&&locks[g.k]!==i).length)}</td><td><b>${pc(s.po)}</b> ${d(s.po,b.po)}</td><td class="hs">${pc(by(s))}</td><td class="hs">${pc(s.seed[0])}</td><td>${chip(c,T)}</td></tr>`}).join('');
    const n=Object.keys(locks).length,newly=ids.filter(i=>CL[i].po&&!clinch(T,G,pt,{})[i].po).map(i=>T[i].team),gone=ids.filter(i=>CL[i].elim&&!clinch(T,G,pt,{})[i].elim).map(i=>T[i].team);
    sum.innerHTML=n?`<b>${n}</b> game${n===1?'':'s'} picked.${newly.length?` ✅ Clinches: <b>${newly.map(esc).join(', ')}</b>.`:''}${gone.length?` ❌ Eliminates: <b>${gone.map(esc).join(', ')}</b>.`:''}${!newly.length&&!gone.length?' Nobody clinches or gets eliminated yet.':''}`:'No picks yet: these are the current odds. Tap a team to make them win.'};
  let tm=0;const later=()=>{clearTimeout(tm);tm=setTimeout(run,30)};
  root.addEventListener('click',e=>{const s=e.target.closest('.pm-s');if(s){const k=s.dataset.k,r=+s.dataset.r;if(locks[k]===r)delete locks[k];else locks[k]=r;save();drawWeeks();drawGames();later();return}
    const w=e.target.closest('[data-w]');if(w){wk=+w.dataset.w;drawWeeks();drawGames();return}
    const a=e.target.closest('[data-a]');if(!a)return;const act=a.dataset.a;
    if(act==='chalk')G.filter(g=>g.w===wk).forEach(g=>{locks[g.k]=ppg(T[g.a])>=ppg(T[g.b])?g.a:g.b});
    if(act==='clrw')G.filter(g=>g.w===wk).forEach(g=>delete locks[g.k]);if(act==='clr')locks={};
    if(act==='share'){const u=location.href.split('#')[0]+'#scenarios/'+enc(locks,G);(navigator.clipboard?navigator.clipboard.writeText(u):Promise.reject()).then(()=>toast('🔗 Scenario link copied')).catch(()=>toast('Copy this: '+esc(u),6000));return}
    save();drawWeeks();drawGames();later()});
  drawWeeks();drawGames();run()};


// ---------------- Race page: canonical odds in the table + 🧮 CLINCH WATCH ----------------
{const _r=R.race;R.race=async(el,arg)=>{await _r(el,arg);if(arg&&/^\d{4}$/.test(arg))return;const C=await ctx();if(C.lg.status!=='in_season')return;
  const G=remGames(C.M,C.last,C.pws),CL=clinch(C.T,G,C.pt,{}),T=C.T;
  const order=Object.keys(T).map(Number).sort((a,b)=>CL[a].pos-CL[b].pos);
  const ln=i=>{const c=CL[i],t=T[i];return`<li class="${t.wz?'wz':''}"><span class="cw-n"><b>${c.pos}.</b> <a href="#team/${i}">${esc(t.team)}</a> <small>${rec(t)} · ${c.R} left</small></span>${chip(c,T)||'<span class="cl">—</span>'}</li>`};
  const nX=order.filter(i=>CL[i].po).length,nE=order.filter(i=>CL[i].elim).length;
  const html=`<section class="panel cw" id="clinch"><h2>🧮 CLINCH WATCH</h2><div class="hint">Strict math with ${G.length/ (C.n/2)|0} week${G.length/(C.n/2)===1?'':'s'} left (weeks ${C.last+1}–${C.pws-1}). ${nX?`<b>${nX}</b> clinched`:'Nobody has clinched'}${nE?`, <b>${nE}</b> eliminated`:', nobody eliminated'}. Tiebreak is points for, so a tie in wins never counts as safe.</div>
    <ol class="cw-l">${order.map(ln).join('')}</ol><a class="cta" href="#scenarios">🔮 Open the Playoff Machine: pick this week's winners →</a></section>`;
  const first=[...el.querySelectorAll('section.panel')].find(s=>/PLAYOFF RACE/.test(s.textContent));if(first)first.insertAdjacentHTML('afterend',html);else el.insertAdjacentHTML('afterbegin',html);
  // the race table shows the canonical odds (same sim as Tank Race / Playoff Machine)
  try{const S=SNTank.simTank(T,C.M,C.last,C.pws,C.pt,SNTank.N);const tbl=first&&first.querySelector('tbody');if(tbl){
    const rows=[...tbl.querySelectorAll('tr')];rows.forEach(tr=>{const a=tr.querySelector('a[href^="#team/"]');if(!a)return;const rid=+a.getAttribute('href').split('/')[1],s=S[rid];if(!s)return;const td=tr.querySelectorAll('td');
      if(td[3])td[3].innerHTML=`<b>${pc(s.po)}</b>`;if(td[4])td[4].textContent=pc(s.seed[0]);tr._k=[s.po,s.seed[0],T[rid].w,T[rid].pf];a.insertAdjacentHTML('afterend',badge(CL[rid]))});
    rows.sort((x,y)=>{const a=x._k||[0,0,0,0],b=y._k||[0,0,0,0];return b[0]-a[0]||b[1]-a[1]||b[2]-a[2]||b[3]-a[3]}).forEach((tr,i)=>{tr.classList.toggle('po',i<C.pt);tbl.appendChild(tr)});
    const h=first.querySelector('.hint');if(h)h.innerHTML=h.innerHTML.replace(/3,000 simulated finishes/,`${SNTank.N.toLocaleString()} simulated finishes`).replace('Arrows = playoff-odds change since last week.','Same simulation as the Tank Race and the Playoff Machine. Arrows = playoff-odds change since last week. x = clinched, y = bye, z = #1 seed, e = eliminated.')}}catch(e){console.warn(e)}}}

// ---------------- ⏳ TRADE DEADLINE (from Sleeper's trade_deadline week + ESPN's schedule for that week) ----------------
async function deadline(){if(deadline.p)return deadline.p;return deadline.p=(async()=>{const {lg,state}=await current(),w=+(lg.settings||{}).trade_deadline||0;
  if(!w||w>18||lg.status!=='in_season')return null;
  const k='sn:dl:'+LEAGUE+':'+w;let d=CST.get(k,1);
  if(!d||Date.now()-d.at>6*36e5){try{const sb=await fetch(`https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?week=${w}&seasontype=2&dates=${lg.season}`).then(r=>r.ok?r.json():null);
      const ev=(sb&&sb.events)||[];if(ev.length){const ks=ev.map(e=>+new Date(e.date)).sort((a,b)=>a-b),done=ev.every(e=>((e.competitions[0].status||e.status).type||{}).state==='post');
        d={at:Date.now(),w,lastKick:ks[ks.length-1],end:ks[ks.length-1]+3.5*36e5,done};CST.set(k,d,1)}}catch(e){}}
  if(!d){const cw=+state.week||0;return{w,end:0,passed:cw>w,approx:true}}
  return{w,end:d.end,lastKick:d.lastKick,passed:d.done||Date.now()>d.end}})().catch(()=>null)}
const ETF=new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',weekday:'short',month:'short',day:'numeric',hour:'numeric',minute:'2-digit'});
const left=ms=>{if(ms<=0)return'now';const d=Math.floor(ms/864e5),h=Math.floor(ms%864e5/36e5),m=Math.floor(ms%36e5/6e4);return d?`${d}d ${h}h`:h?`${h}h ${m}m`:`${m}m`};
const dlLine=D0=>D0.passed?`Trades are locked (Week ${D0.w} deadline passed). They reopen when the league renews for next season.`:D0.end?`Trades lock when the last Week ${D0.w} game ends (kickoff ${ETF.format(new Date(D0.lastKick))} ET, so roughly ${ETF.format(new Date(D0.end))} ET).`:`Trades lock after Week ${D0.w}.`;
window.SNDeadline={deadline,left,dlLine};
setInterval(()=>document.querySelectorAll('[data-dl]').forEach(x=>{const e=+x.dataset.dl;x.textContent=e>Date.now()?left(e-Date.now()):'LOCKED'}),30000);

// ---------------- 📆 DEADLINE DESK (top of Fleece Factory): buyer / bubble / seller board, each linked to its Fleece ideas ----------------
{const _f=R.fleece;R.fleece=async(el,arg)=>{await _f(el,arg);const [C,D0,V]=await Promise.all([ctx(),deadline(),values()]);if(!D0||C.lg.status!=='in_season')return;
  const T=C.T,S=SNTank.simTank(T,C.M,C.last,C.pws,C.pt,SNTank.N),ids=Object.keys(T).map(Number);const P=await playersFor(ids.flatMap(i=>T[i].players));
  const PD=posData(T,V,P),n=ids.length;
  const age=p=>V.a[p]||0,pos=p=>((P[p]||{}).p||[])[0]||'',old=p=>{const a=age(p),ps=pos(p);return a&&(ps==='RB'?a>=26:ps==='QB'?a>=32:a>=28)};
  const role=s=>s.po>=0.8?['buy','🛒 BUYER','Contender. Push chips in.']:s.po>=0.2?['bub','🎲 BUBBLE','Buy or bail. Pick a lane.']:['sell','🏷️ SELLER','Cash vets for picks and youth.'];
  const rows=ids.sort((a,b)=>S[b].po-S[a].po||T[b].pf-T[a].pf).map(i=>{const t=T[i],s=S[i],[k,lbl,why]=role(s),rk=PD.rk[i]||{},weak=POS4.slice().sort((a,b)=>(rk[b]||0)-(rk[a]||0))[0];
    const vets=t.players.filter(old).sort((a,b)=>(V.p[b]||0)-(V.p[a]||0)).slice(0,2).filter(p=>(V.p[p]||0)>=1500);
    const tip=k==='sell'?(vets.length?`Sell high: <b>${vets.map(p=>esc((PL[p]||P[p]||{}).n||'')).join('</b>, <b>')}</b>`:'No aging stars to cash. Hold and tank.'):`Weak spot: <b>${weak}</b> (#${rk[weak]} of ${n})`;
    return`<tr class="${t.wz?'wz':''}"><td class="tm"><a href="#team/${i}">${esc(t.team)}</a><span class="ow dd-why">${why}</span><span class="ow dd-mob">${tip.replace(/<\/?b>/g,'')}</span></td><td><b>${pc(s.po)}</b></td><td><span class="role ${k}">${lbl}</span></td><td class="dd-tip">${tip}<br><a class="dd-go" href="#fleece/team=${i}">🧶 Fleece ideas →</a></td></tr>`}).join('');
  const box=document.createElement('section');box.className='panel dd';box.id='deadline';
  box.innerHTML=`<h2>📆 DEADLINE DESK</h2><div class="dd-cd">${D0.passed?'<b>🔒 TRADES LOCKED</b>':`⏳ <b data-dl="${D0.end||0}">${D0.end?left(D0.end-Date.now()):'Week '+D0.w}</b> <span>until the trade deadline</span>`}</div><div class="hint">${dlLine(D0)} Roles from the canonical playoff odds: 80%+ buy, under 20% sell, everybody in between is on the bubble.</div>
    ${D0.passed?'':`<div class="tw"><table class="dd-t"><thead><tr><th>TEAM</th><th>PLAYOFFS</th><th>ROLE</th><th>MOVE</th></tr></thead><tbody>${rows}</tbody></table></div>`}`;
  el.insertBefore(box,el.firstChild)}}
// deep link #fleece/team=<rid>: pre-filter the Fleece Factory to that team once the filter bar is wired
{const _a=R.after;R.after=k=>{if(_a)_a(k);if(k!=='fleece')return;const m=/team=(\d+)/.exec(location.hash);if(!m)return;
  const sel=document.querySelector('[data-tf="ff"] select[data-f="team"]');if(sel){sel.value=m[1];sel.dispatchEvent(new Event('change'));const box=document.querySelector('[data-fl="ff"]');if(box)setTimeout(()=>box.scrollIntoView({behavior:'smooth',block:'start'}),60)}}}

// ---------------- 👟🍺 THE SHOEY LEDGER (Recap): lowest regular-season score each week owes a shoey ----------------
async function ledger(){const C=await ctx(),{T,M,last}=C;const cur={};Object.values(T).forEach(t=>cur[t.uid]={t,n:0,w:[],all:0,allW:[]});
  for(let w=1;w<=last;w++){const ms=(M[w-1]||[]).filter(m=>T[m.roster_id]&&m.points!=null);if(!ms.length)continue;const lo=ms.reduce((a,b)=>+b.points<+a.points?b:a);const u=T[lo.roster_id].uid;if(cur[u]){cur[u].n++;cur[u].w.push([w,+lo.points])}}
  try{const S=await all();S.forEach(s=>{if(String(s.season)===String(C.lg.season))return;s.wk.forEach((wk,wi)=>{if(wi+1>=s.pws||!wk.length)return;const lo=wk.reduce((a,b)=>b[2]<a[2]?b:a),tm=s.teams[lo[0]];if(tm&&cur[tm.uid]){cur[tm.uid].all++;cur[tm.uid].allW.push(s.season+' wk '+(wi+1))}})})}catch(e){}
  const L=Object.values(cur);L.forEach(x=>x.all+=x.n);return{L,season:C.lg.season,last}}
const SLR=["{T} has chugged from the boot {n} times this season. The league should name the shoe.","{T}: {n} shoeys and counting. That's not a slump, that's a lifestyle.","{T} leads the league in shoeys owed ({n}). Somebody buy this man a bigger boot."];
function ledgerHTML(X){const L=[...X.L].sort((a,b)=>b.n-a.n||b.all-a.all||a.t.team.localeCompare(b.t.team)),top=L[0],boots=n=>n?'👟'.repeat(Math.min(n,6))+(n>6?'+':''):'—';
  return`<section class="panel ledger" id="ledger"><h2>👟🍺 THE SHOEY LEDGER · ${esc(X.season)}</h2><div class="hint">League-low score each regular-season week owes the league a shoey. Weeks 1–${X.last} this season; all-time counts every season since 2021 (by manager, so renamed teams keep their tab).</div>
   ${top&&top.n?`<div class="rl">${pickOf(SLR,'sl'+X.last).replace('{T}',`<b>${esc(top.t.team)}</b>`).replace('{n}',top.n)}</div>`:''}
   <div class="tw"><table><thead><tr><th>#</th><th>TEAM</th><th>${esc(X.season)}</th><th class="hs">WEEKS</th><th>ALL-TIME</th></tr></thead><tbody>${L.map((x,i)=>`<tr class="${x.t.wz?'wz':''}"><td>${i+1}</td><td class="tm"><a href="#team/${x.t.rid}">${esc(x.t.team)}</a>${tag(x.t)}<span class="ow">${boots(x.n)}</span></td><td><b>${x.n}</b></td><td class="hs">${x.w.map(([w,p])=>`<span title="${fmt(p)} pts">wk ${w}</span>`).join(', ')||'—'}</td><td title="${esc(x.allW.slice(-8).join(', '))}">${x.all}</td></tr>`).join('')}</tbody></table></div></section>`}
window.SNLedger={ledger,ledgerHTML};
{const _rc=R.recap;R.recap=async(el,arg)=>{await _rc(el,arg);const box=document.createElement('div');box.innerHTML=`<section class="panel" id="ledger">${SPIN('Counting the shoeys…')}</section>`;
  const a=el.querySelector('#sawards')||el.querySelector('#rcard')||el.querySelector('#awards');if(a)a.after(box);else el.appendChild(box);
  ledger().then(X=>{box.innerHTML=ledgerHTML(X)}).catch(e=>{console.warn(e);box.innerHTML=''})}}

// ---------------- Home: stretch-run strip (deadline + clinch + ledger) and clinch badges in the standings ----------------
{const _h=R.home;R.home=async(el,arg)=>{await _h(el,arg);const C=await ctx().catch(()=>null);if(!C||C.lg.status!=='in_season')return;
  const G=remGames(C.M,C.last,C.pws),CL=clinch(C.T,G,C.pt,{}),T=C.T;
  const st=[...el.querySelectorAll('section.panel')].find(s=>/STANDINGS/.test((s.querySelector('h2')||{}).textContent||''));
  if(st)st.querySelectorAll('tbody tr').forEach(tr=>{const a=tr.querySelector('a[href^="#team/"]');if(a){const c=CL[+a.getAttribute('href').split('/')[1]];if(c)a.insertAdjacentHTML('afterend',badge(c))}});
  if(st){const h=st.querySelector('.hint');if(h)h.innerHTML+=' x = clinched · y = bye · z = #1 seed · e = eliminated. <a href="#scenarios">Playoff Machine →</a>'}
  const [D0,X]=await Promise.all([deadline(),ledger().catch(()=>null)]);
  const nX=Object.values(CL).filter(c=>c.po).length,nE=Object.values(CL).filter(c=>c.elim).length,bub=Object.keys(T).map(Number).filter(i=>!CL[i].po&&!CL[i].elim).length;
  const sl=X?[...X.L].sort((a,b)=>b.n-a.n)[0]:null;
  const cards=[D0?`<a class="sr sr-dl" href="#deadline">${D0.passed?'<span class="sr-k">🔒 TRADES LOCKED</span><span class="sr-v">Deadline passed</span>':`<span class="sr-k">⏳ TRADE DEADLINE</span><span class="sr-v" data-dl="${D0.end||0}">${D0.end?left(D0.end-Date.now()):'Wk '+D0.w}</span>`}<span class="sr-l">${D0.passed?'Reopens at renewal':'After Week '+D0.w+' · Deadline Desk →'}</span></a>`:'',
    `<a class="sr" href="#scenarios"><span class="sr-k">🔮 PLAYOFF MACHINE</span><span class="sr-v">${bub} alive</span><span class="sr-l">${nX} clinched · ${nE} eliminated · pick winners →</span></a>`,
    sl&&sl.n?`<a class="sr" href="#ledger" data-go="recap"><span class="sr-k">👟🍺 SHOEY LEDGER</span><span class="sr-v">${esc(sl.t.team)}</span><span class="sr-l">${sl.n} shoey${sl.n===1?'':'s'} owed this season</span></a>`:''].join('');
  const hx=el.querySelector('.hx');const strip=`<section class="srs" aria-label="Stretch run">${cards}</section>`;if(hx)hx.insertAdjacentHTML('afterend',strip);else el.insertAdjacentHTML('afterbegin',strip)}}
// #ledger / #deadline / #clinch are anchors inside pages: route them to their page, then scroll
document.addEventListener('click',e=>{const a=e.target.closest&&e.target.closest('a[href="#ledger"],a[href="#deadline"],a[href="#clinch"]');if(!a)return;e.preventDefault();
  const id=a.getAttribute('href').slice(1),pg={ledger:'recap',deadline:'fleece',clinch:'race'}[id];location.hash='#'+pg;const t0=Date.now(),tick=()=>{const x=document.getElementById(id);if(x&&!x.querySelector('.spin'))x.scrollIntoView({behavior:'smooth',block:'start'});else if(Date.now()-t0<15000)setTimeout(tick,250)};setTimeout(tick,300)});
})();
