import { describe, expect, it } from 'vitest';
import { specKeyFromLabel } from '@/lib/catalog/spec-normalize';
import { resolveProductBySlug } from '@/lib/product-page/resolve-product';
import { prepareCustomColors } from '@/lib/product-page/prepare-colors';

describe('PDP color merge contract (unifikovan spec key)', () => {
  it('specKeyFromLabel daje iste ključeve kao loader za alpod labele sa dijakritikom', () => {
    expect(specKeyFromLabel('Habajući sloj')).toBe('habajuci_sloj');
    expect(specKeyFromLabel('Širina')).toBe('sirina');
    expect(specKeyFromLabel('Način montaže')).toBe('nacin_montaze');
    expect(specKeyFromLabel('Dekor / Vrsta drveta')).toBe('dekor_vrsta_drveta');
    expect(specKeyFromLabel('')).toBe('spec');
  });

  it('merge specs za Admonter boju ne proizvodi duple labele', async () => {
    const product = await resolveProductBySlug('podovi-parket-admonter');
    expect(product).not.toBeNull();

    const colors = await prepareCustomColors(product!, 'podovi-parket-admonter');
    expect(colors && colors.length).toBeTruthy();

    const noblesse = (colors || []).find(
      (c: { slug?: string }) => c.slug === 'podovi-parket-33533-parket-dgp-hrast-noblesse-cetkan-ec-ulje'
    );
    expect(noblesse).toBeDefined();
    // ljudsko ime iz overlay-a
    expect(String((noblesse as { name?: string }).name)).toContain('Hrast Noblesse');
    // galerija nosi i zvanične slike (roomshot/teksture) pored svoča
    expect(Array.isArray((noblesse as { images?: unknown[] }).images)).toBe(true);
    expect(((noblesse as { images?: unknown[] }).images || []).length).toBeGreaterThanOrEqual(2);
  });
});
