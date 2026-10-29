import React, { useState } from 'react';
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import ProductImage from '@/components/ProductImage';
import dataset from '@/public/data/schonox_products.json';

vi.mock('react', async () => ({
  ...await vi.importActual<typeof import('react')>('react'),
  useMemo: (factory: () => unknown) => factory(),
  useEffect: vi.fn(),
  useState: vi.fn(),
}));

let sourceIndex = 0;
let exhausted = false;
function renderImage(props: Parameters<typeof ProductImage>[0]) {
  vi.mocked(useState)
    .mockImplementationOnce(() => [sourceIndex, (value: number) => { sourceIndex = value; }] as any)
    .mockImplementationOnce(() => [exhausted, (value: boolean) => { exhausted = value; }] as any);
  return ProductImage(props);
}

beforeEach(() => {
  vi.stubGlobal('React', React);
  sourceIndex = 0;
  exhausted = false;
});
afterAll(() => vi.unstubAllGlobals());

describe('product image framing', () => {
  it('shows every canonical SCHÖNOX packshot whole on white with shared padding', () => {
    expect(dataset.products).toHaveLength(135);
    for (const product of dataset.products) {
      const image = renderImage({ sources: product.images });
      expect(image.props.style, product.slug).toEqual({
        objectFit: 'contain', backgroundColor: '#fff', padding: '6%',
      });
      expect(image.props.className || '').not.toMatch(/object-(cover|contain)/);
      expect(image.props.unoptimized).toBe(false);
    }
  });

  it('keeps roomshots and decor patterns covering their frame and preserves positioning', () => {
    for (const src of ['/images/roomshot.jpg', '/images/decor-pattern.jpg']) {
      const image = renderImage({ src, className: 'object-left', sizes: '100px', priority: true });
      expect(image.props.style).toEqual({ objectFit: 'cover' });
      expect(image.props.className).toBe('object-left');
      expect(image.props.sizes).toBe('100px');
      expect(image.props.priority).toBe(true);
    }
  });

  it('recomputes framing for each active fallback and reaches the empty state after exhaustion', () => {
    const packshot = dataset.products[0].images[0];
    const sources = [
      { url: '/images/roomshot.jpg', alt: 'Room' },
      packshot,
      { url: '/images/decor-pattern.jpg', alt: 'Decor' },
    ];
    let image = renderImage({ sources });
    expect(image.props.style.objectFit).toBe('cover');
    image.props.onError();
    image = renderImage({ sources });
    expect(image.props.src).toBe(packshot.url);
    expect(image.props.style).toEqual({ objectFit: 'contain', backgroundColor: '#fff', padding: '6%' });
    image.props.onError();
    image = renderImage({ sources });
    expect(image.props.src).toBe('/images/decor-pattern.jpg');
    expect(image.props.style).toEqual({ objectFit: 'cover' });
    image.props.onError();
    expect(renderImage({ sources }).type).toBe('div');
  });
});
