const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');

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

try {
  const zipArchive = new AdmZip(zip.path);
  const zipEntries = zipArchive.getEntries();
  
  console.log(`Found ${zipEntries.length} files in ZIP\n`);
  
  // Look for Cardinal image
  const cardinalEntries = zipEntries.filter(entry => {
    const fileName = entry.entryName.toLowerCase();
    return (fileName.includes('6075') || fileName.includes('cardinal')) && 
           (fileName.endsWith('.jpg') || fileName.endsWith('.jpeg') || fileName.endsWith('.png'));
  });
  
  if (cardinalEntries.length > 0) {
    console.log(`Found ${cardinalEntries.length} Cardinal image(s):\n`);
    
    if (!fs.existsSync(symbiozDir)) {
      fs.mkdirSync(symbiozDir, { recursive: true });
    }
    
    // Use the largest file
    let largestEntry = null;
    let largestSize = 0;
    
    cardinalEntries.forEach(entry => {
      console.log(`  - ${entry.entryName} (${entry.header.size} bytes)`);
      if (entry.header.size > largestSize) {
        largestSize = entry.header.size;
        largestEntry = entry;
      }
    });
    
    if (largestEntry) {
      // Extract to temp file first
      const tempFile = path.join(extractDir, path.basename(largestEntry.entryName));
      if (!fs.existsSync(extractDir)) {
        fs.mkdirSync(extractDir, { recursive: true });
      }
      
      zipArchive.extractEntryTo(largestEntry, extractDir, false, true);
      
      // Copy to final location
      const colorFileName = '6075-cardinal.jpg';
      const destPath = path.join(symbiozDir, colorFileName);
      const extractedFile = path.join(extractDir, path.basename(largestEntry.entryName));
      
      if (fs.existsSync(extractedFile)) {
        fs.copyFileSync(extractedFile, destPath);
        console.log(`\n✅ Copied ${colorFileName} to ${symbiozDir}`);
      } else {
        // Try to find the extracted file with full path
        const allFiles = fs.readdirSync(extractDir, { recursive: true });
        const foundFile = allFiles.find(f => f.toLowerCase().includes('cardinal') || f.includes('6075'));
        if (foundFile) {
          const fullPath = path.join(extractDir, foundFile);
          fs.copyFileSync(fullPath, destPath);
          console.log(`\n✅ Copied ${colorFileName} to ${symbiozDir}`);
        }
      }
    }
  } else {
    console.log('\n❌ No Cardinal image found in the ZIP file.');
    console.log('\nFiles in ZIP (first 20):');
    zipEntries.slice(0, 20).forEach(entry => {
      console.log(`  - ${entry.entryName}`);
    });
    if (zipEntries.length > 20) {
      console.log(`  ... and ${zipEntries.length - 20} more files`);
    }
  }
} catch (error) {
  console.error('Error:', error.message);
  console.error(error.stack);
}
