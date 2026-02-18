const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    });
    const page = await context.newPage();

    const url = 'https://www.tarkett.rs/sr_RS/kolekcija-C002790-essence';
    console.log(`Navigating to ${url}...`);

    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

    // Simulate scrolling "gore dole" (up and down)
    console.log('Scrolling...');
    await page.evaluate(async () => {
        await new Promise((resolve) => {
            let totalHeight = 0;
            const distance = 100;
            const timer = setInterval(() => {
                const scrollHeight = document.body.scrollHeight;
                window.scrollBy(0, distance);
                totalHeight += distance;

                if (totalHeight >= scrollHeight) {
                    clearInterval(timer);
                    resolve();
                }
            }, 100);
        });
    });

    await page.waitForTimeout(5000);

    // Dump HTML
    const html = await page.content();
    fs.writeFileSync('tools/debug_collection_scroll.html', html);
    console.log('Saved HTML.');

    // Try to find product links again
    const links = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('a'))
            .map(a => ({ href: a.href, text: a.innerText, class: a.className }))
            .filter(item => item.href.includes('dezen-'));
    });

    console.log(`Found ${links.length} product links.`);
    console.log(JSON.stringify(links, null, 2));

    await browser.close();
})();
