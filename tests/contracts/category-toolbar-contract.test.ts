import { describe, expect, it } from 'vitest';
import {
  buildCategoryQueryString,
  buildFilterRemovalHref,
  removeFilterValue,
  resolveCategorySortMode,
  sortCategoryProducts,
  type SortableCategoryProduct,
} from '@/components/CategoryToolbar';

function product(
  name: string,
  extra: { price?: number | null; createdAt?: Date | string | null } = {}
): SortableCategoryProduct {
  return { name, price: extra.price, createdAt: extra.createdAt };
}

describe('category toolbar contract', () => {
  describe('resolveCategorySortMode — validacija ?sort= parametra', () => {
    it('propušta poznate modove, nepoznato pada na preporuceno', () => {
      expect(resolveCategorySortMode('naziv', false)).toBe('naziv');
      expect(resolveCategorySortMode('najnovije', false)).toBe('najnovije');
      expect(resolveCategorySortMode('preporuceno', false)).toBe('preporuceno');
      expect(resolveCategorySortMode('nepoznato', true)).toBe('preporuceno');
      expect(resolveCategorySortMode(undefined, true)).toBe('preporuceno');
      expect(resolveCategorySortMode(null, true)).toBe('preporuceno');
    });

    it("'cena' važi samo kad bar jedan proizvod ima cenu", () => {
      expect(resolveCategorySortMode('cena', true)).toBe('cena');
      expect(resolveCategorySortMode('cena', false)).toBe('preporuceno');
    });
  });

  describe('sortCategoryProducts — server-side sortiranje listinga', () => {
    it("'preporuceno' zadržava postojeći redosled", () => {
      const products = [product('B'), product('A'), product('C')];
      expect(sortCategoryProducts(products, 'preporuceno').map((p) => p.name)).toEqual(['B', 'A', 'C']);
    });

    it("'naziv' sortira localeCompare('sr') — dijakritike posle osnovnog slova", () => {
      const products = [product('Šampanj'), product('Sena'), product('Čempres'), product('Ceder')];
      expect(sortCategoryProducts(products, 'naziv').map((p) => p.name)).toEqual([
        'Ceder',
        'Čempres',
        'Sena',
        'Šampanj',
      ]);
    });

    it("'cena' sortira rastuće, proizvodi bez cene idu na kraj (stabilno)", () => {
      const products = [
        product('Bez cene 1'),
        product('Skup', { price: 4500 }),
        product('Bez cene 2', { price: 0 }),
        product('Jeftin', { price: 1200 }),
        product('Bez cene 3', { price: null }),
      ];
      expect(sortCategoryProducts(products, 'cena').map((p) => p.name)).toEqual([
        'Jeftin',
        'Skup',
        'Bez cene 1',
        'Bez cene 2',
        'Bez cene 3',
      ]);
    });

    it("'najnovije' sortira createdAt opadajuće i podnosi string datume", () => {
      const products = [
        product('Stariji', { createdAt: new Date('2024-01-01') }),
        product('Najnoviji', { createdAt: '2026-06-01T00:00:00.000Z' }),
        product('Bez datuma', { createdAt: null }),
        product('Srednji', { createdAt: new Date('2025-05-05') }),
      ];
      expect(sortCategoryProducts(products, 'najnovije').map((p) => p.name)).toEqual([
        'Najnoviji',
        'Srednji',
        'Stariji',
        'Bez datuma',
      ]);
    });

    it('ne mutira ulazni niz', () => {
      const products = [product('B', { price: 2 }), product('A', { price: 1 })];
      sortCategoryProducts(products, 'cena');
      expect(products.map((p) => p.name)).toEqual(['B', 'A']);
    });

    it("'naziv' sortira po prikaznom imenu preko getName (strip brend prefiksa iz DB imena)", () => {
      // DB imena delom nose brend prefiks ("Gerflor Creation 30"), kartice ga skidaju —
      // sort mora da prati ono što korisnik vidi.
      const products = [
        product('Gerflor Creation 30'),
        product('Deal SPC 30'),
        product('Essence'),
      ];
      const stripBrand = (p: SortableCategoryProduct) => p.name.replace(/^Gerflor /, '');
      expect(sortCategoryProducts(products, 'naziv', stripBrand).map((p) => p.name)).toEqual([
        'Gerflor Creation 30',
        'Deal SPC 30',
        'Essence',
      ]);
    });
  });

  describe('removeFilterValue — uklanjanje jedne vrednosti iz viševrednosnog parametra', () => {
    it('uklanja samo ciljanu vrednost, ostale vrednosti i parametri ostaju', () => {
      const params = { thickness: '2.00,2.50,3.00', brands: '3,11', sort: 'naziv' };
      const next = removeFilterValue(params, 'thickness', '2.50');
      expect(next.thickness).toBe('2.00,3.00');
      expect(next.brands).toBe('3,11');
      expect(next.sort).toBe('naziv');
    });

    it('briše parametar kad se ukloni poslednja vrednost', () => {
      const next = removeFilterValue({ brands: '3', sort: 'cena' }, 'brands', '3');
      expect(next.brands).toBeUndefined();
      expect(next.sort).toBe('cena');
    });

    it('bez vrednosti briše ceo parametar (jednovrednosni filteri poput type/safety)', () => {
      const next = removeFilterValue({ type: 'homogeni', thickness: '2.00' }, 'type');
      expect(next.type).toBeUndefined();
      expect(next.thickness).toBe('2.00');
    });

    it('nepostojeća vrednost ne menja parametar', () => {
      const next = removeFilterValue({ collections: 'Creation 30,SAGA²' }, 'collections', 'Creation 55');
      expect(next.collections).toBe('Creation 30,SAGA²');
    });
  });

  describe('buildCategoryQueryString + buildFilterRemovalHref — URL čipa', () => {
    it('preskače prazne/undefined parametre i vraća prazan string bez parametara', () => {
      expect(buildCategoryQueryString({})).toBe('');
      expect(buildCategoryQueryString({ brands: undefined, search: '' })).toBe('');
      expect(buildCategoryQueryString({ brands: '3' })).toBe('?brands=3');
    });

    it('čip za jednu vrednost viševrednosnog parametra čuva ostale vrednosti i sort', () => {
      const href = buildFilterRemovalHref(
        '/kategorije/lvt',
        { collections: 'Creation 30,SAGA²', sort: 'cena' },
        'collections',
        'Creation 30'
      );
      const url = new URL(`https://www.podovi.online${href}`);
      expect(url.pathname).toBe('/kategorije/lvt');
      expect(url.searchParams.get('collections')).toBe('SAGA²');
      expect(url.searchParams.get('sort')).toBe('cena');
    });

    it('uklanjanje poslednje vrednosti vraća čist basePath kad nema drugih parametara', () => {
      expect(buildFilterRemovalHref('/kategorije/laminat', { thickness: '8.00' }, 'thickness', '8.00')).toBe(
        '/kategorije/laminat'
      );
    });

    it('jednovrednosni čip (npr. Tip vinila) briše ceo parametar a filtere ostavlja', () => {
      const href = buildFilterRemovalHref(
        '/kategorije/vinil',
        { type: 'homogeni', thickness: '2.00,3.00', sort: 'najnovije' },
        'type'
      );
      const url = new URL(`https://www.podovi.online${href}`);
      expect(url.searchParams.get('type')).toBeNull();
      expect(url.searchParams.get('thickness')).toBe('2.00,3.00');
      expect(url.searchParams.get('sort')).toBe('najnovije');
    });
  });
});
