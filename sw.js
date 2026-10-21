/* offline cache for the lorry app (only its own old caches are removed — the factory app lives on the same site) */
const CACHE='lorry-app-436icons';
const FILES=['./','index.html','manifest.webmanifest','icon-192.png','icon-512.png','icon-maskable-512.png','apple-touch-icon.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==CACHE&&x.startsWith('lorry-app-')).map(x=>caches.delete(x)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  const url=new URL(e.request.url);if(url.origin!==location.origin)return;
  /* network first for the page (gets updates when online), cache when offline */
  /* only this app's own page — another app may live in a sub-folder of the same site */
  const home=new URL('./',self.location).pathname;
  if(e.request.mode==='navigate'&&url.pathname!==home&&url.pathname!==home+'index.html')return;
  if(!url.pathname.startsWith(home)||url.pathname.slice(home.length).includes('/'))return;
  if(e.request.mode==='navigate'){e.respondWith(fetch(e.request).then(r=>{const c=r.clone();caches.open(CACHE).then(x=>x.put('index.html',c));return r;}).catch(()=>caches.match('index.html')));return;}
  e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request)));
});
