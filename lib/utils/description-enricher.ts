import { Product } from '@/types';

/**
 * Generates a rich product description based on available metadata.
 * Used when the existing description is missing, too short, or generic.
 */
export function enrichProductDescription(product: Product): string {
    // If description is already substantial (arbitrary threshold like 100 chars), return it
    if (product.description && product.description.length > 100 && product.description !== product.name) {
        return product.description;
    }

    // Extract key data
    const brand = product.brandId === '3' ? 'Tarkett' :
        product.brandId === '6' ? 'Gerflor' :
            product.brandId === '8' ? 'BLOQ' :
                product.brandId === '11' ? 'Wolflor' : '';

    const categoryMap: Record<string, string> = {
        '1': 'laminat',
        '2': 'vinil',
        '3': 'parket',
        '4': 'tekstilne ploče',
        '6': 'LVT',
        '7': 'linoleum',
        '8': 'elektroprovodni pod',
        '9': 'industrijske ploče',
        '10': 'sportski pod',
    };
    const categoryName = categoryMap[product.categoryId] || 'podna obloga';

    const collectionSpec = product.specs?.find(s => s.key === 'collection');
    const collectionName = collectionSpec?.value || '';

    const thicknessSpec = product.specs?.find(s => s.key === 'thickness' || s.key === 'overall_thickness' || s.key === 'debljina');
    const wearLayerSpec = product.specs?.find(s => s.key === 'wear_layer' || s.key === 'zastitni_sloj');
    const classSpec = product.specs?.find(s => s.key === 'classification' || s.key === 'klasa_upotrebe');

    // Build pieces
    const intro = collectionName
        ? `**${collectionName}** je vrhunska ${categoryName} kolekcija` + (brand ? ` brenda ${brand}` : '') + '.'
        : `${product.name} je kvalitetan ${categoryName}` + (brand ? ` od proizvođača ${brand}` : '') + '.';

    let specsPart = '';
    if (thicknessSpec) {
        specsPart += ` Sa ukupnom debljinom od **${thicknessSpec.value}**`;
    }
    if (wearLayerSpec) {
        specsPart += specsPart ? ` i zaštitnim slojem od **${wearLayerSpec.value}**` : ` Poseduje zaštitni sloj od **${wearLayerSpec.value}**`;
    }
    if (specsPart) specsPart += ', ovaj pod nudi izuzetnu izdržljivost i dugotrajnost.';

    let usagePart = '';
    if (classSpec) {
        const cls = parseInt(classSpec.value.replace(/\D/g, ''));
        if (cls >= 31) {
            usagePart = ' Zahvaljujući visokoj klasi upotrebe, idealan je za **komercijalne prostore** visoke frekvencije, kancelarije i prodajne objekte, ali i za domove koji traže vrhunske performanse.';
        } else {
            usagePart = ' Dizajniran za udobnost i funkcionalnost, savršen je izbor za **stambene prostore**, dnevne sobe i spavaće sobe.';
        }
    }

    const aestheticsPart = ` Dekor **${product.name}** donosi autentičan izgled i modernu estetik u vaš enterijer, lako se uklapajući uz različite stilove nameštaja.`;

    const conclusion = ' Laka ugradnja i jednostavno održavanje čine ovaj pod pametnom investicijom za svaki prostor.';

    // Assemble
    const generated = [intro, specsPart, usagePart, aestheticsPart, conclusion].filter(Boolean).join('');

    return generated;
}

/**
 * Generates a short description for product cards.
 */
export function enrichShortDescription(product: Product): string {
    if (product.shortDescription && product.shortDescription.length > 10 && product.shortDescription !== product.name) {
        return product.shortDescription;
    }

    const categoryMap: Record<string, string> = {
        '1': 'Laminat visokog kvaliteta',
        '2': 'Profesionalni vinil',
        '3': 'Prirodni parket',
        '4': 'Tekstilne ploče',
        '6': 'LVT podna obloga',
        '7': 'Prirodni linoleum',
        '8': 'Elektroprovodni pod',
        '9': 'Industrijske ploče',
        '10': 'Sportski pod',
    };

    const base = categoryMap[product.categoryId] || 'Podna obloga';
    const thicknessSpec = product.specs?.find(s => s.key === 'thickness' || s.key === 'overall_thickness');
    const classSpec = product.specs?.find(s => s.key === 'classification' || s.key === 'klasa_upotrebe');

    let result = base;
    if (thicknessSpec) result += `, debljina ${thicknessSpec.value}`;
    if (classSpec) result += `, klasa ${classSpec.value}`;

    return result + '.';
}
