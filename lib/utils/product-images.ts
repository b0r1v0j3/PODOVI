import { Product, ProductImage } from '@/types';

type ResolvedProductImage = NonNullable<Product['images']>[number];
export type ProductImageSurface = 'thumb' | 'card' | 'hero' | 'og';
export type ProductImageCandidate = {
  url: string;
  alt: string;
};
export type CustomColorHeroSource = {
  slug?: string | null;
  image_url?: string | null;
  texture_url?: string | null;
  lifestyle_url?: string | null;
  image?: string | null;
  name?: string | null;
  full_name?: string | null;
};
export type MetadataImageEntry = {
  url: string;
  alt?: string;
  width?: number;
  height?: number;
};

export function resolveMetadataImageUrl(imageUrl: string, baseUrl: string) {
  const normalizedUrl = String(imageUrl || '').trim();
  if (!normalizedUrl) {
    return null;
  }

  try {
    const resolvedUrl = new URL(normalizedUrl, baseUrl);
    if (resolvedUrl.protocol !== 'https:') {
      return null;
    }

    return resolvedUrl.toString();
  } catch {
    return null;
  }
}

export function createMetadataImage(
  imageUrl: string | null | undefined,
  baseUrl: string,
  options: Omit<MetadataImageEntry, 'url'> = {}
): MetadataImageEntry | null {
  const resolvedUrl = imageUrl ? resolveMetadataImageUrl(imageUrl, baseUrl) : null;
  if (!resolvedUrl) {
    return null;
  }

  return {
    url: resolvedUrl,
    ...(options.alt ? { alt: options.alt } : {}),
    ...(typeof options.width === 'number' ? { width: options.width } : {}),
    ...(typeof options.height === 'number' ? { height: options.height } : {}),
  };
}

export function getMetadataImageUrls(images: Array<MetadataImageEntry | null | undefined>) {
  return images.flatMap((image) => (image?.url ? [image.url] : []));
}

export function getProductImageUrl(image: ProductImage, surface: ProductImageSurface = 'hero') {
  const variants = image.variants || {};

  switch (surface) {
    case 'thumb':
      return variants.thumb || variants.card || variants.hero || image.url;
    case 'card':
      return variants.card || variants.hero || image.url;
    case 'og':
      return variants.og || variants.hero || variants.card || image.url;
    case 'hero':
    default:
      return variants.hero || variants.card || image.url;
  }
}

export function getOrderedProductImages(product: Product, surface: ProductImageSurface = 'hero'): ResolvedProductImage[] {
  const seenUrls = new Set<string>();
  const primaryImage = product.images?.find((image) => image.isPrimary) || product.images?.[0];

  return [primaryImage, ...(product.images || [])]
    .filter((image): image is ProductImage => Boolean(image?.url))
    .map((image) => ({
      ...image,
      url: getProductImageUrl(image, surface),
    }))
    .filter((image) => {
      if (seenUrls.has(image.url)) {
        return false;
      }

      seenUrls.add(image.url);
      return true;
    });
} 

export function getPrimaryProductImage(product: Product, surface: ProductImageSurface = 'hero'): ResolvedProductImage | null {
  return getOrderedProductImages(product, surface)[0] || null;
}

export function normalizeProductImageCandidates(
  primaryCandidate?: Partial<ProductImageCandidate> | null,
  fallbackCandidates: Array<Partial<ProductImageCandidate> | null | undefined> = []
): ProductImageCandidate[] {
  const seenUrls = new Set<string>();
  const normalizedCandidates: ProductImageCandidate[] = [];

  for (const candidate of [primaryCandidate, ...fallbackCandidates]) {
    const url = String(candidate?.url || '').trim();
    if (!url || seenUrls.has(url)) {
      continue;
    }

    seenUrls.add(url);
    normalizedCandidates.push({
      url,
      alt: String(candidate?.alt || primaryCandidate?.alt || '').trim(),
    });
  }

  return normalizedCandidates;
}

export function getProductImageCandidates(product: Product, surface: ProductImageSurface = 'hero') {
  return normalizeProductImageCandidates(
    null,
    getOrderedProductImages(product, surface).map((image) => ({
      url: image.url,
      alt: image.alt || product.name,
    }))
  );
}

export function getColorImageCandidates(color: CustomColorHeroSource | null | undefined) {
  return normalizeProductImageCandidates(
    null,
    [
      {
        url: color?.texture_url || undefined,
        alt: color?.full_name || color?.name || '',
      },
      {
        url: color?.lifestyle_url || undefined,
        alt: color?.full_name || color?.name || '',
      },
      {
        url: color?.image_url || undefined,
        alt: color?.full_name || color?.name || '',
      },
      {
        url: color?.image || undefined,
        alt: color?.full_name || color?.name || '',
      },
    ]
  );
}

export function getPrimaryColorImage(color: CustomColorHeroSource | null | undefined) {
  return getColorImageCandidates(color)[0] || null;
}

export function getCustomColorHeroImageState(
  customColors: Array<CustomColorHeroSource | null | undefined> | null | undefined,
  selectedColorSlug?: string | null,
  initialImage?: ProductImageCandidate | null
) {
  const normalizedSelectedColorSlug = String(selectedColorSlug || '').trim();

  if (!Array.isArray(customColors) || customColors.length === 0) {
    return {
      activeColorSlug: undefined,
      image: initialImage || null,
    };
  }

  if (!normalizedSelectedColorSlug) {
    return {
      activeColorSlug: undefined,
      image: initialImage || null,
    };
  }

  const activeColor = customColors.find((color) => String(color?.slug || '').trim() === normalizedSelectedColorSlug);
  const activeColorImage = getPrimaryColorImage(activeColor);

  if (!activeColorImage?.url) {
    return {
      activeColorSlug: undefined,
      image: initialImage || null,
    };
  }

  return {
    activeColorSlug: normalizedSelectedColorSlug,
    image: {
      url: activeColorImage.url,
      alt: String(activeColorImage.alt || initialImage?.alt || '').trim(),
    },
  };
}

export function getMetadataImageSet(product: Product, baseUrl: string) {
  return getOrderedProductImages(product, 'og')
    .slice(0, 3)
    .map((image) =>
      createMetadataImage(image.url, baseUrl, {
        alt: image.alt || product.name,
        ...(image.variants?.og === image.url ? { width: 1200, height: 630 } : {}),
      })
    )
    .filter((image): image is MetadataImageEntry => Boolean(image));
}
