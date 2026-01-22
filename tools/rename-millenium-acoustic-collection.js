const fs = require('fs');

// Read vinyl_colors_complete.json
const vinylColorsPath = 'public/data/vinyl_colors_complete.json';
const vinylColors = JSON.parse(fs.readFileSync(vinylColorsPath, 'utf8'));

// Find and update the collection
const collection = vinylColors.collections.find(c => c.slug === 'taralay-millenium-acoustic-order');
if (collection) {
  collection.name = 'Taralay Millenium Acoustic';
  collection.slug = 'taralay-millenium-acoustic';
  
  // Update collection_slug for all colors
  collection.colors.forEach(color => {
    color.collection_slug = 'taralay-millenium-acoustic';
  });
  
  console.log(`✓ Updated collection name to: ${collection.name}`);
  console.log(`✓ Updated collection slug to: ${collection.slug}`);
  console.log(`✓ Updated ${collection.colors.length} colors with new collection_slug`);
  
  // Save updated JSON
  fs.writeFileSync(vinylColorsPath, JSON.stringify(vinylColors, null, 2));
  console.log(`✓ Updated ${vinylColorsPath}`);
} else {
  console.error('✗ Collection not found!');
  process.exit(1);
}
