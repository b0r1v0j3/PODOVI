const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function scrapePage19Collections() {
  console.log('🚀 Scraping page 19 for collections...\n');
  
  const browser = await chromium.launch({ headless: false, slowMo: 500 });
  const page = await browser.newPage();
  
  try {
    const url = 'https://www.gerflor-cee.com/category/heterogeneous-rolls?page=19';
    console.log(`URL: ${url}\n`);
    
    await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(5000);
    
    // Extract all product links
    const productLinks = await page.evaluate(() => {
      const links = [];
      const seen = new Set();
      
      const allLinks = Array.from(document.querySelectorAll('a[href*="/products/"]'));
      
      allLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (!href) return;
        
        const fullUrl = href.startsWith('http') ? href : `https://www.gerflor-cee.com${href}`;
        
        if (!seen.has(fullUrl)) {
          seen.add(fullUrl);
          
          // Check if it's a collection (no 4-digit code) or a color (has 4-digit code)
          const isColor = fullUrl.match(/\d{4}/);
          const isCollection = !isColor && fullUrl.includes('/products/');
          
          if (isCollection || isColor) {
            links.push({
              url: fullUrl,
              text: link.textContent?.trim() || '',
              isColor: !!isColor
            });
          }
        }
      });
      
      return links;
    });
    
    console.log(`Found ${productLinks.length} product links\n`);
    
    // Group by collection
    const collections = new Map();
    
    productLinks.forEach(link => {
      const match = link.url.match(/\/products\/([^/]+)/);
      if (match) {
        const slug = match[1];
        
        // Skip if it's a color (has 4-digit code in URL)
        if (link.isColor) {
          const colorMatch = link.url.match(/\/([^/]+)-(\d{4})-/);
          if (colorMatch) {
            const collectionSlug = colorMatch[1];
            if (!collections.has(collectionSlug)) {
              collections.set(collectionSlug, {
                slug: collectionSlug,
                url: `https://www.gerflor-cee.com/products/${collectionSlug}`,
                colors: []
              });
            }
            
            const colorMatch2 = link.url.match(/\/([^/]+)-(\d{4})-([a-z-]+)-(\d+)$/);
            if (colorMatch2) {
              const [, , code, namePart] = colorMatch2;
              const name = namePart.split('-').map(word => 
                word.charAt(0).toUpperCase() + word.slice(1)
              ).join(' ');
              
              collections.get(collectionSlug).colors.push({
                code: code,
                name: name.toUpperCase(),
                slug: `${collectionSlug}-${code}-${namePart}`,
                href: link.url,
                sku: colorMatch2[4],
                collection_slug: collectionSlug,
                collection_name: collectionSlug.split('-').map(word => 
                  word.charAt(0).toUpperCase() + word.slice(1)
                ).join(' ')
              });
            }
          }
        } else {
          // It's a collection page
          if (!collections.has(slug)) {
            collections.set(slug, {
              slug: slug,
              url: link.url,
              name: link.text,
              colors: []
            });
          }
        }
      }
    });
    
    console.log(`Found ${collections.size} collections:\n`);
    collections.forEach((col, slug) => {
      console.log(`  ${slug}: ${col.colors.length} colors`);
    });
    
    // Now visit each collection page to get colors
    const allColors = [];
    
    for (const [slug, collection] of collections) {
      if (collection.colors.length === 0 && collection.url) {
        console.log(`\n📦 Visiting ${slug}...`);
        
        try {
          await page.goto(collection.url, { waitUntil: 'networkidle', timeout: 60000 });
          await page.waitForTimeout(3000);
          
          // Click Colors button
          try {
            const colorButton = await page.$('button:has-text("Colors"), a:has-text("Colors")');
            if (colorButton) {
              await colorButton.click();
              await page.waitForTimeout(3000);
            }
          } catch (e) {
            // Continue
          }
          
          // Scroll and click Show more
          for (let i = 0; i < 20; i++) {
            await page.evaluate(() => {
              window.scrollTo(0, document.body.scrollHeight);
            });
            await page.waitForTimeout(2000);
            
            const showMoreButton = await page.$('button:has-text("Show more"), a:has-text("Show more")');
            if (showMoreButton) {
              await showMoreButton.click();
              await page.waitForTimeout(3000);
            } else {
              break;
            }
          }
          
          // Extract colors
          const pageColors = await page.evaluate((collectionSlug) => {
            const colors = [];
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
              }
            });
            
            return colors;
          }, slug);
          
          collection.colors = pageColors;
          collection.colorCount = pageColors.length;
          console.log(`  ✅ Found ${pageColors.length} colors`);
          
        } catch (error) {
          console.log(`  ❌ Error: ${error.message}`);
        }
      }
      
      allColors.push(...collection.colors);
    }
    
    // Convert to array format
    const collectionsArray = Array.from(collections.values()).map(col => ({
      name: col.name || col.collection_name || col.slug.split('-').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' '),
      slug: col.slug,
      url: col.url,
      colors: col.colors,
      colorCount: col.colors.length
    }));
    
    const totalColors = collectionsArray.reduce((sum, col) => sum + col.colorCount, 0);
    console.log(`\n\n✅ Total: ${totalColors} colors from ${collectionsArray.length} collections\n`);
    
    // Update linoleum file
    const rootDir = path.join(__dirname, '..');
    const linoleumPath = path.join(rootDir, 'public', 'data', 'gerflor_linoleum_colors_complete.json');
    const linoleumData = JSON.parse(fs.readFileSync(linoleumPath, 'utf8'));
    
    collectionsArray.forEach(col => {
      const existingCol = linoleumData.collections.find(c => c.slug === col.slug);
      if (existingCol) {
        existingCol.colors = col.colors;
        existingCol.colorCount = col.colorCount;
        console.log(`  ✓ Updated ${col.name}: ${col.colorCount} colors`);
      }
    });
    
    linoleumData.totalColors = linoleumData.collections.reduce((sum, col) => sum + (col.colorCount || 0), 0);
    linoleumData.generatedAt = new Date().toISOString();
    
    fs.writeFileSync(linoleumPath, JSON.stringify(linoleumData, null, 2));
    console.log(`\n💾 Updated: ${linoleumPath}`);
    console.log(`📊 Total colors: ${linoleumData.totalColors}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

scrapePage19Collections().catch(console.error);
