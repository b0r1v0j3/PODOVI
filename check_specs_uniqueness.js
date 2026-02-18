
const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, 'public/data/tarkett_lvt_products.json');
const rawData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

const essenceProds = rawData.filter(p => p.collection === 'essence' || p.id.includes('essence'));

console.log(`Found ${essenceProds.length} Essence products.`);

// Check if specs are identical
const specsSet = new Set();
essenceProds.forEach(p => {
    if (p.specs) {
        specsSet.add(JSON.stringify(p.specs));
    }
});

console.log(`Unique specs count: ${specsSet.size}`);

if (essenceProds.length > 0) {
    console.log('Sample 1 Name:', essenceProds[0].name);
    console.log('Sample 1 Specs Pattern:', essenceProds[0].specs?.pattern);

    if (essenceProds.length > 1) {
        console.log('Sample 2 Name:', essenceProds[1].name);
        console.log('Sample 2 Specs Pattern:', essenceProds[1].specs?.pattern);
    }
}
