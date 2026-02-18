const fs = require('fs');
const path = require('path');

const lvtDataPath = path.join(__dirname, 'tarkett_lvt_spc.json');
const outputPath = path.join(__dirname, '../public/data/tarkett_lvt_products.json');

const products = JSON.parse(fs.readFileSync(lvtDataPath, 'utf8'));

function slugify(str) {
    return str.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

// Extract collection name from URL: /kolekcija-C000770-id-inspiration-55/design-name
function extractCollection(url) {
    const m = (url || '').match(/kolekcija-[A-Z0-9]+-(.+?)\//);
    return m ? m[1] : '';
}

const integratedProducts = products.map(p => {
    // Determine sub-category
    let subCategory = 'LVT';
    const descLower = (p.description || '').toLowerCase();
    const nameLower = (p.name || '').toLowerCase();
    if (descLower.includes('spc') || nameLower.includes('spc')) {
        subCategory = 'SPC';
    } else if (descLower.includes('loose-lay')) {
        subCategory = 'LVT Loose-Lay';
    } else if (descLower.includes('click')) {
        subCategory = 'LVT Click';
    }

    // Build slug: collection-design (e.g., "id-inspiration-30-beton-grey")
    const collection = extractCollection(p.url);
    const designSlug = slugify(p.name);
    const slug = collection ? `${collection}-${designSlug}` : designSlug;

    return {
        id: slug,
        name: p.name,
        collection: collection,
        description: p.description,
        type: subCategory,
        category: 'lvt',
        images: p.images,
        specs: p.specifications,
        brandId: 'tarkett',
        meta: {
            sku: p.sku,
            originalUrl: p.url,
            documents: p.documents
        }
    };
});

// Safety net: dedup any remaining collisions with counter
const slugCount = {};
integratedProducts.forEach(p => {
    if (slugCount[p.id]) {
        slugCount[p.id]++;
        p.id = `${p.id}-${slugCount[p.id]}`;
    } else {
        slugCount[p.id] = 1;
    }
});

const dupeCount = integratedProducts.filter(p => /-\d+$/.test(p.id)).length;
fs.writeFileSync(outputPath, JSON.stringify(integratedProducts, null, 2));
console.log(`Integrated ${integratedProducts.length} products (${Object.keys(slugCount).length} unique slugs, ${dupeCount} needed counter).`);

