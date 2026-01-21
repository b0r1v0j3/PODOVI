const fs = require('fs');
const path = require('path');

/**
 * Organize color images for heterogeneous vinyl collections
 * 
 * Usage: node tools/organize-heterogeneous-vinyl-colors.js <collection-slug> <source-path>
 * 
 * Example: node tools/organize-heterogeneous-vinyl-colors.js nerok-55 ./tmp/nerok-55-images
 */

const rootDir = path.join(__dirname, '..');
const linoleumColorsPath = path.join(rootDir, 'public', 'data', 'gerflor_linoleum_colors_complete.json');

// Collection slug mappings (from JSON to folder names)
const collectionSlugMap = {
  'nerok-55': 'nerok-55',
  'nerok-70': 'nerok-70',
  'premium-acoustic': 'premium-acoustic',
  'premium-compact': 'premium-compact',
  'taralay-impression-acoustic': 'taralay-impression-acoustic',
  'taralay-impression-compact': 'taralay-impression-compact',
  'taralay-impression-hop-acoustic': 'taralay-impression-hop-acoustic',
  'taralay-impression-hop-compact': 'taralay-impression-hop-compact',
  'taralay-initial-acoustic': 'taralay-initial-acoustic',
  'taralay-initial-compact': 'taralay-initial-compact',
  'taralay-millenium-acoustic-order': 'taralay-millenium-acoustic-order',
  'taralay-millenium-compact': 'taralay-millenium-compact'
};

function normalizeFileName(fileName) {
  // Remove extension
  let name = fileName.replace(/\.(jpg|jpeg|png|gif|webp)$/i, '');
  
  // Try to extract color code (4 digits)
  const codeMatch = name.match(/(\d{4})/);
  if (codeMatch) {
    return codeMatch[1];
  }
  
  // Try to extract from patterns like "0476 NOMA MIEL" or "0476-noma-miel"
  const parts = name.split(/[\s_-]+/);
  for (const part of parts) {
    if (/^\d{4}$/.test(part)) {
      return part;
    }
  }
  
  return null;
}

function findColorByCode(colors, code) {
  return colors.find(c => c.code === code);
}

function organizeCollectionImages(collectionSlug, sourcePath) {
  console.log(`\n📦 Organizing images for: ${collectionSlug}`);
  console.log(`   Source: ${sourcePath}\n`);
  
  // Load colors data
  const colorsData = JSON.parse(fs.readFileSync(linoleumColorsPath, 'utf8'));
  const collection = colorsData.collections.find(c => c.slug === collectionSlug);
  
  if (!collection) {
    console.error(`❌ Collection "${collectionSlug}" not found in JSON!`);
    return;
  }
  
  console.log(`   Found collection: ${collection.name}`);
  console.log(`   Colors in collection: ${collection.colors.length}\n`);
  
  // Check if source path exists
  if (!fs.existsSync(sourcePath)) {
    console.error(`❌ Source path does not exist: ${sourcePath}`);
    return;
  }
  
  // Get all image files
  const files = fs.readdirSync(sourcePath).filter(file => 
    /\.(jpg|jpeg|png|gif|webp)$/i.test(file)
  );
  
  console.log(`   Found ${files.length} image files\n`);
  
  // Create target directory
  const targetDir = path.join(rootDir, 'public', 'images', 'products', 'vinyl', collectionSlug);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
    console.log(`   Created directory: ${targetDir}`);
  }
  
  let organized = 0;
  let notFound = [];
  
  // Organize each image
  files.forEach(file => {
    const sourceFile = path.join(sourcePath, file);
    const code = normalizeFileName(file);
    
    if (!code) {
      console.log(`   ⚠️  Could not extract code from: ${file}`);
      notFound.push(file);
      return;
    }
    
    const color = findColorByCode(collection.colors, code);
    
    if (!color) {
      console.log(`   ⚠️  Color with code ${code} not found in collection`);
      notFound.push(file);
      return;
    }
    
    // Create filename: code-color-name.jpg
    const colorSlug = color.slug.split('-').slice(-2).join('-'); // Get last two parts (code-name)
    const targetFile = path.join(targetDir, `${colorSlug}.jpg`);
    
    // Copy file
    fs.copyFileSync(sourceFile, targetFile);
    
    // Update color data with image path
    const imagePath = `/images/products/vinyl/${collectionSlug}/${colorSlug}.jpg`;
    color.image = imagePath;
    
    organized++;
    if (organized % 10 === 0) {
      console.log(`   ✓ Organized ${organized} images...`);
    }
  });
  
  console.log(`\n   ✅ Organized ${organized} images`);
  if (notFound.length > 0) {
    console.log(`   ⚠️  ${notFound.length} images could not be matched`);
  }
  
  // Save updated JSON
  colorsData.generatedAt = new Date().toISOString();
  fs.writeFileSync(linoleumColorsPath, JSON.stringify(colorsData, null, 2));
  
  console.log(`\n   💾 Updated: ${linoleumColorsPath}`);
  console.log(`   📊 Collection now has ${collection.colors.filter(c => c.image).length} colors with images\n`);
}

// Main
const collectionSlug = process.argv[2];
const sourcePath = process.argv[3];

if (!collectionSlug || !sourcePath) {
  console.log('Usage: node tools/organize-heterogeneous-vinyl-colors.js <collection-slug> <source-path>');
  console.log('\nExample:');
  console.log('  node tools/organize-heterogeneous-vinyl-colors.js nerok-55 ./tmp/nerok-55-images');
  console.log('\nAvailable collections:');
  Object.keys(collectionSlugMap).forEach(slug => {
    console.log(`  - ${slug}`);
  });
  process.exit(1);
}

organizeCollectionImages(collectionSlug, sourcePath);
