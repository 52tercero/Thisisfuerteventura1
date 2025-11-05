// Simple HTML cleaner: trims trailing spaces, normalizes EOL to \n,
// removes control characters (except \n, \t), and deletes lines that are exactly "v"
// Run with: node tools/clean-html.js

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const EXCLUDE_DIRS = new Set(['node_modules', '.git', 'server/node_modules', 'images', '.vscode']);

function shouldExclude(p) {
  const parts = p.split(path.sep);
  return parts.some((part, idx) => {
    const seg = parts.slice(0, idx + 1).join(path.sep);
    return EXCLUDE_DIRS.has(part) || EXCLUDE_DIRS.has(seg);
  });
}

function listHtmlFiles(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (shouldExclude(full)) continue;
    if (entry.isDirectory()) {
      out.push(...listHtmlFiles(full));
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.html')) {
      out.push(full);
    }
  }
  return out;
}

function cleanContent(str) {
  // Normalize EOL to \n
  let content = str.replace(/\r\n?|\u2028|\u2029/g, '\n');
  const original = content;

  // Remove control characters except \n and \t
  content = content.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  // Per-line cleanup
  const lines = content.split('\n');
  const cleaned = [];
  let removedVLine = false;
  for (let line of lines) {
    // Trim trailing spaces/tabs
    line = line.replace(/[ \t]+$/g, '');
    // Remove lines that are exactly 'v' (optionally surrounded by spaces)
    if (line.trim() === 'v') {
      removedVLine = true;
      continue;
    }
    cleaned.push(line);
  }

  let result = cleaned.join('\n');
  if (!result.endsWith('\n')) result += '\n';

  const changed = result !== original;
  return { result, changed, removedVLine };
}

function main() {
  const files = listHtmlFiles(ROOT);
  const report = [];
  for (const file of files) {
    const before = fs.readFileSync(file, 'utf8');
    const { result, changed, removedVLine } = cleanContent(before);
    if (changed) {
      fs.writeFileSync(file, result, 'utf8');
      report.push({ file: path.relative(ROOT, file), removedVLine });
    }
  }
  if (report.length === 0) {
    console.log('No HTML files required changes.');
  } else {
    console.log('Cleaned files:');
    for (const r of report) {
      console.log('- ' + r.file + (r.removedVLine ? ' (removed lone "v" line)' : ''));
    }
  }
}

main();
