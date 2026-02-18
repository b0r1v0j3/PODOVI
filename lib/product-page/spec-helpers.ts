import type { ProductSpec, ProductDetailsSection } from './types';
import { getEffectiveParketCollection } from '@/lib/data/parket-collection-mapping';

/** Za parket varijante zamenjuje "Parket" (kategorija) pravom kolekcijom iz mapiranja. */
export function filterSpecsForDisplay(
    specs: ProductSpec[] | undefined,
    options?: { categoryId?: string; productSlug?: string }
): ProductSpec[] {
    if (!specs || !Array.isArray(specs)) return [];
    return specs
        .map((s) => {
            if (s.key === 'collection' && s.value === 'Parket' && options?.categoryId === '3' && options?.productSlug) {
                const effective = getEffectiveParketCollection(options.productSlug, 'Parket');
                if (effective) return { ...s, value: effective };
            }
            return s;
        })
        .filter((s) => !(s.key === 'collection' && s.value === 'Parket'));
}

export function formatLvtSpecs(specs: Record<string, string>): ProductSpec[] {
    const relevantKeys: Record<string, string> = {
        'total_thickness': 'Ukupna debljina',
        'wear_layer_thickness': 'Debljina habajućeg sloja',
        'total_weight': 'Ukupna masa',
        'classification': 'Klasa upotrebe',
        'laying_direction': 'Pravac polaganja',
        'underfloor_heating': 'Podno grejanje',
        'slip_resistance': 'Otpornost na klizanje',
        'impact_sound_reduction': 'Zvučna izolacija',
        'fire_resistance': 'Otpornost na požar',
        'chemical_resistance': 'Otpornost na hemikalije',
        'castor_chair_resistance': 'Otpornost na točkiće',
        'residual_indentation': 'Rezidualni otisak',
        'surface_treatment': 'Površinski tretman'
    };

    const formattedSpecs: ProductSpec[] = [];

    for (const [key, value] of Object.entries(specs)) {
        // Check if key is relevant or if we should display it anyway
        // For LVT we want to display most technical specs
        // Skip empty values
        if (!value || value === '-') continue;

        // Map key to label if possible, otherwise use key formatted
        let label = relevantKeys[key];

        if (!label) {
            // Basic formatting for unknown keys: replace _ with space, capitalize
            label = key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        }

        formattedSpecs.push({
            key: key,
            label: label,
            value: value
        });
    }

    return formattedSpecs;
}


export function parseDescriptionToSections(description: string): ProductDetailsSection[] {
    if (!description || typeof description !== 'string') {
        return [];
    }

    const sections: ProductDetailsSection[] = [];
    const lines = description.split('\n').map(line => line.trim()).filter(line => line.length > 0);

    let currentSection: ProductDetailsSection | null = null;

    // Section titles to look for (case insensitive, with variations) - both English and Serbian
    const sectionTitles = [
        'Design & Product',
        'Product & Design',
        'Product',
        'Product :',
        'Proizvod',
        'Proizvod:',
        'Dizajn i proizvod',
        'Installation & Maintenance',
        'Installation',
        'Installation :',
        'Ugradnja',
        'Ugradnja:',
        'Ugradnja i održavanje',
        'Maintenance',
        'Održavanje',
        'Market Application',
        'Application',
        'Application :',
        'Primena',
        'Primena:',
        'Environment',
        'Environment :',
        'Okruženje',
        'Okruženje:',
        'Sustainability',
        'Sustainability & Comfort',
        'Održivost',
        'Održivost i komfor',
        'Comfort',
        'Komfor',
        'Technical',
        'Technical and environmental',
        'Tehničke karakteristike',
        'Tehničke specifikacije',
        'Environmental',
        'Ekološke karakteristike',
        // BLOQ-specific section headers
        'Opis',
        'Opis:',
        'Paleta boja',
        'Paleta boja:',
        'Dostupne podloge',
        'Dostupne podloge:',
        'Karakteristike',
        'Karakteristike:',
        'Prednosti',
        'Prednosti:',
    ];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Check if this line is a section title (more flexible matching)
        const isSectionTitle = sectionTitles.some(title => {
            const titleLower = title.toLowerCase();
            const lineLower = line.toLowerCase();

            // Exact match
            if (lineLower === titleLower) return true;

            // Match if line starts with title and either:
            // 1. Ends with colon (":") - e.g., "Proizvod:", "Ugradnja:"
            // 2. Is followed by colon in the original line - e.g., "Product :"
            // 3. Line is short (<30 chars) and starts with title - for single word sections
            if (lineLower.startsWith(titleLower)) {
                if (line.endsWith(':') || line.endsWith(' :') || (line.length < 30 && !line.includes(' '))) {
                    return true;
                }
            }

            // Contains title (for variations like "Technical and environmental")
            if (lineLower.includes(titleLower) && line.length < 60 && (line.endsWith(':') || line.endsWith(' :'))) {
                return true;
            }

            return false;
        });

        if (isSectionTitle) {
            // Save previous section if exists
            if (currentSection && currentSection.items.length > 0) {
                sections.push(currentSection);
            }
            // Start new section
            currentSection = {
                title: line,
                items: []
            };
        } else if (currentSection) {
            // Add as bullet point to current section
            // Skip very short lines that might be just separators or empty
            if (line.length > 3 && !line.match(/^[-=]+$/)) {
                // Strip leading bullet markers (•, -, *) since rendering already uses list-disc
                const cleanedLine = line.replace(/^[•\-\*]\s*/, '');
                currentSection.items.push(cleanedLine || line);
            }
        }
        // If we're before any section, skip intro lines (they're not part of structured sections)
    }

    // Add last section if exists
    if (currentSection && currentSection.items.length > 0) {
        sections.push(currentSection);
    }

    return sections;
}
