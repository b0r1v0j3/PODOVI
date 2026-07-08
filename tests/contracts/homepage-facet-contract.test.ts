import { describe, expect, it } from 'vitest';
import { productRepository } from '@/lib/repositories/product-repository';
import { hasCollectionSku } from '@/lib/utils/homepage-collection-filter';
import {
  buildFacetInheritanceMaps,
  collectFacetOptionValues,
  getFacetDefsForCategory,
  productMatchesFacetDef,
  productMatchesFacetSelections,
} from '@/lib/catalog/facet-config';
import { Product } from '@/types';

/**
 * FILTERI 2.0 na početnoj (posle brisanja /kategorije/*): početna gradi facet
 * sekcije nad kolekcijskim headerima (hasCollectionSku), a mape nasleđivanja
 * boja↔kolekcija nad CELOM kategorijom (headeri + boje) — isto kao nekadašnji
 * server listing. Ovi testovi zaključavaju da za ključne grupe postoje žive
 * opcije i da filtriranje headera tim opcijama daje rezultate (bez mrtvih
 * opcija na početnoj).
 */

async function loadCategory(categoryId: string): Promise<{ all: Product[]; headers: Product[] }> {
  const all = await productRepository.findByCategory(categoryId);
  return { all, headers: all.filter(hasCollectionSku) };
}

describe('Homepage facet groups (facet-config nad kolekcijskim headerima)', () => {
  it('vinil: Klasa upotrebe nudi opciju 33 i njome se headeri stvarno sužavaju', async () => {
    const { all, headers } = await loadCategory('2');
    const defs = getFacetDefsForCategory('vinil');
    const klasaDef = defs.find((def) => def.param === 'klasa');
    expect(klasaDef).toBeDefined();

    const maps = buildFacetInheritanceMaps(all, defs);
    const options = collectFacetOptionValues(headers, klasaDef!, maps.klasa);
    expect(options).toContain('33');

    const matching = headers.filter((header) =>
      productMatchesFacetDef(header, ['33'], klasaDef!, { inheritMap: maps.klasa, missing: 'exclude' })
    );
    expect(matching.length).toBeGreaterThan(0);
    expect(matching.length).toBeLessThan(headers.length);

    // AND između grupa preko productMatchesFacetSelections daje isti skup za jednu grupu.
    const viaSelections = headers.filter((header) =>
      productMatchesFacetSelections(header, { klasa: ['33'] }, defs, maps, 'exclude')
    );
    expect(viaSelections.length).toBe(matching.length);
  });

  it('parket: Uzorak polaganja nudi Riblja kost sa živim rezultatima', async () => {
    const { all, headers } = await loadCategory('3');
    const defs = getFacetDefsForCategory('parket');
    const uzorakDef = defs.find((def) => def.param === 'uzorak');
    expect(uzorakDef).toBeDefined();

    const maps = buildFacetInheritanceMaps(all, defs);
    const options = collectFacetOptionValues(headers, uzorakDef!, maps.uzorak);
    expect(options).toContain('Riblja kost');

    const matching = headers.filter((header) =>
      productMatchesFacetDef(header, ['Riblja kost'], uzorakDef!, { inheritMap: maps.uzorak, missing: 'exclude' })
    );
    expect(matching.length).toBeGreaterThan(0);
  });

  it('laminat: Klasa nudi AC opcije nad headerima', async () => {
    const { all, headers } = await loadCategory('1');
    const defs = getFacetDefsForCategory('laminat');
    const klasaDef = defs.find((def) => def.param === 'klasa');
    expect(klasaDef).toBeDefined();

    const maps = buildFacetInheritanceMaps(all, defs);
    const options = collectFacetOptionValues(headers, klasaDef!, maps.klasa);
    expect(options.length).toBeGreaterThanOrEqual(2);
    expect(options).toContain('AC5');
  });

  it('boje bez podatka ostaju vidljive u include režimu (tab „Boje")', async () => {
    const { all } = await loadCategory('2');
    const colors = all.filter((product) => !hasCollectionSku(product));
    const defs = getFacetDefsForCategory('vinil');
    const maps = buildFacetInheritanceMaps(all, defs);

    const included = colors.filter((color) =>
      productMatchesFacetSelections(color, { klasa: ['33'] }, defs, maps, 'include')
    );
    const excluded = colors.filter((color) =>
      productMatchesFacetSelections(color, { klasa: ['33'] }, defs, maps, 'exclude')
    );
    // include nikad ne sme da prikaže manje od strikt režima.
    expect(included.length).toBeGreaterThanOrEqual(excluded.length);
    expect(included.length).toBeGreaterThan(0);
  });
});
