import { describe, expect, it } from 'vitest';
import { categoryRepository } from '@/lib/repositories/category-repository';
import { productRepository } from '@/lib/repositories/product-repository';
import { brandRepository } from '@/lib/repositories/brand-repository';
import { hasCollectionSku } from '@/lib/utils/homepage-collection-filter';
import { buildHomeCatalogItems, buildHomeFacetSchema, type HomeCatalogItem } from '@/lib/catalog/home-catalog-index';
import type { HomeFacetSchemaEntry } from '@/lib/catalog/home-facet-schema';
import {
  EMPTY_HOME_SELECTION,
  evaluateHomeFilters,
  pruneHomeSelection,
  setHomeRange,
  toggleHomeListValue,
  type HomeEngineItem,
  type HomeEngineOptions,
  type HomeFilterSelection,
} from '@/lib/catalog/home-filter-engine';

/**
 * Filter engine početne strane: brojač uz opciju mora biti TAČNO broj rezultata
 * posle izbora te opcije (SC-002), nad celim katalogom i u kombinacijama.
 */

async function loadCatalog() {
  const categories = await categoryRepository.findAll();
  const brands = await brandRepository.findAll();
  const items: HomeCatalogItem[] = [];
  const sources: Parameters<typeof buildHomeFacetSchema>[0] = [];
  for (const category of categories) {
    const products = await productRepository.findByCategory(category.id);
    const collections = products.filter(hasCollectionSku);
    const categoryItems = buildHomeCatalogItems(category.slug, products, collections.length > 0 ? collections : products);
    if (categoryItems.length === 0) continue;
    items.push(...categoryItems);
    sources.push({ slug: category.slug, name: category.name, items: categoryItems, products });
  }
  const schema = buildHomeFacetSchema(sources);
  const options: HomeEngineOptions = {
    missing: 'exclude',
    categories: categories.map((category) => ({ slug: category.slug, name: category.name })),
    brandNames: Object.fromEntries(brands.map((brand) => [brand.id, brand.name])),
  };
  return { items, schema, options };
}

function expectCountsEqualResults(items: HomeEngineItem[], schema: HomeFacetSchemaEntry[], selection: HomeFilterSelection, options: HomeEngineOptions) {
  const evaluation = evaluateHomeFilters(items, schema, selection, options);
  let checked = 0;
  for (const group of evaluation.groups) {
    if (group.options) {
      for (const option of group.options) {
        if (option.selected) continue;
        const single = { ...selection, lists: { ...selection.lists, [group.entry.id]: [option.value] } };
        const results = evaluateHomeFilters(items, schema, pruneHomeSelection(single, schema), options).results;
        const inScope = group.entry.scope === 'all' ? results : results.filter((item) => item.categorySlug === group.entry.scope);
        expect({ group: group.entry.id, value: option.value, count: inScope.length }).toEqual({ group: group.entry.id, value: option.value, count: option.count });
        checked += 1;
      }
    }
    if (group.range) {
      for (const preset of group.range.presets) {
        const withPreset = setHomeRange(selection, group.entry.id, [preset.min ?? null, preset.max ?? null]);
        const results = evaluateHomeFilters(items, schema, withPreset, options).results;
        const inScope = group.entry.scope === 'all' ? results : results.filter((item) => item.categorySlug === group.entry.scope);
        expect({ group: group.entry.id, preset: preset.label, count: inScope.length }).toEqual({ group: group.entry.id, preset: preset.label, count: preset.count });
        checked += 1;
      }
    }
  }
  return { evaluation, checked };
}

describe('home filter engine — ceo katalog', () => {
  it('bez izabrane kategorije nudi bar 12 grupa sa stvarnim vrednostima (SC-001) i tačne brojače (SC-002)', async () => {
    const { items, schema, options } = await loadCatalog();
    const { evaluation, checked } = expectCountsEqualResults(items, schema, EMPTY_HOME_SELECTION, options);
    expect(evaluation.results.length).toBe(items.length);
    const groupsWithValues = evaluation.groups.filter((group) => (group.options ? group.options.length >= 1 : true));
    expect(groupsWithValues.length).toBeGreaterThanOrEqual(12);
    expect(checked).toBeGreaterThan(50);
  }, 120_000);

  it('brojači ostaju tačni u kombinacijama opštih i kategorijskih grupa', async () => {
    const { items, schema, options } = await loadCatalog();
    let selection = toggleHomeListValue(EMPTY_HOME_SELECTION, 'ugradnja', 'Lepljenje');
    expectCountsEqualResults(items, schema, selection, options);

    selection = toggleHomeListValue(selection, 'category', 'vinil');
    const vinil = expectCountsEqualResults(items, schema, selection, options).evaluation;
    expect(vinil.groups.map((group) => group.entry.id)).toEqual(expect.arrayContaining(['vinil.type', 'vinil.collection']));
    expect(vinil.results.every((item) => item.categorySlug === 'vinil')).toBe(true);

    selection = setHomeRange(selection, 'debljina', [2, 3]);
    expectCountsEqualResults(items, schema, selection, options);
  }, 120_000);
});

describe('home filter engine — pravila', () => {
  const schema: HomeFacetSchemaEntry[] = [
    { id: 'category', param: 'category', scope: 'all', label: 'Kategorija', kind: 'list' },
    { id: 'brand', param: 'brand', scope: 'all', label: 'Brend', kind: 'list' },
    { id: 'ugradnja', param: 'ugradnja', scope: 'all', label: 'Ugradnja', kind: 'list' },
    { id: 'grejanje', param: 'grejanje', scope: 'all', label: 'Podno grejanje', kind: 'boolean' },
    { id: 'debljina', param: 'debljina', scope: 'all', label: 'Debljina', kind: 'range', unit: 'mm', presets: [{ label: 'do 3 mm', max: 3 }] },
    { id: 'vinil.materijal', param: 'materijal', scope: 'vinil', label: 'Materijal', kind: 'list' },
  ];
  const items: HomeEngineItem[] = [
    { id: '1', categorySlug: 'vinil', brandId: 'a', fv: { ugradnja: ['Klik'], 'vinil.materijal': ['SPC'], grejanje: ['Da'] }, nv: { debljina: [2, 2] } },
    { id: '2', categorySlug: 'vinil', brandId: 'b', fv: { ugradnja: ['Lepljenje'], 'vinil.materijal': ['LVT'] }, nv: { debljina: [4, 4] } },
    { id: '3', categorySlug: 'parket', brandId: 'a', fv: { ugradnja: ['Klik', 'Lepljenje'] }, nv: { debljina: [10, 14] } },
    { id: '4', categorySlug: 'parket', brandId: 'b', fv: {}, nv: {} },
  ];
  const options: HomeEngineOptions = {
    missing: 'exclude',
    categories: [{ slug: 'vinil', name: 'Vinil' }, { slug: 'parket', name: 'Parket' }],
    brandNames: { a: 'A', b: 'B' },
  };
  const ids = (selection: HomeFilterSelection, missing: 'exclude' | 'include' = 'exclude') =>
    evaluateHomeFilters(items, schema, selection, { ...options, missing }).results.map((item) => item.id);

  it('ILI unutar grupe, I između grupa', () => {
    const klik = toggleHomeListValue(EMPTY_HOME_SELECTION, 'ugradnja', 'Klik');
    expect(ids(klik)).toEqual(['1', '3']);
    expect(ids(toggleHomeListValue(klik, 'ugradnja', 'Lepljenje'))).toEqual(['1', '2', '3']);
    expect(ids(toggleHomeListValue(klik, 'brand', 'b'))).toEqual([]);
    expect(ids(toggleHomeListValue(klik, 'brand', 'a'))).toEqual(['1', '3']);
  });

  it('kategorijska grupa ne isključuje proizvode druge kategorije', () => {
    let selection = toggleHomeListValue(EMPTY_HOME_SELECTION, 'category', 'vinil');
    selection = toggleHomeListValue(selection, 'category', 'parket');
    selection = toggleHomeListValue(selection, 'vinil.materijal', 'SPC');
    expect(ids(selection)).toEqual(['1', '3', '4']);
  });

  it('skidanje kategorije briše samo njene filtere; opšti ostaju', () => {
    let selection = toggleHomeListValue(EMPTY_HOME_SELECTION, 'category', 'vinil');
    selection = toggleHomeListValue(selection, 'vinil.materijal', 'SPC');
    selection = toggleHomeListValue(selection, 'ugradnja', 'Klik');
    const pruned = pruneHomeSelection(toggleHomeListValue(selection, 'category', 'vinil'), schema);
    expect(pruned.lists).toEqual({ ugradnja: ['Klik'] });
  });

  it('opseg radi preklapanjem intervala; include ostavlja stavke bez podatka', () => {
    const thin = setHomeRange(EMPTY_HOME_SELECTION, 'debljina', [null, 3]);
    expect(ids(thin)).toEqual(['1']);
    expect(ids(setHomeRange(EMPTY_HOME_SELECTION, 'debljina', [12, 20]))).toEqual(['3']);
    expect(ids(thin, 'include')).toEqual(['1', '4']);
    const evaluation = evaluateHomeFilters(items, schema, EMPTY_HOME_SELECTION, { ...options, missing: 'include' });
    const klik = evaluation.groups.find((group) => group.entry.id === 'ugradnja')!.options!.find((option) => option.value === 'Klik')!;
    // u include režimu brojač uključuje i stavku bez podatka — jer bi se i ona prikazala
    expect(klik.count).toBe(ids(toggleHomeListValue(EMPTY_HOME_SELECTION, 'ugradnja', 'Klik'), 'include').length);
  });

  it('da/ne grupa i čipovi sa ljudskim nazivima', () => {
    let selection = toggleHomeListValue(EMPTY_HOME_SELECTION, 'grejanje', '1');
    selection = setHomeRange(selection, 'debljina', [2, 5]);
    const evaluation = evaluateHomeFilters(items, schema, selection, options);
    expect(evaluation.results.map((item) => item.id)).toEqual(['1']);
    expect(evaluation.chips.map((chip) => chip.label)).toEqual(['Podno grejanje', 'Debljina: 2–5 mm']);
  });
});
