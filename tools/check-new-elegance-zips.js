const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.join(__dirname, '..');

// Get all ZIP files sorted by modification time
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
  .sort((a, b) => b.mtime - a.mtime); // Newest first

console.log(`Found ${zipFiles.length} ZIP files\n`);
console.log('Top 20 newest ZIP files:');
zipFiles.slice(0, 20).forEach((zip, index) => {
  console.log(`${index + 1}. ${zip.name} - ${zip.mtime.toISOString()}`);
});

// Extract the newest 30 ZIPs and check for Elegance images
const extractDir = path.join(rootDir, 'tmp', 'check-elegance');
if (!fs.existsSync(extractDir)) {
  fs.mkdirSync(extractDir, { recursive: true });
}

console.log('\nExtracting newest 30 ZIPs and checking for Elegance images...\n');

const eleganceKeywords = ['elegance', '0318', '0319', '0321', '0322', '0323', '0324', '0326', '0327', '0328', '0329', '0330', '0331', '0333', '0336', '0338', '0339', '0340', '0341', '0342', '0343', '0344', '0347', '0348', '0349', '0696', '0697', '0698', '0699', '0700', '0702', '0703', '0704', '0705'];

zipFiles.slice(0, 30).forEach((zip, index) => {
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
    
    // Check for Elegance images
    const files = fs.readdirSync(destDir);
    const matchingFiles = files.filter(file => {
      const fileName = file.toLowerCase();
      return eleganceKeywords.some(keyword => fileName.includes(keyword.toLowerCase()));
    });
    
    if (matchingFiles.length > 0) {
      console.log(`\n✓ ${zip.name} contains ${matchingFiles.length} Elegance-related files:`);
      matchingFiles.slice(0, 5).forEach(file => {
        console.log(`  - ${file}`);
      });
      if (matchingFiles.length > 5) {
        console.log(`  ... and ${matchingFiles.length - 5} more`);
      }
    }
  } catch (error) {
    // Continue
  }
});
