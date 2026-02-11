// Fetch ALL EGGER decor CDN URLs from API and download missing WebP images
const fs = require('fs');
const path = require('path');
const https = require('https');
const sharp = require('sharp');

const IMG_DIR = path.join(__dirname, '..', 'public', 'images', 'products', 'egger', 'decors');
const JSON_PATH = path.join(__dirname, '..', 'public', 'data', 'egger-decors.json');

const data = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'));
const colors = data.colors;

// Find colors without WebP files
const missing = colors.filter(c => {
    const webp = path.join(IMG_DIR, `${c.slug}.webp`);
    return !fs.existsSync(webp) || fs.statSync(webp).size < 1000;
});
console.log(`Missing WebP files: ${missing.length}`);
console.log('Missing codes:', missing.map(c => c.code).join(', '));

function fetchJson(url) {
    return new Promise((resolve, reject) => {
        https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' } }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
            });
        }).on('error', reject);
    });
}

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

async function main() {
    // Fetch ALL decor pages from EGGER API
    const apiBase = 'https://api.www.egger.com/pimebp/decor-search/api/searchPage?country=RS&language=sr&size=50&brand=';
    const brands = ['naturesense', 'naturesenseaqua', 'aquaduraplus', 'aquadura', 'herringbone', 'naturesenseaquaplus'];

    const cdnMap = {};

    for (const brand of brands) {
        let page = 0;
        while (true) {
            try {
                const url = `${apiBase}${brand}&page=${page}`;
                const result = await fetchJson(url);
                const decors = result.content || [];
                if (decors.length === 0) break;

                decors.forEach(d => {
                    const code = d.decorId || d.code;
                    const images = d.images || [];
                    const img = images.find(i => i.type === 'ROOM' || i.type === 'MOOD') || images[0];
                    if (code && img) {
                        cdnMap[code] = img.url || img.imageUrl;
                    }
                });

                console.log(`  API ${brand} page ${page}: ${decors.length} decors`);
                if (decors.length < 50) break;
                page++;
            } catch (err) {
                console.log(`  API error for ${brand} page ${page}: ${err.message}`);
                break;
            }
        }
    }

    console.log(`\nTotal CDN URLs from API: ${Object.keys(cdnMap).length}`);

    // Download missing ones
    let downloaded = 0, failed = 0;
    for (const color of missing) {
        const cdnUrl = cdnMap[color.code];
        if (!cdnUrl) {
            console.log(`  No URL found for ${color.code} (${color.slug})`);
            failed++;
            continue;
        }

        const tmpPng = path.join(IMG_DIR, `${color.slug}.tmp.png`);
        const webpFile = path.join(IMG_DIR, `${color.slug}.webp`);

        try {
            await download(cdnUrl, tmpPng);
            await sharp(tmpPng).webp({ quality: 85 }).toFile(webpFile);
            fs.unlinkSync(tmpPng);
            downloaded++;
            process.stdout.write(`\r  Downloaded: ${downloaded}/${missing.length}`);
        } catch (err) {
            console.log(`  FAIL: ${color.slug} - ${err.message}`);
            try { fs.unlinkSync(tmpPng); } catch (e) { }
            failed++;
        }
    }

    // Final count
    const webps = fs.readdirSync(IMG_DIR).filter(f => f.endsWith('.webp'));
    const totalMB = webps.reduce((s, f) => s + fs.statSync(path.join(IMG_DIR, f)).size, 0) / 1024 / 1024;
    console.log(`\n\nFinal: ${webps.length}/284 WebP, ${totalMB.toFixed(1)} MB`);
    console.log(`Downloaded: ${downloaded}, Failed: ${failed}`);
}

main().catch(console.error);
