const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.join(__dirname, '..');
const eleganceDir = path.join(rootDir, 'public', 'images', 'products', 'vinyl', 'mipolam-elegance');

// Missing colors in order
const missingColors = [
  { code: '0322', name: 'JICAMA', fileName: '0322-jicama.jpg' },
  { code: '0326', name: 'JOJOBA', fileName: '0326-jojoba.jpg' },
  { code: '0328', name: 'ALMOND', fileName: '0328-almond.jpg' },
  { code: '0329', name: 'HAZELNUT', fileName: '0329-hazelnut.jpg' },
  { code: '0331', name: 'PLUM', fileName: '0331-plum.jpg' },
  { code: '0333', name: 'ANANAS', fileName: '0333-ananas.jpg' },
  { code: '0336', name: 'ACEROLA', fileName: '0336-acerola.jpg' },
  { code: '0338', name: 'KIWI', fileName: '0338-kiwi.jpg' },
  { code: '0340', name: 'JAMBOLAN', fileName: '0340-jambolan.jpg' },
  { code: '0341', name: 'BILBERRY', fileName: '0341-bilberry.jpg' },
  { code: '0342', name: 'BLUEBERRY', fileName: '0342-blueberry.jpg' },
  { code: '0344', name: 'NUTMEG', fileName: '0344-nutmeg.jpg' },
  { code: '0347', name: 'MANGOUSTAN', fileName: '0347-mangoustan.jpg' },
  { code: '0348', name: 'BLUETTA', fileName: '0348-bluetta.jpg' },
  { code: '0349', name: 'BLUECROP', fileName: '0349-bluecrop.jpg' },
  { code: '0696', name: 'GINGER', fileName: '0696-ginger.jpg' },
  { code: '0697', name: 'GREENSTONE', fileName: '0697-greenstone.jpg' },
  { code: '0698', name: 'CACAO', fileName: '0698-cacao.jpg' },
  { code: '0699', name: 'BANANA', fileName: '0699-banana.jpg' },
  { code: '0700', name: 'MELON', fileName: '0700-melon.jpg' },
  { code: '0702', name: 'KUMQUAT', fileName: '0702-kumquat.jpg' },
  { code: '0704', name: 'RASPBERRY GREY', fileName: '0704-raspberry-grey.jpg' },
  { code: '0705', name: 'PATISSON', fileName: '0705-patisson.jpg' },
];

// Get ZIP files in root, sorted by name
const zipFiles = fs.readdirSync(rootDir)
  .filter(file => file.startsWith('product-sku-media-resources-') && file.endsWith('.zip'))
  .sort()
  .map(file => path.join(rootDir, file));

console.log(`Found ${zipFiles.length} ZIP files in root directory\n`);
console.log(`Need ${missingColors.length} images for missing Elegance colors\n`);

if (zipFiles.length < missingColors.length) {
  console.warn(`⚠️  Warning: Only ${zipFiles.length} ZIP files found, but need ${missingColors.length} images`);
}

// Extract directory
const extractDir = path.join(rootDir, 'tmp', 'extracted-elegance-zips');
if (!fs.existsSync(extractDir)) {
  fs.mkdirSync(extractDir, { recursive: true });
}

// Ensure destination directory exists
if (!fs.existsSync(eleganceDir)) {
  fs.mkdirSync(eleganceDir, { recursive: true });
}

let organizedCount = 0;

// Process each ZIP file in order
zipFiles.forEach((zipPath, index) => {
  if (index >= missingColors.length) {
    return; // Skip if we have more ZIPs than needed
  }
  
  const zipName = path.basename(zipPath, '.zip');
  const destDir = path.join(extractDir, zipName);
  const color = missingColors[index];
  
  console.log(`[${index + 1}/${Math.min(zipFiles.length, missingColors.length)}] Processing ${zipName} → ${color.code} ${color.name}`);
  
  // Extract ZIP
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }
  
  try {
    execSync(`powershell -Command "Expand-Archive -Path '${zipPath.replace(/'/g, "''")}' -DestinationPath '${destDir.replace(/'/g, "''")}' -Force"`, {
      cwd: rootDir,
      stdio: 'ignore'
    });
    
    // Find all JPG files in extracted directory
    const getAllFiles = (dirPath, arrayOfFiles = []) => {
      const files = fs.readdirSync(dirPath);
      files.forEach(file => {
        const filePath = path.join(dirPath, file);
        if (fs.statSync(filePath).isDirectory()) {
          arrayOfFiles = getAllFiles(filePath, arrayOfFiles);
        } else if (file.toLowerCase().endsWith('.jpg') || file.toLowerCase().endsWith('.jpeg')) {
          arrayOfFiles.push(filePath);
        }
      });
      return arrayOfFiles;
    };
    
    const extractedFiles = getAllFiles(destDir);
    
    if (extractedFiles.length === 0) {
      console.log(`  ⚠️  No images found in ${zipName}`);
      return;
    }
    
    // Find the best image (largest file, not collection/mood board)
    const validImages = extractedFiles.filter(file => {
      const fileName = path.basename(file).toLowerCase();
      return !fileName.includes('collection') && 
             !fileName.includes('mood') && 
             !fileName.includes('office') &&
             !fileName.includes('3d');
    });
    
    if (validImages.length === 0) {
      console.log(`  ⚠️  No valid images found in ${zipName}`);
      return;
    }
    
    // Get largest image
    const bestImage = validImages.reduce((prev, curr) => {
      const prevSize = fs.statSync(prev).size;
      const currSize = fs.statSync(curr).size;
      return currSize > prevSize ? curr : prev;
    });
    
    const destPath = path.join(eleganceDir, color.fileName);
    fs.copyFileSync(bestImage, destPath);
    
    console.log(`  ✓ Copied ${path.basename(bestImage)} → ${color.fileName}`);
    organizedCount++;
    
  } catch (error) {
    console.error(`  ✗ Error processing ${zipName}: ${error.message}`);
  }
});

console.log(`\n✅ Organized ${organizedCount} images for Mipolam Elegance`);
console.log(`📁 Location: ${eleganceDir}`);

// Now update JSON file
if (organizedCount > 0) {
  console.log(`\nUpdating vinyl_colors_complete.json...`);
  
  const colorsDataPath = path.join(rootDir, 'public', 'data', 'vinyl_colors_complete.json');
  const colorsData = JSON.parse(fs.readFileSync(colorsDataPath, 'utf8'));
  
  const eleganceCollection = colorsData.collections.find(c => c.slug === 'mipolam-elegance');
  if (eleganceCollection) {
    let updatedCount = 0;
    
    missingColors.forEach((color, index) => {
      if (index < organizedCount) {
        const imagePath = `/images/products/vinyl/mipolam-elegance/${color.fileName}`;
        const fullPath = path.join(rootDir, 'public', imagePath);
        
        if (fs.existsSync(fullPath)) {
          const colorEntry = eleganceCollection.colors.find(c => c.code === color.code);
          if (colorEntry) {
            colorEntry.image = imagePath;
            updatedCount++;
          }
        }
      }
    });
    
    fs.writeFileSync(colorsDataPath, JSON.stringify(colorsData, null, 2));
    console.log(`✅ Updated ${updatedCount} color entries in JSON file`);
  }
}
