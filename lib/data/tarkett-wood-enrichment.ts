import type { Product } from '@/types';
import { enrichProductDescription, enrichShortDescription } from '@/lib/utils/description-enricher';
import { getEffectiveParketCollection, getParketCollectionSlug } from '@/lib/data/parket-collection-mapping';
import { tarkettProducts } from '@/lib/data/tarkett-products';
import tarkettWoodCollectionIndex from '@/public/data/tarkett_wood_collection_index.json';
import tarkettDocumentsIndex from '@/public/data/tarkett_documents_index.json';

type CategoryKey = 'laminat' | 'parket';

type DocumentLink = {
  title: string;
  url: string;
};

type TarkettCollectionMeta = {
  name?: string;
  slug?: string;
  url?: string;
  shortDescription?: string;
  description?: string;
  keyFeatures?: string[];
  specs?: Product['specs'];
  documents?: DocumentLink[];
  heroImage?: string;
};

type TarkettWoodCollectionIndex = Record<CategoryKey, Record<string, TarkettCollectionMeta>>;
type TarkettDocumentsIndex = Record<CategoryKey, Record<string, DocumentLink[]>>;

const woodIndex = tarkettWoodCollectionIndex as TarkettWoodCollectionIndex;
const documentsIndex = tarkettDocumentsIndex as TarkettDocumentsIndex;

function cloneProduct(product: Product): Product {
  return {
    ...product,
    images: (product.images || []).map((image) => ({ ...image })),
    specs: (product.specs || []).map((spec) => ({ ...spec })),
    documents: product.documents?.map((document) => ({ ...document })),
    detailsSections: product.detailsSections?.map((section) => ({
      ...section,
      items: [...section.items],
    })),
    compatibleAccessories: product.compatibleAccessories ? [...product.compatibleAccessories] : undefined,
  };
}

function normalizeText(value: unknown) {
  return String(value || '')
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeDescriptionText(value: unknown) {
  return normalizeText(value)
    .replace(/([.!?])(?=[A-ZČĆŠĐŽ])/g, '$1 ')
    .replace(/\bPOGLEDAJTE VIDEO\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function slugify(value: unknown) {
  return normalizeText(value)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function isWeakDescription(description: unknown) {
  const value = normalizeDescriptionText(description);
  if (!value) return true;

  return (
    value.length < 90 ||
    /\bna lageru\b/i.test(value) ||
    /\bplaceholder\b/i.test(value) ||
    /\bkratak opis\b/i.test(value) ||
    /kolekcija koja balansira stil i kvalitet/i.test(value) ||
    /kolekcija sa autentičnom snagom drveta/i.test(value) ||
    /kolekcija čiji je dizajn stvoren da traje/i.test(value) ||
    /^laminat iz kolekcije /i.test(value) ||
    /^parket - /i.test(value)
  );
}

function isWeakShortDescription(value: unknown) {
  const normalized = normalizeText(value);
  if (!normalized) return true;

  return normalized.length < 18 || /\bna lageru\b/i.test(normalized) || /\bplaceholder\b/i.test(normalized);
}

function truncateSentence(value: unknown, maxLength = 155) {
  const normalized = normalizeDescriptionText(value);
  if (!normalized) return '';

  const sentences = normalized.match(/[^.!?]+[.!?]?/g) || [];
  const firstSentence = normalizeText(sentences[0] || normalized);
  if (firstSentence && firstSentence.length <= maxLength) {
    return firstSentence;
  }

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength - 3).trim()}...`;
}

function getCategoryKey(product: Product): CategoryKey | null {
  if (product.brandId !== '3') return null;
  if (product.categoryId === '1') return 'laminat';
  if (product.categoryId === '3') return 'parket';
  return null;
}

function isCollectionHeader(product: Product, categoryKey: CategoryKey) {
  const prefix = categoryKey === 'parket' ? 'PARKET-' : 'LAM-';
  return String(product.sku || '').startsWith(prefix);
}

function getCollectionName(product: Product, categoryKey: CategoryKey) {
  if (categoryKey === 'parket') {
    return getEffectiveParketCollection(
      product.slug,
      product.specs?.find((spec) => spec.key === 'collection')?.value
    );
  }

  return normalizeText(product.specs?.find((spec) => spec.key === 'collection')?.value);
}

function getCollectionSlug(product: Product, categoryKey: CategoryKey) {
  if (isCollectionHeader(product, categoryKey)) {
    return normalizeText(product.slug);
  }

  const collectionName = getCollectionName(product, categoryKey);
  if (!collectionName) return '';

  if (categoryKey === 'parket') {
    return getParketCollectionSlug(collectionName) || slugify(collectionName);
  }

  return slugify(collectionName);
}

function getCollectionMeta(product: Product, categoryKey: CategoryKey) {
  const collectionSlug = getCollectionSlug(product, categoryKey);
  if (!collectionSlug) return null;

  return {
    categoryKey,
    collectionSlug,
    collectionName: getCollectionName(product, categoryKey) || normalizeText(product.name),
    meta: woodIndex?.[categoryKey]?.[collectionSlug] || null,
  };
}

function dedupeDocuments(documents: DocumentLink[]) {
  const seen = new Set<string>();
  return documents.filter((document) => {
    const url = normalizeText(document?.url);
    if (!url || seen.has(url)) return false;
    seen.add(url);
    return true;
  });
}

function buildVariantDescription(product: Product, categoryKey: CategoryKey, collectionName: string, collectionDescription: string) {
  const thickness =
    product.specs?.find((spec) => spec.key === 'overall_thickness' || spec.key === 'thickness')?.value || '';
  const wearLayer = product.specs?.find((spec) => spec.key === 'wear_layer')?.value || '';
  const classification =
    product.specs?.find((spec) => spec.key === 'classification' || spec.key === 'class')?.value || '';
  const format = product.specs?.find((spec) => spec.key === 'format_type' || spec.key === 'format')?.value || '';
  const installation =
    product.specs?.find((spec) => spec.key === 'locking_system' || spec.key === 'installation_method')?.value || '';

  const intro =
    categoryKey === 'laminat'
      ? `${product.name} je dekor iz Tarkett kolekcije ${collectionName}, namenjen enterijerima koji traže izdržljiv laminat sa izraženim karakterom drveta.`
      : `${product.name} je dekor iz Tarkett kolekcije ${collectionName}, namenjen prostorima koji traže prirodan parket sa toplim i dugotrajnim završnim efektom.`;

  const details = [
    thickness ? `Ukupna debljina iznosi ${thickness}.` : '',
    wearLayer ? `Habajući sloj je ${wearLayer}.` : '',
    classification ? `Klasa upotrebe je ${classification}.` : '',
    format ? `Format proizvoda je ${format}.` : '',
    installation ? `Sistem ugradnje: ${installation}.` : '',
  ]
    .filter(Boolean)
    .join(' ');

  return normalizeDescriptionText([intro, collectionDescription, details].filter(Boolean).join(' '));
}

function buildVariantShortDescription(categoryKey: CategoryKey, collectionName: string, productName: string) {
  return normalizeText(
    categoryKey === 'laminat'
      ? `Tarkett laminat ${collectionName} - ${productName}`
      : `Tarkett parket ${collectionName} - ${productName}`
  );
}

function mergeDocuments(product: Product, categoryKey: CategoryKey, collectionSlug: string, officialDocuments: DocumentLink[]) {
  const indexedDocuments = documentsIndex?.[categoryKey]?.[collectionSlug] || [];
  return dedupeDocuments([...(product.documents || []), ...officialDocuments, ...indexedDocuments]);
}

function upsertKeyFeatures(product: Product, keyFeatures: string[]) {
  if (!keyFeatures.length) return product.detailsSections;

  const sections = [...(product.detailsSections || [])];
  const sectionIndex = sections.findIndex((section) => /klju(č|c)ne karakteristike/i.test(section.title));

  if (sectionIndex === -1) {
    return [{ title: 'Ključne karakteristike', items: keyFeatures }, ...sections];
  }

  const existing = sections[sectionIndex];
  if ((existing.items || []).length >= keyFeatures.length) {
    return sections;
  }

  sections[sectionIndex] = {
    ...existing,
    items: keyFeatures,
  };

  return sections;
}

function countMeaningfulSpecs(specs: Product['specs']) {
  return (specs || []).filter((spec) => normalizeText(spec.value) && spec.key !== 'collection').length;
}

function mergeSpecs(baseSpecs: Product['specs'], extraSpecs: Product['specs']) {
  const merged = [...(baseSpecs || []).map((spec) => ({ ...spec }))];
  const seen = new Set(
    merged.map((spec) => normalizeText(spec.label || spec.key).toLowerCase()).filter(Boolean)
  );

  for (const spec of extraSpecs || []) {
    const dedupeKey = normalizeText(spec.label || spec.key).toLowerCase();
    if (!dedupeKey || !normalizeText(spec.value) || seen.has(dedupeKey)) {
      continue;
    }

    merged.push({ ...spec });
    seen.add(dedupeKey);
  }

  return merged;
}

function mergeVariantSpecsFromCollectionHeader(product: Product, categoryKey: CategoryKey, collectionSlug: string) {
  if (isCollectionHeader(product, categoryKey) || countMeaningfulSpecs(product.specs) >= 2) {
    return product.specs || [];
  }

  const header = tarkettProducts.find((candidate) =>
    candidate.categoryId === product.categoryId &&
    normalizeText(candidate.slug) === collectionSlug &&
    isCollectionHeader(candidate as Product, categoryKey)
  );

  if (!header?.specs?.length) {
    return product.specs || [];
  }

  return mergeSpecs(product.specs || [], header.specs || []);
}

export function enrichTarkettWoodProduct(product: Product): Product {
  const categoryKey = getCategoryKey(product);
  if (!categoryKey) {
    return cloneProduct(product);
  }

  const enriched = cloneProduct(product);
  const context = getCollectionMeta(enriched, categoryKey);

  if (!context?.meta) {
    if (isWeakDescription(enriched.description)) {
      enriched.description = normalizeDescriptionText(enrichProductDescription(enriched));
    }
    if (isWeakShortDescription(enriched.shortDescription)) {
      enriched.shortDescription = normalizeText(enrichShortDescription(enriched));
    }
    return enriched;
  }

  const { collectionSlug, collectionName, meta } = context;
  const officialDescription = normalizeDescriptionText(meta.description);
  const officialShortDescription = truncateSentence(meta.shortDescription || meta.description, 150);
  const officialDocuments = mergeDocuments(enriched, categoryKey, collectionSlug, meta.documents || []);

  if (meta.specs?.length) {
    enriched.specs = mergeSpecs(enriched.specs || [], meta.specs);
  }

  enriched.specs = mergeVariantSpecsFromCollectionHeader(enriched, categoryKey, collectionSlug);

  if (!normalizeText(enriched.externalLink) && normalizeText(meta.url)) {
    enriched.externalLink = normalizeText(meta.url);
  }

  if (!enriched.documents || enriched.documents.length === 0) {
    enriched.documents = officialDocuments;
  } else if (officialDocuments.length > enriched.documents.length) {
    enriched.documents = officialDocuments;
  }

  if ((!enriched.images || enriched.images.length === 0) && normalizeText(meta.heroImage)) {
    enriched.images = [
      {
        id: `tarkett-wood-${collectionSlug}-hero`,
        url: normalizeText(meta.heroImage),
        alt: meta.name || enriched.name,
        isPrimary: true,
        order: 0,
      },
    ];
  }

  if (Array.isArray(meta.keyFeatures) && meta.keyFeatures.length > 0) {
    enriched.detailsSections = upsertKeyFeatures(
      enriched,
      meta.keyFeatures.map((item) => normalizeDescriptionText(item)).filter(Boolean)
    );
  }

  if (isCollectionHeader(enriched, categoryKey)) {
    if (officialDescription && (isWeakDescription(enriched.description) || officialDescription.length > normalizeDescriptionText(enriched.description).length)) {
      enriched.description = officialDescription;
    }
    if (isWeakShortDescription(enriched.shortDescription) && officialShortDescription) {
      enriched.shortDescription = officialShortDescription;
    }
  } else {
    if (officialDescription && isWeakDescription(enriched.description)) {
      enriched.description = buildVariantDescription(enriched, categoryKey, collectionName, officialDescription);
    } else if (isWeakDescription(enriched.description)) {
      enriched.description = normalizeDescriptionText(enrichProductDescription(enriched));
    }

    if (isWeakShortDescription(enriched.shortDescription)) {
      enriched.shortDescription = buildVariantShortDescription(categoryKey, collectionName, enriched.name);
    }
  }

  if (isWeakShortDescription(enriched.shortDescription) && officialShortDescription) {
    enriched.shortDescription = officialShortDescription;
  }

  if (isWeakDescription(enriched.description)) {
    enriched.description = normalizeDescriptionText(enrichProductDescription(enriched));
  }

  return enriched;
}
