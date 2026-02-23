/**
 * Add missing Gerflor collections to vinyl_colors_complete.json
 * Collections: Mipolam Evo (11 colors), Taralay Libertex (20 designs)
 * 
 * Usage: node tools/scrape_gerflor_missing.js
 */
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const DATA_FILE = path.join(__dirname, '../public/data/vinyl_colors_complete.json');
const IMAGES_DIR = path.join(__dirname, '../public/images/products/vinyl');

// ============ MIPOLAM EVO DATA ============
const MIPOLAM_EVO = {
    name: "Mipolam Evo",
    slug: "mipolam-evo",
    url: "https://www.gerflor-cee.com/products/mipolam-evo",
    colors: [
        { code: "9005", name: "VISBY" },
        { code: "9006", name: "STOCKHOLM" },
        { code: "9029", name: "TROMSO" },
        { code: "9030", name: "UPPSALA" },
        { code: "9031", name: "KIRUNA" },
        { code: "9032", name: "COPENHAGEN" },
        { code: "9044", name: "BERGEN" },
        { code: "9045", name: "GELLO" },
        { code: "9050", name: "MALMO" },
        { code: "9055", name: "GOTEBORG" },
        { code: "9063", name: "NARVIK" },
    ],
    characteristics: {
        "Tip": "Homogeni pod (bez PVC-a)",
        "Format": "Rolna (2m x 20m)",
        "Ukupna debljina": "2.0 mm",
        "Sloj habanja": "Kroz celu debljinu",
        "Površinska obrada": "Evercare™",
        "Klasa upotrebe": "Klasa 34/43",
        "Vatrostojnost": "Bfl-s1",
        "Tip instalacije": "Lepljenje",
        "Akustika": "Bez podloge",
        "Materijal": "Bez PVC-a i plastifikatora"
    },
    description: `Proizvod:\nGerflor Mipolam Evo — prvi homogeni pod bez PVC-a sa Evercare™ površinskom obradom.\nKompaktan, jednoslojan dizajn potpuno bez PVC-a i plastifikatora, idealan za okruženja sa visokim ekološkim zahtevima.\n\nKarakteristike:\nBez PVC-a i plastifikatora — potpuno ekološki prihvatljiv materijal.\n2.0mm ukupna debljina sa slojem habanja kroz celu dubinu.\nEvercare™ površinska obrada — doživotno bez voska i poliranja.\nTVOC emisije manje od 10µg/m³ nakon 28 dana.\nKlasa upotrebe 34/43 — pogodan za najzahtevnije komercijalne prostore.\n\nPrimena:\nBolnice i zdravstvene ustanove.\nŠkole i obrazovne ustanove.\nLaboratorije.\nKancelarije sa visokim ekološkim standardima.\n\nOdrživost:\nBez PVC-a.\n100% reciklabilno po završetku životnog veka.\nNiske VOC emisije — A+ ocena.`
};

// ============ TARALAY LIBERTEX DATA ============
const TARALAY_LIBERTEX = {
    name: "Taralay Libertex",
    slug: "taralay-libertex",
    url: "https://www.gerflor-cee.com/products/taralay-libertex",
    colors: [
        { code: "0720", name: "PURE OAK CLEAR" },
        { code: "1751", name: "PURE OAK GREY" },
        { code: "0179", name: "VALENCAY PATINE" },
        { code: "0368", name: "VALENCAY BLOND" },
        { code: "0636", name: "ESTEREL BLOND" },
        { code: "0797", name: "HABANA IVORY" },
        { code: "0828", name: "HABANA BEIGE" },
        { code: "2225", name: "ROUGH LIGHT GREY" },
        { code: "2226", name: "CORDOBA BLACK & WHITE" },
        { code: "2284", name: "CHICAGO STORM" },
        { code: "2366", name: "CHICAGO SAND" },
        { code: "2413", name: "COTTAGE BLOND" },
        { code: "2415", name: "COTTAGE BROWN" },
        { code: "2448", name: "ESQUISSE GREY" },
        { code: "2560", name: "ESQUISSE BEIGE" },
        { code: "2757", name: "WOVEN LIGHT GREY" },
        { code: "2916", name: "PURE OAK BROWN" },
        { code: "2917", name: "ESTEREL GREY" },
        { code: "2918", name: "CORDOBA DARK GREY" },
        { code: "2919", name: "ROUGH DARK GREY" },
    ],
    characteristics: {
        "Tip": "Heterogeni vinil",
        "Format": "Rolna (2m i 4m širina)",
        "Ukupna debljina": "3.65 mm",
        "Sloj habanja": "0.70 mm",
        "Površinska obrada": "Protecsol®",
        "Klasa upotrebe": "Klasa 34/43",
        "Vatrostojnost": "Bfl-s1",
        "Tip instalacije": "Bez lepka (Gripman podloga)",
        "Akustika": "-19 dB",
        "Podloga": "Tekstilna (Gripman)"
    },
    description: `Proizvod:\nGerflor Taralay Libertex — heterogeni vinil pod sa tekstilnom podlogom za brzu ugradnju bez lepka.\nIdealan za renovacije jer se polaže direktno preko postojećeg poda bez potrebe za lepkom.\n\nKarakteristike:\n3.65mm ukupna debljina sa 0.70mm habajućim slojem.\nGripman tekstilna podloga omogućava polaganje bez lepka.\nProtecsol® površinska obrada za lako održavanje.\nAkustična izolacija -19 dB za tišinu u prostoru.\nDostupan u širinama od 2m i 4m.\n\nPrimena:\nKomercijalni prostori sa potrebom za brzom renovacijom.\nKancelarije i poslovni prostori.\nHotelski i ugostiteljski objekti.\nStambeni prostori — laka ugradnja i zamena.\nObrazovne ustanove.\n\nOdrživost:\nBez ftalata.\n100% reciklabilno po završetku životnog veka.\nNiske VOC emisije — A+ ocena.`
};

// ============ IMAGE DOWNLOAD HELPER ============
function downloadImage(url, filepath) {
    return new Promise((resolve, reject) => {
        const dir = path.dirname(filepath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

        if (fs.existsSync(filepath)) {
            console.log(`  [SKIP] Already exists: ${path.basename(filepath)}`);
            resolve(true);
            return;
        }

        const protocol = url.startsWith('https') ? https : http;
        const request = protocol.get(url, (res) => {
            if (res.statusCode === 301 || res.statusCode === 302) {
                downloadImage(res.headers.location, filepath).then(resolve).catch(reject);
                return;
            }
            if (res.statusCode !== 200) {
                console.log(`  [WARN] HTTP ${res.statusCode} for ${url}`);
                resolve(false);
                return;
            }
            const file = fs.createWriteStream(filepath);
            res.pipe(file);
            file.on('finish', () => {
                file.close();
                resolve(true);
            });
        });
        request.on('error', (err) => {
            console.log(`  [ERROR] Download failed: ${err.message}`);
            resolve(false);
        });
        request.setTimeout(10000, () => {
            request.destroy();
            resolve(false);
        });
    });
}

// ============ BUILD COLLECTION ENTRY ============
function buildCollectionEntry(collection) {
    const colors = collection.colors.map(c => {
        const nameLower = c.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        const imageFilename = `${c.code}-${nameLower}.jpg`;
        const localImagePath = `/images/products/vinyl/${collection.slug}/${imageFilename}`;

        return {
            code: c.code,
            name: c.name,
            sku: null,
            href: `${collection.url}-${c.code}-${nameLower}`,
            collection_slug: collection.slug,
            image: localImagePath,
            description: collection.description,
            characteristics: { ...collection.characteristics }
        };
    });

    return {
        name: collection.name,
        slug: collection.slug,
        url: collection.url,
        colorCount: colors.length,
        colors
    };
}

// ============ DOWNLOAD IMAGES FROM GERFLOR ============
async function downloadImages(collection) {
    const collDir = path.join(IMAGES_DIR, collection.slug);
    if (!fs.existsSync(collDir)) fs.mkdirSync(collDir, { recursive: true });

    console.log(`\nDownloading images for ${collection.name}...`);

    // Gerflor image URL patterns - try multiple patterns
    for (const color of collection.colors) {
        const nameLower = color.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        const filename = `${color.code}-${nameLower}.jpg`;
        const filepath = path.join(collDir, filename);

        // Try common Gerflor image URL patterns
        const urlPatterns = [
            `https://media.gerflor.com/pam/1/${collection.slug}/${color.code}-${nameLower}/original/${collection.slug}-${color.code}-${nameLower}.jpg`,
            `https://www.gerflor-cee.com/sites/default/files/products/${collection.slug}/${color.code}.jpg`,
            `https://media.gerflor.com/pam/1/gerflor-${collection.slug}/${color.code}/big.jpg`,
        ];

        let downloaded = false;
        for (const url of urlPatterns) {
            const result = await downloadImage(url, filepath);
            if (result && fs.existsSync(filepath) && fs.statSync(filepath).size > 1000) {
                console.log(`  [OK] ${filename}`);
                downloaded = true;
                break;
            }
            // Remove if it was created empty/invalid
            if (fs.existsSync(filepath) && fs.statSync(filepath).size < 1000) {
                fs.unlinkSync(filepath);
            }
        }

        if (!downloaded) {
            console.log(`  [MISS] ${filename} — will use Gerflor external URL as fallback`);
        }
    }
}

// ============ MAIN ============
async function main() {
    console.log('=== Adding Missing Gerflor Collections ===\n');

    // Load existing data
    const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    console.log(`Current collections: ${data.collections.length}`);
    console.log(`Current total colors: ${data.totalColors}\n`);

    // Check if collections already exist
    const existingSlugs = data.collections.map(c => c.slug);

    // Build new collection entries
    const newCollections = [];

    if (!existingSlugs.includes('mipolam-evo')) {
        const evoEntry = buildCollectionEntry(MIPOLAM_EVO);
        newCollections.push(evoEntry);
        console.log(`[NEW] Mipolam Evo — ${evoEntry.colorCount} colors`);
    } else {
        console.log('[SKIP] Mipolam Evo already exists');
    }

    if (!existingSlugs.includes('taralay-libertex')) {
        const libertexEntry = buildCollectionEntry(TARALAY_LIBERTEX);
        newCollections.push(libertexEntry);
        console.log(`[NEW] Taralay Libertex — ${libertexEntry.colorCount} colors`);
    } else {
        console.log('[SKIP] Taralay Libertex already exists');
    }

    if (newCollections.length === 0) {
        console.log('\nNo new collections to add. Already up to date!');
        return;
    }

    // Try to download images (best effort)
    for (const coll of [MIPOLAM_EVO, TARALAY_LIBERTEX]) {
        if (!existingSlugs.includes(coll.slug)) {
            await downloadImages(coll);
        }
    }

    // Add to data
    data.collections.push(...newCollections);
    const addedColors = newCollections.reduce((sum, c) => sum + c.colorCount, 0);
    data.totalColors += addedColors;

    // Save updated data
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    console.log(`\n=== DONE ===`);
    console.log(`Added ${newCollections.length} collections with ${addedColors} colors`);
    console.log(`New total: ${data.collections.length} collections, ${data.totalColors} colors`);
}

main().catch(console.error);
