const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const colorsToCheck = [
  { code: '1085', name: 'UNI MATT TEAL', index: 78 },
  { code: '1089', name: 'UNI MATT COPPER', index: 82 },
  { code: '1093', name: 'CHARME KRAFT', index: 86 },
  { code: '1099', name: 'ENVOL FOREST', index: 88 },
  { code: '1100', name: 'HABANA 3D BLOSSOM', index: 89 },
  { code: '1101', name: 'HAPPY FORM', index: 90 },
  { code: '1102', name: 'HAPPY NUMBER BLUE', index: 91 },
  { code: '1103', name: 'HAPPY NUMBER GREY', index: 92 },
];

const archiveDir = 'archive-zips';
const zipFiles = fs.readdirSync(archiveDir)
  .filter(f => f.endsWith('.zip'))
  .map(f => ({
    name: f,
    fullPath: path.join(archiveDir, f),
    stats: fs.statSync(path.join(archiveDir, f))
  }))
  .filter(f => {
    const twoHoursAgo = Date.now() - (2 * 60 * 60 * 1000);
    return f.stats.mtimeMs > twoHoursAgo;
  })
  .sort((a, b) => a.stats.mtimeMs - b.stats.mtimeMs);

const tempDir = path.join('.', 'temp-check-zips');
if (fs.existsSync(tempDir)) {
  fs.rmSync(tempDir, { recursive: true, force: true });
}
fs.mkdirSync(tempDir, { recursive: true });

for (const colorInfo of colorsToCheck) {
  const zipFile = zipFiles[colorInfo.index];
  if (!zipFile) {
    console.log(`\n${colorInfo.code} ${colorInfo.name}: ZIP not found`);
    continue;
  }

  console.log(`\n${colorInfo.code} ${colorInfo.name}:`);
  console.log(`  ZIP: ${zipFile.name}`);

  try {
    const extractDir = path.join(tempDir, `extract-${colorInfo.code}`);
    fs.mkdirSync(extractDir, { recursive: true });

    execSync(`powershell -Command "Expand-Archive -Path '${zipFile.fullPath.replace(/'/g, "''")}' -DestinationPath '${extractDir.replace(/'/g, "''")}' -Force"`, { stdio: 'pipe' });

    // List all files recursively
    const listFiles = (dir, prefix = '') => {
      const items = fs.readdirSync(dir);
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          listFiles(fullPath, prefix + item + '/');
        } else {
          const size = (stat.size / 1024).toFixed(2);
          console.log(`  ${prefix}${item} (${size} KB)`);
        }
      }
    };

    listFiles(extractDir);

    fs.rmSync(extractDir, { recursive: true, force: true });
  } catch (error) {
    console.log(`  Error: ${error.message}`);
  }
}

if (fs.existsSync(tempDir)) {
  fs.rmSync(tempDir, { recursive: true, force: true });
}
