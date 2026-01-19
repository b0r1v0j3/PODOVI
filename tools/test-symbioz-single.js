const { chromium } = require('playwright');

async function testSingleColor() {
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

  // Test first color: 6001 COTTON
  const testUrl = 'https://www.gerflor-cee.com/products/mipolam-symbioz-6001-cotton';
  console.log(`Testing URL: ${testUrl}\n`);

  try {
    await page.goto(testUrl, { waitUntil: 'networkidle', timeout: 60000 });
    await acceptCookies();
    await page.waitForTimeout(2000);

    // Try to find image
    const images = await page.$$eval('img[src*="cdn.gerflor.com"]', imgs => 
      imgs.map(img => ({ src: img.src, alt: img.alt }))
    );

    console.log(`Found ${images.length} CDN images:`);
    images.forEach((img, i) => {
      console.log(`  ${i + 1}. ${img.src}`);
      console.log(`     alt: ${img.alt}`);
    });

    // Also try any main product image
    const mainImage = await page.locator('.product-image img, .hero img, img').first().getAttribute('src').catch(() => null);
    console.log(`\nFirst image on page: ${mainImage}`);

  } catch (error) {
    console.error(`Error: ${error.message}`);
  }

  await page.waitForTimeout(5000);
  await browser.close();
}

testSingleColor().catch(console.error);
