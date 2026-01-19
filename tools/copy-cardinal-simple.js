const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.join(__dirname, '..');
const extractDir = path.join(rootDir, 'tmp', 'extract-cardinal-simple');
const symbiozDir = path.join(rootDir, 'public', 'images', 'products', 'vinyl', 'mipolam-symbioz');

// Get newest ZIP file (check both root and archive-zips)
const archiveDir = path.join(rootDir, 'archive-zips');
const zipFiles = [];

// Check root directory
const rootZips = fs.readdirSync(rootDir)
  .filter(file => file.startsWith('product-sku-media-resources-') && file.endsWith('.zip'))
  .map(file => {
    const filePath = path.join(rootDir, file);
    const stats = fs.statSync(filePath);
    return {
      name: file,
      path: filePath,
      mtime: stats.mtime
    };
  });

// Check archive-zips directory
let archiveZips = [];
if (fs.existsSync(archiveDir)) {
  archiveZips = fs.readdirSync(archiveDir)
    .filter(file => file.startsWith('product-sku-media-resources-') && file.endsWith('.zip'))
    .map(file => {
      const filePath = path.join(archiveDir, file);
      const stats = fs.statSync(filePath);
      return {
        name: file,
        path: filePath,
        mtime: stats.mtime
      };
    });
}

zipFiles.push(...rootZips, ...archiveZips);
zipFiles.sort((a, b) => b.mtime - a.mtime);

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
  // Extract ZIP
  execSync(`powershell -Command "Expand-Archive -Path '${zip.path.replace(/'/g, "''")}' -DestinationPath '${destDir.replace(/'/g, "''")}' -Force"`, {
    cwd: rootDir,
    stdio: 'ignore'
  });
  
  // Find Cardinal image recursively
  function findCardinalFiles(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    
    list.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat && stat.isDirectory()) {
        results = results.concat(findCardinalFiles(filePath));
      } else {
        const fileName = file.toLowerCase();
        if ((fileName.includes('6075') || fileName.includes('cardinal')) && 
            (fileName.endsWith('.jpg') || fileName.endsWith('.jpeg') || fileName.endsWith('.png'))) {
          results.push(filePath);
        }
      }
    });
    
    return results;
  }
  
  const cardinalFiles = findCardinalFiles(destDir);
  
  if (cardinalFiles.length > 0) {
    console.log(`Found ${cardinalFiles.length} Cardinal image(s):\n`);
    
    if (!fs.existsSync(symbiozDir)) {
      fs.mkdirSync(symbiozDir, { recursive: true });
    }
    
    // Use the largest file
    let largestFile = null;
    let largestSize = 0;
    
    cardinalFiles.forEach(filePath => {
      const stats = fs.statSync(filePath);
      const fileName = path.basename(filePath);
      console.log(`  - ${fileName} (${(stats.size / 1024).toFixed(2)} KB)`);
      if (stats.size > largestSize) {
        largestSize = stats.size;
        largestFile = filePath;
      }
    });
    
    if (largestFile) {
      const colorFileName = '6075-cardinal.jpg';
      const destPath = path.join(symbiozDir, colorFileName);
      fs.copyFileSync(largestFile, destPath);
      console.log(`\n✅ Copied ${colorFileName} to ${symbiozDir}`);
    }
  } else {
    console.log('\n❌ No Cardinal image found in the ZIP file.');
    console.log('\nSearching all files...');
    function listAllFiles(dir, depth = 0) {
      if (depth > 3) return; // Limit depth
      const list = fs.readdirSync(dir);
      list.slice(0, 10).forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat && stat.isDirectory()) {
          listAllFiles(filePath, depth + 1);
        } else {
          console.log(`  - ${filePath.replace(rootDir, '')}`);
        }
      });
    }
    listAllFiles(destDir);
  }
} catch (error) {
  console.error('Error:', error.message);
}
