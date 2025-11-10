// Generate a snapshot of aggregated feeds into data/feeds.json
// Usage: node tools/generate-snapshot.js

const fs = require('fs');
const path = require('path');
const { parseStringPromise } = require('xml2js');
const fetch = globalThis.fetch || require('node-fetch');

const FETCH_TIMEOUT_MS = Number(process.env.FETCH_TIMEOUT_MS || 8000);
const OUTPUT_DIR = path.resolve(__dirname, '..', 'data');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'feeds.json');
const INDEX_HTML = path.resolve(__dirname, '..', 'index.html');
const NOTICIAS_HTML = path.resolve(__dirname, '..', 'noticias.html');

// Same feed list used in the client
const newsSources = [
  'https://rss.app/feeds/jbwZ2Q9QAvgvI6G0.xml',
  'https://rss.app/feeds/8SmCQL7GDZyu2xB4.xml',
  'https://rss.app/feeds/IchTPp234IVDaH7V.xml',
  'https://rss.app/feeds/cNktFJXkoIBwqQSS.xml',
  'https://rss.app/feeds/pGaOMTfcwV2mzdy7.xml'
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

  // Pre-render first 18 featured cards into index.html
  try {
    const html = fs.readFileSync(INDEX_HTML, 'utf-8');
    const startMarker = '<div class="content-grid" id="featured-news">';
    const endMarker = '</div>'; // close of content-grid
    const idx = html.indexOf(startMarker);
    if (idx !== -1) {
      const afterStart = idx + startMarker.length;
      const closeIdx = html.indexOf(endMarker, afterStart);
      if (closeIdx !== -1) {
        const top18 = payload.items.slice(0, 18);
        const cards = top18.map(it => {
          const dateStr = it.pubDate ? new Date(it.pubDate) : new Date();
          const formatted = dateStr.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
          const plain = (it.description || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
          const short = plain.length > 150 ? plain.slice(0, 150) + '...' : plain;
          const img = (it.image && /^https:\/\//.test(it.image)) ? it.image : 'images/logo.jpg?v=2025110501';
          const articleId = Buffer.from(encodeURIComponent((it.title||'') + formatted)).toString('base64').replace(/[^a-zA-Z0-9]/g,'').substring(0,32);
          return `\n            <div class="content-card">\n              <img src="${img}" alt="${it.title}" onerror="this.onerror=null;this.src='images/logo.jpg?v=2025110501';">\n              <div class="card-content">\n                <span class="date">${formatted}</span>\n                <h3>${it.title}</h3>\n                <p>${short}</p>\n                <a href="noticia.html?id=${articleId}" class="btn">Leer más</a>\n              </div>\n            </div>`;
        }).join('');
        const newHtml = html.slice(0, afterStart) + cards + '\n' + html.slice(closeIdx);
        fs.writeFileSync(INDEX_HTML, newHtml, 'utf-8');
        console.log(`[SNAPSHOT] Injected ${top18.length} featured cards into index.html`);
      }
    }
  } catch (e) {
    console.warn('[SNAPSHOT] Failed to inject featured into index.html:', e.message);
  }

  // Pre-render initial news list (first 9) into noticias.html
  try {
    const nhtml = fs.readFileSync(NOTICIAS_HTML, 'utf-8');
    const containerMarker = '<div class="news-grid" id="news-container">';
    const endMarker2 = '</div>'; // close news-grid
    const nIdx = nhtml.indexOf(containerMarker);
    if (nIdx !== -1) {
      const afterStart = nIdx + containerMarker.length;
      const closeIdx = nhtml.indexOf(endMarker2, afterStart);
      if (closeIdx !== -1) {
        const first9 = payload.items.slice(0, 9);
        const cards = first9.map(it => {
          const dateStr = it.pubDate ? new Date(it.pubDate) : new Date();
          const formatted = dateStr.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
          const plain = (it.description || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
          const short = plain.length > 150 ? plain.slice(0, 150) + '...' : plain;
          const img = (it.image && /^https:\/\//.test(it.image)) ? it.image : 'images/logo.jpg?v=2025110501';
          return `\n            <div class="news-card">\n              <div class="news-image">\n                <img src="${img}" alt="${it.title}" onerror="this.onerror=null;this.src='images/logo.jpg?v=2025110501';">\n              </div>\n              <div class="news-content">\n                <span class="news-date">${formatted}</span>\n                <h3>${it.title}</h3>\n                <p>${short}</p>\n                <a href="${it.link || '#'}" target="_blank" rel="noopener noreferrer" class="btn">Leer más</a>\n              </div>\n            </div>`;
        }).join('');
        const newHtml = nhtml.slice(0, afterStart) + cards + '\n' + nhtml.slice(closeIdx);
        fs.writeFileSync(NOTICIAS_HTML, newHtml, 'utf-8');
        console.log(`[SNAPSHOT] Injected ${first9.length} news cards into noticias.html`);
      }
    }
  } catch (e) {
    console.warn('[SNAPSHOT] Failed to inject list into noticias.html:', e.message);
  }
}

main().catch(err => {
  console.error('[SNAPSHOT] Failed:', err && err.message);
  process.exit(1);
});
