const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');
const https = require('https');

const DEKING_URL = 'https://tis.rs/podne-obloge/deking/';
const JSON_FILE = path.join(__dirname, '../public/data/tis_deking_products.json');
const IMAGE_DIR = path.join(__dirname, '../public/images/deking');
const DOC_DIR = path.join(__dirname, '../public/documents/deking');

if (!fs.existsSync(IMAGE_DIR)) fs.mkdirSync(IMAGE_DIR, { recursive: true });
if (!fs.existsSync(DOC_DIR)) fs.mkdirSync(DOC_DIR, { recursive: true });

async function fetchHtml(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => resolve(data));
        }).on('error', (err) => reject(err));
    });
}

async function downloadFile(url, filepath) {
    if (fs.existsSync(filepath)) return;
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            if (res.statusCode === 301 || res.statusCode === 302) {
                return downloadFile(res.headers.location, filepath).then(resolve).catch(reject);
            }
            if (res.statusCode !== 200) {
                return reject(new Error(`Failed to download ${url}: ${res.statusCode}`));
            }
            const writer = fs.createWriteStream(filepath);
            res.pipe(writer);
            writer.on('finish', resolve);
            writer.on('error', reject);
        }).on('error', reject);
    });
}

function normalizeTitle(title) {
    return title.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
}

async function start() {
    console.log(`Fetching product list from ${DEKING_URL}...`);
    const html = await fetchHtml(DEKING_URL);
    const $list = cheerio.load(html);

    const productLinks = [];
    $list('a[href^="https://tis.rs/proizvodi/"]').each((i, el) => {
        const href = $list(el).attr('href');
        // filter out same links
        if (href && !productLinks.includes(href) && !href.includes('edgeloc') && !href.includes('concealoc')) {
            productLinks.push(href);
        }
    });

    console.log(`Found ${productLinks.length} product links to scrape.`);

    const products = [];
    let idCounter = 5000;

    for (const url of productLinks) {
        console.log(`Processing ${url}...`);
        try {
            const prodHtml = await fetchHtml(url);
            const $ = cheerio.load(prodHtml);

            const title = normalizeTitle($('h1').first().text());
            const description = normalizeTitle($('.woocommerce-product-details__short-description').text() || $('.summary p').text() || '');

            const specs = {};
            $('table.shop_attributes tr').each((i, tr) => {
                const key = $(tr).find('th').text().trim();
                const val = $(tr).find('td').text().trim();
                if (key && val) {
                    specs[key] = val;
                }
            });

            if (Object.keys(specs).length === 0) {
                const sku = $('.sku').text().trim();
                if (sku) specs['Šifra artikla'] = sku;
            }

            let collection = 'TimberTech';
            if (specs['Kolekcija']) collection = specs['Kolekcija'];

            const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

            // Process Images
            const imagesUrls = [];
            $('.woocommerce-product-gallery__image a').each((i, el) => {
                const href = $(el).attr('href');
                if (href && !imagesUrls.includes(href)) imagesUrls.push(href);
            });
            // Fallbacks for main image
            if (imagesUrls.length === 0) {
                const mainImg = $('.woocommerce-product-gallery__image img').first().attr('src')
                    || $('.wp-post-image').first().attr('src')
                    || $('meta[property="og:image"]').attr('content');
                if (mainImg) imagesUrls.push(mainImg);
            }

            const localImages = [];
            let imgOrder = 0;
            for (const imgUrl of imagesUrls) {
                imgOrder++;
                let cleanUrl = imgUrl.split('?')[0];
                const ext = path.extname(cleanUrl) || '.jpg';
                const filename = `${slug}-${imgOrder}${ext}`;
                const filepath = path.join(IMAGE_DIR, filename);
                console.log(`Downloading image: ${filename}`);
                await downloadFile(cleanUrl, filepath).catch(e => console.error(e.message));

                localImages.push({
                    url: `/images/deking/${filename}`,
                    alt: title,
                    isPrimary: imgOrder === 1,
                    order: imgOrder
                });
            }

            // Process Documents
            const docsUrls = [];
            $('a[href$=".pdf"]').each((i, el) => {
                const href = $(el).attr('href');
                const docTitle = $(el).text().trim() || 'Dokument';
                if (href && !docsUrls.some(d => d.url === href)) {
                    docsUrls.push({ url: href, title: docTitle });
                }
            });

            const localDocs = [];
            let docOrder = 0;
            for (const doc of docsUrls) {
                docOrder++;
                const filename = `${slug}-doc-${docOrder}.pdf`;
                const filepath = path.join(DOC_DIR, filename);
                console.log(`Downloading doc: ${filename}`);
                // Try to download PDF but catch errors if it fails or requires another domain
                await downloadFile(doc.url, filepath).catch(e => console.error(e.message));

                localDocs.push({
                    url: `/documents/deking/${filename}`,
                    title: doc.title
                });
            }

            if (title) {
                const newProduct = {
                    id: (idCounter++).toString(),
                    name: title,
                    collection: collection,
                    url: url,
                    brand: 'TimberTech',
                    brandId: '10',
                    categoryId: '5',
                    description: description,
                    specs: specs,
                    images: localImages
                };
                if (localDocs.length > 0) newProduct.documents = localDocs;
                products.push(newProduct);
            }

        } catch (e) {
            console.error(`Error processing ${url}:`, e.message);
        }
    }

    fs.writeFileSync(JSON_FILE, JSON.stringify(products, null, 2));
    console.log(`Re-scraped and downloaded assets for ${products.length} products to ${JSON_FILE}`);
}

start().catch(console.error);
