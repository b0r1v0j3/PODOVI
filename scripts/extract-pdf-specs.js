const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const pdf = require('pdf-parse');

const DOCS_INDEX = path.join(__dirname, '../public/data/documents_index.json');
const TARGET_JSON_FILES = [
    path.join(__dirname, '../public/data/lvt_colors_complete.json'),
    path.join(__dirname, '../public/data/linoleum_colors_complete.json'),
    path.join(__dirname, '../public/data/vinyl_colors_complete.json')
];

async function downloadBuffer(url) {
    return new Promise((resolve, reject) => {
        const client = url.startsWith('https') ? https : http;
        client.get(url, (res) => {
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                return resolve(downloadBuffer(res.headers.location));
            }
            if (res.statusCode !== 200) {
                return reject(new Error(`Status ${res.statusCode} for ${url}`));
            }
            const data = [];
            res.on('data', chunk => data.push(chunk));
            res.on('end', () => resolve(Buffer.concat(data)));
        }).on('error', reject);
    });
}

function extractSpecs(text) {
    const specs = {};
    const lines = text.split('\n');

    for (let line of lines) {
        line = line.trim();
        if (!line) continue;

        // Impact sound insulation
        // e.g. Impact sound insulation EN ISO 717-2 dB 4
        if (/Impact sound insulation|Acoustic insulation|Zvučna izolacija/i.test(line)) {
            const match = line.match(/dB\s*(\d+(?:[\.,]\d+)?)/i);
            if (match) specs.Acoustics = '-' + match[1].replace(',', '.') + ' dB';
        }

        // Thickness
        // e.g. Total Thickness EN ISO 24346  mm 4,5
        if (/Total Thickness|Overall thickness|Ukupna debljina/i.test(line)) {
            const match = line.match(/mm\s*(\d+(?:[\.,]\d+)?)/i);
            if (match) specs.Thickness = match[1].replace(',', '.') + ' mm';
        }

        // Weight
        // e.g. Weight EN ISO 23997  g/sqm 7118
        if (/Weight|Total weight|Mass|Ukupna težina/i.test(line)) {
            const match = line.match(/(?:g\/sqm|g\/m²|kg\/m²|g\/m2)\s*(\d+(?:[\.,]\d+)?)/i);
            if (match) specs.Weight = match[1].replace(',', '.') + ' g/m²';
        }
    }

    return specs;
}

async function run() {
    const docs = JSON.parse(fs.readFileSync(DOCS_INDEX, 'utf-8'));
    const parsedCache = {}; // slug -> specs

    console.log("Analyzing PDFs from documents_index.json...");

    for (const type in docs) {
        for (const slug in docs[type]) {
            const items = docs[type][slug];
            const techSheet = items.find(i =>
                i.title.toLowerCase().includes('technical') ||
                i.title.toLowerCase().includes('tehnički') ||
                i.title.toLowerCase().includes('datasheet')
            );

            if (techSheet && techSheet.url) {
                console.log(`[${slug}] Downloading ${techSheet.url.substring(0, 50)}...`);
                let url = techSheet.url;
                if (url.startsWith('/')) {
                    // Local file, assuming domain
                    url = "https://www.podovi.online" + url;
                    // But actually wait, if it's local, we can read it directly from public
                    const localPath = path.join(__dirname, '../public', techSheet.url);
                    if (fs.existsSync(localPath)) {
                        console.log(`  -> Reading local: ${localPath}`);
                        try {
                            const buffer = fs.readFileSync(localPath);
                            const data = await pdf(buffer);
                            const specs = extractSpecs(data.text);
                            if (Object.keys(specs).length > 0) {
                                console.log(`  -> Extracted:`, specs);
                                parsedCache[slug] = specs;
                            }
                        } catch (e) {
                            console.error(`  -> Failed: ${e.message}`);
                        }
                        continue;
                    } else {
                        console.log(`  -> Local missing, skipping...`);
                        continue;
                    }
                }

                try {
                    const buffer = await downloadBuffer(url);
                    const data = await pdf(buffer);
                    const specs = extractSpecs(data.text);
                    if (Object.keys(specs).length > 0) {
                        console.log(`  -> Extracted:`, specs);
                        parsedCache[slug] = specs;
                    }
                } catch (e) {
                    console.error(`  -> Failed string: ${e.message}`);
                }
            }
        }
    }

    console.log(`\nFound specs for ${Object.keys(parsedCache).length} collections.`);

    if (Object.keys(parsedCache).length === 0) return;

    console.log("\nUpdating local JSON databases...");

    let totalUpdated = 0;

    for (const jsonFile of TARGET_JSON_FILES) {
        if (!fs.existsSync(jsonFile)) continue;

        let changed = false;
        const data = JSON.parse(fs.readFileSync(jsonFile, 'utf-8'));

        // Structure is either { collections: [] } or { colors: [] }
        if (Array.isArray(data.collections)) {
            for (const coll of data.collections) {
                const slug = coll.slug.replace(/^gerflor-/, '');
                if (parsedCache[slug]) {
                    coll.characteristics = coll.characteristics || {};
                    if (parsedCache[slug].Thickness && !coll.characteristics['Ukupna debljina']) coll.characteristics['Ukupna debljina'] = parsedCache[slug].Thickness;
                    if (parsedCache[slug].Acoustics && !coll.characteristics['Akustika']) coll.characteristics['Akustika'] = parsedCache[slug].Acoustics;
                    if (parsedCache[slug].Weight && !coll.characteristics['Težina']) coll.characteristics['Težina'] = parsedCache[slug].Weight;
                    changed = true;
                    totalUpdated++;
                }
            }
        } else if (Array.isArray(data.colors)) {
            for (const color of data.colors) {
                const slug = (color.collection_slug || color.collection).replace(/^gerflor-/, '');
                if (parsedCache[slug]) {
                    color.characteristics = color.characteristics || {};
                    if (parsedCache[slug].Thickness && !color.characteristics['Ukupna debljina']) color.characteristics['Ukupna debljina'] = parsedCache[slug].Thickness;
                    if (parsedCache[slug].Acoustics && !color.characteristics['Akustika']) color.characteristics['Akustika'] = parsedCache[slug].Acoustics;
                    if (parsedCache[slug].Weight && !color.characteristics['Težina']) color.characteristics['Težina'] = parsedCache[slug].Weight;
                    changed = true;
                }
            }
        }

        if (changed) {
            fs.writeFileSync(jsonFile, JSON.stringify(data, null, 4));
            console.log(`✅ Updated ${path.basename(jsonFile)}`);
        }
    }

    console.log(`Process complete. Updated ${totalUpdated} collections/colors.`);
}

run();
