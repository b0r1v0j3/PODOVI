import type { ProductSpec } from '@/types';

/**
 * Čist merge specifikacija (kasniji ključ pobeđuje). Namerno BEZ ikakvih
 * data importa: koristi ga i klijentska komponenta ProductCharacteristics,
 * pa bi uvoz iz color-helpers.ts (16 JSON izvora boja) ubacio ~13 MB u
 * klijentski paket PDP-a.
 */
export function mergeSpecs(base: ProductSpec[], extra: ProductSpec[]): ProductSpec[] {
    const merged = new Map<string, ProductSpec>();
    for (const spec of base) {
        merged.set(spec.key, spec);
    }
    for (const spec of extra) {
        merged.set(spec.key, spec);
    }
    return Array.from(merged.values());
}
