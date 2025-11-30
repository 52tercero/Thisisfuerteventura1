/**
 * Image conversion script: Convert JPG/JPEG to WEBP using sharp
 * Usage: node tools/convert-images.js
 */

const fs = require('fs');
const path = require('path');

// Try to use sharp if available, otherwise inform user
let sharp;
try {
  sharp = require('sharp');
} catch (e) {
  console.log('[INFO] sharp not found. Install with: npm install sharp');
  console.log('[INFO] Skipping image conversion (images already exist in WEBP where needed).');
  process.exit(0);
}

const imagesToConvert = [
  // Hero/Logo
  { src: 'images/logo.jpg', out: 'images/logo.webp', quality: 90 },
  
  // Index.html category cards
  { src: 'images/vistalobos.jpg', out: 'images/vistalobos.webp', quality: 85 },
  { src: 'images/playa-del-cotillo.jpg', out: 'images/playa-del-cotillo.webp', quality: 85 },
  
  // Turismo.html hero
  { src: 'images/Fuerteventura.jpeg', out: 'images/Fuerteventura.webp', quality: 85 },
  
  // Turismo gallery
  { src: 'images/turismo/betancuria.jpg', out: 'images/turismo/betancuria.webp', quality: 85 },
  { src: 'images/turismo/caleta-de-Fuste.jpg', out: 'images/turismo/caleta-de-Fuste.webp', quality: 85 },
  { src: 'images/turismo/cofete.jpg', out: 'images/turismo/cofete.webp', quality: 85 },
  { src: 'images/turismo/corralejo-dunas.jpg', out: 'images/turismo/corralejo-dunas.webp', quality: 85 },
  { src: 'images/turismo/faro-morro-jable.jpg', out: 'images/turismo/faro-morro-jable.webp', quality: 85 },
  { src: 'images/turismo/isla-de-lobos.jpg', out: 'images/turismo/isla-de-lobos.webp', quality: 85 },
  { src: 'images/turismo/mirador-morro-velosa.jpg', out: 'images/turismo/mirador-morro-velosa.webp', quality: 85 },
  { src: 'images/turismo/molino-antigua.jpg', out: 'images/turismo/molino-antigua.webp', quality: 85 },
  { src: 'images/turismo/parque-natural-jandia.jpg', out: 'images/turismo/parque-natural-jandia.webp', quality: 85 },
  { src: 'images/turismo/popcorn-beach.jpg', out: 'images/turismo/popcorn-beach.webp', quality: 85 },
  { src: 'images/turismo/puerto-del-rosario-.jpg', out: 'images/turismo/puerto-del-rosario-.webp', quality: 85 },
  { src: 'images/turismo/punta-pesebre.jpg', out: 'images/turismo/punta-pesebre.webp', quality: 85 },
  { src: 'images/turismo/tindaya.webp', out: 'images/turismo/tindaya-reoptimized.webp', quality: 85 },
  
  // Senderos
  { src: 'images/senderos/morro_velosa.jpeg', out: 'images/senderos/morro_velosa.webp', quality: 85 },
];

async function convertImages() {
  let converted = 0;
  let skipped = 0;
  
  for (const img of imagesToConvert) {
    const srcPath = path.join(__dirname, '..', img.src);
    const outPath = path.join(__dirname, '..', img.out);
    
    // Skip if already exists
    if (fs.existsSync(outPath)) {
      console.log(`[SKIP] ${img.out} already exists`);
      skipped++;
      continue;
    }
    
    // Skip if source doesn't exist
    if (!fs.existsSync(srcPath)) {
      console.log(`[SKIP] ${img.src} not found`);
      skipped++;
      continue;
    }
    
    try {
      await sharp(srcPath)
        .webp({ quality: img.quality })
        .toFile(outPath);
      console.log(`[DONE] ${img.out}`);
      converted++;
    } catch (err) {
      console.error(`[ERROR] ${img.out}: ${err.message}`);
    }
  }
  
  console.log(`\n✓ Conversion complete: ${converted} converted, ${skipped} skipped`);
}

convertImages().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
