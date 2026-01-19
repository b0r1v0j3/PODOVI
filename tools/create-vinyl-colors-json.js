const fs = require('fs');
const path = require('path');

// Read the detailed colors
const detailedPath = path.join(__dirname, '..', 'tmp', 'vinyl-colors-detailed.json');
const detailed = JSON.parse(fs.readFileSync(detailedPath, 'utf8'));

// Clean and structure colors
const collectionsWithColors = detailed.map(collection => {
  // Filter out duplicates and clean color names
  const uniqueColors = new Map();
  
  collection.colors.forEach(color => {
    // Skip "VIEW PRODUCT" entries
    if (color.name && color.name.includes('VIEW PRODUCT')) {
      return;
    }
    
    // Use SKU as key if available, otherwise use code+name
    const key = color.sku || `${color.code}-${color.name}`;
    
    if (!uniqueColors.has(key) && color.code && color.name) {
      // Clean color name
      let cleanName = color.name.trim();
      if (cleanName.includes('VIEW PRODUCT')) {
        cleanName = cleanName.replace(/VIEW PRODUCT\s*/i, '').trim();
      }
      
      uniqueColors.set(key, {
        code: color.code,
        name: cleanName,
        sku: color.sku || null,
        href: color.href ? (color.href.startsWith('http') ? color.href : `https://www.gerflor-cee.com${color.href}`) : null,
        collection_slug: collection.slug
      });
    }
  });
  
  return {
    collection: collection.collection,
    slug: collection.slug,
    url: collection.url,
    colors: Array.from(uniqueColors.values())
      .filter(c => c.code && c.name && !c.name.includes('VIEW PRODUCT'))
      .sort((a, b) => a.code.localeCompare(b.code))
  };
});

// Create final structure
const finalStructure = {
  collections: collectionsWithColors.map(c => ({
    name: c.collection,
    slug: c.slug,
    url: c.url,
    colorCount: c.colors.length,
    colors: c.colors
  })),
  totalColors: collectionsWithColors.reduce((sum, c) => sum + c.colors.length, 0),
  generatedAt: new Date().toISOString()
};

// Save to public/data directory for use in the app
const outputPath = path.join(__dirname, '..', 'public', 'data', 'vinyl_colors_complete.json');
fs.writeFileSync(outputPath, JSON.stringify(finalStructure, null, 2));

// Also save a version grouped by collection for easier access
const byCollection = {};
collectionsWithColors.forEach(c => {
  byCollection[c.slug] = {
    name: c.collection,
    colors: c.colors
  };
});

const byCollectionPath = path.join(__dirname, '..', 'tmp', 'vinyl-colors-by-collection.json');
fs.writeFileSync(byCollectionPath, JSON.stringify(byCollection, null, 2));

console.log('\n✅ Vinyl colors JSON created!');
console.log(`\n📊 Summary:`);
collectionsWithColors.forEach(c => {
  console.log(`  ${c.collection}: ${c.colors.length} colors`);
});
console.log(`\n📁 Files saved:`);
console.log(`  - ${outputPath}`);
console.log(`  - ${byCollectionPath}`);
console.log(`\n🎨 Total colors: ${finalStructure.totalColors}`);
