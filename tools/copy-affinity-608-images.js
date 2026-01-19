const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const sourceDir = path.join(rootDir, 'public', 'images', 'products', 'vinyl', 'mipolam-affinity');
const destDir = path.join(rootDir, 'public', 'images', 'products', 'vinyl', 'mipolam-affinity-608x608');
const colorsDataPath = path.join(rootDir, 'public', 'data', 'vinyl_colors_complete.json');

// Read colors data
const colorsData = JSON.parse(fs.readFileSync(colorsDataPath, 'utf8'));

// Get both collections
const affinityCollection = colorsData.collections.find(c => c.slug === 'mipolam-affinity');
const affinity608Collection = colorsData.collections.find(c => c.slug === 'mipolam-affinity-608x608');

if (!affinityCollection || !affinity608Collection) {
  console.error('Collections not found!');
  process.exit(1);
}

console.log(`Mipolam Affinity: ${affinityCollection.colors.length} colors`);
console.log(`Mipolam Affinity 608x608: ${affinity608Collection.colors.length} colors\n`);

// Create destination directory
if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

// Copy all color images from affinity to affinity-608x608
const colorFiles = fs.readdirSync(sourceDir)
  .filter(file => file.endsWith('.jpg') && file !== 'collection.jpg');

console.log(`Copying ${colorFiles.length} color images...\n`);

let copiedCount = 0;

colorFiles.forEach(file => {
  const sourcePath = path.join(sourceDir, file);
  const destPath = path.join(destDir, file);
  
  fs.copyFileSync(sourcePath, destPath);
  console.log(`  ✓ ${file}`);
  copiedCount++;
});

console.log(`\n✅ Copied ${copiedCount} color images to mipolam-affinity-608x608`);

// Update JSON: for each color in affinity-608x608, find matching color in affinity and copy image path
console.log('\nUpdating JSON file...\n');

affinity608Collection.colors.forEach(color608 => {
  // Find matching color in affinity collection by code
  const matchingColor = affinityCollection.colors.find(c => c.code === color608.code);
  
  if (matchingColor && matchingColor.image) {
    // Update image path to point to affinity-608x608 directory
    const imageFileName = path.basename(matchingColor.image);
    color608.image = `/images/products/vinyl/mipolam-affinity-608x608/${imageFileName}`;
    console.log(`  ✓ ${color608.code} ${color608.name} - image path updated`);
  } else {
    console.log(`  ✗ ${color608.code} ${color608.name} - no matching color found in Affinity`);
  }
});

// Save updated JSON
fs.writeFileSync(colorsDataPath, JSON.stringify(colorsData, null, 2));

console.log(`\n✅ Updated vinyl_colors_complete.json with image paths for Mipolam Affinity 608x608`);
console.log(`📁 ${colorsDataPath}`);
