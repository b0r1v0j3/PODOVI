const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.join(__dirname, '..');
const extractDir = path.join(rootDir, 'tmp', 'extract-cardinal');
const symbiozDir = path.join(rootDir, 'public', 'images', 'products', 'vinyl', 'mipolam-symbioz');

// Get newest ZIP file
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
  .slice(0, 1); // Get only the newest one

if (zipFiles.length === 0) {
  console.error('No ZIP files found!');
  process.exit(1);
}

const zip = zipFiles[0];
console.log(`Extracting ${zip.name}...\n`);

if (!fs.existsSync(extractDir)) {
  fs.mkdirSync(extractDir, { recursive: true });
}

const zipName = zip.name.replace('.zip', '');
const destDir = path.join(extractDir, zipName);

if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

try {
  execSync(`powershell -Command "Expand-Archive -Path '${zip.path.replace(/'/g, "''")}' -DestinationPath '${destDir.replace(/'/g, "''")}' -Force"`, {
    cwd: rootDir,
    stdio: 'inherit'
  });
  
  // Look for Cardinal image
  if (fs.existsSync(destDir)) {
    const files = fs.readdirSync(destDir);
    const cardinalFiles = files.filter(file => {
      const fileName = file.toLowerCase();
      return fileName.includes('6075') || fileName.includes('cardinal');
    });
    
    if (cardinalFiles.length > 0) {
      console.log(`\nFound ${cardinalFiles.length} Cardinal image(s):\n`);
      
      if (!fs.existsSync(symbiozDir)) {
        fs.mkdirSync(symbiozDir, { recursive: true });
      }
      
      // Use the largest file
      let largestFile = null;
      let largestSize = 0;
      
      cardinalFiles.forEach(file => {
        const filePath = path.join(destDir, file);
        const stats = fs.statSync(filePath);
        if (stats.size > largestSize) {
          largestSize = stats.size;
          largestFile = filePath;
        }
        console.log(`  - ${file} (${(stats.size / 1024).toFixed(2)} KB)`);
      });
      
      if (largestFile) {
        const colorFileName = '6075-cardinal.jpg';
        const destPath = path.join(symbiozDir, colorFileName);
        fs.copyFileSync(largestFile, destPath);
        console.log(`\n✅ Copied ${colorFileName} to ${symbiozDir}`);
      }
    } else {
      console.log('\n❌ No Cardinal image found in the ZIP file.');
      console.log('Files in ZIP:');
      files.slice(0, 10).forEach(file => {
        console.log(`  - ${file}`);
      });
      if (files.length > 10) {
        console.log(`  ... and ${files.length - 10} more files`);
      }
    }
  }
} catch (error) {
  console.error('Error:', error.message);
}
