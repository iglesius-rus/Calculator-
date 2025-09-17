
const CACHE = 'calc-pwa-v5';
const ASSETS = [
  './', './index.html', './calc.html', './style.css?v=pwa028', './script.js?v=pwa028',
  './offline.html', './manifest.webmanifest', './icon-192.png', './icon-512.png'
];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS))); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(keys=>Promise.all(keys.map(k=>{ if(k!==CACHE) return caches.delete(k); })))); });
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).catch(()=>caches.match('./calc.html').then(r=>r||caches.match('./offline.html'))));
    return;
  }
  e.respondWith(caches.match(req).then(r => r || fetch(req).then(fr => { const cp=fr.clone(); caches.open(CACHE).then(c=>c.put(req, cp)); return fr; })).catch(()=>caches.match('./offline.html')));
});
