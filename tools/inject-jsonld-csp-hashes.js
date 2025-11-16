/*
 Inject SHA-256 hashes for inline JSON-LD blocks into each HTML page's CSP meta tag.
 - Finds <script type="application/ld+json">...</script> blocks
 - Computes sha256 base64 over the exact inner content
 - Updates the <meta http-equiv="Content-Security-Policy" ...> to include those hashes under script-src
 - Removes 'unsafe-inline' from script-src if present

 Usage:
   node tools/inject-jsonld-csp-hashes.js
*/

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');

function findHtmlFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  let files = [];
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      // Only scan top-level directories that might contain html if needed
      // Skip node_modules, server, netlify, js, css, images, tools, data
      const skip = ['node_modules', 'server', 'netlify', 'js', 'css', 'images', 'tools', 'data'];
      if (!skip.includes(e.name)) {
        files = files.concat(findHtmlFiles(p));
      }
    } else if (e.isFile() && e.name.toLowerCase().endsWith('.html')) {
      files.push(p);
    }
  }
  return files;
}

function getJsonLdBlocks(html) {
  const regex = /<script\s+type=["']application\/ld\+json["']\s*>\s*([\s\S]*?)\s*<\/script>/gi;
  const blocks = [];
  let m;
  while ((m = regex.exec(html)) !== null) {
    const inner = m[1];
    const startIdx = m.index;
    const endIdx = regex.lastIndex;
    blocks.push({ inner, startIdx, endIdx });
  }
  return blocks;
}

function computeSha256Base64(str) {
  const hash = crypto.createHash('sha256');
  // Use UTF-8 bytes exactly as in file string
  hash.update(Buffer.from(str, 'utf8'));
  return hash.digest('base64');
}

function updateCspMeta(html, hashes) {
  // Find the CSP meta tag regardless of attribute order
  const metaAny = /<meta\b[^>]*http-equiv=["']Content-Security-Policy["'][^>]*>/i;
  const m = metaAny.exec(html);
  if (!m) return html; // no CSP; skip
  const full = m[0];
  try { console.log('[inject-jsonld:internal] matched meta tag:', full); } catch {}
  const contentMatch = /content=(["'])([\s\S]*?)\1/i.exec(full);
  if (!contentMatch) return html; // no content attr
  const policy = contentMatch[2];
  try { console.log('[inject-jsonld:internal] policy raw:', policy); } catch {}

  // Parse directives into ordered list and a map
  const directives = policy.split(';').map(s => s.trim()).filter(Boolean);
  try { console.log('[inject-jsonld:internal] directives:', directives); } catch {}

  const dirMap = new Map();
  for (const d of directives) {
    const sp = d.split(/\s+/);
    const key = sp.shift();
    dirMap.set(key, sp);
  }

  if (!dirMap.has('script-src')) {
    try { console.log('[inject-jsonld:internal] no script-src directive found'); } catch {}
    // If missing, initialize with self (mirror default-src behavior)
    dirMap.set('script-src', ["'self'"]);
    directives.push("script-src 'self'");
  }

  // Update script-src with hashes and remove unsafe-inline
  const scriptParts = dirMap.get('script-src');
  const set = new Set(scriptParts);
  if (set.has("'unsafe-inline'")) set.delete("'unsafe-inline'");
  for (const h of hashes) set.add(`'sha256-${h}'`);
  dirMap.set('script-src', Array.from(set));

  // Ensure additional hardening directives
  if (!dirMap.has('base-uri')) dirMap.set('base-uri', ["'self'"]);
  if (!dirMap.has('object-src')) dirMap.set('object-src', ['none']);
  if (!dirMap.has('frame-ancestors')) dirMap.set('frame-ancestors', ["'self'"]);

  // Rebuild policy preserving original order, appending any new ones
  const knownOrder = [];
  const seen = new Set();
  for (const d of directives) {
    const key = d.split(/\s+/)[0];
    if (!seen.has(key) && dirMap.has(key)) {
      knownOrder.push(`${key} ${dirMap.get(key).join(' ')}`.trim());
      seen.add(key);
    }
  }
  for (const key of dirMap.keys()) {
    if (!seen.has(key)) knownOrder.push(`${key} ${dirMap.get(key).join(' ')}`.trim());
  }
  const updatedPolicy = knownOrder.join('; ') + ';';
  try {
    if (updatedPolicy === policy) {
      console.log('[inject-jsonld:internal] policy unchanged');
    } else {
      console.log('[inject-jsonld:internal] policy updated');
    }
  } catch {}

  // Always normalize the entire meta tag to avoid any corrupted trailing text
  // Build a canonical tag using double quotes for content
  const newMeta = `<meta http-equiv="Content-Security-Policy" content="${updatedPolicy}">`;
  return html.replace(full, newMeta);
}

function processFile(filePath) {
  const original = fs.readFileSync(filePath, 'utf8');
  const blocks = getJsonLdBlocks(original);
  const hashes = blocks.map(b => computeSha256Base64(b.inner));
  const updated = updateCspMeta(original, hashes);
  if (updated && updated !== original) {
    fs.writeFileSync(filePath, updated, 'utf8');
    return { updated: true, count: blocks.length, hashes };
  }
  // Debug: extract original and recomputed script-src values
  try {
    const metaRegex = /<meta\s+http-equiv=["']Content-Security-Policy["']\s+content=["']([^"']*)["']\s*>/i;
    const mm = metaRegex.exec(original);
    if (mm) {
      const policy = mm[1];
      const directives = policy.split(';').map(s => s.trim()).filter(Boolean);
      const idx = directives.findIndex(d => d.startsWith('script-src '));
      let scriptSrc = idx !== -1 ? directives[idx] : '(not found)';
      // recompute what updated would be
      if (idx !== -1) {
        let parts = scriptSrc.split(/\s+/);
        const name = parts.shift();
        let set = new Set(parts);
        if (set.has("'unsafe-inline'")) set.delete("'unsafe-inline'");
        for (const h of hashes) set.add(`'sha256-${h}'`);
        const recon = [name, ...Array.from(set)].join(' ');
        console.log(`[inject-jsonld:debug] ${path.basename(filePath)} script-src before=`, scriptSrc);
        console.log(`[inject-jsonld:debug] ${path.basename(filePath)} script-src after =`, recon);
      }
    } else {
      // Try new parser
      const metaAny = /<meta\b[^>]*http-equiv=["']Content-Security-Policy["'][^>]*>/i.exec(original);
      if (metaAny) {
        const tag = metaAny[0];
        const contentMatch = /content=["']([^"']*)["']/i.exec(tag);
        console.log(`[inject-jsonld:debug] ${path.basename(filePath)} found metaAny:`, !!metaAny, 'content found:', !!contentMatch);
      } else {
        console.log(`[inject-jsonld:debug] ${path.basename(filePath)} no CSP meta found`);
      }
    }
  } catch {}
  return { updated: false, count: blocks.length, hashes };
}

function main() {
  // Process all top-level HTML files except explicit test pages
  const all = fs.readdirSync(ROOT)
    .filter(name => name.toLowerCase().endsWith('.html'))
    .filter(name => !/^test-.*\.(html)$/i.test(name))
    .map(name => path.join(ROOT, name));

  let changed = 0, total = 0;
  for (const f of all) {
    total++;
    const res = processFile(f);
    if (res && typeof res === 'object') {
      console.log(`[inject-jsonld] ${path.basename(f)}: blocks=${res.count}, updated=${res.updated}`);
      if (res.updated) changed++;
    } else {
      console.log(`[inject-jsonld] ${path.basename(f)}: blocks=0, updated=false`);
    }
  }

  console.log(`Processed ${total} files. Updated ${changed} with JSON-LD CSP hashes.`);
}

if (require.main === module) {
  main();
}
