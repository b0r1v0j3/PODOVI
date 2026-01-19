const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function checkMissing() {
  const browser = await chromium.launch({ headless: false, args: ['--start-maximized'] });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();

  const existingData = JSON.parse(fs.readFileSync('public/data/vinyl_colors_complete.json', 'utf-8'));
  const existingSlugs = new Set(existingData.colors.map(c => c.slug));

  const acceptCookies = async () => {
    const selectors = ['#onetrust-accept-btn-handler', 'button:has-text("Accept")', 'button:has-text("Prihvati")'];
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

  const configs = [
    { type: 'homogeneous', url: 'https://www.gerflor-cee.com/category/homogeneous-rolls-and-tiles' },
    { type: 'heterogeneous', url: 'https://www.gerflor-cee.com/category/heterogeneous-rolls' }
  ];

  const missing = [];

  for (const config of configs) {
    console.log(`\n=== Checking ${config.type} ===`);
    await page.goto(config.url, { waitUntil: 'networkidle', timeout: 60000 });
    await acceptCookies();
    await page.waitForTimeout(2000);

    // Click "Show more" until done
    let clicks = 0;
    while (clicks < 50) {
      const btn = page.locator('button:has-text("Show more")').first();
      if (await btn.count() === 0) break;
      const isVisible = await btn.isVisible().catch(() => false);
      const isDisabled = await btn.getAttribute('disabled').catch(() => null);
      if (isVisible && !isDisabled) {
        await btn.scrollIntoViewIfNeeded();
        await btn.click();
        await page.waitForTimeout(1500);
        clicks++;
      } else {
        break;
      }
    }

    // Get all collection links
    const collectionLinks = await page.$$eval('a[href*="/products/"]', (links) => {
      const seen = new Set();
      return links
        .map(link => {
          const href = link.getAttribute('href');
          if (!href) return null;
          const fullUrl = href.startsWith('http') ? href : `https://www.gerflor-cee.com${href}`;
          if (/\d{8,}$/.test(href)) return null;
          return fullUrl;
        })
        .filter(Boolean)
        .filter(url => {
          if (seen.has(url)) return false;
          seen.add(url);
          return true;
        });
    });

    console.log(`Found ${collectionLinks.length} collections`);

    // Check each collection
    for (const collectionUrl of collectionLinks) {
      const collectionSlug = collectionUrl.split('/products/')[1]?.split('?')[0] || '';
      await page.goto(collectionUrl, { waitUntil: 'networkidle', timeout: 60000 });
      await acceptCookies();
      await page.waitForTimeout(2000);

      const colorLinks = await page.$$eval('a[href*="/products/"]', (links) => {
        const seen = new Set();
        return links
          .map(link => {
            const href = link.getAttribute('href');
            const text = link.textContent?.trim() || '';
            if (!href || !href.includes('/products/')) return null;
            const fullUrl = href.startsWith('http') ? href : `https://www.gerflor-cee.com${href}`;
            if (/\d{8,}$/.test(href) && text.toLowerCase().includes('view product')) {
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

      // Check which colors are missing
      const missingFromCollection = [];
      for (const colorUrl of colorLinks) {
        const slugMatch = colorUrl.match(/\/products\/([^?]+)/);
        const fullSlug = slugMatch ? slugMatch[1] : null;
        const slug = fullSlug?.replace(/-\d{8,}$/, '') || null;
        
        if (slug && !existingSlugs.has(slug)) {
          missingFromCollection.push({ url: colorUrl, slug });
        }
      }

      if (missingFromCollection.length > 0) {
        console.log(`  ${collectionSlug}: ${colorLinks.length} total, ${missingFromCollection.length} missing`);
        missing.push({
          collection: collectionSlug,
          type: config.type,
          total: colorLinks.length,
          missing: missingFromCollection.length,
          missingUrls: missingFromCollection
        });
      }
    }
  }

  await browser.close();

  console.log(`\n=== SUMMARY ===`);
  console.log(`Total missing: ${missing.reduce((sum, m) => sum + m.missing, 0)}`);
  console.log(`Collections with missing colors: ${missing.length}`);

  fs.writeFileSync('tmp/missing-vinyl-colors.json', JSON.stringify(missing, null, 2));
  console.log(`\nSaved to tmp/missing-vinyl-colors.json`);

  return missing;
}

checkMissing().catch(console.error);
