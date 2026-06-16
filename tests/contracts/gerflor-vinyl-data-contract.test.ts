import { describe, expect, it } from 'vitest';
import vinylData from '@/public/data/vinyl_colors_complete.json';

const SUPABASE_PREFIX = 'https://nnjmrfwepylrheykalik.supabase.co/storage/v1/object/public/';
const UPSTREAM_HOSTS = /gerflor-cee\.com|cdn\.gerflor\.com|prod-peco\.gerflor\.io/;
// Mipolam Elegance je povučen kod proizvođača (nema ga na CEE) — jedina kolekcija
// bez upstream obogaćivanja; zadržava postojeće podatke.
const EXEMPT = new Set(['mipolam-elegance']);

// protivklizno kolekcije (S5 Tarasafe) idu kroz isti vinyl JSON ali su zaseban segment —
// ovaj ugovor čuva originalnih 25 S2 Gerflor-vinil kolekcija.
const collections = ((vinylData as any).collections as any[]).filter((c) => !c.protivklizno);

describe('Gerflor vinyl S2 enrichment data contract', () => {
  it('ima 25 kolekcija', () => {
    expect(collections).toHaveLength(25);
  });

  it.each(collections.filter((c) => !EXEMPT.has(c.slug)).map((c) => [c.slug, c] as const))(
    '%s: dokumenti + hero + ambijent, sve self-hostovano na Supabase',
    (_slug, col: any) => {
      expect(Array.isArray(col.documents) && col.documents.length > 0).toBe(true);
      for (const doc of col.documents) {
        expect(doc.title).toBeTruthy();
        expect(String(doc.url).startsWith(`${SUPABASE_PREFIX}product-documents/`)).toBe(true);
      }
      expect(typeof col.collection_image_url).toBe('string');
      expect(String(col.collection_image_url).startsWith(`${SUPABASE_PREFIX}product-images/`)).toBe(true);
      expect(Array.isArray(col.room_scene_images)).toBe(true);
    },
  );

  it('nijedan asset URL ne pokazuje na gerflor servere (slike boja, hero, ambijent, dokumenti)', () => {
    for (const col of collections) {
      for (const doc of col.documents || []) expect(doc.url).not.toMatch(UPSTREAM_HOSTS);
      expect(col.collection_image_url || '').not.toMatch(UPSTREAM_HOSTS);
      for (const scene of col.room_scene_images || []) expect(scene).not.toMatch(UPSTREAM_HOSTS);
      for (const color of col.colors || []) {
        // href (link ka STRANICI proizvođača) sme; image (asset) NE sme van Supabase/lokalnog
        expect(color.image || '').not.toMatch(UPSTREAM_HOSTS);
      }
    }
  });

  it('colorCount je usklađen sa colors.length u svim kolekcijama', () => {
    for (const col of collections) {
      expect(col.colorCount).toBe(col.colors.length);
    }
  });

  it('dokumenti imaju jedinstvene (deduplikovane) naslove po kolekciji', () => {
    for (const col of collections) {
      const titles = (col.documents || []).map((d: any) => d.title);
      expect(new Set(titles).size).toBe(titles.length);
    }
  });
});
