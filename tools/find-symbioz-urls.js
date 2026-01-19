const { chromium } = require('playwright');

async function findSymbiozURLs() {
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

  // Try collection page
  const collectionUrl = 'https://www.gerflor-cee.com/products/mipolam-symbioz';
  console.log(`Checking collection page: ${collectionUrl}\n`);

  try {
    await page.goto(collectionUrl, { waitUntil: 'networkidle', timeout: 60000 });
    await acceptCookies();
    await page.waitForTimeout(3000);

    // Scroll to load lazy content
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(2000);

    // Try clicking "View all" if exists
    const viewAllBtn = page.locator('a:has-text("View all"), button:has-text("View all")').first();
    if (await viewAllBtn.count() > 0) {
      console.log('Clicking "View all"...');
      await viewAllBtn.click();
      await page.waitForTimeout(3000);
    }

    // Find all product links
    const colorLinks = await page.$$eval('a[href*="/products/"]', links => {
      return links
        .map(link => ({
          href: link.href,
          text: link.textContent?.trim().substring(0, 50)
        }))
        .filter(link => /\d{4}/.test(link.href))
        .slice(0, 10);
    });

    console.log(`\nFound ${colorLinks.length} color links (first 10):`);
    colorLinks.forEach((link, i) => {
      console.log(`${i + 1}. ${link.href}`);
      console.log(`   Text: "${link.text}"`);
    });

  } catch (error) {
    console.error(`Error: ${error.message}`);
  }

  await page.waitForTimeout(5000);
  await browser.close();
}

findSymbiozURLs().catch(console.error);
