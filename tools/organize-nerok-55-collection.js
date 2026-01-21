const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.join(__dirname, '..');
const targetDir = path.join(rootDir, 'public', 'images', 'products', 'vinyl', 'nerok-55');
const archiveDir = path.join(rootDir, 'archive-old-zips');

// Ensure target directory exists
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

// Find collection image in root folder
const imageExtensions = ['.jpg', '.jpeg', '.png', '.JPG', '.JPEG', '.PNG'];
const rootFiles = fs.readdirSync(rootDir, { withFileTypes: true })
  .filter(dirent => dirent.isFile())
  .map(dirent => dirent.name);

const collectionImage = rootFiles.find(file => {
  const ext = path.extname(file);
  return imageExtensions.includes(ext) && 
    (file.toLowerCase().includes('nerok') || 
     file.toLowerCase().includes('collection') ||
     file.toLowerCase().includes('55'));
});

if (collectionImage) {
  const sourcePath = path.join(rootDir, collectionImage);
  const targetPath = path.join(targetDir, 'collection.jpg');
  
  console.log(`📸 Found collection image: ${collectionImage}`);
  fs.copyFileSync(sourcePath, targetPath);
  console.log(`✅ Copied to: ${targetPath}\n`);
} else {
  console.log('⚠️  Collection image not found in root folder.');
  console.log('   Looking for files with: nerok, collection, or 55 in name\n');
}

// Move ZIP file to archive
const zipFiles = rootFiles.filter(file => file.endsWith('.zip') && file.startsWith('product-sku-media-resources-'));
zipFiles.forEach(zipFile => {
  const sourcePath = path.join(rootDir, zipFile);
  const targetPath = path.join(archiveDir, zipFile);
  
  if (!fs.existsSync(archiveDir)) {
    fs.mkdirSync(archiveDir, { recursive: true });
  }
  
  fs.renameSync(sourcePath, targetPath);
  console.log(`📦 Moved ZIP to archive: ${zipFile}`);
});

// Update mock-data.ts path from linoleum to vinyl
const mockDataPath = path.join(rootDir, 'lib', 'data', 'mock-data.ts');
let mockData = fs.readFileSync(mockDataPath, 'utf8');

// Replace linoleum path with vinyl path for nerok-55
const oldPath = "/images/products/linoleum/nerok-55/collection.jpg";
const newPath = "/images/products/vinyl/nerok-55/collection.jpg";

if (mockData.includes(oldPath)) {
  mockData = mockData.replace(oldPath, newPath);
  fs.writeFileSync(mockDataPath, mockData);
  console.log(`✅ Updated path in mock-data.ts: ${newPath}\n`);
} else if (mockData.includes('/images/products/linoleum/nerok-55')) {
  mockData = mockData.replace(/\/images\/products\/linoleum\/nerok-55/g, '/images/products/vinyl/nerok-55');
  fs.writeFileSync(mockDataPath, mockData);
  console.log(`✅ Updated path in mock-data.ts to vinyl\n`);
} else {
  console.log('ℹ️  Path already correct or not found in mock-data.ts\n');
}

console.log('✅ Done!');
