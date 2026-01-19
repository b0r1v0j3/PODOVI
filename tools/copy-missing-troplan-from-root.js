const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const troplanDir = path.join(rootDir, 'public', 'images', 'products', 'vinyl', 'mipolam-troplan');

// Missing colors for Mipolam Troplan
const missingColors = [
  { code: '1003', name: 'LIGHT OCRE' },
  { code: '1004', name: 'EARTH' },
  { code: '1032', name: 'YELLOW' },
  { code: '1035', name: 'OCRE' },
  { code: '1037', name: 'MEDIUM GREEN' },
  { code: '1040', name: 'DARK GREY' },
  { code: '1055', name: 'APRICOT' },
  { code: '1057', name: 'DARK GREEN' },
  { code: '1059', name: 'BLUE GREY' },
  { code: '1060', name: 'ANTHRACITE' },
];

// Get all files in root directory
const rootFiles = fs.readdirSync(rootDir, { withFileTypes: true })
  .filter(dirent => dirent.isFile())
  .map(dirent => dirent.name);

console.log(`Searching for missing Troplan color images in root directory...\n`);
console.log(`Found ${rootFiles.length} files in root\n`);

let foundCount = 0;

// Search for images in root directory
rootFiles.forEach(file => {
  const fileName = file.toLowerCase();
  const filePath = path.join(rootDir, file);
  
  // Skip non-image files
  if (!fileName.endsWith('.jpg') && !fileName.endsWith('.jpeg') && !fileName.endsWith('.png')) {
    return;
  }
  
  // Try to match to missing colors
  missingColors.forEach(color => {
    const colorCode = color.code.toLowerCase();
    const colorName = color.name.toLowerCase().replace(/\s+/g, '-');
    const colorNameNoSpace = color.name.toLowerCase().replace(/\s+/g, '');
    
    // Check various patterns
    if (fileName.includes(`troplan`) && 
        (fileName.includes(colorCode) || 
         fileName.includes(colorName) ||
         fileName.includes(colorNameNoSpace))) {
      
      const destFileName = `${color.code}-${color.name.toLowerCase().replace(/\s+/g, '-')}.jpg`;
      const destPath = path.join(troplanDir, destFileName);
      
      if (!fs.existsSync(destPath)) {
        fs.copyFileSync(filePath, destPath);
        console.log(`  ✓ Found ${color.code} ${color.name} → ${destFileName}`);
        foundCount++;
      }
    }
  });
});

// Also check ZIP files in root
const zipFiles = rootFiles.filter(f => f.startsWith('product-sku-media-resources-') && f.endsWith('.zip'));

if (zipFiles.length > 0) {
  console.log(`\nChecking ${zipFiles.length} ZIP files...\n`);
  
  const { execSync } = require('child_process');
  const extractDir = path.join(rootDir, 'tmp', 'extracted-troplan-root');
  
  if (!fs.existsSync(extractDir)) {
    fs.mkdirSync(extractDir, { recursive: true });
  }
  
  zipFiles.forEach((zipFile, index) => {
    const zipPath = path.join(rootDir, zipFile);
    const zipName = path.basename(zipFile, '.zip');
    const destDir = path.join(extractDir, zipName);
    
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }
    
    try {
      execSync(`powershell -Command "Expand-Archive -Path '${zipPath.replace(/'/g, "''")}' -DestinationPath '${destDir.replace(/'/g, "''")}' -Force"`, {
        cwd: rootDir,
        stdio: 'ignore'
      });
      
      // Search in extracted files
      const extractedFiles = getAllFiles(destDir);
      
      extractedFiles.forEach(extractedFile => {
        const fileName = path.basename(extractedFile).toLowerCase();
        
        missingColors.forEach(color => {
          const colorCode = color.code.toLowerCase();
          const colorName = color.name.toLowerCase().replace(/\s+/g, '-');
          const colorNameNoSpace = color.name.toLowerCase().replace(/\s+/g, '');
          
          if (fileName.includes(`troplan`) && 
              (fileName.includes(colorCode) || 
               fileName.includes(colorName) ||
               fileName.includes(colorNameNoSpace))) {
            
            const destFileName = `${color.code}-${color.name.toLowerCase().replace(/\s+/g, '-')}.jpg`;
            const destPath = path.join(troplanDir, destFileName);
            
            if (!fs.existsSync(destPath)) {
              fs.copyFileSync(extractedFile, destPath);
              console.log(`  ✓ Found ${color.code} ${color.name} in ${zipFile} → ${destFileName}`);
              foundCount++;
            }
          }
        });
      });
    } catch (error) {
      // Continue if extraction fails
    }
  });
}

function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);
  
  files.forEach(file => {
    const filePath = path.join(dirPath, file);
    if (fs.statSync(filePath).isDirectory()) {
      arrayOfFiles = getAllFiles(filePath, arrayOfFiles);
    } else if (file.toLowerCase().endsWith('.jpg') || file.toLowerCase().endsWith('.jpeg') || file.toLowerCase().endsWith('.png')) {
      arrayOfFiles.push(filePath);
    }
  });
  
  return arrayOfFiles;
}

console.log(`\n✅ Found and copied ${foundCount} missing color images`);
console.log(`📁 Location: ${troplanDir}`);

// Now update JSON file
if (foundCount > 0) {
  console.log(`\nUpdating vinyl_colors_complete.json...`);
  
  const colorsDataPath = path.join(rootDir, 'public', 'data', 'vinyl_colors_complete.json');
  const colorsData = JSON.parse(fs.readFileSync(colorsDataPath, 'utf8'));
  
  const troplanCollection = colorsData.collections.find(c => c.slug === 'mipolam-troplan');
  if (troplanCollection) {
    troplanCollection.colors.forEach(color => {
      const imageFileName = `${color.code}-${color.name.toLowerCase().replace(/\s+/g, '-')}.jpg`;
      const imagePath = `/images/products/vinyl/mipolam-troplan/${imageFileName}`;
      const fullPath = path.join(rootDir, 'public', imagePath);
      
      if (fs.existsSync(fullPath)) {
        color.image = imagePath;
      }
    });
    
    fs.writeFileSync(colorsDataPath, JSON.stringify(colorsData, null, 2));
    console.log(`✅ Updated vinyl_colors_complete.json with image paths`);
  }
}
