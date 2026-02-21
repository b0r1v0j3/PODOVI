const fs = require('fs');
const path = require('path');

const docsPath = path.join(__dirname, 'tarkett_parket_docs.json');
const productsPath = path.join(__dirname, '..', 'lib', 'data', 'tarkett-products.ts');

const docs = JSON.parse(fs.readFileSync(docsPath, 'utf8'));
let tsContent = fs.readFileSync(productsPath, 'utf8');

let updatedCount = 0;

for (const [sku, productDocs] of Object.entries(docs)) {
    // Only inject if there actually are documents
    if (!productDocs || productDocs.length === 0) continue;

    const formattedDocs = "    \"documents\": " + JSON.stringify(productDocs, null, 0).replace(/"(title|url|type)":/g, "$1:") + ",\n";

    // Find product block by sku. Looks like: "sku": "550049131",
    const skuRegex = new RegExp(`"sku":\\s*"${sku}"[\\s\\S]*?"price":`, 'g');

    tsContent = tsContent.replace(skuRegex, (match) => {
        // If it already has documents, don't inject
        if (match.includes('"documents":')) return match;

        updatedCount++;
        // insert the documents array right before the "price":
        return match.replace(/("price":)/, formattedDocs + "    $1");
    });
}

// Special case for collection overarching products (e.g. "id": "parket-salsa")
// since their SKUs might just be "PARKET-SALSA" which doesn't match the design SKUs.
// We'll give each collection the docs of its first design.
const collectionDocsMap = {
    'PARKET-ALLEGRO': Object.values(docs).find(d => d.some(x => x.url.includes('Allegro'))),
    'PARKET-PRIVILEGE': Object.values(docs).find(d => d.some(x => x.url.includes('Privilege'))),
    'PARKET-RUMBA': Object.values(docs).find(d => d.some(x => x.url.includes('Rumba'))),
    'PARKET-SALSA-ART': Object.values(docs).find(d => d.some(x => x.url.includes('Art'))),
};

for (const [colSku, colDocs] of Object.entries(collectionDocsMap)) {
    if (!colDocs || colDocs.length === 0) continue;

    const formattedDocs = "    \"documents\": " + JSON.stringify(colDocs, null, 0).replace(/"(title|url|type)":/g, "$1:") + ",\n";
    const skuRegex = new RegExp(`"sku":\\s*"${colSku}"[\\s\\S]*?"price":`, 'g');

    tsContent = tsContent.replace(skuRegex, (match) => {
        if (match.includes('"documents":')) return match; // already has docs somehow
        updatedCount++;
        return match.replace(/("price":)/, formattedDocs + "    $1");
    });
}

fs.writeFileSync(productsPath, tsContent);
console.log(`Updated documents for ${updatedCount} products.`);
