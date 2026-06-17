// tests/contracts/essence-quote-contract.test.ts
import { describe, expect, it } from 'vitest';
import { isComplete, buildEssenceCode, buildEssenceName, buildInquiryHref } from '@/lib/configurator/essence-quote';
import type { EssenceSelection } from '@/lib/configurator/types';

const opt = (code: string, name: string) => ({ code, name, image: null });

const full: EssenceSelection = {
  uzorak: opt('ESS-01', 'Rhombus Diamond Regular'),
  boja: opt('C03', 'Dark Oak'),
  gradacija: opt('E', 'Elegant'),
  obrada: opt('B', 'Brušeno'),
};
const partial: EssenceSelection = { ...full, obrada: null };

describe('essence-quote', () => {
  it('isComplete is true only when all four chosen', () => {
    expect(isComplete(full)).toBe(true);
    expect(isComplete(partial)).toBe(false);
  });

  it('buildEssenceName needs only the pattern', () => {
    expect(buildEssenceName(partial)).toBe('Essence Premium Rhombus Diamond Regular');
    expect(buildEssenceName({ ...full, uzorak: null })).toBeNull();
  });

  it('buildEssenceCode concatenates codes, null when incomplete', () => {
    expect(buildEssenceCode(full)).toBe('ESS-01-C03EB');
    expect(buildEssenceCode(partial)).toBeNull();
  });

  it('buildInquiryHref builds a /upiti link with encoded params', () => {
    const href = buildInquiryHref(full)!;
    expect(href.startsWith('/upiti?')).toBe(true);
    expect(href).toContain('konfigurator=essence');
    expect(href).toContain('sifra=ESS-01-C03EB');
    expect(href).toContain('boja=Dark+Oak');
    expect(href).toContain(encodeURIComponent('Essence Premium Rhombus Diamond Regular').replace(/%20/g, '+'));
    expect(buildInquiryHref(partial)).toBeNull();
  });
});
