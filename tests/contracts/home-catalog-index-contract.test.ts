import { describe, expect, it } from 'vitest';
import type { Product } from '@/types';
import { categoryRepository } from '@/lib/repositories/category-repository';
import { productRepository } from '@/lib/repositories/product-repository';
import { hasCollectionSku } from '@/lib/utils/homepage-collection-filter';
import {
  canonicalizeFacetValue,
  deriveNamena,
  getUniversalFacetDefs,
  parseFireClasses,
  parseFloorFormat,
  parseNumericIntervals,
  type CategoryFacetDef,
} from '@/lib/catalog/facet-config';
import {
  buildHomeCatalogItems,
  buildHomeFacetSchema,
  type HomeCatalogItem,
} from '@/lib/catalog/home-catalog-index';
import { EMPTY_HOME_SELECTION, evaluateHomeFilters, toggleHomeListValue } from '@/lib/catalog/home-filter-engine';

/**
 * Indeks kataloga za početnu (spec 001-filteri-pocetna-brzina): kanonske
 * vrednosti iz stvarnih specifikacija, nasleđivanje kolekcija↔boja, sažete
 * stavke i automatsko uključivanje novih brendova/kategorija.
 */

function universal(param: string): CategoryFacetDef {
  const def = getUniversalFacetDefs().find((candidate) => candidate.param === param);
  if (!def) throw new Error(`missing universal facet ${param}`);
  return def;
}

function product(partial: Partial<Product> & { id: string; specs: Product['specs'] }): Product {
  return {
    name: partial.id,
    slug: partial.id,
    sku: `GER-${partial.id}`,
    categoryId: '2',
    brandId: '6',
    description: 'Dugačak opis koji ne sme da stigne do pregledača.',
    shortDescription: 'Kratak opis',
    images: [{ id: 'a', url: 'https://nnjmrfwepylrheykalik.supabase.co/storage/v1/object/public/product-images/a.jpg', alt: '', isPrimary: true, order: 0 }],
    price: undefined,
    inStock: true,
    featured: false,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    documents: [{ title: 'PDF', url: 'https://example.com/a.pdf' }] as unknown as Product['documents'],
    ...partial,
  } as Product;
}

describe('home catalog index — kanonske vrednosti', () => {
  it('svodi načine ugradnje iz svih izvora na isti skup', () => {
    const def = universal('ugradnja');
    expect(canonicalizeFacetValue('Interlocking (klik), bez lepka', def)).toEqual(['Klik']);
    expect(canonicalizeFacetValue('Loose lay / Connect', def)).toEqual(['Loose-lay', 'Klik']);
    expect(canonicalizeFacetValue('Lepak dole, Plivajući', def)).toEqual(['Lepljenje', 'Plivajuće']);
    expect(canonicalizeFacetValue('Glue down', def)).toEqual(['Lepljenje']);
    expect(canonicalizeFacetValue('5G, LOC, 2G, Pero+utor', def)).toEqual(['Klik', 'Pero i utor']);
    expect(canonicalizeFacetValue('po mogućstvu u kanal odgovarajuće dubine', def)).toEqual(['U kanal']);
    expect(canonicalizeFacetValue('Standardna instalacija (bez uzemljenja)', def)).toEqual([]);
  });

  it('čita klasu upotrebe, format, boju i požarnu klasu bez izmišljanja', () => {
    expect(canonicalizeFacetValue('Klasa 34/43', universal('klasa'))).toEqual(['34', '43']);
    expect(canonicalizeFacetValue('33 Heavy', universal('klasa'))).toEqual(['33']);
    expect(parseFloorFormat('Rolna 2x23m')).toEqual(['Rolna']);
    expect(parseFloorFormat('Daske i ploče')).toEqual(['Daska', 'Ploča']);
    expect(parseFloorFormat('Skirting 2,5 m')).toEqual([]);
    expect(canonicalizeFacetValue('siva | crna | braon', universal('boja'))).toEqual(['Siva', 'Crna', 'Braon']);
    expect(canonicalizeFacetValue('Braon, Hrast', universal('boja'))).toEqual(['Braon']);
    expect(parseFireClasses('Bfl-s1 (EN 13501-1)')).toEqual(['Bfl-s1']);
    expect(parseFireClasses('Cfl-s1, Dfl-s1')).toEqual(['Cfl-s1', 'Dfl-s1']);
    expect(parseFireClasses('Klasa DS (µ ≥ 0,30)')).toEqual([]);
  });

  it('parsira numeričke vrednosti kao intervale (zarez-decimala, liste, rasponi, dB)', () => {
    const mm = universal('debljina').range!;
    const wear = universal('habanje').range!;
    const db = universal('zvuk').range!;
    expect(parseNumericIntervals('2,5, 3,5', wear)).toEqual([[2.5, 2.5], [3.5, 3.5]]);
    expect(parseNumericIntervals('0.10 -1.2mm', wear)).toEqual([[0.1, 1.2]]);
    expect(parseNumericIntervals('2.0 / 3.0 mm', mm)).toEqual([[2, 2], [3, 3]]);
    expect(parseNumericIntervals('10, 13, 15', mm)).toEqual([[10, 10], [13, 13], [15, 15]]);
    expect(parseNumericIntervals('5200000 g/m²', mm)).toEqual([]);
    expect(parseNumericIntervals('-19 dB', db)).toEqual([[19, 19]]);
    expect(parseNumericIntervals('Bez podloge', db)).toEqual([]);
    expect(parseNumericIntervals('Kroz celu debljinu', wear)).toEqual([]);
  });

  it('izvodi Namenu iz klase upotrebe i eksplicitne primene, a ne iz opisa', () => {
    expect(deriveNamena({ specs: [{ key: 'komercijalna_klasifikacija', value: '34 Very Heavy' }] })).toEqual(['Komercijalni']);
    expect(deriveNamena({ specs: [{ key: 'rezidencijalna_klasifikacija', value: '23 Teška' }, { key: 'industrijska_klasifikacija', value: '43 Teška' }] }))
      .toEqual(['Stambeni', 'Industrijski']);
    expect(deriveNamena({ specs: [{ key: 'primena', value: 'Uređenje eksterijera' }] })).toEqual(['Spoljašnji']);
    expect(deriveNamena({ specs: [{ key: 'namena', value: 'Home, School, Office, Library' }] })).toEqual(['Stambeni', 'Komercijalni']);
    // Reč „stan" u opisu (npr. „standard") više ne pravi stambenu namenu.
    expect(deriveNamena({ specs: [{ key: 'opis', value: 'standardni objekti' }] })).toEqual([]);
  });

  it('prenosi vrednosti grupe bez mape kakve jesu (npr. SCHÖNOX „Program")', () => {
    const programDef: CategoryFacetDef = { param: 'program', label: 'Program', specKeys: ['program'] };
    expect(canonicalizeFacetValue('Podovi, Keramika', programDef)).toEqual(['Podovi', 'Keramika']);
  });
});

describe('home catalog index — nasleđivanje i sažete stavke', () => {
  const header = product({ id: 'kolekcija-x', name: 'Gerflor Kolekcija X', specs: [{ key: 'collection', label: 'Kolekcija', value: 'Kolekcija X' }, { key: 'thickness', label: 'Debljina', value: '2 mm' }] });
  const color = product({
    id: 'kolekcija-x-boja-1',
    sku: 'COLOR-1',
    name: 'Boja 1',
    specs: [
      { key: 'collection', label: 'Kolekcija', value: 'Kolekcija X' },
      { key: 'classification_commercial_iso_10874', label: 'Klasa (komercijalna)', value: '33 Heavy' },
    ],
  });

  it('kolekcija bez sopstvene klase nasleđuje klasu svojih boja i obrnuto (debljina)', () => {
    const [headerItem] = buildHomeCatalogItems('vinil', [header, color], [header]);
    const [colorItem] = buildHomeCatalogItems('vinil', [header, color], [color], 'color');
    expect(headerItem.fv.klasa).toEqual(['33']);
    expect(headerItem.fv.namena).toEqual(['Komercijalni']);
    expect(colorItem.nv.debljina).toEqual([2, 2]);
  });

  it('sažeta stavka nosi samo polja kartice (bez opisa, dokumenata i punih specifikacija)', () => {
    const [item] = buildHomeCatalogItems('vinil', [header, color], [header]);
    expect(item.description).toBeUndefined();
    expect(item.shortDescription).toBeUndefined();
    expect((item as Product).documents).toBeUndefined();
    expect(item.sku).toBeUndefined();
    expect(item.specs).toEqual([{ key: 'collection', value: 'Kolekcija X' }]);
    expect(item.images.every((image) => Object.keys(image).every((key) => key === 'url' || key === 'alt'))).toBe(true);
    expect(item.href).toMatch(/^\/proizvodi\//);
    expect(item.images.length).toBeLessThanOrEqual(2);
    expect(item.compareSlim).toBe(true);
  });
});

describe('home catalog index — pribor (tip na srpskom, bez lažnih kolekcija)', () => {
  it('legacy pribor dobija srpski tip iz tip_proizvoda ili iz naziva, a Tip formata ga ne prepisuje', async () => {
    const products = await productRepository.findByCategory('15');
    const legacy = products.filter((item) => item.sku?.startsWith('PRIBOR-'));
    expect(legacy.length).toBeGreaterThan(5);
    const items = buildHomeCatalogItems('pribor', products, products);
    const schema = buildHomeFacetSchema([{ slug: 'pribor', name: 'Pribor', items, products }]);
    const typeEntry = schema.find((entry) => entry.id === 'pribor.type');
    const typeLabels = new Set(Object.values(typeEntry?.optionLabels || {}));
    for (const expected of ['Pribor za varenje', 'Podloge', 'Nega i čišćenje', 'Pomoćni pribor', 'Lepkovi za parket', 'Lepkovi za podove']) {
      expect(typeLabels).toContain(expected);
    }
    expect(typeLabels).not.toContain('Rolna');
    expect(typeLabels).not.toContain('Welding');
    const legacyItems = items.filter((item) => legacy.some((product) => product.id === item.id));
    expect(legacyItems.every((item) => (item.fv['pribor.type'] || []).length === 1)).toBe(true);
    // Svaka stavka pribora je „svoja kolekcija" — grupa Kolekcije ne bi ništa grupisala.
    expect(schema.some((entry) => entry.id === 'pribor.collection')).toBe(false);
  });
});

describe('home catalog index — novi brend i nova kategorija ulaze sami (US4)', () => {
  it('šema i engine prikazuju novi brend/kategoriju bez izmene filter koda', () => {
    const newProducts = [
      product({ id: 'n1', brandId: '99', categoryId: '99', sku: 'X-1', specs: [{ key: 'type', label: 'Tip', value: 'Podloge' }, { key: 'nacin_ugradnje', label: 'Način ugradnje', value: 'Lepljenje' }], availability: 'on_request' } as Partial<Product> & { id: string; specs: Product['specs'] }),
      product({ id: 'n2', brandId: '99', categoryId: '99', sku: 'X-2', specs: [{ key: 'type', label: 'Tip', value: 'Lepkovi' }, { key: 'nacin_ugradnje', label: 'Način ugradnje', value: 'Klik' }], availability: 'in_stock' } as Partial<Product> & { id: string; specs: Product['specs'] }),
      product({ id: 'n3', brandId: '6', categoryId: '99', sku: 'X-3', specs: [{ key: 'type', label: 'Tip', value: 'Lepkovi' }] }),
    ];
    const items = buildHomeCatalogItems('nova-grupa', newProducts, newProducts);
    const schema = buildHomeFacetSchema([{ slug: 'nova-grupa', name: 'Nova grupa', items, products: newProducts }]);
    expect(schema.map((entry) => entry.id)).toEqual(expect.arrayContaining(['category', 'brand', 'ugradnja', 'dostupnost', 'nova-grupa.type']));

    const options = { missing: 'exclude' as const, categories: [{ slug: 'nova-grupa', name: 'Nova grupa' }, { slug: 'vinil', name: 'Vinil' }], brandNames: { '99': 'NoviBrend' } };
    const selected = evaluateHomeFilters(items, schema, toggleHomeListValue(EMPTY_HOME_SELECTION, 'category', 'nova-grupa'), options);
    const typeGroup = selected.groups.find((group) => group.entry.id === 'nova-grupa.type');
    expect(typeGroup?.options?.map((option) => `${option.label} (${option.count})`)).toEqual(['Lepkovi (2)', 'Podloge (1)']);
    const base = evaluateHomeFilters(items, schema, EMPTY_HOME_SELECTION, options);
    expect(base.groups.find((group) => group.entry.id === 'brand')?.options).toEqual([
      expect.objectContaining({ label: 'NoviBrend', count: 2 }),
      expect.objectContaining({ label: 'Brend 6', count: 1 }),
    ]);
    expect(base.groups.find((group) => group.entry.id === 'dostupnost')?.options?.map((option) => option.label)).toEqual(['Na stanju', 'Na upit']);
  });
});

describe('home catalog index — ceo katalog (SC-003: nema vrednosti van podataka)', () => {
  it('svaka opcija opšte liste sa fiksnim redosledom pripada kanonskom skupu, a opsezi su u granicama', async () => {
    const categories = await categoryRepository.findAll();
    const items: HomeCatalogItem[] = [];
    for (const category of categories) {
      const products = await productRepository.findByCategory(category.id);
      const collections = products.filter(hasCollectionSku);
      items.push(...buildHomeCatalogItems(category.slug, products, collections.length > 0 ? collections : products));
    }
    expect(items.length).toBeGreaterThan(100);

    for (const def of getUniversalFacetDefs()) {
      for (const item of items) {
        if (def.range) {
          const flat = item.nv[def.param] || [];
          for (const value of flat) {
            expect(value).toBeGreaterThan(0);
            if (def.range.max !== undefined) expect(value).toBeLessThanOrEqual(def.range.max);
          }
          continue;
        }
        if (!def.order) continue;
        for (const value of item.fv[def.param] || []) {
          expect(def.order).toContain(value);
        }
      }
    }

    expect(items.some((item) => 'description' in item || 'documents' in item)).toBe(false);
  }, 60_000);
});
