const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function scrapeTarkettProducts() {
    console.log('🚀 Starting Tarkett Parquet Scraper...');
    const browser = await chromium.launch({ headless: true }); // Visible for debugging
    const page = await browser.newPage();

    // 1. Get all Collection Links
    const mainUrl = 'https://www.tarkett.rs/sr_RS/kategorija-rs_C01012-parket';
    console.log(`\n📂 Visiting main category: ${mainUrl}`);

    await page.goto(mainUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });

    // Accept cookies if present
    try {
        const cookieBtn = await page.locator('#onetrust-accept-btn-handler').first();
        if (await cookieBtn.isVisible()) {
            await cookieBtn.click();
            console.log('🍪 Cookies accepted');
        }
    } catch (e) { }

    // Find all collection blocks
    // Based on standard Tarkett structure, collections are usually in grid items
    // We'll look for links that look like collection links
    const collectionLinks = await page.$$eval('a[href*="/kolekcija-"]', (links) => {
        return links.map(l => ({
            url: l.href,
            name: l.querySelector('h3, .title, .heading')?.textContent?.trim() || l.textContent?.trim()
        })).filter((v, i, a) => a.findIndex(t => t.url === v.url) === i); // Dedupe
    });

    console.log(`\nFound ${collectionLinks.length} collections:`);
    collectionLinks.forEach(c => console.log(`- ${c.name} (${c.url})`));

    let allProducts = [];

    // 2. Visit each collection
    for (const collection of collectionLinks) {
        if (!collection.url.includes('tarkett.rs/sr_RS/')) continue; // Skip external/irrelevant

        console.log(`\n🔍 Scraping collection: ${collection.name}`);
        try {
            await page.goto(collection.url, { waitUntil: 'domcontentloaded', timeout: 60000 });
            await page.waitForTimeout(1000);

            // Extract products from the collection page
            // Products are usually listed in a grid
            const products = await page.$$eval('.product-card, .item-project, article', (cards, collectionName) => {
                return cards.map((card, index) => {
                    // Selectors might need adjustment based on specific page structure
                    const linkEl = card.querySelector('a');
                    const imgEl = card.querySelector('img');
                    const titleEl = card.querySelector('h3, h4, .title, .product-name');

                    if (!linkEl || !titleEl) return null;

                    const name = titleEl.textContent.trim();
                    const url = linkEl.href;
                    const imageUrl = imgEl ? (imgEl.getAttribute('data-src') || imgEl.src) : '';

                    // Generate an ID/SKU
                    const slug = url.split('/').pop().replace('.html', '');
                    const sku = `TARKETT-${slug.toUpperCase().replace(/[^A-Z0-9]/g, '-')}`;

                    return {
                        id: `tarkett-${slug}`,
                        name: name,
                        slug: slug,
                        sku: sku,
                        categoryId: '3', // Parket
                        brandId: '3',    // Tarkett
                        shortDescription: `Parket iz kolekcije ${collectionName}`,
                        description: `Kvalitetan Tarkett parket iz kolekcije ${collectionName}.
            
            Karakteristike:
            - Vrhunska obrada
            - Prirodno drvo
            - Jednostavna ugradnja
            - Dugotrajnost`,
                        images: [
                            {
                                id: `${slug}-img`,
                                url: imageUrl.startsWith('http') ? imageUrl : `https://www.tarkett.rs${imageUrl}`,
                                alt: name,
                                isPrimary: true,
                                order: 1
                            }
                        ],
                        specs: [
                            { key: 'collection', label: 'Kolekcija', value: collectionName },
                            { key: 'manufacturer', label: 'Proizvođač', value: 'Tarkett' },
                            { key: 'wood_species', label: 'Vrsta drveta', value: 'Hrast' }, // Default, might extract specific
                            { key: 'installation', label: 'Tip instalacije', value: 'T-Lock' }
                        ],
                        detailsSections: [
                            {
                                title: 'O proizvodu',
                                items: [
                                    'Višeslojni parket',
                                    'Pogodan za podno grejanje (uz uslove)',
                                    'Lakiran ili uljen (zavisno od modela)'
                                ]
                            }
                        ],
                        price: 0,
                        priceUnit: 'm²',
                        inStock: true,
                        featured: false,
                        externalLink: url,
                        createdAt: new Date().toISOString(), // String for JSON, convert to Date in TS
                        updatedAt: new Date().toISOString(),
                    };
                }).filter(p => p !== null);
            }, collection.name);

            console.log(`   Found ${products.length} products in ${collection.name}`);
            allProducts = [...allProducts, ...products];

        } catch (err) {
            console.error(`   ❌ Error scraping ${collection.name}: ${err.message}`);
        }
    }

    console.log(`\n🎉 Total products scraped: ${allProducts.length}`);

    // 3. Generate TypeScript File content
    const tsContent = `import { Product } from '@/types';

export const tarkettProducts: Product[] = ${JSON.stringify(allProducts, null, 2).replace(/"createdAt": "(.*?)",/g, "createdAt: new Date('$1'),").replace(/"updatedAt": "(.*?)",/g, "updatedAt: new Date('$1'),")};
`;

    // 4. Save to file
    const outputPath = path.join(__dirname, '../lib/data/tarkett-products.ts');
    fs.writeFileSync(outputPath, tsContent);
    console.log(`\n✅ Saved data to: ${outputPath}`);

    await browser.close();
}

scrapeTarkettProducts();
