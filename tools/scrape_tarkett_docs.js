const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const https = require('https');

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

function extractNuxtData(html) {
    const match = html.match(/window\.__NUXT__=\((function[\s\S]*?)\)(?:;|<\/script>)/);
    if (!match) return null;
    const scriptBody = match[1];
    const fullScript = `window.__NUXT__=(${scriptBody});`;
    const sandbox = { window: {}, document: {}, location: { href: '', search: '', hash: '' } };
    try {
        vm.createContext(sandbox);
        vm.runInContext(fullScript, sandbox);
        return sandbox.window.__NUXT__;
    } catch (e) {
        return null;
    }
}

async function scrapeDocuments() {
    console.log('Starting Document Scraper for Tarkett Parket...');
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ locale: 'sr-RS' });
    const page = await context.newPage();

    // We focus on the Parket category:
    const categoryUrl = 'https://www.tarkett.rs/sr_RS/kategorija-rs_C01012-parket';
    const documentsBySku = {};

    try {
        console.log(`Visiting ${categoryUrl}...`);
        await page.goto(categoryUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
        await page.waitForTimeout(2000);

        // Scroll to load lazy items
        await page.evaluate(async () => {
            await new Promise((resolve) => {
                let totalHeight = 0;
                const distance = 400;
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
        await page.waitForTimeout(2000);

        const collectionLinks = await page.evaluate(() => {
            const links = [];
            document.querySelectorAll('.image-link-collection__image-container__link').forEach(a => {
                let href = a.getAttribute('href');
                if (href) {
                    if (!href.startsWith('http')) href = 'https://www.tarkett.rs' + href;
                    if (!links.includes(href)) links.push(href);
                }
            });
            return links;
        });

        console.log(`Found ${collectionLinks.length} collections.`);

        for (const url of collectionLinks) {
            console.log(`Processing: ${url}`);
            try {
                await page.goto(url, { waitUntil: 'domcontentloaded' });
                await page.waitForTimeout(1000);
                const html = await page.content();
                const nuxtData = extractNuxtData(html);

                if (!nuxtData?.state?.collectionProductPage?.item?.designs) continue;

                const designs = nuxtData.state.collectionProductPage.item.designs;

                for (const design of designs) {
                    const dataUrl = design.productDataUrl;
                    if (!dataUrl) continue;

                    try {
                        const productJson = await fetchJson(dataUrl);
                        if (!productJson?.item) continue;

                        const item = productJson.item;
                        const sku = item.sku_id || item.product_sku || design.product_design_key;
                        const docs = [];

                        if (item.product_assets) {
                            item.product_assets.forEach(asset => {
                                if (asset.document_mime_type === 'application/pdf' && asset.document_asset_url) {
                                    docs.push({
                                        title: asset.document_title || asset.document_localized_title || 'Dokument',
                                        url: `https://media.tarkett-image.com/docs/${asset.document_asset_url}`,
                                        type: 'pdf'
                                    });
                                }
                            });
                        }

                        // Add collection level docs if product level is empty/missing
                        if (item.product_collection && item.product_collection.collection_assets) {
                            item.product_collection.collection_assets.forEach(asset => {
                                if (asset.document_mime_type === 'application/pdf' && asset.document_asset_url) {
                                    docs.push({
                                        title: asset.document_title || asset.document_localized_title || 'Dokument',
                                        url: `https://media.tarkett-image.com/docs/${asset.document_asset_url}`,
                                        type: 'pdf'
                                    });
                                }
                            });
                        }

                        // deduplicate docs by url
                        const uniqueDocs = [];
                        const urls = new Set();
                        for (const doc of docs) {
                            if (!urls.has(doc.url)) {
                                urls.add(doc.url);
                                uniqueDocs.push(doc);
                            }
                        }

                        if (sku && uniqueDocs.length > 0) {
                            documentsBySku[sku] = uniqueDocs;
                        }
                    } catch (err) {
                        console.error(`Error fetching JSON for ${sku}: ${err.message}`);
                    }
                }
            } catch (err) {
                console.error(`Error on collection ${url}: ${err.message}`);
            }
        }
    } catch (err) {
        console.error('Fatal scrape error:', err);
    }

    fs.writeFileSync(path.join(__dirname, 'tarkett_parket_docs.json'), JSON.stringify(documentsBySku, null, 2));
    console.log('Saved to tarkett_parket_docs.json');
    await browser.close();
}

scrapeDocuments();
