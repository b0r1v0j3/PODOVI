const fs = require('fs');
const path = require('path');

// Read the scraped colors
const milleniumAcousticColors = JSON.parse(
  fs.readFileSync('tools/taralay-millenium-acoustic-colors.json', 'utf8')
);

// Read vinyl_colors_complete.json
const vinylColorsPath = 'public/data/vinyl_colors_complete.json';
const vinylColors = JSON.parse(fs.readFileSync(vinylColorsPath, 'utf8'));

// Create colors for Millenium Acoustic (images will be added later)
const milleniumAcousticColorsWithImages = milleniumAcousticColors.map(color => {
  const slugName = color.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  
  return {
    code: color.code,
    name: color.name,
    sku: null,
    href: color.href,
    collection_slug: 'taralay-millenium-acoustic-order',
    image: `/images/products/vinyl/taralay-millenium-acoustic-order/${color.code}-${slugName}.jpg`,
  };
});

// Find or create Taralay Millenium Acoustic Order collection
let milleniumAcousticCollection = vinylColors.collections.find(
  c => c.slug === 'taralay-millenium-acoustic-order'
);

if (milleniumAcousticCollection) {
  console.log('Updating existing Taralay Millenium Acoustic Order collection...');
  milleniumAcousticCollection.colors = milleniumAcousticColorsWithImages;
  milleniumAcousticCollection.colorCount = milleniumAcousticColorsWithImages.length;
} else {
  console.log('Creating new Taralay Millenium Acoustic Order collection...');
  milleniumAcousticCollection = {
    name: 'Taralay Millenium Acoustic Order',
    slug: 'taralay-millenium-acoustic-order',
    url: 'https://www.gerflor-cee.com/products/taralay-millenium-acoustic-order',
    colorCount: milleniumAcousticColorsWithImages.length,
    colors: milleniumAcousticColorsWithImages,
  };
  vinylColors.collections.push(milleniumAcousticCollection);
}

// Sort collections by name
vinylColors.collections.sort((a, b) => a.name.localeCompare(b.name));

// Save updated JSON
fs.writeFileSync(vinylColorsPath, JSON.stringify(vinylColors, null, 2));

console.log(`\n✓ Added ${milleniumAcousticColorsWithImages.length} colors to Taralay Millenium Acoustic Order`);
console.log(`✓ Image paths prepared for: public/images/products/vinyl/taralay-millenium-acoustic-order/`);
console.log(`✓ Updated ${vinylColorsPath}`);
console.log(`\nNote: Images need to be added to the folder. Image paths are ready.`);
