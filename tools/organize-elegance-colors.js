const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const extractDir = path.join(rootDir, 'tmp', 'extracted-elegance-colors');
const eleganceDir = path.join(rootDir, 'public', 'images', 'products', 'vinyl', 'mipolam-elegance');

// Read colors data
const colorsDataPath = path.join(rootDir, 'public', 'data', 'vinyl_colors_complete.json');
const colorsData = JSON.parse(fs.readFileSync(colorsDataPath, 'utf8'));

// Get Mipolam Elegance colors
const eleganceCollection = colorsData.collections.find(c => c.slug === 'mipolam-elegance');
if (!eleganceCollection) {
  console.error('Mipolam Elegance collection not found!');
  process.exit(1);
}

console.log(`Found ${eleganceCollection.colors.length} colors for Mipolam Elegance\n`);

// Find all ZIP files that might contain color images
const zipFiles = fs.readdirSync(rootDir)
  .filter(file => file.startsWith('product-sku-media-resources-') && file.endsWith('.zip'))
  .map(file => path.join(rootDir, file));

console.log(`Found ${zipFiles.length} ZIP files to process\n`);

// Extract all ZIPs first
if (!fs.existsSync(extractDir)) {
  fs.mkdirSync(extractDir, { recursive: true });
}

const { execSync } = require('child_process');

zipFiles.forEach((zipPath, index) => {
  const zipName = path.basename(zipPath, '.zip');
  const destDir = path.join(extractDir, zipName);
  
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }
  
  try {
    if (index % 10 === 0) {
      console.log(`[${index + 1}/${zipFiles.length}] Extracting ${zipName}...`);
    }
    execSync(`powershell -Command "Expand-Archive -Path '${zipPath.replace(/'/g, "''")}' -DestinationPath '${destDir.replace(/'/g, "''")}' -Force"`, {
      cwd: rootDir,
      stdio: 'ignore'
    });
  } catch (error) {
    // Continue if already extracted
  }
});

// Now find and organize color images
console.log('\nOrganizing color images for Mipolam Elegance...\n');

// Create colors directory
if (!fs.existsSync(eleganceDir)) {
  fs.mkdirSync(eleganceDir, { recursive: true });
}

// Also check root directory for new images
const rootImageFiles = fs.readdirSync(rootDir)
  .filter(file => {
    const ext = path.extname(file).toLowerCase();
    return ext === '.jpg' || ext === '.jpeg' || ext === '.png';
  })
  .map(file => path.join(rootDir, file));

console.log(`Found ${rootImageFiles.length} image files in root directory\n`);

// Get all extracted files (including check-elegance-all)
const checkEleganceAllDir = path.join(rootDir, 'tmp', 'check-elegance-all');
const extractedDirs = fs.readdirSync(extractDir, { withFileTypes: true })
  .filter(dirent => dirent.isDirectory())
  .map(dirent => dirent.name);

// Also check check-elegance-all directory if it exists
if (fs.existsSync(checkEleganceAllDir)) {
  const checkDirs = fs.readdirSync(checkEleganceAllDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => path.join(checkEleganceAllDir, dirent.name));
  extractedDirs.push(...checkDirs.map(d => path.relative(extractDir, d)));
}

let organizedCount = 0;

// Function to match and copy image
function matchAndCopyImage(filePath, fileName) {
  // Skip collection images
  if (fileName.includes('collection') || (fileName.includes('elegance') && !fileName.match(/\d{4}/))) {
    return false;
  }
  
  // Try to match file to a color
  let matched = false;
  eleganceCollection.colors.forEach(color => {
    const colorCode = color.code.toLowerCase();
    const colorName = color.name.toLowerCase().replace(/\s+/g, '-');
    const colorNameNoSpaces = color.name.toLowerCase().replace(/\s+/g, '');
    
    // Check if file name contains color code or color name
    if (fileName.includes(colorCode) || 
        fileName.includes(colorName) ||
        fileName.includes(color.code) ||
        fileName.includes(colorNameNoSpaces)) {
      
      // Create color filename
      const colorFileName = `${color.code}-${color.name.toLowerCase().replace(/\s+/g, '-')}.jpg`;
      const destPath = path.join(eleganceDir, colorFileName);
      
      // Copy file (use largest if multiple matches)
      if (!fs.existsSync(destPath)) {
        fs.copyFileSync(filePath, destPath);
        console.log(`  ✓ ${color.code} ${color.name} → ${colorFileName}`);
        organizedCount++;
        matched = true;
      } else {
        // If file exists, check if new one is larger
        const existingStats = fs.statSync(destPath);
        const newStats = fs.statSync(filePath);
        if (newStats.size > existingStats.size) {
          fs.copyFileSync(filePath, destPath);
          console.log(`  ↻ ${color.code} ${color.name} → ${colorFileName} (replaced with larger)`);
          matched = true;
        }
      }
    }
  });
  return matched;
}

// Check root directory images first
rootImageFiles.forEach(filePath => {
  const fileName = path.basename(filePath).toLowerCase();
  matchAndCopyImage(filePath, fileName);
});

// Check extracted ZIP files
extractedDirs.forEach(dirName => {
  const dirPath = path.join(extractDir, dirName);
  if (!fs.existsSync(dirPath)) return;
  
  const files = fs.readdirSync(dirPath);
  
  files.forEach(file => {
    const filePath = path.join(dirPath, file);
    const fileName = file.toLowerCase();
    matchAndCopyImage(filePath, fileName);
  });
});

console.log(`\n✅ Organized ${organizedCount} color images for Mipolam Elegance`);
console.log(`📁 Location: ${eleganceDir}`);
