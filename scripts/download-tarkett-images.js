/**
 * Download one representative image per Tarkett LVT collection
 * and save to public/images/tarkett/collections/
 */
const fs = require('fs');
const path = require('path');
const https = require('https');

const data = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'public', 'data', 'tarkett_lvt_products.json'), 'utf8'));

const outputDir = path.join(__dirname, '..', 'public', 'images', 'tarkett', 'collections');
fs.mkdirSync(outputDir, { recursive: true });

// Group by collection
const groups = {};
data.forEach(p => {
    if (!groups[p.collection]) groups[p.collection] = [];
    groups[p.collection].push(p);
});

function downloadFile(url, destPath) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(destPath);
        https.get(url, (response) => {
            if (response.statusCode === 301 || response.statusCode === 302) {
                downloadFile(response.headers.location, destPath).then(resolve).catch(reject);
                return;
            }
            if (response.statusCode !== 200) {
                reject(new Error(`HTTP ${response.statusCode} for ${url}`));
                return;
            }
            response.pipe(file);
            file.on('finish', () => {
                file.close();
                resolve();
            });
        }).on('error', reject);
    });
}

async function main() {
    const collections = Object.entries(groups);
    console.log(`Found ${collections.length} collections`);

    // Also collect PDF datasheet URLs for each collection
    const datasheets = {};

    for (const [collKey, products] of collections) {
        // Find best image: prefer a "TH_" thumbnail from the first product
        const firstWithImg = products.find(p => p.images && p.images.length > 0);
        if (!firstWithImg) {
            console.log(`  ${collKey}: NO IMAGES - skipping`);
            continue;
        }

        // Try to find the main product shot (TH_ prefix = main thumbnail)
        const bestImg = firstWithImg.images.find(url => typeof url === 'string' && url.includes('/TH_'))
            || firstWithImg.images[0];
        const imgUrl = typeof bestImg === 'string' ? bestImg : bestImg?.url;

        if (!imgUrl) {
            console.log(`  ${collKey}: no valid image URL`);
            continue;
        }

        const ext = path.extname(imgUrl.split('?')[0]) || '.jpg';
        const destFile = path.join(outputDir, `${collKey}${ext}`);

        console.log(`  ${collKey}: downloading ${imgUrl.substring(0, 80)}...`);
        try {
            await downloadFile(imgUrl, destFile);
            const stats = fs.statSync(destFile);
            console.log(`    -> saved ${destFile} (${(stats.size / 1024).toFixed(1)} KB)`);
        } catch (err) {
            console.error(`    -> FAILED: ${err.message}`);
        }

        // Collect datasheets (DS-*.pdf = technical datasheet)
        const docs = [];
        products.forEach(p => {
            (p.meta?.documents || []).forEach(url => {
                if (!docs.includes(url)) docs.push(url);
            });
        });
        datasheets[collKey] = docs;
    }

    // Print datasheets summary
    console.log('\n=== PDF DATASHEETS PER COLLECTION ===');
    for (const [collKey, docs] of Object.entries(datasheets)) {
        console.log(`\n${collKey}:`);
        docs.forEach(url => {
            const name = url.split('/').pop();
            const isDS = name.includes('DS-') || name.toLowerCase().includes('datasheet') || name.toLowerCase().includes('dataseet');
            console.log(`  ${isDS ? '📊' : '📄'} ${name}`);
        });
    }
}

main().catch(console.error);
