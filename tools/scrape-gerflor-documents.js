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

    // Click "Show more" until no more items load
    const getDocCount = async () => {
      return page.$$eval('a[href]', (links) => {
        const exts = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.zip'];
        const urls = new Set();
        links.forEach((link) => {
          const href = link.getAttribute('href') || '';
          if (exts.some((ext) => href.toLowerCase().includes(ext))) {
            urls.add(href);
          }
        });
        return urls.size;
      });
    };

    let previousCount = await getDocCount();
    let safetyCounter = 0;
    while (true) {
      safetyCounter += 1;
      if (safetyCounter > 50) break;
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
      const currentCount = await getDocCount();
      if (currentCount <= previousCount) {
        break;
      }
      previousCount = currentCount;
    }

    // Collect PDF links and titles
    const docs = await page.$$eval('a[href]', (links) => {
      const exts = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.zip'];
      return links.map((link) => {
        const href = link.getAttribute('href') || '';
        if (!exts.some((ext) => href.toLowerCase().includes(ext))) {
          return null;
        }
        const url = link.href;
        const container = link.closest('li, .document, .views-row, .row, .item, .document__item');
        let title = link.getAttribute('aria-label') || link.getAttribute('title') || link.textContent || '';
        if (container && (!title || title.trim().length < 3)) {
          title = container.textContent || title;
        }
        title = title.replace(/\s+/g, ' ').trim();
        return { title, url };
      }).filter(Boolean);
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
