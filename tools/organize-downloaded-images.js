const fs = require('fs');
const path = require('path');

/**
 * Organize downloaded Gerflor images by watching a folder
 * 
 * Usage: node tools/organize-downloaded-images.js <collection-slug> <downloads-folder>
 * 
 * Example: node tools/organize-downloaded-images.js nerok-55 C:\Users\BORIVOJE\Downloads
 */

const rootDir = path.join(__dirname, '..');
const linoleumColorsPath = path.join(rootDir, 'public', 'data', 'gerflor_linoleum_colors_complete.json');

function organizeCollectionImages(collectionSlug, downloadsFolder) {
  console.log(`\n📦 Organizing images for: ${collectionSlug}`);
  console.log(`   Downloads folder: ${downloadsFolder}\n`);
  
  // Load colors data
  const colorsData = JSON.parse(fs.readFileSync(linoleumColorsPath, 'utf8'));
  const collection = colorsData.collections.find(c => c.slug === collectionSlug);
  
  if (!collection) {
    console.error(`❌ Collection "${collectionSlug}" not found in JSON!`);
    return;
  }
  
  console.log(`   Found collection: ${collection.name}`);
  console.log(`   Colors in collection: ${collection.colors.length}\n`);
  
  // Check if downloads folder exists
  if (!fs.existsSync(downloadsFolder)) {
    console.error(`❌ Downloads folder does not exist: ${downloadsFolder}`);
    return;
  }
  
  // Get all image files, sorted by modification time (newest first, then by name)
  const files = fs.readdirSync(downloadsFolder)
    .filter(file => /\.(jpg|jpeg|png|JPG|JPEG|PNG)$/i.test(file))
    .map(file => ({
      name: file,
      path: path.join(downloadsFolder, file),
      mtime: fs.statSync(path.join(downloadsFolder, file)).mtime
    }))
    .sort((a, b) => {
      // Sort by modification time (newest first)
      const timeDiff = b.mtime - a.mtime;
      if (timeDiff !== 0) return timeDiff;
      // Then by name
      return a.name.localeCompare(b.name);
    })
    .map(f => f.name);
  
  console.log(`   Found ${files.length} image files in downloads folder\n`);
  
  if (files.length === 0) {
    console.log('⚠️  No image files found in downloads folder');
    console.log('Please download images to the specified folder');
    return;
  }
  
  // Create target directory
  const targetDir = path.join(rootDir, 'public', 'images', 'products', 'vinyl', collectionSlug);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
    console.log(`   Created directory: ${targetDir}`);
  }
  
  // Match images to colors by order (first image = first color, etc.)
  const imagesToProcess = files.slice(0, collection.colors.length);
  
  console.log(`   Processing ${imagesToProcess.length} images...\n`);
  
  let organized = 0;
  
  for (let i = 0; i < imagesToProcess.length && i < collection.colors.length; i++) {
    const file = imagesToProcess[i];
    const color = collection.colors[i];
    const sourceFile = path.join(downloadsFolder, file);
    const colorSlug = color.slug.split('-').slice(-2).join('-');
    const targetFile = path.join(targetDir, `${colorSlug}.jpg`);
    
    if (fs.existsSync(sourceFile)) {
      // Copy file
      fs.copyFileSync(sourceFile, targetFile);
      
      // Update color data with image path
      color.image = `/images/products/vinyl/${collectionSlug}/${colorSlug}.jpg`;
      
      organized++;
      
      if (organized % 10 === 0) {
        console.log(`    ✓ Organized ${organized}/${imagesToProcess.length} images...`);
      }
    }
  }
  
  console.log(`\n   ✅ Organized ${organized} images`);
  console.log(`   📊 Collection: ${collection.name}`);
  console.log(`   🎨 Colors with images: ${collection.colors.filter(c => c.image).length}/${collection.colors.length}\n`);
  
  // Save updated JSON
  colorsData.generatedAt = new Date().toISOString();
  fs.writeFileSync(linoleumColorsPath, JSON.stringify(colorsData, null, 2));
  
  console.log(`   💾 Updated: ${linoleumColorsPath}\n`);
}

// Main
const collectionSlug = process.argv[2];
const downloadsFolder = process.argv[3] || path.join(process.env.USERPROFILE || process.env.HOME || '', 'Downloads');

if (!collectionSlug) {
  console.log('Usage: node tools/organize-downloaded-images.js <collection-slug> [downloads-folder]');
  console.log('\nExample:');
  console.log('  node tools/organize-downloaded-images.js nerok-55');
  console.log('  node tools/organize-downloaded-images.js nerok-55 C:\\Users\\BORIVOJE\\Downloads');
  console.log('\nAvailable collections:');
  const colorsData = JSON.parse(fs.readFileSync(linoleumColorsPath, 'utf8'));
  colorsData.collections.forEach(col => {
    console.log(`  - ${col.slug} (${col.name})`);
  });
  process.exit(1);
}

organizeCollectionImages(collectionSlug, downloadsFolder);
