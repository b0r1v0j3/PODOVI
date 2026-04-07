import type { Product } from '@/types';
import type {
    OpsCollectionDocument,
    OpsCollectionMetadataPatch,
    OpsDocumentDraftInput,
    OpsInvariantIssue,
    OpsVariantMetadataPatch,
} from './types';

const METADATA_FIELDS = new Set<keyof OpsCollectionMetadataPatch>([
    'name',
    'shortDescription',
    'description',
    'externalLink',
    'detailsSections',
]);

const VARIANT_FIELDS = new Set<keyof OpsVariantMetadataPatch>([
    'name',
    'imageUrl',
    'description',
    'overallThickness',
    'format',
    'dimension',
    'characteristics',
]);

const PDF_REGEX = /\.pdf(?:\?|#|$)/i;

function normalizeDocumentUrl(url: string): string {
    const value = String(url || '').trim();
    if (!value) return '';
    if (!/media\.tarkett-image\.com/i.test(value) || !PDF_REGEX.test(value)) {
        return value;
    }

    return value
        .replace('://media.tarkett-image.com/large-high/', '://media.tarkett-image.com/docs/')
        .replace('://media.tarkett-image.com/large/', '://media.tarkett-image.com/docs/')
        .replace('://media.tarkett-image.com/medium/', '://media.tarkett-image.com/docs/');
}

function validateMetadataFieldValue(
    field: keyof OpsCollectionMetadataPatch,
    value: OpsCollectionMetadataPatch[keyof OpsCollectionMetadataPatch]
): OpsInvariantIssue[] {
    if (field === 'detailsSections') {
        if (
            value !== undefined &&
            !(
                Array.isArray(value) &&
                value.every(
                    (section) =>
                        section &&
                        typeof section.title === 'string' &&
                        Array.isArray(section.items) &&
                        section.items.every((item) => typeof item === 'string')
                )
            )
        ) {
            return [
                {
                    code: 'metadata_value_invalid',
                    level: 'error',
                    field,
                    message: '`detailsSections` mora biti niz sekcija sa `title` i `items[]` stringovima.',
                },
            ];
        }
        return [];
    }

    if (typeof value !== 'string') {
        return [
            {
                code: 'metadata_value_invalid',
                level: 'error',
                field,
                message: `Polje \`${field}\` mora biti string.`,
            },
        ];
    }

    if (field === 'externalLink' && value.trim().length > 0) {
        const isAbsoluteUrl = /^https?:\/\//i.test(value.trim());
        if (!isAbsoluteUrl) {
            return [
                {
                    code: 'metadata_external_link_invalid',
                    level: 'error',
                    field,
                    message: '`externalLink` mora biti apsolutni URL koji počinje sa `http://` ili `https://`.',
                },
            ];
        }
    }

    return [];
}

export function validateMetadataPatch(metadataPatch: OpsCollectionMetadataPatch): OpsInvariantIssue[] {
    const issues: OpsInvariantIssue[] = [];
    const keys = Object.keys(metadataPatch || {}) as (keyof OpsCollectionMetadataPatch)[];

    if (keys.length === 0) {
        issues.push({
            code: 'metadata_patch_empty',
            level: 'error',
            message: 'Metadata draft mora da sadrži makar jedno polje za izmenu.',
        });
        return issues;
    }

    for (const key of keys) {
        if (!METADATA_FIELDS.has(key)) {
            issues.push({
                code: 'metadata_field_invalid',
                level: 'error',
                field: key,
                message: `Polje \`${key}\` nije dozvoljeno u metadata draft-u.`,
            });
            continue;
        }

        issues.push(...validateMetadataFieldValue(key, metadataPatch[key]));
    }

    return issues;
}

export function validateVariantPatch(variantPatch: OpsVariantMetadataPatch): OpsInvariantIssue[] {
    const issues: OpsInvariantIssue[] = [];
    const keys = Object.keys(variantPatch || {}) as (keyof OpsVariantMetadataPatch)[];

    if (keys.length === 0) {
        issues.push({
            code: 'variant_patch_empty',
            level: 'error',
            message: 'Variant draft mora imati makar jedno polje za izmenu.',
        });
        return issues;
    }

    for (const key of keys) {
        if (!VARIANT_FIELDS.has(key)) {
            issues.push({
                code: 'variant_patch_invalid',
                level: 'error',
                field: key,
                message: `Polje \`${key}\` nije dozvoljeno u variant draft-u.`,
            });
            continue;
        }

        const value = variantPatch[key];
        if (key === 'characteristics') {
            if (
                value !== undefined &&
                !(
                    typeof value === 'object' &&
                    value !== null &&
                    Object.values(value).every((entry) => typeof entry === 'string')
                )
            ) {
                issues.push({
                    code: 'variant_patch_invalid',
                    level: 'error',
                    field: key,
                    message: '`characteristics` mora biti objekat sa string vrednostima.',
                });
            }
            continue;
        }

        if (typeof value !== 'string') {
            issues.push({
                code: 'variant_patch_invalid',
                level: 'error',
                field: key,
                message: `Polje \`${key}\` mora biti string vrednost.`,
            });
        }
    }

    return issues;
}

export function validateDocumentDraft(document: OpsDocumentDraftInput): OpsInvariantIssue[] {
    const issues: OpsInvariantIssue[] = [];
    const title = String(document.title || '').trim();
    const rawUrl = String(document.url || '').trim();
    const scope = document.scope || 'collection';

    if (!title) {
        issues.push({
            code: 'document_title_missing',
            level: 'error',
            field: 'title',
            message: 'Dokument mora imati naslov.',
        });
    }

    if (scope === 'variant' && !String(document.variantSlug || '').trim()) {
        issues.push({
            code: 'variant_slug_missing',
            level: 'error',
            field: 'variantSlug',
            message: 'Variant dokument mora imati variantSlug.',
        });
    }

    if (!rawUrl) {
        issues.push({
            code: 'document_url_missing',
            level: 'error',
            field: 'url',
            message: 'Dokument mora imati URL.',
        });
        return issues;
    }

    const normalized = normalizeDocumentUrl(rawUrl);
    if (normalized !== rawUrl) {
        issues.push({
            code: 'document_url_normalized',
            level: 'warning',
            field: 'url',
            message: 'Tarkett URL je automatski normalizovan na `/docs/` CDN putanju.',
        });
    }

    if (normalized.startsWith('/')) {
        if (!normalized.startsWith('/documents/')) {
            issues.push({
                code: 'document_url_local_path',
                level: 'error',
                field: 'url',
                message: 'Lokalni dokument URL mora biti pod `/documents/` putanjom.',
            });
        }
    } else if (!/^https?:\/\//i.test(normalized)) {
        issues.push({
            code: 'document_url_protocol',
            level: 'error',
            field: 'url',
            message: 'Dokument URL mora biti apsolutan (`http/https`) ili lokalan (`/documents/...`).',
        });
    }

    if (!PDF_REGEX.test(normalized)) {
        issues.push({
            code: 'document_url_not_pdf',
            level: 'error',
            field: 'url',
            message: 'Dokument URL mora pokazivati na PDF fajl.',
        });
    }

    return issues;
}

export function validateDocumentSet(documents: OpsCollectionDocument[]): OpsInvariantIssue[] {
    const issues: OpsInvariantIssue[] = [];
    const seenUrls = new Set<string>();

    for (const document of documents) {
        issues.push(...validateDocumentDraft(document));

        const normalized = normalizeDocumentUrl(document.url || '');
        if (!normalized) continue;

        const scope = document.variantSlug ? `variant:${document.variantSlug}` : 'collection';
        const dedupeKey = `${scope}::${normalized}`;

        if (seenUrls.has(dedupeKey)) {
            issues.push({
                code: 'document_duplicate_url',
                level: 'error',
                field: 'url',
                message: `Duplikat dokument URL-a detektovan: ${normalized}`,
            });
        } else {
            seenUrls.add(dedupeKey);
        }
    }

    return issues;
}

export function normalizeDocumentForStorage(document: OpsDocumentDraftInput): OpsCollectionDocument {
    const scope = document.scope || 'collection';
    const normalizedVariantSlug = scope === 'variant' ? String(document.variantSlug || '').trim() : undefined;

    return {
        title: String(document.title || '').trim(),
        url: normalizeDocumentUrl(String(document.url || '').trim()),
        type: document.type ? String(document.type).trim() : undefined,
        locale: document.locale ? String(document.locale).trim() : undefined,
        variantSlug: normalizedVariantSlug,
    };
}

export function productToDocumentSet(product: Product | null): OpsCollectionDocument[] {
    if (!product?.documents) return [];
    return product.documents.map((document) => ({
        title: String(document.title || '').trim(),
        url: normalizeDocumentUrl(String(document.url || '').trim()),
        type: document.type ? String(document.type).trim() : undefined,
    }));
}