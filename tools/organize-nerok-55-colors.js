const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.join(__dirname, '..');
const colorsJsonPath = path.join(rootDir, 'public', 'data', 'gerflor_linoleum_colors_complete.json');
const targetDir = path.join(rootDir, 'public', 'images', 'products', 'vinyl', 'nerok-55');
const extractDir = path.join(rootDir, 'tmp', 'nerok-55-colors-extract');
const archiveDir = path.join(rootDir, 'archive-old-zips');

// Load colors data
const colorsData = JSON.parse(fs.readFileSync(colorsJsonPath, 'utf8'));
const nerok55Collection = colorsData.collections.find(c => c.slug === 'nerok-55');

if (!nerok55Collection) {
  console.log('❌ Nerok 55 collection not found');
  process.exit(1);
}

// Create directories
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}
if (!fs.existsSync(extractDir)) {
  fs.mkdirSync(extractDir, { recursive: true });
}
if (!fs.existsSync(archiveDir)) {
  fs.mkdirSync(archiveDir, { recursive: true });
}

// Get all ZIP files, sorted by modification time (oldest first to maintain order)
const zipFiles = fs.readdirSync(rootDir)
  .filter(file => file.startsWith('product-sku-media-resources-') && file.endsWith('.zip'))
  .map(file => ({
    name: file,
    path: path.join(rootDir, file),
    mtime: fs.statSync(path.join(rootDir, file)).mtime
  }))
  .sort((a, b) => a.mtime - b.mtime); // Oldest first

console.log(`📦 Found ${zipFiles.length} ZIP files\n`);

let processed = 0;
let matched = 0;

// Process each ZIP file
zipFiles.forEach((zipFile, index) => {
  console.log(`[${index + 1}/${zipFiles.length}] Processing: ${zipFile.name}`);
  
  const zipName = path.basename(zipFile.name, '.zip');
  const extractPath = path.join(extractDir, zipName);
  
  // Extract ZIP
  if (fs.existsSync(extractPath)) {
    fs.rmSync(extractPath, { recursive: true, force: true });
  }
  fs.mkdirSync(extractPath, { recursive: true });
  
  try {
    execSync(`powershell -Command "Expand-Archive -Path '${zipFile.path.replace(/'/g, "''")}' -DestinationPath '${extractPath.replace(/'/g, "''")}' -Force"`, {
      cwd: rootDir,
      stdio: 'ignore'
    });
    
    // Find all images in extracted files
    const extractedFiles = fs.readdirSync(extractPath, { recursive: true })
      .filter(file => /\.(jpg|jpeg|png|JPG|JPEG|PNG)$/i.test(file))
      .map(file => path.join(extractPath, file));
    
    if (extractedFiles.length > 0) {
      // Get largest image (best quality)
      let imageFile = extractedFiles[0];
      let maxSize = 0;
      
      extractedFiles.forEach(file => {
        const stats = fs.statSync(file);
        if (stats.size > maxSize) {
          maxSize = stats.size;
          imageFile = file;
        }
      });
      
      // Try to extract color code from filename
      const fileName = path.basename(imageFile, path.extname(imageFile));
      
      // Try multiple patterns to find color code
      let codeMatch = fileName.match(/(\d{4})/);
      
      // If no code in filename, try to match by order (if we know the order)
      // Or try to extract from ZIP timestamp or other metadata
      
      if (codeMatch) {
        const code = codeMatch[1];
        
        // Find color in collection
        const color = nerok55Collection.colors.find(c => c.code === code);
        
        if (color) {
          // Create color slug from color name
          const colorSlug = color.slug.split('-').slice(-2).join('-');
          const targetFile = path.join(targetDir, `${colorSlug}.jpg`);
          
          // Copy image
          fs.copyFileSync(imageFile, targetFile);
          color.image = `/images/products/vinyl/${nerok55Collection.slug}/${colorSlug}.jpg`;
          
          console.log(`  ✅ ${code} ${color.name} → ${colorSlug}.jpg`);
          matched++;
        } else {
          console.log(`  ⚠️  Color code ${code} not found in JSON`);
        }
      } else {
        // Try to match by order if we can't extract code
        // This is a fallback - we'll try to match by processing order
        console.log(`  ⚠️  Could not extract code from: ${fileName}`);
      }
      
      processed++;
    }
    
    // Move ZIP to archive
    const archivePath = path.join(archiveDir, zipFile.name);
    fs.renameSync(zipFile.path, archivePath);
    
  } catch (e) {
    console.log(`  ❌ Error: ${e.message}`);
  }
});

// Save updated JSON
colorsData.totalColors = colorsData.collections.reduce((sum, col) => sum + (col.colorCount || col.colors.length || 0), 0);
colorsData.generatedAt = new Date().toISOString();
fs.writeFileSync(colorsJsonPath, JSON.stringify(colorsData, null, 2));

console.log(`\n✅ Summary:`);
console.log(`   Processed: ${processed} ZIP files`);
console.log(`   Matched: ${matched} colors`);
console.log(`   Total colors in collection: ${nerok55Collection.colors.length}`);
console.log(`\n💾 Updated: ${colorsJsonPath}`);
console.log(`📁 Images saved to: ${targetDir}\n`);
