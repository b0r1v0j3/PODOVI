const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const extractDir = path.join(rootDir, 'tmp', 'extracted-elegance-colors');

// Missing colors
const missingColors = [
  { code: '0322', name: 'JICAMA' },
  { code: '0326', name: 'JOJOBA' },
  { code: '0328', name: 'ALMOND' },
  { code: '0329', name: 'HAZELNUT' },
  { code: '0331', name: 'PLUM' },
  { code: '0333', name: 'ANANAS' },
  { code: '0336', name: 'ACEROLA' },
  { code: '0338', name: 'KIWI' },
  { code: '0340', name: 'JAMBOLAN' },
  { code: '0341', name: 'BILBERRY' },
  { code: '0342', name: 'BLUEBERRY' },
  { code: '0344', name: 'NUTMEG' },
  { code: '0347', name: 'MANGOUSTAN' },
  { code: '0348', name: 'BLUETTA' },
  { code: '0349', name: 'BLUECROP' },
  { code: '0696', name: 'GINGER' },
  { code: '0697', name: 'GREENSTONE' },
  { code: '0698', name: 'CACAO' },
  { code: '0699', name: 'BANANA' },
  { code: '0700', name: 'MELON' },
  { code: '0702', name: 'KUMQUAT' },
  { code: '0704', name: 'RASPBERRY GREY' },
  { code: '0705', name: 'PATISSON' },
];

if (!fs.existsSync(extractDir)) {
  console.error('Extracted directory not found!');
  process.exit(1);
}

console.log('Searching for missing Elegance images in extracted files...\n');

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

const allFiles = getAllFiles(extractDir);
console.log(`Found ${allFiles.length} image files to search\n`);

const foundImages = [];

missingColors.forEach(color => {
  const colorCode = color.code.toLowerCase();
  const colorName = color.name.toLowerCase().replace(/\s+/g, '-');
  const colorNameNoSpace = color.name.toLowerCase().replace(/\s+/g, '');
  
  const matches = allFiles.filter(file => {
    const fileName = path.basename(file).toLowerCase();
    return (fileName.includes(colorCode) || 
            fileName.includes(colorName) ||
            fileName.includes(colorNameNoSpace)) &&
           (fileName.includes('elegance') || fileName.includes('032') || fileName.includes('069') || fileName.includes('070'));
  });
  
  if (matches.length > 0) {
    // Find largest file
    const largest = matches.reduce((prev, curr) => {
      const prevSize = fs.statSync(prev).size;
      const currSize = fs.statSync(curr).size;
      return currSize > prevSize ? curr : prev;
    });
    
    foundImages.push({
      color: color,
      file: largest,
      size: fs.statSync(largest).size,
      allMatches: matches.length
    });
  }
});

console.log(`Found ${foundImages.length} missing images:\n`);

foundImages.forEach(({ color, file, size, allMatches }) => {
  const relativePath = path.relative(extractDir, file);
  console.log(`  ✓ ${color.code} ${color.name}`);
  console.log(`    File: ${relativePath}`);
  console.log(`    Size: ${(size / 1024).toFixed(2)} KB`);
  console.log(`    Matches: ${allMatches}`);
  console.log('');
});

const notFound = missingColors.filter(color => 
  !foundImages.some(found => found.color.code === color.code)
);

if (notFound.length > 0) {
  console.log(`\nNot found (${notFound.length}):`);
  notFound.forEach(color => {
    console.log(`  ✗ ${color.code} ${color.name}`);
  });
}
