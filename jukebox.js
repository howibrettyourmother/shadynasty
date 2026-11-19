'use strict';
const JBV=1;let JB=null,jbAudio=null,jbTracks=[],jbIdx=-1,jbCounted=null;
const jbGet=()=>JB||(JB=fetch('jukebox/tracks.json?v='+JBV+'&t='+Math.floor(Date.now()/6e5)).then(r=>{if(!r.ok)throw Error(r.status);return r.json()}).catch(e=>{JB=null;throw e}));
const jbSrc=t=>'jukebox/'+t.file;
const jbFmt=s=>{s=Math.max(0,s||0)|0;return ((s/60)|0)+':'+String(s%60).padStart(2,'0')};
function jbGc(t){if(!t||typeof goatcounter==='undefined'||!goatcounter.count)return;if(jbCounted===t.id)return;jbCounted=t.id;goatcounter.count({path:'jukebox-play/'+t.id,title:'Jukebox play: '+t.title,event:true})}
function jbPauseVid(){document.querySelectorAll('video').forEach(v=>{try{v.pause()}catch(e){}})}
function jbEnsure(){
  if(jbAudio)return jbAudio;
  jbAudio=new Audio();jbAudio.preload='metadata';
  jbAudio.addEventListener('play',()=>{jbPauseVid();const t=jbTracks[jbIdx];if(t&&jbAudio.currentTime<1.5)jbGc(t);jbSync()});
  jbAudio.addEventListener('pause',jbSync);
  jbAudio.addEventListener('ended',()=>jbSkip(1));
  jbAudio.addEventListener('timeupdate',jbTick);
  jbAudio.addEventListener('loadedmetadata',jbTick);
  if(!$('#jb-dock')){
    const d=document.createElement('div');d.id='jb-dock';d.hidden=true;
    d.innerHTML=`<div class="jb-now"><img class="jb-art" alt=""><div class="jb-now-m"><h3></h3>
      <div class="jb-ctrls"><button type="button" class="jb-btn ghost" data-jb="prev" aria-label="Previous">◀◀</button>
      <button type="button" class="jb-btn" data-jb="toggle" aria-label="Play">▶</button>
      <button type="button" class="jb-btn ghost" data-jb="next" aria-label="Next">▶▶</button>
      <button type="button" class="jb-btn ghost" data-jb="stop" aria-label="Stop">✕</button></div></div></div>`;
    document.body.appendChild(d);
    d.addEventListener('click',e=>{const b=e.target.closest('[data-jb]');if(!b)return;jbCmd(b.dataset.jb)});
  }
  return jbAudio;
}
function jbLoad(i,auto){
  jbEnsure();
  if(!jbTracks.length)return;
  jbIdx=(i+jbTracks.length)%jbTracks.length;
  const t=jbTracks[jbIdx];
  if(jbAudio.src!==new URL(jbSrc(t),location.href).href){jbAudio.src=jbSrc(t);jbCounted=null}
  jbSync();
  if(auto){const p=jbAudio.play();if(p&&p.catch)p.catch(()=>{})}
}
function jbCmd(c){
  if(c==='prev')jbSkip(-1);
  else if(c==='next')jbSkip(1);
  else if(c==='toggle'){
    if(jbIdx<0){jbLoad(0,true);return}
    if(jbAudio.paused){const p=jbAudio.play();if(p&&p.catch)p.catch(()=>{})}else jbAudio.pause();
  }else if(c==='stop'){jbAudio.pause();jbAudio.currentTime=0;jbIdx=-1;jbSync();jbDock(false)}
}
function jbSkip(d){if(!jbTracks.length)return;jbLoad(jbIdx<0?0:jbIdx+d,true)}
window.jbPause=()=>{if(jbAudio&&!jbAudio.paused)jbAudio.pause()};
function jbOnpage(){return (location.hash||'').slice(1).split('/')[0]==='jukebox'}
function jbDock(on){const d=$('#jb-dock');if(!d)return;const show=!!on&&!jbOnpage()&&jbIdx>=0;d.hidden=!show;document.body.classList.toggle('jb-docking',show)}
function jbTick(){
  const t=jbAudio?jbAudio.currentTime:0,d=jbAudio&&isFinite(jbAudio.duration)?jbAudio.duration:0;
  document.querySelectorAll('[data-jb-cur]').forEach(el=>{el.textContent=jbFmt(t)});
  document.querySelectorAll('[data-jb-len]').forEach(el=>{el.textContent=d?jbFmt(d):'–:––'});
  document.querySelectorAll('input[data-jb-seek]').forEach(el=>{el.max=d||0;el.value=t||0});
}
function jbSync(){
  const t=jbTracks[jbIdx],playing=!!(jbAudio&&!jbAudio.paused&&t);
  document.querySelectorAll('[data-jb="toggle"]').forEach(b=>{b.textContent=playing?'❚❚':'▶';b.setAttribute('aria-label',playing?'Pause':'Play')});
  document.querySelectorAll('.jb-track').forEach(el=>el.classList.toggle('on',t&&el.dataset.id===t.id));
  document.querySelectorAll('.jb-now-m h3').forEach(el=>{el.textContent=t?t.title:'Pick a track'});
  document.querySelectorAll('.jb-now .jb-art').forEach(img=>{if(!t){img.removeAttribute('src');img.alt='';return}if(img.getAttribute('src')!==t.poster){img.src=t.poster;img.alt=t.title}});
  document.querySelectorAll('.jb-dur').forEach(el=>{el.textContent=t?(t.duration||''):''});
  jbTick();
  jbDock(playing||(jbIdx>=0&&!jbOnpage()));
}
R.jukebox=async el=>{
  jbTracks=await jbGet();
  jbEnsure();
  el.innerHTML=`<section class="panel"><h2>🎵 Song Jukebox</h2>
    <div class="jb-sub">League songs, minus the video. Play, skip, or leave it running while you roam the site.</div>
    <div class="jb-now"><img class="jb-art" alt=""><div class="jb-now-m"><h3></h3><div class="jb-dur"></div>
      <div class="jb-ctrls"><button type="button" class="jb-btn ghost" data-jb="prev" aria-label="Previous">◀ Prev</button>
      <button type="button" class="jb-btn" data-jb="toggle" aria-label="Play">▶ Play</button>
      <button type="button" class="jb-btn ghost" data-jb="next" aria-label="Next">Next ▶</button></div>
      <div class="jb-prog"><span class="jb-t" data-jb-cur>0:00</span>
      <input type="range" data-jb-seek min="0" step="0.1" value="0" aria-label="Seek">
      <span class="jb-t" data-jb-len>–:––</span></div></div></div>
    <ol class="jb-list">${jbTracks.map((t,i)=>`<li><button type="button" class="jb-track" data-id="${esc(t.id)}" data-i="${i}">
      <img src="${esc(t.poster)}" alt="">
      <span><b>${esc(t.title)}</b><small>${esc(t.duration||'')}</small></span>
      <span class="jb-go">▶</span></button></li>`).join('')}</ol></section>`;
  el.querySelectorAll('[data-jb]').forEach(b=>b.addEventListener('click',()=>jbCmd(b.dataset.jb)));
  el.querySelectorAll('.jb-track').forEach(b=>b.addEventListener('click',()=>jbLoad(+b.dataset.i,true)));
  const sk=el.querySelector('[data-jb-seek]');
  if(sk){sk.addEventListener('input',()=>{if(jbAudio)jbAudio.currentTime=+sk.value})}
  jbSync();
};
addEventListener('hashchange',()=>jbDock(jbIdx>=0&&jbAudio&&(!jbAudio.paused||!jbOnpage())));
