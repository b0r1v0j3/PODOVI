const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const linoleumColorsPath = path.join(rootDir, 'public', 'data', 'gerflor_linoleum_colors_complete.json');

function organizeCollection(collectionSlug, downloadsFolder) {
  console.log(`\n📦 Organizing images for: ${collectionSlug}`);
  console.log(`   Downloads folder: ${downloadsFolder}\n`);
  
  // Load colors data
  const colorsData = JSON.parse(fs.readFileSync(linoleumColorsPath, 'utf8'));
  const collection = colorsData.collections.find(c => c.slug === collectionSlug);
  
  if (!collection) {
    console.error(`❌ Collection "${collectionSlug}" not found!`);
    console.log('\nAvailable collections:');
    colorsData.collections.forEach(col => {
      console.log(`  - ${col.slug} (${col.name})`);
    });
    return;
  }
  
  console.log(`   Found: ${collection.name}`);
  console.log(`   Colors: ${collection.colors.length}\n`);
  
  // Check if downloads folder exists
  if (!fs.existsSync(downloadsFolder)) {
    console.error(`❌ Downloads folder does not exist: ${downloadsFolder}`);
    return;
  }
  
  // Get all image files, sorted by modification time (newest first = last downloaded first)
  const files = fs.readdirSync(downloadsFolder)
    .filter(file => /\.(jpg|jpeg|png|JPG|JPEG|PNG)$/i.test(file))
    .map(file => {
      const filePath = path.join(downloadsFolder, file);
      const stats = fs.statSync(filePath);
      return {
        name: file,
        path: filePath,
        mtime: stats.mtime
      };
    })
    .sort((a, b) => b.mtime - a.mtime); // Newest first (last downloaded = first in list)
  
  console.log(`   Found ${files.length} image files in downloads folder\n`);
  
  if (files.length === 0) {
    console.log('⚠️  No image files found');
    return;
  }
  
  // Take first N files (where N = number of colors in collection)
  const imagesToUse = files.slice(0, collection.colors.length);
  
  console.log(`   Using ${imagesToUse.length} images (matching to ${collection.colors.length} colors)\n`);
  
  // Create target directory
  const targetDir = path.join(rootDir, 'public', 'images', 'products', 'vinyl', collectionSlug);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
    console.log(`   Created directory: ${targetDir}\n`);
  }
  
  let organized = 0;
  
  // Match images to colors by order (first image = first color, etc.)
  for (let i = 0; i < imagesToUse.length && i < collection.colors.length; i++) {
    const imageFile = imagesToUse[i];
    const color = collection.colors[i];
    const colorSlug = color.slug.split('-').slice(-2).join('-');
    const targetFile = path.join(targetDir, `${colorSlug}.jpg`);
    
    // Copy file
    fs.copyFileSync(imageFile.path, targetFile);
    
    // Update color data
    color.image = `/images/products/vinyl/${collectionSlug}/${colorSlug}.jpg`;
    
    organized++;
    
    if (organized % 10 === 0) {
      console.log(`    ✓ Organized ${organized}/${imagesToUse.length} images...`);
    }
  }
  
  console.log(`\n   ✅ Organized ${organized} images`);
  console.log(`   📊 ${collection.name}: ${collection.colors.filter(c => c.image).length}/${collection.colors.length} colors with images\n`);
  
  // Save updated JSON
  colorsData.generatedAt = new Date().toISOString();
  fs.writeFileSync(linoleumColorsPath, JSON.stringify(colorsData, null, 2));
  
  console.log(`   💾 Updated: ${linoleumColorsPath}\n`);
}

// Main
const collectionSlug = process.argv[2];
const downloadsFolder = process.argv[3] || path.join(process.env.USERPROFILE || process.env.HOME || '', 'Downloads');

if (!collectionSlug) {
  console.log('Usage: node tools/organize-by-collection.js <collection-slug> [downloads-folder]');
  console.log('\nExample:');
  console.log('  node tools/organize-by-collection.js nerok-55');
  console.log('  node tools/organize-by-collection.js nerok-55 C:\\Users\\BORIVOJE\\Downloads');
  console.log('\nAvailable collections:');
  const colorsData = JSON.parse(fs.readFileSync(linoleumColorsPath, 'utf8'));
  colorsData.collections.forEach(col => {
    console.log(`  - ${col.slug} (${col.name})`);
  });
  process.exit(1);
}

organizeCollection(collectionSlug, downloadsFolder);
