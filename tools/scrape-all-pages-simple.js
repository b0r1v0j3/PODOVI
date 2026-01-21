const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const baseUrl = 'https://www.gerflor-cee.com/category/heterogeneous-rolls';

async function scrapeAllPages() {
  console.log('🚀 Scraping all pages (no scrolling, just extract visible links)...\n');
  
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
      
      // Click Colors button
      try {
        const colorButton = await page.$('button:has-text("Colors"), a:has-text("Colors")');
        if (colorButton) {
          await colorButton.click();
          await page.waitForTimeout(2000);
        }
      } catch (e) {
        // Continue
      }
      
      // Extract ALL visible color links (no scrolling!)
      const pageColors = await page.evaluate(() => {
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
      
      // If no new colors found for 2 consecutive pages, we're done
      if (newColorsCount === 0) {
        console.log(`  ⚠️  No new colors, checking next page...`);
        // Try one more page before stopping
        const nextPage = currentPage + 1;
        const nextPageUrl = `${baseUrl}?page=${nextPage}`;
        try {
          await page.goto(nextPageUrl, { waitUntil: 'networkidle', timeout: 30000 });
          await page.waitForTimeout(2000);
          
          const colorButton = await page.$('button:has-text("Colors"), a:has-text("Colors")');
          if (colorButton) {
            await colorButton.click();
            await page.waitForTimeout(2000);
          }
          
          const nextPageColors = await page.evaluate(() => {
            const links = Array.from(document.querySelectorAll('a[href*="/products/"]'));
            return links.filter(link => {
              const href = link.getAttribute('href');
              return href && href.includes('/products/') && href.match(/\d{4}/);
            }).length;
          });
          
          if (nextPageColors === 0) {
            console.log(`  ✅ No more pages with colors, stopping`);
            hasMorePages = false;
            break;
          }
        } catch (e) {
          hasMorePages = false;
          break;
        }
      }
      
      currentPage++;
      await page.waitForTimeout(1500);
    }
    
    console.log(`\n\n✅ Finished! Processed ${currentPage - 1} pages`);
    console.log(`📊 Total colors: ${allColors.length}\n`);
    
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
      console.log(`  ${col.name}: ${col.colorCount} colors`);
    });
    
    const totalColors = collections.reduce((sum, col) => sum + col.colorCount, 0);
    console.log(`\n📈 Total: ${totalColors} colors\n`);
    
    // Update linoleum file
    const rootDir = path.join(__dirname, '..');
    const linoleumPath = path.join(rootDir, 'public', 'data', 'gerflor_linoleum_colors_complete.json');
    const linoleumData = JSON.parse(fs.readFileSync(linoleumPath, 'utf8'));
    
    collections.forEach(col => {
      const existingCol = linoleumData.collections.find(c => c.slug === col.slug);
      if (existingCol) {
        existingCol.colors = col.colors;
        existingCol.colorCount = col.colorCount;
      }
    });
    
    linoleumData.totalColors = linoleumData.collections.reduce((sum, col) => sum + (col.colorCount || 0), 0);
    linoleumData.generatedAt = new Date().toISOString();
    
    fs.writeFileSync(linoleumPath, JSON.stringify(linoleumData, null, 2));
    console.log(`💾 Updated: ${linoleumPath}`);
    console.log(`📊 Total: ${linoleumData.totalColors} colors`);
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

scrapeAllPages().catch(console.error);
