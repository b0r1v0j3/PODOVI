import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterAll, describe, expect, it, vi } from 'vitest';
import ProductColorSelector from '@/components/ProductColorSelector';

const navigation = vi.hoisted(() => ({ query: '' }));
vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(navigation.query),
  useRouter: () => ({ replace: vi.fn() }),
  usePathname: () => '/proizvodi/tarkett-iq-granit-sd',
}));

vi.stubGlobal('React', React);
afterAll(() => vi.unstubAllGlobals());

describe('iQ Granit SD presentation', () => {
  it('opens with the collection photo and preserves its identity, purpose, price and facts after color selection', () => {
    const props = {
      initialImage: { url: '/images/granit-sd-reference.jpg', alt: 'iQ Granit SD' },
      collectionSlug: 'tarkett-iq-granit-sd',
      productSlug: 'tarkett-iq-granit-sd',
      productName: 'iQ Granit SD',
      originalProductName: 'Tarkett iQ Granit SD',
      collectionDisplayName: 'iQ Granit SD',
      brand: { name: 'Tarkett', slug: 'tarkett' },
      shortDescription: 'Trajno statički disipativni homogeni vinil.',
      productPrice: 4999,
      priceUnit: 'm²',
      inStock: true,
      specs: [
        { key: 'ukupna_debljina', label: 'Ukupna debljina', value: '2 mm' },
        { key: 'elektricna_otpornost', label: 'Električna otpornost', value: '≤ 10⁸ Ω' },
        { key: 'format', label: 'Format', value: 'Rolna 2 × 23 m; ploče 610 × 610 mm' },
      ],
      customColors: [{
        slug: 'granit-sd-grey', name: 'Grey', code: '3096724',
        image_url: '/images/granit-sd-grey.jpg',
      }],
    };

    navigation.query = '';
    const collection = renderToStaticMarkup(React.createElement(ProductColorSelector, props));
    expect(collection).toContain('src="/images/granit-sd-reference.jpg"');
    expect(collection).not.toContain('&amp;color=granit-sd-grey');

    navigation.query = 'color=granit-sd-grey';
    const selected = renderToStaticMarkup(React.createElement(ProductColorSelector, { ...props, productName: '3096724 Grey' }));
    expect(selected).not.toContain('src="/images/granit-sd-reference.jpg"');
    expect(selected).toContain('&amp;color=granit-sd-grey');
    for (const html of [collection, selected]) {
      expect(html).toMatch(/<h1[^>]*>iQ Granit SD<\/h1>/);
      expect(html).toContain(props.shortDescription);
      expect(html).toContain('4.999 RSD / m²');
      for (const spec of props.specs) expect(html).toContain(spec.value);
    }
  });
});
