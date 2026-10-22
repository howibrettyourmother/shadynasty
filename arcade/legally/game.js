// LESSHOUSE: slingshot the evidence, topple the excuses, free the 1.01. Matter.js physics, canvas render, DOM menus,
// pre-rendered mp3 voice (vo/), league board on the legally-scores worker (offline queue). All trades/drops are real 2026 Sleeper data.
(function(){'use strict';
var $=function(i){return document.getElementById(i)};
var qp=function(k){try{return new URLSearchParams(location.search).get(k)}catch(e){return null}};
var API=(qp('lbapi')||'https://legally-scores.brettwilson08.workers.dev').replace(/\/$/,''),BOARD=qp('lbboard')==='test'?'test':'main';
var LEAGUE='1312055708249767936',JOE_UID='679000405232934912';
var LS={get:function(k,d){try{var v=localStorage.getItem(k);return v==null?d:JSON.parse(v)}catch(e){return d}},set:function(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};
var esc=function(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return'&#'+c.charCodeAt(0)+';'})};
var cleanName=function(n){return String(n||'').replace(/[\u0000-\u001f\u007f<>"`\\]/g,'').replace(/\u{1F3C6}/gu,'').replace(/\s+/g,' ').trim().slice(0,32)};
var rid=function(){var s='';for(var i=0;i<12;i++)s+='abcdefghijklmnopqrstuvwxyz0123456789'[Math.random()*36|0];return s};
var DEV=LS.get('lh:dev','');if(!/^[a-z0-9]{8,16}$/.test(DEV)){DEV=rid();LS.set('lh:dev',DEV)}
var VL=window.LH_LINES;
var M=Matter,Bodies=M.Bodies,Body=M.Body,Composite=M.Composite,Engine=M.Engine,Events=M.Events;
// ---------------- real 2026 data (Sleeper transactions, league 1312055708249767936) ----------------
var TRADES=[
 [{gave:'Zay Flowers',to:'Badfish',got:'2027 1st'},{gave:'Marvin Harrison Jr.',to:'Still Renovating',got:'2027 1st'}],
 [{gave:'Ladd McConkey',to:'Excessive Celebration',got:'2028 1st, 2027 2nd, 2028 4th'}],
 [{gave:'Bhayshul Tuten + 2026 3rd',to:'Bigmike9193',got:'2027 2nd, 2028 2nd'},{gave:'J.K. Dobbins',to:'Badfish',got:'2026 2nd, 2027 4th'}],
 [{gave:'2026 1st',to:'Tet McMuffins',got:'Calvin Ridley, Kendre Miller + 4 picks',note:'then dropped Ridley'},{gave:'Aaron Jones Sr.',to:'SaquonMyPickens',got:'2027 3rd'},{gave:'Sam Darnold',to:'Tet McMuffins',got:'2029 2nd, 2027 3rd'}]];
var FIRESALE=[['Zay Flowers','2027 1st'],['Ladd McConkey','2028 1st'],['B. Tuten','2027 2nd'],['J.K. Dobbins','2026 2nd'],['Aaron Jones','2027 3rd'],['Marvin Harrison Jr.','2027 1st'],['Sam Darnold','2029 2nd']];
var COUNSEL=['ONLINE LAW DEGREE','PASSED THE BAR (THE ONE ON MAIN ST)','READ HALF THE BYLAWS','LEARNED LAW FROM TV','A MAGIC 8-BALL IN A TIE'];
// ---------------- teams ----------------
var FALLBACK=[["559056589221363712","Tet McMuffins"],["602659459214409728","Bigmike9193"],["602988793519214592","TheTunaSquad"],["603082868373135360","Wilson Weasels"],["679000405232934912","Rebuilding Morehouse’s"],["679012011916492800","Badfish"],["679423513769111552","Ramrod"],["679424003198238720","A new dawn rising"],["679424354223738880","Still Renovating"],["679425819310903296","Excessive Celebration"],["679818637024010240","DetroitDumpsterFire"],["684465506765316096","SaquonMyPickens"]].map(function(a){return{uid:a[0],team:a[1],av:''}});
var TEAMS=LS.get('lh:teams',null)||FALLBACK,ME=null;
function me(){var u=LS.get('lh:team','');for(var i=0;i<TEAMS.length;i++)if(TEAMS[i].uid===u)return TEAMS[i];return null}
function loadTeams(){var j=function(p){return fetch('https://api.sleeper.app/v1/league/'+LEAGUE+'/'+p).then(function(r){if(!r.ok)throw 0;return r.json()})};
  Promise.all([j('users'),j('rosters')]).then(function(a){var U={};a[0].forEach(function(u){U[u.user_id]=u});
    var out=a[1].filter(function(r){return r.owner_id&&U[r.owner_id]}).map(function(r){var u=U[r.owner_id];
      return{uid:String(r.owner_id),team:cleanName(u.metadata&&u.metadata.team_name)||u.display_name||('Team '+r.roster_id),av:/^[a-f0-9]{1,40}$/.test(u.avatar||'')?u.avatar:''}});
    if(out.length>=4){out.sort(function(x,y){return x.team.toLowerCase()<y.team.toLowerCase()?-1:1});TEAMS=out;LS.set('lh:teams',out);renderWho();if(BD)renderBoards(BD)}}).catch(function(){})}
var avById=function(uid,av){if(!av)for(var i=0;i<TEAMS.length;i++)if(TEAMS[i].uid===uid)av=TEAMS[i].av;return av};
function avatar(name,av){var ini=esc((name||'?').replace(/[^A-Za-z0-9 ]/g,'').split(' ').filter(Boolean).slice(0,2).map(function(w){return w[0]}).join('').toUpperCase()||'?');
  return av?'<span class="av"><img class="av" src="https://sleepercdn.com/avatars/thumbs/'+esc(av)+'" alt="" onerror="this.parentNode.textContent=\''+ini+'\'"></span>':'<span class="av">'+ini+'</span>'}
function renderWho(){ME=me();loadAv();$('whoName').textContent=ME?ME.team:'Pick your team';$('whoAv').outerHTML=ME?avatar(ME.team,ME.av).replace('class="av"','class="av" id="whoAv"'):'<span class="av" id="whoAv">?</span>';$('best').textContent=LS.get('lh:best',0)}
function openTeams(){$('teams').innerHTML=TEAMS.map(function(t){return'<button data-uid="'+esc(t.uid)+'" class="'+(ME&&ME.uid===t.uid?'me':'')+'">'+avatar(t.team,t.av)+'<span>'+esc(t.team)+'</span></button>'}).join('');scr('s-team')}
$('teams').addEventListener('click',function(e){var b=e.target.closest('button');if(!b)return;LS.set('lh:team',b.getAttribute('data-uid'));renderWho();scr('s-title');loadBoard()});
// ---------------- audio ----------------
var AC=null,MASTER=null,VOI={},VBUF={},vNow=null,vPri=0,MUTE=LS.get('lh:mute',false),VQ=[];
fetch('vo/index.json').then(function(r){return r.json()}).then(function(j){VOI=j.keys||{};if(AC)preload()}).catch(function(){});
function unlock(){if(AC){if(AC.state==='suspended')AC.resume();return}var C=window.AudioContext||window.webkitAudioContext;if(!C)return;
  AC=new C();MASTER=AC.createGain();MASTER.gain.value=MUTE?0:1;MASTER.connect(AC.destination);var s=AC.createBufferSource();s.buffer=AC.createBuffer(1,1,22050);s.connect(MASTER);s.start(0);preload()}
var loading=0;function preload(){if(loading||!AC)return;var ks=Object.keys(VOI);if(!ks.length)return;loading=1;
  ks.forEach(function(t){fetch('vo/'+VOI[t]).then(function(r){if(!r.ok)throw 0;return r.arrayBuffer()}).then(function(ab){return new Promise(function(res,rej){AC.decodeAudioData(ab,res,rej)})}).then(function(b){VBUF[t]=b}).catch(function(){})})}
var VOLOG=window.__lhvo=[];
function pick(arr){return arr[Math.random()*arr.length|0]}
// say(text|array, priority, queue): higher priority interrupts; queue=true plays after the current clip
function say(x,pri,queue){var t=Array.isArray(x)?pick(x):x;if(!AC||!VBUF[t])return;if(vNow){if(queue){VQ.push([t,pri]);return}if(pri<=vPri)return;try{vNow.onended=null;vNow.stop()}catch(e){}}
  var s=AC.createBufferSource();s.buffer=VBUF[t];s.connect(MASTER);s.start();vNow=s;vPri=pri;VOLOG.push(t);
  s.onended=function(){if(vNow===s){vNow=null;vPri=0;var n=VQ.shift();if(n)say(n[0],n[1])}}}
function sayQ(t,pri){VQ=[];say(t,pri)}
function tone(f,d,type,v,f2){if(!AC)return;var o=AC.createOscillator(),g=AC.createGain(),n=AC.currentTime;o.type=type||'square';o.frequency.setValueAtTime(f,n);if(f2)o.frequency.exponentialRampToValueAtTime(f2,n+d);
  g.gain.setValueAtTime(v||.12,n);g.gain.exponentialRampToValueAtTime(.001,n+d);o.connect(g);g.connect(MASTER);o.start(n);o.stop(n+d+.02)}
function noise(d,v){if(!AC)return;var b=AC.createBuffer(1,AC.sampleRate*d,AC.sampleRate),a=b.getChannelData(0);for(var i=0;i<a.length;i++)a[i]=(Math.random()*2-1)*(1-i/a.length);var s=AC.createBufferSource(),g=AC.createGain();g.gain.value=v||.2;s.buffer=b;s.connect(g);g.connect(MASTER);s.start()}
var SFX={stretch:function(){tone(200,.08,'triangle',.05,260)},fire:function(){tone(500,.18,'sawtooth',.1,140);noise(.12,.12)},crash:function(v){noise(.18,Math.min(.35,.08+v*.02));tone(120,.12,'square',.06,60)},
  pop:function(){tone(880,.1,'square',.08,1320)},boom:function(){noise(.5,.4);tone(90,.4,'sawtooth',.2,40)},ding:function(){[660,880,1320].forEach(function(f,i){setTimeout(function(){tone(f,.12,'triangle',.08)},i*70)})},
  thunder:function(){noise(1.2,.45);tone(60,1,'sawtooth',.15,30)},kick:function(){tone(300,.1,'square',.12,90);noise(.1,.2)}};
$('mute').addEventListener('click',function(){MUTE=!MUTE;LS.set('lh:mute',MUTE);this.textContent=MUTE?'🔇':'🔊';if(MASTER)MASTER.gain.value=MUTE?0:1});$('mute').textContent=MUTE?'🔇':'🔊';
// ---------------- world ----------------
var WW=1100,WH=560,GROUND=520,SX=165,SY=392,MAXPULL=120,POWER=.175;
var cv=$('cv'),cx=cv.getContext('2d'),DPR=1,CAM={s:1,ox:0,oy:0};
function size(){DPR=Math.min(window.devicePixelRatio||1,2);var w=innerWidth,h=innerHeight;cv.width=w*DPR|0;cv.height=h*DPR|0;var s=Math.min(w/WW,h/WH);CAM={s:s*DPR,ox:(w-WW*s)/2*DPR,oy:(h-WH*s)*DPR}}
addEventListener('resize',size);size();
var KIND={up:{hp:10,pts:200,c:'#b07a3c',dens:.0016,lab:'DYNASTY UPSIDE'},pp:{hp:5,pts:150,c:'#9fd8ff',dens:.0011,lab:'POTENTIAL POINTS'},ec:{hp:14,pts:300,c:'#2b2f3a',dens:.0024,lab:'EXEC COUNCIL'},
  fil:{hp:6,pts:200,c:'#f4efe1',dens:.0012},star:{hp:4,pts:400,c:'#ffd23f',dens:.0012},bag:{hp:18,pts:300,c:'#2fa44f',dens:.002},
  ir:{hp:4,pts:1000,r:17,dens:.0015},joe:{hp:8,pts:5000,r:24,dens:.0018},law:{hp:3,pts:1500,r:15,dens:.0012},vault:{hp:26,pts:10000,c:'#6d7787',dens:.004}};
var AMMO={ex:{r:14,d:.006,ico:'📁',name:'EXHIBIT A'},n47:{r:19,d:.014,ico:'4️⃣',name:'THE 47'},by:{r:12,d:.006,ico:'📜',name:'BYLAWS'},sh:{r:14,d:.005,ico:'👟',name:'SHOEY'}};
// level defs: b(kind,x,y,w,h,label), t(kind,x,y,name)
function LV(n){var E=[],b=function(k,x,y,w,h,l){E.push({k:k,x:x,y:y,w:w,h:h,l:l,t:k==='vault'})},t=function(k,x,y,nm){E.push({k:k,x:x,y:y,r:KIND[k].r,nm:nm,t:k==='joe'})},G=GROUND;
  var throne=function(x,y){b('bag',x,y-16,64,32,'VENMO');t('joe',x,y-32-24,'JOE')};
  if(n===0){b('up',760,G-50,22,100);b('up',880,G-50,22,100);b('pp',820,G-110,170,20);t('ir',820,G-17,'Jake Bobo');b('up',790,G-160,20,80);b('up',850,G-160,20,80);b('pp',820,G-210,110,20);throne(820,G-220);t('ir',950,G-17,'Jalen McMillan');t('law',690,G-15,'COUNSEL #1');return{E:E,name:'EXHIBIT A',ammo:['ex','ex','n47','by','sh'],ghosts:['Pat Freiermuth','Jonnu Smith']}}
  if(n===1){[720,820,920].forEach(function(x){b('up',x,G-45,22,90)});b('pp',770,G-100,120,18);b('pp',870,G-100,120,18);t('ir',770,G-17,'Xavier Legette');t('ir',870,G-17,'James Conner');
    b('pp',770,G-150,20,80);b('pp',870,G-150,20,80);b('ec',820,G-199,150,18,'EXEC COUNCIL');t('ir',820,G-127,'Dillon Gabriel');b('up',795,G-238,18,60);b('up',845,G-238,18,60);b('pp',820,G-276,90,16);throne(820,G-284);t('law',660,G-15,'COUNSEL #2');
    return{E:E,name:'POTENTIAL POINTS',ammo:['ex','by','n47','sh','ex'],ghosts:['Marquise Brown','Rachaad White']}}
  if(n===2){var i=0;[[730,0],[800,0],[870,0],[940,0],[765,1],[835,1],[905,1]].forEach(function(p){var fs=FIRESALE[i++];b('star',p[0],G-34-p[1]*68,58,66,fs[0]+'|'+fs[1])});
    b('ec',835,G-145,260,18,'EXEC COUNCIL');t('ir',700,G-160,'Skyy Moore');b('up',700,G-120,30,40);t('ir',990,G-17,'Mason Tipton');b('up',800,G-185,18,62);b('up',870,G-185,18,62);b('pp',835,G-224,110,16);throne(835,G-232);t('law',650,G-15,'COUNSEL #3');
    return{E:E,name:'FIRE SALE',ammo:['ex','n47','by','sh','ex'],ghosts:['Kendre Miller','Treylon Burks'],sale:true}}
  if(n===3){var F=['CEASE & DESIST','RESPONDENT FILING','AMENDED FILING','OMNIBUS RULING'];b('fil',740,G-50,24,100,F[0]);b('fil',900,G-50,24,100,F[1]);b('ec',820,G-110,200,20,'EXEC COUNCIL');
    t('ir',790,G-17,'Jalen McMillan');t('ir',850,G-17,'James Conner');b('fil',770,G-165,22,90,F[2]);b('fil',870,G-165,22,90,F[3]);b('ec',820,G-220,140,18,'EXEC COUNCIL');b('pp',820,G-250,90,40,'POTENTIAL POINTS');throne(820,G-270);
    b('up',985,G-40,40,80);t('ir',985,G-97,'Jake Bobo');t('law',665,G-15,'COUNSEL #4');return{E:E,name:'THE FILINGS',ammo:['by','ex','n47','sh','by','ex'],ghosts:['Calvin Ridley']}}
  b('ec',760,G-60,24,120,'EXEC COUNCIL');b('ec',960,G-60,24,120,'EXEC COUNCIL');b('vault',860,G-58,120,116,'VAULT');b('up',860,G-130,260,20);t('ir',740,G-137,'Dillon Gabriel');t('ir',980,G-137,'Skyy Moore');
  b('pp',820,G-175,18,70);b('pp',900,G-175,18,70);b('up',860,G-219,120,18);throne(860,G-228);t('law',680,G-15,'COUNSEL #5');
  return{E:E,name:'THE VAULT',ammo:['n47','ex','sh','by','n47','sh'],ghosts:['Ray Davis','Henry Ruggs'],boss:true}}
var NLV=5;
var engine=null,S=null,ST='title',RUN=null;
function body(e){var o={friction:.6,restitution:.05,density:KIND[e.k].dens,sleepThreshold:40};var bd=e.r?Bodies.circle(e.x,e.y,e.r,o):Bodies.rectangle(e.x,e.y,e.w,e.h,o);if(e.a)Body.setAngle(bd,e.a);bd.ent=e;e.body=bd;return bd}
function buildWorld(ents,keepVel){engine=Engine.create({enableSleeping:true,positionIterations:10,velocityIterations:8});
  Composite.add(engine.world,[Bodies.rectangle(WW/2+400,GROUND+40,WW*3,80,{isStatic:true,friction:.9,label:'ground'})]);
  ents.forEach(function(e){if(!e.dead){e.hp=e.hp==null?KIND[e.k].hp:e.hp;Composite.add(engine.world,body(e))}});
  Events.on(engine,'collisionStart',onHit)}
function loadLevel(n){var d=LV(n);S={n:n,d:d,ents:d.E,ammo:d.ammo.slice(),ai:0,proj:[],shotT:0,state:'aim',grace:0,fired:0,counsel:false,snap:null,fx:[],parade:[],ghosts:[],pull:null,ability:false,bubble:3.5,senate:n===4?3:0,score0:RUN.score,steps:0};
  d.E.forEach(function(e){e.hp=KIND[e.k].hp;e.y0=e.y});S.grace=1e9;buildWorld(d.E);
  sleepAll();d.E.forEach(function(e){e.y0=e.body.position.y});S.grace=20;S.hp0=tankHp();S.mode=RUN.mode;if(S.mode==='d'){S.state='build';S.builds=3;S.ammo=S.ammo.slice(0,4)}
  S.ghosts=d.ghosts.map(function(nm,i){return{nm:nm,x:420+i*200+Math.random()*60,y:120+i*60,ph:Math.random()*6,hit:false}});
  if(d.sale)FIRESALE.forEach(function(f,i){S.parade.push({nm:f[0],to:'→ '+f[1],x:835,y:GROUND-200,vx:180+Math.random()*120,vy:-160-Math.random()*120,t:-i*.35,l:4})});
  hud();scr(null);ST='play';
  if(S.mode==='d'){sayQ(S.senate?'I AM THE SENATE!':'Tank for Jeremiah!',4);say(VL.judge_defend,2,true);if(S.senate)SFX.thunder()}else if(S.senate){SFX.thunder();sayQ('I AM THE SENATE!',4);say(VL.judge_start[1],1,true)}else{sayQ(n===0?'I HAVE ALL THE LEVERAGE!':pick(['I HAVE ALL THE LEVERAGE!','Tank for Jeremiah!','I will continue with my current plan.']),4);say(VL.lawyer[n%VL.lawyer.length],1,true);if(n===0)say(VL.judge_start[0],1,true)}}
function sleepAll(){S.ents.forEach(function(e){if(!e.dead&&e.body)M.Sleeping.set(e.body,true)})}
function tankHp(){var t=0;S.ents.forEach(function(e){if(!e.dead&&e.k!=='law')t+=Math.max(0,Math.min(e.hp,KIND[e.k].hp*(e.rf?1.6:1)))});return t}
function odds(){return S&&S.hp0?Math.max(0,Math.min(1,tankHp()/S.hp0)):1}
function alive(k){return S.ents.filter(function(e){return!e.dead&&(!k||e.k===k)})}
function kill(e,why){if(e.dead)return;e.dead=true;if(e.body)Composite.remove(engine.world,e.body);var p=e.body?e.body.position:{x:e.x,y:e.y};
  var pts=(why==='void'||S.mode==='d')?0:KIND[e.k].pts;RUN.score+=pts;if(pts)pop(p.x,p.y-10,'+'+pts,e.k==='joe'?'#ffd23f':'#fff');burst(p.x,p.y,e.k==='joe'?30:12,e.k==='pp'?['#cfeeff','#fff']:e.k==='star'?['#ffd23f','#fff']:['#d9a066','#fff','#888']);
  if(e.k==='star'){var p2=e.l.split('|');S.parade.push({nm:p2[0],to:'→ '+p2[1],x:p.x,y:p.y,vx:220,vy:-260,t:0,l:4})}
  if(e.k==='ir'){say(VL.judge_ir,2);SFX.pop()}else if(e.k==='joe'){SFX.ding();say(pick(['Objection!','Disregard my previous statement.','Those picks are assets!']),3)}else if(e.k==='vault'){SFX.boom();S.freed={x:p.x,y:p.y,t:0}}else if(e.k==='law')SFX.pop();else SFX.crash(4);
  if(e.k!=='ir'&&e.k!=='joe'&&Math.random()<.25)say(VL.judge_hit,1)}
function onHit(ev){if(S.grace>0)return;ev.pairs.forEach(function(p){var a=p.bodyA,b=p.bodyB,dv=Math.hypot(a.velocity.x-b.velocity.x,a.velocity.y-b.velocity.y);
  [[a,b],[b,a]].forEach(function(q){var e=q[0].ent,o=q[1];if(!e||e.dead)return;var om=o.isStatic?q[0].mass:o.mass,dmg=Math.max(0,dv-1.6)*Math.sqrt(Math.min(6,om/q[0].mass))*(o.proj?1.8:1);
    if(dmg>.5){e.hp-=dmg;e.flash=.15;if(e.hp<=0)kill(e)}});if(dv>4)SFX.crash(dv)})}
// ---------------- shooting ----------------
function curAmmo(){return S.ammo[S.ai]}
function launch(px,py){var k=curAmmo(),A=AMMO[k];S.snap=snapshot();var bd=Bodies.circle(SX,SY,A.r,{density:A.d,restitution:.25,friction:.5,frictionAir:.006});bd.proj=k;
  Composite.add(engine.world,bd);Body.setVelocity(bd,{x:px*POWER,y:py*POWER});S.proj=[bd];S.state='fly';S.shotT=0;S.ability=k==='by'||k==='sh';S.ai++;S.fired++;RUN.shots++;SFX.fire();
  say(VL.judge_ammo[['ex','n47','by','sh'].indexOf(k)],1);hud()}
function ability(){if(!S.ability||!S.proj.length)return;S.ability=false;var p=S.proj[0];
  if(p.proj==='by'){var v=p.velocity,sp=Math.hypot(v.x,v.y),ang=Math.atan2(v.y,v.x);[-.22,.22].forEach(function(da){var nb=Bodies.circle(p.position.x,p.position.y,10,{density:.006,restitution:.25,frictionAir:.006});nb.proj='by';
    Composite.add(engine.world,nb);Body.setVelocity(nb,{x:Math.cos(ang+da)*sp,y:Math.sin(ang+da)*sp});S.proj.push(nb)});SFX.pop();burst(p.position.x,p.position.y,10,['#f4efe1','#c8a24a'])}
  else if(p.proj==='sh')splash(p)}
function splash(p){var x=p.position.x,y=p.position.y;SFX.boom();burst(x,y,40,['#f2c14e','#fffbe6','#fff']);S.fx.push({k:'ring',x:x,y:y,t:0});
  S.ents.forEach(function(e){if(e.dead)return;var b=e.body,dx=b.position.x-x,dy=b.position.y-y,d=Math.hypot(dx,dy);if(d<150){var f=(1-d/150);M.Sleeping.set(b,false);Body.setVelocity(b,{x:b.velocity.x+dx/d*f*9,y:b.velocity.y+dy/d*f*9-2*f});e.hp-=f*7;if(e.hp<=0)kill(e)}});
  Composite.remove(engine.world,p);S.proj=S.proj.filter(function(q){return q!==p})}
function snapshot(){return{score:RUN.score,ai:S.ai,ents:S.ents.map(function(e){return e.dead?{dead:1}:{x:e.body.position.x,y:e.body.position.y,a:e.body.angle,hp:e.hp}})}}
function fireCounsel(){if(!S||S.counsel||!S.snap||ST!=='play')return;S.counsel=true;var sn=S.snap;RUN.score=sn.score;S.ai=sn.ai;S.proj=[];S.ability=false;
  S.ents.forEach(function(e,i){var q=sn.ents[i];e.body=null;if(q.dead){e.dead=true;return}e.dead=false;e.x=q.x;e.y=q.y;e.a=q.a;e.hp=q.hp});
  buildWorld(S.ents);sleepAll();S.grace=30;S.state='aim';S.parade=S.parade.filter(function(p){return p.t<0});S.fx.push({k:'kick',t:0});SFX.kick();
  sayQ('I have fired my previous counsel.',5);say(VL.judge_fire,2,true);toast('🗑️ COUNSEL FIRED · SHOT VOIDED');hud()}
function settled(){return S.ents.every(function(e){return e.dead||e.body.isSleeping||Math.hypot(e.body.velocity.x,e.body.velocity.y)<.3})}
function targetsLeft(){return S.ents.filter(function(e){return e.t&&!e.dead}).length}
function stepGame(dt){S.steps++;if(S.grace>0)S.grace--;if(S.bubble>0)S.bubble-=dt;if(S.senate>0)S.senate-=dt;
  Engine.update(engine,1000/60);
  S.ents.forEach(function(e){if(e.dead||!e.body)return;var p=e.body.position;if(e.flash>0)e.flash-=dt;
    if(p.y>WH+80||p.x>WW+300||p.x<-200)kill(e);else if(e.k==='joe'&&p.y>e.y0+45&&S.grace<=0){e.hp=0;kill(e)}});
  S.proj.slice().forEach(function(p){var q=p.position;S.ghosts.forEach(function(g){if(!g.hit&&S.mode!=='d'&&Math.hypot(q.x-g.x,q.y-g.y)<38){g.hit=true;RUN.score+=500;pop(g.x,g.y,'+500 👻','#cfe');say(VL.judge_ghost,2);SFX.ding()}});
    if(q.y>WH+60||q.x>WW+200||q.x<-100){Composite.remove(engine.world,p);S.proj=S.proj.filter(function(x){return x!==p})}});
  if(S.state==='fly'){S.shotT+=dt;if(S.ability&&S.proj[0]&&S.proj[0].proj==='sh'&&S.shotT>.15){var pr=S.proj[0];if(Math.hypot(pr.velocity.x,pr.velocity.y)<POWER*MAXPULL*.45)splash(pr),S.ability=false}
    var moving=S.proj.some(function(p){return Math.hypot(p.velocity.x,p.velocity.y)>.4});
    if((!moving&&S.shotT>1.2)||S.shotT>7){if(settled()||S.shotT>9){S.proj.forEach(function(p){Composite.remove(engine.world,p)});S.proj=[];resolve()}}
  }else if(S.state==='aim'&&!targetsLeft()&&settled())resolve();
  if(S.freed)S.freed.t+=dt;hud()}
function audit(){var ir=S.ents.filter(function(e){return e.k==='ir'}),pass=ir.every(function(e){return e.dead});S.audit=pass;
  if(S.mode!=='d'){if(pass){RUN.score+=3000;pop(WW/2,200,'AUDIT PASSED +3000','#7CFC00');say(VL.judge_audit_pass,3,true)}else{S.fx.push({k:'pour',t:0});say(VL.judge_audit_fail,3,true)}}
  RUN.audits=(RUN.audits||0)+(pass?1:0);return pass}
function resolve(){
  if(S.mode==='d'){var joeUp=S.ents.some(function(e){return e.k==='joe'&&!e.dead});
    if(!joeUp){S.state='done';say(VL.judge_defeated,4);setTimeout(function(){finish(false)},1600);return}
    var o=odds(),keep=Math.round(o*2000);RUN.score+=keep;pop(WW/2,200,'+'+keep+' ODDS KEPT','#ffd23f');
    if(S.ai>=S.ammo.length){S.state='done';var bonus=8000+Math.round(o*4000);RUN.score+=bonus;RUN.lv=S.n+1;toast('🛡️ TANK HELD · +'+bonus);say(VL.judge_held,3,true);audit();
      setTimeout(function(){if(S.d.boss)finish(true);else tradeCard(S.n)},1600);return}
    say(VL.judge_held,2);S.state='build';S.builds=2;hud();return}
  if(!targetsLeft()){S.state='done';var left=S.ammo.length-S.ai,bonus=2000+left*1500;RUN.score+=bonus;RUN.lv=S.n+1;toast('✅ CLEARED · +'+bonus);say(S.d.boss?VL.judge_win:VL.judge_clear,3,true);audit();
    setTimeout(function(){if(S.d.boss)finish(true);else tradeCard(S.n)},S.d.boss?2800:2200);return}
  if(S.ai>=S.ammo.length){S.state='done';audit();say(VL.judge_lose,4,true);setTimeout(function(){finish(false)},2200);return}
  S.state='aim';hud()}
// Defend the Tank: AI League Office aims at Joe (brute-force over the same trajectory model the aim preview uses)
function aiPull(k){var C2=S.ents.filter(function(e){return!e.dead&&e.body&&(k?e.k===k:(e.k!=='law'&&e.k!=='joe'))}),joe=k?C2[0]:(Math.random()<.35?S.ents.filter(function(e){return e.k==='joe'&&!e.dead})[0]:C2[Math.random()*C2.length|0]);if(!joe)return{x:80,y:-60};var tx=joe.body.position.x,ty=joe.body.position.y,best=null;
  for(var a=-.1;a<1.3;a+=.02)for(var m=50;m<=MAXPULL;m+=3){var vx=Math.cos(a)*m*POWER,vy=-Math.sin(a)*m*POWER,x=SX,y=SY,dmin=1e9;
    for(var i=0;i<300;i++){x+=vx;y+=vy;vy+=.2778;vx*=.994;vy*=.994;var d=Math.hypot(x-tx,y-ty);if(d<dmin)dmin=d;if(y>GROUND||x>tx+60)break}
    if(!best||dmin<best.d)best={d:dmin,a:a,m:m}}
  var nz=k?Math.max(.05,.11-S.n*.012):Math.max(.1,.2-S.n*.02),a=best.a+(Math.random()-.5)*nz,m=best.m*(1+(Math.random()-.5)*.08);return{x:Math.cos(a)*m,y:-Math.sin(a)*m}}
function aiFire(){if(S.state!=='build'||!curAmmo())return;S.state='aim';var p=aiPull();S.pull=p;hud();setTimeout(function(){S.pull=null;launch(p.x,p.y);
  if(S.ability)setTimeout(function(){if(S.state==='fly')ability()},700+Math.random()*300)},650)}
function buildTap(wx,wy){if(S.state!=='build'||S.builds<=0)return;var hit=M.Query.point(Composite.allBodies(engine.world),{x:wx,y:wy}).filter(function(b){return b.ent&&!b.ent.dead})[0];
  if(hit){var e=hit.ent;if(e.rf||e.k==='joe'||e.k==='law'){toast('Already reinforced');return}e.rf=true;e.hp=KIND[e.k].hp*1.6;Body.setDensity(hit,KIND[e.k].dens*3);S.hp0+=KIND[e.k].hp*.6;S.builds--;SFX.pop();pop(wx,wy,'🔩 REINFORCED','#ffd23f')}
  else if(wx>600&&wx<WW-20&&wy<GROUND-40){var ne={k:'up',x:wx,y:wy,w:22,h:70,l:'DYNASTY UPSIDE',hp:KIND.up.hp,y0:wy};S.ents.push(ne);Composite.add(engine.world,body(ne));S.hp0+=KIND.up.hp;S.builds--;SFX.crash(2);pop(wx,wy-40,'+ EXCUSE','#ffd23f')}
  else{toast('Tap a block to reinforce, or empty air by the tower to add one');return}
  hud()}
function tradeCard(n){ST='card';var T=TRADES[n];var h='<div class="card" style="text-align:center;background:'+(S.audit?'#e9ffe0':'#ffe6e0')+'"><b style="font:400 24px Anton,Impact;color:'+(S.audit?'#1b6e2e':'#c8102e')+'">🍺 SHOEBEER AUDIT '+(S.audit?'PASSED':'FAILED')+'</b> '+(S.mode==='d'?'':(S.audit?'+3000':'· the judge pours a shoey'))+'</div><div class="card"><div class="stamp">TRADE ACCEPTED</div><h3>📈 2026 · REAL DEALS</h3>'+T.map(function(t){return'<div>🏚️ Rebuilding Morehouse’s sends <b class="gv">'+esc(t.gave)+'</b> to '+esc(t.to)+' for <b class="gt">'+esc(t.got)+'</b>'+(t.note?' <i>('+esc(t.note)+')</i>':'')+'</div>'}).join('')+
  '<div class="roast">⚖️ "'+esc(n===3?VL.judge_trade[3]:VL.judge_trade[n%3])+'"</div><div class="hint" style="color:#555">Next: '+esc(LV(n+1).name)+' · Counsel #'+(n+2)+': '+esc(COUNSEL[n+1])+'</div></div>';
  $('cardBody').innerHTML=h;scr('s-card');sayQ(n===3?VL.judge_trade[3]:VL.judge_trade[n%3],3);say('I will continue with my current plan.',2,true);cardAt=Date.now()}
var cardAt=0;
// ---------------- fx ----------------
var PA=[];function burst(x,y,n,cols){for(var i=0;i<n;i++)PA.push({x:x,y:y,vx:(Math.random()-.5)*320,vy:-Math.random()*300,l:.5+Math.random()*.5,c:cols[i%cols.length],s:2+Math.random()*3})}
var POPS=[];function pop(x,y,t,c){POPS.push({x:x,y:y,t:t,c:c,l:1.1})}
function toast(t){var e=$('toast');e.textContent=t;e.style.display='block';clearTimeout(toast.h);toast.h=setTimeout(function(){e.style.display='none'},1800)}
function hud(){if(!S)return;$('sc').textContent=RUN.score;$('lv').textContent='LV '+(S.n+1)+' · '+S.d.name+' · COUNSEL #'+(S.n+1);
  $('ammo').innerHTML=S.ammo.map(function(k,i){return'<span class="'+(i===S.ai&&S.state!=='done'?'on':'')+'" style="'+(i<S.ai?'opacity:.12':'')+'">'+AMMO[k].ico+'</span>'}).join('');
  var f=$('fire');f.style.display=S.mode!=='d'&&S.snap&&!S.counsel&&S.state!=='done'?'block':'none';var o=Math.round(odds()*100);if(o!==hud.o){hud.o=o;$('tankI').style.width=o+'%';$('tankT').textContent='1.01 ODDS '+o+'%'}
  var rd=$('ready');rd.style.display=S.mode==='d'&&S.state==='build'?'block':'none';rd.textContent='🔨 '+(S.builds||0)+' · READY ▶'}
// ---------------- drawing ----------------
function R(x,y,w,h,c){cx.fillStyle=c;cx.fillRect(x,y,w,h)}
function C(x,y,r,c){cx.fillStyle=c;cx.beginPath();cx.arc(x,y,r,0,7);cx.fill()}
function T(t,x,y,sz,c,al,font){cx.font=(font||'bold ')+sz+'px Arial';cx.fillStyle=c;cx.textAlign=al||'center';cx.fillText(t,x,y);cx.textAlign='left'}
function fitT(t,x,y,maxw,sz,c){cx.font='bold '+sz+'px Arial';var w=cx.measureText(t).width;if(w>maxw)sz=Math.max(6,sz*maxw/w);T(t,x,y,sz,c)}
var TIME=0;
function bgDraw(){cx.setTransform(1,0,0,1,0,0);var g=cx.createLinearGradient(0,0,0,cv.height);g.addColorStop(0,S&&S.d.boss?'#120a24':'#1b2a52');g.addColorStop(.7,S&&S.d.boss?'#3a1540':'#e07a4a');g.addColorStop(1,'#3b2a1a');cx.fillStyle=g;cx.fillRect(0,0,cv.width,cv.height);
  cx.setTransform(CAM.s,0,0,CAM.s,CAM.ox,CAM.oy);var gx=-CAM.ox/CAM.s,gw=cv.width/CAM.s;
  // crumbling house silhouette (LESSHOUSE) far right
  cx.fillStyle='#00000055';cx.beginPath();cx.moveTo(560,GROUND);cx.lineTo(560,300);cx.lineTo(700,200);cx.lineTo(780,260);cx.lineTo(800,240);cx.lineTo(840,300);cx.lineTo(840,GROUND);cx.fill();
  R(600,330,40,40,'#ffd23f22');R(740,320,30,50,'#00000033');T('FOR SALE',700,440,22,'#ffffff33');
  R(gx,GROUND,gw,WH-GROUND+200,'#3d6b2a');R(gx,GROUND,gw,6,'#5a8f3a')}
function drawSling(){R(SX-6,SY,12,GROUND-SY,'#6b3518');R(SX-22,SY-30,8,36,'#6b3518');R(SX+14,SY-30,8,36,'#6b3518');R(SX-22,SY+2,44,8,'#6b3518')}
function drawEnt(e){var b=e.body;if(!b)return;var K=KIND[e.k];cx.save();cx.translate(b.position.x,b.position.y);cx.rotate(b.angle);var fl=e.flash>0;
  if(e.r){var r=e.r;
    if(e.k==='ir'){C(0,0,r,fl?'#fff':'#3a6fd8');R(-r,-3,2*r,6,'#ddd');C(-5,0,2.5,'#000');C(5,0,2.5,'#000');R(-6,7,12,2,'#000');R(r-6,-r-6,18,11,'#e00');T('IR',r+3,-r+3,9,'#fff');cx.rotate(-b.angle);fitT(e.nm,0,r+13,90,11,'#fff')}
    else if(e.k==='joe'){C(0,0,r,fl?'#fff':'#f1c27d');R(-r-2,-r+2,2*r+4,8,'#ff8c00');C(0,-r+4,r*.7,'#ff8c00');R(-12,-6,24,7,'#222');cx.strokeStyle='#5a1a00';cx.lineWidth=3;cx.beginPath();cx.arc(0,10,8,.2,2.9);cx.stroke();cx.rotate(-b.angle);T('JOE',0,r+14,12,'#ffd23f')}
    else{C(0,0,r,fl?'#fff':'#222');R(-3,-2,6,14,'#c8102e');C(0,-r+5,6,'#f1c27d');R(r-4,2,12,9,'#6b3518');cx.rotate(-b.angle);fitT(e.nm,0,r+12,90,10,'#ddd')}
  }else{var w=e.w,h=e.h;
    if(e.k==='ec'){R(-w/2,-h/2,w,h,fl?'#fff':K.c);R(-w/2+3,-h/2+3,w-6,h-6,'#4a90d9');C(0,h/2-4,2,'#fff')}
    else if(e.k==='bag'){R(-w/2,-h/2,w,h,fl?'#fff':K.c);R(-8,-h/2-8,16,8,'#24803c');T('$',0,6,18,'#fff')}
    else if(e.k==='vault'){R(-w/2,-h/2,w,h,fl?'#fff':K.c);R(-w/2+6,-h/2+6,w-12,h-12,'#8a95a6');C(0,0,22,'#4a5260');for(var i=0;i<6;i++){cx.save();cx.rotate(i*1.05+TIME);R(-2,-22,4,12,'#c0c8d4');cx.restore()}T('1.01',0,h/2-12,14,'#ffd23f');T('VAULT',0,-h/2+18,12,'#fff')}
    else if(e.k==='star'){R(-w/2,-h/2,w,h,fl?'#fff':'#fff8dc');R(-w/2,-h/2,w,14,'#ffd23f');T('★',0,-h/2+12,12,'#c8102e');var p=e.l.split('|');var ws=p[0].split(' ');fitT(ws[0],0,2,w-6,11,'#111');fitT(ws.slice(1).join(' '),0,15,w-6,11,'#111');fitT('SOLD',0,h/2-5,w-6,9,'#c8102e')}
    else{R(-w/2,-h/2,w,h,fl?'#fff':K.c);cx.strokeStyle='#0005';cx.lineWidth=2;cx.strokeRect(-w/2,-h/2,w,h);
      var lab=e.l||K.lab;if(lab){if(h>w){cx.rotate(-Math.PI/2);fitT(lab,0,4,h-6,Math.min(12,w-8),'#0008')}else fitT(lab,0,4,w-6,Math.min(12,h-6),'#0009')}}}
  cx.restore()}
var AVIMG=null;function loadAv(){AVIMG=null;if(!ME||!ME.av)return;var im=new Image();im.crossOrigin='anonymous';im.onload=function(){AVIMG=im};im.src='https://sleepercdn.com/avatars/thumbs/'+ME.av}
var RING={ex:'#e0b04a',n47:'#c8102e',by:'#f4efe1',sh:'#f2c14e'};
function drawProj(p){var A=AMMO[p.proj],x=p.position.x,y=p.position.y,r=p.circleRadius;cx.save();cx.translate(x,y);cx.rotate(p.angle);
  if(AVIMG&&!(S&&S.mode==='d')){C(0,0,r+3,RING[p.proj]);cx.save();cx.beginPath();cx.arc(0,0,r,0,7);cx.clip();cx.drawImage(AVIMG,-r,-r,2*r,2*r);cx.restore();if(p.proj==='n47')T('47',0,r+1,10,'#fff');cx.restore();return}
  if(p.proj==='ex'){R(-r,-r*.7,2*r,1.4*r,'#e0b04a');R(-r,-r*.7,r,5,'#c8902a');T('A',0,5,13,'#7a3d00')}
  else if(p.proj==='n47'){C(0,0,r,'#c8102e');T('47',0,6,16,'#fff')}
  else if(p.proj==='by'){R(-r,-r*.5,2*r,r,'#f4efe1');C(-r,0,r*.5,'#c8a24a');C(r,0,r*.5,'#c8a24a')}
  else{R(-r,-r*.4,2*r,r,'#fff');R(-r,r*.4,2*r+3,4,'#bbb');R(-r+3,-r*.4-5,r*1.3,6,'#f2c14e')}
  cx.restore()}
function drawAmmoInSling(){var k=curAmmo();if(!k||S.state!=='aim')return;var p=S.pull||{x:0,y:0};var x=SX-p.x,y=SY-p.y;
  cx.strokeStyle='#3a1a08';cx.lineWidth=5;cx.beginPath();cx.moveTo(SX-18,SY-26);cx.lineTo(x,y);cx.lineTo(SX+18,SY-26);cx.stroke();drawProj({proj:k,position:{x:x,y:y},angle:0,circleRadius:AMMO[k].r});
  if(S.pull){var vx=p.x*POWER,vy=p.y*POWER,px=x,py=y;cx.fillStyle='#fff';for(var i=0;i<28;i++){for(var j=0;j<2;j++){px+=vx;py+=vy;vy+=.2778;vx*=.994;vy*=.994}if(i>2)C(px,py,3-i*.08,'#ffffffaa')}}
  T(AMMO[k].name,SX,SY+48,13,'#ffd23f')}
function drawGhost(g){var y=g.y+Math.sin(TIME*1.5+g.ph)*10;cx.globalAlpha=g.hit?.15:.55;cx.fillStyle='#e8f4ff';cx.beginPath();cx.arc(g.x,y,22,Math.PI,0);cx.lineTo(g.x+22,y+26);for(var i=0;i<4;i++)cx.lineTo(g.x+22-(i+.5)*11,y+(i%2?26:18));cx.lineTo(g.x-22,y+26);cx.fill();
  C(g.x-7,y-2,3,'#223');C(g.x+7,y-2,3,'#223');cx.globalAlpha=g.hit?.2:.85;fitT(g.nm,g.x,y+40,120,11,'#e8f4ff');T('DROPPED',g.x,y+52,9,'#ff9a9a');cx.globalAlpha=1}
function draw(dt){TIME+=dt;bgDraw();
  if(!S){drawSling();cx.save();var b={position:{x:820,y:GROUND-60},angle:0};R(788,GROUND-40,64,40,'#2fa44f');T('$',820,GROUND-12,22,'#fff');C(820,GROUND-64,24,'#f1c27d');R(796,GROUND-86,48,8,'#ff8c00');R(808,GROUND-70,24,7,'#222');
    bubble(820,GROUND-110,'I HAVE ALL THE LEVERAGE!');cx.restore();return}
  S.ghosts.forEach(drawGhost);drawSling();S.ents.forEach(drawEnt);S.proj.forEach(drawProj);drawAmmoInSling();if(S.mode==='d'&&S.state==='build'){cx.setLineDash([8,6]);cx.strokeStyle='#ffd23f88';cx.lineWidth=2;cx.strokeRect(600,40,WW-620,GROUND-80);cx.setLineDash([]);T('🔨 TAP A BLOCK TO REINFORCE · TAP AIR BY THE TOWER TO ADD AN EXCUSE',WW/2+120,GROUND+28,15,'#ffd23f')}
  S.ents.forEach(function(e){if(e.rf&&!e.dead&&e.body)T('🔩',e.body.position.x,e.body.position.y+5,14,'#fff')});
  var joe=S.ents.filter(function(e){return e.k==='joe'&&!e.dead})[0];if(joe&&(S.bubble>0||S.state==='aim'&&!S.fired))bubble(joe.body.position.x,joe.body.position.y-42,S.senate>0?'I AM THE SENATE!':'I HAVE ALL THE LEVERAGE!');
  var law=S.ents.filter(function(e){return e.k==='law'&&!e.dead})[0];if(law&&S.bubble>0)bubble(law.body.position.x,law.body.position.y-30,'COUNSEL #'+(S.n+1)+': '+COUNSEL[S.n],11);
  S.parade.forEach(function(p){if(p.t<0)return;cx.save();cx.translate(p.x,p.y);cx.rotate(Math.sin(p.t*6)*.2);R(-46,-24,92,48,'#fff8dc');R(-46,-24,92,12,'#ffd23f');fitT(p.nm,0,4,86,12,'#111');fitT(p.to,0,18,86,11,'#1b6e2e');cx.restore()});
  if(S.freed){var f=S.freed,yy=f.y-Math.min(160,f.t*120);cx.save();cx.translate(f.x,yy);cx.rotate(Math.sin(f.t*3)*.1);var s=1+Math.min(.6,f.t*.4);cx.scale(s,s);R(-50,-34,100,68,'#fff');R(-50,-34,100,16,'#c8102e');T('2027 DRAFT',0,-21,11,'#fff');T('JEREMIAH',0,6,16,'#111');T('1.01',0,26,18,'#c8102e');cx.restore();burst(f.x,yy,2,['#ffd23f','#fff'])}
  S.fx.forEach(function(f){f.t+=dt;if(f.k==='ring'){cx.strokeStyle='rgba(242,193,78,'+Math.max(0,1-f.t*2)+')';cx.lineWidth=8;cx.beginPath();cx.arc(f.x,f.y,20+f.t*300,0,7);cx.stroke()}
    else if(f.k==='pour'){var px=WW/2,py=120;cx.save();cx.translate(px,py);cx.rotate(-Math.min(1.2,f.t*2));R(-30,-12,60,26,'#fff');R(-30,10,62,6,'#bbb');cx.restore();if(f.t>.4)for(var i=0;i<8;i++)R(px-30+Math.random()*10,py+i*30+((f.t*400)%30),6,18,'#f2c14e');T('AUDIT FAILED',WW/2,90,28,'#ff5a5a')}
    else if(f.k==='kick'){var x=SX+60+f.t*900,y=GROUND-60-f.t*500+f.t*f.t*300;cx.save();cx.translate(x,y);cx.rotate(f.t*12);C(0,0,16,'#222');R(-3,-2,6,14,'#c8102e');C(0,-12,7,'#f1c27d');R(10,2,14,10,'#6b3518');cx.restore();T('FIRED!',SX+80,GROUND-120,22,'#ffd23f')}});
  S.fx=S.fx.filter(function(f){return f.t<(f.k==='pour'?2.4:1.6)});
  if(S.senate>0){var on=(TIME*7|0)%3===0;if(on){cx.strokeStyle='#e6f0ff';cx.lineWidth=4;cx.beginPath();var lx=500+Math.random()*500,ly=0;cx.moveTo(lx,ly);for(var i=0;i<7;i++){lx+=(Math.random()-.5)*80;ly+=60;cx.lineTo(lx,ly)}cx.stroke();cx.setTransform(1,0,0,1,0,0);cx.fillStyle='#ffffff33';cx.fillRect(0,0,cv.width,cv.height);cx.setTransform(CAM.s,0,0,CAM.s,CAM.ox,CAM.oy)}
    cx.font='400 64px Anton,Impact';cx.textAlign='center';cx.lineWidth=8;cx.strokeStyle='#000';cx.strokeText('I AM THE SENATE!',WW/2,170);cx.fillStyle='#ffd23f';cx.fillText('I AM THE SENATE!',WW/2,170);cx.textAlign='left'}
  PA.forEach(function(p){cx.globalAlpha=Math.max(0,p.l*1.5);R(p.x,p.y,p.s,p.s,p.c)});cx.globalAlpha=1;
  POPS.forEach(function(p){cx.globalAlpha=Math.min(1,p.l*1.5);T(p.t,p.x,p.y,18,p.c);cx.globalAlpha=1})}
function bubble(x,y,t,sz){sz=sz||15;cx.font='bold '+sz+'px Arial';var w=cx.measureText(t).width+18,h=sz+14;x=Math.max(w/2+4,Math.min(WW-w/2-4,x));cx.fillStyle='#fff';cx.beginPath();cx.moveTo(x-6,y);cx.lineTo(x,y+12);cx.lineTo(x+6,y);cx.fill();
  cx.fillRect(x-w/2,y-h,w,h);cx.strokeStyle='#111';cx.lineWidth=2;cx.strokeRect(x-w/2,y-h,w,h);T(t,x,y-7,sz,'#111')}
function tickFx(dt){PA.forEach(function(p){p.l-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=700*dt});PA=PA.filter(function(p){return p.l>0});POPS.forEach(function(p){p.l-=dt;p.y-=40*dt});POPS=POPS.filter(function(p){return p.l>0});
  if(S)S.parade.forEach(function(p){p.t+=dt;if(p.t>0){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=60*dt}});if(S)S.parade=S.parade.filter(function(p){return p.t<p.l})}
var lastT=0,acc=0;function loop(ts){var dt=Math.min(.05,(ts-lastT)/1000||0);lastT=ts;
  if(ST==='play'&&S){acc+=dt;var n=0;while(acc>=1/60&&n<3){stepGame(1/60);acc-=1/60;n++}if(n===3)acc=0}
  tickFx(dt);draw(dt);requestAnimationFrame(loop)}requestAnimationFrame(loop);
// ---------------- flow ----------------
function scr(id){['s-title','s-over','s-team','s-card','s-mode'].forEach(function(s){$(s).style.display=s===id?'block':'none'});$('hud').style.display=id?'none':'flex'}
function start(mode){unlock();if(!ME){openTeams();return}if(!mode&&ME.uid===JOE_UID){scr('s-mode');return}RUN={score:0,shots:0,lv:0,t0:Date.now(),mode:mode==='d'?'d':'o'};loadLevel(0)}
var overAt=0,LAST=null,VERDICT='';
function finish(won){ST='over';overAt=Date.now();var best=LS.get('lh:best',0),pb=RUN.score>best;if(pb)LS.set('lh:best',RUN.score);
  var D=RUN.mode==='d';VERDICT=D?(won?'TANK HELD':'TANK DEFEATED'):(won?'TANK DEFEATED':'1.01 FORFEITED');$('oHead').textContent=(D?'🛡️ ':'')+(won&&!D?'🏆 1.01 FREED · TANK DEFEATED':VERDICT);$('oHead').style.color=(won?'#7CFC00':'#ff5a5a');$('oScore').textContent=RUN.score;
  $('oStats').textContent=(RUN.mode==='d'?'DEFEND THE TANK · ':'')+'Levels '+RUN.lv+'/'+NLV+' · '+RUN.shots+' shots · 🍺 audits '+(RUN.audits||0)+' · 🏆 '+Math.max(best,RUN.score)+(pb?' · NEW BEST':'');
  LAST={v:2,id:rid(),dev:DEV,uid:ME.uid,n:cleanName(ME.team),av:ME.av||'',s:RUN.score,t:Date.now()-RUN.t0,lv:RUN.lv,sh:RUN.shots,m:RUN.mode};window.__lhlast=LAST;
  $('oRank').textContent='Filing with the clerk…';scr('s-over');if(RUN.score>0)submit(LAST);else loadBoard()}
// ---------------- shareable verdict card ----------------
function verdictCanvas(){var c=document.createElement('canvas');c.width=c.height=1080;var g=c.getContext('2d'),won=/HELD|DEFEATED/.test(VERDICT)&&!(RUN.mode==='d'&&VERDICT==='TANK DEFEATED');
  var gr=g.createLinearGradient(0,0,0,1080);gr.addColorStop(0,'#1b2a52');gr.addColorStop(1,'#3a1540');g.fillStyle=gr;g.fillRect(0,0,1080,1080);
  g.fillStyle='#f4efe1';g.fillRect(90,150,900,780);g.strokeStyle='#c8102e';g.lineWidth=14;g.strokeRect(110,170,860,740);
  g.textAlign='center';g.fillStyle='#111';g.font='400 64px Anton,Impact';g.fillText('LESSHOUSE',540,110);g.fillStyle='#ffd23f';g.fillText('LESSHOUSE',536,106);
  g.fillStyle='#555';g.font='bold 34px Georgia';g.fillText('IN THE MATTER OF THE 2027 1.01',540,250);
  g.save();g.translate(540,420);g.rotate(-.08);g.strokeStyle=won?'#1b6e2e':'#c8102e';g.lineWidth=12;g.strokeRect(-400,-80,800,160);g.fillStyle=won?'#1b6e2e':'#c8102e';g.font='400 110px Anton,Impact';g.fillText(VERDICT,0,40);g.restore();
  g.fillStyle='#111';g.font='bold 52px Georgia';g.fillText((RUN.mode==='d'&&VERDICT==='TANK DEFEATED'?'':'by ')+(LAST?LAST.n:''),540,600);
  g.font='400 140px Anton,Impact';g.fillStyle='#c8102e';g.fillText(String(RUN.score),540,770);g.font='bold 30px Georgia';g.fillStyle='#333';
  g.fillText((RUN.mode==='d'?'Defend the Tank · ':'')+'Levels '+RUN.lv+'/'+NLV+' · '+RUN.shots+' shots · audits '+(RUN.audits||0),540,840);
  g.font='bold 28px Arial';g.fillStyle='#fff';g.fillText('"I HAVE ALL THE LEVERAGE!"  ·  SHADYNASTY ARCADE',540,1010);
  if(AVIMG){g.save();g.beginPath();g.arc(200,290,62,0,7);g.clip();g.drawImage(AVIMG,138,228,124,124);g.restore();g.strokeStyle='#ffd23f';g.lineWidth=6;g.beginPath();g.arc(200,290,62,0,7);g.stroke()}
  return c}
function shareVerdict(){var c=verdictCanvas(),txt=VERDICT+' by '+(LAST?LAST.n:'')+' · '+RUN.score+' · LESSHOUSE https://howibrettyourmother.github.io/shadynasty/arcade/legally/';
  c.toBlob(function(b){if(!b)return;var f=null;try{f=new File([b],'lesshouse-verdict.png',{type:'image/png'})}catch(e){}
    if(f&&navigator.canShare&&navigator.canShare({files:[f]})){navigator.share({files:[f],text:txt,title:'LESSHOUSE'}).catch(function(){})}
    else{var a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='lesshouse-verdict.png';document.body.appendChild(a);a.click();setTimeout(function(){URL.revokeObjectURL(a.href);a.remove()},1000);toast('Verdict saved')}},'image/png')}
window.__lhshare=function(){return verdictCanvas().toDataURL('image/png')};
// ---------------- leaderboard ----------------
function post(e){return fetch(API+'/scores?board='+BOARD,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(e)}).then(function(x){return x.json().then(function(j){j.status=x.status;return j})})}
function queue(e){var q=LS.get('lh:pend',[]);if(!q.some(function(x){return x.id===e.id}))q.push(e);LS.set('lh:pend',q.slice(-8))}
function submit(e){if(!navigator.onLine){queue(e);$('oRank').textContent='📴 Offline. Saved, will post when you\'re back.';renderBoards(BD);return}
  post(e).then(function(j){if(!j.ok){if(j.status===429){queue(e);$('oRank').textContent='Clerk is swamped. Queued, will post shortly.'}else $('oRank').textContent='The court rejected that score.';return renderBoards(j.top?j:BD)}
    $('oRank').innerHTML=j.rank===1?'👑 <b>#1 IN THE LEAGUE</b>':j.rank>0&&j.rank<=10?'🏛️ <b>TOP 10!</b> #'+j.rank:j.rank>0?'#'+j.rank+' all-time · your team is #'+j.teamPlace:'Not even close to the board.';renderBoards(j)})
  .catch(function(){queue(e);$('oRank').textContent='📴 Board offline. Saved, will post later.';$('lbOver').innerHTML='<div class="hint">Leaderboard is napping.</div>'})}
var flushing=false;function flushPending(){if(flushing||!navigator.onLine)return;var q=LS.get('lh:pend',[]);if(!q.length)return;flushing=true;var e=q[0];
  post(e).then(function(j){if(j.status===429){flushing=false;setTimeout(flushPending,5000);return}LS.set('lh:pend',LS.get('lh:pend',[]).filter(function(x){return x.id!==e.id}));flushing=false;if(j.top)renderBoards(j);setTimeout(flushPending,4500)}).catch(function(){flushing=false})}
addEventListener('online',function(){flushPending();loadBoard()});
var BD=null;
function list(top,hlId){if(!top||!top.length)return'<div class="hint">Nobody on the board yet. Go set the score to beat.</div>';var seen={};
  return'<ol class="lb">'+top.slice(0,10).map(function(x,i){var tb=!seen[x.uid];seen[x.uid]=1;var m=hlId?x.id===hlId:(ME&&tb&&x.uid===ME.uid);
    return'<li class="'+(tb?'tb ':'')+(m?'me':'')+'"><span class="r">'+(i+1)+'</span>'+avatar(x.n,avById(x.uid,x.av))+'<span class="n">'+(x.m==='d'?'🛡️ ':'')+esc(x.n)+(x.lv?' <small style="opacity:.7">L'+x.lv+'</small>':'')+'</span><span class="s">'+x.s+'</span></li>'}).join('')+'</ol>'}
function myLine(j){if(!ME||!j||!j.teams)return'';var p=-1;for(var i=0;i<j.teams.length;i++)if(j.teams[i].uid===ME.uid)p=i;var pend=LS.get('lh:pend',[]).length;
  return'<div class="hint">'+(p>=0?'Your team: <b>#'+(p+1)+'</b> of '+j.teams.length+' teams · best '+j.teams[p].s:'Your team isn\'t on the board yet.')+(pend?' · 📴 '+pend+' queued':'')+'</div>'}
var TAB=LS.get('lh:tab','all');function tabs(){return'<div class="tabs"><button data-tab="all" class="'+(TAB==='all'?'on':'')+'">ALL-TIME</button><button data-tab="week" class="'+(TAB==='week'?'on':'')+'">THIS WEEK</button></div>'}
function renderBoards(j){if(!j){var h=tabs()+'<div class="hint">Leaderboard is napping.</div>';$('lbTitle').innerHTML=h;$('lbOver').innerHTML=h;return}BD=j;var top=TAB==='week'?((j.week&&j.week.top)||[]):j.top,foot=TAB==='week'?'<div class="hint">Resets Monday 12:00 AM ET</div>':myLine(j);
  $('lbTitle').innerHTML=tabs()+list(top)+foot;$('lbOver').innerHTML=tabs()+list(top,ST==='over'&&LAST&&LAST.id)+foot}
['lbTitle','lbOver'].forEach(function(id){$(id).addEventListener('click',function(e){var b=e.target.closest('[data-tab]');if(!b)return;TAB=b.getAttribute('data-tab');LS.set('lh:tab',TAB);renderBoards(BD)})});
function loadBoard(){return fetch(API+'/scores?board='+BOARD+'&limit=10'+(ME?'&uid='+ME.uid:'')).then(function(r){return r.json()}).then(renderBoards).catch(function(){var h='<div class="hint">Leaderboard is napping. Try again in a bit.</div>';$('lbTitle').innerHTML=h;$('lbOver').innerHTML=h})}
// ---------------- input: one screen-wide handler (capture) so no overlay eats taps ----------------
var drag=null;
function toWorld(x,y){return{x:(x*DPR-CAM.ox)/CAM.s,y:(y*DPR-CAM.oy)/CAM.s}}
function pdown(x,y){if(ST!=='play'||!S)return;if(S.mode==='d'){if(S.state==='build'){var w=toWorld(x,y);buildTap(w.x,w.y)}return}if(S.state==='fly'){ability();return}if(S.state!=='aim'||!curAmmo())return;drag={x:x,y:y};S.pull={x:0,y:0};SFX.stretch()}
function pmove(x,y){if(!drag||!S||!S.pull)return;var k=CAM.s/DPR,dx=(drag.x-x)/k,dy=(drag.y-y)/k,d=Math.hypot(dx,dy);if(d>MAXPULL){dx*=MAXPULL/d;dy*=MAXPULL/d}S.pull={x:dx,y:dy}}
function pup(){if(!drag||!S)return;drag=null;var p=S.pull;S.pull=null;if(p&&Math.hypot(p.x,p.y)>22&&S.state==='aim')launch(p.x,p.y)}
var lastTouch=0;
addEventListener('touchstart',function(e){lastTouch=Date.now();unlock();if(ST!=='play')return;var tg=e.target;if(tg.closest&&tg.closest('#mute'))return;e.preventDefault();
  if(tg.closest&&tg.closest('#fire')){fireCounsel();return}if(tg.closest&&tg.closest('#ready')){aiFire();return}var t=e.changedTouches[0];pdown(t.clientX,t.clientY)},{passive:false,capture:true});
addEventListener('touchmove',function(e){if(ST!=='play')return;e.preventDefault();var t=e.changedTouches[0];pmove(t.clientX,t.clientY)},{passive:false,capture:true});
addEventListener('touchend',function(){if(ST==='play')pup()},{passive:true,capture:true});addEventListener('touchcancel',function(){drag=null;if(S)S.pull=null},{passive:true});
addEventListener('mousedown',function(e){if(Date.now()-lastTouch<800||ST!=='play')return;var tg=e.target;if(tg.closest&&tg.closest('#mute'))return;if(tg.closest&&tg.closest('#fire')){fireCounsel();return}if(tg.closest&&tg.closest('#ready')){aiFire();return}unlock();pdown(e.clientX,e.clientY)});
addEventListener('mousemove',function(e){if(Date.now()-lastTouch>800)pmove(e.clientX,e.clientY)});addEventListener('mouseup',function(){if(Date.now()-lastTouch>800&&ST==='play')pup()});
addEventListener('keydown',function(e){if(ST==='play'&&e.code==='Space'&&S&&S.state==='fly'){ability();e.preventDefault()}else if(ST==='play'&&e.code==='KeyF'){fireCounsel()}});
function btn(id,fn){$(id).addEventListener('click',function(e){e.preventDefault();unlock();fn()})}
btn('goBtn',function(){start()});btn('modeO',function(){start('o')});btn('modeD',function(){start('d')});btn('modeBack',function(){scr('s-title')});btn('shareBtn',shareVerdict);btn('againBtn',function(){if(Date.now()-overAt<700)return;start(RUN&&RUN.mode)});btn('homeBtn',function(){ST='title';S=null;scr('s-title');renderWho();loadBoard()});
btn('whoBtn',openTeams);btn('teamBack',function(){scr(ST==='over'?'s-over':'s-title')});btn('nextBtn',function(){if(Date.now()-cardAt<500)return;loadLevel(S.n+1)});
renderWho();scr('s-title');loadTeams();loadBoard().then(flushPending);
if('serviceWorker'in navigator&&(location.protocol==='https:'||location.hostname==='localhost'))navigator.serviceWorker.register('sw.js').catch(function(){});
window.__lh={state:function(){return ST},S:function(){return S},run:function(){return RUN},launch:function(px,py){launch(px,py)},ability:ability,counsel:fireCounsel,vo:function(){return Object.keys(VBUF).length},load:function(n,m){if(!RUN||m)RUN={score:0,shots:0,lv:0,t0:Date.now(),mode:m||'o'};loadLevel(n)},aiFire:aiFire,aiPull:function(k){return aiPull(k)},buildTap:buildTap,odds:odds,finish:finish,
  targets:function(){return S.ents.filter(function(e){return e.t&&!e.dead}).map(function(e){return[e.nm,Math.round(e.body.position.x),Math.round(e.body.position.y)]})}};
})();
