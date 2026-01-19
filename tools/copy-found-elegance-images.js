const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const checkEleganceAllDir = path.join(rootDir, 'tmp', 'check-elegance-all');
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

// Create colors directory
if (!fs.existsSync(eleganceDir)) {
  fs.mkdirSync(eleganceDir, { recursive: true });
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

let organizedCount = 0;

// Function to match and copy image
function matchAndCopyImage(filePath, fileName) {
  // Skip collection images
  if (fileName.includes('collection') || (fileName.includes('elegance') && !fileName.match(/\d{4}/))) {
    return false;
  }
  
  // Try to match file to a color
  for (const [key, color] of colorMap.entries()) {
    if (fileName.includes(key)) {
      // Create color filename
      const colorFileName = `${color.code}-${color.name.toLowerCase().replace(/\s+/g, '-')}.jpg`;
      const destPath = path.join(eleganceDir, colorFileName);
      
      // Copy file (use largest if multiple matches)
      if (!fs.existsSync(destPath)) {
        fs.copyFileSync(filePath, destPath);
        console.log(`  ✓ ${color.code} ${color.name} → ${colorFileName}`);
        organizedCount++;
        return true;
      } else {
        // If file exists, check if new one is larger
        const existingStats = fs.statSync(destPath);
        const newStats = fs.statSync(filePath);
        if (newStats.size > existingStats.size) {
          fs.copyFileSync(filePath, destPath);
          console.log(`  ↻ ${color.code} ${color.name} → ${colorFileName} (replaced with larger)`);
          return true;
        }
      }
    }
  }
  return false;
}

// Check all extracted directories
if (fs.existsSync(checkEleganceAllDir)) {
  const extractedDirs = fs.readdirSync(checkEleganceAllDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);
  
  console.log(`Checking ${extractedDirs.length} extracted directories...\n`);
  
  extractedDirs.forEach(dirName => {
    const dirPath = path.join(checkEleganceAllDir, dirName);
    if (!fs.existsSync(dirPath)) return;
    
    const files = fs.readdirSync(dirPath);
    
    files.forEach(file => {
      const filePath = path.join(dirPath, file);
      const fileName = file.toLowerCase();
      matchAndCopyImage(filePath, fileName);
    });
  });
}

console.log(`\n✅ Organized ${organizedCount} color images for Mipolam Elegance`);
console.log(`📁 Location: ${eleganceDir}`);
