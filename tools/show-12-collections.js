const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const linoleumPath = path.join(rootDir, 'public', 'data', 'gerflor_linoleum_colors_complete.json');

const data = JSON.parse(fs.readFileSync(linoleumPath, 'utf8'));

console.log('📊 12 Heterogeni Vinil Kolekcija:\n');
console.log('='.repeat(60));

data.collections.forEach((col, index) => {
  console.log(`\n${index + 1}. ${col.name}`);
  console.log(`   Slug: ${col.slug}`);
  console.log(`   URL: ${col.url}`);
  console.log(`   Boje: ${col.colorCount}`);
  
  if (col.colors && col.colors.length > 0) {
    console.log(`   Prvih 5 boja:`);
    col.colors.slice(0, 5).forEach(color => {
      console.log(`     - ${color.code} ${color.name}`);
    });
    if (col.colors.length > 5) {
      console.log(`     ... i još ${col.colors.length - 5} boja`);
    }
  } else {
    console.log(`   ⚠️  Nema boja`);
  }
});

console.log(`\n${'='.repeat(60)}`);
console.log(`\n📈 Total: ${data.totalColors} boja iz ${data.collections.length} kolekcija\n`);
