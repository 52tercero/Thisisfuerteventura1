// Utilidad ligera de descubrimiento de proxy
// Expone window.discoverRSSProxy(options) -> Promise<string|null>
(function () {
  try {
    // Detect Netlify Functions availability without inline scripts (CSP-friendly)
    window.__RSS_PROXY_READY = new Promise((resolve) => {
      try {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), 1500);
        fetch('/.netlify/functions/aggregate', { signal: controller.signal, cache: 'no-store' })
          .then(async (r) => {
            try {
              const ctype = r.headers.get('content-type') || '';
              if (r.ok && ctype.includes('application/json')) {
                const data = await r.clone().json().catch(() => null);
                if (data && (Array.isArray(data.items) || data.items === undefined)) {
                  window.__RSS_PROXY_URL = '';
                  console.log('✓ Netlify Functions detectadas, usando rutas relativas');
                }
              }
            } catch (_) { /* ignore */ }
          })
          .catch(() => {})
          .finally(() => { clearTimeout(id); resolve(); });
      } catch (_) { resolve(); }
    });
  } catch (e) { /* ignore */ }
  async function probePort(port, timeout) {
    const url = `http://localhost:${port}/health`;
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), timeout);
      const res = await fetch(url, { signal: controller.signal, mode: 'cors', cache: 'no-store', targetAddressSpace: 'local' });
      clearTimeout(id);
      if (res && res.ok) return `http://localhost:${port}`;
    } catch (e) {
      // ignorar
    }
    return null;
  }

  async function discoverRSSProxy(opts) {
    const options = Object.assign({ startPort: 3000, endPort: 3010, timeout: 1200, cacheTTL: 5 * 60 * 1000 }, opts || {});
    const cacheKey = 'rss_proxy_discovery';

    try {
      const raw = localStorage.getItem(cacheKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.url && parsed.ts && Date.now() - parsed.ts < options.cacheTTL) {
          return parsed.url;
        }
      }
    } catch (e) {
      // ignorar errores de parseo
    }

    for (let p = options.startPort; p <= options.endPort; p++) {
      // probar secuencialmente para ser más amable con el sistema
      // cada prueba tiene su propio timeout
      // eslint-disable-next-line no-await-in-loop
      const result = await probePort(p, options.timeout);
      if (result) {
        try { localStorage.setItem(cacheKey, JSON.stringify({ url: result, ts: Date.now() })); } catch (e) { /* ignore */ }
        try { window.__RSS_PROXY_URL = result; console.log('✓ Proxy local detectado en', result); } catch(_) { /* ignore */ }
        return result;
      }
    }

    return null;
  }

  // Adjuntar a window
  if (!window.discoverRSSProxy) window.discoverRSSProxy = discoverRSSProxy;
})();
