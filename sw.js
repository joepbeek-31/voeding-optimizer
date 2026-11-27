// Netwerk eerst, cache als terugval: updates komen direct door, offline blijft de app werken.
const CACHE = 'kindervoeding-v1';
const SHELL = ['./', 'index.html', 'styles.css', 'app.js', 'logic.js', 'guidelines.js', 'manifest.webmanifest', 'icons/icon-180.png'];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL))); self.skipWaiting(); });
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(fetch(e.request).then((r) => { const copy = r.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)); return r; })
    .catch(() => caches.match(e.request, { ignoreSearch: true })));
});
