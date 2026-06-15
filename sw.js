const CACHE_NAME = 'bp-v3'; // Change v2 to v3const ASSETS = [
  'index.html',
  'style.css',
  'app.js',
  'manifest.json'
;

// Install the Service Worker
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
});

// Fetch assets from cache if offline
self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(response => response || fetch(e.request))
  );
});