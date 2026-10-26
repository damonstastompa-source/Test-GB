// My God Box service-worker cleanup for v3.0.1
// The worker clears older caches and unregisters itself so GitHub Pages serves the current files.
const VERSION='3.0.1';
const CACHE_NAME=`my-god-box-v${VERSION}`;
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => event.waitUntil((async () => {
  const keys = await caches.keys();
  await Promise.all(keys.map(k => caches.delete(k)));
  await self.registration.unregister();
  const clients = await self.clients.matchAll({type:'window', includeUncontrolled:true});
  clients.forEach(client => client.navigate(client.url));
})()));
