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
if (!fs.existsSync(archiveDir)) {
  fs.mkdirSync(archiveDir, { recursive: true });
}

// Get all ZIP files from root and archive, sorted by modification time (oldest first to maintain order)
const rootZipFiles = fs.readdirSync(rootDir)
  .filter(file => file.startsWith('product-sku-media-resources-') && file.endsWith('.zip'))
  .map(file => ({
    name: file,
    path: path.join(rootDir, file),
    mtime: fs.statSync(path.join(rootDir, file)).mtime
  }));

const archiveZipFiles = fs.existsSync(archiveDir) 
  ? fs.readdirSync(archiveDir)
      .filter(file => file.startsWith('product-sku-media-resources-') && file.endsWith('.zip'))
      .map(file => ({
        name: file,
        path: path.join(archiveDir, file),
        mtime: fs.statSync(path.join(archiveDir, file)).mtime
      }))
  : [];

const zipFiles = [...rootZipFiles, ...archiveZipFiles]
  .sort((a, b) => a.mtime - b.mtime); // Oldest first

console.log(`📦 Found ${zipFiles.length} ZIP files\n`);

let processed = 0;
let matched = 0;

// Helper function to normalize color name for matching
function normalizeName(name) {
  return name.toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .replace(/\s+/g, '');
}

// Helper function to extract color name from filename
function extractColorNameFromFile(fileName) {
  // Remove extension
  let name = path.basename(fileName, path.extname(fileName));
  
  // Remove leading numbers and dashes (e.g., "41656 - " or "41026 - ")
  name = name.replace(/^\d+\s*-\s*/, '');
  
  // Remove "rs" codes (e.g., "rs30999-")
  name = name.replace(/^rs\d+-/, '');
  
  // Remove "_web_996x554" or similar suffixes
  name = name.replace(/_[^_]+$/, '');
  
  return name;
}

// Build a map of normalized color names to color objects
const colorMap = new Map();
nerok55Collection.colors.forEach(color => {
  const normalized = normalizeName(color.name);
  if (!colorMap.has(normalized)) {
    colorMap.set(normalized, color);
  }
  
  // Also try with slug parts
  const slugParts = color.slug.split('-').slice(-2);
  slugParts.forEach(part => {
    const normalizedPart = normalizeName(part);
    if (normalizedPart.length > 3 && !colorMap.has(normalizedPart)) {
      colorMap.set(normalizedPart, color);
    }
  });
});

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
      
      // Extract color name from filename
      const fileName = path.basename(imageFile, path.extname(imageFile));
      const extractedName = extractColorNameFromFile(fileName);
      const normalizedExtracted = normalizeName(extractedName);
      
      // Try to find matching color
      let color = null;
      
      // Direct match
      if (colorMap.has(normalizedExtracted)) {
        color = colorMap.get(normalizedExtracted);
      } else {
        // Try partial matches
        for (const [normalizedKey, colorObj] of colorMap.entries()) {
          if (normalizedExtracted.includes(normalizedKey) || normalizedKey.includes(normalizedExtracted)) {
            color = colorObj;
            break;
          }
        }
      }
      
      // If still no match, try matching by keywords
      if (!color) {
        const keywords = {
          'miel': '0476',
          'cabana': '0492',
          'silver': '0597',
          'vanilla': '0621',
          'anthracite': '0632',
          'sand': '0639',
          'chene': '0669',
          'clear': ['0720', '2012', '2175', '2244'],
          'darkgrey': '1430',
          'kola': '1451',
          'factory': '1518',
          'grey': ['1751', '2017', '2152'],
          'harbor': '1893',
          'blond': '2013',
          'brown': ['2015', '2134'],
          'leone': ['2131', '2132', '2133', '2134', '2135'],
          'shade': ['2151', '2152', '2153'],
          'taupe': '2176',
          'paprika': '2178',
          'black': '2179',
          'meadow': '2181',
          'ocean': '2182',
          'country': '2242',
          'natural': '2245',
          'brooklyn': ['2249', '2253'],
          'newport': ['2244', '2245']
        };
        
        for (const [keyword, codes] of Object.entries(keywords)) {
          if (normalizedExtracted.includes(keyword)) {
            const codeArray = Array.isArray(codes) ? codes : [codes];
            // Try to find the color by code
            for (const code of codeArray) {
              const foundColor = nerok55Collection.colors.find(c => c.code === code);
              if (foundColor && !foundColor.image) {
                color = foundColor;
                break;
              }
            }
            if (color) break;
          }
        }
      }
      
      if (color) {
        // Create color slug from color name
        const colorSlug = color.slug.split('-').slice(-2).join('-');
        const targetFile = path.join(targetDir, `${colorSlug}.jpg`);
        
        // Copy image only if it doesn't exist or if we want to overwrite
        if (!fs.existsSync(targetFile) || true) { // Overwrite for now
          fs.copyFileSync(imageFile, targetFile);
          color.image = `/images/products/vinyl/${nerok55Collection.slug}/${colorSlug}.jpg`;
          
          console.log(`  ✅ ${color.code} ${color.name} → ${colorSlug}.jpg (from: ${extractedName})`);
          matched++;
        } else {
          console.log(`  ℹ️  ${color.code} ${color.name} already has image`);
        }
      } else {
        console.log(`  ⚠️  Could not match: ${extractedName}`);
      }
      
      processed++;
    }
    
    // Move ZIP to archive (only if not already in archive)
    if (!zipFile.path.startsWith(archiveDir)) {
      const archivePath = path.join(archiveDir, zipFile.name);
      fs.renameSync(zipFile.path, archivePath);
    }
    
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
