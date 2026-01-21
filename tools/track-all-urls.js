const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const linoleumColorsPath = path.join(rootDir, 'public', 'data', 'gerflor_linoleum_colors_complete.json');
const trackedUrlsPath = path.join(rootDir, 'tools', 'tracked-urls.json');

// Load or create tracked URLs
function loadTrackedUrls() {
  if (fs.existsSync(trackedUrlsPath)) {
    return JSON.parse(fs.readFileSync(trackedUrlsPath, 'utf8'));
  }
  return { colors: [], collections: [] };
}

function saveTrackedUrls(data) {
  fs.writeFileSync(trackedUrlsPath, JSON.stringify(data, null, 2));
}

function extractColorFromUrl(url) {
  // Pattern: /products/nerok-55-0476-noma-miel-28130476
  const match = url.match(/\/products\/([^/]+)-(\d{4})-([a-z-]+)-(\d+)$/);
  if (match) {
    const [, collectionSlug, code, namePart, sku] = match;
    const name = namePart.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
    
    return {
      code: code,
      name: name.toUpperCase(),
      slug: `${collectionSlug}-${code}-${namePart}`,
      href: url,
      sku: sku,
      collection_slug: collectionSlug,
      collection_name: collectionSlug.split('-').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ')
    };
  }
  return null;
}

function extractCollectionFromUrl(url) {
  // Pattern: /products/nerok-55
  const match = url.match(/\/products\/([^/]+)$/);
  if (match) {
    const collectionSlug = match[1];
    // Check if it's not a color (doesn't have 4-digit code)
    if (!collectionSlug.match(/\d{4}/)) {
      return {
        slug: collectionSlug,
        name: collectionSlug.split('-').map(word => 
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' '),
        url: url
      };
    }
  }
  return null;
}

function trackUrl(url) {
  const tracked = loadTrackedUrls();
  
  // Check if already tracked
  if (tracked.colors.some(c => c.href === url) || tracked.collections.some(c => c.url === url)) {
    return false; // Already tracked
  }
  
  // Try to extract color
  const color = extractColorFromUrl(url);
  if (color) {
    tracked.colors.push(color);
    console.log(`  ✓ New color: ${color.collection_name} - ${color.code} ${color.name}`);
    return true;
  }
  
  // Try to extract collection
  const collection = extractCollectionFromUrl(url);
  if (collection) {
    tracked.collections.push(collection);
    console.log(`  ✓ Collection: ${collection.name}`);
    return true;
  }
  
  return false;
}

function organizeDownloadedImages(downloadsFolder) {
  console.log('\n📥 Organizing downloaded images...\n');
  
  const tracked = loadTrackedUrls();
  const colorsData = JSON.parse(fs.readFileSync(linoleumColorsPath, 'utf8'));
  
  // Get all image files, sorted by modification time (newest first)
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
    .sort((a, b) => b.mtime - a.mtime);
  
  console.log(`   Found ${files.length} image files\n`);
  
  if (files.length === 0) {
    return;
  }
  
  // Group tracked colors by collection
  const colorsByCollection = new Map();
  tracked.colors.forEach(color => {
    if (!colorsByCollection.has(color.collection_slug)) {
      colorsByCollection.set(color.collection_slug, []);
    }
    colorsByCollection.get(color.collection_slug).push(color);
  });
  
  // Organize images for each collection
  let fileIndex = 0;
  
  colorsByCollection.forEach((colors, collectionSlug) => {
    const collection = colorsData.collections.find(c => c.slug === collectionSlug);
    if (!collection) {
      console.log(`  ⚠️  Collection ${collectionSlug} not found in JSON, skipping...`);
      return;
    }
    
    console.log(`\n📦 ${collection.name} (${colors.length} colors tracked)...`);
    
    // Create target directory
    const targetDir = path.join(rootDir, 'public', 'images', 'products', 'vinyl', collectionSlug);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    
    // Match images to tracked colors by order
    let organized = 0;
    for (let i = 0; i < colors.length && fileIndex < files.length; i++) {
      const color = colors[i];
      const imageFile = files[fileIndex];
      const colorSlug = color.slug.split('-').slice(-2).join('-');
      const targetFile = path.join(targetDir, `${colorSlug}.jpg`);
      
      // Copy file
      fs.copyFileSync(imageFile.path, targetFile);
      
      // Update color in JSON
      const jsonColor = collection.colors.find(c => c.code === color.code);
      if (jsonColor) {
        jsonColor.image = `/images/products/vinyl/${collectionSlug}/${colorSlug}.jpg`;
      } else {
        // Add new color to collection
        collection.colors.push({
          ...color,
          image: `/images/products/vinyl/${collectionSlug}/${colorSlug}.jpg`
        });
        collection.colorCount = collection.colors.length;
      }
      
      organized++;
      fileIndex++;
    }
    
    console.log(`   ✅ Organized ${organized} images`);
  });
  
  // Save updated JSON
  colorsData.totalColors = colorsData.collections.reduce((sum, col) => sum + (col.colorCount || 0), 0);
  colorsData.generatedAt = new Date().toISOString();
  fs.writeFileSync(linoleumColorsPath, JSON.stringify(colorsData, null, 2));
  
  console.log(`\n💾 Updated: ${linoleumColorsPath}`);
  console.log(`📊 Total colors: ${colorsData.totalColors}\n`);
}

// Main
const command = process.argv[2];
const arg = process.argv[3];

if (command === 'track' && arg) {
  // Track a URL
  const url = arg;
  console.log(`\n🔍 Tracking URL: ${url}\n`);
  const wasNew = trackUrl(url);
  if (wasNew) {
    saveTrackedUrls(loadTrackedUrls());
    console.log('  ✅ URL tracked and saved\n');
  } else {
    console.log('  ℹ️  URL already tracked or not a valid color/collection URL\n');
  }
} else if (command === 'organize') {
  // Organize downloaded images
  const downloadsFolder = arg || path.join(process.env.USERPROFILE || process.env.HOME || '', 'Downloads');
  organizeDownloadedImages(downloadsFolder);
} else if (command === 'status') {
  // Show status
  const tracked = loadTrackedUrls();
  console.log('\n📊 Tracked URLs Status:\n');
  console.log(`  Collections: ${tracked.collections.length}`);
  tracked.collections.forEach(c => {
    console.log(`    - ${c.name} (${c.slug})`);
  });
  console.log(`\n  Colors: ${tracked.colors.length}`);
  const byCollection = new Map();
  tracked.colors.forEach(c => {
    if (!byCollection.has(c.collection_slug)) {
      byCollection.set(c.collection_slug, 0);
    }
    byCollection.set(c.collection_slug, byCollection.get(c.collection_slug) + 1);
  });
  byCollection.forEach((count, slug) => {
    console.log(`    - ${slug}: ${count} colors`);
  });
  console.log();
} else {
  console.log('Usage:');
  console.log('  node tools/track-all-urls.js track <url>          - Track a URL');
  console.log('  node tools/track-all-urls.js organize [folder]     - Organize downloaded images');
  console.log('  node tools/track-all-urls.js status               - Show tracked URLs status');
  console.log('\nExample:');
  console.log('  node tools/track-all-urls.js track https://www.gerflor-cee.com/products/nerok-55-0476-noma-miel-28130476');
  console.log('  node tools/track-all-urls.js organize');
}
