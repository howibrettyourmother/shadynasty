'use strict';
// 🎬 VIDEOS (#videos): gallery driven by videos/videos.json. Add a video = drop an mp4 + poster in videos/ and add an entry at the TOP of videos.json.
const VDV=4;let VD=null;
const vdGet=()=>VD||(VD=fetch('videos/videos.json?v='+VDV+'&t='+Math.floor(Date.now()/6e5)).then(r=>{if(!r.ok)throw Error(r.status);return r.json()}).catch(e=>{VD=null;throw e}));
const vdSrc=v=>'videos/'+v.file;
const vdPoster=v=>v.poster?'videos/'+v.poster:'';
R.videos=async(el,arg)=>{
  const all=(await vdGet()).filter(v=>!v.hidden);
  el.innerHTML=`<section class="panel"><h2>🎬 VIDEOS</h2><div class="vd-sub">League music videos. Tap play on your phone — more on the way.</div>
  <div class="vd-list">${all.map(v=>`<article class="vd-card" id="vd-${esc(v.id||v.file)}" data-id="${esc(v.id||'')}">
    <div class="vd-player"><video controls playsinline preload="none"${vdPoster(v)?` poster="${esc(vdPoster(v))}"`:''} src="${esc(vdSrc(v))}"${v.w?` width="${+v.w}"`:''}${v.h?` height="${+v.h}"`:''}></video></div>
    <div class="vd-meta"><h3>${esc(v.title)}</h3>${v.duration?`<time>${esc(v.duration)}</time>`:''}<p>${esc(v.caption||'')}</p></div>
  </article>`).join('')}</div></section>`;
  const vids=[...el.querySelectorAll('video')];
  vids.forEach(v=>v.addEventListener('play',()=>vids.forEach(o=>{if(o!==v)o.pause()})));
  if(arg){const t=el.querySelector('#vd-'+CSS.escape(arg));if(t){t.scrollIntoView({block:'start'});const vid=t.querySelector('video');if(vid)vid.focus()}}
};
