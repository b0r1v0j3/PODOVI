import { GET as colorsRouteGet } from '@/app/api/colors/route';
import { productRepository } from '@/lib/repositories/product-repository';
import { prepareCustomColors } from '@/lib/product-page/prepare-colors';
import { resolveProductBySlug } from '@/lib/product-page/resolve-product';
import { NextRequest } from 'next/server';
import { describe, expect, it } from 'vitest';

// Alpod import nosi brend 'Podovi' ('14'), OSIM Admonter kolekcije koja od 08.07.2026
// (odluka vlasnika) nosi izdvojen brend proizvođača 'Admonter' ('16').
const ALPOD_BRAND_IDS = ['14', '16'];

function isPodoviCollection(product: { brandId?: string; sku?: string | null }) {
  return ALPOD_BRAND_IDS.includes(product.brandId || '') && String(product.sku || '').startsWith('PODOVI-COLLECTION-');
}

function isPodoviVariant(product: { brandId?: string; sku?: string | null }) {
  return ALPOD_BRAND_IDS.includes(product.brandId || '') && !String(product.sku || '').startsWith('PODOVI-COLLECTION-');
}

describe('Podovi imported Alpod-source catalog contracts', () => {
  it.each([
    { categoryId: '2', expectedCollections: 4, minimumVariants: 300 },
    { categoryId: '3', expectedCollections: 7, minimumVariants: 350 },
    { categoryId: '5', expectedCollections: 2, minimumVariants: 100 },
  ])('keeps Podovi collections and variants available for category $categoryId', async ({ categoryId, expectedCollections, minimumVariants }) => {
    const products = await productRepository.findByCategory(categoryId, { brandIds: ALPOD_BRAND_IDS });

    expect(products.filter(isPodoviCollection)).toHaveLength(expectedCollections);
    expect(products.filter(isPodoviVariant).length).toBeGreaterThanOrEqual(minimumVariants);
  });

  it.each([
    { slug: 'podovi-parket-essence-premium', minimumColors: 19 },
    { slug: 'podovi-parket-four-seasons', minimumColors: 20 },
    { slug: 'podovi-parket-heritage', minimumColors: 100 },
    { slug: 'podovi-deking-exterra-timber', minimumColors: 90 },
  ])('prepares PDP selector colors for $slug', async ({ slug, minimumColors }) => {
    const product = await resolveProductBySlug(slug);

    expect(product).not.toBeNull();
    expect(product?.brandId).toBe('14');

    const colors = await prepareCustomColors(product!, slug);

    // "Parket po meri" sa malo jedinstvenih slika (Essence/Four Seasons) se sažima u grupe
    // (jedan swatch po slici) sa `variantList` imenima; ostale kolekcije zadrže stavku po boji.
    // Ukupan broj opcija mora ostati >= minimumColors u oba slučaja.
    const totalOptions = (colors || []).reduce(
      (sum, color) => sum + (Array.isArray((color as { variantList?: string[] }).variantList)
        ? (color as { variantList?: string[] }).variantList!.length
        : 1),
      0,
    );
    expect(totalOptions).toBeGreaterThanOrEqual(minimumColors);
    expect(colors?.every((color) => Boolean(color.image_url || color.texture_url))).toBe(true);
  });

  it.each([
    { category: 'parket', collection: 'podovi-parket-essence-premium', minimumColors: 19 },
    { category: 'parket', collection: 'podovi-parket-four-seasons', minimumColors: 20 },
    { category: 'parket', collection: 'podovi-parket-heritage', minimumColors: 100 },
    { category: 'deking', collection: 'podovi-deking-exterra-timber', minimumColors: 90 },
  ])('serves nested API colors for $category Podovi collections', async ({ category, collection, minimumColors }) => {
    const request = new NextRequest(
      `http://localhost/api/colors?category=${category}&collection=${encodeURIComponent(collection)}`
    );
    const response = await colorsRouteGet(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.collections).toHaveLength(1);
    expect(body.collections[0].slug).toBe(collection);
    expect(body.collections[0].colorCount).toBeGreaterThanOrEqual(minimumColors);
    expect(body.totalColors).toBeGreaterThanOrEqual(minimumColors);
  });
});
