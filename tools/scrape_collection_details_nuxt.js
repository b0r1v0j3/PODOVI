const https = require('https');
const vm = require('vm');

const collections = [
    { name: 'Allegro', url: 'https://www.tarkett.rs/sr_RS/kolekcija-C002886-allegro' },
    { name: 'Privilege', url: 'https://www.tarkett.rs/sr_RS/kolekcija-C002662-privilege' },
    { name: 'Privilege Waltz', url: 'https://www.tarkett.rs/sr_RS/kolekcija-C002975-privilege-waltz' },
    { name: 'Rumba', url: 'https://www.tarkett.rs/sr_RS/kolekcija-C000973-rumba' },
    { name: 'Salsa', url: 'https://www.tarkett.rs/sr_RS/kolekcija-C000964-salsa' },
    { name: 'Salsa Art', url: 'https://www.tarkett.rs/sr_RS/kolekcija-C000966-salsa-art' },
    { name: 'Salsa Premium', url: 'https://www.tarkett.rs/sr_RS/kolekcija-C000965-salsa-premium' },
    { name: 'Sommer Europarquet', url: 'https://www.tarkett.rs/sr_RS/kolekcija-C002946-sommer-europarquet' },
    { name: 'Step XL & L', url: 'https://www.tarkett.rs/sr_RS/kolekcija-C000975-step-xl-l' },
    { name: 'Tango', url: 'https://www.tarkett.rs/sr_RS/kolekcija-C000969-tango' },
    { name: 'Tango Classic', url: 'https://www.tarkett.rs/sr_RS/kolekcija-C000972-tango-classic' }
];

async function fetchUrl(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data));
        }).on('error', reject);
    });
}

async function run() {
    const results = [];
    for (const c of collections) {
        console.log(`Scraping ${c.name}...`);
        try {
            const html = await fetchUrl(c.url);

            // Extract Nuxt state
            const startMarker = '<script>window.__NUXT__=';
            const endMarker = '</script>';
            const startIdx = html.indexOf(startMarker);

            if (startIdx !== -1) {
                const scriptStart = startIdx + startMarker.length - 'window.__NUXT__='.length;
                const scriptEnd = html.indexOf(endMarker, scriptStart);
                const scriptContent = html.substring(scriptStart + 8, scriptEnd);

                const sandbox = { window: {}, location: {} };
                vm.createContext(sandbox);
                vm.runInContext('window.__NUXT__=' + scriptContent.replace('window.__NUXT__=', '') + ';', sandbox);

                const data = sandbox.window.__NUXT__;

                // Navigate state to find details
                // state.collectionProductPage.item.description (HTML)
                // state.collectionProductPage.item.image (Url)
                // state.collectionProductPage.item.specifications (Array)

                if (data && data.state && data.state.collectionProductPage && data.state.collectionProductPage.item) {
                    const item = data.state.collectionProductPage.item;

                    // Helper to strip HTML tags if needed, or keep them if layout supports it
                    // User provided plain text, so let's strip tags for description but user said "image 3" which implies formatting exists.
                    // The user text: "Kolekcija Allegro parketa donosi..."
                    // I will capture the full description.

                    results.push({
                        name: c.name,
                        sku: `PARKET-${c.name.toUpperCase().replace(/ /g, '-').replace('&', 'AND')}`,
                        description: item.description || '', // often contains HTML
                        image: item.visual ? `https://media.tarkett-image.com/large/${item.visual}` : '',
                        features: item.key_features || [], // Array of specs?
                        specs: item.technical_characteristics || [] // Technical table
                    });
                } else {
                    console.log(`__NUXT__ found but structure invalid for ${c.name}`);
                }
            } else {
                console.log(`No __NUXT__ found for ${c.name}`);
            }

        } catch (e) {
            console.error(`Error ${c.name}: ${e.message}`);
        }
    }

    // Print as JSON for consumption
    console.log(JSON.stringify(results, null, 2));
}

run();
