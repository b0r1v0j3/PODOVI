const { chromium } = require('playwright');

async function findAllLinks() {
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

  const testUrl = 'https://www.gerflor-cee.com/products/premium-compact';
  
  console.log(`Testing: ${testUrl}\n`);
  await page.goto(testUrl, { waitUntil: 'networkidle', timeout: 60000 });
  await acceptCookies();
  await page.waitForTimeout(3000);

  // Try clicking "View all"
  const viewAllBtn = page.locator('a:has-text("View all"), button:has-text("View all")').first();
  if (await viewAllBtn.count() > 0) {
    console.log('Clicking View all...');
    await viewAllBtn.click();
    await page.waitForTimeout(2000);
  }

  // Extract EVERY link on page
  const allLinks = await page.$$eval('a', (links) => {
    return links.map((link, i) => ({
      index: i,
      href: link.href,
      text: link.textContent?.trim().substring(0, 50),
      class: link.className
    })).filter(link => link.href && link.href.includes('/products/'));
  });

  console.log(`Found ${allLinks.length} product links:\n`);
  allLinks.forEach((link, i) => {
    if (i < 20) { // Show first 20
      console.log(`${i + 1}. ${link.href}`);
      console.log(`   Text: "${link.text}"`);
      console.log(`   Class: "${link.class}"`);
      console.log('');
    }
  });

  if (allLinks.length > 20) {
    console.log(`... and ${allLinks.length - 20} more`);
  }

  // Count color links (with 8+ digits at end)
  const colorLinks = allLinks.filter(link => /\d{8,}$/.test(link.href));
  console.log(`\n📊 Color links (ending with 8+ digits): ${colorLinks.length}`);

  await browser.close();
}

findAllLinks().catch(console.error);
