const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'debug_collection_scroll.html');
const content = fs.readFileSync(filePath, 'utf8');

// Extract the script content
const match = content.match(/window\.__NUXT__=\((function[\s\S]*?)\)(?:;|<\/script>)/);

if (!match) {
    console.log("Could not find window.__NUXT__");
    process.exit(1);
}

const scriptBody = match[1];
const fullScript = `window.__NUXT__=(${scriptBody});`;

// Mock window
const window = {};
global.window = window;
global.document = {};
global.location = { href: '', search: '', hash: '' };

try {
    // Execute the script
    eval(fullScript);

    const nuxtData = window.__NUXT__;

    // Check for collection product page data
    if (nuxtData && nuxtData.state) {
        if (nuxtData.state.mediaBaseUri) {
            console.log("Media Base URI:", nuxtData.state.mediaBaseUri);
        }

        if (nuxtData.state.collectionProductPage) {
            console.log("Keys in collectionProductPage:", Object.keys(nuxtData.state.collectionProductPage));
            if (nuxtData.state.collectionProductPage.item) {
                console.log("Keys in item:", Object.keys(nuxtData.state.collectionProductPage.item));
                if (nuxtData.state.collectionProductPage.item.designs) {
                    const designs = nuxtData.state.collectionProductPage.item.designs;
                    console.log(`Found ${designs.length} designs in item.`);

                    const products = designs.map(d => ({
                        name: d.product_name,
                        sku: d.product_design_key,
                        url: d.productUrl,
                        dataUrl: d.productDataUrl,
                        collection: d.collection_name
                    }));

                    fs.writeFileSync(path.join(__dirname, 'extracted_products.json'), JSON.stringify(products, null, 2));
                    console.log("Saved products to extracted_products.json");
                } else {
                    console.log("'designs' not found in item either.");
                }
            } else {
                console.log("collectionProductPage found but 'item' property is missing.");
            }
        } else {
            console.log("Could not find collectionProductPage in NUXT data.");
            console.log("Keys in state:", Object.keys(nuxtData.state));
        }
    } else {
        console.log("No state found in NUXT data.");
    }
} catch (e) {
    console.error("Error evaluating script:", e);
}
