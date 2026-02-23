const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const extract = require('extract-zip');
const { execSync } = require('child_process');

const dataPath = path.join(__dirname, '..', 'public', 'data', 'esd_colors.json');
const esdData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

const outDir = path.join(__dirname, '..', 'public', 'images', 'esd');
if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
}

const tmpDir = path.join(__dirname, '..', 'tmp_downloads');
if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir, { recursive: true });
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
    await page.goto('https://www.gerflor-cee.com/category/esd-flooring-solutions', { waitUntil: 'domcontentloaded', timeout: 60000 });
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

    for (const collection of esdData.collections) {
        console.log(`\nProcessing collection: ${collection.slug}`);

        // Go to collection page
        await page.goto(collection.url, { waitUntil: 'domcontentloaded', timeout: 60000 });
        await page.waitForTimeout(4000);

        for (const color of collection.colors) {
            console.log(`  Processing ${color.code} ${color.name} (from ${collection.name})`);

            try {
                // Click the color swatch
                const swatchLabel = `View product ${color.code} ${color.name}`;
                try {
                    await page.click(`[aria-label="${swatchLabel}"]`, { timeout: 10000 });
                    await page.waitForTimeout(3000); // Wait for the slider to update
                } catch (e) {
                    // Try exact match with uppercase/lowercase
                    console.log(`    Could not find swatch for ${swatchLabel}, skipping`);
                    continue;
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
                    const fileName = `${collection.slug}-${color.code}.jpg`;
                    const destPath = path.join(outDir, fileName);

                    fs.copyFileSync(srcJpgPath, destPath);
                    console.log(`    ✅ Saved final image: ${fileName}`);

                    // Update JSON with local path
                    color.image = `/images/esd/${fileName}`;
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

    fs.writeFileSync(dataPath, JSON.stringify(esdData, null, 4));
    console.log(`\n✅ Done! Saved ${totalUpdated} high-res images and updated esd_colors.json.`);

    // Final cleanup
    fs.rmSync(tmpDir, { recursive: true, force: true });
    await browser.close();
})();
