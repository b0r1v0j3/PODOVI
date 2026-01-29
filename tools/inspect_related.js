const fs = require('fs');
const path = 'd:/PODOVI/SAJT/tmp/nuxt_data_resolved.json';

try {
    const data = JSON.parse(fs.readFileSync(path, 'utf8'));
    const item = data.state.collectionProductPage.item;

    if (item) {
        console.log("Related Collections:", JSON.stringify(item.collection_related_offer_collections, null, 2));
        console.log("Matching Styles:", JSON.stringify(item.collection_matching_styles, null, 2));
        console.log("Segment Group:", JSON.stringify(data.state.collectionProductPage.segmentGroup, null, 2)); // Guessing key
    }
} catch (e) {
    console.error(e);
}
