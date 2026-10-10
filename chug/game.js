// SHADYNASTY SHOEY CHUG. Plain ES2017 (old iPhone Safari safe: no ?. / ??, no flex gap, no aspect-ratio).
(function(){'use strict';
var LEAGUE='1312055708249767936',JOE_UID='679000405232934912',SITE='https://howibrettyourmother.github.io/shadynasty/chug/';
var QS=location.search,qp=function(k){var m=QS.match(new RegExp('[?&]'+k+'=([^&]+)'));return m?decodeURIComponent(m[1]):''};
var API=(qp('lbapi')||'https://shoey-chug-scores.brettwilson08.workers.dev').replace(/\/$/,''),BOARD=qp('lbboard')==='test'?'test':'main';
var CAP_MS=15000,PEN_MS=1500,LOCK_MS=900,MIN_MS=1500;
var $=function(id){return document.getElementById(id)};
var LS={get:function(k,d){try{var v=localStorage.getItem(k);return v==null?d:JSON.parse(v)}catch(e){return d}},set:function(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};
var esc=function(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})};
var rid=function(){var s='';while(s.length<12)s+=Math.random().toString(36).slice(2);return s.slice(0,12)};
var pick=function(a){return a[Math.floor(Math.random()*a.length)]};
var now=function(){return(window.performance&&performance.now)?performance.now():Date.now()};
var cleanName=function(n){return String(n||'').replace(/[\u0000-\u001f\u007f<>"`\\]/g,'').replace(/\s+/g,' ').trim().slice(0,32)};
var DEV=LS.get('sc:dev','');if(!/^[a-z0-9]{8,16}$/.test(DEV)){DEV=rid();LS.set('sc:dev',DEV)}
function setVh(){document.documentElement.style.setProperty('--vh',(window.innerHeight*0.01)+'px');sizeCanvases()}
// ---------------- teams (live from Sleeper, cached; fallback snapshot) ----------------
var FALLBACK=[["559056589221363712","Tet McMuffins","moreho15"],["602659459214409728","Bigmike9193","Bigmike9193"],["602988793519214592","TheTunaSquad","TheTunaSquad"],["603082868373135360","Wilson Weasels","howibrettyourmother"],["679000405232934912","Rebuilding Morehouse’s","joebags85"],["679012011916492800","Badfish","ManBearPig1984"],["679423513769111552","Ramrod","Ramrod248"],["679424003198238720","A new dawn rising","BamaGradLeague"],["679424354223738880","Still Renovating","ElJefe1985"],["679425819310903296","Excessive Celebration","AdamDenver"],["679818637024010240","DetroitDumpsterFire","DetroitDumpsterFires"],["684465506765316096","SaquonMyPickens","MyChubbHurts21"]].map(function(a){return{uid:a[0],team:a[1],owner:a[2]}});
var TEAMS=LS.get('sc:teams',null)||FALLBACK;
var isJoe=function(t){return !!t&&(t.uid===JOE_UID||/^joebags85$/i.test(t.owner||''))};
function loadTeams(){
  var j=function(p){return fetch('https://api.sleeper.app/v1/league/'+LEAGUE+'/'+p).then(function(r){if(!r.ok)throw 0;return r.json()})};
  return Promise.all([j('users'),j('rosters')]).then(function(a){
    var U={};a[0].forEach(function(u){U[u.user_id]=u});
    var out=a[1].filter(function(r){return r.owner_id&&U[r.owner_id]}).map(function(r){var u=U[r.owner_id];
      return{uid:String(r.owner_id),team:cleanName(u.metadata&&u.metadata.team_name)||u.display_name||('Team '+r.roster_id),owner:u.display_name||u.username||''}});
    if(out.length>=4){out.sort(function(x,y){return x.team.toLowerCase()<y.team.toLowerCase()?-1:1});TEAMS=out;LS.set('sc:teams',out);renderWho()}
  }).catch(function(){});
}
var ME=null;function me(){var u=LS.get('sc:team','');for(var i=0;i<TEAMS.length;i++)if(TEAMS[i].uid===u)return TEAMS[i];return null}
var stiletto=function(){return !!ME&&(isJoe(ME)||!!LS.get('sc:stl',false))};
function renderWho(){ME=me();$('whoName').textContent=ME?ME.team:'Pick your team';
  var j=isJoe(ME);$('stlWrap').style.display=j||!ME?'none':'flex';$('joeNote').style.display=j?'block':'none';$('stlBox').checked=!!LS.get('sc:stl',false);
  $('heroImg').src=stiletto()?'img/stiletto.webp':'img/shoe.webp';$('goBtn').textContent=ME?'🍺 SHOEY UP':'PICK YOUR TEAM'}
function openTeams(){var h=TEAMS.map(function(t){return'<button data-uid="'+esc(t.uid)+'" class="'+(ME&&ME.uid===t.uid?'me':'')+'">'+esc(t.team)+'<small>@'+esc(t.owner)+'</small></button>'}).join('');
  $('teams').innerHTML=h||'<div class="hint">No teams loaded.</div>';show('teamSheet')}
// ---------------- audio (WebAudio, synthesized; created on the first tap only) ----------------
var AC=null,MASTER=null,NOISE=null,lastGlug=0;
function audioUnlock(){try{
  if(!AC){var C=window.AudioContext||window.webkitAudioContext;if(!C)return;AC=new C();
    var comp=AC.createDynamicsCompressor();MASTER=AC.createGain();MASTER.gain.value=0.7;MASTER.connect(comp);comp.connect(AC.destination);
    var len=AC.sampleRate*2|0;NOISE=AC.createBuffer(1,len,AC.sampleRate);var d=NOISE.getChannelData(0);for(var i=0;i<len;i++)d[i]=Math.random()*2-1;
    var b=AC.createBuffer(1,1,22050),s=AC.createBufferSource();s.buffer=b;s.connect(AC.destination);s.start(0)}   // iOS unlock blip
  if(AC.state==='suspended'&&AC.resume)AC.resume()}catch(e){AC=null}}
function env(g,t,a,peak,hold,rel){g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(peak,t+a);g.gain.setValueAtTime(peak,t+a+hold);g.gain.exponentialRampToValueAtTime(0.0001,t+a+hold+rel)}
function osc(type,f,t,dur,peak,f2,dest){var o=AC.createOscillator(),g=AC.createGain();o.type=type;o.frequency.setValueAtTime(f,t);if(f2)o.frequency.exponentialRampToValueAtTime(f2,t+dur);env(g,t,0.01,peak,dur*0.3,dur*0.7);o.connect(g);g.connect(dest||MASTER);o.start(t);o.stop(t+dur+0.05);return o}
function noise(t,dur,peak,ftype,f,f2,q,a){var s=AC.createBufferSource(),fl=AC.createBiquadFilter(),g=AC.createGain();s.buffer=NOISE;s.loop=true;fl.type=ftype;fl.frequency.setValueAtTime(f,t);if(f2)fl.frequency.exponentialRampToValueAtTime(f2,t+dur);fl.Q.value=q||1;env(g,t,a||0.01,peak,dur*0.2,dur*0.8);s.connect(fl);fl.connect(g);g.connect(MASTER);s.start(t,Math.random());s.stop(t+dur+0.1)}
var SFX={
  glug:function(){if(!AC)return;var t=AC.currentTime;if(t-lastGlug<0.045)return;lastGlug=t;var f=150+Math.random()*90;osc('sine',f,t,0.11,0.5,f*0.45);noise(t,0.07,0.12,'bandpass',500+Math.random()*300,250,4)},
  burp:function(size){if(!AC)return;var t=AC.currentTime+0.02,dur=0.25+size*0.9,f=95-size*30+Math.random()*15;
    var o=AC.createOscillator(),g=AC.createGain(),lp=AC.createBiquadFilter(),am=AC.createOscillator(),amg=AC.createGain();
    o.type='sawtooth';o.frequency.setValueAtTime(f*1.25,t);o.frequency.exponentialRampToValueAtTime(f,t+0.08);o.frequency.exponentialRampToValueAtTime(f*0.8,t+dur);
    lp.type='lowpass';lp.frequency.setValueAtTime(900,t);lp.frequency.exponentialRampToValueAtTime(380,t+dur);lp.Q.value=6;
    am.frequency.value=22+Math.random()*14;amg.gain.value=0.5;am.connect(amg);amg.connect(g.gain);
    env(g,t,0.03,0.55+size*0.3,dur*0.55,dur*0.45);o.connect(lp);lp.connect(g);g.connect(MASTER);o.start(t);am.start(t);o.stop(t+dur+0.1);am.stop(t+dur+0.1)},
  crowd:function(level,dur){if(!AC)return;var t=AC.currentTime;dur=dur||1.6;noise(t,dur,0.18*level,'bandpass',1000,1400,0.6,0.25);noise(t,dur,0.1*level,'lowpass',600,500,0.7,0.3);
    for(var i=0;i<4;i++){var s=t+Math.random()*dur*0.6,f=500+Math.random()*500;osc('triangle',f,s,0.35,0.05*level,f*1.6)}},
  boo:function(dur){if(!AC)return;var t=AC.currentTime;dur=dur||1.4;var lp=AC.createBiquadFilter();lp.type='lowpass';lp.frequency.value=480;lp.connect(MASTER);
    for(var i=0;i<6;i++){var f=120+Math.random()*60,o=AC.createOscillator(),g=AC.createGain();o.type='sawtooth';o.frequency.setValueAtTime(f*1.1,t);o.frequency.linearRampToValueAtTime(f,t+dur);
      var s=t+Math.random()*0.15;g.gain.setValueAtTime(0.0001,s);g.gain.exponentialRampToValueAtTime(0.06,s+0.3);g.gain.exponentialRampToValueAtTime(0.0001,s+dur);o.connect(g);g.connect(lp);o.start(s);o.stop(s+dur+0.05)}
    noise(t,dur,0.05,'bandpass',300,250,1,0.3)},
  splat:function(){if(!AC)return;var t=AC.currentTime;noise(t,0.6,0.9,'lowpass',4000,180,0.8,0.005);osc('sine',110,t,0.35,0.9,35);noise(t+0.08,0.5,0.35,'bandpass',900,300,2,0.01);
    setTimeout(function(){SFX.burp(0.15)},380)},
  beep:function(f,d){if(!AC)return;osc('square',f,AC.currentTime,d||0.12,0.18)},
  horn:function(){if(!AC)return;var t=AC.currentTime;[0,0.35,0.7].forEach(function(o,i){[349,440,523].forEach(function(f){osc('sawtooth',f,t+o,i===2?0.8:0.25,0.08)})})}
};
// ---------------- screens / sheets ----------------
var CUR='title';
function scr(id){['title','game','end'].forEach(function(s){$(s).classList.toggle('on',s===id)});CUR=id}
function show(id){$(id).classList.add('on')}function hide(id){$(id).classList.remove('on')}
function toast(m){var t=$('toast');t.textContent=m;t.classList.add('on');clearTimeout(toast.h);toast.h=setTimeout(function(){t.classList.remove('on')},2400)}
// ---------------- fx canvas (particles, splats, fireworks) ----------------
var FX=$('fx'),fx=FX.getContext('2d'),G=$('gauge'),gx=G.getContext('2d'),DPR=Math.min(2,window.devicePixelRatio||1),P=[],SPL=[],MAXP=240;
function sizeCanvases(){var w=window.innerWidth,h=window.innerHeight,fd=Math.min(1.5,DPR);FX.width=w*fd|0;FX.height=h*fd|0;fx.setTransform(fd,0,0,fd,0,0);
  var r=$('vessel').getBoundingClientRect();if(r.width){G.width=r.width*DPR|0;G.height=r.height*DPR|0;gx.setTransform(DPR,0,0,DPR,0,0)}}
function part(o){if(P.length>=MAXP)P.shift();P.push(o)}
function foamBurst(x,y,n,spd){for(var i=0;i<n;i++){var a=-Math.PI/2+(Math.random()-0.5)*2.2,v=(1+Math.random()*2)*spd;part({x:x,y:y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,r:2+Math.random()*5,life:0.6+Math.random()*0.5,t:0,c:Math.random()<0.6?'#fff6d8':'#ffc23a',g:500})}}
function word(x,y,s,c){part({x:x,y:y,vx:(Math.random()-0.5)*40,vy:-120,life:0.7,t:0,txt:s,c:c||'#fff',g:0})}
function spewFx(x,y){for(var i=0;i<130;i++){var a=-Math.PI/2+(Math.random()-0.5)*3.4,v=200+Math.random()*700;part({x:x,y:y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,r:3+Math.random()*9,life:1+Math.random()*0.8,t:0,c:pick(['#f7b500','#ffd55a','#fff1c2','#e89a00']),g:900})}
  var w=window.innerWidth,h=window.innerHeight;SPL=[];for(var k=0;k<16;k++)SPL.push({x:Math.random()*w,y:Math.random()*h*0.85,r:25+Math.random()*70,t:0,life:1.8+Math.random()*0.8,dr:20+Math.random()*90})}
function fireworks(){var w=window.innerWidth,h=window.innerHeight;for(var b=0;b<5;b++){(function(b){setTimeout(function(){var x=w*(0.15+Math.random()*0.7),y=h*(0.12+Math.random()*0.3),c=pick(['#ffc72c','#ff4fa8','#7dd3ff','#fff','#9dff6b']);
  for(var i=0;i<46;i++){var a=Math.PI*2*i/46,v=120+Math.random()*160;part({x:x,y:y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,r:2+Math.random()*2.5,life:1.1+Math.random()*0.5,t:0,c:c,g:120})}},b*260)})(b)}}
var shake=0;
function drawFx(dt){var w=window.innerWidth,h=window.innerHeight;fx.clearRect(0,0,w,h);
  for(var k=SPL.length-1;k>=0;k--){var s=SPL[k];s.t+=dt;if(s.t>s.life){SPL.splice(k,1);continue}var a=Math.max(0,1-s.t/s.life)*0.85;fx.globalAlpha=a;fx.fillStyle='#e8a200';
    fx.beginPath();fx.arc(s.x,s.y,s.r,0,6.283);fx.fill();fx.fillRect(s.x-s.r*0.25,s.y,s.r*0.5,s.dr*Math.min(1,s.t*1.5));fx.beginPath();fx.arc(s.x,s.y+s.dr*Math.min(1,s.t*1.5),s.r*0.3,0,6.283);fx.fill();
    fx.fillStyle='rgba(255,250,220,.7)';fx.beginPath();fx.arc(s.x-s.r*0.3,s.y-s.r*0.3,s.r*0.25,0,6.283);fx.fill()}
  for(var i=P.length-1;i>=0;i--){var p=P[i];p.t+=dt;if(p.t>p.life||p.y>h+40){P.splice(i,1);continue}p.vy+=p.g*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;fx.globalAlpha=Math.max(0,1-p.t/p.life);
    if(p.txt){fx.font='28px AntonSC,Impact,sans-serif';fx.textAlign='center';fx.lineWidth=4;fx.strokeStyle='#000';fx.strokeText(p.txt,p.x,p.y);fx.fillStyle=p.c;fx.fillText(p.txt,p.x,p.y)}
    else{fx.fillStyle=p.c;fx.beginPath();fx.arc(p.x,p.y,p.r,0,6.283);fx.fill()}}
  fx.globalAlpha=1}
// ---------------- beer gauge (pulsing beer + foam head + bubbles, drawn over the vessel photo) ----------------
var bub=[];for(var bi=0;bi<14;bi++)bub.push({x:Math.random(),y:Math.random(),s:0.15+Math.random()*0.35,r:1+Math.random()*2.2});
var wob=0,pulse=0;
function drawGauge(t,dt){var r=G.getBoundingClientRect(),w=r.width,h=r.height;if(!w)return;gx.clearRect(0,0,w,h);
  var tw=Math.min(78,w*0.2),tx=w-tw-12,ty=12,th=h-24,lvl=S.beer/100,fh=th*lvl,top=ty+th-fh,sc=1+pulse*0.06;
  gx.save();gx.translate(tx+tw/2,ty+th);gx.scale(sc,sc);gx.translate(-(tx+tw/2),-(ty+th));
  gx.fillStyle='rgba(0,0,0,.45)';rr(gx,tx-4,ty-4,tw+8,th+8,14);gx.fill();
  gx.save();rr(gx,tx,ty,tw,th,11);gx.clip();
  gx.fillStyle='rgba(255,255,255,.06)';gx.fillRect(tx,ty,tw,th);
  if(fh>0.5){var gr=gx.createLinearGradient(tx,0,tx+tw,0);gr.addColorStop(0,'#c77700');gr.addColorStop(0.45,'#ffb21e');gr.addColorStop(1,'#d98300');gx.fillStyle=gr;
    gx.beginPath();gx.moveTo(tx,ty+th);for(var x=0;x<=tw;x+=4)gx.lineTo(tx+x,top+Math.sin(t*0.012+x*0.18)*(1.5+wob*7));gx.lineTo(tx+tw,ty+th);gx.closePath();gx.fill();
    gx.fillStyle='rgba(255,240,190,.7)';for(var i=0;i<bub.length;i++){var b=bub[i];b.y-=b.s*dt*(1+wob*3);if(b.y<0)b.y=1;var by=top+(ty+th-top)*b.y;gx.beginPath();gx.arc(tx+4+b.x*(tw-8),by,b.r,0,6.283);gx.fill()}
    var fhd=5+S.foam*0.32;gx.fillStyle=S.foam>78?'#fffbe9':'#fff1c9';for(var fx2=0;fx2<=tw;fx2+=9){gx.beginPath();gx.arc(tx+fx2,top-fhd*0.4+Math.sin(t*0.02+fx2)*2*(1+wob*2),fhd*0.55+3,0,6.283);gx.fill()}
    gx.fillRect(tx,top-fhd*0.4,tw,fhd*0.6)}
  gx.restore();gx.strokeStyle='rgba(255,255,255,.55)';gx.lineWidth=2;rr(gx,tx,ty,tw,th,11);gx.stroke();
  gx.fillStyle='rgba(255,255,255,.2)';gx.fillRect(tx+6,ty+8,4,th-16);gx.restore();
  wob=Math.max(0,wob-dt*0.004);pulse=Math.max(0,pulse-dt*0.006)}
function rr(c,x,y,w,h,r){c.beginPath();c.moveTo(x+r,y);c.lineTo(x+w-r,y);c.quadraticCurveTo(x+w,y,x+w,y+r);c.lineTo(x+w,y+h-r);c.quadraticCurveTo(x+w,y+h,x+w-r,y+h);c.lineTo(x+r,y+h);c.quadraticCurveTo(x,y+h,x,y+h-r);c.lineTo(x,y+r);c.quadraticCurveTo(x,y,x+r,y);c.closePath()}
// ---------------- reactions ----------------
var IMG={cheer:'img/cheer.webp',laugh:'img/laugh.webp',gross:'img/gross.webp',record:'img/record.webp'},curR='',rFlip=0,lastCrowd=0;
function react(k,cap,cls){if(cap!=null){var c=$('cap');c.textContent=cap;c.className='cap'+(cls?' '+cls:'')}if(k===curR)return;curR=k;var a=$(rFlip?'rA':'rB'),b=$(rFlip?'rB':'rA');rFlip^=1;a.src=IMG[k];a.classList.add('on');b.classList.remove('on');
  var t=now();if(t-lastCrowd>1200&&S.on){lastCrowd=t;if(k==='cheer')SFX.crowd(0.8,1.2);else if(k==='laugh')SFX.boo(1.1)}}
// ---------------- game state ----------------
var S={on:false,beer:100,foam:0,taps:0,spews:0,pen:0,t0:0,lock:0,lastTap:0,spewAt:-9e9,ended:false,phase:'idle'};
function elapsed(){return S.t0?now()-S.t0+S.pen:0}
function startRun(){
  if(!ME){openTeams();return}
  audioUnlock();hideSheets();
  S={on:false,beer:100,foam:0,taps:0,spews:0,pen:0,t0:0,lock:0,lastTap:0,spewAt:-9e9,ended:false,phase:'count'};
  P=[];SPL=[];var st=stiletto();$('vImg').src=st?'img/stiletto.webp':'img/shoe.webp';$('vesselLbl').textContent=st?'👠 Stiletto shoey':'Shoey';$('gTeam').textContent=ME.team;
  $('clock').textContent='0.00';$('clock').className='clock';curR='';react('cheer','GET READY','');$('pad').textContent='GET READY';$('pad').className='pad';
  scr('game');setTimeout(sizeCanvases,30);
  var n=3,c=$('count');c.style.display='block';c.textContent=n;SFX.beep(440);
  var tick=setInterval(function(){n--;if(S.phase!=='count'){clearInterval(tick);c.style.display='none';return}
    if(n>0){c.textContent=n;SFX.beep(440)}else{clearInterval(tick);c.textContent='CHUG!';SFX.beep(880,0.3);S.phase='chug';S.on=true;S.t0=now();$('pad').textContent='MASH! MASH!';react('cheer','CHUG IT!','');setTimeout(function(){c.style.display='none'},450)}},650);
}
function tap(x,y){
  if(S.phase!=='chug'||!S.on)return;var t=now();
  var pad=$('pad');pad.classList.add('hit');setTimeout(function(){pad.classList.remove('hit')},70);
  if(t<S.lock){if(Math.random()<0.3)word(x,y,'GAG!','#9dff6b');return}
  var dtp=t-S.lastTap;S.lastTap=t;S.taps++;
  var drain=Math.max(1,2.9*(1.22-S.foam/120));S.beer=Math.max(0,S.beer-drain);
  S.foam=Math.min(100,S.foam+8+(dtp<85?5:dtp<120?2:0));wob=Math.min(1,wob+0.35);pulse=1;shake=Math.max(shake,1.6);
  SFX.glug();var vr=$('vessel').getBoundingClientRect();foamBurst(vr.right-50,vr.top+vr.height*(1-S.beer/100)+10,4,60);
  if(S.taps%5===0)word(x||vr.left+vr.width/2,(y||vr.top+40)-20,pick(['GLUG','GULP','CHUG','SLURP','GLUG GLUG']),'#ffe07a');
  if(S.beer<=0){finish(false);return}
  if(S.foam>=100)spew();
}
function spew(){var t=now();S.spews++;S.pen+=PEN_MS;S.lock=t+LOCK_MS;S.spewAt=t;S.foam=35;S.beer=Math.min(100,S.beer+6);shake=18;
  var vr=$('vessel').getBoundingClientRect();spewFx(vr.left+vr.width*0.5,vr.top+vr.height*0.35);SFX.splat();
  var f=$('flash');f.style.transition='none';f.style.opacity='.55';setTimeout(function(){f.style.transition='opacity .6s';f.style.opacity='0'},30);
  react('gross','SPEW! +1.5s','gross');$('pad').textContent='GAGGING…';$('pad').className='pad lock';if(navigator.vibrate)try{navigator.vibrate(120)}catch(e){}}
function step(dt){
  if(S.phase==='chug'&&S.on){
    var t=now(),e=elapsed();S.foam=Math.max(0,S.foam-dt*0.044);
    if(t>S.lock&&$('pad').className.indexOf('lock')>=0){$('pad').className='pad';$('pad').textContent='MASH! MASH!'}
    $('clock').textContent=(e/1000).toFixed(2);$('clock').className='clock'+(e>11000?' hot':'');
    var fb=$('foamBar');fb.style.width=S.foam+'%';var m=$('meter');var dz=S.foam>75;if(dz!==m._dz){m._dz=dz;m.className='meter'+(dz?' dz':'');$('foamTxt').textContent=dz?'FOAM! EASE UP!':'FOAM'}
    $('pct').textContent='BEER '+Math.ceil(S.beer)+'%';
    if(t-S.spewAt>1500){var done=1-S.beer/100,proj=done>0.04?e/done:0;
      if(done<0.08)react('cheer',S.taps?'KEEP GOING':'CHUG IT!','');else if(proj<=7000)react('cheer',proj<=5000?'ABSOLUTE ANIMAL':'ON PACE!','');else if(proj<=10000)react('cheer','PICK IT UP','bad');else react('laugh','SLOW AS SHIT','bad')}
    if(e>=CAP_MS)finish(true);
  }
}
// ---------------- loop (guarded: errors never kill it; watchdog restarts a stalled rAF) ----------------
var lastF=0,errs=0,raf=0;
function frame(ts){raf=requestAnimationFrame(frame);var t=now(),dt=Math.min(50,Math.max(0,t-(lastF||t)));lastF=t;
  try{step(dt);
    if(CUR==='game')drawGauge(t,dt);
    if(P.length||SPL.length||frame._dirty){drawFx(dt/1000);frame._dirty=P.length||SPL.length}
    if(shake>0.2){var a=shake;$('stage').style.transform='translate3d('+((Math.random()-0.5)*a).toFixed(1)+'px,'+((Math.random()-0.5)*a).toFixed(1)+'px,0)';shake*=Math.pow(0.86,dt/16)}else if(shake){shake=0;$('stage').style.transform=''}
  }catch(e){if(errs++<5&&window.console)console.warn('frame',e)}}
setInterval(function(){if(now()-lastF>700){try{cancelAnimationFrame(raf)}catch(e){}lastF=now();raf=requestAnimationFrame(frame);if(S.phase==='chug')try{step(16)}catch(e){}}},500);
// ---------------- finish / roast / leaderboard ----------------
var LAST=null;
function roastFor(r){var b=[],st=r.st,j=isJoe(ME),pool;
  if(st){pool=ROAST.J.filter(function(l){return j||!/Joe|rebuild|tank/i.test(l)});if(Math.random()<0.75)b=pool}
  if(!b.length){var o=r.dnf?ROAST.DNF:r.spews&&Math.random()<0.6?ROAST.SPEW:r.ms<6000&&Math.random()<0.5?ROAST.FAST:r.ms>9500&&Math.random()<0.6?ROAST.SLOW:null;b=o||ROAST.G}
  return pick(b).replace(/\{T\}/g,ME.team).replace(/\{t\}/g,(r.ms/1000).toFixed(2)).replace(/\{s\}/g,r.spews)}
function finish(dnf){if(S.ended)return;S.ended=true;S.on=false;S.phase='end';var ms=Math.round(elapsed());if(!dnf)ms=Math.min(ms,CAP_MS);
  var r={ms:dnf?CAP_MS:ms,dnf:dnf,spews:S.spews,taps:S.taps,st:stiletto(),id:rid()};LAST=r;r.roast=roastFor(r);
  var best=LS.get('sc:best:'+ME.uid,0);r.pb=!dnf&&(!best||ms<best);if(r.pb)LS.set('sc:best:'+ME.uid,ms);
  if(!dnf){SFX.burp(Math.min(1,Math.max(0.2,(9000-ms)/6000+0.3)));shake=8}
  setTimeout(function(){showEnd(r);if(!dnf)submit(r)},dnf?200:700)}
function endImg(k){$('endImg').src=IMG[k]}
function showEnd(r){scr('end');$('end').querySelector('.scroll').scrollTop=0;
  $('endLbl').textContent=r.dnf?'DID NOT FINISH':(r.st?'STILETTO SHOEY IN':'FINISHED IN');var tt=$('endTime');tt.textContent=r.dnf?'DNF':(r.ms/1000).toFixed(2)+'s';tt.className='tt'+(r.dnf?' dnf':'');
  var k=r.dnf||r.spews||r.ms>9000?'laugh':'cheer';if(r.pb&&!r.dnf&&LS.get('sc:runs',0)>0)k='record';endImg(k);LS.set('sc:runs',LS.get('sc:runs',0)+1);
  $('endStats').textContent=r.taps+' gulps · '+r.spews+' spew'+(r.spews===1?'':'s')+(r.spews?' (+'+(r.spews*PEN_MS/1000)+'s)':'')+(r.pb?' · PERSONAL BEST':'');
  $('endRank').innerHTML=r.dnf?'<em>15 SECONDS.</em> ONE SHOE. YOU FAILED.':'Checking the board…';
  var rb=$('endRoast');rb.textContent=r.roast;rb.className='roast'+(r.st?' j':'');
  if(r.dnf){SFX.boo(1.8);setTimeout(function(){SFX.burp(0.3)},900);loadBoard()}else if(k==='laugh')setTimeout(function(){SFX.boo(1.4)},500);else setTimeout(function(){SFX.crowd(1,1.8)},400)}
function entry(r){return{v:1,id:r.id,dev:DEV,uid:ME.uid,n:cleanName(ME.team),ms:r.ms,taps:r.taps,sp:r.spews,st:r.st?1:0}}
function post(e){return fetch(API+'/scores?board='+BOARD,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(e)}).then(function(x){return x.json().then(function(j){j.status=x.status;return j})})}
function submit(r){if(r.ms<MIN_MS){$('endRank').innerHTML='Under 1.5s? Nice try. <em>Tossed.</em>';loadBoard();return}
  post(entry(r)).then(function(j){if(!j.ok){$('endRank').textContent=j.status===429?'Slow down, board is rate limited.':'Board said no ('+esc(j.error||'error')+').';return renderBoards(j)}
    r.rank=j.rank;r.teamRank=j.teamRank;var top10=j.rank>0&&j.rank<=10;
    if(top10||(j.rank===1)){endImg('record');fireworks();SFX.horn();setTimeout(function(){SFX.crowd(1.2,2.2)},300)}
    $('endRank').innerHTML=j.rank===1?'<em>#1 FASTEST SHOEY IN THE LEAGUE</em>':top10?'<em>TOP 10!</em> #'+j.rank+' ALL-TIME':j.rank>0?'#'+j.rank+' all-time · #'+j.teamRank+' for your team':'Not even close to the board.';
    renderBoards(j)}).catch(function(){var q=LS.get('sc:pend',[]);q.push(entry(r));LS.set('sc:pend',q.slice(-5));$('endRank').textContent='Board offline. Saved, will post next time.';$('endBoard').innerHTML='<div class="hint">Leaderboard is napping.</div>'})}
function flushPending(){var q=LS.get('sc:pend',[]);if(!q.length)return;LS.set('sc:pend',[]);q.forEach(function(e){post(e).catch(function(){var p=LS.get('sc:pend',[]);p.push(e);LS.set('sc:pend',p.slice(-5))})})}
var BD=null,lbTab='top';
function li(x,i,hl){return'<li class="'+(hl?'me':'')+'"><span class="r">'+(i+1)+'</span><span class="n">'+(x.st?'👠 ':'')+esc(x.n)+(x.sp?'<small>'+x.sp+' spew'+(x.sp>1?'s':'')+'</small>':'')+'</span><span class="t">'+(x.ms/1000).toFixed(2)+'</span></li>'}
function list(a,hlId){if(!a||!a.length)return'<div class="hint">Nobody on the board yet. Go set the time to beat.</div>';return'<ol class="lb">'+a.map(function(x,i){return li(x,i,(hlId&&x.id===hlId)||(!hlId&&ME&&x.uid===ME.uid))}).join('')+'</ol>'}
function renderBoards(j){BD=j;var id=LAST&&LAST.id;$('endBoard').innerHTML=list((j.top||[]).slice(0,10),id);renderLb()}
function renderLb(){var j=BD,b=$('lbBody');if(!j){b.innerHTML='<div class="hint">Loading…</div>';return}var id=LAST&&LAST.id;
  b.innerHTML=lbTab==='top'?list((j.top||[]).slice(0,10),id):lbTab==='teams'?list(j.teams||[]):(ME?list(j.mine||[],id):'<div class="hint">Pick a team first.</div>')}
function loadBoard(){return fetch(API+'/scores?board='+BOARD+'&limit=10'+(ME?'&uid='+ME.uid:'')).then(function(r){return r.json()}).then(renderBoards).catch(function(){$('lbBody').innerHTML='<div class="hint">Leaderboard is napping. Try again in a bit.</div>';$('endBoard').innerHTML='<div class="hint">Leaderboard is napping.</div>'})}
function share(){var r=LAST;if(!r||!ME)return;var t=(r.ms/1000).toFixed(2),line;
  if(r.dnf)line=ME.team+' couldn\'t finish a shoey in 15 seconds. Pathetic. "'+r.roast+'"';
  else if(r.rank&&r.rank<=10)line='🍺👟 '+ME.team+' just slammed a '+(r.st?'STILETTO ':'')+'shoey in '+t+'s. #'+r.rank+' on the SHADYNASTY board. Beat that, you lightweights.';
  else line='🍺 '+ME.team+': '+t+'s'+(r.spews?' and '+r.spews+' spew'+(r.spews>1?'s':''):'')+'. "'+r.roast+'"';
  var txt=line+' '+SITE;
  var ok=function(){toast('Copied. Go paste it in the league chat.')},fb=function(){var a=document.createElement('textarea');a.value=txt;a.setAttribute('readonly','');a.style.position='fixed';a.style.top='0';a.style.opacity='0';document.body.appendChild(a);a.select();a.setSelectionRange(0,txt.length);var good=false;try{good=document.execCommand('copy')}catch(e){}document.body.removeChild(a);good?ok():prompt('Copy this:',txt)};
  if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(txt).then(ok,fb);else fb()}
// ---------------- input ----------------
function hideSheets(){['teamSheet','lbSheet','howSheet'].forEach(hide)}
function onTap(el,fn){el.addEventListener('click',function(e){e.preventDefault();audioUnlock();fn(e)})}
onTap($('goBtn'),startRun);onTap($('againBtn'),startRun);onTap($('whoBtn'),openTeams);
onTap($('lbBtn'),function(){lbTab='top';setTabs();show('lbSheet');loadBoard()});onTap($('endLbBtn'),function(){show('lbSheet');renderLb()});
onTap($('howBtn'),function(){show('howSheet')});onTap($('homeBtn'),function(){scr('title');renderWho()});onTap($('shareBtn'),share);
$('stlBox').addEventListener('change',function(){LS.set('sc:stl',this.checked);renderWho()});
[].forEach.call(document.querySelectorAll('[data-close]'),function(b){onTap(b,hideSheets)});
$('teams').addEventListener('click',function(e){var b=e.target.closest?e.target.closest('button'):null;if(!b||!b.getAttribute('data-uid'))return;LS.set('sc:team',b.getAttribute('data-uid'));hide('teamSheet');renderWho();
  if(isJoe(ME))toast('👠 Rebuilding? Stiletto. League rules.')});
function setTabs(){[].forEach.call($('lbTabs').children,function(b){b.classList.toggle('on',b.getAttribute('data-t')===lbTab)})}
$('lbTabs').addEventListener('click',function(e){var t=e.target.getAttribute('data-t');if(!t)return;lbTab=t;setTabs();renderLb()});
var gm=$('game');
gm.addEventListener('touchstart',function(e){e.preventDefault();audioUnlock();for(var i=0;i<e.changedTouches.length;i++)tap(e.changedTouches[i].clientX,e.changedTouches[i].clientY)},{passive:false});
gm.addEventListener('touchend',function(e){e.preventDefault();if(AC&&AC.state==='suspended')audioUnlock()},{passive:false});
gm.addEventListener('mousedown',function(e){e.preventDefault();tap(e.clientX,e.clientY)});
document.addEventListener('keydown',function(e){if(CUR==='game'&&(e.key===' '||e.key==='Enter')){e.preventDefault();if(!e.repeat)tap(0,0)}});
document.addEventListener('gesturestart',function(e){e.preventDefault()});
document.addEventListener('visibilitychange',function(){if(document.hidden&&S.phase==='chug'&&!S.ended){S.ended=true;S.on=false;S.phase='idle';scr('title');renderWho();setTimeout(function(){toast('Run voided. No tabbing out mid-shoey.')},300)}
  if(!document.hidden&&AC&&AC.state==='suspended')try{AC.resume()}catch(e){}});
window.addEventListener('resize',setVh);window.addEventListener('orientationchange',function(){setTimeout(setVh,250)});
// ---------------- boot ----------------
setVh();renderWho();loadTeams();flushPending();raf=requestAnimationFrame(frame);
setTimeout(function(){['stiletto','cheer','laugh','gross','record'].forEach(function(n){var i=new Image();i.src='img/'+n+'.webp'})},400);
window.__sc={S:function(){return S},tap:tap,spew:spew,state:function(){return CUR},api:API,board:BOARD,last:function(){return LAST},finish:finish};
})();
