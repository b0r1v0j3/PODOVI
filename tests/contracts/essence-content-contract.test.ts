import { describe, expect, it } from 'vitest';
import {
  ESSENCE_FAMILIES,
  ESSENCE_GRADES,
  ESSENCE_FINISHES,
  ESSENCE_WOODS,
  ESSENCE_DOCUMENTS,
} from '@/lib/data/essence-content';

describe('Essence sadržaj kompletne stranice', () => {
  it('ima očekivane sekcije', () => {
    expect(ESSENCE_FAMILIES).toHaveLength(3);
    expect(ESSENCE_GRADES.map((g) => g.name)).toEqual(['Elegant', 'Natural', 'Standard']);
    expect(ESSENCE_FINISHES.map((f) => f.name)).toEqual(['Brušeno', 'Četkano', 'Hoblano', 'Piljeno']);
    expect(ESSENCE_WOODS).toHaveLength(2);
    expect(ESSENCE_GRADES.every((g) => g.description.length > 20)).toBe(true);
    expect(ESSENCE_FINISHES.every((f) => f.description.length > 20)).toBe(true);
  });

  it('dokumenti su sa naše Supabase (product-documents), bez hotlinka na alpod', () => {
    expect(ESSENCE_DOCUMENTS).toHaveLength(16);
    expect(ESSENCE_DOCUMENTS.every((d) => /supabase\.co\/.*\/product-documents\/essence\//i.test(d.url))).toBe(true);
    expect(ESSENCE_DOCUMENTS.every((d) => !/alpod/i.test(d.url))).toBe(true);
    expect(ESSENCE_DOCUMENTS.every((d) => d.url.endsWith('.pdf') && d.pattern && d.wood)).toBe(true);
  });
});
