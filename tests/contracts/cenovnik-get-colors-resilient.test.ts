import { describe, expect, it } from 'vitest';
import { getColorsForCategory } from '@/lib/colors/get-colors';

// U test okruženju Supabase je lažni (127.0.0.1) → upit na colors tabelu pukne.
// Flat grana MORA da preživi: za 'lvt' i dalje vrati JSON (tarkettLvtData) boje, status 200.
describe('get-colors flat grana je otporna na Supabase pad', () => {
  it("lvt vraća 200 sa JSON bojama čak i kad Supabase padne", async () => {
    const r = await getColorsForCategory('lvt');
    expect(r.status).toBe(200);
    expect(Array.isArray(r.body?.colors)).toBe(true);
    // tarkettLvtData se dodaje bez obzira na Supabase → mora biti boja
    expect(r.body.colors.length).toBeGreaterThan(0);
    // bar jedna poznata LVT kolekcija iz JSON-a
    const colls = new Set(r.body.colors.map((c: any) => c.collection));
    expect(colls.has('modulart-70') || colls.has('id-inspiration-55')).toBe(true);
  });

  it("kategorija bez JSON izvora (otiraci) ne baca 500 nego 200 sa praznim", async () => {
    const r = await getColorsForCategory('otiraci');
    expect(r.status).toBe(200);
    expect(Array.isArray(r.body?.colors)).toBe(true);
  });
});
