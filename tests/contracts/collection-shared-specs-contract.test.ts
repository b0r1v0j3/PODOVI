import React from 'react';
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getTarkettLVTCollections, sharedCollectionValue } from '@/lib/utils/productDataLoader';
import ProductDetailsTabs from '@/components/ProductDetailsTabs';
import CertificationBadges from '@/components/CertificationBadges';
import EcoFeatures from '@/components/EcoFeatures';

/**
 * Tarkett LVT i Desso čuvaju eko-podatke po boji (A+, reciklirani sadržaj, TVOC, ECONYL vlakno, podno grejanje),
 * ali su oni isti za sve boje kolekcije. Loader ih podiže u specifikacije kolekcije, pa ih vide stranica kolekcije
 * i svaka `?color=` stranica (odluka vlasnika 25.11.2026). FloorScore se ne podiže: SCS-FS-02745 je istekao 30.6.2026.
 */

vi.mock('react', async () => ({ ...(await vi.importActual<typeof import('react')>('react')), cache: <T,>(fn: T) => fn }));
for (const name of ['ProductColorSelector', 'ColorGrid', 'ProductActions', 'ProductDocuments', 'RecommendedAccessories', 'RelatedProducts', 'RecentlyViewed', 'ProductInquiryStickyCTA', 'ProductViewTracker', 'ProductImage', 'ProductCharacteristics', 'ProductDescriptionWithCharacteristics', 'ProductBenefits', 'FlooringCalculator', 'Breadcrumbs']) {
  vi.doMock(`@/components/${name}`, () => ({ default: () => null }));
}
vi.stubGlobal('React', React);
afterAll(() => vi.unstubAllGlobals());

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-11-25T12:00:00+01:00'));
});
afterEach(() => vi.useRealTimers());

function findProps(node: any, type: unknown): any {
  if (!node || typeof node !== 'object') return null;
  if (Array.isArray(node)) { for (const child of node) { const found = findProps(child, type); if (found) return found; } return null; }
  if (node.type === type) return node.props;
  return findProps(node.props?.children, type);
}

async function sertifikatiTab(slug: string, color?: string) {
  const { default: ProductPage } = await import('@/app/proizvodi/[slug]/page');
  const page = await ProductPage({ params: { slug }, searchParams: color ? { color } : {} } as any);
  const eco = (findProps(page, ProductDetailsTabs)?.tabs ?? []).find((tab: { id: string }) => tab.id === 'eco');
  return {
    certifications: findProps(eco?.content, CertificationBadges)?.certifications ?? [],
    ecoFeatures: findProps(eco?.content, EcoFeatures)?.features ?? [],
    underfloorHeating: findProps(eco?.content, EcoFeatures)?.underfloorHeating ?? false,
  };
}

describe('Podaci boje koji važe za celu kolekciju stižu na stranicu boje', () => {
  it('vrednost je zajednička samo kad je imaju sve boje, i to istu', () => {
    expect(sharedCollectionValue(['35 %', ' 35 % '])).toBe('35 %');
    expect(sharedCollectionValue(['35 %', '41 %'])).toBe('');
    expect(sharedCollectionValue(['Da', undefined])).toBe('');
    expect(sharedCollectionValue([undefined, undefined])).toBe('');
  });

  it('Tarkett LVT boja: A+, reciklirani sadržaj i TVOC iz podataka dekora; bez FloorScore-a', async () => {
    const colorPage = await sertifikatiTab('tarkett-id-inspiration-click-solid-30', 'id-inspiration-click-solid-30-antik-oak-beige');
    expect(colorPage.certifications).toContain('A+');
    expect(colorPage.certifications).not.toContain('FloorScore');
    expect(colorPage.ecoFeatures).toEqual(expect.arrayContaining(['35% recikliranog sadržaja', 'TVOC emisije: Platina (≤ 10 µg/m³)']));
    expect(colorPage.underfloorHeating).toBe(true);
    expect(await sertifikatiTab('tarkett-id-inspiration-click-solid-30')).toEqual(colorPage);

    // Tarkett piše „Da" i za iD Inspiration 30 i Deal SPC 30, ali važeći sertifikat ih ne pokriva.
    expect(getTarkettLVTCollections().flatMap((product) => product.specs).some((spec) => spec.key === 'scs_floorscore_certification')).toBe(false);
  }, 120000);

  it('Desso boja: ECONYL vlakno i podno grejanje; kolekcija bez ECONYL-a ne dobija tvrdnju', async () => {
    const atmos = await sertifikatiTab('tarkett-desso-airmaster-atmos', 'desso-airmaster-atmos-color-3841-b747');
    expect(atmos.ecoFeatures).toContain('ECONYL® reciklirana vlakna');
    expect(atmos.underfloorHeating).toBe(true);

    const arcade = await sertifikatiTab('tarkett-desso-arcade'); // BCF PA6.6, podno grejanje Da
    expect(arcade.ecoFeatures).not.toContain('ECONYL® reciklirana vlakna');
  }, 120000);
});
