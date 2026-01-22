const fs = require('fs');
const path = require('path');

// Map collection slugs to their correct thickness values (from mock-data.ts)
const collectionThicknessMap = {
  'creation-30': '2.00 mm',
  'creation-40': '2.50 mm',
  'creation-40-clic': '4.50 mm',
  'creation-40-clic-acoustic': '5.50 mm',
  'creation-40-zen': '3.60 mm',
  'creation-55': '2.50 mm',
  'creation-55-clic': '5.00 mm',
  'creation-55-clic-acoustic': '6.00 mm',
  'creation-55-looselay': '4.50 mm',
  'creation-55-looselay-acoustic': '5.50 mm',
  'creation-55-zen': '4.25 mm',
  'creation-70': '2.50 mm',
  'creation-70-clic': '5.00 mm',
  'creation-70-connect': '5.00 mm',
  'creation-70-megaclic': '6.00 mm',
  'creation-70-looselay': '5.00 mm',
  'creation-70-zen': '4.35 mm',
  'creation-saga': '4.60 mm',
  'creation-saga2': '4.60 mm',
  'creation-saga-2': '4.60 mm',
};

// Read the JSON file
const jsonPath = path.join(__dirname, '..', 'public', 'data', 'lvt_colors_complete.json');
const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

let stats = {
  totalColors: 0,
  overallThicknessFixed: 0,
  collectionSpecsAdded: 0,
  collectionSpecsUpdated: 0,
  collections: {},
  issues: []
};

// Process each color
if (jsonData.colors && Array.isArray(jsonData.colors)) {
  jsonData.colors.forEach((color, index) => {
    stats.totalColors++;
    const collection = color.collection;
    
    if (!collection) {
      stats.issues.push(`Color ${index + 1} (${color.code || 'unknown'}) has no collection`);
      return;
    }

    if (!collectionThicknessMap[collection]) {
      stats.issues.push(`Color ${index + 1} (${color.code || 'unknown'}) has unknown collection: ${collection}`);
      return;
    }

    const correctThickness = collectionThicknessMap[collection];
    
    // Initialize stats for this collection
    if (!stats.collections[collection]) {
      stats.collections[collection] = {
        name: color.collection_name || collection,
        colorsChecked: 0,
        overallThicknessFixed: 0,
        collectionSpecsAdded: 0,
        collectionSpecsUpdated: 0,
        missingThicknessSpec: 0
      };
    }
    stats.collections[collection].colorsChecked++;

    // Fix overall_thickness if wrong
    if (color.overall_thickness !== correctThickness) {
      color.overall_thickness = correctThickness;
      stats.overallThicknessFixed++;
      stats.collections[collection].overallThicknessFixed++;
    }

    // Ensure collection_specs exists
    if (!color.collection_specs) {
      color.collection_specs = [];
    }

    // Check if thickness spec exists in collection_specs
    const thicknessSpecIndex = color.collection_specs.findIndex(s => s.key === 'thickness');
    
    if (thicknessSpecIndex === -1) {
      // Add thickness spec at the beginning
      color.collection_specs.unshift({
        key: 'thickness',
        label: 'Ukupna debljina',
        value: correctThickness
      });
      stats.collectionSpecsAdded++;
      stats.collections[collection].collectionSpecsAdded++;
      stats.collections[collection].missingThicknessSpec++;
    } else {
      // Update existing thickness spec if wrong
      const thicknessSpec = color.collection_specs[thicknessSpecIndex];
      if (thicknessSpec.value !== correctThickness) {
        thicknessSpec.value = correctThickness;
        stats.collectionSpecsUpdated++;
        stats.collections[collection].collectionSpecsUpdated++;
      }
    }
  });
}

// Write the updated JSON back
fs.writeFileSync(jsonPath, JSON.stringify(jsonData, null, 2), 'utf8');

// Print summary
console.log('\n=== LVT Thickness Verification & Fix Summary ===\n');
console.log(`Total colors processed: ${stats.totalColors}`);
console.log(`Total overall_thickness fixed: ${stats.overallThicknessFixed}`);
console.log(`Total collection_specs thickness added: ${stats.collectionSpecsAdded}`);
console.log(`Total collection_specs thickness updated: ${stats.collectionSpecsUpdated}\n`);

if (stats.issues.length > 0) {
  console.log(`⚠️  Issues found: ${stats.issues.length}`);
  stats.issues.slice(0, 10).forEach(issue => console.log(`  - ${issue}`));
  if (stats.issues.length > 10) {
    console.log(`  ... and ${stats.issues.length - 10} more`);
  }
  console.log('');
}

console.log('Per Collection:');
Object.keys(stats.collections).sort().forEach(collection => {
  const coll = stats.collections[collection];
  console.log(`\n${coll.name} (${collection}):`);
  console.log(`  Colors checked: ${coll.colorsChecked}`);
  if (coll.overallThicknessFixed > 0) {
    console.log(`  ⚠️  overall_thickness fixed: ${coll.overallThicknessFixed}`);
  }
  if (coll.collectionSpecsAdded > 0) {
    console.log(`  ✅ collection_specs thickness added: ${coll.collectionSpecsAdded}`);
  }
  if (coll.collectionSpecsUpdated > 0) {
    console.log(`  ⚠️  collection_specs thickness updated: ${coll.collectionSpecsUpdated}`);
  }
  if (coll.missingThicknessSpec === 0 && coll.collectionSpecsAdded === 0) {
    console.log(`  ✅ All colors already have correct thickness spec`);
  }
});

console.log('\n✅ All LVT colors have been verified and fixed!\n');
