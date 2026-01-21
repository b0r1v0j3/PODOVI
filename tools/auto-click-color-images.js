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
  const seenUrls = new Set();
  
  // Listen for navigation to color pages
  page.on('framenavigated', async (frame) => {
    if (frame === page.mainFrame()) {
      const url = frame.url();
      
      // Check if this is a color page
      const match = url.match(/\/([^/]+)-(\d{4})-([a-z-]+)-(\d+)$/);
      
      if (match && !seenUrls.has(url)) {
        seenUrls.add(url);
        
        const [, slug, code, namePart, sku] = match;
        
        if (slug === collection.slug || url.includes(collection.slug)) {
          const name = namePart.split('-').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
          ).join(' ');
          
          const colorData = {
            code: code,
            name: name.toUpperCase(),
            slug: `${collection.slug}-${code}-${namePart}`,
            href: url,
            sku: sku,
            collection_slug: collection.slug,
            collection_name: collection.slug.split('-').map(word => 
              word.charAt(0).toUpperCase() + word.slice(1)
            ).join(' ')
          };
          
          colors.push(colorData);
          console.log(`    ✓ ${code} ${name.toUpperCase()} (${colors.length} total)`);
        }
      }
    }
  });
  
  try {
    await page.goto(collection.url, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(3000);
    
    // Click Colors button if exists
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
    let previousLinkCount = 0;
    let sameCountIterations = 0;
    
    for (let i = 0; i < 50; i++) {
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });
      await page.waitForTimeout(2000);
      
      // Count color links
      const currentLinkCount = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('a[href*="/products/"]')).length;
      });
      
      if (currentLinkCount === previousLinkCount) {
        sameCountIterations++;
        if (sameCountIterations >= 3) break;
      } else {
        sameCountIterations = 0;
      }
      
      previousLinkCount = currentLinkCount;
      
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
    const colorLinks = await page.evaluate(() => {
      const links = [];
      const seen = new Set();
      
      // Find all links that contain images and point to color pages
      const allLinks = Array.from(document.querySelectorAll('a[href*="/products/"]'));
      
      allLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (!href) return;
        
        const fullUrl = href.startsWith('http') ? href : `https://www.gerflor-cee.com${href}`;
        
        // Check if it's a color link (has 4-digit code)
        const isColorLink = fullUrl.match(/\d{4}/);
        
        // Check if link has an image inside
        const hasImage = link.querySelector('img') !== null;
        
        if (isColorLink && hasImage && !seen.has(fullUrl)) {
          seen.add(fullUrl);
          links.push(fullUrl);
        }
      });
      
      return links;
    });
    
    console.log(`  Found ${colorLinks.length} color image links`);
    console.log('  Clicking on all color images...\n');
    
    // Click on each color link
    for (let i = 0; i < colorLinks.length; i++) {
      const linkUrl = colorLinks[i];
      
      if (seenUrls.has(linkUrl)) {
        continue;
      }
      
      try {
        // Find the link element and click it
        await page.evaluate((url) => {
          const link = Array.from(document.querySelectorAll('a[href*="/products/"]'))
            .find(a => {
              const href = a.getAttribute('href');
              const fullUrl = href?.startsWith('http') ? href : `https://www.gerflor-cee.com${href}`;
              return fullUrl === url;
            });
          
          if (link) {
            link.click();
          }
        }, linkUrl);
        
        // Wait for navigation
        await page.waitForTimeout(1000);
        
        // Go back to collection page
        await page.goBack();
        await page.waitForTimeout(1000);
        
        if ((i + 1) % 10 === 0) {
          console.log(`    Processed ${i + 1}/${colorLinks.length} links...`);
        }
        
      } catch (error) {
        console.log(`    ⚠️  Error clicking link ${i + 1}: ${error.message}`);
      }
    }
    
    console.log(`\n  ✅ Extracted ${colors.length} colors total`);
    
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
  console.log('🚀 Auto-clicking on all color images...\n');
  
  const browser = await chromium.launch({ headless: false, slowMo: 200 });
  
  const results = [];
  let totalColors = 0;
  
  for (let i = 0; i < missingCollections.length; i++) {
    const collection = missingCollections[i];
    console.log(`\n[${i + 1}/${missingCollections.length}] ${collection.name}`);
    
    const result = await scrapeCollection(browser, collection);
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
