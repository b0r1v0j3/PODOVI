const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const extract = require('extract-zip');

const typeArg = process.argv.find(arg => arg.startsWith('--type='));
const collectionArg = process.argv.find(arg => arg.startsWith('--collection='));

if (!typeArg) {
    console.error('Usage: node tools/download_gerflor_highres_zip.js --type=<esd|vinyl|lvt|linoleum> [--collection=<slug>]');
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
    case 'lvt':
        dataFileName = 'lvt_colors_complete.json';
        outDirName = 'products/lvt';
        break;
    case 'linoleum':
        dataFileName = 'linoleum_colors_complete.json';
        outDirName = 'products/linoleum';
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

                    const fileNameObj = { name: color.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') };
                    const finalJpgName = `${color.code}-${fileNameObj.name}.jpg`;
                    const destPath = path.join(collectionDir, finalJpgName);

                    if (downloadLink.endsWith('.zip')) {
                        const zipPath = path.join(tmpDir, `${collection.slug}-${color.code}.zip`);
                        await download.saveAs(zipPath);

                        const extractDir = path.join(tmpDir, `${collection.slug}-${color.code}-extracted`);
                        await extract(zipPath, { dir: extractDir });

                        const files = fs.readdirSync(extractDir);
                        const jpgFile = files.find(f => f.toLowerCase().endsWith('.jpg'));

                        if (jpgFile) {
                            fs.copyFileSync(path.join(extractDir, jpgFile), destPath);
                            console.log(`    ✅ Saved final image: ${finalJpgName} from ZIP`);
                        }
                        fs.rmSync(extractDir, { recursive: true, force: true });
                        fs.rmSync(zipPath, { force: true });
                    } else {
                        // Directly copy downloaded jpg
                        await download.saveAs(destPath);
                        console.log(`    ✅ Saved final image: ${finalJpgName} directly`);
                    }

                    if (type === 'esd') {
                        color.image = `/images/${outDirName}/${finalJpgName}`;
                    } else if (type === 'lvt' || type === 'linoleum') {
                        color.image_url = `/images/${outDirName}/${collection.slug}/${finalJpgName}`;
                    } else if (type === 'vinyl') {
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
                    const nameLower = color.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                    const fileName = `${color.code}-${nameLower}.jpg`;
                    const destPath = path.join(collectionDir, fileName);

                    fs.copyFileSync(srcJpgPath, destPath);
                    console.log(`    ✅ Saved final image: ${fileName}`);

                    // Update JSON with local path
                    if (type === 'esd') {
                        color.image = `/images/${outDirName}/${fileName}`;
                    } else if (type === 'lvt' || type === 'linoleum') {
                        color.image_url = `/images/${outDirName}/${collection.slug}/${fileName}`;
                    } else if (type === 'vinyl') {
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
