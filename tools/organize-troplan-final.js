const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const troplanDir = path.join(rootDir, 'public', 'images', 'products', 'vinyl', 'mipolam-troplan');

// Mapping of root files to destination filenames
const imageMapping = [
  { source: '1003 light ocre.jpg', dest: '1003-light-ocre.jpg' },
  { source: '1004 earth.jpg', dest: '1004-earth.jpg' },
  { source: '1032 yellow.jpg', dest: '1032-yellow.jpg' },
  { source: '1035 ocre.jpg', dest: '1035-ocre.jpg' },
  { source: '1037 medium green.jpg', dest: '1037-medium-green.jpg' },
  { source: '1040 dark grey.jpg', dest: '1040-dark-grey.jpg' },
  { source: '1055 apricot.jpg', dest: '1055-apricot.jpg' },
  { source: '1057 dark green.jpg', dest: '1057-dark-green.jpg' },
  { source: '1059 blue grey.jpg', dest: '1059-blue-grey.jpg' },
  { source: '1060 anthracite.jpg', dest: '1060-anthracite.jpg' },
];

console.log('Organizing Troplan color images...\n');

// Ensure destination directory exists
if (!fs.existsSync(troplanDir)) {
  fs.mkdirSync(troplanDir, { recursive: true });
}

let copiedCount = 0;

imageMapping.forEach(({ source, dest }) => {
  const sourcePath = path.join(rootDir, source);
  const destPath = path.join(troplanDir, dest);
  
  if (fs.existsSync(sourcePath)) {
    fs.copyFileSync(sourcePath, destPath);
    console.log(`  ✓ ${source} → ${dest}`);
    copiedCount++;
  } else {
    console.log(`  ✗ ${source} not found`);
  }
});

console.log(`\n✅ Copied ${copiedCount} images to ${troplanDir}`);

// Now update JSON file
console.log('\nUpdating vinyl_colors_complete.json...');

const colorsDataPath = path.join(rootDir, 'public', 'data', 'vinyl_colors_complete.json');
const colorsData = JSON.parse(fs.readFileSync(colorsDataPath, 'utf8'));

const troplanCollection = colorsData.collections.find(c => c.slug === 'mipolam-troplan');
if (troplanCollection) {
  let updatedCount = 0;
  
  troplanCollection.colors.forEach(color => {
    const imageFileName = `${color.code}-${color.name.toLowerCase().replace(/\s+/g, '-')}.jpg`;
    const imagePath = `/images/products/vinyl/mipolam-troplan/${imageFileName}`;
    const fullPath = path.join(rootDir, 'public', imagePath);
    
    if (fs.existsSync(fullPath)) {
      color.image = imagePath;
      updatedCount++;
    }
  });
  
  fs.writeFileSync(colorsDataPath, JSON.stringify(colorsData, null, 2));
  console.log(`✅ Updated ${updatedCount} color entries in JSON file`);
} else {
  console.error('❌ Mipolam Troplan collection not found in JSON!');
}

// Delete source files from root
console.log('\nCleaning up source files from root directory...');
let deletedCount = 0;

imageMapping.forEach(({ source }) => {
  const sourcePath = path.join(rootDir, source);
  if (fs.existsSync(sourcePath)) {
    fs.unlinkSync(sourcePath);
    console.log(`  ✓ Deleted ${source}`);
    deletedCount++;
  }
});

console.log(`\n✅ Deleted ${deletedCount} source files from root`);
console.log(`\n🎉 All done! Mipolam Troplan collection is complete with all 18 color images.`);
