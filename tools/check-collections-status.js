const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const linoleumPath = path.join(rootDir, 'public', 'data', 'gerflor_linoleum_colors_complete.json');

const data = JSON.parse(fs.readFileSync(linoleumPath, 'utf8'));

console.log('📊 Status kolekcija:\n');
data.collections.forEach(col => {
  console.log(`  ${col.name}: ${col.colorCount} colors`);
});

console.log(`\n📈 Total: ${data.totalColors} colors\n`);

// Check which collections are missing colors
const missing = data.collections.filter(col => col.colorCount === 0);
if (missing.length > 0) {
  console.log('⚠️  Kolekcije bez boja:');
  missing.forEach(col => {
    console.log(`  - ${col.name}`);
  });
} else {
  console.log('✅ Sve kolekcije imaju boje!');
}
