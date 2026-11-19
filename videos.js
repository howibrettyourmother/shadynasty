'use strict';
// 🎬 VIDEOS (#videos): gallery driven by videos/videos.json. Add a video = drop an mp4 + poster in videos/ and add an entry at the TOP of videos.json.
const VDV=10;let VD=null;
const vdGet=()=>VD||(VD=fetch('videos/videos.json?v='+VDV+'&t='+Math.floor(Date.now()/6e5)).then(r=>{if(!r.ok)throw Error(r.status);return r.json()}).catch(e=>{VD=null;throw e}));
const vdSrc=v=>'videos/'+v.file;
const vdPoster=v=>v.poster?'videos/'+v.poster:'';
const vdAdded=v=>v&&(v.added||v.date);
const vdIsNew=v=>{const d=vdAdded(v);if(!d)return false;const t=Date.parse(d+'T00:00:00-05:00');return isFinite(t)&&(Date.now()-t)<7*864e5};
const JB_ADDED='2026-11-19';
const jbIsNew=()=>{const t=Date.parse(JB_ADDED+'T00:00:00-05:00');return isFinite(t)&&(Date.now()-t)<7*864e5};
function vdBadge(el,on){if(!el)return;let b=el.querySelector('.tab-new');if(on&&!b){b=document.createElement('i');b.className='tab-new';b.textContent='New';el.appendChild(b)}if(b)b.hidden=!on}
function vdMarkTabs(all){
  const anyVid=(all||[]).some(vdIsNew), anyJb=jbIsNew();
  vdBadge(document.querySelector('#tabs a[data-k="videos"]'),anyVid);
  vdBadge(document.querySelector('#tabs a[data-k="jukebox"]'),anyJb);
  vdBadge(document.querySelector('#grp a[data-g="fun"]'),anyVid||anyJb);
}
function vdGc(id,title){if(typeof goatcounter==='undefined'||!goatcounter.count)return;goatcounter.count({path:'video-play/'+id,title:'Video play: '+title,event:true})}
R.videos=async(el,arg)=>{
  const all=(await vdGet()).filter(v=>!v.hidden);
  vdMarkTabs(all);
  el.innerHTML=`<section class="panel"><h2>🎬 VIDEOS</h2><div class="vd-sub">League music videos. Tap play on your phone — more on the way.</div>
  <div class="vd-list">${all.map(v=>`<article class="vd-card" id="vd-${esc(v.id||v.file)}" data-id="${esc(v.id||'')}">
    <div class="vd-player"><video controls playsinline preload="none"${vdPoster(v)?` poster="${esc(vdPoster(v))}"`:''} src="${esc(vdSrc(v))}"${v.w?` width="${+v.w}"`:''}${v.h?` height="${+v.h}"`:''}></video></div>
    <div class="vd-meta"><h3>${esc(v.title)}${vdIsNew(v)?' <span class="vd-new">New</span>':''}</h3>${v.duration?`<time>${esc(v.duration)}</time>`:''}<p>${esc(v.caption||'')}</p></div>
  </article>`).join('')}</div></section>`;
  const vids=[...el.querySelectorAll('video')];
  vids.forEach(v=>v.addEventListener('play',()=>{
    vids.forEach(o=>{if(o!==v)o.pause()});
    if(window.jbPause)window.jbPause();
    if(v.currentTime<1.5){const card=v.closest('[data-id]');const id=(card&&card.dataset.id)||'video';const title=(card&&card.querySelector('h3')&&card.querySelector('h3').childNodes[0].textContent.trim())||id;vdGc(id,title)}
  }));
  if(arg){const t=el.querySelector('#vd-'+CSS.escape(arg));if(t){t.scrollIntoView({block:'start'});const vid=t.querySelector('video');if(vid)vid.focus()}}
};
const vdRefresh=()=>vdGet().then(vdMarkTabs).catch(()=>vdMarkTabs([]));
vdRefresh();
addEventListener('hashchange',vdRefresh);
