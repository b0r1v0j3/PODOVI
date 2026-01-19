const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const symbiozDir = path.join(rootDir, 'public', 'images', 'products', 'vinyl', 'mipolam-symbioz');

// Missing colors for Mipolam Symbioz
const missingColors = [
  { code: '6001', name: 'cotton', searchTerms: ['6001', 'cotton'] },
  { code: '6025', name: 'tangelo', searchTerms: ['6025', 'tangelo'] },
  { code: '6031', name: 'breeze', searchTerms: ['6031', 'breeze'] },
  { code: '6032', name: 'sunshine', searchTerms: ['6032', 'sunshine'] },
  { code: '6036', name: 'oceania', searchTerms: ['6036', 'oceania'] },
  { code: '6059', name: 'black diamond', searchTerms: ['6059', 'black', 'diamond'] },
];

if (!fs.existsSync(symbiozDir)) {
  fs.mkdirSync(symbiozDir, { recursive: true });
}

// Find all JPG files in root
const files = fs.readdirSync(rootDir).filter(file => {
  const ext = path.extname(file).toLowerCase();
  return ext === '.jpg' || ext === '.jpeg' || ext === '.png';
});

console.log(`Found ${files.length} image files in root directory\n`);

let copiedCount = 0;

missingColors.forEach(color => {
  // Find matching file
  const matchingFile = files.find(file => {
    const fileName = file.toLowerCase();
    return color.searchTerms.some(term => fileName.includes(term.toLowerCase()));
  });
  
  if (matchingFile) {
    const sourcePath = path.join(rootDir, matchingFile);
    const destFileName = `${color.code}-${color.name.toLowerCase().replace(/\s+/g, '-')}.jpg`;
    const destPath = path.join(symbiozDir, destFileName);
    
    // Copy file (replace if exists)
    fs.copyFileSync(sourcePath, destPath);
    console.log(`✅ ${color.code} ${color.name.toUpperCase()} → ${destFileName}`);
    copiedCount++;
  }
});

if (copiedCount > 0) {
  console.log(`\n✅ Copied ${copiedCount} image(s) for Mipolam Symbioz`);
  console.log(`📁 Location: ${symbiozDir}`);
} else {
  console.log('\n❌ No matching images found in root directory.');
  console.log('\nLooking for:');
  missingColors.forEach(color => {
    console.log(`  - ${color.code} ${color.name.toUpperCase()}`);
  });
}
