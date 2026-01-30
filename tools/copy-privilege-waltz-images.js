/**
 * Kopira TH_Privilege_Waltz_*.jpg iz root-a u public/images/products/
 * Pokreni: node tools/copy-privilege-waltz-images.js
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const destDir = path.join(root, 'public', 'images', 'products');

const mapping = [
  ['TH_Privilege_Waltz_Oak Essence.jpg', 'hrast-essence.jpg'],
  ['TH_Privilege_Waltz_Oak Misty Brown.jpg', 'hrast-misty-brown.jpg'],
  ['TH_Privilege_Waltz_Oak Misty Grey.jpg', 'hrast-misty-grey.jpg'],
  ['TH_Privilege_Waltz_Oak Soft Brown.jpg', 'hrast-soft-brown-1-strip.jpg'],
  ['TH_Privilege_Waltz_Oak Soft Beige.jpg', 'hrast-soft-beige.jpg'],
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
