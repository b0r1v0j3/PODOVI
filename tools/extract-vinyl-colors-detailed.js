const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const collections = [
  {
    name: 'Mipolam Accord',
    slug: 'mipolam-accord',
    url: 'https://www.gerflor-cee.com/products/mipolam-accord-0301-louise-85860301'
  },
  {
    name: 'Mipolam Affinity',
    slug: 'mipolam-affinity',
    url: 'https://www.gerflor-cee.com/products/mipolam-affinity-4401-quartz-86804401'
  },
  {
    name: 'Mipolam Affinity 608x608',
    slug: 'mipolam-affinity-608x608',
    url: 'https://www.gerflor-cee.com/products/mipolam-affinity-608x608-4401-quartz-86814401'
  },
  {
    name: 'Mipolam Astro',
    slug: 'mipolam-astro',
    url: 'https://www.gerflor-cee.com/products/mipolam-astro-2401-wise-87952401'
  },
  {
    name: 'Mipolam Bioplanet',
    slug: 'mipolam-bioplanet',
    url: 'https://www.gerflor-cee.com/products/mipolam-bioplanet-5402-ivory-dust-88925402'
  },
  {
    name: 'Mipolam Classic 15mm',
    slug: 'mipolam-classic-15mm',
    url: 'https://www.gerflor-cee.com/products/mipolam-classic-15mm-0002-platinum-41330002'
  },
  {
    name: 'Mipolam Classic 2mm',
    slug: 'mipolam-classic-2mm',
    url: 'https://www.gerflor-cee.com/products/mipolam-classic-2mm-0002-platinum-43000002'
  },
  {
    name: 'Mipolam Elegance',
    slug: 'mipolam-elegance',
    url: 'https://www.gerflor-cee.com/products/mipolam-elegance-0318-grape-26920318'
  },
  {
    name: 'Mipolam Planet',
    slug: 'mipolam-planet',
    url: 'https://www.gerflor-cee.com/products/mipolam-planet-5402-ivory-dust-86925402'
  },
  {
    name: 'Mipolam Symbioz',
    slug: 'mipolam-symbioz',
    url: 'https://www.gerflor-cee.com/products/mipolam-symbioz-6001-cotton-85926001'
  },
  {
    name: 'Mipolam Troplan',
    slug: 'mipolam-troplan',
    url: 'https://www.gerflor-cee.com/products/mipolam-troplan-1002-beige-85931002'
  }
];

async function extractColorsForCollection(browser, collection) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Extracting colors for: ${collection.name}`);
  console.log(`URL: ${collection.url}`);
  console.log('='.repeat(60));

  const page = await browser.newPage();
  
  try {
    await page.goto(collection.url, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);
    
    // Try to find all color links - they usually have the collection name + color code in URL
    const colorLinks = await page.$$eval('a[href*="mipolam"]', (links, collectionSlug) => {
      return links
        .map(link => {
          const href = link.href;
          const text = link.textContent?.trim() || '';
          const title = link.title?.trim() || '';
          
          // Extract color code and name from URL or text
          // Pattern: mipolam-accord-0301-louise-85860301
          const match = href.match(/mipolam[^/]*-(\d{4})[^/]*-(\d+)$/);
          if (match) {
            const colorCode = match[1];
            const sku = match[2];
            
            // Try to get color name from text or title
            let colorName = text || title;
            if (!colorName || colorName.length < 2) {
              // Extract from URL
              const urlParts = href.split('-');
              const nameIndex = urlParts.findIndex(p => p === colorCode) + 1;
              if (nameIndex > 0 && nameIndex < urlParts.length) {
                colorName = urlParts[nameIndex];
              }
            }
            
            return {
              href: href,
              colorCode: colorCode,
              colorName: colorName?.toUpperCase() || '',
              sku: sku,
              text: text,
              title: title
            };
          }
          return null;
        })
        .filter(item => item !== null && item.href.includes(collectionSlug));
    }, collection.slug.replace('mipolam-', ''));
    
    // Also try to find color swatches/buttons
    const colorSwatches = await page.$$eval('[class*="color"], [class*="swatch"], [data-color]', (elements) => {
      return elements
        .map(el => {
          const text = el.textContent?.trim();
          const title = el.getAttribute('title');
          const dataColor = el.getAttribute('data-color');
          const ariaLabel = el.getAttribute('aria-label');
          const href = el.closest('a')?.href;
          
          // Try to extract color code
          const codeMatch = (text || title || dataColor || ariaLabel || '').match(/(\d{4})\s*([A-Z\s]+)/i);
          
          return {
            text: text,
            title: title,
            dataColor: dataColor,
            ariaLabel: ariaLabel,
            href: href,
            colorCode: codeMatch ? codeMatch[1] : null,
            colorName: codeMatch ? codeMatch[2].trim() : null
          };
        })
        .filter(item => item.colorCode || item.text || item.title);
    });
    
    // Get all unique colors
    const uniqueColors = new Map();
    
    // Add colors from links
    colorLinks.forEach(link => {
      const key = `${link.colorCode}-${link.colorName}`;
      if (!uniqueColors.has(key)) {
        uniqueColors.set(key, {
          code: link.colorCode,
          name: link.colorName,
          sku: link.sku,
          href: link.href,
          collection: collection.slug
        });
      }
    });
    
    // Add colors from swatches (if not already added)
    colorSwatches.forEach(swatch => {
      if (swatch.colorCode) {
        const key = `${swatch.colorCode}-${swatch.colorName || ''}`;
        if (!uniqueColors.has(key) && swatch.href) {
          uniqueColors.set(key, {
            code: swatch.colorCode,
            name: swatch.colorName || '',
            href: swatch.href,
            collection: collection.slug
          });
        }
      }
    });
    
    const colors = Array.from(uniqueColors.values())
      .sort((a, b) => a.code.localeCompare(b.code));
    
    console.log(`Found ${colors.length} unique colors:`);
    colors.forEach((color, i) => {
      console.log(`  ${i + 1}. ${color.code} ${color.name} (SKU: ${color.sku || 'N/A'})`);
    });
    
    return {
      collection: collection.name,
      slug: collection.slug,
      url: collection.url,
      colors: colors,
      totalColors: colors.length
    };
    
  } catch (error) {
    console.error(`Error processing ${collection.name}:`, error.message);
    return {
      collection: collection.name,
      slug: collection.slug,
      url: collection.url,
      error: error.message,
      colors: [],
      totalColors: 0
    };
  } finally {
    await page.close();
  }
}

async function main() {
  console.log('Extracting detailed color information for all vinyl collections...\n');
  
  const browser = await chromium.launch({ headless: false });
  const results = [];
  
  try {
    for (const collection of collections) {
      const result = await extractColorsForCollection(browser, collection);
      results.push(result);
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  } finally {
    await browser.close();
  }
  
  // Save results to JSON
  const outputPath = path.join(__dirname, '..', 'tmp', 'vinyl-colors-detailed.json');
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  
  // Also create a flattened version for easier use
  const allColors = [];
  results.forEach(result => {
    if (result.colors && result.colors.length > 0) {
      result.colors.forEach(color => {
        allColors.push({
          ...color,
          collectionName: result.collection,
          collectionSlug: result.slug
        });
      });
    }
  });
  
  const flattenedPath = path.join(__dirname, '..', 'tmp', 'vinyl-colors-flattened.json');
  fs.writeFileSync(flattenedPath, JSON.stringify(allColors, null, 2));
  
  console.log(`\n${'='.repeat(60)}`);
  console.log('SUMMARY');
  console.log('='.repeat(60));
  let totalColors = 0;
  results.forEach(result => {
    console.log(`\n${result.collection}:`);
    if (result.error) {
      console.log(`  ❌ Error: ${result.error}`);
    } else {
      console.log(`  ✓ Found ${result.totalColors} colors`);
      totalColors += result.totalColors;
    }
  });
  
  console.log(`\n\nTotal colors across all collections: ${totalColors}`);
  console.log(`\nResults saved to:`);
  console.log(`  - ${outputPath}`);
  console.log(`  - ${flattenedPath}`);
}

main().catch(console.error);
