import { describe, expect, it } from 'vitest';
import { normalizeThicknessValue, resolveBrandTokens } from '@/lib/catalog/spec-normalize';
import { productRepository } from '@/lib/repositories/product-repository';
import { brandRepository } from '@/lib/repositories/brand-repository';

describe('filter hygiene contract', () => {
  describe('normalizeThicknessValue — jedan format za sva poređenja debljine', () => {
    it('normalizuje sve istorijske formate na toFixed(2)', () => {
      expect(normalizeThicknessValue('8')).toBe('8.00');
      expect(normalizeThicknessValue('8.00')).toBe('8.00');
      expect(normalizeThicknessValue('8,0')).toBe('8.00');
      expect(normalizeThicknessValue('8 mm')).toBe('8.00');
      expect(normalizeThicknessValue(' 2,5mm ')).toBe('2.50');
      expect(normalizeThicknessValue(2.5)).toBe('2.50');
    });

    it('vraća null za nevalidan ulaz umesto da pukne', () => {
      expect(normalizeThicknessValue('')).toBeNull();
      expect(normalizeThicknessValue('mm')).toBeNull();
      expect(normalizeThicknessValue('abc')).toBeNull();
      expect(normalizeThicknessValue(null)).toBeNull();
      expect(normalizeThicknessValue(undefined)).toBeNull();
    });
  });

  describe('resolveBrandTokens — ?brands= prihvata ID, slug i ime', () => {
    it('mapira ime i slug brenda u legacy ID, a ID propušta', async () => {
      const brands = await brandRepository.findAll();
      const tarkett = brands.find((brand) => brand.name.toLowerCase() === 'tarkett');
      expect(tarkett).toBeDefined();

      expect(resolveBrandTokens([tarkett!.id], brands)).toEqual([tarkett!.id]);
      expect(resolveBrandTokens(['Tarkett'], brands)).toEqual([tarkett!.id]);
      expect(resolveBrandTokens(['tarkett'], brands)).toEqual([tarkett!.id]);
      expect(resolveBrandTokens([tarkett!.slug], brands)).toEqual([tarkett!.id]);
    });

    it('odbacuje nepoznate tokene i duplikate', async () => {
      const brands = await brandRepository.findAll();
      const tarkett = brands.find((brand) => brand.name.toLowerCase() === 'tarkett');

      expect(resolveBrandTokens(['nepostojeci-brend'], brands)).toEqual([]);
      expect(resolveBrandTokens(['Tarkett', tarkett!.id, ' '], brands)).toEqual([tarkett!.id]);
    });
  });

  describe('linoleum — bez duplih kolekcija legacy vs catalog-derived', () => {
    it('nijedan proizvod nema i legacy i gerflor- varijantu u listi kategorije 7', async () => {
      const products = await productRepository.findByCategory('7');
      const slugs = new Set(products.map((product) => product.slug));

      const duplicates = products
        .map((product) => product.slug)
        .filter((slug) => slugs.has(`gerflor-${slug}`));

      expect(duplicates).toEqual([]);
    });
  });
});
