const fs = require('fs');
const path = require('path');

const TYPE_RULES = [
  { type: 'technical_datasheet', regex: /technical\s*datasheet|technical\s*data\s*sheet|datasheet|technical\s*sheet/i },
  { type: 'sample_card', regex: /sample\s*card|sample\s*sheet|colour\s*card|color\s*card/i },
  { type: 'product_description', regex: /product\s*description|product\s*brochure|brochure/i },
  { type: 'installation', regex: /installation|installation\s*guide|installation\s*guidelines/i },
  { type: 'epd', regex: /epd|environmental\s*product\s*declaration|fdes/i },
  { type: 'maintenance', regex: /maintenance|cleaning|care/i },
];

const TYPE_PRIORITY = [
  'technical_datasheet',
  'sample_card',
  'product_description',
  'installation',
  'epd',
  'maintenance',
  'other',
];

const EXCLUDE_PATTERNS = [
  /slip\s*resistance/i,
  /fire\s*certificate/i,
  /\bdop\b/i,
  /classification/i,
  /certificate/i,
  /certification/i,
];


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

function getDocType(title, url) {
  const text = `${title} ${url}`.toLowerCase();
  for (const rule of TYPE_RULES) {
    if (rule.regex.test(text)) {
      return rule.type;
    }
  }
  return 'other';
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
  const unmatched = { lvt: [], linoleum: [], carpet: [] };

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
    const combinedText = `${title} ${doc.url || ''}`;
    if (EXCLUDE_PATTERNS.some((pattern) => pattern.test(combinedText))) {
      return;
    }

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
      } else {
        const tokens = (normalizedName || normalizedSlug)
          .split(' ')
          .filter((token) => token && token.length > 2);
        if (tokens.length > 0) {
          const tokenScore = tokens.reduce((acc, token) => {
            if (normalizedTitle.includes(token) || normalizedUrl.includes(token)) {
              return acc + 1;
            }
            return acc;
          }, 0);

          const minScore = tokens.length <= 2 ? 1 : 2;
          if (tokenScore >= minScore && tokenScore > bestScore) {
            bestScore = tokenScore;
            bestMatch = slug;
          }
        }
      }
    });

    const entry = {
      title: title.trim(),
      url: doc.url,
      _type: getDocType(title, doc.url),
    };

    if (!bestMatch) {
      const list = unmatched[categoryKey];
      if (!list.find((existing) => existing.url === entry.url)) {
        list.push(entry);
      }
      return;
    }

    const list = index[categoryKey][bestMatch];
    if (!list.find((existing) => existing.url === entry.url)) {
      list.push(entry);
    }
  });

  return { index, unmatched };
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

function ensureDocType(doc) {
  if (doc._type) {
    return doc;
  }
  return {
    ...doc,
    _type: getDocType(doc.title || '', doc.url || ''),
  };
}

function selectTopDocuments(localDocs, rawDocs) {
  const selected = [];
  const usedTypes = new Set();

  localDocs.map(ensureDocType).forEach((doc) => {
    if (selected.length >= 3) {
      return;
    }
    if (!selected.find((item) => item.url === doc.url)) {
      selected.push(doc);
      usedTypes.add(doc._type);
    }
  });

  const rawWithType = rawDocs.map(ensureDocType);

  TYPE_PRIORITY.forEach((type) => {
    if (selected.length >= 3) {
      return;
    }
    const candidate = rawWithType.find((doc) => doc._type === type && !usedTypes.has(doc._type));
    if (candidate && !selected.find((item) => item.url === candidate.url)) {
      selected.push(candidate);
      usedTypes.add(candidate._type);
    }
  });

  if (selected.length < 3) {
    rawWithType.forEach((doc) => {
      if (selected.length >= 3) {
        return;
      }
      if (!selected.find((item) => item.url === doc.url)) {
        selected.push(doc);
      }
    });
  }

  return selected.slice(0, 3).map(({ _type, ...rest }) => rest);
}

function mergeIndexes(localIndex, rawIndex, collections, unmatchedDocs) {
  const merged = { lvt: {}, linoleum: {}, carpet: {} };

  Object.entries(collections).forEach(([categoryKey, map]) => {
    Object.keys(map).forEach((slug) => {
      const localDocs = (localIndex[categoryKey] && localIndex[categoryKey][slug]) || [];
      const rawDocs = (rawIndex[categoryKey] && rawIndex[categoryKey][slug]) || [];
      const selected = selectTopDocuments(localDocs, rawDocs);

      if (selected.length < 3 && unmatchedDocs && unmatchedDocs[categoryKey]) {
        const pool = unmatchedDocs[categoryKey].map(ensureDocType);
        TYPE_PRIORITY.forEach((type) => {
          if (selected.length >= 3) {
            return;
          }
          const candidate = pool.find((doc) => doc._type === type);
          if (candidate && !selected.find((item) => item.url === candidate.url)) {
            selected.push({ title: candidate.title, url: candidate.url });
          }
        });

        if (selected.length < 3) {
          pool.forEach((doc) => {
            if (selected.length >= 3) {
              return;
            }
            if (!selected.find((item) => item.url === doc.url)) {
              selected.push({ title: doc.title, url: doc.url });
            }
          });
        }
      }

      merged[categoryKey][slug] = selected;
    });
  });

  return merged;
}

const outputPath = path.join(process.cwd(), 'public', 'data', 'documents_index.json');
const rawPath = path.join(process.cwd(), 'public', 'data', 'gerflor_documents_raw.json');

let index;
const collections = loadCollections();
const localIndex = buildIndexFromLocalFiles();

if (fs.existsSync(rawPath)) {
  const rawDocuments = JSON.parse(fs.readFileSync(rawPath, 'utf8'));
  const rawResult = buildIndexFromRaw(rawDocuments);
  index = mergeIndexes(localIndex, rawResult.index, collections, rawResult.unmatched);
} else {
  index = localIndex;
}

fs.writeFileSync(outputPath, JSON.stringify(index, null, 2));
console.log(`Documents index written to ${outputPath}`);
