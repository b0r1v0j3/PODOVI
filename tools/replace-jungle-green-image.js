const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Find the ZIP file for 1039 JUNGLE GREEN
// It should be the 34th ZIP file (index 33) from the recent downloads
const archiveDir = 'archive-zips';
const zipFiles = fs.readdirSync(archiveDir)
  .filter(f => f.endsWith('.zip'))
  .map(f => ({
    name: f,
    fullPath: path.join(archiveDir, f),
    stats: fs.statSync(path.join(archiveDir, f))
  }))
  .filter(f => {
    // Only include files modified in the last 2 hours (recent downloads)
    const twoHoursAgo = Date.now() - (2 * 60 * 60 * 1000);
    return f.stats.mtimeMs > twoHoursAgo;
  })
  .sort((a, b) => a.stats.mtimeMs - b.stats.mtimeMs); // Sort by download time

console.log(`Found ${zipFiles.length} recent ZIP files in archive`);

// JUNGLE GREEN should be around index 33 (34th file)
const jungleGreenZip = zipFiles[33]; // 0-indexed, so 33 is the 34th file

if (!jungleGreenZip) {
  console.error('Could not find ZIP file for JUNGLE GREEN');
  process.exit(1);
}

console.log(`Found ZIP file for JUNGLE GREEN: ${jungleGreenZip.name}`);

// Create temp directory for extraction
const tempDir = path.join('.', 'temp-jungle-green');
if (fs.existsSync(tempDir)) {
  fs.rmSync(tempDir, { recursive: true, force: true });
}
fs.mkdirSync(tempDir, { recursive: true });

try {
  // Extract ZIP to temp directory
  console.log('Extracting ZIP file...');
  execSync(`powershell -Command "Expand-Archive -Path '${jungleGreenZip.fullPath.replace(/'/g, "''")}' -DestinationPath '${tempDir.replace(/'/g, "''")}' -Force"`, { stdio: 'inherit' });
  
  // Find all image files in extracted directory
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
  
  const imageFiles = findImages(tempDir);
  console.log(`Found ${imageFiles.length} images in ZIP file`);
  
  if (imageFiles.length < 2) {
    console.error('Not enough images found in ZIP file');
    process.exit(1);
  }
  
  // Sort by size (largest first)
  const imageFilesWithSize = imageFiles.map(f => ({
    path: f,
    size: fs.statSync(f).size
  })).sort((a, b) => b.size - a.size);
  
  // Get the second largest image (index 1)
  const secondImage = imageFilesWithSize[1];
  console.log(`Using second image: ${path.basename(secondImage.path)} (${(secondImage.size / 1024).toFixed(2)} KB)`);
  
  // Copy to target location
  const targetPath = 'public/images/products/vinyl/taralay-impression-acoustic/jungle-green.jpg';
  const imageExt = path.extname(secondImage.path);
  
  if (imageExt.toLowerCase() === '.jpg' || imageExt.toLowerCase() === '.jpeg') {
    fs.copyFileSync(secondImage.path, targetPath);
  } else {
    // For PNG, copy as JPG (or keep extension)
    fs.copyFileSync(secondImage.path, targetPath.replace('.jpg', imageExt));
  }
  
  console.log(`✓ Replaced image at: ${targetPath}`);
  
} catch (error) {
  console.error('Error:', error.message);
  process.exit(1);
} finally {
  // Clean up temp directory
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

console.log('\nDone!');
