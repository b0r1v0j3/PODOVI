const fs = require('fs');
const path = require('path');

const jsonPath = path.join(__dirname, '..', 'public', 'data', 'bloq_carpet_tiles.json');
const imgBase = path.join(__dirname, '..', 'public', 'images', 'products', 'carpet', 'bloq');

const data = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

let matched = 0;
let notFound = 0;

for (const color of data.colors) {
    const folder = color.collection_name.toLowerCase();
    const folderPath = path.join(imgBase, folder);

    if (!fs.existsSync(folderPath)) {
        console.log(`FOLDER NOT FOUND: ${folder}`);
        notFound++;
        continue;
    }

    const files = fs.readdirSync(folderPath);
    const code = color.code;

    // Try multiple matching strategies
    let match = null;

    for (const f of files) {
        const lower = f.toLowerCase();
        // Exact code match with various separators
        if (
            lower.includes(`_${code}.`) ||      // flow_111.jpg
            lower.includes(`_${code}-`) ||       // tradition_105-hemp.jpg
            lower.includes(`-${code}-`) ||       // bloq_connexion-122-a.jpg
            lower.includes(`-${code}_`) ||
            lower.includes(` ${code} `) ||       // bloq_create_large 155 a.jpg (url encoded)
            lower.includes(`%20${code}%20`) ||   // URL encoded space
            lower.includes(`${code}_`) ||
            lower.startsWith(`${code}.`) ||
            lower.startsWith(`${code}-`) ||
            lower.startsWith(`${code}_`) ||
            // pos/neg prefix patterns
            lower === `pos${code}.png` ||        // pos221.png
            lower === `neg${code}.png` ||        // neg222.png
            lower === `pos${code}_0.png` ||      // pos226_0.png
            lower === `neg${code}_0.png`
        ) {
            match = f;
            break;
        }
    }

    if (match) {
        color.image_url = `/images/products/carpet/bloq/${folder}/${match}`;
        matched++;
    } else {
        console.log(`NO MATCH: ${folder}/${code} (${color.name}) - files: ${files.join(', ')}`);
        notFound++;
    }
}

fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2), 'utf-8');
console.log(`\nDone: ${matched} matched, ${notFound} not found`);
