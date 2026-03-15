const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const https = require('https');
const vm = require('vm');

const CATEGORY_URL = 'https://www.tarkett.rs/sr_RS/kategorija-rs_C01014-vinil-za-kucu';
const OUTPUT_PATH = path.join(process.cwd(), 'public', 'data', 'tarkett_vinyl_home_colors.json');
const SITE_ORIGIN = 'https://www.tarkett.rs';

const SPEC_LABELS = {
  basis_weight: 'Težina',
  ce_marking: 'CE oznaka',
  chemical_resistance_iso_26987: 'Hemijska otpornost',
  classification_commercial_iso_10874: 'Komercijalna klasifikacija',
  classification_domestic_iso_10874: 'Rezidencijalna klasifikacija',
  colour_fastness_light: 'Postojanost boje na svetlost',
  country_origin: 'Zemlja porekla',
  embossing_type: 'Reljef',
  format: 'Format',
  format_type: 'Tip formata',
  furniture_leg_effect_iso_16581: 'Otpornost na nameštaj',
  impact_sound_insulation: 'Zvučna izolacija',
  installation_method: 'Način ugradnje',
  laying_direction: 'Pravac polaganja',
  length: 'Dužina',
  pattern: 'Dizajn',
  pattern_type: 'Tip dezena',
  product_material: 'Materijal',
  product_type: 'Tip proizvoda',
  product_type_norm_iso: 'Tip proizvoda (ISO)',
  reaction_fire_en_13501: 'Reakcija na vatru',
  residual_indentation: 'Zaostala ulegnuća',
  slip_resistance_en_13893: 'Otpornost na klizanje',
  surface: 'Površina',
  surface_effect: 'Efekat površine',
  surface_treatment: 'Površinski tretman',
  thermal_resistance: 'Toplotni otpor',
  total_thickness: 'Ukupna debljina',
  tvoc_emission: 'TVOC emisije',
  underfloor_heating: 'Podno grejanje',
  wear_layer_thickness: 'Debljina habajućeg sloja',
  width: 'Širina',
};

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

function buildMediaUrl(mediaBaseUri, assetPath) {
  if (!assetPath) return '';
  if (String(assetPath).startsWith('http://') || String(assetPath).startsWith('https://') || String(assetPath).startsWith('//')) {
    return normalizeSiteUrl(assetPath);
  }

  const normalizedBase = (mediaBaseUri || 'https://media.tarkett-image.com').replace(/\/+$/, '');
  return `${normalizedBase}/large/${String(assetPath).replace(/^\/+/, '')}`;
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
    const label = SPEC_LABELS[key] || key;
    result[label] = String(value).trim();
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

async function getCollectionLinks(page) {
  await page.goto(CATEGORY_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(2500);

  const links = await page
    .locator('a[href*="/sr_RS/kolekcija-"]')
    .evaluateAll((nodes) => nodes.map((node) => node.getAttribute('href')).filter(Boolean));

  const description =
    (await page.locator('meta[name="description"]').getAttribute('content').catch(() => null)) || '';

  return {
    links: [...new Set(links)],
    description: stripHtml(description),
  };
}

async function fetchCollection(page, link, categoryDescription) {
  const url = normalizeSiteUrl(link);
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(1800);

  const html = await page.content();
  const nuxt = extractNuxtData(html);
  const mediaBaseUri = nuxt?.state?.mediaBaseUri || 'https://media.tarkett-image.com';
  const item = nuxt?.state?.collectionProductPage?.item;

  if (!item) {
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
        url: buildMediaUrl(mediaBaseUri, asset.document_asset_url),
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

  const colors = [];
  let collectionCharacteristics = {};

  for (const design of item.designs || []) {
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

    const rawColor =
      colorPayload?.product_collection?.collection_default_sku?.sku_raw_technical_characteristics ||
      {};
    const colorTech =
      colorPayload?.product_collection?.collection_default_sku?.sku_technical_caracteristics ||
      {};

    if (Object.keys(collectionCharacteristics).length === 0) {
      collectionCharacteristics = {
        Tip: 'Heterogeni',
        ...translateCharacteristics(defaultSku.sku_technical_caracteristics || {}, [
          'classification_domestic_iso_10874',
          'classification_commercial_iso_10874',
          'total_thickness',
          'wear_layer_thickness',
          'surface_treatment',
          'residual_indentation',
          'chemical_resistance_iso_26987',
          'reaction_fire_en_13501',
          'slip_resistance_en_13893',
          'underfloor_heating',
          'impact_sound_insulation',
          'ce_marking',
          'tvoc_emission',
          'country_origin',
          'format',
          'format_type',
          'length',
          'width',
          'basis_weight',
          'installation_method',
          'pattern_type',
          'pattern',
          'embossing_type',
          'surface_effect',
          'product_type_norm_iso',
          'product_type',
          'product_material',
          'thermal_resistance',
          'laying_direction',
          'surface',
        ]),
        ...flattenProductGroupAttributes(colorPayload?.product_group_attributes || []),
      };
    }

    const colorCharacteristics = {};

    if (rawColor.color_family) {
      colorCharacteristics['Porodica boja'] = String(rawColor.color_family);
    }
    if (design.product_hex_color_code || rawColor.hex_color_code) {
      colorCharacteristics['HEX boja'] = String(design.product_hex_color_code || rawColor.hex_color_code);
    }
    if (design.product_ncs_color_code || rawColor.ncs_color_code || colorTech.ncs_color_code) {
      colorCharacteristics['NCS oznaka'] = String(
        design.product_ncs_color_code || rawColor.ncs_color_code || colorTech.ncs_color_code
      );
    }
    if (design.product_light_reflectance_value || rawColor.light_reflectance_value || colorTech.light_reflectance_value) {
      colorCharacteristics['LRV'] = String(
        design.product_light_reflectance_value ||
          rawColor.light_reflectance_value ||
          colorTech.light_reflectance_value
      );
    }

    const colorName = toTitleCase(colorPayload?.product_name || design.product_name || '');
    const colorSlug = `${collectionUrlToSlug(link)}-color-${slugify(colorName || design.product_name || 'color')}`;

    colors.push({
      code: '',
      name: colorName,
      slug: colorSlug,
      image: buildMediaUrl(
        mediaBaseUri,
        colorPayload?.product_hero_image ||
          colorPayload?.product_thumbnail ||
          defaultSku.sku_hero ||
          defaultSku.sku_thumbnail ||
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
    name: stripHtml(item.collection_name || item.name || toSlugFragment(link)),
    slug: collectionUrlToSlug(link),
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
      coverAsset?.document_asset_url || item.collection_picture || colors[0]?.image
    ),
  };
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    const { links, description } = await getCollectionLinks(page);
    const collections = [];

    for (const link of links) {
      const collection = await fetchCollection(page, link, description);
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
    console.log(`Saved ${collections.length} Tarkett vinil collections / ${totalColors} boja to ${OUTPUT_PATH}`);
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error('Failed to extract Tarkett vinyl home data:', error);
  process.exit(1);
});
