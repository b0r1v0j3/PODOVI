const fs = require('fs');
const path = 'd:/PODOVI/SAJT/tmp/debug-tarkett.html';

try {
    const content = fs.readFileSync(path, 'utf8');
    const designsMatch = content.match(/designs:\[(.*?)\]/);

    if (designsMatch) {
        const designsStr = designsMatch[1];
        const products = [];

        // Regex for the slug, which seems to start each object or at least be unique per product
        const slugRegex = /product_name_slug:"([^"]+)"/g;
        let match;

        while ((match = slugRegex.exec(designsStr)) !== null) {
            const slug = match[1];
            const startIndex = match.index;

            // Find the end used for this object context, to limit search? 
            // Effectively we can search forward until the next "product_name_slug" or just for the next occurrence of fields
            // But that might bleed into date.
            // Let's assume fields are relatively close.

            // We search specifically in the substring starting from this match
            const restStr = designsStr.substring(startIndex);

            // Find name
            const nameMatch = restStr.match(/product_name:"([^"]+)"/);
            // Find thumbnail
            const thumbMatch = restStr.match(/product_thumbnail:"([^"]+)"/);
            // Find ID
            const idMatch = restStr.match(/product_design_key:"([^"]+)"/);

            // We must be careful not to grab the name of the *next* product if this one is missing it.
            // But in this dataset, all products likely have names.
            // We can check the index of the name match to ensure it's not too far.

            let name = 'Unknown';
            if (nameMatch && nameMatch.index < 500) { // arbitrary limit to ensure we don't skip to next object
                name = nameMatch[1];
            }

            let thumbnail = null;
            if (thumbMatch && thumbMatch.index < 500) {
                thumbnail = thumbMatch[1];
            }

            let id = null;
            if (idMatch && idMatch.index < 500) {
                id = idMatch[1];
            }

            products.push({ slug, name, thumbnail, id });
        }

        console.log(`Found ${products.length} products.`);
        console.log(JSON.stringify(products, null, 2));

        fs.writeFileSync('d:/PODOVI/SAJT/tmp/extracted_products.json', JSON.stringify(products, null, 2));

    } else {
        console.log("Designs block NOT found.");
    }
} catch (e) {
    console.error("Error:", e);
}
