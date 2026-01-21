const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const url = 'https://www.gerflor-cee.com/category/heterogeneous-rolls';

async function scrapeAllColors() {
  console.log('🚀 Starting to scrape heterogeneous colors...\n');
  console.log(`URL: ${url}\n`);
  
  const browser = await chromium.launch({ headless: false, slowMo: 500 });
  const page = await browser.newPage();
  
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(5000);
    
    console.log('📄 Page loaded, looking for colors button/tab...\n');
    
    // Try to find and click "Colors" button/tab
    try {
      // Look for various possible selectors for colors button
      const colorButtonSelectors = [
        'button:has-text("Colors")',
        'a:has-text("Colors")',
        'button:has-text("Boje")',
        'a:has-text("Boje")',
        '[class*="color"]',
        '[data-tab="colors"]',
        '[data-tab="boje"]'
      ];
      
      let colorButtonClicked = false;
      for (const selector of colorButtonSelectors) {
        try {
          const button = await page.$(selector);
          if (button) {
            await button.click();
            console.log(`  ✓ Clicked colors button: ${selector}`);
            colorButtonClicked = true;
            await page.waitForTimeout(3000);
            break;
          }
        } catch (e) {
          // Continue to next selector
        }
      }
      
      if (!colorButtonClicked) {
        console.log('  ⚠️  Could not find colors button, continuing anyway...');
      }
    } catch (error) {
      console.log(`  ⚠️  Error clicking colors button: ${error.message}`);
    }
    
    // Now scroll and click "Show more" until all colors are loaded
    console.log('\n📜 Scrolling and clicking "Show more" to load all colors...\n');
    
    let showMoreClicked = 0;
    let previousColorCount = 0;
    let sameCountIterations = 0;
    const maxIterations = 100; // Safety limit
    
    for (let i = 0; i < maxIterations; i++) {
      // Scroll to bottom
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });
      await page.waitForTimeout(2000);
      
      // Count current colors
      const currentColorCount = await page.evaluate(() => {
        // Try to find all color links/elements
        const colorLinks = Array.from(document.querySelectorAll('a[href*="/products/"]'));
        const colorUrls = new Set();
        colorLinks.forEach(link => {
          const href = link.getAttribute('href');
          if (href && href.includes('/products/') && href.match(/\d{4}/)) {
            colorUrls.add(href);
          }
        });
        return colorUrls.size;
      });
      
      console.log(`  [${i + 1}] Found ${currentColorCount} colors so far...`);
      
      // Check if count changed
      if (currentColorCount === previousColorCount) {
        sameCountIterations++;
        if (sameCountIterations >= 3) {
          console.log('  ✓ No more colors to load (count stable)');
          break;
        }
      } else {
        sameCountIterations = 0;
      }
      
      previousColorCount = currentColorCount;
      
      // Look for "Show more" button
      const showMoreButton = await page.$('button:has-text("Show more"), a:has-text("Show more"), button:has-text("Prikaži više"), a:has-text("Prikaži više")');
      
      if (showMoreButton) {
        try {
          await showMoreButton.click();
          showMoreClicked++;
          console.log(`    → Clicked "Show more" (${showMoreClicked} times)`);
          await page.waitForTimeout(3000);
        } catch (e) {
          console.log('    → Could not click "Show more"');
          break;
        }
      } else {
        console.log('  ✓ No "Show more" button found, all colors loaded');
        break;
      }
    }
    
    console.log(`\n✅ Finished loading. Clicked "Show more" ${showMoreClicked} times.\n`);
    
    // Now extract all color links
    console.log('🔍 Extracting all color data...\n');
    
    const allColors = await page.evaluate(() => {
      const colors = [];
      const seen = new Set();
      
      // Get all links
      const links = Array.from(document.querySelectorAll('a[href*="/products/"]'));
      
      links.forEach(link => {
        const href = link.getAttribute('href');
        if (!href) return;
        
        const fullUrl = href.startsWith('http') ? href : `https://www.gerflor-cee.com${href}`;
        
        // Check if it's a color/product URL (has 4-digit code)
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
    
    console.log(`✅ Extracted ${allColors.length} colors\n`);
    
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
    
    console.log(`📊 Found ${collections.length} collections:\n`);
    collections.forEach(col => {
      console.log(`  ${col.name}: ${col.colorCount} colors`);
    });
    
    const totalColors = collections.reduce((sum, col) => sum + col.colorCount, 0);
    console.log(`\n📈 Total: ${totalColors} colors\n`);
    
    // Save to JSON
    const rootDir = path.join(__dirname, '..');
    const outputPath = path.join(rootDir, 'public', 'data', 'gerflor_heterogeneous_colors.json');
    const outputData = {
      collections: collections,
      totalColors: totalColors,
      generatedAt: new Date().toISOString()
    };
    
    fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2));
    console.log(`💾 Saved to: ${outputPath}`);
    
    return collections;
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

scrapeAllColors().catch(console.error);
