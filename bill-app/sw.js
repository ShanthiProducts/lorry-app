/* offline cache for the කඩ බිල app (only its own old caches are removed — the lorry / factory apps live on the same site)
   v1.8 (bill-app-12): each file is saved on its own (one slow icon can't stop the page being saved; a file that can't be
   fetched is copied from the old cache) · the page opens from this app's own cache first · a page that only half-arrives
   in 3 s (weak signal) → the saved page opens and the new one is saved for next time · a GitHub error page is never saved */
const CACHE='bill-app-12';
const PAGE='index.html';
const FILES=['./','index.html','manifest.webmanifest','icon-192.png','icon-512.png','icon-maskable-512.png','apple-touch-icon.png'];
async function keep(c,f){
  try{const r=await fetch(new Request(f,{cache:'reload'}));if(r&&r.ok&&!r.redirected){await c.put(f,r);return true;}}catch(e){}
  try{const old=await caches.match(f);if(old){await c.put(f,old);return true;}}catch(e){}
  return false;}
self.addEventListener('install',e=>{e.waitUntil((async()=>{
  const c=await caches.open(CACHE),ok=await Promise.all(FILES.map(f=>keep(c,f)));
  if(!ok[1]){const r=await c.match('./');if(!r)throw new Error('page not saved');await c.put(PAGE,r.clone());}
  await self.skipWaiting();})());});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==CACHE&&x.startsWith('bill-app-')).map(x=>caches.delete(x)))).then(()=>self.clients.claim()));});
async function saved(){
  try{const c=await caches.open(CACHE),r=(await c.match(PAGE))||(await c.match('./'));if(r)return r;}catch(e){}
  try{return (await caches.match(PAGE))||(await caches.match('./'))||null;}catch(e){return null;}}
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  const url=new URL(e.request.url);if(url.origin!==location.origin)return;
  /* the page: network first (gets updates), the saved page after 3 s or when offline */
  if(e.request.mode==='navigate'){
    const net=fetch(e.request).then(async r=>{
      if(!r||r.type==='opaqueredirect'||!r.ok)return r;
      const b=await r.blob(),fresh=new Response(b,{status:200,headers:{'Content-Type':r.headers.get('Content-Type')||'text/html; charset=utf-8'}});
      try{await (await caches.open(CACHE)).put(PAGE,fresh.clone());}catch(x){}
      return fresh;});
    e.waitUntil(net.catch(()=>{}));
    e.respondWith((async()=>{
      const late=new Promise(res=>setTimeout(()=>saved().then(c=>c&&res(c)),3000));
      try{const r=await Promise.race([net,late]);
        if(r&&(r.ok||r.type==='opaqueredirect'))return r;
        return (await saved())||r||Response.error();}
      catch(x){return (await saved())||Response.error();}})());
    return;}
  e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request)));
});
