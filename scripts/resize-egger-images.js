// Re-download ALL EGGER decor images from CDN targeting ~500 KB each
// Keep original dimensions, use WebP quality that hits ~500 KB target
const fs = require('fs');
const path = require('path');
const https = require('https');
const sharp = require('sharp');

const IMG_DIR = path.join(__dirname, '..', 'public', 'images', 'products', 'egger', 'decors');
const BACKUP_PATH = path.join(__dirname, '..', 'egger-all-284-decors.json');
const JSON_PATH = path.join(__dirname, '..', 'public', 'data', 'egger-decors.json');
const TARGET_KB = 500;

const data = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'));
const backup = JSON.parse(fs.readFileSync(BACKUP_PATH, 'utf8'));

const cdnMap = {};
backup.forEach(b => { if (b.code && b.image) cdnMap[b.code] = b.image; });

const seen = new Set();
const uniqueColors = data.colors.filter(c => {
    if (seen.has(c.slug)) return false;
    seen.add(c.slug);
    return true;
});
console.log(`Processing ${uniqueColors.length} unique images, target ~${TARGET_KB} KB each`);

function download(url) {
    return new Promise((resolve, reject) => {
        https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
            if (res.statusCode === 301 || res.statusCode === 302) {
                download(res.headers.location).then(resolve).catch(reject);
                return;
            }
            if (res.statusCode !== 200) { reject(new Error(`HTTP ${res.statusCode}`)); return; }
            const chunks = [];
            res.on('data', chunk => chunks.push(chunk));
            res.on('end', () => resolve(Buffer.concat(chunks)));
        }).on('error', reject);
    });
}

async function processImage(pngBuf, targetKB) {
    // Try different quality levels to hit target size
    // Start at quality 90 and adjust down
    let quality = 90;
    let webpBuf = await sharp(pngBuf).webp({ quality }).toBuffer();

    if (webpBuf.length > targetKB * 1024 * 1.2) {
        // Too large, reduce quality
        quality = 75;
        webpBuf = await sharp(pngBuf).webp({ quality }).toBuffer();
    }
    if (webpBuf.length > targetKB * 1024 * 1.2) {
        quality = 65;
        webpBuf = await sharp(pngBuf).webp({ quality }).toBuffer();
    }
    if (webpBuf.length > targetKB * 1024 * 1.5) {
        // Still too large, resize to 1200px
        webpBuf = await sharp(pngBuf).resize(1200, null, { withoutEnlargement: true }).webp({ quality: 80 }).toBuffer();
    }

    return webpBuf;
}

async function main() {
    let ok = 0, failed = 0;

    for (let i = 0; i < uniqueColors.length; i += 5) {
        const batch = uniqueColors.slice(i, i + 5);
        await Promise.all(batch.map(async (color) => {
            const webpPath = path.join(IMG_DIR, `${color.slug}.webp`);
            const cdnUrl = cdnMap[color.code];
            if (!cdnUrl) { failed++; return; }

            try {
                const pngBuf = await download(cdnUrl);
                const webpBuf = await processImage(pngBuf, TARGET_KB);
                fs.writeFileSync(webpPath, webpBuf);
                ok++;
            } catch (err) {
                console.log(`  FAIL: ${color.slug} - ${err.message}`);
                failed++;
            }
        }));
        process.stdout.write(`\r  ${Math.min(i + 5, uniqueColors.length)}/${uniqueColors.length} (ok:${ok} fail:${failed})`);
    }

    const webps = fs.readdirSync(IMG_DIR).filter(f => f.endsWith('.webp'));
    const sizes = webps.map(f => fs.statSync(path.join(IMG_DIR, f)).size / 1024);
    const totalMB = sizes.reduce((s, kb) => s + kb, 0) / 1024;
    const avgKB = sizes.reduce((s, kb) => s + kb, 0) / sizes.length;
    const minKB = Math.min(...sizes);
    const maxKB = Math.max(...sizes);
    console.log(`\n\n${webps.length} files, ${totalMB.toFixed(1)} MB total`);
    console.log(`Avg: ${avgKB.toFixed(0)} KB, Min: ${minKB.toFixed(0)} KB, Max: ${maxKB.toFixed(0)} KB`);
}

main().catch(console.error);
