const VERSION = 'v11-app-2.2.0-20261028';
const STATIC = `taller-tech-${VERSION}-static`;
const PAGES = `taller-tech-${VERSION}-pages`;
const RUNTIME = `taller-tech-${VERSION}-runtime`;
const APP_SHELL = [
  '/offline.html', '/shared/manifest.json', '/shared/css/app-theme.css', '/shared/css/messages.css', '/shared/css/offline-status.css',
  '/shared/js/config.js', '/shared/js/pwa-register.js', '/shared/js/messages.js', '/shared/js/data/offline-store.js', '/shared/js/data/data-service.js', '/shared/js/request-cache.js', '/shared/js/offline-status.js',
  '/shared/icons/icon-192.png', '/shared/icons/icon-512.png', '/login/index.html', '/modules/authentication/style.css', '/modules/authentication/app.js',
  '/modules/servicio-tecnico/pages/dashboard.html', '/modules/servicio-tecnico/pages/fill.html', '/modules/servicio-tecnico/pages/table.html',
  '/modules/registro-servicios/index.html', '/modules/registro-servicios/app.js', '/modules/registro-servicios/style.css',
  '/modules/admin-panel/index.html', '/modules/admin-panel/app.js', '/modules/admin-panel/style.css',
  '/modules/servicio-tecnico/calculadora/index.html', '/modules/servicio-tecnico/calculadora/app.js', '/modules/servicio-tecnico/calculadora/style.css',
  '/modules/tienda/pages/tienda.html', '/modules/tienda/js/tienda.js', '/shared/css/styles.css', '/shared/css/shared-theme.css'
];

self.addEventListener('install', (event) => event.waitUntil(caches.open(STATIC).then((cache) => cache.addAll(APP_SHELL))));
self.addEventListener('activate', (event) => event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => ![STATIC, PAGES, RUNTIME].includes(key)).map((key) => caches.delete(key)))).then(() => self.clients.claim())));
self.addEventListener('message', (event) => { if (event.data?.type === 'SKIP_WAITING') self.skipWaiting(); });

function cacheResponse(event, request, cacheName, response) {
  const cacheWrite = response.then(
    (networkResponse) => {
      if (!networkResponse?.ok) return;

      const cachedResponse = networkResponse.clone();
      return caches.open(cacheName)
        .then((cache) => cache.put(request, cachedResponse))
        .catch((error) => {
          console.warn('[PWA] No se pudo guardar la respuesta en caché:', error);
        });
    },
    () => undefined
  );

  event.waitUntil(cacheWrite);
}

function networkFirst(event, request, cacheName, fallback) {
  const networkResponse = fetch(request);
  cacheResponse(event, request, cacheName, networkResponse);

  return networkResponse.catch(async () => (
    (await caches.match(request)) ||
    (fallback && await caches.match(fallback)) ||
    Response.error()
  ));
}

function staleWhileRevalidate(event, request) {
  const cachedResponse = caches.match(request);
  const networkResponse = fetch(request);
  cacheResponse(event, request, RUNTIME, networkResponse);

  return cachedResponse.then((cached) => {
    if (cached) return cached;
    return networkResponse.catch(() => Response.error());
  });
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // CDN no es requisito de arranque offline.
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/data/')) return; // DataService usa IndexedDB; no cachear datos autenticados en Cache Storage.
  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(event, request, PAGES, '/offline.html'));
    return;
  }
  if (/\.(?:js|css|png|svg|woff2?|json)$/i.test(url.pathname)) {
    event.respondWith(staleWhileRevalidate(event, request));
    return;
  }
  event.respondWith(networkFirst(event, request, RUNTIME));
});
self.addEventListener('sync', (event) => { if (event.tag === 'taller-tech-sync') event.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => clients.forEach((client) => client.postMessage({ type: 'REQUEST_SYNC' })))); });
