const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const extractDir = path.join(rootDir, 'tmp', 'extracted-vinyl-images');
const vinylDir = path.join(rootDir, 'public', 'images', 'products', 'vinyl');

// Map collection names to their directory slugs
const collectionMap = {
  'mipolam-accord': 'mipolam-accord',
  'mipolam-affinity': 'mipolam-affinity',
  'mipolam-affinity-608x608': 'mipolam-affinity-608x608',
  'mipolam-astro': 'mipolam-astro',
  'mipolam-bioplanet': 'mipolam-bioplanet',
  'mipolam-classic-15mm': 'mipolam-classic-15mm',
  'mipolam-classic-2mm': 'mipolam-classic-2mm',
  'mipolam-elegance': 'mipolam-elegance',
  'mipolam-planet': 'mipolam-planet',
  'mipolam-symbioz': 'mipolam-symbioz',
  'mipolam-troplan': 'mipolam-troplan',
};

// Get all extracted directories
const extractedDirs = fs.readdirSync(extractDir, { withFileTypes: true })
  .filter(dirent => dirent.isDirectory())
  .map(dirent => dirent.name);

console.log(`Found ${extractedDirs.length} extracted directories\n`);

// Process each extracted directory
extractedDirs.forEach((dirName, index) => {
  const dirPath = path.join(extractDir, dirName);
  const files = fs.readdirSync(dirPath);
  
  console.log(`[${index + 1}/${extractedDirs.length}] ${dirName}:`);
  files.forEach(file => {
    const filePath = path.join(dirPath, file);
    const stats = fs.statSync(filePath);
    console.log(`  - ${file} (${(stats.size / 1024).toFixed(1)} KB)`);
    
    // Try to identify which collection this belongs to
    const fileName = file.toLowerCase();
    
    // Find matching collection
    let matchedCollection = null;
    for (const [key, slug] of Object.entries(collectionMap)) {
      if (fileName.includes(key.replace('mipolam-', '')) || 
          fileName.includes(key) ||
          fileName.includes('accord') && key === 'mipolam-accord' ||
          fileName.includes('affinity') && (key.includes('affinity')) ||
          fileName.includes('astro') && key === 'mipolam-astro' ||
          fileName.includes('bioplanet') && key === 'mipolam-bioplanet' ||
          fileName.includes('classic') && key.includes('classic') ||
          fileName.includes('elegance') && key === 'mipolam-elegance' ||
          fileName.includes('planet') && key === 'mipolam-planet' ||
          fileName.includes('symbioz') && key === 'mipolam-symbioz' ||
          fileName.includes('troplan') && key === 'mipolam-troplan') {
        matchedCollection = slug;
        break;
      }
    }
    
    if (matchedCollection) {
      // Check if this is a collection image (not a product/color image)
      const isCollectionImage = !fileName.includes('pdt') && 
                                 !fileName.includes('color') &&
                                 !fileName.includes('scan') &&
                                 (fileName.includes('collection') || 
                                  fileName.includes('accord') ||
                                  fileName.includes('affinity') ||
                                  fileName.includes('astro') ||
                                  fileName.includes('bioplanet') ||
                                  fileName.includes('classic') ||
                                  fileName.includes('elegance') ||
                                  fileName.includes('planet') ||
                                  fileName.includes('symbioz') ||
                                  fileName.includes('troplan'));
      
      if (isCollectionImage) {
        const destDir = path.join(vinylDir, matchedCollection);
        const destPath = path.join(destDir, 'collection.jpg');
        
        // Ensure destination directory exists
        if (!fs.existsSync(destDir)) {
          fs.mkdirSync(destDir, { recursive: true });
        }
        
        // Copy the file
        fs.copyFileSync(filePath, destPath);
        console.log(`    → Copied to ${matchedCollection}/collection.jpg`);
      }
    } else {
      console.log(`    → Could not match to collection`);
    }
  });
  console.log('');
});

console.log('Done organizing collection images!');
