// SHADYNASTY HQ · Stage C: two-level navigation (5 groups), cleaner home, alias routes, canonical draft order, shorter long pages.
(function(){
const NAV=[
 ['week','🏈','THIS WEEK','Scores, roasts and who owes a shoey.','recap',[['home','🏠','HOME'],['recap','📰','RECAP'],['matchups','🥊','MATCHUPS'],['power','⚡','POWER']]],
 ['race','🏁','RACE','Playoff odds, the Playoff Machine and the tank for the 1.01.','race',[['race','📈','ODDS'],['scenarios','🔮','MACHINE'],['tank','🚽','TANK'],['draft','🎓','DRAFT']]],
 ['dyn','💎','DYNASTY','Rosters, values, trade ideas and every deal ever made.','fleece',[['teams','👥','TEAMS'],['analyzer','⚖️','ANALYZER'],['fleece','🧶','FLEECE'],['trades','🔁','TRADES']]],
 ['hist','📚','HISTORY','Champions, records, rivalries and the Hall of Shame.','history',[['history','🏛️','HISTORY'],['records','📕','RECORDS'],['rivalry','⚔️','RIVALRIES'],['shame','🍺','SHAME']]],
 ['fun','🎉','FUN','The arcade, the meme vault and the League Office.','arcade',[['arcade','🕹️','ARCADE'],['memes','😂','MEMES'],['office','📜','OFFICE']]]];
// old/anchor URLs → page + section (deep links keep working)
const ALIAS={ledger:['recap','ledger'],shoeys:['recap','ledger'],deadline:['fleece','deadline'],clinch:['race','clinch'],machine:['scenarios'],playoffs:['race'],odds:['race'],standings:['home']};
const PARENT={team:'teams'};
const grpOf=k=>{k=PARENT[k]||k;const g=NAV.find(g=>g[5].some(s=>s[0]===k));return g||NAV[0]};
const hk=()=>{const h=(location.hash||'#home').slice(1).split('/')[0];return typeof R[h]==='function'?h:'home'};
let LAST={};try{LAST=JSON.parse(sessionStorage.getItem('sn:navlast')||'{}')}catch(e){}
const top=document.querySelector('header.top'),tabs=document.getElementById('tabs');if(!top||!tabs)return;
const grp=document.createElement('nav');grp.id='grp';grp.setAttribute('aria-label','Sections');
grp.innerHTML=NAV.map(g=>`<a href="#${g[5][0][0]}" data-g="${g[0]}"><span>${g[1]}</span><b>${g[2]}</b></a>`).join('');
// phones: a fixed bottom bar must live outside the header (its backdrop-filter would trap position:fixed)
const mq=matchMedia('(max-width:760px)'),place=()=>{if(mq.matches){if(grp.parentNode!==document.body)document.body.appendChild(grp)}else if(grp.parentNode!==top)top.insertBefore(grp,tabs)};place();try{mq.addEventListener('change',place)}catch(e){mq.addListener(place)}
document.body.classList.add('gnav');tabs.setAttribute('aria-label','Pages');
function paint(){const k=hk(),kk=PARENT[k]||k,g=grpOf(k);if(g[5].some(s=>s[0]===kk)){LAST[g[0]]=kk;try{sessionStorage.setItem('sn:navlast',JSON.stringify(LAST))}catch(e){}}
  grp.querySelectorAll('a').forEach(a=>{const G=NAV.find(x=>x[0]===a.dataset.g),on=G===g;a.classList.toggle('on',on);a.setAttribute('href','#'+(on?G[5][0][0]:(LAST[G[0]]||G[5][0][0])));if(on)a.setAttribute('aria-current','true');else a.removeAttribute('aria-current')});
  if(tabs.dataset.g!==g[0]){tabs.dataset.g=g[0];tabs.innerHTML=g[5].map(([s,i,n])=>`<a href="#${s}" data-k="${s}"><span>${i}</span>${n}</a>`).join('')}
  tabs.querySelectorAll('a').forEach(a=>{const on=a.dataset.k===kk;a.classList.toggle('on',on);if(on)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current')})}
paint();addEventListener('hashchange',paint);
// alias routes: swap the URL in place (no extra history entry), then scroll to the section once it renders
let PEND=null;
for(const a in ALIAS){if(typeof R[a]==='function')continue;R[a]=()=>{const [p,sec]=ALIAS[a];PEND=sec||null;location.replace('#'+p);return new Promise(()=>{})}}
{const _a=R.after;R.after=k=>{if(_a)_a(k);paint();if(PEND){const id=PEND;PEND=null;requestAnimationFrame(()=>{const t=document.getElementById(id);if(t)t.scrollIntoView({block:'start'})})}}}
// ---- home: 5 group cards instead of 15 tiles, standings up top ----
{const _h=R.home;R.home=async(el,arg)=>{await _h(el,arg);
  const ps=[...el.querySelectorAll('section.panel')],pick=ps.find(s=>/PICK YOUR POISON/.test((s.querySelector('h2')||{}).textContent||'')),st=ps.find(s=>/STANDINGS/.test((s.querySelector('h2')||{}).textContent||''));
  if(pick){const c=pick.querySelector('.cards');if(c){c.className='gcards';c.innerHTML=NAV.map(g=>`<div class="gcard"><a class="gc-h" href="#${g[0]==='week'?'recap':g[5][0][0]}"><span class="cth"><img src="img/th/${g[4]}.webp?v=4" width="400" height="250" loading="lazy" decoding="async" alt=""><span class="ci">${g[1]}</span></span><span class="cb"><b>${g[2]}</b><small>${g[3]}</small></span></a><div class="gc-l">${g[5].filter(s=>s[0]!=='home').map(([s,i,n])=>`<a href="#${s}">${i} ${n}</a>`).join('')}</div></div>`).join('')}}
  const lb=el.querySelector('#lbx'),kids=[...el.children],top3=lb&&kids.indexOf(lb)>=0&&kids.indexOf(lb)<kids.indexOf(ps.find(s=>/BIG STORIES/.test(s.textContent))||st),anchor=top3?lb:el.querySelector('.srs')||el.querySelector('.hx');
  if(st&&anchor&&anchor!==st)anchor.insertAdjacentElement('afterend',st)}}
// ---- one draft order everywhere: in season the Draft Room and Pick Inventory follow the canonical sim (avg pick slot) ----
{const _d=R.draft;R.draft=async(el,arg)=>{D.dOrd=null;try{const c=await current();if(c.lg.status==='in_season'){const so=await tankOdds();if(so){const ids=Object.keys(so).map(Number);if(ids.length===Object.keys(c.T).length)D.dOrd=ids.sort((a,b)=>so[a].eSlot-so[b].eSlot||c.T[a].max-c.T[b].max)}}}catch(e){console.warn('draft order',e)}return _d(el,arg)}}
{const _t=R.teams;R.teams=async(el,arg)=>{try{await tankOdds()}catch(e){}return _t(el,arg)}}
{const _ps=projSlots;projSlots=function(T,lg){try{const c=tankOdds.c;if(lg&&lg.status==='in_season'&&c&&c.k.indexOf(LEAGUE+':')===0){const so=c.v,ids=Object.keys(T).map(Number);if(ids.every(i=>so[i])){const o={};ids.sort((a,b)=>so[a].eSlot-so[b].eSlot).forEach((r,i)=>o[r]=i+1);return o}}}catch(e){}return _ps(T,lg)}}
window.SNNav={NAV,ALIAS,grpOf,paint};
})();
