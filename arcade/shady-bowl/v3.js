'use strict';
// SHADY BOWL v3: reliable kick taps, haptics, instant replay, slow-mo, FG wind + sweet spot, tap-to-skip, halftime/postgame.
(function(){const SB=window.__SB,speak=(t,p)=>SB.speak&&SB.speak(t,p);
const vib=p=>{try{navigator.vibrate&&navigator.vibrate(p)}catch(e){}};SB.vib=vib;
// ---- bigger tap zones ----
const st=document.createElement('style');st.textContent=`.pb{min-height:62px;min-width:96px;padding:8px 16px}.menu .pb{min-height:66px}.ib{width:52px;height:52px}
#kick{bottom:calc(env(safe-area-inset-bottom) + 70px);width:min(92vw,560px);padding:14px 10px;touch-action:none;cursor:pointer}#kick .bar{height:56px}
#kick .sweet{position:absolute;top:0;bottom:0;background:#7CFC00aa;border-left:2px solid #fff;border-right:2px solid #fff}
#kwind{font:600 13px/1 -apple-system,Arial;margin-top:8px;opacity:.95}#kick .hint{font:600 11px -apple-system,Arial;opacity:.7;margin-top:6px}
#rpl{position:fixed;top:calc(env(safe-area-inset-top) + 58px);left:50%;transform:translateX(-50%);display:none;font-size:22px;color:#ff4a4a;text-shadow:2px 2px 0 #000;pointer-events:none;letter-spacing:.1em}
.stt{width:100%;border-collapse:collapse;margin:8px 0;font-size:14px}.stt td{padding:4px 6px;border-bottom:1px solid #fff2}.stt td:nth-child(2),.stt td:nth-child(3){text-align:center;font-weight:700}`;document.head.appendChild(st);
document.body.insertAdjacentHTML('beforeend','<div id="rpl" class="D">● INSTANT REPLAY</div>');
$('#kick').insertAdjacentHTML('beforeend','<div id="kwind"></div><div class="hint">tap anywhere</div>');
// ---- FG meter: wind shifts the zone, sweet spot in the middle, kick fires on pointerdown/touchstart anywhere (root-cause fix:
// the #kick overlay sat on top of the canvas and swallowed taps, and only the canvas listened for them) ----
const _km=kickMeter;window.kickMeter=kickMeter=function(kind,dist){_km(kind,dist);if(!KM)return;const w=kind=='xp'?(R()-.5)*.6:(R()*2-1);KM.wind=w;KM.c=cl(.5+w*.13*(1+dist/60),.2,.8);KM.armed=performance.now()+120;$('#msg').style.display='none';msgT=0;$('#pre').style.display='none';
  const z=$('#kz');z.style.left=((KM.c-KM.z/2)*100)+'%';z.innerHTML=`<div class="sweet" style="left:33%;width:34%"></div>`;
  const mph=Math.round(Math.abs(w)*18);$('#kwind').textContent=mph<2?'WIND: calm':`WIND ${w<0?'◀◀':'▶▶'} ${mph} mph ${w<0?'(left)':'(right)'}`};
window.kickTap=kickTap=function(){if(!KM||!G||G.phase!='kick'||performance.now()<KM.armed)return;const off=Math.abs(KM.p-KM.c),good=off<KM.z/2,perfect=off<KM.z/6;
  $('#kick').style.display='none';snd('kick');vib(good?[20,40,30]:60);const k=KM;KM=null;G.phase='after';G.after=1.8;SB.kicks=(SB.kicks||0)+1;
  if(k.kind=='xp'){if(good){G.sc[0]+=1;msg(perfect?'Extra point, right down the pipe.':'Extra point good.',1.6)}else{msg('XP NO GOOD. '+pick(GEN.fgMiss),2.2);snd('bad')}G.next=()=>driveOver('TD',25);updHud();return}
  if(good){G.sc[0]+=3;G.coins+=perfect?6:4;bigTxt(perfect?'PERFECT!':'GOOD!',G.me.c[0]);const l=pick(GEN.fg);msg(l,2);speak(l,1);snd('roar')}else{const l=pick(GEN.fgMiss);msg(l,2.4);speak(l,1);snd('bad')}
  updHud();G.next=()=>driveOver(good?'FG':'MISS',good?25:Math.max(20,100-G.los))};
// one global tap handler (capture, pointerdown + touchstart fallback, de-duped) for kicks and skipping
let lastTap=0;function anyTap(e){const now=performance.now();if(now-lastTap<60)return;if(!G)return;const t=e.target;if(t.closest&&t.closest('button,a,input,#rotx'))return;
  if(G.phase=='kick'){lastTap=now;kickTap();e.cancelable&&e.preventDefault();return}
  if(G.phase=='replay'){lastTap=now;G.rp.i=1e9;return}
  if(G.phase=='after'&&cur=='game'){lastTap=now;G.after=Math.min(G.after,.2)}}
document.addEventListener('pointerdown',anyTap,{capture:true,passive:false});document.addEventListener('touchstart',anyTap,{capture:true,passive:false});
// ---- recording for replay + slow-mo ----
const _up=update;window.update=update=function(dt){if(SB.rotPaused)return _up(dt);
  if(G&&G.phase=='replay')return replayUpd(dt);
  let sc=1;if(G&&G.phase=='play'){const b=G.ball;if(b.st=='air'&&b.t/b.T>.72){const near=G.ents.filter(e=>!e.o&&hyp(e.x-b.tx,e.y-b.ty)<2.2).length,rec=G.ents.some(e=>e.o&&e.role!='ol'&&e.role!='qb'&&hyp(e.x-b.tx,e.y-b.ty)<2.2);if(near&&rec)sc=.35}
    const c=G.carrier;if(c&&c.x>94&&c.x<100)sc=Math.min(sc,.45);if(G.two)sc=Math.min(sc,.7)}
  SB.slow=sc<1;const was=G&&G.phase;_up(dt*sc);if(G&&G.phase=='play'){(G.rec=G.rec||[]).push(snap())}else if(was=='play'&&G)G.recDone=G.rec;
  if(G&&G.phase=='pre')G.rec=[]};
function snap(){return{e:G.ents.map(e=>[e.x,e.y,e.vx,e.vy,e.anim,e.stun]),b:Object.assign({},G.ball,{h:null}),bh:G.ball.h?G.ents.indexOf(G.ball.h):-1,c:G.carrier?G.ents.indexOf(G.carrier):-1}}
function apply(f){f.e.forEach((a,i)=>{const e=G.ents[i];if(!e)return;[e.x,e.y,e.vx,e.vy,e.anim,e.stun]=a});G.ball=Object.assign({},f.b,{h:f.bh>=0?G.ents[f.bh]:null});G.carrier=f.c>=0?G.ents[f.c]:null}
function replayUpd(dt){const r=G.rp;r.i+=dt*60*.55;const f=r.fr[Math.min(r.fr.length-1,r.i|0)];if(r.i>=r.fr.length+25){G.phase=r.ph;apply(r.end);$('#rpl').style.display='none';G.carrier=null;const n=r.next;n&&n();return}apply(f);camRp(dt)}
function camRp(dt){const b=G.ball;cam.x+=(b.x+4-cam.x)*Math.min(1,dt*4);zm+=(1-zm)*dt*3}
const _ep=endPlay;window.endPlay=endPlay=function(kind,spot){const wasPlay=G&&G.phase=='play',fr=G&&G.rec;_ep(kind,spot);if(!wasPlay||!G)return;
  if(kind=='sack'||kind=='int')vib([40,30,80]);else if(kind=='td')vib([30,30,30,30,120]);else if(kind=='tackle')vib(25);
  if((kind=='td'||kind=='int')&&fr&&fr.length>20&&G.phase=='after'){const nx=G.next,end=snap();G.next=()=>{G.rp={fr:fr.slice(-200),i:0,next:nx,ph:'after',end};G.phase='replay';$('#rpl').style.display='block';
      speak(pick(kind=='td'?GEN.replayTd:GEN.replayInt),1)}}};
// ---- halftime ----
const _sd=startDrive;window.startDrive=startDrive=function(x){if(G&&!G.drill&&!G.half&&G.drv==2&&G.odrv==2){G.half=1;return halftime(()=>_sd(x))}_sd(x)};
function statTable(){const s=G.stats,d=G.dst||{s:0,i:0};return`<table class="stt"><tr><td></td><td>${esc(G.me.ab)}</td><td>${esc(G.opp.ab)}</td></tr><tr><td>Score</td><td>${G.sc[0]}</td><td>${G.sc[1]}</td></tr><tr><td>Pass yds</td><td>${s.pass}</td><td>—</td></tr><tr><td>Rush yds</td><td>${s.rush}</td><td>—</td></tr><tr><td>TD / INT thrown</td><td>${s.td} / ${s.int}</td><td>—</td></tr><tr><td>Your D: sacks / picks</td><td>${d.s} / ${d.i}</td><td></td></tr><tr><td>Longest play</td><td>${G.long||0} yds</td><td></td></tr></table>`}
function halftime(go){G.phase='card';hud(false);$('#pre').style.display='none';const up=G.sc[0]-G.sc[1],l=pick(up>0?GEN.halfUp:up<0?GEN.halfDown:GEN.halfTie);
  $('#s-card').innerHTML=`<div class="card"><div class="lb">HALFTIME</div><h2 class="D">${esc(G.me.ab)} ${G.sc[0]} – ${G.sc[1]} ${esc(G.opp.ab)}</h2>${statTable()}<p>${esc(l)}</p><div class="row"><button class="pb gr" id="h2">SECOND HALF →</button></div></div>`;showScr('s-card');speak(l,1);snd('horn');
  $('#h2').onclick=()=>{showScr(null);hud(true);go()}}
// count defense sacks/picks this game + longest play
const _rp=SB.rec0;const recSnap=()=>({s:SV.rec.sacks,i:SV.rec.dints});
const _ng=newGame;window.newGame=newGame=function(a,b,m){_ng(a,b,m);G.r0=recSnap();G.long=0;SB.newGame=newGame};
const _ep2=endPlay;window.endPlay=endPlay=function(k,s){const f=G&&G.snapLos!=null?G.snapLos:G&&G.los;_ep2(k,s);if(G&&(k=='td'||k=='tackle'||k=='oob'))G.long=Math.max(G.long||0,Math.round((k=='td'?100:s)-f))};SB.endPlay=endPlay;
setInterval(()=>{if(G&&G.r0)G.dst={s:SV.rec.sacks-G.r0.s,i:SV.rec.dints-G.r0.i}},300);
// ---- postgame ----
const _fin=final;window.final=final=function(){$('#rpl').style.display='none';const g=G;if(g&&g.r0)g.dst={s:SV.rec.sacks-g.r0.s,i:SV.rec.dints-g.r0.i};const keep=G;G=g;const tbl=g?(()=>{const G0=G;return statTable()})():'';_fin();
  const card=$('#s-card .card');if(card&&tbl){const lb=[...card.querySelectorAll('.lb')].find(x=>/Pass/.test(x.textContent));if(lb)lb.outerHTML=tbl;else card.insertAdjacentHTML('beforeend',tbl)}
  const ro=SB.roastFor?SB.roastFor([g.me.id,g.opp.id]):[];if(card&&ro.length)card.insertAdjacentHTML('beforeend',`<p class="lb">🎤 ${esc(ro[0])}</p>`);vib([50,50,50])};
SB.kickTap=()=>kickTap();const _t=title;window.title=title=function(){$('#rpl').style.display='none';$('#kick').style.display='none';KM=null;_t()};
})();
