// PDV (VAT) matematika i parsiranje/formatiranje brojeva za stranicu /cenovnik.
// Opšta stopa PDV-a u Srbiji je 20%. Konfigurabilno preko env varijable.

export const VAT_RATE: number = (() => {
  const raw = process.env.NEXT_PUBLIC_CENOVNIK_VAT_RATE;
  const parsed = raw ? Number(raw) : NaN;
  // Dozvoljavamo i unos kao "20" (procenat) i kao "0.2" (udeo).
  if (Number.isFinite(parsed) && parsed > 0) {
    return parsed > 1 ? parsed / 100 : parsed;
  }
  return 0.2;
})();

export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/** Iz cene bez PDV-a izračunaj cenu sa PDV-om. */
export function baseToWithVat(base: number): number {
  return round2(base * (1 + VAT_RATE));
}

/** Iz cene sa PDV-om izračunaj cenu bez PDV-a. */
export function withVatToBase(withVat: number): number {
  return round2(withVat / (1 + VAT_RATE));
}

/**
 * Parsira broj iz korisničkog unosa, tolerišući srpski format.
 * "2.500,50" -> 2500.5 ; "2500,50" -> 2500.5 ; "2500.50" -> 2500.5 ;
 * "2.500" -> 2500 (grupisanje) ; "2.5" -> 2.5 (decimala)
 * Vraća null za prazan/nevalidan unos.
 */
export function parseNum(input: string | number | null | undefined): number | null {
  if (input === null || input === undefined) return null;
  if (typeof input === 'number') return Number.isFinite(input) ? input : null;

  let s = String(input).trim();
  if (!s) return null;
  s = s.replace(/\s/g, '');

  if (s.includes(',')) {
    // Zarez je decimalni separator; tačke su separatori hiljada.
    s = s.replace(/\./g, '').replace(',', '.');
  } else if (/^\d{1,3}(\.\d{3})+$/.test(s)) {
    // Samo tačke, u grupama od po 3 cifre -> separatori hiljada (npr. "2.500" = 2500).
    s = s.replace(/\./g, '');
  }
  // U suprotnom: jedna tačka se tretira kao decimalni separator (npr. "2.5" = 2.5).

  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

/** Formatira broj za prikaz, sa grupisanjem hiljada (npr. 2500.5 -> "2.500,5"). */
export function formatNum(n: number | null | undefined): string {
  if (n === null || n === undefined || !Number.isFinite(n)) return '';
  return n.toLocaleString('sr-RS', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

/**
 * Formatira broj za vrednost <input> polja: BEZ grupisanja hiljada, zarez kao decimala.
 * Garantuje round-trip sa parseNum (npr. 3000 -> "3000", 3000.6 -> "3000,6").
 */
export function formatInput(n: number | null | undefined): string {
  if (n === null || n === undefined || !Number.isFinite(n)) return '';
  return n.toLocaleString('sr-RS', { useGrouping: false, maximumFractionDigits: 2 });
}
