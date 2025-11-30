/**
 * Batch update all HTML files to use picture elements for logo.jpg
 * Usage: node tools/update-logo-pictures.js
 */

const fs = require('fs');
const path = require('path');

// Manually list all HTML files (to avoid glob dependency)
const htmlFiles = [
  'turismo-detalle.html',
  'senderos.html',
  'sendero.html',
  'quiz.html',
  'politica-cookies.html',
  'playas.html',
  'alojamiento.html',
  'blog.html',
  'blog-post.html',
  'contacto.html',
  'noticia.html'
];

const rootDir = path.join(__dirname, '..');

const oldLogoImg = '<img src="images/logo.jpg" alt="This is Fuerteventura Logo" class="logo" loading="lazy" decoding="async" width="70" height="70">';
const newLogoImg70 = `<picture>
                <source srcset="images/logo.webp" type="image/webp">
                <img src="images/logo.jpg" alt="This is Fuerteventura Logo" class="logo" loading="lazy" decoding="async" width="70" height="70">
            </picture>`;

const oldLogoImg40 = '<img src="images/logo.jpg" alt="This is Fuerteventura Logo" class="logo" loading="lazy" decoding="async" width="40" height="40">';
const newLogoImg40 = `<picture>
                    <source srcset="images/logo.webp" type="image/webp">
                    <img src="images/logo.jpg" alt="This is Fuerteventura Logo" class="logo" loading="lazy" decoding="async" width="40" height="40">
                </picture>`;

let updated = 0;
let skipped = 0;

for (const file of htmlFiles) {
  const filePath = path.join(rootDir, file);

  // Skip if file doesn't exist
  if (!fs.existsSync(filePath)) {
    console.log(`[SKIP] ${file} (not found)`);
    skipped++;
    continue;
  }

  try {
    let content = fs.readFileSync(filePath, 'utf-8');

    // Check if already has picture element
    if (content.includes('<source srcset="images/logo.webp"')) {
      console.log(`[SKIP] ${file} (already has picture element)`);
      skipped++;
      continue;
    }

    // Replace both 70x70 and 40x40 logos
    let modified = false;
    if (content.includes('width="70" height="70"')) {
      content = content.replace(oldLogoImg, newLogoImg70);
      modified = true;
    }
    if (content.includes('width="40" height="40"')) {
      content = content.replace(oldLogoImg40, newLogoImg40);
      modified = true;
    }

    if (modified) {
      fs.writeFileSync(filePath, content, 'utf-8');
      console.log(`[DONE] ${file}`);
      updated++;
    } else {
      console.log(`[SKIP] ${file} (no matching logo tags)`);
      skipped++;
    }
  } catch (err) {
    console.error(`[ERROR] ${file}: ${err.message}`);
  }
}

console.log(`\n✓ Batch update complete: ${updated} updated, ${skipped} skipped`);
