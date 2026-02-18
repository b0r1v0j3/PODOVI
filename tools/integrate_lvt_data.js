const fs = require('fs');
const path = require('path');

const lvtDataPath = path.join(__dirname, 'tarkett_lvt_spc.json');
const outputPath = path.join(__dirname, '../public/data/tarkett_lvt_products.json');

const products = JSON.parse(fs.readFileSync(lvtDataPath, 'utf8'));

const integratedProducts = products.map(p => {
    // Generate valid slug from name
    const slug = p.name.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

    // Determine sub-category based on collection or description
    let subCategory = 'LVT';
    if (p.description.toLowerCase().includes('spc') || p.name.toLowerCase().includes('spc')) {
        subCategory = 'SPC';
    } else if (p.description.toLowerCase().includes('loose-lay')) {
        subCategory = 'LVT Loose-Lay';
    } else if (p.description.toLowerCase().includes('click')) {
        subCategory = 'LVT Click';
    }

    return {
        id: slug,
        name: p.name,
        description: p.description,
        type: subCategory,
        category: 'lvt', // Main category for all
        images: p.images,
        specs: p.specifications,
        brandId: 'tarkett', // Static for now
        meta: {
            sku: p.sku,
            originalUrl: p.url,
            documents: p.documents
        }
    };
});

fs.writeFileSync(outputPath, JSON.stringify(integratedProducts, null, 2));
console.log(`Integrated ${integratedProducts.length} products.`);
