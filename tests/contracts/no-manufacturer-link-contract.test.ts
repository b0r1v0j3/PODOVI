import { readFileSync } from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';

// Vlasnik 26.11.2026: stranice proizvoda ne vode kupca na sajt proizvođača ili dobavljača
// (tarkett.rs, gerflor-cee.com, alpod.rs) — sav materijal (slike, PDF, specifikacije) je kod nas.
// Podatak `externalLink` ostaje u katalogu (interni alati), samo se ne prikazuje.
const FILES = [
  'components/ProductColorSelector.tsx',
  'app/proizvodi/[slug]/page.tsx',
  'app/proizvodi/welding-rod/[ref]/page.tsx',
];

describe('stranice proizvoda bez linka ka sajtu proizvođača', () => {
  it.each(FILES)('%s ne renderuje externalLink / officialUrl kao link', (file) => {
    const src = readFileSync(path.join(process.cwd(), file), 'utf8');
    expect(src).not.toMatch(/href=\{[^}]*(externalLink|officialUrl)/);
    expect(src).not.toMatch(/Pogledaj na sajtu proizvođača|Pogledaj izvorni katalog|Zvanični izvor:/);
  });
});
