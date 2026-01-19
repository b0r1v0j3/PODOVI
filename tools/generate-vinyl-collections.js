const fs = require('fs');
const path = require('path');

const vinylData = require('../public/data/vinyl_colors_complete.json');

// Group colors by collection
const collectionsMap = {};
vinylData.colors.forEach(color => {
  const collectionKey = color.collection;
  if (!collectionsMap[collectionKey]) {
    collectionsMap[collectionKey] = {
      slug: color.collection,
      name: color.collection_name,
      type: color.type, // homogeneous or heterogeneous
      colors: [],
      colorCount: 0
    };
  }
  collectionsMap[collectionKey].colors.push(color);
  collectionsMap[collectionKey].colorCount++;
});

// Generate Product objects for each collection
const collections = Object.values(collectionsMap).map((collection, index) => {
  const slug = `gerflor-${collection.slug}`;
  const sku = `GER-${collection.slug.toUpperCase().replace(/-/g, '')}`;
  
  // Use collection.jpg as collection image
  const imageUrl = `/images/products/vinyl/${collection.slug}/collection.jpg`;

  return {
    id: `vinil-collection-${index}`,
    name: `Gerflor ${collection.name}`,
    slug: slug,
    sku: sku,
    categoryId: '2', // Vinil
    brandId: '6', // Gerflor
    shortDescription: `${collection.name} - ${collection.type === 'homogeneous' ? 'Homogeni' : 'Heterogeni'} vinil podovi`,
    description: `Gerflor ${collection.name} kolekcija sadrži ${collection.colorCount} ${collection.colorCount === 1 ? 'boju' : 'boja'}.`,
    images: imageUrl ? [{
      id: `${slug}-img-1`,
      url: imageUrl,
      alt: collection.name,
      isPrimary: true,
      order: 1,
    }] : [],
    specs: [
      { key: 'collection', label: 'Kolekcija', value: collection.name },
      { key: 'type', label: 'Tip', value: collection.type === 'homogeneous' ? 'Homogeni' : 'Heterogeni' },
      { key: 'colors', label: 'Broj boja', value: collection.colorCount.toString() }
    ],
    inStock: true,
    featured: false,
    externalLink: `https://www.gerflor-cee.com/products/${collection.slug}`,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };
});

// Sort by name
collections.sort((a, b) => a.name.localeCompare(b.name));

console.log(`Generated ${collections.length} vinyl collections`);
console.log('\nCollections:');
collections.forEach(c => {
  const colorCount = c.specs.find(s => s.key === 'colors')?.value || '0';
  console.log(`  - ${c.name}: ${colorCount} colors`);
});

// Write to file
const outputPath = path.join(__dirname, '..', 'lib', 'data', 'vinyl-collections-generated.ts');

// Convert to proper TypeScript format with Date objects
const collectionsTS = collections.map(c => {
  const createdAt = c.createdAt.toISOString();
  const updatedAt = c.updatedAt.toISOString();
  return { ...c, createdAt, updatedAt };
});

const output = `import { Product } from '@/types';

export const vinyl_collections: Product[] = ${JSON.stringify(collectionsTS, null, 2).replace(/"createdAt": "(.*?)"/g, 'createdAt: new Date("$1")').replace(/"updatedAt": "(.*?)"/g, 'updatedAt: new Date("$1")')};
`;

fs.writeFileSync(outputPath, output, 'utf-8');
console.log(`\n✅ Written to ${outputPath}`);
