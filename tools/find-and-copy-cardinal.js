const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.join(__dirname, '..');
const extractDir = path.join(rootDir, 'tmp', 'find-cardinal');
const symbiozDir = path.join(rootDir, 'public', 'images', 'products', 'vinyl', 'mipolam-symbioz');

// Get newest ZIP file from root
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
  .slice(0, 1);

if (zipFiles.length === 0) {
  console.error('No ZIP files found in root directory!');
  process.exit(1);
}

const zip = zipFiles[0];
console.log(`Processing ${zip.name}...\n`);

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
  console.log('Extracting ZIP file...');
  execSync(`powershell -Command "Expand-Archive -Path '${zip.path.replace(/'/g, "''")}' -DestinationPath '${destDir.replace(/'/g, "''")}' -Force"`, {
    cwd: rootDir,
    stdio: 'ignore'
  });
  
  console.log('Searching for Cardinal image...\n');
  
  // Find Cardinal image recursively
  function findCardinalFiles(dir) {
    let results = [];
    try {
      const list = fs.readdirSync(dir, { withFileTypes: true });
      
      for (const item of list) {
        const itemPath = path.join(dir, item.name);
        
        try {
          if (item.isDirectory()) {
            results = results.concat(findCardinalFiles(itemPath));
          } else {
            const fileName = item.name.toLowerCase();
            if ((fileName.includes('6075') || fileName.includes('cardinal')) && 
                (fileName.endsWith('.jpg') || fileName.endsWith('.jpeg') || fileName.endsWith('.png'))) {
              results.push(itemPath);
            }
          }
        } catch (e) {
          // Skip if can't access
        }
      }
    } catch (e) {
      // Skip if can't read directory
    }
    
    return results;
  }
  
  const cardinalFiles = findCardinalFiles(destDir);
  
  if (cardinalFiles.length > 0) {
    console.log(`✅ Found ${cardinalFiles.length} Cardinal image(s):\n`);
    
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
      return;
    }
  }
  
  // If not found, list all files to help debug
  console.log('\n❌ No Cardinal image found. Listing all extracted files...\n');
  function listAllFiles(dir, depth = 0, maxDepth = 4) {
    if (depth > maxDepth) return;
    try {
      const list = fs.readdirSync(dir, { withFileTypes: true });
      for (const item of list.slice(0, 20)) {
        const itemPath = path.join(dir, item.name);
        try {
          if (item.isDirectory()) {
            console.log(`${'  '.repeat(depth)}📁 ${item.name}/`);
            if (depth < maxDepth) {
              listAllFiles(itemPath, depth + 1, maxDepth);
            }
          } else {
            console.log(`${'  '.repeat(depth)}📄 ${item.name}`);
          }
        } catch (e) {
          // Skip
        }
      }
    } catch (e) {
      // Skip
    }
  }
  listAllFiles(destDir);
  
} catch (error) {
  console.error('Error:', error.message);
}
