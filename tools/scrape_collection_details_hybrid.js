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
            let item = {};

            // 1. Try Nuxt
            const startMarker = '<script>window.__NUXT__=';
            const startIdx = html.indexOf(startMarker);
            if (startIdx !== -1) {
                const scriptStart = startIdx + startMarker.length - 'window.__NUXT__='.length;
                const scriptEnd = html.indexOf('</script>', scriptStart);
                const scriptContent = html.substring(scriptStart + 8, scriptEnd);

                const sandbox = { window: {}, location: {} };
                vm.createContext(sandbox);
                try {
                    vm.runInContext('window.__NUXT__=' + scriptContent.replace('window.__NUXT__=', '') + ';', sandbox);
                    if (sandbox.window.__NUXT__ && sandbox.window.__NUXT__.state && sandbox.window.__NUXT__.state.collectionProductPage) {
                        item = sandbox.window.__NUXT__.state.collectionProductPage.item || {};
                    }
                } catch (e) { console.log('Nuxt parsing error'); }
            }

            // 2. Fallbacks
            let description = item.description || item.description_stripped || '';
            let image = item.visual ? `https://media.tarkett-image.com/large/${item.visual}` : '';
            let features = item.key_features || null;

            // HTML Regex Fallbacks
            if (!image) {
                const imgMatch = html.match(/class="hero-image__image"\s+src="([^"]+)"/);
                if (imgMatch) image = imgMatch[1];
            }
            // Use flexible regex for og:image
            if (!image) {
                const imgMatch2 = html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]+)"/);
                if (imgMatch2) image = imgMatch2[1];
            }

            if (!description) {
                const descMatch = html.match(/<div class="hero-box__textbox">([\s\S]*?)<\/div>/);
                if (descMatch) {
                    description = descMatch[1]
                        .replace(/<h1.*?>.*?<\/h1>/, '')
                        .replace(/^\s+|\s+$/g, '');
                }
            }

            // Allow manual override for Allegro since user provided the text
            if (c.name === 'Allegro') {
                description = "Kolekcija Allegro parketa donosi spoj boja i uzoraka gde je svaka daska savršeno usklađena. Jedinstveni godovi i tonovi drveta stvaraju harmonične mozaike koji unose život i dinamiku u prostor.\n\nNijanse parketa se kreću od dubokih tonova siene do suptilnih svetlih nijansi. Raznovrsnost boja i tekstura stvara skladan i ujedinjen estetski doživljaj, pretvarajući prostor u elegantno okruženje.\n\nVelike dimenzije dasaka parketa (širina 194 mm, dužina 2283 mm) i T-lock sistem zaključavanja omogućavaju jednostavnu i brzu instalaciju. Površina parketa, brušena i mat lakirana, naglašava prirodni karakter drveta.";
            }

            if (!features) {
                const featuresMatch = html.match(/Ključne karakteristike[\s\S]*?<ul>([\s\S]*?)<\/ul>/i);
                if (featuresMatch) {
                    features = `<ul>${featuresMatch[1]}</ul>`;
                }
            }

            results.push({
                name: c.name,
                sku: `PARKET-${c.name.toUpperCase().replace(/ /g, '-').replace('&', 'AND')}`,
                description: description,
                image: image,
                features: features
            });

        } catch (e) {
            console.error(`Error ${c.name}: ${e.message}`);
        }
    }

    console.log(JSON.stringify(results, null, 2));
}

run();
