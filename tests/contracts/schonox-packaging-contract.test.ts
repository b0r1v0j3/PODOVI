import { createRequire } from 'node:module';
import { describe, expect, it, vi } from 'vitest';
import dataset from '@/public/data/schonox_products.json';
import manifest from '@/docs/products/schonox-source-manifest.json';

const { applyPresentation, productPackaging } = createRequire(import.meta.url)('../../tools/extract_schonox_catalog.js');
const packaging = (slug: string) => productPackaging(manifest.products.find(product => product.slug === slug));

describe('SCHÖNOX manufacturer packaging presentation', () => {
  it('separates real package choices and removes identifiers and pallet logistics', () => {
    expect(packaging('schonox-emiclassic')).toBe('14 kg, kanta\n6 kg, kanta');
    expect(packaging('schonox-kh')).toBe('10 kg, kanister\n5 kg, kanister\n1 kg, boca (12 komada u kutiji)');
    expect(packaging('schonox-ab-10-30')).toBe('30 m², rolna\n10 m², rolna');
    expect(packaging('schonox-d-8-15-21-35-65')).toBe('25 komada, kutija');
    expect(packaging('schonox-q9-w')).toBe('25 kg, vreća\n4 × 5 kg, vreće\n15 kg, vreća');
    expect(packaging('schonox-fix-clean')).toBe('Posuda sa 73 krpe (6 komada u kutiji)');
    expect(packaging('schonox-sb-set')).toBe('Komplet');
    expect(packaging('schonox-ts')).toBe('20 m², rolna');
    expect(packaging('schonox-iline-ak')).toBe('');
  });

  it('preserves multipacks, component quantities and explicit roll dimensions', () => {
    expect(packaging('schonox-cf-design')).toBe('5 kg, kombinovano pakovanje (4,738 kg komponenta A (smola), 0,262 kg komponenta B (učvršćivač))\n4 × 2,5 kg, kombinovano pakovanje (2,369 kg komponenta A (smola), 0,131 kg komponenta B (učvršćivač))');
    expect(packaging('schonox-sgh')).toBe('2 × 6 plastičnih boca u kutiji (6 × komponenta A, 6 × komponenta B)');
    expect(packaging('schonox-armierungsgewebe')).toBe('25 m², rolna\n25 m, rolna (širina 33 cm)');
    expect(packaging('schonox-parkett-52')).toBe('6 × 1800 ml u kutiji\n20 × 600 ml u kutiji');
    expect(packaging('schonox-leichtestrich-system')).toBe('SCHÖNOX LEB — 10 kg, vreća\nSCHÖNOX LEF — 9 kg, vreća');
  });

  it('keeps verified PDS corrections and excludes separately named products', () => {
    expect(packaging('schonox-1k-ds-premium')).toBe('18 kg, vreća');
    expect(packaging('schonox-2k-pu-solid')).toBe('5 kg, kombinovano pakovanje (4,17 kg komponenta A + 0,83 kg komponenta B)');
    expect(packaging('schonox-gea')).toBe('4,5 kg, kombinovano pakovanje (3 kg komponenta A (smola), 1,5 kg komponenta B (učvršćivač))');
    expect(packaging('schonox-con-boden')).toBe('5,5 kg, kutija: 4,42 kg komponenta A, 1,08 kg komponenta B');
    expect(packaging('schonox-mse')).toBe('25 kg, vreća');
    expect(packaging('schonox-xp-15')).toBe('25 kg, vreća');
  });

  it('keeps global manufacturer packs distinct from approved Serbian sales packages', () => {
    expect(packaging('schonox-epoxy-clean')).toBe('4 × 0,5 kg, kante u kutiji');
    expect(packaging('schonox-ifix')).toBe('2,61 kg, komplet\n7,8 kg, komplet');
    expect(dataset.products.find(product => product.slug === 'schonox-epoxy-clean')!.priceOptions!.map(option => option.packagingLabel)).toEqual(['0,5 kg']);
    expect(dataset.products.find(product => product.slug === 'schonox-ifix')!.priceOptions!.map(option => option.packagingLabel)).toEqual(['7,8 kg, komplet']);
  });

  it('regenerates only the two public specs offline, preserving every other field and raw source', () => {
    const sourceBefore = JSON.stringify(manifest);
    const input = structuredClone(dataset.products);
    for (const product of input) {
      for (const spec of product.specs) {
        if (spec.key === 'program') spec.value = spec.value.replace('Brodogradnja', 'Marine');
        if (spec.key === 'manufacturer_packaging') spec.value = 'Material No. 123456 EAN 1234567890123 Packsize raw';
      }
    }
    const inputBefore = JSON.stringify(input);
    const network = vi.spyOn(globalThis, 'fetch').mockImplementation(() => { throw new Error('Presentation refresh must stay offline'); });
    try {
      const result = applyPresentation(input, manifest.products);
      expect(result).toEqual(dataset.products);
      const withoutPresentation = (products: typeof input) => products.map(product => ({ ...product, specs: product.specs.filter(spec => !['program', 'manufacturer_packaging'].includes(spec.key)) }));
      expect(withoutPresentation(result)).toEqual(withoutPresentation(input));
      expect(JSON.stringify(input)).toBe(inputBefore);
      expect(JSON.stringify(manifest)).toBe(sourceBefore);
      expect(network).not.toHaveBeenCalled();
      expect(() => applyPresentation(input, [])).toThrow('Missing presentation source');
    } finally {
      network.mockRestore();
    }
  });

  it('publishes clean, deduplicated packaging for the entire source corpus', () => {
    expect(dataset.products).toHaveLength(135);
    for (const product of dataset.products) {
      const spec = product.specs.find(item => item.key === 'manufacturer_packaging');
      expect(spec?.value || '', product.slug).toBe(packaging(product.slug));
      if (spec) {
        expect(spec.label).toBe('Pakovanja proizvođača');
        expect(spec.value, product.slug).not.toMatch(/EAN|Material|Broj materijala|Packsize|Packaging unit|Transportno|pallet|paleta|\d{6,}/i);
        const lines = spec.value.split('\n');
        expect(new Set(lines).size, product.slug).toBe(lines.length);
        expect(lines.every(line => line.trim() === line && line.length > 0), product.slug).toBe(true);
      }
      const program = product.specs.find(item => item.key === 'program')!;
      expect(program.label).toBe('Program proizvođača');
      expect(program.value).not.toContain('Marine');
      expect(program.value.includes('Brodogradnja')).toBe(product.source.groupUrls.some(url => url.includes('marine-range')));
    }
    expect(manifest.products.find(product => product.slug === 'schonox-emiclassic')!.sections.Packaging).toContain('EAN 4016447004255');
  });
});
