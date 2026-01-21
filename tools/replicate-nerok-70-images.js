const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const colorsJsonPath = path.join(rootDir, 'public', 'data', 'gerflor_linoleum_colors_complete.json');

const data = JSON.parse(fs.readFileSync(colorsJsonPath, 'utf8'));
const nerok55 = data.collections.find(c => c.slug === 'nerok-55');
const nerok70 = data.collections.find(c => c.slug === 'nerok-70');

if (!nerok55 || !nerok70) {
  console.log('❌ Collections not found');
  process.exit(1);
}

// Create a map of Nerok 55 colors by code for quick lookup
const nerok55Map = new Map();
nerok55.colors.forEach(color => {
  nerok55Map.set(color.code, color);
});

// Update Nerok 70 colors with images from Nerok 55
let updated = 0;
nerok70.colors.forEach(color => {
  const nerok55Color = nerok55Map.get(color.code);
  if (nerok55Color && nerok55Color.image) {
    // Replace nerok-55 with nerok-70 in the image path
    color.image = nerok55Color.image.replace('/nerok-55/', '/nerok-70/');
    updated++;
  }
});

nerok70.colorCount = nerok70.colors.length;

// Update total colors
data.totalColors = data.collections.reduce((sum, col) => sum + (col.colorCount || col.colors.length || 0), 0);
data.generatedAt = new Date().toISOString();

// Save updated JSON
fs.writeFileSync(colorsJsonPath, JSON.stringify(data, null, 2));

console.log(`✅ Updated ${updated} colors for Nerok 70`);
console.log(`📊 Nerok 70: ${nerok70.colors.filter(c => c.image).length}/${nerok70.colors.length} colors have images`);
console.log(`💾 Updated: ${colorsJsonPath}`);
