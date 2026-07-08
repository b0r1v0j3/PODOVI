import { describe, expect, it } from 'vitest';
import { getAllAlpodProducts } from '@/lib/utils/productDataLoader';
import { brands } from '@/lib/data/mock-data';

const ADMONTER_COLLECTION_SLUG = 'podovi-parket-admonter';

function loadAdmonterProducts() {
  const all = getAllAlpodProducts();
  const collection = all.find((p) => p.slug === ADMONTER_COLLECTION_SLUG);
  const variants = all.filter(
    (p) => (p as { collectionSlug?: string }).collectionSlug === ADMONTER_COLLECTION_SLUG
  );
  return { collection, variants };
}

describe('Admonter enrichment contract (zvanični materijal proizvođača)', () => {
  it('kolekcija ima References sliku kao primarnu, različitu od svoča prve boje', () => {
    const { collection } = loadAdmonterProducts();
    expect(collection).toBeDefined();
    const primary = collection!.images[0]?.url || '';
    expect(primary).toContain('admonter-official');
    expect(primary).not.toContain('alpod-migrated');
    // galerija kolekcije sadrži i dodatne zvanične fotografije
    const officialCount = collection!.images.filter((img) => img.url.includes('admonter-official')).length;
    expect(officialCount).toBeGreaterThanOrEqual(3);
  });

  it('kolekcija nosi PDF dokumentaciju sa našeg storage-a i Admonter brend', () => {
    const { collection } = loadAdmonterProducts();
    expect(collection!.brandId).toBe('16');
    expect(collection!.documents?.length).toBeGreaterThanOrEqual(6);
    for (const doc of collection!.documents || []) {
      expect(doc.url).toContain('supabase.co');
    }
  });

  it('brend Admonter postoji u mock brendovima (union ga nosi i na produkciju)', () => {
    const admonter = brands.find((b) => b.slug === 'admonter');
    expect(admonter).toBeDefined();
    expect(admonter!.id).toBe('16');
  });

  it('Noblesse boja ima ljudsko ime, fabrički naziv u specs i coveragePerPackage', () => {
    const { variants } = loadAdmonterProducts();
    const noblesse = variants.find((p) => p.sku === 'ADMOAK-N02020');
    expect(noblesse).toBeDefined();
    expect(noblesse!.name.startsWith('Hrast Noblesse')).toBe(true);
    const fabricki = noblesse!.specs.find((s) => s.key === 'fabricki_naziv');
    expect(fabricki?.value).toContain('NOBLESSE');
    expect(noblesse!.coveragePerPackage).toBeCloseTo(1.584, 2);
    expect(noblesse!.brandId).toBe('16');
    // opis je čitljiv, ne sirovi cenovnički string
    expect(noblesse!.description).not.toContain('ADMONTER FLOORS');
    expect(noblesse!.description).toContain('Format daske');
  });

  it('nema "OLJE" ostataka i nema polomljenog agregata habajućeg sloja', () => {
    const { collection, variants } = loadAdmonterProducts();
    for (const v of variants) {
      expect(v.name).not.toMatch(/\bOLJE\b/);
    }
    const wearLayer = collection!.specs.find((s) => s.key === 'habajuci_sloj' || s.key === 'wear_layer');
    // ranije: "3, 6, 2, 5" (polomljene decimale 3,6 i 2,5) — sada preračunato iz varijanti
    expect(wearLayer?.value).not.toBe('3, 6, 2, 5');
    expect(wearLayer?.value).toContain('3,6');
  });

  it('varijante sa zvaničnim materijalom imaju više slika (svoč + room-shot/tekstura)', () => {
    const { variants } = loadAdmonterProducts();
    const whiteNoblesse = variants.find((p) => p.sku === 'ADMOAK-WH3N72');
    expect(whiteNoblesse).toBeDefined();
    expect(whiteNoblesse!.images.length).toBeGreaterThanOrEqual(3);
    expect(whiteNoblesse!.images.some((img) => img.url.includes('admonter-official'))).toBe(true);
  });
});
