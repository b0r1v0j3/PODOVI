const fs = require('fs');
const path = require('path');

const scraped = JSON.parse(fs.readFileSync('tools/taralay-impression-acoustic-colors.json', 'utf8'));
const vinyl = JSON.parse(fs.readFileSync('public/data/vinyl_colors_complete.json', 'utf8'));

const collection = {
  name: 'Taralay Impression Acoustic',
  slug: 'taralay-impression-acoustic',
  url: 'https://www.gerflor-cee.com/products/taralay-impression-acoustic',
  colorCount: scraped.length,
  colors: scraped.map(c => ({
    code: c.code,
    name: c.name,
    sku: c.sku,
    href: c.href,
    collection_slug: 'taralay-impression-acoustic',
    image: `/images/products/vinyl/taralay-impression-acoustic/${c.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}.jpg`
  }))
};

vinyl.collections.push(collection);
vinyl.totalColors = vinyl.collections.reduce((sum, c) => sum + (c.colors?.length || 0), 0);

fs.writeFileSync('public/data/vinyl_colors_complete.json', JSON.stringify(vinyl, null, 2));
console.log('Added Taralay Impression Acoustic collection with', scraped.length, 'colors');
