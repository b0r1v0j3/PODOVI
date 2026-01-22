const fs = require('fs');
const path = require('path');

// Read the JSON file
const jsonPath = path.join(__dirname, '..', 'public', 'data', 'lvt_colors_complete.json');
const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

let updatedCount = 0;

// Update collection_specs for creation-55-looselay-acoustic
if (jsonData.colors && Array.isArray(jsonData.colors)) {
  jsonData.colors.forEach((color) => {
    if (color.collection === 'creation-55-looselay-acoustic') {
      // Ensure collection_specs exists
      if (!color.collection_specs) {
        color.collection_specs = [];
      }
      
      // Check if thickness spec already exists
      const hasThickness = color.collection_specs.some(s => s.key === 'thickness');
      
      if (!hasThickness) {
        // Add thickness spec at the beginning
        color.collection_specs.unshift({
          key: 'thickness',
          label: 'Ukupna debljina',
          value: '5.50 mm'
        });
        updatedCount++;
      } else {
        // Update existing thickness spec
        const thicknessSpec = color.collection_specs.find(s => s.key === 'thickness');
        if (thicknessSpec && thicknessSpec.value !== '5.50 mm') {
          thicknessSpec.value = '5.50 mm';
          updatedCount++;
        }
      }
    }
  });
}

// Write the updated JSON back
fs.writeFileSync(jsonPath, JSON.stringify(jsonData, null, 2), 'utf8');

console.log(`Updated ${updatedCount} colors with thickness spec in collection_specs.`);
