import { describe, expect, it } from 'vitest';
import { initialPricePair, isCollectionChanged } from '@/lib/cenovnik/prefill';
import { withVatToBase } from '@/lib/cenovnik/vat';

describe('cenovnik prefill', () => {
  it('initialPricePair: pred-popuni SA PDV-om, izračuna BEZ PDV-a', () => {
    const pair = initialPricePair(899);
    expect(pair.withVat).toBe('899');
    // 899 / 1.2 = 749.17 (zaokruženo), srpski format bez grupisanja
    expect(pair.base).toBe(String(withVatToBase(899)).replace('.', ','));
  });

  it('initialPricePair: bez cene → prazno', () => {
    expect(initialPricePair(undefined)).toEqual({ base: '', withVat: '' });
    expect(initialPricePair(0)).toEqual({ base: '', withVat: '' });
  });

  it('isCollectionChanged: bez baseline → svaki unos je izmena', () => {
    expect(isCollectionChanged({ base: '', withVat: '' }, undefined)).toBe(false);
    expect(isCollectionChanged({ base: '', withVat: '1000' }, undefined)).toBe(true);
  });

  it('isCollectionChanged: ista pred-popunjena vrednost → nije izmena', () => {
    expect(isCollectionChanged({ base: '', withVat: '899' }, 899)).toBe(false);
  });

  it('isCollectionChanged: drugačija vrednost → izmena', () => {
    expect(isCollectionChanged({ base: '', withVat: '950' }, 899)).toBe(true);
  });

  it('isCollectionChanged: prazno (očišćeno) → nije izmena (ne šalje null cenu)', () => {
    expect(isCollectionChanged({ base: '', withVat: '' }, 899)).toBe(false);
  });
});
