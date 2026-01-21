const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const https = require('https');
const http = require('http');

const baseUrl = 'https://www.gerflor-cee.com/category/heterogeneous-rolls';
const rootDir = path.join(__dirname, '..');
const linoleumColorsPath = path.join(rootDir, 'public', 'data', 'gerflor_linoleum_colors_complete.json');
const extractDir = path.join(rootDir, 'tmp', 'extracted-heterogeneous-zips');

async function downloadImage(url, filePath) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    
    protocol.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        return downloadImage(response.headers.location, filePath).then(resolve).catch(reject);
      }
      
      if (response.statusCode !== 200) {
        reject(new Error(`Failed: ${response.statusCode}`));
        return;
      }
      
      const fileStream = fs.createWriteStream(filePath);
      response.pipe(fileStream);
      
      fileStream.on('finish', () => {
        fileStream.close();
        resolve();
      });
      
      fileStream.on('error', reject);
    }).on('error', reject);
  });
}

async function downloadAll594Automatic() {
  console.log('🚀 Automatski preuzimam sve 594 slike iz 12 kolekcija...\n');
  
  const browser = await chromium.launch({ headless: false, slowMo: 200 });
  const context = await browser.newContext({
    acceptDownloads: true
  });
  const page = await context.newPage();
  
  const allColors = [];
  const seenUrls = new Set();
  
  try {
    // Step 1: Extract all colors from all pages
    console.log('📄 Step 1: Ekstraktujem sve boje sa svih stranica...\n');
    
    let currentPage = 1;
    let hasMorePages = true;
    const maxPages = 30;
    
    while (hasMorePages && currentPage <= maxPages) {
      console.log(`Stranica ${currentPage}...`);
      
      const pageUrl = currentPage === 1 ? baseUrl : `${baseUrl}?page=${currentPage}`;
      
      try {
        await page.goto(pageUrl, { waitUntil: 'networkidle', timeout: 60000 });
        await page.waitForTimeout(3000);
      } catch (e) {
        hasMorePages = false;
        break;
      }
      
      // Check if page has content
      const hasContent = await page.evaluate(() => {
        return document.querySelectorAll('a[href*="/products/"]').length > 0;
      });
      
      if (!hasContent) {
        hasMorePages = false;
        break;
      }
      
      // Click Colors button
      try {
        const colorButton = await page.$('button:has-text("Colors"), a:has-text("Colors")');
        if (colorButton) {
          await colorButton.click();
          await page.waitForTimeout(2000);
        }
      } catch (e) {}
      
      // Scroll and click "Show more"
      let showMoreClicked = 0;
      let previousColorCount = 0;
      let sameCountIterations = 0;
      
      for (let i = 0; i < 50; i++) {
        await page.evaluate(() => {
          window.scrollTo(0, document.body.scrollHeight);
        });
        await page.waitForTimeout(2000);
        
        const currentColorCount = await page.evaluate(() => {
          const links = Array.from(document.querySelectorAll('a[href*="/products/"]'));
          const colorUrls = new Set();
          links.forEach(link => {
            const href = link.getAttribute('href');
            if (href && href.includes('/products/') && href.match(/\d{4}/)) {
              colorUrls.add(href);
            }
          });
          return colorUrls.size;
        });
        
        if (currentColorCount === previousColorCount) {
          sameCountIterations++;
          if (sameCountIterations >= 3) break;
        } else {
          sameCountIterations = 0;
        }
        
        previousColorCount = currentColorCount;
        
        const showMoreButton = await page.$('button:has-text("Show more"), a:has-text("Show more")');
        if (showMoreButton) {
          try {
            await showMoreButton.click();
            showMoreClicked++;
            await page.waitForTimeout(3000);
          } catch (e) {
            break;
          }
        } else {
          break;
        }
      }
      
      // Extract colors
      const pageColors = await page.evaluate(() => {
        const colors = [];
        const seen = new Set();
        
        const links = Array.from(document.querySelectorAll('a[href*="/products/"]'));
        
        links.forEach(link => {
          const href = link.getAttribute('href');
          if (!href) return;
          
          const fullUrl = href.startsWith('http') ? href : `https://www.gerflor-cee.com${href}`;
          
          const match = fullUrl.match(/\/([^/]+)-(\d{4})-([a-z-]+)-(\d+)$/);
          
          if (match && !seen.has(fullUrl)) {
            seen.add(fullUrl);
            
            const [, collectionSlug, code, namePart, sku] = match;
            const name = namePart.split('-').map(word => 
              word.charAt(0).toUpperCase() + word.slice(1)
            ).join(' ');
            
            colors.push({
              code: code,
              name: name.toUpperCase(),
              slug: `${collectionSlug}-${code}-${namePart}`,
              href: fullUrl,
              sku: sku,
              collection_slug: collectionSlug,
              collection_name: collectionSlug.split('-').map(word => 
                word.charAt(0).toUpperCase() + word.slice(1)
              ).join(' ')
            });
          }
        });
        
        return colors;
      });
      
      // Add unique colors
      let newColorsCount = 0;
      pageColors.forEach(color => {
        if (!seenUrls.has(color.href)) {
          seenUrls.add(color.href);
          allColors.push(color);
          newColorsCount++;
        }
      });
      
      console.log(`  ✅ ${pageColors.length} boja (${newColorsCount} novih, ${allColors.length} ukupno)`);
      
      if (newColorsCount === 0 && pageColors.length === 0) {
        hasMorePages = false;
        break;
      }
      
      currentPage++;
      await page.waitForTimeout(1500);
    }
    
    console.log(`\n✅ Ekstraktovano ${allColors.length} boja\n`);
    
    // Step 2: Group by collection
    const collectionsMap = new Map();
    
    allColors.forEach(color => {
      if (!collectionsMap.has(color.collection_slug)) {
        collectionsMap.set(color.collection_slug, {
          name: color.collection_name,
          slug: color.collection_slug,
          url: `https://www.gerflor-cee.com/products/${color.collection_slug}`,
          colors: []
        });
      }
      collectionsMap.get(color.collection_slug).colors.push(color);
    });
    
    const collections = Array.from(collectionsMap.values()).map(col => ({
      ...col,
      colorCount: col.colors.length
    }));
    
    collections.sort((a, b) => a.name.localeCompare(b.name));
    
    console.log(`📊 Kolekcije:\n`);
    collections.forEach(col => {
      console.log(`  ${col.name}: ${col.colors.length} boja`);
    });
    
    const totalColors = collections.reduce((sum, col) => sum + col.colorCount, 0);
    console.log(`\n📈 Total: ${totalColors} boja\n`);
    
    // Step 3: Download images for each color
    console.log('📥 Step 2: Preuzimam slike...\n');
    
    let downloaded = 0;
    let failed = 0;
    
    for (const collection of collections) {
      console.log(`\n📦 ${collection.name} (${collection.colors.length} boja)...`);
      
      // Create directory
      const collectionDir = path.join(rootDir, 'public', 'images', 'products', 'vinyl', collection.slug);
      if (!fs.existsSync(collectionDir)) {
        fs.mkdirSync(collectionDir, { recursive: true });
      }
      
      for (let i = 0; i < collection.colors.length; i++) {
        const color = collection.colors[i];
        
        try {
          // Navigate to color page
          await page.goto(color.href, { waitUntil: 'networkidle', timeout: 30000 });
          await page.waitForTimeout(2000);
          
          // Find and click .JPG link (which downloads ZIP)
          const zipDownloaded = await page.evaluate(async () => {
            // Look for .JPG link
            const jpgLink = document.querySelector('a[href$=".JPG"], a[href$=".jpg"], a[href*=".JPG"], a[href*=".jpg"], a[href*="zip"]');
            if (jpgLink) {
              jpgLink.click();
              return true;
            }
            return false;
          });
          
          if (zipDownloaded) {
            // Wait for download
            await page.waitForTimeout(3000);
            
            // Find downloaded ZIP in downloads folder
            const downloadsPath = path.join(process.env.USERPROFILE || process.env.HOME || '', 'Downloads');
            const zipFiles = fs.readdirSync(downloadsPath)
              .filter(file => file.startsWith('product-sku-media-resources-') && file.endsWith('.zip'))
              .map(file => ({
                name: file,
                path: path.join(downloadsPath, file),
                mtime: fs.statSync(path.join(downloadsPath, file)).mtime
              }))
              .sort((a, b) => b.mtime - a.mtime); // Newest first
            
            if (zipFiles.length > 0) {
              const zipFile = zipFiles[0]; // Most recent
              
              // Extract ZIP
              const zipName = path.basename(zipFile.name, '.zip');
              const extractPath = path.join(extractDir, zipName);
              
              if (!fs.existsSync(extractPath)) {
                fs.mkdirSync(extractPath, { recursive: true });
              }
              
              try {
                execSync(`powershell -Command "Expand-Archive -Path '${zipFile.path.replace(/'/g, "''")}' -DestinationPath '${extractPath.replace(/'/g, "''")}' -Force"`, {
                  cwd: rootDir,
                  stdio: 'ignore'
                });
                
                // Find image in extracted files
                const extractedFiles = fs.readdirSync(extractPath, { recursive: true })
                  .filter(file => /\.(jpg|jpeg|png|JPG|JPEG|PNG)$/i.test(file))
                  .map(file => path.join(extractPath, file));
                
                if (extractedFiles.length > 0) {
                  // Use largest image
                  let imageFile = extractedFiles[0];
                  let maxSize = 0;
                  
                  extractedFiles.forEach(file => {
                    const stats = fs.statSync(file);
                    if (stats.size > maxSize) {
                      maxSize = stats.size;
                      imageFile = file;
                    }
                  });
                  
                  // Copy to target
                  const colorSlug = color.slug.split('-').slice(-2).join('-');
                  const targetFile = path.join(collectionDir, `${colorSlug}.jpg`);
                  
                  fs.copyFileSync(imageFile, targetFile);
                  color.image = `/images/products/vinyl/${collection.slug}/${colorSlug}.jpg`;
                  downloaded++;
                  
                  if ((downloaded + failed) % 10 === 0) {
                    console.log(`    Progress: ${downloaded + failed}/${totalColors} (${downloaded} downloaded, ${failed} failed)`);
                  }
                } else {
                  failed++;
                }
              } catch (e) {
                failed++;
              }
            } else {
              failed++;
            }
          } else {
            failed++;
          }
          
          await page.waitForTimeout(1000);
          
        } catch (error) {
          console.log(`    ❌ Error: ${color.code} - ${error.message}`);
          failed++;
        }
      }
      
      console.log(`  ✅ ${collection.name}: ${collection.colors.filter(c => c.image).length}/${collection.colors.length} slika`);
    }
    
    console.log(`\n\n✅ Završeno!`);
    console.log(`  Preuzeto: ${downloaded}`);
    console.log(`  Neuspešno: ${failed}`);
    console.log(`  Ukupno: ${downloaded + failed}\n`);
    
    // Step 4: Update JSON
    const linoleumData = JSON.parse(fs.readFileSync(linoleumColorsPath, 'utf8'));
    
    collections.forEach(col => {
      const existingCol = linoleumData.collections.find(c => c.slug === col.slug);
      if (existingCol) {
        existingCol.colors = col.colors;
        existingCol.colorCount = col.colors.length;
      } else {
        linoleumData.collections.push(col);
      }
    });
    
    linoleumData.totalColors = linoleumData.collections.reduce((sum, col) => sum + (col.colorCount || 0), 0);
    linoleumData.generatedAt = new Date().toISOString();
    
    fs.writeFileSync(linoleumColorsPath, JSON.stringify(linoleumData, null, 2));
    console.log(`💾 Ažurirano: ${linoleumColorsPath}`);
    console.log(`📊 Total boja: ${linoleumData.totalColors}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

downloadAll594Automatic().catch(console.error);
