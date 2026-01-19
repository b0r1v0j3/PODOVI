const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const archiveDir = path.join(rootDir, 'archive-zips');

// Ensure archive directory exists
if (!fs.existsSync(archiveDir)) {
  fs.mkdirSync(archiveDir, { recursive: true });
}

// Get all ZIP files in root
const rootZips = fs.readdirSync(rootDir, { withFileTypes: true })
  .filter(dirent => dirent.isFile() && dirent.name.startsWith('product-sku-media-resources-') && dirent.name.endsWith('.zip'))
  .map(dirent => dirent.name);

console.log(`Found ${rootZips.length} ZIP files in root directory\n`);

// Check which ones are already in archive
const archivedZips = fs.existsSync(archiveDir)
  ? fs.readdirSync(archiveDir, { withFileTypes: true })
      .filter(dirent => dirent.isFile() && dirent.name.endsWith('.zip'))
      .map(dirent => dirent.name)
  : [];

console.log(`Found ${archivedZips.length} ZIP files already in archive\n`);

// Check extracted directories to see which ZIPs we've already used
const extractedDirs = [
  path.join(rootDir, 'tmp', 'extracted-vinyl-images'),
  path.join(rootDir, 'tmp', 'extracted-accord-colors'),
  path.join(rootDir, 'tmp', 'extracted-affinity-colors'),
  path.join(rootDir, 'tmp', 'extracted-astro-colors'),
  path.join(rootDir, 'tmp', 'extracted-bioplanet-colors'),
  path.join(rootDir, 'tmp', 'extracted-classic-15mm-colors'),
  path.join(rootDir, 'tmp', 'extracted-classic-2mm-colors'),
  path.join(rootDir, 'tmp', 'extracted-elegance-colors'),
  path.join(rootDir, 'tmp', 'extracted-planet-colors'),
  path.join(rootDir, 'tmp', 'extracted-symbioz-colors'),
  path.join(rootDir, 'tmp', 'extracted-troplan-colors'),
];

const usedZipNames = new Set();

extractedDirs.forEach(extractDir => {
  if (fs.existsSync(extractDir)) {
    const dirs = fs.readdirSync(extractDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);
    
    dirs.forEach(dir => {
      if (dir.startsWith('product-sku-media-resources-')) {
        usedZipNames.add(dir + '.zip');
      }
    });
  }
});

console.log(`Found ${usedZipNames.size} ZIP files that have been extracted/used\n`);

// Move used ZIPs to archive
let movedCount = 0;
rootZips.forEach(zipFile => {
  if (usedZipNames.has(zipFile) || archivedZips.includes(zipFile)) {
    const sourcePath = path.join(rootDir, zipFile);
    const destPath = path.join(archiveDir, zipFile);
    
    // Only move if not already in archive
    if (!archivedZips.includes(zipFile)) {
      try {
        fs.renameSync(sourcePath, destPath);
        console.log(`  ✓ Moved ${zipFile} to archive`);
        movedCount++;
      } catch (error) {
        console.error(`  ✗ Error moving ${zipFile}: ${error.message}`);
      }
    }
  }
});

console.log(`\n✅ Moved ${movedCount} used ZIP files to archive`);
console.log(`📁 Remaining in root: ${rootZips.length - movedCount} ZIP files (these are for Troplan)`);
