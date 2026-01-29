const fs = require('fs');
const https = require('https');
const vm = require('vm');

const targetFile = 'd:/PODOVI/SAJT/tmp/target_collections.txt';
const outputFile = 'd:/PODOVI/SAJT/lib/data/tarkett-products.ts';

async function fetchUrl(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data));
        }).on('error', reject);
    });
}

async function scrape() {
    const urls = fs.readFileSync(targetFile, 'utf8').trim().split('\n');
    let allProducts = [];

    console.log(`Scraping ${urls.length} collections...`);

    for (const url of urls) {
        if (!url.trim()) continue;
        console.log(`Fetch: ${url}`);
        try {
            const html = await fetchUrl(url.trim());

            // Extract Nuxt
            const startMarker = '<script>window.__NUXT__=';
            const endMarker = '</script>';
            const startIdx = html.indexOf(startMarker);
            if (startIdx === -1) {
                console.log(`No Nuxt data in ${url}`);
                continue;
            }

            const scriptStart = startIdx + startMarker.length - 'window.__NUXT__='.length; // keeping assignment
            const scriptEnd = html.indexOf(endMarker, scriptStart);
            const scriptContent = html.substring(scriptStart + 8, scriptEnd); // Removing <script>

            // Execute in sandbox
            const sandbox = { window: {}, location: {} };
            vm.createContext(sandbox); // Define global context
            vm.runInContext('window.__NUXT__=' + scriptContent.replace('window.__NUXT__=', '') + ';', sandbox);

            const data = sandbox.window.__NUXT__;
            if (!data || !data.state || !data.state.collectionProductPage) {
                console.log(`Invalid data structure in ${url}`);
                continue;
            }

            const designs = data.state.collectionProductPage.item.designs || [];
            console.log(`Found ${designs.length} products.`);

            const mapped = designs.map(d => ({
                id: d.product_design_key || d.product_name_slug,
                name: d.product_name,
                slug: d.product_name_slug,
                sku: d.product_design_key,
                categoryId: '3', // Parket
                brandId: '3', // Tarkett
                description: d.product_design_key,
                image: d.product_thumbnail ? `https://media.tarkett-image.com/large/${d.product_thumbnail}` : '',
                price: 0,
                stock: 0
            }));

            allProducts = allProducts.concat(mapped);

        } catch (e) {
            console.error(`Error scraping ${url}:`, e.message);
        }
    }

    console.log(`Total extracted: ${allProducts.length} products.`);

    // Generate TS content
    const tsContent = `import { Product } from './types';

export const tarkettProducts: Product[] = ${JSON.stringify(allProducts, null, 2)};
`;

    fs.writeFileSync(outputFile, tsContent);
    console.log(`Saved to ${outputFile}`);
}

scrape();
