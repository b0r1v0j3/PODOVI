const fs = require('fs');
const path = require('path');
const https = require('https');

// Load products
const productsPath = path.join(__dirname, '../public/data/tarkett_lvt_products.json');
console.log('Reading products from:', productsPath);
const rawContent = fs.readFileSync(productsPath, 'utf8');

// Extract unique collections and their IDs using Regex (since JSON.parse is behaving identically)
const collections = new Map();

// Regex to find collection and collections-b2b in the same object context is tricky.
// But we know the file structure is consistent.
// We can use a global regex to find matches.
// Pattern: "collection": "SLUG" ... "collections-b2b": "ID"
// This assumes "collection" appears before "collections-b2b".
// Let's rely on the fact that they are within the same block.

// Alternative: Iterate through all "collections-b2b": "ID" and find the "collection": "SLUG" near it?
// Or just extract all IDs and try to construct URLs?

// Let's try to match pairs.
// Look for blocks.
const objectRegex = /\{[^{}]*"collection"\s*:\s*"([^"]+)"[^{}]*"collections-b2b"\s*:\s*"([^"]+)"/g;
// Note: [^{}]* might fail if description has braces (unlikely in this context or rare).
// Better: "collection":\s*"([^"]+)".*?"collections-b2b":\s*"([^"]+)"
// Use dotAll (s flag) to match newlines.
const regex = /"collection"\s*:\s*"([^"]+)"[\s\S]*?"collections-b2b"\s*:\s*"([^"]+)"/g;

let match;
while ((match = regex.exec(rawContent)) !== null) {
    const slug = match[1];
    const id = match[2];
    if (slug && id && !collections.has(slug)) {
        collections.set(slug, id);
    }
}
console.log(`Found ${collections.size} unique collections via Regex.`);

console.log(`Found ${collections.size} unique collections.`);

const { chromium } = require('playwright');

(async () => {
    // ... regex extraction logic is fine ...

    const browser = await chromium.launch();
    const page = await browser.newPage();
    const results = {};
    const total = collections.size;
    let count = 0;

    for (const [slug, id] of collections) {
        count++;
        // Construct detailed URL using ID and slug
        // Format: https://www.tarkett.rs/sr_RS/kolekcija-C000115-id-inspiration-loose-lay
        const url = `https://www.tarkett.rs/sr_RS/kolekcija-${id}-${slug}`;

        console.log(`[${count}/${total}] Scraping ${slug} (${id})...`);

        try {
            await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

            // Wait for some content to load just in case
            await page.waitForTimeout(5000); // 5s wait for hydration

            if (slug === 'id-square-loose-lay') {
                await page.screenshot({ path: path.join(__dirname, 'debug_screenshot.png'), fullPage: true });
                console.log('Saved debug_screenshot.png');
            }

            // Extract features using page evaluation
            const features = await page.evaluate(() => {
                // Find potential feature lists
                const uls = Array.from(document.querySelectorAll('ul'));
                const keywords = ['ftalat', 'phthalate', 'voc', 'garancija', 'warranty', 'topclean', 'protec', 'made in', 'proizveden', 'recikla', 'recycle', 'restart', 'circular', 'cirkular', 'klasa', 'class', 'otporan', 'resist', 'tektanium', 'desso', 'loose-lay', 'klik', 'click', 'glue', 'lepljen'];

                let bestList = null;
                let maxScore = 0;

                for (const ul of uls) {
                    // Skip navigation lists (heuristic)
                    if (ul.closest('nav') || ul.closest('header') || ul.closest('footer') || ul.classList.contains('menu') || ul.classList.contains('anchors__list')) continue;

                    const lis = Array.from(ul.querySelectorAll('li'));
                    if (lis.length < 2) continue; // Ignore tiny lists

                    let score = 0;
                    let textContent = '';

                    for (const li of lis) {
                        const text = li.innerText.toLowerCase();
                        textContent += text + ' ';

                        // Check keywords
                        for (const kw of keywords) {
                            if (text.includes(kw)) {
                                score++;
                                // Don't count same keyword multiple times per LI? 
                                // Actually fine to count.
                            }
                        }
                    }

                    // Bonus for NOT being part of a dropdown
                    if (ul.classList.contains('dropdown-menu')) score -= 10;

                    if (score > maxScore) {
                        maxScore = score;
                        bestList = ul;
                    }
                }

                if (bestList && maxScore > 0) {
                    return Array.from(bestList.querySelectorAll('li')).map(li => li.innerText.trim()).filter(t => t.length > 0);
                }

                return [];
            });

            if (features.length > 0) {
                console.log(`  Found ${features.length} features.`);
                results[slug] = {
                    title: 'Ključne karakteristike',
                    items: features
                };
            } else {
                console.log('  No features found.');
                // Maybe dump text to see what was there?
                // const text = await page.innerText('body');
                // console.log('  Body text preview:', text.substring(0, 200));
            }

        } catch (err) {
            console.error(`  Error scraping ${slug}:`, err.message);
        }
    }

    await browser.close();

    // Save results
    const outPath = path.join(__dirname, '../public/data/tarkett_collection_details.json');
    fs.writeFileSync(outPath, JSON.stringify(results, null, 2));
    console.log(`Saved details for ${Object.keys(results).length} collections to ${outPath}`);
})();
