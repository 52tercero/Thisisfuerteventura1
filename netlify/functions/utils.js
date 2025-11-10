const { parseStringPromise } = require('xml2js');

// Netlify Functions run on Node 18+ which provides global fetch (undici)
const fetch = globalThis.fetch;
if (typeof fetch !== 'function') {
  throw new Error('Fetch API not available. Please run on Node 18+ or polyfill fetch.');
}

const DEFAULT_ALLOWED = [
  'https://rss.app'
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

const FETCH_TIMEOUT_MS = Number(process.env.FETCH_TIMEOUT_MS || 8000);

function withTimeout(ms) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), ms);
  return { controller, cancel: () => clearTimeout(id) };
}

async function fetchFeed(url) {
  const { controller, cancel } = withTimeout(FETCH_TIMEOUT_MS);
  const headers = {
    'User-Agent': 'NetlifyRSSFunction/1.0',
    'Accept': 'application/rss+xml, application/atom+xml, application/xml;q=0.9, text/xml;q=0.8, */*;q=0.1'
  };
  const res = await fetch(url, { headers, signal: controller.signal });
  cancel();
  if (!res.ok) throw new Error('Upstream status ' + res.status);
  const text = await res.text();
  let parsed;
  try {
    parsed = await parseStringPromise(text, { explicitArray: false, mergeAttrs: true });
  } catch (e) {
    return [];
  }
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
