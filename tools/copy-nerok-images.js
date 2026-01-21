const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const linoleumColorsPath = path.join(rootDir, 'public', 'data', 'gerflor_linoleum_colors_complete.json');

// Load colors data
const colorsData = JSON.parse(fs.readFileSync(linoleumColorsPath, 'utf8'));

// Get Nerok 55 and Nerok 70 collections
const nerok55 = colorsData.collections.find(c => c.slug === 'nerok-55');
const nerok70 = colorsData.collections.find(c => c.slug === 'nerok-70');

if (!nerok55 || !nerok70) {
  console.error('❌ Collections not found!');
  process.exit(1);
}

console.log(`📦 Nerok 55: ${nerok55.colors.length} colors`);
console.log(`📦 Nerok 70: ${nerok70.colors.length} colors\n`);

// Find all JPG files in root directory
const rootFiles = fs.readdirSync(rootDir).filter(file => 
  /\.(jpg|jpeg|png)$/i.test(file)
);

console.log(`Found ${rootFiles.length} image files in root directory\n`);

if (rootFiles.length === 0) {
  console.log('⚠️  No image files found in root directory');
  console.log('Please make sure images are in the root directory (folder "sajt")');
  process.exit(1);
}

// Create target directories
const nerok55Dir = path.join(rootDir, 'public', 'images', 'products', 'vinyl', 'nerok-55');
const nerok70Dir = path.join(rootDir, 'public', 'images', 'products', 'vinyl', 'nerok-70');

if (!fs.existsSync(nerok55Dir)) {
  fs.mkdirSync(nerok55Dir, { recursive: true });
}
if (!fs.existsSync(nerok70Dir)) {
  fs.mkdirSync(nerok70Dir, { recursive: true });
}

// Sort files by name to match color order
const sortedFiles = rootFiles.sort();

console.log('Organizing images...\n');

// Copy images for Nerok 55 (first 36)
for (let i = 0; i < Math.min(nerok55.colors.length, sortedFiles.length); i++) {
  const color = nerok55.colors[i];
  const sourceFile = path.join(rootDir, sortedFiles[i]);
  const colorSlug = color.slug.split('-').slice(-2).join('-');
  const targetFile = path.join(nerok55Dir, `${colorSlug}.jpg`);
  
  if (fs.existsSync(sourceFile)) {
    fs.copyFileSync(sourceFile, targetFile);
    color.image = `/images/products/vinyl/nerok-55/${colorSlug}.jpg`;
    
    if ((i + 1) % 10 === 0) {
      console.log(`  ✓ Nerok 55: ${i + 1}/${nerok55.colors.length}`);
    }
  }
}

console.log(`  ✅ Nerok 55: ${nerok55.colors.filter(c => c.image).length} images organized\n`);

// Copy same images for Nerok 70 (first 36)
for (let i = 0; i < Math.min(nerok70.colors.length, sortedFiles.length); i++) {
  const color = nerok70.colors[i];
  const sourceFile = path.join(rootDir, sortedFiles[i]);
  const colorSlug = color.slug.split('-').slice(-2).join('-');
  const targetFile = path.join(nerok70Dir, `${colorSlug}.jpg`);
  
  if (fs.existsSync(sourceFile)) {
    fs.copyFileSync(sourceFile, targetFile);
    color.image = `/images/products/vinyl/nerok-70/${colorSlug}.jpg`;
    
    if ((i + 1) % 10 === 0) {
      console.log(`  ✓ Nerok 70: ${i + 1}/${nerok70.colors.length}`);
    }
  }
}

console.log(`  ✅ Nerok 70: ${nerok70.colors.filter(c => c.image).length} images organized\n`);

// Save updated JSON
colorsData.generatedAt = new Date().toISOString();
fs.writeFileSync(linoleumColorsPath, JSON.stringify(colorsData, null, 2));

console.log(`💾 Updated: ${linoleumColorsPath}`);
console.log(`📊 Nerok 55: ${nerok55.colors.filter(c => c.image).length}/${nerok55.colors.length} colors with images`);
console.log(`📊 Nerok 70: ${nerok70.colors.filter(c => c.image).length}/${nerok70.colors.length} colors with images\n`);
