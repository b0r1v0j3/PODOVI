const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const { execSync } = require('child_process');

// Missing color codes
const missingCodes = ['1003', '1004', '1032', '1035', '1037', '1040', '1055', '1057', '1059', '1060'];

// Get all ZIP files in root
const rootFiles = fs.readdirSync(rootDir, { withFileTypes: true })
  .filter(dirent => dirent.isFile() && dirent.name.startsWith('product-sku-media-resources-') && dirent.name.endsWith('.zip'))
  .map(dirent => dirent.name);

console.log(`Checking ${rootFiles.length} ZIP files for Troplan images...\n`);

const extractDir = path.join(rootDir, 'tmp', 'extracted-troplan-search');
if (!fs.existsSync(extractDir)) {
  fs.mkdirSync(extractDir, { recursive: true });
}

rootFiles.forEach((zipFile, index) => {
  const zipPath = path.join(rootDir, zipFile);
  const zipName = path.basename(zipFile, '.zip');
  const destDir = path.join(extractDir, zipName);
  
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }
  
  try {
    execSync(`powershell -Command "Expand-Archive -Path '${zipPath.replace(/'/g, "''")}' -DestinationPath '${destDir.replace(/'/g, "''")}' -Force"`, {
      cwd: rootDir,
      stdio: 'ignore'
    });
    
    // Search for Troplan images
    const files = getAllFiles(destDir);
    
    files.forEach(file => {
      const fileName = path.basename(file).toLowerCase();
      
      if (fileName.includes('troplan')) {
        missingCodes.forEach(code => {
          if (fileName.includes(code)) {
            console.log(`  Found: ${path.basename(file)} in ${zipFile}`);
            console.log(`    Full path: ${file}`);
          }
        });
      }
    });
  } catch (error) {
    // Continue
  }
});

function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);
  
  files.forEach(file => {
    const filePath = path.join(dirPath, file);
    if (fs.statSync(filePath).isDirectory()) {
      arrayOfFiles = getAllFiles(filePath, arrayOfFiles);
    } else if (file.toLowerCase().endsWith('.jpg') || file.toLowerCase().endsWith('.jpeg') || file.toLowerCase().endsWith('.png')) {
      arrayOfFiles.push(filePath);
    }
  });
  
  return arrayOfFiles;
}
