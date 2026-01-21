const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const colorsJsonPath = path.join(rootDir, 'public', 'data', 'gerflor_linoleum_colors_complete.json');

const data = JSON.parse(fs.readFileSync(colorsJsonPath, 'utf8'));
const nerok55 = data.collections.find(c => c.slug === 'nerok-55');

const color = nerok55.colors.find(c => c.code === '1451');
if (color) {
  color.image = '/images/products/vinyl/nerok-55/noma-kola.jpg';
  console.log(`✅ ${color.code} ${color.name} → noma-kola.jpg`);
} else {
  console.log('❌ Color 1451 not found');
  process.exit(1);
}

data.generatedAt = new Date().toISOString();
fs.writeFileSync(colorsJsonPath, JSON.stringify(data, null, 2));

const withImages = nerok55.colors.filter(c => c.image).length;
console.log(`\n📊 Nerok 55: ${withImages}/${nerok55.colors.length} colors have images ✅`);
