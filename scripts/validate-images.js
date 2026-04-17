/**
 * Validator:
 * 1. proverava da svaki lokalni metadata/image asset iz mock data fajlova ima odgovarajući fajl u public/
 * 2. proverava da Techem metadata slike imaju offline-safe first-party URL contract
 *
 * Ako neki uslov padne, izlaz sa greškom i listom (build/CI treba da padne).
 * NE uvoditi live network check u ovom skriptu.
 */

const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const publicDir = path.join(projectRoot, 'public');
const mockDataFile = path.join(projectRoot, 'lib/data/mock-data.ts');
const techemDataFile = path.join(projectRoot, 'public/data/techem_mats.json');
const allowedCatalogMetadataHosts = new Set([
  'nnjmrfwepylrheykalik.supabase.co',
  'www.podovi.online',
  'podovi.online',
  'media.tarkett-image.com',
  'cdn.gerflor.com',
]);
const disallowedCatalogMetadataHosts = new Set([
  'www.techem-wycieraczki.com.pl',
  'techem-wycieraczki.com.pl',
]);
const allowedTechemImageHosts = new Set([
  'nnjmrfwepylrheykalik.supabase.co',
  'www.podovi.online',
  'podovi.online',
]);
const disallowedTechemImageHosts = new Set([
  'www.techem-wycieraczki.com.pl',
  'techem-wycieraczki.com.pl',
]);
const imageExtensionRegex = /\.(avif|gif|jpe?g|png|svg|webp)$/i;

// Izvorni fajlovi koji sadrže product images (url putanje)
const dataFiles = [
  path.join(projectRoot, 'lib/data/tarkett-products.ts'),
  path.join(projectRoot, 'lib/data/mock-data.ts'),
];

// Regex: url/image/logo: "/images/..." ili "/products/..."
const localAssetRegex = /["']?(?:url|image|logo)["']?\s*:\s*["'](\/(?:images|products)\/[^"']+)["']/g;

function extractUrls(content) {
  const urls = [];
  let m;
  while ((m = localAssetRegex.exec(content)) !== null) {
    const url = m[1];
    // samo lokalne putanje (ne https:)
    if (url.startsWith('/')) urls.push(url);
  }
  return urls;
}

function extractTechemMetadataImageUrls(product) {
  const rawCandidates = [
    product.heroImage,
    ...(Array.isArray(product.galleryImages) ? product.galleryImages : []),
    ...(Array.isArray(product.images) ? product.images : []),
    product.image,
    product.image_url,
    product.thumbnail,
    product.thumbnail_url,
  ].filter(Boolean);

  const uniqueUrls = [];
  for (const candidate of rawCandidates) {
    let url = '';
    let variantUrls = [];

    if (typeof candidate === 'string') {
      url = candidate;
    } else if (candidate && typeof candidate === 'object') {
      url = String(candidate.url || candidate.src || candidate.image || candidate.image_url || '').trim();
      if (candidate.variants && typeof candidate.variants === 'object') {
        variantUrls = Object.values(candidate.variants)
          .map((value) => String(value || '').trim())
          .filter(Boolean);
      }
    }

    if (url && !uniqueUrls.includes(url)) {
      uniqueUrls.push(url);
    }

    for (const variantUrl of variantUrls) {
      if (variantUrl && !uniqueUrls.includes(variantUrl)) {
        uniqueUrls.push(variantUrl);
      }
    }
  }

  return uniqueUrls;
}

function validateTechemRemoteImages() {
  if (!fs.existsSync(techemDataFile)) {
    return {
      checked: 0,
      invalid: [{ product: 'techem-dataset', reason: 'missing-techem-dataset', url: techemDataFile }],
    };
  }

  const rawData = JSON.parse(fs.readFileSync(techemDataFile, 'utf8'));
  const products = Array.isArray(rawData)
    ? rawData
    : (rawData.products || rawData.items || rawData.catalog || []);
  const invalid = [];
  let checked = 0;

  for (const product of products) {
    const imageUrls = extractTechemMetadataImageUrls(product);
    const productLabel = product.slug || product.name || 'techem-product';

    if (imageUrls.length === 0) {
      invalid.push({
        product: productLabel,
        reason: 'missing-metadata-image',
      });
      continue;
    }

    for (const imageUrl of imageUrls) {
      checked += 1;

      let parsedUrl;
      try {
        parsedUrl = new URL(imageUrl);
      } catch {
        invalid.push({
          product: productLabel,
          reason: 'invalid-url',
          url: imageUrl,
        });
        continue;
      }

      if (parsedUrl.protocol !== 'https:') {
        invalid.push({
          product: productLabel,
          reason: 'non-https-url',
          url: imageUrl,
        });
      }

      if (disallowedTechemImageHosts.has(parsedUrl.hostname)) {
        invalid.push({
          product: productLabel,
          reason: 'supplier-host',
          url: imageUrl,
        });
      } else if (!allowedTechemImageHosts.has(parsedUrl.hostname)) {
        invalid.push({
          product: productLabel,
          reason: 'unexpected-host',
          url: imageUrl,
        });
      }

      if (!imageExtensionRegex.test(parsedUrl.pathname)) {
        invalid.push({
          product: productLabel,
          reason: 'non-image-path',
          url: imageUrl,
        });
      }
    }
  }

  return {
    checked,
    invalid,
  };
}

function extractMockDataSection(content, exportName, nextExportName) {
  const startToken = `export const ${exportName}`;
  const endToken = nextExportName ? `export const ${nextExportName}` : null;
  const startIndex = content.indexOf(startToken);

  if (startIndex === -1) {
    return '';
  }

  const endIndex = endToken ? content.indexOf(endToken, startIndex) : -1;
  return endIndex === -1 ? content.slice(startIndex) : content.slice(startIndex, endIndex);
}

function extractQuotedFieldValues(content, fieldName) {
  const pattern = new RegExp(`${fieldName}\\s*:\\s*['"]([^'"]+)['"]`, 'g');
  const values = [];
  let match;

  while ((match = pattern.exec(content)) !== null) {
    values.push(match[1]);
  }

  return values;
}

function validateCatalogMetadataAssets() {
  if (!fs.existsSync(mockDataFile)) {
    return {
      checked: 0,
      invalid: [{ assetType: 'mock-data', reason: 'missing-mock-data-file', value: mockDataFile }],
    };
  }

  const content = fs.readFileSync(mockDataFile, 'utf8');
  const categoriesSection = extractMockDataSection(content, 'categories', 'brands');
  const brandsSection = extractMockDataSection(content, 'brands', 'products');
  const categoryAssets = extractQuotedFieldValues(categoriesSection, 'image');
  const brandAssets = extractQuotedFieldValues(brandsSection, 'logo')
    .filter((value) => !value.includes('/images/placeholder.svg'));
  const invalid = [];
  let checked = 0;

  for (const [assetType, assets] of [
    ['category', categoryAssets],
    ['brand', brandAssets],
  ]) {
    for (const asset of assets) {
      checked += 1;

      if (asset.startsWith('/')) {
        const fullPath = path.join(publicDir, asset.replace(/^\//, ''));
        if (!fs.existsSync(fullPath)) {
          invalid.push({ assetType, reason: 'missing-local-asset', value: asset });
        }
        continue;
      }

      let parsedUrl;
      try {
        parsedUrl = new URL(asset);
      } catch {
        invalid.push({ assetType, reason: 'invalid-url', value: asset });
        continue;
      }

      if (parsedUrl.protocol !== 'https:') {
        invalid.push({ assetType, reason: 'non-https-url', value: asset });
      }

      if (disallowedCatalogMetadataHosts.has(parsedUrl.hostname)) {
        invalid.push({ assetType, reason: 'supplier-host', value: asset });
      } else if (!allowedCatalogMetadataHosts.has(parsedUrl.hostname)) {
        invalid.push({ assetType, reason: 'unexpected-host', value: asset });
      }

      if (!imageExtensionRegex.test(parsedUrl.pathname)) {
        invalid.push({ assetType, reason: 'non-image-path', value: asset });
      }
    }
  }

  return {
    checked,
    invalid,
  };
}

const missing = [];
const checked = new Set();

for (const filePath of dataFiles) {
  if (!fs.existsSync(filePath)) continue;
  const content = fs.readFileSync(filePath, 'utf8');
  const urls = extractUrls(content);
  for (const url of urls) {
    if (checked.has(url)) continue;
    checked.add(url);
    const fullPath = path.join(publicDir, url.replace(/^\//, ''));
    if (!fs.existsSync(fullPath)) {
      missing.push({ url, file: path.basename(filePath) });
    }
  }
}

const techemRemoteValidation = validateTechemRemoteImages();
const catalogMetadataValidation = validateCatalogMetadataAssets();

if (missing.length > 0) {
  console.error('validate-images: NEDOSTAJU SLIKE (404 na sajtu ako se deploy-uje):\n');
  missing.forEach(({ url, file }) => console.error(`  ${url}  (u ${file})`));
  console.error(`\nUkupno: ${missing.length} fajlova nedostaje. Vrati ih iz git-a ili dodaj u public/.`);
  process.exit(1);
}

if (techemRemoteValidation.invalid.length > 0) {
  console.error('validate-images: Techem remote metadata slike imaju neispravan URL contract:\n');
  techemRemoteValidation.invalid.forEach(({ product, reason, url }) => {
    console.error(`  [${reason}] ${product}${url ? ` -> ${url}` : ''}`);
  });
  console.error(`\nUkupno: ${techemRemoteValidation.invalid.length} Techem metadata URL problema.`);
  process.exit(1);
}

if (catalogMetadataValidation.invalid.length > 0) {
  console.error('validate-images: category/brand metadata asseti iz mock-data.ts imaju neispravan contract:\n');
  catalogMetadataValidation.invalid.forEach(({ assetType, reason, value }) => {
    console.error(`  [${assetType}] [${reason}] ${value}`);
  });
  console.error(`\nUkupno: ${catalogMetadataValidation.invalid.length} category/brand metadata asset problema.`);
  process.exit(1);
}

console.log(
  `validate-images: sve lokalne putanje slika postoje u public/, category/brand metadata asset contract validiran za ${catalogMetadataValidation.checked} asseta, Techem metadata URL contract validiran za ${techemRemoteValidation.checked} remote slike.`
);
process.exit(0);
