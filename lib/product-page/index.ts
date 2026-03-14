// Barrel export for product page modules
export type { Props, ColorFromJSON, ColorSource, ProductImageType, ProductSpec, ProductDetailsSection } from './types';

export {
    cleanColorName,
    buildSpecsFromColor,
    buildNestedColorSlug,
    buildNestedColorFromCollection,
    mergeSpecs,
    loadColorFromJson,
    colorToProduct,
    collectionFromColor,
    lvtColors,
    linoleumColors,
    vinylCollections,
    esdCollections,
    industrialCollections,
    sportCollections,
} from './color-helpers';

export {
    filterSpecsForDisplay,
    parseDescriptionToSections,
} from './spec-helpers';

export {
    normalizeCollectionSlug,
    resolveProductBySlug,
} from './resolve-product';

export {
    prepareCustomColors,
    mergeSelectedColor,
} from './prepare-colors';
