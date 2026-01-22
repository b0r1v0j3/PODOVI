const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Read the colors from JSON
const colors = JSON.parse(fs.readFileSync('tools/taralay-initial-acoustic-colors.json', 'utf8'));

// Sort colors by code
colors.sort((a, b) => parseInt(a.code) - parseInt(b.code));

console.log(`Found ${colors.length} colors in JSON`);

// Get all ZIP files in root directory, sorted by creation time (oldest first = 1 to 49)
const zipFiles = fs.readdirSync('.')
  .filter(file => file.endsWith('.zip') && file.startsWith('product-sku-media-resources-'))
  .map(file => {
    const stats = fs.statSync(file);
    return {
      name: file,
      birthtime: stats.birthtimeMs,
      mtime: stats.mtimeMs
    };
  })
  .sort((a, b) => a.birthtime - b.birthtime); // Sort by creation time (oldest first)

console.log(`Found ${zipFiles.length} ZIP files in root directory`);

if (zipFiles.length !== colors.length) {
  console.warn(`⚠ Warning: Found ${zipFiles.length} ZIP files but ${colors.length} colors`);
}

// Create temp directory for extraction
const tempDir = path.join(__dirname, '..', 'tmp', 'taralay-initial-acoustic-extract');
if (fs.existsSync(tempDir)) {
  fs.rmSync(tempDir, { recursive: true, force: true });
}
fs.mkdirSync(tempDir, { recursive: true });

// Create target directory
const targetDir = 'public/images/products/vinyl/taralay-initial-acoustic';
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

const processed = [];
const errors = [];

// Process each ZIP file in order
for (let i = 0; i < Math.min(zipFiles.length, colors.length); i++) {
  const zipFile = zipFiles[i];
  const color = colors[i];
  
  console.log(`\n[${i + 1}/${zipFiles.length}] Processing ${color.code} ${color.name}...`);
  console.log(`  ZIP: ${zipFile.name}`);
  
  try {
    // Extract ZIP to temp directory
    const extractDir = path.join(tempDir, `extract-${i}`);
    fs.mkdirSync(extractDir, { recursive: true });
    
    // Use PowerShell to extract ZIP (works on Windows)
    try {
      execSync(`powershell -Command "Expand-Archive -Path '${zipFile.name}' -DestinationPath '${extractDir}' -Force"`, {
        cwd: process.cwd(),
        stdio: 'pipe'
      });
    } catch (e) {
      console.error(`  Error extracting ZIP: ${e.message}`);
      errors.push({ color: color.code, error: `Extraction failed: ${e.message}` });
      continue;
    }
    
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
      console.error(`  ⚠ No image files found in ZIP`);
      errors.push({ color: color.code, error: 'No images found in ZIP' });
      continue;
    }
    
    // Find the best image (prefer JPG, largest file)
    const bestImage = imageFiles
      .map(file => ({
        path: file,
        size: fs.statSync(file).size,
        ext: path.extname(file).toLowerCase()
      }))
      .sort((a, b) => {
        // Prefer JPG over PNG
        if (a.ext === '.jpg' && b.ext !== '.jpg') return -1;
        if (b.ext === '.jpg' && a.ext !== '.jpg') return 1;
        // Then by size (largest first)
        return b.size - a.size;
      })[0];
    
    // Generate target filename
    const slugName = color.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const targetFileName = `${color.code}-${slugName}.jpg`;
    const targetPath = path.join(targetDir, targetFileName);
    
    // Copy image to target directory
    fs.copyFileSync(bestImage.path, targetPath);
    console.log(`  ✓ Copied to: ${targetFileName}`);
    
    processed.push({
      code: color.code,
      name: color.name,
      image: `/images/products/vinyl/taralay-initial-acoustic/${targetFileName}`
    });
    
    // Clean up extracted files
    fs.rmSync(extractDir, { recursive: true, force: true });
    
  } catch (error) {
    console.error(`  ✗ Error processing ${color.code}: ${error.message}`);
    errors.push({ color: color.code, error: error.message });
  }
}

// Clean up temp directory
if (fs.existsSync(tempDir)) {
  fs.rmSync(tempDir, { recursive: true, force: true });
}

// Update JSON file
console.log(`\n=== Updating JSON ===`);
const vinylColorsPath = 'public/data/vinyl_colors_complete.json';
const vinylColors = JSON.parse(fs.readFileSync(vinylColorsPath, 'utf8'));

const collection = vinylColors.collections.find(c => c.slug === 'taralay-initial-acoustic');
if (collection) {
  // Update image paths for processed colors
  processed.forEach(proc => {
    const color = collection.colors.find(c => c.code === proc.code);
    if (color) {
      color.image = proc.image;
    }
  });
  
  fs.writeFileSync(vinylColorsPath, JSON.stringify(vinylColors, null, 2));
  console.log(`✓ Updated ${vinylColorsPath}`);
} else {
  console.error('✗ Collection not found in JSON!');
}

// Summary
console.log(`\n=== Summary ===`);
console.log(`✓ Successfully processed: ${processed.length}/${colors.length}`);
console.log(`✗ Errors: ${errors.length}`);

if (errors.length > 0) {
  console.log(`\nErrors:`);
  errors.forEach(e => console.log(`  - ${e.color}: ${e.error}`));
}

console.log(`\nProcessed colors:`);
processed.forEach(p => console.log(`  ${p.code} ${p.name}`));
