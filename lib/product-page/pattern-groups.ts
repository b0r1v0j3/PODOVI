// "Parket po meri" (Alpod) kolekcije imaju mnogo opcija (šara/nijansi) ali samo par
// generičkih foto-uzoraka — alpod.rs nema sliku po varijanti. Umesto da prikažemo N
// identičnih swatch-eva (npr. Essence: 19 "boja" sa istom slikom 11×), grupišemo po
// slici: jedan swatch po jedinstvenoj slici + lista imena varijanti koje mu pripadaju.
// Pošteno i čisto. Poziva se SAMO iz Alpod grane u prepare-colors — ne dira ostale kategorije.

interface AnyColor {
    image_url?: string;
    texture_url?: string;
    name?: string;
    slug?: string;
    collection?: string;
    collection_name?: string;
    [key: string]: unknown;
}

function deriveGroupLabel(names: string[], image: string): string {
    // 1) najčešća prva reč ako pokriva bar pola grupe (Waves 4/4, Forest 4/4, Rhombus 6/11)
    const firstWords = names.map((n) => String(n || '').trim().split(/\s+/)[0]).filter(Boolean);
    if (firstWords.length > 0) {
        const freq: Record<string, number> = {};
        for (const w of firstWords) freq[w] = (freq[w] || 0) + 1;
        const [topWord, topCount] = Object.entries(freq).sort((a, b) => b[1] - a[1])[0];
        if (topCount >= firstWords.length * 0.5) return topWord;
    }
    // 2) opisni token iz imena fajla (essence_rhombus_web → "Rhombus"), preskoči generičke
    const m = image.match(/(?:essence|alpod|parket)_([a-z]+)/i) || image.match(/\/([a-z]+)[_-][a-z0-9]*\.(?:jpg|jpeg|webp|png)/i);
    const token = m && m[1] ? m[1].toLowerCase() : '';
    if (token && !/web|banner|meri|cover|hero|thumb|logo/.test(token)) {
        return token.charAt(0).toUpperCase() + token.slice(1);
    }
    return '';
}

/**
 * Ako kolekcija ima mnogo varijanti a malo jedinstvenih slika, vrati grupisane swatch-eve
 * (jedan po slici, sa `variantList` imenima). Inače vrati null (zadrži normalan prikaz).
 */
export function collapseToPatternGroups(colors: AnyColor[], collectionSlug: string): AnyColor[] | null {
    if (!Array.isArray(colors) || colors.length < 8) return null;

    const byImage = new Map<string, AnyColor[]>();
    for (const c of colors) {
        const img = c.image_url || c.texture_url || '';
        if (!img) return null; // bez slika nema grupisanja
        if (!byImage.has(img)) byImage.set(img, []);
        byImage.get(img)!.push(c);
    }

    const uniqueImages = byImage.size;
    // grupiši samo kad je jaka repeticija: malo slika, mnogo varijanti
    if (uniqueImages > 6 || colors.length < uniqueImages * 2) return null;

    const groups: AnyColor[] = [];
    let i = 0;
    for (const [image, members] of Array.from(byImage.entries())) {
        i += 1;
        const names = members.map((m) => String(m.name || '')).filter(Boolean);
        const label = deriveGroupLabel(names, image);
        groups.push({
            ...members[0],
            slug: `${collectionSlug}-grupa-${i}`,
            image_url: image,
            texture_url: image,
            name: label || (uniqueImages === 1 ? 'Nijanse' : `Grupa ${i}`),
            full_name: label || (uniqueImages === 1 ? 'Nijanse' : `Grupa ${i}`),
            code: `${members.length} opcija`,
            variantList: names,
            isPatternGroup: true,
            // Jedna jedina deljena slika za celu kolekciju = generička (npr. Four Seasons baner
            // koji ne prikazuje parket) → ne prikazuj sliku, samo listu nijansi.
            hideImage: uniqueImages === 1,
        });
    }
    return groups;
}
