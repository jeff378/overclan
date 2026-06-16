const CACHE_NAME = 'overclan-v1781200000';
const urlsToCache = ['/', '/find', '/ranking', '/battle', '/manifest.json'];

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
  const req = event.request;
  const isNavigation =
    req.mode === 'navigate' ||
    (req.method === 'GET' && req.headers.get('accept')?.includes('text/html'));

  // 항상 네트워크 우선 (온라인 시 항상 최신 유지)
  event.respondWith(
    fetch(req)
      .then(res => {
        // 성공한 네비게이션(HTML) 응답을 런타임 캐시에 저장
        if (isNavigation && res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(req, copy));
        }
        return res;
      })
      .catch(async () => {
        // 네트워크 실패 시: 해당 페이지 캐시 → 없으면 '/' 폴백
        const cached = await caches.match(req);
        if (cached) return cached;
        if (isNavigation) {
          const fallback = await caches.match('/');
          if (fallback) return fallback;
        }
        return Response.error();
      })
  );
});
