const APP_VERSION = 'v2809_002';
const STATIC_CACHE = `static-${APP_VERSION}`;
const OFFLINE_URL = '/offline.html';

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
    caches.keys().then(keys => Promise.all(keys.map(k => k !== STATIC_CACHE ? caches.delete(k) : null)))
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
      } catch (e) {
        const cache = await caches.open(STATIC_CACHE);
        const cached = await cache.match('index.html');
        return cached || cache.match(OFFLINE_URL);
      }
    })());
    return;
  }
  event.respondWith((async () => {
    const cache = await caches.open(STATIC_CACHE);
    const cached = await cache.match(req);
    if (cached) return cached;
    const fresh = await fetch(req).catch(() => null);
    if (fresh && fresh.ok) cache.put(req, fresh.clone());
    return fresh || cache.match(OFFLINE_URL);
  })());
});