/**
 * Extract collection-level specs from tarkett_lvt_products.json
 * Takes key specs from the first product of each collection
 * and produces a clean specs JSON for the data loader.
 */
const fs = require('fs');
const path = require('path');

const data = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'public', 'data', 'tarkett_lvt_products.json'), 'utf8'));

const KEY_SPECS = [
    'total_thickness',
    'wear_layer_thickness',
    'total_weight',
    'basis_weight',
    'classification_commercial_iso_10874',
    'classification_domestic_iso_10874',
    'surface_treatment',
    'slip_resistance_en_13893',
    'reaction_fire_en_13501',
    'underfloor_heating',
    'impact_sound_insulation',
    'installation_method',
    'format',
    'format_type',
    'residual_indentation',
    'castor_chair_effect_iso_4918',
    'furniture_leg_effect_iso_16581',
    'chemical_resistance_iso_26987',
    'electrical_propensity',
    'colour_fastness_light',
    'thermal_resistance',
    'phtalate_content',
    'country_origin',
    'laying_direction',
    'pattern_type',
    'bevelled_edges',
    'product_type_norm_iso',
];

// Group by collection
const groups = {};
data.forEach(p => {
    if (!groups[p.collection]) groups[p.collection] = [];
    groups[p.collection].push(p);
});

const collectionSpecs = {};

for (const [collKey, products] of Object.entries(groups)) {
    const first = products[0];
    const specs = {};

    for (const key of KEY_SPECS) {
        if (first.specs[key] && first.specs[key] !== '-') {
            specs[key] = first.specs[key];
        }
    }

    collectionSpecs[collKey] = {
        name: collKey,
        productCount: products.length,
        specs: specs
    };

    // Print for review
    console.log(`\n=== ${collKey} (${products.length} products) ===`);
    for (const [k, v] of Object.entries(specs)) {
        console.log(`  ${k}: ${v}`);
    }
}

// Save to JSON file
const outputPath = path.join(__dirname, '..', 'public', 'data', 'tarkett_collection_specs.json');
fs.writeFileSync(outputPath, JSON.stringify(collectionSpecs, null, 2), 'utf8');
console.log(`\nSaved to ${outputPath}`);
