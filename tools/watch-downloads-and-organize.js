const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const linoleumColorsPath = path.join(rootDir, 'public', 'data', 'gerflor_linoleum_colors_complete.json');

// Map URL patterns to collection slugs
function getCollectionFromUrl(url) {
  if (!url) return null;
  
  // Patterns: /products/nerok-55-0476-noma-miel-28130476
  const match = url.match(/\/products\/([^/]+)-(\d{4})-/);
  if (match) {
    return match[1]; // collection slug
  }
  
  return null;
}

function organizeByUrl(downloadsFolder) {
  console.log('👀 Watching downloads folder and organizing by source URL...\n');
  console.log(`   Downloads folder: ${downloadsFolder}\n`);
  
  // Load colors data
  const colorsData = JSON.parse(fs.readFileSync(linoleumColorsPath, 'utf8'));
  
  // Check if downloads folder exists
  if (!fs.existsSync(downloadsFolder)) {
    console.error(`❌ Downloads folder does not exist: ${downloadsFolder}`);
    return;
  }
  
  // Get all image files
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
    .sort((a, b) => b.mtime - a.mtime); // Newest first
  
  console.log(`   Found ${files.length} image files\n`);
  
  if (files.length === 0) {
    console.log('⚠️  No image files found');
    return;
  }
  
  // Try to read browser download history or check file metadata
  // For now, we'll try to extract info from filename or check if there's a download log
  
  // Check Chrome download history (if accessible)
  const chromeHistoryPath = path.join(
    process.env.LOCALAPPDATA || process.env.HOME || '',
    'Google',
    'Chrome',
    'User Data',
    'Default',
    'History'
  );
  
  const organized = new Map(); // collection -> [files]
  
  // For each file, try to determine collection
  files.forEach(file => {
    // Try to extract collection from filename
    // Pattern might be: nerok-55-0476-noma-miel.jpg or similar
    const filenameMatch = file.name.match(/([a-z-]+)-(\d{4})/i);
    if (filenameMatch) {
      const collectionSlug = filenameMatch[1].toLowerCase();
      const code = filenameMatch[2];
      
      // Find collection
      const collection = colorsData.collections.find(c => c.slug === collectionSlug);
      if (collection) {
        if (!organized.has(collectionSlug)) {
          organized.set(collectionSlug, []);
        }
        organized.get(collectionSlug).push({ file, code, collection });
      }
    }
  });
  
  // Organize each collection
  organized.forEach((files, collectionSlug) => {
    const collection = files[0].collection;
    console.log(`\n📦 ${collection.name} (${collection.colors.length} colors)...`);
    
    // Create target directory
    const targetDir = path.join(rootDir, 'public', 'images', 'products', 'vinyl', collectionSlug);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    
    // Match files to colors by code
    let matched = 0;
    files.forEach(({ file, code }) => {
      const color = collection.colors.find(c => c.code === code);
      if (color) {
        const colorSlug = color.slug.split('-').slice(-2).join('-');
        const targetFile = path.join(targetDir, `${colorSlug}.jpg`);
        
        // Copy file
        fs.copyFileSync(file.path, targetFile);
        color.image = `/images/products/vinyl/${collectionSlug}/${colorSlug}.jpg`;
        matched++;
      }
    });
    
    console.log(`   ✅ Matched ${matched} images`);
    
    // Save updated JSON
    colorsData.generatedAt = new Date().toISOString();
    fs.writeFileSync(linoleumColorsPath, JSON.stringify(colorsData, null, 2));
  });
  
  console.log(`\n💾 Updated: ${linoleumColorsPath}\n`);
}

// Main
const downloadsFolder = process.argv[2] || path.join(process.env.USERPROFILE || process.env.HOME || '', 'Downloads');

console.log('🚀 Watching downloads and organizing by source URL...\n');
organizeByUrl(downloadsFolder);
