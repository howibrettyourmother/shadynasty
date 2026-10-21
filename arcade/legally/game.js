// LEGALLY JOE: one-thumb courthouse runner. Canvas game, DOM menus, pre-rendered mp3 voice (vo/), league board on legally-scores worker.
(function(){'use strict';
var $=function(i){return document.getElementById(i)};
var qp=function(k){try{return new URLSearchParams(location.search).get(k)}catch(e){return null}};
var API=(qp('lbapi')||'https://legally-scores.brettwilson08.workers.dev').replace(/\/$/,''),BOARD=qp('lbboard')==='test'?'test':'main';
var LEAGUE='1312055708249767936',JOE_UID='679000405232934912';
var LS={get:function(k,d){try{var v=localStorage.getItem(k);return v==null?d:JSON.parse(v)}catch(e){return d}},set:function(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};
var esc=function(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return'&#'+c.charCodeAt(0)+';'})};
var cleanName=function(n){return String(n||'').replace(/[\u0000-\u001f\u007f<>"`\\]/g,'').replace(/\u{1F3C6}/gu,'').replace(/\s+/g,' ').trim().slice(0,32)};
var rid=function(){var s='';for(var i=0;i<12;i++)s+='abcdefghijklmnopqrstuvwxyz0123456789'[Math.random()*36|0];return s};
var DEV=LS.get('lj:dev','');if(!/^[a-z0-9]{8,16}$/.test(DEV)){DEV=rid();LS.set('lj:dev',DEV)}
var L=window.LJ_LINES;
// ---------------- teams (Sleeper users + rosters, cached; fallback snapshot) ----------------
var FALLBACK=[["559056589221363712","Tet McMuffins"],["602659459214409728","Bigmike9193"],["602988793519214592","TheTunaSquad"],["603082868373135360","Wilson Weasels"],["679000405232934912","Rebuilding Morehouse’s"],["679012011916492800","Badfish"],["679423513769111552","Ramrod"],["679424003198238720","A new dawn rising"],["679424354223738880","Still Renovating"],["679425819310903296","Excessive Celebration"],["679818637024010240","DetroitDumpsterFire"],["684465506765316096","SaquonMyPickens"]].map(function(a){return{uid:a[0],team:a[1],av:''}});
var TEAMS=LS.get('lj:teams',null)||FALLBACK,ME=null;
function me(){var u=LS.get('lj:team','');for(var i=0;i<TEAMS.length;i++)if(TEAMS[i].uid===u)return TEAMS[i];return null}
function loadTeams(){var j=function(p){return fetch('https://api.sleeper.app/v1/league/'+LEAGUE+'/'+p).then(function(r){if(!r.ok)throw 0;return r.json()})};
  Promise.all([j('users'),j('rosters')]).then(function(a){var U={};a[0].forEach(function(u){U[u.user_id]=u});
    var out=a[1].filter(function(r){return r.owner_id&&U[r.owner_id]}).map(function(r){var u=U[r.owner_id];
      return{uid:String(r.owner_id),team:cleanName(u.metadata&&u.metadata.team_name)||u.display_name||('Team '+r.roster_id),av:/^[a-f0-9]{1,40}$/.test(u.avatar||'')?u.avatar:''}});
    if(out.length>=4){out.sort(function(x,y){return x.team.toLowerCase()<y.team.toLowerCase()?-1:1});TEAMS=out;LS.set('lj:teams',out);renderWho();if(BD)renderBoards(BD)}}).catch(function(){})}
var avById=function(uid,av){if(!av)for(var i=0;i<TEAMS.length;i++)if(TEAMS[i].uid===uid)av=TEAMS[i].av;return av};
function avatar(name,av){var ini=esc((name||'?').replace(/[^A-Za-z0-9 ]/g,'').split(' ').filter(Boolean).slice(0,2).map(function(w){return w[0]}).join('').toUpperCase()||'?');
  return av?'<span class="av"><img class="av" src="https://sleepercdn.com/avatars/thumbs/'+esc(av)+'" alt="" onerror="this.parentNode.textContent=\''+ini+'\'"></span>':'<span class="av">'+ini+'</span>'}
function renderWho(){ME=me();$('whoName').textContent=ME?ME.team:'Pick your team';$('whoAv').outerHTML=ME?avatar(ME.team,ME.av).replace('class="av"','class="av" id="whoAv"'):'<span class="av" id="whoAv">?</span>';$('best').textContent=LS.get('lj:best',0)}
function openTeams(){$('teams').innerHTML=TEAMS.map(function(t){return'<button data-uid="'+esc(t.uid)+'" class="'+(ME&&ME.uid===t.uid?'me':'')+'">'+avatar(t.team,t.av)+'<span>'+esc(t.team)+'</span></button>'}).join('');scr('s-team')}
$('teams').addEventListener('click',function(e){var b=e.target.closest('button');if(!b)return;LS.set('lj:team',b.getAttribute('data-uid'));renderWho();scr('s-title');loadBoard()});
// ---------------- audio: WebAudio for SFX + decoded mp3 voice clips ----------------
var AC=null,MASTER=null,VOI={},VBUF={},vNow=null,vPri=0,MUTE=LS.get('lj:mute',false);
fetch('vo/index.json').then(function(r){return r.json()}).then(function(j){VOI=j.keys||{};if(AC)preload()}).catch(function(){});
function unlock(){if(AC){if(AC.state==='suspended')AC.resume();return}var C=window.AudioContext||window.webkitAudioContext;if(!C)return;
  AC=new C();MASTER=AC.createGain();MASTER.gain.value=MUTE?0:1;MASTER.connect(AC.destination);
  var b=AC.createBuffer(1,1,22050),s=AC.createBufferSource();s.buffer=b;s.connect(MASTER);s.start(0);preload()}
var loading=0;function preload(){if(loading)return;var ks=Object.keys(VOI);if(!ks.length)return;loading=1;
  ks.forEach(function(t){fetch('vo/'+VOI[t]).then(function(r){if(!r.ok)throw 0;return r.arrayBuffer()}).then(function(ab){return new Promise(function(res,rej){AC.decodeAudioData(ab,res,rej)})}).then(function(b){VBUF[t]=b}).catch(function(){})})}
var VOLOG=window.__ljvo=[];
function say(arr,pri){if(!AC)return'';var opts=arr.filter(function(t){return VBUF[t]});var t=(opts.length?opts:arr)[Math.random()*(opts.length||arr.length)|0];
  if(vNow&&pri<=vPri)return'';var b=VBUF[t];if(!b)return'';
  if(vNow){try{vNow.stop()}catch(e){}}var s=AC.createBufferSource(),g=AC.createGain();g.gain.value=1.1;s.buffer=b;s.connect(g);g.connect(MASTER);s.start();vNow=s;vPri=pri;VOLOG.push(t);
  s.onended=function(){if(vNow===s){vNow=null;vPri=0}};return t}
function tone(f,d,type,v,f2){if(!AC)return;var o=AC.createOscillator(),g=AC.createGain(),n=AC.currentTime;o.type=type||'square';o.frequency.setValueAtTime(f,n);if(f2)o.frequency.exponentialRampToValueAtTime(f2,n+d);
  g.gain.setValueAtTime(v||.12,n);g.gain.exponentialRampToValueAtTime(.001,n+d);o.connect(g);g.connect(MASTER);o.start(n);o.stop(n+d+.02)}
var SFX={jump:function(){tone(420,.14,'square',.08,880)},slide:function(){tone(300,.12,'sawtooth',.05,140)},ding:function(){tone(1320,.08,'triangle',.1);setTimeout(function(){tone(1760,.1,'triangle',.08)},50)},
  cash:function(){tone(660,.07,'square',.09);setTimeout(function(){tone(990,.07,'square',.09)},70);setTimeout(function(){tone(1480,.15,'square',.08)},140)},
  hit:function(){tone(160,.3,'sawtooth',.2,50)},over:function(){tone(400,.25,'square',.12,200);setTimeout(function(){tone(250,.5,'square',.12,80)},250)},pose:function(){[1047,1319,1568,2093].forEach(function(f,i){setTimeout(function(){tone(f,.12,'triangle',.07)},i*60)})}};
$('mute').addEventListener('click',function(){MUTE=!MUTE;LS.set('lj:mute',MUTE);this.textContent=MUTE?'🔇':'🔊';if(MASTER)MASTER.gain.value=MUTE?0:1});$('mute').textContent=MUTE?'🔇':'🔊';
// ---------------- canvas + world ----------------
var cv=$('cv'),cx=cv.getContext('2d'),DPR=1,VH=360,VW=640,K=1,GY=300;
function size(){DPR=Math.min(window.devicePixelRatio||1,2);var w=innerWidth,h=innerHeight;cv.width=w*DPR|0;cv.height=h*DPR|0;K=h*DPR/VH;VW=w*DPR/K}
addEventListener('resize',size);size();
var ST='title',G=null,LAST=null,overAt=0;
function newGame(){return{t:0,d:0,sp:320,y:0,vy:0,air:false,slide:false,slideT:0,buf:-1,hp:3,inv:0,ob:[],co:[],pa:[],next:500,g:0,b:0,pose:0,nextPose:20,mile:1000,score:0,shake:0}}
var JX=function(){return VW*.2};
function jump(){if(!G)return;if(!G.air){G.vy=-780;G.air=true;G.slide=false;SFX.jump()}else G.buf=.14}
function slideOn(){if(G&&!G.air&&!G.slide){G.slide=true;SFX.slide()}else if(G&&G.air)G.vy=Math.max(G.vy,600)}
function slideOff(){if(G)G.slide=false}
// spawn: ground obstacles (jump) vs high flyers (slide), glitter rows, money bags
function spawn(){var x=VW+60,r=Math.random(),lvl=Math.min(1,G.t/60);
  var type=r<.3?'ir':r<.52?'shoey':r<.78?'sub':'gavel';
  var o={type:type,x:x,ph:Math.random()*6};
  if(type==='ir'){o.w=34;o.h=62;o.y=GY-62}else if(type==='shoey'){o.w=34;o.h=30;o.y=GY-30}else{o.w=type==='sub'?36:34;o.h=24;o.y=GY-86+(Math.random()*8|0);o.vx=type==='sub'?80+lvl*120:40}
  G.ob.push(o);
  if(Math.random()<.6){var high=type==='ir'||type==='shoey';for(var i=0;i<3;i++)G.co.push({k:'g',x:x+(high?-40+i*40:120+i*34),y:high?GY-130-(i==1?18:0):GY-28})}
  if(Math.random()<.16)G.co.push({k:'b',x:x+220,y:GY-150});
  G.next=G.sp*.72+170+Math.random()*(330-lvl*120)}
function hitbox(){var h=G.slide&&!G.air?34:68,w=G.slide&&!G.air?44:26;return{x:JX()-w/2,y:GY-G.y-h,w:w,h:h}}
function ov(a,b){return a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y}
function burst(x,y,n,cols){for(var i=0;i<n;i++)G.pa.push({x:x,y:y,vx:(Math.random()-.5)*420,vy:-Math.random()*380,l:.6+Math.random()*.5,c:cols[i%cols.length],s:2+Math.random()*3})}
var RB=['#ff2d95','#ff9a1f','#ffe46b','#4dff88','#3ab4ff','#b56bff'];
function step(dt){var g=G;g.t+=dt;g.sp=Math.min(900,320+g.t*9);var dx=g.sp*dt;g.d+=dx;
  g.score=Math.floor(g.d/10)+g.g*5+g.b*25;
  if(g.air){g.vy+=2300*dt;g.y-=g.vy*dt;if(g.y<=0){g.y=0;g.vy=0;g.air=false;if(g.buf>0){g.buf=-1;jump()}else if(HOLD)g.slide=true}}
  if(g.buf>0)g.buf-=dt;if(g.inv>0)g.inv-=dt;if(g.pose>0)g.pose-=dt;if(g.shake>0)g.shake-=dt;
  g.next-=dx;if(g.next<=0)spawn();
  var hb=hitbox();
  for(var i=g.ob.length-1;i>=0;i--){var o=g.ob[i];o.x-=dx+(o.vx||0)*dt;o.ph+=dt*8;if(o.x<-80){g.ob.splice(i,1);continue}
    if(!o.hit&&g.inv<=0&&ov(hb,{x:o.x-o.w/2+4,y:o.y+3,w:o.w-8,h:o.h-6})){o.hit=1;g.hp--;g.inv=1.3;g.shake=.3;SFX.hit();flash();burst(JX(),GY-g.y-40,14,['#fff','#ff2d95']);
      window.__ljhits=(window.__ljhits||0)+1;
      if(g.hp<=0){gameOver();return}say(o.type==='shoey'?L.hit.filter(function(t){return/Shoebeer|soaked/.test(t)}).concat(L.hit):L.hit,2)}}
  for(i=g.co.length-1;i>=0;i--){var c=g.co[i];c.x-=dx;if(c.x<-40){g.co.splice(i,1);continue}
    if(ov(hb,{x:c.x-12,y:c.y-12,w:24,h:24})){g.co.splice(i,1);if(c.k==='g'){g.g++;SFX.ding();burst(c.x,c.y,5,RB)}else{g.b++;SFX.cash();burst(c.x,c.y,12,['#4dff88','#ffe46b'])}}}
  for(i=g.pa.length-1;i>=0;i--){var p=g.pa[i];p.l-=dt;p.x+=p.vx*dt-dx*.3;p.y+=p.vy*dt;p.vy+=900*dt;if(p.l<=0)g.pa.splice(i,1)}
  if(g.t>=g.nextPose){g.nextPose=g.t+18+Math.random()*8;g.pose=1.1;SFX.pose();burst(JX(),GY-g.y-60,24,RB);say(L.joe,3)}
  if(g.score>=g.mile){var mi=Math.min(L.mile.length-1,g.mile/1000-1|0);g.mile+=1000;var s=L.mile[mi];if(AC&&VBUF[s]&&!(vNow&&vPri>=3)){if(vNow)try{vNow.stop()}catch(e){}var src=AC.createBufferSource();src.buffer=VBUF[s];src.connect(MASTER);src.start();vNow=src;vPri=2;VOLOG.push(s);src.onended=function(){if(vNow===src){vNow=null;vPri=0}}}}
  if(g.score!==step.ls){step.ls=g.score;$('sc').textContent=g.score}
  $('hp').textContent='💖'.repeat(Math.max(0,g.hp))}
function flash(){var f=$('flash');f.style.opacity=.45;setTimeout(function(){f.style.opacity=0},90)}
// ---------------- drawing ----------------
function R(x,y,w,h,c){cx.fillStyle=c;cx.fillRect(x,y,w,h)}
function C(x,y,r,c){cx.fillStyle=c;cx.beginPath();cx.arc(x,y,r,0,7);cx.fill()}
function bg(scroll){var gr=cx.createLinearGradient(0,0,0,GY);gr.addColorStop(0,'#ff8cc6');gr.addColorStop(.6,'#c86bff');gr.addColorStop(1,'#ffd1ea');cx.fillStyle=gr;cx.fillRect(0,0,VW,GY);
  var rx=VW*.72-(scroll*.03)%(VW+600);if(rx<-300)rx+=VW+600;cx.lineWidth=9;RB.forEach(function(c,i){cx.strokeStyle=c;cx.beginPath();cx.arc(rx,GY-40,190-i*9,Math.PI,0);cx.stroke()});
  // courthouse: pediment + columns parallax
  var off=(scroll*.25)%260;for(var x=-off;x<VW+260;x+=260){R(x,70,240,14,'#f5e9f2');cx.fillStyle='#f5e9f2';cx.beginPath();cx.moveTo(x-6,70);cx.lineTo(x+120,30);cx.lineTo(x+246,70);cx.fill();
    for(var c=0;c<4;c++){R(x+14+c*60,84,24,GY-104,'#fbf3f8');R(x+18+c*60,84,4,GY-104,'#e6cfe0');R(x+10+c*60,GY-24,32,8,'#e6cfe0')}}
  // steps / marble floor
  R(0,GY-20,VW,6,'#e8c6dc');R(0,GY,VW,VH-GY,'#f7d6ea');var o2=scroll%80;for(x=-o2;x<VW;x+=80){R(x,GY,3,VH-GY,'#e5b5d3');R(x+30,GY+22,40,3,'#ffffff88')}
  R(0,GY,VW,4,'#d48fbf');
  for(var i=0;i<26;i++){var sx=(i*137-scroll*(.1+(i%3)*.05))%VW;if(sx<0)sx+=VW;var sy=(i*53)%(GY-40)+10,tw=(Math.sin(Date.now()/200+i)+1)/2;cx.globalAlpha=.4+tw*.6;star(sx,sy,2+tw*2,'#fff');cx.globalAlpha=1}}
function star(x,y,r,c){cx.fillStyle=c;cx.beginPath();for(var i=0;i<8;i++){var a=i*Math.PI/4,rr=i%2?r*.35:r;cx.lineTo(x+Math.cos(a)*rr,y+Math.sin(a)*rr)}cx.fill()}
function joe(x,feet,t,slide,pose,inv){if(inv>0&&(inv*14|0)%2)return;cx.save();cx.translate(x,feet);
  if(slide){cx.rotate(-.12);// sliding: low, legs out
    R(-30,-14,26,6,'#ff5fae');R(-36,-10,8,8,'#c2005e');R(-6,-34,30,22,'#ff2d95');R(-4,-30,26,3,'#fff');C(30,-30,10,'#f1c27d');R(22,-42,18,6,'#ff9ad0');
    R(-14,-26,22,14,'#8b4a2b');C(-8,-30,5,'#d9a066');C(-11,-34,2.5,'#d9a066');C(-5,-34,2.5,'#d9a066');cx.restore();return}
  var w=Math.sin(t*16)*(feet<GY?0:1),pz=pose>0;
  // legs + stilettos
  cx.fillStyle='#ff5fae';cx.save();cx.translate(-5,-30);cx.rotate(w*.5);R(-3,0,7,26,'#ff5fae');R(-4,24,12,4,'#c2005e');R(-4,24,2,8,'#c2005e');cx.restore();
  cx.save();cx.translate(5,-30);cx.rotate(-w*.5);R(-3,0,7,26,'#ff5fae');R(-4,24,12,4,'#c2005e');R(-4,24,2,8,'#c2005e');cx.restore();
  // suit
  R(-12,-62,24,34,'#ff2d95');cx.fillStyle='#fff';cx.beginPath();cx.moveTo(-4,-62);cx.lineTo(0,-50);cx.lineTo(4,-62);cx.fill();R(-12,-34,24,4,'#c2005e');
  // arms + briefcase with chihuahua
  if(pz){R(10,-80,6,22,'#ff2d95');C(13,-82,4,'#f1c27d');R(-26,-58,16,6,'#ff2d95')}else{cx.save();cx.translate(10,-58);cx.rotate(-w*.4);R(0,0,6,20,'#ff2d95');cx.restore()}
  var bx=pz?-38:12,by=pz?-62:-40;R(bx,by,22,15,'#8b4a2b');R(bx+8,by-4,6,4,'#5a2d17');C(bx+8,by-3,6,'#d9a066');C(bx+4,by-9,3,'#d9a066');C(bx+12,by-9,3,'#d9a066');C(bx+6,by-3,1.2,'#000');C(bx+10,by-3,1.2,'#000');
  // head: sunglasses + pink hat, big grin
  C(0,-72,11,'#f1c27d');R(-8,-76,16,5,'#222');R(-14,-84,28,4,'#ff9ad0');R(-8,-94,16,11,'#ff9ad0');R(-8,-87,16,3,'#ff2d95');cx.strokeStyle='#7a2a10';cx.lineWidth=2;cx.beginPath();cx.arc(0,-68,5,.2,2.9);cx.stroke();
  if(pz){star(-20,-96,7,'#ffe46b');star(22,-100,5,'#fff');star(-30,-70,4,'#4dff88')}
  cx.restore()}
function obst(o){var x=o.x,y=o.y;cx.save();
  if(o.type==='ir'){// cartoon injured player: helmet, jersey, crutch, walking boot, red IR tag
    cx.translate(x,y);var b=Math.sin(o.ph)*2;R(-14,-0+b,4,60,'#9aa');R(-18,6+b,10,3,'#9aa');C(2,10+b,11,'#3ab4ff');R(-2,6+b,14,4,'#ddd');R(-10,20+b,22,22,'#3ab4ff');cx.fillStyle='#fff';cx.font='bold 12px Arial';cx.fillText('00',-6,36+b);
    R(-8,42,7,18,'#fff');R(4,42,10,18,'#333');R(2,54,16,6,'#222');R(16,18+b,16,11,'#e00');cx.fillStyle='#fff';cx.font='bold 9px Arial';cx.fillText('IR',19,27+b);cx.restore();return}
  if(o.type==='shoey'){cx.translate(x,y);R(-16,10,32,18,'#fff');R(-16,24,34,6,'#bbb');R(8,4,10,10,'#fff');R(-12,4,22,8,'#f2c14e');for(var i=0;i<4;i++)C(-10+i*7,4-Math.abs(Math.sin(o.ph+i))*3,4,'#fffbe6');R(-16,16,32,2,'#ff2d95');cx.restore();return}
  if(o.type==='sub'){cx.translate(x,y+12+Math.sin(o.ph)*4);cx.rotate(Math.sin(o.ph*.7)*.2);R(-18,-12,36,24,'#fff');R(-18,-12,36,5,'#e33');for(i=0;i<3;i++)R(-13,-3+i*5,26,2,'#99a');C(10,7,4,'#e33');cx.restore();return}
  cx.translate(x,y+12);cx.rotate(o.ph);R(-4,-2,26,6,'#8b4a2b');R(-16,-10,16,20,'#6b3518');R(-18,-6,20,3,'#d4a017');cx.restore()}
function coin(c,t){if(c.k==='g'){var s=7+Math.sin(t*8+c.x)*2;star(c.x,c.y,s+3,'#fff');star(c.x,c.y,s,RB[(c.x/30|0)%6])}else{C(c.x,c.y+4,13,'#4dbf6a');R(c.x-5,c.y-12,10,6,'#3a9a52');cx.fillStyle='#fff';cx.font='bold 15px Arial';cx.textAlign='center';cx.fillText('$',c.x,c.y+9);cx.textAlign='left'}}
var DEMO=0;
function draw(){var g=G,scroll=g?g.d:DEMO;cx.setTransform(K,0,0,K,0,0);if(g&&g.shake>0)cx.translate((Math.random()-.5)*10,(Math.random()-.5)*6);bg(scroll);
  if(g){g.co.forEach(function(c){coin(c,g.t)});g.ob.forEach(obst);joe(JX(),GY-g.y,g.t,g.slide&&!g.air,g.pose,g.inv);g.pa.forEach(function(p){cx.globalAlpha=Math.max(0,p.l);star(p.x,p.y,p.s,p.c)});cx.globalAlpha=1}
  else joe(VW*.5,GY,DEMO/300,false,Math.sin(DEMO/400)>.6?1:0,0)}
var lastT=0;function loop(ts){var dt=Math.min(.05,(ts-lastT)/1000||0);lastT=ts;if(ST==='run'&&G)step(dt);else DEMO+=dt*220;draw();requestAnimationFrame(loop)}requestAnimationFrame(loop);
// ---------------- screens ----------------
function scr(id){['s-title','s-over','s-team'].forEach(function(s){$(s).style.display=s===id?'block':'none'});var run=!id;$('hud').style.display=run?'flex':'none';$('ctl').style.display=run?'flex':'none'}
function start(){unlock();if(!ME){openTeams();return}G=newGame();ST='run';scr(null);HOLD=false;window.__ljhits=0;setTimeout(function(){say(L.start,1)},150)}
function gameOver(){var g=G;ST='over';overAt=Date.now();SFX.over();var best=LS.get('lj:best',0),pb=g.score>best;if(pb)LS.set('lj:best',g.score);
  LAST={v:1,id:rid(),dev:DEV,uid:ME.uid,n:cleanName(ME.team),av:ME.av||'',s:g.score,t:Math.round(g.t*1000),g:g.g,b:g.b};window.__ljlast=LAST;
  setTimeout(function(){say(pb&&best>0?L.best:L.over,5)},350);
  $('oScore').textContent=g.score;$('oStats').textContent='✨ '+g.g+'  💰 '+g.b+'  ⏱ '+g.t.toFixed(1)+'s  🏆 '+Math.max(best,g.score)+(pb?'  NEW BEST':'');
  $('oRank').textContent='Filing with the clerk…';scr('s-over');submit(LAST)}
// ---------------- leaderboard (legally-scores worker; offline queue) ----------------
function post(e){return fetch(API+'/scores?board='+BOARD,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(e)}).then(function(x){return x.json().then(function(j){j.status=x.status;return j})})}
function queue(e){var q=LS.get('lj:pend',[]);if(!q.some(function(x){return x.id===e.id}))q.push(e);LS.set('lj:pend',q.slice(-8))}
function submit(e){if(!navigator.onLine){queue(e);$('oRank').textContent='📴 Offline. Saved, will post when you\'re back.';renderBoards(BD);return}
  post(e).then(function(j){if(!j.ok){if(j.status===429){queue(e);$('oRank').textContent='Clerk is swamped. Queued, will post shortly.'}else $('oRank').textContent='The court rejected that score.';return renderBoards(j.top?j:BD)}
    $('oRank').innerHTML=j.rank===1?'👑 <b>#1 IN THE LEAGUE</b>':j.rank>0&&j.rank<=10?'🏛️ <b>TOP 10!</b> #'+j.rank:j.rank>0?'#'+j.rank+' all-time · your team is #'+j.teamPlace:'Not even close to the board.';renderBoards(j)})
  .catch(function(){queue(e);$('oRank').textContent='📴 Board offline. Saved, will post later.';$('lbOver').innerHTML='<div class="hint">Leaderboard is napping.</div>'})}
var flushing=false;function flushPending(){if(flushing||!navigator.onLine)return;var q=LS.get('lj:pend',[]);if(!q.length)return;flushing=true;var e=q[0];
  post(e).then(function(j){if(j.status===429){flushing=false;setTimeout(flushPending,5000);return}LS.set('lj:pend',LS.get('lj:pend',[]).filter(function(x){return x.id!==e.id}));flushing=false;if(j.top)renderBoards(j);setTimeout(flushPending,4500)}).catch(function(){flushing=false})}
addEventListener('online',function(){flushPending();loadBoard()});
var BD=null;
function list(top,hlId){if(!top||!top.length)return'<div class="hint">Nobody on the board yet. Go set the score to beat.</div>';var seen={};
  return'<ol class="lb">'+top.slice(0,10).map(function(x,i){var tb=!seen[x.uid];seen[x.uid]=1;var m=hlId?x.id===hlId:(ME&&tb&&x.uid===ME.uid);
    return'<li class="'+(tb?'tb ':'')+(m?'me':'')+'"><span class="r">'+(i+1)+'</span>'+avatar(x.n,avById(x.uid,x.av))+'<span class="n">'+esc(x.n)+'</span><span class="s">'+x.s+'</span></li>'}).join('')+'</ol>'}
function myLine(j){if(!ME||!j||!j.teams)return'';var p=-1;for(var i=0;i<j.teams.length;i++)if(j.teams[i].uid===ME.uid)p=i;var pend=LS.get('lj:pend',[]).length;
  return'<div class="hint">'+(p>=0?'Your team: <b>#'+(p+1)+'</b> of '+j.teams.length+' teams · best '+j.teams[p].s:'Your team isn\'t on the board yet.')+(pend?' · 📴 '+pend+' queued':'')+'</div>'}
function renderBoards(j){if(!j){var h='<div class="hint">Leaderboard is napping.</div>';$('lbTitle').innerHTML=h;$('lbOver').innerHTML=h;return}BD=j;
  $('lbTitle').innerHTML=list(j.top)+myLine(j);$('lbOver').innerHTML=list(j.top,ST==='over'&&LAST&&LAST.id)+myLine(j)}
function loadBoard(){return fetch(API+'/scores?board='+BOARD+'&limit=10'+(ME?'&uid='+ME.uid:'')).then(function(r){return r.json()}).then(renderBoards).catch(function(){var h='<div class="hint">Leaderboard is napping. Try again in a bit.</div>';$('lbTitle').innerHTML=h;$('lbOver').innerHTML=h})}
// ---------------- input: one screen-wide touchstart handler (no overlay can eat taps) ----------------
var HOLD=false,holdId=null;
function down(x){if(ST!=='run')return false;unlock();if(x<innerWidth*.4){HOLD=true;slideOn()}else jump();return true}
function up(){HOLD=false;holdId=null;slideOff()}
addEventListener('touchstart',function(e){unlock();if(ST!=='run')return;if(e.target.closest&&e.target.closest('#mute'))return;e.preventDefault();
  for(var i=0;i<e.changedTouches.length;i++){var t=e.changedTouches[i];if(t.clientX<innerWidth*.4)holdId=t.identifier;down(t.clientX)}},{passive:false,capture:true});
addEventListener('touchend',function(e){for(var i=0;i<e.changedTouches.length;i++)if(e.changedTouches[i].identifier===holdId)up()},{passive:true,capture:true});
addEventListener('touchcancel',up,{passive:true});
var lastTouch=0;addEventListener('touchstart',function(){lastTouch=Date.now()},{passive:true,capture:true});
addEventListener('mousedown',function(e){if(Date.now()-lastTouch<800)return;if(e.target.closest&&e.target.closest('#mute'))return;if(down(e.clientX))e.preventDefault()});addEventListener('mouseup',function(){if(Date.now()-lastTouch>800)up()});
addEventListener('keydown',function(e){if(e.repeat)return;if(ST==='run'){if(/^(ArrowUp|Space|KeyW)$/.test(e.code)){jump();e.preventDefault()}else if(/^(ArrowDown|KeyS)$/.test(e.code)){HOLD=true;slideOn();e.preventDefault()}}
  else if(e.code==='Space'||e.code==='Enter'){if(ST==='over'&&Date.now()-overAt<700)return;e.preventDefault();start()}});
addEventListener('keyup',function(e){if(/^(ArrowDown|KeyS)$/.test(e.code))up()});
function btn(id,fn){$(id).addEventListener('click',function(e){e.preventDefault();unlock();fn()})}
btn('goBtn',start);btn('againBtn',function(){if(Date.now()-overAt<700)return;start()});btn('homeBtn',function(){ST='title';G=null;scr('s-title');renderWho();loadBoard()});
btn('whoBtn',openTeams);btn('teamBack',function(){scr(ST==='over'?'s-over':'s-title')});
document.addEventListener('visibilitychange',function(){if(document.hidden&&ST==='run'){HOLD=false}});
// boot
renderWho();scr('s-title');loadTeams();loadBoard().then(flushPending);
if('serviceWorker'in navigator&&location.protocol==='https:')navigator.serviceWorker.register('sw.js').catch(function(){});
window.__lj={state:function(){return ST},game:function(){return G},jump:jump,teams:function(){return TEAMS},vo:function(){return Object.keys(VBUF).length}};
})();
