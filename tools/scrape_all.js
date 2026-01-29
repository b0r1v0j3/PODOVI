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

            const scriptStart = startIdx + startMarker.length - 'window.__NUXT__='.length;
            const scriptEnd = html.indexOf(endMarker, scriptStart);
            const scriptContent = html.substring(scriptStart + 8, scriptEnd);

            const sandbox = { window: {}, location: {} };
            vm.createContext(sandbox);
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
                shortDescription: d.product_design_key + ' - Visokokvalitetni Tarkett parket.', // Required
                description: d.product_description || 'Tarkett Parket.',
                images: d.product_thumbnail ? [{
                    id: d.product_design_key + '-img',
                    url: `https://media.tarkett-image.com/large/${d.product_thumbnail}`,
                    alt: d.product_name,
                    isPrimary: true,
                    order: 0
                }] : [],
                specs: [
                    { key: 'manufacturer', label: 'Proizvođač', value: 'Tarkett' },
                    { key: 'collection', label: 'Kolekcija', value: d.collection_name || 'Parket' }
                ],
                price: 0,
                priceUnit: 'm²',
                inStock: true,
                featured: false,
                createdAt: new Date(), // Will verify if this serialization works in TS file, likely needs ISO string
                updatedAt: new Date()
            }));

            allProducts = allProducts.concat(mapped);

        } catch (e) {
            console.error(`Error scraping ${url}:`, e.message);
        }
    }

    console.log(`Total extracted: ${allProducts.length} products.`);

    // Generate TS content with correct imports and types
    // Using simple Date string construction for TS file
    const dateStr = 'new Date()';

    // We need to print objects but with 'new Date()' unquoted.
    // simpler to just output valid JS code string.

    let productsArray = JSON.stringify(allProducts, null, 2);
    // Replace "createdAt": "2024-..." with "createdAt": new Date(...)
    // Actually, JSON.stringify dates as strings.
    // We need to post-process the string or build it manually?
    // Let's just Regex replace the date strings if possible, or simpler:
    // "createdAt": new Date() isn't valid JSON.
    // But we are writing a .ts file!
    // So we can do: "createdAt": new Date("2024..."),

    // Better yet, imports:
    const tsContent = `import { Product } from '@/types';

export const tarkettProducts: Product[] = ${productsArray.replace(/"createdAt": "(.*?)"/g, 'createdAt: new Date("$1")').replace(/"updatedAt": "(.*?)"/g, 'updatedAt: new Date("$1")')};
`;

    fs.writeFileSync(outputFile, tsContent);
    console.log(`Saved to ${outputFile}`);
}

scrape();
