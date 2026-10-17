import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterAll, describe, expect, it, vi } from 'vitest';
import type { Product } from '@/types';
import { getAllSchonoxProducts } from '@/lib/data/schonox-products';
import { generateProductSchema } from '@/lib/seo/structured-data';

const compare = vi.hoisted(() => ({ items: [] as unknown[] }));
const stubs = vi.hoisted(() => ({ Breadcrumbs: (_props: { items: Array<{ label: string }> }) => null }));
// React 18 stable has no `cache`; the PDP uses it only for per-request memoization.
vi.mock('react', async () => ({ ...(await vi.importActual<typeof import('react')>('react')), cache: <T,>(fn: T) => fn }));
vi.mock('@/lib/context/CompareContext', () => ({ useCompare: () => ({ compareItems: compare.items, removeFromCompare: vi.fn(), clearAll: vi.fn() }) }));
vi.mock('@/components/Breadcrumbs', () => ({ default: stubs.Breadcrumbs }));
for (const name of ['ProductColorSelector', 'ColorGrid', 'ProductActions', 'ProductDocuments', 'RecommendedAccessories', 'EcoFeatures', 'CertificationBadges', 'RelatedProducts', 'RecentlyViewed', 'ProductInquiryStickyCTA', 'ProductViewTracker', 'ProductDetailsTabs', 'ProductImage', 'ProductCharacteristics', 'ProductDescriptionWithCharacteristics', 'ProductBenefits', 'commerce/ProductOrderPanel', 'FlooringCalculator']) {
  vi.doMock(`@/components/${name}`, () => ({ default: () => null }));
}
vi.stubGlobal('React', React);
afterAll(() => vi.unstubAllGlobals());

const schonox = getAllSchonoxProducts()[0] as Product;

function findProps(node: any, type: unknown): any {
  if (!node || typeof node !== 'object') return null;
  if (Array.isArray(node)) { for (const child of node) { const found = findProps(child, type); if (found) return found; } return null; }
  if (node.type === type) return node.props;
  return findProps(node.props?.children, type);
}

describe('SCHÖNOX availability is on request, never a stock claim', () => {
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

  it('does not add a mangled own-slug collection crumb on a SCHÖNOX PDP', async () => {
    const { default: ProductPage } = await import('@/app/proizvodi/[slug]/page');
    const page = await ProductPage({ params: { slug: 'schonox-kh' }, searchParams: {} } as any);
    const labels = findProps(page, stubs.Breadcrumbs)?.items.map((item: { label: string }) => item.label);
    expect(labels?.at(-1)).toMatch(/SCHÖNOX KH/i);
    expect(labels).not.toContain('Schonox Kh');
  }, 60000);
});
