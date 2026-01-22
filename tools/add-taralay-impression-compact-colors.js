const fs = require('fs');
const path = require('path');

// Read Compact colors
const compactColors = JSON.parse(fs.readFileSync('tools/taralay-impression-compact-colors.json', 'utf8'));

// Read Acoustic colors to get image paths
const vinylData = JSON.parse(fs.readFileSync('public/data/vinyl_colors_complete.json', 'utf8'));
const acousticCollection = vinylData.collections.find(c => c.slug === 'taralay-impression-acoustic');

if (!acousticCollection) {
  console.error('Taralay Impression Acoustic collection not found');
  process.exit(1);
}

// Create a map of code to image path from Acoustic
const acousticImageMap = {};
acousticCollection.colors.forEach(color => {
  acousticImageMap[color.code] = color.image;
});

// Create Compact collection with colors, using images from Acoustic
const compactCollection = {
  name: 'Taralay Impression Compact',
  slug: 'taralay-impression-compact',
  url: 'https://www.gerflor-cee.com/products/taralay-impression-compact',
  colorCount: compactColors.length,
  colors: compactColors.map(c => ({
    code: c.code,
    name: c.name,
    sku: c.sku,
    href: c.href,
    collection_slug: 'taralay-impression-compact',
    // Use the same image path from Acoustic (same folder, same filename)
    image: acousticImageMap[c.code] || `/images/products/vinyl/taralay-impression-compact/${c.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}.jpg`
  }))
};

// Add to vinyl collections
vinylData.collections.push(compactCollection);
vinylData.totalColors = vinylData.collections.reduce((sum, c) => sum + (c.colors?.length || 0), 0);

fs.writeFileSync('public/data/vinyl_colors_complete.json', JSON.stringify(vinylData, null, 2));
console.log('Added Taralay Impression Compact collection with', compactColors.length, 'colors');
console.log('Using same images from Taralay Impression Acoustic');
