const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.join(__dirname, '..');
const linoleumColorsPath = path.join(rootDir, 'public', 'data', 'gerflor_linoleum_colors_complete.json');
const downloadsPath = path.join(process.env.USERPROFILE || process.env.HOME || '', 'Downloads');
const extractDir = path.join(rootDir, 'tmp', 'extracted-heterogeneous-zips');

// Track processed ZIPs
const processedZips = new Set();

function processZipFile(zipFile) {
  if (processedZips.has(zipFile.name)) {
    return; // Already processed
  }
  
  console.log(`\n📦 Processing: ${zipFile.name}`);
  
  // Load colors data
  const colorsData = JSON.parse(fs.readFileSync(linoleumColorsPath, 'utf8'));
  
  // Extract ZIP
  const zipName = path.basename(zipFile.name, '.zip');
  const extractPath = path.join(extractDir, zipName);
  
  if (!fs.existsSync(extractPath)) {
    fs.mkdirSync(extractPath, { recursive: true });
  }
  
  try {
    execSync(`powershell -Command "Expand-Archive -Path '${zipFile.path.replace(/'/g, "''")}' -DestinationPath '${extractPath.replace(/'/g, "''")}' -Force"`, {
      cwd: rootDir,
      stdio: 'ignore'
    });
    
    // Find all images
    const extractedFiles = fs.readdirSync(extractPath, { recursive: true })
      .filter(file => /\.(jpg|jpeg|png|JPG|JPEG|PNG)$/i.test(file))
      .map(file => path.join(extractPath, file));
    
    if (extractedFiles.length > 0) {
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
            
            if (!fs.existsSync(targetFile)) {
              fs.copyFileSync(imageFile, targetFile);
              color.image = `/images/products/vinyl/${collection.slug}/${colorSlug}.jpg`;
              
              // Save updated JSON
              colorsData.totalColors = colorsData.collections.reduce((sum, col) => sum + (col.colorCount || 0), 0);
              colorsData.generatedAt = new Date().toISOString();
              fs.writeFileSync(linoleumColorsPath, JSON.stringify(colorsData, null, 2));
              
              console.log(`  ✅ ${collection.name} - ${code} ${color.name}`);
              processedZips.add(zipFile.name);
              return;
            } else {
              console.log(`  ℹ️  ${collection.name} - ${code} ${color.name} (već postoji)`);
              processedZips.add(zipFile.name);
              return;
            }
          }
        }
        
        console.log(`  ⚠️  Boja sa kodom ${code} nije pronađena u JSON-u`);
      } else {
        console.log(`  ⚠️  Ne mogu da ekstraktujem kod iz: ${fileName}`);
      }
    }
  } catch (e) {
    console.log(`  ❌ Error: ${e.message}`);
  }
}

function watchDownloads() {
  console.log('👀 Pratim Downloads folder i automatski organizujem ZIP fajlove...\n');
  console.log(`   Downloads folder: ${downloadsPath}\n`);
  console.log('   Kada preuzmeš ZIP fajl, automatski ću ga obraditi.\n');
  console.log('   Pritisni Ctrl+C da zaustaviš.\n');
  
  // Process existing ZIPs first
  const existingZips = fs.readdirSync(downloadsPath)
    .filter(file => file.startsWith('product-sku-media-resources-') && file.endsWith('.zip'))
    .map(file => ({
      name: file,
      path: path.join(downloadsPath, file),
      mtime: fs.statSync(path.join(downloadsPath, file)).mtime
    }))
    .sort((a, b) => b.mtime - a.mtime);
  
  if (existingZips.length > 0) {
    console.log(`   Pronađeno ${existingZips.length} postojećih ZIP fajlova, obrađujem...\n`);
    existingZips.forEach(zip => processZipFile(zip));
  }
  
  // Watch for new files
  const checkInterval = setInterval(() => {
    const zipFiles = fs.readdirSync(downloadsPath)
      .filter(file => file.startsWith('product-sku-media-resources-') && file.endsWith('.zip'))
      .map(file => ({
        name: file,
        path: path.join(downloadsPath, file),
        mtime: fs.statSync(path.join(downloadsPath, file)).mtime
      }))
      .sort((a, b) => b.mtime - a.mtime)
      .filter(zip => !processedZips.has(zip.name));
    
    zipFiles.forEach(zip => processZipFile(zip));
  }, 2000); // Check every 2 seconds
  
  // Handle Ctrl+C
  process.on('SIGINT', () => {
    console.log('\n\n⏹️  Zaustavljam...');
    clearInterval(checkInterval);
    process.exit(0);
  });
}

watchDownloads();
