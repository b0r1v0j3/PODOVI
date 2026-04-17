function normalizeCatalogAssetCandidate(asset: string | null | undefined) {
  return String(asset || '').trim();
}

export function isPlaceholderCatalogAsset(asset: string | null | undefined) {
  const normalizedAsset = normalizeCatalogAssetCandidate(asset);
  if (!normalizedAsset) {
    return false;
  }

  return normalizedAsset.includes('/images/placeholder.svg');
}

export function selectPreferredCollectionHeroAsset(
  ...candidates: Array<string | null | undefined>
) {
  const normalizedCandidates = candidates
    .map(normalizeCatalogAssetCandidate)
    .filter(Boolean);

  return normalizedCandidates.find((candidate) => !isPlaceholderCatalogAsset(candidate))
    || normalizedCandidates[0]
    || '';
}

export function selectPreferredCatalogAsset(
  curatedAsset: string | null | undefined,
  databaseAsset: string | null | undefined
) {
  return selectPreferredCollectionHeroAsset(curatedAsset, databaseAsset);
}
