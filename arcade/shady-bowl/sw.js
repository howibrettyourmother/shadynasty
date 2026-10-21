// Shady Bowl service worker: game shell cache-first, league data network-first with cached fallback.
const CORE='sb-v2-core-2',DATA='sb-v2-data-1';
const FILES=['./','index.html','lines.js?v=4','game.js?v=5','v2.js?v=1','manifest.json','icon-192.png','icon-512.png','apple-touch-icon.png','../../chug/anton.woff'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CORE).then(c=>Promise.all(FILES.map(f=>c.add(f).catch(()=>{})))).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith('sb-')&&k!=CORE&&k!=DATA).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{const r=e.request;if(r.method!='GET')return;const u=new URL(r.url);
  const data=u.hostname=='api.sleeper.app'||u.pathname.endsWith('/data/players.json');
  if(data){e.respondWith(fetch(r).then(res=>{if(res.ok){const c=res.clone();caches.open(DATA).then(x=>x.put(r,c))}return res}).catch(()=>caches.match(r,{cacheName:DATA}).then(m=>m||Response.error())));return}
  if(u.hostname=='sleepercdn.com'){e.respondWith(caches.match(r).then(m=>m||fetch(r).then(res=>{const c=res.clone();caches.open(DATA).then(x=>x.put(r,c));return res})));return}
  if(u.origin==location.origin&&u.pathname.includes('/arcade/shady-bowl/')||u.pathname.endsWith('anton.woff')){
    e.respondWith(caches.match(r,{ignoreSearch:r.mode=='navigate'}).then(m=>{const net=fetch(r).then(res=>{if(res.ok){const c=res.clone();caches.open(CORE).then(x=>x.put(r,c))}return res});return m||net.catch(()=>caches.match('index.html'))}))}});
