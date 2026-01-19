const fs = require('fs');
const path = require('path');

// Based on the example URLs provided, we'll create a structure
// The user will provide the actual color data later
const collections = [
  {
    name: 'Nerok 55',
    slug: 'nerok-55',
    url: 'https://www.gerflor-cee.com/products/nerok-55',
    exampleColorUrl: 'https://www.gerflor-cee.com/products/nerok-55-0476-noma-miel-28130476',
    categoryId: '7', // Linoleum category
    brandId: '6' // Gerflor brand
  },
  {
    name: 'Nerok 70',
    slug: 'nerok-70',
    url: 'https://www.gerflor-cee.com/products/nerok-70',
    exampleColorUrl: 'https://www.gerflor-cee.com/products/nerok-70-0476-noma-miel-12380476',
    categoryId: '7',
    brandId: '6'
  },
  {
    name: 'Premium Acoustic',
    slug: 'premium-acoustic',
    url: 'https://www.gerflor-cee.com/products/premium-acoustic',
    exampleColorUrl: 'https://www.gerflor-cee.com/products/premium-acoustic-0027-cocoon-muslin-hd740027',
    categoryId: '7',
    brandId: '6'
  },
  {
    name: 'Premium Compact',
    slug: 'premium-compact',
    url: 'https://www.gerflor-cee.com/products/premium-compact',
    exampleColorUrl: 'https://www.gerflor-cee.com/products/premium-compact-0027-cocoon-muslin-hd420027',
    categoryId: '7',
    brandId: '6'
  },
  {
    name: 'Taralay Impression Acoustic',
    slug: 'taralay-impression-acoustic',
    url: 'https://www.gerflor-cee.com/products/taralay-impression-acoustic',
    exampleColorUrl: 'https://www.gerflor-cee.com/products/taralay-impression-acoustic-0373-noma-ice-20000373',
    categoryId: '7',
    brandId: '6'
  },
  {
    name: 'Taralay Impression Compact',
    slug: 'taralay-impression-compact',
    url: 'https://www.gerflor-cee.com/products/taralay-impression-compact',
    exampleColorUrl: 'https://www.gerflor-cee.com/products/taralay-impression-compact-0373-noma-ice-20010373',
    categoryId: '7',
    brandId: '6'
  },
  {
    name: 'Taralay Impression Hop Acoustic',
    slug: 'taralay-impression-hop-acoustic',
    url: 'https://www.gerflor-cee.com/products/taralay-impression-hop-acoustic',
    exampleColorUrl: 'https://www.gerflor-cee.com/products/taralay-impression-hop-acoustic-0373-noma-ice-29850373',
    categoryId: '7',
    brandId: '6'
  },
  {
    name: 'Taralay Impression Hop Compact',
    slug: 'taralay-impression-hop-compact',
    url: 'https://www.gerflor-cee.com/products/taralay-impression-hop-compact',
    exampleColorUrl: 'https://www.gerflor-cee.com/products/taralay-impression-hop-compact-0373-noma-ice-29870373',
    categoryId: '7',
    brandId: '6'
  },
  {
    name: 'Taralay Initial Acoustic',
    slug: 'taralay-initial-acoustic',
    url: 'https://www.gerflor-cee.com/products/taralay-initial-acoustic',
    exampleColorUrl: 'https://www.gerflor-cee.com/products/taralay-initial-acoustic-0035-urban-gris-22150035',
    categoryId: '7',
    brandId: '6'
  },
  {
    name: 'Taralay Initial Compact',
    slug: 'taralay-initial-compact',
    url: 'https://www.gerflor-cee.com/products/taralay-initial-compact',
    exampleColorUrl: 'https://www.gerflor-cee.com/products/taralay-initial-compact-0035-urban-gris-22220035',
    categoryId: '7',
    brandId: '6'
  },
  {
    name: 'Taralay Millenium Acoustic Order',
    slug: 'taralay-millenium-acoustic-order',
    url: 'https://www.gerflor-cee.com/products/taralay-millenium-acoustic-order',
    exampleColorUrl: 'https://www.gerflor-cee.com/products/taralay-millenium-acoustic-order-3435-nemesis-hd023435',
    categoryId: '7',
    brandId: '6'
  },
  {
    name: 'Taralay Millenium Compact',
    slug: 'taralay-millenium-compact',
    url: 'https://www.gerflor-cee.com/products/taralay-millenium-compact',
    exampleColorUrl: 'https://www.gerflor-cee.com/products/taralay-millenium-compact-3435-nemesis-hd063435',
    categoryId: '7',
    brandId: '6'
  }
];

// Create structure with placeholder for colors
// Colors will be added when user provides the data
const collectionsData = collections.map(collection => ({
  name: collection.name,
  slug: collection.slug,
  url: collection.url,
  colorCount: 0, // Will be updated when colors are added
  colors: [] // Will be populated when user provides color data
}));

const outputData = {
  collections: collectionsData,
  totalColors: 0,
  generatedAt: new Date().toISOString(),
  note: 'This is a placeholder structure. Colors need to be scraped from the website or provided manually.'
};

// Save to JSON
const rootDir = path.join(__dirname, '..');
const outputPath = path.join(rootDir, 'public', 'data', 'gerflor_collections_complete.json');
fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2));

console.log('✅ Created Gerflor collections structure');
console.log(`📁 Saved to: ${outputPath}`);
console.log(`\n📊 Collections created: ${collections.length}`);
console.log(`\n⚠️  Note: Colors need to be added. This is just the structure.`);
console.log(`\nCollections:`);
collections.forEach(col => {
  console.log(`  - ${col.name} (${col.slug})`);
});
