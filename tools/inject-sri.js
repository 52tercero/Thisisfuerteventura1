/*
 Inject Subresource Integrity (SRI) attributes for external CSS/JS assets.
 - Targets <script src="https://..."> and <link rel="stylesheet" href="https://...">
 - Computes SHA-384 and adds integrity + crossorigin="anonymous"
 - Skips known dynamic hosts: Google Fonts, GTM/Analytics

 Usage:
   node tools/inject-sri.js
*/

const fs = require('fs');
const path = require('path');
const https = require('https');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');

const ALLOW_HOSTS = new Set([
  'cdn.jsdelivr.net',
  'unpkg.com',
  'cdnjs.cloudflare.com',
]);
const SKIP_HOSTS = new Set([
  'fonts.googleapis.com',
  'fonts.gstatic.com',
  'www.googletagmanager.com',
  'analytics.google.com',
  'www.google-analytics.com',
]);

function parseUrlHost(u) {
  try {
    return new URL(u).host;
  } catch {
    return '';
  }
}

function fetchBuffer(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'sri-injector/1.0' } }, (res) => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        // follow redirects
        return resolve(fetchBuffer(res.headers.location));
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
      }
      const chunks = [];
      res.on('data', (d) => chunks.push(d));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    }).on('error', reject);
  });
}

function sha384Base64(buf) {
  const h = crypto.createHash('sha384');
  h.update(buf);
  return h.digest('base64');
}

function findHtmlFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  let files = [];
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      // limit to root only for this project
      continue;
    } else if (e.isFile() && e.name.toLowerCase().endsWith('.html')) {
      files.push(p);
    }
  }
  return files;
}

async function processFile(filePath) {
  let html = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // Process <script src="https://...">
  const scriptRegex = /<script\b([^>]*?)src=["'](https?:\/\/[^"']+)["']([^>]*)>(\s*<\/script>)?/gi;
  const linkRegex = /<link\b([^>]*?)href=["'](https?:\/\/[^"']+)["']([^>]*?)>/gi;

  async function replaceTag(match, preAttrs, url, postAttrs, close) {
    const host = parseUrlHost(url);
    if (SKIP_HOSTS.has(host)) return match;
    if (!ALLOW_HOSTS.has(host)) return match;
    if (/\bintegrity\s*=/.test(match)) return match; // already has SRI

    try {
      const buf = await fetchBuffer(url);
      const sri = 'sha384-' + sha384Base64(buf);
      // ensure crossorigin anonymous
      let newAttrs = `${preAttrs}src="${url}"${postAttrs}`;
      if (!/\bcrossorigin\s*=/.test(newAttrs)) newAttrs += ' crossorigin="anonymous"';
      if (!/\bintegrity\s*=/.test(newAttrs)) newAttrs += ` integrity="${sri}"`;
      changed = true;
      return `<script${newAttrs}>${close || ''}`;
    } catch (e) {
      console.warn(`[sri] skip ${url}: ${e.message}`);
      return match;
    }
  }

  async function replaceLink(match, preAttrs, url, postAttrs) {
    const host = parseUrlHost(url);
    if (SKIP_HOSTS.has(host)) return match;
    if (!ALLOW_HOSTS.has(host)) return match;
    if (!/\brel=\"stylesheet\"/.test(match)) return match;
    if (/\bintegrity\s*=/.test(match)) return match; // already has SRI

    try {
      const buf = await fetchBuffer(url);
      const sri = 'sha384-' + sha384Base64(buf);
      let newAttrs = `${preAttrs}href="${url}"${postAttrs}`;
      if (!/\bcrossorigin\s*=/.test(newAttrs)) newAttrs += ' crossorigin="anonymous"';
      if (!/\bintegrity\s*=/.test(newAttrs)) newAttrs += ` integrity="${sri}"`;
      changed = true;
      return `<link${newAttrs}>`;
    } catch (e) {
      console.warn(`[sri] skip ${url}: ${e.message}`);
      return match;
    }
  }

  // Replace sequentially (global async regex replacement)
  const scriptMatches = [];
  let sm;
  while ((sm = scriptRegex.exec(html)) !== null) scriptMatches.push(sm);
  for (const m of scriptMatches.reverse()) {
    const replaced = await replaceTag(m[0], m[1] || ' ', m[2], m[3] || '', m[4] || '');
    html = html.slice(0, m.index) + replaced + html.slice(m.index + m[0].length);
  }

  const linkMatches = [];
  let lm;
  while ((lm = linkRegex.exec(html)) !== null) linkMatches.push(lm);
  for (const m of linkMatches.reverse()) {
    const replaced = await replaceLink(m[0], m[1] || ' ', m[2], m[3] || '');
    html = html.slice(0, m.index) + replaced + html.slice(m.index + m[0].length);
  }

  if (changed) fs.writeFileSync(filePath, html, 'utf8');
  return changed;
}

async function main() {
  const files = findHtmlFiles(ROOT);
  let updated = 0;
  for (const f of files) {
    const changed = await processFile(f);
    console.log(`[sri] ${path.basename(f)}: ${changed ? 'updated' : 'unchanged'}`);
    if (changed) updated++;
  }
  console.log(`SRI injection complete. Files updated: ${updated}/${files.length}.`);
}

if (require.main === module) {
  main().catch(err => { console.error(err); process.exit(1); });
}
