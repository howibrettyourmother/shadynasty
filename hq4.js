'use strict';
// SHADYNASTY HQ round 4 ("premium"): data-health banners, stretch-run tools, navigation. Loaded after every other page script.
(function(){
// ---------------- values-unavailable banner (FantasyCalc down / stale) ----------------
const VPAGES=new Set(['power','analyzer','teams','team','fleece','trades','draft','tank']);
const vBanner=k=>{const v=$('#view');if(!v||!VPAGES.has(k)||!D.vState||D.vState==='ok'||v.querySelector('.vwarn.fc'))return;
  const when=D.vAt?new Date(D.vAt).toLocaleDateString('en-US',{month:'short',day:'numeric'}):'';
  v.insertAdjacentHTML('afterbegin',`<div class="vwarn fc" role="status">${D.vState==='none'
    ?'⚠️ <b>Dynasty values didn\'t load</b> (FantasyCalc isn\'t answering). Player and pick values show as 0, so value-based rankings, trade grades and ideas are off until it\'s back.'
    :`⚠️ <b>Dynasty values are from ${esc(when)}</b>. FantasyCalc isn't answering, so these are the last ones we saved.`} <button type="button" class="chip" data-vretry>↻ Retry</button></div>`)};
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('[data-vretry]');if(b){try{localStorage.removeItem('sn:fc3')}catch(x){}fullRefresh()}});
{const _a=R.after;R.after=k=>{if(_a)_a(k);vBanner(k);setTimeout(()=>vBanner(k),1500)}}
})();
