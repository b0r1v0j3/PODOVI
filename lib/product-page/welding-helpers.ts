import type { ProductSpec } from '@/types';
import weldingAccessoriesData from '@/public/data/welding_accessories.json';

type WeldingAccessoryRecord = {
  slug: string;
  displayName: string;
  aliases?: string[];
  brand: string;
  type: string;
  referenceCode?: string;
  diameter?: string;
  packaging?: string;
  descriptionSr?: string;
  officialUrl?: string;
  sourceNoteSr?: string;
};

type WeldingContext = {
  categoryId?: string;
  brandId?: string;
  collectionSlug?: string;
  collectionName?: string;
  characteristics?: Record<string, string | undefined> | null;
  exactWeldingRod?: string | null;
};

type WeldingSelection = {
  primary?: string;
  secondary?: string;
  note?: string;
};

const weldingAccessories = ((weldingAccessoriesData as { systems?: WeldingAccessoryRecord[] }).systems || []) as WeldingAccessoryRecord[];

const gerflorCr40Collections = new Set([
  'mipolam-astro',
  'mipolam-bioplanet',
  'mipolam-classic-1-5mm',
  'mipolam-classic-2mm',
  'mipolam-elegance',
  'mipolam-evo',
  'mipolam-planet',
  'mipolam-troplan',
  'nerok-55',
  'nerok-70',
  'premium-acoustic',
  'premium-compact',
  'taralay-impression-acoustic',
  'taralay-impression-compact',
  'taralay-impression-hop-acoustic',
  'taralay-impression-hop-compact',
  'taralay-initial-acoustic',
  'taralay-initial-compact',
  'taralay-libertex',
  'taralay-millenium-acoustic',
  'taralay-millenium-compact',
  'mipolam-biocontrol-clean',
  'mipolam-biocontrol-performance',
  'mipolam-el5',
  'mipolam-biocontrol-el5',
  'mipolam-technic-el5-eu',
  'mipolam-robust-el7',
  'mipolam-el7',
]);

const gerflorAccordAffinityCollections = new Set([
  'mipolam-accord',
  'mipolam-affinity',
  'mipolam-affinity-608x608',
]);

const normalizeText = (value?: string | null) =>
  String(value || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

function getCharacteristic(
  characteristics: Record<string, string | undefined> | null | undefined,
  keys: string[]
): string {
  if (!characteristics) {
    return '';
  }

  for (const key of keys) {
    const exact = characteristics[key];
    if (exact) {
      return exact;
    }
  }

  const normalizedEntries = Object.entries(characteristics).map(([key, value]) => ({
    key,
    normalizedKey: normalizeText(key),
    value: value || '',
  }));

  for (const wantedKey of keys) {
    const normalizedWantedKey = normalizeText(wantedKey);
    const match = normalizedEntries.find((entry) => entry.normalizedKey === normalizedWantedKey);
    if (match?.value) {
      return match.value;
    }
  }

  return '';
}

function includesAny(value: string, terms: string[]) {
  const normalizedValue = normalizeText(value);
  return terms.some((term) => normalizedValue.includes(normalizeText(term)));
}

function isGluedInstallation(value: string) {
  return includesAny(value, ['lepljenje', 'glued']);
}

function isFloatingOrLooseLay(value: string) {
  return includesAny(value, ['plivajuca', 'floating', 'loose lay', 'looselay', 'interlocking', 'bez lepka']);
}

function isLinoleumMaterial(value: string) {
  return includesAny(value, ['linoleum']);
}

function isVinylMaterial(value: string) {
  return includesAny(value, ['vinyl', 'vinil', 'homogeni', 'heterogeni', 'pvc']);
}

function isRollOrTileFormat(value: string) {
  return includesAny(value, ['rolna', 'roll', 'ploca', 'ploča', 'tile']);
}

function isProtectionOrWood(value: string) {
  return includesAny(value, ['hard flooring', 'multilayer wood', 'protections', 'overlayers']);
}

function findAccessoryBySlug(slug: string) {
  return weldingAccessories.find((item) => item.slug === slug) || null;
}

function findAccessoryByValue(value: string) {
  const normalizedValue = normalizeText(value);
  return (
    weldingAccessories.find((item) => {
      if (item.slug === value) {
        return true;
      }
      if (normalizeText(item.displayName) === normalizedValue) {
        return true;
      }
      return (item.aliases || []).some((alias) => normalizeText(alias) === normalizedValue);
    }) || null
  );
}

function getGerflorSelection(context: WeldingContext): WeldingSelection | null {
  const slug = context.collectionSlug || '';
  const characteristics = context.characteristics || {};
  const installation = getCharacteristic(characteristics, ['Tip instalacije', 'Način ugradnje']);
  const format = getCharacteristic(characteristics, ['Format', 'Tip formata']);
  const type = getCharacteristic(characteristics, ['Tip', 'Materijal', 'Tip proizvoda (ISO)', 'Tip proizvoda']);

  if (context.categoryId === '10') {
    if (isLinoleumMaterial(type) || includesAny(context.collectionName || '', ['linosport', 'colorette sport', 'marmorette sport', 'linodur sport'])) {
      return { primary: 'Gerflor linoleum 4 mm (prema dekoru)' };
    }
    if (isGluedInstallation(installation) && isRollOrTileFormat(format)) {
      return { primary: 'Gerflor CR50' };
    }
    return null;
  }

  if (context.categoryId === '9') {
    if (slug === 'gti-max-cleantech') {
      return { note: 'Gerflor CR40 ili CR50 (po detalju projekta)' };
    }
    return null;
  }

  if (context.categoryId === '8') {
    if (slug === 'gti-el5-cleantech') {
      return { note: 'Gerflor CR40 ili CR50 (po detalju projekta)' };
    }
    if (isFloatingOrLooseLay(installation)) {
      return null;
    }
    if (isGluedInstallation(installation)) {
      return { primary: 'Gerflor CR40' };
    }
    return null;
  }

  if (context.categoryId === '2') {
    if (gerflorAccordAffinityCollections.has(slug)) {
      return {
        primary: 'Gerflor CR40',
        secondary: 'Gerflor MCR40',
      };
    }
    if (slug === 'mipolam-symbioz') {
      return { primary: 'Gerflor BBR40' };
    }
    if (gerflorCr40Collections.has(slug)) {
      return { primary: 'Gerflor CR40' };
    }
  }

  return null;
}

function getTarkettSelection(context: WeldingContext): WeldingSelection | null {
  const characteristics = context.characteristics || {};
  const installation = getCharacteristic(characteristics, ['Način ugradnje', 'Tip instalacije']);
  const format = getCharacteristic(characteristics, ['Format', 'Tip formata']);
  const material = getCharacteristic(characteristics, ['Materijal', 'Tip', 'Tip proizvoda (ISO)', 'Tip proizvoda']);

  if (!isGluedInstallation(installation) || isFloatingOrLooseLay(installation)) {
    return null;
  }

  if (context.categoryId === '10') {
    if (isProtectionOrWood(material)) {
      return null;
    }
    if (isLinoleumMaterial(material) || includesAny(context.collectionName || '', ['linosport'])) {
      return { primary: 'Tarkett elektrode za varenje - linoleum' };
    }
    if (
      (isVinylMaterial(material) || includesAny(context.collectionName || '', ['omnisports', 'dancefloor', 'table tennis'])) &&
      isRollOrTileFormat(format)
    ) {
      return { primary: 'Tarkett elektrode za varenje - vinil podovi' };
    }
    return null;
  }

  if (context.categoryId === '2') {
    if (isVinylMaterial(material) && isRollOrTileFormat(format)) {
      return { primary: 'Tarkett elektrode za varenje - vinil podovi' };
    }
  }

  return null;
}

export function getDerivedWeldingSpecs(context: WeldingContext): ProductSpec[] {
  const specs: ProductSpec[] = [];
  const exactWeldingRod = String(context.exactWeldingRod || '').trim();

  if (exactWeldingRod) {
    specs.push({
      key: 'welding_rod',
      label: 'Elektroda za varenje',
      value: exactWeldingRod,
    });
    return specs;
  }

  let selection: WeldingSelection | null = null;

  if (context.brandId === '6') {
    selection = getGerflorSelection(context);
  } else if (context.brandId === '3') {
    selection = getTarkettSelection(context);
  }

  if (!selection) {
    return specs;
  }

  if (selection.primary) {
    specs.push({
      key: 'compatible_welding_accessory',
      label: 'Kompatibilna varilačka vrpca',
      value: selection.primary,
    });
  }

  if (selection.secondary) {
    specs.push({
      key: 'alternative_welding_accessory',
      label: 'Alternativna varilačka vrpca',
      value: selection.secondary,
    });
  }

  if (selection.note) {
    specs.push({
      key: 'welding_system_note',
      label: 'Sistem varenja',
      value: selection.note,
    });
  }

  return specs;
}

export function getDerivedWeldingCharacteristics(context: WeldingContext): Record<string, string> {
  const specs = getDerivedWeldingSpecs(context);
  return specs.reduce<Record<string, string>>((acc, spec) => {
    acc[spec.label] = spec.value;
    return acc;
  }, {});
}

export function getWeldingAccessoryHref(value?: string | null): string | null {
  const trimmedValue = String(value || '').trim();
  if (!trimmedValue) {
    return null;
  }

  if (/^R\d{7}$/i.test(trimmedValue)) {
    return `/proizvodi/welding-rod/${trimmedValue}`;
  }

  const accessory = findAccessoryByValue(trimmedValue);
  if (!accessory) {
    return null;
  }

  return `/proizvodi/welding-rod/${accessory.slug}`;
}

export function getWeldingAccessoryByRef(ref: string) {
  const accessory =
    findAccessoryBySlug(ref) ||
    findAccessoryByValue(ref);

  if (!accessory) {
    return null;
  }

  return accessory;
}

export function getWeldingAccessorySpecs(ref: string): ProductSpec[] {
  const accessory = getWeldingAccessoryByRef(ref);
  if (!accessory) {
    return [];
  }

  const specs: ProductSpec[] = [
    {
      key: 'brand',
      label: 'Brend',
      value: accessory.brand,
    },
    {
      key: 'type',
      label: 'Tip',
      value: accessory.type,
    },
  ];

  if (accessory.referenceCode) {
    specs.push({
      key: 'reference_code',
      label: 'Referenca',
      value: accessory.referenceCode,
    });
  }
  if (accessory.diameter) {
    specs.push({
      key: 'diameter',
      label: 'Prečnik',
      value: accessory.diameter,
    });
  }
  if (accessory.packaging) {
    specs.push({
      key: 'packaging',
      label: 'Pakovanje',
      value: accessory.packaging,
    });
  }

  return specs;
}

export function getWeldingAccessoryDescription(ref: string) {
  const accessory = getWeldingAccessoryByRef(ref);
  return accessory?.descriptionSr || '';
}

export function getWeldingAccessorySource(ref: string) {
  const accessory = getWeldingAccessoryByRef(ref);
  if (!accessory) {
    return null;
  }

  return {
    officialUrl: accessory.officialUrl || '',
    sourceNoteSr: accessory.sourceNoteSr || '',
    displayName: accessory.displayName,
  };
}
