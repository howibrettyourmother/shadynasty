'use strict';
// 😂 MEMES (#memes): gallery driven by memes/memes.json. Add a meme = drop a JPG in memes/ + add an entry at the TOP of memes.json.
const MMV=1;let MM=null;const mmGet=()=>MM||(MM=fetch('memes/memes.json?v='+MMV+'&t='+Math.floor(Date.now()/6e5)).then(r=>{if(!r.ok)throw Error(r.status);return r.json()}).catch(e=>{MM=null;throw e}));
const mmSrc=m=>'memes/'+m.file;
R.memes=async(el,arg)=>{const all=(await mmGet()).map((m,i)=>({...m,i})).sort((a,b)=>(b.date||'').localeCompare(a.date||'')||a.i-b.i);
  const tags=[...new Set(all.flatMap(m=>m.tags||[]))];
  el.innerHTML=`<section class="panel"><h2>😂 MEMES</h2><div class="mm-sub">The league's finest propaganda. Tap to enlarge, swipe to browse.</div>
  <div class="mm-chips"><button class="on" data-t="">All <small>${all.length}</small></button>${tags.map(t=>`<button data-t="${esc(t)}">${esc(t)} <small>${all.filter(m=>(m.tags||[]).includes(t)).length}</small></button>`).join('')}</div>
  <div class="mm-grid">${all.map((m,k)=>`<button class="mm-th" data-k="${k}" data-tags="${esc((m.tags||[]).join('|'))}" aria-label="${esc(m.title)}"><img src="${mmSrc(m)}" loading="lazy" decoding="async" width="${m.w||1024}" height="${m.h||1024}" alt="${esc(m.title+'. '+(m.caption||''))}"><span>${esc(m.title)}</span></button>`).join('')}</div></section>`;
  let cur=all;const grid=el.querySelector('.mm-grid');
  el.querySelectorAll('.mm-chips button').forEach(b=>b.onclick=()=>{el.querySelectorAll('.mm-chips button').forEach(x=>x.classList.toggle('on',x===b));const t=b.dataset.t;
    grid.querySelectorAll('.mm-th').forEach(x=>x.hidden=!!t&&!x.dataset.tags.split('|').includes(t));cur=t?all.filter(m=>(m.tags||[]).includes(t)):all});
  grid.onclick=e=>{const b=e.target.closest('.mm-th');if(b){const m=all[+b.dataset.k];mmOpen(cur,Math.max(0,cur.indexOf(m)))}};
  if(arg){const k=all.findIndex(m=>m.file.replace(/\.\w+$/,'')===arg);if(k>=0)setTimeout(()=>mmOpen(all,k),0)}};
function mmOpen(list,i){let lb=document.getElementById('mmlb');if(lb)lb.remove();
  lb=document.createElement('div');lb.id='mmlb';lb.className='mm-lb';lb.setAttribute('role','dialog');lb.setAttribute('aria-modal','true');
  lb.innerHTML=`<div class="mm-top"><span class="mm-n"></span><button class="mm-x" aria-label="Close">✕</button></div><div class="mm-stage"><img alt=""></div>
  <button class="mm-nav mm-prev" aria-label="Previous">‹</button><button class="mm-nav mm-next" aria-label="Next">›</button>
  <div class="mm-bar"><div class="mm-cap"><b></b><small></small></div><div class="mm-act"><a class="mm-dl" download>⬇ Download</a><button class="mm-sh">↗ Share</button></div></div>`;
  document.body.appendChild(lb);document.documentElement.classList.add('mm-lock');
  const img=lb.querySelector('img'),q=s=>lb.querySelector(s);
  const show=()=>{const m=list[i];img.src=mmSrc(m);img.alt=m.title+'. '+(m.caption||'');q('.mm-cap b').textContent=m.title;q('.mm-cap small').textContent=m.caption||'';
    q('.mm-n').textContent=(i+1)+' / '+list.length;const dl=q('.mm-dl');dl.href=mmSrc(m);dl.setAttribute('download',m.file);
    [list[i+1],list[i-1]].forEach(n=>{if(n)new Image().src=mmSrc(n)});history.replaceState(null,'','#memes/'+m.file.replace(/\.\w+$/,''))};
  const go=d=>{i=(i+d+list.length)%list.length;show()};
  const close=()=>{lb.remove();document.documentElement.classList.remove('mm-lock');removeEventListener('keydown',key);history.replaceState(null,'','#memes')};
  const key=e=>{if(e.key==='ArrowRight')go(1);else if(e.key==='ArrowLeft')go(-1);else if(e.key==='Escape')close()};addEventListener('keydown',key);
  q('.mm-x').onclick=close;q('.mm-prev').onclick=()=>go(-1);q('.mm-next').onclick=()=>go(1);
  q('.mm-stage').onclick=e=>{if(e.target!==img)close()};
  let sx=0,sy=0;lb.addEventListener('touchstart',e=>{sx=e.touches[0].clientX;sy=e.touches[0].clientY},{passive:true});
  lb.addEventListener('touchend',e=>{const dx=e.changedTouches[0].clientX-sx,dy=e.changedTouches[0].clientY-sy;if(Math.abs(dx)>50&&Math.abs(dx)>Math.abs(dy))go(dx<0?1:-1);else if(dy>90&&Math.abs(dy)>Math.abs(dx)*1.5)close()},{passive:true});
  q('.mm-sh').onclick=async()=>{const m=list[i],url=location.href.split('#')[0]+'#memes/'+m.file.replace(/\.\w+$/,''),b=q('.mm-sh');
    try{if(navigator.share){let data={title:m.title,text:m.caption||m.title,url};try{const bl=await (await fetch(mmSrc(m))).blob(),f=new File([bl],m.file,{type:bl.type||'image/jpeg'});if(navigator.canShare&&navigator.canShare({files:[f]}))data={files:[f],title:m.title,text:m.title+' · '+url}}catch(e){}
      await navigator.share(data);return}}catch(e){if(e&&e.name==='AbortError')return}
    try{await navigator.clipboard.writeText(url);b.textContent='✓ Link copied'}catch(e){prompt('Copy link:',url)}setTimeout(()=>b.textContent='↗ Share',1800)};
  show()}
