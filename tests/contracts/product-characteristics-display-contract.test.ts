import React, { useState } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterAll, describe, expect, it, vi } from 'vitest';
import ProductCharacteristics from '@/components/ProductCharacteristics';
import { getProductBySlug } from '@/lib/utils/productDataLoader';
import { resolveSelectedColorServerData } from '@/lib/product-page/color-helpers';
import { filterSpecsForDisplay } from '@/lib/product-page/spec-helpers';
import esdData from '@/public/data/esd_colors.json';

vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams('color=selected'),
}));
vi.mock('react', async () => {
  const actual = await vi.importActual<typeof import('react')>('react');
  return { ...actual, useState: vi.fn(actual.useState) };
});

vi.stubGlobal('React', React);
afterAll(() => vi.unstubAllGlobals());

describe('selected-color characteristic display', () => {
  it('shows each manufacturer package on its own left-aligned line in both rendering paths', () => {
    const specs = [
      { key: 'manufacturer_packaging', label: 'Pakovanja', value: '14 kg, kanta\n6 kg, kanta' },
      { key: 'program', label: 'Program proizvođača', value: 'Podovi, Brodogradnja' },
    ];
    for (const selectedSpecs of [null, specs]) {
      vi.mocked(useState).mockReturnValueOnce([null, vi.fn()]).mockReturnValueOnce([selectedSpecs, vi.fn()]);
      const html = renderToStaticMarkup(React.createElement(ProductCharacteristics, { specs, categoryId: '15' }));
      expect(html).toContain('14 kg, kanta\n6 kg, kanta');
      expect(html).toMatch(/<dd[^>]*whitespace-pre-line[^>]*text-left/);
      expect(html).toContain('sm:grid-cols-[12rem_minmax(0,1fr)]');
      expect(html).not.toMatch(/<dd[^>]*text-right/);
      expect(html).not.toMatch(/Program proizvođača|Brodogradnja/);
    }
  });

  it('renders one row per label after the SD color response adds derived filter specs', async () => {
    const collection = esdData.collections.find(item => item.slug === 'tarkett-iq-granit-sd')!;
    const product = getProductBySlug(collection.slug)!;
    const color = collection.colors[0];
    if (!('slug' in color)) throw new Error('SD color fixture is missing its slug.');
    const selected = await resolveSelectedColorServerData(color.slug, { categoryId: '8', brandId: '3' });
    expect(selected!.specs.filter(spec => spec.label === 'Ukupna debljina')).toHaveLength(2);

    // Render the component after its color API response has populated selectedSpecs.
    vi.mocked(useState)
      .mockReturnValueOnce([null, vi.fn()])
      .mockReturnValueOnce([selected!.specs, vi.fn()]);
    const html = renderToStaticMarkup(React.createElement(ProductCharacteristics, {
      specs: filterSpecsForDisplay(product.specs), categoryId: '8',
    }));
    const labels = Array.from(html.matchAll(/<dt[^>]*>(.*?)<\/dt>/g)).map(match => match[1]);
    expect(labels.filter(label => label === 'Ukupna debljina')).toHaveLength(1);
    expect(new Set(labels).size).toBe(labels.length);
    expect(labels).toContain('Električna otpornost');
    expect(html).toContain('2 mm');
  });
});
