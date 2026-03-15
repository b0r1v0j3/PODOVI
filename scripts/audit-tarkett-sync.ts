import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

import { tarkettProducts } from '../lib/data/tarkett-products';
import { getEffectiveParketCollection, getParketCollectionSlug } from '../lib/data/parket-collection-mapping';
import tarkettDocumentsIndex from '../public/data/tarkett_documents_index.json';
import { getServerSupabase, getSupabaseOrNull, hasSupabaseAnonConfig, hasSupabaseServiceRoleConfig } from '../lib/supabase/client';
import { mapCategoryIdToUUID } from '../lib/repositories/id-mapping';

type CategoryConfig = {
  key: 'parket' | 'laminat';
  categoryId: '1' | '3';
  url: string;
};

type OfficialCollection = {
  name: string;
  slug: string;
  url: string;
  designCount: number;
  designSlugs: string[];
  shortDescription: string;
  description: string;
  documents: Array<{ title: string; url: string }>;
  keyFeatures: string[];
};

type TarkettDocumentsIndex = Record<string, Record<string, Array<{ title: string; url: string }>>>;

const CATEGORY_CONFIGS: CategoryConfig[] = [
  {
    key: 'parket',
    categoryId: '3',
    url: 'https://www.tarkett.rs/sr_RS/kategorija-rs_C01012-parket',
  },
  {
    key: 'laminat',
    categoryId: '1',
    url: 'https://www.tarkett.rs/sr_RS/kategorija-rs_C01044-laminat',
  },
];

function stripHtml(raw: string | null | undefined): string {
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

function cleanListItems(html: string | null | undefined): string[] {
  return Array.from(String(html || '').matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi))
    .map((match) => stripHtml(match[1]))
    .filter(Boolean);
}

function collectionUrlToSlug(urlPath: string): string {
  return String(urlPath)
    .replace(/^.*\/kolekcija-[^-]+-/, '')
    .replace(/^\/+/, '')
    .trim();
}

function buildMediaUrl(mediaBaseUri: string | undefined, assetPath: string | undefined): string {
  if (!assetPath) return '';
  const normalizedBase = (mediaBaseUri || 'https://media.tarkett-image.com').replace(/\/+$/, '');
  return `${normalizedBase}/large/${assetPath}`;
}

function slugifyCollectionName(name: string): string {
  return stripHtml(name)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function dedupeDocuments(documents: Array<{ title: string; url: string }>) {
  const seen = new Set<string>();
  return documents.filter((document) => {
    if (!document.url || seen.has(document.url)) return false;
    seen.add(document.url);
    return true;
  });
}

function getDocumentIdentity(url: string): string {
  const normalized = String(url || '').split('?')[0];
  const fileName = normalized.split('/').pop() || normalized;
  return decodeURIComponent(fileName).trim().toLowerCase();
}

function getLocalCollectionName(product: any, categoryKey: CategoryConfig['key']): string {
  const collectionSpec = product.specs?.find((spec: any) => spec.key === 'collection')?.value;

  if (categoryKey === 'parket') {
    return getEffectiveParketCollection(product.slug, collectionSpec);
  }

  return collectionSpec || '';
}

function getLocalCollectionSlug(product: any, categoryKey: CategoryConfig['key']): string {
  if (product.sku?.startsWith('LAM-') || product.sku?.startsWith('PARKET-')) {
    return product.slug;
  }

  const collectionName = getLocalCollectionName(product, categoryKey);
  if (categoryKey === 'parket') {
    return getParketCollectionSlug(collectionName) || slugifyCollectionName(collectionName);
  }

  return slugifyCollectionName(collectionName);
}

function normalizeComparableVariantSlug(
  variantSlug: string,
  categoryKey: CategoryConfig['key'],
  collectionSlug: string
): string {
  const normalizedSlug = String(variantSlug || '').trim();
  if (!normalizedSlug) return normalizedSlug;

  if (categoryKey !== 'parket') {
    return normalizedSlug;
  }

  const parketAliases: Record<string, Record<string, string>> = {
    rumba: {
      'rumba-hrast-copper-1-strip': 'hrast-copper-1-strip',
      'rumba-hrast-premium-1-strip': 'hrast-premium-1-strip',
    },
    tango: {
      'tango-hrast-copper-1-strip': 'hrast-copper-1-strip',
      'tango-hrast-premium-1-strip': 'hrast-premium-1-strip',
    },
  };

  return parketAliases[collectionSlug]?.[normalizedSlug] ?? normalizedSlug;
}

async function getCollectionLinks(page: any, categoryUrl: string): Promise<string[]> {
  await page.goto(categoryUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(2500);

  const links = await page
    .locator('a[href*="/sr_RS/kolekcija-"]')
    .evaluateAll((nodes: Element[]) =>
      nodes
        .map((node) => node.getAttribute('href'))
        .filter((href): href is string => Boolean(href))
    );

  const bySlug = new Map<string, string>();
  for (const link of links as string[]) {
    const slug = collectionUrlToSlug(link);
    if (slug && !bySlug.has(slug)) {
      bySlug.set(slug, link);
    }
  }

  return Array.from(bySlug.values());
}

async function fetchOfficialCollection(page: any, link: string): Promise<OfficialCollection> {
  const url = /^https?:\/\//i.test(link) ? link : `https://www.tarkett.rs${link}`;
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(1000);
  const nuxt = await page.evaluate(() => (window as any).__NUXT__);
  const item = nuxt?.state?.collectionProductPage?.item;
  if (!item) {
    throw new Error(`Collection payload missing for ${url}`);
  }

  const mediaBaseUri = nuxt?.state?.mediaBaseUri || 'https://media.tarkett-image.com';
  const documents = dedupeDocuments(
    (item.collection_assets || [])
      .filter((asset: any) => asset.document_mime_type === 'pdf' && asset.document_asset_url)
      .map((asset: any) => ({
        title: stripHtml(asset.document_title || asset.document_label || asset.document_role || 'Dokument'),
        url: buildMediaUrl(mediaBaseUri, asset.document_asset_url),
      }))
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
    designCount: Array.isArray(item.designs) ? item.designs.length : 0,
    designSlugs: Array.from(
      new Set(
        (Array.isArray(item.designs) ? item.designs : [])
          .map((design: any) => String(design?.product_name_slug || '').trim())
          .filter(Boolean)
      )
    ),
    shortDescription,
    description,
    documents,
    keyFeatures: cleanListItems(item.key_features),
  };
}

async function getSupabaseSummary(categoryId: string, categoryKey: CategoryConfig['key']) {
  if (!hasSupabaseAnonConfig()) {
    return {
      available: false,
      reason: 'NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY nisu dostupni u ovom okruženju.',
    };
  }

  const client = hasSupabaseServiceRoleConfig() ? getServerSupabase() : getSupabaseOrNull();
  if (!client) {
    return {
      available: false,
      reason: 'Supabase klijent nije dostupan.',
    };
  }

  const mappedCategoryId = mapCategoryIdToUUID(categoryId);
  const { data, error } = await client
    .from('products')
    .select('slug, sku, short_description, description, documents, product_specs(key, label, value)')
    .eq('category_id', mappedCategoryId);

  if (error) {
    return {
      available: false,
      reason: error.message,
    };
  }

  const rows = (data || []) as Array<any>;
  const headers = rows.filter((row) => row.sku?.startsWith(categoryId === '3' ? 'PARKET-' : 'LAM-'));
  const variants = rows.filter((row) => !row.sku?.startsWith(categoryId === '3' ? 'PARKET-' : 'LAM-'));

  const countsByCollectionSlug = new Map<string, number>();
  for (const variant of variants) {
    const collectionName = categoryKey === 'parket'
      ? getEffectiveParketCollection(variant.slug, variant.product_specs?.find((spec: any) => spec.key === 'collection')?.value)
      : variant.product_specs?.find((spec: any) => spec.key === 'collection')?.value;

    const collectionSlug = categoryKey === 'parket'
      ? (getParketCollectionSlug(collectionName) || slugifyCollectionName(collectionName))
      : slugifyCollectionName(collectionName);

    countsByCollectionSlug.set(collectionSlug, (countsByCollectionSlug.get(collectionSlug) || 0) + 1);
  }

  return {
    available: true,
    totalRows: rows.length,
    headerCount: headers.length,
    variantCount: variants.length,
    countsByCollectionSlug: Object.fromEntries(Array.from(countsByCollectionSlug.entries()).sort(([a], [b]) => a.localeCompare(b))),
  };
}

async function auditCategory(config: CategoryConfig, documentsIndex: TarkettDocumentsIndex) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    const officialLinks = await getCollectionLinks(page, config.url);
    const officialCollections = [];

    for (const link of officialLinks) {
      officialCollections.push(await fetchOfficialCollection(page, link));
    }

    const localProducts = tarkettProducts.filter((product) => product.categoryId === config.categoryId);
    const localHeaders = localProducts.filter((product) => product.sku?.startsWith(config.categoryId === '3' ? 'PARKET-' : 'LAM-'));
    const localVariants = localProducts.filter((product) => !product.sku?.startsWith(config.categoryId === '3' ? 'PARKET-' : 'LAM-'));

    const localHeadersBySlug = new Map(localHeaders.map((product) => [product.slug, product]));
    const localVariantSlugsByCollection = new Map<string, string[]>();
    const genericCollectionProducts: string[] = [];

    for (const variant of localVariants) {
      const collectionName = getLocalCollectionName(variant, config.key);
      const collectionSlug = getLocalCollectionSlug(variant, config.key);
      const currentSlugs = localVariantSlugsByCollection.get(collectionSlug) || [];
      currentSlugs.push(String(variant.slug || '').trim());
      localVariantSlugsByCollection.set(collectionSlug, currentSlugs);

      if (config.key === 'parket') {
        const rawCollection = variant.specs?.find((spec: any) => spec.key === 'collection')?.value;
        if (rawCollection === 'Parket') {
          genericCollectionProducts.push(variant.slug);
        }
      }
    }

    const officialBySlug = new Map(officialCollections.map((collection) => [collection.slug, collection]));

    const missingLocalHeaders = officialCollections
      .filter((collection) => !localHeadersBySlug.has(collection.slug))
      .map((collection) => collection.slug);

    const extraLocalHeaders = localHeaders
      .filter((product) => !officialBySlug.has(product.slug))
      .map((product) => product.slug);

    const collectionComparisons = officialCollections
      .map((collection) => {
        const localHeader = localHeadersBySlug.get(collection.slug);
        const docsFromIndex = documentsIndex[config.key]?.[collection.slug] || [];
        const localDocIdentities = new Set(docsFromIndex.map((document) => getDocumentIdentity(document.url)));
        const rawLocalVariantSlugs = localVariantSlugsByCollection.get(collection.slug) || [];
        const comparableLocalVariantSlugs = rawLocalVariantSlugs.map((variantSlug) =>
          normalizeComparableVariantSlug(variantSlug, config.key, collection.slug)
        );
        const comparableLocalVariantCounts = new Map<string, number>();
        for (const variantSlug of comparableLocalVariantSlugs) {
          comparableLocalVariantCounts.set(variantSlug, (comparableLocalVariantCounts.get(variantSlug) || 0) + 1);
        }
        const uniqueComparableLocalVariantSlugs = Array.from(comparableLocalVariantCounts.keys()).sort((a, b) =>
          a.localeCompare(b)
        );
        const officialDesignSlugs = [...collection.designSlugs].sort((a, b) => a.localeCompare(b));

        return {
          slug: collection.slug,
          name: collection.name,
          officialDesignCount: collection.designCount,
          officialDocuments: collection.documents,
          officialDesignSlugs,
          localVariantCount: rawLocalVariantSlugs.length,
          localComparableVariantCount: uniqueComparableLocalVariantSlugs.length,
          rawCountsMatch: collection.designCount === rawLocalVariantSlugs.length,
          countsMatch: collection.designCount === uniqueComparableLocalVariantSlugs.length,
          hasLocalHeader: Boolean(localHeader),
          localHeaderDescriptionLength: (localHeader?.description || '').trim().length,
          officialDescriptionLength: collection.description.length,
          localDocsCount: docsFromIndex.length,
          officialDocsCount: collection.documents.length,
          missingDocumentUrls: collection.documents
            .filter((document) => !localDocIdentities.has(getDocumentIdentity(document.url)))
            .map((document) => document.url),
          localHeaderShortDescriptionLength: (localHeader?.shortDescription || '').trim().length,
          officialKeyFeaturesCount: collection.keyFeatures.length,
          localHeaderKeyFeaturesCount: localHeader?.detailsSections?.[0]?.items?.length || 0,
          missingVariantSlugs: officialDesignSlugs.filter((variantSlug) => !comparableLocalVariantCounts.has(variantSlug)),
          extraVariantSlugs: uniqueComparableLocalVariantSlugs.filter((variantSlug) => !collection.designSlugs.includes(variantSlug)),
          duplicateVariantSlugs: Array.from(comparableLocalVariantCounts.entries())
            .filter(([, count]) => count > 1)
            .map(([variantSlug]) => variantSlug)
            .sort((a, b) => a.localeCompare(b)),
        };
      })
      .sort((a, b) => a.slug.localeCompare(b.slug));

    const localHeadersMissingDescription = localHeaders
      .filter((product) => !(product.description || '').trim())
      .map((product) => product.slug);

    const localHeadersMissingDocsIndex = localHeaders
      .filter((product) => !documentsIndex[config.key]?.[product.slug]?.length)
      .map((product) => product.slug);

    const supabaseSummary = await getSupabaseSummary(config.categoryId, config.key);

    return {
      category: config.key,
      officialCategoryUrl: config.url,
      officialCollectionCount: officialCollections.length,
      officialVariantCount: officialCollections.reduce((sum, collection) => sum + collection.designCount, 0),
      localHeaderCount: localHeaders.length,
      localVariantCount: localVariants.length,
      genericCollectionProductsCount: genericCollectionProducts.length,
      genericCollectionProducts: genericCollectionProducts.slice(0, 50),
      missingLocalHeaders,
      extraLocalHeaders,
      localHeadersMissingDescription,
      localHeadersMissingDocsIndex,
      collectionComparisons,
      officialCollections: officialCollections.map((collection) => ({
        slug: collection.slug,
        name: collection.name,
        designCount: collection.designCount,
        url: collection.url,
      })),
      supabase: supabaseSummary,
    };
  } finally {
    await browser.close();
  }
}

async function main() {
  const report = {
    generatedAt: new Date().toISOString(),
    categories: {} as Record<string, any>,
  };

  const documentsIndex = tarkettDocumentsIndex as TarkettDocumentsIndex;

  for (const config of CATEGORY_CONFIGS) {
    report.categories[config.key] = await auditCategory(config, documentsIndex);
  }

  const outputDir = path.join(process.cwd(), 'output');
  await fs.mkdir(outputDir, { recursive: true });

  const outputPath = path.join(outputDir, 'tarkett-sync-report.json');
  await fs.writeFile(outputPath, JSON.stringify(report, null, 2), 'utf8');

  console.log(`Saved Tarkett sync audit to ${outputPath}`);

  for (const config of CATEGORY_CONFIGS) {
    const categoryReport = report.categories[config.key];
    console.log(
      JSON.stringify(
        {
          category: config.key,
          officialCollections: categoryReport.officialCollectionCount,
          officialVariants: categoryReport.officialVariantCount,
          localHeaders: categoryReport.localHeaderCount,
          localVariants: categoryReport.localVariantCount,
          missingHeaders: categoryReport.missingLocalHeaders,
          extraHeaders: categoryReport.extraLocalHeaders,
          genericCollectionProductsCount: categoryReport.genericCollectionProductsCount,
          supabaseAvailable: categoryReport.supabase.available,
        },
        null,
        2
      )
    );
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
