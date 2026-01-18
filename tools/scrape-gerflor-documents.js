const fs = require('fs');
const path = require('path');

async function run() {
  const { chromium } = require('playwright');

  const targets = [
    { category: 'lvt', url: 'https://www.gerflor-cee.com/category/lvt-tiles-planks' },
    { category: 'carpet', url: 'https://www.gerflor-cee.com/category/carpet?page=0%2C%2C%2C0%2C1' },
    { category: 'linoleum', url: 'https://www.gerflor-cee.com/category/linoleum' },
  ];

  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  const allDocuments = [];

  for (const target of targets) {
    await page.goto(target.url, { waitUntil: 'domcontentloaded' });

    // Accept cookies if prompt appears
    const cookieButton = page.locator('button:has-text("Accept"), button:has-text("I agree"), button:has-text("OK")').first();
    if (await cookieButton.count()) {
      try {
        await cookieButton.click({ timeout: 3000 });
      } catch (error) {
        // ignore
      }
    }

    // Open Documents tab
    const documentsTab = page.locator('button:has-text("Documents"), a:has-text("Documents"), [role="tab"]:has-text("Documents")').first();
    if (await documentsTab.count()) {
      await documentsTab.click();
    }

    // Click "Show more" until it disappears
    while (true) {
      const showMore = page.locator('button:has-text("Show more"), a:has-text("Show more")');
      const count = await showMore.count();
      if (!count) break;

      let clicked = false;
      for (let i = 0; i < count; i += 1) {
        const button = showMore.nth(i);
        if (await button.isVisible()) {
          const isDisabled = await button.getAttribute('disabled');
          if (isDisabled !== null) {
            continue;
          }
          const handle = await button.elementHandle();
          if (handle) {
            await page.evaluate((el) => {
              el.scrollIntoView({ block: 'center', behavior: 'instant' });
            }, handle);
            await page.evaluate((el) => el.click(), handle);
            clicked = true;
            break;
          }
        }
      }
      if (!clicked) break;
      await page.waitForTimeout(1000);
    }

    // Collect PDF links and titles
    const docs = await page.$$eval('a[href*=".pdf"]', (links) => {
      return links.map((link) => {
        const url = link.href;
        let title = link.getAttribute('aria-label') || link.getAttribute('title') || link.textContent || '';
        title = title.replace(/\s+/g, ' ').trim();
        return { title, url };
      });
    });

    const unique = new Map();
    docs.forEach((doc) => {
      if (!doc.url) {
        return;
      }
      if (!unique.has(doc.url)) {
        unique.set(doc.url, { ...doc, category: target.category });
      }
    });

    allDocuments.push(...unique.values());
  }

  await browser.close();

  const outPath = path.join(process.cwd(), 'public', 'data', 'gerflor_documents_raw.json');
  fs.writeFileSync(outPath, JSON.stringify(allDocuments, null, 2));
  console.log(`Saved ${allDocuments.length} documents to ${outPath}`);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
