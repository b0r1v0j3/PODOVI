const fs = require('fs');
const path = require('path');

const scraped = JSON.parse(fs.readFileSync('tools/premium-compact-colors.json', 'utf8'));
const vinyl = JSON.parse(fs.readFileSync('public/data/vinyl_colors_complete.json', 'utf8'));

const collection = {
  name: 'Premium Compact',
  slug: 'premium-compact',
  url: 'https://www.gerflor-cee.com/products/premium-compact',
  colorCount: scraped.length,
  colors: scraped.map(c => ({
    code: c.code,
    name: c.name,
    sku: c.sku,
    href: c.href,
    collection_slug: 'premium-compact',
    image: `/images/products/vinyl/premium-compact/${c.name.toLowerCase().replace(/\s+/g, '-')}.jpg`
  }))
};

vinyl.collections.push(collection);
vinyl.totalColors = vinyl.collections.reduce((sum, c) => sum + (c.colors?.length || 0), 0);

fs.writeFileSync('public/data/vinyl_colors_complete.json', JSON.stringify(vinyl, null, 2));
console.log('Added Premium Compact collection with', scraped.length, 'colors');
