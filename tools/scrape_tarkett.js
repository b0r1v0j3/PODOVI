const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const urls = [
    { name: 'lvt_glue_down', url: 'https://www.tarkett.rs/sr_RS/kategorija-rs_C01079-lvt-glue-down' },
    { name: 'lvt_loose_lay', url: 'https://www.tarkett.rs/sr_RS/kategorija-rs_C01066-lvt-loose-lay' },
    { name: 'lvt_click', url: 'https://www.tarkett.rs/sr_RS/kategorija-rs_C01081-lvt-click' },
    { name: 'spc_click', url: 'https://www.tarkett.rs/sr_RS/kategorija-rs_C01089-spc-click' }
];

(async () => {
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();

    // Create output directory
    const outDir = path.join(__dirname, 'tarkett_html');
    if (!fs.existsSync(outDir)) {
        fs.mkdirSync(outDir);
    }

    for (const item of urls) {
        console.log(`Navigating to ${item.name}...`);
        await page.goto(item.url, { waitUntil: 'domcontentloaded', timeout: 60000 });

        // Auto-scroll to load lazy images/items if any
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

        // Wait a bit after scroll
        await page.waitForTimeout(2000);

        const html = await page.content();
        fs.writeFileSync(path.join(outDir, `${item.name}.html`), html);
        console.log(`Saved ${item.name}.html`);
    }

    await browser.close();
    console.log('Done! HTML files are in "tools/tarkett_html" folder.');
})();
