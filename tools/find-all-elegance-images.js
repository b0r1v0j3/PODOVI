const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.join(__dirname, '..');
const extractDir = path.join(rootDir, 'tmp', 'check-elegance-all');

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

// Get all ZIP files
const zipFiles = fs.readdirSync(rootDir)
  .filter(file => file.startsWith('product-sku-media-resources-') && file.endsWith('.zip'))
  .map(file => path.join(rootDir, file));

console.log(`Found ${zipFiles.length} ZIP files to check\n`);

if (!fs.existsSync(extractDir)) {
  fs.mkdirSync(extractDir, { recursive: true });
}

// Create a map of color codes and names for matching
const colorMap = new Map();
eleganceCollection.colors.forEach(color => {
  const code = color.code.toLowerCase();
  const name = color.name.toLowerCase();
  colorMap.set(code, color);
  colorMap.set(name, color);
  colorMap.set(name.replace(/\s+/g, '-'), color);
  colorMap.set(name.replace(/\s+/g, ''), color);
});

let foundImages = new Map(); // color code -> array of file paths

// Extract and check all ZIPs
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
    
    // Check for Elegance images
    if (fs.existsSync(destDir)) {
      const files = fs.readdirSync(destDir);
      files.forEach(file => {
        const filePath = path.join(destDir, file);
        const fileName = file.toLowerCase();
        
        // Skip collection images
        if (fileName.includes('collection') || (fileName.includes('elegance') && !fileName.match(/\d{4}/))) {
          return;
        }
        
        // Try to match to a color
        for (const [key, color] of colorMap.entries()) {
          if (fileName.includes(key)) {
            if (!foundImages.has(color.code)) {
              foundImages.set(color.code, []);
            }
            foundImages.get(color.code).push(filePath);
            break;
          }
        }
      });
    }
  } catch (error) {
    // Continue
  }
});

console.log('\n\nFound images:');
let totalFound = 0;
eleganceCollection.colors.forEach(color => {
  const images = foundImages.get(color.code) || [];
  if (images.length > 0) {
    console.log(`  ✓ ${color.code} ${color.name}: ${images.length} image(s)`);
    totalFound++;
  } else {
    console.log(`  ✗ ${color.code} ${color.name}: NOT FOUND`);
  }
});

console.log(`\n✅ Found images for ${totalFound} out of ${eleganceCollection.colors.length} colors`);
