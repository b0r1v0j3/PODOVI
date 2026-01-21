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

async function scrapeCollection(browser, collection) {
  console.log(`\n📦 Scraping: ${collection.name}...`);
  console.log(`  URL: ${collection.url}`);
  
  const page = await browser.newPage();
  const colors = [];
  
  try {
    await page.goto(collection.url, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(5000);
    
    // Check what's on the page
    const pageInfo = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a[href*="/products/"]'));
      const buttons = Array.from(document.querySelectorAll('button, a')).map(el => el.textContent?.trim()).filter(Boolean);
      
      return {
        linksCount: links.length,
        hasColorsButton: buttons.some(t => t.toLowerCase().includes('color') || t.toLowerCase().includes('boj')),
        sampleLinks: links.slice(0, 5).map(l => l.getAttribute('href'))
      };
    });
    
    console.log(`  Links found: ${pageInfo.linksCount}`);
    console.log(`  Has colors button: ${pageInfo.hasColorsButton}`);
    
    // Try to click Colors button
    try {
      const colorButton = await page.$('button:has-text("Colors"), a:has-text("Colors"), button:has-text("Boje"), a:has-text("Boje"), [class*="color"]');
      if (colorButton) {
        await colorButton.click();
        console.log('  ✓ Clicked colors button');
        await page.waitForTimeout(3000);
      }
    } catch (e) {
      console.log('  ⚠️  Could not click colors button');
    }
    
    // Scroll and click Show more
    let showMoreClicked = 0;
    for (let i = 0; i < 30; i++) {
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });
      await page.waitForTimeout(2000);
      
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
    
    // Extract colors
    const extractedColors = await page.evaluate((collectionSlug) => {
      const foundColors = [];
      const seen = new Set();
      
      const links = Array.from(document.querySelectorAll('a[href*="/products/"]'));
      
      links.forEach(link => {
        const href = link.getAttribute('href');
        if (!href) return;
        
        const fullUrl = href.startsWith('http') ? href : `https://www.gerflor-cee.com${href}`;
        
        // Try different patterns
        const patterns = [
          /\/([^/]+)-(\d{4})-([a-z-]+)-(\d+)$/,  // Standard pattern
          /\/([^/]+)\/(\d{4})-([a-z-]+)/,        // Alternative pattern
          /\/([^/]+)-(\d{4})-([a-z-]+)$/         // Without SKU
        ];
        
        for (const pattern of patterns) {
          const match = fullUrl.match(pattern);
          if (match && !seen.has(fullUrl)) {
            const [, slug, code, namePart, sku] = match;
            
            if (slug === collectionSlug || fullUrl.includes(collectionSlug)) {
              seen.add(fullUrl);
              
              const name = namePart ? namePart.split('-').map(word => 
                word.charAt(0).toUpperCase() + word.slice(1)
              ).join(' ') : '';
              
              foundColors.push({
                code: code,
                name: name.toUpperCase() || code,
                slug: sku ? `${collectionSlug}-${code}-${namePart}` : `${collectionSlug}-${code}`,
                href: fullUrl,
                sku: sku || code,
                collection_slug: collectionSlug,
                collection_name: collectionSlug.split('-').map(word => 
                  word.charAt(0).toUpperCase() + word.slice(1)
                ).join(' ')
              });
              break;
            }
          }
        }
      });
      
      return foundColors;
    }, collection.slug);
    
    console.log(`  ✅ Extracted ${extractedColors.length} colors`);
    
    if (extractedColors.length === 0) {
      // Try to find any product links that might be colors
      const allLinks = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('a[href*="/products/"]'))
          .map(link => ({
            href: link.getAttribute('href'),
            text: link.textContent?.trim()
          }))
          .filter(link => link.href && link.href.includes('/products/'))
          .slice(0, 10);
      });
      
      console.log(`  Sample links on page:`);
      allLinks.forEach(link => {
        console.log(`    ${link.href} - ${link.text}`);
      });
    }
    
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
  console.log('🚀 Scraping missing 4 collections...\n');
  
  const browser = await chromium.launch({ headless: false, slowMo: 500 });
  
  const results = [];
  let totalColors = 0;
  
  for (let i = 0; i < missingCollections.length; i++) {
    const collection = missingCollections[i];
    console.log(`\n[${i + 1}/${missingCollections.length}] ${collection.name}`);
    
    const result = await scrapeCollection(browser, collection);
    results.push(result);
    totalColors += result.colorCount;
    
    await new Promise(resolve => setTimeout(resolve, 3000));
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
