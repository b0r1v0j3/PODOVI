import React, { useEffect } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterAll, describe, expect, it, vi } from 'vitest';
import ColorGrid from '@/components/ColorGrid';

const navigation = vi.hoisted(() => ({ replace: vi.fn() }));
vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams('sample=1'),
  useRouter: () => navigation,
  usePathname: () => '/proizvodi/tarkett-iq-granit-sd',
}));
vi.mock('react', async () => {
  const actual = await vi.importActual<typeof import('react')>('react');
  return { ...actual, useEffect: vi.fn() };
});
afterAll(() => vi.unstubAllGlobals());

describe('color selection in the full modal grid', () => {
  it('keeps an existing selection on modal mount and only routes an explicit click', () => {
    const color = {
      collection: 'tarkett-iq-granit-sd', collection_name: 'iQ Granit SD',
      code: '3096726', name: 'White Green', full_name: 'iQ Granit SD White Green',
      slug: 'granit-sd-white-green', image_url: '/images/granit-sd-white-green.jpg',
      image_count: 1, characteristics: { 'Ukupna debljina': '2 mm' },
    };
    const onColorSelect = vi.fn();
    let clickColor: (() => void) | undefined;
    // Capture the real rendered button handler without adding a DOM test dependency.
    vi.stubGlobal('React', {
      ...React,
      createElement: (type: React.ElementType, props: any, ...children: React.ReactNode[]) => {
        if (type === 'button' && props?.key === color.slug) clickColor = props.onClick;
        return React.createElement(type, props, ...children);
      },
    });
    const html = renderToStaticMarkup(React.createElement(ColorGrid, {
      collectionSlug: color.collection, customColors: [color], compact: false, onColorSelect,
      selectedColorSlug: color.slug,
    }));
    // Reopening highlights the current color without replaying selection or closing the modal.
    for (const [mountEffect] of vi.mocked(useEffect).mock.calls) mountEffect();
    expect(html).toContain('border-ink-900');
    expect(onColorSelect).not.toHaveBeenCalled();
    expect(navigation.replace).not.toHaveBeenCalled();
    expect(clickColor).toBeTypeOf('function');
    clickColor!();
    expect(navigation.replace).toHaveBeenCalledWith(
      '/proizvodi/tarkett-iq-granit-sd?sample=1&color=granit-sd-white-green', { scroll: false },
    );
    expect(onColorSelect).toHaveBeenCalledWith({
      colorSlug: color.slug, colorCode: color.code, colorName: color.name,
      imageUrl: color.image_url, imageAlt: color.full_name, characteristics: color.characteristics,
    });
  });
});
