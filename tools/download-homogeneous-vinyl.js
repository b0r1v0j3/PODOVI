const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const homogeneousCollections = [
  { name: 'Mipolam Accord', slug: 'mipolam-accord', url: 'https://www.gerflor-cee.com/products/mipolam-accord' },
  { name: 'Mipolam Affinity', slug: 'mipolam-affinity', url: 'https://www.gerflor-cee.com/products/mipolam-affinity' },
  { name: 'Mipolam Affinity 608x608', slug: 'mipolam-affinity-608x608', url: 'https://www.gerflor-cee.com/products/mipolam-affinity-608x608' },
  { name: 'Mipolam Astro', slug: 'mipolam-astro', url: 'https://www.gerflor-cee.com/products/mipolam-astro' },
  { name: 'Mipolam Bioplanet', slug: 'mipolam-bioplanet', url: 'https://www.gerflor-cee.com/products/mipolam-bioplanet' },
  { name: 'Mipolam Classic 15mm', slug: 'mipolam-classic-15mm', url: 'https://www.gerflor-cee.com/products/mipolam-classic-15mm' },
  { name: 'Mipolam Classic 2mm', slug: 'mipolam-classic-2mm', url: 'https://www.gerflor-cee.com/products/mipolam-classic-2mm' },
  { name: 'Mipolam Elegance', slug: 'mipolam-elegance', url: 'https://www.gerflor-cee.com/products/mipolam-elegance' },
  { name: 'Mipolam Planet', slug: 'mipolam-planet', url: 'https://www.gerflor-cee.com/products/mipolam-planet' },
  { name: 'Mipolam Symbioz', slug: 'mipolam-symbioz', url: 'https://www.gerflor-cee.com/products/mipolam-symbioz' },
  { name: 'Mipolam Troplan', slug: 'mipolam-troplan', url: 'https://www.gerflor-cee.com/products/mipolam-troplan' },
];

async function downloadHomogeneousVinyl() {
  console.log('🚀 Preuzimam slike za 11 homogenih vinil kolekcija...\n');

  const browser = await chromium.launch({ 
    headless: false, 
    args: ['--start-maximized']
  });
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

  const results = {
    collections: [],
    colors: []
  };

  for (let i = 0; i < homogeneousCollections.length; i++) {
    const collection = homogeneousCollections[i];
    console.log(`\n[${i + 1}/11] ${collection.name}`);
    console.log(`   URL: ${collection.url}`);

    try {
      await page.goto(collection.url, { waitUntil: 'networkidle', timeout: 60000 });
      await acceptCookies();
      await page.waitForTimeout(2000);

      // KORAK 1: Preuzmi sliku kolekcije (download → .JPG)
      const downloadBtn = page.locator('button[aria-label*="download" i], button[title*="download" i], [class*="download"] button').first();
      
      if (await downloadBtn.count() > 0 && await downloadBtn.isVisible().catch(() => false)) {
        await downloadBtn.scrollIntoViewIfNeeded();
        await downloadBtn.click();
        await page.waitForTimeout(1000);

        const jpgBtn = page.locator('button:has-text(".JPG"), a:has-text(".JPG"), button:has-text("JPG")').first();
        
        if (await jpgBtn.count() > 0 && await jpgBtn.isVisible().catch(() => false)) {
          const downloadPromise = page.waitForEvent('download', { timeout: 10000 });
          await jpgBtn.click();
          
          const download = await downloadPromise;
          if (download) {
            const outputDir = path.join('public', 'images', 'products', 'vinyl', collection.slug);
            fs.mkdirSync(outputDir, { recursive: true });
            const outputPath = path.join(outputDir, 'collection.jpg');
            await download.saveAs(outputPath);
            console.log(`   ✅ Collection image saved`);
          } else {
            console.log(`   ❌ Collection download failed`);
          }
        } else {
          console.log(`   ⚠️  No .JPG button found`);
        }
      } else {
        console.log(`   ⚠️  No download button found`);
      }

      // KORAK 2: Izvuci podatke o bojama
      await page.waitForTimeout(1000);
      
      // Scroll to colors section
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
      await page.waitForTimeout(1000);

      // Extract color data from page
      const colors = await page.$$eval('[class*="color"], [class*="swatch"]', (elements) => {
        return elements.slice(0, 100).map((el, i) => {
          const text = el.textContent?.trim() || '';
          const codeMatch = text.match(/\d{4}/);
          const code = codeMatch ? codeMatch[0] : null;
          return { code, text: text.substring(0, 50) };
        }).filter(c => c.code);
      }).catch(() => []);

      console.log(`   📊 Found ${colors.length} colors`);
      
      results.collections.push({
        name: collection.name,
        slug: collection.slug,
        colorsFound: colors.length,
        status: 'downloaded'
      });

    } catch (error) {
      console.log(`   ❌ Error: ${error.message.substring(0, 60)}`);
      results.collections.push({
        name: collection.name,
        slug: collection.slug,
        colorsFound: 0,
        status: 'error'
      });
    }
  }

  await browser.close();

  // Save results
  const resultsPath = path.join('tmp', 'homogeneous-vinyl-download-results.json');
  fs.mkdirSync('tmp', { recursive: true });
  fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));

  console.log(`\n\n✅ ZAVRŠENO!`);
  console.log(`   Collections processed: ${results.collections.length}`);
  console.log(`   Results saved to: ${resultsPath}`);
}

downloadHomogeneousVinyl().catch(console.error);
