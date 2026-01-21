const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const linoleumColorsPath = path.join(rootDir, 'public', 'data', 'gerflor_linoleum_colors_complete.json');

async function watchDownloadsLive() {
  console.log('🚀 Otvorio sam browser. Ti preuzimaj slike, ja pratim linkove i organizujem.\n');
  console.log('Kada završiš, pritisni ENTER u terminalu.\n');
  
  const browser = await chromium.launch({ 
    headless: false, 
    slowMo: 100 
  });
  
  const context = await browser.newContext({
    acceptDownloads: true
  });
  
  const page = await context.newPage();
  
  const downloads = new Map(); // url -> {download, color, collection}
  const organized = new Map(); // collection -> [colors with images]
  
  // Track downloads
  page.on('download', async (download) => {
    const url = download.url();
    console.log(`  📥 Download started from: ${url}`);
    
    // Extract collection and color from URL
    const match = url.match(/\/products\/([^/]+)-(\d{4})-([a-z-]+)-(\d+)/);
    if (match) {
      const [, collectionSlug, code] = match;
      
      // Load colors data
      const colorsData = JSON.parse(fs.readFileSync(linoleumColorsPath, 'utf8'));
      const collection = colorsData.collections.find(c => c.slug === collectionSlug);
      
      if (collection) {
        const color = collection.colors.find(c => c.code === code);
        
        if (color) {
          downloads.set(url, { download, color, collection, code });
          console.log(`    → ${collection.name} - ${code} ${color.name}`);
        }
      }
    }
  });
  
  // Process downloads when they complete
  setInterval(async () => {
    for (const [url, { download, color, collection, code }] of downloads.entries()) {
      try {
        const downloadPath = await download.path();
        
        if (downloadPath && fs.existsSync(downloadPath)) {
          // Create target directory
          const targetDir = path.join(rootDir, 'public', 'images', 'products', 'vinyl', collection.slug);
          if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
          }
          
          // Move file
          const colorSlug = color.slug.split('-').slice(-2).join('-');
          const targetFile = path.join(targetDir, `${colorSlug}.jpg`);
          
          fs.renameSync(downloadPath, targetFile);
          
          // Update color data
          color.image = `/images/products/vinyl/${collection.slug}/${colorSlug}.jpg`;
          
          // Save updated JSON
          const colorsData = JSON.parse(fs.readFileSync(linoleumColorsPath, 'utf8'));
          const existingCol = colorsData.collections.find(c => c.slug === collection.slug);
          if (existingCol) {
            const existingColor = existingCol.colors.find(c => c.code === code);
            if (existingColor) {
              existingColor.image = color.image;
            }
          }
          colorsData.generatedAt = new Date().toISOString();
          fs.writeFileSync(linoleumColorsPath, JSON.stringify(colorsData, null, 2));
          
          console.log(`    ✅ Saved: ${collection.name} - ${code} ${color.name}`);
          
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
    
    // Click Colors button
    try {
      const colorButton = await page.$('button:has-text("Colors"), a:has-text("Colors")');
      if (colorButton) {
        await colorButton.click();
        console.log('✓ Clicked colors button');
        await page.waitForTimeout(2000);
      }
    } catch (e) {
      // Continue
    }
    
    console.log('\n👆 Sada preuzimaj slike klikom na .JPG linkove. Ja pratim i organizujem.\n');
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
    const colorsData = JSON.parse(fs.readFileSync(linoleumColorsPath, 'utf8'));
    colorsData.generatedAt = new Date().toISOString();
    fs.writeFileSync(linoleumColorsPath, JSON.stringify(colorsData, null, 2));
    
    console.log(`\n✅ Finished!`);
    console.log(`💾 Updated: ${linoleumColorsPath}\n`);
    
    // Show summary
    colorsData.collections.forEach(col => {
      const withImages = col.colors.filter(c => c.image).length;
      if (withImages > 0) {
        console.log(`  ${col.name}: ${withImages}/${col.colors.length} images`);
      }
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

watchDownloadsLive().catch(console.error);
