const fs = require('fs');
const path = require('path');

const vinylData = require('../public/data/vinyl_colors_complete.json');

console.log(`Generating TypeScript file with ${vinylData.colors.length} vinyl colors...`);

// Convert colors to Product objects
const colors = vinylData.colors.map((color, index) => {
  const categoryId = '2'; // Vinil
  const brandId = '6'; // Gerflor
  
  const primaryImageUrl = color.image_url || '';

  return {
    id: `color-vinil-${color.slug}`,
    name: color.full_name || `${color.code} ${color.name}`,
    slug: color.slug,
    sku: color.code,
    categoryId: categoryId,
    brandId: brandId,
    shortDescription: `${color.collection_name} - ${color.name}`,
    description: color.description || `${color.full_name} iz kolekcije ${color.collection_name}`,
    images: primaryImageUrl ? [{
      id: `color-img-${index}`,
      url: primaryImageUrl,
      alt: color.full_name || color.name,
      isPrimary: true,
      order: 1,
    }] : [],
    specs: [
      { key: 'collection', label: 'Kolekcija', value: color.collection_name },
      { key: 'code', label: 'Šifra', value: color.code },
      { key: 'type', label: 'Tip', value: color.type === 'homogeneous' ? 'Homogeni' : 'Heterogeni' }
    ],
    inStock: true,
    featured: false,
    externalLink: `https://www.gerflor-cee.com/products/${color.collection}`,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };
});

console.log(`Generated ${colors.length} color products`);
console.log(`  Homogeneous: ${colors.filter(c => c.specs.find(s => s.key === 'type')?.value === 'Homogeni').length}`);
console.log(`  Heterogeneous: ${colors.filter(c => c.specs.find(s => s.key === 'type')?.value === 'Heterogeni').length}`);

// Split into chunks to avoid too large files
const chunkSize = 200;
const chunks = [];
for (let i = 0; i < colors.length; i += chunkSize) {
  chunks.push(colors.slice(i, i + chunkSize));
}

console.log(`\nSplit into ${chunks.length} chunks of ~${chunkSize} colors each`);

// Write main file
const outputPath = path.join(__dirname, '..', 'lib', 'data', 'vinyl-colors-generated.ts');

const colorsTS = colors.map(c => {
  const createdAt = c.createdAt.toISOString();
  const updatedAt = c.updatedAt.toISOString();
  return { ...c, createdAt, updatedAt };
});

// Write as a single export
const output = `import { Product } from '@/types';

export const vinyl_colors: Product[] = ${JSON.stringify(colorsTS, null, 2)
  .replace(/"createdAt": "(.*?)"/g, 'createdAt: new Date("$1")')
  .replace(/"updatedAt": "(.*?)"/g, 'updatedAt: new Date("$1")')};
`;

fs.writeFileSync(outputPath, output, 'utf-8');
console.log(`\n✅ Written to ${outputPath}`);
console.log(`   File size: ${(fs.statSync(outputPath).size / 1024 / 1024).toFixed(2)} MB`);
