import { describe, expect, it } from 'vitest';
import {
    getCompatibleAccessorySlugs,
    resolveCompatibleAccessories,
} from '@/lib/product-page/compatible-accessories';
import lajsneData from '@/public/data/tarkett_lajsne_variants.json';
import gerflorStairData from '@/public/data/gerflor_stairs_shower.json';

// Stvarni slugovi lajsni/profila — izvor istine za proveru mape (loader koristi collection.slug).
const VALID_SLUGS = new Set<string>([
    ...((lajsneData as any).collections || []).map((c: any) => c.slug),
    ...(((gerflorStairData as any).collections || (gerflorStairData as any)) as any[]).map((c: any) => c.slug),
]);

// Kategorije podova koje imaju mapiranu kompatibilnost.
const FLOOR_CATEGORIES = ['1', '2', '3', '4', '6', '7', '8', '9', '10'];

describe('Lajsne↔podovi: mapa po sistemu', () => {
    it('svaki mapiran slug postoji kao stvarna lajsna/profil (bez tipfelera)', () => {
        for (const cat of FLOOR_CATEGORIES) {
            for (const slug of getCompatibleAccessorySlugs(cat)) {
                expect(VALID_SLUGS.has(slug), `cat ${cat}: slug "${slug}" mora postojati u podacima`).toBe(true);
            }
        }
    });

    it('rezultat je bez duplikata po kategoriji', () => {
        for (const cat of FLOOR_CATEGORIES) {
            const slugs = getCompatibleAccessorySlugs(cat);
            expect(new Set(slugs).size).toBe(slugs.length);
        }
    });

    it('svaka podna kategorija nudi bar jednu lajsnu', () => {
        for (const cat of FLOOR_CATEGORIES) {
            expect(getCompatibleAccessorySlugs(cat).length).toBeGreaterThan(0);
        }
    });

    it('očekivane specifične veze po sistemu', () => {
        expect(getCompatibleAccessorySlugs('6')).toContain('tarkett-dekorativne-zidne-lajsne-za-lvt'); // LVT
        expect(getCompatibleAccessorySlugs('6')).toContain('gerflor-stair-nosings'); // LVT + Gerflor stepenice
        expect(getCompatibleAccessorySlugs('1')).toContain('tarkett-mdf-lajsne-za-laminat'); // Laminat
        expect(getCompatibleAccessorySlugs('3')).toContain('tarkett-furnir-lajsne-80-20'); // Parket
        expect(getCompatibleAccessorySlugs('10')).toContain('tarkett-lajsne-za-sportske-podove'); // Sport
        expect(getCompatibleAccessorySlugs('8')).toContain(
            'tarkett-trake-za-kontrolu-statickog-elektriciteta-za-podne-obloge-u-rolni',
        ); // Elektroprovodni
        expect(getCompatibleAccessorySlugs('2')).toContain('tarkett-ugao-za-ciste-sobe'); // Vinil (medicinski)
    });

    it('domenske korekcije iz review-a (uzemljeno u opise proizvođača)', () => {
        // SD 60: laminat/linoleum/LVT — NE parket
        expect(getCompatibleAccessorySlugs('1')).toContain('tarkett-lajsna-sd-60'); // Laminat
        expect(getCompatibleAccessorySlugs('6')).toContain('tarkett-lajsna-sd-60'); // LVT
        expect(getCompatibleAccessorySlugs('7')).toContain('tarkett-lajsna-sd-60'); // Linoleum
        expect(getCompatibleAccessorySlugs('3')).not.toContain('tarkett-lajsna-sd-60'); // ne Parket
        // Tarkodry: wet-room PVC podloga — samo Vinil, NE drvo
        expect(getCompatibleAccessorySlugs('2')).toContain('tarkett-tarkodry-podloga-za-podove-i-zidove');
        expect(getCompatibleAccessorySlugs('1')).not.toContain('tarkett-tarkodry-podloga-za-podove-i-zidove');
        expect(getCompatibleAccessorySlugs('3')).not.toContain('tarkett-tarkodry-podloga-za-podove-i-zidove');
        // NON-PVC modularni trim: samo modularne ploče (cat 4), NE PVC vinil/LVT/linoleum
        expect(getCompatibleAccessorySlugs('4')).toContain('tarkett-dekorativne-zidne-lajsne-za-non-pvc-modularne-ploce');
        for (const cat of ['2', '6', '7']) {
            expect(getCompatibleAccessorySlugs(cat)).not.toContain('tarkett-dekorativne-zidne-lajsne-za-non-pvc-modularne-ploce');
        }
    });

    it('nijedna lajsna/profil nije siroče — svaka je u bar jednoj kategoriji', () => {
        const used = new Set<string>();
        for (const cat of FLOOR_CATEGORIES) for (const s of getCompatibleAccessorySlugs(cat)) used.add(s);
        const missing = [...VALID_SLUGS].filter((s) => !used.has(s));
        expect(missing, `nemapirane lajsne: ${missing.join(', ')}`).toEqual([]);
    });

    it('univerzalne lajsne (stepenice/taktilne/traka) su na svakoj podnoj kategoriji', () => {
        for (const cat of FLOOR_CATEGORIES) {
            expect(getCompatibleAccessorySlugs(cat)).toContain('tarkett-lajsne-za-stepenice');
            expect(getCompatibleAccessorySlugs(cat)).toContain('tarkett-tarkett-genius-traka');
        }
    });

    it('kategorije pribora/alata (ne-podne) nemaju mapu', () => {
        for (const cat of ['11', '12', '13', '15', '999']) {
            expect(getCompatibleAccessorySlugs(cat)).toEqual([]);
        }
    });

    it('resolveCompatibleAccessories vraća stvarne proizvode, nikad sam proizvod', () => {
        const lvtFloor = { slug: 'neki-lvt-pod', categoryId: '6', compatibleAccessories: undefined };
        const resolved = resolveCompatibleAccessories(lvtFloor);
        expect(resolved.length).toBeGreaterThan(0);
        for (const acc of resolved) {
            expect(acc.slug).not.toBe(lvtFloor.slug);
            expect(typeof acc.name).toBe('string');
            expect(Array.isArray(acc.images)).toBe(true);
        }
        // ne sme uključiti samog sebe ni kad je slug jedne od lajsni
        const selfLajsna = { slug: 'tarkett-pvc-lajsne', categoryId: '6', compatibleAccessories: undefined };
        expect(resolveCompatibleAccessories(selfLajsna).some((p) => p.slug === 'tarkett-pvc-lajsne')).toBe(false);
    });

    it('eksplicitni compatibleAccessories ima prednost u redosledu', () => {
        const floor = {
            slug: 'pod-x',
            categoryId: '6',
            compatibleAccessories: ['tarkett-metalni-profili'],
        };
        const resolved = resolveCompatibleAccessories(floor);
        expect(resolved[0]?.slug).toBe('tarkett-metalni-profili');
    });
});
