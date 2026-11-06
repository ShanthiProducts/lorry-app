/* offline cache for the කඩ බිල app (only its own old caches are removed — the lorry / factory apps live on the same site) */
const CACHE='bill-app-4';
const FILES=['./','index.html','manifest.webmanifest','../icon-192.png','../icon-512.png','../apple-touch-icon.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES).catch(()=>c.addAll(['./','index.html']))).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==CACHE&&x.startsWith('bill-app-')).map(x=>caches.delete(x)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  const url=new URL(e.request.url);if(url.origin!==location.origin)return;
  /* the page: network first (gets updates), the saved page after 3 s or when offline */
  if(e.request.mode==='navigate'){e.respondWith(new Promise(res=>{let done=false;const give=r=>{if(!done&&r){done=true;res(r);}};
    const t=setTimeout(()=>{caches.match('index.html').then(give);},3000);
    fetch(e.request).then(r=>{clearTimeout(t);if(r&&r.ok){const c=r.clone();caches.open(CACHE).then(x=>x.put('index.html',c));}give(r);})
      .catch(()=>{clearTimeout(t);caches.match('index.html').then(c=>{if(!done){done=true;res(c||Response.error());}});});}));return;}
  e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request)));
});
