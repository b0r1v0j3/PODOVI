const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.join(__dirname, '..');
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

// Try to extract to a simple path without special characters
const extractDir = path.join(rootDir, 'tmp', 'extract-cardinal-manual');
if (!fs.existsSync(extractDir)) {
  fs.mkdirSync(extractDir, { recursive: true });
}

// Extract using 7zip or native PowerShell with better error handling
try {
  // First, try to list contents
  console.log('Listing ZIP contents...\n');
  const listOutput = execSync(`powershell -Command "[System.IO.Compression.ZipFile]::OpenRead('${zip.path.replace(/'/g, "''")}').Entries | Select-Object -First 20 FullName"`, {
    cwd: rootDir,
    encoding: 'utf8'
  });
  console.log(listOutput);
  
  // Try to extract to a simple directory
  const simpleExtractDir = path.join(extractDir, 'simple');
  if (!fs.existsSync(simpleExtractDir)) {
    fs.mkdirSync(simpleExtractDir, { recursive: true });
  }
  
  execSync(`powershell -Command "[System.IO.Compression.ZipFile]::ExtractToDirectory('${zip.path.replace(/'/g, "''")}', '${simpleExtractDir.replace(/'/g, "''")}')"`, {
    cwd: rootDir,
    stdio: 'inherit'
  });
  
  // Now search for Cardinal image
  function findCardinalFiles(dir) {
    let results = [];
    try {
      const list = fs.readdirSync(dir);
      
      list.forEach(file => {
        const filePath = path.join(dir, file);
        try {
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
        } catch (e) {
          // Skip if can't access
        }
      });
    } catch (e) {
      // Skip if can't read directory
    }
    
    return results;
  }
  
  const cardinalFiles = findCardinalFiles(simpleExtractDir);
  
  if (cardinalFiles.length > 0) {
    console.log(`\n✅ Found ${cardinalFiles.length} Cardinal image(s):\n`);
    
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
    console.log('\n❌ No Cardinal image found. Listing all extracted files...\n');
    function listAllFiles(dir, depth = 0, maxDepth = 5) {
      if (depth > maxDepth) return;
      try {
        const list = fs.readdirSync(dir);
        list.forEach(file => {
          const filePath = path.join(dir, file);
          try {
            const stat = fs.statSync(filePath);
            if (stat && stat.isDirectory()) {
              console.log(`${'  '.repeat(depth)}📁 ${file}/`);
              listAllFiles(filePath, depth + 1, maxDepth);
            } else {
              console.log(`${'  '.repeat(depth)}📄 ${file}`);
            }
          } catch (e) {
            // Skip
          }
        });
      } catch (e) {
        // Skip
      }
    }
    listAllFiles(simpleExtractDir);
  }
} catch (error) {
  console.error('Error:', error.message);
  console.error(error.stack);
}
