const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    const url = 'https://www.tarkett.rs/sr_RS/kategorija-rs_C01079-lvt-glue-down';
    const outDir = path.join(__dirname, 'tarkett_html');

    if (!fs.existsSync(outDir)) {
        fs.mkdirSync(outDir, { recursive: true });
    }

    console.log(`Navigating to ${url}...`);
    // Increased timeout and changed waitUntil to domcontentloaded as per previous learnings
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

    // Wait a bit for Vue to render
    await page.waitForTimeout(5000);

    const html = await page.content();
    fs.writeFileSync(path.join(outDir, 'debug_category.html'), html);
    console.log(`Saved HTML to debug_category.html`);

    await browser.close();
})();
