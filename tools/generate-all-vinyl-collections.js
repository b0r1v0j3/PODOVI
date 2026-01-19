const fs = require('fs');
const path = require('path');

// Read vinyl colors JSON
const vinylColorsPath = path.join(__dirname, '../public/data/vinyl_colors_complete.json');
const vinylData = JSON.parse(fs.readFileSync(vinylColorsPath, 'utf8'));

// Extract unique collections
const collectionsMap = {};
vinylData.colors.forEach(color => {
  if (!collectionsMap[color.collection]) {
    collectionsMap[color.collection] = {
      name: color.collection_name,
      slug: color.collection,
      type: color.type,
      count: 0,
    };
  }
  collectionsMap[color.collection].count++;
});

// Sort by name
const collections = Object.values(collectionsMap).sort((a, b) => a.name.localeCompare(b.name));

console.log(`Found ${collections.length} vinyl collections\n`);

// Generate Product objects for remaining collections (index 3+)
const products = collections.slice(3).map((col, index) => {
  const actualIndex = index + 3;
  const slugWithPrefix = `gerflor-${col.slug}`;
  const typeLabel = col.type === 'homogeneous' ? 'Homogeni' : 'Heterogeni';
  
  return `  {
    id: 'vinil-collection-${actualIndex}',
    name: 'Gerflor ${col.name}',
    slug: '${slugWithPrefix}',
    sku: 'GER-${col.slug.toUpperCase().replace(/-/g, '')}',
    categoryId: '2',
    brandId: '6',
    shortDescription: '${col.name} - ${typeLabel} vinil podovi',
    description: 'Gerflor ${col.name} kolekcija sadrži ${col.count} boja.',
    images: [{
      id: '${slugWithPrefix}-img',
      url: '/images/products/vinyl/${col.slug}/collection.jpg',
      alt: '${col.name}',
      isPrimary: true,
      order: 1,
    }],
    specs: [
      { key: 'collection', label: 'Kolekcija', value: '${col.name}' },
      { key: 'type', label: 'Tip', value: '${typeLabel}' },
      { key: 'colors', label: 'Broj boja', value: '${col.count}' },
    ],
    inStock: true,
    featured: false,
    externalLink: 'https://www.gerflor-cee.com/products/${col.slug}',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  }`;
});

console.log(products.join(',\n'));
