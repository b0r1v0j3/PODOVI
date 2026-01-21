const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const baseUrl = 'https://www.gerflor-cee.com/category/heterogeneous-rolls';

async function clickJpgAndSave() {
  console.log('🚀 Extracting colors and clicking .JPG links to save images...\n');
  
  const browser = await chromium.launch({ headless: false, slowMo: 200 });
  const page = await browser.newPage();
  
  // Listen for downloads
  const downloads = new Map();
  page.on('download', async (download) => {
    const url = download.url();
    const suggestedFilename = await download.suggestedFilename();
    downloads.set(url, { download, filename: suggestedFilename });
    console.log(`  📥 Download started: ${suggestedFilename}`);
  });
  
  const allColors = [];
  const seenUrls = new Set();
  
  try {
    // Go through all pages
    let currentPage = 1;
    let hasMorePages = true;
    const maxPages = 30;
    
    while (hasMorePages && currentPage <= maxPages) {
      console.log(`\n📄 Page ${currentPage}...`);
      
      const pageUrl = currentPage === 1 ? baseUrl : `${baseUrl}?page=${currentPage}`;
      
      try {
        await page.goto(pageUrl, { waitUntil: 'networkidle', timeout: 60000 });
        await page.waitForTimeout(3000);
      } catch (e) {
        console.log(`  ⚠️  Error loading page ${currentPage}`);
        hasMorePages = false;
        break;
      }
      
      // Check if page has content
      const hasContent = await page.evaluate(() => {
        const links = document.querySelectorAll('a[href*="/products/"]');
        return links.length > 0;
      });
      
      if (!hasContent) {
        console.log(`  ⚠️  Page ${currentPage} appears to be empty`);
        hasMorePages = false;
        break;
      }
      
      // Click Colors button
      try {
        const colorButton = await page.$('button:has-text("Colors"), a:has-text("Colors")');
        if (colorButton) {
          await colorButton.click();
          console.log('  ✓ Clicked colors button');
          await page.waitForTimeout(2000);
        }
      } catch (e) {
        // Continue
      }
      
      // Scroll and click "Show more" to load all colors
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
      
      if (showMoreClicked > 0) {
        console.log(`  Clicked "Show more" ${showMoreClicked} times`);
      }
      
      // Extract colors and find .JPG links
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
            
            // Find .JPG link in the same container
            let jpgUrl = null;
            const container = link.closest('[class*="card"], [class*="tile"], [class*="product"], [class*="item"], [class*="color"]');
            if (container) {
              const jpgLink = container.querySelector('a[href$=".JPG"], a[href$=".jpg"], a[href*=".JPG"], a[href*=".jpg"]');
              if (jpgLink) {
                const jpgHref = jpgLink.getAttribute('href');
                jpgUrl = jpgHref.startsWith('http') ? jpgHref : `https://www.gerflor-cee.com${jpgHref}`;
              }
            }
            
            // Also check if link itself is .JPG
            if (!jpgUrl && (fullUrl.endsWith('.JPG') || fullUrl.endsWith('.jpg'))) {
              jpgUrl = fullUrl;
            }
            
            colors.push({
              code: code,
              name: name.toUpperCase(),
              slug: `${collectionSlug}-${code}-${namePart}`,
              href: fullUrl,
              sku: sku,
              collection_slug: collectionSlug,
              collection_name: collectionSlug.split('-').map(word => 
                word.charAt(0).toUpperCase() + word.slice(1)
              ).join(' '),
              jpg_url: jpgUrl
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
      
      console.log(`  ✅ ${pageColors.length} colors (${newColorsCount} new, ${allColors.length} total)`);
      
      // If no new colors found, we might be done
      if (newColorsCount === 0 && pageColors.length === 0) {
        console.log(`  ⚠️  No colors found, stopping`);
        hasMorePages = false;
        break;
      }
      
      currentPage++;
      await page.waitForTimeout(1500);
    }
    
    console.log(`\n\n✅ Finished scraping! Found ${allColors.length} colors\n`);
    
    // Group by collection
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
    
    console.log(`📊 Collections:\n`);
    collections.forEach(col => {
      console.log(`  ${col.name}: ${col.colors.length} colors`);
    });
    
    const totalColors = collections.reduce((sum, col) => sum + col.colorCount, 0);
    console.log(`\n📈 Total: ${totalColors} colors\n`);
    
    // Now click .JPG links and save images
    console.log('📥 Clicking .JPG links and saving images...\n');
    
    const rootDir = path.join(__dirname, '..');
    let saved = 0;
    let failed = 0;
    
    for (const collection of collections) {
      console.log(`\n📦 ${collection.name} (${collection.colors.length} colors)...`);
      
      // Create directory
      const collectionDir = path.join(rootDir, 'public', 'images', 'products', 'vinyl', collection.slug);
      if (!fs.existsSync(collectionDir)) {
        fs.mkdirSync(collectionDir, { recursive: true });
      }
      
      for (let i = 0; i < collection.colors.length; i++) {
        const color = collection.colors[i];
        
        try {
          // Navigate to color page to find .JPG link
          await page.goto(color.href, { waitUntil: 'networkidle', timeout: 30000 });
          await page.waitForTimeout(2000);
          
          // Find and click .JPG link
          const jpgClicked = await page.evaluate(() => {
            // Look for .JPG link
            const jpgLink = document.querySelector('a[href$=".JPG"], a[href$=".jpg"], a[href*=".JPG"], a[href*=".jpg"]');
            if (jpgLink) {
              jpgLink.click();
              return true;
            }
            return false;
          });
          
          if (jpgClicked) {
            // Wait for download
            await page.waitForTimeout(3000);
            
            // Move downloaded file to correct location
            const colorSlug = color.slug.split('-').slice(-2).join('-');
            const targetPath = path.join(collectionDir, `${colorSlug}.jpg`);
            
            // Check if download completed
            const downloadInfo = Array.from(downloads.values()).pop();
            if (downloadInfo) {
              const downloadPath = await downloadInfo.download.path();
              if (downloadPath && fs.existsSync(downloadPath)) {
                fs.renameSync(downloadPath, targetPath);
                color.image = `/images/products/vinyl/${collection.slug}/${colorSlug}.jpg`;
                saved++;
                
                if ((saved + failed) % 10 === 0) {
                  console.log(`    Progress: ${saved + failed}/${totalColors} (${saved} saved, ${failed} failed)`);
                }
              } else {
                failed++;
              }
            } else {
              failed++;
            }
          } else {
            console.log(`    ⚠️  No .JPG link found for ${color.code}`);
            failed++;
          }
          
          await page.waitForTimeout(500);
          
        } catch (error) {
          console.log(`    ❌ Error processing ${color.code}: ${error.message}`);
          failed++;
        }
      }
      
      console.log(`  ✅ ${collection.name}: ${collection.colors.filter(c => c.image).length}/${collection.colors.length} images saved`);
    }
    
    console.log(`\n\n✅ Complete!`);
    console.log(`  Saved: ${saved}`);
    console.log(`  Failed: ${failed}`);
    console.log(`  Total: ${saved + failed}\n`);
    
    // Update JSON file
    const linoleumPath = path.join(rootDir, 'public', 'data', 'gerflor_linoleum_colors_complete.json');
    const linoleumData = JSON.parse(fs.readFileSync(linoleumPath, 'utf8'));
    
    collections.forEach(col => {
      const existingCol = linoleumData.collections.find(c => c.slug === col.slug);
      if (existingCol) {
        existingCol.colors = col.colors;
        existingCol.colorCount = col.colors.length;
      }
    });
    
    linoleumData.totalColors = linoleumData.collections.reduce((sum, col) => sum + (col.colorCount || 0), 0);
    linoleumData.generatedAt = new Date().toISOString();
    
    fs.writeFileSync(linoleumPath, JSON.stringify(linoleumData, null, 2));
    console.log(`💾 Updated: ${linoleumPath}`);
    console.log(`📊 Total colors: ${linoleumData.totalColors}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

clickJpgAndSave().catch(console.error);
