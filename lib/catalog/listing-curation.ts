import taxonomyConfig from '@/public/data/catalog_listing_taxonomy.json';

export type CategoryListingSegment = 'core' | 'accessory';
export type CategoryListingMode = CategoryListingSegment | 'all';

type CategoryTaxonomyRule = {
  accessoryCollectionSlugs?: readonly string[];
};

type ListingCollectionLike = {
  slug?: string | null;
};

type TaxonomyConfigShape = {
  defaultModeByCategory?: Record<string, CategoryListingMode>;
  categories?: Record<string, CategoryTaxonomyRule>;
};

const FALLBACK_DEFAULT_MODE: CategoryListingMode = 'core';
const parsedConfig = taxonomyConfig as TaxonomyConfigShape;
const CATEGORY_RULES = parsedConfig.categories || {};
const DEFAULT_MODE_BY_CATEGORY = parsedConfig.defaultModeByCategory || {};

function getAccessoryCollectionSlugs(categorySlug: string): readonly string[] {
  const slugs = CATEGORY_RULES[categorySlug]?.accessoryCollectionSlugs;
  return Array.isArray(slugs) ? slugs : [];
}

export function hasCategoryAccessoryListingMode(categorySlug: string): boolean {
  return Boolean(CATEGORY_RULES[categorySlug]);
}

export function getCategoryDefaultListingMode(categorySlug: string): CategoryListingMode {
  if (!hasCategoryAccessoryListingMode(categorySlug)) {
    return 'all';
  }

  const configuredDefault = DEFAULT_MODE_BY_CATEGORY[categorySlug];
  if (configuredDefault === 'all' || configuredDefault === 'core' || configuredDefault === 'accessory') {
    return configuredDefault;
  }

  return FALLBACK_DEFAULT_MODE;
}

export function resolveCategoryListingMode(
  rawMode: string | null | undefined,
  categorySlug: string
): CategoryListingMode {
  if (rawMode === 'all' || rawMode === 'core' || rawMode === 'accessory') {
    if (!hasCategoryAccessoryListingMode(categorySlug)) {
      return 'all';
    }
    return rawMode;
  }

  return getCategoryDefaultListingMode(categorySlug);
}

export function getCategoryCollectionSegment(
  categorySlug: string,
  collectionSlug?: string | null
): CategoryListingSegment {
  if (!collectionSlug) {
    return 'core';
  }

  const accessorySlugs = getAccessoryCollectionSlugs(categorySlug);
  return accessorySlugs.includes(collectionSlug) ? 'accessory' : 'core';
}

export function isCollectionHiddenFromCategoryListing(
  categorySlug: string,
  collectionSlug?: string | null
): boolean {
  return getCategoryCollectionSegment(categorySlug, collectionSlug) === 'accessory';
}

export function getCategoryListingSegmentCounts<T extends ListingCollectionLike>(
  categorySlug: string,
  collections: T[]
): Record<CategoryListingSegment, number> {
  return collections.reduce(
    (accumulator, collection) => {
      const segment = getCategoryCollectionSegment(categorySlug, collection.slug);
      accumulator[segment] += 1;
      return accumulator;
    },
    { core: 0, accessory: 0 }
  );
}

export function filterCategoryListingCollections<T extends ListingCollectionLike>(
  categorySlug: string,
  collections: T[],
  mode?: CategoryListingMode
): T[] {
  const resolvedMode = mode || getCategoryDefaultListingMode(categorySlug);

  if (resolvedMode === 'all') {
    return collections;
  }

  return collections.filter((collection) =>
    getCategoryCollectionSegment(categorySlug, collection.slug) === resolvedMode
  );
}
