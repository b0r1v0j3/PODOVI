const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function analyzeProduct() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  // Test with one product from each category
  const testProducts = [
    {
      type: 'homogeneous',
      url: 'https://www.gerflor-cee.com/products/mipolam-accord'
    },
    {
      type: 'heterogeneous',
      url: 'https://www.gerflor-cee.com/products/nerok-55'
    }
  ];

  const results = {};

  const acceptCookies = async () => {
    const selectors = ['#onetrust-accept-btn-handler', 'button:has-text("Accept")', 'button:has-text("Prihvati")'];
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

  for (const test of testProducts) {
    console.log(`\n=== Analyzing ${test.type} product ===`);
    console.log(`URL: ${test.url}`);

    await page.goto(test.url, { waitUntil: 'networkidle', timeout: 60000 });
    await acceptCookies();
    await page.waitForTimeout(2000);

    // Get product title
    const title = await page.title();
    console.log(`Title: ${title}`);

    // Get product name
    const productName = await page.locator('h1').first().textContent().catch(() => null);
    console.log(`Product Name: ${productName}`);

    // Check for color selector/swatches
    const colorSelectors = [
      '[class*="color"]',
      '[class*="swatch"]',
      '[data-color]',
      'button[aria-label*="color"]',
      '.color-option',
      '.color-swatch'
    ];

    let colorCount = 0;
    let colorSelector = null;
    for (const selector of colorSelectors) {
      const count = await page.locator(selector).count();
      if (count > 0) {
        colorCount = count;
        colorSelector = selector;
        console.log(`Found ${count} color elements with selector: ${selector}`);
        break;
      }
    }

    // Try to find color links or buttons
    const colorLinks = await page.$$eval('a[href*="color"], button[data-color], [class*="color"]', (elements) => {
      return elements.map(el => ({
        text: el.textContent?.trim(),
        href: el.getAttribute('href'),
        dataColor: el.getAttribute('data-color'),
        className: el.className
      })).slice(0, 5);
    }).catch(() => []);

    // Check for tabs (Collections / Colors)
    const tabButtons = await page.$$eval('button[role="tab"], [role="tab"]', (tabs) => {
      return tabs.map(tab => ({
        text: tab.textContent?.trim(),
        ariaSelected: tab.getAttribute('aria-selected')
      }));
    }).catch(() => []);

    // Check page structure
    const pageStructure = {
      title,
      productName,
      colorCount,
      colorSelector,
      colorLinks: colorLinks.slice(0, 10),
      tabs: tabButtons
    };

    // Check if there's a "Colors" or "Variants" section
    const hasColorsSection = await page.locator('text=Colors, text=Boje, text=Variants, [class*="variants"]').count() > 0;

    // Try to find all color/product links on the page
    const allProductLinks = await page.$$eval('a[href*="/products/"]', (links) => {
      return links.map(link => {
        const href = link.getAttribute('href');
        const text = link.textContent?.trim();
        return {
          href: href ? (href.startsWith('http') ? href : `https://www.gerflor-cee.com${href}`) : null,
          text: text?.substring(0, 100)
        };
      }).filter(item => item.href);
    });

    pageStructure.allProductLinks = allProductLinks.length;
    pageStructure.sampleLinks = allProductLinks.slice(0, 5);

    results[test.type] = pageStructure;

    console.log(`Found ${allProductLinks.length} product links on page`);
    console.log(`Has Colors Section: ${hasColorsSection}`);
  }

  // Save results
  const outputPath = path.join(__dirname, '../tmp/product-structure-analysis.json');
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));

  console.log(`\n✅ Analysis saved to: ${outputPath}`);

  await browser.close();
  return results;
}

analyzeProduct()
  .then((results) => {
    console.log('\n📊 PRODUCT STRUCTURE:');
    console.log(JSON.stringify(results, null, 2));
  })
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
