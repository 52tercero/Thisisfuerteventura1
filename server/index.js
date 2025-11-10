const express = require('express');
const cors = require('cors');
const { parseStringPromise } = require('xml2js');

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('[FATAL] Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('[FATAL] Uncaught Exception:', error);
  process.exit(1);
});

// Intentar cargar FeedParser si está disponible (opcional)
let FeedParser = null;
let Readable = null;
try {
  FeedParser = require('feedparser');
  ({ Readable } = require('stream'));
  console.log('[RSS PROXY] FeedParser habilitado');
} catch (_) {
  console.log('[RSS PROXY] FeedParser no instalado, usando xml2js');
}

const app = express();
app.use(cors());
// Cabeceras de seguridad mínimas (sin dependencias adicionales)
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), camera=(), microphone=()');
  // Los navegadores modernos ignoran X-XSS-Protection; se deshabilita para evitar falsa sensación de seguridad
  res.setHeader('X-XSS-Protection', '0');
  next();
});

// Middleware simple de limitación de tasa en memoria para endpoints /api
const RATE_LIMIT_WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS || 60_000);
const RATE_LIMIT_MAX = Number(process.env.RATE_LIMIT_MAX || 120);
const rateBuckets = new Map(); // ip -> { count, resetAt }

function rateLimit(req, res, next) {
  try {
    const now = Date.now();
    const key = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown';
    let bucket = rateBuckets.get(key);
    if (!bucket || now > bucket.resetAt) {
      bucket = { count: 0, resetAt: now + RATE_LIMIT_WINDOW_MS };
      rateBuckets.set(key, bucket);
    }
    bucket.count += 1;
    const remaining = Math.max(RATE_LIMIT_MAX - bucket.count, 0);
    res.setHeader('X-RateLimit-Limit', RATE_LIMIT_MAX.toString());
    res.setHeader('X-RateLimit-Remaining', remaining.toString());
    res.setHeader('X-RateLimit-Reset', Math.floor(bucket.resetAt / 1000).toString());
    if (bucket.count > RATE_LIMIT_MAX) {
      return res.status(429).json({ error: 'rate_limited', retry_after: Math.ceil((bucket.resetAt - now) / 1000) });
    }
  } catch (_) {
    // Fallo abierto en caso de error del limitador
  }
  next();
}

app.use('/api', rateLimit);

// Asegurar que exista una implementación de fetch (Node 18+ provee fetch global).
// Si no está presente, usar node-fetch v2 (compatible con CommonJS).
let fetchImpl = globalThis.fetch;
const FETCH_TIMEOUT_MS = Number(process.env.FETCH_TIMEOUT_MS || 8000);
if (!fetchImpl) {
  try {
    // node-fetch v2 exporta una función via require
    // eslint-disable-next-line global-require
    fetchImpl = require('node-fetch');
    console.log('Usando fallback node-fetch para fetch');
  } catch (e) {
    console.warn('No hay fetch global y node-fetch falló al cargar. Las peticiones fetch fallarán.');
  }
}

// función auxiliar para usar la implementación de fetch elegida
async function fetchUrl(url, opts) {
  if (!fetchImpl) throw new Error('No fetch implementation available');
  const hasSignal = opts && opts.signal;
  if (hasSignal) {
    return fetchImpl(url, opts);
  }
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const nextOpts = Object.assign({}, opts || {}, { signal: controller.signal });
    return await fetchImpl(url, nextOpts);
  } finally {
    clearTimeout(id);
  }
}

// Caché simple en memoria con TTL (configurable vía env CACHE_TTL_MS)
const CACHE_TTL_MS = Number(process.env.CACHE_TTL_MS || 15 * 60 * 1000); // por defecto 15 minutos
const memoryCache = new Map(); // clave -> { value, expires }

function cacheGet(key) {
  try {
    const entry = memoryCache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expires) {
      memoryCache.delete(key);
      return null;
    }
    return entry.value;
  } catch (_) {
    return null;
  }
}

function cacheSet(key, value, ttl = CACHE_TTL_MS) {
  try {
    memoryCache.set(key, { value, expires: Date.now() + ttl });
  } catch (_) {
    // ignorar fallos de caché
  }
}

// Intentar descubrir URL de feed (RSS/Atom) a partir de una página HTML
function discoverFeedFromHtml(html, baseUrl) {
  try {
    if (!html) return null;
    const linkTags = html.match(/<link[^>]+>/gi) || [];
    for (const tag of linkTags) {
      const hasAlternate = /rel=["']([^"']*\balternate\b[^"']*)["']/i.test(tag);
      if (!hasAlternate) continue;
      const typeMatch = tag.match(/type=["']([^"']+)["']/i);
      const type = typeMatch ? typeMatch[1].toLowerCase() : '';
      if (!(type.includes('rss+xml') || type.includes('atom+xml') || type.includes('xml'))) continue;
      const hrefMatch = tag.match(/href=["']([^"']+)["']/i);
      if (hrefMatch && hrefMatch[1]) {
        const abs = new URL(hrefMatch[1], baseUrl).href;
        return abs;
      }
    }
    return null;
  } catch (_) {
    return null;
  }
}

// Parseo con FeedParser (si está disponible). Devuelve items crudos del parser.
function parseWithFeedParser(text) {
  return new Promise((resolve, reject) => {
    if (!FeedParser || !Readable) return resolve(null);
    try {
      const feedparser = new FeedParser();
      const items = [];
      feedparser.on('error', (err) => reject(err));
      feedparser.on('readable', function onReadable() {
        let item;
        // eslint-disable-next-line no-cond-assign
        while (item = this.read()) {
          items.push(item);
        }
      });
      feedparser.on('end', () => resolve(items));
      Readable.from([text]).pipe(feedparser);
    } catch (e) {
      resolve(null);
    }
  });
}

// Obtener y parsear una URL de feed, devolviendo items normalizados. Usa caché en memoria.
async function fetchFeedItems(url, { bypassCache = false, _triedDiscovery = false } = {}) {
  try {
    const cacheKey = `feed:${url}`;
    if (!bypassCache) {
      const cached = cacheGet(cacheKey);
      if (cached) {
        return cached;
      }
    }

    console.log('[RSS PROXY] Fetching:', url);
    const upstream = await fetchUrl(url, { headers: { 'User-Agent': 'FuerteventuraRSSProxy/1.0 (+https://example.local)' } });
    if (!upstream.ok) {
      console.warn(`[RSS PROXY] Upstream error for ${url}: status ${upstream.status}`);
      return [];
    }

  const text = await upstream.text();
  console.log(`[RSS PROXY] Fetched ${url} (${text.length} chars)`);
  const ctype = (upstream.headers && upstream.headers.get && (upstream.headers.get('content-type') || '')) || '';

  let parsed;
  try {
    // Si parece HTML, intentar descubrir el feed real primero
    if (ctype.includes('text/html') && !_triedDiscovery) {
      const discovered = discoverFeedFromHtml(text, url);
      if (discovered && discovered !== url) {
        console.log(`[RSS PROXY] Discovered feed for ${url}: ${discovered}`);
        const items = await fetchFeedItems(discovered, { bypassCache, _triedDiscovery: true });
        // Alias de caché: cachear también bajo la clave original
        cacheSet(cacheKey, items);
        return items;
      }
    }

    // Intentar primero con FeedParser si está disponible
    const fpItems = await parseWithFeedParser(text);
    if (Array.isArray(fpItems) && fpItems.length > 0) {
      const normalizedFP = fpItems.map(it => {
        const title = it.title || '';
        const link = it.link || it.origlink || '';
        const description = it.description || it.summary || it['content:encoded'] || '';
        // FeedParser can return both 'pubdate' and 'pubDate', use explicit camelCase
        const pubDate = it.pubDate || it.pubdate || it.date || '';
        
        // Extraer imagen de FeedParser (tiene mejor soporte de media)
        let image = it.image?.url || it.enclosures?.[0]?.url || '';
        
        // Preservar solo campos necesarios para extracción en cliente (sin duplicar pubdate/pubDate)
        const rawClean = {
          title: it.title,
          link: it.link,
          description: it.description,
          enclosure: it.enclosures?.[0],
          'media:content': it['media:content'],
          'media:thumbnail': it['media:thumbnail'],
          'media:group': it['media:group']
        };
        
        return { 
          title, 
          link, 
          description, 
          pubDate,  // Always camelCase
          image,
          raw: rawClean
        };
      });
      cacheSet(cacheKey, normalizedFP);
      return normalizedFP;
    }

    // Fallback a xml2js
    parsed = await parseStringPromise(text, { explicitArray: false, mergeAttrs: true });
  } catch (e) {
    // Si falló el parseo de XML, intentar descubrimiento si aún no se intentó
    if (!_triedDiscovery) {
      const discovered = discoverFeedFromHtml(text, url) || (url.endsWith('/') ? url + 'feed' : (url + '/feed'));
      if (discovered && discovered !== url) {
        try {
          console.log(`[RSS PROXY] XML parse failed; trying discovered/conventional feed for ${url}: ${discovered}`);
          const items = await fetchFeedItems(discovered, { bypassCache, _triedDiscovery: true });
          cacheSet(cacheKey, items);
          return items;
        } catch (e2) {
          console.warn(`[RSS PROXY] Discovery fallback also failed for ${url}:`, e2 && e2.message);
        }
      }
    }
    console.error(`[RSS PROXY] XML parse error for ${url}:`, e.message || e);
    // Return empty array instead of throwing to prevent cascade failures
    return [];
  }

  let channel = parsed.rss && parsed.rss.channel ? parsed.rss.channel : parsed.feed || parsed;
  let items = channel && (channel.item || channel.entry) ? (channel.item || channel.entry) : [];
  if (!Array.isArray(items)) items = [items];

  console.log(`[RSS PROXY] ${url} -> ${items.length} items`);

  const normalized = items.map(it => {
    const title = it.title && (typeof it.title === 'object' ? (it.title._ || it.title) : it.title) || '';
    const link = it.link && (typeof it.link === 'object' ? (it.link.href || it.link._ || it.link) : it.link) || '';
    const description = it.description || it.summary || it.content || '';
    const pubDate = it.pubDate || it.published || it.updated || '';
    
    // Intentar extraer imagen desde varios campos comunes
    let image = '';
    if (it.image && typeof it.image === 'string') image = it.image;
    else if (it.image && it.image.url) image = it.image.url;
    else if (it.enclosure && typeof it.enclosure === 'object' && it.enclosure.url) image = it.enclosure.url;
    else if (it['media:content'] && it['media:content'].url) image = it['media:content'].url;
    else if (it['media:thumbnail'] && it['media:thumbnail'].url) image = it['media:thumbnail'].url;
    
    return { title, link, description, pubDate, image, raw: it };
  });

  cacheSet(cacheKey, normalized);
  return normalized;
  } catch (err) {
    console.error(`[RSS PROXY] Fatal error in fetchFeedItems for ${url}:`, err.message || err);
    return [];
  }
}

// Fuentes permitidas por prefijo (base de dominio). Más seguras para descubrimiento de feeds.
// Se puede extender mediante la variable de entorno ALLOWED_SOURCES (URLs separadas por comas).
const DEFAULT_ALLOWED = [
  'https://rss.app',
];

let ALLOWED_SOURCES = DEFAULT_ALLOWED.slice();
if (process.env.ALLOWED_SOURCES) {
  try {
    const extras = process.env.ALLOWED_SOURCES.split(',').map(s => s.trim()).filter(Boolean);
    ALLOWED_SOURCES = ALLOWED_SOURCES.concat(extras);
  } catch (e) {
    console.warn('Failed to parse ALLOWED_SOURCES env var, using defaults');
  }
}

const ALLOW_ALL = process.env.ALLOW_ALL === '1' || process.env.ALLOW_ALL === 'true';
if (ALLOW_ALL) console.warn('ALERTA: ALLOW_ALL está habilitado - el proxy aceptará cualquier URL. No habilitar en producción.');

const PORT = process.env.PORT || 3000;

// Endpoint simple de salud
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Endpoint básico de mareas (mock)
// GET /api/tides?lat=28.5&lon=-13.86
// Devuelve 4 eventos (2 pleamares/2 bajamares) próximos con hora local y altura aproximada.
app.get('/api/tides', (req, res) => {
  try {
    const lat = parseFloat(req.query.lat);
    const lon = parseFloat(req.query.lon);
    if (!isFinite(lat) || !isFinite(lon)) {
      return res.status(400).json({ error: 'missing or invalid lat/lon' });
    }
    const cacheKey = `tides:${lat.toFixed(3)}:${lon.toFixed(3)}`;
    const cached = cacheGet(cacheKey);
    if (cached) return res.json(cached);

    // Generar horarios de mareas sintéticos basados en la fecha actual.
    // Patrón simple: cada ~6h alternando pleamar/bajamar.
    const now = new Date();
    const base = new Date(now);
    base.setMinutes(0,0,0);
    // Desfase pseudoaleatorio según coordenadas para que no coincida siempre a las en punto
    const offsetMin = Math.floor(((lat + lon) % 1) * 60);
    base.setMinutes(offsetMin);

    const events = [];
    for (let i = 1; i <= 4; i++) {
      const t = new Date(base.getTime() + i * 6 * 60 * 60 * 1000); // cada 6h
      const type = i % 2 === 0 ? 'bajamar' : 'pleamar';
      // altura aprox (m) según tipo, con leve variación
      const height = type === 'pleamar' ? (1.6 + (i % 3) * 0.1) : (0.4 + (i % 3) * 0.1);
      events.push({
        type,
        time: t.toISOString(),
        height: Number(height.toFixed(2))
      });
    }

    const payload = { lat, lon, generated: now.toISOString(), events };
    // Cache corto (30 min) para evitar cambios excesivos en mock
    cacheSet(cacheKey, payload, 30 * 60 * 1000);
    res.json(payload);
  } catch (e) {
    console.error('[TIDES] Error generating mock tides:', e && e.message);
    res.status(500).json({ error: 'tides_failed' });
  }
});

// Endpoint de proxy: obtiene RSS de fuentes permitidas y devuelve JSON parseado
// Ejemplo: /api/rss?url=https%3A%2F%2Fwww.canarias7.es%2Frss%2F2.0%2Fportada
app.get('/api/rss', async (req, res) => {
  const url = req.query.url;
  
  // Validar que se proporcione una URL
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'missing or invalid url query parameter' });
  }

  // Validar formato básico de URL
  try {
    new URL(url);
  } catch (e) {
    return res.status(400).json({ error: 'invalid url format' });
  }

  try {
    let isAllowed = false;
    if (ALLOW_ALL) {
      isAllowed = true;
    } else {
      isAllowed = ALLOWED_SOURCES.some(s => url.startsWith(s));
    }

    if (!isAllowed) {
      console.warn('[RSS PROXY] Blocked request to non-allowed source:', url);
      return res.status(403).json({ error: 'source not allowed', allowed: ALLOWED_SOURCES });
    }

    const noCache = req.query.noCache === '1' || req.query.noCache === 'true';
    const items = await fetchFeedItems(url, { bypassCache: noCache });
    res.json({ items });
  } catch (err) {
    console.error('[RSS PROXY] Error proxying RSS:', err);
    res.status(500).json({ error: 'failed to fetch or parse feed', details: err.message });
  }
});

// Endpoint agregado: obtiene múltiples feeds en el servidor y devuelve una lista única de items (dedupe avanzado siempre activo)
// GET /api/aggregate?sources=url1,url2
app.get('/api/aggregate', async (req, res) => {
  try {
    const querySources = (req.query.sources || '').toString();
    let sources = querySources
      ? querySources.split(',').map(s => s.trim()).filter(Boolean)
      : ALLOWED_SOURCES.slice();

    // Aplicar lista permitida a menos que ALLOW_ALL esté habilitado
    if (!ALLOW_ALL) {
      sources = sources.filter(src => ALLOWED_SOURCES.some(a => src.startsWith(a)));
    }

    if (sources.length === 0) {
      return res.json({ items: [] });
    }

    const noCache = req.query.noCache === '1' || req.query.noCache === 'true';
    // Use Promise.allSettled to handle individual feed failures gracefully
    const results = await Promise.allSettled(sources.map(src => fetchFeedItems(src, { bypassCache: noCache })));
    let items = results
      .filter(r => r.status === 'fulfilled')
      .map(r => r.value)
      .flat();

    const beforeCount = items.length;

    // Normalizar enlace (quitar parámetros de tracking, hash, trailing slash, variantes AMP)
    const normalizeLink = (u) => {
      if (!u || typeof u !== 'string') return '';
      try {
        const url = new URL(u);
        url.hash = '';
        const params = url.searchParams;
        ['utm_source','utm_medium','utm_campaign','utm_term','utm_content','gclid','fbclid'].forEach(k => params.delete(k));
        url.search = params.toString();
        url.pathname = url.pathname
          .replace(/\/amp(\/)?$/i, '/')
          .replace(/\/+$/, '/');
        return url.toString();
      } catch (_) {
        return String(u);
      }
    };

    // Dedupe siempre activo: por link normalizado o título sin acentos (sin fecha para ser más agresivo)
    const seen = new Set();
    const deduped = [];
    for (const it of items) {
      const linkKey = normalizeLink(it.link || it.url || '');
      const titleRaw = (it.title || '').toString();
      const titleCanonical = titleRaw
        .normalize('NFD').replace(/[\u0300-\u036f]/g,'') // quitar acentos
        .toLowerCase().replace(/["'«»]/g,'')
        .replace(/\s+/g,' ') // colapsar espacios
        .replace(/\s+[-–|]\s+.*$/,'') // quitar sufijos de fuente tras guión / barra
        .trim();
      
      // Usar solo título canónico como clave si no hay link
      // NO usar fecha para permitir detectar duplicados con fechas ligeramente diferentes
      const key = linkKey || titleCanonical;
      
      if (!key) continue;
      if (seen.has(key)) {
        console.log('[RSS PROXY] Skipping duplicate:', titleRaw.substring(0, 60));
        continue;
      }
      seen.add(key);
      deduped.push(it);
    }

    items = deduped;
    const afterCount = items.length;
    console.log(`[RSS PROXY] Aggregate dedupe: ${beforeCount} -> ${afterCount} items (fuentes: ${sources.length})`);

    res.json({ items });
  } catch (err) {
    console.error('[RSS PROXY] Aggregate error:', err);
    res.status(500).json({ error: 'aggregate failed', details: err.message });
  }
});

// Intentar escuchar en el puerto configurado, pero si está en uso probar puertos superiores hasta un límite
function startServerOnPort(port, attemptsLeft = 10) {
  const serverInstance = app.listen(port, () => {
    console.log(`RSS proxy listening on http://localhost:${port}`);
    console.log('[SERVER] Server is ready to accept connections');
  });

  serverInstance.on('error', (err) => {
    console.error('[SERVER] Server error event:', err);
    if (err && err.code === 'EADDRINUSE') {
      if (attemptsLeft > 0) {
        const nextPort = port + 1;
        console.warn(`Port ${port} is in use, trying port ${nextPort}...`);
        // dar un momento breve al sistema operativo
        setTimeout(() => startServerOnPort(nextPort, attemptsLeft - 1), 200);
      } else {
        console.error(`Ports ${port - 9}..${port} are all in use. Set a different PORT environment variable or stop the process using those ports.`);
        process.exit(1);
      }
    } else {
      console.error('Server error:', err);
      process.exit(1);
    }
  });

  serverInstance.on('close', () => {
    console.log('[SERVER] Server closed');
  });

  // Keep the process alive
  setInterval(() => {
    console.log('[SERVER] Heartbeat - server still running');
  }, 10000);
}

if (require.main === module) {
  console.log('[SERVER] Starting server as main module');
  startServerOnPort(Number(PORT), 10);
  console.log('[SERVER] startServerOnPort called');
} else {
  console.log('[SERVER] Loaded as a module, not starting server');
}

module.exports = { app };
