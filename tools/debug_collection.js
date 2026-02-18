const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const url = 'https://www.tarkett.rs/sr_RS/kolekcija-C002790-essence';
const outDir = path.join(__dirname, 'tarkett_html');

(async () => {
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();

    console.log(`Navigating to ${url}...`);
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

    // Wait a bit for dynamic content
    await page.waitForTimeout(5000);

    const html = await page.content();
    fs.writeFileSync(path.join(outDir, 'debug_collection.html'), html);
    console.log('Saved debug_collection.html');

    await browser.close();
})();
