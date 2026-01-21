const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const baseUrl = 'https://www.gerflor-cee.com/category/heterogeneous-rolls';

async function scrapeAllPages() {
  console.log('🚀 Starting to scrape all pages of heterogeneous colors...\n');
  console.log(`Base URL: ${baseUrl}\n`);
  
  const browser = await chromium.launch({ headless: false, slowMo: 500 });
  const page = await browser.newPage();
  
  const allColors = [];
  const seenUrls = new Set();
  
  try {
    // Start from page 1 and go until we find no more pages
    let currentPage = 1;
    let hasMorePages = true;
    const maxPages = 30; // Safety limit
    
    while (hasMorePages && currentPage <= maxPages) {
      console.log(`\n📄 Processing page ${currentPage}...`);
      
      // Navigate to page
      const pageUrl = currentPage === 1 ? baseUrl : `${baseUrl}?page=${currentPage}`;
      console.log(`  URL: ${pageUrl}`);
      
      try {
        await page.goto(pageUrl, { waitUntil: 'networkidle', timeout: 60000 });
        await page.waitForTimeout(5000);
      } catch (e) {
        console.log(`  ⚠️  Error loading page ${currentPage}: ${e.message}`);
        hasMorePages = false;
        break;
      }
      
      // Check if page has content (not 404 or empty)
      const hasContent = await page.evaluate(() => {
        const links = document.querySelectorAll('a[href*="/products/"]');
        return links.length > 0;
      });
      
      if (!hasContent) {
        console.log(`  ⚠️  Page ${currentPage} appears to be empty or doesn't exist`);
        hasMorePages = false;
        break;
      }
      
      // Click Colors button
      try {
        const colorButton = await page.$('button:has-text("Colors"), a:has-text("Colors"), button:has-text("Boje"), a:has-text("Boje")');
        if (colorButton) {
          await colorButton.click();
          console.log('  ✓ Clicked colors button');
          await page.waitForTimeout(3000);
        }
      } catch (e) {
        // Continue without clicking
      }
      
      // Scroll and click "Show more" to load all colors on this page
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
      
      // Extract colors from this page
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
      
      console.log(`  ✅ Extracted ${pageColors.length} colors (${newColorsCount} new, ${allColors.length} total)`);
      
      // If no new colors found, we might be done
      if (newColorsCount === 0 && pageColors.length === 0) {
        console.log(`  ⚠️  No colors found on page ${currentPage}, stopping`);
        hasMorePages = false;
        break;
      }
      
      // Move to next page
      currentPage++;
      
      // Small delay between pages
      await page.waitForTimeout(2000);
    }
    
    console.log(`\n\n✅ Finished! Processed ${currentPage - 1} pages`);
    console.log(`📊 Total colors extracted: ${allColors.length}\n`);
    
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
    
    // Sort collections by name
    collections.sort((a, b) => a.name.localeCompare(b.name));
    
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
    
    // Also update linoleum file
    const linoleumPath = path.join(rootDir, 'public', 'data', 'gerflor_linoleum_colors_complete.json');
    const linoleumData = JSON.parse(fs.readFileSync(linoleumPath, 'utf8'));
    
    // Update collections
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
    
    return collections;
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

scrapeAllPages().catch(console.error);
