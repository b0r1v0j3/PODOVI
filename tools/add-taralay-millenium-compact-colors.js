const fs = require('fs');
const path = require('path');

// Read the scraped colors
const milleniumCompactColors = JSON.parse(
  fs.readFileSync('tools/taralay-millenium-compact-colors.json', 'utf8')
);

// Read vinyl_colors_complete.json
const vinylColorsPath = 'public/data/vinyl_colors_complete.json';
const vinylColors = JSON.parse(fs.readFileSync(vinylColorsPath, 'utf8'));

// Find Taralay Millenium Acoustic collection to get image paths
const acousticCollection = vinylColors.collections.find(
  c => c.slug === 'taralay-millenium-acoustic'
);

if (!acousticCollection) {
  console.error('Taralay Millenium Acoustic collection not found!');
  process.exit(1);
}

console.log(`Found Taralay Millenium Acoustic with ${acousticCollection.colors.length} colors`);

// Create a map of code -> image path from Acoustic
const acousticImageMap = {};
acousticCollection.colors.forEach(color => {
  acousticImageMap[color.code] = color.image;
});

// Create colors for Compact using the same images from Acoustic
const milleniumCompactColorsWithImages = milleniumCompactColors.map(color => {
  const imagePath = acousticImageMap[color.code];
  
  if (!imagePath) {
    console.warn(`Warning: No image found for code ${color.code} ${color.name}`);
  }
  
  return {
    code: color.code,
    name: color.name,
    sku: null,
    href: color.href,
    collection_slug: 'taralay-millenium-compact',
    image: imagePath || `/images/products/vinyl/taralay-millenium-acoustic-order/${color.code}-${color.name.toLowerCase().replace(/\s+/g, '-')}.jpg`,
  };
});

// Find or create Taralay Millenium Compact collection
let milleniumCompactCollection = vinylColors.collections.find(
  c => c.slug === 'taralay-millenium-compact'
);

if (milleniumCompactCollection) {
  console.log('Updating existing Taralay Millenium Compact collection...');
  milleniumCompactCollection.colors = milleniumCompactColorsWithImages;
  milleniumCompactCollection.colorCount = milleniumCompactColorsWithImages.length;
} else {
  console.log('Creating new Taralay Millenium Compact collection...');
  milleniumCompactCollection = {
    name: 'Taralay Millenium Compact',
    slug: 'taralay-millenium-compact',
    url: 'https://www.gerflor-cee.com/products/taralay-millenium-compact',
    colorCount: milleniumCompactColorsWithImages.length,
    colors: milleniumCompactColorsWithImages,
  };
  vinylColors.collections.push(milleniumCompactCollection);
}

// Sort collections by name
vinylColors.collections.sort((a, b) => a.name.localeCompare(b.name));

// Save updated JSON
fs.writeFileSync(vinylColorsPath, JSON.stringify(vinylColors, null, 2));

console.log(`\n✓ Added ${milleniumCompactColorsWithImages.length} colors to Taralay Millenium Compact`);
console.log(`✓ All colors use images from Taralay Millenium Acoustic`);
console.log(`✓ Updated ${vinylColorsPath}`);

// Show summary
const missingImages = milleniumCompactColorsWithImages.filter(c => !acousticImageMap[c.code]);
if (missingImages.length > 0) {
  console.log(`\n⚠ Warning: ${missingImages.length} colors don't have matching images in Acoustic:`);
  missingImages.forEach(c => console.log(`  - ${c.code} ${c.name}`));
} else {
  console.log(`\n✓ All colors have matching images from Acoustic collection!`);
}
