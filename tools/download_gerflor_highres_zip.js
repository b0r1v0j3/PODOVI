const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const extract = require('extract-zip');

const typeArg = process.argv.find(arg => arg.startsWith('--type='));
const collectionArg = process.argv.find(arg => arg.startsWith('--collection='));

if (!typeArg) {
    console.error('Usage: node tools/download_gerflor_highres_zip.js --type=<esd|vinyl|vinyl-special|lvt|linoleum|industrial|sport> [--collection=<slug>]');
    process.exit(1);
}

const type = typeArg.split('=')[1];
const targetCollectionSlug = collectionArg ? collectionArg.split('=')[1] : null;

let dataFileName = '';
let outDirName = '';

switch (type) {
    case 'esd':
        dataFileName = 'esd_colors.json';
        outDirName = 'esd';
        break;
    case 'vinyl':
        dataFileName = 'vinyl_colors_complete.json';
        outDirName = 'products/vinyl';
        break;
    case 'vinyl-special':
        dataFileName = 'vinyl_special_colors.json';
        outDirName = 'products/vinyl';
        break;
    case 'lvt':
        dataFileName = 'lvt_colors_complete.json';
        outDirName = 'products/lvt';
        break;
    case 'linoleum':
        dataFileName = 'linoleum_colors_complete.json';
        outDirName = 'products/linoleum';
        break;
    case 'industrial':
        dataFileName = 'industrial_colors.json';
        outDirName = 'products/industrial';
        break;
    case 'sport':
        dataFileName = 'sport_colors.json';
        outDirName = 'products/sport';
        break;
    default:
        console.error(`Unknown type: ${type}`);
        process.exit(1);
}

const dataPath = path.join(__dirname, '..', 'public', 'data', dataFileName);
let jsonData;
try {
    jsonData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
} catch (e) {
    console.error(`Could not read data file ${dataPath}`);
    process.exit(1);
}

const baseOutDir = path.join(__dirname, '..', 'public', 'images', outDirName);
if (!fs.existsSync(baseOutDir)) {
    fs.mkdirSync(baseOutDir, { recursive: true });
}

const tmpDir = path.join(__dirname, '..', 'tmp_downloads');
if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir, { recursive: true });
}

function sanitizeName(value) {
    return String(value || '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
}

async function saveDownloadAsJpg(download, destPath, tmpPrefix) {
    const suggestedName = download.suggestedFilename ? download.suggestedFilename() : `${tmpPrefix}.zip`;
    const tmpPath = path.join(tmpDir, `${tmpPrefix}-${suggestedName}`);
    await download.saveAs(tmpPath);

    const isZip = tmpPath.toLowerCase().endsWith('.zip');
    if (isZip) {
        const extractDir = path.join(tmpDir, `${tmpPrefix}-extracted`);
        await extract(tmpPath, { dir: extractDir });

        const extractedFiles = fs.readdirSync(extractDir);
        const jpgFile = extractedFiles.find(file => file.toLowerCase().endsWith('.jpg'));
        if (!jpgFile) {
            fs.rmSync(extractDir, { recursive: true, force: true });
            fs.rmSync(tmpPath, { force: true });
            throw new Error(`ZIP ${suggestedName} does not contain a JPG`);
        }

        fs.copyFileSync(path.join(extractDir, jpgFile), destPath);
        fs.rmSync(extractDir, { recursive: true, force: true });
        fs.rmSync(tmpPath, { force: true });
        return;
    }

    fs.copyFileSync(tmpPath, destPath);
    fs.rmSync(tmpPath, { force: true });
}

async function downloadCollectionImage(page, collection, collectionDir) {
    const collectionImagePath = path.join(collectionDir, 'collection.jpg');
    if (fs.existsSync(collectionImagePath)) {
        console.log('  Collection image already exists, skipping collection roomshot download.');
        return;
    }

    try {
        const directLink = await page.evaluate(() => {
            const NUXT = window.__NUXT__;
            const item = NUXT?.state?.collectionProductPage?.item;
            if (!item) return null;

            const documentCandidates = [...(item.documents || []), ...(item.medias || [])];
            const doc = documentCandidates.find(entry => {
                const fileUrl = entry?.file_url || entry?.url || '';
                return fileUrl.endsWith('.zip') || fileUrl.endsWith('.jpg') || fileUrl.includes('/images/');
            });
            if (doc?.file_url || doc?.url) {
                return doc.file_url || doc.url;
            }

            if (item.mediaBaseUri && item.images && item.images[0]) {
                return item.mediaBaseUri + item.images[0].original;
            }

            return null;
        });

        if (directLink) {
            console.log(`  Downloading collection image via payload link: ${directLink}`);
            const [download] = await Promise.all([
                page.waitForEvent('download', { timeout: 30000 }),
                page.evaluate((url) => {
                    const anchor = document.createElement('a');
                    anchor.href = url;
                    anchor.download = '';
                    document.body.appendChild(anchor);
                    anchor.click();
                    document.body.removeChild(anchor);
                }, directLink),
            ]);
            await saveDownloadAsJpg(download, collectionImagePath, `${collection.slug}-collection`);
            console.log('  ✅ Saved collection roomshot as collection.jpg');
            return;
        }

        console.log('  Payload link for collection roomshot not found, trying UI download...');
        await page.click('.download-button--trigger', { timeout: 10000 });
        await page.waitForTimeout(1000);

        const [download] = await Promise.all([
            page.waitForEvent('download', { timeout: 30000 }),
            page.click('.download-button--images'),
        ]);

        await saveDownloadAsJpg(download, collectionImagePath, `${collection.slug}-collection`);
        await page.mouse.click(0, 0);
        await page.waitForTimeout(1000);
        console.log('  ✅ Saved collection roomshot as collection.jpg');
    } catch (error) {
        console.log(`  ⚠️ Could not download collection roomshot for ${collection.slug}: ${error.message}`);
        try {
            await page.mouse.click(0, 0);
        } catch (e) { }
    }
}

// Map the items to a standard array of collections
let collectionsToProcess = [];

if (jsonData.collections && Array.isArray(jsonData.collections)) {
    // Structure: { collections: [ { slug, url, colors: [] } ] } (ESD, Vinyl)
    collectionsToProcess = jsonData.collections;
} else if (jsonData.colors && Array.isArray(jsonData.colors)) {
    // Structure: { colors: [ { collection_slug, url, code, name } ] } (LVT, Linoleum)
    // We need to group them by collection
    const collMap = new Map();
    for (const color of jsonData.colors) {
        let slug = color.collection_slug || color.collection;
        if (!slug) continue;

        // Remove 'gerflor-' prefix if present for uniformity in this script
        const rawSlug = slug.replace(/^gerflor-/, '');

        if (!collMap.has(rawSlug)) {
            let collUrl = color.collection_url || color.url || `https://www.gerflor-cee.com/products/${rawSlug}`;
            // If we only have the precise color url, strip the end to get the collection URL if possible
            if (collUrl.includes(`-${color.code}-`)) {
                collUrl = collUrl.substring(0, collUrl.indexOf(`-${color.code}-`));
            }
            collMap.set(rawSlug, {
                slug: rawSlug,
                url: collUrl,
                colors: []
            });
        }
        collMap.get(rawSlug).colors.push(color);
    }
    collectionsToProcess = Array.from(collMap.values());
} else {
    console.error('Unknown JSON structure. Needs either "collections" or "colors" array.');
    process.exit(1);
}

if (targetCollectionSlug) {
    collectionsToProcess = collectionsToProcess.filter(c => c.slug === targetCollectionSlug);
    if (collectionsToProcess.length === 0) {
        console.error(`Collection ${targetCollectionSlug} not found in data.`);
        process.exit(1);
    }
}

(async () => {
    // Run headed so we don't look like a bot
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext({
        acceptDownloads: true
    });
    const page = await context.newPage();

    let totalUpdated = 0;

    // Accept cookies to enable the page features
    console.log('Accepting cookies...');
    // Use the first collection URL to accept cookies 
    await page.goto(collectionsToProcess[0].url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(3000);
    try {
        const acceptBtn = await page.evaluate(() => {
            const el = document.querySelector('#uc-center-container');
            if (el && el.shadowRoot) {
                const btn = el.shadowRoot.querySelector('button[data-testid="uc-accept-all-button"]');
                if (btn) { btn.click(); return true; }
            }
            return false;
        });
        if (!acceptBtn) {
            const btnSelectors = ['button[data-testid="uc-accept-all-button"]', '#uc-btn-accept-banner', '.uc-btn-accept'];
            for (const sel of btnSelectors) {
                try { await page.click(sel, { timeout: 2000 }); break; } catch (e) { }
            }
        }
    } catch (e) { }

    for (const collection of collectionsToProcess) {
        console.log(`\nProcessing collection: ${collection.slug}`);

        const collectionDir = path.join(baseOutDir, collection.slug);
        if (!fs.existsSync(collectionDir)) {
            fs.mkdirSync(collectionDir, { recursive: true });
        }

        // Go to collection page
        const response = await page.goto(collection.url, { waitUntil: 'domcontentloaded', timeout: 60000 });
        if (response && response.status() === 404) {
            console.log(`  ❌ Collection URL returned 404, skipping: ${collection.url}`);
            continue;
        }
        await page.waitForTimeout(4000);
        await downloadCollectionImage(page, collection, collectionDir);

        for (const color of collection.colors) {
            console.log(`  Processing ${color.code} ${color.name}`);

            try {
                // Read Nuxt state from page to find specific download link
                const downloadLink = await page.evaluate((code) => {
                    const NUXT = window.__NUXT__;
                    if (!NUXT || !NUXT.state || !NUXT.state.collectionProductPage) return null;
                    const item = NUXT.state.collectionProductPage.item;
                    if (!item || !item.designs) return null;

                    const design = item.designs.find(d =>
                        d.product_design_key === code ||
                        d.product_design_key === code.replace(/^0+/, '') ||
                        String(d.product_design_key).endsWith(code)
                    );

                    if (design && design.documents) {
                        // Look for full image or zip
                        const doc = design.documents.find(d =>
                            d.file_url.includes('images') ||
                            d.file_url.endsWith('.zip') ||
                            d.file_url.endsWith('.jpg')
                        );
                        if (doc) return doc.file_url;
                    }

                    // Fallback to mediaBaseUri + image path if direct link not in documents
                    if (design && design.mediaBaseUri && design.images && design.images[0]) {
                        return design.mediaBaseUri + design.images[0].original;
                    }

                    return null;
                }, color.code);

                // If no direct link was found via NUXT, use the fallback ZIP scraping logic
                if (downloadLink) {
                    console.log(`    Found direct link via NUXT: ${downloadLink}`);
                    // Trigger download directly by navigating to it
                    const [download] = await Promise.all([
                        page.waitForEvent('download', { timeout: 30000 }),
                        page.evaluate(url => {
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = '';
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                        }, downloadLink)
                    ]);

                    const fileNameObj = { name: sanitizeName(color.name) };
                    const finalJpgName = `${color.code}-${fileNameObj.name}.jpg`;
                    const destPath = path.join(collectionDir, finalJpgName);

                    await saveDownloadAsJpg(download, destPath, `${collection.slug}-${color.code}`);
                    console.log(`    ✅ Saved final image: ${finalJpgName}`);

                    if (type === 'esd') {
                        color.image = `/images/${outDirName}/${finalJpgName}`;
                    } else if (type === 'lvt' || type === 'linoleum') {
                        color.image_url = `/images/${outDirName}/${collection.slug}/${finalJpgName}`;
                    } else if (type === 'vinyl' || type === 'vinyl-special' || type === 'industrial' || type === 'sport') {
                        color.image = `/images/${outDirName}/${collection.slug}/${finalJpgName}`;
                    }
                    totalUpdated++;
                    continue; // Done with this color
                }

                // --- FALLBACK: UI Clicking Logic ---
                console.log(`    Nuxt link not found, attempting UI click fallback...`);
                // Click the color swatch
                const swatchLabel = `View product ${color.code} ${color.name}`;
                try {
                    await page.click(`[aria-label="${swatchLabel}"]`, { timeout: 10000 });
                    await page.waitForTimeout(3000); // Wait for the slider to update
                } catch (e) {
                    try {
                        const fallbackLabel = `View product ${color.code} ${color.name.toLowerCase()}`;
                        await page.click(`[aria-label="${fallbackLabel}" i]`, { timeout: 5000 });
                        await page.waitForTimeout(3000);
                    } catch (e2) {
                        try {
                            const anySwatchWithCode = `[aria-label*="${color.code}"]`;
                            await page.click(anySwatchWithCode, { timeout: 5000 });
                            await page.waitForTimeout(3000);
                        } catch (e3) {
                            console.log(`    Skipping swatch ${color.code}`);
                            continue;
                        }
                    }
                }

                // Click download dropdown
                await page.click('.download-button--trigger', { timeout: 10000 });
                await page.waitForTimeout(1000);

                // Wait for the download archive
                const [download] = await Promise.all([
                    page.waitForEvent('download', { timeout: 30000 }),
                    page.click('.download-button--images')
                ]);

                const zipPath = path.join(tmpDir, `${collection.slug}-${color.code}.zip`);
                await download.saveAs(zipPath);

                console.log(`    Downloaded zip to ${zipPath}`);

                // Extract zip
                const extractDir = path.join(tmpDir, `${collection.slug}-${color.code}-extracted`);
                await extract(zipPath, { dir: extractDir });

                // Find the jpg inside the extracted folder
                const files = fs.readdirSync(extractDir);
                const jpgFile = files.find(f => f.toLowerCase().endsWith('.jpg'));

                if (jpgFile) {
                    const srcJpgPath = path.join(extractDir, jpgFile);
                    // Standardize the filename
                    const nameLower = sanitizeName(color.name);
                    const fileName = `${color.code}-${nameLower}.jpg`;
                    const destPath = path.join(collectionDir, fileName);

                    fs.copyFileSync(srcJpgPath, destPath);
                    console.log(`    ✅ Saved final image: ${fileName}`);

                    // Update JSON with local path
                    if (type === 'esd') {
                        color.image = `/images/${outDirName}/${fileName}`;
                    } else if (type === 'lvt' || type === 'linoleum') {
                        color.image_url = `/images/${outDirName}/${collection.slug}/${fileName}`;
                    } else if (type === 'vinyl' || type === 'vinyl-special' || type === 'industrial' || type === 'sport') {
                        color.image = `/images/${outDirName}/${collection.slug}/${fileName}`;
                    }
                    totalUpdated++;
                } else {
                    console.log(`    ❌ Extracted zip did not contain a jpg!`);
                }

                // Cleanup tmp files
                fs.rmSync(extractDir, { recursive: true, force: true });
                fs.rmSync(zipPath, { force: true });

                // Close download menu by clicking anywhere else
                await page.mouse.click(0, 0);
                await page.waitForTimeout(1000);

            } catch (err) {
                console.error(`    ❌ Error processing ${color.code}: ${err.message}`);
                // Try to click away to close any open dialogs that might block the next click
                await page.mouse.click(0, 0);
            }
        }
    }

    fs.writeFileSync(dataPath, JSON.stringify(jsonData, null, 4));
    console.log(`\n✅ Done! Saved ${totalUpdated} high-res images and updated ${dataFileName}.`);

    if (fs.existsSync(tmpDir)) {
        fs.rmSync(tmpDir, { recursive: true, force: true });
    }
    await browser.close();
})();
