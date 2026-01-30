/**
 * Kopira TH_Privilege_*.jpg iz root-a projekta u public/images/products/
 * pod slug imenima za kolekciju Privilege.
 * Pokreni: node tools/copy-privilege-images.js
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const destDir = path.join(root, 'public', 'images', 'products');

const mapping = [
  ['TH_Privilege_GALONI_Oak.jpg', 'galloni-oak.jpg'],
  ['TH_Privilege_GALONI_Oak_Brown_Grey.jpg', 'galloni-oak-brown-grey.jpg'],
  ['TH_Privilege_GALONI_Oak_Royal_Grey.jpg', 'galloni-oak-royal-grey.jpg'],
  ['TH_Privilege_GALONI_Oak_White.jpg', 'hrast-galloni-oak-white-1-strip.jpg'],
  ['TH_Privilege_NOBILE_Oak_Select.jpg', 'hrast-nobile-oak-select-1-strip.jpg'],
  ['TH_Privilege_NOBILE_Oak_Select.jpg', 'hrast-nobile-oak-select-white-1-strip.jpg'],
  ['TH_Privilege_PRESTIGE_Oak_Antique.jpg', 'prestige-oak-antique.jpg'],
  ['TH_Privilege_PRESTIGE_Oak_Brown_Grey.jpg', 'prestige-oak-brown-grey.jpg'],
  ['TH_Privilege_PRESTIGE_Oak_Royal_Grey.jpg', 'prestige-oak-royal-grey.jpg'],
  ['TH_Privilege_PRESTIGE_Oak_White.jpg', 'prestige-oak-white.jpg'],
  ['TH_Privilege_PRESTIGE_Oak_Antique.jpg', 'privilege-prestige-oak.jpg'],
];

mapping.forEach(([srcName, destName]) => {
  const src = path.join(root, srcName);
  const dest = path.join(destDir, destName);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log('OK:', srcName, '->', destName);
  } else {
    console.log('NEMA:', srcName);
  }
});
