const https = require('https');

const baseUrl = 'https://www.tarkett.rs/sr_RS/kolekcija-';
const ids = [];
for (let i = 2880; i <= 2895; i++) {
    ids.push(`C00${i}`);
}

async function checkId(id) {
    return new Promise((resolve) => {
        const url = `${baseUrl}${id}-test`; // Suffix doesn't matter for status check usually, or it might?
        // Actually, Tarkett URLs are `kolekcija-ID-slug`. 
        // If I put wrong slug, it might 301 to correct slug or 404?
        // Let's try `kolekcija-ID` (no slug) or `kolekcija-ID-slug`.
        // Let's try to fetch `https://www.tarkett.rs/sr_RS/kolekcija-${id}` and see if it redirects to the full slug.

        // Wait, the previous successful fetch for Salsa was `kolekcija-C000964-salsa`.
        // If I omit the slug, does it work?

        const req = https.get(`https://www.tarkett.rs/sr_RS/kolekcija-${id}`, (res) => {
            // If 301/302, capture location
            if (res.statusCode >= 300 && res.statusCode < 400) {
                resolve({ id, status: res.statusCode, location: res.headers.location });
            } else {
                resolve({ id, status: res.statusCode });
            }
        });

        req.on('error', () => resolve({ id, status: 'error' }));
        req.end();
    });
}

async function run() {
    console.log("Scanning IDs C002880 to C002895...");
    for (const id of ids) {
        const result = await checkId(id);
        if (result.status !== 404) {
            console.log(`${result.id}: ${result.status} ${result.location || ''}`);
        }
    }
}

run();
