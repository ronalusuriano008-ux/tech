const CACHE_NAME = 'taller-tech-pwa-v3';
const STATIC_CACHE = `${CACHE_NAME}-static`;
const PAGE_CACHE = `${CACHE_NAME}-pages`;
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/login/index.html',
  '/login/style.css',
  '/css/styles.css',
  '/css/app-theme.css',
  '/js/config.js',
  '/js/pwa-register.js',
  '/js/app.js',
  '/js/api.js',
  '/js/calculations.js',
  '/manifest.json',
  '/icons/icon-192.svg',
  '/icons/icon-512.svg',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/offline.html'
];

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys
        .filter(k => ![STATIC_CACHE, PAGE_CACHE].includes(k))
        .map(k => caches.delete(k))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  const isSameOrigin = url.origin === self.location.origin;

  if (!isSameOrigin) {
    return;
  }

  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/data/')) {
    event.respondWith(fetch(event.request));
    return;
  }

  const requestMode = event.request.mode;
  const isNavigation = requestMode === 'navigate' || event.request.headers.get('accept')?.includes('text/html');

  if (isNavigation) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.ok) {
            const clone = response.clone();
            caches.open(PAGE_CACHE).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(event.request);
          return cached || caches.match('/offline.html');
        })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (!response || response.status !== 200 || response.type === 'opaque') return response;
        const respClone = response.clone();
        caches.open(STATIC_CACHE).then((cache) => cache.put(event.request, respClone));
        return response;
      }).catch(() => caches.match('/offline.html'));
    })
  );
});
