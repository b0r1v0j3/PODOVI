import { describe, expect, it } from 'vitest';
import { loadPriceEntryTree } from '@/lib/cenovnik/tree';

describe('cenovnik stablo — kompletnost iz kataloga', () => {
  it('uključuje brendove koji su ranije falili (Romus/Techem/TimberTech/BLOQ)', async () => {
    const tree = await loadPriceEntryTree();
    const byBrandId = new Map(tree.brands.map((b) => [b.brandId, b]));
    for (const id of ['13', '12', '10', '8']) {
      expect(byBrandId.has(id), `brand ${id} mora postojati u stablu`).toBe(true);
      expect((byBrandId.get(id)!.collections.length)).toBeGreaterThan(0);
    }
    // Romus = puno alatki
    expect(byBrandId.get('13')!.collections.length).toBeGreaterThan(100);
  });

  it('Romus stavke imaju pred-popunjenu cenu (existingPrice > 0)', async () => {
    const tree = await loadPriceEntryTree();
    const romus = tree.brands.find((b) => b.brandId === '13')!;
    const priced = romus.collections.filter((c) => typeof c.existingPrice === 'number' && c.existingPrice! > 0);
    expect(priced.length).toBeGreaterThan(100);
  });

  it('nema duplih slug-ova u stablu (dedup), ni po-boja ruta (?)', async () => {
    const tree = await loadPriceEntryTree();
    const all = tree.brands.flatMap((b) => b.collections.map((c) => `${c.categorySlug}:::${c.slug}`));
    expect(new Set(all).size).toBe(all.length);
    expect(all.some((k) => k.includes('?'))).toBe(false);
  });

  it('S3 Tarkett kolekcije i dalje prisutne (regresija)', async () => {
    const tree = await loadPriceEntryTree();
    const slugs = new Set(tree.brands.flatMap((b) => b.collections.map((c) => c.slug)));
    for (const s of ['tarkett-iq-motion', 'deal-spc-30', 'real-spc-50', 'modulart-70']) {
      expect(slugs.has(s), `${s} mora ostati u stablu`).toBe(true);
    }
  });
});
