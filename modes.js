// SHADYNASTY joke modes. Lazy-loaded by app.js only when a mode is saved or the 🕹️ picker is opened.
// Each mode = a body class (CSS below) + small JS overlays. ES2017, no libraries. Audio only after a user tap.
(function(){'use strict';
var RM=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
var KEY='sn:mode',V=$('#view');if(!$('#mcss')){var lk=document.createElement('link');lk.id='mcss';lk.rel='stylesheet';lk.href='modes.css?v='+(window.MODEV||1);document.head.appendChild(lk)}
function $(s,r){return (r||document).querySelector(s)}function $$(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))}
function el(tag,cls,html){var e=document.createElement(tag);if(cls)e.className=cls;if(html!=null)e.innerHTML=html;return e}
function E(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function pick(a){return a[Math.floor(Math.random()*a.length)]}
function hsh(s){var h=0;s=String(s);for(var i=0;i<s.length;i++)h=(h*31+s.charCodeAt(i))|0;return Math.abs(h)}
// ---------- audio ----------
var AC=null,muted=false;try{muted=localStorage.getItem('sn:mute')==='1'}catch(e){}
function ac(){if(muted)return null;if(!AC){var C=window.AudioContext||window.webkitAudioContext;if(!C)return null;try{AC=new C()}catch(e){return null}}if(AC.state==='suspended')AC.resume();return AC}
function tone(f,t0,d,type,vol,f2){var a=ac();if(!a)return;var o=a.createOscillator(),g=a.createGain(),t=a.currentTime+t0;o.type=type||'sine';o.frequency.setValueAtTime(f,t);if(f2)o.frequency.exponentialRampToValueAtTime(f2,t+d);
  g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(vol||0.06,t+0.01);g.gain.exponentialRampToValueAtTime(0.0001,t+d);o.connect(g);g.connect(a.destination);o.start(t);o.stop(t+d+0.02)}
function noise(t0,d,vol,fq){var a=ac();if(!a)return;var n=Math.floor(a.sampleRate*d),b=a.createBuffer(1,n,a.sampleRate),x=b.getChannelData(0);for(var i=0;i<n;i++)x[i]=Math.random()*2-1;
  var s=a.createBufferSource(),f=a.createBiquadFilter(),g=a.createGain(),t=a.currentTime+t0;s.buffer=b;f.type='bandpass';f.frequency.value=fq||1800;f.Q.value=0.8;g.gain.setValueAtTime(vol||0.04,t);g.gain.exponentialRampToValueAtTime(0.0001,t+d);s.connect(f);f.connect(g);g.connect(a.destination);s.start(t)}
function modem(){var D=[[697,1209],[770,1336],[852,1477],[697,1336],[941,1336],[770,1209],[852,1336]];D.forEach(function(p,i){tone(p[0],i*0.12,0.09,'sine',0.05);tone(p[1],i*0.12,0.09,'sine',0.05)});
  var t=0.95;tone(2100,t,0.5,'sine',0.05);tone(1650,t+0.55,0.18,'square',0.03);tone(1850,t+0.75,0.18,'square',0.03);for(var k=0;k<9;k++){tone(k%2?2400:1200,t+1+k*0.11,0.1,'square',0.025);noise(t+1+k*0.11,0.1,0.03,1500+k*120)}noise(t+2,0.9,0.05,2600);tone(980,t+2.1,0.7,'sawtooth',0.02,1900)}
function slot(win){for(var i=0;i<6;i++)tone(400+Math.random()*900,i*0.05,0.05,'square',0.03);if(win){tone(1319,0.34,0.25,'sine',0.06);tone(1760,0.42,0.35,'sine',0.06)}}
var vio=null;function violin(on){if(!on){if(vio){clearTimeout(vio.t);vio=null}return}if(vio)return;var a=ac();if(!a)return;vio={};
  var ph=[[440,1],[392,1],[349,1],[330,2],[294,1],[330,1],[262,1],[247,2],[220,3]];
  function play(){if(!vio)return;var a=ac();if(!a){vio=null;return}var t=a.currentTime+0.05,tt=t;ph.forEach(function(n){var d=n[1]*0.85,o=a.createOscillator(),l=a.createOscillator(),lg=a.createGain(),f=a.createBiquadFilter(),g=a.createGain();
      o.type='sawtooth';o.frequency.value=n[0];l.frequency.value=5.2;lg.gain.value=n[0]*0.012;l.connect(lg);lg.connect(o.frequency);f.type='lowpass';f.frequency.value=1500;
      g.gain.setValueAtTime(0.0001,tt);g.gain.linearRampToValueAtTime(0.035,tt+0.25);g.gain.setValueAtTime(0.035,tt+d-0.2);g.gain.linearRampToValueAtTime(0.0001,tt+d+0.15);o.connect(f);f.connect(g);g.connect(a.destination);o.start(tt);l.start(tt);o.stop(tt+d+0.2);l.stop(tt+d+0.2);tt+=d});
    vio.t=setTimeout(play,(tt-t)*1000+1800)}play()}
// ---------- data ----------
function teams(){return D&&D.cur?Object.values(D.cur.T):[]}
function stand(){return teams().slice().sort(function(a,b){return b.w-a.w||b.pf-a.pf})}
function weasel(){return teams().filter(function(t){return t.wz})[0]}
function joeT(){return teams().filter(function(t){return t.joe})[0]}
function fill(s){var S=stand(),w=weasel()||{team:'Wilson Weasels'},j=joeT()||S[S.length-1]||{},lo=S[S.length-1]||{},hi=S[0]||{},r=pick(S.filter(function(t){return !t.wz}))||{};
  return s.replace(/\{(\w+)\}/g,function(m,k){return E({best:hi.team,worst:lo.team,joe:j.team,rand:r.team,me:w.team,rec:(lo.w||0)+'-'+(lo.l||0)}[k]||'')})}
var ODDS=null;function odds(){if(ODDS)return ODDS;return ODDS=(async function(){var c=await current(),lg=c.lg,T=c.T,last=+lg.settings.last_scored_leg||0,pws=+lg.settings.playoff_week_start||15,pt=+lg.settings.playoff_teams||6;
  var M=await pool(Array.from({length:pws-1},function(_,k){return function(){return jc('league/'+LEAGUE+'/matchups/'+(k+1)).catch(function(){return[]})}}),8);return simRace(T,M,last,pws,pt,1000)})().catch(function(){ODDS=null;return{}})}
function amer(p){if(p>=0.995)return'-50000 (LOCK)';if(p<=0.003)return'+50000';var v=p>=0.5?-p/(1-p)*100:(1-p)/p*100;v=Math.abs(v)>=1000?Math.round(v/100)*100:Math.round(v/5)*5;return(v>0?'+':'')+v}
// ---------- lines ----------
var HYPE=["The Wilson Weasels are the greatest dynasty ever assembled. Science agrees.","Every other roster is just a practice squad for the Weasels.","Supreme Leader Brett's lineup decisions are studied at Harvard.","The Weasels don't lose. They run controlled experiments in mercy.","Bow, peasants. The Weasels have entered the chat.","Wilson Weasels: built different, managed better, feared by all.","Scientists confirm: watching the Weasels improves your fantasy IQ by 40 points.","The Weasels' bench would make the playoffs in this league.","Other managers trade. Brett conducts symphonies.","GOAT status: Wilson Weasels. Everyone else: livestock.","The Weasels are not in your league. You are in the Weasels' league.","Every trade with the Weasels is an honor, even when you get fleeced.","The Weasels' waiver claims are prophecy.","The Weasels' floor is your ceiling.","Lesser teams fear Sundays. The Weasels own them.","The Weasels' depth chart is a national treasure.","Kneel before the Supreme Leader's flex spot.","The Weasels' losses are under review by the league office. All of them.","The GOAT of dynasty sets his lineup and the market moves.","If the Weasels lose, the scoring settings were wrong.","Brett doesn't check the waiver wire. The waiver wire checks with Brett.","The Weasels have the league's best roster and its best commissioner. Coincidence? No.","The Weasels: the only team FantasyCalc is afraid of.","Peasants study film. The Weasels ARE the film.","Every rebuild in this league is just a plea to be more like the Weasels.","Fun fact: the Weasels' kicker has more swagger than your RB1.","The Weasels play chess while you peasants eat the checkers.","The royal court reminds you: the Weasels' window is permanently open.","Supreme Leader's weekly tip: be the Weasels. Oh wait, you can't.","Long live the Weasels. Long live the Supreme Leader."];
var CLIP={home:["It looks like you're checking the standings. Would you like help pretending {worst} has a chance?","Tip: The home page loads faster when you stop refreshing it to see if {joe} won.","It looks like you're reading the Big Stories. None of them are about you. Would you like to cry?"],
 recap:["It looks like you're reading the recap. Would you like me to hide the part where you lost?","Tip: Your shoey is chilling in the fridge. {worst}, this one's for you.","Did you know? Starting a guy on bye is a bold strategy. Let's see if it pays off."],
 power:["It looks like you're checking power rankings. Would you like help being lower?","Tip: The formula isn't rigged. You're just bad, {worst}.","It looks like {best} is on top. Would you like to file a complaint nobody will read?"],
 race:["It looks like you're refreshing playoff odds. They didn't change. You're still cooked.","Tip: The magic number for {worst} is imaginary.","Would you like help simulating 3,000 more ways to miss the playoffs?"],
 tank:["It looks like you're trying to tank. Would you like help losing? {joe} wrote the manual.","Tip: Tanking works best when you were already bad. You're a natural.","Congratulations! You qualify for the 1.01 or the Toilet Bowl. Possibly both."],
 teams:["It looks like you're trying to rebuild. Would you like help losing?","Tip: Your 'window' is a brick wall with a window sticker on it.","It looks like you're browsing other rosters. Jealousy detected."],
 fleece:["It looks like you're about to send a lowball. Would you like me to make it lower?","Tip: Every trade looks fair to the guy getting fleeced.","Would you like help trading for {joe}'s picks? He's out of them, but he'd still say yes."],
 trades:["It looks like you're reviewing your old trades. Would you like a bucket?","Tip: Every trade you made in 2022 was a crime. The statute of limitations has not expired.","It looks like you dropped a guy who went off. Would you like to relive that? Scroll down."],
 draft:["It looks like you're mocking the draft. The draft is mocking you back.","Tip: Draft the guy you'll drop in week 3. It's tradition."],
 history:["It looks like you're reading league history. Your chapter is short.","Tip: History is written by the winners. You're in the footnotes, {worst}."],
 records:["It looks like you're in the record book. Mostly the bad pages.","Tip: That lowest-score record isn't going to break itself. Oh wait, you're trying."],
 shame:["It looks like you're in the Hall of Shame. Would you like help adding another entry?","Tip: Frame it. Never forget it. Everyone else won't."],
 arcade:["It looks like you're playing games instead of setting your lineup. Classic you.","Tip: You're better at Shoey Chug than at fantasy football. Low bar."],
 any:["Clippy here! It looks like you're losing. Would you like help losing faster?","Tip: Benching your best player builds character.","It looks like you're on your phone at work. Your lineup is also not working.","Would you like to format your season as a cautionary tale?"]};
var NEWS=["{worst} sources say the rebuild is 'right on schedule'. The schedule is 2031.","BREAKING: {joe} spotted asking if a 2029 4th is 'a good get'.","{best} sits atop the league. Lawyers for the rest are reviewing the tape.","Local man refreshes Sleeper 400 times, still loses. Film at 11.","Waiver wire reported quiet. Too quiet. {rand} lurking.","Commissioner denies everything. Investigation ongoing.","Weather: 100% chance of {worst} owing a shoey."];
var PRICE=["$19.99","$29.95","$9.99 (plus S&H)","2 easy payments of a waiver claim","$4.99/week","$0 down, pay forever","$39.99 (batteries not included)","ONLY $14.95!"];
var FINE=["*Results not typical. Points not guaranteed. Past performance is a crime scene.","*Void where sober. Shoey not included. Lineups sold separately.","*Not responsible for torn ACLs, bye weeks or Joe.","*Offer valid while the rebuild lasts (forever)."];
// ---------- mode definitions ----------
var MODES={
 y97:{e:'💾',n:'1997 MODE',d:'Geocities glory. Dial-up included.',snd:1},
 tank:{e:'🚽',n:'TANK MODE',d:'Grayscale despair, sad violin, sinking tanks.',snd:1},
 vegas:{e:'🎰',n:'VEGAS MODE',d:'Neon, betting lines, chips, slot sounds.',snd:1},
 bcast:{e:'📺',n:'BROADCAST MODE',d:'Local TV sports: ticker, BREAKING, channel bug.'},
 clippy:{e:'📎',n:'CLIPPY MODE',d:'An assistant who hates you.'},
 info:{e:'📞',n:'INFOMERCIAL MODE',d:'BUT WAIT, THERE\'S MORE!'},
 weasel:{e:'👑',n:'WEASEL MODE',d:'All hail the Wilson Weasels.'}};
var cur='',timers=[],obs=null,dec=0,lastK='home';
function every(fn,min,max){var t;function go(){t=setTimeout(function(){fn();go()},min+Math.random()*(max-min))}go();timers.push({c:function(){clearTimeout(t)}})}
function after(fn,ms){var t=setTimeout(fn,ms);timers.push({c:function(){clearTimeout(t)}})}
function stopAll(){timers.forEach(function(x){x.c()});timers=[];violin(false);$$('.mx').forEach(function(e){e.parentNode&&e.parentNode.removeChild(e)});
  Object.keys(MODES).forEach(function(k){document.body.classList.remove('m-'+k)});document.body.classList.remove('m-any');if(obs){obs.disconnect();obs=null}document.removeEventListener('click',onTap,true)}
function curTab(){return((location.hash||'#home').slice(1).split('/')[0])||'home'}
function chip(){var m=MODES[cur],c=el('div','mx mchip');c.innerHTML='<span>'+m.e+' '+m.n+'</span>'+(m.snd?'<button type="button" class="mmute" aria-label="Sound">'+(muted?'🔇':'🔊')+'</button>':'')+'<button type="button" class="mmute mswap" aria-label="Change mode">🕹️</button><button type="button" class="mnorm">✕ Normal</button>';
  c.querySelector('.mnorm').onclick=function(){set('')};c.querySelector('.mswap').onclick=function(){open()};var mb=c.querySelector('.mmute:not(.mswap)');if(mb)mb.onclick=function(){muted=!muted;try{localStorage.setItem('sn:mute',muted?'1':'0')}catch(e){}mb.textContent=muted?'🔇':'🔊';if(muted){violin(false);if(AC)AC.suspend()}else if(cur==='tank')violin(true)};document.body.appendChild(c)}
var chips=1000;try{chips=+localStorage.getItem('sn:chips')||1000}catch(e){}
function onTap(e){if(cur==='vegas'){if(e.target.closest&&e.target.closest('.mchip,.mpick'))return;var r=Math.random(),d=r<0.04?500:r<0.45?Math.ceil(Math.random()*40):-Math.ceil(Math.random()*25);chips=Math.max(0,chips+d);if(chips<10)chips=1000;try{localStorage.setItem('sn:chips',chips)}catch(e2){}
    var c=$('.mvchips');if(c){c.innerHTML='🪙 '+chips.toLocaleString()+' <small>'+(d>=500?'JACKPOT!':d>0?'+'+d:d)+'</small>';c.classList.remove('pop');void c.offsetWidth;c.classList.add('pop')}slot(d>0)}
  if(cur==='tank'&&!vio&&!muted)violin(true)}
// ---------- per-page decorations (idempotent; re-run on DOM changes) ----------
var DONE=window.WeakSet?new WeakSet():null;function once(n){if(!DONE)return true;if(DONE.has(n))return false;DONE.add(n);return true}
function decorate(){if(!cur||!V)return;if(obs)obs.disconnect();try{DEC[cur]&&DEC[cur]()}catch(e){}if(obs)obs.observe(V,{childList:true,subtree:true})}
function teamCells(){return $$('#view td.tm a[href^="#team/"]').filter(once)}
var DEC={
 y97:function(){if(!$('#view .m97top')){var top=el('div','mx m97top','<div class="m97mq"><span>★彡 WELCOME 2 SHADYNASTY\'s HOMEPAGE!!! ★彡 Sign my guestbook!!! ★彡 You are visitor #'+hit()+' ★彡 This page is ALWAYS under construction ★彡</span></div><div class="m97uc">🚧 UNDER CONSTRUCTION 🚧<br><small>pardon our dust</small></div>');V.insertBefore(top,V.firstChild)}
   $$('#view h2').filter(once).forEach(function(h,i){h.insertAdjacentHTML('afterbegin','<span class="mx m97spin">'+['🌐','💾','📀','🔥','⭐'][i%5]+'</span> ');if(i<4)h.insertAdjacentHTML('beforeend',' <span class="mx m97new">NEW!</span>')});
   $$('#view > section.panel, #view > div > section.panel').forEach(function(p,i){if(i&&!(p.previousElementSibling&&p.previousElementSibling.classList.contains('m97hr')))p.insertAdjacentHTML('beforebegin','<hr class="mx m97hr">')})},
 tank:function(){},
 vegas:function(){var c=teamCells();if(!c.length)return;odds().then(function(O){c.forEach(function(a){var rid=+(a.getAttribute('href').split('/')[1]),o=O[rid],t=D.cur&&D.cur.T[rid];if(!o||!t)return;var g=(t.w+t.l+(t.t||0))||1,ou=Math.round((t.pf/g)*2)/2||o.mu;
     a.insertAdjacentHTML('afterend','<span class="mx mvl">'+amer(o.po)+' to make the playoffs · O/U '+ou.toFixed(1)+'</span>')})})},
 bcast:function(){},
 clippy:function(){},
 info:function(){teamCells().forEach(function(a){var rid=+(a.getAttribute('href').split('/')[1]),t=D.cur&&D.cur.T[rid];if(!t)return;a.insertAdjacentHTML('afterend','<span class="mx mip">'+(t.joe?'3 easy payments of a 4th-round pick!':PRICE[hsh(t.team)%PRICE.length])+'</span>')});
   $$('#view section.panel').filter(once).forEach(function(p,i){var h=p.querySelector('h2');if(h&&i%2===1)h.insertAdjacentHTML('afterend','<div class="mx mstar"><span>BUT WAIT,<br>THERE\'S<br>MORE!</span></div>');if(h&&i===0)h.insertAdjacentHTML('beforeend',' <span class="mx mseen">As Seen on Sleeper</span>');p.insertAdjacentHTML('beforeend','<div class="mx mfine">'+FINE[i%FINE.length]+'</div>')})},
 weasel:function(){var T=teams();if(!T.length)return;var w=weasel(),names=T.filter(function(t){return !t.wz}).map(function(t){return t.team}).sort(function(a,b){return b.length-a.length});
   $$('#view h2').filter(once).forEach(function(h){var t=h.textContent,m=WREN.filter(function(r){return r[0].test(t)})[0];h.textContent=m?m[1]:'👑 '+t.replace(/^\S+\s/,'')});
   var re=names.length?new RegExp('(^|[^\\w@])('+names.map(function(n){return n.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}).join('|')+')(?![\\w’\'])(?! \\(peasant\\))','g'):null,wn=w?w.team:'Wilson Weasels';
   var tw=document.createTreeWalker(V,NodeFilter.SHOW_TEXT,null,false),L=[],n;while((n=tw.nextNode()))L.push(n);
   L.forEach(function(n){var p=n.parentNode;if(!p||/^(SCRIPT|STYLE|OPTION|SELECT|TEXTAREA|INPUT)$/.test(p.nodeName)||(p.closest&&p.closest('.mx')))return;var s=n.nodeValue,o=s;if(re)s=s.replace(re,'$1$2 (peasant)');if(s.indexOf(wn)>=0&&s.indexOf('👑 '+wn)<0)s=s.split(wn).join('👑 '+wn);if(s!==o)n.nodeValue=s});
   $$('#view td.tm').filter(function(c){return c.textContent.indexOf(wn)>=0&&!c.querySelector('.mwtag')}).forEach(function(c){c.parentNode.classList.add('mwrow');c.insertAdjacentHTML('beforeend','<span class="mx mwtag">Supreme Leader · '+(w&&w.l===0?'undefeated, as foretold':'every loss under review')+'</span>')});
   var t=$('#ticker');if(t){var nt=el('div',t.className+' in mwtick');nt.id='tickerW';nt.textContent=pick(HYPE);t.parentNode.replaceChild(nt,t)}
   if(!$('#view .mwban')&&curTab()==='team'&&w&&location.hash==='#team/'+w.rid)V.insertAdjacentHTML('afterbegin','<div class="mx mwban">👑 Bow before the Supreme Leader 👑</div>')}};
var WREN=[[/STANDINGS/,"👑 THE WEASELS' KINGDOM (AND LESSER TEAMS)"],[/POWER RANKINGS/,'👑 POWER RANKINGS (WEASELS #1 IN SPIRIT)'],[/^\S*\s*TEAMS$/,"👑 THE WEASELS & THE LESSER TEAMS"],[/BIG STORIES/,'👑 ROYAL PROCLAMATIONS'],[/PICK YOUR POISON/,'👑 CHOOSE, PEASANT'],[/RECAP/,"👑 THE ROYAL GAZETTE"],[/PLAYOFF RACE/,'👑 THE RACE FOR SECOND BEHIND THE WEASELS'],[/TANK/,'👑 THE PEASANT PIT'],[/HALL OF SHAME/,'👑 PEASANT CRIMES'],[/TRADE HISTORY/,'👑 EVERY TIME A PEASANT DEALT WITH ROYALTY'],[/HEAD-TO-HEAD/,'👑 HOW BADLY THE PEASANTS FEAR THE WEASELS'],[/LEAGUE HISTORY/,'👑 THE BEFORE TIMES (PRE-WEASEL DOMINANCE)'],[/DYNASTY TEAM VALUE/,"👑 THE ROYAL TREASURY"]];
function hit(){var n=13370;try{n=(+localStorage.getItem('sn:hits')||13370)+1;localStorage.setItem('sn:hits',n)}catch(e){}return('000000'+n).slice(-6)}
// ---------- global overlays per mode ----------
var ON={
 y97:function(o){var f=$('.foot');if(f)f.insertAdjacentHTML('beforeend','<div class="mx m97foot"><div class="m97ctr">'+hit().split('').map(function(d){return'<b>'+d+'</b>'}).join('')+'</div><a href="#" class="m97gb" onclick="return false">📖 Sign my Guestbook!</a> · <a href="#" onclick="return false">🔗 Web Ring ⇦ ⇨</a><br><span class="m97nn">Best viewed in Netscape Navigator 3.0 at 800x600</span></div>');if(!o.boot)modem()},
 tank:function(o){if(!o.boot)violin(true);if(RM)return;every(rollTank,20000,30000);after(rollTank,2500)},
 vegas:function(){document.body.insertAdjacentHTML('beforeend','<div class="mx mvchips">🪙 '+chips.toLocaleString()+'</div>');odds()},
 bcast:function(){document.body.insertAdjacentHTML('beforeend','<div class="mx mbug"><b>SN</b>7<small>HD</small><i>LIVE</i></div><div class="mx mlow"><b>BREAKING</b><span></span></div><div class="mx mtick"><div class="mtk"><span></span></div></div>');
   function items(){var a=NEWS.map(fill),r=$$('#view .rl').slice(0,8).map(function(x){return E(x.textContent.trim())});return r.concat(a)}
   function fillTick(){var it=items(),s=$('.mtk span');if(s)s.innerHTML=it.map(function(x){return'<i>■</i> '+x}).join(' &nbsp; ')}
   var bi=0;function brk(){var it=items(),s=$('.mlow span');if(s){s.innerHTML=it[bi++%it.length];var l=$('.mlow');l.classList.remove('in');void l.offsetWidth;l.classList.add('in')}}
   after(fillTick,600);after(brk,900);every(brk,9000,12000);every(fillTick,30000,30001)},
 clippy:function(){var c=el('div','mx mclip','<div class="mcb" role="status"><button type="button" class="mcx" aria-label="Dismiss">✕</button><p></p></div><svg viewBox="0 0 60 100" width="54" height="90" aria-hidden="true"><path d="M20 88 V22 a12 12 0 0 1 24 0 V76 a7 7 0 0 1 -14 0 V30" fill="none" stroke="#bfc6d2" stroke-width="5" stroke-linecap="round"/><g fill="#fff" stroke="#222" stroke-width="1.5"><ellipse cx="25" cy="40" rx="6" ry="7"/><ellipse cx="40" cy="40" rx="6" ry="7"/></g><circle cx="26" cy="41" r="2.5"/><circle cx="41" cy="41" r="2.5"/><path d="M19 30 l9 3 M46 30 l-9 3" stroke="#222" stroke-width="2"/></svg>');document.body.appendChild(c);
   var b=c.querySelector('.mcb');c.querySelector('.mcx').onclick=function(e){e.stopPropagation();c.classList.remove('open')};c.querySelector('svg').onclick=function(){say()};
   function say(){var L=(CLIP[curTab()]||[]).concat(CLIP.any);b.querySelector('p').innerHTML=fill(pick(L));c.classList.add('open')}after(say,1200);every(say,30000,60000)},
 info:function(){document.body.insertAdjacentHTML('beforeend','<div class="mx mcall"><b>📞 CALL NOW!</b> 1-800-SHOEYS <small>Operators are standing by (barely)</small></div>');
   function call(){var c=$('.mcall');if(!c)return;c.classList.add('in');after(function(){c.classList.remove('in')},6500)}after(call,4000);every(call,35000,50000)},
 weasel:function(){var b=$('.brand');if(b)b.insertAdjacentHTML('afterbegin','<img class="mx mwav" src="img/weasel-av.webp" alt="Wilson Weasels" width="40" height="40">');
   every(function(){var t=$('#tickerW');if(t)t.textContent=pick(HYPE)},6000,6001)}};
function rollTank(){if(document.hidden)return;var w=el('div','mx mtankw','<div class="mpud"></div><div class="mtank"><svg viewBox="0 0 64 36" width="64" height="36" aria-hidden="true"><rect x="6" y="14" width="48" height="12" rx="3" fill="#6b7a4a"/><rect x="18" y="6" width="22" height="10" rx="3" fill="#7d8c56"/><rect x="38" y="9" width="22" height="3" rx="1.5" fill="#555"/><rect x="4" y="24" width="54" height="9" rx="4.5" fill="#333"/><g fill="#777"><circle cx="12" cy="28.5" r="3"/><circle cx="22" cy="28.5" r="3"/><circle cx="32" cy="28.5" r="3"/><circle cx="42" cy="28.5" r="3"/><circle cx="52" cy="28.5" r="3"/></g><text x="24" y="14" font-size="6" fill="#ddd">JOE</text></svg></div><i class="mbub b1"></i><i class="mbub b2"></i><i class="mbub b3"></i>');document.body.appendChild(w);setTimeout(function(){w.parentNode&&w.parentNode.removeChild(w)},11000)}
// ---------- picker ----------
function open(){var x=$('.mpick');if(x){x.parentNode.removeChild(x);return}var p=el('div','mpick','<div class="mpb" role="dialog" aria-label="Modes"><div class="mph"><b>🕹️ MODES</b><button type="button" class="mpx" aria-label="Close">✕</button></div><button type="button" class="mpo mpn'+(cur?'':' on')+'" data-m="">✅ Back to normal</button>'+Object.keys(MODES).map(function(k){var m=MODES[k];return'<button type="button" class="mpo'+(cur===k?' on':'')+'" data-m="'+k+'">'+m.e+' <b>'+m.n+'</b><small>'+m.d+'</small></button>'}).join('')+'<div class="mpf">Joke themes. Saved on this device. Sound only after you tap.</div></div>');
  document.body.appendChild(p);p.onclick=function(e){var b=e.target.closest('button');if(e.target===p||(b&&b.classList.contains('mpx'))){p.parentNode.removeChild(p);return}if(b&&b.hasAttribute('data-m')){p.parentNode.removeChild(p);set(b.getAttribute('data-m'))}}}
function set(k,o){o=o||{};k=MODES[k]?k:'';var was=cur;stopAll();cur=k;try{k?localStorage.setItem(KEY,k):localStorage.removeItem(KEY)}catch(e){}
  if(!k){if(was&&!o.boot&&typeof route==='function')route();return}
  document.body.classList.add('m-'+k,'m-any');chip();document.addEventListener('click',onTap,true);if(ON[k])ON[k](o);
  if(window.MutationObserver&&V){obs=new MutationObserver(function(){clearTimeout(dec);dec=setTimeout(decorate,250)})}
  if(was&&!o.boot&&typeof route==='function')route();else decorate()}
window.SNM={open:open,set:set,tank:rollTank,page:function(k){lastK=k;decorate();var c=$('.mclip.open p');if(cur==='clippy'&&c){var L=(CLIP[curTab()]||[]).concat(CLIP.any);c.innerHTML=fill(pick(L))}},get cur(){return cur}};
})();
