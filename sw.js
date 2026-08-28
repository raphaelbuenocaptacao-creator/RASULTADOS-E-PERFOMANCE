const CACHE='vt-hub-trimestral-v6';
const APP_SHELL=['./','./index.html','./dashboard-data.json','./manifest.webmanifest','./icon-192.svg','./icon-512.svg'];

self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(APP_SHELL)).then(()=>self.skipWaiting()));
});

self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));
});

function isSafeRequest(request,url){
  if(request.method!=='GET') return false;
  if(request.headers.has('authorization')) return false;
  if(url.origin!==self.location.origin) return false;
  if(/\/(api|auth|login|admin|session|token)(\/|$)/i.test(url.pathname)) return false;
  return ['document','script','style','image','font'].includes(request.destination) || url.pathname.endsWith('.json');
}

self.addEventListener('fetch',event=>{
  const request=event.request;
  const url=new URL(request.url);
  if(!isSafeRequest(request,url)) return;

  if(request.mode==='navigate'){
    event.respondWith(fetch(request).catch(()=>caches.match('./index.html')));
    return;
  }

  event.respondWith(caches.match(request).then(cached=>cached || fetch(request).then(response=>{
    if(!response || response.status!==200 || response.type!=='basic') return response;
    const copy=response.clone();
    caches.open(CACHE).then(cache=>cache.put(request,copy));
    return response;
  })));
});
