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

// Manual mapping for remaining colors
const manualMappings = [
  { code: '1751', fileName: 'timber-grey_web', zipPattern: '*timber-grey*' },
  { code: '2013', fileName: 'sherwood-blond_web', zipPattern: '*sherwood-blond*' },
  { code: '2015', fileName: 'sherwood-brown_web', zipPattern: '*sherwood-brown*' },
  { code: '2017', fileName: 'sherwood-grey_web', zipPattern: '*sherwood-grey*' },
  { code: '2244', fileName: '2244 SKANDI OAK CLEAR', zipPattern: '*2244*' },
  { code: '2249', fileName: '2249 REFLECT SEA', zipPattern: '*2249*' },
  { code: '2253', fileName: '2253 REFLECT SILVER', zipPattern: '*2253*' },
  { code: '1451', fileName: 'noma-kola', zipPattern: '*kola*' }
];

console.log('🔧 Fixing remaining colors...\n');

manualMappings.forEach(mapping => {
  const color = nerok55Collection.colors.find(c => c.code === mapping.code);
  
  if (!color) {
    console.log(`⚠️  Color ${mapping.code} not found`);
    return;
  }
  
  if (color.image) {
    console.log(`ℹ️  ${color.code} ${color.name} already has image`);
    return;
  }
  
  // Find ZIP file
  const zipFiles = fs.readdirSync(archiveDir)
    .filter(file => file.includes('product-sku-media-resources-') && file.endsWith('.zip'))
    .map(file => path.join(archiveDir, file));
  
  let foundImage = null;
  
  for (const zipPath of zipFiles) {
    const zipName = path.basename(zipPath, '.zip');
    const extractPath = path.join(extractDir, zipName);
    
    if (!fs.existsSync(extractPath)) continue;
    
    const files = fs.readdirSync(extractPath, { recursive: true })
      .filter(file => /\.(jpg|jpeg|png|JPG|JPEG|PNG)$/i.test(file))
      .map(file => path.join(extractPath, file));
    
    for (const file of files) {
      const fileName = path.basename(file, path.extname(file));
      if (fileName.toLowerCase().includes(mapping.fileName.toLowerCase().replace(/\s+/g, '').replace(/_/g, ''))) {
        foundImage = file;
        break;
      }
    }
    
    if (foundImage) break;
  }
  
  if (foundImage) {
    const colorSlug = color.slug.split('-').slice(-2).join('-');
    const targetFile = path.join(targetDir, `${colorSlug}.jpg`);
    
    fs.copyFileSync(foundImage, targetFile);
    color.image = `/images/products/vinyl/${nerok55Collection.slug}/${colorSlug}.jpg`;
    
    console.log(`✅ ${color.code} ${color.name} → ${colorSlug}.jpg`);
  } else {
    console.log(`⚠️  Could not find image for ${color.code} ${color.name}`);
  }
});

// Save updated JSON
colorsData.totalColors = colorsData.collections.reduce((sum, col) => sum + (col.colorCount || col.colors.length || 0), 0);
colorsData.generatedAt = new Date().toISOString();
fs.writeFileSync(colorsJsonPath, JSON.stringify(colorsData, null, 2));

console.log(`\n💾 Updated: ${colorsJsonPath}\n`);
