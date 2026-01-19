const { chromium } = require('playwright');

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
    exampleColorUrl: 'https://www.gerflor-cee.com/products/premium-compact-0027-cocoon-muslin-hd740027'
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
    
    // Wait for color links to load
    await page.waitForTimeout(3000);
    
    // Find all color links - they typically have hrefs like /products/collection-colorcode-name-sku
    const colorLinks = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a[href*="/products/"]'));
      const colorLinks = [];
      const seen = new Set();
      
      links.forEach(link => {
        const href = link.getAttribute('href');
        if (href && href.includes('/products/') && href !== window.location.pathname) {
          // Check if it's a color link (not collection page)
          if (href.match(/\d{4}-[a-z-]+-\d+/)) {
            if (!seen.has(href)) {
              seen.add(href);
              const text = link.textContent?.trim() || '';
              colorLinks.push({
                href: href.startsWith('http') ? href : `https://www.gerflor-cee.com${href}`,
                text: text
              });
            }
          }
        }
      });
      
      return colorLinks;
    });
    
    console.log(`  Found ${colorLinks.length} color links`);
    
    // Extract color details from each link
    const colors = [];
    
    for (let i = 0; i < colorLinks.length; i++) {
      const link = colorLinks[i];
      const href = link.href;
      
      // Extract color code and name from URL
      // Format: /products/collection-colorcode-name-sku
      const match = href.match(/\/([^/]+)-(\d{4})-([a-z-]+)-(\d+)$/);
      
      if (match) {
        const [, collectionSlug, code, namePart, sku] = match;
        const name = namePart.split('-').map(word => 
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
        
        colors.push({
          code: code,
          name: name.toUpperCase(),
          slug: `${collection.slug}-${code}-${namePart}`,
          href: href,
          sku: sku,
          collection_slug: collection.slug,
          collection_name: collection.name
        });
      } else {
        // Try alternative pattern
        const altMatch = href.match(/\/([^/]+)-(\d{4})-([a-z-]+)$/);
        if (altMatch) {
          const [, collectionSlug, code, namePart] = altMatch;
          const name = namePart.split('-').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
          ).join(' ');
          
          colors.push({
            code: code,
            name: name.toUpperCase(),
            slug: `${collection.slug}-${code}-${namePart}`,
            href: href,
            sku: null,
            collection_slug: collection.slug,
            collection_name: collection.name
          });
        }
      }
      
      if ((i + 1) % 10 === 0) {
        console.log(`  Processed ${i + 1}/${colorLinks.length} colors...`);
      }
    }
    
    console.log(`  ✅ Extracted ${colors.length} colors`);
    
    return {
      ...collection,
      colors: colors,
      colorCount: colors.length
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
  
  const browser = await chromium.launch({ headless: true });
  
  const results = [];
  let totalColors = 0;
  
  for (let i = 0; i < collections.length; i++) {
    const collection = collections[i];
    console.log(`\n[${i + 1}/${collections.length}] Processing: ${collection.name}`);
    
    const result = await scrapeCollection(browser, collection);
    results.push(result);
    totalColors += result.colorCount;
    
    // Small delay between collections
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  await browser.close();
  
  console.log(`\n\n✅ Scraping complete!`);
  console.log(`Total collections: ${results.length}`);
  console.log(`Total colors: ${totalColors}`);
  
  // Save results to JSON
  const fs = require('fs');
  const path = require('path');
  
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
