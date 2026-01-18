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

function normalize(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function titleFromUrl(url) {
  if (!url) return '';
  const raw = decodeURIComponent(url.split('/').pop() || '');
  return toTitle(raw);
}


function loadCollections() {
  const lvtColors = require('../public/data/lvt_colors_complete.json');
  const linoleumColors = require('../public/data/linoleum_colors_complete.json');
  const carpetColors = require('../public/data/carpet_tiles_complete.json');

  const lvt = {};
  (lvtColors.colors || []).forEach((color) => {
    if (!lvt[color.collection]) {
      lvt[color.collection] = color.collection_name || color.collection;
    }
  });

  const linoleum = {};
  (linoleumColors.colors || []).forEach((color) => {
    if (!linoleum[color.collection]) {
      linoleum[color.collection] = color.collection_name || color.collection;
    }
  });

  const carpet = {};
  (carpetColors.colors || []).forEach((color) => {
    const slug = (color.collection_slug || color.collection || '').replace(/^gerflor-/, '');
    if (slug && !carpet[slug]) {
      carpet[slug] = color.collection_name || slug;
    }
  });

  return { lvt, linoleum, carpet };
}

function buildIndexFromRaw(rawDocuments) {
  const collections = loadCollections();
  const index = { lvt: {}, linoleum: {}, carpet: {} };

  Object.entries(collections).forEach(([categoryKey, map]) => {
    Object.entries(map).forEach(([slug, name]) => {
      index[categoryKey][slug] = [];
    });
  });

  rawDocuments.forEach((doc) => {
    const categoryKey = doc.category;
    if (!collections[categoryKey]) {
      return;
    }
    const baseTitle = (doc.title || '').trim();
    const fallbackTitle = titleFromUrl(doc.url || '');
    const title = baseTitle && baseTitle !== '(opens in a new window)' ? baseTitle : fallbackTitle;
    const normalizedTitle = normalize(title);
    const normalizedUrl = normalize(doc.url || '');

    let bestMatch = null;
    let bestScore = 0;

    Object.entries(collections[categoryKey]).forEach(([slug, name]) => {
      const normalizedName = normalize(name);
      const normalizedSlug = normalize(slug.replace(/-/g, ' '));

      if (normalizedName && normalizedTitle.includes(normalizedName)) {
        const score = normalizedName.length;
        if (score > bestScore) {
          bestScore = score;
          bestMatch = slug;
        }
      } else if (normalizedSlug && normalizedTitle.includes(normalizedSlug)) {
        const score = normalizedSlug.length;
        if (score > bestScore) {
          bestScore = score;
          bestMatch = slug;
        }
      } else if (normalizedSlug && normalizedUrl.includes(normalizedSlug)) {
        const score = normalizedSlug.length - 1;
        if (score > bestScore) {
          bestScore = score;
          bestMatch = slug;
        }
      }
    });

    if (!bestMatch) {
      return;
    }

    const entry = {
      title: title.trim(),
      url: doc.url,
    };

    const list = index[categoryKey][bestMatch];
    if (!list.find((existing) => existing.url === entry.url)) {
      list.push(entry);
    }
  });

  // Keep all documents mapped to each collection
  Object.keys(index).forEach((categoryKey) => {
    Object.keys(index[categoryKey]).forEach((slug) => {
      index[categoryKey][slug] = index[categoryKey][slug].map(({ _score, ...rest }) => rest);
    });
  });

  return index;
}

function buildIndexFromLocalFiles() {
  const root = path.join(process.cwd(), 'public', 'documents');
  const index = { lvt: {}, carpet: {}, linoleum: {} };

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
const rawPath = path.join(process.cwd(), 'public', 'data', 'gerflor_documents_raw.json');

let index;
if (fs.existsSync(rawPath)) {
  const rawDocuments = JSON.parse(fs.readFileSync(rawPath, 'utf8'));
  index = buildIndexFromRaw(rawDocuments);
} else {
  index = buildIndexFromLocalFiles();
}

fs.writeFileSync(outputPath, JSON.stringify(index, null, 2));
console.log(`Documents index written to ${outputPath}`);
