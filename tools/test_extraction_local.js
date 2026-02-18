const fs = require('fs');
const path = require('path');

const dumpPath = path.join(__dirname, 'mist1_dump.json');
const productJson = JSON.parse(fs.readFileSync(dumpPath, 'utf8'));

const mediaBaseUri = 'https://media.tarkett-image.com';
const design = { product_name: "MIST 1", product_design_key: "mist-1", productUrl: "test-url" };

const item = productJson.item; // Detailed product item
const collection = item.product_collection || {};
const collectionDefaultSku = collection.collection_default_sku || {};
const specs = collectionDefaultSku.sku_technical_caracteristics || {};
const rawSpecs = collectionDefaultSku.sku_raw_technical_characteristics || {};

// Robust Field Extraction (Corrected)
const name = item.name || item.product_name || design.product_name;
const sku = item.sku_id || item.product_sku || collectionDefaultSku.sku_id || design.product_design_key;

// Helper to strip HTML
const stripHtml = (html) => html ? html.replace(/<[^>]*>?/gm, '') : '';

let rawDesc =
    item.description ||
    collection.description_stripped ||
    collection.description ||
    item.product_description ||
    collectionDefaultSku.sku_pattern_description ||
    '';

const description = stripHtml(rawDesc).replace(/[\n\r]+/g, ' ').trim();

// Construct final product object
const productData = {
    name: name,
    sku: sku,
    url: design.productUrl,
    description: description,
    images: [],
    specifications: {},
    documents: []
};

// Process Images (Current Logic)
const potentialImages = [
    item.sku_hero,
    item.product_thumbnail,
    item.thumbnail_image,
    collectionDefaultSku.sku_hero,
    collectionDefaultSku.thumbnail_image,
    collectionDefaultSku.sku_thumbnail
];

potentialImages.forEach(img => {
    if (img && typeof img === 'string') {
        const imgUrl = `${mediaBaseUri}/large/${img}`;
        if (!productData.images.includes(imgUrl)) {
            productData.images.push(imgUrl);
        }
    }
});

// Collection Gallery
if (collection.collection_assets) {
    collection.collection_assets.forEach(asset => {
        // Added COVER role
        if ((asset.document_role === 'GALLERY' || asset.document_role === 'COVER') && asset.document_asset_url) {
            const imgUrl = `${mediaBaseUri}/large/${asset.document_asset_url}`;
            if (!productData.images.includes(imgUrl)) {
                productData.images.push(imgUrl);
            }
        }
    });
}

console.log("--- Extracted Data ---");
console.log("Name:", productData.name);
console.log("Description:", productData.description);
console.log("Images:", productData.images);
