'use strict';
// SHADY BOWL: retro pixel football for SHADYNASTY. World units: yards. x = downfield (0 own goal line .. 100 opp goal), y = across (0..53.3).
const $=s=>document.querySelector(s),R=Math.random,cl=(v,a,b)=>v<a?a:v>b?b:v,pick=a=>a[(R()*a.length)|0],hyp=Math.hypot;
const API='https://api.sleeper.app/v1/',LEAGUE='1312055708249767936',FW=53.3,CY=FW/2,K=10;
const cv=$('#cv'),ctx=cv.getContext('2d');
let W=480,H=270,S=1,portrait=false;
const SAVE_KEY='shadybowl1';
let SV=Object.assign({team:null,coins:0,up:{arm:0,hands:0,wheels:0,legs:0,d:0},season:null,best:{pts:0,margin:-99,wins:0},mute:false,played:0},JSON.parse(localStorage.getItem(SAVE_KEY)||'{}'));
const save=()=>{try{localStorage.setItem(SAVE_KEY,JSON.stringify(SV))}catch(e){}};
const TM=id=>TEAMS.find(t=>t.id===id);
const NAMES={};// owner_id -> {QB,RB,WR:[..]}
let WEEK=null,MATCH={};// owner_id -> opp owner_id
// ---------- live data (Sleeper) with bundled fallback ----------
async function loadLive(){
  const j=u=>fetch(u).then(r=>{if(!r.ok)throw Error(r.status);return r.json()});
  try{
    const [users,rosters,state]=await Promise.all([j(API+'league/'+LEAGUE+'/users'),j(API+'league/'+LEAGUE+'/rosters'),j(API+'state/nfl')]);
    users.forEach(u=>{const t=TM(u.user_id);if(!t)return;const n=(u.metadata&&u.metadata.team_name||'').replace(/[🏆]/gu,'').trim();if(n)t.team=n;if(u.avatar)t.av=u.avatar});
    const rid={};rosters.forEach(r=>{const t=TM(r.owner_id);rid[r.roster_id]=r.owner_id;if(t&&r.settings)t.w=r.settings.wins,t.l=r.settings.losses});
    WEEK=state.week;
    j(API+'league/'+LEAGUE+'/matchups/'+WEEK).then(ms=>{const by={};ms.forEach(m=>{(by[m.matchup_id]=by[m.matchup_id]||[]).push(rid[m.roster_id])});Object.values(by).forEach(p=>{if(p.length==2){MATCH[p[0]]=p[1];MATCH[p[1]]=p[0]}});if(cur==='title')title()}).catch(()=>{});
    j('../../data/players.json').then(pd=>{const P=pd.p||{};rosters.forEach(r=>{const st=(r.starters||[]).filter(x=>P[x]),nm=x=>{const n=P[x].n.split(' ');return n.slice(1).join(' ')||n[0]},pos=x=>P[x].p[0];
      const q=st.find(x=>pos(x)=='QB'),b=st.find(x=>pos(x)=='RB'),w=st.filter(x=>pos(x)=='WR'||pos(x)=='TE').slice(0,3);
      NAMES[r.owner_id]={QB:q?nm(q):'the QB',RB:b?nm(b):'the RB',WR:w.map(nm)}})}).catch(()=>{});
  }catch(e){}
}
// ---------- audio ----------
let AC=null;
function snd(type){if(SV.mute)return;try{AC=AC||new (window.AudioContext||window.webkitAudioContext)();if(AC.state=='suspended')AC.resume()}catch(e){return}
  const t=AC.currentTime,o=AC.createOscillator(),g=AC.createGain();o.connect(g);g.connect(AC.destination);
  const env=(v,d)=>{g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.001,t+d);o.start(t);o.stop(t+d)};
  const noise=(d,v,f)=>{const b=AC.createBuffer(1,AC.sampleRate*d,AC.sampleRate),a=b.getChannelData(0);for(let i=0;i<a.length;i++)a[i]=(R()*2-1)*(1-i/a.length);const s=AC.createBufferSource(),bf=AC.createBiquadFilter(),gg=AC.createGain();bf.type='bandpass';bf.frequency.value=f;s.buffer=b;s.connect(bf);bf.connect(gg);gg.connect(AC.destination);gg.gain.value=v;s.start(t)};
  if(type=='hike'){o.type='square';o.frequency.setValueAtTime(220,t);env(.12,.12)}
  else if(type=='whistle'){o.type='sine';o.frequency.setValueAtTime(2800,t);o.frequency.setValueAtTime(3100,t+.08);env(.12,.35)}
  else if(type=='throw'){o.type='triangle';o.frequency.setValueAtTime(700,t);o.frequency.exponentialRampToValueAtTime(240,t+.25);env(.15,.25)}
  else if(type=='catch'){o.type='square';o.frequency.setValueAtTime(520,t);o.frequency.setValueAtTime(780,t+.06);env(.12,.14)}
  else if(type=='hit'){o.type='sawtooth';o.frequency.setValueAtTime(110,t);o.frequency.exponentialRampToValueAtTime(40,t+.18);env(.25,.2);noise(.15,.5,400)}
  else if(type=='juke'){o.type='square';o.frequency.setValueAtTime(300,t);o.frequency.exponentialRampToValueAtTime(900,t+.1);env(.1,.12)}
  else if(type=='boo'){o.type='sawtooth';o.frequency.setValueAtTime(140,t);o.frequency.linearRampToValueAtTime(90,t+.9);env(.08,.9);noise(.9,.25,300)}
  else if(type=='td'){o.type='square';[523,659,784,1046].forEach((f,i)=>o.frequency.setValueAtTime(f,t+i*.11));env(.12,.6);noise(1.4,.35,1200)}
  else if(type=='kick'){o.type='sine';o.frequency.setValueAtTime(160,t);o.frequency.exponentialRampToValueAtTime(60,t+.12);env(.4,.15)}
  else if(type=='bad'){o.type='square';o.frequency.setValueAtTime(300,t);o.frequency.linearRampToValueAtTime(120,t+.4);env(.1,.4)}
}
// ---------- layout ----------
function resize(){const iw=innerWidth,ih=innerHeight;portrait=ih>iw*1.05;S=Math.max(1,Math.min(iw,ih)/(portrait?225:205));W=Math.ceil(iw/S);H=Math.ceil(ih/S);cv.width=W;cv.height=H;ctx.imageSmoothingEnabled=false}
addEventListener('resize',resize);resize();
// ---------- game state ----------
let G=null,cur='title';
const cam={x:30,y:CY};
function P(x,y){return portrait?[W/2+(y-cam.y)*K,H/2+12-(x-cam.x)*K]:[W/2+(x-cam.x)*K,H/2+(y-cam.y)*K]}
function dW(dx,dy){dx/=S*K;dy/=S*K;return portrait?[-dy,dx]:[dx,dy]}// css px delta -> world delta
const nameOf=(id,k,i)=>{const n=NAMES[id];if(!n)return k=='WR'?['WR1','WR2','the slot'][i||0]:k=='QB'?'the QB':'the RB';return k=='WR'?(n.WR[i||0]||'the slot'):n[k]};
function say(key,extra,team){const T=G.me,O=G.opp,src=team&&FLAVOR[team.id]&&FLAVOR[team.id][key]?FLAVOR[team.id][key]:GEN[key];let s=pick(src);
  return s.replace(/\{T\}/g,T.team).replace(/\{O\}/g,O.team).replace(/\{QB\}/g,nameOf(T.id,'QB')).replace(/\{RB\}/g,nameOf(T.id,'RB')).replace(/\{WR\}/g,extra&&extra.rb?nameOf(T.id,'RB'):nameOf(T.id,'WR',extra&&extra.wi)).replace(/\{Y\}/g,extra&&extra.y!=null?extra.y:'')}
function newGame(meId,oppId,mode){
  const me=TM(meId),opp=TM(oppId);
  G={me,opp,mode,sc:[0,0],drv:0,odrv:0,los:25,down:1,togo:10,phase:'pre',ents:[],ball:null,carrier:null,t:0,legs:100,coins:0,log:[],stats:{pass:0,rush:0,td:0,int:0},ot:0,parts:[]};
  showScr(null);hud(true);msg(FLAVOR[opp.id].intro,3.2);startDrive(25);
}
function startDrive(x){G.drv++;G.los=x;G.down=1;G.togo=10;G.legs=Math.min(100,G.legs+30+SV.up.legs*6);preSnap()}
// formation + routes
const PLAYS={
  deep:{n:'DEEP',s:'verts',r:[[[0,0],[30,0]],[[0,0],[28,0]],[[0,0],[12,0],[26,6]]],rb:[[0,0],[2,-6],[6,-9]]},
  quick:{n:'QUICK',s:'slants/outs',r:[[[0,0],[4,0],[13,9]],[[0,0],[7,0],[7,-7]],[[0,0],[9,0],[7,0]]],rb:[[0,0],[1,7],[4,10]]},
  shot:{n:'SHOT',s:'post/corner',r:[[[0,0],[11,0],[30,11]],[[0,0],[11,0],[24,-9]],[[0,0],[3,0],[6,18]]],rb:[[0,0],[2,-6],[5,-9]]},
  run:{n:'RUN',s:'handoff',r:[[[0,0],[6,0]],[[0,0],[6,0]],[[0,0],[3,0]]]}
};
function ent(o){return Object.assign({vx:0,vy:0,anim:R()*9,stun:0,spd:6},o)}
function form(play){
  const L=G.los,me=G.me,st=.42+.05*(G.opp.w||3)-(G.opp.wip?.08:0),E=[];
  const wr=[[L-.6,CY-11.5],[L-.6,CY+11.5],[L-1,CY-6]];
  const qb=ent({o:1,role:'qb',x:L-(play=='run'?1.5:4.5),y:CY,spd:6});E.push(qb);
  const rb=ent({o:1,role:'rb',x:L-(play=='run'?4.5:6),y:CY+1.5,spd:7.4+SV.up.wheels*.25});E.push(rb);
  wr.forEach((p,i)=>{const side=p[1]<CY?1:-1,r=PLAYS[play].r[i].map(w=>[p[0]+w[0],p[1]+w[1]*side]);E.push(ent({o:1,role:'wr',wi:i,x:p[0],y:p[1],spd:i==2?7.4:8+SV.up.wheels*.15,route:r,ri:1}))});
  if(PLAYS[play].rb)rb.route=PLAYS[play].rb.map(w=>[rb.x+w[0],rb.y+w[1]]),rb.ri=1;
  [-2.4,0,2.4].forEach(d=>E.push(ent({o:1,role:'ol',x:L-.7,y:CY+d,spd:4.5})));
  [-2.6,0,2.6].forEach(d=>E.push(ent({o:0,role:'dl',x:L+.8,y:CY+d,spd:5+st*1.5,str:st})));
  const recs=E.filter(e=>e.role=='wr');
  recs.forEach((r,i)=>E.push(ent({o:0,role:'cb',man:r,x:r.x+(i==2?4.5:6),y:r.y+(i==2?0:(r.y<CY?2:-2)),spd:7.3+st*1.1,react:.25-st*.15,str:st})));
  E.push(ent({o:0,role:'lb',x:L+4.5,y:CY+3,spd:6.6+st,str:st}));
  E.push(ent({o:0,role:'s',x:L+13,y:CY,spd:7.2+st,str:st}));
  return E;
}
function preSnap(){G.phase='pre';G.play=null;G.ents=form('deep');G.ents.forEach(e=>e.ghost=1);G.ball={st:'held',h:G.ents[0],x:0,y:0,z:0};G.carrier=null;G.throwAim=null;
  const b=$('#pre');b.style.display='flex';const fgd=100-G.los+17;
  let h='';if(G.down==4){h+=`<button class="pb red" data-p="punt">PUNT<small>flip the field</small></button>`;if(fgd<=57)h+=`<button class="pb blu" data-p="fg">FG<small>${fgd} yds</small></button>`}
  h+=['deep','quick','shot','run'].map(k=>`<button class="pb${k=='run'?' gr':''}" data-p="${k}">${PLAYS[k].n}<small>${PLAYS[k].s}</small></button>`).join('');
  b.innerHTML=h;updHud()}
$('#pre').addEventListener('click',e=>{const p=e.target.closest('[data-p]');if(!p||G.phase!='pre')return;$('#pre').style.display='none';const k=p.dataset.p;
  if(k=='punt')return punt();if(k=='fg')return kickMeter('fg',100-G.los+17);snap(k)});
function snap(play){G.play=play;G.ents=form(play);G.ball={st:'held',h:G.ents[0],x:0,y:0,z:0};G.t=0;G.phase='play';G.carrier=null;G.thrown=false;snd('hike');
  G.legs=Math.max(0,G.legs-4);if(play=='run'){G.handoff=true;G.gap=CY+(R()<.5?-6.5:6.5)}}
// ---------- input ----------
const ptr={down:false,sx:0,sy:0,x:0,y:0,t:0,steer:0,lastX:0,lastY:0,lastT:0};
const keys={};
addEventListener('keydown',e=>{keys[e.key]=1;if(e.key==' '&&G&&G.carrier&&G.phase=='play'){juke(ptr.steer||(R()<.5?-1:1));e.preventDefault()}
  if(G&&G.phase=='pre'){const m={'1':'deep','2':'quick','3':'shot','4':'run'}[e.key];if(m){$('#pre').style.display='none';snap(m)}}
  if(G&&G.phase=='kick'&&e.key==' ')kickTap();if(e.key=='Enter'&&G&&G.phase=='after')G.after=0});
addEventListener('keyup',e=>{keys[e.key]=0});
cv.addEventListener('pointerdown',e=>{if(!G)return;cv.setPointerCapture(e.pointerId);Object.assign(ptr,{down:true,sx:e.clientX,sy:e.clientY,x:e.clientX,y:e.clientY,t:performance.now(),lastX:e.clientX,lastY:e.clientY,lastT:performance.now(),juked:false});
  if(G.phase=='kick')kickTap();if(G.phase=='after')G.after=Math.min(G.after,.25)});
cv.addEventListener('pointermove',e=>{if(!ptr.down||!G)return;ptr.x=e.clientX;ptr.y=e.clientY;const now=performance.now(),dt=Math.max(1,now-ptr.lastT);
  if(G.carrier&&G.phase=='play'){const [wx,wy]=dW(e.clientX-ptr.lastX,e.clientY-ptr.lastY),v=wy/(dt/1000);if(Math.abs(v)>14&&!ptr.juked&&now-ptr.t<350){ptr.juked=true;juke(Math.sign(v))}
    const [ax,ay]=dW(ptr.x-ptr.sx,ptr.y-ptr.sy);ptr.steer=cl(ay/2.2,-1,1)}
  ptr.lastX=e.clientX;ptr.lastY=e.clientY;ptr.lastT=now});
cv.addEventListener('pointerup',e=>{if(!ptr.down||!G)return;ptr.down=false;const dx=ptr.x-ptr.sx,dy=ptr.y-ptr.sy,d=hyp(dx,dy),dt=performance.now()-ptr.t;
  if(G.phase=='play'&&G.ball.st=='held'&&G.ball.h.role=='qb'&&G.play!='run'&&d>18){throwBall(aimTarget(dx,dy))}
  else if(G.phase=='play'&&G.carrier&&d<12&&dt<250)juke(ptr.steer||(R()<.5?-1:1));
  ptr.steer=0;G.throwAim=null});
cv.addEventListener('pointercancel',()=>{ptr.down=false;ptr.steer=0});
function aimTarget(dx,dy){const q=G.ball.h,[wx,wy]=dW(-dx,-dy),m=3.1,mx=44+SV.up.arm*3;let tx=wx*m,ty=wy*m;const d=hyp(tx,ty);if(d>mx){tx*=mx/d;ty*=mx/d}return [q.x+tx,cl(q.y+ty,-1,FW+1)]}
function juke(dir){const c=G.carrier;if(!c||c.jk>0||c.jcd>0)return;c.jk=.38;c.jcd=.7;c.vy=dir*9;snd('juke');floatTxt(pick(GEN.juke),c);G.legs=Math.max(0,G.legs-3)}
// ---------- play sim ----------
function moveTo(e,tx,ty,spd,dt){const dx=tx-e.x,dy=ty-e.y,d=hyp(dx,dy)||1;let vx=dx/d*spd,vy=dy/d*spd;if(d<.3)vx=vy=0;const a=Math.min(1,dt*7);e.vx+=(vx-e.vx)*a;e.vy+=(vy-e.vy)*a}
function throwBall(t){const q=G.ball.h,d=hyp(t[0]-q.x,t[1]-q.y),err=d*.035*(1-SV.up.arm*.12);t=[t[0]+(R()-.5)*err*2,t[1]+(R()-.5)*err*2];
  G.ball={st:'air',sx:q.x,sy:q.y,tx:t[0],ty:t[1],t:0,T:.3+d/(19+SV.up.arm*1.6),h:null,x:q.x,y:q.y,z:1.5,peak:1+d*.16};G.thrown=true;snd('throw');
  let best=null,bd=99;G.ents.forEach(e=>{if(e.o&&(e.role=='wr'||e.role=='rb')){const dd=hyp(e.x-t[0],e.y-t[1]);if(dd<bd){bd=dd;best=e}}});G.target=bd<11?best:null}
function update(dt){
  if(!G)return;G.parts=G.parts.filter(p=>(p.t-=dt)>0);G.parts.forEach(p=>{p.x+=p.vx*dt;p.y+=p.vy*dt});
  if(G.phase=='kick')return kickUpd(dt);
  if(G.phase=='after'){G.after-=dt;if(G.after<=0){const f=G.next;G.next=null;f&&f()}return camUpd(dt)}
  if(G.phase!='play')return camUpd(dt);
  G.t+=dt;const E=G.ents,b=G.ball,qb=E[0],L=G.los,T=G.t;
  if(G.handoff&&T>.22){G.handoff=false;const rb=E[1];b.h=rb;G.carrier=rb;rb.route=null;rb.vx=rb.spd*.8}
  const car=G.carrier,legF=.8+.2*G.legs/100;
  if(car){// player-controlled carrier
    let st=ptr.steer;if(car.role=='rb'&&G.play=='run'&&car.x<L+1&&!ptr.down&&!keys.ArrowUp&&!keys.ArrowDown&&!keys.ArrowLeft&&!keys.ArrowRight)st=cl((G.gap-car.y)/2,-1,1);if(keys.ArrowUp||keys.w)st=portrait?0:-1;if(keys.ArrowDown||keys.s)st=portrait?0:1;if(portrait){if(keys.ArrowLeft||keys.a)st=-1;if(keys.ArrowRight||keys.d)st=1}
    const sp=car.spd*legF*(car.jk>0?1.05:1);const vy=st*sp*.85,vx=Math.sqrt(Math.max(0,sp*sp-vy*vy))*(car.role=='qb'&&!G.thrown?0:1);
    const a=Math.min(1,dt*(car.jk>0?3:8));car.vx+=(vx-car.vx)*a;car.vy+=(vy-car.vy)*a;car.jk-=dt;car.jcd-=dt;G.legs=Math.max(0,G.legs-dt*2.2);
    if(G.me.wip||G.me.id=='602659459214409728'||R()<.5)G.parts.push({x:car.x,y:car.y,vx:-1,vy:(R()-.5)*2,t:.5,c:G.me.wip?`hsl(${(T*400)%360},100%,60%)`:pick(G.me.c)});
  }
  E.forEach(e=>{if(e.stun>0){e.stun-=dt;e.vx*=.9;e.vy*=.9;return}if(e===car)return;
    if(e.o){
      if(e.role=='qb'){if(!car&&b.st=='held'&&b.h===e)moveTo(e,L-(G.play=='run'?1.5:6.5),CY,4,dt);else moveTo(e,e.x+1,e.y,2,dt)}
      else if(e.role=='ol'){let tgt=null,bd=99;E.forEach(d=>{if(!d.o&&(d.role=='dl'||(car&&d.role=='lb'))){const dd=hyp(d.x-e.x,d.y-e.y);if(dd<bd){bd=dd;tgt=d}}});
        const prot=car||qb;if(tgt&&G.play=='run'&&!(car&&car.x>L+3))moveTo(e,tgt.x+.4,tgt.y+(e.y-tgt.y)*.5,e.spd*.8,dt);else if(tgt)moveTo(e,(tgt.x+prot.x)/2*.3+tgt.x*.7-.6,tgt.y+(prot.y-tgt.y)*.2,e.spd,dt)}
      else if(car){// blockers downfield
        let tgt=null,bd=99;E.forEach(d=>{if(!d.o&&!d.blk){const dd=hyp(d.x-car.x,d.y-car.y)+hyp(d.x-e.x,d.y-e.y)*.6;if(dd<bd&&d.x>car.x-2){bd=dd;tgt=d}}});if(tgt)moveTo(e,tgt.x-.5,tgt.y,e.spd*.92,dt)}
      else if(e.route){const w=e.route[e.ri];if(w){moveTo(e,w[0],w[1],e.spd,dt);if(hyp(w[0]-e.x,w[1]-e.y)<.6)e.ri++}else moveTo(e,e.x+.5,e.y,1.5,dt);
        if(b.st=='air'&&e===G.target&&b.t>.1)moveTo(e,b.tx,b.ty,e.spd*1.08,dt)}
    }else{
      e.blk=false;E.forEach(o=>{if(o.o&&(o.role=='ol'||(car&&o!==car&&o.role!='qb'))&&hyp(o.x-e.x,o.y-e.y)<1.1)e.blk=true});
      const runB=G.play=='run'&&T<2.2;let sp=e.spd*(e.blk?(e.shed>0?1:runB?.05:.22):1);if(e.blk&&e.shed<=0&&R()<dt*e.str*(runB?.15:.5))e.shed=1;if(e.blk&&runB&&e.shed<=0){e.x+=dt*1.2}e.shed=(e.shed||0)-dt;
      if(car&&G.play=='run'&&e.role!='dl'&&T<.9)moveTo(e,e.x+.5,e.y,1.5,dt);
      else if(car){const d=hyp(car.x-e.x,car.y-e.y),lead=Math.min(.6,d/10);moveTo(e,car.x+car.vx*lead,car.y+car.vy*lead,sp*(e.role=='dl'?.85:.97),dt)}
      else if(b.st=='air'&&T-G.throwT>(e.react||.3)&&hyp(e.x-b.tx,e.y-b.ty)<11)moveTo(e,b.tx,b.ty,sp*.92,dt)
      else if(e.role=='dl'||(e.role=='lb'&&T>1.6))moveTo(e,qb.x,qb.y,sp,dt);
      else if(e.role=='cb'){const m=e.man;if(T<(e.react||.2))moveTo(e,e.x,e.y,1,dt);else moveTo(e,m.x+m.vx*.1-.6+e.str,m.y+m.vy*.1,sp*.93,dt)}
      else if(e.role=='lb')moveTo(e,L+4.5,cl(qb.y+(R()-.5),CY-6,CY+6),sp*.6,dt);
      else if(e.role=='s'){let dp=L+12;E.forEach(o=>{if(o.role=='wr')dp=Math.max(dp,o.x+3)});moveTo(e,dp,cl(b.st=='air'?b.ty:CY,8,FW-8),sp,dt)}
    }
  });
  E.forEach(e=>{e.x+=e.vx*dt;e.y+=e.vy*dt;e.anim+=hyp(e.vx,e.vy)*dt*1.6});
  if(b.st=='air'){if(!G.throwT||G.throwT>T)G.throwT=T;b.t+=dt;const k=Math.min(1,b.t/b.T);b.x=b.sx+(b.tx-b.sx)*k;b.y=b.sy+(b.ty-b.sy)*k;b.z=1.5+4*b.peak*k*(1-k);if(k>=1)resolveCatch()}
  else if(b.st=='held'){b.x=b.h.x;b.y=b.h.y;b.z=1.2}
  // collisions
  if(b.st=='held'){const c=b.h;
    if(c.role=='qb'&&!car){if(T>2.4&&!G.thrown)G.ents.forEach(d=>{if(!d.o&&d.stun<=0&&hyp(d.x-c.x,d.y-c.y)<.9&&G.phase=='play'){snd('hit');c.stun=9;endPlay('sack',c.x)}})}
    else if(car){
      for(const d of E){if(d.o||d.stun>0)continue;if(hyp(d.x-car.x,d.y-car.y)<.85){
        if(car.jk>0){d.stun=.9;d.vx=d.vy=0;continue}
        if(!car.broke&&R()<(.1+SV.up.wheels*.03)*legF){car.broke=1;d.stun=.6;snd('hit');floatTxt('BROKEN TACKLE!',car);continue}
        snd('hit');car.stun=9;d.vx=car.vx;return endPlay('tackle',car.x)}}
      if(car.x>=100){return endPlay('td',100)}
      if(car.y<0||car.y>FW){return endPlay('oob',car.x)}
      if(car.x<=0&&car.vx<0){return endPlay('safety',0)}
    }
  }
  if(G.phase=='play'&&b.st=='held'&&b.h.role=='qb'&&!G.thrown&&T>7){snd('hit');endPlay('sack',qb.x)}
  camUpd(dt);
}
function resolveCatch(){const b=G.ball,E=G.ents;let r=null,dr=99,d=null,dd=99;
  E.forEach(e=>{const k=hyp(e.x-b.tx,e.y-b.ty);if(e.o&&e.role!='ol'&&e.role!='qb'){if(k<dr){dr=k;r=e}}else if(!e.o&&e.stun<=0){if(k<dd){dd=k;d=e}}});
  const reach=1.8+SV.up.hands*.15;
  if(b.tx>110||b.ty<0||b.ty>FW){b.st='dead';return endPlay('inc')}
  if(dd<1.05&&dd<dr-.25&&R()<(dr<reach?.22:.4)){b.st='dead';return endPlay('int',b.tx)}
  if(dr<reach){let p=.93+SV.up.hands*.012;if(dd<dr+.5&&dd<1.6)p=.48+SV.up.hands*.05;if(R()<p){b.st='held';b.h=r;G.carrier=r;r.route=null;snd('catch');G.catchX=b.tx;floatTxt('CATCH!',r);if(r.x>=100)endPlay('td',100);return}
    if(dd<1.6&&R()<.5)floatTxt('BROKEN UP!',d)}
  b.st='dead';endPlay('inc')}
function camUpd(dt){let f=G.ball&&G.ball.st!='dead'?{x:G.ball.x,y:G.ball.y}:{x:G.los,y:CY};if(G.phase=='pre')f={x:G.los+2,y:CY};
  const half=(portrait?W:H)/K/2,tx=f.x+(portrait?5:6),a=Math.min(1,dt*4);cam.x+=(tx-cam.x)*a;
  if(half*2>=FW+6)cam.y=CY;else{const ty=cl(f.y,half-3,FW-half+3);cam.y+=(ty-cam.y)*a}}
function floatTxt(s,e){G.parts.push({x:e.x,y:e.y,vx:0,vy:0,t:1,txt:s})}
// ---------- play results ----------
function endPlay(kind,spot){if(G.phase!='play')return;G.phase='after';G.after=1.7;snd(kind=='td'?'td':kind=='int'||kind=='sack'?'bad':'whistle');
  const T=G.me,c=G.carrier,wasPass=G.play!='run',wi=c&&c.role=='wr'?c.wi:G.target&&G.target.wi||0,rb=!!(c&&c.role=='rb'),yd=Math.round((spot!=null?spot:G.los)-G.los);
  let line='';
  if(kind=='td'){G.sc[0]+=6;G.stats.td++;G.coins+=10;const pass=wasPass&&c&&c.role!='qb';if(pass)G.stats.pass+=yd;else G.stats.rush+=yd;
    line=R()<.65?say('td',{wi,rb},T):say(pass?'td':'runTd',{wi,rb});celebrate(T,line);G.next=()=>kickMeter('xp',33);return}
  if(kind=='int'){G.stats.int++;line=say('pick',{wi})+' '+say('fail',null,T);msg(line,3);G.after=2.4;G.next=()=>driveOver('INT',100-cl(spot,1,99));return}
  if(kind=='safety'){G.sc[1]+=2;msg(say('safety'),3);G.next=()=>driveOver('SAFETY',35);return}
  if(kind=='inc'){line=say('inc',{wi})}
  else if(kind=='sack'){line=say('sack');G.los=Math.max(1,Math.round(spot))}
  else{const nl=cl(Math.round(spot),1,99);if(wasPass){G.stats.pass+=nl-G.los;line=say('catch',{wi,rb,y:nl-G.los})}else{G.stats.rush+=nl-G.los;line=nl<G.los?say('loss',{y:G.los-nl}):nl==G.los?nameOf(T.id,'RB')+' gets nothing. No gain, no hope.':say('run',{y:nl-G.los})}G.los=nl}
  const gained=G.los>=G.fd;if(gained){G.down=1;G.togo=Math.min(10,100-G.los);line+=' '+pick(GEN.first);}else{G.down++;G.togo=G.fd-G.los}
  msg(line,2.4);
  if(G.down>4){G.next=()=>{msg(say('downs')+' '+say('fail',null,T),3);driveOver('DOWNS',100-G.los)};return}
  G.next=preSnap}
function punt(){const d=38+R()*12,land=Math.min(99,G.los+d);snd('kick');msg(say('punt'),2.4);G.phase='after';G.after=1.6;G.next=()=>driveOver('PUNT',land>=100?20:100-land)}
// ---------- kick meter ----------
let KM=null;
function kickMeter(kind,dist){G.phase='kick';const z=Math.max(.06,.3-dist*.0042-0)+SV.up.legs*.004;KM={kind,dist,p:0,dir:1,z,spd:.9+dist/45};const k=$('#kick');k.style.display='block';$('#ktitle').textContent=(kind=='xp'?'EXTRA POINT':'FIELD GOAL '+dist+' YDS')+' · TAP IN THE BOX';const zn=$('#kz');zn.style.left=(50-z*50)+'%';zn.style.width=(z*100)+'%'}
function kickUpd(dt){KM.p+=KM.dir*KM.spd*dt;if(KM.p>1){KM.p=1;KM.dir=-1}if(KM.p<0){KM.p=0;KM.dir=1}$('#kn').style.left=`calc(${KM.p*100}% - 3px)`;camUpd(dt)}
function kickTap(){if(!KM||G.phase!='kick')return;const good=Math.abs(KM.p-.5)<KM.z/2;$('#kick').style.display='none';snd('kick');const k=KM;KM=null;G.phase='after';G.after=1.8;
  if(k.kind=='xp'){if(good){G.sc[0]+=1;msg('Extra point good.',1.6)}else{msg('XP NO GOOD. '+pick(GEN.fgMiss),2.2);snd('bad')}G.next=()=>driveOver('TD',25);updHud();return}
  if(good){G.sc[0]+=3;G.coins+=4;bigTxt('GOOD!',G.me.c[0]);msg(pick(GEN.fg),2)}else{msg(pick(GEN.fgMiss),2.4);snd('bad')}updHud();G.next=()=>driveOver(good?'FG':'MISS',good?25:Math.max(20,100-G.los))}
// ---------- drive over: simulate opponent's drive ----------
function driveOver(why,oppStart){G.phase='card';hud(false);$('#pre').style.display='none';
  const O=G.opp,st=.36+.055*(O.w||3)-(O.wip?.1:0)+(G.ot?.05:0),dB=SV.up.d*.035;
  const r=R(),pTD=cl(.08+.42*st-dB+(oppStart<30?0:.06*(oppStart-30)/40),.06,.6),pFG=.2,pTO=.1+dB;
  let res,pts=0,next=25;if(r<pTD){res='TOUCHDOWN';pts=7}else if(r<pTD+pFG){res='FIELD GOAL';pts=3}else if(r<pTD+pFG+pTO){res=pick(['INTERCEPTED','FUMBLE LOST','TURNOVER ON DOWNS']);next=Math.round(35+R()*30)}else{res='PUNT';next=Math.round(14+R()*22)}
  const plays=3+((R()*8)|0),yds=pts==7?100-oppStart:Math.round(R()*45);G.odrv++;G.sc[1]+=pts;
  const line=pts?pick(FLAVOR[O.id].opp):pick(FLAVOR[O.id].vs);const done=G.drv>=4+G.ot&&G.odrv>=4+G.ot;
  const el=$('#s-card');el.innerHTML=`<div class="card"><div class="lb">YOUR DRIVE: ${why}</div><h2 class="D">${esc(O.team)} BALL</h2><div class="lb">ON DEFENSE · QUICK SIM</div>
   <div class="fs">${pts==7?'😤':pts?'🥅':'🛑'}</div><h2 class="D" style="color:${pts?'#ff6a6a':'#7CFC00'}">${res}</h2><div>${plays} plays · ${yds} yds</div><p>${esc(line)}</p>
   <div class="D" style="font-size:30px">${esc(G.me.ab)} ${G.sc[0]} – ${G.sc[1]} ${esc(O.ab)}</div><div class="row"><button class="pb" id="cont">${done?(G.sc[0]==G.sc[1]?'OVERTIME →':'FINAL →'):'BACK TO OFFENSE →'}</button></div></div>`;
  showScr('s-card');snd(pts?'bad':'whistle');
  $('#cont').onclick=()=>{if(done){if(G.sc[0]==G.sc[1]&&G.ot<3){G.ot++;showScr(null);hud(true);msg('OVERTIME. Somebody finish, for once.',2.4);startDrive(next);return}return final()}showScr(null);hud(true);startDrive(next)}}
function final(){const won=G.sc[0]>G.sc[1],tie=G.sc[0]==G.sc[1],me=G.me,O=G.opp;let coins=G.coins+(won?25:5);SV.coins+=coins;SV.played++;
  SV.best.pts=Math.max(SV.best.pts,G.sc[0]);SV.best.margin=Math.max(SV.best.margin,G.sc[0]-G.sc[1]);
  let seasonTxt='';if(G.mode=='season'&&SV.season){const s=SV.season;s.res.push({o:O.id,a:G.sc[0],b:G.sc[1]});s.wk++;if(won)s.w++;else s.l++;SV.best.wins=Math.max(SV.best.wins,s.w);
    if(s.bowl){s.done=1;seasonTxt=won?(me.heel?'<p><b>The weasel won the Shady Bowl.</b> The league demands a recount. Nobody claps.</p>':`<p>🏆 <b>SHADY BOWL WINNERS.</b> ${esc(me.team)} runs the league. Screenshot it.</p>`):'<p>Lost the Shady Bowl. So close. So very, very funny.</p>'}
    else if(s.wk>=s.sched.length){if(s.w>=7){s.bowl=1;seasonTxt=`<p>${s.w}-${s.l}. You made the <b>SHADY BOWL</b>.</p>`}else{s.done=1;seasonTxt=`<p>${s.w}-${s.l}. Missed the Shady Bowl. Welcome to the Toilet Bowl.</p>`}}
    else seasonTxt=`<p>Season: ${s.w}-${s.l} · Week ${s.wk+1} next</p>`}
  save();const line=won?say('win'):tie?'A tie. Everybody loses, especially the viewers.':say('lose');
  $('#s-card').innerHTML=`<div class="card"><div class="lb">FINAL</div><h1 class="D" style="font-size:44px;text-shadow:3px 3px 0 #000">${won?'W':tie?'T':'L'}</h1>
   <div class="D" style="font-size:34px">${esc(me.ab)} ${G.sc[0]} – ${G.sc[1]} ${esc(O.ab)}</div><p>${esc(line)}</p>${seasonTxt}
   <div class="lb">Pass ${G.stats.pass} yds · Rush ${G.stats.rush} yds · TD ${G.stats.td} · INT ${G.stats.int}</div><p class="D" style="font-size:22px;color:#ffe07a">+${coins} 🪙 (bank ${SV.coins})</p>
   <div class="row">${G.mode=='season'&&SV.season&&!SV.season.done?'<button class="pb gr" id="nx">NEXT GAME →</button>':''}<button class="pb" id="again">REMATCH</button><button class="pb blu" id="shop">LOCKER ROOM</button><button class="pb red" id="home">MENU</button></div></div>`;
  showScr('s-card');hud(false);snd(won?'td':'boo');if(won&&!(me.heel&&G.mode=='season'))confetti(me,40);
  const m=G.mode,a=me.id,b=O.id;$('#again').onclick=()=>newGame(a,b,m=='season'?'quick':m);$('#home').onclick=title;$('#shop').onclick=shop;const nx=$('#nx');if(nx)nx.onclick=seasonNext;G=null}
// ---------- fx/hud ----------
let msgT=0;function msg(s,t){const m=$('#msg');m.textContent=s;m.style.display='block';msgT=t||2.5}
function bigTxt(s,c){const b=$('#big');b.textContent=s;b.style.color=c||'#ffe07a';b.style.display='none';void b.offsetWidth;b.style.display='block';clearTimeout(bigTxt.t);bigTxt.t=setTimeout(()=>b.style.display='none',1800)}
function confetti(t,n){const fx=$('#fx');for(let i=0;i<n;i++){const s=document.createElement('span');s.textContent=R()<.6?pick(t.em):'■';if(s.textContent=='■')s.style.color=t.wip?`hsl(${R()*360},100%,60%)`:pick(t.c);s.style.left=R()*100+'%';s.style.animationDuration=(1.6+R()*1.8)+'s';s.style.animationDelay=R()*.6+'s';s.style.fontSize=(18+R()*20)+'px';fx.appendChild(s);setTimeout(()=>s.remove(),4200)}}
function celebrate(t,line){bigTxt(t.heel?'BOOOO!':'TOUCHDOWN!',t.heel?'#e3262e':t.c[0]==='#ffffff'?t.c[1]:t.c[0]);setTimeout(()=>bigTxt(t.txt,t.c[1]==='#ffffff'?t.c[0]:t.c[1]),1300);confetti(t,t.wip?70:45);if(t.heel)setTimeout(()=>snd('boo'),300);msg(line,3.6);G.after=3.4;updHud()}
function hud(on){$('#hud').style.display=on?'flex':'none';if(!on){$('#msg').style.display='none'}}
function updHud(){if(!G)return;const m=G.me,o=G.opp,cb=t=>`style="background:${t.c[0]};color:${t.c[0]=='#ffffff'||t.c[0]=='#ffc72c'||t.c[0]=='#ffcb05'?'#111':'#fff'}"`;
  $('#sb').innerHTML=`<b ${cb(m)}>${esc(m.ab)} ${G.sc[0]}</b><b ${cb(o)}>${esc(o.ab)} ${G.sc[1]}</b>`;G.fd=G.down==1?Math.min(100,G.los+G.togo):G.fd||G.los+G.togo;
  const sp=G.los>50?`OPP ${100-G.los}`:G.los==50?'50':`OWN ${G.los}`,q=G.ot?'OT':'Q'+Math.min(4,G.drv);const nth=['','1st','2nd','3rd','4th'][Math.min(4,G.down)]||'4th';
  $('#dd').textContent=`${q} · ${nth} & ${G.fd>=100?'Goal':G.togo} · ${sp}`;$('#legs').style.width=G.legs+'%';$('#legs').style.background=G.legs<35?'#ff4040':'#7CFC00'}
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c]);
// ---------- render ----------
const crowd=[];for(let i=0;i<400;i++)crowd.push([R()*130-15,R(),['#e33','#fd3','#fff','#39f','#2c2','#f8c','#a5f'][(R()*7)|0]]);
function render(){ctx.fillStyle='#173d1c';ctx.fillRect(0,0,W,H);if(!G)return drawTitleField();
  const me=G.me,op=G.opp;
  // stands
  for(const s of [-1,1]){const y0=s<0?-1.5:FW+1.5;ctx.fillStyle='#2b2b36';fillQuad(-20,y0,135,y0+s*9);crowd.forEach(c=>{const [x,y]=P(c[0],y0+s*(1.2+c[1]*7));ctx.fillStyle=c[2];ctx.fillRect(x|0,y|0,2,2)})}
  // turf stripes
  for(let x=-10;x<110;x+=5){ctx.fillStyle=((x/5)&1)?'#2f8a35':'#2a7d30';fillQuad(x,0,x+5,FW)}
  // end zones
  fillQuadC(-10,0,0,FW,me.c[0]);fillQuadC(100,0,110,FW,op.c[0]);
  ctx.font='bold 10px monospace';ctx.textAlign='center';ctx.textBaseline='middle';
  for(const [ez,t] of [[-5,me],[105,op]]){for(let k=0;k<3;k++){const [x,y]=P(ez,8+k*18);ctx.fillStyle=t.c[1]==t.c[0]?'#fff':t.c[1];ctx.fillText(t.wip?'🚧WIP':t.ab,x,y)}}
  // lines
  ctx.fillStyle='#e9f5e9';for(let x=0;x<=100;x+=5){lineX(x,x%10==0?1:1)}
  for(let x=1;x<100;x++){for(const hy of [1,FW-1,CY-3,CY+3]){const [a,b]=P(x,hy);ctx.fillRect(a|0,b|0,1,1)}}
  ctx.fillStyle='#fff';fillQuad(-10,-.3,110,0);fillQuad(-10,FW,110,FW+.3);
  ctx.font='bold 9px monospace';for(let x=10;x<100;x+=10){const n=x>50?100-x:x;for(const yy of [6,FW-6]){const [a,b]=P(x,yy);ctx.fillStyle='#e9f5e9';ctx.fillText(String(n),a,b)}}
  if(me.wip||op.wip)for(let x=0;x<=100;x+=10){const [a,b]=P(x,-.9);ctx.fillStyle='#ff7a00';ctx.fillRect(a-1,b-3,3,5);ctx.fillStyle='#fff';ctx.fillRect(a-1,b-1,3,1)}
  // LOS + first down
  if(G.phase=='pre'||G.phase=='play'){ctx.fillStyle='#3aa0ff';lineX(G.los,1);if(G.fd<100){ctx.fillStyle='#ffe000';lineX(G.fd,1)}}
  // pre-snap route preview
  // particles under
  G.parts.forEach(p=>{if(!p.txt){const [x,y]=P(p.x,p.y);ctx.fillStyle=p.c;ctx.fillRect(x|0,y|0,2,2)}});
  // aim preview
  if(G.phase=='play'&&ptr.down&&G.ball.st=='held'&&G.ball.h.role=='qb'&&G.play!='run'){const dx=ptr.x-ptr.sx,dy=ptr.y-ptr.sy;if(hyp(dx,dy)>18){const q=G.ball.h,t=aimTarget(dx,dy),d=hyp(t[0]-q.x,t[1]-q.y);
    for(let i=1;i<=14;i++){const k=i/14,[x,y]=P(q.x+(t[0]-q.x)*k,q.y+(t[1]-q.y)*k),z=4*(1+d*.16)*k*(1-k)*K*.5;ctx.fillStyle=i%2?'#fff':'#ffe07a';ctx.fillRect(x-1,(y-z-1)|0,3,3)}
    const [x,y]=P(t[0],t[1]);ctx.strokeStyle='#ffe07a';ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y,7,0,7);ctx.stroke();ctx.lineWidth=1;ctx.fillStyle='#ffe07a';ctx.fillRect(x-1,y-1,2,2)}}
  if(G.ball.st=='air'){const [x,y]=P(G.ball.tx,G.ball.ty);ctx.strokeStyle='#fff9';ctx.beginPath();ctx.arc(x,y,3+Math.sin(performance.now()/80)*1,0,7);ctx.stroke()}
  // players sorted by screen y
  const L=G.ents.slice().sort((a,b)=>P(a.x,a.y)[1]-P(b.x,b.y)[1]);L.forEach(e=>drawMan(e,e.o?me:op));
  // ball
  const b=G.ball;if(b&&b.st=='air'){const [x,y]=P(b.x,b.y);const by=(y-b.z*K*.5)|0;ctx.fillStyle='#0005';ctx.fillRect(x-3,y,6,2);ctx.fillStyle='#5a2d0c';ctx.fillRect(x-4,by-1,8,5);ctx.fillStyle='#8b4513';ctx.fillRect(x-3,by,6,3);ctx.fillStyle='#fff';ctx.fillRect(x-1,by+1,3,1)}
  // floating text
  ctx.font='bold 10px monospace';G.parts.forEach(p=>{if(p.txt){const [x,y]=P(p.x,p.y);ctx.fillStyle='#000';ctx.fillText(p.txt,x+1,y-20-(1-p.t)*14+1);ctx.fillStyle='#ffe07a';ctx.fillText(p.txt,x,y-20-(1-p.t)*14)}});
  // hint
  if(G.phase=='play'&&G.t<2.5&&G.play!='run'&&!G.thrown&&!ptr.down&&SV.played<3){ctx.fillStyle='#000a';ctx.fillRect(W/2-90,H-60,180,16);ctx.fillStyle='#fff';ctx.font='bold 9px monospace';ctx.fillText('DRAG BACK, AIM, RELEASE TO THROW',W/2,H-52)}
  if(G.carrier&&G.phase=='play'&&SV.played<3){ctx.fillStyle='#000a';ctx.fillRect(W/2-90,H-60,180,16);ctx.fillStyle='#fff';ctx.font='bold 9px monospace';ctx.fillText(portrait?'DRAG L/R TO STEER · TAP/SWIPE = JUKE':'DRAG UP/DN TO STEER · TAP/SWIPE = JUKE',W/2,H-52)}
}
function lineX(x){const [a,b]=P(x,0),[c,d]=P(x,FW);if(portrait)ctx.fillRect(Math.min(a,c),b|0,Math.abs(c-a),1);else ctx.fillRect(a|0,Math.min(b,d),1,Math.abs(d-b))}
function fillQuad(x0,y0,x1,y1){const [a,b]=P(x0,y0),[c,d]=P(x1,y1);ctx.fillRect(Math.min(a,c),Math.min(b,d),Math.abs(c-a)+1,Math.abs(d-b)+1)}
function fillQuadC(x0,y0,x1,y1,c){ctx.fillStyle=c;fillQuad(x0,y0,x1,y1)}
function drawMan(e,t){let [x,y]=P(e.x,e.y);x=Math.round(x);y=Math.round(y);const g=e===G.carrier,hel=t.c[0],jer=t.c[1]==t.c[0]?'#fff':t.c[1],leg=(Math.sin(e.anim*3)>0);
  ctx.save();ctx.translate(x,y);ctx.scale(2,2);const r=(a,b,w,h,c)=>{ctx.fillStyle=c;ctx.fillRect(a,b,w,h)};
  if(e.stun>0){r(-5,-1,10,3,'#0004');r(-5,-4,7,3,jer);r(2,-5,3,3,hel);ctx.restore();return}
  r(-3,0,7,2,'#0005');
  if(g){ctx.strokeStyle=e.jk>0?'#fff':'#ffe07a';ctx.lineWidth=.7;ctx.beginPath();ctx.ellipse(.5,1,6,3,0,0,7);ctx.stroke()}
  const pc=e.o?'#eee':'#333';r(-2,-3,2,leg?3:2,pc);r(1,-3,2,leg?2:3,pc);
  r(-3,-8,7,5,jer);r(-3,-8,7,1,hel);r(-2,-12,5,4,hel);const face=portrait?0:(e.o?1:-1);r(face>0?2:face<0?-2:0,-10,1+(face==0?0:0),2,'#ddd');if(face==0)r(-1,-10,3,1,'#ddd');
  if(t.heel&&e.role=='qb')r(-3,-13,7,2,'#111');// eat-shit hat
  if(t.wip&&e.role=='qb')r(-3,-13,7,1,'#ffd23f');// hard hat
  if((e.role=='qb'&&!G.carrier&&G.ball.st=='held'&&G.ball.h===e)||g)r(2,-6,3,2,'#8b4513');
  ctx.restore()}
function drawTitleField(){const t=performance.now()/1000;for(let x=0;x<W;x+=40){ctx.fillStyle=((x/40)&1)?'#2f8a35':'#2a7d30';ctx.fillRect(x,0,40,H)}ctx.fillStyle='#e9f5e9';for(let x=0;x<W;x+=40)ctx.fillRect(x,0,1,H)}
// ---------- screens ----------
function showScr(id){document.querySelectorAll('.scr').forEach(s=>s.style.display='none');if(id)$('#'+id).style.display='block';cur=id?id.slice(2):'game'}
function avatar(t){return `https://sleepercdn.com/avatars/thumbs/${t.av}`}
function title(){G=null;hud(false);$('#pre').style.display='none';$('#kick').style.display='none';showScr('s-title');cur='title';const me=SV.team&&TM(SV.team),wk=me&&MATCH[me.id]&&TM(MATCH[me.id]);const s=SV.season;
  $('#s-title').innerHTML=`<div class="lb">SHADYNASTY ARCADE</div><h1 class="D">SHADY<br>BOWL</h1><p class="sub">Retro pixel football. Sling it deep, juke the league, get roasted. Defense is simulated, because nobody in this league plays any.</p>
  <div class="menu">${me?`<div class="card" style="margin:0;border-color:${me.c[0]}"><img src="${avatar(me)}" alt="" style="width:40px;height:40px;border-radius:50%;vertical-align:middle;margin-right:8px"><b class="D" style="font-size:20px">${esc(me.team)}</b> <a href="#" id="chg">change</a></div>`:''}
  ${me?`<button class="pb" id="qg">QUICK GAME<small>vs a random leaguemate</small></button>`:`<button class="pb" id="pk">PICK YOUR TEAM →</button>`}
  ${wk?`<button class="pb red" id="wk">THIS WEEK: ${esc(wk.ab)}<small>Week ${WEEK} real matchup vs ${esc(wk.team)}</small></button>`:''}
  ${me?`<button class="pb blu" id="ss">${s&&!s.done&&s.team==me.id?`SEASON · ${s.w}-${s.l}${s.bowl?' · SHADY BOWL':' · WK '+(s.wk+1)}`:'NEW SEASON'}<small>11 games vs the league, 7 wins = Shady Bowl</small></button><button class="pb gr" id="sh">LOCKER ROOM<small>${SV.coins} 🪙 · upgrades</small></button>`:''}
  </div><div class="card"><b>HOW TO PLAY</b><p style="text-align:left;margin:8px 0 0">🏈 Pick a play. <b>Throw:</b> drag back from anywhere like a slingshot, aim the dotted arc ahead of a receiver, release. Lead them, they'll adjust.<br>🏃 <b>With the ball:</b> drag to steer, tap or swipe to <b>juke</b> (dodges a tackle). Watch your Legs bar.<br>🥅 4th down: punt, kick (tap in the box) or go for it. 4 drives each, defense is a quick sim.<br>⌨️ Desktop: mouse drag to throw · arrows steer · Space juke · 1-4 plays.</p></div>
  <div class="lb">Best: ${SV.best.pts} pts · best margin ${SV.best.margin>-99?(SV.best.margin>0?'+':'')+SV.best.margin:'-'} · best season ${SV.best.wins} W · games ${SV.played}</div>
  <div class="row"><button class="ib" id="mute2" style="width:auto;padding:0 12px">${SV.mute?'🔇 SOUND OFF':'🔊 SOUND ON'}</button><a href="../../#arcade" class="pb red" style="text-decoration:none;display:flex;align-items:center;min-height:40px">← ARCADE</a></div>`;
  const on=(i,f)=>{const e=$('#'+i);if(e)e.onclick=ev=>{ev.preventDefault();f()}};
  on('pk',()=>teamSel());on('chg',()=>teamSel());on('qg',()=>{const o=pick(TEAMS.filter(t=>t.id!=me.id));newGame(me.id,o.id,'quick')});on('wk',()=>newGame(me.id,wk.id,'week'));
  on('ss',()=>{if(!(s&&!s.done&&s.team==me.id)){const sched=TEAMS.filter(t=>t.id!=me.id).map(t=>t.id).sort(()=>R()-.5);SV.season={team:me.id,sched,wk:0,w:0,l:0,res:[]};save()}seasonNext()});
  on('sh',shop);on('mute2',()=>{SV.mute=!SV.mute;save();title()})}
function seasonNext(){const s=SV.season;let o=s.sched[s.wk];if(s.bowl){o=TEAMS.filter(t=>t.id!=s.team).sort((a,b)=>(b.w||0)-(a.w||0))[0].id}newGame(s.team,o,'season');if(s.bowl)msg('THE SHADY BOWL. Win this and you get bragging rights until next August.',3.5)}
function teamSel(){showScr('s-team');$('#s-team').innerHTML=`<h2 class="D">PICK YOUR TEAM</h2><p class="sub">Every leaguemate's team, live from Sleeper. Your opponents are everyone else.</p><div class="grid">${TEAMS.map(t=>{const fg=t.c[0]=='#ffffff'?t.c[1]:t.c[0];return `<button class="tc${t.wip?' wip':''}" data-t="${t.id}" style="background:linear-gradient(160deg,${fg},${t.c[2]||'#111'})"><img src="${avatar(t)}" alt="" loading="lazy" onerror="this.style.visibility='hidden'"><b>${esc(t.team)}</b><small>${esc(t.mgr)} · ${t.w!=null?t.w+'-'+(t.l||0):''}</small>${t.wip?'<span class="tag">🚧 UNDER CONSTRUCTION</span>':t.heel?'<span class="tag">👎 BOOOO</span>':''}</button>`}).join('')}</div><div class="row"><button class="pb red" id="bk">← BACK</button></div>`;
  $('#s-team').onclick=e=>{const b=e.target.closest('[data-t]');if(b){SV.team=b.dataset.t;save();snd('catch');title()}if(e.target.id=='bk')title()}}
const UPS=[['arm','ARM','Longer, faster, more accurate throws'],['hands','HANDS','Bigger catch radius, wins 50/50 balls'],['wheels','WHEELS','Faster receivers and backs, more broken tackles'],['legs','LEGS','Stamina refills faster, bigger kick window'],['d','DEFENSE','Sim defense gives up fewer points']];
function shop(){showScr('s-shop');const h=UPS.map(([k,n,d])=>{const l=SV.up[k],c=30*(l+1);return `<div class="up"><div><b class="D" style="font-size:20px">${n}</b> <span class="pips">${'■'.repeat(l)}${'□'.repeat(5-l)}</span><br><small>${d}</small></div>${l<5?`<button class="pb" data-u="${k}" ${SV.coins<c?'disabled style="opacity:.45"':''}>${c} 🪙</button>`:'<b>MAX</b>'}</div>`}).join('');
  $('#s-shop').innerHTML=`<h2 class="D">LOCKER ROOM</h2><p class="sub">Bank: <b>${SV.coins} 🪙</b>. Earn coins with TDs, FGs and wins. Unlike some GMs in this league, you can't trade future picks for these.</p><div style="max-width:520px;margin:0 auto">${h}</div><div class="row"><button class="pb red" id="bk2">← MENU</button></div>`;
  $('#s-shop').onclick=e=>{const b=e.target.closest('[data-u]');if(b){const k=b.dataset.u,c=30*(SV.up[k]+1);if(SV.coins>=c){SV.coins-=c;SV.up[k]++;save();snd('td');shop()}}if(e.target.id=='bk2')title()}}
$('#quit').onclick=()=>{if(confirm('Quit this game? It counts for nothing.'))title()};
$('#mute').onclick=()=>{SV.mute=!SV.mute;save();$('#mute').textContent=SV.mute?'🔇':'🔊';if(!SV.mute)snd('catch')};$('#mute').textContent=SV.mute?'🔇':'🔊';
// ---------- loop ----------
let last=performance.now();
function loop(now){const dt=Math.min(.05,(now-last)/1000);last=now;try{update(dt);render()}catch(e){console.error(e)}if(msgT>0){msgT-=dt;if(msgT<=0)$('#msg').style.display='none'}if(G&&G.phase!='card'&&G.phase!='kick'&&cur=='game')updHud();requestAnimationFrame(loop)}
requestAnimationFrame(loop);title();loadLive().then(()=>{if(cur=='title')title();else if(cur=='team')teamSel()});
// test hooks
window.__SB={aimDrag(tx,ty){const q=G.ball.h,wx=(tx-q.x)/3.1,wy=(ty-q.y)/3.1;return portrait?[-wy*S*K,wx*S*K]:[-wx*S*K,-wy*S*K]},toCss(x,y){const p=P(x,y);return [p[0]*S,p[1]*S]},get G(){return G},snap,throwBall,juke,newGame,TEAMS,endPlay};
