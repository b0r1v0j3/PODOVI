const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

async function downloadFile(url, filePath, maxRedirects = 5) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const file = fs.createWriteStream(filePath);
    
    protocol.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        file.close();
        const location = response.headers.location;
        if (!location) {
          reject(new Error(`Redirect missing Location header`));
          return;
        }
        if (maxRedirects <= 0) {
          reject(new Error(`Too many redirects`));
          return;
        }
        return downloadFile(location, filePath, maxRedirects - 1).then(resolve).catch(reject);
      }
      
      if (response.statusCode === 200) {
        response.pipe(file);
        file.on('finish', () => { file.close(); resolve(); });
        return;
      }
      
      file.close();
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      reject(new Error(`HTTP ${response.statusCode}`));
    }).on('error', (err) => {
      file.close();
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      reject(err);
    });
  });
}

async function downloadSymbiozImages() {
  console.log('🚀 Preuzimam slike za Mipolam Symbioz...\n');

  const vinylData = JSON.parse(fs.readFileSync('public/data/vinyl_colors_complete.json', 'utf-8'));
  const symbiozColors = vinylData.colors.filter(c => c.collection === 'mipolam-symbioz');

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

  let downloaded = 0;
  
  for (let i = 0; i < symbiozColors.length; i++) {
    const color = symbiozColors[i];
    const imagePath = color.image_url ? path.join('public', color.image_url) : null;
    
    if (imagePath && fs.existsSync(imagePath)) {
      process.stdout.write(`\r  [${i + 1}/${symbiozColors.length}] ⏭  ${color.code}`);
      continue;
    }

    process.stdout.write(`\r  [${i + 1}/${symbiozColors.length}] ⬇  ${color.code}`);

    try {
      const colorUrl = `https://www.gerflor-cee.com/products/mipolam-symbioz-${color.code.toLowerCase()}-${color.name.toLowerCase().replace(/\s+/g, '-')}`;
      await page.goto(colorUrl, { waitUntil: 'networkidle', timeout: 60000 });
      await acceptCookies();
      await page.waitForTimeout(1500);

      const mainImage = await page.locator('img[src*="cdn.gerflor.com"]').first().getAttribute('src').catch(() => null);
      if (mainImage && imagePath) {
        const dir = path.dirname(imagePath);
        fs.mkdirSync(dir, { recursive: true });
        await downloadFile(mainImage, imagePath);
        downloaded++;
      }
    } catch (error) {
      process.stdout.write(` ✗`);
    }
  }

  await browser.close();

  console.log(`\n\n✅ ZAVRŠENO!`);
  console.log(`   Preuzeto: ${downloaded}/${symbiozColors.length} slika`);
}

downloadSymbiozImages().catch(console.error);
