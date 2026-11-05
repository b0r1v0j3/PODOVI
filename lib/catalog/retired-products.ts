import { isRetiredBloqProduct, isRetiredBloqReference } from './retired-bloq';

// Former catalog identities outside the supplier assortment; price expiry does not retire products.
export const RETIRED_SCHONOX_SLUGS = [
  'schonox-1k-ds-premium',
  'schonox-2k-ds-rapid',
  'schonox-2k-pu-solid',
  'schonox-a1',
  'schonox-a4',
  'schonox-a6',
  'schonox-apf',
  'schonox-armierungsgewebe',
  'schonox-bm-10',
  'schonox-bm-30-flex',
  'schonox-bm-30-light',
  'schonox-cf-design',
  'schonox-cls',
  'schonox-con-boden',
  'schonox-d-8-15-21-35-65',
  'schonox-ea-pur',
  'schonox-ea-pur-s',
  'schonox-ec',
  'schonox-ep-drain',
  'schonox-epoxy-toolbox',
  'schonox-es',
  'schonox-fc',
  'schonox-fg',
  'schonox-fix-clean',
  'schonox-fpl-plus',
  'schonox-fs',
  'schonox-fugenbreit',
  'schonox-gea',
  'schonox-ha-pro',
  'schonox-ha-pro-ii',
  'schonox-hs-40-s',
  'schonox-hs-8',
  'schonox-hx-30',
  'schonox-hx-5',
  'schonox-ic',
  'schonox-ifloor',
  'schonox-iline-260',
  'schonox-iline-400',
  'schonox-iline-ak',
  'schonox-iline-app',
  'schonox-kr',
  'schonox-leichtestrich-system',
  'schonox-lk',
  'schonox-mde-0-9',
  'schonox-mde-sf-i',
  'schonox-mes',
  'schonox-mes-plus',
  'schonox-mfc',
  'schonox-mse',
  'schonox-multi-floor',
  'schonox-nivellier-randstreifen',
  'schonox-parkett-410',
  'schonox-parkett-52',
  'schonox-parkett-54',
  'schonox-parkett-610',
  'schonox-pgh',
  'schonox-pl',
  'schonox-pl-plus',
  'schonox-pp',
  'schonox-protect',
  'schonox-pu-960-parkett',
  'schonox-pzg',
  'schonox-q12',
  'schonox-q2',
  'schonox-q20-hybrid',
  'schonox-q30',
  'schonox-q4-rapid',
  'schonox-q6',
  'schonox-q6-w',
  'schonox-q8',
  'schonox-q9-w',
  'schonox-quarzsand',
  'schonox-rdf',
  'schonox-renotex-3d',
  'schonox-rf',
  'schonox-rr',
  'schonox-rs-50',
  'schonox-sb-flex',
  'schonox-sb-set',
  'schonox-sc-l-20-l28-r-20-r-28',
  'schonox-sez-plus',
  'schonox-sf-design',
  'schonox-sfk',
  'schonox-sgh',
  'schonox-slk',
  'schonox-spf',
  'schonox-st-25-50',
  'schonox-st-protect',
  'schonox-su',
  'schonox-tackifier',
  'schonox-tex-xtreme',
  'schonox-ts',
  'schonox-tsd',
  'schonox-tt-s8',
  'schonox-tx',
  'schonox-uniplan',
  'schonox-us',
  'schonox-vd',
  'schonox-wd-flex',
  'schonox-xa',
  'schonox-xp-15',
  'schonox-xr-40',
  'schonox-zm-rapid',
  'schonox-zx',
  'schonox-zz',
] as const;

const retiredSchonoxIds = new Set<string>(RETIRED_SCHONOX_SLUGS);

export function isRetiredProductReference(value: unknown): boolean {
  if (isRetiredBloqReference(value)) return true;
  if (typeof value !== 'string' || !value.trim()) return false;
  const reference = value.trim();
  if (retiredSchonoxIds.has(reference)) return true;
  try {
    const url = new URL(reference, 'https://www.podovi.online');
    const slug = decodeURIComponent(url.pathname).split('/').filter(Boolean).pop() || '';
    return retiredSchonoxIds.has(slug)
      || retiredSchonoxIds.has(url.searchParams.get('product') || '')
      || retiredSchonoxIds.has(url.searchParams.get('color') || '');
  } catch {
    return false;
  }
}

export function isRetiredProduct(product: Parameters<typeof isRetiredBloqProduct>[0]): boolean {
  return isRetiredBloqProduct(product)
    || [product?.id, product?.slug, product?.collectionSlug, product?.url].some(isRetiredProductReference);
}
