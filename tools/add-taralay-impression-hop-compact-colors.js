const fs = require('fs');
const path = require('path');

// Read the scraped colors
const hopCompactColors = JSON.parse(
  fs.readFileSync('tools/taralay-impression-hop-compact-colors.json', 'utf8')
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

// Create colors for Hop Compact using the same images from Acoustic
const hopCompactColorsWithImages = hopCompactColors.map(color => {
  const imagePath = acousticImageMap[color.code];
  
  if (!imagePath) {
    console.warn(`Warning: No image found for code ${color.code} ${color.name}`);
  }
  
  return {
    code: color.code,
    name: color.name,
    sku: null,
    href: color.href,
    collection_slug: 'taralay-impression-hop-compact',
    image: imagePath || `/images/products/vinyl/taralay-impression-acoustic/${color.code}-${color.name.toLowerCase().replace(/\s+/g, '-')}.jpg`,
  };
});

// Find or create Taralay Impression Hop Compact collection
let hopCompactCollection = vinylColors.collections.find(
  c => c.slug === 'taralay-impression-hop-compact'
);

if (hopCompactCollection) {
  console.log('Updating existing Taralay Impression Hop Compact collection...');
  hopCompactCollection.colors = hopCompactColorsWithImages;
  hopCompactCollection.colorCount = hopCompactColorsWithImages.length;
} else {
  console.log('Creating new Taralay Impression Hop Compact collection...');
  hopCompactCollection = {
    name: 'Taralay Impression Hop Compact',
    slug: 'taralay-impression-hop-compact',
    url: 'https://www.gerflor-cee.com/products/taralay-impression-hop-compact',
    colorCount: hopCompactColorsWithImages.length,
    colors: hopCompactColorsWithImages,
  };
  vinylColors.collections.push(hopCompactCollection);
}

// Sort collections by name
vinylColors.collections.sort((a, b) => a.name.localeCompare(b.name));

// Save updated JSON
fs.writeFileSync(vinylColorsPath, JSON.stringify(vinylColors, null, 2));

console.log(`\n✓ Added ${hopCompactColorsWithImages.length} colors to Taralay Impression Hop Compact`);
console.log(`✓ All colors use images from Taralay Impression Acoustic`);
console.log(`✓ Updated ${vinylColorsPath}`);

// Show summary
const missingImages = hopCompactColorsWithImages.filter(c => !acousticImageMap[c.code]);
if (missingImages.length > 0) {
  console.log(`\n⚠ Warning: ${missingImages.length} colors don't have matching images in Acoustic:`);
  missingImages.forEach(c => console.log(`  - ${c.code} ${c.name}`));
} else {
  console.log(`\n✓ All colors have matching images from Acoustic collection!`);
}
