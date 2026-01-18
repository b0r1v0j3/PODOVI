const fs = require('fs');
const path = require('path');

function toTitle(raw) {
  const base = raw.replace(/\.[^/.]+$/, '');
  const clean = base.replace(/[_]+/g, '-');
  const text = clean.replace(/[-]+/g, ' ').trim();
  return text
    .split(' ')
    .map((word) => (word ? word[0].toUpperCase() + word.slice(1) : ''))
    .join(' ');
}

function buildIndex() {
  const root = path.join(process.cwd(), 'public', 'documents');
  const index = { lvt: {}, carpet: {}, linoleum: {} };

  // LVT documents
  const lvtDir = path.join(root, 'lvt');
  if (fs.existsSync(lvtDir)) {
    const collections = fs.readdirSync(lvtDir, { withFileTypes: true })
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => dirent.name);

    collections.forEach((collection) => {
      const files = fs.readdirSync(path.join(lvtDir, collection));
      const docs = files
        .filter((file) => file.toLowerCase().endsWith('.pdf'))
        .map((file) => ({
          title: toTitle(file),
          url: `/documents/lvt/${collection}/${file}`,
        }));

      if (docs.length > 0) {
        index.lvt[collection] = docs;
      }
    });
  }

  // Carpet documents
  const carpetDir = path.join(root, 'carpet');
  if (fs.existsSync(carpetDir)) {
    const files = fs.readdirSync(carpetDir);
    files
      .filter((file) => file.toLowerCase().endsWith('.pdf'))
      .forEach((file) => {
        const base = file.replace(/\.[^/.]+$/, '');
        const match = base.match(/^(armonia-\d+)/i);
        const collection = match ? match[1].toLowerCase() : base.split('-')[0].toLowerCase();
        if (!collection) {
          return;
        }
        const prefix = `${collection}-`;
        const displayBase = base.startsWith(prefix) ? base.slice(prefix.length) : base;
        const doc = {
          title: toTitle(displayBase),
          url: `/documents/carpet/${file}`,
        };
        if (!index.carpet[collection]) {
          index.carpet[collection] = [];
        }
        index.carpet[collection].push(doc);
      });
  }

  return index;
}

const outputPath = path.join(process.cwd(), 'public', 'data', 'documents_index.json');
const index = buildIndex();
fs.writeFileSync(outputPath, JSON.stringify(index, null, 2));
console.log(`Documents index written to ${outputPath}`);
