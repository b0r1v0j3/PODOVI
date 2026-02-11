/**
 * Generate egger-decors.json from scraped EGGER API data.
 * Maps 16 API collection names → site collection slugs.
 * 
 * Usage: node scripts/generate-egger-decor-data.js
 */

const fs = require('fs');
const path = require('path');

const INPUT = path.join(__dirname, '..', 'egger-all-284-decors.json');
const OUTPUT = path.join(__dirname, '..', 'public', 'data', 'egger-decors.json');

// Map API collection names to site collection slugs
const COLLECTION_MAP = {
    // NatureSense → egger-naturesense
    'NatureSense 7/31 Classic': 'egger-naturesense',
    'NatureSense 8/32 Classic': 'egger-naturesense',
    'NatureSense 8/33 Classic': 'egger-naturesense',
    'NatureSense 10/32 Classic': 'egger-naturesense',
    'NatureSense 10/33 Classic': 'egger-naturesense',
    'NatureSense 10/33 Long': 'egger-naturesense',
    'NatureSense 8/32 Large': 'egger-naturesense',
    'NatureSense 8/33 Large': 'egger-naturesense',
    'NatureSense 8/32 Kingsize': 'egger-naturesense',
    'NatureSense 8/33 Kingsize': 'egger-naturesense',
    'NatureSense 8/32 Medium': 'egger-naturesense',
    // Herringbone → egger-naturesense-herringbone
    'NatureSense 8/32 Herringbone': 'egger-naturesense-herringbone',
    // AquaDura → egger-aquadura
    'AquaDura 7,5/32 Classic': 'egger-aquadura',
    'AquaDura 7,5/33 Classic': 'egger-aquadura',
    'AquaDura 7,5/33 Large': 'egger-aquadura',
    'AquaDura 7,5/33 Kingsize': 'egger-aquadura',
};

// Read input
const raw = JSON.parse(fs.readFileSync(INPUT, 'utf-8'));
console.log(`Read ${raw.length} decors from API data`);

// Transform to Color format
const colors = raw.map((d) => {
    const collectionSlug = COLLECTION_MAP[d.collection] || 'egger-naturesense';
    const slug = `${d.code.toLowerCase()}-${d.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '')}`;

    // Parse thickness/format from collection name
    // e.g. "NatureSense 8/32 Classic" → thickness=8, class=32, format=Classic
    const match = d.collection.match(/(\d+(?:,\d+)?)\s*\/\s*(\d+)\s+(.+)/);
    const thickness = match ? match[1].replace(',', '.') + ' mm' : '';
    const wearClass = match ? match[2] : '';
    const format = match ? match[3] : '';

    return {
        collection: collectionSlug,
        collection_name: d.collection,
        code: d.code,
        name: d.name,
        full_name: `${d.code} ${d.name}`,
        slug: slug,
        image_url: d.image,
        texture_url: d.image,
        image_count: 1,
        egger_id: d.id,
        characteristics: {
            'Debljina': thickness,
            'Klasa': wearClass,
            'Format': format,
            'Kolekcija': d.collection,
        }
    };
});

// Group by collection for summary
const byCollection = {};
colors.forEach(c => {
    byCollection[c.collection] = (byCollection[c.collection] || 0) + 1;
});

// Write output
const output = { colors };
fs.writeFileSync(OUTPUT, JSON.stringify(output, null, 2), 'utf-8');

console.log(`\nGenerated ${colors.length} color entries to ${OUTPUT}`);
console.log('\nBy collection:');
Object.entries(byCollection).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => {
    console.log(`  ${k}: ${v}`);
});
