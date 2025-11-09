// Service Worker con estrategia segura (network-first para documentos) para evitar contenido obsoleto
const SW_VERSION = 'v8';
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

  // Nunca cachear /api – si la red falla, responder JSON de error (evita promesas rechazadas)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith((async () => {
      try {
        return await fetch(req);
      } catch (e) {
        return new Response(JSON.stringify({ error: 'offline' }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    })());
    return;
  }

  // Documentos/navegación: network-first con fallbacks válidos
  if (req.mode === 'navigate' || req.destination === 'document') {
    event.respondWith((async () => {
      try {
        const res = await fetch(req);
        const copy = res.clone();
        const c = await caches.open(APP_CACHE);
        c.put(req, copy);
        return res;
      } catch (e) {
        return (await caches.match(req))
            || (await caches.match('/'))
            || new Response('<h1>Offline</h1>', { status: 503, headers: { 'Content-Type': 'text/html' } });
      }
    })());
    return;
  }

  // JS: Nunca cachear archivos JavaScript - siempre ir a la red
  if (req.destination === 'script') {
    event.respondWith(fetch(req));
    return;
  }

  // CSS: network-first para estilos
  if (req.destination === 'style') {
    event.respondWith((async () => {
      try {
        const res = await fetch(req);
        if (res.ok) {
          const copy = res.clone();
          const c = await caches.open(APP_CACHE);
          c.put(req, copy);
        }
        return res;
      } catch (e) {
        const cached = await caches.match(req);
        return cached || new Response('', { status: 504 });
      }
    })());
    return;
  }

  // Imágenes: cache-first, fallback a logo (también para 404 del origen)
  if (req.destination === 'image') {
    event.respondWith((async () => {
      const cached = await caches.match(req);
      if (cached) return cached;
      try {
        const res = await fetch(req);
        if (!res.ok) return (await caches.match('/images/logo.jpg')) || new Response('', { status: 404 });
        const copy = res.clone();
        const c = await caches.open(APP_CACHE);
        c.put(req, copy);
        return res;
      } catch (e) {
        return (await caches.match('/images/logo.jpg')) || new Response('', { status: 504 });
      }
    })());
    return;
  }

  // Otros: cache, luego red; si todo falla, 504 vacío (siempre Response válida)
  event.respondWith((async () => {
    const cached = await caches.match(req);
    if (cached) return cached;
    try {
      return await fetch(req);
    } catch (e) {
      return new Response('', { status: 504 });
    }
  })());
});
