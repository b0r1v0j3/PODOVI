const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');
const https = require('https');

const DEKING_URL = 'https://tis.rs/podne-obloge/deking/';
const OUTPUT_FILE = path.join(__dirname, '../public/data/tis_deking_products.json');

async function fetchHtml(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => resolve(data));
        }).on('error', (err) => reject(err));
    });
}

function normalizeTitle(title) {
    return title.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
}

async function scrapeDeking() {
    console.log(`Fetching ${DEKING_URL}...`);
    const html = await fetchHtml(DEKING_URL);
    const $ = cheerio.load(html);

    const productLinks = [];
    $('a[href^="https://tis.rs/proizvodi/"]').each((i, el) => {
        const href = $(el).attr('href');
        // filter out same links
        if (href && !productLinks.includes(href) && !href.includes('edgeloc') && !href.includes('concealoc')) {
            productLinks.push(href);
        }
    });

    console.log(`Found ${productLinks.length} product links.`);

    const products = [];
    let idCounter = 5000;

    for (const url of productLinks) {
        try {
            console.log(`Fetching detail for ${url}...`);
            const prodHtml = await fetchHtml(url);
            const $$ = cheerio.load(prodHtml);

            const title = normalizeTitle($$('h1').first().text());
            const description = normalizeTitle($$('.woocommerce-product-details__short-description').text() || $$('.summary p').text() || '');

            // Image extraction fix: look for a element inside .woocommerce-product-gallery__image a href, or the img src
            let imageUrl = $$('.woocommerce-product-gallery__image a').first().attr('href')
                || $$('.woocommerce-product-gallery__image img').first().attr('src')
                || $$('.wp-post-image').first().attr('src')
                || $$('meta[property="og:image"]').attr('content')
                || '';

            const specs = {};
            $$('table.shop_attributes tr').each((i, tr) => {
                const key = $$(tr).find('th').text().trim();
                const val = $$(tr).find('td').text().trim();
                if (key && val) {
                    specs[key] = val;
                }
            });

            // Some fallbacks if no specs table
            if (Object.keys(specs).length === 0) {
                const sku = $$('.sku').text().trim();
                if (sku) specs['Šifra artikla'] = sku;
            }

            // Fallback collection
            let collection = 'TimberTech';
            if (specs['Kolekcija']) collection = specs['Kolekcija'];

            if (title) {
                products.push({
                    id: (idCounter++).toString(),
                    name: title,
                    collection: collection,
                    url: url,
                    imageUrl: imageUrl,
                    brand: 'TimberTech',
                    brandId: '10',
                    categoryId: '5', // Deking
                    description: description,
                    specs: specs
                });
            }
        } catch (e) {
            console.log('Error fetching detail for', url, e.message);
        }
    }

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(products, null, 2));
    console.log(`Saved ${products.length} products to ${OUTPUT_FILE}`);
}

scrapeDeking().catch(console.error);
