import { describe, expect, it, vi } from 'vitest';
import { resolveCommerceLine } from '@/lib/commerce/catalog';
import { quoteCart } from '@/lib/commerce/service';
import esdData from '@/public/data/esd_colors.json';

// Seed-shaped colors rows (scripts/seed-database.ts writes collection_slug 'gerflor-armonia-540').
vi.mock('@/lib/supabase/client', async (importOriginal) => {
  const carpet = (await import('@/public/data/carpet_tiles_complete.json')).default as { colors: Record<string, unknown>[] };
  const rows: Record<string, unknown>[] = carpet.colors.map((color) => ({ ...color, collection_slug: color.collection, category_slug: 'tekstilne-ploce' }));
  const from = () => {
    const filters: [string, unknown][] = [];
    const query: Record<string, unknown> = { select: () => query, order: () => query,
      eq: (column: string, value: unknown) => { filters.push([column, value]); return query; },
      then: (resolve: (value: unknown) => void) => resolve({ data: rows.filter((row) => filters.every(([column, value]) => row[column] === value)), error: null }) };
    return query;
  };
  return { ...await importOriginal<typeof import('@/lib/supabase/client')>(), supabase: { from } };
});

describe('commerce real catalog', () => {
  const collection = esdData.collections.find((entry) => entry.slug === 'tarkett-iq-granit-sd')!;
  const variant = collection.colors[0] as { slug: string; code: string };

  it('uses exact SD variant code and actual price without collection SKU or fake stock', async () => {
    const line = await resolveCommerceLine({ productSlug: collection.slug, variantSlug: variant.slug, quantity: 2 });
    expect(line.sku).toBe(variant.code);
    expect(line.price).toBe(4999);
    expect(typeof line.image).toBe('string');
    expect(line.image).toMatch(/^https:\/\//);
    expect(line).not.toHaveProperty('inStock');
    expect(line.coveragePerPackage).toBeUndefined();
    const quote = await quoteCart([{ productSlug: collection.slug, variantSlug: variant.slug, quantity: 2 }], { id: 'customer', email: 'test@example.test', discountPercent: 10 });
    expect(quote.knownTotalMinor).toBe(899820);
  });

  it('requires explicit collection selection and rejects another real collection variant', async () => {
    await expect(resolveCommerceLine({ productSlug: collection.slug, quantity: 1 })).rejects.toMatchObject({ code: 'INVALID_VARIANT' });
    await expect(resolveCommerceLine({ productSlug: 'gerflor-gti-max-connect', variantSlug: variant.slug, quantity: 1 })).rejects.toMatchObject({ code: 'INVALID_VARIANT' });
  });

  it('rounds Admonter parket to whole packages in m²', async () => {
    const item = { productSlug: 'podovi-parket-admonter', variantSlug: 'podovi-parket-33533-parket-dgp-hrast-noblesse-cetkan-ec-ulje', quantity: 10 };
    expect(await resolveCommerceLine(item)).toMatchObject({ unit: 'm²', coveragePerPackage: 1.584 });
    expect((await quoteCart([item], null)).lines[0].quantity).toBe(11.088);
    expect((await quoteCart([{ ...item, quantity: 25.5 }], null)).lines[0].quantity).toBe(26.928);
  });

  it('resolves Gerflor Armonia carpet tiles stored under the prefixed collection slug', async () => {
    const line = await resolveCommerceLine({ productSlug: 'gerflor-armonia-540', variantSlug: 'armonia-540-1790-canapa', quantity: 1 });
    expect(line.name).toMatch(/canapa/i);
    expect(line.url).toBe('/proizvodi/gerflor-armonia-540?color=armonia-540-1790-canapa');
    await expect(resolveCommerceLine({ productSlug: 'gerflor-armonia-540', variantSlug: 'armonia-400-1801-indigo', quantity: 1 })).rejects.toMatchObject({ code: 'INVALID_VARIANT' });
  });
});
