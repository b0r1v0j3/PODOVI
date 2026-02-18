const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();

    const url = 'https://www.tarkett.rs/sr_RS/kategorija-rs_C01066-lvt-loose-lay'; // Example category
    console.log(`Navigating to ${url}...`);
    await page.goto(url, { waitUntil: 'domcontentloaded' });

    // Initial count
    let initialCount = await page.evaluate(() => document.querySelectorAll('.image-link-collection__image-container__link').length);
    console.log(`Initial collection count: ${initialCount}`);

    // Scroll to bottom to trigger lazy loading
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

    // Wait for potential new items
    await page.waitForTimeout(5000);

    // Final count
    let finalCount = await page.evaluate(() => document.querySelectorAll('.image-link-collection__image-container__link').length);
    console.log(`Final collection count after scroll: ${finalCount}`);

    // Check for "Load More" button
    const loadMoreVisible = await page.isVisible('.pagination__load-more-btn'); // Guessing selector, will need inspection
    console.log(`Load More button visible: ${loadMoreVisible}`);

    await browser.close();
})();
