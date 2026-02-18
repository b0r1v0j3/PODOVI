
const fs = require('fs');
const path = require('path');
const { getTarkettLVTCollections } = require('./lib/utils/productDataLoader'); // This won't work directly because it's TS

// Let's emulate the logic instead
const dataPath = path.join(__dirname, 'public/data/tarkett_lvt_products.json');
const rawData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

const products = rawData.map(p => {
    const images = (p.images || []).map((img, idx) => {
        if (typeof img === 'string') {
            return { id: `${p.id}-img-${idx}`, url: img, alt: p.name || '', isPrimary: idx === 0, order: idx };
        }
        return img;
    });
    return { ...p, images };
});

const collectionsMap = new Map();
products.forEach(p => {
    if (!p.collection) return;
    if (!collectionsMap.has(p.collection)) {
        collectionsMap.set(p.collection, []);
    }
    collectionsMap.get(p.collection).push(p);
});

const essenceItems = collectionsMap.get('essence');
if (essenceItems) {
    const first = essenceItems[0];
    const primaryImage = first.images.find(img => img.isPrimary) || first.images[0];
    console.log('Essence Collection Image:', primaryImage);
} else {
    console.log('Essence collection not found');
}
