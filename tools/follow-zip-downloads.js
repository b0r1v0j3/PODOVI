const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.join(__dirname, '..');
const linoleumColorsPath = path.join(rootDir, 'public', 'data', 'gerflor_linoleum_colors_complete.json');
const extractDir = path.join(rootDir, 'tmp', 'extracted-heterogeneous-zips');

async function followZipDownloads() {
  console.log('🚀 Otvorio sam Chrome. Ti otvaraj kolekcije i boje, klikaj .JPG (ZIP), ja ekstraktujem i organizujem.\n');
  
  const browser = await chromium.launch({ 
    headless: false, 
    slowMo: 100 
  });
  
  const context = await browser.newContext({
    acceptDownloads: true
  });
  
  const page = await context.newPage();
  
  const trackedColors = new Map(); // href -> color data
  const downloads = new Map(); // download -> {color, zipPath}
  
  // Track all navigations
  page.on('framenavigated', async (frame) => {
    if (frame === page.mainFrame()) {
      const url = frame.url();
      
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
      }
    }
  });
  
  // Track downloads (ZIP files)
  page.on('download', async (download) => {
    const url = download.url();
    const suggestedFilename = await download.suggestedFilename();
    
    console.log(`  📥 Download: ${suggestedFilename}`);
    
    // Find matching color from current page
    const currentUrl = page.url();
    let color = trackedColors.get(currentUrl);
    
    if (color) {
      downloads.set(download, { color, suggestedFilename });
      console.log(`    → ${color.collection_name} - ${color.code} ${color.name}`);
    }
  });
  
  // Process downloads when they complete
  setInterval(async () => {
    for (const [download, { color, suggestedFilename }] of downloads.entries()) {
      try {
        const downloadPath = await download.path();
        
        if (downloadPath && fs.existsSync(downloadPath)) {
          console.log(`    📦 Processing ZIP: ${suggestedFilename}`);
          
          // Extract ZIP
          const zipName = path.basename(suggestedFilename, '.zip');
          const extractPath = path.join(extractDir, zipName);
          
          if (!fs.existsSync(extractPath)) {
            fs.mkdirSync(extractPath, { recursive: true });
          }
          
          try {
            // Extract using PowerShell
            execSync(`powershell -Command "Expand-Archive -Path '${downloadPath.replace(/'/g, "''")}' -DestinationPath '${extractPath.replace(/'/g, "''")}' -Force"`, {
              cwd: rootDir,
              stdio: 'ignore'
            });
            
            // Find image in extracted files
            const extractedFiles = fs.readdirSync(extractPath, { recursive: true })
              .filter(file => /\.(jpg|jpeg|png|JPG|JPEG|PNG)$/i.test(file))
              .map(file => path.join(extractPath, file));
            
            if (extractedFiles.length > 0) {
              // Use first/largest image
              let imageFile = extractedFiles[0];
              let maxSize = 0;
              
              extractedFiles.forEach(file => {
                const stats = fs.statSync(file);
                if (stats.size > maxSize) {
                  maxSize = stats.size;
                  imageFile = file;
                }
              });
              
              // Create target directory
              const targetDir = path.join(rootDir, 'public', 'images', 'products', 'vinyl', color.collection_slug);
              if (!fs.existsSync(targetDir)) {
                fs.mkdirSync(targetDir, { recursive: true });
              }
              
              // Copy image
              const colorSlug = color.slug.split('-').slice(-2).join('-');
              const targetFile = path.join(targetDir, `${colorSlug}.jpg`);
              
              fs.copyFileSync(imageFile, targetFile);
              
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
            } else {
              console.log(`    ⚠️  No images found in ZIP`);
            }
            
          } catch (e) {
            console.log(`    ⚠️  Error extracting ZIP: ${e.message}`);
          }
          
          // Remove from downloads map
          downloads.delete(download);
        }
      } catch (e) {
        // Download might still be in progress
      }
    }
  }, 2000);
  
  try {
    // Navigate to base URL
    const baseUrl = 'https://www.gerflor-cee.com/category/heterogeneous-rolls';
    console.log(`Opening: ${baseUrl}`);
    await page.goto(baseUrl, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(2000);
    
    console.log('\n👆 Sada otvaraj kolekcije i boje, klikaj .JPG (ZIP). Ja ekstraktujem i organizujem.\n');
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
    console.log(`📊 Tracked: ${trackedColors.size} colors`);
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

followZipDownloads().catch(console.error);
