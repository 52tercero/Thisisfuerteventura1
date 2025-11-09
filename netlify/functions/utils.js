const { parseStringPromise } = require('xml2js');

// Netlify Functions run on Node 18+ which provides global fetch (undici)
const fetch = globalThis.fetch;
if (typeof fetch !== 'function') {
  throw new Error('Fetch API not available. Please run on Node 18+ or polyfill fetch.');
}

const DEFAULT_ALLOWED = [
  'https://www.canarias7.es',
  'https://www.laprovincia.es',
  'https://www.cabildofuer.es',
  'https://www.radioinsular.es',
  'https://www.fuerteventuradigital.com',
  'https://ondafuerteventura.es'
];

function buildAllowed() {
  let list = DEFAULT_ALLOWED.slice();
  if (process.env.ALLOWED_SOURCES) {
    try {
      list = list.concat(process.env.ALLOWED_SOURCES.split(',').map(s => s.trim()).filter(Boolean));
    } catch (_) {}
  }
  return list;
}

function resolveURL(href, base) {
  try { return new URL(href, base).toString(); } catch { return href; }
}

async function tryFetch(url, opts = {}) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'NetlifyRSSFunction/1.0',
      'Accept': 'application/rss+xml, application/atom+xml, application/xml;q=0.9, text/xml;q=0.8, */*;q=0.5'
    },
    ...opts
  });
  return res;
}

async function parseRSS(text) {
  try {
    const parsed = await parseStringPromise(text, { explicitArray: false, mergeAttrs: true });
    let channel = parsed.rss && parsed.rss.channel ? parsed.rss.channel : parsed.feed || parsed;
    let items = channel && (channel.item || channel.entry) ? (channel.item || channel.entry) : [];
    if (!Array.isArray(items)) items = [items];
    return items.map(it => {
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
  } catch {
    return [];
  }
}

function discoverFeedFromHTML(html, baseUrl) {
  try {
    // 1) <link rel="alternate" type="application/rss+xml" href="...">
    const linkRss = html.match(/<link[^>]+rel=["']alternate["'][^>]+type=["'][^>]*rss\+xml[^>]*["'][^>]+href=["']([^"']+)["']/i) ||
                    html.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["']alternate["'][^>]+type=["'][^>]*rss\+xml[^>]*["']/i) ||
                    html.match(/<link[^>]+rel=["']alternate["'][^>]+type=["'][^>]*atom\+xml[^>]*["'][^>]+href=["']([^"']+)["']/i) ||
                    html.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["']alternate["'][^>]+type=["'][^>]*atom\+xml[^>]*["']/i);
    if (linkRss && linkRss[1]) return resolveURL(linkRss[1], baseUrl);

    // 2) Heurísticas comunes (WordPress /feed/)
    const u = new URL(baseUrl);
    const candidates = [];
    const path = u.pathname.endsWith('/') ? u.pathname : (u.pathname + '/');
    candidates.push(u.origin + path + 'feed/');
    candidates.push(u.origin + '/feed/');
    // Blogger
    candidates.push(u.origin + '/feeds/posts/default?alt=rss');

    return candidates[0]; // devolver la primera candidata; el caller la probará
  } catch {
    return '';
  }
}

async function fetchFeed(url) {
  // 1) Intentar descargar la URL tal cual
  const res = await tryFetch(url);
  if (!res.ok) throw new Error('Upstream status ' + res.status);

  const ctype = (res.headers.get('content-type') || '').toLowerCase();
  const text = await res.text();

  // 2) Si parece XML/RSS/Atom, parsear
  if (ctype.includes('xml') || text.trim().startsWith('<?xml')) {
    const items = await parseRSS(text);
    if (items.length > 0) return items;
  }

  // 3) Si es HTML, intentar descubrir el feed real
  if (ctype.includes('html') || /<html/i.test(text)) {
    const feedUrl = discoverFeedFromHTML(text, url);
    if (feedUrl) {
      try {
        const fr = await tryFetch(feedUrl);
        if (fr.ok) {
          const ftxt = await fr.text();
          const items = await parseRSS(ftxt);
          if (items.length > 0) return items;
        }
      } catch (_) {}
    }
  }

  // 4) Si todo falla, retornar vacío
  return [];
}

function normalize(items) {
  return items.map(it => ({
    title: it.title || 'Sin título',
    link: it.link || '',
    description: it.description || '',
    pubDate: it.pubDate || '',
    image: it.image || '',
    raw: it.raw || {}
  }));
}

module.exports = { fetchFeed, normalize, buildAllowed };
