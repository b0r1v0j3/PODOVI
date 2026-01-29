const fs = require('fs');
const path = 'd:/PODOVI/SAJT/tmp/nuxt_data_resolved.json';

try {
    const data = JSON.parse(fs.readFileSync(path, 'utf8'));
    const state = data.state;
    const cp = state.collectionProductPage;

    if (cp) {
        console.log("Keys in collectionProductPage:", Object.keys(cp));
        if (cp.item) {
            console.log("Keys in collectionProductPage.item:", Object.keys(cp.item));
        }
        // Check if designs is somewhere else
        // Maybe check keys of `state` again?
        console.log("Keys in state:", Object.keys(state));
    } else {
        console.log("collectionProductPage is null");
    }

} catch (e) {
    console.error(e);
}
