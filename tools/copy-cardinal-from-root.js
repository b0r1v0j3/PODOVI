const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const symbiozDir = path.join(rootDir, 'public', 'images', 'products', 'vinyl', 'mipolam-symbioz');

// Find Cardinal image in root
const files = fs.readdirSync(rootDir);
const cardinalFile = files.find(file => {
  const fileName = file.toLowerCase();
  return (fileName.includes('cardinal') || fileName.includes('6075')) && 
         (fileName.endsWith('.jpg') || fileName.endsWith('.jpeg') || fileName.endsWith('.png'));
});

if (!cardinalFile) {
  console.error('Cardinal image not found in root directory!');
  process.exit(1);
}

const sourcePath = path.join(rootDir, cardinalFile);
const destPath = path.join(symbiozDir, '6075-cardinal.jpg');

if (!fs.existsSync(symbiozDir)) {
  fs.mkdirSync(symbiozDir, { recursive: true });
}

fs.copyFileSync(sourcePath, destPath);
console.log(`✅ Copied ${cardinalFile} → 6075-cardinal.jpg`);
console.log(`📁 Location: ${symbiozDir}`);
