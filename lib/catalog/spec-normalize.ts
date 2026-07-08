import { Brand } from '@/types';

/**
 * Kanonski spec key iz labele. Istorijski su postojala DVA algoritma
 * (productDataLoader.characteristicLabelToKey: underscore + skida dijakritike;
 * color-helpers.toSpecKey: crtica + zadržava rupe od dijakritika), pa se
 * "Habajući sloj" mapirao u 'habajuci_sloj' odnosno 'habaju-i-sloj' i spec
 * merge po key-u je pravio duple redove. OVO je jedina ispravna implementacija —
 * oba mesta moraju da je koriste.
 */
export function specKeyFromLabel(label: string): string {
  // Ponašanje identično istorijskom characteristicLabelToKey iz productDataLoader
  // (bez đ→dj mape!) — ključevi tipa 'habajuci_sloj' su već upisani u podatke i
  // filtere, pa svaka promena algoritma lomi postojeće ključeve.
  return (
    String(label || '')
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '') || 'spec'
  );
}

/**
 * Kanonska normalizacija vrednosti debljine iz spec-ova i URL parametara.
 * Ista logika mora da važi na SVIM mestima poređenja (repository, kategorija
 * strana, filter komponenta) — istorijski su postojale tri kopije sa različitim
 * ishodima, pa je "?thickness=8" radio a "?thickness=8.00" vraćao 0 rezultata.
 *
 * "8" | "8,0" | "8.00 mm" | " 8mm " → "8.00"; nevalidan ulaz → null.
 */
export function normalizeThicknessValue(raw: string | number | null | undefined): string | null {
  if (raw === null || raw === undefined) return null;
  const cleaned = String(raw)
    .replace(/,/g, '.')
    .replace(/\s+/g, '')
    .replace(/mm/gi, '')
    .trim();
  if (!cleaned) return null;
  const parsed = parseFloat(cleaned);
  return Number.isNaN(parsed) ? null : parsed.toFixed(2);
}

/**
 * Alpod opis varijante nosi pokrivnost pakovanja: "... 10/3,6x120x1200 mm (1,5840 m2)".
 * Jedna implementacija za loader i PDP merge — vrednost puni Product.coveragePerPackage.
 */
export function parseCoverageM2(text: unknown): number | undefined {
  const match = String(text || '').match(/\(([\d.,]+)\s*m2?\)/i);
  if (!match) return undefined;
  const value = parseFloat(match[1].replace(',', '.'));
  return Number.isFinite(value) && value > 0 ? value : undefined;
}

/**
 * Brendovi čiji proizvodi dolaze iz Alpod importa i dele isti data pipeline:
 * '14' = Podovi (interni brend za artikle bez izdvojenog proizvođača),
 * '16' = Admonter (izdvojen brend proizvođača, odluka vlasnika 08.07.2026).
 * SVE grane koje su ranije proveravale brandId === '14' za Alpod ponašanje
 * moraju da koriste ovu proveru — inače Admonter proizvodi ispadaju iz toka.
 */
export function isAlpodImportBrand(brandId: string | undefined): boolean {
  return brandId === '14' || brandId === '16';
}

/**
 * Mapira sirove tokene iz URL parametra ?brands= u poznate brand ID-jeve.
 * UI upisuje legacy ID ('3' za Tarkett), ali ručno kucani/podeljeni URL-ovi
 * često nose ime ili slug brenda — prihvatamo sva tri oblika, a nepoznate
 * tokene odbacujemo (bolje "bez filtera" nego prazna strana rezultata).
 */
export function resolveBrandTokens(tokens: string[], brands: Brand[]): string[] {
  const resolved: string[] = [];
  for (const rawToken of tokens) {
    const token = rawToken.trim();
    if (!token) continue;
    const lower = token.toLowerCase();
    const match = brands.find(
      (brand) =>
        brand.id === token ||
        brand.slug.toLowerCase() === lower ||
        brand.name.toLowerCase() === lower
    );
    if (match && !resolved.includes(match.id)) {
      resolved.push(match.id);
    }
  }
  return resolved;
}
