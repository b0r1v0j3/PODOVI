import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Klijentske komponente ne smeju da uvoze module koji statički učitavaju JSON
 * izvore boja/kataloga: 17.10.2026 je jedan takav uvoz (ProductCharacteristics →
 * color-helpers.mergeSpecs) ubacivao ~13 MB u klijentski paket svake PDP strane.
 */

const HEAVY_IMPORTS = [
  "'@/lib/product-page/color-helpers'",
  "'@/lib/product-page/prepare-colors'",
  "'@/lib/product-page/resolve-product'",
  "'@/lib/product-page'",
  "'@/lib/utils/productDataLoader'",
  "'@/lib/catalog/home-catalog-index'",
  "'@/lib/catalog/facet-config'",
  "'@/public/data/",
];

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) return name === 'node_modules' ? [] : walk(full);
    return /\.(tsx?|jsx?)$/.test(name) ? [full] : [];
  });
}

describe('PDP / početna — klijentski paket bez JSON izvora', () => {
  const clientFiles = ['components', 'app', 'lib']
    .flatMap((dir) => walk(dir))
    .filter((file) => /^\s*['"]use client['"]/.test(readFileSync(file, 'utf8')));

  it('ima klijentskih fajlova za proveru', () => {
    expect(clientFiles.length).toBeGreaterThan(20);
  });

  it.each(HEAVY_IMPORTS)('nijedan "use client" fajl ne uvozi %s', (heavyImport) => {
    const offenders = clientFiles.filter((file) => {
      const source = readFileSync(file, 'utf8');
      // `import type` se briše pri kompajliranju i ne ulazi u paket.
      return source.split('\n').some((line) => /^\s*import\b(?!\s+type\b)/.test(line) && line.includes(heavyImport));
    });
    expect(offenders).toEqual([]);
  });

  it('mergeSpecs živi u čistom modulu bez data importa', () => {
    const source = readFileSync('lib/product-page/spec-merge.ts', 'utf8');
    expect(source).toContain('export function mergeSpecs');
    expect(source).not.toMatch(/from '@\/(public|lib\/data|lib\/utils\/productDataLoader)/);
    expect(readFileSync('components/ProductCharacteristics.tsx', 'utf8')).toContain("from '@/lib/product-page/spec-merge'");
  });
});
