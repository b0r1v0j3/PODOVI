const fs = require('fs');
const path = require('path');

// Read the scraped colors
const initialCompactColors = JSON.parse(
  fs.readFileSync('tools/taralay-initial-compact-colors.json', 'utf8')
);

// Read vinyl_colors_complete.json
const vinylColorsPath = 'public/data/vinyl_colors_complete.json';
const vinylColors = JSON.parse(fs.readFileSync(vinylColorsPath, 'utf8'));

// Find Taralay Initial Acoustic collection to get image paths
const acousticCollection = vinylColors.collections.find(
  c => c.slug === 'taralay-initial-acoustic'
);

if (!acousticCollection) {
  console.error('Taralay Initial Acoustic collection not found!');
  process.exit(1);
}

console.log(`Found Taralay Initial Acoustic with ${acousticCollection.colors.length} colors`);

// Create a map of code -> image path from Acoustic
const acousticImageMap = {};
acousticCollection.colors.forEach(color => {
  acousticImageMap[color.code] = color.image;
});

// Create colors for Initial Compact using the same images from Acoustic
const initialCompactColorsWithImages = initialCompactColors.map(color => {
  const imagePath = acousticImageMap[color.code];
  
  if (!imagePath) {
    console.warn(`Warning: No image found for code ${color.code} ${color.name}`);
  }
  
  return {
    code: color.code,
    name: color.name,
    sku: null,
    href: color.href,
    collection_slug: 'taralay-initial-compact',
    image: imagePath || `/images/products/vinyl/taralay-initial-acoustic/${color.code}-${color.name.toLowerCase().replace(/\s+/g, '-')}.jpg`,
  };
});

// Find or create Taralay Initial Compact collection
let initialCompactCollection = vinylColors.collections.find(
  c => c.slug === 'taralay-initial-compact'
);

if (initialCompactCollection) {
  console.log('Updating existing Taralay Initial Compact collection...');
  initialCompactCollection.colors = initialCompactColorsWithImages;
  initialCompactCollection.colorCount = initialCompactColorsWithImages.length;
} else {
  console.log('Creating new Taralay Initial Compact collection...');
  initialCompactCollection = {
    name: 'Taralay Initial Compact',
    slug: 'taralay-initial-compact',
    url: 'https://www.gerflor-cee.com/products/taralay-initial-compact',
    colorCount: initialCompactColorsWithImages.length,
    colors: initialCompactColorsWithImages,
  };
  vinylColors.collections.push(initialCompactCollection);
}

// Sort collections by name
vinylColors.collections.sort((a, b) => a.name.localeCompare(b.name));

// Save updated JSON
fs.writeFileSync(vinylColorsPath, JSON.stringify(vinylColors, null, 2));

console.log(`\n✓ Added ${initialCompactColorsWithImages.length} colors to Taralay Initial Compact`);
console.log(`✓ All colors use images from Taralay Initial Acoustic`);
console.log(`✓ Updated ${vinylColorsPath}`);

// Show summary
const missingImages = initialCompactColorsWithImages.filter(c => !acousticImageMap[c.code]);
if (missingImages.length > 0) {
  console.log(`\n⚠ Warning: ${missingImages.length} colors don't have matching images in Acoustic:`);
  missingImages.forEach(c => console.log(`  - ${c.code} ${c.name}`));
} else {
  console.log(`\n✓ All colors have matching images from Acoustic collection!`);
}
