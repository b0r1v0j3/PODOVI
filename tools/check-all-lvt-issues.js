const fs = require('fs');
const path = require('path');

// Map collection slugs to their correct thickness values
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
  'creation-saga2': '4.60 mm',
};

// Read the JSON file
const jsonPath = path.join(__dirname, '..', 'public', 'data', 'lvt_colors_complete.json');
const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

let issues = [];
let fixes = {
  overallThicknessFixed: 0,
  collectionSpecsAdded: 0,
  collectionSpecsUpdated: 0,
  collections: {}
};

// Process each color
if (jsonData.colors && Array.isArray(jsonData.colors)) {
  jsonData.colors.forEach((color, index) => {
    const collection = color.collection;
    
    if (!collection) {
      issues.push({
        type: 'missing_collection',
        index: index + 1,
        code: color.code || 'unknown',
        name: color.name || 'unknown'
      });
      return;
    }

    const expectedThickness = collectionThicknessMap[collection];
    if (!expectedThickness) {
      issues.push({
        type: 'unknown_collection',
        index: index + 1,
        code: color.code || 'unknown',
        name: color.name || 'unknown',
        collection: collection
      });
      return;
    }

    // Initialize collection stats
    if (!fixes.collections[collection]) {
      fixes.collections[collection] = {
        name: color.collection_name || collection,
        count: 0,
        overallThicknessFixed: 0,
        collectionSpecsAdded: 0,
        collectionSpecsUpdated: 0
      };
    }
    fixes.collections[collection].count++;

    // Check and fix overall_thickness
    if (color.overall_thickness !== expectedThickness) {
      color.overall_thickness = expectedThickness;
      fixes.overallThicknessFixed++;
      fixes.collections[collection].overallThicknessFixed++;
      issues.push({
        type: 'wrong_overall_thickness',
        code: color.code,
        name: color.name,
        collection: collection,
        was: color.overall_thickness,
        now: expectedThickness
      });
    }

    // Ensure collection_specs exists
    if (!color.collection_specs) {
      color.collection_specs = [];
    }

    // Check and fix thickness spec in collection_specs
    const thicknessSpecIndex = color.collection_specs.findIndex(s => s.key === 'thickness');
    
    if (thicknessSpecIndex === -1) {
      // Add thickness spec at the beginning
      color.collection_specs.unshift({
        key: 'thickness',
        label: 'Ukupna debljina',
        value: expectedThickness
      });
      fixes.collectionSpecsAdded++;
      fixes.collections[collection].collectionSpecsAdded++;
    } else {
      // Update existing thickness spec if wrong
      const thicknessSpec = color.collection_specs[thicknessSpecIndex];
      if (thicknessSpec.value !== expectedThickness) {
        thicknessSpec.value = expectedThickness;
        fixes.collectionSpecsUpdated++;
        fixes.collections[collection].collectionSpecsUpdated++;
        issues.push({
          type: 'wrong_thickness_spec',
          code: color.code,
          name: color.name,
          collection: collection,
          was: thicknessSpec.value,
          now: expectedThickness
        });
      }
    }
  });
}

// Write the updated JSON back
fs.writeFileSync(jsonPath, JSON.stringify(jsonData, null, 2), 'utf8');

// Print summary
console.log('\n=== LVT Complete Verification & Fix ===\n');
console.log(`Total colors processed: ${jsonData.colors.length}`);
console.log(`Total issues found: ${issues.length}\n`);

if (fixes.overallThicknessFixed > 0) {
  console.log(`⚠️  overall_thickness fixed: ${fixes.overallThicknessFixed}`);
}
if (fixes.collectionSpecsAdded > 0) {
  console.log(`✅ collection_specs thickness added: ${fixes.collectionSpecsAdded}`);
}
if (fixes.collectionSpecsUpdated > 0) {
  console.log(`⚠️  collection_specs thickness updated: ${fixes.collectionSpecsUpdated}`);
}

if (issues.length > 0) {
  console.log('\nIssues by type:');
  const byType = {};
  issues.forEach(issue => {
    if (!byType[issue.type]) byType[issue.type] = [];
    byType[issue.type].push(issue);
  });
  Object.keys(byType).forEach(type => {
    console.log(`\n${type}: ${byType[type].length}`);
    byType[type].slice(0, 10).forEach(issue => {
      if (issue.type === 'wrong_overall_thickness' || issue.type === 'wrong_thickness_spec') {
        console.log(`  ${issue.collection}: ${issue.code} ${issue.name} - ${issue.was} → ${issue.now}`);
      } else {
        console.log(`  ${issue.collection || 'unknown'}: ${issue.code} ${issue.name}`);
      }
    });
    if (byType[type].length > 10) {
      console.log(`  ... and ${byType[type].length - 10} more`);
    }
  });
}

console.log('\n\nPer Collection Summary:');
Object.keys(fixes.collections).sort().forEach(collection => {
  const coll = fixes.collections[collection];
  console.log(`\n${coll.name} (${collection}):`);
  console.log(`  Total colors: ${coll.count}`);
  if (coll.overallThicknessFixed > 0) {
    console.log(`  ⚠️  overall_thickness fixed: ${coll.overallThicknessFixed}`);
  }
  if (coll.collectionSpecsAdded > 0) {
    console.log(`  ✅ collection_specs thickness added: ${coll.collectionSpecsAdded}`);
  }
  if (coll.collectionSpecsUpdated > 0) {
    console.log(`  ⚠️  collection_specs thickness updated: ${coll.collectionSpecsUpdated}`);
  }
  if (coll.overallThicknessFixed === 0 && coll.collectionSpecsAdded === 0 && coll.collectionSpecsUpdated === 0) {
    console.log(`  ✅ All correct`);
  }
});

console.log('\n✅ Verification complete!\n');
