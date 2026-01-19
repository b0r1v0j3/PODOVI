const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function downloadCollectionImages() {
  console.log('🚀 Preuzimam lifestyle slike za sve vinil kolekcije...\n');

  const vinylData = JSON.parse(fs.readFileSync('public/data/vinyl_colors_complete.json', 'utf-8'));
  
  // Group by collection
  const collections = {};
  vinylData.colors.forEach(color => {
    if (!collections[color.collection]) {
      collections[color.collection] = {
        slug: color.collection,
        name: color.collection_name,
      };
    }
  });

  const browser = await chromium.launch({ headless: false, args: ['--start-maximized'] });
  const context = await browser.newContext({ 
    viewport: { width: 1920, height: 1080 },
    acceptDownloads: true 
  });
  const page = await context.newPage();

  const acceptCookies = async () => {
    const btn = page.locator('#onetrust-accept-btn-handler').first();
    if (await btn.count()) {
      await btn.click().catch(() => {});
      await page.waitForTimeout(500);
    }
  };

  let downloaded = 0;
  let collectionIndex = 0;

  for (const [collectionSlug, collection] of Object.entries(collections)) {
    collectionIndex++;
    process.stdout.write(`\n[${collectionIndex}/${Object.keys(collections).length}] ${collection.name}... `);

    const collectionUrl = `https://www.gerflor-cee.com/products/${collectionSlug}`;
    const outputPath = path.join('public', 'images', 'products', 'vinyl', collectionSlug, 'collection.jpg');

    try {
      await page.goto(collectionUrl, { waitUntil: 'networkidle', timeout: 60000 });
      await acceptCookies();
      await page.waitForTimeout(2000);

      // Find download button (ikonica)
      const downloadBtn = await page.locator('button[aria-label*="download" i], button[title*="download" i], [class*="download"] button').first();
      
      if (await downloadBtn.count() === 0) {
        process.stdout.write('✗ No download button');
        continue;
      }

      // Click download button
      await downloadBtn.scrollIntoViewIfNeeded();
      await downloadBtn.click();
      await page.waitForTimeout(1000);

      // Click .JPG button
      const jpgBtn = await page.locator('button:has-text(".JPG"), a:has-text(".JPG"), button:has-text("JPG")').first();
      
      if (await jpgBtn.count() === 0) {
        process.stdout.write('✗ No JPG button');
        continue;
      }

      const downloadPromise = page.waitForEvent('download', { timeout: 10000 });
      await jpgBtn.click();
      
      const download = await downloadPromise;
      if (download) {
        fs.mkdirSync(path.dirname(outputPath), { recursive: true });
        await download.saveAs(outputPath);
        downloaded++;
        process.stdout.write('✓');
      }

    } catch (error) {
      process.stdout.write(`✗ ${error.message.substring(0, 30)}`);
    }
  }

  await browser.close();

  console.log(`\n\n✅ ZAVRŠENO!`);
  console.log(`   Preuzeto: ${downloaded}/${Object.keys(collections).length} lifestyle slika`);
}

downloadCollectionImages().catch(console.error);
