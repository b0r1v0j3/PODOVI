// tests/contracts/essence-configurator-contract.test.ts
import { describe, expect, it } from 'vitest';
import { getEssenceConfiguratorData } from '@/lib/data/essence-configurator';

describe('Essence konfigurator — podaci', () => {
  const data = getEssenceConfiguratorData();

  it('ima 19 uzoraka, 20 boja, 3 gradacije, 4 obrade', () => {
    expect(data.patterns).toHaveLength(19);
    expect(data.colors).toHaveLength(20);
    expect(data.gradations).toHaveLength(3);
    expect(data.surfaces).toHaveLength(4);
  });

  it('svaki uzorak ima ESS- šifru, ime, sliku i familiju', () => {
    for (const p of data.patterns) {
      expect(p.code).toMatch(/^ESS-\d{2}$/);
      expect(p.name.length).toBeGreaterThan(0);
      expect(p.image).toBeTruthy();
      expect(['Rhombus', 'Trapezium', 'Mosaic', 'Waves', 'Forest']).toContain(p.family);
    }
  });

  it('svaka osa ima jedinstvene šifre i slike', () => {
    for (const axis of [data.colors, data.gradations, data.surfaces]) {
      const codes = axis.map((o) => o.code);
      expect(new Set(codes).size).toBe(codes.length);
      expect(axis.every((o) => Boolean(o.image))).toBe(true);
    }
  });
});
