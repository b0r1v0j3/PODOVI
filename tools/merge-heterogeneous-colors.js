const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const heterogeneousPath = path.join(rootDir, 'public', 'data', 'gerflor_heterogeneous_colors.json');
const linoleumPath = path.join(rootDir, 'public', 'data', 'gerflor_linoleum_colors_complete.json');

// Read both files
const heterogeneousData = JSON.parse(fs.readFileSync(heterogeneousPath, 'utf8'));
const linoleumData = JSON.parse(fs.readFileSync(linoleumPath, 'utf8'));

console.log('Merging heterogeneous colors into linoleum structure...\n');

// Create a map of collections by slug
const linoleumCollectionsMap = new Map();
linoleumData.collections.forEach(col => {
  linoleumCollectionsMap.set(col.slug, col);
});

// Update linoleum collections with colors from heterogeneous data
heterogeneousData.collections.forEach(heteroCol => {
  const linoleumCol = linoleumCollectionsMap.get(heteroCol.slug);
  
  if (linoleumCol) {
    linoleumCol.colors = heteroCol.colors;
    linoleumCol.colorCount = heteroCol.colors.length;
    console.log(`  ✓ Updated ${linoleumCol.name}: ${linoleumCol.colorCount} colors`);
  } else {
    console.log(`  ⚠️  Collection ${heteroCol.slug} not found in linoleum structure`);
  }
});

// Calculate total
const totalColors = linoleumData.collections.reduce((sum, col) => sum + (col.colorCount || 0), 0);
linoleumData.totalColors = totalColors;
linoleumData.generatedAt = new Date().toISOString();

// Save updated file
fs.writeFileSync(linoleumPath, JSON.stringify(linoleumData, null, 2));

console.log(`\n✅ Updated ${linoleumPath}`);
console.log(`📊 Total colors: ${totalColors}`);
console.log(`\nCollections with colors:`);
linoleumData.collections.forEach(col => {
  if (col.colors && col.colors.length > 0) {
    console.log(`  ${col.name}: ${col.colorCount} colors`);
  } else {
    console.log(`  ${col.name}: 0 colors (needs scraping)`);
  }
});
