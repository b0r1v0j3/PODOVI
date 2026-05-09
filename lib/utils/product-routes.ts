import { Product } from '@/types';
import {
  PARKET_HEADER_COLLECTIONS,
  getEffectiveParketCollection,
  getParketCollectionSlug,
  normalizeParketCollectionSlug,
} from '@/lib/data/parket-collection-mapping';
import { normalizeTarkettLaminateSlug } from '@/lib/data/tarkett-laminate-slug-mapping';

export type ProductWithCollectionSlug = Product & { collectionSlug?: string };

const CATEGORY_ROUTE_SLUG_MAP: Record<string, string> = {
  '1': 'laminat',
  '2': 'vinil',
  '3': 'parket',
  '4': 'tekstilne-ploce',
  '5': 'deking',
  '6': 'lvt',
  '7': 'linoleum',
  '8': 'elektroprovodni',
  '9': 'industrijske-ploce',
  '10': 'sport',
  '11': 'lajsne',
  '12': 'otiraci',
  '13': 'alat',
};

function slugifyCollectionName(value: string): string {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function hasInlineQuerySlug(slug: string): boolean {
  return slug.includes('?');
}

function getCollectionSpecValue(product: Product): string | undefined {
  return product.specs?.find((spec) => spec.key === 'collection')?.value;
}

function getCanonicalDirectColorQuerySlug(
  product: ProductWithCollectionSlug,
  routeSlug: string
): string {
  if (!['2', '10'].includes(product.categoryId) || product.brandId !== '6') {
    return routeSlug;
  }

  if (!product.collectionSlug) {
    return routeSlug;
  }

  const colorCode = String(product.sku || '').trim().toLowerCase();
  if (!colorCode || routeSlug !== colorCode) {
    return routeSlug;
  }

  const colorName = String(product.name || '')
    .trim()
    .replace(new RegExp(`^${escapeRegExp(String(product.sku || '').trim())}\\s+`, 'i'), '')
    .trim();
  const colorNameSlug = slugifyCollectionName(colorName);
  if (!colorNameSlug) {
    return routeSlug;
  }

  return `${product.collectionSlug}-${colorCode}-${colorNameSlug}`.replace(/-+/g, '-');
}

function isRouteGradeCollectionSlug(value: string): boolean {
  return (
    /^(gerflor|tarkett|wolflor|techem|bloq)-/.test(value) ||
    /^[a-z0-9-]+$/.test(value)
  );
}

function isParketCollectionHeader(product: Product): boolean {
  return (
    (product.sku?.startsWith('PARKET-') &&
      !product.sku.includes('OAK') &&
      !product.sku.includes('ASH')) ||
    (PARKET_HEADER_COLLECTIONS as readonly string[]).includes(product.name)
  );
}

function isLaminateCollectionHeader(product: Product): boolean {
  return product.sku?.startsWith('LAM-') ?? false;
}

export function getCategoryRouteSlug(categoryId?: string): string | null {
  if (!categoryId) {
    return null;
  }

  return CATEGORY_ROUTE_SLUG_MAP[categoryId] ?? null;
}

export function getCanonicalProductRouteSlug(slug: string): string {
  if (!slug || hasInlineQuerySlug(slug)) {
    return slug;
  }

  const normalizedParketSlug = normalizeParketCollectionSlug(slug);
  if (normalizedParketSlug && normalizedParketSlug !== slug) {
    return normalizedParketSlug;
  }

  const normalizedLaminateSlug = normalizeTarkettLaminateSlug(slug);
  if (normalizedLaminateSlug && normalizedLaminateSlug !== slug) {
    return normalizedLaminateSlug;
  }

  return slug;
}

export function normalizeCollectionSlugForProductRoute(
  collectionSlug: string,
  brandId?: string,
  categoryId?: string
): string {
  if (!collectionSlug || !categoryId) {
    return collectionSlug;
  }

  const hasBrandPrefix =
    collectionSlug.startsWith('gerflor-') ||
    collectionSlug.startsWith('tarkett-') ||
    collectionSlug.startsWith('wolflor-') ||
    collectionSlug.startsWith('techem-') ||
    collectionSlug.startsWith('bloq-');

  if (categoryId === '7') {
    return collectionSlug.replace(/^gerflor-/, '');
  }

  if (!['2', '4', '6', '8', '9', '10', '11', '12'].includes(categoryId)) {
    return collectionSlug;
  }

  if (hasBrandPrefix) {
    return collectionSlug;
  }

  if (brandId === '3') {
    return `tarkett-${collectionSlug}`;
  }

  if (brandId === '8') {
    return `bloq-${collectionSlug}`;
  }

  if (brandId === '11') {
    return `wolflor-${collectionSlug}`;
  }

  if (brandId === '12') {
    return `techem-${collectionSlug}`;
  }

  return `gerflor-${collectionSlug}`;
}

export function getProductCollectionRouteSlug(product: ProductWithCollectionSlug): string | null {
  if (!product.slug || hasInlineQuerySlug(product.slug)) {
    return null;
  }

  if (product.categoryId === '1') {
    if (isLaminateCollectionHeader(product)) {
      return null;
    }

    const collectionName = getCollectionSpecValue(product);
    const collectionSlug = collectionName ? slugifyCollectionName(collectionName) : '';
    return collectionSlug ? getCanonicalProductRouteSlug(collectionSlug) : null;
  }

  if (product.categoryId === '3') {
    if (isParketCollectionHeader(product)) {
      return null;
    }

    const collectionName = getEffectiveParketCollection(product.slug, getCollectionSpecValue(product));
    return collectionName ? getParketCollectionSlug(collectionName) : null;
  }

  if (!['2', '4', '6', '7', '8', '9', '10', '11'].includes(product.categoryId)) {
    return null;
  }

  const collectionSpecValue = getCollectionSpecValue(product);
  const rawCollectionSlug =
    product.collectionSlug ||
    (collectionSpecValue && isRouteGradeCollectionSlug(collectionSpecValue)
      ? collectionSpecValue
      : undefined);
  if (!rawCollectionSlug) {
    return null;
  }

  const normalizedCollectionSlug = normalizeCollectionSlugForProductRoute(
    rawCollectionSlug,
    product.brandId,
    product.categoryId
  );

  return normalizedCollectionSlug || null;
}

export function getCanonicalProductHref(product: ProductWithCollectionSlug): string {
  const routeSlug = getCanonicalProductRouteSlug(product.slug);
  if (!routeSlug) {
    return '/proizvodi';
  }

  if (hasInlineQuerySlug(routeSlug)) {
    return `/proizvodi/${routeSlug}`;
  }

  const collectionRouteSlug = getProductCollectionRouteSlug(product);
  if (collectionRouteSlug && collectionRouteSlug !== routeSlug) {
    const canonicalColorSlug = getCanonicalDirectColorQuerySlug(product, routeSlug);
    return `/proizvodi/${collectionRouteSlug}?color=${encodeURIComponent(canonicalColorSlug)}`;
  }

  return `/proizvodi/${routeSlug}`;
}

export function getCanonicalCollectionAliasHref(
  requestedRouteSlug: string,
  product: ProductWithCollectionSlug,
  selectedColorSlug?: string
): string | null {
  if (!requestedRouteSlug || product.collectionSlug) {
    return null;
  }

  if (!['2', '4', '6', '7', '8', '9', '10', '11'].includes(product.categoryId)) {
    return null;
  }

  const normalizedCollectionSlug = normalizeCollectionSlugForProductRoute(
    requestedRouteSlug,
    product.brandId,
    product.categoryId
  );

  if (!normalizedCollectionSlug || normalizedCollectionSlug === requestedRouteSlug) {
    return null;
  }

  const colorParam = selectedColorSlug
    ? `?color=${encodeURIComponent(selectedColorSlug)}`
    : '';

  return `/proizvodi/${normalizedCollectionSlug}${colorParam}`;
}
