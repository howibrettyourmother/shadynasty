'use strict';
// SHADYNASTY HQ: the heel's entrance. Wilson Weasels (BRETT) gets a villain-entrance cinematic instead of the normal team particle burst.
// ~3.6s: blackout vignette, lightning + one short soft flash, small shake, red smoke + embers from below, the eat-shit-hat weasel rising
// with red-glowing lenses and backlight rays, then a title card slam, then fade. Tap anywhere to skip. prefers-reduced-motion -> static card,
// no flash/shake/particles. Sound (low thunder) only if the site's sound isn't muted AND the page has had a user gesture.
(function(){
const LINES=['Boo louder.','Your lineup fears me.','Weasel season.','Hate me harder.','Cheap heat. Real points.','Your trade offer made him laugh.'];
let css=false;function style(){if(css)return;css=true;const s=document.createElement('style');s.textContent=`
#heel{position:fixed;inset:0;z-index:2147483000;overflow:hidden;pointer-events:auto;cursor:pointer;contain:strict;-webkit-tap-highlight-color:transparent}
#heel .hlvg{position:absolute;inset:0;background:radial-gradient(ellipse at 50% 62%,rgba(60,0,0,.55) 0%,rgba(8,0,0,.92) 55%,#000 100%);opacity:0;transition:opacity .3s ease}
#heel.on .hlvg{opacity:1}
#heel canvas{position:absolute;inset:0;width:100%;height:100%}
#heel .hlry{position:absolute;left:50%;top:52%;width:150vmax;height:150vmax;margin:-75vmax 0 0 -75vmax;opacity:0;transition:opacity .8s ease .5s;
  background:repeating-conic-gradient(from 0deg,rgba(255,40,30,.20) 0deg 5deg,rgba(0,0,0,0) 5deg 15deg);-webkit-mask-image:radial-gradient(circle,#000 0%,rgba(0,0,0,.6) 18%,transparent 48%);mask-image:radial-gradient(circle,#000 0%,rgba(0,0,0,.6) 18%,transparent 48%);animation:heelspin 9s linear infinite}
#heel.rise .hlry{opacity:1}
@keyframes heelspin{to{transform:rotate(360deg)}}
#heel .hlwz{position:absolute;left:50%;top:52%;width:min(74vw,46vh);aspect-ratio:1;transform:translate(-50%,-50%) translateY(75vh) scale(.82);will-change:transform;transition:transform 1.25s cubic-bezier(.16,.9,.25,1)}
#heel.rise .hlwz{transform:translate(-50%,-50%) translateY(0) scale(1)}
#heel .hlwz img{width:100%;height:100%;display:block;border-radius:50%;filter:contrast(1.15) saturate(.75) brightness(.85) sepia(.25) hue-rotate(-20deg);
  -webkit-mask-image:radial-gradient(circle at 50% 46%,#000 56%,transparent 71%);mask-image:radial-gradient(circle at 50% 46%,#000 56%,transparent 71%)}
#heel .hlwz::before{content:'';position:absolute;inset:-14%;border-radius:50%;background:radial-gradient(circle,rgba(255,50,30,.55) 0%,rgba(160,0,0,.25) 40%,transparent 68%);z-index:-1}
#heel .hley{position:absolute;width:22%;height:16%;border-radius:50%;opacity:0;background:radial-gradient(ellipse,rgba(255,235,220,.95) 0%,rgba(255,40,20,.9) 22%,rgba(220,0,0,.45) 50%,transparent 72%);mix-blend-mode:screen;transition:opacity .35s ease}
#heel .hley.l{left:22%;top:59%}#heel .hley.r{left:59%;top:57%}
#heel.eyes .hley{opacity:1;animation:heeleye 1.1s ease-in-out infinite alternate}
@keyframes heeleye{to{filter:brightness(1.35);transform:scale(1.08)}}
#heel .hlfl{position:absolute;inset:0;background:#fff;opacity:0;pointer-events:none}
#heel .hltt{position:absolute;left:0;right:0;bottom:9vh;text-align:center;padding:0 5vw;opacity:0;transform:scale(2.4);will-change:transform,opacity}
#heel.title .hltt{opacity:1;transform:scale(1);transition:transform .22s cubic-bezier(.2,1.6,.4,1),opacity .12s linear}
#heel .hltt b{display:block;font:900 clamp(26px,8.6vw,54px)/.95 Impact,'Arial Black','Helvetica Neue',sans-serif;letter-spacing:.02em;color:#fff;text-transform:uppercase;
  text-shadow:0 0 18px rgba(255,30,20,.9),0 3px 0 #7a0000,0 6px 18px #000;-webkit-text-stroke:1px #2a0000}
#heel .hltt i{display:inline-block;margin-top:10px;font:800 clamp(14px,4.4vw,22px)/1.1 -apple-system,'Helvetica Neue',Arial,sans-serif;font-style:normal;color:#ffd5cf;letter-spacing:.08em;text-transform:uppercase;background:rgba(120,0,0,.55);border:1px solid rgba(255,60,40,.6);padding:5px 12px;border-radius:4px;opacity:0;transform:translateY(8px);transition:all .3s ease .35s}
#heel.title .hltt i{opacity:1;transform:none}
#heel .hlkp{position:absolute;top:max(14px,env(safe-area-inset-top));right:14px;font:700 11px/1 -apple-system,Arial,sans-serif;color:rgba(255,255,255,.55);letter-spacing:.1em;text-transform:uppercase}
#heel.out{opacity:0;transition:opacity .35s ease}
@keyframes heelshake{0%,100%{transform:none}20%{transform:translate(-7px,3px)}40%{transform:translate(6px,-4px)}60%{transform:translate(-4px,-2px)}80%{transform:translate(3px,3px)}}
#heel.shake .hlsk{animation:heelshake .32s linear}
#heel .hlsk{position:absolute;inset:0}
#heel.static .hlwz{transform:translate(-50%,-50%);transition:none}#heel.static .hlry{opacity:.6;animation:none}#heel.static .hley{opacity:1}#heel.static .hltt{opacity:1;transform:none}#heel.static .hltt i{opacity:1;transform:none}`;document.head.appendChild(s)}
function thunder(t0,d,vol){try{if(localStorage.getItem('sn:mute')==='1')return}catch(e){}
  if(!(navigator.userActivation?navigator.userActivation.hasBeenActive:heel.gest))return;
  const C=window.AudioContext||window.webkitAudioContext;if(!C)return;const a=heel.ac||(heel.ac=new C());if(a.state==='suspended')a.resume();
  const n=Math.floor(a.sampleRate*d),b=a.createBuffer(1,n,a.sampleRate),x=b.getChannelData(0);let l=0;for(let i=0;i<n;i++){l=(l+0.04*(Math.random()*2-1))/1.04;x[i]=l*3.5}
  const s=a.createBufferSource(),f=a.createBiquadFilter(),g=a.createGain(),t=a.currentTime+t0;s.buffer=b;f.type='lowpass';f.frequency.value=180;g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(vol,t+0.06);g.gain.exponentialRampToValueAtTime(0.0001,t+d);
  s.connect(f);f.connect(g);g.connect(a.destination);s.start(t);s.stop(t+d+0.05)}
addEventListener('pointerdown',()=>{heel.gest=1},{capture:true,passive:true});
function heel(th,o){style();const old=document.getElementById('heel');if(old)old.remove();
  const rm=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  const line=LINES[(heel.n=(heel.n==null?Math.floor(Math.random()*LINES.length):heel.n+1))%LINES.length];
  const w=document.createElement('div');w.id='heel';w.setAttribute('role','dialog');w.setAttribute('aria-label','The heel has entered the building. '+line);
  w.innerHTML=`<div class="hlsk"><div class="hlvg"></div><div class="hlry"></div><canvas></canvas><div class="hlwz"><img alt="" src="img/weasel-av.webp"><i class="hley l"></i><i class="hley r"></i></div><div class="hltt"><b>The heel has entered the building</b><i>${line}</i></div></div><div class="hlfl"></div><div class="hlkp">tap to skip</div>`;
  document.body.appendChild(w);let done=false,T=[],raf=0;const later=(f,ms)=>T.push(setTimeout(f,ms));
  const end=fast=>{if(done)return;done=true;T.forEach(clearTimeout);w.classList.add('out');if(fast)w.style.transitionDuration='.18s';setTimeout(()=>{cancelAnimationFrame(raf);w.remove()},fast?200:380)};
  w.addEventListener('click',()=>end(true));addEventListener('keydown',function k(e){if(e.key==='Escape'){end(true);removeEventListener('keydown',k)}});
  if(rm){w.classList.add('static','on','title');later(()=>end(),2600);return}
  // canvas: smoke, embers, lightning
  const cv=w.querySelector('canvas'),cx=cv.getContext('2d'),dpr=Math.min(2,devicePixelRatio||1);let W=0,H=0;const fit=()=>{W=innerWidth;H=innerHeight;cv.width=W*dpr;cv.height=H*dpr;cx.setTransform(dpr,0,0,dpr,0,0)};fit();
  const R=Math.random,sm=[],em=[];for(let i=0;i<22;i++)sm.push({x:R()*W,y:H+R()*H*0.3,r:60+R()*110,vy:0.25+R()*0.55,vx:(R()-.5)*0.4,a:0,h:R()<.5?0:12});
  for(let i=0;i<46;i++)em.push({x:R()*W,y:H*0.55+R()*H*0.6,vy:0.5+R()*1.6,vx:(R()-.5)*0.6,s:1+R()*2.4,p:R()*6.28,l:R()});
  let bolts=[];const bolt=(x0,big)=>{const pts=[[x0,-10]];let x=x0,y=-10;const yEnd=H*(big?0.62:0.42);while(y<yEnd){y+=14+R()*26;x+=(R()-.5)*46;pts.push([x,y]);if(R()<.18&&big)bolts.push({p:branch(x,y),t:performance.now(),d:260})}bolts.push({p:pts,t:performance.now(),d:big?380:260,big})};
  const branch=(x,y)=>{const p=[[x,y]];for(let i=0;i<4+R()*4;i++){x+=(R()-.3)*40*(R()<.5?-1:1);y+=12+R()*20;p.push([x,y])}return p};
  const t0=performance.now();
  const frame=now=>{const t=(now-t0)/1000;cx.clearRect(0,0,W,H);
    // smoke rising (additive red/ember fog)
    cx.globalCompositeOperation='lighter';for(const s of sm){s.y-=s.vy*(1+t*0.4);s.x+=s.vx;s.a=Math.min(0.17,s.a+0.004);if(s.y<-s.r){s.y=H+s.r;s.x=R()*W}
      const g=cx.createRadialGradient(s.x,s.y,0,s.x,s.y,s.r);g.addColorStop(0,`hsla(${s.h},90%,35%,${s.a})`);g.addColorStop(1,'hsla(0,90%,20%,0)');cx.fillStyle=g;cx.beginPath();cx.arc(s.x,s.y,s.r,0,6.283);cx.fill()}
    // embers
    for(const e of em){e.y-=e.vy;e.x+=e.vx+Math.sin(t*2+e.p)*0.35;if(e.y<-10){e.y=H+10;e.x=R()*W}const fl=0.55+0.45*Math.sin(t*9+e.p);cx.fillStyle=`rgba(255,${120+Math.floor(e.l*90)},40,${0.85*fl})`;cx.beginPath();cx.arc(e.x,e.y,e.s,0,6.283);cx.fill()}
    // lightning
    cx.globalCompositeOperation='source-over';bolts=bolts.filter(b=>now-b.t<b.d);for(const b of bolts){const k=1-(now-b.t)/b.d;cx.save();cx.shadowColor='rgba(255,90,80,.95)';cx.shadowBlur=b.big?24:14;cx.strokeStyle=`rgba(255,245,240,${k})`;cx.lineWidth=b.big?3.2:2;cx.lineJoin='round';cx.beginPath();b.p.forEach(([x,y],i)=>i?cx.lineTo(x,y):cx.moveTo(x,y));cx.stroke();cx.restore()}
    if(!done)raf=requestAnimationFrame(frame)};raf=requestAnimationFrame(frame);
  const fl=w.querySelector('.hlfl'),flash=(op,ms)=>{fl.style.transition='none';fl.style.opacity=op;requestAnimationFrame(()=>{fl.style.transition=`opacity ${ms}ms ease-out`;fl.style.opacity=0})};
  const shake=()=>{w.classList.remove('shake');void w.offsetWidth;w.classList.add('shake')};
  requestAnimationFrame(()=>w.classList.add('on'));
  later(()=>{bolt(W*(0.3+R()*0.4),true);flash(0.55,240);shake();thunder(0.05,1.6,0.5)},330);      // crack #1: one soft flash (<0.1s near peak), no strobe
  later(()=>w.classList.add('rise'),450);
  later(()=>w.classList.add('eyes'),1500);
  later(()=>{bolt(W*(R()<.5?0.15:0.85),false);flash(0.22,200)},1750);                          // crack #2: small, dim
  later(()=>{w.classList.add('title');shake();thunder(0,0.7,0.35)},1950);
  later(()=>end(),3600)}
window.heelEntrance=heel;
})();
