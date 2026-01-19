const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const archiveDir = path.join(rootDir, 'archive-zips');

// Get all ZIP files in archive
const archivedZips = fs.existsSync(archiveDir)
  ? fs.readdirSync(archiveDir, { withFileTypes: true })
      .filter(dirent => dirent.isFile() && dirent.name.startsWith('product-sku-media-resources-') && dirent.name.endsWith('.zip'))
      .map(dirent => {
        const filePath = path.join(archiveDir, dirent.name);
        const stats = fs.statSync(filePath);
        return {
          name: dirent.name,
          mtime: stats.mtime
        };
      })
  : [];

// Sort by modification time (newest first)
archivedZips.sort((a, b) => b.mtime - a.mtime);

// Get the 18 newest ZIP files (the ones we just moved)
const newestZips = archivedZips.slice(0, 18);

console.log(`Restoring ${newestZips.length} newest ZIP files to root directory...\n`);

let restoredCount = 0;
newestZips.forEach(zip => {
  const sourcePath = path.join(archiveDir, zip.name);
  const destPath = path.join(rootDir, zip.name);
  
  try {
    fs.renameSync(sourcePath, destPath);
    console.log(`  ✓ Restored ${zip.name}`);
    restoredCount++;
  } catch (error) {
    console.error(`  ✗ Error restoring ${zip.name}: ${error.message}`);
  }
});

console.log(`\n✅ Restored ${restoredCount} ZIP files to root directory`);
console.log(`📁 These are the Troplan ZIP files you can extract manually`);
