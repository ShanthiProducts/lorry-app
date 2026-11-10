/* offline cache for the factory app (only its own old caches are removed — the factory app lives on the same site) */
const CACHE='factory-app-479v1';
const FILES=['./','index.html','manifest.webmanifest','icon-192.png','icon-512.png','icon-maskable-512.png','apple-touch-icon.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==CACHE&&x.startsWith('factory-app-')).map(x=>caches.delete(x)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  const url=new URL(e.request.url);if(url.origin!==location.origin)return;
  /* network first for the page (gets updates when online), cache when offline */
  /* only this app's own page — another app may live in a sub-folder of the same site */
  const home=new URL('./',self.location).pathname;
  if(e.request.mode==='navigate'&&url.pathname!==home&&url.pathname!==home+'index.html')return;
  if(!url.pathname.startsWith(home)||url.pathname.slice(home.length).includes('/'))return;
  /* v4.5.2: weak signal → after 3 s the saved page opens (the new one is still fetched and saved for next time) */
  if(e.request.mode==='navigate'){e.respondWith(new Promise(res=>{let done=false;const give=r=>{if(!done&&r){done=true;res(r);}};
    const t=setTimeout(()=>{caches.match('index.html').then(give);},3000);
    fetch(e.request).then(r=>{clearTimeout(t);const c=r.clone();caches.open(CACHE).then(x=>x.put('index.html',c));give(r);})
      .catch(()=>{clearTimeout(t);caches.match('index.html').then(c=>{if(!done){done=true;res(c||Response.error());}});});}));return;}
  e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request)));
});
