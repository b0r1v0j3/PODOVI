const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    const url = 'https://www.tarkett.rs/sr_RS/kolekcija-C002790-essence';
    const outDir = path.join(__dirname, 'tarkett_html');

    if (!fs.existsSync(outDir)) {
        fs.mkdirSync(outDir, { recursive: true });
    }

    console.log(`Navigating to ${url}...`);
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

    // Dump HTML
    const html = await page.content();
    fs.writeFileSync(path.join(outDir, 'debug_collection_essence.html'), html);
    console.log('Saved HTML.');

    // Try to find the JSON URL in the HTML
    // It was mentioned to be in 'formats-url' attribute
    const formatsUrl = await page.evaluate(() => {
        const element = document.querySelector('[formats-url]');
        return element ? element.getAttribute('formats-url') : null;
    });

    console.log('Found formats-url:', formatsUrl);

    if (formatsUrl) {
        // Fix URL construction
        let jsonUrl = formatsUrl;
        if (jsonUrl.startsWith('//')) {
            jsonUrl = 'https:' + jsonUrl;
        } else if (!jsonUrl.startsWith('http')) {
            jsonUrl = 'https://www.tarkett.rs' + jsonUrl;
        }
        console.log(`Fetching JSON from ${jsonUrl}...`);

        // Fetch JSON
        const jsonData = await page.evaluate(async (u) => {
            const res = await fetch(u);
            if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
            return res.json();
        }, jsonUrl);

        fs.writeFileSync(path.join(outDir, 'debug_collection_data.json'), JSON.stringify(jsonData, null, 2));
        console.log('Saved JSON data.');
    }

    await browser.close();
})();
