import { NextRequest } from 'next/server';
import { describe, expect, it, vi } from 'vitest';
import { GET as searchProducts } from '@/app/api/search/route';
import { GET as getColorData } from '@/app/api/color-data/route';
import { GET as getHomeColors } from '@/app/api/home-colors/route';
import esdData from '@/public/data/esd_colors.json';
import { getColorsForCategory } from '@/lib/colors/get-colors';
import { productRepository } from '@/lib/repositories/product-repository';
import { getEsdCollectionProducts, getProductBySlug } from '@/lib/utils/productDataLoader';
import { getCanonicalProductHref } from '@/lib/utils/product-routes';
import { resolveProductBySlug } from '@/lib/product-page/resolve-product';
import { mergeSelectedColor, prepareCustomColors } from '@/lib/product-page/prepare-colors';

const slug = 'tarkett-iq-granit-sd';
const collection = (esdData.collections as Array<Record<string, any>>).find((item) => item.slug === slug);

describe('Tarkett iQ Granit SD', () => {
  it('exposes one priced Tarkett ESD collection through loader, repository and search', async () => {
    const product = getProductBySlug(slug);
    expect(product).toMatchObject({ slug, brandId: '3', categoryId: '8', price: 4999, priceUnit: 'm²' });
    expect(product?.documents?.length).toBeGreaterThan(0);
    expect(product?.images[0]?.url).toBe(collection?.collection_image_url);
    expect(getCanonicalProductHref(product!)).toBe(`/proizvodi/${slug}`);

    const esdProducts = getEsdCollectionProducts();
    expect(esdProducts.filter((item) => item.slug === slug)).toHaveLength(1);
    expect(esdProducts.filter((item) => item.brandId === '6')).toHaveLength(7);
    expect((await productRepository.findByCategory('8', { brandIds: ['3'] })).map((item) => item.slug)).toEqual([slug]);
    expect((await productRepository.findByBrand('3')).some((item) => item.slug === slug)).toBe(true);

    const response = await searchProducts(new NextRequest('http://localhost/api/search?q=iQ%20Granit%20SD'));
    const body = await response.json();
    expect(body.products[0]).toMatchObject({ slug, categoryId: '8', price: 4999, url: `/proizvodi/${slug}` });
  });

  it('keeps all 14 SD colors in their own collection with the same price and collection documents', async () => {
    const product = await resolveProductBySlug(slug);
    expect(product).not.toBeNull();
    const colors = await prepareCustomColors(product!, slug);
    expect(colors).toHaveLength(14);
    const apiColors = await getColorsForCategory('elektroprovodni', { collection: slug });
    expect(apiColors.status).toBe(200);
    expect(apiColors.body.totalColors).toBe(14);
    expect(apiColors.body.collections[0].colors.every((color: any) => color.brandId === '3')).toBe(true);

    const documentUrls = product!.documents!.map((document) => document.url);
    for (const color of colors!) {
      const directColor = await resolveProductBySlug(color.slug);
      expect(directColor).toMatchObject({ brandId: '3', categoryId: '8', price: 4999, priceUnit: 'm²', collectionSlug: slug });
      expect(getCanonicalProductHref(directColor!)).toBe(`/proizvodi/${slug}?color=${encodeURIComponent(color.slug)}`);

      const selectedProduct = structuredClone(product!);
      await mergeSelectedColor(selectedProduct, color.slug);
      expect(selectedProduct).toMatchObject({ price: 4999, priceUnit: 'm²', brandId: '3', categoryId: '8' });
      expect(selectedProduct.documents?.map((document) => document.url)).toEqual(expect.arrayContaining(documentUrls));

      const response = await getColorData(new NextRequest(`http://localhost/api/color-data?categoryId=8&color=${encodeURIComponent(color.slug)}`));
      const data = await response.json();
      expect(response.status).toBe(200);
      expect(data.documents.map((document: any) => document.url)).toEqual(expect.arrayContaining(documentUrls));
    }
    expect(product!.name).toBe(collection?.name);
  });

  it('returns 56 ESD colors for the homepage and 14 priced SD colors after the Tarkett filter', async () => {
    const response = await getHomeColors(new NextRequest('http://localhost/api/home-colors?categoryIds=8'));
    const body = await response.json();
    expect(response.status).toBe(200);
    const colors = body.groups.find((group: any) => group.categoryId === '8').products;
    expect(colors).toHaveLength(56);
    const tarkettColors = colors.filter((product: any) => product.brandId === '3');
    expect(tarkettColors).toHaveLength(14);
    for (const product of tarkettColors) {
      expect(product).toMatchObject({ categoryId: '8', price: 4999, priceUnit: 'm²', collectionSlug: slug });
      expect(getCanonicalProductHref(product)).toBe(`/proizvodi/${slug}?color=${encodeURIComponent(product.slug)}`);
    }

    const storedColor = { ...colors[0], id: 'stored-esd-color', slug: 'stored-esd-color' };
    const storedDuplicate = { ...colors[0], price: 1234 };
    const storedProducts = [storedColor, storedDuplicate];
    const repositorySpy = vi.spyOn(productRepository, 'findByCategory').mockResolvedValueOnce(storedProducts);
    try {
      const mergedResponse = await getHomeColors(new NextRequest('http://localhost/api/home-colors?categoryIds=8'));
      const mergedColors = (await mergedResponse.json()).groups[0].products;
      expect(mergedColors).toHaveLength(57);
      expect(mergedColors.find((product: any) => product.slug === storedColor.slug)).toBeDefined();
      expect(mergedColors.find((product: any) => product.slug === storedDuplicate.slug).price).toBe(1234);
      expect(storedProducts).toEqual([storedColor, storedDuplicate]);
    } finally {
      repositorySpy.mockRestore();
    }
  });
});
