// Barrel export for product page modules
export type { Props, ColorFromJSON, ColorSource, ProductImageType, ProductSpec, ProductDetailsSection } from './types';

export {
    cleanColorName,
    buildSpecsFromColor,
    mergeSpecs,
    loadColorFromJson,
    colorToProduct,
    collectionFromColor,
    lvtColors,
    linoleumColors,
    vinylCollections,
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
