import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getColorsForCategory } from '@/lib/colors/get-colors';

vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    from: () => {
      const query: any = {};
      query.select = () => query;
      query.eq = () => query;
      query.order = () => query;
      query.then = (resolve: (value: unknown) => unknown, reject: (reason: unknown) => unknown) =>
        Promise.resolve({ data: null, error: { message: 'test: Supabase unavailable' } })
          .then(resolve, reject);
      return query;
    },
  },
}));

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('get-colors flat grana je otporna na Supabase pad', () => {
  it('lvt vraća 200 sa JSON bojama čak i kad Supabase padne', async () => {
    const r = await getColorsForCategory('lvt');
    expect(r.status).toBe(200);
    expect(Array.isArray(r.body?.colors)).toBe(true);
    expect(r.body.colors.length).toBeGreaterThan(0);

    const collections = new Set(r.body.colors.map((color: any) => color.collection));
    expect(collections.has('modulart-70') || collections.has('id-inspiration-55')).toBe(true);
  });

  it('kategorija bez JSON izvora ne baca 500 nego vraća praznu listu', async () => {
    const r = await getColorsForCategory('otiraci');
    expect(r.status).toBe(200);
    expect(r.body?.colors).toEqual([]);
  });
});
