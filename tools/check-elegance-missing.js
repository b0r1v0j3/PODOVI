const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const colorsDataPath = path.join(rootDir, 'public', 'data', 'vinyl_colors_complete.json');
const colorsData = JSON.parse(fs.readFileSync(colorsDataPath, 'utf8'));

const eleganceCollection = colorsData.collections.find(c => c.slug === 'mipolam-elegance');
if (!eleganceCollection) {
  console.error('Mipolam Elegance collection not found!');
  process.exit(1);
}

const eleganceDir = path.join(rootDir, 'public', 'images', 'products', 'vinyl', 'mipolam-elegance');
const existingImages = fs.existsSync(eleganceDir)
  ? fs.readdirSync(eleganceDir)
      .filter(f => f.endsWith('.jpg') && !f.includes('collection'))
      .map(f => f.replace('.jpg', ''))
  : [];

console.log(`Mipolam Elegance - Analiza slika\n`);
console.log(`Ukupno boja u JSON: ${eleganceCollection.colors.length}`);
console.log(`Postojeće slike u folderu: ${existingImages.length}\n`);

const missingImages = [];
const missingInJson = [];
const hasImageInJson = [];

eleganceCollection.colors.forEach(color => {
  const expectedFileName = `${color.code}-${color.name.toLowerCase().replace(/\s+/g, '-')}.jpg`;
  const hasImage = color.image !== undefined && color.image !== null;
  
  if (hasImage) {
    hasImageInJson.push(color.code);
  } else {
    missingInJson.push({
      code: color.code,
      name: color.name,
      expectedFile: expectedFileName
    });
  }
  
  if (!existingImages.includes(expectedFileName.replace('.jpg', ''))) {
    missingImages.push({
      code: color.code,
      name: color.name,
      expectedFile: expectedFileName,
      hasImageInJson: hasImage
    });
  }
});

console.log(`\n=== BOJE SA SLIKOM U JSON-U (${hasImageInJson.length}) ===`);
hasImageInJson.forEach(code => {
  const color = eleganceCollection.colors.find(c => c.code === code);
  console.log(`  ✓ ${code} ${color.name}`);
});

console.log(`\n=== BOJE BEZ SLIKE U JSON-U (${missingInJson.length}) ===`);
missingInJson.forEach(({ code, name, expectedFile }) => {
  console.log(`  ✗ ${code} ${name} → ${expectedFile}`);
});

console.log(`\n=== NEDOSTAJUĆE SLIKE U FOLDERU (${missingImages.length}) ===`);
missingImages.forEach(({ code, name, expectedFile, hasImageInJson }) => {
  const status = hasImageInJson ? 'JSON ✓' : 'JSON ✗';
  console.log(`  ${status} ${code} ${name} → ${expectedFile}`);
});

console.log(`\n=== SAŽETAK ===`);
console.log(`Ukupno boja: ${eleganceCollection.colors.length}`);
console.log(`Sa slikom u JSON-u: ${hasImageInJson.length}`);
console.log(`Bez slike u JSON-u: ${missingInJson.length}`);
console.log(`Nedostajuće slike u folderu: ${missingImages.length}`);
console.log(`Postojeće slike u folderu: ${existingImages.length}`);
