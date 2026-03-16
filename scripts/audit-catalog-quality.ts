import fs from 'node:fs/promises';
import path from 'node:path';

import type { Product } from '@/types';
import { products as mockProducts } from '@/lib/data/mock-data';
import { tarkettProducts } from '@/lib/data/tarkett-products';
import { getManualCollectionProducts } from '@/lib/data/manual-collection-products';
import {
  getAllBloqCarpetProducts,
  getAllCarpetProducts,
  getAllDekingProducts,
  getAllLVTProducts,
  getAllTarkettLVTProducts,
  getEsdCollectionProducts,
  getGerflorLinoleumCollections,
  getGerflorLVTCollections,
  getTarkettLVTCollections,
  getTarkettHomogeneousVinylCollections,
  getTarkettSportCollections,
  getTarkettVinylHomeCollections,
  getVinylCollectionProducts,
} from '@/lib/utils/productDataLoader';
import { mapCategoryIdToUUID } from '@/lib/repositories/id-mapping';
import { enrichTarkettWoodProduct } from '@/lib/data/tarkett-wood-enrichment';
import vinylColorsData from '@/public/data/vinyl_colors_complete.json';
import vinylSpecialColorsData from '@/public/data/vinyl_special_colors.json';
import esdColorsData from '@/public/data/esd_colors.json';
import industrialColorsData from '@/public/data/industrial_colors.json';
import sportColorsData from '@/public/data/sport_colors.json';
import tarkettHomogeneousVinylData from '@/public/data/tarkett_homogeneous_vinyl_colors.json';
import tarkettVinylHomeData from '@/public/data/tarkett_vinyl_home_colors.json';
import tarkettSportData from '@/public/data/tarkett_sport_colors.json';
import lvtColorsData from '@/public/data/lvt_colors_complete.json';
import linoleumColorsData from '@/public/data/linoleum_colors_complete.json';
import carpetColorsData from '@/public/data/carpet_tiles_complete.json';
import bloqCarpetData from '@/public/data/bloq_carpet_tiles.json';
import tarkettLvtData from '@/public/data/tarkett_lvt_products.json';

type Severity = 'high' | 'medium' | 'low';

type ProductAuditFinding = {
  severity: Severity;
  source: string;
  slug: string;
  name: string;
  categoryId: string;
  brandId: string;
  issue: string;
  detail: string;
};

type DatasetSummary = {
  name: string;
  collections?: number;
  colors?: number;
  items?: number;
  weakDescriptions?: number;
  missingDescriptions?: number;
  missingShortDescriptions?: number;
  missingCollectionImages?: number;
  missingColorImages?: number;
  missingDocuments?: number;
  missingCharacteristics?: number;
  duplicateCollectionImages?: number;
};

const OUTPUT_DIR = path.join(process.cwd(), 'output');
const OUTPUT_PATH = path.join(OUTPUT_DIR, 'catalog-quality-audit.json');

const BRAND_NAMES: Record<string, string> = {
  '3': 'Tarkett',
  '6': 'Gerflor',
  '8': 'BLOQ',
  '10': 'TimberTech',
};

const CATEGORY_NAMES: Record<string, string> = {
  '1': 'Laminat',
  '2': 'Vinil',
  '3': 'Parket',
  '4': 'Tekstilne ploče',
  '5': 'Deking',
  '6': 'LVT',
  '7': 'Linoleum',
  '8': 'Elektroprovodni',
  '9': 'Industrijske ploče',
  '10': 'Sport',
};

function normalizeText(value: unknown) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .replace(/\u00a0/g, ' ')
    .trim();
}

function stripHtml(value: unknown) {
  return normalizeText(String(value || '').replace(/<[^>]+>/g, ' '));
}

function parseEnvLine(line: string) {
  const separatorIndex = line.indexOf('=');
  if (separatorIndex === -1) return null;

  const key = line.slice(0, separatorIndex).trim();
  if (!key) return null;

  let value = line.slice(separatorIndex + 1).trim();
  if (value.startsWith('"') && value.endsWith('"')) {
    value = value.slice(1, -1);
  }

  return { key, value };
}

async function loadLocalEnvFile() {
  const envPath = path.join(process.cwd(), '.env.local');

  try {
    const raw = await fs.readFile(envPath, 'utf8');
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const entry = parseEnvLine(trimmed);
      if (!entry) continue;
      if (!process.env[entry.key]) {
        process.env[entry.key] = entry.value;
      }
    }
  } catch {
    // Optional in local runs.
  }
}

function isWeakDescription(description: string) {
  const value = normalizeText(description);
  if (!value) return true;

  return (
    value.length < 90 ||
    /\bNa lageru\b/i.test(value) ||
    /\bplaceholder\b/i.test(value) ||
    /\bkratak opis\b/i.test(value) ||
    /\bopis proizvoda\b/i.test(value) ||
    /profesionalni (homogeni|heterogeni|vinil|linoleum|parket|sportski|komercijalni) podovi/i.test(value) ||
    /^\w.*\s-\s(profesionalni|homogeni|heterogeni|sportski)/i.test(value) ||
    /sportska kolekcija\.$/i.test(value)
  );
}

function isWeakShortDescription(shortDescription: string) {
  const value = normalizeText(shortDescription);
  if (!value) return true;

  return (
    value.length < 18 ||
    /\bNa lageru\b/i.test(value) ||
    /\bplaceholder\b/i.test(value) ||
    /\bkratak opis\b/i.test(value)
  );
}

function countMeaningfulSpecs(product: Product) {
  return (product.specs || []).filter((spec) => normalizeText(spec.value) && spec.key !== 'collection').length;
}

function countMeaningfulDocuments(product: Product) {
  return (product.documents || []).filter((document) => normalizeText(document.url)).length;
}

function hasBrokenTarkettDocumentUrl(url: string) {
  const value = normalizeText(url);
  if (!value) return false;

  return /media\.tarkett-image\.com\/(large|large-high|medium)\/.+\.pdf(?:\?|$)/i.test(value);
}

function primaryImageUrl(product: Product) {
  const primary = (product.images || []).find((image) => image.isPrimary) || product.images?.[0];
  return normalizeText(primary?.url);
}

function collectionProductsNeedingDocs(product: Product, source: string) {
  if (product.sku.startsWith('TARKETT-SPORT-')) return true;
  if (product.sku.startsWith('TARKETT-VINYL-')) return true;
  if (product.sku.startsWith('TARKETT-LVT-')) return true;
  if (product.categoryId === '1' || product.categoryId === '3') return true;
  if (source === 'manual-collections') return true;
  return false;
}

function isKnownMissingDocumentsCase(product: Product, source: string) {
  return source === 'tarkett-sport-collections' && product.slug === 'tarkett-protectiles-plus';
}

function auditCollectionProduct(source: string, product: Product): ProductAuditFinding[] {
  const findings: ProductAuditFinding[] = [];
  const description = normalizeText(product.description);
  const shortDescription = normalizeText(product.shortDescription);
  const imageUrl = primaryImageUrl(product);
  const documentsCount = countMeaningfulDocuments(product);
  const detailsItems = (product.detailsSections || []).flatMap((section) => section.items).map(normalizeText);

  if (!description) {
    findings.push({
      severity: 'high',
      source,
      slug: product.slug,
      name: product.name,
      categoryId: product.categoryId,
      brandId: product.brandId,
      issue: 'missing_description',
      detail: 'Nema glavni opis proizvoda.',
    });
  } else if (isWeakDescription(description)) {
    findings.push({
      severity: description.length < 60 ? 'high' : 'medium',
      source,
      slug: product.slug,
      name: product.name,
      categoryId: product.categoryId,
      brandId: product.brandId,
      issue: 'weak_description',
      detail: description,
    });
  }

  if (isWeakShortDescription(shortDescription)) {
    findings.push({
      severity: 'low',
      source,
      slug: product.slug,
      name: product.name,
      categoryId: product.categoryId,
      brandId: product.brandId,
      issue: 'weak_short_description',
      detail: shortDescription || '(prazno)',
    });
  }

  if (!imageUrl) {
    findings.push({
      severity: 'high',
      source,
      slug: product.slug,
      name: product.name,
      categoryId: product.categoryId,
      brandId: product.brandId,
      issue: 'missing_primary_image',
      detail: 'Kolekcija nema primarnu sliku.',
    });
  }

  if (countMeaningfulSpecs(product) < 2) {
    findings.push({
      severity: 'medium',
      source,
      slug: product.slug,
      name: product.name,
      categoryId: product.categoryId,
      brandId: product.brandId,
      issue: 'low_specs',
      detail: `Ima samo ${countMeaningfulSpecs(product)} smislenih specifikacija.`,
    });
  }

  if (!normalizeText(product.externalLink)) {
    findings.push({
      severity: 'medium',
      source,
      slug: product.slug,
      name: product.name,
      categoryId: product.categoryId,
      brandId: product.brandId,
      issue: 'missing_external_link',
      detail: 'Kolekcija nema link ka zvaničnoj strani proizvođača.',
    });
  }

  if (
    collectionProductsNeedingDocs(product, source) &&
    documentsCount === 0 &&
    !isKnownMissingDocumentsCase(product, source)
  ) {
    findings.push({
      severity: product.brandId === '3' ? 'medium' : 'low',
      source,
      slug: product.slug,
      name: product.name,
      categoryId: product.categoryId,
      brandId: product.brandId,
      issue: 'missing_documents',
      detail: 'Kolekcijski proizvod nema dokumenta.',
    });
  }

  const brokenTarkettDocs = (product.documents || [])
    .map((document) => normalizeText(document.url))
    .filter(hasBrokenTarkettDocumentUrl);

  if (brokenTarkettDocs.length > 0) {
    findings.push({
      severity: 'high',
      source,
      slug: product.slug,
      name: product.name,
      categoryId: product.categoryId,
      brandId: product.brandId,
      issue: 'broken_tarkett_document_urls',
      detail: brokenTarkettDocs[0],
    });
  }

  if (detailsItems.some((item) => /\bNa lageru\b/i.test(item))) {
    findings.push({
      severity: 'high',
      source,
      slug: product.slug,
      name: product.name,
      categoryId: product.categoryId,
      brandId: product.brandId,
      issue: 'inventory_noise',
      detail: 'U detailsSections je ostao inventarski ili prodajni šum.',
    });
  }

  return findings;
}

function summarizeNestedDataset(
  name: string,
  collections: any[],
  options?: { requireDocuments?: boolean }
): DatasetSummary {
  const collectionImages = new Map<string, string[]>();
  let colors = 0;
  let missingDescriptions = 0;
  let weakDescriptions = 0;
  let missingCollectionImages = 0;
  let missingColorImages = 0;
  let missingDocuments = 0;
  let missingCharacteristics = 0;

  for (const collection of collections) {
    const description = stripHtml(collection.description || collection.shortDescription);
    if (!description) {
      missingDescriptions += 1;
    } else if (isWeakDescription(description)) {
      weakDescriptions += 1;
    }

    const collectionImage =
      normalizeText(collection.collection_image_url) ||
      normalizeText(collection.image || collection.image_url || collection.colors?.[0]?.image || collection.colors?.[0]?.image_url);

    if (!collectionImage) {
      missingCollectionImages += 1;
    } else {
      const normalizedImage = collectionImage;
      if (!collectionImages.has(normalizedImage)) {
        collectionImages.set(normalizedImage, []);
      }
      collectionImages.get(normalizedImage)!.push(collection.slug || collection.name || normalizedImage);
    }

    const characteristics = collection.characteristics && typeof collection.characteristics === 'object'
      ? Object.keys(collection.characteristics).filter((key) => normalizeText(collection.characteristics[key]))
      : [];
    if (characteristics.length === 0) {
      missingCharacteristics += 1;
    }

    if (options?.requireDocuments && (!Array.isArray(collection.documents) || collection.documents.length === 0)) {
      missingDocuments += 1;
    }

    for (const color of collection.colors || []) {
      colors += 1;
      if (!normalizeText(color.image || color.image_url)) {
        missingColorImages += 1;
      }
    }
  }

  const duplicateCollectionImages = Array.from(collectionImages.values()).filter((slugs) => slugs.length > 1).length;

  return {
    name,
    collections: collections.length,
    colors,
    weakDescriptions,
    missingDescriptions,
    missingCollectionImages,
    missingColorImages,
    missingDocuments,
    missingCharacteristics,
    duplicateCollectionImages,
  };
}

function summarizeFlatColorDataset(name: string, colors: any[]): DatasetSummary {
  let missingDescriptions = 0;
  let weakDescriptions = 0;
  let missingColorImages = 0;

  for (const color of colors) {
    const description = stripHtml(color.description || color.short_description || color.collection_description_sr);
    if (!description) {
      missingDescriptions += 1;
    } else if (isWeakDescription(description)) {
      weakDescriptions += 1;
    }

    if (!normalizeText(color.image || color.image_url)) {
      missingColorImages += 1;
    }
  }

  return {
    name,
    items: colors.length,
    weakDescriptions,
    missingDescriptions,
    missingColorImages,
  };
}

function summarizeProductArray(name: string, products: Product[]): DatasetSummary {
  let missingDescriptions = 0;
  let weakDescriptions = 0;
  let missingShortDescriptions = 0;
  let missingCollectionImages = 0;
  let missingDocuments = 0;

  for (const product of products) {
    const description = normalizeText(product.description);
    const shortDescription = normalizeText(product.shortDescription);

    if (!description) {
      missingDescriptions += 1;
    } else if (isWeakDescription(description)) {
      weakDescriptions += 1;
    }

    if (isWeakShortDescription(shortDescription)) {
      missingShortDescriptions += 1;
    }

    if (!primaryImageUrl(product)) {
      missingCollectionImages += 1;
    }

    if (
      collectionProductsNeedingDocs(product, name) &&
      countMeaningfulDocuments(product) === 0 &&
      !isKnownMissingDocumentsCase(product, name)
    ) {
      missingDocuments += 1;
    }
  }

  return {
    name,
    items: products.length,
    weakDescriptions,
    missingDescriptions,
    missingShortDescriptions,
    missingCollectionImages,
    missingDocuments,
  };
}

async function getSupabaseSummary() {
  await loadLocalEnvFile();

  const { getServerSupabase, hasSupabaseServiceRoleConfig } = await import('@/lib/supabase/client');

  if (!hasSupabaseServiceRoleConfig()) {
    return {
      available: false,
      reason: 'Supabase service role nije dostupan u ovom okruženju.',
    };
  }

  const supabase = getServerSupabase();
  const categoryIds = ['1', '2', '3', '4', '5', '6', '8', '9', '10'];
  const categoryUuids = categoryIds.map((categoryId) => mapCategoryIdToUUID(categoryId));

  const { data, error } = await supabase
    .from('products')
    .select('id, slug, name, category_id, brand_id, short_description, description, documents, product_images(id, url, alt, is_primary, order_num), product_specs(key, label, value)')
    .in('category_id', categoryUuids);

  if (error) {
    return {
      available: false,
      reason: error.message,
    };
  }

  const rows = (data || []) as any[];
  const perCategory = new Map<string, DatasetSummary>();

  for (const row of rows) {
    const categoryId = categoryIds.find((value) => mapCategoryIdToUUID(value) === row.category_id) || row.category_id;
    const key = `${categoryId}:${CATEGORY_NAMES[categoryId] || categoryId}`;
    const imageUrl =
      row.product_images?.find((image: any) => image.is_primary)?.url ||
      row.product_images?.[0]?.url ||
      '';
    const description = normalizeText(row.description);
    const shortDescription = normalizeText(row.short_description);
    const documents = Array.isArray(row.documents) ? row.documents : [];

    if (!perCategory.has(key)) {
      perCategory.set(key, {
        name: key,
        items: 0,
        weakDescriptions: 0,
        missingDescriptions: 0,
        missingShortDescriptions: 0,
        missingCollectionImages: 0,
        missingDocuments: 0,
      });
    }

    const entry = perCategory.get(key)!;
    entry.items = (entry.items || 0) + 1;
    if (!description) {
      entry.missingDescriptions = (entry.missingDescriptions || 0) + 1;
    } else if (isWeakDescription(description)) {
      entry.weakDescriptions = (entry.weakDescriptions || 0) + 1;
    }
    if (isWeakShortDescription(shortDescription)) {
      entry.missingShortDescriptions = (entry.missingShortDescriptions || 0) + 1;
    }
    if (!imageUrl) {
      entry.missingCollectionImages = (entry.missingCollectionImages || 0) + 1;
    }
    if (!documents.length) {
      entry.missingDocuments = (entry.missingDocuments || 0) + 1;
    }
  }

  return {
    available: true,
    totalProducts: rows.length,
    perCategory: Array.from(perCategory.values()).sort((a, b) => a.name.localeCompare(b.name, 'sr')),
  };
}

async function main() {
  const enrichedTarkettWoodProducts = tarkettProducts.map((product) => enrichTarkettWoodProduct(product));
  const collectionSources: Array<{ name: string; products: Product[] }> = [
    { name: 'mock-products', products: mockProducts },
    { name: 'manual-collections', products: getManualCollectionProducts() },
    { name: 'tarkett-parket-laminat', products: enrichedTarkettWoodProducts },
    { name: 'tarkett-lvt-collections', products: getTarkettLVTCollections() },
    { name: 'tarkett-vinyl-homogeneous-collections', products: getTarkettHomogeneousVinylCollections() },
    { name: 'tarkett-vinyl-home-collections', products: getTarkettVinylHomeCollections() },
    { name: 'tarkett-sport-collections', products: getTarkettSportCollections() },
    { name: 'gerflor-vinyl-collections', products: getVinylCollectionProducts() },
    { name: 'gerflor-esd-collections', products: getEsdCollectionProducts() },
    { name: 'gerflor-lvt-collections', products: getGerflorLVTCollections() },
    { name: 'gerflor-linoleum-collections', products: getGerflorLinoleumCollections() },
    { name: 'bloq-collections', products: getAllBloqCarpetProducts() },
    { name: 'timbertech-deking', products: getAllDekingProducts() },
  ];

  const canonicalFallbackSlugs = new Set(
    [
      ...getAllBloqCarpetProducts(),
      ...getAllCarpetProducts(),
      ...getAllDekingProducts(),
      ...getAllLVTProducts(),
      ...getAllTarkettLVTProducts(),
      ...getEsdCollectionProducts(),
      ...getGerflorLVTCollections(),
      ...getGerflorLinoleumCollections(),
      ...getTarkettLVTCollections(),
      ...getTarkettHomogeneousVinylCollections(),
      ...getTarkettSportCollections(),
      ...getTarkettVinylHomeCollections(),
      ...getVinylCollectionProducts(),
      ...getManualCollectionProducts(),
    ].map((product) => product.slug)
  );

  const mockCoverage = {
    total: mockProducts.length,
    coveredByCanonicalSources: mockProducts.filter((product) => canonicalFallbackSlugs.has(product.slug)).length,
    missingFromCanonicalSources: mockProducts.filter((product) => !canonicalFallbackSlugs.has(product.slug)).map((product) => ({
      slug: product.slug,
      name: product.name,
      categoryId: product.categoryId,
      brandId: product.brandId,
    })),
  };

  const productFindings = collectionSources
    .flatMap(({ name, products }) => products.map((product) => ({ source: name, product })))
    .filter(({ source, product }) => source !== 'mock-products' || !canonicalFallbackSlugs.has(product.slug))
    .flatMap(({ source, product }) => auditCollectionProduct(source, product))
    .sort((left, right) => {
      const severityOrder: Record<Severity, number> = { high: 0, medium: 1, low: 2 };
      const severityDiff = severityOrder[left.severity] - severityOrder[right.severity];
      if (severityDiff !== 0) return severityDiff;
      return left.slug.localeCompare(right.slug, 'sr');
    });

  const actionableProductFindings = productFindings.filter((finding) => finding.source !== 'mock-products');
  const legacyProductFindings = productFindings.filter((finding) => finding.source === 'mock-products');

  const duplicateHeroImages = collectionSources
    .flatMap(({ name, products }) =>
      products
        .map((product) => ({
          source: name,
          slug: product.slug,
          name: product.name,
          image: primaryImageUrl(product),
        }))
        .filter((entry) => entry.image)
    )
    .reduce((accumulator, entry) => {
      if (!accumulator.has(entry.image)) {
        accumulator.set(entry.image, []);
      }
      accumulator.get(entry.image)!.push(entry);
      return accumulator;
    }, new Map<string, Array<{ source: string; slug: string; name: string; image: string }>>());

  const duplicateHeroSummary = Array.from(duplicateHeroImages.entries())
    .filter(([, entries]) => entries.length > 1)
    .map(([image, entries]) => ({ image, entries }))
    .sort((left, right) => right.entries.length - left.entries.length);

  const datasetSummaries: DatasetSummary[] = [
    summarizeProductArray('mock-products', mockProducts),
    summarizeProductArray('manual-collections', getManualCollectionProducts()),
    summarizeProductArray('tarkett-parket-laminat', enrichedTarkettWoodProducts),
    summarizeProductArray('tarkett-lvt-collections', getTarkettLVTCollections()),
    summarizeProductArray('tarkett-vinyl-homogeneous-collections', getTarkettHomogeneousVinylCollections()),
    summarizeProductArray('tarkett-vinyl-home-collections', getTarkettVinylHomeCollections()),
    summarizeProductArray('tarkett-sport-collections', getTarkettSportCollections()),
    summarizeProductArray('gerflor-vinyl-collections', getVinylCollectionProducts()),
    summarizeProductArray('gerflor-esd-collections', getEsdCollectionProducts()),
    summarizeProductArray('gerflor-lvt-collections', getGerflorLVTCollections()),
    summarizeProductArray('gerflor-linoleum-collections', getGerflorLinoleumCollections()),
    summarizeProductArray('bloq-collections', getAllBloqCarpetProducts()),
    summarizeProductArray('timbertech-deking', getAllDekingProducts()),
    summarizeNestedDataset('vinyl-special-json', ((vinylSpecialColorsData as any).collections || []) as any[]),
    summarizeNestedDataset('industrial-json', ((industrialColorsData as any).collections || []) as any[]),
    summarizeNestedDataset('sport-json', ((sportColorsData as any).collections || []) as any[]),
    summarizeNestedDataset('tarkett-vinyl-homogeneous-json', ((tarkettHomogeneousVinylData as any).collections || []) as any[], { requireDocuments: true }),
    summarizeNestedDataset('tarkett-vinyl-home-json', ((tarkettVinylHomeData as any).collections || []) as any[], { requireDocuments: true }),
    summarizeNestedDataset('tarkett-sport-json', ((tarkettSportData as any).collections || []) as any[], { requireDocuments: true }),
    summarizeNestedDataset('vinyl-json', ((vinylColorsData as any).collections || []) as any[]),
    summarizeNestedDataset('esd-json', ((esdColorsData as any).collections || []) as any[]),
    summarizeFlatColorDataset('lvt-colors-json', ((lvtColorsData as any).colors || []) as any[]),
    summarizeProductArray('gerflor-lvt-variants', getAllLVTProducts()),
    summarizeFlatColorDataset('linoleum-colors-json', ((linoleumColorsData as any).colors || []) as any[]),
    summarizeFlatColorDataset('carpet-colors-json', ((carpetColorsData as any).colors || []) as any[]),
    summarizeFlatColorDataset('bloq-colors-json', ((bloqCarpetData as any).colors || []) as any[]),
    summarizeFlatColorDataset('tarkett-lvt-products-json', ((tarkettLvtData as any) || []) as any[]),
    summarizeProductArray('tarkett-lvt-variants', getAllTarkettLVTProducts()),
    summarizeProductArray('gerflor-carpet-colors', getAllCarpetProducts()),
  ];

  const supabaseSummary = await getSupabaseSummary();

  const report = {
    generatedAt: new Date().toISOString(),
    productFindingsCount: productFindings.length,
    actionableProductFindingsCount: actionableProductFindings.length,
    legacyProductFindingsCount: legacyProductFindings.length,
    highSeverityCount: productFindings.filter((finding) => finding.severity === 'high').length,
    mediumSeverityCount: productFindings.filter((finding) => finding.severity === 'medium').length,
    lowSeverityCount: productFindings.filter((finding) => finding.severity === 'low').length,
    actionableHighSeverityCount: actionableProductFindings.filter((finding) => finding.severity === 'high').length,
    actionableMediumSeverityCount: actionableProductFindings.filter((finding) => finding.severity === 'medium').length,
    actionableLowSeverityCount: actionableProductFindings.filter((finding) => finding.severity === 'low').length,
    datasetSummaries,
    productFindings,
    duplicateHeroSummary,
    mockCoverage,
    supabaseSummary,
  };

  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  await fs.writeFile(OUTPUT_PATH, JSON.stringify(report, null, 2), 'utf8');

  console.log(`Audit snimljen u ${OUTPUT_PATH}`);
  console.log(`Findings: high=${report.highSeverityCount}, medium=${report.mediumSeverityCount}, low=${report.lowSeverityCount}`);
  console.log(
    `Actionable: high=${report.actionableHighSeverityCount}, medium=${report.actionableMediumSeverityCount}, low=${report.actionableLowSeverityCount}`
  );

  const topFindings = productFindings.slice(0, 20);
  if (topFindings.length > 0) {
    console.log('\nTop findings:');
    for (const finding of topFindings) {
      console.log(
        `- [${finding.severity}] ${finding.source} :: ${finding.slug} :: ${finding.issue} :: ${finding.detail}`
      );
    }
  }

  if (duplicateHeroSummary.length > 0) {
    console.log('\nDuplicate hero images:');
    for (const duplicate of duplicateHeroSummary.slice(0, 15)) {
      console.log(`- ${duplicate.image}`);
      for (const entry of duplicate.entries) {
        console.log(`  -> ${entry.source} :: ${entry.slug}`);
      }
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
