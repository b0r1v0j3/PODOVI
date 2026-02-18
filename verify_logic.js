
const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, 'public/data/tarkett_lvt_products.json');
const rawData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

console.log(`Loaded ${rawData.length} products.`);

// Replicate logic from productDataLoader.ts
const products = rawData.map(p => {
    let cleanName = p.name || '';
    cleanName = cleanName.replace(/^(Ess\d+-|iD\s*\d+-|Tarkett\s*)/i, '');
    // Remove technical suffixes like "-0v"
    cleanName = cleanName.replace(/-0v$/i, '');
    // Remove dimensions like "33,3x66,6" or "50x50" or "1200x200mm"
    cleanName = cleanName.replace(/\d+([.,]\d+)?\s*x\s*\d+([.,]\d+)?\s*(mm)?/gi, '');
    // Remove trailing hyphens or spaces
    cleanName = cleanName.replace(/[-–]\s*$/g, '').trim();
    // Replace remaining hyphens with spaces (e.g. "Cement-Grey" -> "Cement Grey")
    cleanName = cleanName.replace(/-/g, ' ');

    // Standardize capitalization (Title Case)
    cleanName = cleanName.toLowerCase().replace(/(?:^|\s)\S/g, function (a) { return a.toUpperCase(); });

    // Remove multiple spaces
    cleanName = cleanName.replace(/\s+/g, ' ').trim();

    const documents = (p.meta?.documents || []).map(docUrl => {
        const fileName = docUrl.split('/').pop() || 'Dokument';
        let title = fileName.replace(/_/g, ' ').replace(/-/g, ' ').replace('.pdf', '');
        if (title.toLowerCase().includes('dop')) title = 'Izjava o svojstvima (DoP)';
        else if (title.toLowerCase().includes('dataseet') || title.toLowerCase().includes('ds')) title = 'Tehnički list';
        else if (title.toLowerCase().includes('brochure')) title = 'Brošura';
        else if (title.toLowerCase().includes('maintenance')) title = 'Uputstvo za održavanje';
        else if (title.toLowerCase().includes('installation')) title = 'Uputstvo za ugradnju';
        return { title, url: docUrl, type: 'pdf' };
    });

    return { ...p, name: cleanName.trim(), documents };
});

const sample = products.find(p => p.id.includes('essence'));
console.log('\n--- Sample Product (Essence) ---');
console.log('Original Name:', rawData.find(p => p.id === sample.id).name);
console.log('Clean Name:', sample.name);
console.log('Documents:', sample.documents);

// Verify Collection Logic
const groups = {};
for (const p of products) {
    const col = p.collection || 'unknown';
    if (!groups[col]) groups[col] = [];
    groups[col].push(p);
}

const essenceCol = groups['essence'];
if (essenceCol) {
    console.log('\n--- Collection (Essence) ---');
    console.log('Items:', essenceCol.length);
    const first = essenceCol[0];
    const allDocs = essenceCol.flatMap(i => i.documents || []);
    const uniqueDocsMap = new Map();
    for (const doc of allDocs) uniqueDocsMap.set(doc.url, doc);
    const uniqueDocs = Array.from(uniqueDocsMap.values());
    console.log('Collection Documents:', uniqueDocs.length);
    if (uniqueDocs.length > 0) console.log('Sample Col Doc:', uniqueDocs[0]);

    // Specs logic
    const keySpecs = ['total_thickness', 'wear_layer_thickness', 'classification_commercial_iso_10874', 'classification_domestic_iso_10874', 'total_weight', 'surface_treatment'];
    const specsObj = first.specs || {};
    const relevantSpecs = Object.keys(specsObj).filter(k => keySpecs.includes(k));
    console.log('Relevant Specs Found:', relevantSpecs);
    console.log('Sample Spec Value:', relevantSpecs.length > 0 ? `${relevantSpecs[0]}: ${specsObj[relevantSpecs[0]]}` : 'None');
}
