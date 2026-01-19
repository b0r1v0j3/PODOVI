const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function learnAndTest() {
  // Set larger viewport to avoid small window issue
  const browser = await chromium.launch({ 
    headless: false,
    args: ['--start-maximized']
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();

  const results = {
    test: 'learning_phase',
    errors: [],
    successes: [],
    structure: {}
  };

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
          await page.waitForTimeout(1000);
          return true;
        } catch (error) {}
      }
    }
    return false;
  };

  // Test URLs
  const testConfigs = [
    {
      type: 'homogeneous',
      categoryUrl: 'https://www.gerflor-cee.com/category/homogeneous-rolls-and-tiles',
      testCollectionUrl: 'https://www.gerflor-cee.com/products/mipolam-accord',
      testColorUrl: 'https://www.gerflor-cee.com/products/mipolam-accord-0301-louise-85860301'
    },
    {
      type: 'heterogeneous',
      categoryUrl: 'https://www.gerflor-cee.com/category/heterogeneous-rolls',
      testCollectionUrl: 'https://www.gerflor-cee.com/products/nerok-55',
      testColorUrl: 'https://www.gerflor-cee.com/products/nerok-55-0476-noma-miel-28130476'
    }
  ];

  for (const config of testConfigs) {
    console.log(`\n=== LEARNING ${config.type.toUpperCase()} ===\n`);

    // STEP 1: Test category page
    console.log('1. Testing category page...');
    await page.goto(config.categoryUrl, { waitUntil: 'networkidle', timeout: 60000 });
    await acceptCookies();
    await page.waitForTimeout(2000);

    // Click "Show more" until no more
    let showMoreClicks = 0;
    while (showMoreClicks < 50) {
      const showMoreBtn = page.locator('button:has-text("Show more")').first();
      if (await showMoreBtn.count() === 0) break;
      
      const isVisible = await showMoreBtn.isVisible().catch(() => false);
      const isDisabled = await showMoreBtn.getAttribute('disabled').catch(() => null);
      
      if (isVisible && !isDisabled) {
        await showMoreBtn.scrollIntoViewIfNeeded();
        await showMoreBtn.click();
        await page.waitForTimeout(1500);
        showMoreClicks++;
        console.log(`   Clicked "Show more" ${showMoreClicks} times`);
      } else {
        break;
      }
    }

    // Extract all collection links
    const collectionLinks = await page.$$eval('a[href*="/products/"]', (links) => {
      const seen = new Set();
      return links
        .map(link => {
          const href = link.getAttribute('href');
          if (!href) return null;
          const fullUrl = href.startsWith('http') ? href : `https://www.gerflor-cee.com${href}`;
          // Filter out color links (they have numbers at the end)
          const isColorLink = /\d{8,}$/.test(href);
          if (isColorLink) return null;
          return fullUrl;
        })
        .filter(Boolean)
        .filter(url => {
          if (seen.has(url)) return false;
          seen.add(url);
          return true;
        });
    });

    console.log(`   Found ${collectionLinks.length} collection links`);

    // STEP 2: Test collection page (get all color links)
    console.log('\n2. Testing collection page...');
    await page.goto(config.testCollectionUrl, { waitUntil: 'networkidle', timeout: 60000 });
    await acceptCookies();
    await page.waitForTimeout(2000);

    // Extract all color links from collection page
    const colorLinks = await page.$$eval('a[href*="/products/"]', (links) => {
      const seen = new Set();
      return links
        .map(link => {
          const href = link.getAttribute('href');
          const text = link.textContent?.trim() || '';
          if (!href || !href.includes('/products/')) return null;
          const fullUrl = href.startsWith('http') ? href : `https://www.gerflor-cee.com${href}`;
          // Color links have format: collection-color-code-longnumber
          const isColorLink = /\d{8,}$/.test(href) && text.toLowerCase().includes('view product');
          if (!isColorLink) return null;
          return fullUrl;
        })
        .filter(Boolean)
        .filter(url => {
          if (seen.has(url)) return false;
          seen.add(url);
          return true;
        });
    });

    console.log(`   Found ${colorLinks.length} color links`);

    // STEP 3: Test color page (extract full data)
    console.log('\n3. Testing color page extraction...');
    await page.goto(config.testColorUrl, { waitUntil: 'networkidle', timeout: 60000 });
    await acceptCookies();
    await page.waitForTimeout(2000);

    const colorData = await extractColorData(page, config.type);

    results.structure[config.type] = {
      categoryUrl: config.categoryUrl,
      collectionCount: collectionLinks.length,
      sampleCollectionLinks: collectionLinks.slice(0, 3),
      colorLinksFromCollection: colorLinks.length,
      sampleColorLinks: colorLinks.slice(0, 3),
      extractedColorData: colorData
    };

    console.log(`   ✓ Extracted color data:`, {
      name: colorData.name,
      code: colorData.code,
      characteristicsCount: Object.keys(colorData.characteristics || {}).length
    });
  }

  // Save learning results
  const outputPath = path.join(__dirname, '../tmp/vinyl-learning-results.json');
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));

  console.log(`\n✅ Learning complete! Results saved to: ${outputPath}`);

  await browser.close();
  return results;
}

async function extractColorData(page, type) {
  // Extract product name (h1)
  const productName = await page.locator('h1').first().textContent().catch(() => null);
  const nameParts = productName?.trim().split(/\s+/) || [];
  const code = nameParts[0] || null;
  const name = nameParts.slice(1).join(' ') || null;

  // Extract slug from URL
  const url = page.url();
  const slugMatch = url.match(/\/products\/([^?]+)/);
  const slug = slugMatch ? slugMatch[1] : null;
  const collectionMatch = slug?.match(/^([^-]+-[^-]+)/);
  const collection = collectionMatch ? collectionMatch[1] : null;

  // Extract main image
  const mainImage = await page.locator('[class*="product-image"] img, .hero img, [class*="main-image"] img, img[src*="cdn.gerflor.com"]').first().getAttribute('src').catch(() => null);

  // Extract full description from tabs or sections
  let description = null;
  
  // Try to find description in tabs (if exists)
  const tabs = page.locator('[role="tab"], button[role="tab"]');
  const tabsCount = await tabs.count();
  
  for (let i = 0; i < tabsCount; i++) {
    const tab = tabs.nth(i);
    const tabText = await tab.textContent().catch(() => '');
    if (tabText.toLowerCase().includes('description') || tabText.toLowerCase().includes('opis') || tabText.toLowerCase().includes('product')) {
      await tab.click().catch(() => {});
      await page.waitForTimeout(1000);
      
      const descSection = page.locator('[class*="description"], [class*="product-description"], section:has-text("Product"), section:has-text("Proizvod")').first();
      if (await descSection.count() > 0) {
        description = await descSection.textContent().catch(() => null);
        if (description && description.trim().length > 100) {
          break;
        }
      }
    }
  }

  // If no description from tabs, try default location
  if (!description || description.trim().length < 100) {
    const descSelectors = [
      '[class*="description"]',
      '[class*="product-description"]',
      'section:has-text("Product"), section:has-text("Proizvod")',
      '[class*="content"]'
    ];
    
    for (const selector of descSelectors) {
      const descEl = page.locator(selector).first();
      if (await descEl.count() > 0) {
        description = await descEl.textContent().catch(() => null);
        if (description && description.trim().length > 100) {
          break;
        }
      }
    }
  }

  // Extract characteristics from tables/DL
  const characteristics = await page.$$eval('table, dl', (elements) => {
    const data = {};
    
    elements.forEach(el => {
      if (el.tagName === 'TABLE') {
        const rows = el.querySelectorAll('tr');
        rows.forEach(row => {
          const cells = row.querySelectorAll('td, th');
          if (cells.length >= 2) {
            const key = cells[0].textContent?.trim();
            const value = cells[1].textContent?.trim();
            if (key && value && !key.toLowerCase().includes('description')) {
              data[key] = value;
            }
          }
        });
      } else if (el.tagName === 'DL') {
        const items = el.querySelectorAll('dt, dd');
        for (let i = 0; i < items.length - 1; i += 2) {
          if (items[i].tagName === 'DT' && items[i + 1].tagName === 'DD') {
            const key = items[i].textContent?.trim();
            const value = items[i + 1].textContent?.trim();
            if (key && value) {
              data[key] = value;
            }
          }
        }
      }
    });
    
    return data;
  }).catch(() => ({}));

  // Extract dimension, format, thickness from characteristics
  const dimension = characteristics['Dimension'] || characteristics['Width of sheet'] && characteristics['Length of sheet'] 
    ? `${characteristics['Width of sheet']} X ${characteristics['Length of sheet']}`
    : null;
  const format = characteristics['Format details'] || characteristics['Format'] || null;
  const overallThickness = characteristics['Overall thickness'] || null;

  return {
    collection: collection || null,
    collection_name: collection ? collection.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : null,
    type: type,
    code: code || null,
    name: name || null,
    full_name: productName?.trim() || null,
    slug: slug || null,
    image_url: mainImage || null,
    texture_url: null,
    image_count: mainImage ? 1 : 0,
    dimension: dimension || null,
    format: format || null,
    overall_thickness: overallThickness || null,
    description: description?.trim() || null,
    characteristics: characteristics || {}
  };
}

// Run learning
learnAndTest()
  .then((results) => {
    console.log('\n📊 LEARNING SUMMARY:');
    console.log(`Collections found - Homogeneous: ${results.structure.homogeneous?.collectionCount || 0}`);
    console.log(`Collections found - Heterogeneous: ${results.structure.heterogeneous?.collectionCount || 0}`);
    console.log(`\nSample extracted color:`, JSON.stringify(results.structure.homogeneous?.extractedColorData, null, 2));
  })
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
