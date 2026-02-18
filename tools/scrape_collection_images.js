const fs = require('fs');
const path = require('path');
const https = require('https');
const { chromium } = require('playwright');

const HTML_DIR = path.join(__dirname, 'tarkett_html');
const OUTPUT_IMAGE_DIR = path.join(__dirname, '../public/images/collections');
const OUTPUT_JSON_PATH = path.join(__dirname, '../public/data/collection_images.json');

// Ensure output directories exist
if (!fs.existsSync(OUTPUT_IMAGE_DIR)) {
    fs.mkdirSync(OUTPUT_IMAGE_DIR, { recursive: true });
}

const htmlFiles = [
    'lvt_glue_down.html',
    'lvt_loose_lay.html',
    'lvt_click.html',
    'spc_click.html' // Added SPC as well since it was in the folder
];

// Helper to download image
function downloadImage(url, filepath) {
    return new Promise((resolve, reject) => {
        if (fs.existsSync(filepath)) {
            console.log(`  Skipping (exists): ${path.basename(filepath)}`);
            resolve();
            return;
        }

        const file = fs.createWriteStream(filepath);
        https.get(url, (response) => {
            if (response.statusCode !== 200) {
                fs.unlink(filepath, () => { }); // Delete failed file
                reject(new Error(`Failed to download ${url}: Status ${response.statusCode}`));
                return;
            }
            response.pipe(file);
            file.on('finish', () => {
                file.close(() => {
                    console.log(`  Downloaded: ${path.basename(filepath)}`);
                    resolve();
                });
            });
        }).on('error', (err) => {
            fs.unlink(filepath, () => { });
            reject(err);
        });
    });
}

function sanitizeFilename(name) {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

(async () => {
    console.log('Starting Collection Image Scraper...');
    const browser = await chromium.launch({ headless: true });

    // Check if JSON exists to merge properly
    let collectionImages = {};
    if (fs.existsSync(OUTPUT_JSON_PATH)) {
        try {
            collectionImages = JSON.parse(fs.readFileSync(OUTPUT_JSON_PATH, 'utf8'));
        } catch (e) {
            console.log('Warning: Could not parse existing JSON, starting fresh.');
        }
    }

    for (const file of htmlFiles) {
        const filePath = path.join(HTML_DIR, file);
        if (!fs.existsSync(filePath)) {
            console.log(`Skipping missing file: ${file}`);
            continue;
        }

        console.log(`Processing: ${file}`);
        const page = await browser.newPage();
        const fileUrl = 'file://' + filePath;
        await page.goto(fileUrl);

        // Extract collection data
        const collections = await page.evaluate(() => {
            const items = [];

            // Selector based on previous analysis of lvt_loose_lay.html
            // .image-link-collection__image-container__link contains the link and image
            // .image-link-collection__info-container contains the title/type

            // The container for each item seems to be .image-link-collection (implied from class structure)
            // or we can just iterate over the links and find siblings/parents.

            // Let's try to find the container that holds both the link and the title.
            // Looking at the snippet:
            // <div class="image-link-collection"> ... </div> (Hypothetically, or similar wrapper)

            // Let's grab all links and find their images and titles.
            const links = document.querySelectorAll('.image-link-collection__image-container__link');

            links.forEach(link => {
                const href = link.getAttribute('href');
                if (!href) return;

                // Extract collection slug from URL
                // URL format: /sr_RS/kolekcija-C002533-modulart-ll8
                const urlParts = href.split('/');
                const lastPart = urlParts[urlParts.length - 1]; // kolekcija-C002533-modulart-ll8

                // We want the slug that matches our product data.
                // Our product data usually has "collection" field.
                // The slug in ID usually matches the end of the URL or is derived from name.
                // Let's grab the collection name from the page too.

                // Navigate to title
                // In snippet: link is inside a div, sibling div .image-link-collection__info-container has the title?
                // Wait, the snippet showed:
                // <div class="image-link-collection__info-container"> ... <a ... class="basic-clickable ..."> <span ...> Name </span> </a>

                // Let's traverse DOM
                const parent = link.closest('.image-link-collection'); // Assuming this class exists on wrapper
                // If wrapper class isn't clear, we can use the sibling relationship

                let name = '';
                const container = link.parentElement; // .image-link-collection__image-container ?
                const siblingInfo = container.nextElementSibling; // .image-link-collection__info-container ?

                if (siblingInfo) {
                    // Try to find the name link
                    const nameLink = siblingInfo.querySelector('.tksb-primary-link_cta-link__label');
                    if (nameLink) {
                        name = nameLink.innerText.trim();
                    }
                }

                // If name is empty, try to derive from URL
                if (!name && lastPart) {
                    name = lastPart.replace('kolekcija-', ''); // Fallback
                }

                // Image
                const img = link.querySelector('img.collection-image');
                let imgSrc = '';
                if (img) {
                    imgSrc = img.getAttribute('src');
                } else {
                    // Start of picture/source check
                    const source = link.querySelector('source');
                    if (source) imgSrc = source.getAttribute('srcset');
                }

                if (imgSrc && lastPart) {
                    items.push({
                        urlSlug: lastPart,
                        name: name,
                        imgSrc: imgSrc
                    });
                }
            });

            return items;
        });

        console.log(`  Found ${collections.length} collections.`);

        for (const col of collections) {
            if (!col.imgSrc) continue;

            // Clean up image URL
            // Ensure https
            let imgUrl = col.imgSrc.trim();
            if (imgUrl.startsWith('//')) imgUrl = 'https:' + imgUrl;

            // Filename: collection-slug.jpg
            // We need a way to map this back to our collection names in the DB/Json.
            // Our internal collections often look like "iD Inspiration Loose-Lay"
            // The slug from URL is "kolekcija-C002533-modulart-ll8"

            // Let's save it as the cleaned slug from the URL for now,
            // and we might need a mapping strategy.
            // Or use the name to create a slug. 

            // Let's use the URL slug part "modulart-ll8" (remove header) just in case
            // But unique ID "C002533" is good too.

            // Let's keep the full "kolekcija-..." slug for the key in JSON, 
            // but the filename can be cleaner.

            const filename = sanitizeFilename(col.urlSlug) + '.jpg';
            const localPath = `/images/collections/${filename}`;
            const fullLocalPath = path.join(OUTPUT_IMAGE_DIR, filename);

            try {
                await downloadImage(imgUrl, fullLocalPath);

                // Update map
                // We map [Collection Name] -> Local Path
                // AND [Collection Slug] -> Local Path to be safe

                collectionImages[col.urlSlug] = localPath;
                if (col.name) {
                    collectionImages[col.name] = localPath;
                    // Also normalized name
                    collectionImages[col.name.toLowerCase()] = localPath;
                }

            } catch (err) {
                console.error(`  Error downloading ${col.name}:`, err.message);
            }
        }

        await page.close();
    }

    await browser.close();

    // Save mapping
    fs.writeFileSync(OUTPUT_JSON_PATH, JSON.stringify(collectionImages, null, 2));
    console.log(`Saved mapping to ${OUTPUT_JSON_PATH}`);
    console.log('Done.');
})();
