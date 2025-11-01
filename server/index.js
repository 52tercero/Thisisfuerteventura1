const express = require('express');
const cors = require('cors');
const { parseStringPromise } = require('xml2js');

const app = express();
app.use(cors());
// Minimal security headers (avoid extra deps)
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), camera=(), microphone=()');
  // Modern browsers ignore X-XSS-Protection; leaving it disabled to avoid false sense
  res.setHeader('X-XSS-Protection', '0');
  next();
});

// Simple in-memory rate limiting middleware for /api endpoints
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
    // Fail-open on limiter errors
  }
  next();
}

app.use('/api', rateLimit);

// Ensure a fetch implementation exists (Node 18+ provides global fetch).
// If not present, fall back to node-fetch v2 (CommonJS friendly).
let fetchImpl = globalThis.fetch;
if (!fetchImpl) {
  try {
    // node-fetch v2 exports a function via require
    // eslint-disable-next-line global-require
    fetchImpl = require('node-fetch');
    console.log('Using node-fetch fallback for fetch');
  } catch (e) {
    console.warn('No global fetch and node-fetch failed to load. fetch requests will fail.');
  }
}

// helper wrapper to use the chosen fetch implementation
async function fetchUrl(url, opts) {
  if (!fetchImpl) throw new Error('No fetch implementation available');
  return fetchImpl(url, opts);
}

// Simple in-memory cache with TTL (configurable via CACHE_TTL_MS env)
const CACHE_TTL_MS = Number(process.env.CACHE_TTL_MS || 15 * 60 * 1000); // default 15 minutes
const memoryCache = new Map(); // key -> { value, expires }

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
    // ignore cache failures
  }
}

// Fetch and parse a feed URL, returning normalized items. Uses in-memory cache.
async function fetchFeedItems(url, { bypassCache = false } = {}) {
  const cacheKey = `feed:${url}`;
  if (!bypassCache) {
    const cached = cacheGet(cacheKey);
    if (cached) {
      return cached;
    }
  }

  console.log('[RSS PROXY] Fetching:', url);
  const upstream = await fetchUrl(url);
  if (!upstream.ok) {
    console.warn(`[RSS PROXY] Upstream error for ${url}: status ${upstream.status}`);
    throw new Error(`upstream ${upstream.status}`);
  }

  const text = await upstream.text();
  console.log(`[RSS PROXY] Fetched ${url} (${text.length} chars)`);

  let parsed;
  try {
    parsed = await parseStringPromise(text, { explicitArray: false, mergeAttrs: true });
  } catch (e) {
    console.error(`[RSS PROXY] XML parse error for ${url}:`, e);
    throw new Error('parse-error');
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
    return { title, link, description, pubDate, raw: it };
  });

  cacheSet(cacheKey, normalized);
  return normalized;
}

// Allowed RSS sources (mirrors the demo sources in js/content-loader.js)
// Can be extended via the ALLOWED_SOURCES env var (comma-separated URLs).
const DEFAULT_ALLOWED = [
            'https://www.cabildofuer.es/cabildo/noticias/feed/',
            'https://www.radioinsular.es/feed/',
            'https://www.fuerteventuradigital.com/rss/',
            'https://www.diariodefuerteventura.com/rss.xml',
            'https://ondafuerteventura.es/feed/',
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
if (ALLOW_ALL) console.warn('ALERT: ALLOW_ALL is enabled - proxy will accept any URL. Do not enable in production.');

const PORT = process.env.PORT || 3000;

// Simple health endpoint
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Proxy endpoint: fetch RSS from allowed sources and return parsed JSON
// Example: /api/rss?url=https%3A%2F%2Fwww.canarias7.es%2Frss%2F2.0%2Fportada

app.get('/api/rss', async (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).json({ error: 'missing url query parameter' });

  try {
    let isAllowed = false;
    if (ALLOW_ALL) {
      isAllowed = true;
    } else {
      isAllowed = ALLOWED_SOURCES.some(s => url.startsWith(s));
    }

    if (!isAllowed) {
      console.warn('Blocked request to non-allowed source:', url);
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

// Aggregate endpoint: fetch multiple feeds server-side and return a single items list
// GET /api/aggregate?sources=url1,url2&dedupe=0
app.get('/api/aggregate', async (req, res) => {
  try {
    const querySources = (req.query.sources || '').toString();
    let sources = querySources
      ? querySources.split(',').map(s => s.trim()).filter(Boolean)
      : ALLOWED_SOURCES.slice();

    // Enforce allowlist unless ALLOW_ALL
    if (!ALLOW_ALL) {
      sources = sources.filter(src => ALLOWED_SOURCES.some(a => src.startsWith(a)));
    }

    if (sources.length === 0) {
      return res.json({ items: [] });
    }

    const noCache = req.query.noCache === '1' || req.query.noCache === 'true';
    const results = await Promise.all(sources.map(src => fetchFeedItems(src, { bypassCache: noCache })));
    let items = results.flat();

    const dedupe = req.query.dedupe === '1' || req.query.dedupe === 'true';
    if (dedupe) {
      const seen = new Set();
      items = items.filter(it => {
        const key = (it.link || it.title || '').trim();
        if (!key) return false;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    }

    res.json({ items });
  } catch (err) {
    console.error('[RSS PROXY] Aggregate error:', err);
    res.status(500).json({ error: 'aggregate failed', details: err.message });
  }
});

// Try to listen on the configured PORT, but if it's in use try higher ports up to a limit
function startServerOnPort(port, attemptsLeft = 10) {
  const serverInstance = app.listen(port, () => {
    console.log(`RSS proxy listening on http://localhost:${port}`);
  });

  serverInstance.on('error', (err) => {
    if (err && err.code === 'EADDRINUSE') {
      if (attemptsLeft > 0) {
        const nextPort = port + 1;
        console.warn(`Port ${port} is in use, trying port ${nextPort}...`);
        // give the OS a short moment
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
}

startServerOnPort(Number(PORT), 10);
