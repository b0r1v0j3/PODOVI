const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.join(__dirname, '..');
const zipDir = rootDir;
const extractDir = path.join(rootDir, 'tmp', 'extracted-vinyl-images');

// Create extract directory if it doesn't exist
if (!fs.existsSync(extractDir)) {
  fs.mkdirSync(extractDir, { recursive: true });
}

// Find all ZIP files
const zipFiles = fs.readdirSync(zipDir)
  .filter(file => file.startsWith('product-sku-media-resources-') && file.endsWith('.zip'))
  .map(file => path.join(zipDir, file));

console.log(`Found ${zipFiles.length} ZIP files`);

// Extract each ZIP
zipFiles.forEach((zipPath, index) => {
  const zipName = path.basename(zipPath, '.zip');
  const destDir = path.join(extractDir, zipName);
  
  console.log(`[${index + 1}/${zipFiles.length}] Extracting ${zipName}...`);
  
  // Create destination directory
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }
  
  // Extract using PowerShell
  try {
    execSync(`powershell -Command "Expand-Archive -Path '${zipPath.replace(/'/g, "''")}' -DestinationPath '${destDir.replace(/'/g, "''")}' -Force"`, {
      cwd: rootDir,
      stdio: 'inherit'
    });
    console.log(`✓ Extracted ${zipName}`);
  } catch (error) {
    console.error(`✗ Failed to extract ${zipName}:`, error.message);
  }
});

console.log('\nDone! All ZIP files extracted.');
