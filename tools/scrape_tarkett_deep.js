const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const https = require('https');
const vm = require('vm');

// Helper to fetch JSON content
function fetchJson(url) {
    return new Promise((resolve, reject) => {
        if (url.startsWith('//')) url = 'https:' + url;

        https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(e);
                }
            });
        }).on('error', reject);
    });
}

// Helper to extract NUXT data
function extractNuxtData(html) {
    const match = html.match(/window\.__NUXT__=\((function[\s\S]*?)\)(?:;|<\/script>)/);
    if (!match) return null;

    const scriptBody = match[1];
    const fullScript = `window.__NUXT__=(${scriptBody});`;

    const sandbox = {
        window: {},
        document: {},
        location: { href: '', search: '', hash: '' }
    };

    try {
        vm.createContext(sandbox);
        vm.runInContext(fullScript, sandbox);
        return sandbox.window.__NUXT__;
    } catch (e) {
        console.error("Error evaluating NUXT script:", e);
        return null;
    }
}

function buildTarkettDocumentUrl(mediaBaseUri, assetPath) {
    if (!assetPath) return '';
    const raw = String(assetPath).trim();
    if (raw.startsWith('http://') || raw.startsWith('https://') || raw.startsWith('//')) {
        const normalized = raw.startsWith('//') ? `https:${raw}` : raw;
        return normalized
            .replace('://media.tarkett-image.com/large-high/', '://media.tarkett-image.com/docs/')
            .replace('://media.tarkett-image.com/large/', '://media.tarkett-image.com/docs/')
            .replace('://media.tarkett-image.com/medium/', '://media.tarkett-image.com/docs/');
    }

    const normalizedBase = String(mediaBaseUri || 'https://media.tarkett-image.com').replace(/\/+$/, '');
    return `${normalizedBase}/docs/${raw.replace(/^\/+/, '')}`;
}

// Configuration
const OUTPUT_DIR = path.join(__dirname, 'tarkett_data');
const IMAGES_DIR = path.join(OUTPUT_DIR, 'images');
const DOCS_DIR = path.join(OUTPUT_DIR, 'documents');

// Ensure directories exist
[OUTPUT_DIR, IMAGES_DIR, DOCS_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

const CATEGORY_URLS = [
    // 'https://www.tarkett.rs/sr_RS/kategorija-rs_C01014-vinil-za-kucu',
    'https://www.tarkett.rs/sr_RS/kategorija-rs_C01066-lvt-loose-lay',
    'https://www.tarkett.rs/sr_RS/kategorija-rs_C01081-lvt-click',
    'https://www.tarkett.rs/sr_RS/kategorija-rs_C01089-spc-click',
    'https://www.tarkett.rs/sr_RS/kategorija-rs_C01079-lvt-glue-down', // Added missing category
    // 'https://www.tarkett.rs/sr_RS/kategorija-rs_C01012-parket',
    // 'https://www.tarkett.rs/sr_RS/kategorija-rs_C01044-laminat'
];

async function scrape() {
    console.log('Starting Deep Scraper (Improved JSON Mode)...');

    // Launch browser with stealthier args
    const browser = await chromium.launch({
        headless: false,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-infobars',
            '--window-position=0,0',
            '--ignore-certifcate-errors',
            '--ignore-certifcate-errors-spki-list',
            '--disable-blink-features=AutomationControlled' // Key for detection evasion
        ]
    });

    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        viewport: { width: 1366, height: 768 },
        deviceScaleFactor: 1,
        isMobile: false,
        hasTouch: false,
        locale: 'sr-RS'
    });

    // Stealth: Remove webdriver property
    await context.addInitScript(() => {
        Object.defineProperty(navigator, 'webdriver', {
            get: () => undefined,
        });
    });

    const page = await context.newPage();

    let allProducts = [];

    // Navigate to homepage first to be polite
    try {
        console.log('Navigating to homepage...');
        await page.goto('https://www.tarkett.rs/sr_RS', { waitUntil: 'domcontentloaded', timeout: 30000 });
        await page.waitForTimeout(3000 + Math.random() * 2000);
    } catch (e) {
        console.log('Could not visit homepage first:', e.message);
    }

    // Write CSV header
    const csvHeader = "Name,SKU,URL,Description,Images,Specifications,Documents\n";
    fs.writeFileSync(path.join(OUTPUT_DIR, 'tarkett_products_deep.csv'), csvHeader);

    for (const categoryUrl of CATEGORY_URLS) {
        console.log(`\n=== Processing Category: ${categoryUrl} ===`);
        try {
            await page.goto(categoryUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
            await page.waitForTimeout(2000 + Math.random() * 3000); // Increased delay

            // Scroll to bottom to trigger lazy loading
            console.log('  Scrolling to load all items...');
            await page.evaluate(async () => {
                await new Promise((resolve) => {
                    let totalHeight = 0;
                    const distance = 300;
                    const timer = setInterval(() => {
                        const scrollHeight = document.body.scrollHeight;
                        window.scrollBy(0, distance);
                        totalHeight += distance;

                        if (totalHeight >= scrollHeight) {
                            clearInterval(timer);
                            resolve();
                        }
                    }, 200);
                });
            });
            await page.waitForTimeout(3000); // Wait for final load

            // 1. Get Collection Links (DOM scraping is reliable here)
            try {
                await page.waitForSelector('.image-link-collection__container-item', { timeout: 10000 });
            } catch (e) {
                console.log('Information: No collection items selector found immediately.');
            }

            const collectionLinks = await page.evaluate(() => {
                const links = [];
                // Selector for collection links
                document.querySelectorAll('.image-link-collection__image-container__link').forEach(a => {
                    let href = a.getAttribute('href');
                    if (href) {
                        if (!href.startsWith('http')) href = 'https://www.tarkett.rs' + href;
                        if (!links.includes(href)) links.push(href);
                    }
                });
                return links;
            });

            console.log(`Found ${collectionLinks.length} collections in category.`);

            for (const collectionUrl of collectionLinks) {
                console.log(`  -> Processing Collection: ${collectionUrl}`);
                try {
                    await page.goto(collectionUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
                    await page.waitForTimeout(2000 + Math.random() * 3000); // Increased delay

                    // Extract NUXT data for the COLLECTION
                    const html = await page.content();
                    const nuxtData = extractNuxtData(html);

                    // Validate data availability
                    if (!nuxtData || !nuxtData.state || !nuxtData.state.collectionProductPage) {
                        console.log(`     No NUXT data found (collectionProductPage) for ${collectionUrl}. Skipping.`);
                        continue;
                    }

                    const pageState = nuxtData.state.collectionProductPage;
                    if (!pageState.item || !pageState.item.designs) {
                        console.log(`     No product designs found in 'item' for ${collectionUrl}`);
                        continue;
                    }

                    const designs = pageState.item.designs;
                    console.log(`     Found ${designs.length} products in collection.`);

                    // Get base URI for images
                    const mediaBaseUri = nuxtData.state.mediaBaseUri || 'https://media.tarkett-image.com';

                    for (const design of designs) {
                        const productUrl = design.productUrl;
                        const dataUrl = design.productDataUrl;

                        // Prevent duplicates if resuming (optional check)
                        if (allProducts.some(p => p.url === productUrl)) continue;

                        if (!dataUrl) {
                            console.log(`     Skipping ${design.product_name} (no data URL)`);
                            continue;
                        }

                        // console.log(`     Fetching JSON for: ${design.product_name}`);

                        try {
                            const productJson = await fetchJson(dataUrl);
                            if (!productJson || !productJson.item) {
                                console.log(`     Invalid JSON response for ${design.product_name}`);
                                continue;
                            }

                            const item = productJson.item; // Detailed product item
                            const collection = item.product_collection || {};
                            const collectionDefaultSku = collection.collection_default_sku || {};
                            const specs = collectionDefaultSku.sku_technical_caracteristics || {};
                            const rawSpecs = collectionDefaultSku.sku_raw_technical_characteristics || {};

                            const categoryName = categoryUrl.split('kategorija-').pop() || 'Unknown';

                            // Improved Field Extraction
                            const name = item.name || item.product_name || design.product_name;
                            const sku = item.sku_id || item.product_sku || collectionDefaultSku.sku_id || design.product_design_key;

                            const stripHtml = (html) => html ? html.replace(/<[^>]*>?/gm, '') : '';

                            let rawDesc =
                                item.description ||
                                collection.description_stripped ||
                                collection.description ||
                                item.product_description ||
                                collectionDefaultSku.sku_pattern_description ||
                                '';

                            const description = stripHtml(rawDesc).replace(/[\n\r]+/g, ' ').trim();

                            // Construct final product object
                            const productData = {
                                name: name,
                                sku: sku,
                                url: productUrl,
                                description: description,
                                category: categoryName,
                                collection: collection.collection_name || 'Unknown',
                                brand_id: 'tarkett',
                                images: [],
                                specifications: {},
                                documents: []
                            };

                            // Improved Image Extraction
                            // Check multiple locations for hero/thumbnail
                            const potentialImages = [
                                item.sku_hero,
                                item.product_thumbnail,
                                item.thumbnail_image,
                                collectionDefaultSku.sku_hero,
                                collectionDefaultSku.thumbnail_image,
                                collectionDefaultSku.sku_thumbnail
                            ];

                            potentialImages.forEach(img => {
                                if (img && typeof img === 'string') {
                                    const imgUrl = `${mediaBaseUri}/large/${img}`;
                                    if (!productData.images.includes(imgUrl)) {
                                        productData.images.push(imgUrl);
                                    }
                                }
                            });

                            // Collection Gallery
                            if (collection.collection_assets) {
                                collection.collection_assets.forEach(asset => {
                                    // Include GALLERY and COVER roles
                                    if ((asset.document_role === 'GALLERY' || asset.document_role === 'COVER') && asset.document_asset_url) {
                                        const imgUrl = `${mediaBaseUri}/large/${asset.document_asset_url}`;
                                        if (!productData.images.includes(imgUrl)) {
                                            productData.images.push(imgUrl);
                                        }
                                    } else if (asset.document_mime_type === 'pdf' && asset.document_asset_url) {
                                        productData.documents.push(buildTarkettDocumentUrl(mediaBaseUri, asset.document_asset_url));
                                    }
                                });
                            }

                            // Process Specifications
                            const productSpecs = item.sku_technical_caracteristics || {};
                            const mergedSpecs = { ...specs, ...productSpecs };

                            for (const [key, value] of Object.entries(mergedSpecs)) {
                                productData.specifications[key] = value;
                            }

                            // Add generic technical characteristics
                            // Check both item.sku_raw... and collectionDefaultSku.sku_raw...
                            const rawSpecsList = [item.sku_raw_technical_characteristics, rawSpecs];

                            rawSpecsList.forEach(rSpec => {
                                if (rSpec) {
                                    for (const [key, value] of Object.entries(rSpec)) {
                                        if (!productData.specifications[key] && typeof value === 'string') {
                                            productData.specifications[key] = value;
                                        }
                                    }
                                }
                            });

                            allProducts.push(productData);

                            const csvLine = [
                                productData.name,
                                productData.sku,
                                productData.url,
                                productData.description.substring(0, 3000),
                                productData.images.join(';'),
                                JSON.stringify(productData.specifications),
                                productData.documents.join(';')
                            ].map(field => `"${String(field || '').replace(/"/g, '""')}"`).join(',');

                            fs.appendFileSync(path.join(OUTPUT_DIR, 'tarkett_products_deep.csv'), csvLine + '\n');
                            process.stdout.write('.'); // Simple progress indicator

                        } catch (err) {
                            console.error(`     Failed to process product ${design.product_name}:`, err.message);
                        }

                        await new Promise(r => setTimeout(r, 400 + Math.random() * 400)); // Increased random delay
                    }
                } catch (e) {
                    console.error(`  Error processing collection ${collectionUrl}:`, e);
                }
            }

        } catch (e) {
            console.error(`Error processing category ${categoryUrl}:`, e);
        }
    }

    // Final JSON save
    fs.writeFileSync(path.join(OUTPUT_DIR, 'tarkett_products_deep.json'), JSON.stringify(allProducts, null, 2));

    await browser.close();
    console.log(`\nScraping complete! Processed ${allProducts.length} products.`);
}

scrape();
