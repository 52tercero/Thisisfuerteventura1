/*
 Validate HTML security hygiene:
  - CSP meta present with required directives
  - script-src has no 'unsafe-inline'
  - External CDN assets (js/css) on allowed hosts include SRI + crossorigin
  - Flag inline event handlers (on*)

 Usage:
   node tools/validate-html.js

 Exits with non-zero code if violations are found.
*/

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const HTML_GLOB_DIRS = ['.'];

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

function listHtmlFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  let files = [];
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      // shallow scan only root for this project
      continue;
    }
    if (e.isFile() && e.name.toLowerCase().endsWith('.html')) files.push(p);
  }
  return files;
}

function findAll(regex, str) {
  const results = [];
  let m;
  while ((m = regex.exec(str)) !== null) results.push(m);
  return results;
}

function hostOf(u) {
  try { return new URL(u).host; } catch { return ''; }
}

function validateFile(filePath) {
  const html = fs.readFileSync(filePath, 'utf8');
  const errors = [];
  const warnings = [];

  // 1) CSP meta and directives
  const meta = /<meta\b[^>]*http-equiv=["']Content-Security-Policy["'][^>]*>/i.exec(html);
  if (!meta) {
    errors.push('Missing CSP <meta http-equiv="Content-Security-Policy">');
  } else {
    const content = /content=(["'])([\s\S]*?)\1/i.exec(meta[0]);
    if (!content) errors.push('CSP meta missing content attribute');
    else {
      const policy = content[2];
      if (/script-src[^;]*'unsafe-inline'/.test(policy)) errors.push("CSP script-src contains 'unsafe-inline'");
      for (const required of ["base-uri 'self'", 'object-src none', "frame-ancestors 'self'"]) {
        if (!policy.includes(required)) errors.push(`CSP missing required directive: ${required}`);
      }
    }
  }

  // 2) Inline event handlers (error)
  const onAttr = findAll(/\son[a-z]+\s*=\s*["'][^"']*["']/gi, html);
  if (onAttr.length) errors.push(`Inline event handlers found (${onAttr.length})`);

  // 3) External assets should have SRI
  const scriptTags = findAll(/<script\b([^>]*?)src=["'](https?:\/\/[^"']+)["']([^>]*)>/gi, html);
  for (const m of scriptTags) {
    const url = m[2];
    const host = hostOf(url);
    if (SKIP_HOSTS.has(host)) continue;
    if (!ALLOW_HOSTS.has(host)) continue; // ignore unknown hosts for now
    const tag = m[0];
    if (!/\bintegrity\s*=/.test(tag) || !/\bcrossorigin\s*=/.test(tag)) {
      errors.push(`Missing SRI/crossorigin on <script> from ${host}`);
    }
  }

  const linkTags = findAll(/<link\b([^>]*?)rel=["']stylesheet["']([^>]*?)href=["'](https?:\/\/[^"']+)["']([^>]*?)>/gi, html)
    .concat(findAll(/<link\b([^>]*?)href=["'](https?:\/\/[^"']+)["']([^>]*?)rel=["']stylesheet["']([^>]*?)>/gi, html));
  for (const m of linkTags) {
    // URL can be in group 3 or 2 depending on which regex matched
    const url = m[3] || m[2];
    const host = hostOf(url);
    if (SKIP_HOSTS.has(host)) continue;
    if (!ALLOW_HOSTS.has(host)) continue;
    const tag = m[0];
    if (!/\bintegrity\s*=/.test(tag) || !/\bcrossorigin\s*=/.test(tag)) {
      errors.push(`Missing SRI/crossorigin on <link rel="stylesheet"> from ${host}`);
    }
  }

  return { filePath, errors, warnings };
}

function main() {
  const files = listHtmlFiles(ROOT);
  let totalErrors = 0;
  const results = files.map(validateFile);
  for (const r of results) {
    if (r.errors.length) {
      console.log(`✗ ${path.basename(r.filePath)}:`);
      for (const e of r.errors) console.log(`  - ${e}`);
      totalErrors += r.errors.length;
    } else {
      console.log(`✓ ${path.basename(r.filePath)}: OK`);
    }
  }
  if (totalErrors > 0) {
    console.error(`\nValidation failed with ${totalErrors} error(s).`);
    process.exit(1);
  } else {
    console.log('\nValidation passed.');
  }
}

if (require.main === module) {
  main();
}
