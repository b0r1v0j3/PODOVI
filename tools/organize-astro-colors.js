const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const extractDir = path.join(rootDir, 'tmp', 'extracted-astro-colors');
const astroDir = path.join(rootDir, 'public', 'images', 'products', 'vinyl', 'mipolam-astro');

// Read colors data
const colorsDataPath = path.join(rootDir, 'public', 'data', 'vinyl_colors_complete.json');
const colorsData = JSON.parse(fs.readFileSync(colorsDataPath, 'utf8'));

// Get Mipolam Astro colors
const astroCollection = colorsData.collections.find(c => c.slug === 'mipolam-astro');
if (!astroCollection) {
  console.error('Mipolam Astro collection not found!');
  process.exit(1);
}

console.log(`Found ${astroCollection.colors.length} colors for Mipolam Astro\n`);

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
console.log('\nOrganizing color images for Mipolam Astro...\n');

// Create colors directory
if (!fs.existsSync(astroDir)) {
  fs.mkdirSync(astroDir, { recursive: true });
}

// Get all extracted files
const extractedDirs = fs.readdirSync(extractDir, { withFileTypes: true })
  .filter(dirent => dirent.isDirectory())
  .map(dirent => dirent.name);

let organizedCount = 0;

extractedDirs.forEach(dirName => {
  const dirPath = path.join(extractDir, dirName);
  if (!fs.existsSync(dirPath)) return;
  
  const files = fs.readdirSync(dirPath);
  
  files.forEach(file => {
    const filePath = path.join(dirPath, file);
    const fileName = file.toLowerCase();
    
    // Skip collection images
    if (fileName.includes('collection') || (fileName.includes('astro') && !fileName.match(/\d{4}/))) {
      return;
    }
    
    // Try to match file to a color
    astroCollection.colors.forEach(color => {
      const colorCode = color.code.toLowerCase();
      const colorName = color.name.toLowerCase().replace(/\s+/g, '-');
      
      // Check if file name contains color code or color name
      if (fileName.includes(colorCode) || 
          fileName.includes(colorName) ||
          fileName.includes(color.code) ||
          fileName.includes(color.name.toLowerCase().replace(/\s+/g, ''))) {
        
        // Create color filename
        const colorFileName = `${color.code}-${color.name.toLowerCase().replace(/\s+/g, '-')}.jpg`;
        const destPath = path.join(astroDir, colorFileName);
        
        // Copy file (use largest if multiple matches)
        if (!fs.existsSync(destPath)) {
          fs.copyFileSync(filePath, destPath);
          console.log(`  ✓ ${color.code} ${color.name} → ${colorFileName}`);
          organizedCount++;
        } else {
          // If file exists, check if new one is larger
          const existingStats = fs.statSync(destPath);
          const newStats = fs.statSync(filePath);
          if (newStats.size > existingStats.size) {
            fs.copyFileSync(filePath, destPath);
            console.log(`  ↻ ${color.code} ${color.name} → ${colorFileName} (replaced with larger)`);
          }
        }
      }
    });
  });
});

console.log(`\n✅ Organized ${organizedCount} color images for Mipolam Astro`);
console.log(`📁 Location: ${astroDir}`);
