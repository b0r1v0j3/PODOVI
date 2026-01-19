const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const collections = [
  {
    name: 'Nerok 55',
    slug: 'nerok-55',
    url: 'https://www.gerflor-cee.com/products/nerok-55'
  },
  {
    name: 'Nerok 70',
    slug: 'nerok-70',
    url: 'https://www.gerflor-cee.com/products/nerok-70'
  },
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
    name: 'Taralay Impression Acoustic',
    slug: 'taralay-impression-acoustic',
    url: 'https://www.gerflor-cee.com/products/taralay-impression-acoustic'
  },
  {
    name: 'Taralay Impression Compact',
    slug: 'taralay-impression-compact',
    url: 'https://www.gerflor-cee.com/products/taralay-impression-compact'
  },
  {
    name: 'Taralay Impression Hop Acoustic',
    slug: 'taralay-impression-hop-acoustic',
    url: 'https://www.gerflor-cee.com/products/taralay-impression-hop-acoustic'
  },
  {
    name: 'Taralay Impression Hop Compact',
    slug: 'taralay-impression-hop-compact',
    url: 'https://www.gerflor-cee.com/products/taralay-impression-hop-compact'
  },
  {
    name: 'Taralay Initial Acoustic',
    slug: 'taralay-initial-acoustic',
    url: 'https://www.gerflor-cee.com/products/taralay-initial-acoustic'
  },
  {
    name: 'Taralay Initial Compact',
    slug: 'taralay-initial-compact',
    url: 'https://www.gerflor-cee.com/products/taralay-initial-compact'
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
  const seenUrls = new Set();
  
  // Intercept network requests to find API calls
  page.on('response', async (response) => {
    const url = response.url();
    
    // Look for API responses that might contain color data
    if (url.includes('api') || url.includes('products') || url.includes('colors')) {
      try {
        const contentType = response.headers()['content-type'] || '';
        if (contentType.includes('json')) {
          const data = await response.json();
          
          // Try to extract colors from response
          if (Array.isArray(data)) {
            data.forEach(item => {
              if (item.code || item.colorCode || item.sku) {
                const colorUrl = item.url || item.href || item.link;
                if (colorUrl && !seenUrls.has(colorUrl)) {
                  seenUrls.add(colorUrl);
                  
                  const code = (item.code || item.colorCode || '').toString().padStart(4, '0');
                  const name = (item.name || item.colorName || '').toUpperCase();
                  const slug = item.slug || `${collection.slug}-${code}-${name.toLowerCase().replace(/\s+/g, '-')}`;
                  
                  colors.push({
                    code: code,
                    name: name,
                    slug: slug,
                    href: colorUrl,
                    sku: item.sku || null,
                    collection_slug: collection.slug,
                    collection_name: collection.name
                  });
                }
              }
            });
          } else if (data.colors || data.products || data.items) {
            const items = data.colors || data.products || data.items || [];
            items.forEach(item => {
              if (item.code || item.colorCode || item.sku) {
                const colorUrl = item.url || item.href || item.link;
                if (colorUrl && !seenUrls.has(colorUrl)) {
                  seenUrls.add(colorUrl);
                  
                  const code = (item.code || item.colorCode || '').toString().padStart(4, '0');
                  const name = (item.name || item.colorName || '').toUpperCase();
                  const slug = item.slug || `${collection.slug}-${code}-${name.toLowerCase().replace(/\s+/g, '-')}`;
                  
                  colors.push({
                    code: code,
                    name: name,
                    slug: slug,
                    href: colorUrl,
                    sku: item.sku || null,
                    collection_slug: collection.slug,
                    collection_name: collection.name
                  });
                }
              }
            });
          }
        }
      } catch (e) {
        // Not JSON or error parsing, skip
      }
    }
  });
  
  try {
    await page.goto(collection.url, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(10000); // Wait for all requests
    
    // Also try to extract from page content
    const pageColors = await page.evaluate((collectionSlug) => {
      const foundColors = [];
      const seen = new Set();
      
      // Get all links
      const links = Array.from(document.querySelectorAll('a[href*="/products/"]'));
      
      links.forEach(link => {
        const href = link.getAttribute('href');
        if (!href) return;
        
        const fullUrl = href.startsWith('http') ? href : `https://www.gerflor-cee.com${href}`;
        
        // Match color URL pattern: collection-code-name-sku
        const match = fullUrl.match(/\/([^/]+)-(\d{4})-([a-z-]+)-(\d+)$/);
        
        if (match) {
          const [, slug, code, namePart, sku] = match;
          
          if (slug === collectionSlug && !seen.has(fullUrl)) {
            seen.add(fullUrl);
            
            const name = namePart.split('-').map(word => 
              word.charAt(0).toUpperCase() + word.slice(1)
            ).join(' ');
            
            foundColors.push({
              code: code,
              name: name.toUpperCase(),
              slug: `${collectionSlug}-${code}-${namePart}`,
              href: fullUrl,
              sku: sku
            });
          }
        }
      });
      
      return foundColors;
    }, collection.slug);
    
    // Merge page colors with network colors
    pageColors.forEach(color => {
      if (!seenUrls.has(color.href)) {
        seenUrls.add(color.href);
        colors.push({
          ...color,
          collection_slug: collection.slug,
          collection_name: collection.name
        });
      }
    });
    
    console.log(`  ✅ Found ${colors.length} colors`);
    
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
  console.log('🚀 Starting Gerflor collections scraping with network interception...\n');
  
  const browser = await chromium.launch({ headless: true });
  
  const results = [];
  let totalColors = 0;
  
  for (let i = 0; i < collections.length; i++) {
    const collection = collections[i];
    console.log(`\n[${i + 1}/${collections.length}] ${collection.name}`);
    
    const result = await scrapeCollection(browser, collection);
    results.push(result);
    totalColors += result.colorCount;
    
    await new Promise(resolve => setTimeout(resolve, 3000));
  }
  
  await browser.close();
  
  console.log(`\n\n✅ Scraping complete!`);
  console.log(`Total collections: ${results.length}`);
  console.log(`Total colors: ${totalColors}`);
  
  // Save results
  const rootDir = path.join(__dirname, '..');
  const outputPath = path.join(rootDir, 'public', 'data', 'gerflor_collections_complete.json');
  const outputData = {
    collections: results,
    totalColors: totalColors,
    generatedAt: new Date().toISOString()
  };
  
  fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2));
  console.log(`\n💾 Saved to: ${outputPath}`);
  
  // Print summary
  console.log(`\n📊 Summary:`);
  results.forEach(col => {
    console.log(`  ${col.name}: ${col.colorCount} colors`);
  });
}

main().catch(console.error);
