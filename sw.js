// Service Worker con estrategia segura (network-first para documentos) para evitar contenido obsoleto
const SW_VERSION = 'v3';
const APP_CACHE = `app-${SW_VERSION}`;

const PRECACHE = [
  '/',
  '/index.html',
  '/noticias.html',
  '/css/styles.css',
  '/images/logo.jpg'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(APP_CACHE).then(cache => cache.addAll(PRECACHE)).catch(() => {})
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== APP_CACHE).map(k => caches.delete(k))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  if (req.method !== 'GET') return;

  // Nunca cachear /api
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(fetch(req));
    return;
  }

  // Documentos/navegación: network-first
  if (req.mode === 'navigate' || req.destination === 'document') {
    event.respondWith(
      fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(APP_CACHE).then(c => c.put(req, copy));
        return res;
      }).catch(() => caches.match(req))
    );
    return;
  }

  // JS/CSS: stale-while-revalidate
  if (req.destination === 'script' || req.destination === 'style') {
    event.respondWith(
      caches.match(req).then((cached) => {
        const fetchPromise = fetch(req).then((res) => {
          const copy = res.clone();
          caches.open(APP_CACHE).then(c => c.put(req, copy));
          return res;
        }).catch(() => cached);
        return cached || fetchPromise;
      })
    );
    return;
  }

  // Imágenes: cache-first, fallback a logo
  if (req.destination === 'image') {
    event.respondWith(
      caches.match(req).then((cached) => (
        cached || fetch(req).then((res) => {
          const copy = res.clone();
          caches.open(APP_CACHE).then(c => c.put(req, copy));
          return res;
        }).catch(() => caches.match('/images/logo.jpg'))
      ))
    );
    return;
  }

  // Otros: cache, luego red
  event.respondWith(
    caches.match(req).then((cached) => cached || fetch(req))
  );
});
