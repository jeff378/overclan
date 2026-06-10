const CACHE_NAME = 'overclan-v1781109095';
const urlsToCache = ['/'];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  // 항상 네트워크 우선, 실패시 캐시
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
