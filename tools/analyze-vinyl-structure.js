const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function analyzeStructure() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  const results = {
    homogeneous: {
      url: 'https://www.gerflor-cee.com/category/homogeneous-rolls-and-tiles',
      structure: {},
      collections: [],
      sampleProducts: []
    },
    heterogeneous: {
      url: 'https://www.gerflor-cee.com/category/heterogeneous-rolls',
      structure: {},
      collections: [],
      sampleProducts: []
    }
  };

  // Helper function to accept cookies
  const acceptCookies = async () => {
    const selectors = [
      '#onetrust-accept-btn-handler',
      'button:has-text("Accept all")',
      'button:has-text("Accept")',
      'button:has-text("Prihvati")',
      'button:has-text("Prihvati sve")',
    ];

    for (const selector of selectors) {
      const btn = page.locator(selector).first();
      if (await btn.count()) {
        try {
          await btn.click({ timeout: 3000 });
          await page.waitForTimeout(500);
          return;
        } catch (error) {}
      }
    }
  };

  // Analyze each category
  for (const [type, config] of Object.entries(results)) {
    console.log(`\n=== Analyzing ${type.toUpperCase()} ===`);
    console.log(`URL: ${config.url}`);
    
    await page.goto(config.url, { waitUntil: 'networkidle', timeout: 60000 });
    await acceptCookies();
    await page.waitForTimeout(2000);

    // Get page title
    const title = await page.title();
    console.log(`Page Title: ${title}`);

    // Check for pagination
    const paginationSelectors = [
      'button:has-text("Show more")',
      'button:has-text("Load more")',
      'a:has-text("Next")',
      '[data-testid*="pagination"]',
      '.pagination',
      '.load-more'
    ];

    let hasPagination = false;
    let paginationType = null;
    for (const selector of paginationSelectors) {
      const element = page.locator(selector).first();
      if (await element.count() > 0) {
        hasPagination = true;
        paginationType = selector;
        console.log(`Found pagination: ${selector}`);
        break;
      }
    }

    // Count product cards/items
    const productSelectors = [
      'a[href*="/products/"]',
      '[data-product]',
      '.product-card',
      '.product-item',
      'article',
      '[class*="product"]'
    ];

    let productCount = 0;
    let productSelector = null;
    for (const selector of productSelectors) {
      const count = await page.locator(selector).count();
      if (count > 0) {
        productCount = count;
        productSelector = selector;
        console.log(`Found ${count} items with selector: ${selector}`);
        break;
      }
    }

    // Extract sample product data
    if (productSelector) {
      const products = page.locator(productSelector).first(5); // First 5 products
      const count = await products.count();
      
      for (let i = 0; i < Math.min(count, 3); i++) {
        const product = products.nth(i);
        
        // Get link
        const link = await product.getAttribute('href').catch(() => null) || 
                    await product.locator('a').first().getAttribute('href').catch(() => null);
        
        // Get text content
        const text = await product.textContent().catch(() => '');
        
        // Get images
        const image = await product.locator('img').first().getAttribute('src').catch(() => null);
        
        config.sampleProducts.push({
          link: link ? (link.startsWith('http') ? link : `https://www.gerflor-cee.com${link}`) : null,
          text: text?.substring(0, 200) || '',
          image: image ? (image.startsWith('http') ? image : `https://www.gerflor-cee.com${image}`) : null
        });
      }
    }

    // Check for collection grouping
    const collectionElements = await page.locator('[class*="collection"], [data-collection], h2, h3').count();
    console.log(`Found ${collectionElements} potential collection elements`);

    // Get all product links
    const allProductLinks = await page.$$eval('a[href*="/products/"]', (links) => {
      return links.map(link => {
        const href = link.getAttribute('href');
        return href ? (href.startsWith('http') ? href : `https://www.gerflor-cee.com${href}`) : null;
      }).filter(Boolean);
    });

    config.structure = {
      title,
      hasPagination,
      paginationType,
      productCount,
      productSelector,
      totalProductLinks: allProductLinks.length,
      sampleLinks: allProductLinks.slice(0, 10)
    };

    console.log(`Total product links found: ${allProductLinks.length}`);
  }

  // Save analysis
  const outputPath = path.join(__dirname, '../tmp/vinyl-structure-analysis.json');
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));

  console.log(`\n✅ Analysis saved to: ${outputPath}`);

  await browser.close();
  return results;
}

// Run analysis
analyzeStructure()
  .then((results) => {
    console.log('\n📊 ANALYSIS SUMMARY:');
    console.log('Homogeneous:', results.homogeneous.structure);
    console.log('Heterogeneous:', results.heterogeneous.structure);
  })
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
