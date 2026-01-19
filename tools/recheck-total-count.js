const { chromium } = require('playwright');

async function recheckTotal() {
  console.log('🔍 DETALJNO proveravam ukupan broj boja na Gerflor...\n');

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

  let grandTotal = 0;

  for (const config of configs) {
    console.log(`\n=== ${config.type.toUpperCase()} ===`);
    await page.goto(config.url, { waitUntil: 'networkidle', timeout: 60000 });
    await acceptCookies();
    await page.waitForTimeout(2000);

    // Click "Show more" MANY times to ensure all loaded
    let clicks = 0;
    let lastCount = 0;
    let noChangeCount = 0;

    while (clicks < 100) {
      const currentCount = await page.locator('a[href*="/products/"]').count();
      
      if (currentCount === lastCount) {
        noChangeCount++;
        if (noChangeCount >= 3) {
          console.log(`  No more products loading (stable at ${currentCount})`);
          break;
        }
      } else {
        noChangeCount = 0;
        lastCount = currentCount;
      }

      const btn = page.locator('button:has-text("Show more")').first();
      if (await btn.count() === 0) {
        console.log(`  "Show more" button disappeared`);
        break;
      }
      
      const isVisible = await btn.isVisible().catch(() => false);
      const isDisabled = await btn.getAttribute('disabled').catch(() => null);
      
      if (isVisible && !isDisabled) {
        await btn.scrollIntoViewIfNeeded();
        await btn.click();
        await page.waitForTimeout(1500);
        clicks++;
        if (clicks % 10 === 0) console.log(`  Clicked ${clicks} times, ${currentCount} links visible`);
      } else {
        console.log(`  Button not clickable anymore`);
        break;
      }
    }

    // Count unique collection links
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

    console.log(`  Total collections: ${collectionLinks.length}`);

    // Count colors in ALL collections
    let totalColors = 0;

    for (let i = 0; i < collectionLinks.length; i++) {
      const collectionUrl = collectionLinks[i];
      const collectionSlug = collectionUrl.split('/products/')[1]?.split('?')[0] || '';
      
      process.stdout.write(`  [${i + 1}/${collectionLinks.length}] ${collectionSlug}... `);

      try {
        await page.goto(collectionUrl, { waitUntil: 'networkidle', timeout: 60000 });
        await acceptCookies();
        await page.waitForTimeout(1500);

        // Count color links (unique)
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
      } catch (error) {
        console.log(`ERROR: ${error.message}`);
      }
    }

    console.log(`\n  TOTAL ${config.type}: ${totalColors} colors`);
    grandTotal += totalColors;
  }

  await browser.close();

  console.log(`\n📊 GRAND TOTAL: ${grandTotal} colors`);
  console.log(`   Expected: 900+`);
  console.log(`   Difference: ${grandTotal > 900 ? 'OK' : `Missing ${900 - grandTotal}`}`);

  return grandTotal;
}

recheckTotal().catch(console.error);
