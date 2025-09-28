
const APP_VERSION = 'v2809_004';
const STATIC_CACHE = `static-${APP_VERSION}`;
const OFFLINE_URL = 'offline.html';

const ASSETS = [
  './',
  'index.html',
  'style.css',
  'script.js',
  'offline.html',
  'manifest.webmanifest',
  'icon-192.png',
  'icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(STATIC_CACHE).then(cache => cache.addAll(ASSETS)));
  self.skipWaiting();
});
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== STATIC_CACHE).map(k => caches.delete(k))))
  );
  self.clients.claim();
});
self.addEventListener('fetch', event => {
  const req = event.request;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;

  if (req.mode === 'navigate' || req.destination === 'document') {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(req);
        const cache = await caches.open(STATIC_CACHE);
        cache.put('index.html', fresh.clone());
        return fresh;
      } catch(e) {
        const cache = await caches.open(STATIC_CACHE);
        return (await cache.match('index.html')) || cache.match(OFFLINE_URL);
      }
    })());
    return;
  }
  event.respondWith((async () => {
    const cache = await caches.open(STATIC_CACHE);
    const cached = await cache.match(req);
    if (cached) return cached;
    try {
      const fresh = await fetch(req);
      if (fresh && fresh.ok) cache.put(req, fresh.clone());
      return fresh;
    } catch(e) {
      if (req.destination === 'document') return cache.match(OFFLINE_URL);
      throw e;
    }
  })());
});
