const https = require('https');
const vm = require('vm');

const url = 'https://www.tarkett.rs/sr_RS/kolekcija-C002662-privilege';

https.get(url, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        const startMarker = '<script>window.__NUXT__=';
        const startIdx = data.indexOf(startMarker);
        if (startIdx !== -1) {
            const scriptStart = startIdx + startMarker.length - 'window.__NUXT__='.length;
            const scriptEnd = data.indexOf('</script>', scriptStart);
            const scriptContent = data.substring(scriptStart + 8, scriptEnd);

            const sandbox = { window: {}, location: {} };
            vm.createContext(sandbox);
            vm.runInContext('window.__NUXT__=' + scriptContent.replace('window.__NUXT__=', '') + ';', sandbox);

            const nuxtData = sandbox.window.__NUXT__;
            // Dump the item structure
            if (nuxtData.state && nuxtData.state.collectionProductPage && nuxtData.state.collectionProductPage.item) {
                console.log(JSON.stringify(nuxtData.state.collectionProductPage.item, null, 2));
            } else {
                console.log("Item not found in state");
                console.log(Object.keys(nuxtData.state || {}));
            }
        }
    });
});
