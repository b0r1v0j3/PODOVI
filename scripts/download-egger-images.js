const fs = require('fs');
const path = require('path');
const https = require('https');

const JSON_PATH = path.join(__dirname, '..', 'public', 'data', 'egger-decors.json');
const IMG_DIR = path.join(__dirname, '..', 'public', 'images', 'products', 'egger', 'decors');

// Create directory
fs.mkdirSync(IMG_DIR, { recursive: true });

const data = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'));
const colors = data.colors;

console.log(`Downloading ${colors.length} EGGER decor images...`);

function downloadImage(url, filepath) {
    return new Promise((resolve, reject) => {
        if (fs.existsSync(filepath)) {
            resolve('exists');
            return;
        }
        const file = fs.createWriteStream(filepath);
        https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (response) => {
            if (response.statusCode === 301 || response.statusCode === 302) {
                file.close();
                fs.unlinkSync(filepath);
                downloadImage(response.headers.location, filepath).then(resolve).catch(reject);
                return;
            }
            if (response.statusCode !== 200) {
                file.close();
                fs.unlinkSync(filepath);
                reject(new Error(`HTTP ${response.statusCode} for ${url}`));
                return;
            }
            response.pipe(file);
            file.on('finish', () => { file.close(); resolve('downloaded'); });
        }).on('error', (err) => {
            file.close();
            try { fs.unlinkSync(filepath); } catch (e) { }
            reject(err);
        });
    });
}

async function downloadAll() {
    let downloaded = 0, skipped = 0, failed = 0;

    // Process in batches of 10
    for (let i = 0; i < colors.length; i += 10) {
        const batch = colors.slice(i, i + 10);
        const promises = batch.map(async (color) => {
            const ext = color.image_url.endsWith('.jpg') ? '.jpg' : '.png';
            const filename = `${color.slug}${ext}`;
            const filepath = path.join(IMG_DIR, filename);
            const localPath = `/images/products/egger/decors/${filename}`;

            try {
                const result = await downloadImage(color.image_url, filepath);
                if (result === 'exists') {
                    skipped++;
                } else {
                    downloaded++;
                }
                // Update the color's image URL to local path
                color.image_url = localPath;
                color.texture_url = localPath;
            } catch (err) {
                failed++;
                console.error(`  FAIL: ${color.slug} - ${err.message}`);
                // Keep the CDN url as fallback
            }
        });

        await Promise.all(promises);
        process.stdout.write(`\r  Progress: ${Math.min(i + 10, colors.length)}/${colors.length} (${downloaded} new, ${skipped} cached, ${failed} failed)`);
    }

    console.log(`\n\nDone! Downloaded: ${downloaded}, Cached: ${skipped}, Failed: ${failed}`);

    // Write updated JSON
    fs.writeFileSync(JSON_PATH, JSON.stringify(data, null, 2), 'utf8');
    console.log('Updated egger-decors.json with local paths');
}

downloadAll().catch(console.error);
