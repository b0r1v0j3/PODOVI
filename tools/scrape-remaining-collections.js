const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const remainingCollections = [
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

async function scrapeCollection(browser, collection) {
  console.log(`\n📦 Scraping: ${collection.name}...`);
  
  const page = await browser.newPage();
  const colors = [];
  
  try {
    await page.goto(collection.url, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(5000);
    
    // Try to click "Colors" button
    try {
      const colorButton = await page.$('button:has-text("Colors"), a:has-text("Colors"), button:has-text("Boje"), a:has-text("Boje")');
      if (colorButton) {
        await colorButton.click();
        await page.waitForTimeout(3000);
        console.log('  ✓ Clicked colors button');
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
      
      const showMoreButton = await page.$('button:has-text("Show more"), a:has-text("Show more"), button:has-text("Prikaži više"), a:has-text("Prikaži više")');
      if (showMoreButton) {
        await showMoreButton.click();
        showMoreClicked++;
        await page.waitForTimeout(3000);
      } else {
        break;
      }
    }
    
    console.log(`  Clicked "Show more" ${showMoreClicked} times`);
    
    // Extract colors
    const extractedColors = await page.evaluate((collectionSlug) => {
      const foundColors = [];
      const seen = new Set();
      
      const links = Array.from(document.querySelectorAll('a[href*="/products/"]'));
      
      links.forEach(link => {
        const href = link.getAttribute('href');
        if (!href) return;
        
        const fullUrl = href.startsWith('http') ? href : `https://www.gerflor-cee.com${href}`;
        const match = fullUrl.match(/\/([^/]+)-(\d{4})-([a-z-]+)-(\d+)$/);
        
        if (match && !seen.has(fullUrl)) {
          const [, slug, code, namePart, sku] = match;
          
          if (slug === collectionSlug) {
            seen.add(fullUrl);
            const name = namePart.split('-').map(word => 
              word.charAt(0).toUpperCase() + word.slice(1)
            ).join(' ');
            
            foundColors.push({
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
        }
      });
      
      return foundColors;
    }, collection.slug);
    
    console.log(`  ✅ Extracted ${extractedColors.length} colors`);
    
    return {
      ...collection,
      colors: extractedColors,
      colorCount: extractedColors.length
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
  console.log('🚀 Scraping remaining 4 collections...\n');
  
  const browser = await chromium.launch({ headless: false, slowMo: 500 });
  
  const results = [];
  let totalColors = 0;
  
  for (let i = 0; i < remainingCollections.length; i++) {
    const collection = remainingCollections[i];
    console.log(`\n[${i + 1}/${remainingCollections.length}] ${collection.name}`);
    
    const result = await scrapeCollection(browser, collection);
    results.push(result);
    totalColors += result.colorCount;
    
    await new Promise(resolve => setTimeout(resolve, 3000));
  }
  
  await browser.close();
  
  console.log(`\n\n✅ Scraping complete!`);
  console.log(`Total colors: ${totalColors}\n`);
  
  // Read existing linoleum file
  const rootDir = path.join(__dirname, '..');
  const linoleumPath = path.join(rootDir, 'public', 'data', 'gerflor_linoleum_colors_complete.json');
  const linoleumData = JSON.parse(fs.readFileSync(linoleumPath, 'utf8'));
  
  // Update with new colors
  results.forEach(result => {
    const existingCol = linoleumData.collections.find(c => c.slug === result.slug);
    if (existingCol) {
      existingCol.colors = result.colors;
      existingCol.colorCount = result.colorCount;
      console.log(`  ✓ Updated ${result.name}: ${result.colorCount} colors`);
    }
  });
  
  // Recalculate total
  linoleumData.totalColors = linoleumData.collections.reduce((sum, col) => sum + (col.colorCount || 0), 0);
  linoleumData.generatedAt = new Date().toISOString();
  
  // Save
  fs.writeFileSync(linoleumPath, JSON.stringify(linoleumData, null, 2));
  
  console.log(`\n💾 Updated: ${linoleumPath}`);
  console.log(`📊 Total colors: ${linoleumData.totalColors}`);
}

main().catch(console.error);
