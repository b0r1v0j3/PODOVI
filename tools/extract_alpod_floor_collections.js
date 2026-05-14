const fs = require('node:fs/promises');
const path = require('node:path');

const SITE_URL = 'https://www.alpod.rs';
const OUTPUT_PATH = path.join(process.cwd(), 'public', 'data', 'alpod_floor_collections.json');

const CATEGORIES = [
  {
    key: 'parket',
    label: 'Parket',
    categoryId: '3',
    sourceCategoryId: 11259,
    sourceSlug: 'parketi',
    sourceUrl: `${SITE_URL}/parketi/`,
  },
  {
    key: 'vinil',
    label: 'Vinil',
    categoryId: '2',
    sourceCategoryId: 11267,
    sourceSlug: 'vinil-podovi',
    sourceUrl: `${SITE_URL}/vinil-podovi/`,
  },
  {
    key: 'deking',
    label: 'Deking',
    categoryId: '5',
    sourceCategoryId: 11641,
    sourceSlug: 'spoljasnje-podne-obloge',
    sourceUrl: `${SITE_URL}/spoljasnje-podne-obloge/`,
  },
];

const NAMED_ENTITIES = {
  amp: '&',
  quot: '"',
  apos: "'",
  lt: '<',
  gt: '>',
  nbsp: ' ',
  ndash: '-',
  mdash: '-',
  times: 'x',
};

function decodeHtml(value = '') {
  return String(value)
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)))
    .replace(/&([a-z]+);/gi, (match, entity) => NAMED_ENTITIES[entity] || match);
}

function normalizeWhitespace(value = '') {
  return String(value).replace(/\s+/g, ' ').trim();
}

function stripHtml(value = '') {
  return normalizeWhitespace(decodeHtml(String(value).replace(/<[^>]*>/g, ' ')));
}

function slugify(value = '') {
  return normalizeWhitespace(decodeHtml(value))
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function specKey(label, fallback = 'spec') {
  return slugify(label).replace(/-/g, '_') || fallback;
}

function isPriceAbsent(product) {
  const priceHtml = stripHtml(product.price_html || '');
  const priceValue = Number(product.prices?.price || 0);
  return !priceHtml && priceValue === 0;
}

function getTerms(attribute) {
  return (attribute?.terms || [])
    .map((term) => normalizeWhitespace(decodeHtml(term?.name || term || '')))
    .filter(Boolean);
}

function productAttributesToCharacteristics(product) {
  const result = {};

  for (const attribute of product.attributes || []) {
    const label = normalizeWhitespace(decodeHtml(attribute.name || ''));
    const terms = getTerms(attribute);
    if (!label || terms.length === 0) {
      continue;
    }
    result[label] = terms.join(', ');
  }

  return result;
}

function mapImages(product, fallbackAlt) {
  const seenUrls = new Set();
  const images = [];

  for (const image of product.images || []) {
    const url = normalizeWhitespace(image.src || image.thumbnail || '');
    if (!url || seenUrls.has(url)) {
      continue;
    }

    seenUrls.add(url);
    images.push({
      id: `alpod-img-${image.id || product.id}-${images.length + 1}`,
      url,
      alt: normalizeWhitespace(decodeHtml(image.alt || fallbackAlt || product.name || '')),
      isPrimary: images.length === 0,
      order: images.length,
      variants: {
        thumb: image.thumbnail || url,
        card: image.thumbnail || url,
        hero: url,
        og: url,
      },
    });
  }

  return images;
}

function cleanProductName(rawName, categoryKey) {
  let name = normalizeWhitespace(decodeHtml(rawName));

  if (categoryKey === 'vinil') {
    name = name.replace(/^VINIL\s+/i, '');
  } else if (categoryKey === 'parket') {
    name = name.replace(/^PARKET\s+/i, '');
  } else if (categoryKey === 'deking') {
    name = name.replace(/^DECKING\s+/i, '');
  }

  return name;
}

function findCategoryById(categoryMap, id) {
  return categoryMap.get(Number(id)) || null;
}

function isDescendantOf(categoryMap, categoryId, ancestorId) {
  let current = findCategoryById(categoryMap, categoryId);
  const seen = new Set();

  while (current && current.parent && !seen.has(current.id)) {
    seen.add(current.id);
    if (current.parent === ancestorId) {
      return true;
    }
    current = findCategoryById(categoryMap, current.parent);
  }

  return false;
}

function findDirectChildAncestor(categoryMap, categoryId, ancestorId) {
  let current = findCategoryById(categoryMap, categoryId);
  let previous = null;
  const seen = new Set();

  while (current && current.parent && !seen.has(current.id)) {
    seen.add(current.id);
    if (current.parent === ancestorId) {
      return current;
    }

    previous = current;
    current = findCategoryById(categoryMap, current.parent);

    if (current?.id === ancestorId) {
      return previous;
    }
  }

  return null;
}

function findCollectionCategory(product, categoryConfig, categoryMap) {
  const productCategories = product.categories || [];
  const directChildren = productCategories
    .map((category) => findCategoryById(categoryMap, category.id))
    .filter((category) => category?.parent === categoryConfig.sourceCategoryId);

  if (directChildren.length > 0) {
    return directChildren.sort((a, b) => (b.count || 0) - (a.count || 0))[0];
  }

  const descendant = productCategories
    .map((category) => findCategoryById(categoryMap, category.id))
    .find((category) => category && isDescendantOf(categoryMap, category.id, categoryConfig.sourceCategoryId));

  if (descendant) {
    return findDirectChildAncestor(categoryMap, descendant.id, categoryConfig.sourceCategoryId) || descendant;
  }

  return findCategoryById(categoryMap, categoryConfig.sourceCategoryId);
}

function getLineageCategories(product, collectionCategory, categoryConfig, categoryMap) {
  const collectionId = collectionCategory?.id;
  return (product.categories || [])
    .map((category) => findCategoryById(categoryMap, category.id))
    .filter((category) => {
      if (!category || category.id === categoryConfig.sourceCategoryId || category.id === collectionId) {
        return false;
      }
      return collectionId ? isDescendantOf(categoryMap, category.id, collectionId) : false;
    })
    .sort((a, b) => (a.parent === collectionId ? -1 : 1) - (b.parent === collectionId ? -1 : 1));
}

function colorFromProduct(product, categoryConfig, collectionCategory, categoryMap) {
  const fullName = normalizeWhitespace(decodeHtml(product.name || ''));
  const displayName = cleanProductName(fullName, categoryConfig.key);
  const sourceSku = normalizeWhitespace(decodeHtml(product.sku || ''));
  const slug = `podovi-${categoryConfig.key}-${slugify(product.slug || fullName || product.id)}`;
  const images = mapImages(product, displayName);
  const characteristics = productAttributesToCharacteristics(product);
  const lineageCategories = getLineageCategories(product, collectionCategory, categoryConfig, categoryMap);
  const subcollection = lineageCategories.map((category) => normalizeWhitespace(decodeHtml(category.name))).filter(Boolean).join(' / ');
  const description = stripHtml(product.description || product.short_description || '');

  if (subcollection) {
    characteristics['Podkolekcija'] = subcollection;
  }
  if (sourceSku) {
    characteristics['Šifra dobavljača'] = sourceSku;
  }

  return {
    sourceId: product.id,
    sourceSku,
    code: sourceSku || String(product.id),
    name: displayName,
    full_name: fullName,
    slug,
    sourceSlug: product.slug,
    url: product.permalink,
    image: images[0]?.url || '',
    image_url: images[0]?.url || '',
    texture_url: images[0]?.url || '',
    image_count: images.length,
    images,
    description,
    characteristics,
    brandId: '14',
    priceAbsent: true,
    prices: product.prices || null,
  };
}

function summarizeCollectionCharacteristics(colors) {
  const summaries = new Map();

  for (const color of colors) {
    for (const [label, value] of Object.entries(color.characteristics || {})) {
      if (!value || label === 'Šifra dobavljača') {
        continue;
      }

      const key = specKey(label, label);
      const summary = summaries.get(key) || { label, values: new Set() };
      String(value).split(',').map((part) => part.trim()).filter(Boolean).forEach((part) => summary.values.add(part));
      summaries.set(key, summary);
    }
  }

  const result = {};
  for (const [key, summary] of summaries.entries()) {
    if (summary.values.size > 0 && summary.values.size <= 8) {
      result[summary.label] = Array.from(summary.values).join(', ');
    }
  }

  return result;
}

function buildCollection(collectionCategory, categoryConfig, products, categoryMap) {
  const rawName = normalizeWhitespace(decodeHtml(collectionCategory?.name || categoryConfig.label));
  const collectionSlug = `podovi-${categoryConfig.key}-${slugify(collectionCategory?.slug || rawName)}`;
  const colors = products
    .map((product) => colorFromProduct(product, categoryConfig, collectionCategory, categoryMap))
    .sort((a, b) => a.name.localeCompare(b.name, 'sr'));
  const collectionImages = colors.flatMap((color) => color.images || []);
  const description = stripHtml(collectionCategory?.description || '');
  const fallbackDescription = `${rawName} kolekcija u kategoriji ${categoryConfig.label.toLowerCase()}. Proizvodi su bez javno istaknute cene, pa se cena i dostupnost proveravaju preko upita.`;
  const characteristics = summarizeCollectionCharacteristics(colors);

  return {
    id: `alpod-${categoryConfig.key}-${collectionCategory?.id || slugify(rawName)}`,
    sourceCategoryId: collectionCategory?.id || categoryConfig.sourceCategoryId,
    sourceCategoryParentId: collectionCategory?.parent || categoryConfig.sourceCategoryId,
    sourceSlug: collectionCategory?.slug || categoryConfig.sourceSlug,
    categoryKey: categoryConfig.key,
    categoryId: categoryConfig.categoryId,
    brandId: '14',
    name: rawName,
    slug: collectionSlug,
    sku: `PODOVI-COLLECTION-${categoryConfig.key.toUpperCase()}-${slugify(rawName).toUpperCase()}`,
    url: collectionCategory?.permalink || categoryConfig.sourceUrl,
    description: description || fallbackDescription,
    shortDescription: `${rawName} - ${colors.length} ${categoryConfig.key === 'deking' ? 'artikala' : 'dekora'} bez javno istaknute cene`,
    collection_image_url: collectionImages[0]?.url || '',
    image: collectionImages[0]?.url || '',
    image_url: collectionImages[0]?.url || '',
    colorCount: colors.length,
    characteristics,
    colors: colors.map((color) => ({
      ...color,
      collection: collectionSlug,
      collection_slug: collectionSlug,
      collection_name: rawName,
      collection_url: collectionCategory?.permalink || categoryConfig.sourceUrl,
    })),
  };
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: {
      accept: 'application/json',
      'user-agent': 'podovi-online-catalog-import/1.0',
    },
  });

  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText} for ${url}`);
  }

  return { data: await response.json(), response };
}

async function fetchAllStoreCategories() {
  const categories = [];

  for (let page = 1; ; page += 1) {
    const url = `${SITE_URL}/wp-json/wc/store/v1/products/categories?per_page=100&page=${page}`;
    const { data, response } = await fetchJson(url);
    categories.push(...data);

    const totalPages = Number(response.headers.get('x-wp-totalpages') || 1);
    if (page >= totalPages) {
      break;
    }
  }

  return new Map(categories.map((category) => [Number(category.id), category]));
}

async function fetchProductsForCategory(categoryConfig) {
  const products = [];

  for (let page = 1; ; page += 1) {
    const url = `${SITE_URL}/wp-json/wc/store/v1/products?category=${categoryConfig.sourceCategoryId}&per_page=100&page=${page}`;
    const { data, response } = await fetchJson(url);
    products.push(...data.filter(isPriceAbsent));

    const totalPages = Number(response.headers.get('x-wp-totalpages') || 1);
    if (page >= totalPages) {
      break;
    }
  }

  return products;
}

async function main() {
  const categoryMap = await fetchAllStoreCategories();
  const collections = [];
  const countsByCategory = {};

  for (const categoryConfig of CATEGORIES) {
    const products = await fetchProductsForCategory(categoryConfig);
    const groupedProducts = new Map();

    for (const product of products) {
      const collectionCategory = findCollectionCategory(product, categoryConfig, categoryMap);
      const key = String(collectionCategory?.id || categoryConfig.sourceCategoryId);
      const group = groupedProducts.get(key) || {
        collectionCategory,
        products: [],
      };
      group.products.push(product);
      groupedProducts.set(key, group);
    }

    const categoryCollections = Array.from(groupedProducts.values())
      .map((group) => buildCollection(group.collectionCategory, categoryConfig, group.products, categoryMap))
      .sort((a, b) => a.name.localeCompare(b.name, 'sr'));

    countsByCategory[categoryConfig.key] = {
      products: products.length,
      collections: categoryCollections.length,
    };
    collections.push(...categoryCollections);
  }

  const output = {
    generatedAt: new Date().toISOString(),
    source: {
      site: SITE_URL,
      api: `${SITE_URL}/wp-json/wc/store/v1/products`,
      rule: 'Imported only products whose Store API price_html is empty and prices.price is 0.',
    },
    displayBrand: {
      id: '14',
      name: 'Podovi',
      note: 'Alpod is the import source, not the displayed product brand.',
    },
    counts: {
      totalProducts: collections.reduce((sum, collection) => sum + collection.colors.length, 0),
      totalCollections: collections.length,
      byCategory: countsByCategory,
    },
    collections,
  };

  await fs.mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
  await fs.writeFile(OUTPUT_PATH, `${JSON.stringify(output, null, 2)}\n`, 'utf8');

  console.log(`Wrote ${OUTPUT_PATH}`);
  console.log(JSON.stringify(output.counts, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
