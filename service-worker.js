/* Flat, cache-first service worker for GH Pages */
const CACHE_NAME = 'calc-cache-v002';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)).then(self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.map(k => k === CACHE_NAME ? null : caches.delete(k)))),
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const req = event.request;
  event.respondWith(
    caches.match(req).then(cached => cached || fetch(req).then(resp => {
      const copy = resp.clone();
      if (req.method === 'GET' && resp.status === 200 && !req.url.startsWith('chrome-extension')) {
        caches.open(CACHE_NAME).then(cache => cache.put(req, copy)).catch(()=>{});
      }
      return resp;
    }).catch(() => caches.match('./index.html')))
  );
});
