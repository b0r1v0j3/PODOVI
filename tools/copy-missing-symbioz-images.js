const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.join(__dirname, '..');
const extractDir = path.join(rootDir, 'tmp', 'check-new-symbioz');
const symbiozDir = path.join(rootDir, 'public', 'images', 'products', 'vinyl', 'mipolam-symbioz');

// Missing colors with their codes and possible name variations
const missingColors = [
  { code: '6001', name: 'cotton', variations: ['cotton', '6001'] },
  { code: '6025', name: 'tangelo', variations: ['tangelo', '6025'] },
  { code: '6031', name: 'breeze', variations: ['breeze', '6031'] },
  { code: '6032', name: 'sunshine', variations: ['sunshine', '6032'] },
  { code: '6036', name: 'oceania', variations: ['oceania', '6036'] },
  { code: '6059', name: 'black diamond', variations: ['black diamond', 'blackdiamond', '6059', '6058 black diamond'] },
  { code: '6075', name: 'cardinal', variations: ['cardinal', '6075'] }
];

// Get all ZIP files
const zipFiles = fs.readdirSync(rootDir)
  .filter(file => file.startsWith('product-sku-media-resources-') && file.endsWith('.zip'))
  .map(file => path.join(rootDir, file));

console.log(`Checking ${zipFiles.length} ZIP files for missing Symbioz images...\n`);

if (!fs.existsSync(extractDir)) {
  fs.mkdirSync(extractDir, { recursive: true });
}

if (!fs.existsSync(symbiozDir)) {
  fs.mkdirSync(symbiozDir, { recursive: true });
}

let foundImages = new Map(); // code -> { file, path, size }

zipFiles.forEach((zipPath, index) => {
  const zipName = path.basename(zipPath, '.zip');
  const destDir = path.join(extractDir, zipName);
  
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }
  
  try {
    if (index % 50 === 0) {
      console.log(`[${index + 1}/${zipFiles.length}] Checking ${zipName}...`);
    }
    execSync(`powershell -Command "Expand-Archive -Path '${zipPath.replace(/'/g, "''")}' -DestinationPath '${destDir.replace(/'/g, "''")}' -Force"`, {
      cwd: rootDir,
      stdio: 'ignore'
    });
    
    // Check for missing color images
    if (fs.existsSync(destDir)) {
      const files = fs.readdirSync(destDir);
      files.forEach(file => {
        const fileName = file.toLowerCase();
        
        // Check if file matches any missing color
        missingColors.forEach(color => {
          const isMatch = color.variations.some(variation => {
            if (variation === '6058 black diamond') {
              return fileName.includes('6058') && fileName.includes('black') && fileName.includes('diamond');
            }
            return fileName.includes(variation.toLowerCase());
          });
          
          if (isMatch && !fileName.includes('collection')) {
            const filePath = path.join(destDir, file);
            const stats = fs.statSync(filePath);
            
            // Use largest file if multiple matches
            if (!foundImages.has(color.code) || stats.size > foundImages.get(color.code).size) {
              foundImages.set(color.code, {
                code: color.code,
                name: color.name,
                file: file,
                path: filePath,
                size: stats.size
              });
            }
          }
        });
      });
    }
  } catch (error) {
    // Continue
  }
});

console.log('\n\nCopying found images...\n');

let copiedCount = 0;

foundImages.forEach((img, code) => {
  const colorFileName = `${img.code}-${img.name.toLowerCase().replace(/\s+/g, '-')}.jpg`;
  const destPath = path.join(symbiozDir, colorFileName);
  
  fs.copyFileSync(img.path, destPath);
  console.log(`  ✓ ${img.code} ${img.name.toUpperCase()} → ${colorFileName}`);
  copiedCount++;
});

console.log(`\n✅ Copied ${copiedCount} missing images for Mipolam Symbioz`);
console.log(`📁 Location: ${symbiozDir}`);
