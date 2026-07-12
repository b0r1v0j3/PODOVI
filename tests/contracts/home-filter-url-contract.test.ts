import { describe, expect, it } from 'vitest';
import {
  DEFAULT_HOME_FILTER_URL_STATE,
  parseHomeFilterUrlState,
  serializeHomeFilterUrlState,
  type HomeFilterUrlState,
} from '@/lib/catalog/home-filter-url';

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
