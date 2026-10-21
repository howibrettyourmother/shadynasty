'use strict';
// 🏛️ LEAGUE OFFICE (#office): bylaws (office/bylaws.json) + live Sleeper settings w/ conflict flags + memos & notices archive (office/office.json). Loaded after app.js.
const OFV=1,OF={};
const ofGet=u=>OF[u]||(OF[u]=fetch(u+'?v='+OFV).then(r=>{if(!r.ok)throw Error(r.status);return r.json()}).catch(e=>{delete OF[u];throw e}));
const SEAL=(c,s)=>`<img class="lo-seal ${c||''}" src="office/seal.svg?v=${OFV}" width="${s||64}" height="${s||64}" alt="Shoebeer Enforcement Division seal">`;
const ofDate=d=>new Date(d+'T12:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});
const r2=x=>Math.round(x*1000)/1000;
// Each check compares a 2021 bylaw against the live Sleeper league. secs = bylaw sections that get the ⚠️ flag on conflict.
function ofChecks(lg){const s=lg.settings||{},sc=lg.scoring_settings||{},rp=lg.roster_positions||[],st=rp.filter(p=>p!=='BN'),pw=+s.playoff_week_start||15,pt=+s.playoff_teams||6,rounds=Math.ceil(Math.log2(pt)),pe=pw+rounds-1;
  const ln={QB:'QB',RB:'RB',WR:'WR',TE:'TE',FLEX:'FLEX',SUPER_FLEX:'SUPERFLEX',DEF:'DST',K:'K'},cnt={};st.forEach(p=>cnt[p]=(cnt[p]||0)+1);const lineup=Object.entries(cnt).map(([p,n])=>n+(ln[p]||p)).join('/');
  const C=(label,bylaw,live,ok,secs)=>({label,bylaw,live,ok,secs});
  return [
   C('Teams','12 teams, one division',(+s.num_teams||lg.total_rosters)+' teams',(+s.num_teams||lg.total_rosters)===12,['league-summary','teams-ownership-and-replacement']),
   C('Regular season','Weeks 1–13 (the Summary says 14)','Weeks 1–'+(pw-1),pw-1===13,['regular-season-playoffs-and-toilet-bowl']),
   C('Playoff weeks','Weeks 14–16','Weeks '+pw+'–'+pe,pw===14&&pe===16,['league-summary','general-league-calendar','regular-season-playoffs-and-toilet-bowl']),
   C('Playoff teams','6 teams, top 2 seeds get a bye',pt+' teams',pt===6,['regular-season-playoffs-and-toilet-bowl']),
   C('Trade deadline','Locked after Week 10',+s.trade_deadline?'Locked after Week '+s.trade_deadline:'No deadline',+s.trade_deadline===10,['trading','general-league-calendar']),
   C('Roster spots','23 in-season',rp.length+' ('+st.length+' starters + '+(rp.length-st.length)+' bench)',rp.length===23,['rosters','league-summary']),
   C('Starters','11: 1QB/2RB/3WR/1TE/2FLEX/1SUPERFLEX/DST',st.length+': '+lineup,st.length===11&&lineup==='1QB/2RB/3WR/1TE/2FLEX/1SUPERFLEX/1DST',['lineups','league-summary']),
   C('IR spots','2 in-season',(+s.reserve_slots||0)+' IR',+s.reserve_slots===2,['rosters','league-summary']),
   C('Taxi squad','Unlocks with the rookie draft (no size listed)',(+s.taxi_slots||0)+' slots, rookies'+(+s.taxi_allow_vets?' + vets':' only'),true,[]),
   C('Waivers','Daily in-season waiver cycle',+s.daily_waivers?'Daily':'Weekly run, '+(+s.waiver_clear_days||0)+'-day clear (daily waivers off)',!!+s.daily_waivers,['free-agent-acquisition-waivers','general-league-calendar']),
   C('FAAB','$100',(+s.waiver_type===2?'$':'')+(+s.waiver_budget||0)+(+s.waiver_type===2?' FAAB':' (no FAAB)'),+s.waiver_budget===100&&+s.waiver_type===2,['free-agent-acquisition-waivers','league-summary']),
   C('Rookie draft','2.13 comp pick for the Toilet Bowl winner',(+s.draft_rounds||0)+' rounds',true,[]),
   C('Pass TD','4 pts',r2(+sc.pass_td)+' pts',+sc.pass_td===4,['scoring','league-summary']),
   C('Rush / rec TD','6 pts',r2(+sc.rush_td)+' / '+r2(+sc.rec_td)+' pts',+sc.rush_td===6&&+sc.rec_td===6,['scoring']),
   C('Reception (PPR)','1 pt',r2(+sc.rec)+' pt'+(sc.bonus_rec_te?' (TE +'+r2(+sc.bonus_rec_te)+')':''),+sc.rec===1&&!+sc.bonus_rec_te,['scoring','league-summary']),
   C('Passing yards','0.04 / yd',r2(+sc.pass_yd)+' / yd',r2(+sc.pass_yd)===0.04,['scoring']),
   C('Rush / rec yards','0.1 / yd',r2(+sc.rush_yd)+' / '+r2(+sc.rec_yd),r2(+sc.rush_yd)===0.1&&r2(+sc.rec_yd)===0.1,['scoring']),
   C('Interception thrown','-1',String(r2(+sc.pass_int)),+sc.pass_int===-1,['scoring']),
   C('Fumble / lost','-1 / -2',r2(+sc.fum)+' / '+r2(+sc.fum_lost),+sc.fum===-1&&+sc.fum_lost===-2,['scoring']),
   C('2-pt conversion','2 pts',r2(+sc.pass_2pt)+' pass / '+r2(+sc.rush_2pt)+' rush / '+r2(+sc.rec_2pt)+' rec',+sc.pass_2pt===2&&+sc.rush_2pt===2&&+sc.rec_2pt===2,['scoring'])]}
const ofRx=(q,f)=>new RegExp('\\b'+q.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),f||'i');
const ofBlk=(b,q)=>{const hl=t=>{const e=esc(t);if(!q)return e;return e.replace(ofRx(esc(q),'gi'),m=>`<mark>${m}</mark>`)};
  if(b.t==='table')return`<div class="lo-tw"><table class="lo-cal">${b.rows.map((r,i)=>`<tr>${r.map(c=>i?`<td>${hl(c)}</td>`:`<th>${esc(c)}</th>`).join('')}</tr>`).join('')}</table></div>`;
  if(b.t==='img')return`<img class="lo-img" src="${b.src}?v=${OFV}" alt="${esc(b.alt)}" loading="lazy">`;
  return b.t==='li'?`<div class="lo-li d${Math.min(b.d,4)}">${hl(b.x)}</div>`:`<p>${hl(b.x)}</p>`};
const ofSecText=s=>s.title+' '+s.b.map(b=>b.x||(b.rows||[]).flat().join(' ')).join(' ');
function ofSecs(B,flags,q){const ql=(q||'').trim().toLowerCase();let n=0;
  const out=B.sections.map((s,i)=>{const hit=!ql||ofRx(ql).test(ofSecText(s));if(hit)n++;const f=flags[s.id]||[];
    return`<section class="lo-sec${hit?'':' lo-hide'}" id="lo-${s.id}" data-id="${s.id}"><h3><a href="#office/${s.id}">${i?'§'+i+' ':''}${esc(s.title)}</a>${f.length?' <span class="lo-flag">⚠️ SLEEPER OVERRIDES</span>':''}</h3>
     ${f.length?`<div class="lo-ovr">Live Sleeper settings win here: ${f.map(c=>`<b>${esc(c.label)}</b> is <b>${esc(c.live)}</b>, not ${esc(c.bylaw)}`).join('; ')}.</div>`:''}${s.b.map(b=>ofBlk(b,ql?q.trim():'')).join('')}</section>`}).join('');
  return{html:out,n}}
R.office=async(el,arg)=>{const [B,O]=await Promise.all([ofGet('office/bylaws.json'),ofGet('office/office.json')]);let lg=null;try{lg=(await current()).lg}catch(e){console.warn(e)}
  const CK=lg?ofChecks(lg):[],flags={};CK.filter(c=>!c.ok).forEach(c=>c.secs.forEach(s=>(flags[s]=flags[s]||[]).push(c)));const nc=CK.filter(c=>!c.ok).length;
  const docs=O.docs.slice().sort((a,b)=>b.date.localeCompare(a.date)||b.no.localeCompare(a.no));
  const sec=ofSecs(B,flags,'');
  el.innerHTML=`<section class="panel lo-hd"><div class="lo-mast">${SEAL('big',96)}<div><h2>🏛️ LEAGUE OFFICE</h2><div class="lo-sub">Office of the Commissioner · Department of Competitive Integrity · <i>Shoebeer Enforcement Division</i></div>
   <div class="hint">Rules, rulings and paperwork. Per §Owner Conduct, trash talking and shit-posting are actively encouraged. Sentient injury reports in your starting lineup are not.</div></div></div>
   <nav class="lo-jump"><a href="#office/memos">📜 Memos &amp; Notices (${docs.length})</a><a href="#office/settings">⚙️ Current Sleeper settings</a><a href="#office/bylaws">📖 Bylaws</a></nav></section>
  <section class="panel" id="lo-memos"><h2>📜 MEMOS &amp; NOTICES</h2><div class="hint">Official correspondence from the Shoebeer Enforcement Division, newest first. Govern yourselves accordingly.</div>
   <div class="lo-docs">${docs.map(d=>`<article class="lo-doc" id="lo-${esc(d.id)}"><div class="lo-dh">${SEAL('sm',44)}<div><div class="lo-no">${esc(d.kind)} ${esc(d.no)} · ${ofDate(d.date)}</div><h3><a href="#office/${esc(d.id)}">${esc(d.title)}</a></h3><div class="lo-sc">${esc(d.scope)}</div></div></div>
     <p>${esc(d.summary)}</p><div class="lo-btns"><a class="ktc" href="office/docs/${esc(d.file)}.pdf?v=${OFV}" download>⬇️ PDF</a><a class="ktc" href="office/docs/${esc(d.file)}.html?v=${OFV}" target="_blank" rel="noopener">Open original ↗</a></div>
     <details${arg===d.id?' open':''}><summary>View document</summary><a href="office/docs/${esc(d.file)}.png?v=${OFV}" target="_blank" rel="noopener"><img class="lo-png" src="office/docs/${esc(d.file)}.png?v=${OFV}" loading="lazy" alt="${esc(d.kind+' '+d.no)} as issued"></a></details></article>`).join('')}</div></section>
  <section class="panel" id="lo-settings"><h2>⚙️ CURRENT SLEEPER SETTINGS</h2>${lg?`<div class="hint">Live from Sleeper for the ${esc(lg.season)} season. ${nc?`<b class="lo-warn">${nc} bylaw${nc>1?'s are':' is'} out of date</b>, and Sleeper wins every one of those arguments.`:'Everything matches the bylaws. Suspicious.'}</div>
   <div class="lo-tw"><table class="lo-set"><tr><th>Setting</th><th>Sleeper (live)</th><th>Bylaws (2021)</th><th></th></tr>${CK.map(c=>`<tr class="${c.ok?'':'bad'}"><td>${esc(c.label)}</td><td><b>${esc(c.live)}</b></td><td>${esc(c.bylaw)}</td><td>${c.ok?'✅':'⚠️'}</td></tr>`).join('')}</table></div>`:`<div class="hint">Sleeper fumbled the settings. Tap ↻ up top to try again. Until then, assume the app is right and the doc is old.</div>`}</section>
  <section class="panel" id="lo-bylaws"><h2>📖 BYLAWS</h2><div class="lo-ban">📅 <b>Last updated July 2021.</b> Where these conflict with the live Sleeper settings, <b>Sleeper settings win</b> (the bylaws say so themselves: "site settings will prevail until corrected"). Conflicts are flagged ⚠️ below.</div>
   <div class="lo-srch"><input type="search" id="lo-q" placeholder="Search the bylaws (try “IR”, “veto”, “shoey”)" aria-label="Search the bylaws" autocomplete="off"><span id="lo-n" class="hint"></span></div>
   <details class="lo-toc" open><summary>Table of contents</summary><ol start="0">${B.sections.map(s=>`<li><a href="#office/${s.id}">${esc(s.title)}</a>${flags[s.id]?' ⚠️':''}</li>`).join('')}</ol></details>
   <div id="lo-body">${sec.html}</div></section>`};
// after insertion: wire search + jump to the deep-linked section / document
{const _af=R.after;R.after=k=>{if(_af)_af(k);if(k!=='office')return;const q=document.getElementById('lo-q'),body=document.getElementById('lo-body'),n=document.getElementById('lo-n');
  if(q&&body)q.addEventListener('input',()=>{ofGet('office/bylaws.json').then(B=>{const v=q.value;const flags={};body.querySelectorAll('.lo-sec').forEach(s=>{const f=s.querySelector('.lo-ovr');if(f)flags[s.dataset.id]=1});
    const keep={};body.querySelectorAll('.lo-sec').forEach(s=>{keep[s.dataset.id]=[s.querySelector('h3').outerHTML,(s.querySelector('.lo-ovr')||{}).outerHTML||'']});
    const ql=v.trim().toLowerCase();let c=0;B.sections.forEach(s=>{const e=document.getElementById('lo-'+s.id);if(!e)return;const hit=!ql||ofRx(ql).test(ofSecText(s));if(hit)c++;e.classList.toggle('lo-hide',!hit);
      e.innerHTML=keep[s.id][0]+keep[s.id][1]+s.b.map(b=>ofBlk(b,ql?v.trim():'')).join('')});n.textContent=ql?(c?c+' section'+(c>1?'s':'')+' match':'No rule against that. Yet.'):''})});
  const a=(location.hash.split('/')[1]||'');if(a){const t=document.getElementById('lo-'+a);if(t){if(t.tagName==='ARTICLE'){const d=t.querySelector('details');if(d)d.open=true}requestAnimationFrame(()=>t.scrollIntoView({block:'start'}))}}}}
