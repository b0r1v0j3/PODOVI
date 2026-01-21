const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const linoleumColorsPath = path.join(rootDir, 'public', 'data', 'gerflor_linoleum_colors_complete.json');
const screenshotsDir = path.join(rootDir, 'tools', 'screenshots');
const activityLogPath = path.join(rootDir, 'tools', 'activity-log.json');

// Create screenshots directory
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

async function recordAndFollow() {
  console.log('🚀 Otvorio sam Chrome. Snimam 20 screenshot-a u sekundi i pratim SVE.\n');
  
  const browser = await chromium.launch({ 
    headless: false, 
    slowMo: 50 
  });
  
  const context = await browser.newContext({
    acceptDownloads: true
  });
  
  const page = await context.newPage();
  
  const trackedColors = new Map(); // href -> color data
  const downloads = new Map(); // download -> color
  const activityLog = {
    startTime: new Date().toISOString(),
    navigations: [],
    downloads: [],
    screenshots: []
  };
  
  let screenshotCount = 0;
  
  // Take screenshots only on navigation (not continuously)
  // Removed continuous screenshots to avoid screen shaking
  
  // Track all navigations
  page.on('framenavigated', async (frame) => {
    if (frame === page.mainFrame()) {
      const url = frame.url();
      const timestamp = new Date().toISOString();
      
      // Take screenshot only on navigation
      try {
        screenshotCount++;
        const screenshotPath = path.join(screenshotsDir, `screenshot-${timestamp}-${screenshotCount}.png`);
        await page.screenshot({ path: screenshotPath, fullPage: false });
        activityLog.screenshots.push({
          timestamp,
          path: screenshotPath,
          url
        });
      } catch (e) {
        // Ignore screenshot errors
      }
      
      activityLog.navigations.push({
        timestamp,
        url
      });
      
      // Extract color from URL
      const match = url.match(/\/products\/([^/]+)-(\d{4})-([a-z-]+)-(\d+)$/);
      if (match) {
        const [, collectionSlug, code, namePart, sku] = match;
        const name = namePart.split('-').map(word => 
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
        
        const color = {
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
        
        trackedColors.set(url, color);
        console.log(`  📍 ${color.collection_name} - ${code} ${color.name}`);
      } else {
        // Check if it's a collection page
        const collectionMatch = url.match(/\/products\/([^/]+)$/);
        if (collectionMatch && !collectionMatch[1].match(/\d{4}/)) {
          console.log(`  📦 Collection: ${collectionMatch[1]}`);
        }
      }
    }
  });
  
  // Track downloads
  page.on('download', async (download) => {
    const url = download.url();
    const timestamp = new Date().toISOString();
    
    activityLog.downloads.push({
      timestamp,
      url,
      suggestedFilename: await download.suggestedFilename()
    });
    
    console.log(`  📥 Download: ${url}`);
    
    // Find matching color from current page or tracked colors
    const currentUrl = page.url();
    let color = trackedColors.get(currentUrl);
    
    // If not found, try to extract from download URL
    if (!color) {
      const match = url.match(/\/products\/([^/]+)-(\d{4})-([a-z-]+)-(\d+)/);
      if (match) {
        const [, collectionSlug, code, namePart, sku] = match;
        const name = namePart.split('-').map(word => 
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
        
        color = {
          code: code,
          name: name.toUpperCase(),
          slug: `${collectionSlug}-${code}-${namePart}`,
          href: currentUrl,
          sku: sku,
          collection_slug: collectionSlug,
          collection_name: collectionSlug.split('-').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
          ).join(' ')
        };
      }
    }
    
    if (color) {
      downloads.set(download, color);
      console.log(`    → ${color.collection_name} - ${color.code} ${color.name}`);
    }
  });
  
  // Process downloads when they complete
  setInterval(async () => {
    for (const [download, color] of downloads.entries()) {
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
              existingCol.colors.push(color);
              existingCol.colorCount = existingCol.colors.length;
            }
          } else {
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
          downloads.delete(download);
        }
      } catch (e) {
        // Download might still be in progress
      }
    }
    
    // Save activity log periodically
    activityLog.endTime = new Date().toISOString();
    fs.writeFileSync(activityLogPath, JSON.stringify(activityLog, null, 2));
  }, 2000);
  
  try {
    // Navigate to base URL
    const baseUrl = 'https://www.gerflor-cee.com/category/heterogeneous-rolls';
    console.log(`Opening: ${baseUrl}`);
    await page.goto(baseUrl, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(2000);
    
    console.log('\n👆 Sada radi šta hoćeš. Snimam 20 screenshot-a u sekundi i pratim SVE.\n');
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
    
    // Final save
    activityLog.endTime = new Date().toISOString();
    fs.writeFileSync(activityLogPath, JSON.stringify(activityLog, null, 2));
    
    console.log(`\n✅ Finished!`);
    console.log(`📸 Screenshots: ${screenshotCount} (saved in ${screenshotsDir})`);
    console.log(`📍 Navigations: ${activityLog.navigations.length}`);
    console.log(`📥 Downloads: ${activityLog.downloads.length}`);
    console.log(`💾 Activity log: ${activityLogPath}`);
    console.log(`💾 Updated: ${linoleumColorsPath}\n`);
    
    // Show summary
    const colorsData = JSON.parse(fs.readFileSync(linoleumColorsPath, 'utf8'));
    const byCollection = new Map();
    Array.from(trackedColors.values()).forEach(c => {
      if (!byCollection.has(c.collection_slug)) {
        byCollection.set(c.collection_slug, 0);
      }
      byCollection.set(c.collection_slug, byCollection.get(c.collection_slug) + 1);
    });
    
    console.log('📊 Summary:');
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

recordAndFollow().catch(console.error);
