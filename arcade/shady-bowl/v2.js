'use strict';
// SHADY BOWL v2: defense you play, offline, real weekly rosters + injuries, rivalries, difficulty, records,
// weekly results roasts, 2-pt / onside / two-minute drill, upgrades, announcer voice + richer audio.
(function(){
const D0={diff:'pro',vol:.8,voice:true,rec:{},cache:null};
for(const k in D0)if(SV[k]==null)SV[k]=D0[k];SV.up.ol=SV.up.ol||0;SV.rec=Object.assign({pts:0,margin:null,longTD:0,longPass:0,longRun:0,bestSeason:null,wins:0,losses:0,games:0,sacks:0,dints:0,rivalW:0,rivalL:0,drillW:0,drillL:0,twoPt:0,onside:0,coinsAll:0},SV.rec);
const DIFFS={rookie:{n:'ROOKIE',st:-.12,err:.7,time:1.3,zone:.36,nd:.8,gain:.75,ai:0,d:'Wide-open receivers, slow pass rush, easy timing'},pro:{n:'PRO',st:0,err:1,time:1,zone:.25,nd:1.05,gain:1,ai:.3,d:'The real deal'},dynasty:{n:'DYNASTY',st:.12,err:1.3,time:.82,zone:.17,nd:1.35,gain:1.25,ai:.6,d:'Tight coverage, fast rush, tiny windows. No mercy.'}};
window.DIFF=()=>DIFFS[SV.diff]||DIFFS.pro;
const BRETT_ID='603082868373135360',iOS=/iPhone|iPad|iPod/.test(navigator.userAgent)||(navigator.platform=='MacIntel'&&navigator.maxTouchPoints>1);
const SB=window.__SB;SB.spoken=[];SB.sounds=[];
// ================= AUDIO =================
const AU={c:null,m:null,nb:null,crowd:null};
function ac(){try{if(!AU.c){const C=window.AudioContext||window.webkitAudioContext;if(!C)return null;AU.c=new C();AU.m=AU.c.createGain();AU.m.connect(AU.c.destination);const n=AU.c.sampleRate*2,b=AU.c.createBuffer(1,n,AU.c.sampleRate),a=b.getChannelData(0);for(let i=0;i<n;i++)a[i]=Math.random()*2-1;AU.nb=b;setVol()}
  if(AU.c.state=='suspended')AU.c.resume().catch(()=>{});return AU.c}catch(e){return null}}
function setVol(){if(AU.m)AU.m.gain.value=SV.mute?0:SV.vol}
function env(g,t,v,a,d){g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(Math.max(.0002,v),t+a);g.gain.exponentialRampToValueAtTime(.0001,t+a+d)}
function nz(t,o){const c=AU.c,s=c.createBufferSource(),f=c.createBiquadFilter(),g=c.createGain();s.buffer=AU.nb;s.loop=true;f.type=o.type||'bandpass';f.frequency.setValueAtTime(o.f||1000,t);if(o.f2)f.frequency.exponentialRampToValueAtTime(o.f2,t+o.d);f.Q.value=o.q||1;s.connect(f);f.connect(g);g.connect(o.dest||AU.m);env(g,t,o.v||.3,o.a||.01,o.d||.3);s.start(t,Math.random());s.stop(t+(o.a||.01)+(o.d||.3)+.05);return g}
function tn(t,o){const c=AU.c,s=c.createOscillator(),g=c.createGain();s.type=o.type||'sine';s.frequency.setValueAtTime(o.f,t);if(o.f2)s.frequency.exponentialRampToValueAtTime(o.f2,t+(o.a||.01)+o.d);if(o.det)s.detune.value=o.det;let n=g;if(o.lp){const f=c.createBiquadFilter();f.type='lowpass';f.frequency.value=o.lp;s.connect(f);f.connect(g)}else s.connect(g);g.connect(o.dest||AU.m);env(g,t,o.v||.2,o.a||.01,o.d||.2);s.start(t);s.stop(t+(o.a||.01)+o.d+.05);return s}
function roar(t,v,d){nz(t,{f:900,q:.4,v:v||.45,a:.35,d:d||2.2});nz(t,{f:2600,q:.7,v:(v||.45)*.4,a:.3,d:(d||2.2)*.8})}
function boo(t){[110,123,138,147,165].forEach((f,i)=>tn(t+i*.04,{type:'sawtooth',f:f*1.1,f2:f*.8,lp:520,v:.08,a:.25,d:1.6,det:(Math.random()-.5)*40}));nz(t,{f:350,q:2,v:.25,a:.3,d:1.6})}
function whistle(t){const c=AU.c,o=c.createOscillator(),l=c.createOscillator(),lg=c.createGain(),g=c.createGain();o.frequency.value=2950;l.frequency.value=28;lg.gain.value=160;l.connect(lg);lg.connect(o.frequency);o.connect(g);g.connect(AU.m);env(g,t,.12,.02,.45);o.start(t);l.start(t);o.stop(t+.55);l.stop(t+.55);nz(t,{f:3000,q:3,v:.05,d:.45})}
function hit(t,v){nz(t,{type:'lowpass',f:900,v:.7*(v||1),d:.13});tn(t,{f:95,f2:38,v:.55*(v||1),d:.2});nz(t,{type:'highpass',f:2500,v:.15,d:.05})}
function horn(t){[233,294,349].forEach(f=>tn(t,{type:'sawtooth',f,lp:1400,v:.09,a:.04,d:1.1}))}
function sting(t){const N=[[392,.13],[523,.13],[659,.13],[784,.26],[659,.13],[784,.4]];let k=t;N.forEach(([f,d])=>{tn(k,{type:'square',f,lp:2600,v:.07,d:d*.9});tn(k,{type:'triangle',f:f/2,v:.08,d:d*.9});k+=d})}
function crowdOn(on){const c=ac();if(!c)return;if(on&&!AU.crowd){const s=c.createBufferSource(),f=c.createBiquadFilter(),g=c.createGain(),l=c.createOscillator(),lg=c.createGain();s.buffer=AU.nb;s.loop=true;f.type='bandpass';f.frequency.value=650;f.Q.value=.35;g.gain.value=.05;l.frequency.value=.13;lg.gain.value=.02;l.connect(lg);lg.connect(g.gain);s.connect(f);f.connect(g);g.connect(AU.m);s.start();l.start();AU.crowd={s,l,g}}
  else if(!on&&AU.crowd){try{AU.crowd.s.stop();AU.crowd.l.stop()}catch(e){}AU.crowd=null}}
window.snd=snd=function(type){SB.sounds.push(type);if(SV.mute)return;const c=ac();if(!c)return;const t=c.currentTime+.01,heel=G&&G.me&&G.me.heel;
  switch(type){
  case'hike':tn(t,{type:'square',f:170,f2:120,lp:900,v:.18,d:.12});nz(t,{f:600,v:.15,d:.08});break;
  case'whistle':whistle(t);break;
  case'throw':nz(t,{f:500,f2:2400,q:2,v:.25,a:.05,d:.3});break;
  case'catch':tn(t,{f:120,f2:55,v:.6,d:.16});nz(t,{type:'lowpass',f:400,v:.35,d:.08});nz(t+.05,{f:1200,q:.5,v:.12,a:.1,d:.6});break;
  case'hit':hit(t);break;
  case'juke':tn(t,{f:1700,f2:2700,v:.08,d:.08});tn(t+.09,{f:2100,f2:3000,v:.06,d:.06});break;
  case'boo':boo(t);break;
  case'td':horn(t);if(heel)boo(t+.2);else{roar(t,.5,2.6);sting(t+1.1)}break;
  case'kick':tn(t,{f:150,f2:50,v:.7,d:.15});nz(t,{type:'lowpass',f:600,v:.4,d:.07});break;
  case'bad':tn(t,{type:'sawtooth',f:240,f2:110,lp:600,v:.1,a:.1,d:.8});nz(t,{f:400,q:.8,v:.2,a:.15,d:.9});break;
  case'roar':roar(t);break;case'sting':sting(t);break;case'horn':horn(t);break;
  case'sack':hit(t,1.3);roar(t+.1,.35,1.5);break;
  }};
// ================= ANNOUNCER =================
const VO={v:null,ok:!!window.speechSynthesis};
function pickVoice(){if(!VO.ok)return;const vs=speechSynthesis.getVoices().filter(v=>/^en/i.test(v.lang));if(!vs.length)return;
  const pref=['Evan','Nathan','Aaron','Tom','Alex','Reed','Rocko','Ralph','Fred','Google US English','Microsoft Guy','Microsoft Davis','Microsoft Christopher','Daniel'];
  const sc=v=>{let s=/en[-_]US/i.test(v.lang)?50:0;const i=pref.findIndex(p=>v.name.includes(p));if(i>=0)s+=40-i*2;if(/Enhanced|Premium|Natural|Neural/i.test(v.name))s+=15;if(/female|Samantha|Karen|Moira|Tessa|Victoria|Zira|Aria|Jenny/i.test(v.name))s-=30;return s};
  VO.v=vs.sort((a,b)=>sc(b)-sc(a))[0]}
if(VO.ok){pickVoice();speechSynthesis.onvoiceschanged=pickVoice}
function clean(s){return String(s).replace(/[\u{1F000}-\u{1FFFF}\u2600-\u27BF\uFE0F]/gu,'').replace(/\bTD\b/g,'touchdown').replace(/\bINT\b/g,'interception').replace(/\byds\b/g,'yards').replace(/\s+/g,' ').trim()}
function speak(text,pri){const t=clean(text);if(!t)return;SB.spoken.push(t);if(!VO.ok||!SV.voice||SV.mute)return;try{if(pri)speechSynthesis.cancel();else if(speechSynthesis.pending)return;
  const u=new SpeechSynthesisUtterance(t);if(VO.v)u.voice=VO.v;u.lang='en-US';u.rate=VO.v&&/Google/.test(VO.v.name)?1.02:1.1;u.pitch=.68;u.volume=Math.min(1,SV.vol+.15);speechSynthesis.speak(u)}catch(e){}}
SB.speak=speak;
// unlock on first tap (iOS)
let unlocked=false;function unlock(){if(unlocked)return;unlocked=true;try{if(navigator.audioSession)navigator.audioSession.type='playback'}catch(e){}
  const c=ac();if(c){const b=c.createBuffer(1,1,22050),s=c.createBufferSource();s.buffer=b;s.connect(c.destination);s.start(0)}
  if(VO.ok){try{const u=new SpeechSynthesisUtterance(' ');u.volume=0;speechSynthesis.speak(u)}catch(e){}}
  setTimeout(()=>{if(cur=='title')paintExtras()},600)}
['pointerdown','touchend','keydown','click'].forEach(e=>document.addEventListener(e,unlock,{capture:true,passive:true}));
function mutedHint(){return iOS&&!SV.mute?`<div class="lb" id="silent">🔕 No sound? Flip the iPhone silent switch off (no orange) and turn up the volume.</div>`:(AU.c&&AU.c.state!='running'&&unlocked?`<div class="lb">Audio is blocked. Tap anywhere to wake it up.</div>`:'')}
// ================= LIVE DATA =================
const API2='https://api.sleeper.app/v1/',LG='1312055708249767936',j=u=>fetch(u).then(r=>{if(!r.ok)throw Error(r.status);return r.json()});
const LV={state:null,src:'none',roast:null,rivals:{},h2h:null};
const INJ=s=>s=='Out'||s=='IR'||s=='Doubtful'||s=='PUP'||s=='Sus'?'hurt':s=='Questionable'?'limited':null;
function applyCache(c){if(!c)return;Object.assign(NAMES,c.NAMES||{});Object.assign(MATCH,c.MATCH||{});if(c.WEEK)WEEK=c.WEEK;(c.T||[]).forEach(x=>{const t=TM(x.id);if(t)Object.assign(t,x)});if(c.roast)LV.roast=c.roast;if(c.h2h)LV.h2h=c.h2h}
function saveCache(){try{localStorage.setItem('sb2live',JSON.stringify({at:Date.now(),NAMES,MATCH,WEEK,T:TEAMS.map(t=>({id:t.id,team:t.team,av:t.av,w:t.w,l:t.l})),roast:LV.roast,h2h:LV.h2h}))}catch(e){}}
try{applyCache(JSON.parse(localStorage.getItem('sb2live')||'null'));if(NAMES&&Object.keys(NAMES).length)LV.src='cache'}catch(e){}
async function loadLive2(){
  try{const [users,rosters,state,pd]=await Promise.all([j(API2+'league/'+LG+'/users'),j(API2+'league/'+LG+'/rosters'),j(API2+'state/nfl'),j('../../data/players.json').catch(()=>({p:{}}))]);
    LV.state=state;const P=pd.p||{};
    users.forEach(u=>{const t=TM(u.user_id);if(!t)return;const n=(u.metadata&&u.metadata.team_name||'').replace(/[\u{1F3C6}]/gu,'').trim();if(n)t.team=n;if(u.avatar)t.av=u.avatar});
    const rid={};rosters.forEach(r=>{const t=TM(r.owner_id);rid[r.roster_id]=r.owner_id;if(t&&r.settings){t.w=r.settings.wins;t.l=r.settings.losses}});
    WEEK=state.week;
    rosters.forEach(r=>{const st=(r.starters||[]).filter(x=>P[x]);const nm=x=>{const n=P[x].n.split(' ');return n.slice(1).join(' ')||n[0]},pos=x=>P[x].p[0],inj=x=>INJ(P[x].i||(P[x].s=='Injured Reserve'?'IR':''));
      const q=st.find(x=>pos(x)=='QB'),b=st.find(x=>pos(x)=='RB'),w=st.filter(x=>pos(x)=='WR'||pos(x)=='TE').slice(0,3);
      NAMES[r.owner_id]={QB:q?nm(q):'the QB',RB:b?nm(b):'the RB',WR:w.map(nm),inj:{QB:q&&inj(q),RB:b&&inj(b),WR:w.map(inj)},raw:{QB:q&&P[q].i,RB:b&&P[b].i,WR:w.map(x=>P[x].i||null)},list:st.map(x=>({n:P[x].n,p:pos(x),i:P[x].i||(P[x].s=='Injured Reserve'?'IR':null)}))}});
    try{const ms=await j(API2+'league/'+LG+'/matchups/'+WEEK);const by={};ms.forEach(m=>{(by[m.matchup_id]=by[m.matchup_id]||[]).push(rid[m.roster_id])});Object.values(by).forEach(p=>{if(p.length==2){MATCH[p[0]]=p[1];MATCH[p[1]]=p[0]}})}catch(e){}
    try{await roasts(state,rid,P)}catch(e){}
    LV.src='live';saveCache();
    rivalry().then(()=>{saveCache();if(cur=='title')title()}).catch(()=>{});
  }catch(e){LV.src=Object.keys(NAMES).length?'cache':'none'}}
// ---- weekly real-results roasts ----
async function roasts(state,rid,P){const wk=(state.season_type=='regular'?state.week:(state.season_type=='post'?18:1))-1;if(wk<1)return;
  const ms=await j(API2+'league/'+LG+'/matchups/'+wk);if(!ms.some(m=>m.points>0))return;
  const T=id=>TM(rid[id]),name=id=>{const t=T(id);return t?t.team:'Somebody'},by={},rows=[];
  ms.forEach(m=>{(by[m.matchup_id]=by[m.matchup_id]||[]).push(m);
    const bench=(m.players||[]).filter(x=>!(m.starters||[]).includes(x)),pp=m.players_points||{};let best=null;
    (m.starters||[]).forEach((s,i)=>{const sp=(m.starters_points||[])[i]||0,ps=P[s]&&P[s].p[0];if(!ps)return;bench.forEach(b=>{if(P[b]&&P[b].p[0]==ps&&(pp[b]||0)-sp>((best&&best.d)||3))best={d:(pp[b]||0)-sp,b:P[b].n,s:P[s].n}})});
    rows.push({id:m.roster_id,pts:m.points||0,bench:best})});
  const games=Object.values(by).filter(p=>p.length==2).map(([a,b])=>a.points>=b.points?{w:a,l:b}:{w:b,l:a});
  const f=n=>(Math.round(n*10)/10).toFixed(1),L=[];const tags={};const add=(s,ids)=>{L.push(s);ids.forEach(i=>{const o=rid[i];(tags[o]=tags[o]||[]).push(s)})};
  const blow=games.slice().sort((a,b)=>(b.w.points-b.l.points)-(a.w.points-a.l.points))[0];
  if(blow)add(pick([`${name(blow.w.roster_id)} beat the living shit out of ${name(blow.l.roster_id)}, ${f(blow.w.points)} to ${f(blow.l.points)}. That's not a matchup, that's a fucking crime scene.`,`${name(blow.l.roster_id)} got their ass handed to them by ${f(blow.w.points-blow.l.points)} points. Set your lineup next time, for fuck's sake.`]),[blow.w.roster_id,blow.l.roster_id]);
  const hi=rows.slice().sort((a,b)=>b.pts-a.pts)[0];if(hi)add(`${name(hi.id)} dropped ${f(hi.pts)} in week ${wk}. Hottest fucking lineup in the league, and they won't shut up about it.`,[hi.id]);
  const lo=rows.slice().sort((a,b)=>a.pts-b.pts)[0];if(lo)add(`${name(lo.id)} put up a pathetic ${f(lo.pts)}. A kicker and a prayer would've scored more.`,[lo.id]);
  const bl=rows.filter(r=>r.bench).sort((a,b)=>b.bench.d-a.bench.d)[0];if(bl)add(`${name(bl.id)} left ${f(bl.bench.d)} points rotting on the bench with ${bl.bench.b} sitting there while ${bl.bench.s} took a dump. Benching genius.`,[bl.id]);
  const bad=games.slice().sort((a,b)=>b.l.points-a.l.points)[0];if(bad&&bad!==blow)add(`${name(bad.l.roster_id)} scored ${f(bad.l.points)} and still fucking lost. The fantasy gods took a dump on that roster.`,[bad.l.roster_id]);
  const close=games.slice().sort((a,b)=>(a.w.points-a.l.points)-(b.w.points-b.l.points))[0];if(close&&close.w.points-close.l.points<6)add(`${name(close.l.roster_id)} lost by ${f(close.w.points-close.l.points)}. Choked like a week 14 playoff lineup.`,[close.l.roster_id]);
  LV.roast={wk,lines:L,tags}}
function roastFor(ids){const r=LV.roast;if(!r)return[];const o=[];ids.forEach(i=>(r.tags[i]||[]).forEach(s=>{if(!o.includes(s))o.push(s)}));return o}
// ---- rivalry: all-time regular-season head-to-head (same games/rivals logic as HQ #rivalry, keyed on Sleeper owner) ----
async function rivalry(){let id=LG;const C=JSON.parse(localStorage.getItem('sb2h2h')||'{}'),games=[];const st=LV.state||await j(API2+'state/nfl');
  for(let n=0;id&&id!='0'&&n<12;n++){const lg=await j(API2+'league/'+id);let G2=C[id];
    if(!G2){const ro=await j(API2+'league/'+id+'/rosters'),rid={};ro.forEach(r=>rid[r.roster_id]=r.owner_id);const pws=+(lg.settings&&lg.settings.playoff_week_start)||15;
      const last=lg.status=='complete'?pws-1:Math.min(pws-1,(lg.season==st.season?st.week-1:pws-1));G2=[];
      const wks=await Promise.all(Array.from({length:Math.max(0,last)},(_,i)=>j(API2+'league/'+id+'/matchups/'+(i+1)).catch(()=>[])));
      wks.forEach((ms,wi)=>{const by={};ms.forEach(m=>{if(m.matchup_id!=null)(by[m.matchup_id]=by[m.matchup_id]||[]).push(m)});Object.values(by).forEach(p=>{if(p.length==2&&(p[0].points||p[1].points))G2.push([rid[p[0].roster_id],p[0].points,rid[p[1].roster_id],p[1].points,lg.season,wi+1])})});
      if(lg.status=='complete')C[id]=G2}
    games.push(...G2);id=lg.previous_league_id}
  try{localStorage.setItem('sb2h2h',JSON.stringify(C))}catch(e){}
  const h={};games.forEach(([a,pa,b,pb])=>{for(const [x,px,y,py] of [[a,pa,b,pb],[b,pb,a,pa]]){const k=x+'|'+y,r=h[k]=h[k]||{w:0,l:0,t:0,pf:0,pa:0,n:0};r.n++;r.pf+=px;r.pa+=py;if(px>py)r.w++;else if(py>px)r.l++;else r.t++}});LV.h2h=h}
function rivalsOf(me){const h=LV.h2h;if(!h)return[];const L=TEAMS.filter(t=>t.id!=me).map(t=>({t,r:h[me+'|'+t.id]})).filter(x=>x.r&&x.r.n>=2);
  const top=L.slice().sort((a,b)=>b.r.n-a.r.n||Math.abs(a.r.w-a.r.l)-Math.abs(b.r.w-b.r.l)).slice(0,3);const nem=L.slice().sort((a,b)=>a.r.w/a.r.n-b.r.w/b.r.n||b.r.l-a.r.l)[0];if(nem&&!top.includes(nem))top.push(nem);
  return top.map(x=>Object.assign({nem:x===nem},x))}
SB.rivalsOf=rivalsOf;SB.LV=LV;
// ================= SERVICE WORKER / OFFLINE =================
let offline=false;
if('serviceWorker' in navigator&&location.protocol!='file:'){navigator.serviceWorker.register('sw.js?v=2').then(()=>navigator.serviceWorker.ready).then(async()=>{const c=await caches.open('sb-v2-core-2');const k=await c.keys();offline=k.length>=5;if(cur=='title')paintExtras()}).catch(()=>{})}
// ================= DIFFICULTY-AWARE FORMATION + INJURIES =================
const _form=form;window.form=form=function(play){const E=_form(play),df=DIFF(),n=NAMES[G.me.id];E.forEach(e=>{if(!e.o){e.spd*=1+df.st*.4;if(e.react!=null)e.react=Math.max(.05,e.react-df.st*.6)}});
  if(n&&n.inj){const set=(e,s)=>{if(!s)return;e.spd*=s=='hurt'?.78:.92;e.inj=s};E.forEach(e=>{if(e.role=='qb')set(e,n.inj.QB);if(e.role=='rb')set(e,n.inj.RB);if(e.role=='wr')set(e,(n.inj.WR||[])[e.wi])})}
  E.forEach(e=>{if(e.role=='dl')e.str=Math.max(.05,e.str-SV.up.ol*.05)});return E};
const _snap=snap;window.snap=snap=function(p){G.snapLos=G.los;_snap(p);const h=G.ents.filter(e=>e.inj);if(h.length&&R()<.5){const e=pick(h);floatTxt(e.inj=='hurt'?'🤕 HURT':'⚠ LIMITED',e)}};
// ================= PLAY RESULTS: records, voice, two-point =================
const _endPlay=endPlay;window.endPlay=endPlay=function(kind,spot){if(!G||G.phase!='play')return;
  if(G.two){G.two=0;G.phase='after';G.after=2.4;const ok=kind=='td';if(ok){G.sc[0]+=2;SV.rec.twoPt++;bigTxt('2 PTS!',G.me.c[0]);snd('roar');confetti(G.me,25)}else snd('bad');const l=say(ok?'twoGood':'twoBad');msg(l,2.4);speak(l,1);updHud();G.next=()=>driveOver('TD',25);return}
  const from=G.snapLos!=null?G.snapLos:G.los,wasRun=G.play=='run',c=G.carrier;_endPlay(kind,spot);const m=$('#msg').textContent,yd=Math.round((kind=='td'?100:spot||from)-from);
  if(kind=='td'){SV.rec.longTD=Math.max(SV.rec.longTD,yd);speak(m,1)}else if(kind=='int'||kind=='sack'||kind=='safety')speak(m,1);
  else if(kind=='tackle'||kind=='oob'){if(yd>=15){const l=say('big');speak(l+' '+m,1);snd('roar')}}
  if(kind=='td'||kind=='tackle'||kind=='oob'){if(wasRun||(c&&c.role=='qb'))SV.rec.longRun=Math.max(SV.rec.longRun,yd);else SV.rec.longPass=Math.max(SV.rec.longPass,yd)}
  if(G.drill)G.clock-=3;save()};
const _km=kickMeter;window.kickMeter=kickMeter=function(kind,dist){if(kind!='xp'||G.drill&&G.sc[0]+1<G.sc[1]&&false)return _km(kind,dist);G.phase='choose';const b=$('#pre');b.style.display='flex';
  b.innerHTML=`<button class="pb blu" data-x="xp">KICK XP<small>1 pt, easy</small></button><button class="pb red" data-x="two">GO FOR 2<small>from the 2, one snap</small></button>`;
  b.onclick=e=>{const x=e.target.closest('[data-x]');if(!x||G.phase!='choose')return;b.onclick=null;b.style.display='none';if(x.dataset.x=='xp')return _km('xp',dist);
    const l=say('two');msg(l,2);speak(l,1);G.two=1;G.los=98;G.down=1;G.togo=2;G.fd=100;preSnap();$('#pre').querySelectorAll('[data-p="punt"],[data-p="fg"]').forEach(e=>e.remove())}};
const _punt=punt;window.punt=punt=function(){_punt();speak(say('stall')+' '+$('#msg').textContent)};
// ================= TWO-MINUTE DRILL CLOCK =================
const _update=update;window.update=update=function(dt){_update(dt);if(G&&G.drill&&(G.phase=='play'||G.phase=='pre')){G.clock-=dt;if(G.clock<=0&&G.phase=='pre'){G.clock=0;G.phase='after';G.after=.8;bigTxt('TIME!','#ff4a4a');snd('whistle');G.next=()=>final()}}};
const _updHud=updHud;window.updHud=updHud=function(){_updHud();if(G&&G.drill){const c=Math.max(0,G.clock),s=`${(c/60)|0}:${String((c%60)|0).padStart(2,'0')}`;$('#dd').textContent='⏱ '+s+' · '+$('#dd').textContent.replace(/^Q\d · /,'')}if(G&&G.two)$('#dd').textContent='2-PT TRY · from the 2'};
// ================= PREGAME CARD (lineups, injuries, rivalry, roasts) =================
function lineupHTML(t){const n=NAMES[t.id];if(!n||!n.list)return`<div class="lb">Lineup: ${LV.src=='none'?'offline, generic squad':'loading…'}</div>`;
  return`<div style="text-align:left;font-size:12px;line-height:1.45">${n.list.filter(p=>/QB|RB|WR|TE/.test(p.p)).map(p=>`${p.p} ${esc(p.n)}${p.i?` <b style="color:${INJ(p.i)=='hurt'?'#ff6a6a':'#ffd23f'}">${INJ(p.i)=='hurt'?'🤕 '+esc(p.i)+' · HURT':'⚠ '+esc(p.i)+' · LIMITED'}</b>`:''}`).join('<br>')}</div>`}
const _newGame=newGame;window.newGame=newGame=function(a,b,mode){_newGame(a,b,mode);crowdOn(true);if(mode=='drill'){const base=pick([10,13,14,17,20]);G.sc=[base,base+pick([4,5,6])];G.drill=1;G.clock=120;G.drv=4;G.odrv=4}G.snapLos=G.los;const riv=rivalsOf(a).find(x=>x.t.id==b);G.rival=riv||null;
  G.phase='card';hud(false);$('#pre').style.display='none';$('#msg').style.display='none';const me=G.me,O=G.opp,r=riv&&riv.r;
  const rl=riv?pick(riv.r.w>riv.r.l?[`${me.team} owns ${O.team}, ${r.w}-${r.l} all-time. Rent-free, every fucking week.`,`${O.team} is ${r.l}-${r.w} against ${me.team}. That's not a rivalry, that's a hostage situation.`]:riv.r.w<riv.r.l?[`${O.team} has your number, ${r.l}-${r.w} all-time. Today you shove it up their ass or eat it again.`,`${r.w}-${r.l} against these assholes. Nemesis energy. Do not fucking choke.`]:[`Dead even at ${r.w}-${r.l}. Somebody's getting bragging rights and somebody's getting roasted.`]):'';
  const ro=roastFor([a,b]).slice(0,2),intro=riv?rl:(ro[0]||say('kickoff')),D=DIFF();
  $('#s-card').innerHTML=`<div class="card" style="${riv?'border-color:#ff3b3b;box-shadow:0 0 24px #ff3b3b88':''}">${riv?`<div class="D" style="background:linear-gradient(90deg,#b5121b,#ff5a5a,#b5121b);color:#fff;border-radius:8px;padding:4px;font-size:20px;animation:pop .5s">🔥 RIVALRY GAME 🔥 · DOUBLE COINS · RECORD ON THE LINE</div>`:''}
   <div class="lb">${mode=='week'?'WEEK '+WEEK+' REAL MATCHUP':mode=='season'?'SEASON GAME':mode=='drill'?'TWO-MINUTE DRILL':'QUICK GAME'} · ${D.n}</div><h2 class="D">${esc(me.team)} vs ${esc(O.team)}</h2>
   ${riv?`<div class="D" style="font-size:30px;color:#ffe07a">ALL-TIME ${r.w}-${r.l}${r.t?'-'+r.t:''}</div><div class="lb">${r.n} regular-season meetings · ${(r.pf/r.n).toFixed(1)} to ${(r.pa/r.n).toFixed(1)} avg</div>`:''}
   <p>${esc(intro)}</p>${ro.length&&riv?`<p class="lb">${esc(ro[0])}</p>`:ro[1]?`<p class="lb">${esc(ro[1])}</p>`:''}
   <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:6px"><div><b class="D">${esc(me.ab)} STARTERS</b>${lineupHTML(me)}</div><div><b class="D">${esc(O.ab)} STARTERS</b>${lineupHTML(O)}</div></div>
   <div class="row" style="position:sticky;bottom:0;padding:6px 0;background:#000c"><button class="pb gr" id="ko">KICKOFF →</button></div></div>`;showScr('s-card');
  speak(riv?'Rivalry game! '+intro:intro,1);snd(riv?'horn':'whistle');
  $('#ko').onclick=()=>{showScr(null);hud(true);if(G.drill){const l=say('drill');msg(l,3);speak(l,1)}else msg(FLAVOR[O.id].intro,3.2);preSnap()}};
// ================= DEFENSE YOU PLAY + ONSIDE =================
const ROUTES={slant:'SLANT',out:'OUT',deep:'DEEP'};
window.driveOver=driveOver=function(why,oppStart){if(G.drill)return final();G.phase='card';hud(false);$('#pre').style.display='none';
  if(why=='DOWNS'||why=='PUNT'||why=='MISS')speak(say('stall'));
  if((why=='TD'||why=='FG')){const el=$('#s-card');el.innerHTML=`<div class="card"><div class="lb">YOU SCORED · ${esc(G.me.ab)} ${G.sc[0]} – ${G.sc[1]} ${esc(G.opp.ab)}</div><h2 class="D">KICKOFF</h2><p>Kick it deep, or get cute and go onside?</p><div class="row"><button class="pb blu" id="deep">KICK DEEP<small>they start at the 25</small></button><button class="pb red" id="ons">ONSIDE<small>${onsChance()}% · fail = short field</small></button></div></div>`;showScr('s-card');
    $('#deep').onclick=()=>defense(25);$('#ons').onclick=()=>{snd('kick');if(R()*100<onsChance()){SV.rec.onside++;save();const l=say('onGood');bigTxt('RECOVERED!',G.me.c[0]);speak(l,1);snd('roar');G.odrv++;showScr(null);hud(true);msg(l,2.6);startDrive(50)}else{const l=say('onBad');speak(l,1);snd('bad');defense(55,l)}};return}
  defense(oppStart)};
function onsChance(){const d=G.sc[1]-G.sc[0];return Math.round((G.drill?30:d>0?22:14)+SV.up.legs*1.5)}
function defense(start,pre){const O=G.opp,df=DIFF(),dB=SV.up.d,el=$('#s-card'),on=NAMES[O.id],oh=on&&on.inj?[on.inj.QB,on.inj.RB,...(on.inj.WR||[])].filter(Boolean).length:0;
  const S={pos:start,n:0,max:3,log:[],last:null,res:null,pts:0};crowdOn(true);
  const gain=(a,b)=>Math.round((a+R()*(b-a))*df.gain*(1-dB*.06)*(1-oh*.05)*(G.ot?1.1:1));
  function view(note){const yl=S.pos>50?'YOUR '+(100-S.pos):S.pos==50?'50':O.ab+' '+S.pos;
    el.innerHTML=`<div class="card" style="max-width:600px"><div class="lb">${pre?esc(pre)+' · ':''}ON DEFENSE · ${df.n} · PLAY ${Math.min(S.n+1,S.max)}/${S.max}</div><h2 class="D" style="margin:4px 0">${esc(O.team)} BALL · ${yl}</h2>
    <div style="position:relative;height:16px;border-radius:8px;background:linear-gradient(90deg,${O.c[0]} 0 4%,#2a7d30 4% 96%,${G.me.c[0]} 96%);border:2px solid #fff6;margin:6px 0"><div style="position:absolute;left:calc(${4+S.pos*.92}% - 6px);top:-3px;font-size:14px">🏈</div></div>
    <p id="dnote" style="min-height:38px;margin:6px 0">${esc(note||'Read it. Blitz, or jump the route you think is coming.')}</p>
    <div id="dctl" class="row" style="${S.over?'display:none':''}" style="margin-top:4px"><button class="pb red" data-d="blitz">🔥 BLITZ<small>sack or get burned</small></button>${Object.entries(ROUTES).map(([k,n])=>`<button class="pb blu" data-d="${k}">JUMP ${n}<small>pick it off</small></button>`).join('')}</div>
    <div id="dbar" style="display:none;margin-top:10px"><div class="D" style="font-size:18px">TAP NOW IN THE BOX!</div><div class="bar" id="dtb" style="position:relative;height:40px;border-radius:10px;background:#0008;border:3px solid #fff"><div id="dz" style="position:absolute;top:0;bottom:0;background:#2fa40099;border:3px solid #7CFC00"></div><div id="dn" style="position:absolute;top:-6px;bottom:-6px;width:6px;background:#fff;box-shadow:0 0 0 2px #000"></div></div></div>
    <div class="D" style="font-size:22px;margin-top:8px">${esc(G.me.ab)} ${G.sc[0]} – ${G.sc[1]} ${esc(O.ab)}</div></div>`;showScr('s-card');
    el.querySelectorAll('[data-d]').forEach(b=>b.onclick=()=>choose(b.dataset.d))}
  function choose(d){let p=pick(['slant','out','deep','run']);if(R()<df.ai&&S.last){if(S.last=='blitz')p=pick(['slant','out']);else if(p==S.last)p=pick(['deep','run','slant','out'].filter(x=>x!=S.last))}
    S.last=d;$('#dctl').style.display='none';$('#dbar').style.display='block';snd('hike');
    const z=Math.min(.5,df.zone+dB*.025),c0=.15+R()*(.7-z);const dz=$('#dz');dz.style.left=c0*100+'%';dz.style.width=z*100+'%';
    let k=0,dir=1,t0=performance.now(),done=false,last=t0;const spd=df.nd*(1.1+R()*.3);
    const tick=now=>{if(done)return;const dt=(now-last)/1000;last=now;k+=dir*spd*dt;if(k>1){k=1;dir=-1}if(k<0){k=0;dir=1}$('#dn').style.left=`calc(${k*100}% - 3px)`;if(now-t0>2600)return fin(false);requestAnimationFrame(tick)};requestAnimationFrame(tick);
    const tap=e=>{e.preventDefault();fin(k>=c0&&k<=c0+z)};const bar=$('#dbar');bar.addEventListener('pointerdown',tap,{once:true});
    function fin(good){if(done)return;done=true;bar.removeEventListener('pointerdown',tap);resolve(d,p,good)}}
  function resolve(d,p,good){let y=0,txt='',key=null,end=null;const pn=p=='run'?'a run':'a '+ROUTES[p].toLowerCase()+' route';
    if(d=='blitz'){if(p=='run'){y=good?-gain(2,5):gain(3,7);txt=good?'Blitz blows up the run!':'Run squirts past the blitz.';key=good?'dstop':null;if(good)snd('hit')}
      else{const sk=good?(p=='deep'?.92:.6):(p=='deep'?.38:.12);if(R()<sk){y=-gain(5,10);key='dsack';SV.rec.sacks++;snd('sack');bigTxt('SACK!',G.me.c[0])}else{y=p=='deep'?gain(28,50):gain(12,24);key='dbig';snd('bad')}}}
    else if(d==p){if(good&&R()<.55+dB*.05-(df.ai*.1)){key='dint';end='INT';SV.rec.dints++;snd('roar');bigTxt('PICKED!',G.me.c[0]);confetti(G.me,30)}else if(good){key='dstop';snd('hit');y=0}else{y=gain(3,7);txt='Right read, late jump. Tackled after the catch.';snd('catch')}}
    else{y=p=='deep'?gain(22,45):p=='run'?gain(4,9):gain(7,15);if(y>=20){key='dbig';snd('bad')}else snd('catch');if(d!='blitz'&&p!='run'&&!txt)txt=`They ran ${pn}. You guessed wrong.`}
    S.pos=Math.max(1,S.pos+y);S.n++;let line=(key?say(key):'')+(txt?' '+txt:'')+(y?` (${y>0?'+':''}${y} yds)`:'');
    if(S.pos>=100){end='TD';S.pts=7;snd('boo');line=say('dtd')}
    if(!end&&S.n>=S.max){if(S.pos>=68){const pf=cl(.9-(100-S.pos)*.012,.4,.95);if(R()<pf){end='FG';S.pts=3}else end='MISS'}else end='PUNT'}
    if(key||end)speak(line.replace(/\(.*\)/,''),!!(key=='dint'||key=='dsack'||end=='TD'));
    S.over=!!end;view(line.trim());if(end)setTimeout(()=>finish(end),1100)}
  function finish(end){G.odrv++;G.sc[1]+=S.pts;const next=end=='INT'?cl(100-S.pos,10,90):end=='PUNT'?Math.round(12+R()*20):end=='MISS'?Math.max(20,100-S.pos):25;
    const done=G.drv>=4+G.ot&&G.odrv>=4+G.ot,res={TD:'TOUCHDOWN',FG:'FIELD GOAL',MISS:'MISSED FG',PUNT:'FORCED PUNT',INT:'INTERCEPTION!'}[end];
    if(end=='FG')snd('bad');if(end=='PUNT'||end=='MISS')snd('roar');
    const line=S.pts?pick(FLAVOR[O.id].opp):pick(FLAVOR[O.id].vs);
    el.innerHTML=`<div class="card"><div class="lb">DEFENSIVE STAND</div><div class="fs">${S.pts==7?'😤':S.pts?'🥅':end=='INT'?'🙌':'🛑'}</div><h2 class="D" style="color:${S.pts?'#ff6a6a':'#7CFC00'}">${res}</h2><p>${esc(line)}</p>
     <div class="D" style="font-size:30px">${esc(G.me.ab)} ${G.sc[0]} – ${G.sc[1]} ${esc(O.ab)}</div><div class="row"><button class="pb" id="cont">${done?(G.sc[0]==G.sc[1]?'OVERTIME →':'FINAL →'):'BACK TO OFFENSE →'}</button></div></div>`;
    $('#cont').onclick=()=>{if(done){if(G.sc[0]==G.sc[1]&&G.ot<3){G.ot++;showScr(null);hud(true);msg('OVERTIME. Somebody finish this shit.',2.4);speak('Overtime! Somebody finish this shit.',1);startDrive(next);return}return final()}showScr(null);hud(true);startDrive(next)}}
  view(pre)}
SB.defense=defense;
// ================= FINAL: records, rivalry, voice =================
const _final=final;window.final=final=function(){const g=G,won=g.sc[0]>g.sc[1],tie=g.sc[0]==g.sc[1],R2=SV.rec;R2.games++;if(won)R2.wins++;else if(!tie)R2.losses++;
  R2.pts=Math.max(R2.pts,g.sc[0]);R2.margin=R2.margin==null?g.sc[0]-g.sc[1]:Math.max(R2.margin,g.sc[0]-g.sc[1]);if(g.rival){won?R2.rivalW++:R2.rivalL++}if(g.drill){won?R2.drillW++:R2.drillL++}
  const c0=SV.coins;_final();R2.coinsAll+=Math.max(0,SV.coins-c0);const s=SV.season;if(g.mode=='season'&&s&&s.done){const b=R2.bestSeason;if(!b||s.w>b.w)R2.bestSeason={w:s.w,l:s.l,team:g.me.team,bowl:!!(s.bowl)}}
  save();crowdOn(false);const p=$('#s-card p');speak((won?'Final! ':'Final. ')+(p?p.textContent:''),1);
  if(g.rival){const c=$('#s-card .card');c&&c.insertAdjacentHTML('afterbegin',`<div class="D" style="background:#b5121b;border-radius:8px;padding:3px;font-size:18px">🔥 RIVALRY ${won?'WIN. Rub it in.':'LOSS. Ouch.'} 🔥</div>`)}
  if(g.drill){const c=$('#s-card .card');c&&c.insertAdjacentHTML('afterbegin',`<div class="D" style="font-size:18px;color:#7fd3ff">⏱ TWO-MINUTE DRILL ${won?'COMEBACK COMPLETE':'FAILED'}</div>`)}};
// ================= SCREENS =================
const _title=title;window.title=title=function(){crowdOn(false);_title();paintExtras()};
function paintExtras(){if(cur!='title')return;const el=$('#s-title'),menu=el.querySelector('.menu');if(!menu)return;el.querySelectorAll('.v2x').forEach(e=>e.remove());const me=SV.team&&TM(SV.team);
  if(me)menu.insertAdjacentHTML('beforeend',`<button class="pb red v2x" id="dr">2-MIN DRILL<small>down by a score, clock running</small></button><button class="pb v2x" id="rc">MY RECORDS<small>${SV.rec.games} games · ${SV.rec.wins}-${SV.rec.losses}</small></button>`);
  menu.insertAdjacentHTML('beforeend',`<button class="pb blu v2x" id="st">SOUND, VOICE &amp; LEVEL<small>${DIFF().n} · ${SV.mute?'sound off':'sound on'} · voice ${SV.voice?'on':'off'}</small></button>`);
  if(me){const riv=rivalsOf(me.id);if(riv.length)menu.insertAdjacentHTML('afterend',`<div class="card v2x"><b class="D">🔥 YOUR RIVALS</b><div style="font-size:13px;margin-top:6px">${riv.map(x=>`${esc(x.t.team)}: <b>${x.r.w}-${x.r.l}</b>${x.nem?' 😈':''}`).join(' · ')}</div><div class="lb">Real all-time head-to-head. Play them for double coins.</div></div>`)}
  if(LV.roast)menu.insertAdjacentHTML('afterend',`<div class="card v2x" style="text-align:left"><b class="D">🎤 WEEK ${LV.roast.wk} ROAST</b>${LV.roast.lines.map(l=>`<p style="margin:6px 0">${esc(l)}</p>`).join('')}</div>`);
  el.insertAdjacentHTML('afterbegin',`<div class="v2x" style="position:absolute;top:calc(env(safe-area-inset-top) + 8px);right:calc(env(safe-area-inset-right) + 10px);font-size:12px;padding:3px 8px;border-radius:10px;background:${offline?'#1d6b25':'#0008'};border:1px solid #7CFC0088" id="offb">${offline?'✓ Ready offline':'…caching'}${LV.src=='cache'?' · cached data':''}</div>`);
  el.insertAdjacentHTML('beforeend',`<div class="v2x">${mutedHint()}</div>`);
  const on=(i,f)=>{const e=$('#'+i);if(e)e.onclick=ev=>{ev.preventDefault();f()}};
  on('dr',()=>{const o=MATCH[me.id]&&R()<.5?TM(MATCH[me.id]):pick(TEAMS.filter(t=>t.id!=me.id));newGame(me.id,o.id,'drill')});
  on('rc',records);on('st',settings)}
function records(){showScr('s-shop');const r=SV.rec,b=r.bestSeason,row=(k,v)=>`<div class="up"><b class="D" style="font-size:17px">${k}</b><b style="font-size:18px;color:#ffe07a">${v}</b></div>`;
  $('#s-shop').innerHTML=`<h2 class="D">MY RECORDS</h2><p class="sub">Saved on this device only.</p><div style="max-width:520px;margin:0 auto">
  ${row('MOST POINTS IN A GAME',r.pts)}${row('BIGGEST WIN MARGIN',r.margin==null?'—':(r.margin>0?'+':'')+r.margin)}${row('LONGEST TD',r.longTD+' yds')}${row('LONGEST PASS PLAY',r.longPass+' yds')}${row('LONGEST RUN',r.longRun+' yds')}
  ${row('BEST SEASON',b?`${b.w}-${b.l}${b.bowl?' · made the Shady Bowl':''}`:'—')}${row('ALL-TIME RECORD',`${r.wins}-${r.losses} (${r.games} games)`)}${row('RIVALRY GAMES',`${r.rivalW}-${r.rivalL}`)}${row('2-MIN DRILL COMEBACKS',`${r.drillW}-${r.drillL}`)}
  ${row('SACKS ON DEFENSE',r.sacks)}${row('INTERCEPTIONS ON DEFENSE',r.dints)}${row('2-PT CONVERSIONS',r.twoPt)}${row('ONSIDE RECOVERIES',r.onside)}${row('COINS EARNED',r.coinsAll+' 🪙')}</div>
  <div class="row"><button class="pb red" id="bk3">← MENU</button></div>`;$('#bk3').onclick=title}
function settings(){showScr('s-shop');const el=$('#s-shop');
  el.innerHTML=`<h2 class="D">SOUND, VOICE &amp; LEVEL</h2><div style="max-width:520px;margin:0 auto">
  <div class="up"><div><b class="D" style="font-size:19px">DIFFICULTY</b><br><small>${esc(DIFF().d)}</small></div><div style="display:flex;gap:6px">${Object.entries(DIFFS).map(([k,d])=>`<button class="pb${SV.diff==k?' gr':''}" style="min-width:0;padding:6px 8px;font-size:15px" data-df="${k}">${d.n}</button>`).join('')}</div></div>
  <div class="up"><div><b class="D" style="font-size:19px">SOUND</b><br><small>Crowd, hits, horn, boos, fight song</small></div><button class="pb${SV.mute?'':' gr'}" id="tg1">${SV.mute?'OFF':'ON'}</button></div>
  <div class="up"><div><b class="D" style="font-size:19px">ANNOUNCER VOICE</b><br><small>R-rated play-by-play, read out loud${VO.v?' · '+esc(VO.v.name):''}</small></div><button class="pb${SV.voice?' gr':''}" id="tg2">${SV.voice?'ON':'OFF'}</button></div>
  <div class="up"><div style="flex:1"><b class="D" style="font-size:19px">VOLUME</b> <span id="vv">${Math.round(SV.vol*100)}%</span><br><input id="vol" type="range" min="0" max="100" value="${Math.round(SV.vol*100)}" style="width:100%;touch-action:pan-x"></div></div>
  <div class="row"><button class="pb blu" id="tst">🎤 TEST ANNOUNCER</button><button class="pb red" id="bk4">← MENU</button></div>${mutedHint()}</div>`;
  el.onclick=e=>{const d=e.target.closest('[data-df]');if(d){SV.diff=d.dataset.df;save();settings()}};
  $('#tg1').onclick=()=>{SV.mute=!SV.mute;save();setVol();$('#mute').textContent=SV.mute?'🔇':'🔊';settings();if(!SV.mute)snd('sting')};
  $('#tg2').onclick=()=>{SV.voice=!SV.voice;save();settings();if(SV.voice)speak('Announcer is on. Let us fucking go.',1)};
  $('#vol').oninput=e=>{SV.vol=e.target.value/100;$('#vv').textContent=e.target.value+'%';setVol()};$('#vol').onchange=()=>{save();snd('catch')};
  $('#tst').onclick=()=>{snd('td');speak(LV.roast?LV.roast.lines[0]:pick(GEN.kickoff),1)};$('#bk4').onclick=title}
// Locker Room: the upgrades that matter
UPS.length=0;UPS.push(['arm','ARM STRENGTH','+3 yds max range per level, tighter, faster throws'],['wheels','RECEIVER SPEED','Faster receivers and backs, more broken tackles'],['ol','OFFENSIVE LINE','More time in the pocket, weaker pass rush'],['d','DEFENSE','Bigger timing window on D, fewer yards allowed'],['hands','HANDS','Bigger catch radius, wins 50/50 balls'],['legs','LEGS','Stamina, kick window, onside odds']);
const cost=l=>40+l*35;
window.shop=shop=function(){showScr('s-shop');const h=UPS.map(([k,n,d])=>{const l=SV.up[k]||0,c=cost(l);return `<div class="up"><div><b class="D" style="font-size:20px">${n}</b> <span class="pips">${'■'.repeat(l)}${'□'.repeat(5-l)}</span><br><small>${d}</small></div>${l<5?`<button class="pb" data-u="${k}" ${SV.coins<c?'disabled style="opacity:.45"':''}>${c} 🪙</button>`:'<b>MAX</b>'}</div>`}).join('');
  $('#s-shop').innerHTML=`<h2 class="D">LOCKER ROOM</h2><p class="sub">Bank: <b>${SV.coins} 🪙</b>. Coins come from <b>Season mode</b> only (TDs, FGs, wins, double in rivalry games). Upgrades stay with you across seasons. Unlike some GMs here, you can't trade future picks for these.</p><div style="max-width:520px;margin:0 auto">${h}</div><div class="row"><button class="pb red" id="bk2">← MENU</button></div>`;
  $('#s-shop').onclick=e=>{const b=e.target.closest('[data-u]');if(b){const k=b.dataset.u,c=cost(SV.up[k]||0);if(SV.coins>=c){SV.coins-=c;SV.up[k]=(SV.up[k]||0)+1;save();snd('sting');shop()}}if(e.target.id=='bk2')title()}};
$('#mute').onclick=()=>{SV.mute=!SV.mute;save();setVol();$('#mute').textContent=SV.mute?'🔇':'🔊';if(SV.mute&&VO.ok)speechSynthesis.cancel();else snd('catch')};
// season: a rival's coin bonus is handled in final(); start
title();loadLive2().then(()=>{if(cur=='title')title();else if(cur=='team')teamSel()});
Object.assign(SB,{newGame,endPlay,snap,DIFFS,records,settings,shop,unlock,AU,get offline(){return offline}});
})();
