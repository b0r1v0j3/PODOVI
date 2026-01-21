const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const baseUrl = 'https://www.gerflor-cee.com/category/heterogeneous-rolls';

async function downloadImage(url, filePath) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    
    protocol.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        return downloadImage(response.headers.location, filePath).then(resolve).catch(reject);
      }
      
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download: ${response.statusCode}`));
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

async function scrapeAllColorsAndDownload() {
  console.log('🚀 Scraping all 594 colors from 12 collections and downloading images...\n');
  
  const browser = await chromium.launch({ headless: false, slowMo: 200 });
  const page = await browser.newPage();
  
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
      
      // Extract ALL visible color links
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
    
    // Now download images for each color
    console.log('📥 Downloading images...\n');
    
    const rootDir = path.join(__dirname, '..');
    let downloaded = 0;
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
          // Navigate to color page
          await page.goto(color.href, { waitUntil: 'networkidle', timeout: 30000 });
          await page.waitForTimeout(2000);
          
          // Find image URL
          const imageUrl = await page.evaluate(() => {
            // Try different selectors for the main product image
            const selectors = [
              'img[src*="color"]',
              'img[src*="product"]',
              '.product-image img',
              '[class*="image"] img',
              'img[alt*="' + document.title.split(' ')[0] + '"]'
            ];
            
            for (const selector of selectors) {
              const img = document.querySelector(selector);
              if (img && img.src && !img.src.includes('logo') && !img.src.includes('icon')) {
                return img.src;
              }
            }
            
            // Fallback: get first large image
            const allImages = Array.from(document.querySelectorAll('img'));
            for (const img of allImages) {
              if (img.src && img.naturalWidth > 200 && !img.src.includes('logo')) {
                return img.src;
              }
            }
            
            return null;
          });
          
          if (imageUrl) {
            const colorSlug = color.slug.split('-').slice(-2).join('-');
            const imagePath = path.join(collectionDir, `${colorSlug}.jpg`);
            
            try {
              await downloadImage(imageUrl, imagePath);
              color.image = `/images/products/vinyl/${collection.slug}/${colorSlug}.jpg`;
              downloaded++;
              
              if ((downloaded + failed) % 10 === 0) {
                console.log(`    Progress: ${downloaded + failed}/${totalColors} (${downloaded} downloaded, ${failed} failed)`);
              }
            } catch (e) {
              console.log(`    ⚠️  Failed to download ${color.code}: ${e.message}`);
              failed++;
            }
          } else {
            console.log(`    ⚠️  No image found for ${color.code}`);
            failed++;
          }
          
          // Small delay between downloads
          await page.waitForTimeout(500);
          
        } catch (error) {
          console.log(`    ❌ Error processing ${color.code}: ${error.message}`);
          failed++;
        }
      }
      
      console.log(`  ✅ ${collection.name}: ${collection.colors.filter(c => c.image).length}/${collection.colors.length} images downloaded`);
    }
    
    console.log(`\n\n✅ Download complete!`);
    console.log(`  Downloaded: ${downloaded}`);
    console.log(`  Failed: ${failed}`);
    console.log(`  Total: ${downloaded + failed}\n`);
    
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

scrapeAllColorsAndDownload().catch(console.error);
