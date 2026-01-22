const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Colors to replace: code and name
const colorsToReplace = [
  { code: '1085', name: 'UNI MATT TEAL', index: 78 },
  { code: '1089', name: 'UNI MATT COPPER', index: 82 },
  { code: '1093', name: 'CHARME KRAFT', index: 86 },
  { code: '1099', name: 'ENVOL FOREST', index: 88 },
  { code: '1100', name: 'HABANA 3D BLOSSOM', index: 89 },
  { code: '1101', name: 'HAPPY FORM', index: 90 },
  { code: '1102', name: 'HAPPY NUMBER BLUE', index: 91 },
  { code: '1103', name: 'HAPPY NUMBER GREY', index: 92 },
];

// Read JSON to find collection
const vinylData = JSON.parse(fs.readFileSync('public/data/vinyl_colors_complete.json', 'utf8'));
const collection = vinylData.collections.find(c => c.slug === 'taralay-impression-acoustic');

if (!collection) {
  console.error('Taralay Impression Acoustic collection not found');
  process.exit(1);
}

// Find ZIP files in archive, sorted by download time
const archiveDir = 'archive-zips';
const zipFiles = fs.readdirSync(archiveDir)
  .filter(f => f.endsWith('.zip'))
  .map(f => ({
    name: f,
    fullPath: path.join(archiveDir, f),
    stats: fs.statSync(path.join(archiveDir, f))
  }))
  .filter(f => {
    const twoHoursAgo = Date.now() - (2 * 60 * 60 * 1000);
    return f.stats.mtimeMs > twoHoursAgo;
  })
  .sort((a, b) => a.stats.mtimeMs - b.stats.mtimeMs);

console.log(`Found ${zipFiles.length} recent ZIP files in archive\n`);

// Create temp directory
const tempDir = path.join('.', 'temp-replace-images');
if (fs.existsSync(tempDir)) {
  fs.rmSync(tempDir, { recursive: true, force: true });
}
fs.mkdirSync(tempDir, { recursive: true });

const targetDir = 'public/images/products/vinyl/taralay-impression-acoustic';
let successCount = 0;
const errors = [];

// Process each color - use previous ZIP file (index - 1)
for (const colorInfo of colorsToReplace) {
  const previousIndex = colorInfo.index - 1;
  if (previousIndex < 0 || previousIndex >= zipFiles.length) {
    console.warn(`Skipping ${colorInfo.code} ${colorInfo.name} - previous ZIP not available (index ${previousIndex})`);
    continue;
  }

  const zipFile = zipFiles[previousIndex];
  console.log(`Processing ${colorInfo.code} ${colorInfo.name}...`);
  console.log(`  Using previous ZIP: ${zipFile.name} (index ${previousIndex})`);

  try {
    // Extract ZIP to temp directory
    const extractDir = path.join(tempDir, `extract-${colorInfo.code}`);
    fs.mkdirSync(extractDir, { recursive: true });

    execSync(`powershell -Command "Expand-Archive -Path '${zipFile.fullPath.replace(/'/g, "''")}' -DestinationPath '${extractDir.replace(/'/g, "''")}' -Force"`, { stdio: 'pipe' });

    // Find all image files
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
      console.warn(`  ⚠ No images found`);
      errors.push({ color: `${colorInfo.code} ${colorInfo.name}`, error: 'No images found' });
      fs.rmSync(extractDir, { recursive: true, force: true });
      continue;
    }

    // Use the largest image
    const imageFilesWithSize = imageFiles.map(f => ({
      path: f,
      size: fs.statSync(f).size
    })).sort((a, b) => b.size - a.size);

    const bestImage = imageFilesWithSize[0];
    console.log(`  Using: ${path.basename(bestImage.path)} (${(bestImage.size / 1024).toFixed(2)} KB)`);

    // Get color slug from JSON
    const color = collection.colors.find(c => c.code === colorInfo.code);
    const colorSlug = color.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const targetPath = path.join(targetDir, `${colorSlug}.jpg`);

    // Copy image
    const imageExt = path.extname(bestImage.path);
    if (imageExt.toLowerCase() === '.jpg' || imageExt.toLowerCase() === '.jpeg') {
      fs.copyFileSync(bestImage.path, targetPath);
    } else {
      fs.copyFileSync(bestImage.path, targetPath.replace('.jpg', imageExt));
    }

    console.log(`  ✓ Replaced: ${targetPath}\n`);
    successCount++;

    // Clean up
    fs.rmSync(extractDir, { recursive: true, force: true });

  } catch (error) {
    console.error(`  ✗ Error: ${error.message}\n`);
    errors.push({ color: `${colorInfo.code} ${colorInfo.name}`, error: error.message });
  }
}

// Clean up temp directory
if (fs.existsSync(tempDir)) {
  fs.rmSync(tempDir, { recursive: true, force: true });
}

console.log(`\n=== Summary ===`);
console.log(`Successfully replaced: ${successCount}/${colorsToReplace.length} images`);
if (errors.length > 0) {
  console.log(`\nErrors (${errors.length}):`);
  errors.forEach(e => console.log(`  - ${e.color}: ${e.error}`));
}

console.log('\nDone!');
