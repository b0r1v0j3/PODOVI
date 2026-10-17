import { describe, expect, it } from 'vitest';
import {
  DEFAULT_HOME_FILTER_URL_STATE,
  parseHomeFilterSelection,
  parseHomeFilterUrlState,
  parseHomeRangeValue,
  serializeHomeFilterSelection,
  serializeHomeFilterUrlState,
  type HomeFilterUrlState,
} from '@/lib/catalog/home-filter-url';
import type { HomeFacetSchemaEntry } from '@/lib/catalog/home-facet-schema';

describe('homepage filter URL state', () => {
  it('parses repeatable parameters, trims values and removes duplicates', () => {
    const params = new URLSearchParams();
    params.append('category', ' vinil ');
    params.append('category', 'lvt');
    params.append('category', 'vinil');
    params.append('brand', ' 3 ');
    params.append('type', ' vinil :: homogeni ');
    params.append('application', ' stambeni prostor ');
    params.append('collection', ' lvt :: Creation 55 ');
    params.append('facet', ' vinil :: KLASA :: 33 ');
    params.append('facet', 'vinil::klasa::33');
    params.append('thicknessMin', '2,5');
    params.append('thicknessMax', ' 8.0 ');
    params.append('tab', 'colors');
    params.append('sort', 'name');
    params.append('utm_source', 'newsletter');

    expect(parseHomeFilterUrlState(params)).toEqual({
      categories: ['vinil', 'lvt'],
      brands: ['3'],
      types: ['vinil::homogeni'],
      applications: ['stambeni prostor'],
      collections: ['lvt::creation 55'],
      facets: ['vinil::klasa::33'],
      thickness: [2.5, 8],
      tab: 'colors',
      sort: 'name',
    });
  });

  it('drops malformed values and uses the first valid repeated scalar', () => {
    const params = new URLSearchParams();
    params.append('category', '../vinil');
    params.append('category', 'LAMINAT');
    params.append('brand', '3<script>');
    params.append('type', 'vinil');
    params.append('type', 'vinil::::homogeni');
    params.append('collection', '::creation-55');
    params.append('facet', 'vinil::klasa');
    params.append('facet', 'vinil::bad param::33');
    params.append('application', '\u0000komercijalni');
    params.append('thicknessMin', '-2');
    params.append('thicknessMin', '2');
    params.append('thicknessMax', 'Infinity');
    params.append('thicknessMax', '12');
    params.append('tab', 'tiles');
    params.append('tab', 'colors');
    params.append('sort', 'newest');
    params.append('sort', 'price');

    expect(parseHomeFilterUrlState(params)).toEqual({
      categories: ['laminat'],
      brands: [],
      types: [],
      applications: [],
      collections: [],
      facets: [],
      thickness: [2, 12],
      tab: 'colors',
      sort: 'price',
    });
  });

  it('rejects incomplete or reversed thickness ranges', () => {
    expect(parseHomeFilterUrlState('?thicknessMin=3').thickness).toBeNull();
    expect(parseHomeFilterUrlState('?thicknessMin=9&thicknessMax=3').thickness).toBeNull();
    expect(parseHomeFilterUrlState('?thicknessMin=0&thicknessMax=1001').thickness).toBeNull();
  });

  it('serializes owned keys in canonical order with sorted unique values', () => {
    const state: HomeFilterUrlState = {
      categories: ['vinil', ' lvt ', 'vinil'],
      brands: ['8', '3', '8'],
      types: ['vinil::heterogeni', 'vinil::homogeni'],
      applications: ['stambeni prostor', 'komercijalni prostor'],
      collections: ['vinil::iQ Surface', 'lvt::Creation 55'],
      facets: ['vinil::ton::Tamna', 'vinil::klasa::33'],
      thickness: [2.5, 8],
      tab: 'colors',
      sort: 'price',
    };

    const serialized = serializeHomeFilterUrlState(state);

    expect(Array.from(serialized.entries())).toEqual([
      ['category', 'lvt'],
      ['category', 'vinil'],
      ['brand', '3'],
      ['brand', '8'],
      ['type', 'vinil::heterogeni'],
      ['type', 'vinil::homogeni'],
      ['application', 'komercijalni prostor'],
      ['application', 'stambeni prostor'],
      ['collection', 'lvt::creation 55'],
      ['collection', 'vinil::iq surface'],
      ['facet', 'vinil::klasa::33'],
      ['facet', 'vinil::ton::Tamna'],
      ['thicknessMin', '2.5'],
      ['thicknessMax', '8'],
      ['tab', 'colors'],
      ['sort', 'price'],
    ]);
  });

  it('replaces owned keys while preserving unrelated duplicate parameters', () => {
    const current = new URLSearchParams();
    current.append('utm_source', 'newsletter');
    current.append('tag', 'first');
    current.append('tag', 'second');
    current.append('category', 'parket');
    current.append('facet', 'parket::ton::Svetla');
    current.append('tab', 'colors');

    const serialized = serializeHomeFilterUrlState({ categories: ['lvt'] }, current);

    expect(Array.from(serialized.entries())).toEqual([
      ['utm_source', 'newsletter'],
      ['tag', 'first'],
      ['tag', 'second'],
      ['category', 'lvt'],
    ]);
  });

  it('default state clears only filter-owned keys and omits default tab/sort', () => {
    const current = '?category=vinil&brand=3&thicknessMin=2&thicknessMax=8&tab=colors&sort=name&q=hrast';
    const serialized = serializeHomeFilterUrlState(DEFAULT_HOME_FILTER_URL_STATE, current);

    expect(serialized.toString()).toBe('q=hrast');
    expect(parseHomeFilterUrlState(serialized)).toEqual({
      categories: [],
      brands: [],
      types: [],
      applications: [],
      collections: [],
      facets: [],
      thickness: null,
      tab: 'collections',
      sort: 'featured',
    });
  });

  it('round-trips a canonical state from a full URL string', () => {
    const state: HomeFilterUrlState = {
      categories: ['parket'],
      brands: ['6'],
      types: ['parket::troslojni'],
      applications: [],
      collections: ['parket::riblja kost'],
      facets: ['parket::uzorak::Riblja kost'],
      thickness: [10, 14],
      tab: 'collections',
      sort: 'featured',
    };
    const serialized = serializeHomeFilterUrlState(state, 'https://podovi.online/?ref=hero#catalog');

    expect(parseHomeFilterUrlState(serialized)).toEqual(state);
    expect(serialized.get('ref')).toBe('hero');
    expect(serialized.has('tab')).toBe(false);
    expect(serialized.has('sort')).toBe(false);
  });
});

describe('homepage filter selection URL (opšte grupe, opsezi, stari linkovi)', () => {
  const schema: HomeFacetSchemaEntry[] = [
    { id: 'category', param: 'category', scope: 'all', label: 'Kategorija', kind: 'list' },
    { id: 'brand', param: 'brand', scope: 'all', label: 'Brend', kind: 'list' },
    { id: 'namena', param: 'namena', scope: 'all', label: 'Namena prostora', kind: 'list' },
    { id: 'klasa', param: 'klasa', scope: 'all', label: 'Klasa upotrebe', kind: 'list' },
    { id: 'ugradnja', param: 'ugradnja', scope: 'all', label: 'Ugradnja', kind: 'list' },
    { id: 'uzorak', param: 'uzorak', scope: 'all', label: 'Uzorak polaganja', kind: 'list' },
    { id: 'grejanje', param: 'grejanje', scope: 'all', label: 'Podno grejanje', kind: 'boolean' },
    { id: 'debljina', param: 'debljina', scope: 'all', label: 'Debljina', kind: 'range', unit: 'mm' },
    { id: 'cena', param: 'cena', scope: 'all', label: 'Cena', kind: 'range', unit: 'RSD' },
    { id: 'vinil.type', param: 'type', scope: 'vinil', label: 'Tip vinila', kind: 'list' },
    { id: 'vinil.materijal', param: 'materijal', scope: 'vinil', label: 'Materijal', kind: 'list' },
    { id: 'lvt.collection', param: 'collection', scope: 'lvt', label: 'Kolekcije LVT-a', kind: 'list' },
    { id: 'laminat.ac', param: 'ac', scope: 'laminat', label: 'Otpornost na habanje (AC)', kind: 'list' },
  ];

  it('čita nove čitljive parametre i opsege', () => {
    const parsed = parseHomeFilterSelection(
      '?category=vinil&klasa=33&klasa=34&ugradnja=Klik&grejanje=1&debljina=2,5-5&cena=-2000&facet=vinil::materijal::SPC&type=vinil::homogeni&tab=colors',
      schema,
    );
    expect(parsed.selection).toEqual({
      lists: {
        category: ['vinil'],
        'vinil.type': ['homogeni'],
        'vinil.materijal': ['SPC'],
        klasa: ['33', '34'],
        ugradnja: ['Klik'],
        grejanje: ['1'],
      },
      ranges: { debljina: [2.5, 5], cena: [null, 2000] },
    });
    expect(parsed.tab).toBe('colors');
  });

  it('stari linkovi od 11.07.2026 i dalje rade (application, thicknessMin/Max, facet → opšta grupa, laminat AC)', () => {
    const parsed = parseHomeFilterSelection(
      '?category=vinil&category=laminat&facet=vinil%3A%3Aklasa%3A%3A33&facet=parket%3A%3Auzorak%3A%3ARiblja%20kost&facet=vinil%3A%3Agrejanje%3A%3A1&facet=laminat%3A%3Aklasa%3A%3AAC5&application=komercijalni%20prostor&thicknessMin=2&thicknessMax=3',
      schema,
    );
    expect(parsed.selection.lists).toEqual({
      category: ['vinil', 'laminat'],
      klasa: ['33'],
      uzorak: ['Riblja kost'],
      grejanje: ['1'],
      'laminat.ac': ['AC5'],
      namena: ['Komercijalni'],
    });
    expect(parsed.selection.ranges).toEqual({ debljina: [2, 3] });
  });

  it('upisuje uvek novi format, čuva nepovezane parametre i odbacuje neispravne opsege', () => {
    const params = serializeHomeFilterSelection({
      selection: {
        lists: { category: ['lvt'], 'lvt.collection': ['creation 55'], ugradnja: ['Lepljenje', 'Klik'], grejanje: ['1'] },
        ranges: { debljina: [2, null] },
      },
      tab: 'collections',
      sort: 'featured',
    }, schema, '?utm_source=mail&application=stambeni%20prostor&thicknessMin=1&thicknessMax=2&klasa=21');

    expect(Array.from(params.entries())).toEqual([
      ['utm_source', 'mail'],
      ['category', 'lvt'],
      ['collection', 'lvt::creation 55'],
      ['ugradnja', 'Klik'],
      ['ugradnja', 'Lepljenje'],
      ['grejanje', '1'],
      ['debljina', '2-'],
    ]);
    expect(parseHomeRangeValue('5-2')).toBeNull();
    expect(parseHomeRangeValue('-')).toBeNull();
    expect(parseHomeRangeValue('abc')).toBeNull();
    expect(parseHomeFilterSelection(params, schema).selection.ranges).toEqual({ debljina: [2, null] });
  });
});
