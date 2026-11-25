import React from 'react';
import { readdirSync, readFileSync } from 'node:fs';
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import documentsIndex from '@/public/data/documents_index.json';
import { getBackedClaims, manufacturerEcoText } from '@/lib/product-page/backed-claims';
import { resolveProductBySlug } from '@/lib/product-page/resolve-product';
import ProductDetailsTabs from '@/components/ProductDetailsTabs';
import CertificationBadges from '@/components/CertificationBadges';
import EcoFeatures from '@/components/EcoFeatures';

/**
 * Kartica „Sertifikati" na PDP-u (odluka vlasnika 25.11.2026): prikazuje se samo ono što specifikacije
 * ili važeći dokumenti te kolekcije/boje potvrđuju. Ranije su sve kolekcije kategorija 2/4/6/7/8/9/10
 * dobijale istu fiksnu listu (FloorScore, REACH, „30% recikliranog sadržaja"…), pa je npr. Somplan 350
 * nosio FloorScore iako je sertifikat istekao 31.10.2026.
 * Dopuna (vlasnik 25.11.2026, „Da, bez REACH"): eko-činjenice iz teksta proizvođača koji stranica već prikazuje
 * (opis „Okruženje/Održivost", „Ključne karakteristike") — bez sertifikata iz teksta, REACH-a i „CO2 neutralno".
 */

// React 18 stable has no `cache`; the PDP uses it only for per-request memoization.
vi.mock('react', async () => ({ ...(await vi.importActual<typeof import('react')>('react')), cache: <T,>(fn: T) => fn }));
for (const name of ['ProductColorSelector', 'ColorGrid', 'ProductActions', 'ProductDocuments', 'RecommendedAccessories', 'RelatedProducts', 'RecentlyViewed', 'ProductInquiryStickyCTA', 'ProductViewTracker', 'ProductImage', 'ProductCharacteristics', 'ProductDescriptionWithCharacteristics', 'ProductBenefits', 'FlooringCalculator', 'Breadcrumbs']) {
  vi.doMock(`@/components/${name}`, () => ({ default: () => null }));
}
vi.stubGlobal('React', React);
afterAll(() => vi.unstubAllGlobals());

const TODAY = new Date('2026-11-25T12:00:00+01:00');
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(TODAY);
});
afterEach(() => vi.useRealTimers());

const spec = (label: string, value: string, key = label.toLowerCase().replace(/[^a-z0-9]+/g, '_')) => ({ key, label, value });
const certsForTitle = (title: string) => getBackedClaims([], [{ title }], TODAY).certifications;

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
  if (!eco) return null;
  const ecoProps = findProps(eco.content, EcoFeatures);
  return {
    certifications: findProps(eco.content, CertificationBadges)?.certifications ?? [],
    ecoFeatures: ecoProps?.features ?? [],
    underfloorHeating: ecoProps?.underfloorHeating ?? false,
  };
}

describe('Sertifikati na PDP-u — samo potvrđene tvrdnje', () => {
  it('Somplan 350: CE (CE oznaka) i EPD (važi do 3.2.2031), bez ftalata i podno grejanje — bez FloorScore/REACH', async () => {
    const product = await resolveProductBySlug('tarkett-somplan-350');
    expect(product).toBeTruthy();
    expect(getBackedClaims(product!.specs, product!.documents, TODAY)).toEqual({
      certifications: ['CE', 'EPD'], ecoFeatures: ['Bez ftalata'], underfloorHeating: true,
    });
  });

  it('Gerflor Creation 55: dokumenti ne potvrđuju ništa; „Okruženje" iz opisa daje eko-činjenice, ali ne i sertifikate', async () => {
    const product = await resolveProductBySlug('gerflor-creation-55');
    expect(product).toBeTruthy();
    const documents = (documentsIndex as Record<string, Record<string, Array<{ title: string }>>>).lvt['creation-55'];
    expect(documents.length).toBeGreaterThan(0);
    expect(getBackedClaims(product!.specs, documents, TODAY)).toEqual({ certifications: [], ecoFeatures: [], underfloorHeating: false });

    // FloorScore za Creation je istekao 30.09.2026, a tekst to ne zna — zato sertifikati iz teksta ne ulaze.
    const text = manufacturerEcoText(product!.description, product!.detailsSections);
    expect(text).toContain('Floorscore®, IAC Gold & M1 sertifikovano');
    expect(getBackedClaims(product!.specs, documents, TODAY, text)).toEqual({
      certifications: [],
      ecoFeatures: ['Bez ftalata', '35% recikliranog sadržaja', '100% reciklabilno', 'TVOC emisije: < 10 µg/m³'],
      underfloorHeating: false,
    });
  });

  it('DLW Uni Walton: „Održivost" daje sastojke i reciklažu sa kvalifikatorom; „CO2 neutralno" i poreklo ne ulaze', async () => {
    const product = await resolveProductBySlug('gerflor-dlw-uni-walton');
    expect(product).toBeTruthy();
    const text = manufacturerEcoText(product!.description, product!.detailsSections);
    expect(text).toEqual(expect.arrayContaining(['CO2 neutralno od proizvodnje do isporuke']));
    expect(getBackedClaims(product!.specs, [], TODAY, text).ecoFeatures).toEqual([
      'Do 40% recikliranog sadržaja', '100% reciklabilno', '98% prirodnih sastojaka', '76% brzo obnovljivih sastojaka',
      'TVOC emisije nakon 28 dana: < 10 µg/m³',
    ]);
  });

  it('tekst proizvođača: samo eko-sekcije opisa i „Ključne karakteristike"', () => {
    expect(manufacturerEcoText(
      'Proizvod:\n98% prirodni sastojci: Svetle boje\nOkruženje:\nBez ftalata\nOdrživost:\n100% reciklabilno',
      [{ title: 'Ključne karakteristike', items: ['27% recikliranog sadržaja, ReStart spreman'] }, { title: 'Kolekcija', items: ['Bez PVC-a'] }],
    )).toEqual(['Bez ftalata', '100% reciklabilno', '27% recikliranog sadržaja, ReStart spreman']);
  });

  it('tekst proizvođača: kvalifikatori i izuzeci ostaju; sertifikati, REACH, „CO2 neutralno" i fraze bez broja ne prolaze', () => {
    const eco = (...lines: string[]) => getBackedClaims([], [], TODAY, lines).ecoFeatures;
    expect(eco('Sadrži u proseku 25,5% recikliranog sadržaja')).toEqual(['U proseku 25,5% recikliranog sadržaja']);
    expect(eco('Up to 32% recikliranog sadržaja/100% reciklabilno: očuvanje resursa')).toEqual(['Do 32% recikliranog sadržaja', '100% reciklabilno']);
    expect(eco('Do 25%% recikliranog sadržaja.', '100%% reciklabilno po završetku životnog veka.')).toEqual(['Do 25% recikliranog sadržaja', '100% reciklabilno']);
    expect(eco('Bez PVC-a, bez halogena, bez ftalata.', 'Pogodan za recikliranje nakon upotrebe')).toEqual(['Bez PVC-a', 'Bez ftalata', 'Pogodno za recikliranje nakon upotrebe']);
    // R-Tile: izuzetak iz ftalata se ne sme izgubiti.
    expect(eco('usklađeno sa REACH propisima i bez ftalata (osim u recikliranom sadržaju), teških metala')).toEqual(['Bez ftalata (osim u recikliranom sadržaju)']);
    expect(eco('Bez ftalata, osim u recikliranom sadržaju')).toEqual([]);
    // Reciklirana vlakna nisu „reciklabilno".
    expect(eco('Solution-Dyed Nylon - Econyl® 100% reciklirani')).toEqual([]);
    // TVOC samo do 100 µg/m³; od više vrednosti važi najslabija.
    expect(eco('TVOC after 28 days <50 micrograms/m3: vrlo dobar kvalitet unutrašnjeg vazduha')).toEqual(['TVOC emisije nakon 28 dana: < 50 µg/m³']);
    expect(eco('TVOC <10µg/m³', 'TVOC <200µg/m³')).toEqual([]);
    expect(getBackedClaims([], [], TODAY, [
      'Floorscore®, IAC Gold & M1 sertifikovano', 'Cradle to Cradle Silver sertifikat', 'A+ ocena - najviši nivo zdravstvenih standarda',
      'Third party certified EPD', 'Kompatibilno sa REACH standardima', 'CO2 neutralno od proizvodnje do isporuke',
      'Proizvedeno u Nemačkoj: smanjen CO2 otisak transporta', 'Niske VOC emisije.', 'Visok sadržaj recikliranih materijala.',
    ])).toEqual({ certifications: [], ecoFeatures: [], underfloorHeating: false });
  });

  it('specifikacija ima prednost nad tekstom proizvođača', () => {
    expect(getBackedClaims([
      spec('Sadržaj ftalata', 'Sadrži DEHP'),
      spec('Total recycled content', '44,3 %', 'total_recycled_content'),
      spec('TVOC emisije', '≤ 1000 µg / m³'),
    ], [], TODAY, ['Bez ftalata', 'Do 55% recikliranog sadržaja', 'TVOC <10µg/m³']).ecoFeatures).toEqual(['44,3% recikliranog sadržaja']);
  });

  it('prepoznaje stvarne specifikacije iz kataloga', () => {
    const claims = getBackedClaims([
      spec('Scs Floorscore Certification', 'Da'),
      spec('RTS klasa emisije', 'M1'),
      spec('Emissions label', 'A+'),
      spec('Breeam Rating', 'A+'),
      spec('CE oznaka', 'EN 14041'),
      spec('Epd Available', 'Da'),
      spec('Sadržaj ftalata', 'Ne sadrži ftalate'),
      spec('Total recycled content', '44,3 %', 'total_recycled_content'),
      spec('Pile Fibre', 'BCF PA6 + ECONYL'),
      spec('Sastav', '98% prirodnih sastojaka'),
      spec('TVOC emisije', 'Platina (≤ 10 µg / m³)'),
      spec('Emisije TVOC nakon 28 dana', 'Platina (≤ 10 µg / m³), Zlato (≤ 100 µg / m³)'),
      spec('Podno grejanje', 'Da (maksimum 27°C)'),
    ], [], TODAY);

    expect(claims.certifications).toEqual(['CE', 'EPD', 'FloorScore', 'M1', 'A+', 'BREEAM A+']);
    expect(claims.ecoFeatures).toEqual([
      'Bez ftalata', '44,3% recikliranog sadržaja', 'ECONYL® reciklirana vlakna', '98% prirodnih sastojaka',
      // Od više TVOC vrednosti važi najslabija.
      'TVOC emisije: Platina (≤ 10 µg/m³), Zlato (≤ 100 µg/m³)',
    ]);
    expect(claims.underfloorHeating).toBe(true);
  });

  it.each([
    ['Izjava o svojstvima (DoP)', 'CE'], ['Declaration of Perfromance', 'CE'], ['TARALAY PREMIUM ACOUSTIC_DOP', 'CE'],
    ['ENVIRONMENT_PRODUCT_DECLARATION', 'EPD'], ['TARAFLEX - FDES', 'EPD'], ['Sertifikat — FloorScore', 'FloorScore'],
    ['Mipolam - IAC GOLD', 'Indoor Air Comfort Gold'], ['C2C Certificate', 'Cradle to Cradle'],
    ['Sertifikat o kvalitetu vazduha u prostoriji', 'Sertifikat o kvalitetu vazduha'],
  ])('naslov dokumenta „%s" → %s', (title, claim) => {
    expect(certsForTitle(title)).toEqual([claim]);
  });

  it('ne izmišlja tvrdnje iz sličnih reči, internih polja, negativnih ili zakonski minimalnih vrednosti', () => {
    const claims = getBackedClaims([
      { key: '__alpod_source_url', label: '__Alpod Source URL', value: 'https://www.alpod.rs/vinil-podovi/aurora/' },
      { key: '__techem_family', label: 'Interno', value: 'ECONYL 98% prirodnih' },
      spec('Surface yarn', 'Polypropylene', 'surface_yarn'),
      spec('Epd Available', 'Ne'),
      spec('Scs Floorscore Certification', 'Ne'),
      spec('Sadržaj ftalata', 'Sadrži DEHP'),
      spec('Tvoc Emission Rts Class', 'M1 (≤ 200 µg/m³)'),
      spec('TVOC emisije', '≤ 1000 µg / m³'),
      // Alpod zbirna vrednost kolekcije (ima je 12 od 221 dekora) više ne daje „Antibakterijsko".
      spec('Specijalne karakteristike', 'Antibakterijska površina, Integrirana podloga'),
      spec('Podno grejanje', 'Primeren, Neprimeren'),
    ], [
      { title: 'Taraflex Performance Uni - Environmental Datasheet' },
      { title: 'Technical Datasheet' },
      { title: 'Sample Card' },
    ], TODAY);

    expect(claims).toEqual({ certifications: ['M1'], ecoFeatures: [], underfloorHeating: false });
  });

  it('istekao sertifikat, dokument koji nije sertifikat i EPD drugog proizvoda ne potvrđuju ništa (rok iz PDF-a)', async () => {
    const claimsFor = async (slug: string, now = TODAY) => {
      const product = await resolveProductBySlug(slug);
      expect(product, slug).toBeTruthy();
      return getBackedClaims(product!.specs, product!.documents, now).certifications;
    };
    const after = (iso: string) => new Date(`${iso}T12:00:00+01:00`);

    // Desso C2C: sertifikati istekli 2019, a „Cradle to Cradle sertifikat" na Atmos je izveštaj o održivosti.
    expect(await claimsFor('desso-airmaster-atmos')).not.toContain('Cradle to Cradle');
    // Tarkett linoleum: TIAQP (2024), FloorScore (30.6.2026) i Allergy UK su istekli; C2C Silver važi do 31.12.2026.
    expect(await claimsFor('tarkett-trentino-xf2-2-5-mm')).not.toContain('Sertifikat o kvalitetu vazduha');
    expect(await claimsFor('tarkett-trentino-xf2-2-5-mm')).toEqual(expect.arrayContaining(['Cradle to Cradle', 'M1']));
    expect(await claimsFor('tarkett-trentino-xf2-2-5-mm', after('2027-01-01'))).not.toContain('Cradle to Cradle');
    // Gerflor: FloorScore SCS-FS-02145 do 31.1.2027, Indoor Air Comfort Gold do 12.6.2030, „Sertifikat — emisije" = M1 do 4.11.2029.
    expect(await claimsFor('gerflor-mipolam-accord')).toEqual(expect.arrayContaining(['FloorScore', 'Indoor Air Comfort Gold', 'M1']));
    expect(await claimsFor('gerflor-mipolam-accord', after('2027-02-01'))).not.toContain('FloorScore');
    // „EPD" na Tarasafe Ultra Compact SparClean je EPD za Gerflor Attraction.
    expect(await claimsFor('gerflor-tarasafe-ultra-compact-sparclean')).not.toContain('EPD');
  });

  it('registar proverenih PDF-ova: poznate tvrdnje, ISO datumi i svaki fajl postoji u podacima', () => {
    const registry = JSON.parse(readFileSync('public/data/certificate_validity.json', 'utf8')) as {
      documents: Record<string, { claim: string | null; validUntil?: string }>;
    };
    const vocabulary = ['CE', 'EPD', 'FloorScore', 'Indoor Air Comfort Gold', 'M1', 'A+', 'Cradle to Cradle', 'Sertifikat o kvalitetu vazduha'];
    const dataText = [
      ...readdirSync('public/data').filter((file) => file.endsWith('.json')).map((file) => `public/data/${file}`),
      ...readdirSync('lib/data').filter((file) => file.endsWith('.ts')).map((file) => `lib/data/${file}`),
    ].map((file) => readFileSync(file, 'utf8')).join('\n');

    expect(Object.keys(registry.documents).length).toBeGreaterThan(50);
    for (const [file, record] of Object.entries(registry.documents)) {
      expect(record.claim === null || vocabulary.includes(record.claim), file).toBe(true);
      expect(record.validUntil === undefined || /^\d{4}-\d{2}-\d{2}$/.test(record.validUntil), file).toBe(true);
      expect(dataText.includes(`/${file}`), `${file} se ne pojavljuje ni u jednom dokumentu`).toBe(true);
    }
  });

  it('PDP: bez potvrde nema kartice; podno grejanje samo ne otvara karticu; izabrana boja zadržava sertifikate kolekcije', async () => {
    expect(await sertifikatiTab('podovi-vinil-aurora')).toBeNull();
    // Bez sertifikata, ali sa eko-činjenicama iz opisa proizvođača → kartica postoji.
    expect(await sertifikatiTab('gerflor-creation-55')).toEqual({
      certifications: [], ecoFeatures: ['Bez ftalata', '35% recikliranog sadržaja', '100% reciklabilno', 'TVOC emisije: < 10 µg/m³'], underfloorHeating: false,
    });
    // Tarkett „Ključne karakteristike" (samo eko-deo; sertifikate menja čišćenje dokumentacije).
    expect((await sertifikatiTab('tarkett-acczent-excellence-compact-plus'))?.ecoFeatures).toEqual(['27% recikliranog sadržaja']);
    expect(await sertifikatiTab('tarkett-somplan-350')).toEqual({ certifications: ['CE', 'EPD'], ecoFeatures: ['Bez ftalata'], underfloorHeating: true });
    // iQ Granit SD više nije izuzet: samo potvrđeno (DoP, EPD, TVOC ≤ 10 µg/m³ po EN 16516).
    expect(await sertifikatiTab('tarkett-iq-granit-sd')).toEqual({
      certifications: ['CE', 'EPD'], ecoFeatures: ['TVOC emisije: ≤ 10 µg/m³ (EN 16516)'], underfloorHeating: true,
    });
    // Boja sa sopstvenim dokumentima (tehnički list, tabela formata) i dalje nosi DoP kolekcije → CE.
    const cloud = await sertifikatiTab('tarkett-cloud');
    expect(cloud?.certifications).toContain('CE');
    expect(await sertifikatiTab('tarkett-cloud', 'tarkett-cloud-color-cloud-2-00-cl-05-1i')).toEqual(cloud);
  }, 120000);
});
