const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const https = require('https');

async function downloadFile(url, filePath) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : require('http');
    const file = fs.createWriteStream(filePath);
    
    protocol.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        file.close();
        return downloadFile(response.headers.location, filePath).then(resolve).catch(reject);
      }
      
      if (response.statusCode !== 200) {
        file.close();
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        reject(new Error(`HTTP ${response.statusCode}`));
        return;
      }
      
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      file.close();
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      reject(err);
    });
  });
}

async function downloadAllVinylImages() {
  console.log('🚀 Preuzimam slike za SVE vinil kolekcije i boje...\n');

  const vinylData = JSON.parse(fs.readFileSync('public/data/vinyl_colors_complete.json', 'utf-8'));
  
  // Group by collection
  const collections = {};
  vinylData.colors.forEach(color => {
    if (!collections[color.collection]) {
      collections[color.collection] = {
        slug: color.collection,
        name: color.collection_name,
        type: color.type,
        colors: []
      };
    }
    collections[color.collection].colors.push(color);
  });

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

  let totalDownloaded = 0;
  let collectionIndex = 0;

  for (const [collectionSlug, collection] of Object.entries(collections)) {
    collectionIndex++;
    console.log(`\n[${collectionIndex}/${Object.keys(collections).length}] ${collection.name} (${collection.colors.length} boja)`);

    // 1. PREUZMI SLIKU KOLEKCIJE (prva boja kao collection image)
    const collectionUrl = `https://www.gerflor-cee.com/products/${collectionSlug}`;
    try {
      await page.goto(collectionUrl, { waitUntil: 'networkidle', timeout: 60000 });
      await acceptCookies();
      await page.waitForTimeout(2000);

      // Collection image - glavna slika kolekcije
      const collectionMainImage = await page.locator('img[src*="cdn.gerflor.com"]').first().getAttribute('src').catch(() => null);
      if (collectionMainImage) {
        const collectionImageDir = path.join('public', 'images', 'products', 'vinyl', collectionSlug);
        fs.mkdirSync(collectionImageDir, { recursive: true });
        const collectionImagePath = path.join(collectionImageDir, 'collection.jpg');
        
        if (!fs.existsSync(collectionImagePath)) {
          await downloadFile(collectionMainImage, collectionImagePath);
          console.log(`  ✓ Collection image downloaded`);
        } else {
          console.log(`  ⏭  Collection image exists`);
        }
      }
    } catch (error) {
      console.log(`  ✗ Collection image failed: ${error.message}`);
    }

    // 2. PREUZMI SLIKE BOJA
    let downloadedColors = 0;
    for (let i = 0; i < collection.colors.length; i++) {
      const color = collection.colors[i];
      const colorImagePath = color.image_url ? path.join('public', color.image_url) : null;
      
      // Skip if image exists
      if (colorImagePath && fs.existsSync(colorImagePath)) {
        process.stdout.write(`\r  Boje: ${i + 1}/${collection.colors.length} (⏭  ${color.code})`);
        continue;
      }

      process.stdout.write(`\r  Boje: ${i + 1}/${collection.colors.length} (⬇ ${color.code})`);

      try {
        const colorUrl = `https://www.gerflor-cee.com/products/${collectionSlug}-${color.code.toLowerCase()}-${color.name.toLowerCase().replace(/\s+/g, '-')}`;
        await page.goto(colorUrl, { waitUntil: 'networkidle', timeout: 60000 });
        await acceptCookies();
        await page.waitForTimeout(1000);

        const mainImage = await page.locator('img[src*="cdn.gerflor.com"]').first().getAttribute('src').catch(() => null);
        if (mainImage && colorImagePath) {
          const dir = path.dirname(colorImagePath);
          fs.mkdirSync(dir, { recursive: true });
          await downloadFile(mainImage, colorImagePath);
          downloadedColors++;
          totalDownloaded++;
        }
      } catch (error) {
        // Silent fail, continue to next
      }
    }
    console.log(`\r  Boje: ${collection.colors.length}/${collection.colors.length} ✓ (${downloadedColors} novih)`);
  }

  await browser.close();

  console.log(`\n✅ ZAVRŠENO!`);
  console.log(`   Ukupno preuzeto: ${totalDownloaded} slika`);
}

downloadAllVinylImages().catch(console.error);
