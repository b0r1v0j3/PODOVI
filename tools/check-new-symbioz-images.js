const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.join(__dirname, '..');
const extractDir = path.join(rootDir, 'tmp', 'check-new-symbioz');

// Missing colors
const missingColors = ['6001', '6025', '6031', '6032', '6036', '6059', '6075'];
const missingNames = ['cotton', 'tangelo', 'breeze', 'sunshine', 'oceania', 'black diamond', 'cardinal'];

// Get newest ZIP files (last 20)
const zipFiles = fs.readdirSync(rootDir)
  .filter(file => file.startsWith('product-sku-media-resources-') && file.endsWith('.zip'))
  .map(file => {
    const filePath = path.join(rootDir, file);
    const stats = fs.statSync(filePath);
    return {
      name: file,
      path: filePath,
      mtime: stats.mtime
    };
  })
  .sort((a, b) => b.mtime - a.mtime)
  .slice(0, 20);

console.log(`Checking ${zipFiles.length} newest ZIP files for missing Symbioz images...\n`);

if (!fs.existsSync(extractDir)) {
  fs.mkdirSync(extractDir, { recursive: true });
}

let foundImages = [];

zipFiles.forEach((zip, index) => {
  const zipName = zip.name.replace('.zip', '');
  const destDir = path.join(extractDir, zipName);
  
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }
  
  try {
    execSync(`powershell -Command "Expand-Archive -Path '${zip.path.replace(/'/g, "''")}' -DestinationPath '${destDir.replace(/'/g, "''")}' -Force"`, {
      cwd: rootDir,
      stdio: 'ignore'
    });
    
    // Check for missing color images
    if (fs.existsSync(destDir)) {
      const files = fs.readdirSync(destDir);
      files.forEach(file => {
        const fileName = file.toLowerCase();
        
        // Check if file matches any missing color
        missingColors.forEach((code, idx) => {
          const name = missingNames[idx];
          if (fileName.includes(code) || 
              fileName.includes(name.toLowerCase()) ||
              (name === 'black diamond' && fileName.includes('black') && fileName.includes('diamond'))) {
            const filePath = path.join(destDir, file);
            foundImages.push({
              code: code,
              name: name,
              file: file,
              path: filePath,
              zip: zip.name
            });
          }
        });
      });
    }
  } catch (error) {
    // Continue
  }
});

if (foundImages.length > 0) {
  console.log(`\n✅ Found ${foundImages.length} missing images:\n`);
  foundImages.forEach(img => {
    console.log(`  ${img.code} ${img.name.toUpperCase()}: ${img.file} (from ${img.zip})`);
  });
} else {
  console.log('\n❌ No missing images found in newest ZIP files.');
}
