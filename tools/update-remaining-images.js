const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const colorsJsonPath = path.join(rootDir, 'public', 'data', 'gerflor_linoleum_colors_complete.json');

const data = JSON.parse(fs.readFileSync(colorsJsonPath, 'utf8'));
const nerok55 = data.collections.find(c => c.slug === 'nerok-55');

const mappings = {
  '1751': 'timber-grey',
  '2013': 'sherwood-blond',
  '2015': 'sherwood-brown',
  '2017': 'sherwood-grey',
  '2244': 'newport-clear',
  '2249': 'brooklyn-blue',
  '2253': 'brooklyn-silver'
};

Object.entries(mappings).forEach(([code, slug]) => {
  const color = nerok55.colors.find(c => c.code === code);
  if (color && !color.image) {
    color.image = `/images/products/vinyl/nerok-55/${slug}.jpg`;
    console.log(`✅ ${code} ${color.name} → ${slug}.jpg`);
  }
});

data.generatedAt = new Date().toISOString();
fs.writeFileSync(colorsJsonPath, JSON.stringify(data, null, 2));

const withImages = nerok55.colors.filter(c => c.image).length;
console.log(`\n📊 Nerok 55: ${withImages}/${nerok55.colors.length} colors have images`);
