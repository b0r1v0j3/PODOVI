import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import type { Product } from '@/types';
import dataset from '@/public/data/schonox_products.json';
import manifest from '@/docs/products/schonox-source-manifest.json';
import { getAllSchonoxProducts } from '@/lib/data/schonox-products';
import { getAllPriborProducts, getProductBySlug } from '@/lib/utils/productDataLoader';
import { productRepository } from '@/lib/repositories/product-repository';
import { brandRepository } from '@/lib/repositories/brand-repository';
import { resolveProductBySlug } from '@/lib/product-page/resolve-product';
import { hasCollectionSku, toHomepageListingProduct } from '@/lib/utils/homepage-collection-filter';
import { getCanonicalProductHref } from '@/lib/utils/product-routes';
import { collectFacetOptionValues, getFacetDefsForCategory, productMatchesFacetSelections } from '@/lib/catalog/facet-config';

describe('complete European/global SCHÖNOX catalog', () => {
  it('accounts for all official floor, tile and marine entries, including inline accessories', () => {
    expect(dataset.products).toHaveLength(135);
    expect(manifest.listings).toHaveLength(26);
    expect(manifest.duplicates).toHaveLength(26);
    expect(manifest.failures).toEqual([]);
    expect(manifest.entryPoints).toHaveLength(3);
    expect(new Set(dataset.products.map(product => product.slug)).size).toBe(dataset.products.length);
    expect(dataset.products.map(product => product.slug).sort()).toEqual(manifest.products.map(product => product.slug).sort());
    const includedUrls = new Set(manifest.products.flatMap(product => [product.canonicalUrl, ...product.alternateUrls]));
    for (const listing of manifest.listings) {
      for (const url of listing.productUrls) expect(includedUrls.has(url), url).toBe(true);
      for (const product of listing.inlineProducts) expect(dataset.products.some(item => item.slug === product.slug)).toBe(true);
    }
    expect(manifest.listings.filter(listing => listing.status === 'official_page_empty').map(listing => listing.url)).toEqual([
      'https://deu.sika.com/schonox-global/en/marine-range/parquet-adhesives.html',
    ]);
  });

  it('serves files from our Supabase buckets and records the malformed manufacturer PDF explicitly', () => {
    // PDF magic bytes and image formats are enforced by the extractor before upload (see its --self-test).
    for (const product of dataset.products) {
      expect(product.images.length, product.slug).toBeGreaterThan(0);
      for (const image of product.images) expect(image.url).toMatch(/^https:\/\/[a-z0-9]+\.supabase\.co\/storage\/v1\/object\/public\/product-images\/schonox\/[^/]+\.(png|jpg)$/);
      for (const document of product.documents) expect(document.url).toMatch(/^https:\/\/[a-z0-9]+\.supabase\.co\/storage\/v1\/object\/public\/product-documents\/schonox\/[^/]+\.pdf$/);
    }
    expect(manifest.exclusions.some(item => item.scope === 'document' && item.reason.includes('Office ZIP'))).toBe(true);
    expect(manifest.missingImages).toEqual([]);
    expect(manifest.missingDocuments).toHaveLength(7);
  });

  it('keeps immutable, verified packshots at the best official resolution without cropping', () => {
    const packshots = manifest.assets.filter(asset => 'width' in asset);
    expect(packshots).toHaveLength(135);
    for (const asset of packshots) {
      expect(asset.url).toContain(`-${asset.sha256}.`);
      expect(asset.sourceUrl).not.toContain('smartcrop');
      expect(asset.checkedAt).toBeTruthy();
      if (['schonox-anmacheimer', 'schonox-wassereimer'].includes(asset.productSlug)) {
        expect(asset).toMatchObject({ width: 300, height: 400, format: 'jpeg', alpha: false });
      } else {
        expect(asset).toMatchObject({ width: 1600, height: 1600, format: 'png', alpha: true });
      }
    }
    expect(manifest.imageLimitations.map(item => item.productSlug).sort()).toEqual(['schonox-anmacheimer', 'schonox-wassereimer']);
  });

  it('publishes reviewed Serbian detail text and only promises a technical sheet when one is attached', () => {
    const copy = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'tools/schonox-copy.json'), 'utf8'));
    const details = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'tools/schonox-details.json'), 'utf8'));
    expect(Object.keys(details).sort()).toEqual(dataset.products.map(product => product.slug).sort());
    const withLongSource = manifest.products.filter(product => product.description);
    expect(withLongSource).toHaveLength(120);
    for (const product of dataset.products) {
      expect(product.shortDescription).toBe(copy[product.slug]);
      expect(product.description.startsWith(details[product.slug]), product.slug).toBe(true);
      expect(product.description).not.toMatch(/\b(suitable for|for interior use|for exterior use|Packaging unit|Packsize)\b/i);
      const hasPds = product.documents.some(document => document.type === 'product_data_sheet');
      expect(product.description.includes('priloženom tehničkom listu'), product.slug).toBe(hasPds);
      expect(product.description.includes('Zatražite tehnički list'), product.slug).toBe(!hasPds);
    }
    expect(manifest.missingTechnicalDataSheets).toHaveLength(28);
    const fpl = dataset.products.find(product => product.slug === 'schonox-fpl-plus')!;
    expect(fpl.shortDescription).toMatch(/3(?:[–-]| do )50 mm/);
    expect(fpl.description).toMatch(/10[–-]60 mm/);
    expect(dataset.products.find(product => product.slug === 'schonox-d-8-15-21-35-65')!.shortDescription).toMatch(/manžet/i);
    const packaging = (slug: string) => dataset.products.find(product => product.slug === slug)!.specs.find(spec => spec.key === 'manufacturer_packaging')!.value;
    expect(packaging('schonox-gea')).not.toMatch(/488270|25[.,]0?\s*kg/);
    expect(packaging('schonox-2k-pu-solid')).toBe('5 kg, kombinovano pakovanje (4,17 kg komponenta A + 0,83 kg komponenta B)');
    expect(packaging('schonox-1k-ds-premium')).toBe('18 kg, vreća');
    for (const slug of ['schonox-1k-ds-premium', 'schonox-2k-pu-solid']) {
      expect(packaging(slug)).not.toMatch(/nije potvrđeno|potvrđuje/);
      expect(dataset.products.find(product => product.slug === slug)!.description).not.toMatch(/različite podatke|potrebno je potvrditi/);
    }
  });

  it('publishes approved prices while keeping availability on request and manufacturer dates', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-29T12:00:00Z'));
    try {
      const products = getAllSchonoxProducts();
      expect(products.filter(product => product.price !== undefined)).toHaveLength(30);
      expect(products.filter(product => product.price === undefined)).toHaveLength(105);
      for (const product of products) {
        expect(product.inStock).toBe(false);
        expect(product.availability).toBe('on_request');
        expect(product.updatedAt.toISOString()).toBe(dataset.generatedAt);
        expect(product.description).toContain('potvrdu prodaje');
        expect(hasCollectionSku(product)).toBe(true);
        expect(getCanonicalProductHref(product)).toBe(`/proizvodi/${product.slug}`);
      }
      const first = getAllSchonoxProducts()[0];
      first.specs[0].value = 'mutated';
      expect(getAllSchonoxProducts()[0].specs[0].value).not.toBe('mutated');
    } finally {
      vi.useRealTimers();
    }
  });

  it('keeps loader, repository, brand filter and resolver counts aligned', async () => {
    expect(getAllPriborProducts().filter(product => product.brandId === '17')).toHaveLength(135);
    expect(await productRepository.findByBrand('17')).toHaveLength(135);
    expect((await productRepository.findByCategory('15')).filter(product => product.brandId === '17')).toHaveLength(135);
    expect(await brandRepository.findBySlug('schonox')).toMatchObject({ id: '17', name: 'SCHÖNOX' });
    for (const slug of ['schonox-kh', 'schonox-rm', 'schonox-zm', 'schonox-mde-0-9', 'schonox-anmacheimer']) {
      expect(getProductBySlug(slug)).toMatchObject({ slug, availability: 'on_request' });
      expect(await resolveProductBySlug(slug)).toMatchObject({ slug, brandId: '17', categoryId: '15', availability: 'on_request' });
    }
    expect((await productRepository.findAll({ search: 'schonox' })).length).toBe(135);
  });

  it('builds only live product group/program filters and includes Marine products', () => {
    const products = getAllSchonoxProducts();
    const defs = getFacetDefsForCategory('pribor');
    const program = defs.find(def => def.param === 'program')!;
    expect(collectFacetOptionValues(products, program).sort()).toEqual(['Keramika', 'Marine', 'Podovi']);
    for (const value of collectFacetOptionValues(products, program)) {
      expect(products.filter(product => productMatchesFacetSelections(product, { program: [value] }, defs)).length).toBeGreaterThan(0);
    }
    // Legacy Tarkett/Gerflor floor accessories must stay visible when the Program filter is set to Podovi.
    const legacy = getAllPriborProducts().filter(product => product.brandId !== '17');
    expect(legacy.length).toBeGreaterThan(0);
    for (const product of legacy) expect(productMatchesFacetSelections(product, { program: ['Podovi'] }, defs)).toBe(true);
    const types = new Set(products.map(product => product.specs.find(spec => spec.key === 'type')?.value));
    expect(types.has('Prajmeri')).toBe(true);
    expect(types.has('Brodarski estrisi')).toBe(true);
    expect(types.has('Mase za nivelaciju i popravke')).toBe(true);
  });

  it('publishes Serbian packaging text and distinguishable, deduplicated documents', () => {
    const sha256ByUrl = new Map(manifest.assets.map(asset => [asset.url, asset.sha256]));
    for (const product of dataset.products) {
      const packaging = product.specs.find(spec => spec.key === 'manufacturer_packaging')?.value || '';
      expect(packaging, product.slug).not.toMatch(/kompletned|kanisterister|\b(packaging|package|resin|hardener|Container|wipes|pallet|rolls?|box)\b/i);
      const titles = product.documents.map(document => document.title);
      expect(new Set(titles).size, product.slug).toBe(titles.length);
      const hashes = product.documents.map(document => sha256ByUrl.get(document.url));
      expect(hashes.every(Boolean), product.slug).toBe(true);
      expect(new Set(hashes).size, product.slug).toBe(hashes.length);
      for (const document of product.documents) {
        if (document.type === 'environmental_product_declaration') expect(document.title).toMatch(/^Ekološka deklaracija \(EPD\)/);
        if (document.type === 'declaration_of_conformity') expect(document.title).toMatch(/^Izjava o usaglašenosti/);
      }
    }
    const q9w = dataset.products.find(product => product.slug === 'schonox-q9-w')!;
    expect(q9w.documents.some(document => document.url.includes('marineconform'))).toBe(false);
    expect(manifest.exclusions.some(item => item.scope === 'document' && item.url?.endsWith('edc-marineconformschoenoxq9w.pdf'))).toBe(true);
  });

  it('finds SCHÖNOX products for diacritic-free Serbian queries and product groups', async () => {
    const schonoxOfType = (type: string) => getAllSchonoxProducts().filter(product => product.specs.some(spec => spec.key === 'type' && spec.value === type)).map(product => product.slug);
    const found = async (query: string) => new Set((await productRepository.findAll({ search: query })).map(product => product.slug));
    const plocice = await found('plocice');
    expect(schonoxOfType('Lepkovi za pločice').every(slug => plocice.has(slug))).toBe(true);
    const hidro = await found('hidroizolacija');
    expect(schonoxOfType('Hidroizolacija').every(slug => hidro.has(slug))).toBe(true);
  });

  it('keeps homepage cards light while the PDP gets the full product', () => {
    const full = getProductBySlug('schonox-kh')!;
    expect(full.documents?.length).toBeGreaterThan(0);
    const card = toHomepageListingProduct(full) as Product & { source?: unknown };
    expect(card.documents).toBeUndefined();
    expect(card.detailsSections).toBeUndefined();
    expect(card.source).toBeUndefined();
    expect(card).toMatchObject({ slug: full.slug, specs: full.specs, description: full.description, images: full.images });
    expect(getProductBySlug('schonox-kh')!.documents).toEqual(full.documents);
    const legacy = getAllPriborProducts().find(product => product.brandId !== '17')!;
    expect(toHomepageListingProduct(legacy)).toBe(legacy);
  });

  it('skips Supabase lookups for mock-only brand and category ids', async () => {
    vi.resetModules();
    const from = vi.fn(() => { throw new Error('unexpected Supabase call'); });
    vi.doMock('@/lib/supabase/client', () => ({ supabase: { from }, hasSupabaseAnonConfig: () => false }));
    try {
      const { SupabaseBrandRepository } = await import('@/lib/repositories/brand-repository');
      const { SupabaseCategoryRepository } = await import('@/lib/repositories/category-repository');
      expect(await new SupabaseBrandRepository().findById('17')).toMatchObject({ id: '17', name: 'SCHÖNOX' });
      expect(await new SupabaseCategoryRepository().findById('15')).toMatchObject({ id: '15', slug: 'pribor' });
      expect(from).not.toHaveBeenCalled();
    } finally {
      vi.doUnmock('@/lib/supabase/client');
      vi.resetModules();
    }
  });
});
