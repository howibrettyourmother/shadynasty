// Shady Bowl service worker: game shell cache-first, league data network-first with cached fallback.
const CORE='sb-v2-core-4',DATA='sb-v2-data-1';
const FILES=['./','index.html','lines.js?v=6','game.js?v=6','v2.js?v=4','vo/index.json','manifest.json','icon-192.png','icon-512.png','apple-touch-icon.png','../../chug/anton.woff'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CORE).then(c=>Promise.all(FILES.map(f=>c.add(f).catch(()=>{})))).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith('sb-')&&k!=CORE&&k!=DATA&&k!='sb-vo-1').map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{const r=e.request;if(r.method!='GET')return;const u=new URL(r.url);
  const data=u.hostname=='api.sleeper.app'||u.pathname.endsWith('/data/players.json')||/\/vo\/.*\.json$/.test(u.pathname);
  if(data){e.respondWith(fetch(r).then(res=>{if(res.ok){const c=res.clone();caches.open(DATA).then(x=>x.put(r,c))}return res}).catch(()=>caches.match(r,{cacheName:DATA}).then(m=>m||Response.error())));return}
  if(u.hostname=='sleepercdn.com'){e.respondWith(caches.match(r).then(m=>m||fetch(r).then(res=>{const c=res.clone();caches.open(DATA).then(x=>x.put(r,c));return res})));return}
  if(u.origin==location.origin&&u.pathname.includes('/arcade/shady-bowl/')||u.pathname.endsWith('anton.woff')){
    if(r.mode=='navigate'||/\.html$|\/$/.test(u.pathname)){e.respondWith(fetch(r).then(res=>{if(res.ok){const c=res.clone();caches.open(CORE).then(x=>x.put(r,c))}return res}).catch(()=>caches.match(r,{ignoreSearch:true}).then(m=>m||caches.match('index.html'))));return}
    e.respondWith(caches.match(r).then(m=>{const net=fetch(r).then(res=>{if(res.ok){const c=res.clone();caches.open(CORE).then(x=>x.put(r,c))}return res});return m||net.catch(()=>caches.match('index.html'))}))}});
