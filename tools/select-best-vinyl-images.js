const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const extractDir = path.join(rootDir, 'tmp', 'extracted-vinyl-images');
const vinylDir = path.join(rootDir, 'public', 'images', 'products', 'vinyl');

// Map collection names with multiple matching patterns
const collectionPatterns = {
  'mipolam-accord': ['accord'],
  'mipolam-affinity': ['affinity'],
  'mipolam-affinity-608x608': ['affinity', '608'],
  'mipolam-astro': ['astro'],
  'mipolam-bioplanet': ['bioplanet', 'bio planet'],
  'mipolam-classic-15mm': ['classic', '1-5', '1.5', '15'],
  'mipolam-classic-2mm': ['classic', '2mm', '2 mm'],
  'mipolam-elegance': ['elegance'],
  'mipolam-planet': ['planet'],
  'mipolam-symbioz': ['symbioz'],
  'mipolam-troplan': ['troplan'],
};

// Get all extracted directories
const extractedDirs = fs.readdirSync(extractDir, { withFileTypes: true })
  .filter(dirent => dirent.isDirectory())
  .map(dirent => dirent.name)
  .filter(name => name.startsWith('product-sku-media-resources-'));

console.log(`Processing ${extractedDirs.length} extracted directories\n`);

// Collect all images by collection
const imagesByCollection = {};

extractedDirs.forEach(dirName => {
  const dirPath = path.join(extractDir, dirName);
  if (!fs.existsSync(dirPath)) return;
  
  const files = fs.readdirSync(dirPath);
  
  files.forEach(file => {
    const filePath = path.join(dirPath, file);
    const stats = fs.statSync(filePath);
    const fileName = file.toLowerCase();
    
    // Skip very small files (likely thumbnails)
    if (stats.size < 50000) return;
    
    // Find matching collection
    for (const [collection, patterns] of Object.entries(collectionPatterns)) {
      const matches = patterns.some(pattern => fileName.includes(pattern));
      
      if (matches) {
        // Prefer non-PDT images (product images), but include all for selection
        const isPDT = fileName.includes('pdt') || fileName.includes('product thumbnail');
        const isCollectionImage = !fileName.includes('color') && 
                                  !fileName.includes('scan') &&
                                  !fileName.includes('mood board') &&
                                  !fileName.includes('room scene');
        
        if (!imagesByCollection[collection]) {
          imagesByCollection[collection] = [];
        }
        
        imagesByCollection[collection].push({
          path: filePath,
          name: file,
          size: stats.size,
          isPDT,
          isCollectionImage,
        });
        
        break;
      }
    }
  });
});

// Select best image for each collection and copy it
Object.entries(imagesByCollection).forEach(([collection, images]) => {
  console.log(`\n${collection}:`);
  images.forEach(img => {
    console.log(`  - ${img.name} (${(img.size / 1024).toFixed(1)} KB, PDT: ${img.isPDT}, Collection: ${img.isCollectionImage})`);
  });
  
  // Select best image: prefer non-PDT, collection images, largest size
  const bestImage = images
    .filter(img => img.isCollectionImage || !img.isPDT) // Prefer collection images or non-PDT
    .sort((a, b) => {
      // First sort by isCollectionImage
      if (a.isCollectionImage !== b.isCollectionImage) {
        return b.isCollectionImage - a.isCollectionImage;
      }
      // Then by size (largest first)
      return b.size - a.size;
    })[0] || images.sort((a, b) => b.size - a.size)[0]; // Fallback to largest
  
  if (bestImage) {
    const destDir = path.join(vinylDir, collection);
    const destPath = path.join(destDir, 'collection.jpg');
    
    // Ensure destination directory exists
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }
    
    // Copy the best image
    fs.copyFileSync(bestImage.path, destPath);
    console.log(`  ✓ Selected: ${bestImage.name} → ${collection}/collection.jpg`);
  }
});

console.log('\n✓ Done! Best images selected and copied.');
