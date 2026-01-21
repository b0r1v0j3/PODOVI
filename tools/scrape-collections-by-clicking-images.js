const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const missingCollections = [
  {
    name: 'Premium Acoustic',
    slug: 'premium-acoustic',
    url: 'https://www.gerflor-cee.com/products/premium-acoustic'
  },
  {
    name: 'Premium Compact',
    slug: 'premium-compact',
    url: 'https://www.gerflor-cee.com/products/premium-compact'
  },
  {
    name: 'Taralay Millenium Acoustic Order',
    slug: 'taralay-millenium-acoustic-order',
    url: 'https://www.gerflor-cee.com/products/taralay-millenium-acoustic-order'
  },
  {
    name: 'Taralay Millenium Compact',
    slug: 'taralay-millenium-compact',
    url: 'https://www.gerflor-cee.com/products/taralay-millenium-compact'
  }
];

async function scrapeCollectionByClicking(browser, collection) {
  console.log(`\n📦 Scraping: ${collection.name}...`);
  console.log(`  URL: ${collection.url}`);
  
  const page = await browser.newPage();
  const colors = [];
  const seenUrls = new Set();
  
  try {
    await page.goto(collection.url, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(5000);
    
    // Click Colors button/tab if exists
    try {
      const colorButton = await page.$('button:has-text("Colors"), a:has-text("Colors"), button:has-text("Boje"), a:has-text("Boje")');
      if (colorButton) {
        await colorButton.click();
        console.log('  ✓ Clicked colors button');
        await page.waitForTimeout(3000);
      }
    } catch (e) {
      // Continue
    }
    
    // Scroll and click "Show more" to load all color images
    console.log('  Loading all color images...');
    let showMoreClicked = 0;
    let previousImageCount = 0;
    let sameCountIterations = 0;
    
    for (let i = 0; i < 50; i++) {
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });
      await page.waitForTimeout(2000);
      
      // Count color image links
      const currentImageCount = await page.evaluate(() => {
        const images = Array.from(document.querySelectorAll('a[href*="/products/"] img, img[src*="color"], [class*="color"] img, [class*="swatch"] img'));
        return images.length;
      });
      
      if (currentImageCount === previousImageCount) {
        sameCountIterations++;
        if (sameCountIterations >= 3) break;
      } else {
        sameCountIterations = 0;
      }
      
      previousImageCount = currentImageCount;
      
      const showMoreButton = await page.$('button:has-text("Show more"), a:has-text("Show more"), button:has-text("Prikaži više"), a:has-text("Prikaži više")');
      if (showMoreButton) {
        await showMoreButton.click();
        showMoreClicked++;
        await page.waitForTimeout(3000);
      } else {
        break;
      }
    }
    
    if (showMoreClicked > 0) {
      console.log(`  Clicked "Show more" ${showMoreClicked} times`);
    }
    
    // Find all color image links
    const colorImageLinks = await page.evaluate(() => {
      const links = [];
      const seen = new Set();
      
      // Find all links that contain images (color swatches)
      const allLinks = Array.from(document.querySelectorAll('a[href*="/products/"]'));
      
      allLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (!href) return;
        
        const fullUrl = href.startsWith('http') ? href : `https://www.gerflor-cee.com${href}`;
        
        // Check if link has an image inside (color swatch)
        const hasImage = link.querySelector('img') !== null;
        
        if (hasImage && !seen.has(fullUrl)) {
          seen.add(fullUrl);
          links.push({
            url: fullUrl,
            text: link.textContent?.trim() || ''
          });
        }
      });
      
      return links;
    });
    
    console.log(`  Found ${colorImageLinks.length} color image links`);
    
    // Click on each color image link and extract data
    for (let i = 0; i < colorImageLinks.length; i++) {
      const link = colorImageLinks[i];
      
      if (seenUrls.has(link.url)) continue;
      
      try {
        // Open link in new tab
        const newPage = await browser.newPage();
        await newPage.goto(link.url, { waitUntil: 'networkidle', timeout: 30000 });
        await newPage.waitForTimeout(2000);
        
        // Extract color data from the page
        const colorData = await newPage.evaluate((collectionSlug) => {
          // Try to extract from URL
          const urlMatch = window.location.href.match(/\/([^/]+)-(\d{4})-([a-z-]+)-(\d+)$/);
          
          if (urlMatch) {
            const [, slug, code, namePart, sku] = urlMatch;
            const name = namePart.split('-').map(word => 
              word.charAt(0).toUpperCase() + word.slice(1)
            ).join(' ');
            
            return {
              code: code,
              name: name.toUpperCase(),
              slug: `${collectionSlug}-${code}-${namePart}`,
              href: window.location.href,
              sku: sku,
              collection_slug: collectionSlug,
              collection_name: collectionSlug.split('-').map(word => 
                word.charAt(0).toUpperCase() + word.slice(1)
              ).join(' ')
            };
          }
          
          // Try to extract from page content
          const title = document.querySelector('h1, [class*="title"], [class*="name"]')?.textContent?.trim() || '';
          const codeMatch = title.match(/(\d{4})/);
          
          if (codeMatch) {
            return {
              code: codeMatch[1],
              name: title.replace(codeMatch[1], '').trim().toUpperCase(),
              slug: `${collectionSlug}-${codeMatch[1]}-${title.toLowerCase().replace(/\s+/g, '-')}`,
              href: window.location.href,
              sku: codeMatch[1],
              collection_slug: collectionSlug,
              collection_name: collectionSlug.split('-').map(word => 
                word.charAt(0).toUpperCase() + word.slice(1)
              ).join(' ')
            };
          }
          
          return null;
        }, collection.slug);
        
        if (colorData && !seenUrls.has(colorData.href)) {
          seenUrls.add(colorData.href);
          colors.push(colorData);
          
          if (colors.length % 10 === 0) {
            console.log(`    Extracted ${colors.length} colors so far...`);
          }
        }
        
        await newPage.close();
        await new Promise(resolve => setTimeout(resolve, 500)); // Small delay between requests
        
      } catch (error) {
        console.log(`    ⚠️  Error processing link ${i + 1}: ${error.message}`);
      }
    }
    
    console.log(`  ✅ Extracted ${colors.length} colors total`);
    
    return {
      ...collection,
      colors: colors,
      colorCount: colors.length
    };
    
  } catch (error) {
    console.error(`  ❌ Error: ${error.message}`);
    return {
      ...collection,
      colors: [],
      colorCount: 0
    };
  } finally {
    await page.close();
  }
}

async function main() {
  console.log('🚀 Scraping collections by clicking on color images...\n');
  
  const browser = await chromium.launch({ headless: false, slowMo: 300 });
  
  const results = [];
  let totalColors = 0;
  
  for (let i = 0; i < missingCollections.length; i++) {
    const collection = missingCollections[i];
    console.log(`\n[${i + 1}/${missingCollections.length}] ${collection.name}`);
    
    const result = await scrapeCollectionByClicking(browser, collection);
    results.push(result);
    totalColors += result.colorCount;
    
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  await browser.close();
  
  console.log(`\n\n✅ Scraping complete!`);
  console.log(`Total colors: ${totalColors}\n`);
  
  // Update linoleum file
  const rootDir = path.join(__dirname, '..');
  const linoleumPath = path.join(rootDir, 'public', 'data', 'gerflor_linoleum_colors_complete.json');
  const linoleumData = JSON.parse(fs.readFileSync(linoleumPath, 'utf8'));
  
  results.forEach(result => {
    const existingCol = linoleumData.collections.find(c => c.slug === result.slug);
    if (existingCol) {
      existingCol.colors = result.colors;
      existingCol.colorCount = result.colorCount;
      console.log(`  ✓ Updated ${result.name}: ${result.colorCount} colors`);
    }
  });
  
  linoleumData.totalColors = linoleumData.collections.reduce((sum, col) => sum + (col.colorCount || 0), 0);
  linoleumData.generatedAt = new Date().toISOString();
  
  fs.writeFileSync(linoleumPath, JSON.stringify(linoleumData, null, 2));
  
  console.log(`\n💾 Updated: ${linoleumPath}`);
  console.log(`📊 Total colors: ${linoleumData.totalColors}`);
}

main().catch(console.error);
