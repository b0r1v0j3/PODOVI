const fs = require('fs');
const path = require('path');

// Map collection names to their thickness values
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
  'creation-saga-2': '4.60 mm',
  'creation-saga2': '4.60 mm',
};

// Read the JSON file
const jsonPath = path.join(__dirname, '..', 'public', 'data', 'lvt_colors_complete.json');
const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

let updatedCount = 0;

// Update overall_thickness for each color based on its collection
if (jsonData.colors && Array.isArray(jsonData.colors)) {
  jsonData.colors.forEach((color) => {
    const collection = color.collection;
    if (collection && collectionThicknessMap[collection]) {
      const correctThickness = collectionThicknessMap[collection];
      if (color.overall_thickness !== correctThickness) {
        color.overall_thickness = correctThickness;
        updatedCount++;
      }
      
      // Also update collection_specs if it exists
      if (color.collection_specs && Array.isArray(color.collection_specs)) {
        const thicknessSpec = color.collection_specs.find(s => s.key === 'thickness');
        if (thicknessSpec && thicknessSpec.value !== correctThickness) {
          thicknessSpec.value = correctThickness;
        }
      }
    }
  });
}

// Write the updated JSON back
fs.writeFileSync(jsonPath, JSON.stringify(jsonData, null, 2), 'utf8');

console.log(`Updated ${updatedCount} colors with correct thickness values.`);
