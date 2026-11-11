/* offline cache for the lorry app (only its own old caches are removed — the factory app lives on the same site)
   514v2: a GitHub error page is never saved (the saved page opens instead) · the කඩ බිල app (bill-app/ folder) gets a
   spare copy here — used only when its own offline helper isn't on this phone yet · …/bill-app (no "/") → …/bill-app/ */
const CACHE='lorry-app-517v1';
const FILES=['./','index.html','manifest.webmanifest','icon-192.png','icon-512.png','icon-maskable-512.png','apple-touch-icon.png'];
const BILL='bill-app/index.html';
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES).then(()=>fetch(new Request('bill-app/',{cache:'reload'})).then(r=>{if(r&&r.ok&&!r.redirected)return c.put(BILL,r);}).catch(()=>{}))).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==CACHE&&x.startsWith('lorry-app-')).map(x=>caches.delete(x)))).then(()=>self.clients.claim()));});
/* the page: network first (gets updates when online); the saved page after 3 s (v4.5.2 weak signal), when offline, or on a GitHub error */
function page(e,key,own){
  const saved=()=>(own?caches.open(CACHE).then(c=>c.match(key)):caches.match(key)).then(r=>r||caches.match(key)).catch(()=>null);
  let put=Promise.resolve();
  const net=fetch(e.request).then(r=>{if(r&&r.ok&&!r.redirected){const c=r.clone();put=caches.open(CACHE).then(x=>x.put(key,c)).catch(()=>{});}return r;});
  e.waitUntil(net.then(()=>put,()=>{}));/* keeps the helper awake until the new page is saved */
  e.respondWith(new Promise(res=>{let done=false;const give=r=>{if(!done&&r){done=true;res(r);}};
    const t=setTimeout(()=>{saved().then(give);},3000);
    net.then(r=>{clearTimeout(t);if(r&&(r.ok||r.type==='opaqueredirect'))give(r);else saved().then(c=>give(c||r));})
      .catch(()=>{clearTimeout(t);saved().then(c=>{if(!done){done=true;res(c||Response.error());}});});}));}
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  const url=new URL(e.request.url);if(url.origin!==location.origin)return;
  const home=new URL('./',self.location).pathname;
  /* 🧾 කඩ බිල app — reaches here only when its own helper (bill-app/sw.js) isn't running on this phone */
  if(e.request.mode==='navigate'&&url.pathname===home+'bill-app'){e.respondWith(Response.redirect(new URL(home+'bill-app/'+url.search,self.location).href,302));return;}
  if(e.request.mode==='navigate'&&(url.pathname===home+'bill-app/'||url.pathname===home+BILL)){page(e,BILL,false);return;}
  /* only this app's own page — another app may live in a sub-folder of the same site */
  if(e.request.mode==='navigate'&&url.pathname!==home&&url.pathname!==home+'index.html')return;
  if(!url.pathname.startsWith(home)||url.pathname.slice(home.length).includes('/'))return;
  if(e.request.mode==='navigate'){page(e,'index.html',true);return;}
  e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request)));
});
