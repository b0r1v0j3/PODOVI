import { describe, expect, it } from 'vitest';
import { getAllAlpodProducts } from '@/lib/utils/productDataLoader';

const ARTISAN_COLLECTION_SLUG = 'podovi-parket-artisan';

function loadArtisanProducts() {
  const all = getAllAlpodProducts();
  const collection = all.find((p) => p.slug === ARTISAN_COLLECTION_SLUG);
  const variants = all.filter(
    (p) => (p as { collectionSlug?: string }).collectionSlug === ARTISAN_COLLECTION_SLUG
  );
  return { collection, variants };
}

describe('Artisan enrichment contract (pregled proizvoda #2)', () => {
  it('kolekcija ima hero baner, tačan intro (142 dekora) i SEO shortDescription', () => {
    const { collection } = loadArtisanProducts();
    expect(collection).toBeDefined();
    expect(collection!.images[0]?.url).toContain('parket-artisan-hero');
    expect(collection!.description).toContain('142 dekora');
    expect(collection!.description).toContain('Herringbone');
    expect(collection!.shortDescription).toContain('142 dekora');
  });

  it('boje imaju ljudska imena umesto ERP šifri, fabrički naziv ostaje u specs', () => {
    const { variants } = loadArtisanProducts();
    expect(variants.length).toBeGreaterThanOrEqual(140);
    const adelboden = variants.find((p) => p.sku === 'ARTCHA-ADE100');
    expect(adelboden).toBeDefined();
    expect(adelboden!.name).toBe('Hrast Adelboden Country — mat lak');
    expect(adelboden!.specs.find((s) => s.key === 'fabricki_naziv')?.value).toContain('ADELBODEN');
    // OL je kod spoja, NE ulje — finiš mora ostati mat lak, bez 'ulje' u imenu
    const ajaccio = variants.find((p) => p.sku === 'ARTHER-AJA110');
    expect(ajaccio!.name).toBe('Hrast Ajaccio Natural White Cream — četkan, mat lak');
  });

  it('galerije boja nose više migriranih slika (bez alpod.rs hotlinkova)', () => {
    const { variants } = loadArtisanProducts();
    const withGallery = variants.filter((p) => p.images.length >= 3);
    // 725 galerijskih slika je migrirano — velika većina boja ima 3+ slike
    expect(withGallery.length).toBeGreaterThanOrEqual(80);
    for (const v of variants) {
      for (const img of v.images) {
        expect(img.url).not.toContain('alpod.rs');
      }
    }
  });

  it('opis boje je čitljiv (gradacija + format + pakovanje), ne sirovi cenovnički string', () => {
    const { variants } = loadArtisanProducts();
    const adelboden = variants.find((p) => p.sku === 'ARTCHA-ADE100');
    expect(adelboden!.description).toContain('Country gradacija');
    expect(adelboden!.description).toContain('Format daske');
    expect(adelboden!.coveragePerPackage).toBeGreaterThan(0);
  });

  it('svaka boja nosi Podkolekcija spec za grupisanje selektora', () => {
    const { variants } = loadArtisanProducts();
    const lines = new Set(
      variants.map((p) => p.specs.find((s) => s.key === 'podkolekcija')?.value).filter(Boolean)
    );
    expect(lines.size).toBeGreaterThanOrEqual(6);
    expect([...lines]).toContain('Herringbone');
  });
});
