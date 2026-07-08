import { describe, expect, it } from 'vitest';
import {
  buildFacetInheritanceMaps,
  canonicalizeFacetValue,
  collectFacetOptionValues,
  facetChipLabel,
  facetOptionLabel,
  getFacetDefsForCategory,
  getFacetValues,
  getProductFacetValues,
  normalizeCollectionKey,
  parseFacetSelectionsFromParams,
  parseRClasses,
  parseUsageClasses,
  productMatchesFacetSelections,
  type CategoryFacetDef,
} from '@/lib/catalog/facet-config';
import { productRepository } from '@/lib/repositories/product-repository';

function facetDef(categorySlug: string, param: string): CategoryFacetDef {
  const def = getFacetDefsForCategory(categorySlug).find((d) => d.param === param);
  expect(def, `def ${categorySlug}/${param} mora da postoji`).toBeDefined();
  return def!;
}

// Ogledalo hasCollectionSku prefiksa iz app/kategorije/[slug]/page.tsx za kategorije u testu.
function isCollectionHeader(sku?: string | null): boolean {
  const prefixes = ['GER-', 'TARKETT-', 'PODOVI-COLLECTION-', 'WOLFLOR-VINYL-', 'VINIL-', 'LAM-', 'PARKET-', 'LINOLEUM-'];
  return prefixes.some((prefix) => sku?.startsWith(prefix)) ?? false;
}

describe('facet-config contract (Filteri 2.0 — Faza 1b)', () => {
  describe('kanonizacija — klasa upotrebe', () => {
    it('parsira sve istorijske oblike u niz klasa', () => {
      expect(parseUsageClasses('Klasa 34/43')).toEqual(['34', '43']);
      expect(parseUsageClasses('34 Very Heavy')).toEqual(['34']);
      expect(parseUsageClasses('23-31')).toEqual(['23', '31']);
      expect(parseUsageClasses('42 Opšta, 43 Teška')).toEqual(['42', '43']);
      expect(parseUsageClasses('22 / 22+ Domestic general medium / Domestic general')).toEqual(['22']);
      expect(parseUsageClasses('31, 33, 32, 34').sort()).toEqual(['31', '32', '33', '34']);
      expect(parseUsageClasses('33')).toEqual(['33']);
    });

    it('vinil ?klasa= def kanonizuje preko istog parsera, sa prevodom i čipom', () => {
      const def = facetDef('vinil', 'klasa');
      expect(canonicalizeFacetValue('Klasa 34/43', def)).toEqual(['34', '43']);
      expect(facetOptionLabel(def, '33')).toBe('33 · lokal');
      expect(facetOptionLabel(def, '23')).toBe('23 · stan');
      expect(facetOptionLabel(def, '34')).toBe('34 · jak promet');
      expect(facetOptionLabel(def, '43')).toBe('43 · industrija');
      expect(facetChipLabel(def, '33')).toBe('Klasa 33');
    });

    it('laminat AC klasa: EN 13329 + ISO 10874 se slivaju u AC vrednosti („AC5 · 33")', () => {
      const def = facetDef('laminat', 'klasa');
      expect(canonicalizeFacetValue('AC5', def)).toEqual(['AC5']);
      expect(canonicalizeFacetValue('33 Heavy', def)).toEqual(['AC5']);
      expect(canonicalizeFacetValue('32 General', def)).toEqual(['AC4']);
      expect(canonicalizeFacetValue('23 Teška', def)).toEqual([]); // rezidencijalna — nije AC skala
      expect(facetOptionLabel(def, 'AC5')).toBe('AC5 · 33');
      expect(facetChipLabel(def, 'AC5')).toBe('Klasa AC5');
    });
  });

  describe('kanonizacija — nijansa (ton)', () => {
    it('splituje CSV i zadržava Beljeni kao zasebnu vrednost', () => {
      const def = facetDef('parket', 'ton');
      expect(canonicalizeFacetValue('Srednja', def)).toEqual(['Srednja']);
      expect(canonicalizeFacetValue('Beljeni, Svetla', def).sort()).toEqual(['Beljeni', 'Svetla']);
      expect(canonicalizeFacetValue('Srednja, Tamna, Svetla, Beljeni', def).sort()).toEqual(
        ['Beljeni', 'Srednja', 'Svetla', 'Tamna']
      );
    });

    it('odbacuje đubre vrednosti (engleski nazivi dekora) umesto da pravi opcije', () => {
      const def = facetDef('parket', 'ton');
      expect(canonicalizeFacetValue('Cappuccino-B', def)).toEqual([]);
      expect(canonicalizeFacetValue('Nordic White-B', def)).toEqual([]);
    });
  });

  describe('kanonizacija — ugradnja (dupli ključevi + dupli rečnik)', () => {
    it('LVT rečnik: srpski i engleski oblici u isti kanonski skup', () => {
      const def = facetDef('lvt', 'ugradnja');
      expect(canonicalizeFacetValue('Lepljenje', def)).toEqual(['Lepljenje']);
      expect(canonicalizeFacetValue('Glue down', def)).toEqual(['Lepljenje']);
      expect(canonicalizeFacetValue('Click sistem', def)).toEqual(['Klik']);
      expect(canonicalizeFacetValue('Interlocking system', def)).toEqual(['Klik']);
      expect(canonicalizeFacetValue('Connect sistem', def)).toEqual(['Klik']);
      expect(canonicalizeFacetValue('Looselay', def)).toEqual(['Loose-lay']);
      expect(canonicalizeFacetValue('Loose-Lay', def)).toEqual(['Loose-lay']);
    });

    it('vinil: nacin_montaze/vrsta_spoja mapa sa multi-vrednostima', () => {
      const def = facetDef('vinil', 'ugradnja');
      expect(canonicalizeFacetValue('Plivajući', def)).toEqual(['Plivajuće']);
      expect(canonicalizeFacetValue('Lepak dole', def)).toEqual(['Lepljenje']);
      expect(canonicalizeFacetValue('Lepljenje/plivajuća ugradnja', def).sort()).toEqual(['Lepljenje', 'Plivajuće']);
      expect(canonicalizeFacetValue('Lepljenje, Samolepljiv', def).sort()).toEqual(['Lepljenje', 'Samolepljivo']);
      expect(canonicalizeFacetValue('Klik', def)).toEqual(['Klik']);
      expect(canonicalizeFacetValue('Bez', def)).toEqual([]); // 'Bez spoja' nije način ugradnje
    });

    it('parket: Pero+utor i T-Lock se kanonizuju', () => {
      const def = facetDef('parket', 'ugradnja');
      expect(canonicalizeFacetValue('Pero+utor', def)).toEqual(['Pero i utor']);
      expect(canonicalizeFacetValue('T-Lock', def)).toEqual(['Klik']);
    });
  });

  describe('kanonizacija — R-klasa (multi-split)', () => {
    it('splituje "R10, R9, R11" i odbacuje ne-R skale', () => {
      expect(parseRClasses('R10, R9, R11').sort()).toEqual(['R10', 'R11', 'R9']);
      expect(parseRClasses('R10/R11').sort()).toEqual(['R10', 'R11']);
      expect(parseRClasses('R12')).toEqual(['R12']);
      expect(parseRClasses('Klasa DS (µ ≥ 0,30)')).toEqual([]); // EN 13893 — ne mapira se u R
      expect(parseRClasses('LROS')).toEqual([]); // nejasan kod — van filtera
      const def = facetDef('vinil', 'rklasa');
      expect(canonicalizeFacetValue('R10, R9, R11', def).sort()).toEqual(['R10', 'R11', 'R9']);
    });
  });

  describe('kanonizacija — ostale grupe', () => {
    it('vinil dezen: HRAST→Drvo grupa, Stone/Mineral→Kamen, Sveobuhvatni→Uni', () => {
      const def = facetDef('vinil', 'dezen');
      expect(canonicalizeFacetValue('HRAST', def)).toEqual(['Drvo']);
      expect(canonicalizeFacetValue('Moderno drvo', def)).toEqual(['Drvo']);
      expect(canonicalizeFacetValue('Stone', def)).toEqual(['Kamen']);
      expect(canonicalizeFacetValue('BETON', def)).toEqual(['Beton']);
      expect(canonicalizeFacetValue('Sveobuhvatni', def)).toEqual(['Uni']);
      expect(canonicalizeFacetValue('HRAST, KAMEN, CERAMIC, BETON', def).sort()).toEqual(
        ['Beton', 'Drvo', 'Kamen', 'Keramika']
      );
    });

    it('vinil materijal: SPC/LVT/WPC iz vrsta_materijala', () => {
      const def = facetDef('vinil', 'materijal');
      expect(canonicalizeFacetValue('SPC vinil', def)).toEqual(['SPC']);
      expect(canonicalizeFacetValue('LVT vinil, SPC vinil, WPC vinil', def).sort()).toEqual(['LVT', 'SPC', 'WPC']);
    });

    it('podno grejanje: Primeren/Da (maksimum...)/Suitable → Da; boolean čip nosi labelu grupe', () => {
      const def = facetDef('vinil', 'grejanje');
      expect(canonicalizeFacetValue('Primeren', def)).toEqual(['Da']);
      expect(canonicalizeFacetValue('Da (maksimum 27°C)', def)).toEqual(['Da']);
      expect(canonicalizeFacetValue('Suitable (maximum 29°C)', def)).toEqual(['Da']);
      expect(canonicalizeFacetValue('Neprimeren', def)).toEqual(['Ne']);
      expect(facetChipLabel(def, '1')).toBe('Podno grejanje');
    });

    it('parket obrada: Proteco/Mat lakiran/UV uljen → Mat lak/Lak/Ulje', () => {
      const def = facetDef('parket', 'obrada');
      expect(canonicalizeFacetValue('Mat lakiran', def)).toEqual(['Mat lak']);
      expect(canonicalizeFacetValue('Proteco Natura', def)).toEqual(['Mat lak']);
      expect(canonicalizeFacetValue('Proteco Lak', def)).toEqual(['Lak']);
      expect(canonicalizeFacetValue('UV uljen', def)).toEqual(['Ulje']);
      expect(canonicalizeFacetValue('Proteco Natura / Proteco Lak', def).sort()).toEqual(['Lak', 'Mat lak']);
    });

    it('LVT format: Daska/Ploča iz haotičnog format polja', () => {
      const def = facetDef('lvt', 'format');
      expect(canonicalizeFacetValue('Daska 1200 x 200mm', def)).toEqual(['Daska']);
      expect(canonicalizeFacetValue('Plank 1219x229mm (48x9")', def)).toEqual(['Daska']);
      expect(canonicalizeFacetValue('XL', def)).toEqual(['Daska']); // Gerflor XL = XL daska
      expect(canonicalizeFacetValue('Xl Square Tile', def)).toEqual(['Ploča']);
      expect(canonicalizeFacetValue('Tile 665x665mm', def)).toEqual(['Ploča']);
      expect(canonicalizeFacetValue('Šestougaonik 333 x 385 mm', def)).toEqual(['Ploča']);
      expect(canonicalizeFacetValue('Daske i ploče', def).sort()).toEqual(['Daska', 'Ploča']);
    });

    it('otirači: __techem_top_category grupe sa spajanjem pod-linija', () => {
      const def = facetDef('otiraci', 'tip');
      expect(canonicalizeFacetValue('Aluminijumski otirači', def)).toEqual(['Aluminijumski otirači']);
      expect(canonicalizeFacetValue('Anodizovani aluminijumski otirači – Design', def)).toEqual(['Aluminijumski otirači']);
      expect(canonicalizeFacetValue('Trend Mats', def)).toEqual(['Unutrašnji otirači']);
      expect(canonicalizeFacetValue('Čelične rešetke', def)).toEqual(['Čelične rešetke']);
    });
  });

  describe('čitanje sa proizvoda — spec.key i specKeyFromLabel(spec.label)', () => {
    it('poklapa i kanonski ključ i klijentski ključ sa dijakritikom u labeli', () => {
      const def = facetDef('vinil', 'ugradnja');
      // Server oblik: kanonski key
      expect(getFacetValues({ specs: [{ key: 'nacin_montaze', label: 'Način montaže', value: 'Plivajući' }] }, def))
        .toEqual(['Plivajuće']);
      // Klijentski oblik (CategoryTabs): key iz labele BEZ skidanja dijakritika, ali labela ostaje
      expect(getFacetValues({ specs: [{ key: 'na_in_monta_e', label: 'Način montaže', value: 'Plivajući' }] }, def))
        .toEqual(['Plivajuće']);
    });
  });

  describe('parseFacetSelectionsFromParams', () => {
    it('parsira CSV vrednosti i boolean prihvata samo "1"', () => {
      const defs = getFacetDefsForCategory('vinil');
      expect(parseFacetSelectionsFromParams({ klasa: '33,34' }, defs)).toEqual({ klasa: ['33', '34'] });
      expect(parseFacetSelectionsFromParams({ grejanje: '1' }, defs)).toEqual({ grejanje: ['1'] });
      expect(parseFacetSelectionsFromParams({ grejanje: 'da' }, defs)).toEqual({});
      expect(parseFacetSelectionsFromParams({}, defs)).toEqual({});
    });
  });

  describe('LVT — nasleđivanje klase preko kolekcije', () => {
    it('header bez klase nasleđuje klasu svojih boja, boja bez klase nasleđuje klasu kolekcije', async () => {
      const products = await productRepository.findByCategory('6');
      const defs = getFacetDefsForCategory('lvt');
      const klasaDef = facetDef('lvt', 'klasa');
      const maps = buildFacetInheritanceMaps(products, defs);

      // LVT-CREATION-70 header mora da vidi klasu 34 (svoju ili nasleđenu od boja)
      const header = products.find((p) => p.sku === 'LVT-CREATION-70');
      expect(header).toBeDefined();
      expect(getProductFacetValues(header!, klasaDef, maps.klasa)).toContain('34');

      // Čist smer boje→header: header BEZ ijednog spec-a nasleđuje uniju klasa
      // svojih boja preko normalizovanog imena kolekcije
      const bareHeader = { name: 'Creation 70', slug: 'lvt-creation-70-sinteticki', specs: [] };
      expect(getFacetValues(bareHeader, klasaDef)).toEqual([]);
      expect(getProductFacetValues(bareHeader, klasaDef, maps.klasa)).toContain('34');

      // Obrnut smer: boja bez svoje klase, vezana kroz spec 'collection', dobija vrednost kolekcije
      const colorWithoutOwnClass = {
        name: '0347 Ballerina',
        slug: 'sinteticka-proba',
        specs: [{ key: 'collection', label: 'Kolekcija', value: 'Creation 70' }],
      };
      expect(getFacetValues(colorWithoutOwnClass, klasaDef)).toEqual([]);
      expect(getProductFacetValues(colorWithoutOwnClass, klasaDef, maps.klasa)).toContain('34');

      // ?klasa=34 na LVT daje >0 rezultata i kroz nasleđivanje
      const matching = products.filter((p) =>
        productMatchesFacetSelections(p, { klasa: ['34'] }, defs, maps, 'exclude')
      );
      expect(matching.length).toBeGreaterThan(0);
    });

    it('identitet kolekcije je brend-skopiran: isto ime kolekcije kod dva brenda se ne preliva', () => {
      const defs = getFacetDefsForCategory('vinil');
      const materijalDef = facetDef('vinil', 'materijal');
      // Podovi (14) 'Aurora' boje nose SPC; Wolflor (11) 'Aurora' header nema materijal
      const podoviColor = {
        name: 'Aurora dekor',
        slug: 'aurora-dekor-1',
        brandId: '14',
        specs: [
          { key: 'collection', label: 'Kolekcija', value: 'Aurora' },
          { key: 'vrsta_materijala', label: 'Vrsta materijala', value: 'SPC vinil' },
        ],
      };
      const maps = buildFacetInheritanceMaps([podoviColor], defs);
      const wolflorHeader = { name: 'Aurora', slug: 'wolflor-aurora', brandId: '11', specs: [] };
      const podoviHeader = { name: 'Aurora', slug: 'podovi-aurora', brandId: '14', specs: [] };
      expect(getProductFacetValues(wolflorHeader, materijalDef, maps.materijal)).toEqual([]);
      expect(getProductFacetValues(podoviHeader, materijalDef, maps.materijal)).toEqual(['SPC']);
    });

    it('normalizeCollectionKey peglа brend prefiks, dijakritike i superskript (Saga²)', () => {
      expect(normalizeCollectionKey('Creation Saga²')).toBe('creation-saga2');
      expect(normalizeCollectionKey('gerflor-creation-30')).toBe('creation-30');
      expect(normalizeCollectionKey('iD Inspiration 30')).toBe('id-inspiration-30');
      expect(normalizeCollectionKey('')).toBeNull();
    });
  });

  describe('integracija — vinil ?klasa=33', () => {
    it('daje >0 kolekcija, a brojači opcija se slažu sa stvarnim filtriranjem', async () => {
      const products = await productRepository.findByCategory('2');
      const defs = getFacetDefsForCategory('vinil');
      const klasaDef = facetDef('vinil', 'klasa');
      const maps = buildFacetInheritanceMaps(products, defs);
      const headers = products.filter((p) => isCollectionHeader(p.sku));
      const colors = products.filter((p) => !isCollectionHeader(p.sku));
      expect(headers.length).toBeGreaterThan(0);

      const filtered33 = headers.filter((p) =>
        productMatchesFacetSelections(p, { klasa: ['33'] }, defs, maps, 'exclude')
      );
      expect(filtered33.length).toBeGreaterThan(0);

      // Isti obrazac kao countFacetOption u page.tsx: count opcije = broj headera koji
      // prolaze kad je SAMO ta opcija aktivna — mora da se slaže sa stvarnim filtriranjem,
      // i nijedna ponuđena opcija ne sme da bude mrtva (0 i na headerima i na bojama).
      const optionValues = collectFacetOptionValues([...headers, ...colors], klasaDef, maps.klasa);
      expect(optionValues).toContain('33');
      for (const value of optionValues) {
        const headerCount = headers.filter((p) =>
          productMatchesFacetSelections(p, { klasa: [value] }, defs, maps, 'exclude')
        ).length;
        const colorCount = colors.filter((p) =>
          productMatchesFacetSelections(p, { klasa: [value] }, defs, maps, 'exclude')
        ).length;
        expect(headerCount + colorCount, `opcija klasa=${value} ne sme da bude mrtva`).toBeGreaterThan(0);
        if (value === '33') {
          expect(headerCount).toBe(filtered33.length);
        }
      }
    });
  });

  describe('integracija — laminat i otirači', () => {
    it('laminat ?klasa=AC5 daje >0 kolekcija (uz nasleđivanje header↔varijanta)', async () => {
      const products = await productRepository.findByCategory('1');
      const defs = getFacetDefsForCategory('laminat');
      const maps = buildFacetInheritanceMaps(products, defs);
      const headers = products.filter((p) => p.sku?.startsWith('LAM-'));
      const matching = headers.filter((p) =>
        productMatchesFacetSelections(p, { klasa: ['AC5'] }, defs, maps, 'exclude')
      );
      expect(matching.length).toBeGreaterThan(0);
    });

    it('otirači ?tip= pokriva sve proizvode (100% pokrivenost __techem_top_category)', async () => {
      const products = await productRepository.findByCategory('12');
      const defs = getFacetDefsForCategory('otiraci');
      const tipDef = facetDef('otiraci', 'tip');
      const maps = buildFacetInheritanceMaps(products, defs);
      expect(products.length).toBeGreaterThan(0);

      const optionValues = collectFacetOptionValues(products, tipDef, maps.tip);
      expect(optionValues).toContain('Aluminijumski otirači');
      const total = optionValues.reduce(
        (sum, value) =>
          sum + products.filter((p) => productMatchesFacetSelections(p, { tip: [value] }, defs, maps, 'exclude')).length,
        0
      );
      // Pod-linije se spajaju u grupe, pa je zbir po opcijama ≥ broj proizvoda (bez rupa)
      expect(total).toBeGreaterThanOrEqual(products.length);

      const aluminium = products.filter((p) =>
        productMatchesFacetSelections(p, { tip: ['Aluminijumski otirači'] }, defs, maps, 'exclude')
      );
      expect(aluminium.length).toBeGreaterThan(0);
    });
  });

  describe('missing policy — tab „Boje" ne sakriva boje bez podatka', () => {
    it("'include' zadržava proizvod bez vrednosti, 'exclude' ga sakriva", () => {
      const defs = getFacetDefsForCategory('vinil');
      const colorWithoutData = { name: 'Boja bez specova', slug: 'bez-specova', specs: [] };
      expect(productMatchesFacetSelections(colorWithoutData, { klasa: ['33'] }, defs, {}, 'include')).toBe(true);
      expect(productMatchesFacetSelections(colorWithoutData, { klasa: ['33'] }, defs, {}, 'exclude')).toBe(false);
    });
  });
});
