const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
    // Launch chromium
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    });
    const page = await context.newPage();

    // Use a known product URL
    const productUrl = 'https://www.tarkett.rs/sr_RS/kolekcija-C002790-essence/dezen-260056010-ess30-scratched-cement-grey-33-3x66-6-0v';
    const outDir = path.join(__dirname, 'tarkett_html');

    if (!fs.existsSync(outDir)) {
        fs.mkdirSync(outDir, { recursive: true });
    }

    console.log('Navigating to Homepage first...');
    await page.goto('https://www.tarkett.rs/sr_RS', { waitUntil: 'domcontentloaded' });

    // Wait random time
    await page.waitForTimeout(3000 + Math.random() * 2000);

    console.log(`Navigating to ${productUrl}...`);
    await page.goto(productUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });

    // Wait for main image or gallery
    try {
        await page.waitForSelector('.product-gallery img, .slick-track img', { timeout: 10000 });
    } catch (e) { console.log('Image selector timed out'); }

    // Dump HTML
    const html = await page.content();
    fs.writeFileSync(path.join(outDir, 'debug_product_essence.html'), html);
    console.log('Saved HTML.');

    await page.screenshot({ path: path.join(outDir, 'debug_product_screenshot.png'), fullPage: true });
    console.log('Saved Screenshot.');

    // Log image sources found
    const images = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('img')).map(img => img.src);
    });
    console.log('Found images:', images);

    await browser.close();
})();
