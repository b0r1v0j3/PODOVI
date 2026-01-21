const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.join(__dirname, '..');
const linoleumColorsPath = path.join(rootDir, 'public', 'data', 'gerflor_linoleum_colors_complete.json');
const downloadsPath = path.join(process.env.USERPROFILE || process.env.HOME || '', 'Downloads');
const extractDir = path.join(rootDir, 'tmp', 'extracted-heterogeneous-zips');

function organizeDownloadedZips() {
  console.log('📦 Organizujem preuzete ZIP fajlove...\n');
  console.log(`   Downloads folder: ${downloadsPath}\n`);
  
  // Load colors data
  const colorsData = JSON.parse(fs.readFileSync(linoleumColorsPath, 'utf8'));
  
  // Get all ZIP files, sorted by modification time (newest first)
  const zipFiles = fs.readdirSync(downloadsPath)
    .filter(file => file.startsWith('product-sku-media-resources-') && file.endsWith('.zip'))
    .map(file => ({
      name: file,
      path: path.join(downloadsPath, file),
      mtime: fs.statSync(path.join(downloadsPath, file)).mtime
    }))
    .sort((a, b) => b.mtime - a.mtime); // Newest first
  
  console.log(`   Pronađeno ${zipFiles.length} ZIP fajlova\n`);
  
  if (zipFiles.length === 0) {
    console.log('⚠️  Nema ZIP fajlova u Downloads folderu');
    return;
  }
  
  // Create extract directory
  if (!fs.existsSync(extractDir)) {
    fs.mkdirSync(extractDir, { recursive: true });
  }
  
  let processed = 0;
  
  // Process each ZIP file
  zipFiles.forEach((zipFile, index) => {
    console.log(`[${index + 1}/${zipFiles.length}] ${zipFile.name}...`);
    
    const zipName = path.basename(zipFile.name, '.zip');
    const extractPath = path.join(extractDir, zipName);
    
    // Extract ZIP
    if (!fs.existsSync(extractPath)) {
      fs.mkdirSync(extractPath, { recursive: true });
    }
    
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
        // Try to match to a color by extracting code from filename or ZIP name
        // ZIP name contains timestamp, so we need to match by order or find color code in files
        
        // Get largest image
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
        const codeMatch = fileName.match(/(\d{4})/);
        
        if (codeMatch) {
          const code = codeMatch[1];
          
          // Find color in all collections
          for (const collection of colorsData.collections) {
            const color = collection.colors.find(c => c.code === code);
            
            if (color) {
              // Create target directory
              const targetDir = path.join(rootDir, 'public', 'images', 'products', 'vinyl', collection.slug);
              if (!fs.existsSync(targetDir)) {
                fs.mkdirSync(targetDir, { recursive: true });
              }
              
              // Copy image
              const colorSlug = color.slug.split('-').slice(-2).join('-');
              const targetFile = path.join(targetDir, `${colorSlug}.jpg`);
              
              fs.copyFileSync(imageFile, targetFile);
              color.image = `/images/products/vinyl/${collection.slug}/${colorSlug}.jpg`;
              
              console.log(`  ✅ ${collection.name} - ${code} ${color.name}`);
              processed++;
              break;
            }
          }
        } else {
          console.log(`  ⚠️  Ne mogu da ekstraktujem kod iz: ${fileName}`);
        }
      }
      
    } catch (e) {
      console.log(`  ❌ Error: ${e.message}`);
    }
  });
  
  // Save updated JSON
  colorsData.totalColors = colorsData.collections.reduce((sum, col) => sum + (col.colorCount || 0), 0);
  colorsData.generatedAt = new Date().toISOString();
  fs.writeFileSync(linoleumColorsPath, JSON.stringify(colorsData, null, 2));
  
  console.log(`\n✅ Završeno!`);
  console.log(`   Obradjeno: ${processed} slika`);
  console.log(`💾 Ažurirano: ${linoleumColorsPath}\n`);
}

organizeDownloadedZips();
