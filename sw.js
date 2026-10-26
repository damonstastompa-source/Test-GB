// My God Box v2.0.1 development cache cleanup.
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',event=>event.waitUntil((async()=>{const keys=await caches.keys();await Promise.all(keys.map(k=>caches.delete(k)));await self.registration.unregister();const clients=await self.clients.matchAll({type:'window',includeUncontrolled:true});clients.forEach(c=>c.navigate(c.url));})()));
