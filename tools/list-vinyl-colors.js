const { chromium } = require('playwright');

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

async function listColorsForCollection(browser, collection) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Collection: ${collection.name}`);
  console.log(`URL: ${collection.url}`);
  console.log('='.repeat(60));

  const page = await browser.newPage();
  
  try {
    await page.goto(collection.url, { waitUntil: 'networkidle', timeout: 30000 });
    
    // Wait a bit for dynamic content
    await page.waitForTimeout(2000);
    
    // Try to find color selector/swatches - common patterns
    const colorSelectors = [
      '.color-selector',
      '.color-swatches',
      '.product-colors',
      '.color-options',
      '[class*="color"]',
      '[class*="swatch"]',
      '.product-variants',
      '[data-color]'
    ];
    
    let colors = [];
    
    // Method 1: Look for color swatches/buttons
    for (const selector of colorSelectors) {
      try {
        const elements = await page.$$(selector);
        if (elements.length > 0) {
          console.log(`Found ${elements.length} elements with selector: ${selector}`);
          for (const el of elements) {
            const text = await el.textContent();
            const title = await el.getAttribute('title');
            const dataColor = await el.getAttribute('data-color');
            const ariaLabel = await el.getAttribute('aria-label');
            const href = await el.getAttribute('href');
            
            if (text || title || dataColor || ariaLabel) {
              colors.push({
                text: text?.trim(),
                title: title?.trim(),
                dataColor: dataColor?.trim(),
                ariaLabel: ariaLabel?.trim(),
                href: href?.trim()
              });
            }
          }
        }
      } catch (e) {
        // Continue
      }
    }
    
    // Method 2: Look for links that might be colors
    const links = await page.$$eval('a', (links) => {
      return links
        .map(link => ({
          href: link.href,
          text: link.textContent?.trim(),
          title: link.title?.trim(),
          className: link.className
        }))
        .filter(link => 
          link.href.includes('mipolam') && 
          link.href !== window.location.href &&
          (link.text || link.title)
        );
    });
    
    if (links.length > 0) {
      console.log(`Found ${links.length} potential color links`);
      colors.push(...links.map(link => ({
        text: link.text,
        title: link.title,
        href: link.href,
        className: link.className
      })));
    }
    
    // Method 3: Look for any elements with color-related text
    const allText = await page.textContent('body');
    const colorMatches = allText.match(/\d{4}[\s-]\w+/gi);
    if (colorMatches) {
      console.log(`Found potential color codes: ${colorMatches.slice(0, 10).join(', ')}`);
    }
    
    // Method 4: Try to find product variant selectors
    const variantSelectors = await page.$$eval('select, [role="listbox"], [role="menu"]', (elements) => {
      return elements.map(el => ({
        tagName: el.tagName,
        options: Array.from(el.querySelectorAll('option, [role="option"]')).map(opt => ({
          text: opt.textContent?.trim(),
          value: opt.value?.trim()
        }))
      }));
    });
    
    if (variantSelectors.length > 0) {
      console.log(`Found ${variantSelectors.length} variant selectors`);
      variantSelectors.forEach(variant => {
        if (variant.options.length > 0) {
          console.log(`  Options: ${variant.options.map(o => o.text).join(', ')}`);
        }
      });
    }
    
    // Print page structure for debugging
    console.log('\nPage structure:');
    const bodyHTML = await page.innerHTML('body');
    const hasColorSelector = bodyHTML.includes('color') || bodyHTML.includes('swatch') || bodyHTML.includes('variant');
    console.log(`Contains color-related elements: ${hasColorSelector}`);
    
    // Try to find the actual color list - look for common patterns
    const pageContent = await page.content();
    
    // Look for JSON-LD or structured data
    const jsonLdMatches = pageContent.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>(.*?)<\/script>/gis);
    if (jsonLdMatches) {
      console.log(`Found ${jsonLdMatches.length} JSON-LD scripts`);
      jsonLdMatches.forEach((match, i) => {
        try {
          const json = JSON.parse(match.replace(/<script[^>]*>/, '').replace(/<\/script>/, ''));
          console.log(`JSON-LD ${i + 1}:`, JSON.stringify(json, null, 2).substring(0, 500));
        } catch (e) {
          // Not valid JSON
        }
      });
    }
    
    // Save screenshot for debugging
    await page.screenshot({ path: `tmp/vinyl-colors-${collection.slug}.png`, fullPage: true });
    console.log(`Screenshot saved: tmp/vinyl-colors-${collection.slug}.png`);
    
    return {
      collection: collection.name,
      slug: collection.slug,
      url: collection.url,
      colors: colors,
      variantSelectors: variantSelectors,
      colorMatches: colorMatches?.slice(0, 20) || []
    };
    
  } catch (error) {
    console.error(`Error processing ${collection.name}:`, error.message);
    return {
      collection: collection.name,
      slug: collection.slug,
      url: collection.url,
      error: error.message
    };
  } finally {
    await page.close();
  }
}

async function main() {
  console.log('Starting to list colors for all vinyl collections...\n');
  
  const browser = await chromium.launch({ headless: false });
  const results = [];
  
  try {
    for (const collection of collections) {
      const result = await listColorsForCollection(browser, collection);
      results.push(result);
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  } finally {
    await browser.close();
  }
  
  // Save results to JSON
  const fs = require('fs');
  const path = require('path');
  const outputPath = path.join(__dirname, '..', 'tmp', 'vinyl-colors-list.json');
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  
  console.log(`\n${'='.repeat(60)}`);
  console.log('SUMMARY');
  console.log('='.repeat(60));
  results.forEach(result => {
    console.log(`\n${result.collection}:`);
    if (result.error) {
      console.log(`  ❌ Error: ${result.error}`);
    } else {
      console.log(`  Colors found: ${result.colors.length}`);
      console.log(`  Variant selectors: ${result.variantSelectors.length}`);
      console.log(`  Color matches: ${result.colorMatches.length}`);
    }
  });
  
  console.log(`\n\nResults saved to: ${outputPath}`);
}

main().catch(console.error);
