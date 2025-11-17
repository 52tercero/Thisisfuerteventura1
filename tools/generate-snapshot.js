// Generate a snapshot of aggregated feeds into data/feeds.json
// Usage: node tools/generate-snapshot.js

const fs = require('fs');
const path = require('path');
const { parseStringPromise } = require('xml2js');
const fetch = globalThis.fetch || require('node-fetch');

const FETCH_TIMEOUT_MS = Number(process.env.FETCH_TIMEOUT_MS || 8000);
const OUTPUT_DIR = path.resolve(__dirname, '..', 'data');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'feeds.json');

// Same feed list used in the client
const newsSources = [
  'https://rss.app/feeds/jbwZ2Q9QAvgvI6G0.xml'
];

function withTimeout(ms) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), ms);
  return { controller, cancel: () => clearTimeout(id) };
}

async function fetchFeed(url) {
  const { controller, cancel } = withTimeout(FETCH_TIMEOUT_MS);
  const headers = {
    'User-Agent': 'SnapshotGenerator/1.0',
    'Accept': 'application/rss+xml, application/atom+xml, application/xml;q=0.9, text/xml;q=0.8, */*;q=0.1'
  };
  const res = await fetch(url, { headers, signal: controller.signal });
  cancel();
  if (!res.ok) throw new Error('Upstream status ' + res.status);
  const text = await res.text();
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
    return { title, link, description, pubDate, image };
  });
}

function normalize(items) {
  return items.map(it => ({
    title: it.title || 'Sin título',
    link: it.link || '',
    description: it.description || '',
    pubDate: it.pubDate || '',
    image: it.image || ''
  }));
}

async function main() {
  console.log('[SNAPSHOT] Fetching feeds...');
  const results = await Promise.allSettled(newsSources.map(src => fetchFeed(src)));
  let items = results.filter(r => r.status === 'fulfilled').map(r => r.value).flat();
  // With a single source, still limit quantity for snapshot size

  // Dedupe by link/title and sort by date desc
  const seen = new Set();
  items = items.filter(it => {
    const key = (it.link || it.title || '').trim();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  items.sort((a, b) => {
    const ta = Date.parse(a.pubDate || '') || 0;
    const tb = Date.parse(b.pubDate || '') || 0;
    return tb - ta;
  });
  const limited = items.slice(0, 60);

  const payload = { generated: new Date().toISOString(), items: normalize(limited) };
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(payload, null, 2), 'utf-8');
  console.log(`[SNAPSHOT] Wrote ${limited.length} items to ${OUTPUT_FILE}`);
  // HTML injection into index.html or noticias.html removed by request.
}

main().catch(err => {
  console.error('[SNAPSHOT] Failed:', err && err.message);
  process.exit(1);
});
