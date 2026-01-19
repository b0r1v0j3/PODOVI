const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const colorsDataPath = path.join(rootDir, 'public', 'data', 'vinyl_colors_complete.json');
const colorsData = JSON.parse(fs.readFileSync(colorsDataPath, 'utf8'));

// Function to update collection colors with image paths
function updateCollectionImages(collectionSlug, collectionName) {
  const collection = colorsData.collections.find(c => c.slug === collectionSlug);
  if (!collection) {
    console.error(`${collectionName} collection not found!`);
    return;
  }

  const collectionDir = path.join(rootDir, 'public', 'images', 'products', 'vinyl', collectionSlug);
  
  if (!fs.existsSync(collectionDir)) {
    console.log(`  ✗ Directory not found for ${collectionName}`);
    return;
  }
  
  const colorFiles = fs.readdirSync(collectionDir)
    .filter(file => file.endsWith('.jpg') && file !== 'collection.jpg');

  console.log(`\n${collectionName}:`);
  console.log(`Found ${colorFiles.length} color images\n`);

  // Update colors with image paths
  collection.colors.forEach(color => {
    const expectedFileName = `${color.code}-${color.name.toLowerCase().replace(/\s+/g, '-')}.jpg`;
    const imagePath = `/images/products/vinyl/${collectionSlug}/${expectedFileName}`;
    const fullPath = path.join(collectionDir, expectedFileName);
    
    if (fs.existsSync(fullPath)) {
      color.image = imagePath;
      console.log(`  ✓ ${color.code} ${color.name} - image added`);
    } else {
      // Try to find matching file
      const matchingFile = colorFiles.find(file => 
        file.includes(color.code) || 
        file.toLowerCase().includes(color.name.toLowerCase().replace(/\s+/g, ''))
      );
      
      if (matchingFile) {
        color.image = `/images/products/vinyl/${collectionSlug}/${matchingFile}`;
        console.log(`  ✓ ${color.code} ${color.name} - image found: ${matchingFile}`);
      } else {
        console.log(`  ✗ ${color.code} ${color.name} - image not found`);
      }
    }
  });
}

// Update Mipolam Accord colors
updateCollectionImages('mipolam-accord', 'Mipolam Accord');

// Update Mipolam Affinity colors
updateCollectionImages('mipolam-affinity', 'Mipolam Affinity');

// Update Mipolam Astro colors
updateCollectionImages('mipolam-astro', 'Mipolam Astro');

// Update Mipolam Bioplanet colors
updateCollectionImages('mipolam-bioplanet', 'Mipolam Bioplanet');

// Update Mipolam Classic 1.5mm colors
updateCollectionImages('mipolam-classic-1-5mm', 'Mipolam Classic 1.5 mm');

// Update Mipolam Classic 2mm colors
updateCollectionImages('mipolam-classic-2mm', 'Mipolam Classic 2mm');

// Update Mipolam Elegance colors
updateCollectionImages('mipolam-elegance', 'Mipolam Elegance');

// Save updated JSON
fs.writeFileSync(colorsDataPath, JSON.stringify(colorsData, null, 2));

console.log(`\n✅ Updated vinyl_colors_complete.json with image paths`);
console.log(`📁 ${colorsDataPath}`);
