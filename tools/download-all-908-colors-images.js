const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function downloadAll908ColorsImages() {
  console.log('🚀 Preuzimam slike za SVE 908 boje (download → .JPG)...\n');

  const vinylData = JSON.parse(fs.readFileSync('public/data/vinyl_colors_complete.json', 'utf-8'));
  
  const browser = await chromium.launch({ 
    headless: false, 
    args: ['--start-maximized', '--disable-blink-features=AutomationControlled']
  });
  const context = await browser.newContext({ 
    viewport: { width: 1920, height: 1080 },
    acceptDownloads: true,
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  });
  const page = await context.newPage();
  page.setDefaultTimeout(60000);

  const acceptCookies = async () => {
    const btn = page.locator('#onetrust-accept-btn-handler').first();
    if (await btn.count()) {
      await btn.click().catch(() => {});
      await page.waitForTimeout(500);
    }
  };

  let downloaded = 0;
  let skipped = 0;
  let failed = 0;

  for (let i = 0; i < vinylData.colors.length; i++) {
    const color = vinylData.colors[i];
    const outputPath = color.image_url ? path.join('public', color.image_url) : null;

    if (!outputPath) {
      process.stdout.write(`\r[${i + 1}/908] ⚠  No path for ${color.code}`);
      failed++;
      continue;
    }

    // Skip if exists and is valid (> 10KB)
    if (fs.existsSync(outputPath)) {
      const stats = fs.statSync(outputPath);
      if (stats.size > 10000) {
        process.stdout.write(`\r[${i + 1}/908] ⏭  ${color.code} ${color.name.substring(0, 15)}`);
        skipped++;
        continue;
      }
    }

    process.stdout.write(`\r[${i + 1}/908] ⬇  ${color.code} ${color.name.substring(0, 15)}...`);

    try {
      // Build URL from color data
      const colorUrl = `https://www.gerflor-cee.com/products/${color.collection}-${color.code.toLowerCase()}-${color.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`;
      
      await page.goto(colorUrl, { waitUntil: 'networkidle', timeout: 60000 });
      await acceptCookies();
      await page.waitForTimeout(1500);

      // Find download button
      const downloadBtn = page.locator('button[aria-label*="download" i], button[title*="download" i], [class*="download"] button').first();
      
      if (await downloadBtn.count() === 0 || !await downloadBtn.isVisible().catch(() => false)) {
        process.stdout.write(' ✗ No btn');
        failed++;
        continue;
      }

      // Click download button
      await downloadBtn.scrollIntoViewIfNeeded();
      await downloadBtn.click();
      await page.waitForTimeout(1000);

      // Click .JPG button
      const jpgBtn = page.locator('button:has-text(".JPG"), a:has-text(".JPG"), button:has-text("JPG")').first();
      
      if (await jpgBtn.count() === 0 || !await jpgBtn.isVisible().catch(() => false)) {
        process.stdout.write(' ✗ No JPG');
        failed++;
        continue;
      }

      const downloadPromise = page.waitForEvent('download', { timeout: 10000 });
      await jpgBtn.click();
      
      const download = await downloadPromise;
      if (download) {
        fs.mkdirSync(path.dirname(outputPath), { recursive: true });
        await download.saveAs(outputPath);
        downloaded++;
        process.stdout.write(' ✓');
      } else {
        failed++;
      }

    } catch (error) {
      process.stdout.write(` ✗`);
      failed++;
    }

    // Progress report every 50 colors
    if ((i + 1) % 50 === 0) {
      console.log(`\n  Progress: ${i + 1}/908 | Downloaded: ${downloaded} | Skipped: ${skipped} | Failed: ${failed}`);
    }
  }

  await browser.close();

  console.log(`\n\n✅ ZAVRŠENO!`);
  console.log(`   Downloaded: ${downloaded}`);
  console.log(`   Skipped: ${skipped}`);
  console.log(`   Failed: ${failed}`);
  console.log(`   Total: ${downloaded + skipped}/908`);
}

downloadAll908ColorsImages().catch(console.error);
