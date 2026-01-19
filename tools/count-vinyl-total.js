const { chromium } = require('playwright');

async function countTotal() {
  console.log('🔢 Counting total vinyl products on Gerflor...\n');

  const browser = await chromium.launch({ headless: false, args: ['--start-maximized'] });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();

  const acceptCookies = async () => {
    const btn = page.locator('#onetrust-accept-btn-handler').first();
    if (await btn.count()) {
      await btn.click().catch(() => {});
      await page.waitForTimeout(500);
    }
  };

  const configs = [
    { type: 'homogeneous', url: 'https://www.gerflor-cee.com/category/homogeneous-rolls-and-tiles' },
    { type: 'heterogeneous', url: 'https://www.gerflor-cee.com/category/heterogeneous-rolls' }
  ];

  const results = {};

  for (const config of configs) {
    console.log(`\n=== ${config.type.toUpperCase()} ===`);
    await page.goto(config.url, { waitUntil: 'networkidle', timeout: 60000 });
    await acceptCookies();
    await page.waitForTimeout(2000);

    // Click "Show more" until all collections are loaded
    let clicks = 0;
    while (clicks < 50) {
      const btn = page.locator('button:has-text("Show more")').first();
      if (await btn.count() === 0) break;
      
      const isVisible = await btn.isVisible().catch(() => false);
      const isDisabled = await btn.getAttribute('disabled').catch(() => null);
      
      if (isVisible && !isDisabled) {
        await btn.click();
        await page.waitForTimeout(1000);
        clicks++;
        console.log(`  Clicked "Show more" ${clicks} times`);
      } else {
        break;
      }
    }

    // Count collection links
    const collectionLinks = await page.$$eval('a[href*="/products/"]', (links) => {
      const seen = new Set();
      return links
        .map(link => {
          const href = link.getAttribute('href');
          if (!href || /\d{8,}$/.test(href)) return null;
          const fullUrl = href.startsWith('http') ? href : `https://www.gerflor-cee.com${href}`;
          return fullUrl;
        })
        .filter(Boolean)
        .filter(url => {
          if (seen.has(url)) return false;
          seen.add(url);
          return true;
        });
    });

    console.log(`  Found ${collectionLinks.length} collections`);

    // Count colors in each collection
    let totalColors = 0;
    const collectionCounts = [];

    for (let i = 0; i < collectionLinks.length; i++) {
      const collectionUrl = collectionLinks[i];
      const collectionSlug = collectionUrl.split('/products/')[1]?.split('?')[0] || '';
      
      process.stdout.write(`  [${i + 1}/${collectionLinks.length}] ${collectionSlug}... `);

      await page.goto(collectionUrl, { waitUntil: 'networkidle', timeout: 60000 });
      await acceptCookies();
      await page.waitForTimeout(1500);

      // Count color links
      const colorLinks = await page.$$eval('a[href*="/products/"]', (links) => {
        const seen = new Set();
        return links
          .map(link => {
            const href = link.getAttribute('href');
            const text = link.textContent?.trim() || '';
            if (!href || !href.includes('/products/')) return null;
            if (/\d{8,}$/.test(href) && text.toLowerCase().includes('view product')) {
              const fullUrl = href.startsWith('http') ? href : `https://www.gerflor-cee.com${href}`;
              return fullUrl;
            }
            return null;
          })
          .filter(Boolean)
          .filter(url => {
            if (seen.has(url)) return false;
            seen.add(url);
            return true;
          });
      });

      console.log(`${colorLinks.length} colors`);
      totalColors += colorLinks.length;
      
      collectionCounts.push({
        collection: collectionSlug,
        colorCount: colorLinks.length
      });
    }

    results[config.type] = {
      collections: collectionLinks.length,
      totalColors: totalColors,
      collectionCounts: collectionCounts
    };

    console.log(`\n  Total colors in ${config.type}: ${totalColors}`);
  }

  await browser.close();

  const grandTotal = results.homogeneous.totalColors + results.heterogeneous.totalColors;

  console.log(`\n📊 GRAND TOTAL:`);
  console.log(`  Homogeneous: ${results.homogeneous.totalColors}`);
  console.log(`  Heterogeneous: ${results.heterogeneous.totalColors}`);
  console.log(`  TOTAL: ${grandTotal}`);

  return results;
}

countTotal().catch(console.error);
