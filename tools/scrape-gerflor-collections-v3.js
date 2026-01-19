const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const collections = [
  {
    name: 'Nerok 55',
    slug: 'nerok-55',
    url: 'https://www.gerflor-cee.com/products/nerok-55',
    exampleColorUrl: 'https://www.gerflor-cee.com/products/nerok-55-0476-noma-miel-28130476'
  },
  {
    name: 'Nerok 70',
    slug: 'nerok-70',
    url: 'https://www.gerflor-cee.com/products/nerok-70',
    exampleColorUrl: 'https://www.gerflor-cee.com/products/nerok-70-0476-noma-miel-12380476'
  },
  {
    name: 'Premium Acoustic',
    slug: 'premium-acoustic',
    url: 'https://www.gerflor-cee.com/products/premium-acoustic',
    exampleColorUrl: 'https://www.gerflor-cee.com/products/premium-acoustic-0027-cocoon-muslin-hd740027'
  },
  {
    name: 'Premium Compact',
    slug: 'premium-compact',
    url: 'https://www.gerflor-cee.com/products/premium-compact',
    exampleColorUrl: 'https://www.gerflor-cee.com/products/premium-compact-0027-cocoon-muslin-hd420027'
  },
  {
    name: 'Taralay Impression Acoustic',
    slug: 'taralay-impression-acoustic',
    url: 'https://www.gerflor-cee.com/products/taralay-impression-acoustic',
    exampleColorUrl: 'https://www.gerflor-cee.com/products/taralay-impression-acoustic-0373-noma-ice-20000373'
  },
  {
    name: 'Taralay Impression Compact',
    slug: 'taralay-impression-compact',
    url: 'https://www.gerflor-cee.com/products/taralay-impression-compact',
    exampleColorUrl: 'https://www.gerflor-cee.com/products/taralay-impression-compact-0373-noma-ice-20010373'
  },
  {
    name: 'Taralay Impression Hop Acoustic',
    slug: 'taralay-impression-hop-acoustic',
    url: 'https://www.gerflor-cee.com/products/taralay-impression-hop-acoustic',
    exampleColorUrl: 'https://www.gerflor-cee.com/products/taralay-impression-hop-acoustic-0373-noma-ice-29850373'
  },
  {
    name: 'Taralay Impression Hop Compact',
    slug: 'taralay-impression-hop-compact',
    url: 'https://www.gerflor-cee.com/products/taralay-impression-hop-compact',
    exampleColorUrl: 'https://www.gerflor-cee.com/products/taralay-impression-hop-compact-0373-noma-ice-29870373'
  },
  {
    name: 'Taralay Initial Acoustic',
    slug: 'taralay-initial-acoustic',
    url: 'https://www.gerflor-cee.com/products/taralay-initial-acoustic',
    exampleColorUrl: 'https://www.gerflor-cee.com/products/taralay-initial-acoustic-0035-urban-gris-22150035'
  },
  {
    name: 'Taralay Initial Compact',
    slug: 'taralay-initial-compact',
    url: 'https://www.gerflor-cee.com/products/taralay-initial-compact',
    exampleColorUrl: 'https://www.gerflor-cee.com/products/taralay-initial-compact-0035-urban-gris-22220035'
  },
  {
    name: 'Taralay Millenium Acoustic Order',
    slug: 'taralay-millenium-acoustic-order',
    url: 'https://www.gerflor-cee.com/products/taralay-millenium-acoustic-order',
    exampleColorUrl: 'https://www.gerflor-cee.com/products/taralay-millenium-acoustic-order-3435-nemesis-hd023435'
  },
  {
    name: 'Taralay Millenium Compact',
    slug: 'taralay-millenium-compact',
    url: 'https://www.gerflor-cee.com/products/taralay-millenium-compact',
    exampleColorUrl: 'https://www.gerflor-cee.com/products/taralay-millenium-compact-3435-nemesis-hd063435'
  }
];

async function scrapeCollection(browser, collection) {
  console.log(`\n📦 Scraping: ${collection.name}...`);
  
  const page = await browser.newPage();
  
  try {
    await page.goto(collection.url, { waitUntil: 'networkidle', timeout: 60000 });
    
    // Wait longer for dynamic content
    await page.waitForTimeout(8000);
    
    // Try to click "View all colors" or similar button if exists
    try {
      const viewAllButton = await page.$('button:has-text("View all"), a:has-text("View all"), button:has-text("Pogledaj sve"), a:has-text("Pogledaj sve")');
      if (viewAllButton) {
        await viewAllButton.click();
        await page.waitForTimeout(3000);
      }
    } catch (e) {
      // Button not found, continue
    }
    
    // Try to scroll to load more content
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    await page.waitForTimeout(2000);
    
    // Extract all possible color links
    const colorData = await page.evaluate((collectionSlug) => {
      const colors = [];
      const seen = new Set();
      
      // Get all links
      const allLinks = Array.from(document.querySelectorAll('a[href]'));
      
      allLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (!href) return;
        
        const fullUrl = href.startsWith('http') ? href : `https://www.gerflor-cee.com${href}`;
        
        // Check if it's a color URL (has 4-digit code and name)
        const colorMatch = fullUrl.match(/\/([^/]+)-(\d{4})-([a-z-]+)-(\d+)$/);
        
        if (colorMatch) {
          const [, slug, code, namePart, sku] = colorMatch;
          
          // Check if it belongs to this collection
          if (slug === collectionSlug && !seen.has(fullUrl)) {
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
              collection_name: collection.name
            });
          }
        }
      });
      
      // Also try to find color data in page content/scripts
      const scripts = Array.from(document.querySelectorAll('script'));
      scripts.forEach(script => {
        const content = script.textContent || '';
        // Look for JSON data or color arrays
        if (content.includes('colors') || content.includes('products')) {
          try {
            // Try to extract JSON
            const jsonMatch = content.match(/\{[\s\S]*"colors"[\s\S]*\}/);
            if (jsonMatch) {
              const data = JSON.parse(jsonMatch[0]);
              if (data.colors || data.products) {
                const items = data.colors || data.products || [];
                items.forEach(item => {
                  if (item.code && item.name) {
                    const colorUrl = item.url || item.href || `${collection.url}-${item.code}-${item.slug || item.name.toLowerCase().replace(/\s+/g, '-')}-${item.sku || '00000000'}`;
                    if (!seen.has(colorUrl)) {
                      seen.add(colorUrl);
                      colors.push({
                        code: item.code.toString().padStart(4, '0'),
                        name: item.name.toUpperCase(),
                        slug: `${collectionSlug}-${item.code}-${(item.slug || item.name.toLowerCase().replace(/\s+/g, '-'))}`,
                        href: colorUrl,
                        sku: item.sku || null,
                        collection_slug: collectionSlug,
                        collection_name: collection.name
                      });
                    }
                  }
                });
              }
            }
          } catch (e) {
            // Not valid JSON, skip
          }
        }
      });
      
      return colors;
    }, collection.slug);
    
    console.log(`  ✅ Extracted ${colorData.length} colors`);
    
    return {
      ...collection,
      colors: colorData,
      colorCount: colorData.length
    };
    
  } catch (error) {
    console.error(`  ❌ Error scraping ${collection.name}:`, error.message);
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
  console.log('🚀 Starting Gerflor collections scraping...\n');
  console.log(`Total collections: ${collections.length}\n`);
  
  const browser = await chromium.launch({ 
    headless: false, // Show browser to debug
    slowMo: 1000 // Slow down for debugging
  });
  
  const results = [];
  let totalColors = 0;
  
  for (let i = 0; i < collections.length; i++) {
    const collection = collections[i];
    console.log(`\n[${i + 1}/${collections.length}] Processing: ${collection.name}`);
    
    const result = await scrapeCollection(browser, collection);
    results.push(result);
    totalColors += result.colorCount;
    
    // Delay between collections
    await new Promise(resolve => setTimeout(resolve, 3000));
  }
  
  await browser.close();
  
  console.log(`\n\n✅ Scraping complete!`);
  console.log(`Total collections: ${results.length}`);
  console.log(`Total colors: ${totalColors}`);
  
  // Save results to JSON
  const outputPath = path.join(__dirname, '..', 'public', 'data', 'gerflor_collections_complete.json');
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
