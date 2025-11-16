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

  // Parse script-src directive
  const directives = policy.split(';').map(s => s.trim()).filter(Boolean);
  try { console.log('[inject-jsonld:internal] directives:', directives); } catch {}
  const idx = directives.findIndex(d => d.startsWith('script-src '));
  if (idx === -1) {
    try { console.log('[inject-jsonld:internal] no script-src directive found'); } catch {}
    // No script-src found; leave unchanged
    return html;
  }

  let scriptSrc = directives[idx]; // e.g., "script-src 'self' https://...".
  let parts = scriptSrc.split(/\s+/);
  const name = parts.shift(); // 'script-src'
  let set = new Set(parts);

  // Remove 'unsafe-inline'
  if (set.has("'unsafe-inline'")) set.delete("'unsafe-inline'");

  // Add hashes
  for (const h of hashes) {
    const token = `'sha256-${h}'`;
    set.add(token);
  }

  const updatedScriptSrc = [name, ...Array.from(set)].join(' ');
  // if (updatedScriptSrc === scriptSrc) { /* no-op */ }
  directives[idx] = updatedScriptSrc;
  const updatedPolicy = directives.join('; ') + ';';
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
  if (blocks.length === 0) {
    // No JSON-LD blocks found
    return false;
  }

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
  const topLevelHtmlFiles = [
    'index.html',
    'noticias.html',
    'turismo.html',
    'alojamiento.html',
    'playas.html',
    'gastronomia.html',
    'contacto.html',
  ].map(f => path.join(ROOT, f)).filter(f => fs.existsSync(f));

  let changed = 0, total = 0;
  for (const f of topLevelHtmlFiles) {
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
