const fs = require('fs');
const path = require('path');

// Read the scraped colors
const initialAcousticColors = JSON.parse(
  fs.readFileSync('tools/taralay-initial-acoustic-colors.json', 'utf8')
);

// Read vinyl_colors_complete.json
const vinylColorsPath = 'public/data/vinyl_colors_complete.json';
const vinylColors = JSON.parse(fs.readFileSync(vinylColorsPath, 'utf8'));

// Create colors for Initial Acoustic (images will be added later)
const initialAcousticColorsWithImages = initialAcousticColors.map(color => {
  const slugName = color.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  
  return {
    code: color.code,
    name: color.name,
    sku: null,
    href: color.href,
    collection_slug: 'taralay-initial-acoustic',
    image: `/images/products/vinyl/taralay-initial-acoustic/${color.code}-${slugName}.jpg`,
  };
});

// Find or create Taralay Initial Acoustic collection
let initialAcousticCollection = vinylColors.collections.find(
  c => c.slug === 'taralay-initial-acoustic'
);

if (initialAcousticCollection) {
  console.log('Updating existing Taralay Initial Acoustic collection...');
  initialAcousticCollection.colors = initialAcousticColorsWithImages;
  initialAcousticCollection.colorCount = initialAcousticColorsWithImages.length;
} else {
  console.log('Creating new Taralay Initial Acoustic collection...');
  initialAcousticCollection = {
    name: 'Taralay Initial Acoustic',
    slug: 'taralay-initial-acoustic',
    url: 'https://www.gerflor-cee.com/products/taralay-initial-acoustic',
    colorCount: initialAcousticColorsWithImages.length,
    colors: initialAcousticColorsWithImages,
  };
  vinylColors.collections.push(initialAcousticCollection);
}

// Sort collections by name
vinylColors.collections.sort((a, b) => a.name.localeCompare(b.name));

// Save updated JSON
fs.writeFileSync(vinylColorsPath, JSON.stringify(vinylColors, null, 2));

console.log(`\n✓ Added ${initialAcousticColorsWithImages.length} colors to Taralay Initial Acoustic`);
console.log(`✓ Image paths prepared for: public/images/products/vinyl/taralay-initial-acoustic/`);
console.log(`✓ Updated ${vinylColorsPath}`);
console.log(`\nNote: Images need to be added to the folder. Image paths are ready.`);
