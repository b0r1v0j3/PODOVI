const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const https = require('https');
const vm = require('vm');

const CATEGORY_URL = 'https://www.tarkett.rs/sr_RS/kategorija-rs_C01001-homogeni-vinil';
const OUTPUT_PATH = path.join(process.cwd(), 'public', 'data', 'tarkett_homogeneous_vinyl_colors.json');
const SITE_ORIGIN = 'https://www.tarkett.rs';
const SITEMAP_URL = 'https://www.tarkett.rs/sr_RS/sitemap_1.xml';
const TARKETT_MEDIA_ORIGIN = 'https://media.tarkett-image.com';
const FALLBACK_COLLECTION_PATHS = [
  '/sr_RS/kolekcija-C000043-eclipse-premium',
  '/sr_RS/kolekcija-C000119-iq-eminent',
  '/sr_RS/kolekcija-C002595-iq-eminent-acoustic',
  '/sr_RS/kolekcija-C000120-iq-granit',
  '/sr_RS/kolekcija-C000121-iq-granit-acoustic',
  '/sr_RS/kolekcija-C000123-iq-megalit',
  '/sr_RS/kolekcija-C002596-iq-megalit-acoustic',
  '/sr_RS/kolekcija-C000124-iq-natural',
  '/sr_RS/kolekcija-C001996-iq-natural-acoustic',
  '/sr_RS/kolekcija-C000125-iq-optima',
  '/sr_RS/kolekcija-C000127-iq-optima-acoustic',
  '/sr_RS/kolekcija-C002597-iq-surface-acoustic',
  '/sr_RS/kolekcija-C001607-iq-surface',
  '/sr_RS/kolekcija-C000862-norma',
  '/sr_RS/kolekcija-C000885-primo-plus-see',
  '/sr_RS/kolekcija-C000179-primo-premium',
  '/sr_RS/kolekcija-C000258-standard-plus-1-5-mm',
  '/sr_RS/kolekcija-C000259-standard-plus-2-0-mm',
  '/sr_RS/kolekcija-C000350-vylon-plus',
  '/sr_RS/kolekcija-C000869-zenith-see',
];

let sitemapUrlCache = null;
let existingCollectionsCache = null;

const SPEC_LABELS = {
  basis_weight: 'Ukupna masa',
  castor_chair_effect_iso_4918: 'Otpornost na točkiće stolica',
  ce_marking: 'CE oznaka',
  chemical_resistance_iso_26987: 'Otpornost na hemikalije',
  classification_commercial_iso_10874: 'Komercijalna klasifikacija',
  classification_industrial_iso_10874: 'Industrijska klasifikacija',
  clean_room_iso_14644: 'Čista soba',
  colour_fastness_light: 'Postojanost boje - svetlost',
  electrical_propensity: 'Sklonost prema statičkom elektricitetu',
  epd_available: 'EPD',
  installation_method: 'Način ugradnje',
  light_reflectance_value: 'Refleksija svetlosti',
  phtalate_content: 'Sadržaj ftalata',
  product_type_norm_iso: 'ISO vrsta proizvoda',
  reaction_fire_en_13501: 'Reakcija na vatru',
  slip_resistance_en_13893: 'Otpornost na klizanje (EN 13893)',
  surface_treatment: 'Površinski tretman',
  thermal_resistance: 'Termička otpornost',
  total_thickness: 'Ukupna debljina',
  underfloor_heating: 'Podno grejanje',
};

const COLLECTION_SPEC_KEYS = [
  'product_type_norm_iso',
  'classification_commercial_iso_10874',
  'classification_industrial_iso_10874',
  'surface_treatment',
  'total_thickness',
  'basis_weight',
  'installation_method',
  'ce_marking',
  'electrical_propensity',
  'slip_resistance_en_13893',
  'thermal_resistance',
  'castor_chair_effect_iso_4918',
  'chemical_resistance_iso_26987',
  'underfloor_heating',
  'colour_fastness_light',
  'light_reflectance_value',
  'clean_room_iso_14644',
  'reaction_fire_en_13501',
  'phtalate_content',
  'epd_available',
];

function fetchText(url) {
  return new Promise((resolve, reject) => {
    const normalizedUrl = normalizeSiteUrl(url);

    https
      .get(normalizedUrl, (res) => {
        if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          fetchText(res.headers.location).then(resolve).catch(reject);
          return;
        }

        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => resolve(data));
      })
      .on('error', reject);
  });
}

function extractNuxtData(html) {
  const match = html.match(/window\.__NUXT__=\((function[\s\S]*?)\)(?:;|<\/script>)/);
  if (!match) return null;

  const sandbox = {
    window: {},
    document: {},
    location: { href: '', search: '', hash: '' },
  };

  vm.createContext(sandbox);
  vm.runInContext(`window.__NUXT__=(${match[1]});`, sandbox);
  return sandbox.window.__NUXT__;
}

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

function toTitleCase(raw) {
  return stripHtml(raw)
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function slugify(raw) {
  return stripHtml(raw)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .replace(/-+/g, '-');
}

function normalizeSiteUrl(url) {
  const value = String(url || '').trim();
  if (!value) return '';
  if (value.startsWith('http://') || value.startsWith('https://')) return value;
  if (value.startsWith('//')) return `https:${value}`;
  if (value.startsWith('/')) return `${SITE_ORIGIN}${value}`;
  return value;
}

function buildMediaUrl(mediaBaseUri, assetPath, kind = 'image') {
  if (!assetPath) return '';
  const raw = String(assetPath).trim();
  if (raw.startsWith('http://') || raw.startsWith('https://') || raw.startsWith('//')) {
    const normalized = normalizeSiteUrl(raw);
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

  const normalizedBase = (mediaBaseUri || TARKETT_MEDIA_ORIGIN).replace(/\/+$/, '');
  return `${normalizedBase}/large/${normalizedPath}`;
}

function dedupeDocuments(documents) {
  const seen = new Set();

  return documents.filter((document) => {
    if (!document?.url || seen.has(document.url)) return false;
    seen.add(document.url);
    return true;
  });
}

function toSlugFragment(urlPath) {
  return String(urlPath)
    .replace(/^.*\/kolekcija-[^-]+-/, '')
    .replace(/^\/+/, '')
    .trim();
}

function collectionUrlToSlug(urlPath) {
  return `tarkett-${toSlugFragment(urlPath)}`;
}

function buildShortDescription(rawDescription, fallbackName) {
  const cleaned = stripHtml(rawDescription);
  if (!cleaned) return fallbackName;

  const firstSentence = cleaned.match(/^(.{20,220}?[.!?])(?:\s|$)/);
  if (firstSentence?.[1]) {
    return firstSentence[1].trim();
  }

  return cleaned.length > 180 ? `${cleaned.slice(0, 177).trim()}...` : cleaned;
}

function flattenProductGroupAttributes(groups) {
  const result = {};

  for (const group of groups || []) {
    for (const attribute of group.attributes || []) {
      const label = stripHtml(attribute.label || attribute.Id || '');
      const value = (attribute.values || [])
        .map((entry) => stripHtml(entry))
        .filter(Boolean)
        .join(', ');

      if (label && value && !result[label]) {
        result[label] = value;
      }
    }
  }

  return result;
}

function translateCharacteristics(source, allowedKeys) {
  const result = {};

  for (const key of allowedKeys) {
    const value = source?.[key];
    if (!value) continue;
    const label = SPEC_LABELS[key] || stripHtml(key);
    result[label] = String(value).trim();
  }

  return result;
}

function sanitizeCollectionCharacteristics(characteristics) {
  const result = {};

  for (const [rawLabel, rawValue] of Object.entries(characteristics || {})) {
    const label = rawLabel === 'Content of Pentachlorophenol' ? 'Sadržaj pentahlorofenola' : rawLabel;
    const value = stripHtml(rawValue);
    if (!value) continue;

    const commaCount = value.split(',').length;
    if (
      commaCount > 8 &&
      /ncs|hex|refleksija svetlosti|porodica boja/i.test(label)
    ) {
      continue;
    }

    result[label] = value;
  }

  return result;
}

function buildColorDocuments(colorPayload) {
  return dedupeDocuments(
    [
      colorPayload?.specifications_pdf_url
        ? { title: 'Tehnički list', url: normalizeSiteUrl(colorPayload.specifications_pdf_url), type: 'pdf' }
        : null,
      colorPayload?.format_table_pdf_url
        ? { title: 'Tabela formata', url: normalizeSiteUrl(colorPayload.format_table_pdf_url), type: 'pdf' }
        : null,
    ].filter(Boolean)
  );
}

function loadExistingCollections() {
  if (existingCollectionsCache) {
    return existingCollectionsCache;
  }

  try {
    const payload = JSON.parse(fs.readFileSync(OUTPUT_PATH, 'utf8'));
    existingCollectionsCache = new Map(
      (payload.collections || []).map((collection) => [collection.slug, collection])
    );
  } catch {
    existingCollectionsCache = new Map();
  }

  return existingCollectionsCache;
}

function cloneCollection(collection) {
  return JSON.parse(JSON.stringify(collection));
}

function normalizeStoredDocuments(documents) {
  return (documents || []).map((document) => ({
    ...document,
    url: buildMediaUrl(TARKETT_MEDIA_ORIGIN, document.url, 'document'),
  }));
}

function buildStoredCollectionFallback(entry, categoryDescription) {
  const slug = collectionUrlToSlug(entry.href);
  const existing = loadExistingCollections().get(slug);
  if (!existing) {
    return null;
  }

  const fallback = cloneCollection(existing);
  fallback.slug = slug;
  fallback.url = normalizeSiteUrl(entry.href);
  fallback.categoryDescription = categoryDescription;
  fallback.documents = normalizeStoredDocuments(fallback.documents);
  fallback.colors = (fallback.colors || []).map((color) => ({
    ...color,
    documents: normalizeStoredDocuments(color.documents),
  }));

  const nextHero = buildMediaUrl(TARKETT_MEDIA_ORIGIN, entry.image || fallback.collection_image_url);
  if (nextHero) {
    fallback.collection_image_url = nextHero;
  }

  return fallback;
}

function normalizeWord(word) {
  return stripHtml(word)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '');
}

function parseHomogeneousColorName(productName, collectionName) {
  const rawName = stripHtml(productName);
  const rawCollection = stripHtml(collectionName).replace(/\s*\([^)]*\)\s*/g, ' ').replace(/\s+/g, ' ').trim();
  const collectionWithoutIq = rawCollection.replace(/^iq\s+/i, '').trim();

  const candidatePrefixes = [
    rawCollection,
    collectionWithoutIq,
    collectionWithoutIq.split(/\s+/).slice(0, 2).join(' '),
    collectionWithoutIq.split(/\s+/)[0],
  ]
    .map((value) => stripHtml(value))
    .filter(Boolean);

  let working = rawName;
  for (const prefix of candidatePrefixes) {
    const prefixWords = prefix.split(/\s+/).filter(Boolean);
    const workingWords = working.split(/\s+/).filter(Boolean);
    if (
      prefixWords.length > 0 &&
      prefixWords.length <= workingWords.length &&
      prefixWords.every((word, index) => normalizeWord(word) === normalizeWord(workingWords[index]))
    ) {
      working = workingWords.slice(prefixWords.length).join(' ').trim();
      break;
    }
  }

  const match = working.match(/^(.*?)(?:\s+([0-9]{3,4}[a-z0-9-]*))$/i);
  const code = match?.[2] ? String(match[2]).toUpperCase() : '';
  let name = stripHtml(match?.[1] || working);

  if (!name) {
    name = code || rawName;
  }

  return {
    code,
    name: toTitleCase(name),
  };
}

async function getCollectionEntries(page) {
  await page.goto(CATEGORY_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(2500);

  const cards = await page.locator('a[href*="/sr_RS/kolekcija-"]').evaluateAll((nodes) =>
    nodes
      .map((node) => {
        const image = node.querySelector('img');
        return {
          href: node.getAttribute('href'),
          title: (node.textContent || '').trim(),
          image: image?.getAttribute('src') || image?.getAttribute('data-src') || '',
        };
      })
      .filter((entry) => entry.href)
  );

  const uniqueEntries = [];
  const seen = new Set();
  for (const card of cards) {
    if (seen.has(card.href)) continue;
    seen.add(card.href);
    uniqueEntries.push(card);
  }

  const description =
    (await page.locator('meta[name="description"]').getAttribute('content').catch(() => null)) || '';

  return {
    entries:
      uniqueEntries.length > 0
        ? uniqueEntries
        : FALLBACK_COLLECTION_PATHS.map((href) => ({ href, title: '', image: '' })),
    description: stripHtml(description),
  };
}

async function getSitemapUrls() {
  if (sitemapUrlCache) {
    return sitemapUrlCache;
  }

  const xml = await fetchText(SITEMAP_URL);
  sitemapUrlCache = Array.from(xml.matchAll(/<loc>([^<]+)<\/loc>/g))
    .map((match) => normalizeSiteUrl(match[1]))
    .filter(Boolean);

  return sitemapUrlCache;
}

function buildCollectionJsonUrlFromProductUrl(productUrl) {
  const normalized = normalizeSiteUrl(productUrl);
  const pathname = new URL(normalized).pathname;
  const match = pathname.match(/^\/sr_RS\/kolekcija-([^/]+)\/([^/?#]+)$/);
  if (!match) return '';
  return `${SITE_ORIGIN}/sr_RS/json-collection-product/${match[1]}/${match[2]}`;
}

async function getFallbackCollectionPayload(collectionUrl) {
  const normalizedCollectionUrl = normalizeSiteUrl(collectionUrl).replace(/\/+$/, '');
  const sitemapUrls = await getSitemapUrls();
  const productUrls = sitemapUrls.filter((url) => url.startsWith(`${normalizedCollectionUrl}/`));

  for (const productUrl of productUrls) {
    const jsonUrl = buildCollectionJsonUrlFromProductUrl(productUrl);
    if (!jsonUrl) continue;

    try {
      const body = await fetchText(jsonUrl);
      const item = JSON.parse(body)?.item || null;
      if (item) {
        return { item, productUrls };
      }
    } catch (error) {
      console.warn(`Fallback JSON failed for ${productUrl}:`, error.message);
    }
  }

  return { item: null, productUrls };
}

async function fetchCollection(page, entry, categoryDescription) {
  const url = normalizeSiteUrl(entry.href);
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(1800);

  const html = await page.content();
  const nuxt = extractNuxtData(html);
  let mediaBaseUri = nuxt?.state?.mediaBaseUri || 'https://media.tarkett-image.com';
  let item = nuxt?.state?.collectionProductPage?.item || null;
  let fallbackProductUrls = [];

  if (!item) {
    const fallback = await getFallbackCollectionPayload(url);
    item = fallback.item;
    fallbackProductUrls = fallback.productUrls;
  }

  if (!item) {
    const storedFallback = buildStoredCollectionFallback(entry, categoryDescription);
    if (storedFallback) {
      console.warn(`Using stored homogeneous fallback for ${url} because official payload is unavailable.`);
      return storedFallback;
    }

    throw new Error(`Collection payload missing for ${url}`);
  }

  const defaultSku =
    item.collection_default_sku ||
    item.product_collection?.collection_default_sku ||
    {};

  const coverAsset =
    (item.collection_assets || []).find((asset) => asset.document_role === 'COVER') ||
    (item.collection_assets || []).find((asset) => asset.document_role === 'CONSTRUCTION_IMAGE');

  const collectionDocuments = dedupeDocuments(
    (item.collection_assets || [])
      .filter((asset) => asset.document_mime_type === 'pdf' && asset.document_asset_url)
      .map((asset) => ({
        title: stripHtml(
          asset.document_role_translated ||
            asset.document_title ||
            asset.document_label ||
            asset.document_role ||
            'Dokument'
        ),
        url: buildMediaUrl(mediaBaseUri, asset.document_asset_url, 'document'),
        type: 'pdf',
      }))
  );

  const detailsSections = cleanListItems(item.key_features).length > 0
    ? [
        {
          title: 'Ključne karakteristike',
          items: cleanListItems(item.key_features),
        },
      ]
    : undefined;

  const collectionCharacteristics = sanitizeCollectionCharacteristics({
    Tip: 'Homogeni',
    ...flattenProductGroupAttributes(item.collection_group_attributes || []),
    ...translateCharacteristics(defaultSku.sku_technical_caracteristics || {}, COLLECTION_SPEC_KEYS),
  });

  const colors = [];

  const designs = Array.isArray(item.designs) && item.designs.length > 0
    ? item.designs
    : fallbackProductUrls.map((productUrl) => ({
        product_name: productUrl.split('/').pop(),
        productDataUrl: buildCollectionJsonUrlFromProductUrl(productUrl),
      }));

  for (const design of designs) {
    const designJsonUrl = normalizeSiteUrl(design.productDataUrl);
    let colorPayload = null;

    if (designJsonUrl) {
      try {
        const body = await fetchText(designJsonUrl);
        colorPayload = JSON.parse(body)?.item || null;
      } catch (error) {
        console.warn(`Skipping color payload for ${design.product_name}:`, error.message);
      }
    }

    const parsed = parseHomogeneousColorName(
      colorPayload?.product_name || design.product_name || '',
      item.collection_name || item.name || ''
    );

    const colorCharacteristics = {};
    if (design.product_hex_color_code || colorPayload?.product_hex_color_code) {
      colorCharacteristics['HEX boja'] = String(design.product_hex_color_code || colorPayload?.product_hex_color_code);
    }
    if (design.product_ncs_color_code) {
      colorCharacteristics['NCS oznaka'] = String(design.product_ncs_color_code);
    }
    if (design.product_light_reflectance_value) {
      colorCharacteristics['LRV'] = String(design.product_light_reflectance_value);
    }
    if (design.product_color_families?.[0]?.code) {
      colorCharacteristics['Porodica boja'] = String(design.product_color_families[0].code);
    }
    if (parsed.code) {
      colorCharacteristics['Šifra dekora'] = parsed.code;
    }

    const slugParts = [parsed.code, parsed.name !== parsed.code ? parsed.name : ''].filter(Boolean).join(' ');
    const colorSlugFragment = slugify(slugParts || parsed.name || design.product_name || 'color');

    colors.push({
      code: parsed.code,
      name: parsed.name,
      slug: `${collectionUrlToSlug(entry.href)}-color-${colorSlugFragment}`,
      image: buildMediaUrl(
        mediaBaseUri,
        colorPayload?.product_hero_image ||
          colorPayload?.product_thumbnail ||
          design.product_thumbnail
      ),
      description: stripHtml(
        colorPayload?.description_stripped ||
          colorPayload?.description ||
          item.description_stripped ||
          item.description ||
          ''
      ),
      characteristics: Object.keys(colorCharacteristics).length > 0 ? colorCharacteristics : undefined,
      documents: buildColorDocuments(colorPayload),
      brandId: '3',
    });
  }

  return {
    name: stripHtml(item.collection_name || item.name || toSlugFragment(entry.href)),
    slug: collectionUrlToSlug(entry.href),
    brandId: '3',
    url,
    colorCount: colors.length,
    shortDescription: buildShortDescription(
      item.short_description_stripped || item.short_description || item.description_stripped || item.description,
      stripHtml(item.collection_name || item.name || '')
    ),
    description: stripHtml(item.description_stripped || item.description || ''),
    categoryDescription,
    characteristics: collectionCharacteristics,
    colors,
    documents: collectionDocuments,
    detailsSections,
    collection_image_url: buildMediaUrl(
      mediaBaseUri,
      entry.image || coverAsset?.document_asset_url || item.collection_picture || colors[0]?.image
    ),
  };
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    const { entries, description } = await getCollectionEntries(page);
    const collections = [];

    for (const entry of entries) {
      const collection = await fetchCollection(page, entry, description);
      collections.push(collection);
      console.log(`Fetched ${collection.name}: ${collection.colors.length} boja`);
    }

    const output = {
      collections,
      generatedAt: new Date().toISOString(),
      source: CATEGORY_URL,
    };

    fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
    fs.writeFileSync(OUTPUT_PATH, `${JSON.stringify(output, null, 2)}\n`, 'utf8');

    const totalColors = collections.reduce((sum, collection) => sum + (collection.colors?.length || 0), 0);
    console.log(`Saved ${collections.length} Tarkett homogeneous vinyl collections / ${totalColors} boja to ${OUTPUT_PATH}`);
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error('Failed to extract Tarkett homogeneous vinyl data:', error);
  process.exit(1);
});
