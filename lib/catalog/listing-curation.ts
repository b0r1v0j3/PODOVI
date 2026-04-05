const HIDDEN_COLLECTION_SLUGS_BY_CATEGORY: Record<string, readonly string[]> = {
  lajsne: [
    'tarkett-tarkett-genius-traka',
    'tarkett-tarkodry-podloga-za-podove-i-zidove',
  ],
};

export function isCollectionHiddenFromCategoryListing(
  categorySlug: string,
  collectionSlug?: string | null
): boolean {
  if (!collectionSlug) {
    return false;
  }

  const hiddenSlugs = HIDDEN_COLLECTION_SLUGS_BY_CATEGORY[categorySlug];
  return Array.isArray(hiddenSlugs) ? hiddenSlugs.includes(collectionSlug) : false;
}

export function filterCategoryListingCollections<T extends { slug?: string | null }>(
  categorySlug: string,
  collections: T[]
): T[] {
  return collections.filter((collection) =>
    !isCollectionHiddenFromCategoryListing(categorySlug, collection.slug)
  );
}
