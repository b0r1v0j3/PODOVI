const { chromium } = require('playwright');
const fs = require('fs');

async function checkCollections() {
  console.log('🔍 Proveravam status svih kolekcija...\n');

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

  const existingData = JSON.parse(fs.readFileSync('public/data/vinyl_colors_complete.json', 'utf-8'));
  
  // Group existing colors by collection
  const existingByCollection = {};
  existingData.colors.forEach(color => {
    if (!existingByCollection[color.collection]) {
      existingByCollection[color.collection] = [];
    }
    existingByCollection[color.collection].push(color);
  });

  const configs = [
    { type: 'homogeneous', url: 'https://www.gerflor-cee.com/category/homogeneous-rolls-and-tiles' },
    { type: 'heterogeneous', url: 'https://www.gerflor-cee.com/category/heterogeneous-rolls' }
  ];

  const report = {
    complete: [],
    incomplete: [],
    missing: []
  };

  for (const config of configs) {
    console.log(`\n=== ${config.type.toUpperCase()} ===`);
    await page.goto(config.url, { waitUntil: 'networkidle', timeout: 60000 });
    await acceptCookies();
    await page.waitForTimeout(2000);

    // Click "Show more"
    for (let i = 0; i < 50; i++) {
      const btn = page.locator('button:has-text("Show more")').first();
      if (await btn.count() === 0) break;
      const isVisible = await btn.isVisible().catch(() => false);
      const isDisabled = await btn.getAttribute('disabled').catch(() => null);
      if (isVisible && !isDisabled) {
        await btn.click();
        await page.waitForTimeout(1000);
      } else break;
    }

    const collectionLinks = await page.$$eval('a[href*="/products/"]', (links) => {
      const seen = new Set();
      return links.map(link => {
        const href = link.getAttribute('href');
        if (!href || /\d{8,}$/.test(href)) return null;
        return href.startsWith('http') ? href : `https://www.gerflor-cee.com${href}`;
      }).filter(Boolean).filter(url => !seen.has(url) && (seen.add(url), true));
    });

    console.log(`Found ${collectionLinks.length} collections\n`);

    for (let i = 0; i < collectionLinks.length; i++) {
      const collectionUrl = collectionLinks[i];
      const collectionSlug = collectionUrl.split('/products/')[1]?.split('?')[0] || '';
      
      process.stdout.write(`[${i + 1}/${collectionLinks.length}] ${collectionSlug}... `);

      await page.goto(collectionUrl, { waitUntil: 'networkidle', timeout: 60000 });
      await acceptCookies();
      await page.waitForTimeout(1500);

      const colorLinks = await page.$$eval('a[href*="/products/"]', (links) => {
        const seen = new Set();
        return links.map(link => {
          const href = link.getAttribute('href');
          const text = link.textContent?.trim() || '';
          if (!href || !text.toLowerCase().includes('view product') || !/\d{8,}$/.test(href)) return null;
          return href.startsWith('http') ? href : `https://www.gerflor-cee.com${href}`;
        }).filter(Boolean).filter(url => !seen.has(url) && (seen.add(url), true));
      });

      const totalOnSite = colorLinks.length;
      const existingColors = existingByCollection[collectionSlug] || [];
      const existingCount = existingColors.length;

      const status = {
        collection: collectionSlug,
        type: config.type,
        totalOnSite: totalOnSite,
        existing: existingCount,
        missing: totalOnSite - existingCount,
        percentage: totalOnSite > 0 ? Math.round(existingCount / totalOnSite * 100) : 0
      };

      if (existingCount === 0) {
        report.missing.push(status);
        console.log(`❌ NEDOSTAJE (0/${totalOnSite})`);
      } else if (existingCount < totalOnSite) {
        report.incomplete.push(status);
        console.log(`⚠️  NEPOTPUNA (${existingCount}/${totalOnSite} = ${status.percentage}%)`);
      } else {
        report.complete.push(status);
        console.log(`✅ KOMPLETNA (${existingCount}/${totalOnSite})`);
      }
    }
  }

  await browser.close();

  // Print summary
  console.log('\n\n📊 REZIME:\n');
  
  if (report.complete.length > 0) {
    console.log(`✅ KOMPLETNE (${report.complete.length}):`);
    report.complete.forEach(c => {
      console.log(`   ${c.collection}: ${c.existing}/${c.totalOnSite}`);
    });
  }

  if (report.incomplete.length > 0) {
    console.log(`\n⚠️  NEPOTPUNE (${report.incomplete.length}):`);
    report.incomplete.forEach(c => {
      console.log(`   ${c.collection}: ${c.existing}/${c.totalOnSite} (nedostaje ${c.missing})`);
    });
  }

  if (report.missing.length > 0) {
    console.log(`\n❌ NEDOSTAJU (${report.missing.length}):`);
    report.missing.forEach(c => {
      console.log(`   ${c.collection}: 0/${c.totalOnSite}`);
    });
  }

  const totalOnSite = [...report.complete, ...report.incomplete, ...report.missing].reduce((sum, c) => sum + c.totalOnSite, 0);
  const totalExisting = [...report.complete, ...report.incomplete, ...report.missing].reduce((sum, c) => sum + c.existing, 0);
  const totalMissing = totalOnSite - totalExisting;

  console.log(`\n🎯 UKUPNO:`);
  console.log(`   Na sajtu: ${totalOnSite}`);
  console.log(`   Ekstraktovano: ${totalExisting}`);
  console.log(`   Nedostaje: ${totalMissing}`);

  // Save report
  fs.writeFileSync('tmp/vinyl-collections-report.json', JSON.stringify(report, null, 2));
  console.log(`\n📄 Report sačuvan u: tmp/vinyl-collections-report.json`);

  return report;
}

checkCollections().catch(console.error);
