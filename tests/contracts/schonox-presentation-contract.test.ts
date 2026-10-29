import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Product } from '@/types';
import { getAllSchonoxProducts } from '@/lib/data/schonox-products';
import { generateProductSchema } from '@/lib/seo/structured-data';
import { buildHomeCatalogItems } from '@/lib/catalog/home-catalog-index';

const compare = vi.hoisted(() => ({ items: [] as unknown[] }));
const stubs = vi.hoisted(() => ({ Breadcrumbs: (_props: { items: Array<{ label: string }> }) => null }));
// React 18 stable has no `cache`; the PDP uses it only for per-request memoization.
vi.mock('react', async () => ({ ...(await vi.importActual<typeof import('react')>('react')), cache: <T,>(fn: T) => fn }));
vi.mock('@/lib/context/CompareContext', () => ({ useCompare: () => ({ compareItems: compare.items, removeFromCompare: vi.fn(), clearAll: vi.fn() }) }));
vi.mock('@/components/Breadcrumbs', () => ({ default: stubs.Breadcrumbs }));
for (const name of ['ProductColorSelector', 'ColorGrid', 'ProductActions', 'ProductDocuments', 'RecommendedAccessories', 'EcoFeatures', 'CertificationBadges', 'RelatedProducts', 'RecentlyViewed', 'ProductInquiryStickyCTA', 'ProductViewTracker', 'ProductDetailsTabs', 'ProductImage', 'ProductCharacteristics', 'ProductDescriptionWithCharacteristics', 'ProductBenefits', 'FlooringCalculator']) {
  vi.doMock(`@/components/${name}`, () => ({ default: () => null }));
}
vi.stubGlobal('React', React);
afterAll(() => vi.unstubAllGlobals());
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-10-29T12:00:00Z'));
});
afterEach(() => vi.useRealTimers());

const schonox = getAllSchonoxProducts()[0] as Product;

function findProps(node: any, type: unknown): any {
  if (!node || typeof node !== 'object') return null;
  if (Array.isArray(node)) { for (const child of node) { const found = findProps(child, type); if (found) return found; } return null; }
  if (node.type === type) return node.props;
  return findProps(node.props?.children, type);
}

describe('SCHÖNOX availability is on request, never a stock claim', () => {
  it('keeps manufacturer package lines readable in comparison', async () => {
    const emiclassic = getAllSchonoxProducts().find(product => product.slug === 'schonox-emiclassic')!;
    emiclassic.specs.push({ key: 'program', label: 'Program proizvođača', value: 'Podovi, Brodogradnja' });
    compare.items = [emiclassic];
    const { default: ComparePageClient } = await import('@/app/uporedi/ComparePageClient');
    const html = renderToStaticMarkup(React.createElement(ComparePageClient));
    expect(html).toMatch(/<td[^>]*whitespace-pre-line[^>]*text-left[^>]*>14 kg, kanta\n6 kg, kanta<\/td>/);
    expect(html).not.toMatch(/Program proizvođača|Brodogradnja|Marine/);
    expect(html).not.toContain('EAN');
  });

  it('omits schema.org availability for a priced on-request product', () => {
    const priced = { ...schonox, price: 1000, priceUnit: 'kom', inStock: false, availability: 'on_request' } as Product;
    expect((generateProductSchema(priced, null, null).offers as any).availability).toBeUndefined();
    expect((generateProductSchema({ ...priced, availability: undefined, inStock: true }, null, null).offers as any).availability).toBe('https://schema.org/InStock');
  });

  it('shows "Na upit" on the compare page instead of "Nije na stanju"', async () => {
    compare.items = [{ ...schonox, id: 'schonox-kh' }];
    const { default: ComparePageClient } = await import('@/app/uporedi/ComparePageClient');
    const html = renderToStaticMarkup(React.createElement(ComparePageClient));
    expect(html).toContain('Na upit');
    expect(html).not.toContain('Nije na stanju');
  });

  it('keeps "Na upit" / "Na stanju" for slim homepage card items added to compare', async () => {
    const inStock = { ...schonox, id: 'pribor-in-stock', slug: 'pribor-in-stock', availability: undefined, inStock: true } as Product;
    compare.items = buildHomeCatalogItems('pribor', [schonox, inStock], [schonox, inStock]);
    const { default: ComparePageClient } = await import('@/app/uporedi/ComparePageClient');
    const html = renderToStaticMarkup(React.createElement(ComparePageClient));
    expect(html).toContain('Na upit');
    expect(html).toContain('Na stanju');
    expect(html).not.toContain('Nije na stanju');
  });

  it('does not add a mangled own-slug collection crumb on a SCHÖNOX PDP', async () => {
    const { default: ProductPage } = await import('@/app/proizvodi/[slug]/page');
    const page = await ProductPage({ params: { slug: 'schonox-kh' }, searchParams: {} } as any);
    const labels = findProps(page, stubs.Breadcrumbs)?.items.map((item: { label: string }) => item.label);
    expect(labels?.at(-1)).toMatch(/SCHÖNOX KH/i);
    expect(labels).not.toContain('Schonox Kh');
  }, 60000);

  it('shows one final price on a single-package PDP without price metadata or duplication', async () => {
    const product = getAllSchonoxProducts().find(item => item.slug === 'schonox-emiclassic')!;
    const { default: ProductPage } = await import('@/app/proizvodi/[slug]/page');
    const html = renderToStaticMarkup(await ProductPage({ params: { slug: product.slug }, searchParams: {} } as any));
    expect(html.match(/11\.883,44 RSD/g)).toHaveLength(1);
    expect(html).not.toContain('9.902,87');
    expect(html).not.toMatch(/<table|Izvorna cena|PDV|Cene važe|Redovne cene|RSD\/pakovanje/);
  }, 60000);

  it('shows each package and its final price once, retaining matching offers only in schema', async () => {
    const product = getAllSchonoxProducts().find(item => (item.priceOptions?.length || 0) > 1)!;
    expect(product).toBeDefined();
    const { default: ProductPage } = await import('@/app/proizvodi/[slug]/page');
    const page = await ProductPage({ params: { slug: product.slug }, searchParams: {} } as any);
    const html = renderToStaticMarkup(page);
    expect(html).toContain('aria-label="Cene po pakovanju"');
    expect(html).not.toMatch(/<table|Izvorna cena|PDV|Cene važe|Redovne cene|od \d/);
    for (const option of product.priceOptions!) {
      expect(html).toContain(option.packagingLabel);
      expect(html).not.toContain(option.priceWithoutVat.toLocaleString('sr-RS'));
      expect(html.split(`${option.price.toLocaleString('sr-RS')} RSD`)).toHaveLength(2);
    }
    const schema = JSON.parse(findProps(page, 'script').dangerouslySetInnerHTML.__html)[0];
    expect(schema.offers).toHaveLength(product.priceOptions!.length);
    for (const offer of schema.offers) {
      expect(offer.priceValidUntil).toBe('2026-12-31');
      expect(offer.priceSpecification.valueAddedTaxIncluded).toBe(true);
      expect(offer.availability).toBeUndefined();
    }
  }, 60000);
});
