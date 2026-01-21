const { chromium } = require('playwright');
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
  const match = url.match(/\/products\/([^/]+)$/);
  if (match) {
    const collectionSlug = match[1];
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

async function autoTrackEverything() {
  console.log('🚀 Otvorio sam Chrome. Ti idi redom i preuzimaj, ja pratim SVE automatski.\n');
  console.log('Kada završiš, pritisni ENTER u terminalu.\n');
  
  const browser = await chromium.launch({ 
    headless: false, 
    slowMo: 100 
  });
  
  const context = await browser.newContext({
    acceptDownloads: true
  });
  
  const page = await context.newPage();
  
  const tracked = loadTrackedUrls();
  const downloads = new Map(); // url -> {download, color}
  
  // Track all navigations
  page.on('framenavigated', async (frame) => {
    if (frame === page.mainFrame()) {
      const url = frame.url();
      
      // Try to extract color
      const color = extractColorFromUrl(url);
      if (color) {
        const exists = tracked.colors.some(c => c.href === url);
        if (!exists) {
          tracked.colors.push(color);
          saveTrackedUrls(tracked);
          console.log(`  ✓ Color: ${color.collection_name} - ${color.code} ${color.name} (${tracked.colors.length} total)`);
        }
      } else {
        // Try to extract collection
        const collection = extractCollectionFromUrl(url);
        if (collection) {
          const exists = tracked.collections.some(c => c.url === url);
          if (!exists) {
            tracked.collections.push(collection);
            saveTrackedUrls(tracked);
            console.log(`  ✓ Collection: ${collection.name}`);
          }
        }
      }
    }
  });
  
  // Track downloads
  page.on('download', async (download) => {
    const url = download.url();
    console.log(`  📥 Download: ${url}`);
    
    // Try to find matching color from tracked URLs
    const color = tracked.colors.find(c => {
      // Check if download URL contains color code or is from same collection
      return url.includes(c.code) || url.includes(c.collection_slug);
    });
    
    if (color) {
      downloads.set(url, { download, color });
      console.log(`    → ${color.collection_name} - ${color.code} ${color.name}`);
    } else {
      // Try to extract from download URL
      const extractedColor = extractColorFromUrl(url);
      if (extractedColor) {
        downloads.set(url, { download, color: extractedColor });
        console.log(`    → ${extractedColor.collection_name} - ${extractedColor.code} ${extractedColor.name}`);
      }
    }
  });
  
  // Process downloads when they complete
  setInterval(async () => {
    for (const [url, { download, color }] of downloads.entries()) {
      try {
        const downloadPath = await download.path();
        
        if (downloadPath && fs.existsSync(downloadPath)) {
          // Create target directory
          const targetDir = path.join(rootDir, 'public', 'images', 'products', 'vinyl', color.collection_slug);
          if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
          }
          
          // Move file
          const colorSlug = color.slug.split('-').slice(-2).join('-');
          const targetFile = path.join(targetDir, `${colorSlug}.jpg`);
          
          fs.renameSync(downloadPath, targetFile);
          
          // Update color data
          color.image = `/images/products/vinyl/${color.collection_slug}/${colorSlug}.jpg`;
          
          // Save updated JSON
          const colorsData = JSON.parse(fs.readFileSync(linoleumColorsPath, 'utf8'));
          const existingCol = colorsData.collections.find(c => c.slug === color.collection_slug);
          if (existingCol) {
            const existingColor = existingCol.colors.find(c => c.code === color.code);
            if (existingColor) {
              existingColor.image = color.image;
            } else {
              // Add new color
              existingCol.colors.push(color);
              existingCol.colorCount = existingCol.colors.length;
            }
          } else {
            // Add new collection
            colorsData.collections.push({
              name: color.collection_name,
              slug: color.collection_slug,
              url: `https://www.gerflor-cee.com/products/${color.collection_slug}`,
              colors: [color],
              colorCount: 1
            });
          }
          
          colorsData.totalColors = colorsData.collections.reduce((sum, col) => sum + (col.colorCount || 0), 0);
          colorsData.generatedAt = new Date().toISOString();
          fs.writeFileSync(linoleumColorsPath, JSON.stringify(colorsData, null, 2));
          
          console.log(`    ✅ Saved: ${color.collection_name} - ${color.code} ${color.name}`);
          
          // Remove from downloads map
          downloads.delete(url);
        }
      } catch (e) {
        // Download might still be in progress
      }
    }
  }, 2000); // Check every 2 seconds
  
  try {
    // Navigate to base URL
    const baseUrl = 'https://www.gerflor-cee.com/category/heterogeneous-rolls';
    console.log(`Opening: ${baseUrl}`);
    await page.goto(baseUrl, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(2000);
    
    console.log('\n👆 Sada idi redom i preuzimaj slike. Ja pratim SVE automatski.\n');
    console.log('Kada završiš, pritisni ENTER u terminalu.\n');
    
    // Wait for user to press Enter
    await new Promise((resolve) => {
      const readline = require('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      rl.question('Pritisni ENTER kada završiš...\n', () => {
        rl.close();
        resolve();
      });
    });
    
    // Wait for any remaining downloads
    console.log('\n⏳ Waiting for downloads to complete...\n');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    console.log(`\n✅ Finished!`);
    console.log(`📊 Tracked: ${tracked.colors.length} colors, ${tracked.collections.length} collections`);
    console.log(`💾 Saved: ${trackedUrlsPath}`);
    console.log(`💾 Updated: ${linoleumColorsPath}\n`);
    
    // Show summary
    const colorsData = JSON.parse(fs.readFileSync(linoleumColorsPath, 'utf8'));
    const byCollection = new Map();
    tracked.colors.forEach(c => {
      if (!byCollection.has(c.collection_slug)) {
        byCollection.set(c.collection_slug, 0);
      }
      byCollection.set(c.collection_slug, byCollection.get(c.collection_slug) + 1);
    });
    
    console.log('📊 Summary by collection:');
    byCollection.forEach((count, slug) => {
      const col = colorsData.collections.find(c => c.slug === slug);
      const withImages = col ? col.colors.filter(c => c.image).length : 0;
      console.log(`  ${slug}: ${count} colors tracked, ${withImages} with images`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    console.log('\n\nPritisni ENTER da zatvorim browser...');
    await new Promise((resolve) => {
      const readline = require('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      rl.question('', () => {
        rl.close();
        resolve();
      });
    });
    
    await browser.close();
  }
}

autoTrackEverything().catch(console.error);
