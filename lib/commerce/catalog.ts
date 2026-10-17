import { resolveProductBySlug } from '@/lib/product-page/resolve-product';
import { prepareCustomColors } from '@/lib/product-page/prepare-colors';
import { getColorsForCategory } from '@/lib/colors/get-colors';
import { getPrimaryColorImage, getPrimaryProductImage } from '@/lib/utils/product-images';
import { getCanonicalProductHref } from '@/lib/utils/product-routes';
import { CommerceError } from './errors';
import type { CartLineInput } from './types';
import type { ResolvedCommerceLine } from './pricing';

// shortcut: per-instance memo of resolved catalog lines. Prices can change in Supabase without a deploy and findBySlug
// falls back to JSON on Supabase errors, so a stale line can live up to LINE_TTL_MS; move to a shared versioned cache if that matters.
const LINE_TTL_MS = 60_000;
const lineCache = new Map<string, { at: number; line: Promise<ResolvedCommerceLine> }>();

export function resolveCommerceLine(item: CartLineInput): Promise<ResolvedCommerceLine> {
  const key = `${item.productSlug}:${item.variantSlug || ''}`; // the result does not depend on quantity or customer
  const hit = lineCache.get(key);
  if (hit && Date.now() - hit.at < LINE_TTL_MS) return hit.line;
  if (lineCache.size >= 5000) lineCache.clear();
  const line = resolveCommerceLineUncached(item);
  lineCache.set(key, { at: Date.now(), line });
  // Never cache PRODUCT_NOT_FOUND, INVALID_VARIANT or a transient 503.
  line.catch(() => { if (lineCache.get(key)?.line === line) lineCache.delete(key); });
  return line;
}

async function resolveCommerceLineUncached(item: CartLineInput): Promise<ResolvedCommerceLine> {
  const product = await resolveProductBySlug(item.productSlug);
  if (!product) throw new CommerceError('Proizvod više nije u ponudi.', 400, 'PRODUCT_NOT_FOUND');
  let variants = await prepareCustomColors(product, product.slug);
  if (!variants?.length && product.categoryId === '4' && product.brandId === '6') {
    const collection = product.slug.replace(/^gerflor-/, '');
    const result = await getColorsForCategory('tekstilne-ploce');
    if (result.status !== 200) throw new CommerceError('Varijante proizvoda trenutno nisu dostupne.', 503);
    // Seeded rows use 'gerflor-armonia-540'; accept both forms like ColorGrid.
    variants = (result.body.colors || []).filter((color: { collection: string }) => color.collection === product.slug || color.collection === collection);
  }
  const selectedSlug = item.variantSlug || (variants?.some((variant) => variant.slug === product.slug) ? product.slug : undefined);
  if (variants?.length) {
    const selected = variants.find((variant) => variant.slug === selectedSlug);
    if (!selected || selected.isPatternGroup) {
      throw new CommerceError('Izaberite konkretnu varijantu ovog proizvoda.', 400, 'INVALID_VARIANT');
    }
    const candidate = await resolveProductBySlug(selected.slug);
    // Color slugs can also match a record in another category (e.g. sport for linoleum); never price from it.
    const variantProduct = candidate?.slug === selected.slug && candidate?.categoryId === product.categoryId ? candidate : null;
    return {
      name: `${product.name} — ${selected.name}`,
      sku: String(selected.code || variantProduct?.sku || ''),
      image: getPrimaryColorImage(selected)?.url || getPrimaryProductImage(product, 'thumb')?.url || '',
      url: `/proizvodi/${encodeURIComponent(product.slug)}?color=${encodeURIComponent(selected.slug)}`,
      // Package coverage is always m² per package.
      unit: variantProduct?.priceUnit || product.priceUnit || (variantProduct?.coveragePerPackage ? 'm²' : 'kom'),
      price: variantProduct?.price ?? product.price,
      // Only a resolved concrete variant can authorize package rounding.
      coveragePerPackage: variantProduct?.coveragePerPackage,
      identity: selected.slug,
    };
  }
  if (item.variantSlug && item.variantSlug !== product.slug) {
    throw new CommerceError('Izabrana varijanta ne pripada ovom proizvodu.', 400, 'INVALID_VARIANT');
  }
  return { name: product.name, sku: product.sku, image: getPrimaryProductImage(product, 'thumb')?.url || '',
    url: getCanonicalProductHref(product), unit: product.priceUnit || (product.coveragePerPackage ? 'm²' : 'kom'), price: product.price,
    coveragePerPackage: product.coveragePerPackage, identity: product.slug };
}
