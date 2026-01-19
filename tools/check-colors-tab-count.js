const { chromium } = require('playwright');

async function checkColorsTab() {
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

  for (const config of configs) {
    console.log(`\n=== ${config.type.toUpperCase()} ===`);
    await page.goto(config.url, { waitUntil: 'networkidle', timeout: 60000 });
    await acceptCookies();
    await page.waitForTimeout(2000);

    // Get text from Colors tab
    const colorsTabText = await page.locator('button:has-text("Colors"), a:has-text("Colors")').first().textContent().catch(() => null);
    console.log(`Colors tab text: "${colorsTabText}"`);

    // Click on Colors tab
    const colorsTab = page.locator('button:has-text("Colors"), a:has-text("Colors")').first();
    if (await colorsTab.count() > 0) {
      await colorsTab.click();
      await page.waitForTimeout(2000);
    }

    // Count initial colors
    let initialCount = await page.locator('a[href*="/products/"]').count();
    console.log(`Initial color count: ${initialCount}`);

    // Click "Show more" many times
    let clicks = 0;
    for (let i = 0; i < 100; i++) {
      const btn = page.locator('button:has-text("Show more")').first();
      if (await btn.count() === 0) {
        console.log(`Show more button not found after ${clicks} clicks`);
        break;
      }
      
      const isDisabled = await btn.getAttribute('disabled').catch(() => null);
      const isVisible = await btn.isVisible().catch(() => false);
      
      if (isDisabled !== null) {
        console.log(`Button disabled after ${clicks} clicks`);
        break;
      }
      
      if (!isVisible) {
        console.log(`Button not visible after ${clicks} clicks`);
        break;
      }
      
      try {
        await btn.click({ timeout: 5000 });
        await page.waitForTimeout(1500);
        clicks++;
        if (clicks % 10 === 0) console.log(`  Clicked ${clicks} times...`);
      } catch (error) {
        console.log(`Click failed after ${clicks} clicks`);
        break;
      }
    }

    // Count all unique color links
    const allColorLinks = await page.$$eval('a[href*="/products/"]', (links) => {
      const seen = new Set();
      return links.map(link => {
        const href = link.getAttribute('href');
        if (!href || !href.includes('/products/') || !/\d{8,}$/.test(href)) return null;
        return href.startsWith('http') ? href : `https://www.gerflor-cee.com${href}`;
      }).filter(Boolean).filter(url => !seen.has(url) && (seen.add(url), true));
    });

    console.log(`\nFinal count after ${clicks} clicks: ${allColorLinks.length} unique color links`);
  }

  await browser.close();
}

checkColorsTab().catch(console.error);
