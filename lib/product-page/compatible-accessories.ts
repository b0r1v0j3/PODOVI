// Povezivanje lajsni/profila sa podovima — PO SISTEMU poda (vlasnik odobrio 2026-06-16).
// Dezen-na-dezen je nemoguće (lajsne imaju zasebnu paletu od podnih dezena), pa se
// kompatibilnost izvodi iz KATEGORIJE poda. Mapa je jedino mesto za izmene — vlasnik
// može da koriguje koja grupa lajsni ide uz koju kategoriju.
import type { Product } from '@/types';
import {
    getTarkettLajsneCollections,
    getGerflorStairShowerCollections,
} from '@/lib/utils/productDataLoader';

// ── Grupe lajsni/profila (slugovi iz tarkett_lajsne_variants.json + gerflor_stairs_shower.json) ──

// LVT/Vinil zidne lajsne i PVC profili
const LV = [
    'tarkett-dekorativne-zidne-lajsne-za-lvt',
    'tarkett-rigid-decorative-set-on-lajsne',
    'tarkett-polusavitljive-zidne-lajsne',
    'tarkett-fleksibilne-zavrsne-lajsne',
    'tarkett-2-u-1-holker-i-zavrsna-lajsna',
    'tarkett-zidne-lajsne',
    'tarkett-pvc-lajsne',
    'tarkett-pvc-holkeri',
    'tarkett-pvc-profili',
    'tarkett-metalni-profili',
];

// Laminat/Parket — furnir i MDF lajsne, klipse, reparacija (drvni sistem)
const LP = [
    'tarkett-furnir-lajsne-60-16',
    'tarkett-furnir-lajsne-80-20',
    'tarkett-furnir-lajsne-80-20-dizajn-kolekcija',
    'tarkett-mdf-lajsne-za-laminat',
    'tarkett-mdf-bela-dekorativna-lajsna',
    'tarkett-klipse-za-lajsne',
    'tarkett-prateci-asortiman-za-parket-reparacija-parketa',
];

// Lajsna SD 60 — po proizvođačkom opisu pasuje uz laminat, linoleum i LVT (NE parket).
const SD60 = ['tarkett-lajsna-sd-60'];

// Tarkodry — homogena PVC hidroizolaciona podloga za MOKRE prostore (ide pod oblogu/keramiku),
// vinil/wet-room sistem; ne pripada drvenim podovima.
const WET = ['tarkett-tarkodry-podloga-za-podove-i-zidove'];

// Trim za NE-PVC modularne ploče (iD Evolution) — polistiren; pripada modularnim pločama, ne PVC podovima.
const MODULAR = ['tarkett-dekorativne-zidne-lajsne-za-non-pvc-modularne-ploce'];

// Sport podovi
const SP = ['tarkett-lajsne-za-sportske-podove'];

// Elektroprovodni podovi
const ESD = ['tarkett-trake-za-kontrolu-statickog-elektriciteta-za-podne-obloge-u-rolni'];

// Homogeni/medicinski vinil (čiste sobe, zaštita zidova)
const MED = [
    'tarkett-ugao-za-ciste-sobe',
    'tarkett-protectwall-set-on-uglovi',
    'tarkett-prsten-za-cevi',
];

// Univerzalno — primenljivo na sve unutrašnje tvrde/elastične podove (stepenice, taktilne trake, traka za ugradnju)
const UNI = [
    'tarkett-lajsne-za-stepenice',
    'tarkett-pvc-lajsne-za-stepenice',
    'tarkett-taktilne-trake-za-slabovide',
    'tarkett-taktilne-trake-za-upozorenje',
    'tarkett-tarkett-genius-traka',
];

// Gerflor profili
const GERFLOR_STAIRS = ['gerflor-stair-nosings', 'gerflor-stair-clip', 'gerflor-tarastep-pro'];
const GERFLOR_SHOWER = ['gerflor-shower-threshold', 'gerflor-tarafoam-underlayer-shower-system-16-db'];

// ── Mapa: categoryId → grupe lajsni (redosled = redosled prikaza) ──
const ACCESSORY_BY_CATEGORY: Record<string, string[]> = {
    '1': [...LP, ...SD60, ...UNI],                                          // Laminat
    '2': [...LV, ...MED, ...WET, ...GERFLOR_STAIRS, ...GERFLOR_SHOWER, ...UNI], // Vinil
    '3': [...LP, ...UNI],                                                   // Parket
    '4': ['tarkett-metalni-profili', ...MODULAR, ...UNI],                   // Tekstilne/modularne ploče
    '6': [...LV, ...SD60, ...GERFLOR_STAIRS, ...UNI],                       // LVT
    '7': [...LV, ...SD60, ...UNI],                                          // Linoleum
    '8': [...ESD, ...UNI],                                                  // Elektroprovodni
    '9': ['tarkett-metalni-profili', ...UNI],                              // Industrijske ploče
    '10': [...SP, ...UNI],                                                  // Sport
};

/** Slugovi kompatibilnih lajsni/profila za datu kategoriju poda (bez duplikata). */
export function getCompatibleAccessorySlugs(categoryId: string): string[] {
    const slugs = ACCESSORY_BY_CATEGORY[categoryId] || [];
    return Array.from(new Set(slugs));
}

/**
 * Razreši kompatibilne lajsne/profile u stvarne proizvode za prikaz.
 * Eksplicitno `product.compatibleAccessories` (ručna override) ima prednost,
 * pa sledi mapa po kategoriji. Nikad ne uključuje sam proizvod.
 */
export function resolveCompatibleAccessories(
    product: Pick<Product, 'slug' | 'categoryId' | 'compatibleAccessories'>,
): Product[] {
    const order = [
        ...(product.compatibleAccessories || []),
        ...getCompatibleAccessorySlugs(product.categoryId),
    ];
    if (order.length === 0) return [];

    const pool = [...getTarkettLajsneCollections(), ...getGerflorStairShowerCollections()];
    const bySlug = new Map(pool.map((p) => [p.slug, p]));

    const seen = new Set<string>();
    const out: Product[] = [];
    for (const slug of order) {
        if (slug === product.slug || seen.has(slug)) continue;
        seen.add(slug);
        const p = bySlug.get(slug);
        if (p) out.push(p);
    }
    return out;
}
