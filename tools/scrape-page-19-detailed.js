const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function scrapePage19() {
  console.log('🚀 Scraping page 19 in detail...\n');
  
  const browser = await chromium.launch({ headless: false, slowMo: 500 });
  const page = await browser.newPage();
  
  try {
    const url = 'https://www.gerflor-cee.com/category/heterogeneous-rolls?page=19';
    console.log(`URL: ${url}\n`);
    
    await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(5000);
    
    // Click Colors button
    try {
      const colorButton = await page.$('button:has-text("Colors"), a:has-text("Colors")');
      if (colorButton) {
        await colorButton.click();
        console.log('✓ Clicked colors button');
        await page.waitForTimeout(3000);
      }
    } catch (e) {
      console.log('Could not click colors button');
    }
    
    // Scroll and click "Show more" many times
    console.log('\n📜 Clicking "Show more" to load all colors...\n');
    
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
      
      console.log(`  [${i + 1}] Found ${currentColorCount} colors so far...`);
      
      if (currentColorCount === previousColorCount) {
        sameCountIterations++;
        if (sameCountIterations >= 3) {
          console.log('  ✓ No more colors to load');
          break;
        }
      } else {
        sameCountIterations = 0;
      }
      
      previousColorCount = currentColorCount;
      
      const showMoreButton = await page.$('button:has-text("Show more"), a:has-text("Show more")');
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
        console.log('  ✓ No "Show more" button found');
        break;
      }
    }
    
    console.log(`\n✅ Finished. Clicked "Show more" ${showMoreClicked} times.\n`);
    
    // Extract all colors
    console.log('🔍 Extracting all colors...\n');
    
    const allColors = await page.evaluate(() => {
      const colors = [];
      const seen = new Set();
      
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
    
    // Sort by name
    collections.sort((a, b) => a.name.localeCompare(b.name));
    
    console.log(`📊 Found ${collections.length} collections:\n`);
    collections.forEach(col => {
      console.log(`  ${col.name}: ${col.colorCount} colors`);
    });
    
    const totalColors = collections.reduce((sum, col) => sum + col.colorCount, 0);
    console.log(`\n📈 Total: ${totalColors} colors\n`);
    
    // Save to file
    const rootDir = path.join(__dirname, '..');
    const outputPath = path.join(rootDir, 'public', 'data', 'page19_colors.json');
    const outputData = {
      collections: collections,
      totalColors: totalColors,
      generatedAt: new Date().toISOString()
    };
    
    fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2));
    console.log(`💾 Saved to: ${outputPath}`);
    
    // Also update linoleum file
    const linoleumPath = path.join(rootDir, 'public', 'data', 'gerflor_linoleum_colors_complete.json');
    const linoleumData = JSON.parse(fs.readFileSync(linoleumPath, 'utf8'));
    
    // Update collections
    collections.forEach(col => {
      const existingCol = linoleumData.collections.find(c => c.slug === col.slug);
      if (existingCol) {
        existingCol.colors = col.colors;
        existingCol.colorCount = col.colorCount;
        console.log(`  ✓ Updated ${col.name}: ${col.colorCount} colors`);
      } else {
        console.log(`  ⚠️  Collection ${col.name} not found in linoleum structure`);
      }
    });
    
    linoleumData.totalColors = linoleumData.collections.reduce((sum, col) => sum + (col.colorCount || 0), 0);
    linoleumData.generatedAt = new Date().toISOString();
    
    fs.writeFileSync(linoleumPath, JSON.stringify(linoleumData, null, 2));
    console.log(`\n💾 Updated: ${linoleumPath}`);
    console.log(`📊 Total colors in linoleum file: ${linoleumData.totalColors}`);
    
    return collections;
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

scrapePage19().catch(console.error);
