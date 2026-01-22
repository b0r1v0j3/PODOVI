const fs = require('fs');
const path = require('path');

// Read the scraped colors
const hopAcousticColors = JSON.parse(
  fs.readFileSync('tools/taralay-impression-hop-acoustic-colors.json', 'utf8')
);

// Read vinyl_colors_complete.json
const vinylColorsPath = 'public/data/vinyl_colors_complete.json';
const vinylColors = JSON.parse(fs.readFileSync(vinylColorsPath, 'utf8'));

// Find Taralay Impression Acoustic collection to get image paths
const acousticCollection = vinylColors.collections.find(
  c => c.slug === 'taralay-impression-acoustic'
);

if (!acousticCollection) {
  console.error('Taralay Impression Acoustic collection not found!');
  process.exit(1);
}

console.log(`Found Taralay Impression Acoustic with ${acousticCollection.colors.length} colors`);

// Create a map of code -> image path from Acoustic
const acousticImageMap = {};
acousticCollection.colors.forEach(color => {
  acousticImageMap[color.code] = color.image;
});

// Create colors for Hop Acoustic using the same images from Acoustic
const hopAcousticColorsWithImages = hopAcousticColors.map(color => {
  const imagePath = acousticImageMap[color.code];
  
  if (!imagePath) {
    console.warn(`Warning: No image found for code ${color.code} ${color.name}`);
  }
  
  return {
    code: color.code,
    name: color.name,
    sku: null,
    href: color.href,
    collection_slug: 'taralay-impression-hop-acoustic',
    image: imagePath || `/images/products/vinyl/taralay-impression-acoustic/${color.code}-${color.name.toLowerCase().replace(/\s+/g, '-')}.jpg`,
  };
});

// Find or create Taralay Impression Hop Acoustic collection
let hopAcousticCollection = vinylColors.collections.find(
  c => c.slug === 'taralay-impression-hop-acoustic'
);

if (hopAcousticCollection) {
  console.log('Updating existing Taralay Impression Hop Acoustic collection...');
  hopAcousticCollection.colors = hopAcousticColorsWithImages;
  hopAcousticCollection.colorCount = hopAcousticColorsWithImages.length;
} else {
  console.log('Creating new Taralay Impression Hop Acoustic collection...');
  hopAcousticCollection = {
    name: 'Taralay Impression Hop Acoustic',
    slug: 'taralay-impression-hop-acoustic',
    url: 'https://www.gerflor-cee.com/products/taralay-impression-hop-acoustic',
    colorCount: hopAcousticColorsWithImages.length,
    colors: hopAcousticColorsWithImages,
  };
  vinylColors.collections.push(hopAcousticCollection);
}

// Sort collections by name
vinylColors.collections.sort((a, b) => a.name.localeCompare(b.name));

// Save updated JSON
fs.writeFileSync(vinylColorsPath, JSON.stringify(vinylColors, null, 2));

console.log(`\n✓ Added ${hopAcousticColorsWithImages.length} colors to Taralay Impression Hop Acoustic`);
console.log(`✓ All colors use images from Taralay Impression Acoustic`);
console.log(`✓ Updated ${vinylColorsPath}`);

// Show summary
const missingImages = hopAcousticColorsWithImages.filter(c => !acousticImageMap[c.code]);
if (missingImages.length > 0) {
  console.log(`\n⚠ Warning: ${missingImages.length} colors don't have matching images in Acoustic:`);
  missingImages.forEach(c => console.log(`  - ${c.code} ${c.name}`));
} else {
  console.log(`\n✓ All colors have matching images from Acoustic collection!`);
}
