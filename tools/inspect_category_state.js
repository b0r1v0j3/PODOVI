const fs = require('fs');
const vm = require('vm');

const path = 'd:/PODOVI/SAJT/tmp/category_parket.html';

try {
    const content = fs.readFileSync(path, 'utf8');

    const startMarker = '<script>window.__NUXT__=';
    const endMarker = '</script>';
    const startIdx = content.indexOf(startMarker);

    if (startIdx === -1) {
        console.log("No Nuxt state found.");
        process.exit(1);
    }

    const scriptStart = startIdx + startMarker.length - 'window.__NUXT__='.length;
    const scriptEnd = content.indexOf(endMarker, scriptStart);
    const scriptContent = content.substring(scriptStart + 8, scriptEnd);

    const sandbox = { window: {}, location: {} };
    vm.createContext(sandbox);
    vm.runInContext('window.__NUXT__=' + scriptContent.replace('window.__NUXT__=', '') + ';', sandbox);

    const data = sandbox.window.__NUXT__;

    // Inspect data for collections
    // Likely in state.categoryPage or similar

    // Let's dump keys just in case structure differs
    // console.log("State keys:", Object.keys(data.state));

    // Check for expected path (guesswork based on product page)
    // Usually it is categoryPage -> items or collections

    // Let's recursively search for "Allegro" in the object to find the path?
    function search(obj, query, path = '') {
        if (!obj || typeof obj !== 'object') return;
        for (const k in obj) {
            if (typeof obj[k] === 'string' && obj[k].toLowerCase().includes(query)) {
                console.log(`Found '${query}' at ${path}.${k}: ${obj[k]}`);
            } else if (typeof obj[k] === 'object') {
                search(obj[k], query, `${path}.${k}`);
            }
        }
    }

    // search(data.state, 'allegro');

    // Try to find the main collection list
    // It might be under `listingPage` or `category`

    // Based on standard Tarkett logic I saw in other dumps:
    // state.listingPage.items maybe?

    // Let's just print a structure summary
    // console.log(JSON.stringify(data.state, (k,v) => k === 'fetch' ? undefined : v, 2).substring(0, 2000));

    const listing = data.state.listingPage;
    if (listing) {
        console.log("Found listingPage.");
        if (listing.filter && listing.filter.collections) {
            console.log(`Found ${listing.filter.collections.length} collections in filter.`);
            listing.filter.collections.forEach(c => console.log(`${c.label} : ${c.code} : ${c.url}`));
        }

        if (listing.items) {
            console.log(`Found ${listing.items.length} items in listingPage.`);
        }
    } else {
        console.log("No listingPage. Searching...");
        search(data.state, 'allegro');
    }

} catch (e) {
    console.error(e);
}
