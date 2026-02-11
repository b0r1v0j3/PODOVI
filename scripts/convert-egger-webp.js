const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const IMG_DIR = path.join(__dirname, '..', 'public', 'images', 'products', 'egger', 'decors');
const JSON_PATH = path.join(__dirname, '..', 'public', 'data', 'egger-decors.json');

async function convert() {
    const files = fs.readdirSync(IMG_DIR).filter(f => f.endsWith('.png'));
    console.log(`Converting ${files.length} PNGs to WebP (quality 85%)...`);

    let converted = 0, failed = 0, totalSavedMB = 0;

    for (let i = 0; i < files.length; i += 10) {
        const batch = files.slice(i, i + 10);
        await Promise.all(batch.map(async (file) => {
            const inputPath = path.join(IMG_DIR, file);
            const outputPath = path.join(IMG_DIR, file.replace('.png', '.webp'));

            try {
                const inputSize = fs.statSync(inputPath).size;
                await sharp(inputPath)
                    .webp({ quality: 85 })
                    .toFile(outputPath);
                const outputSize = fs.statSync(outputPath).size;
                totalSavedMB += (inputSize - outputSize) / 1024 / 1024;

                // Delete the PNG
                fs.unlinkSync(inputPath);
                converted++;
            } catch (err) {
                console.error(`  FAIL: ${file} - ${err.message}`);
                failed++;
            }
        }));
        process.stdout.write(`\r  Progress: ${Math.min(i + 10, files.length)}/${files.length}`);
    }

    console.log(`\n\nDone! Converted: ${converted}, Failed: ${failed}`);
    console.log(`Space saved: ${totalSavedMB.toFixed(1)} MB`);

    // Update JSON paths from .png to .webp
    const data = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'));
    data.colors.forEach(c => {
        if (c.image_url && c.image_url.endsWith('.png')) {
            c.image_url = c.image_url.replace('.png', '.webp');
        }
        if (c.texture_url && c.texture_url.endsWith('.png')) {
            c.texture_url = c.texture_url.replace('.png', '.webp');
        }
    });
    fs.writeFileSync(JSON_PATH, JSON.stringify(data, null, 2), 'utf8');
    console.log('Updated egger-decors.json with .webp paths');
}

convert().catch(console.error);
