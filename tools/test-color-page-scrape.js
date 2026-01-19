const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function testColorPageScrape() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  // Test with one color from homogeneous and one from heterogeneous
  const testUrls = [
    {
      type: 'homogeneous',
      url: 'https://www.gerflor-cee.com/products/mipolam-accord-0301-louise-85860301',
      collection: 'mipolam-accord'
    },
    {
      type: 'heterogeneous',
      url: 'https://www.gerflor-cee.com/products/nerok-55-0476-noma-miel-28130476',
      collection: 'nerok-55'
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

  for (const test of testUrls) {
    console.log(`\n=== Testing ${test.type} color page ===`);
    console.log(`URL: ${test.url}`);

    await page.goto(test.url, { waitUntil: 'networkidle', timeout: 60000 });
    await acceptCookies();
    await page.waitForTimeout(2000);

    const colorData = {
      url: test.url,
      type: test.type,
      collection: test.collection,
      extracted: {}
    };

    // 1. Extract product name/title
    const productName = await page.locator('h1').first().textContent().catch(() => null);
    colorData.extracted.productName = productName?.trim() || null;
    console.log(`Product Name: ${colorData.extracted.productName}`);

    // 2. Extract images
    const images = await page.$$eval('img[src*="product"], img[alt*="product"], .product-image img, [class*="product-image"] img', (imgs) => {
      return imgs.map(img => ({
        src: img.getAttribute('src'),
        alt: img.getAttribute('alt'),
        dataSrc: img.getAttribute('data-src')
      })).filter(img => img.src && !img.src.includes('logo') && !img.src.includes('icon'));
    }).catch(() => []);

    // Try different image selectors
    const mainImage = await page.locator('[class*="main-image"], [class*="product-image"], .hero img, [class*="hero"] img').first().getAttribute('src').catch(() => null);
    const colorScan = images.find(img => img.src?.includes('scan') || img.alt?.toLowerCase().includes('scan'))?.src || mainImage;
    const textureImage = images.find(img => img.src?.includes('texture') || img.alt?.toLowerCase().includes('texture') || img.src?.includes('close'))?.src || null;

    colorData.extracted.images = {
      main: colorScan,
      texture: textureImage,
      all: images.slice(0, 5)
    };
    console.log(`Main Image: ${colorData.extracted.images.main?.substring(0, 80)}...`);

    // 3. Extract description
    const descriptionSelectors = [
      '[class*="description"]',
      '[class*="product-description"]',
      '.description',
      'section:has-text("Product"), section:has-text("Proizvod")'
    ];

    let description = null;
    for (const selector of descriptionSelectors) {
      const descEl = page.locator(selector).first();
      if (await descEl.count() > 0) {
        description = await descEl.textContent().catch(() => null);
        if (description && description.trim().length > 50) {
          break;
        }
      }
    }

    colorData.extracted.description = description?.trim().substring(0, 500) || null;
    console.log(`Description: ${colorData.extracted.description ? colorData.extracted.description.substring(0, 100) + '...' : 'Not found'}`);

    // 4. Extract specifications/characteristics
    const specsSelectors = [
      '[class*="characteristic"]',
      '[class*="specification"]',
      '[class*="spec"]',
      'dl, dt, dd',
      '[class*="technical"]'
    ];

    const characteristics = {};
    
    // Try to extract from tables or definition lists
    const specTables = await page.$$eval('table, dl', (elements) => {
      const data = {};
      elements.forEach(el => {
        if (el.tagName === 'TABLE') {
          const rows = el.querySelectorAll('tr');
          rows.forEach(row => {
            const cells = row.querySelectorAll('td, th');
            if (cells.length >= 2) {
              const key = cells[0].textContent?.trim();
              const value = cells[1].textContent?.trim();
              if (key && value) {
                data[key] = value;
              }
            }
          });
        } else if (el.tagName === 'DL') {
          const dts = el.querySelectorAll('dt');
          dts.forEach(dt => {
            const dd = dt.nextElementSibling;
            if (dd && dd.tagName === 'DD') {
              const key = dt.textContent?.trim();
              const value = dd.textContent?.trim();
              if (key && value) {
                data[key] = value;
              }
            }
          });
        }
      });
      return data;
    }).catch(() => {});

    if (specTables) {
      Object.assign(characteristics, specTables);
    }

    colorData.extracted.characteristics = characteristics;
    console.log(`Characteristics:`, Object.keys(characteristics).length, 'keys found');

    // 5. Extract code/name from URL or page
    const urlParts = test.url.split('/');
    const slug = urlParts[urlParts.length - 1];
    const codeMatch = slug.match(/(\d{4})/);
    const code = codeMatch ? codeMatch[1] : null;

    colorData.extracted.code = code;
    colorData.extracted.slug = slug;
    console.log(`Code: ${code}, Slug: ${slug}`);

    results[test.type] = colorData;
  }

  // Save test results
  const outputPath = path.join(__dirname, '../tmp/color-page-test.json');
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));

  console.log(`\n✅ Test results saved to: ${outputPath}`);

  await browser.close();
  return results;
}

testColorPageScrape()
  .then((results) => {
    console.log('\n📊 COLOR PAGE TEST SUMMARY:');
    console.log(JSON.stringify(results, null, 2));
  })
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
