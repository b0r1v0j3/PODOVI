const fs = require('node:fs/promises');
const path = require('node:path');
const { chromium } = require('playwright');

const OUTPUT_PATH = path.join(process.cwd(), 'public', 'data', 'tarkett_wood_collection_index.json');
const TARKETT_MEDIA_ORIGIN = 'https://media.tarkett-image.com';

const CATEGORY_CONFIGS = [
  {
    key: 'parket',
    url: 'https://www.tarkett.rs/sr_RS/kategorija-rs_C01012-parket',
  },
  {
    key: 'laminat',
    url: 'https://www.tarkett.rs/sr_RS/kategorija-rs_C01044-laminat',
  },
];

function stripHtml(raw) {
  return String(raw || '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function cleanListItems(html) {
  return Array.from(String(html || '').matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi))
    .map((match) => stripHtml(match[1]))
    .filter(Boolean);
}

function collectionUrlToSlug(urlPath) {
  return String(urlPath || '')
    .replace(/^.*\/kolekcija-[^-]+-/, '')
    .replace(/^\/+/, '')
    .trim();
}

function buildMediaUrl(mediaBaseUri, assetPath, kind = 'image') {
  if (!assetPath) return '';
  const raw = String(assetPath).trim();

  if (raw.startsWith('http://') || raw.startsWith('https://') || raw.startsWith('//')) {
    const normalized = raw.startsWith('//') ? `https:${raw}` : raw;
    if (kind === 'document') {
      return normalized
        .replace('://media.tarkett-image.com/large-high/', '://media.tarkett-image.com/docs/')
        .replace('://media.tarkett-image.com/large/', '://media.tarkett-image.com/docs/')
        .replace('://media.tarkett-image.com/medium/', '://media.tarkett-image.com/docs/');
    }

    return normalized;
  }

  const normalizedPath = raw.replace(/^\/+/, '');
  if (kind === 'document') {
    return `${TARKETT_MEDIA_ORIGIN}/docs/${normalizedPath}`;
  }

  const normalizedBase = String(mediaBaseUri || TARKETT_MEDIA_ORIGIN).replace(/\/+$/, '');
  return `${normalizedBase}/large/${normalizedPath}`;
}

function dedupeDocuments(documents) {
  const seen = new Set();
  return documents.filter((document) => {
    const url = String(document?.url || '').trim();
    if (!url || seen.has(url)) return false;
    seen.add(url);
    return true;
  });
}

function normalizeText(value) {
  return String(value || '')
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractCollectionSpecs(groupAttributes) {
  const specs = [];
  const seen = new Set();

  for (const group of Array.isArray(groupAttributes) ? groupAttributes : []) {
    for (const attribute of Array.isArray(group.attributes) ? group.attributes : []) {
      const label = normalizeText(attribute.label);
      const key = normalizeText(attribute.Id);
      const values = (Array.isArray(attribute.values) ? attribute.values : [])
        .map((value) => normalizeText(value))
        .filter(Boolean);

      if (!label || !key || values.length === 0) {
        continue;
      }

      const dedupeKey = label.toLowerCase();
      if (seen.has(dedupeKey)) {
        continue;
      }

      seen.add(dedupeKey);
      specs.push({
        key,
        label,
        value: values.join(' / '),
      });
    }
  }

  return specs;
}

async function getCollectionLinks(page, categoryUrl) {
  await page.goto(categoryUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(2500);

  const links = await page.locator('a[href*="/sr_RS/kolekcija-"]').evaluateAll((nodes) =>
    nodes
      .map((node) => node.getAttribute('href'))
      .filter(Boolean)
  );

  const bySlug = new Map();
  for (const link of links) {
    const slug = collectionUrlToSlug(link);
    if (slug && !bySlug.has(slug)) {
      bySlug.set(slug, link);
    }
  }

  return Array.from(bySlug.values());
}

async function fetchOfficialCollection(page, link) {
  const url = /^https?:\/\//i.test(link) ? link : `https://www.tarkett.rs${link}`;
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(1200);

  const nuxt = await page.evaluate(() => window.__NUXT__);
  const item = nuxt?.state?.collectionProductPage?.item;
  if (!item) {
    throw new Error(`Collection payload missing for ${url}`);
  }

  const mediaBaseUri = nuxt?.state?.mediaBaseUri || 'https://media.tarkett-image.com';
  const documents = dedupeDocuments(
    (item.collection_assets || [])
      .filter((asset) => asset.document_mime_type === 'pdf' && asset.document_asset_url)
      .map((asset) => ({
        title: stripHtml(asset.document_title || asset.document_label || asset.document_role || 'Dokument'),
        url: buildMediaUrl(mediaBaseUri, asset.document_asset_url, 'document'),
      }))
  );

  const heroImage = buildMediaUrl(
    mediaBaseUri,
    item?.cover_main_image?.image_asset_url ||
      item?.cover_media?.asset_url ||
      item?.main_image?.image_asset_url ||
      item?.main_image_asset_url ||
      ''
  );

  const description = stripHtml(item.description || item.short_description || item.introduction || '');
  const shortDescription = stripHtml(item.short_description || description);
  const collectionName = stripHtml(
    item.collection_name ||
      item.product_collection?.collection_name ||
      item.name ||
      item.title ||
      collectionUrlToSlug(link)
  );

  return {
    name: collectionName,
    slug: collectionUrlToSlug(link),
    url,
    shortDescription,
    description,
    keyFeatures: cleanListItems(item.key_features),
    specs: extractCollectionSpecs(item.collection_group_attributes),
    documents,
    heroImage,
  };
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    const payload = {
      generatedAt: new Date().toISOString(),
      parket: {},
      laminat: {},
    };

    for (const config of CATEGORY_CONFIGS) {
      const links = await getCollectionLinks(page, config.url);
      for (const link of links) {
        const collection = await fetchOfficialCollection(page, link);
        payload[config.key][collection.slug] = collection;
      }
    }

    await fs.writeFile(OUTPUT_PATH, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
    console.log(`Tarkett wood index snimljen u ${OUTPUT_PATH}`);
    console.log(
      JSON.stringify(
        {
          parket: Object.keys(payload.parket).length,
          laminat: Object.keys(payload.laminat).length,
        },
        null,
        2
      )
    );
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
