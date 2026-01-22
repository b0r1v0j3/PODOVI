const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Read Premium Compact colors from JSON
const vinylData = JSON.parse(fs.readFileSync('public/data/vinyl_colors_complete.json', 'utf8'));
const premiumCompactCollection = vinylData.collections.find(c => c.slug === 'premium-compact');

if (!premiumCompactCollection) {
  console.error('Premium Compact collection not found in JSON');
  process.exit(1);
}

console.log(`Found ${premiumCompactCollection.colors.length} colors for Premium Compact`);

// Get all ZIP files from root, sorted by last write time (download order)
const zipFiles = fs.readdirSync('.')
  .filter(f => f.endsWith('.zip'))
  .map(f => ({
    name: f,
    fullPath: path.join('.', f),
    stats: fs.statSync(path.join('.', f))
  }))
  .filter(f => {
    // Only include files modified in the last hour (recent downloads)
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    return f.stats.mtimeMs > oneHourAgo;
  })
  .sort((a, b) => a.stats.mtimeMs - b.stats.mtimeMs); // Sort by download time

console.log(`Found ${zipFiles.length} recent ZIP files`);

if (zipFiles.length !== premiumCompactCollection.colors.length) {
  console.warn(`Warning: Found ${zipFiles.length} ZIP files but expected ${premiumCompactCollection.colors.length} colors`);
}

// Create temp directory for extraction
const tempDir = path.join('.', 'temp-premium-compact');
if (fs.existsSync(tempDir)) {
  fs.rmSync(tempDir, { recursive: true, force: true });
}
fs.mkdirSync(tempDir, { recursive: true });

const targetDir = 'public/images/products/vinyl/premium-compact';
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

let processedCount = 0;
const errors = [];

// Process each ZIP file in order
for (let i = 0; i < Math.min(zipFiles.length, premiumCompactCollection.colors.length); i++) {
  const zipFile = zipFiles[i];
  const color = premiumCompactCollection.colors[i];
  
  console.log(`\nProcessing ${i + 1}/${zipFiles.length}: ${zipFile.name} -> ${color.code} ${color.name}`);
  
  try {
    // Extract ZIP to temp directory
    const extractDir = path.join(tempDir, `extract-${i}`);
    fs.mkdirSync(extractDir, { recursive: true });
    
    // Use PowerShell to extract ZIP (Windows)
    execSync(`powershell -Command "Expand-Archive -Path '${zipFile.fullPath.replace(/'/g, "''")}' -DestinationPath '${extractDir.replace(/'/g, "''")}' -Force"`, { stdio: 'inherit' });
    
    // Find image files in extracted directory
    const findImages = (dir) => {
      const files = [];
      const items = fs.readdirSync(dir);
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          files.push(...findImages(fullPath));
        } else if (/\.(jpg|jpeg|png)$/i.test(item)) {
          files.push(fullPath);
        }
      }
      return files;
    };
    
    const imageFiles = findImages(extractDir);
    
    if (imageFiles.length === 0) {
      console.warn(`  No images found in ${zipFile.name}`);
      errors.push({ zip: zipFile.name, color: `${color.code} ${color.name}`, error: 'No images found' });
      continue;
    }
    
    // Use the largest image (usually the main product image)
    const imageFilesWithSize = imageFiles.map(f => ({
      path: f,
      size: fs.statSync(f).size
    })).sort((a, b) => b.size - a.size);
    
    const bestImage = imageFilesWithSize[0].path;
    const imageExt = path.extname(bestImage);
    const colorSlug = color.name.toLowerCase().replace(/\s+/g, '-');
    const targetImagePath = path.join(targetDir, `${colorSlug}.jpg`);
    
    // Copy image (convert to JPG if needed)
    if (imageExt.toLowerCase() === '.jpg' || imageExt.toLowerCase() === '.jpeg') {
      fs.copyFileSync(bestImage, targetImagePath);
    } else {
      // For PNG, we'll just copy it (or you could use a conversion tool)
      fs.copyFileSync(bestImage, targetImagePath.replace('.jpg', imageExt));
      console.warn(`  Note: Image is ${imageExt}, copied as-is`);
    }
    
    // Update JSON with correct image path
    color.image = `/images/products/vinyl/premium-compact/${colorSlug}.jpg`;
    
    console.log(`  ✓ Extracted and saved: ${targetImagePath}`);
    processedCount++;
    
    // Clean up temp extraction directory
    fs.rmSync(extractDir, { recursive: true, force: true });
    
  } catch (error) {
    console.error(`  ✗ Error processing ${zipFile.name}:`, error.message);
    errors.push({ zip: zipFile.name, color: `${color.code} ${color.name}`, error: error.message });
  }
}

// Clean up temp directory
if (fs.existsSync(tempDir)) {
  fs.rmSync(tempDir, { recursive: true, force: true });
}

// Save updated JSON
fs.writeFileSync('public/data/vinyl_colors_complete.json', JSON.stringify(vinylData, null, 2));

console.log(`\n\n=== Summary ===`);
console.log(`Processed: ${processedCount}/${premiumCompactCollection.colors.length} colors`);
if (errors.length > 0) {
  console.log(`\nErrors (${errors.length}):`);
  errors.forEach(e => console.log(`  - ${e.zip} (${e.color}): ${e.error}`));
}

// Move processed ZIP files to archive
const archiveDir = 'archive-zips';
if (!fs.existsSync(archiveDir)) {
  fs.mkdirSync(archiveDir, { recursive: true });
}

console.log(`\nMoving ${zipFiles.length} ZIP files to archive...`);
for (const zipFile of zipFiles) {
  try {
    const archivePath = path.join(archiveDir, zipFile.name);
    fs.renameSync(zipFile.fullPath, archivePath);
  } catch (error) {
    console.warn(`  Could not move ${zipFile.name}: ${error.message}`);
  }
}

console.log('\nDone!');
