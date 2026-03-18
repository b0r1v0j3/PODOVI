const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const https = require('https');
const vm = require('vm');

const CATEGORY_URL = 'https://www.tarkett.rs/sr_RS/kategorija-rs_C01015-sportski-podovi';
const OUTPUT_PATH = path.join(process.cwd(), 'public', 'data', 'tarkett_sport_colors.json');
const CATEGORY_DESCRIPTION =
  'Od višenamenskih podova za teretane, preko podnih obloga za takmičarske terene i joga studije - sve sportske površine moraju biti prilagođene specifičnim aktivnostima i očekivanoj težini tereta na dnevnom nivou.';
const TARKETT_MEDIA_ORIGIN = 'https://media.tarkett-image.com';
let existingCollectionsCache = null;

const SPEC_LABELS = {
  basis_weight: 'Težina',
  carbon_impact_DVR: 'Ugljenični otisak (DVR)',
  ce_marking: 'CE oznaka',
  colour_fastness_light: 'Postojanost boje na svetlost',
  dop_certificate: 'DoP sertifikat',
  drum_sound_class_en_16205: 'Klasa zvuka koraka',
  embossing_type: 'Reljef',
  format: 'Format',
  format_type: 'Tip formata',
  impact_sound_insulation: 'Zvučna izolacija',
  installation_method: 'Način ugradnje',
  laying_direction: 'Pravac polaganja',
  length: 'Dužina',
  light_reflectance_value: 'LRV',
  ncs_color_code: 'NCS oznaka',
  pattern: 'Dizajn',
  pattern_type: 'Tip dezena',
  phtalate_content: 'Sadržaj ftalata',
  product_material: 'Materijal',
  product_type: 'Tip proizvoda',
  product_type_norm_iso: 'Tip proizvoda (ISO)',
  reaction_to_fire: 'Reakcija na vatru',
  rolling_load_behaviour: 'Otpornost na kotrljajuće opterećenje',
  shock_absorption_gost55529: 'Apsorpcija udara',
  slip_resistance_din_51130: 'Otpornost na klizanje',
  surface: 'Površina',
  surface_effect: 'Efekat površine',
  surface_treatment: 'Površinska obrada',
  thermal_resistance: 'Toplotni otpor',
  total_thickness: 'Ukupna debljina',
  tvoc_emission: 'TVOC emisije',
  vertical_ball_behaviour: 'Odbijanje lopte',
  wear_layer_thickness: 'Debljina sloja habanja',
  width: 'Širina',
};

function fetchText(url) {
  return new Promise((resolve, reject) => {
    const normalizedUrl = url.startsWith('//') ? `https:${url}` : url;

    https
      .get(normalizedUrl, (res) => {
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

function sanitizeTarkettText(raw) {
  return stripHtml(raw)
    .replace(/([.!?])(?=[A-ZČĆŽŠĐ])/g, '$1 ')
    .replace(/\bzaplesne\b/gi, 'za plesne')
    .replace(/\bpovećavaperformanse\b/gi, 'povećava performanse')
    .replace(/\bDostupnou\b/gi, 'Dostupno u')
    .replace(/\bnudiuravnoteženo\b/gi, 'nudi uravnoteženo')
    .replace(/\btretirapovršinskom\b/gi, 'tretiran je površinskom')
    .replace(/\bekonomičnoodržavanje\b/gi, 'ekonomično održavanje')
    .replace(/\bspotske\b/gi, 'sportske')
    .replace(/\bpristiska\b/gi, 'pritiska')
    .replace(/\bpostvaljanje\b/gi, 'postavljanje')
    .replace(/\btretmamn\b/gi, 'tretman')
    .replace(/\babsorpcij/gi, 'apsorpcij')
    .replace(/\b550m2\b/gi, '550 m²')
    .replace(/\s*;\s*/g, ': ')
    .replace(/\s+/g, ' ')
    .trim();
}

function cleanListItems(html) {
  return Array.from(String(html || '').matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi))
    .map((match) => sanitizeTarkettText(match[1]))
    .filter(Boolean);
}

function sanitizeKeyFeatureItems(items) {
  return items.filter((item) => !/^(na lageru|brza isporuka)$/i.test(item));
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

function buildStoredCollectionFallback(link, previewImageUrl = '') {
  const slug = collectionUrlToSlug(link);
  const existing = loadExistingCollections().get(slug);
  if (!existing) {
    return null;
  }

  const fallback = cloneCollection(existing);
  fallback.slug = slug;
  fallback.url = String(link).startsWith('http') ? String(link) : `https://www.tarkett.rs${link}`;
  fallback.documents = normalizeStoredDocuments(fallback.documents);
  fallback.colors = (fallback.colors || []).map((color) => ({
    ...color,
    documents: normalizeStoredDocuments(color.documents),
  }));

  const nextHero = buildMediaUrl(TARKETT_MEDIA_ORIGIN, previewImageUrl || fallback.collection_image_url);
  if (nextHero) {
    fallback.collection_image_url = nextHero;
  }

  return fallback;
}

function buildMediaUrl(mediaBaseUri, assetPath, kind = 'image') {
  if (!assetPath) return '';
  const raw = String(assetPath).trim();

  if (/^https?:\/\//i.test(raw)) {
    if (kind === 'document') {
      return raw
        .replace('://media.tarkett-image.com/large-high/', '://media.tarkett-image.com/docs/')
        .replace('://media.tarkett-image.com/large/', '://media.tarkett-image.com/docs/')
        .replace('://media.tarkett-image.com/medium/', '://media.tarkett-image.com/docs/');
    }

    return raw
      .replace('/medium/', '/large/')
      .replace('://media.tarkett-image.com/S/', '://media.tarkett-image.com/large/');
  }

  const normalizedPath = raw.replace(/^\/+/, '');
  if (kind === 'document') {
    return `${TARKETT_MEDIA_ORIGIN}/docs/${normalizedPath}`;
  }

  const normalizedBase = (mediaBaseUri || TARKETT_MEDIA_ORIGIN).replace(/\/+$/, '');
  return `${normalizedBase}/large/${normalizedPath}`;
}

function translateCharacteristics(source, allowedKeys) {
  const result = {};

  for (const key of allowedKeys) {
    const value = source?.[key];
    if (!value) continue;
    const label = SPEC_LABELS[key] || key;
    result[label] = String(value).trim();
  }

  return result;
}

function buildShortDescription(rawDescription, fallbackName) {
  const cleaned = sanitizeTarkettText(rawDescription);
  if (!cleaned) return fallbackName;

  const firstSentence = cleaned.match(/^(.{20,220}?[.!?])(?:\s|$)/);
  if (firstSentence?.[1]) {
    return firstSentence[1].trim();
  }

  return cleaned.length > 180 ? `${cleaned.slice(0, 177).trim()}...` : cleaned;
}

function getSerbianColorWord(count) {
  const mod10 = count % 10;
  const mod100 = count % 100;

  if (mod10 === 1 && mod100 !== 11) {
    return 'boji';
  }

  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return 'boje';
  }

  return 'boja';
}

function reconcileDeclaredColorCount(rawDescription, actualCount) {
  const cleaned = sanitizeTarkettText(rawDescription);
  if (!cleaned || !Number.isFinite(actualCount) || actualCount < 1) {
    return cleaned;
  }

  return cleaned
    .replace(/dostupna je u\s+\d+\s+boj(?:a|e|i)/i, `dostupna je u ${actualCount} ${getSerbianColorWord(actualCount)}`)
    .replace(/dostupan je u\s+\d+\s+boj(?:a|e|i)/i, `dostupan je u ${actualCount} ${getSerbianColorWord(actualCount)}`)
    .replace(/dostupno je u\s+\d+\s+boj(?:a|e|i)/i, `dostupno je u ${actualCount} ${getSerbianColorWord(actualCount)}`);
}

function splitColorName(rawName) {
  const cleaned = stripHtml(rawName).replace(/\s+/g, ' ').trim();
  const numericSuffix = cleaned.match(/^(.*?)(?:\s+(\d{3,4}))$/);

  if (numericSuffix?.[1]) {
    return {
      code: numericSuffix[2],
      name: numericSuffix[1].trim(),
    };
  }

  return {
    code: '',
    name: cleaned,
  };
}

function dedupeDocuments(documents) {
  const seen = new Set();

  return documents.filter((document) => {
    if (!document.url || seen.has(document.url)) return false;
    seen.add(document.url);
    return true;
  });
}

async function getCollectionLinks() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.goto(CATEGORY_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(2500);

    const links = await page
      .locator('a[href*="/sr_RS/kolekcija-"]')
      .evaluateAll((nodes) => nodes
        .map((node) => ({
          href: node.getAttribute('href'),
          image: node.querySelector('img')?.getAttribute('src') || node.querySelector('img')?.currentSrc || '',
        }))
        .filter((node) => node.href));

    const uniqueLinks = [];
    const seen = new Set();

    for (const entry of links) {
      if (seen.has(entry.href)) continue;
      seen.add(entry.href);
      uniqueLinks.push(entry);
    }

    if (uniqueLinks.length > 0) {
      return uniqueLinks;
    }

    return Array.from(loadExistingCollections().values()).map((collection) => ({
      href: new URL(collection.url).pathname,
      image: collection.collection_image_url || '',
    }));
  } finally {
    await browser.close();
  }
}

async function fetchCollection(link, previewImageUrl = '') {
  const url = `https://www.tarkett.rs${link}`;
  const html = await fetchText(url);
  const nuxt = extractNuxtData(html);
  const mediaBaseUri = nuxt?.state?.mediaBaseUri || 'https://media.tarkett-image.com';
  const item = nuxt?.state?.collectionProductPage?.item;

  if (!item) {
    const storedFallback = buildStoredCollectionFallback(link, previewImageUrl);
    if (storedFallback) {
      console.warn(`Using stored sports fallback for ${url} because official payload is unavailable.`);
      return storedFallback;
    }

    throw new Error(`Collection payload missing for ${url}`);
  }

  const defaultSku =
    item.collection_default_sku ||
    item.product_collection?.collection_default_sku ||
    {};

  const collectionCharacteristics = translateCharacteristics(defaultSku.sku_technical_caracteristics || {}, [
    'format',
    'format_type',
    'total_thickness',
    'wear_layer_thickness',
    'installation_method',
    'surface_treatment',
    'basis_weight',
    'product_type_norm_iso',
    'product_material',
    'product_type',
    'thermal_resistance',
    'impact_sound_insulation',
    'tvoc_emission',
    'ce_marking',
    'dop_certificate',
    'shock_absorption_gost55529',
    'vertical_ball_behaviour',
    'rolling_load_behaviour',
    'slip_resistance_din_51130',
    'reaction_to_fire',
    'colour_fastness_light',
    'surface_effect',
    'embossing_type',
    'phtalate_content',
    'surface',
    'length',
    'width',
    'laying_direction',
  ]);

  const coverAsset =
    (item.collection_assets || []).find((asset) => asset.document_role === 'COVER') ||
    (item.collection_assets || []).find((asset) => asset.document_role === 'CONSTRUCTION_IMAGE');

  const documents = dedupeDocuments(
    (item.collection_assets || [])
      .filter((asset) => asset.document_mime_type === 'pdf' && asset.document_asset_url)
      .map((asset) => ({
        title: stripHtml(asset.document_title || asset.document_label || asset.document_role || 'Dokument'),
        url: buildMediaUrl(mediaBaseUri, asset.document_asset_url, 'document'),
        type: 'pdf',
      }))
  );

  const keyFeatures = sanitizeKeyFeatureItems(cleanListItems(item.key_features));
  const detailsSections = keyFeatures.length > 0
    ? [
        {
          title: 'Ključne karakteristike',
          items: keyFeatures,
        },
      ]
    : undefined;

  const colors = [];
  const declaredColorCount = (item.designs || []).length;

  for (const design of item.designs || []) {
    const designJsonUrl = design.productDataUrl?.startsWith('//')
      ? `https:${design.productDataUrl}`
      : design.productDataUrl;

    let colorPayload = null;
    if (designJsonUrl) {
      try {
        const body = await fetchText(designJsonUrl);
        colorPayload = JSON.parse(body)?.item || null;
      } catch (error) {
        console.warn(`Skipping color payload for ${design.product_name}:`, error.message);
      }
    }

    const rawColor =
      colorPayload?.product_collection?.collection_default_sku?.sku_raw_technical_characteristics ||
      {};

    const colorTech =
      colorPayload?.product_collection?.collection_default_sku?.sku_technical_caracteristics ||
      {};

    const split = splitColorName(design.product_name || colorPayload?.product_name || '');

    const colorCharacteristics = translateCharacteristics(
      {
        ncs_color_code: design.product_ncs_color_code || rawColor.ncs_color_code || colorTech.ncs_color_code,
        light_reflectance_value:
          design.product_light_reflectance_value ||
          rawColor.light_reflectance_value ||
          colorTech.light_reflectance_value,
      },
      ['ncs_color_code', 'light_reflectance_value']
    );

    if (design.product_hex_color_code || rawColor.hex_color_code) {
      colorCharacteristics['HEX boja'] = String(design.product_hex_color_code || rawColor.hex_color_code);
    }

    if (rawColor.color_family) {
      colorCharacteristics['Porodica boja'] = String(rawColor.color_family);
    }

    colors.push({
      code: split.code,
      name: split.name,
      slug: `${collectionUrlToSlug(link)}-${split.code || 'color'}-${split.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')}`.replace(/-+/g, '-'),
      image: buildMediaUrl(
        mediaBaseUri,
        colorPayload?.product_hero_image ||
          colorPayload?.product_thumbnail ||
          defaultSku.sku_hero ||
          defaultSku.sku_thumbnail ||
          design.product_thumbnail
      ),
      description: reconcileDeclaredColorCount(
        colorPayload?.description_stripped ||
        colorPayload?.description ||
        item.description_stripped ||
        item.description ||
        '',
        declaredColorCount
      ),
      characteristics: Object.keys(colorCharacteristics).length > 0 ? colorCharacteristics : undefined,
      brandId: '3',
    });
  }

  const actualColorCount = colors.length;
  const collectionDescription = reconcileDeclaredColorCount(
    item.description_stripped || item.description || '',
    actualColorCount
  );
  const collectionShortDescriptionSource = reconcileDeclaredColorCount(
    item.short_description_stripped || item.short_description || '',
    actualColorCount
  );

  return {
    name: stripHtml(item.collection_name || item.name || toSlugFragment(link)),
    slug: collectionUrlToSlug(link),
    brandId: '3',
    url,
    colorCount: actualColorCount,
    shortDescription: buildShortDescription(
      collectionShortDescriptionSource || collectionDescription,
      stripHtml(item.collection_name || item.name || '')
    ),
    description: collectionDescription,
    categoryDescription: CATEGORY_DESCRIPTION,
    characteristics: collectionCharacteristics,
    colors,
    documents,
    detailsSections,
    collection_image_url: buildMediaUrl(
      mediaBaseUri,
      previewImageUrl || coverAsset?.document_asset_url || item.collection_picture || colors[0]?.image
    ),
  };
}

async function main() {
  const links = await getCollectionLinks();
  const collections = [];

  for (const link of links) {
    const collection = await fetchCollection(link.href, link.image);
    collections.push(collection);
  }

  const output = {
    collections,
    generatedAt: new Date().toISOString(),
    source: CATEGORY_URL,
  };

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, `${JSON.stringify(output, null, 2)}\n`, 'utf8');

  console.log(`Saved ${collections.length} Tarkett sport collections to ${OUTPUT_PATH}`);
}

main().catch((error) => {
  console.error('Failed to extract Tarkett sport data:', error);
  process.exit(1);
});
