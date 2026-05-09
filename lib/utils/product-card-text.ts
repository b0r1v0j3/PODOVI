type CleanShortDescriptionOptions = {
  productName: string;
  displayName: string;
  splitColor: string;
  splitCollection?: string | null;
  brandName?: string | null;
};

const REDUNDANT_CATEGORY_PHRASES = [
  'Laminat',
  'LVT',
  'LVT podna obloga',
  'Parket',
  'Linoleum',
  'Vinil',
  'Profesionalni vinil',
  'Tekstilne ploče',
  'Tekstilne podne ploče',
  'Deking',
  'Elektroprovodni',
  'Elektroprovodni pod',
  'Industrijske ploče',
  'Sportski pod',
  'Sport',
  'Lajsne',
  'Lajsne i prateći pribor',
  'Otirači',
  'Podna obloga',
];

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeForCompare(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[.,;:!?()[\]{}]/g, ' ')
    .replace(/[-–—_/]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function stripLeadingPhrase(value: string, phrase: string): string {
  return value
    .replace(new RegExp(`^\\s*${escapeRegExp(phrase)}\\s*(?:[-–—:,./]+\\s*)?`, 'i'), '')
    .trim();
}

function stripTrailingPhrase(value: string, phrase: string): string {
  return value
    .replace(new RegExp(`(?:\\s*[-–—:,./]+)?\\s*${escapeRegExp(phrase)}\\s*\\.?$`, 'i'), '')
    .trim();
}

export function getProductCardDisplayName(productName: string, brandName?: string | null): string {
  const trimmedName = String(productName || '').trim();
  const trimmedBrand = String(brandName || '').trim();

  if (!trimmedName || !trimmedBrand) {
    return trimmedName;
  }

  const withoutBrand = stripLeadingPhrase(trimmedName, trimmedBrand);

  return withoutBrand || trimmedName;
}

export function areProductCardTextsEqual(first?: string | null, second?: string | null): boolean {
  if (!first || !second) {
    return false;
  }

  return normalizeForCompare(first) === normalizeForCompare(second);
}

export function cleanProductCardShortDescription(
  shortDescription: string | undefined,
  options: CleanShortDescriptionOptions
): string | null {
  if (!shortDescription || shortDescription.trim().length <= 5) {
    return null;
  }

  let cleaned = shortDescription.trim();
  const comparisonTargets = [
    options.productName,
    options.displayName,
    options.splitColor,
    options.splitCollection || '',
  ].filter(Boolean);

  if (options.brandName) {
    cleaned = stripLeadingPhrase(cleaned, options.brandName);
  }

  for (const phrase of REDUNDANT_CATEGORY_PHRASES) {
    cleaned = stripLeadingPhrase(cleaned, phrase);
    cleaned = stripTrailingPhrase(cleaned, phrase);
  }

  cleaned = cleaned
    .replace(/^\s*[-–—:,./]+\s*/, '')
    .replace(/\s*[-–—:,/]+\s*$/, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleaned || cleaned.length <= 5) {
    return null;
  }

  const normalizedCleaned = normalizeForCompare(cleaned);
  const isOnlyRepeatedName = comparisonTargets.some((target) =>
    normalizedCleaned === normalizeForCompare(target)
  );

  return isOnlyRepeatedName ? null : cleaned;
}
