import { describe, expect, it } from 'vitest';
import homoData from '@/public/data/tarkett_homogeneous_vinyl_colors.json';
import lvtData from '@/public/data/tarkett_lvt_products.json';

const SUPABASE_PREFIX = 'https://nnjmrfwepylrheykalik.supabase.co/storage/v1/object/public/';
// Asset hostovi koji NE smeju da se pojave u nove kolekcije (slike/dokumenti).
const UPSTREAM_ASSET = /media\.tarkett-image\.com|tarkett\.rs\/[a-z_]+\/pdf/i;

const homoCollections = (homoData as any).collections as any[];
const lvtItems = lvtData as any[];

const NEW_HOMO = ['tarkett-iq-motion'];
const NEW_LVT = [
  { slug: 'deal-spc-30', type: 'SPC', count: 2 },
  { slug: 'real-spc-50', type: 'SPC', count: 6 },
  { slug: 'modulart-70', type: 'LVT', count: 16 },
];

describe('S3: nove homogeni-vinil kolekcije self-hostovane', () => {
  it.each(NEW_HOMO)('%s postoji, colorCount===colors.length, sve na Supabase', (slug) => {
    const col = homoCollections.find((c) => c.slug === slug);
    expect(col, `kolekcija ${slug} mora postojati`).toBeTruthy();
    expect(col.colorCount).toBe(col.colors.length);
    expect(col.colors.length).toBeGreaterThan(0);
    expect(String(col.collection_image_url).startsWith(`${SUPABASE_PREFIX}product-images/`)).toBe(true);
    for (const doc of col.documents || []) {
      expect(String(doc.url).startsWith(`${SUPABASE_PREFIX}product-documents/`)).toBe(true);
      expect(doc.url).not.toMatch(UPSTREAM_ASSET);
    }
    for (const color of col.colors) {
      expect(String(color.image).startsWith(`${SUPABASE_PREFIX}product-images/`)).toBe(true);
      expect(color.image).not.toMatch(UPSTREAM_ASSET);
    }
    for (const scene of col.room_scene_images || []) {
      expect(String(scene).startsWith(`${SUPABASE_PREFIX}product-images/`)).toBe(true);
    }
  });

  it('dokumenti homogene kolekcije: jedinstveni izvorni URL-ovi, naslovi popunjeni', () => {
    // NB: naslovi NE moraju biti jedinstveni — utvrđeni format (npr. STANDARD PLUS) ima
    // dva dokumenta „Sertifikat"; dedupe je po izvoru (URL), ne po naslovu. Proveravamo
    // da nema dupliranih izvornih dokumenata i da svaki ima neprazan naslov.
    for (const slug of NEW_HOMO) {
      const col = homoCollections.find((c) => c.slug === slug);
      const urls = (col.documents || []).map((d: any) => d.url);
      expect(new Set(urls).size).toBe(urls.length);
      for (const d of col.documents || []) expect(String(d.title).trim().length).toBeGreaterThan(0);
    }
  });
});

describe('S3: nove LVT/SPC kolekcije self-hostovane', () => {
  it.each(NEW_LVT)('$slug: $count stavki, type=$type, sve slike+dokumenti na Supabase', ({ slug, type, count }) => {
    const items = lvtItems.filter((p) => p.collection === slug);
    expect(items).toHaveLength(count);
    for (const it of items) {
      expect(it.type).toBe(type);
      expect(it.category).toBe('lvt');
      expect(Array.isArray(it.images) && it.images.length > 0).toBe(true);
      for (const img of it.images) {
        expect(String(img).startsWith(`${SUPABASE_PREFIX}product-images/`)).toBe(true);
        expect(img).not.toMatch(UPSTREAM_ASSET);
      }
      for (const doc of it.meta?.documents || []) {
        expect(String(doc).startsWith(`${SUPABASE_PREFIX}product-documents/`)).toBe(true);
        expect(doc).not.toMatch(UPSTREAM_ASSET);
      }
    }
  });
});
