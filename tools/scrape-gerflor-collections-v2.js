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
    await page.waitForTimeout(5000); // Wait for dynamic content
    
    // Try multiple strategies to find color links
    const colorLinks = await page.evaluate(() => {
      const links = [];
      const seen = new Set();
      
      // Strategy 1: All links with /products/ in href
      const allLinks = Array.from(document.querySelectorAll('a[href*="/products/"]'));
      allLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href && !seen.has(href)) {
          seen.add(href);
          links.push({
            href: href.startsWith('http') ? href : `https://www.gerflor-cee.com${href}`,
            text: link.textContent?.trim() || ''
          });
        }
      });
      
      // Strategy 2: Look for color swatches or tiles
      const colorElements = Array.from(document.querySelectorAll('[class*="color"], [class*="swatch"], [class*="tile"]'));
      colorElements.forEach(el => {
        const link = el.closest('a');
        if (link) {
          const href = link.getAttribute('href');
          if (href && href.includes('/products/') && !seen.has(href)) {
            seen.add(href);
            links.push({
              href: href.startsWith('http') ? href : `https://www.gerflor-cee.com${href}`,
              text: el.textContent?.trim() || ''
            });
          }
        }
      });
      
      return links;
    });
    
    console.log(`  Found ${colorLinks.length} potential links`);
    
    // Filter and extract color details
    const colors = [];
    const colorPattern = /(\d{4})-[a-z-]+-(\d+)$/;
    
    for (const link of colorLinks) {
      const href = link.href;
      
      // Check if it matches color URL pattern
      if (colorPattern.test(href)) {
        const match = href.match(/([^/]+)-(\d{4})-([a-z-]+)-(\d+)$/);
        
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
        }
      }
    }
    
    // If no colors found, try to extract from page content
    if (colors.length === 0) {
      console.log(`  Trying alternative extraction method...`);
      
      const pageContent = await page.evaluate(() => {
        return {
          html: document.documentElement.outerHTML,
          text: document.body.innerText
        };
      });
      
      // Look for color codes in the HTML
      const colorCodePattern = /\b(\d{4})\b/g;
      const matches = pageContent.html.match(colorCodePattern);
      
      if (matches) {
        const uniqueCodes = [...new Set(matches)];
        console.log(`  Found ${uniqueCodes.length} potential color codes in HTML`);
        
        // Try to construct URLs based on example
        const exampleMatch = collection.exampleColorUrl.match(/([^/]+)-(\d{4})-([a-z-]+)-(\d+)$/);
        if (exampleMatch) {
          const [, , , exampleNamePart] = exampleMatch;
          
          // This is a fallback - we'll need to visit each color page to get the name
          uniqueCodes.forEach(code => {
            // We'll need to visit the page to get the actual name
            // For now, just create placeholder
            colors.push({
              code: code,
              name: 'UNKNOWN',
              slug: `${collection.slug}-${code}-unknown`,
              href: `${collection.url}-${code}-unknown-00000000`,
              sku: null,
              collection_slug: collection.slug,
              collection_name: collection.name
            });
          });
        }
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

async function scrapeColorDetails(browser, color) {
  if (color.name === 'UNKNOWN' || !color.href.includes('unknown')) {
    return color; // Already has details
  }
  
  const page = await browser.newPage();
  try {
    await page.goto(color.href, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    
    const details = await page.evaluate(() => {
      const title = document.querySelector('h1')?.textContent?.trim() || '';
      const nameMatch = title.match(/-(\d{4})-([a-z-]+)/);
      
      if (nameMatch) {
        const [, code, namePart] = nameMatch;
        const name = namePart.split('-').map(word => 
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
        
        return {
          name: name.toUpperCase(),
          slug: `${code}-${namePart}`
        };
      }
      
      return null;
    });
    
    if (details) {
      color.name = details.name;
      color.slug = `${color.collection_slug}-${details.slug}`;
    }
  } catch (error) {
    // Skip if page doesn't exist
  } finally {
    await page.close();
  }
  
  return color;
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
    
    // If we got colors, try to get details for unknown ones
    if (result.colors.length > 0) {
      const detailedColors = [];
      for (const color of result.colors) {
        const detailed = await scrapeColorDetails(browser, color);
        detailedColors.push(detailed);
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      result.colors = detailedColors;
    }
    
    results.push(result);
    totalColors += result.colorCount;
    
    // Delay between collections
    await new Promise(resolve => setTimeout(resolve, 2000));
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
