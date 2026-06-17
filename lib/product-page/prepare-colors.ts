import type { Product, ProductSpec } from '@/types';
import type { ColorFromJSON } from './types';
import {
    cleanColorName,
    mergeSpecs,
    linoleumColors,
    tarkettLinoleumCollections,
    buildNestedColorSlug,
    vinylCollections,
    esdCollections,
    industrialCollections,
    sportCollections,
    lajsneCollections,
    gerflorStairShowerCollections,
    alpodParketCollections,
    alpodDekingCollections,
    resolveSelectedColorServerData,
} from './color-helpers';
import { getDerivedWeldingCharacteristics } from './welding-helpers';
import { collapseToPatternGroups } from './pattern-groups';
import lvtColorsData from '@/public/data/lvt_colors_complete.json';
import {
    getEffectiveParketCollection,
    getParketCollectionNameBySlug,
    getParketCollectionSlug,
    getParketCollectionVariantSlugs,
} from '@/lib/data/parket-collection-mapping';
import bloqCarpetData from '@/public/data/bloq_carpet_tiles.json';
import dessoCarpetData from '@/public/data/desso_carpet_tiles.json';
import romusToolsData from '@/public/data/romus_tools.json';
import { getAllDekingProducts, getAllGrassProducts, getAllPriborProducts } from '@/lib/utils/productDataLoader';
import { getPrimaryColorImage } from '@/lib/utils/product-images';

function mapNestedCollectionColors(collection: any, context: { categoryId: string }) {
    return (collection.colors || [])
        .filter((color: any) => Boolean(color.image || color.image_url))
        .map((color: any) => ({
        collection: collection.slug,
        collection_name: collection.name,
        code: color.code || '',
        name: color.name,
        full_name: `${color.code || ''} ${color.name}`.trim(),
        slug: color.slug || buildNestedColorSlug(collection, color),
        image_url: color.image || color.image_url || '',
        texture_url: color.image || color.image_url || '',
        lifestyle_url: color.lifestyle_url || undefined, // visoko-rez hero slika (parket po meri)
        image_count: (color.image || color.image_url) ? 1 : 0,
        brandId: color.brandId || collection.brandId,
        characteristics: {
            ...(collection.characteristics || {}),
            ...(color.characteristics || {}),
            ...getDerivedWeldingCharacteristics({
                categoryId: context.categoryId,
                brandId: color.brandId || collection.brandId,
                collectionSlug: collection.slug,
                collectionName: collection.name,
                characteristics: {
                    ...(collection.characteristics || {}),
                    ...(color.characteristics || {}),
                },
                exactWeldingRod: color.welding_rod,
            }),
        },
        format: color.format || collection.characteristics?.Format,
        dimension: color.dimension || collection.characteristics?.Dimenzije,
        overall_thickness: color.overall_thickness || collection.characteristics?.['Ukupna debljina'],
        description: color.description || collection.description || '',
        }));
}

/**
 * Build the customColors array used by ProductColorSelector for variant switching.
 * Handles Parket, Laminat, and BLOQ Carpet categories.
 */
export async function prepareCustomColors(
    product: Product,
    pageSlug: string
): Promise<any[] | undefined> {
    if (product.brandId === '14' && (product.categoryId === '3' || product.categoryId === '5')) {
        const sourceCollections = product.categoryId === '3' ? alpodParketCollections : alpodDekingCollections;
        const collection = sourceCollections.find((col: any) =>
            col.slug === pageSlug ||
            col.slug === product.slug ||
            col.slug === (product as { collectionSlug?: string }).collectionSlug
        );
        if (collection && collection.colors && collection.colors.length > 0) {
            const mapped = mapNestedCollectionColors(collection, { categoryId: product.categoryId });
            // Parket/deking po meri sa malo jedinstvenih slika: grupiši po slici umesto
            // da prikažeš N identičnih swatch-eva (npr. Essence 19 opcija → 3 grupe).
            return collapseToPatternGroups(mapped, collection.slug) ?? mapped;
        }
    }

    // Romus alat sa variant-setom (npr. "Silikon u boji" = 18 boja, svaki sibling zaseban
    // proizvod sa SVOJOM slikom): prikaži siblinge (isti sourceProductId) kao swatch-eve.
    // Samo kad svaki sibling ima jedinstvenu sliku (bez repeticije) → bezbedno za alate
    // čije veličinske varijante dele istu sliku.
    if (product.categoryId === '13') {
        const tools = (romusToolsData as { products?: any[] }).products || [];
        const self = tools.find((t) => t.slug === pageSlug) || tools.find((t) => t.slug === product.slug);
        if (self && self.sourceProductId) {
            const siblings = tools.filter((t) => t.sourceProductId === self.sourceProductId);
            const imgOf = (t: any) => (t.images?.[0]?.url) || t.image || '';
            const uniqueImgs = new Set(siblings.map(imgOf).filter(Boolean));
            if (siblings.length >= 2 && uniqueImgs.size === siblings.length) {
                const ordered = [self, ...siblings.filter((t) => t.slug !== self.slug)]; // trenutni prvi (auto-select)
                return ordered.map((t) => ({
                    collection: self.parentName || 'Romus',
                    collection_name: self.parentName || '',
                    code: t.sku || '', // NE variantName — inače naslov skida code iz name-a (CLOUD-CLOUD="")
                    name: t.variantName || t.name,
                    full_name: t.variantName || t.name,
                    slug: t.slug,
                    image_url: imgOf(t),
                    texture_url: imgOf(t),
                    image_count: 1,
                    characteristics: {},
                }));
            }
        }
    }

    // Parket: customColors iz varijanti iste kolekcije
    if (product.categoryId === '3') {
        const { tarkettProducts } = await import('@/lib/data/tarkett-products');
        const collectionName = getParketCollectionNameBySlug(pageSlug) ?? product.specs?.find(s => s.key === 'collection')?.value ?? null;
        if (collectionName) {
            const explicitSlugs = getParketCollectionVariantSlugs(collectionName);
            const variants = explicitSlugs.length > 0
                ? (explicitSlugs
                    .map(slug => tarkettProducts.find(p =>
                        p.categoryId === '3' &&
                        !(p.sku && String(p.sku).startsWith('PARKET-')) &&
                        p.slug === slug &&
                        getEffectiveParketCollection(p.slug, p.specs?.find(s => s.key === 'collection')?.value) === collectionName
                    ))
                    .filter(Boolean) as typeof tarkettProducts)
                : tarkettProducts.filter(p => {
                    if (p.categoryId !== '3' || (p.sku && String(p.sku).startsWith('PARKET-'))) return false;
                    return getEffectiveParketCollection(p.slug, p.specs?.find(s => s.key === 'collection')?.value) === collectionName;
                });
            if (variants.length > 0) {
                return variants.map(v => ({
                    collection: collectionName,
                    collection_name: collectionName,
                    code: v.sku,
                    name: v.name,
                    full_name: v.name,
                    slug: v.slug,
                    image_url: v.images?.[0]?.url || '',
                    texture_url: v.images?.[0]?.url || '',
                    image_count: v.images?.length ?? 0,
                    characteristics: (v.specs || []).reduce((acc: Record<string, string>, spec: ProductSpec) => {
                        acc[spec.label] = spec.value;
                        return acc;
                    }, {} as Record<string, string>)
                }));
            }
        }
    }

    // Laminat: customColors iz varijanti iste kolekcije
    if (product.categoryId === '1' && product.sku?.startsWith('LAM-')) {
        const { tarkettProducts } = await import('@/lib/data/tarkett-products');
        const collectionName = product.specs?.find(s => s.key === 'collection')?.value ?? null;
        if (collectionName) {
            const variants = tarkettProducts.filter(p =>
                p.categoryId === '1' && !p.sku?.startsWith('LAM-') && p.specs?.find(s => s.key === 'collection')?.value === collectionName
            );
            if (variants.length > 0) {
                const bySlug = new Map<string, typeof variants[0]>();
                for (const v of variants) {
                    if (v.slug && !bySlug.has(v.slug)) bySlug.set(v.slug, v);
                }
                const uniqueVariants = Array.from(bySlug.values());
                return uniqueVariants.map(v => ({
                    collection: collectionName,
                    collection_name: collectionName,
                    code: v.sku,
                    name: v.name,
                    full_name: v.name,
                    slug: v.slug,
                    image_url: v.images?.[0]?.url || '',
                    texture_url: v.images?.[0]?.url || '',
                    image_count: v.images?.length ?? 0,
                    characteristics: (v.specs || []).reduce((acc: Record<string, string>, spec: ProductSpec) => {
                        acc[spec.label] = spec.value;
                        return acc;
                    }, {} as Record<string, string>)
                }));
            }
        }
    }



    // BLOQ Carpet: customColors from bloq_carpet_tiles.json
    if (product.categoryId === '4' && (product.sku === 'BLOQ-CARPET' || product.sku?.startsWith('BLOQ-'))) {
        const bloqColors = (bloqCarpetData as any).colors || [];
        const collectionColors = bloqColors.filter((c: any) => c.collection_slug === pageSlug);
        if (collectionColors.length > 0) {
            return collectionColors.map((c: any) => ({
                collection: c.collection_slug,
                collection_name: c.collection_name,
                code: c.code,
                name: c.name,
                full_name: c.full_name || c.name,
                slug: c.slug,
                image_url: c.image_url || '',
                texture_url: c.image_url || '',
                image_count: c.image_url ? 1 : 0,
                characteristics: c.characteristics || {},
                backing_variants: c.backing_variants,
            }));
        }
    }

    // Desso Carpet (cat 4): customColors from desso_carpet_tiles.json (mirror BLOQ branch).
    // Desso attaches to the existing Tarkett brand; SKU prefix DESSO- on collection products.
    if (product.categoryId === '4' && (product.sku === 'DESSO-CARPET' || product.sku?.startsWith('DESSO-'))) {
        const dessoColors = (dessoCarpetData as any).colors || [];
        // Desso podaci imaju collection_slug bez prefiksa ("desso-futurity"), a kanonski
        // routeSlug za brend Tarkett (id 3) dobija "tarkett-" prefiks → toleriši oba (kao BLOQ koji
        // već ima "bloq-" u podacima). Bez ovoga svih 46 Desso kolekcija pokazuje 0 boja.
        const dessoPageSlug = pageSlug.replace(/^tarkett-/, '');
        const collectionColors = dessoColors.filter((c: any) => c.collection_slug === pageSlug || c.collection_slug === dessoPageSlug);
        if (collectionColors.length > 0) {
            return collectionColors.map((c: any) => ({
                collection: c.collection_slug,
                collection_name: c.collection_name,
                code: c.code,
                name: c.name,
                full_name: c.full_name || c.name,
                slug: c.slug,
                image_url: c.image_url || '',
                texture_url: c.image_url || '',
                image_count: c.image_url ? 1 : 0,
                characteristics: c.characteristics || {},
                backing_variants: c.backing_variants,
            }));
        }
    }

    // Deking: customColors from tis_deking_products.json
    if (product.categoryId === '5' && product.sku?.startsWith('DEKING-')) {
        const collectionName = product.name.replace(' Kolekcija', ''); // e.g. TimberTech EDGE
        const variants = getAllDekingProducts().filter(p => !p.sku?.startsWith('DEKING-'));
        if (variants.length > 0) {
            return variants.map(v => ({
                collection: collectionName,
                collection_name: collectionName,
                code: v.sku || '',
                name: v.name,
                full_name: v.name,
                slug: v.slug,
                image_url: v.images?.[0]?.url || '',
                texture_url: v.images?.[0]?.url || '',
                image_count: v.images?.length ?? 0,
                characteristics: (v.specs || []).reduce((acc: Record<string, string>, spec: ProductSpec) => {
                    acc[spec.label] = spec.value;
                    return acc;
                }, {} as Record<string, string>)
            }));
        }
    }

    // Veštačka trava (cat 14): customColors from tarkett_grass_products.json (mirror deking branch).
    // Grass collections are single-design / colorless ("Cena na upit"), so customColors is
    // typically empty or a single self-entry — the PDP renders the standard (no color selector)
    // layout. SKU prefix GRASS- on grass collection products.
    if (product.categoryId === '14' && product.sku?.startsWith('GRASS-')) {
        const collectionName = product.specs?.find(s => s.key === 'collection')?.value || product.name;
        const variants = getAllGrassProducts().filter(p =>
            (p.specs?.find(s => s.key === 'collection')?.value || p.name) === collectionName
        );
        if (variants.length > 0) {
            return variants.map(v => ({
                collection: collectionName,
                collection_name: collectionName,
                code: v.sku || '',
                name: v.name,
                full_name: v.name,
                slug: v.slug,
                image_url: v.images?.[0]?.url || '',
                texture_url: v.images?.[0]?.url || '',
                image_count: v.images?.length ?? 0,
                characteristics: (v.specs || []).reduce((acc: Record<string, string>, spec: ProductSpec) => {
                    acc[spec.label] = spec.value;
                    return acc;
                }, {} as Record<string, string>)
            }));
        }
    }

    // Pribor (cat 15): customColors from pribor_products.json (mirror grass/deking branch).
    // Accessories (lepkovi, podloge, elektrode, nega) are single-design / colorless, so
    // customColors is typically empty or a single self-entry — the PDP renders the standard
    // (no color selector) layout. SKU prefix PRIBOR- on accessory products.
    if (product.categoryId === '15' && product.sku?.startsWith('PRIBOR-')) {
        const collectionName = product.specs?.find(s => s.key === 'collection')?.value || product.name;
        const variants = getAllPriborProducts().filter(p =>
            (p.specs?.find(s => s.key === 'collection')?.value || p.name) === collectionName
        );
        if (variants.length > 0) {
            return variants.map(v => ({
                collection: collectionName,
                collection_name: collectionName,
                code: v.sku || '',
                name: v.name,
                full_name: v.name,
                slug: v.slug,
                image_url: v.images?.[0]?.url || '',
                texture_url: v.images?.[0]?.url || '',
                image_count: v.images?.length ?? 0,
                characteristics: (v.specs || []).reduce((acc: Record<string, string>, spec: ProductSpec) => {
                    acc[spec.label] = spec.value;
                    return acc;
                }, {} as Record<string, string>)
            }));
        }
    }

    // Tarkett LVT: customColors from tarkett_lvt_products.json
    if (product.categoryId === '6' && product.sku?.startsWith('TARKETT-')) {
        const { getAllTarkettLVTProducts } = await import('@/lib/utils/productDataLoader');
        const collectionName = product.specs?.find(s => s.key === 'collection')?.value ?? null;
        if (collectionName) {
            const variants = getAllTarkettLVTProducts().filter(p =>
                p.specs?.find((s: ProductSpec) => s.key === 'collection')?.value === collectionName
            );
            if (variants.length > 0) {
                return variants.map(v => ({
                    collection: collectionName,
                    collection_name: collectionName,
                    code: v.sku,
                    name: v.name,
                    full_name: v.name,
                    slug: v.slug,
                    image_url: v.images?.[0]?.url || '',
                    texture_url: v.images?.[0]?.url || '',
                    image_count: v.images?.length ?? 0,
                    characteristics: (v.specs || []).reduce((acc: Record<string, string>, spec: ProductSpec) => {
                        acc[spec.label] = spec.value;
                        return acc;
                    }, {} as Record<string, string>)
                }));
            }
        }
    }

    // Vinil (cat 2): customColors from Gerflor + Tarkett nested vinyl JSON sources
    if (product.categoryId === '2') {
        const slugCandidates = [
            product.slug,
            product.slug.replace(/^gerflor-/, ''),
            product.slug.replace(/^tarkett-/, ''),
            product.slug.replace(/^wolflor-/, ''),
        ];
        const vinylCollection = vinylCollections.find((col: any) =>
            slugCandidates.some((candidate) => candidate === col.slug)
        );
        if (vinylCollection && vinylCollection.colors && vinylCollection.colors.length > 0) {
            return mapNestedCollectionColors(vinylCollection, { categoryId: '2' });
        }
    }

    // Gerflor LVT (cat 6): customColors from lvt_colors_complete.json
    if (product.categoryId === '6' && product.slug.startsWith('gerflor-')) {
        const collectionSlug = product.slug.substring('gerflor-'.length);
        const lvtColors = (lvtColorsData as any).colors || [];
        const collectionColors = lvtColors.filter((c: any) => c.collection === collectionSlug);
        if (collectionColors.length > 0) {
            return collectionColors.map((c: any) => ({
                collection: collectionSlug,
                collection_name: c.collection_name || product.name,
                code: c.code || '',
                name: c.name,
                full_name: c.full_name || c.name,
                slug: c.slug,
                image_url: c.image_url || c.texture_url || '',
                texture_url: c.texture_url || c.image_url || '',
                image_count: c.image_count || 1,
                characteristics: c.characteristics || {},
            }));
        }
    }

    // Tarkett linoleum (xf², cat 7): customColors from tarkett_linoleum_colors.json (nested),
    // isto kao vinil/sport. MORA pre Gerflor grane jer Tarkett slug ima 'tarkett-' prefiks.
    if (product.categoryId === '7') {
        const tarkettSlugCandidates = Array.from(new Set([
            product.slug,
            pageSlug,
            product.slug.replace(/^tarkett-/, ''),
            pageSlug.replace(/^tarkett-/, ''),
        ].filter(Boolean)));
        const tarkettLinoCollection = tarkettLinoleumCollections.find((col: any) =>
            tarkettSlugCandidates.includes(col.slug)
        );
        if (tarkettLinoCollection && tarkettLinoCollection.colors && tarkettLinoCollection.colors.length > 0) {
            return mapNestedCollectionColors(tarkettLinoCollection, { categoryId: '7' });
        }
    }

    // Gerflor Linoleum (cat 7): customColors from linoleum_colors_complete.json
    if (product.categoryId === '7') {
        const slugCandidates = Array.from(
            new Set(
                [
                    pageSlug,
                    product.slug,
                    pageSlug.replace(/^gerflor-/, ''),
                    product.slug.replace(/^gerflor-/, ''),
                ].filter(Boolean)
            )
        );
        const collectionColors = linoleumColors.filter((c: any) => slugCandidates.includes(c.collection));
        if (collectionColors.length > 0) {
            return collectionColors.map((c: any) => ({
                collection: c.collection,
                collection_name: c.collection_name || product.name,
                code: c.code || '',
                name: cleanColorName(c.name || ''),
                full_name: c.full_name || c.name,
                slug: c.slug,
                image_url: c.image_url || c.texture_url || '',
                texture_url: c.texture_url || c.image_url || '',
                image_count: c.image_count || 1,
                characteristics: c.characteristics || {},
            }));
        }
    }

    // ESD (cat 8): customColors from esd_colors.json
    if (product.categoryId === '8') {
        // ESD collection slugs do NOT use gerflor- prefix (e.g., mipolam-el5, gti-el5-connect)
        const rawSlug = product.slug;
        const strippedSlug = rawSlug.startsWith('gerflor-') ? rawSlug.substring('gerflor-'.length) : rawSlug;
        const esdCollection = esdCollections.find((col: any) => col.slug === rawSlug || col.slug === strippedSlug);
        if (esdCollection && esdCollection.colors && esdCollection.colors.length > 0) {
            return mapNestedCollectionColors(esdCollection, { categoryId: '8' });
        }
    }

    // Industrijske ploce (cat 9): customColors from industrial_colors.json
    if (product.categoryId === '9' && product.slug.startsWith('gerflor-')) {
        const collectionSlug = product.slug.substring('gerflor-'.length);
        const industrialCollection = industrialCollections.find((col: any) => col.slug === collectionSlug);
        if (industrialCollection && industrialCollection.colors && industrialCollection.colors.length > 0) {
            return mapNestedCollectionColors(industrialCollection, { categoryId: '9' });
        }
    }

    // Sport (cat 10): customColors from sport_colors.json + tarkett_sport_colors.json
    if (product.categoryId === '10') {
        const slugCandidates = [
            product.slug,
            product.slug.replace(/^gerflor-/, ''),
            product.slug.replace(/^tarkett-/, ''),
        ];
        const sportCollection = sportCollections.find((col: any) =>
            slugCandidates.includes(col.slug) ||
            slugCandidates.includes(String(col.slug || '').replace(/^gerflor-/, '').replace(/^tarkett-/, ''))
        );
        if (sportCollection && sportCollection.colors && sportCollection.colors.length > 0) {
            return mapNestedCollectionColors(sportCollection, { categoryId: '10' });
        }
    }

    // Lajsne (cat 11): customColors from tarkett_lajsne_variants.json (Tarkett)
    // ILI gerflor_stairs_shower.json (Gerflor stepenice/tuš — prvo Gerflor prisustvo u cat 11).
    if (product.categoryId === '11') {
        const slugCandidates = [
            product.slug,
            product.slug.replace(/^tarkett-/, ''),
            product.slug.replace(/^gerflor-/, ''),
        ];
        const matchSlug = (col: any) =>
            slugCandidates.includes(col.slug) ||
            slugCandidates.includes(String(col.slug || '').replace(/^tarkett-/, '')) ||
            slugCandidates.includes(String(col.slug || '').replace(/^gerflor-/, ''));
        // Konsultuj OBE liste: Tarkett lajsne i Gerflor stepenice/tuš.
        const lajsneCollection =
            lajsneCollections.find(matchSlug) ||
            gerflorStairShowerCollections.find(matchSlug);
        if (lajsneCollection && lajsneCollection.colors && lajsneCollection.colors.length > 0) {
            return mapNestedCollectionColors(lajsneCollection, { categoryId: '11' });
        }
    }

    return undefined;
}

/**
 * Merge selected color variant data into the product object.
 * Handles LVT/Linoleum/Vinil/Tekstilne color merging, Parket variant merging, and Laminat variant merging.
 */
export async function mergeSelectedColor(
    product: Product,
    selectedColorSlug: string
): Promise<void> {
    // LVT/Linoleum/Vinil/Tekstilne: merge color from JSON
    if (selectedColorSlug && !product.slug.includes(selectedColorSlug) && product.categoryId !== '3' && product.categoryId !== '1') {
        const selectedColorData = await resolveSelectedColorServerData(selectedColorSlug, {
            categoryId: product.categoryId,
            brandId: product.brandId,
        });
        if (selectedColorData?.source.color) {
            const { source, documents, specs } = selectedColorData;
            const cleanedName = cleanColorName(source.color.name);
            const colorCode = source.color.code || '';
            const cleanFullName = colorCode ? `${colorCode} ${cleanedName}` : cleanedName;

            product.name = cleanFullName;
            product.shortDescription = `${source.color.collection_name} - ${cleanedName}`;

            const colorImageUrl = getPrimaryColorImage(source.color)?.url;
            if (colorImageUrl) {
                product.images = [{
                    id: `color-img-${selectedColorSlug}`,
                    url: colorImageUrl,
                    alt: product.name,
                    isPrimary: true,
                    order: 1,
                }];
            }

            if (specs.length > 0) {
                product.specs = mergeSpecs(product.specs, specs);
            }
            if (documents.length > 0) {
                product.documents = documents;
            }
            if (source.color.description && typeof source.color.description === 'string' && source.color.description.trim()) {
                product.description = source.color.description.trim();
            }
        }
    }

    if (selectedColorSlug && product.categoryId === '3' && product.brandId === '14') {
        const selectedColorData = await resolveSelectedColorServerData(selectedColorSlug, {
            categoryId: product.categoryId,
            brandId: product.brandId,
        });
        if (selectedColorData?.source.color) {
            const { source, documents, specs } = selectedColorData;
            product.name = source.color.full_name || source.color.name;
            product.shortDescription = `${source.color.collection_name} - ${source.color.name}`;

            const colorImageUrl = getPrimaryColorImage(source.color)?.url;
            if (colorImageUrl) {
                product.images = [{
                    id: `color-img-${selectedColorSlug}`,
                    url: colorImageUrl,
                    alt: product.name,
                    isPrimary: true,
                    order: 1,
                }];
            }

            if (specs.length > 0) {
                product.specs = mergeSpecs(product.specs, specs);
            }
            if (documents.length > 0) {
                product.documents = documents;
            }
            if (source.color.description && typeof source.color.description === 'string' && source.color.description.trim()) {
                product.description = source.color.description.trim();
            }
        }
    }

    // Romus alat: merge izabrani sibling (Silikon u boji i sl.)
    if (selectedColorSlug && product.categoryId === '13') {
        const tools = (romusToolsData as { products?: any[] }).products || [];
        const sib = tools.find((t) => t.slug === selectedColorSlug);
        if (sib) {
            // Smislen naslov: H1 = varijanta (CLOUD), podnaslov = "Silikon u boji" (ne grupa "Specijalni alati za podove").
            product.name = [sib.parentName, sib.variantName].filter(Boolean).join(' ') || sib.name || product.name;
            product.shortDescription = sib.shortDescription || product.shortDescription;
            if (sib.parentName) {
                const specs = Array.isArray(product.specs) ? [...product.specs] : [];
                const collSpec = { key: 'collection', label: 'Kolekcija', value: sib.parentName };
                const idx = specs.findIndex((s) => s.key === 'collection');
                if (idx >= 0) specs[idx] = collSpec; else specs.push(collSpec);
                product.specs = specs;
            }
            const img = (sib.images && sib.images[0] && sib.images[0].url) || sib.image;
            if (img) product.images = [{ id: `color-img-${selectedColorSlug}`, url: img, alt: sib.name, isPrimary: true, order: 1 }];
            if (sib.description && typeof sib.description === 'string' && sib.description.trim()) product.description = sib.description.trim();
        }
    }

    // Parket: merge selected variant
    if (selectedColorSlug && product.categoryId === '3' && product.sku?.startsWith('PARKET-')) {
        const { tarkettProducts } = await import('@/lib/data/tarkett-products');
        const parketVariant = tarkettProducts.find(p => p.categoryId === '3' && p.slug === selectedColorSlug);
        if (parketVariant) {
            product.name = parketVariant.name;
            product.shortDescription = parketVariant.shortDescription || product.shortDescription;
            if (parketVariant.images && parketVariant.images.length > 0) {
                product.images = parketVariant.images;
            }
            if (parketVariant.specs && parketVariant.specs.length > 0) {
                product.specs = mergeSpecs(product.specs, parketVariant.specs);
            }
            if (parketVariant.documents && parketVariant.documents.length > 0) {
                product.documents = parketVariant.documents;
            }
        }
    }

    // Deking: merge selected variant
    if (selectedColorSlug && product.categoryId === '5' && product.sku?.startsWith('DEKING-')) {
        const dekingVariant = getAllDekingProducts().find(p => p.categoryId === '5' && !p.sku?.startsWith('DEKING-') && p.slug === selectedColorSlug);
        if (dekingVariant) {
            product.name = dekingVariant.name;
            product.shortDescription = dekingVariant.shortDescription || product.shortDescription;
            if (dekingVariant.images && dekingVariant.images.length > 0) {
                product.images = dekingVariant.images;
            }
            if (dekingVariant.specs && dekingVariant.specs.length > 0) {
                product.specs = mergeSpecs(product.specs, dekingVariant.specs);
            }
            if (dekingVariant.documents && dekingVariant.documents.length > 0) {
                product.documents = dekingVariant.documents;
            }
        }
    }

    // Laminat: merge selected variant
    if (selectedColorSlug && product.categoryId === '1' && product.sku?.startsWith('LAM-')) {
        const { tarkettProducts } = await import('@/lib/data/tarkett-products');
        const laminatVariant = tarkettProducts.find(p => p.categoryId === '1' && !p.sku?.startsWith('LAM-') && p.slug === selectedColorSlug);
        if (laminatVariant) {
            product.name = laminatVariant.name;
            product.shortDescription = laminatVariant.shortDescription || product.shortDescription;
            if (laminatVariant.images && laminatVariant.images.length > 0) {
                product.images = laminatVariant.images;
            }
            if (laminatVariant.specs && laminatVariant.specs.length > 0) {
                product.specs = mergeSpecs(product.specs, laminatVariant.specs);
            }
            if (laminatVariant.documents && laminatVariant.documents.length > 0) {
                product.documents = laminatVariant.documents;
            }
        }
    }

}
