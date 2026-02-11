// Resize all EGGER decor WebP images to max 400px width for fast loading
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const IMG_DIR = path.join(__dirname, '..', 'public', 'images', 'products', 'egger', 'decors');
const MAX_WIDTH = 400;

async function resize() {
    const files = fs.readdirSync(IMG_DIR).filter(f => f.endsWith('.webp'));
    console.log(`Resizing ${files.length} WebP images to max ${MAX_WIDTH}px width...`);

    let resized = 0, skipped = 0, failed = 0;
    let totalBefore = 0, totalAfter = 0;

    for (let i = 0; i < files.length; i += 10) {
        const batch = files.slice(i, i + 10);
        await Promise.all(batch.map(async (file) => {
            const filepath = path.join(IMG_DIR, file);
            const tmpPath = filepath + '.tmp';

            try {
                const beforeSize = fs.statSync(filepath).size;
                totalBefore += beforeSize;

                const meta = await sharp(filepath).metadata();
                if (meta.width <= MAX_WIDTH) {
                    totalAfter += beforeSize;
                    skipped++;
                    return;
                }

                await sharp(filepath)
                    .resize(MAX_WIDTH, null, { withoutEnlargement: true })
                    .webp({ quality: 82 })
                    .toFile(tmpPath);

                fs.unlinkSync(filepath);
                fs.renameSync(tmpPath, filepath);

                const afterSize = fs.statSync(filepath).size;
                totalAfter += afterSize;
                resized++;
            } catch (err) {
                console.log(`  FAIL: ${file} - ${err.message}`);
                try { fs.unlinkSync(tmpPath); } catch (e) { }
                totalAfter += fs.statSync(filepath).size;
                failed++;
            }
        }));
        process.stdout.write(`\r  ${Math.min(i + 10, files.length)}/${files.length}`);
    }

    console.log(`\n\nDone! Resized: ${resized}, Skipped: ${skipped}, Failed: ${failed}`);
    console.log(`Before: ${(totalBefore / 1024 / 1024).toFixed(1)} MB`);
    console.log(`After: ${(totalAfter / 1024 / 1024).toFixed(1)} MB`);
    console.log(`Saved: ${((totalBefore - totalAfter) / 1024 / 1024).toFixed(1)} MB`);
}

resize().catch(console.error);
