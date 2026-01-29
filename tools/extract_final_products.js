const fs = require('fs');
const pathArg = process.argv[2];

if (!pathArg) {
    console.error("Usage: node extract_final_products.js <jsonPath> [tsOutputPath]");
    process.exit(1);
}

const outputPath = process.argv[3]; // Optional, if not provided just print JSON

try {
    const data = JSON.parse(fs.readFileSync(pathArg, 'utf8'));

    // Path: data.state.collectionProductPage.item.designs
    const state = data.state;
    if (!state) { console.log("No state"); process.exit(1); }

    const cp = state.collectionProductPage;
    if (!cp) { console.log("No cp"); process.exit(1); }

    const item = cp.item;
    if (!item) { console.log("No item"); process.exit(1); }

    const designs = item.designs || [];
    // console.log(`Found ${designs.length} designs.`); // quiet down

    const products = designs.map(d => {
        // Construct product object
        const slug = d.product_name_slug;

        return {
            id: d.product_design_key || slug,
            name: d.product_name,
            slug: slug,
            sku: d.product_design_key,
            categoryId: '3', // Parket
            brandId: '3', // Tarkett
            description: d.product_design_key,
            image: d.product_thumbnail ? `https://media.tarkett-image.com/large/${d.product_thumbnail}` : '',
            price: 0,
            stock: 0
        };
    });

    console.log(JSON.stringify(products, null, 2));

    if (outputPath) {
        // Append or write? 
        // The current script overwrote. 
        // We should probably handle aggregation in a separate step or script.
        // But for now, let's just print JSON and I will aggregate in shell or another script.
    }

} catch (e) {
    console.error(e);
}
