const CACHE='vt-hub-trimestral-v7-safe-shell';
const APP_SHELL=['./','./index.html','./dashboard-data.json','./manifest.webmanifest','./icon-192.svg','./icon-512.svg','./icon-512-maskable.svg'];
const APP_SHELL_PATHS=new Set(APP_SHELL.map(path=>new URL(path,self.registration.scope).pathname));

self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(APP_SHELL)).then(()=>self.skipWaiting()));
});

self.addEventListener('activate',event=>{
  event.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key))))
      .then(()=>self.clients.claim())
  );
});

function hasSensitiveQuery(url){
  const sensitive=['token','access_token','refresh_token','password','secret','session','auth','key','apikey','api_key'];
  return sensitive.some(name=>url.searchParams.has(name));
}

function isPrivateRequest(request,url){
  if(request.method!=='GET') return true;
  if(url.origin!==self.location.origin) return true;
  if(request.headers.has('authorization') || request.headers.has('cookie')) return true;
  if(hasSensitiveQuery(url)) return true;
  return /\/(api|auth|login|logout|admin|session|sessions|token|password|account|profile|user|users)(\/|$)/i.test(url.pathname);
}

function shellMatch(url){
  return APP_SHELL_PATHS.has(url.pathname);
}

self.addEventListener('fetch',event=>{
  const request=event.request;
  const url=new URL(request.url);
  if(isPrivateRequest(request,url)) return;

  if(request.mode==='navigate'){
    event.respondWith(
      fetch(request).catch(()=>caches.match('./index.html'))
    );
    return;
  }

  if(!shellMatch(url)) return;

  event.respondWith(
    caches.match(request).then(cached=>cached || fetch(request).then(response=>{
      if(!response || response.status!==200 || response.type!=='basic') return response;
      const copy=response.clone();
      event.waitUntil(caches.open(CACHE).then(cache=>cache.put(request,copy)));
      return response;
    }))
  );
});
