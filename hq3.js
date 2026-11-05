// SHADYNASTY HQ, round 3: ⚖️ Trade Analyzer (#analyzer) and 🥊 Matchups / Tale of the Tape (#matchups).
// Every number is computed in the browser from live Sleeper data + FantasyCalc dynasty superflex values. Nothing hard-coded.
(function(){
const css=`.ta-pick{display:grid;grid-template-columns:1fr auto 1fr;gap:8px;align-items:center;margin:8px 0 12px}
.ta-pick select{width:100%;min-height:44px;border-radius:10px;border:1px solid var(--line);background:#0d1220;color:var(--ink);font:600 15px var(--disp);letter-spacing:.03em;padding:0 10px}
.ta-vs{font:700 16px var(--disp);color:var(--gold)}
.ta-sum{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:10px 0}
.ta-box{border:1px solid var(--line);border-radius:12px;padding:10px;background:rgba(255,255,255,.03)}
.ta-box h3{margin:0 0 6px;font:700 15px var(--disp);letter-spacing:.05em;color:var(--gold)}
.ta-box .tot{font:700 26px var(--disp)}.ta-box .sub{color:var(--mute);font-size:12px}
.ta-sel{display:flex;flex-wrap:wrap;gap:6px;margin-top:6px}.ta-sel button{border:0;border-radius:999px;padding:6px 10px;background:rgba(255,199,44,.16);color:var(--ink);font-size:12px;cursor:pointer}
.ta-verdict{text-align:center;padding:12px;border-radius:12px;margin:10px 0;font:700 20px var(--disp);letter-spacing:.04em;background:linear-gradient(180deg,rgba(255,199,44,.18),rgba(255,199,44,.05));border:1px solid rgba(255,199,44,.35)}
.ta-verdict small{display:block;font:500 13px/1.35 -apple-system,Segoe UI,Roboto,Arial,sans-serif;color:var(--mute);letter-spacing:0;margin-top:4px}
.ta-cols{display:grid;grid-template-columns:1fr 1fr;gap:10px}@media(max-width:640px){.ta-cols{grid-template-columns:1fr}.ta-list{max-height:340px}}
.ta-list{max-height:520px;overflow:auto;border:1px solid var(--line);border-radius:12px}
.ta-row{display:flex;align-items:center;gap:8px;width:100%;min-height:44px;padding:6px 10px;border:0;border-bottom:1px solid var(--line);background:none;color:var(--ink);text-align:left;cursor:pointer;font-size:13px}
.ta-row:hover{background:rgba(255,255,255,.04)}.ta-row.on{background:rgba(255,199,44,.18)}
.ta-row .ps{flex:0 0 34px;font:700 11px var(--disp);color:var(--mute)}.ta-row .nm{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.ta-row .vl{font:700 13px var(--disp);color:var(--gold)}
.ta-row .ck{flex:0 0 20px;text-align:center}
.ta-rank{width:100%;border-collapse:collapse;font-size:13px}.ta-rank td,.ta-rank th{padding:6px;border-bottom:1px solid var(--line);text-align:left}.ta-rank th{color:var(--mute);font:600 11px var(--disp);letter-spacing:.06em}
.ta-btns{display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin:6px 0}.ta-btns button{min-height:44px;padding:0 16px;border-radius:10px;border:0;font:700 14px var(--disp);letter-spacing:.05em;cursor:pointer;color:#1a1200;background:linear-gradient(180deg,#ffe07a,#e3a400)}
.ta-btns button.ghost{background:rgba(255,255,255,.08);color:var(--ink)}
.mu-card{border:1px solid var(--line);border-radius:14px;padding:12px;margin:12px 0;background:rgba(255,255,255,.03)}
.mu-card.gotw{border-color:rgba(255,199,44,.55);box-shadow:0 0 0 1px rgba(255,199,44,.25),0 8px 22px rgba(0,0,0,.35)}
.mu-tag{display:inline-block;font:700 11px var(--disp);letter-spacing:.08em;color:#1a1200;background:var(--gold);border-radius:6px;padding:2px 7px;margin-bottom:6px}
.mu-head{display:grid;grid-template-columns:1fr auto 1fr;gap:8px;align-items:center}
.mu-tm{display:flex;flex-direction:column;align-items:center;text-align:center;gap:4px;min-width:0}.mu-tm img{width:44px;height:44px;border-radius:50%;object-fit:cover;background:#111}
.mu-tm b{font:700 15px var(--disp);letter-spacing:.03em;overflow-wrap:anywhere}.mu-tm small{color:var(--mute);font-size:12px}
.mu-sc{text-align:center;font:700 22px var(--disp)}.mu-sc small{display:block;font:500 11px var(--disp);color:var(--mute);letter-spacing:.06em}
.mu-tape{width:100%;border-collapse:collapse;margin-top:10px;font-size:13px}.mu-tape td{padding:5px 4px;border-top:1px solid var(--line)}
.mu-tape td:first-child{text-align:right;width:36%}.mu-tape td:last-child{width:36%}.mu-tape td.k{text-align:center;color:var(--mute);font:600 11px var(--disp);letter-spacing:.06em;width:28%}
.mu-tape .w{color:var(--gold);font-weight:700}
.mu-line{margin-top:8px;font-size:13px}.mu-warn{margin-top:6px;font-size:12px;color:#ff9b9b}`;
const st=document.createElement('style');st.textContent=css;document.head.appendChild(st);

const ORDN=['','1st','2nd','3rd','4th','5th'];
const posOf=id=>(((PL[id]||{}).p)||[])[0]||'';
const pickKey=p=>'k'+p.s+'r'+p.r+'o'+p.o;
const pickLabel=(p,T)=>`${p.s} ${ORDN[p.r]||('R'+p.r)}${T[p.o]?' ('+esc(T[p.o].team)+')':''}`;
const pctS=x=>Math.round(x*100)+'%';

// ---------------- ⚖️ TRADE ANALYZER ----------------
R.analyzer=async(el,arg)=>{
  const {lg,T,tp}=await current();const V=await values();
  const ids=Object.values(T).flatMap(t=>t.players);PL=Object.assign(PL,await playersFor(ids));
  const TV=teamValue(T,V,tp,lg),teams=Object.values(T).sort((a,b)=>a.team.localeCompare(b.team));
  // asset catalogue per team: players + picks they currently own (3 future drafts)
  const assets={};for(const t of teams){const a=t.players.map(id=>({k:id,lbl:pn(id),ps:posOf(id)||'–',v:V.p[id]||0,age:V.a[id]}));
    (TV[t.rid]?TV[t.rid].picks:[]).forEach(p=>a.push({k:pickKey(p),lbl:pickLabel(p,T),ps:'PICK',v:p.v,pick:1}));
    a.sort((x,y)=>y.v-x.v);assets[t.rid]=a}
  // state from the hash: A.B.idsA.idsB  (ids comma-separated)
  const S={a:null,b:null,ga:new Set(),gb:new Set()};
  if(arg){const p=decodeURIComponent(arg).split('.');if(T[p[0]])S.a=+p[0];if(T[p[1]])S.b=+p[1];(p[2]||'').split(',').filter(Boolean).forEach(x=>S.ga.add(x));(p[3]||'').split(',').filter(Boolean).forEach(x=>S.gb.add(x))}
  if(!S.a){const me=teams.find(t=>t.wz);S.a=me?me.rid:teams[0].rid}
  if(!S.b||S.b===S.a){const ra=TV[S.a].tot;S.b=teams.filter(t=>t.rid!==S.a).sort((x,y)=>Math.abs(TV[x.rid].tot-ra)-Math.abs(TV[y.rid].tot-ra))[0].rid}
  const valid=(rid,set)=>{const ok=new Set(assets[rid].map(x=>x.k));[...set].forEach(k=>{if(!ok.has(k))set.delete(k)})};valid(S.a,S.ga);valid(S.b,S.gb);
  const find=(rid,k)=>assets[rid].find(x=>x.k===k);
  const hashOf=()=>`#analyzer/${S.a}.${S.b}.${[...S.ga].join(',')}.${[...S.gb].join(',')}`;
  const opt=sel=>teams.map(t=>`<option value="${t.rid}"${t.rid===sel?' selected':''}>${esc(t.team)}</option>`).join('');
  el.innerHTML=`<section class="panel" id="ta"><h2>⚖️ TRADE ANALYZER</h2>
   <div class="hint">Build any deal between two teams. Tap players and picks to put them on the table. Values are FantasyCalc dynasty superflex (12-team, PPR), pulled live; picks are valued by round and year. Ranks are total roster + 3 years of picks.</div>
   <div class="ta-pick"><select id="taA" aria-label="Team A">${opt(S.a)}</select><span class="ta-vs">VS</span><select id="taB" aria-label="Team B">${opt(S.b)}</select></div>
   <div id="taOut"></div><div class="ta-cols"><div><h3 class="ta-h" id="taHA"></h3><div class="ta-list" id="taLA"></div></div><div><h3 class="ta-h" id="taHB"></h3><div class="ta-list" id="taLB"></div></div></div>
   <div class="hint" style="margin-top:10px">Raw value sums favor the side getting more pieces; a 2-for-1 that looks "even" usually favors whoever gets the best single player. Roster limits and lineups are ignored. FantasyCalc values as of ${V.at?new Date(V.at).toLocaleString('en-US',{timeZone:'America/New_York',month:'short',day:'numeric',hour:'numeric',minute:'2-digit'})+' ET':'today'}.</div></section>`;
  // route() renders into a detached box and then moves its children into #view, so bind to the section itself
  const root=el.querySelector('#ta'),$$=s=>root.querySelector(s);
  function list(rid,set){return assets[rid].map(x=>`<button class="ta-row${set.has(x.k)?' on':''}" data-k="${esc(x.k)}"><span class="ck">${set.has(x.k)?'✅':'＋'}</span><span class="ps">${esc(x.ps)}</span><span class="nm">${x.lbl}${x.age?` <small style="color:var(--mute)">${x.age}</small>`:''}</span><span class="vl">${x.v?int(x.v):'–'}</span></button>`).join('')||'<div class="hint" style="padding:10px">Empty roster.</div>'}
  function draw(){const A=T[S.a],B=T[S.b],ga=[...S.ga].map(k=>find(S.a,k)).filter(Boolean),gb=[...S.gb].map(k=>find(S.b,k)).filter(Boolean);
    const sa=ga.reduce((s,x)=>s+x.v,0),sb=gb.reduce((s,x)=>s+x.v,0);// sa = what A sends (B receives)
    $$('#taHA').textContent=A.team+' sends';$$('#taHB').textContent=B.team+' sends';
    $$('#taLA').innerHTML=list(S.a,S.ga);$$('#taLB').innerHTML=list(S.b,S.gb);
    let out='';
    if(!ga.length&&!gb.length)out=`<div class="ta-verdict">Pick something to trade<small>Tap players or picks from either team below.</small></div>`;
    else{const big=Math.max(sa,sb),gap=big?Math.abs(sa-sb)/big:0,winA=sb>sa;// A wins if A receives more than it sends
      const w=winA?A:B,l=winA?B:A;let v,sub;
      if(!ga.length||!gb.length){v='That\'s a gift, not a trade';sub=`${esc((ga.length?B:A).team)} gets ${int(Math.max(sa,sb))} in value for nothing.`}
      else if(gap<0.05){v='Fair deal 🤝';sub=`Within ${pctS(gap)}. Both sides can sell it to the group chat.`}
      else if(gap<0.15){v=`Lean ${esc(w.team)}`;sub=`${esc(w.team)} comes out ${int(Math.abs(sa-sb))} ahead (${pctS(gap)}). Close enough to haggle.`}
      else if(gap<0.35){v=`${esc(w.team)} wins this`;sub=`${int(Math.abs(sa-sb))} in value (${pctS(gap)}). ${esc(l.team)} should ask for more.`}
      else{v=`🧶 Fleece alert: ${esc(w.team)}`;sub=`${int(Math.abs(sa-sb))} in value (${pctS(gap)}). Screenshot this before it gets accepted.`}
      const ba=ga.slice().sort((x,y)=>y.v-x.v)[0],bb=gb.slice().sort((x,y)=>y.v-x.v)[0];
      const best=ba&&bb&&ba.v!==bb.v&&ga.length!==gb.length?`<div class="hint" style="text-align:center">Best single asset: <b>${(ba.v>bb.v?ba:bb).lbl}</b> (${int(Math.max(ba.v,bb.v))}), going to ${esc((ba.v>bb.v?B:A).team)}.</div>`:'';
      // value ranks before / after
      const tot={};for(const t of teams)tot[t.rid]=TV[t.rid].tot;const aft=Object.assign({},tot);aft[S.a]+=sb-sa;aft[S.b]+=sa-sb;
      const rk=m=>{const o={};Object.keys(m).sort((x,y)=>m[y]-m[x]).forEach((r,i)=>o[r]=i+1);return o},r0=rk(tot),r1=rk(aft);
      const row=t=>`<tr><td>${esc(t.team)}</td><td>${int(tot[t.rid])} <small style="color:var(--mute)">#${r0[t.rid]}</small></td><td>${int(aft[t.rid])} <small style="color:var(--mute)">#${r1[t.rid]}</small></td><td>${r1[t.rid]<r0[t.rid]?'⬆️ '+(r0[t.rid]-r1[t.rid]):r1[t.rid]>r0[t.rid]?'⬇️ '+(r1[t.rid]-r0[t.rid]):'–'}</td></tr>`;
      out=`<div class="ta-sum"><div class="ta-box"><h3>${esc(A.team)} gets</h3><div class="tot">${int(sb)}</div><div class="sub">${gb.length} asset${gb.length===1?'':'s'}</div><div class="ta-sel">${gb.map(x=>`<button data-side="b" data-k="${esc(x.k)}">${x.lbl} ✕</button>`).join('')}</div></div>
        <div class="ta-box"><h3>${esc(B.team)} gets</h3><div class="tot">${int(sa)}</div><div class="sub">${ga.length} asset${ga.length===1?'':'s'}</div><div class="ta-sel">${ga.map(x=>`<button data-side="a" data-k="${esc(x.k)}">${x.lbl} ✕</button>`).join('')}</div></div></div>
        <div class="ta-verdict">${v}<small>${sub}</small></div>${best}
        <div class="tw"><table class="ta-rank"><thead><tr><th>TEAM</th><th>VALUE NOW</th><th>AFTER</th><th>RANK</th></tr></thead><tbody>${row(A)}${row(B)}</tbody></table></div>
        <div class="ta-btns"><button id="taCopy">🔗 COPY LINK TO THIS TRADE</button><button class="ghost" id="taClear">CLEAR</button></div>`}
    $$('#taOut').innerHTML=out;
    try{history.replaceState(null,'',hashOf())}catch(e){}}
  function tog(side,k){const set=side==='a'?S.ga:S.gb;set.has(k)?set.delete(k):set.add(k);draw()}
  root.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;
    if(b.id==='taCopy'){const u=location.href.split('#')[0]+hashOf();const done=()=>{b.textContent='✅ LINK COPIED';setTimeout(()=>{b.textContent='🔗 COPY LINK TO THIS TRADE'},1800)};
      if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(u).then(done,()=>prompt('Copy this link:',u));else prompt('Copy this link:',u);return}
    if(b.id==='taClear'){S.ga.clear();S.gb.clear();draw();return}
    if(b.dataset.side){tog(b.dataset.side,b.dataset.k);return}
    if(b.classList.contains('ta-row')){tog(b.closest('#taLA')?'a':'b',b.dataset.k)}});
  root.addEventListener('change',e=>{if(e.target.id==='taA'||e.target.id==='taB'){const a=+$$('#taA').value,b=+$$('#taB').value;
    if(a===b){if(e.target.id==='taA')$$('#taB').value=S.a;else $$('#taA').value=S.b;const x=+$$('#taA').value,y=+$$('#taB').value;S.a=x;S.b=y}else{S.a=a;S.b=b}
    S.ga.clear();S.gb.clear();draw()}});
  draw()};

// ---------------- 🥊 MATCHUPS / TALE OF THE TAPE ----------------
R.matchups=async(el,arg)=>{
  const {state,lg,T}=await current();const season=String(lg.season),inSeason=String(state.season)===season&&(state.season_type==='regular'||state.season_type==='post');
  let wk=+(arg||0)||(inSeason?+state.week:0);
  const last=+lg.settings.last_scored_leg||0;if(!wk)wk=Math.max(1,last||1);
  const [M,S,pj]=await Promise.all([jc('league/'+LEAGUE+'/matchups/'+wk).catch(()=>[]),all(),weekProj(lg,wk).catch(()=>({}))]);
  PL=Object.assign(PL,await playersFor((M||[]).flatMap(m=>m.starters||[]).filter(x=>x&&x!=='0')));
  const h=h2hData(S),G=games(S,{all:true}),pws=+lg.settings.playoff_week_start||15;
  const byId={};(M||[]).forEach(m=>{if(m.matchup_id!=null)(byId[m.matchup_id]=byId[m.matchup_id]||[]).push(m)});
  const pairs=Object.values(byId).filter(p=>p.length===2&&T[p[0].roster_id]&&T[p[1].roster_id]);
  const side=m=>{const t=T[m.roster_id],sts=(m.starters||[]);const proj=sts.reduce((a,id)=>a+(id&&id!=='0'?(pj[id]||0):0),0);
    const empty=sts.filter(id=>!id||id==='0').length,zero=sts.filter(id=>id&&id!=='0'&&!(pj[id]>0)).map(id=>pn(id));return{t,m,pts:+m.points||0,proj,empty,zero}};
  const pfRank={};Object.values(T).sort((a,b)=>b.pf-a.pf).forEach((t,i)=>pfRank[t.rid]=i+1);
  const cards=pairs.map(p=>{let a=side(p[0]),b=side(p[1]);if(b.t.wz||(!a.t.wz&&b.proj>a.proj)){const x=a;a=b;b=x}
    const r=h[a.t.uid+'|'+b.t.uid]||{w:0,l:0,t:0,pw:0,pl:0,pf:0,pa:0,n:0,last:null};
    const mine=G.filter(g=>((g.a.uid===a.t.uid&&g.b.uid===b.t.uid)||(g.a.uid===b.t.uid&&g.b.uid===a.t.uid))&&(g.a.p>0||g.b.p>0));
    const blow=mine.filter(g=>!(+g.s===+season&&g.week>=wk)).sort((x,y)=>Math.abs(y.a.p-y.b.p)-Math.abs(x.a.p-x.b.p))[0];
    return{a,b,r,blow,diff:Math.abs(a.proj-b.proj)}});
  const started=cards.some(c=>c.a.pts>0||c.b.pts>0);
  const gotw=cards.filter(c=>c.a.proj>0&&c.b.proj>0).sort((x,y)=>x.diff-y.diff)[0];
  const rec=t=>`${t.w}-${t.l}${t.t?'-'+t.t:''}`;
  const card=c=>{const {a,b,r}=c,A=a.t,B=b.t,tie=r.w===r.l;
    const series=!r.n?'First-ever regular-season meeting.':tie?`All-time series tied ${r.w}-${r.l}${r.t?'-'+r.t:''}.`:`${esc(r.w>r.l?A.team:B.team)} leads the all-time series ${Math.max(r.w,r.l)}-${Math.min(r.w,r.l)}${r.t?'-'+r.t:''}.`;
    const po=r.pw+r.pl?` Playoffs: ${esc(A.team)} ${r.pw}-${r.pl}.`:'';
    const lastM=r.last?` Last regular-season meeting: ${r.last.s} wk ${r.last.week}, ${fmt(r.last.p)}-${fmt(r.last.o)} ${r.last.p>r.last.o?esc(A.team):r.last.p<r.last.o?esc(B.team):'tie'}.`:'';
    let blow='';if(c.blow){const g=c.blow,wA=g.a.uid===A.uid?g.a.p>g.b.p:g.b.p>g.a.p,hi=Math.max(g.a.p,g.b.p),lo=Math.min(g.a.p,g.b.p);blow=`<div class="mu-line">💥 Biggest blowout: <b>${esc(wA?A.team:B.team)}</b> by ${fmt(hi-lo)} (${fmt(hi)}-${fmt(lo)}, ${g.s} wk ${g.week}${g.po?', playoffs':''}).</div>`}
    const fav=a.proj&&b.proj?(Math.abs(a.proj-b.proj)<0.5?'Dead even on paper':`${esc(a.proj>b.proj?A.team:B.team)} by ${fmt(Math.abs(a.proj-b.proj))}`):'';
    const tape=[['RECORD',rec(A),rec(B),A.w-B.w],['POINTS FOR',`${fmt(A.pf)} (#${pfRank[A.rid]})`,`${fmt(B.pf)} (#${pfRank[B.rid]})`,A.pf-B.pf],['MAX PF',fmt(A.max),fmt(B.max),A.max-B.max],['ALL-TIME H2H',`${r.w}`,`${r.l}`,r.w-r.l],['AVG IN SERIES',r.n?fmt(r.pf/r.n):'–',r.n?fmt(r.pa/r.n):'–',r.n?r.pf-r.pa:0]];
    const warn=s=>{const x=[];if(s.empty)x.push(`${s.empty} empty starting slot${s.empty>1?'s':''}`);if(s.zero.length)x.push(`starting ${s.zero.slice(0,3).join(', ')} at 0 projected`);return x.length?`<div class="mu-warn">⚠️ ${esc(s.t.team)}: ${x.join('; ')}.</div>`:''};
    const img=t=>t.av?`<img src="${esc(t.av)}" alt="" loading="lazy" width="44" height="44">`:'';
    return`<div class="mu-card${c===gotw?' gotw':''}">${c===gotw?'<span class="mu-tag">🔥 GAME OF THE WEEK</span>':''}
      <div class="mu-head"><a class="mu-tm" href="#team/${A.rid}" style="color:inherit;text-decoration:none">${img(A)}<b>${esc(A.team)}</b><small>${rec(A)}</small></a>
      <div class="mu-sc">${started?`${fmt(a.pts)}<small>VS</small>${fmt(b.pts)}`:`${fmt(a.proj)}<small>PROJ</small>${fmt(b.proj)}`}</div>
      <a class="mu-tm" href="#team/${B.rid}" style="color:inherit;text-decoration:none">${img(B)}<b>${esc(B.team)}</b><small>${rec(B)}</small></a></div>
      ${started&&(a.proj||b.proj)?`<div class="hint" style="text-align:center;margin-top:4px">Pre-game projection ${fmt(a.proj)} - ${fmt(b.proj)}</div>`:''}
      ${fav?`<div class="hint" style="text-align:center;margin-top:2px">Projected: ${fav}</div>`:''}
      <table class="mu-tape">${tape.map(([k,x,y,d])=>`<tr><td class="${d>0?'w':''}">${x}</td><td class="k">${k}</td><td class="${d<0?'w':''}">${y}</td></tr>`).join('')}</table>
      <div class="mu-line">📜 ${series}${po}${lastM}</div>${blow}${warn(a)}${warn(b)}</div>`};
  const wkN=+lg.settings.playoff_week_start?Math.max(+lg.settings.playoff_week_start+2,wk):17;
  const nav=`<div class="ta-btns">${wk>1?`<button class="ghost" data-wk="${wk-1}">◀ WEEK ${wk-1}</button>`:''}${wk<wkN?`<button class="ghost" data-wk="${wk+1}">WEEK ${wk+1} ▶</button>`:''}</div>`;
  el.innerHTML=`<section class="panel"><h2>🥊 WEEK ${wk} MATCHUPS${wk>=pws?' · PLAYOFFS':''}</h2>
    <div class="hint">Tale of the tape for every matchup: this season's numbers, the all-time head-to-head (keyed on the manager, so renamed teams keep their history), the last meeting and the biggest beatdown. Projections are Sleeper's, scored with this league's settings; the Home page has live win odds during games.</div>
    ${cards.length?cards.map(card).join(''):`<div class="hint" style="margin:14px 0">No matchups posted for week ${wk} yet.</div>`}${nav}</section>`;
  el.firstElementChild.addEventListener('click',e=>{const b=e.target.closest('button[data-wk]');if(b)location.hash='#matchups/'+b.dataset.wk})};
})();
