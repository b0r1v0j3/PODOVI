const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function debugScraper() {
    console.log('🚀 Debugging Tarkett Scraper...');
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    const url = 'https://www.tarkett.rs/sr_RS/kolekcija-C000966-salsa-art';
    console.log(`\n📂 Visiting: ${url}`);

    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(5000); // Wait for potential JS loading

    const content = await page.content();

    const outputPath = path.join(__dirname, '../tmp/debug-tarkett.html');
    // Ensure tmp dir exists
    if (!fs.existsSync(path.dirname(outputPath))) {
        fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    }

    fs.writeFileSync(outputPath, content);
    console.log(`\n✅ Saved HTML to: ${outputPath}`);

    await browser.close();
}

debugScraper();
