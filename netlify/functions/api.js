// Netlify Function: unified API proxy for RSS/newsdata
// Exposes the following paths under /.netlify/functions/api/*
// - /health
// - /api/rss?url=...
// - /api/aggregate?sources=url1,url2&dedupe=1
// - /api/newsdata?q=fuerteventura&country=es&language=es

const { parseStringPromise } = require('xml2js');

// Simple in-memory cache (persists while the function instance stays warm)
const CACHE_TTL_MS = Number(process.env.CACHE_TTL_MS || 15 * 60 * 1000);
const memoryCache = new Map(); // key -> { value, expires }

function cacheGet(key) {
  const entry = memoryCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expires) { memoryCache.delete(key); return null; }
  return entry.value;
}
function cacheSet(key, value, ttl = CACHE_TTL_MS) {
  memoryCache.set(key, { value, expires: Date.now() + ttl });
}

// Allowed sources (prefix match)
const DEFAULT_ALLOWED = [
  'https://www.canarias7.es',
  'https://www.laprovincia.es',
  'https://www.cabildofuer.es',
  'https://www.radioinsular.es',
  'https://www.fuerteventuradigital.com',
  'https://ondafuerteventura.es',
];

let ALLOWED_SOURCES = DEFAULT_ALLOWED.slice();
if (process.env.ALLOWED_SOURCES) {
  try {
    const extras = process.env.ALLOWED_SOURCES
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);
    ALLOWED_SOURCES = ALLOWED_SOURCES.concat(extras);
  } catch (_) {}
}
const ALLOW_ALL = process.env.ALLOW_ALL === '1' || process.env.ALLOW_ALL === 'true';

// Helpers
function jsonResponse(statusCode, data, extraHeaders = {}) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      ...extraHeaders,
    },
    body: JSON.stringify(data),
  };
}

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

async function fetchFeedItems(url, { bypassCache = false, _triedDiscovery = false } = {}) {
  try {
    const cacheKey = `feed:${url}`;
    if (!bypassCache) {
      const cached = cacheGet(cacheKey);
      if (cached) return cached;
    }

    const upstream = await fetch(url, {
      headers: { 'User-Agent': 'FuerteventuraRSSProxy/1.0 (+https://example.local)' },
    });
    if (!upstream.ok) {
      return [];
    }
    const text = await upstream.text();
    const ctype = (upstream.headers && upstream.headers.get && (upstream.headers.get('content-type') || '')) || '';

    let parsed;
    try {
      if (ctype.includes('text/html') && !_triedDiscovery) {
        const discovered = discoverFeedFromHtml(text, url);
        if (discovered && discovered !== url) {
          const items = await fetchFeedItems(discovered, { bypassCache, _triedDiscovery: true });
          cacheSet(cacheKey, items);
          return items;
        }
      }
      parsed = await parseStringPromise(text, { explicitArray: false, mergeAttrs: true });
    } catch (e) {
      if (!_triedDiscovery) {
        const discovered = discoverFeedFromHtml(text, url) || (url.endsWith('/') ? url + 'feed' : url + '/feed');
        if (discovered && discovered !== url) {
          try {
            const items = await fetchFeedItems(discovered, { bypassCache, _triedDiscovery: true });
            cacheSet(cacheKey, items);
            return items;
          } catch (_) {}
        }
      }
      return [];
    }

    let channel = parsed.rss && parsed.rss.channel ? parsed.rss.channel : parsed.feed || parsed;
    let items = channel && (channel.item || channel.entry) ? (channel.item || channel.entry) : [];
    if (!Array.isArray(items)) items = [items];

    const normalized = items.map(it => {
      const title = it.title && (typeof it.title === 'object' ? (it.title._ || it.title) : it.title) || '';
      const link = it.link && (typeof it.link === 'object' ? (it.link.href || it.link._ || it.link) : it.link) || '';
      const description = it.description || it.summary || it.content || '';
      const pubDate = it.pubDate || it.published || it.updated || '';

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
  } catch (_) {
    return [];
  }
}

exports.handler = async (event) => {
  try {
    const path = event.path || '';
    const q = event.queryStringParameters || {};

    // Health
    if (path.endsWith('/health') || path.endsWith('/api/health')) {
      return jsonResponse(200, { status: 'ok' });
    }

    // /api/rss
    if (path.includes('/api/rss')) {
      const url = q.url;
      if (!url) return jsonResponse(400, { error: 'missing url query parameter' });
      let isAllowed = ALLOW_ALL || ALLOWED_SOURCES.some(s => url.startsWith(s));
      if (!isAllowed) return jsonResponse(403, { error: 'source not allowed', allowed: ALLOWED_SOURCES });

      const noCache = q.noCache === '1' || q.noCache === 'true';
      const items = await fetchFeedItems(url, { bypassCache: noCache });
      return jsonResponse(200, { items });
    }

    // /api/aggregate
    if (path.includes('/api/aggregate')) {
      const querySources = (q.sources || '').toString();
      let sources = querySources
        ? querySources.split(',').map(s => s.trim()).filter(Boolean)
        : ALLOWED_SOURCES.slice();
      if (!ALLOW_ALL) sources = sources.filter(src => ALLOWED_SOURCES.some(a => src.startsWith(a)));
      if (sources.length === 0) return jsonResponse(200, { items: [] });

      const noCache = q.noCache === '1' || q.noCache === 'true';
      const results = await Promise.allSettled(sources.map(src => fetchFeedItems(src, { bypassCache: noCache })));
      let items = results.filter(r => r.status === 'fulfilled').map(r => r.value).flat();

      const dedupe = q.dedupe === '1' || q.dedupe === 'true';
      if (dedupe) {
        const seen = new Set();
        items = items.filter(it => {
          const key = (it.link || it.title || '').trim();
          if (!key || seen.has(key)) return false;
          seen.add(key);
          return true;
        });
      }
      return jsonResponse(200, { items });
    }

    // /api/newsdata
    if (path.includes('/api/newsdata')) {
      const apiKey = process.env.NEWSDATA_API_KEY || '';
      if (!apiKey) return jsonResponse(200, { items: [], warning: 'NEWSDATA_API_KEY no configurada' });

      const query = q.q || 'fuerteventura';
      const country = q.country || 'es';
      const language = q.language || 'es';
      const category = q.category || '';
      const noCache = q.noCache === '1' || q.noCache === 'true';

      const cacheKey = `newsdata:${query}:${country}:${language}:${category}`;
      if (!noCache) {
        const cached = cacheGet(cacheKey);
        if (cached) return jsonResponse(200, { items: cached });
      }

      const params = new URLSearchParams({ apikey: apiKey, q: query, country, language });
      if (category) params.set('category', category);
      const url = `https://newsdata.io/api/1/news?${params.toString()}`;

      const response = await fetch(url, { headers: { 'User-Agent': 'FuerteventuraRSSProxy/1.0 (+https://example.local)' } });
      if (!response.ok) return jsonResponse(response.status, { error: 'newsdata.io API error', status: response.status });
      const data = await response.json();
      if (data.status !== 'success' || !Array.isArray(data.results)) return jsonResponse(200, { items: [] });

      const items = data.results.map(article => ({
        title: article.title || 'Sin título',
        link: article.link || '',
        description: article.description || article.content || '',
        pubDate: article.pubDate || '',
        raw: {
          image_url: article.image_url,
          source_id: article.source_id,
          category: article.category ? article.category[0] : '',
          country: article.country ? article.country[0] : '',
          language: article.language,
        },
      }));

      cacheSet(cacheKey, items);
      return jsonResponse(200, { items });
    }

    // Not found
    return jsonResponse(404, { error: 'not_found' });
  } catch (err) {
    return jsonResponse(500, { error: 'internal_error', details: err && err.message });
  }
};
