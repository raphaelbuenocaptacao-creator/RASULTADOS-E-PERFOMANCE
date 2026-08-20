const CACHE='vt-hub-trimestral-v3';
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(c=>c.addAll(['./','index.html','dashboard-data.json','manifest.webmanifest'])));self.skipWaiting()});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));self.clients.claim()});
self.addEventListener('fetch',event=>{event.respondWith(fetch(event.request).then(r=>{const copy=r.clone();caches.open(CACHE).then(c=>c.put(event.request,copy));return r}).catch(()=>caches.match(event.request)))});
