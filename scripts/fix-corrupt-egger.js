// Fix ALL missing/corrupt EGGER decor images
// Checks all 284 colors, downloads missing ones, converts ALL to WebP
const fs = require('fs');
const path = require('path');
const https = require('https');
const sharp = require('sharp');

const IMG_DIR = path.join(__dirname, '..', 'public', 'images', 'products', 'egger', 'decors');
const JSON_PATH = path.join(__dirname, '..', 'public', 'data', 'egger-decors.json');

fs.mkdirSync(IMG_DIR, { recursive: true });

const data = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'));
const colors = data.colors;

// Load original CDN URLs from backup (field: "code" + "image")
let cdnMap = {};
const backup = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'egger-all-284-decors.json'), 'utf8'));
backup.forEach(item => {
    if (item.code && item.image) cdnMap[item.code] = item.image;
});
console.log(`Loaded ${Object.keys(cdnMap).length} CDN URLs from backup`);

function download(url, filepath) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(filepath);
        https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
            if (res.statusCode === 301 || res.statusCode === 302) {
                file.close(); try { fs.unlinkSync(filepath); } catch (e) { }
                download(res.headers.location, filepath).then(resolve).catch(reject);
                return;
            }
            if (res.statusCode !== 200) {
                file.close(); try { fs.unlinkSync(filepath); } catch (e) { }
                reject(new Error(`HTTP ${res.statusCode}`)); return;
            }
            res.pipe(file);
            file.on('finish', () => { file.close(); resolve(); });
        }).on('error', (err) => {
            file.close(); try { fs.unlinkSync(filepath); } catch (e) { }
            reject(err);
        });
    });
}

async function fixAll() {
    let ok = 0, downloaded = 0, failed = 0;

    for (let i = 0; i < colors.length; i += 5) {
        const batch = colors.slice(i, i + 5);
        await Promise.all(batch.map(async (color) => {
            const webpFile = path.join(IMG_DIR, `${color.slug}.webp`);
            color.image_url = `/images/products/egger/decors/${color.slug}.webp`;
            color.texture_url = color.image_url;

            if (fs.existsSync(webpFile) && fs.statSync(webpFile).size > 1000) {
                ok++; return;
            }

            const cdnUrl = cdnMap[color.code];
            if (!cdnUrl) { failed++; return; }

            const tmpPng = path.join(IMG_DIR, `${color.slug}.tmp.png`);
            try {
                await download(cdnUrl, tmpPng);
                await sharp(tmpPng).webp({ quality: 85 }).toFile(webpFile);
                fs.unlinkSync(tmpPng);
                downloaded++;
            } catch (err) {
                console.log(`  FAIL: ${color.slug} - ${err.message}`);
                try { fs.unlinkSync(tmpPng); } catch (e) { }
                failed++;
            }
        }));
        process.stdout.write(`\r  ${Math.min(i + 5, colors.length)}/${colors.length} (OK:${ok} DL:${downloaded} FAIL:${failed})`);
    }

    // Delete leftover PNGs
    fs.readdirSync(IMG_DIR).filter(f => f.endsWith('.png')).forEach(f => fs.unlinkSync(path.join(IMG_DIR, f)));

    fs.writeFileSync(JSON_PATH, JSON.stringify(data, null, 2), 'utf8');

    const webps = fs.readdirSync(IMG_DIR).filter(f => f.endsWith('.webp'));
    const totalMB = webps.reduce((s, f) => s + fs.statSync(path.join(IMG_DIR, f)).size, 0) / 1024 / 1024;
    console.log(`\n\nFinal: ${webps.length}/284 WebP, ${totalMB.toFixed(1)} MB`);
}

fixAll().catch(console.error);
