import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound, redirect } from 'next/navigation';
import { Product } from '@/types';
import Breadcrumbs from '@/components/Breadcrumbs';
import ProductColorSelector from '@/components/ProductColorSelector';
import ColorGrid from '@/components/ColorGrid';
import ProductActions from '@/components/ProductActions';
import ProductDocuments from '@/components/ProductDocuments';
import RecommendedAccessories from '@/components/RecommendedAccessories';
import EcoFeatures from '@/components/EcoFeatures';
import CertificationBadges from '@/components/CertificationBadges';
import RelatedProducts from '@/components/RelatedProducts';
import RecentlyViewed from '@/components/RecentlyViewed';
import ProductInquiryStickyCTA from '@/components/ProductInquiryStickyCTA';
import ProductViewTracker from '@/components/ProductViewTracker';
import ProductDetailsTabs from '@/components/ProductDetailsTabs';
import ProductImage from '@/components/ProductImage';
import ProductCharacteristics from '@/components/ProductCharacteristics';
import ProductDescriptionWithCharacteristics from '@/components/ProductDescriptionWithCharacteristics';
import ProductBenefits from '@/components/ProductBenefits';
import { categoryRepository } from '@/lib/repositories/category-repository';
import { brandRepository } from '@/lib/repositories/brand-repository';
import {
  Props,
  resolveProductBySlug,
  loadColorFromJson,
  colorToProduct,
  filterSpecsForDisplay,
  parseDescriptionToSections,
  prepareCustomColors,
  mergeSelectedColor,
} from '@/lib/product-page';
import { resolveSelectedColorServerData } from '@/lib/product-page/color-helpers';
import { enrichProductDescription, enrichShortDescription } from '@/lib/utils/description-enricher';
import { splitProductTitle } from '@/lib/utils/name-parser';
import { getParketCollectionVariantSlugs, getEffectiveParketCollection, getParketCollectionSlug } from '@/lib/data/parket-collection-mapping';
import { tarkettProducts } from '@/lib/data/tarkett-products';
import { getAllDekingProducts } from '@/lib/utils/productDataLoader';
import documentsIndexData from '@/public/data/documents_index.json';
import tarkettDocumentsIndexData from '@/public/data/tarkett_documents_index.json';
import { SITE_URL } from '@/lib/seo/site-config';
import { generateBreadcrumbSchema, generateProductSchema } from '@/lib/seo/structured-data';
import { getCanonicalCollectionAliasHref, getCanonicalProductHref, getCanonicalProductRouteSlug, normalizeCollectionSlugForProductRoute } from '@/lib/utils/product-routes';
import { getMetadataImageSet, getMetadataImageUrls, getOrderedProductImages } from '@/lib/utils/product-images';

export const dynamic = 'force-dynamic';

type DocumentsIndex = Record<string, Record<string, Array<{ title: string; url: string }>>>;

type ProductDocumentItem = { title: string; url: string; type?: string };

// Mirrors normalizeDocumentUrl in components/ProductDocuments.tsx so the SSR-hydrated
// initial list matches what the client effect derives for the no-?color= case.
function normalizeProductDocumentUrl(url: string): string {
  const value = String(url || '').trim();
  if (!value) return '';
  if (!/media\.tarkett-image\.com/i.test(value) || !/\.pdf(?:\?|$)/i.test(value)) {
    return value;
  }

  return value
    .replace('://media.tarkett-image.com/large-high/', '://media.tarkett-image.com/docs/')
    .replace('://media.tarkett-image.com/large/', '://media.tarkett-image.com/docs/')
    .replace('://media.tarkett-image.com/medium/', '://media.tarkett-image.com/docs/');
}

// Mirrors normalizeDocuments in components/ProductDocuments.tsx (trim/default titles,
// normalize urls, drop empties and duplicates).
function normalizeProductDocuments(documents: ProductDocumentItem[]): { title: string; url: string }[] {
  const seen = new Set<string>();

  return documents.reduce<{ title: string; url: string }[]>((result, document) => {
    const url = normalizeProductDocumentUrl(document?.url || '');
    if (!url || seen.has(url)) {
      return result;
    }

    seen.add(url);
    result.push({
      title: String(document?.title || '').trim() || 'Dokument',
      url,
    });
    return result;
  }, []);
}

function cloneProductForPage<T extends Product & { collectionSlug?: string }>(product: T): T {
  return {
    ...product,
    images: (product.images || []).map((image) => ({ ...image })),
    specs: (product.specs || []).map((spec) => ({ ...spec })),
    documents: product.documents?.map((document) => ({ ...document })),
    detailsSections: product.detailsSections?.map((section) => ({
      ...section,
      items: [...section.items],
    })),
    compatibleAccessories: product.compatibleAccessories ? [...product.compatibleAccessories] : undefined,
  };
}

function extractRouteSlugFromProductHref(href: string) {
  return href.replace(/^\/proizvodi\//, '').split('?')[0] || href;
}

function getDirectColorCanonicalHref(
  product: Product & { collectionSlug?: string },
  routeSlug: string
): string | null {
  if (!['2', '10'].includes(product.categoryId)) {
    return null;
  }

  if (!product.collectionSlug || product.slug !== routeSlug) {
    return null;
  }

  const canonicalHref = getCanonicalProductHref(product);
  return canonicalHref.startsWith('/proizvodi/') ? canonicalHref : null;
}

async function resolveCanonicalSelectedColorSlug(
  product: Product & { collectionSlug?: string },
  routeSlug: string,
  requestedColorSlug: string
): Promise<string> {
  if (!requestedColorSlug) {
    return '';
  }

  if (product.categoryId === '12') {
    return '';
  }

  if (product.categoryId === '3' && product.sku?.startsWith('PARKET-')) {
    const collectionName = product.specs.find((spec) => spec.key === 'collection')?.value;
    const validSlugs = collectionName ? getParketCollectionVariantSlugs(collectionName) : [];
    if (validSlugs.length === 0) {
      return '';
    }
    return validSlugs.includes(requestedColorSlug) ? requestedColorSlug : validSlugs[0];
  }

  if (product.categoryId === '1' && product.sku?.startsWith('LAM-')) {
    const collectionName = product.specs?.find((spec) => spec.key === 'collection')?.value;
    const variants = collectionName
      ? tarkettProducts.filter((item) =>
        item.categoryId === '1' &&
        !item.sku?.startsWith('LAM-') &&
        item.specs?.find((spec) => spec.key === 'collection')?.value === collectionName
      )
      : [];
    const validSlugs = variants.map((item) => item.slug);
    if (validSlugs.length === 0) {
      return '';
    }
    return validSlugs.includes(requestedColorSlug) ? requestedColorSlug : validSlugs[0];
  }

  const canonicalAliasHref = getCanonicalCollectionAliasHref(routeSlug, product, requestedColorSlug);
  const validationRouteSlug = canonicalAliasHref
    ? extractRouteSlugFromProductHref(canonicalAliasHref)
    : routeSlug;
  const validationProduct = validationRouteSlug === product.slug
    ? product
    : {
      ...product,
      slug: validationRouteSlug,
    };

  const customColors = await prepareCustomColors(validationProduct, validationRouteSlug);
  const validSlugs = (customColors || [])
    .map((color: { slug?: string }) => color.slug)
    .filter((slug): slug is string => Boolean(slug));

  if (validSlugs.length > 0) {
    return validSlugs.includes(requestedColorSlug) ? requestedColorSlug : validSlugs[0];
  }

  const selectedColorData = await resolveSelectedColorServerData(requestedColorSlug, {
    categoryId: product.categoryId,
    brandId: product.brandId,
  });

  return selectedColorData ? requestedColorSlug : '';
}

function normalizeMetadataText(value: string) {
  return value.replace(/\s+/g, ' ').trim();
}

function stripTrailingPunctuation(value: string) {
  return normalizeMetadataText(value).replace(/[.!?]+$/g, '').trim();
}

function dedupeMetadataValues(values: string[]) {
  const seenValues = new Set<string>();

  return values.filter((value) => {
    const normalizedValue = normalizeMetadataText(value).toLowerCase();
    if (!normalizedValue || seenValues.has(normalizedValue)) {
      return false;
    }

    seenValues.add(normalizedValue);
    return true;
  });
}

// ─── Metadata ────────────────────────────────────────────────────────────────

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const baseUrl = SITE_URL;
  const routeSlug = getCanonicalProductRouteSlug(params.slug);

  try {
    const requestedColorSlug = typeof searchParams?.color === 'string' ? searchParams.color : '';
    let selectedColorSlug = requestedColorSlug;
    let product: (Product & { collectionSlug?: string }) | null = null;

    const { tarkettProducts } = await import('@/lib/data/tarkett-products');

    product = await resolveProductBySlug(routeSlug);

    if (!product) {
      return { metadataBase: new URL(baseUrl), title: 'Proizvod nije pronađen' };
    }

    product = cloneProductForPage(product);
    const directColorCanonicalHref = getDirectColorCanonicalHref(product, routeSlug);

    if (requestedColorSlug && !directColorCanonicalHref) {
      selectedColorSlug = await resolveCanonicalSelectedColorSlug(product, routeSlug, requestedColorSlug);
      if (selectedColorSlug) {
        await mergeSelectedColor(product, selectedColorSlug);
      }
    }

    const category = product.categoryId ? await categoryRepository.findById(product.categoryId) : null;
    const brand = product.brandId ? await brandRepository.findById(product.brandId) : null;
    const metadataImages = getMetadataImageSet(product, baseUrl);
    const twitterImages = getMetadataImageUrls(metadataImages);
    const isTechemCatalogCategory = product.categoryId === '12';

    // ── Clean product name: strip color code prefix and brand prefix ──
    let cleanName = product.name;
    // Strip color code prefix (e.g., "0347 BALLERINA" → "BALLERINA")
    const codeMatch = cleanName.match(/^(\d{3,5})\s+(.+)$/);
    if (codeMatch) {
      cleanName = codeMatch[2];
    }
    // Strip brand prefix (e.g., "Gerflor Creation 40 Clic" → "Creation 40 Clic")
    if (brand?.name && cleanName.toLowerCase().startsWith(brand.name.toLowerCase() + ' ')) {
      cleanName = cleanName.substring(brand.name.length + 1);
    }

    // ── Collection name for context ──
    const collectionSpec = product.specs?.find((s: { key: string }) => s.key === 'collection');
    let collectionName = collectionSpec?.value || '';
    // Fallback: if no collection spec and a color was selected, resolve parent product name
    if (!collectionName && selectedColorSlug) {
      const parentProduct = await resolveProductBySlug(routeSlug);
      if (parentProduct) {
        collectionName = parentProduct.name;
        // Strip brand prefix from parent name too
        if (brand?.name && collectionName.toLowerCase().startsWith(brand.name.toLowerCase() + ' ')) {
          collectionName = collectionName.substring(brand.name.length + 1);
        }
      }
    }

    // ── Build title: "ColorName - CollectionName | podovi.online" ──
    const brandText = brand ? brand.name : '';
    const categoryText = category ? category.name : '';
    const techemFamily = product.specs?.find((spec: { key: string }) => spec.key === '__techem_family')?.value || '';
    const techemTopCategory = product.specs?.find((spec: { key: string }) => spec.key === '__techem_top_category')?.value || '';
    const hasProductDocuments = Boolean(product.documents?.length);
    let pageTitle: string;
    if (collectionName && collectionName !== cleanName) {
      // "BALLERINA - Creation 40 Clic | podovi.online"
      pageTitle = `${cleanName} - ${collectionName} | podovi.online`;
    } else {
      pageTitle = `${cleanName} | podovi.online`;
    }

    // ── Try to get a clean text description from product.description ──
    let cleanCollectionDesc = '';
    if (product.description) {
      cleanCollectionDesc = product.description.replace(/<[^>]*>?/gm, '').replace(/\s+/g, ' ').trim();
      // Keep first sentence or ~150 chars
      const firstSentenceMatch = cleanCollectionDesc.match(/^([^.!?]*[.!?])/);
      if (firstSentenceMatch && firstSentenceMatch[1].length > 20) {
        cleanCollectionDesc = firstSentenceMatch[1];
      } else if (cleanCollectionDesc.length > 150) {
        cleanCollectionDesc = cleanCollectionDesc.substring(0, 147) + '...';
      }
    }

    // ── Meta description: proper sentence ──
    const shortDesc = product.shortDescription || '';
    let metaDescription: string;

    if (isTechemCatalogCategory) {
      const techemDescriptionParts = [
        stripTrailingPunctuation(shortDesc),
        cleanCollectionDesc && normalizeMetadataText(cleanCollectionDesc) !== normalizeMetadataText(shortDesc)
          ? stripTrailingPunctuation(cleanCollectionDesc)
          : '',
      ].filter(Boolean);

      if (techemDescriptionParts.length === 0) {
        const fallbackScope = [
          cleanName,
          collectionName && collectionName.toLowerCase() !== cleanName.toLowerCase() ? `iz sistema ${collectionName}` : '',
          brandText ? `brenda ${brandText}` : '',
        ].filter(Boolean).join(' ');

        metaDescription = hasProductDocuments
          ? `${fallbackScope}. Tehničke specifikacije, dokumentacija i detalji na podovi.online.`
          : `${fallbackScope}. Tehničke specifikacije i detalji na podovi.online.`;
      } else {
        metaDescription = `${techemDescriptionParts.join('. ')}.`;

        if (!/tehni|dokument/i.test(metaDescription)) {
          metaDescription += hasProductDocuments
            ? ' Tehničke specifikacije i dokumentacija na podovi.online.'
            : ' Tehničke specifikacije i detalji na podovi.online.';
        }
      }
    } else if (cleanCollectionDesc && cleanCollectionDesc.length > 20 && cleanCollectionDesc !== shortDesc) {
      // Merge shortDesc and collection desc if they differ
      metaDescription = `${shortDesc ? shortDesc + '. ' : ''}${cleanCollectionDesc}`;
      // Append brand
      if (brandText) metaDescription += ` | ${brandText}`;
    } else if (shortDesc) {
      metaDescription = `${shortDesc}${brandText ? ` | ${brandText}` : ''}${categoryText ? ` | ${categoryText}` : ''}`;
    } else {
      const parts = [cleanName, collectionName, brandText, categoryText].filter(Boolean);
      metaDescription = `${parts.join(' - ')}. Cena, tehničke specifikacije i dostupne boje na podovi.online.`;
    }

    // ── OG tags ──
    const finalDescription = metaDescription.substring(0, 160);
    const ogTitle = dedupeMetadataValues([cleanName, collectionName, brandText].filter(Boolean)).join(' - ');
    const ogDescription = isTechemCatalogCategory ? finalDescription : shortDesc || finalDescription;
    const keywords = dedupeMetadataValues([
      cleanName,
      collectionName,
      brandText,
      categoryText,
      techemFamily,
      techemTopCategory,
      'podovi',
      'podne obloge',
      'Srbija',
    ].filter(Boolean)).join(', ');

    const urlWithColor = selectedColorSlug
      ? `${baseUrl}/proizvodi/${routeSlug}?color=${encodeURIComponent(selectedColorSlug)}`
      : `${baseUrl}/proizvodi/${routeSlug}`;
    const canonicalCollectionAliasHref = getCanonicalCollectionAliasHref(routeSlug, product, selectedColorSlug);
    const canonicalUrl = directColorCanonicalHref
      ? `${baseUrl}${directColorCanonicalHref}`
      : canonicalCollectionAliasHref
      ? `${baseUrl}${canonicalCollectionAliasHref}`
      : urlWithColor;

    return {
      metadataBase: new URL(baseUrl),
      title: pageTitle,
      description: finalDescription,
      keywords,
      authors: [{ name: 'podovi.online' }],
      openGraph: {
        title: ogTitle,
        description: ogDescription,
        type: 'website',
        locale: 'sr_RS',
        url: canonicalUrl,
        siteName: 'podovi.online',
        images: metadataImages,
      },
      twitter: {
        card: 'summary_large_image',
        title: ogTitle,
        description: ogDescription,
        images: twitterImages,
      },
      alternates: { canonical: canonicalUrl },
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return { metadataBase: new URL(baseUrl), title: 'Proizvod | podovi.online', description: '' };
  }
}

// ─── Page Component ──────────────────────────────────────────────────────────

export default async function ProductPage({ params, searchParams }: Props) {
  try {
    const routeSlug = getCanonicalProductRouteSlug(params.slug);
    if (routeSlug && routeSlug !== params.slug) {
      const colorParam = typeof searchParams?.color === 'string' && searchParams.color
        ? `?color=${encodeURIComponent(searchParams.color)}`
        : '';
      redirect(`/proizvodi/${routeSlug}${colorParam}`);
    }

    const categorySlugMap: Record<string, string> = {
      '1': 'laminat',
      '6': 'lvt',
      '7': 'linoleum',
      '4': 'tekstilne-ploce',
      '2': 'vinil',
      '5': 'deking',
      '8': 'elektroprovodni',
      '9': 'industrijske-ploce',
      '10': 'sport',
      '11': 'lajsne',
      '12': 'otiraci',
      '14': 'vestacka-trava',
      '15': 'pribor',
    };

    // ── Resolve product ──
    const requestedColorSlug = typeof searchParams?.color === 'string' ? searchParams.color : '';
    let selectedColorSlug = requestedColorSlug;
    const resolvedProduct = await resolveProductBySlug(routeSlug);
    if (!resolvedProduct) notFound();
    const product = cloneProductForPage(resolvedProduct);
    const directColorCanonicalHref = getDirectColorCanonicalHref(product, routeSlug);

    if (directColorCanonicalHref) {
      redirect(directColorCanonicalHref);
    }

    selectedColorSlug = await resolveCanonicalSelectedColorSlug(product, routeSlug, requestedColorSlug);

    const canonicalCollectionAliasHref = getCanonicalCollectionAliasHref(routeSlug, product, selectedColorSlug);
    const canonicalRouteSlug = canonicalCollectionAliasHref
      ? extractRouteSlugFromProductHref(canonicalCollectionAliasHref)
      : routeSlug;

    if (canonicalRouteSlug !== routeSlug || requestedColorSlug !== selectedColorSlug) {
      const colorParam = selectedColorSlug
        ? `?color=${encodeURIComponent(selectedColorSlug)}`
        : '';
      redirect(`/proizvodi/${canonicalRouteSlug}${colorParam}`);
    }

    // ── Parket: redirect invalid color to first valid ──
    if (product.categoryId === '3' && product.sku?.startsWith('PARKET-') && selectedColorSlug) {
      const collectionSpec = product.specs.find(s => s.key === 'collection');
      const collectionName = collectionSpec?.value;
      const validSlugs = collectionName ? getParketCollectionVariantSlugs(collectionName) : [];
      if (validSlugs.length > 0 && !validSlugs.includes(selectedColorSlug)) {
        redirect(`/proizvodi/${routeSlug}?color=${encodeURIComponent(validSlugs[0])}`);
      }
    }

    // ── Laminat: redirect invalid color to first valid ──
    if (product.categoryId === '1' && product.sku?.startsWith('LAM-') && selectedColorSlug) {
      const collectionName = product.specs?.find(s => s.key === 'collection')?.value;
      const variants = collectionName
        ? tarkettProducts.filter(p => p.categoryId === '1' && !p.sku?.startsWith('LAM-') && p.specs?.find(s => s.key === 'collection')?.value === collectionName)
        : [];
      const validSlugs = variants.map(p => p.slug);
      if (validSlugs.length > 0 && !validSlugs.includes(selectedColorSlug)) {
        redirect(`/proizvodi/${routeSlug}?color=${encodeURIComponent(validSlugs[0])}`);
      }
    }

    // ── Deking: redirect collection to first valid color ──
    if (product.categoryId === '5' && product.sku?.startsWith('DEKING-') && !selectedColorSlug) {
      const variants = getAllDekingProducts().filter(p => p.categoryId === '5' && !p.sku?.startsWith('DEKING-'));
      if (variants.length > 0) {
        redirect(`/proizvodi/${routeSlug}?color=${encodeURIComponent(variants[0].slug)}`);
      }
    }

    // ── Redirect color-tiles to collection page with ?color= ──
    const collectionSlugFromProduct = (product as { collectionSlug?: string }).collectionSlug;
    const isBloqCollection = product.sku === 'BLOQ-CARPET' || product.sku?.startsWith('BLOQ-');
    const isTarkettCollection = product.sku?.startsWith('TARKETT-');
    const isPodoviImportedProduct = product.brandId === '14';
    // For deking (category 5), since we don't have separate collection pages, we should not redirect
    const shouldRedirectCollection = ['6', '7', '4', '2', '8', '9', '10', '11'].includes(product.categoryId) || (isPodoviImportedProduct && product.categoryId === '5');

    if (shouldRedirectCollection && collectionSlugFromProduct && !isBloqCollection && !isTarkettCollection) {
      const normalizedCollectionSlug = normalizeCollectionSlugForProductRoute(
        collectionSlugFromProduct,
        product.brandId,
        product.categoryId
      );
      redirect(`/proizvodi/${normalizedCollectionSlug}?color=${encodeURIComponent(product.slug)}`);
    }

    // ── Parket variant: redirect to collection page with ?color= ──
    if (product.categoryId === '3' && isPodoviImportedProduct && collectionSlugFromProduct) {
      redirect(`/proizvodi/${collectionSlugFromProduct}?color=${encodeURIComponent(product.slug)}`);
    }

    if (product.categoryId === '3' && product.sku && !product.sku.startsWith('PARKET-')) {
      const collectionSpec = product.specs.find(s => s.key === 'collection');
      const collectionName = getEffectiveParketCollection(product.slug, collectionSpec?.value);
      const collectionSlug = collectionName ? getParketCollectionSlug(collectionName) : null;
      if (collectionSlug) {
        redirect(`/proizvodi/${collectionSlug}?color=${encodeURIComponent(product.slug)}`);
      }
    }

    // ── Laminat variant: redirect to collection page with ?color= ──
    if (product.categoryId === '1' && product.sku && !product.sku.startsWith('LAM-')) {
      const collectionName = product.specs?.find(s => s.key === 'collection')?.value;
      const collectionSlug = collectionName ? collectionName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') : null;
      if (collectionSlug) {
        const { redirect } = await import('next/navigation');
        redirect(`/proizvodi/${collectionSlug}?color=${encodeURIComponent(product.slug)}`);
      }
    }

    // ── Defensive defaults ──
    if (!product.images || !Array.isArray(product.images)) product.images = [];
    if (!product.specs || !Array.isArray(product.specs)) product.specs = [];
    if (!product.name || typeof product.name !== 'string') product.name = 'Proizvod';
    if (!product.shortDescription || typeof product.shortDescription !== 'string' || product.shortDescription === product.name) {
      product.shortDescription = enrichShortDescription(product);
    }
    if (!product.description || typeof product.description !== 'string' || product.description.length < 50 || product.description === product.name) {
      product.description = enrichProductDescription(product);
    }

    // ── Save original name before color merge (merge overwrites product.name with color name) ──
    const originalProductName = product.name;

    // ── Merge selected color variant ──
    if (selectedColorSlug) {
      await mergeSelectedColor(product, selectedColorSlug);
    }

    // ── Display name: strip "Gerflor " prefix for LVT ──
    const displayName = product.categoryId === '6' && product.name.startsWith('Gerflor ')
      ? product.name.replace(/^Gerflor\s+/, '')
      : product.name;

    if (!product.slug || typeof product.slug !== 'string') product.slug = routeSlug;
    if (!product.categoryId || typeof product.categoryId !== 'string') product.categoryId = '6';
    if (!product.brandId || typeof product.brandId !== 'string') product.brandId = '6';

    // ── Load related data ──
    const category = product.categoryId ? await categoryRepository.findById(product.categoryId) : null;
    let brand = product.brandId ? await brandRepository.findById(product.brandId) : null;

    // Fallback brand map for brands not yet in Supabase
    if (!brand && product.brandId) {
      const FALLBACK_BRANDS: Record<string, { id: string; name: string; slug: string; logo: string; description: string }> = {
        '3': { id: '3', name: 'Tarkett', slug: 'tarkett', logo: '/images/brands/tarkett.svg', description: 'Tarkett' },
        '8': { id: '8', name: 'BLOQ', slug: 'bloq', logo: '/images/brands/bloq.svg', description: 'BLOQ' },
        '10': { id: '10', name: 'TimberTech', slug: 'timbertech', logo: '/images/brands/timbertech.svg', description: 'TimberTech' },
        '11': { id: '11', name: 'Wolflor', slug: 'wolflor', logo: '/images/brands/wolflor-logo.png', description: 'Wolflor' },
        '12': { id: '12', name: 'Techem', slug: 'techem', logo: '/images/brands/techem-logo-en.png', description: 'Techem' },
        '13': { id: '13', name: 'Romus', slug: 'romus', logo: '/images/brands/romus-logo.png', description: 'Romus' },
        '14': { id: '14', name: 'Podovi', slug: 'podovi', logo: '', description: 'Podovi' },
      };
      brand = FALLBACK_BRANDS[product.brandId] || null;
    }
    const orderedHeroImages = getOrderedProductImages(product, 'hero');
    let primaryImage = orderedHeroImages[0] || null;

    // ── Prepare color variants ──
    const customColors = await prepareCustomColors(product, routeSlug);

    if (product.categoryId === '12' && selectedColorSlug) {
      redirect(`/proizvodi/${routeSlug}`);
    }

    // ── Redirect invalid color to first valid variant on the server ──
    if (selectedColorSlug && customColors && customColors.length > 0) {
      const validSlugs = customColors
        .map((color: { slug?: string }) => color.slug)
        .filter((slug): slug is string => Boolean(slug));

      if (validSlugs.length > 0 && !validSlugs.includes(selectedColorSlug)) {
        redirect(`/proizvodi/${routeSlug}?color=${encodeURIComponent(validSlugs[0])}`);
      }
    }

    // ── Redirect invalid JSON-backed color params to the collection page ──
    if (selectedColorSlug && (!customColors || customColors.length === 0) && ['2', '6', '7', '8', '9', '10', '11'].includes(product.categoryId)) {
      const colorSource = await loadColorFromJson(selectedColorSlug);
      if (!colorSource) {
        redirect(`/proizvodi/${routeSlug}`);
      }
    }

    // ── Load compatible accessories (lajsne/profili po sistemu poda) ──
    let accessoryProducts: Product[] = [];
    {
      const { resolveCompatibleAccessories } = await import('@/lib/product-page/compatible-accessories');
      accessoryProducts = resolveCompatibleAccessories(product);
    }

    // ── Laminat: fallback image from first variant ──
    if (product.categoryId === '1' && !primaryImage && customColors && customColors.length > 0) {
      const firstImg = (customColors[0] as { image_url?: string; texture_url?: string }).image_url || (customColors[0] as { texture_url?: string }).texture_url;
      if (firstImg) {
        primaryImage = {
          id: `${product.id}-laminat-fallback`,
          url: firstImg,
          alt: product.name,
          isPrimary: true,
          order: 0,
        };
      }
    }

    // ── Schema.org ──
    const baseUrl = SITE_URL;
    const currentProductUrl = `${baseUrl}/proizvodi/${routeSlug}${selectedColorSlug ? `?color=${encodeURIComponent(selectedColorSlug)}` : ''}`;
    const metadataImages = getMetadataImageSet(product, baseUrl);
    const primaryMetadataImage = metadataImages[0];
    const schemaData = {
      ...generateProductSchema(product, brand, category, {
        image: primaryMetadataImage?.url,
        url: currentProductUrl,
        baseUrl,
      }),
      offers: product.price && product.price > 0 ? {
        '@type': 'Offer',
        price: product.price,
        priceCurrency: 'RSD',
        availability: product.inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
        url: currentProductUrl,
        priceValidUntil: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
      } : undefined,
    };

    // ── Determine if this is a "color selector" category ──
    const isTechemCatalogCategory = product.categoryId === '12';
    const isPodoviDekingCollection = product.brandId === '14' && product.categoryId === '5';
    const isColorSelectorCategory = !isTechemCatalogCategory && (['6', '7', '4', '2', '3', '1', '8', '9', '10', '11'].includes(product.categoryId) || isPodoviDekingCollection);

    // ── Helper JSX logic to populate masonry columns neatly ──
    const sharedCertsAndEco = (['6', '7', '4', '2', '8', '9', '10'].includes(product.categoryId)) ? (
      <>
        <div className="h-full">
          <h3 className="eyebrow mb-6">Sertifikati kvaliteta</h3>
          <CertificationBadges certifications={
            product.brandId === '8'
              ? ["Cradle to Cradle Silver", "Indoor Air Comfort Gold", "BREEAM A+", "GreenTag Level A", "CE"]
              : product.categoryId === '10' && product.brandId === '3'
                ? ["CE", "DoP", "REACH", "Indoor Air Quality", "Niske VOC emisije"]
              : ["FloorScore", "Indoor Air Comfort Gold", "M1", "A+", "CE", "REACH", "EPD"]
          } />
        </div>

        <div className="h-full">
          <EcoFeatures
            features={product.brandId === '8'
              ? ["Cradle to Cradle Silver", "ECONYL® reciklirana vlakna", "70% reciklirani materijali u podlozi", "Smanjenje buke"]
              : product.categoryId === '7'
                ? ["98% prirodnih sastojaka", "100% reciklabilno", "Niske VOC emisije", "Antibakterijsko"]
                : product.categoryId === '10' && product.brandId === '3'
                  ? ["Niske VOC emisije", "Sportska otpornost", "Lako odrzavanje", "Dug vek trajanja"]
                : product.categoryId === '10'
                  ? ["98% prirodnih sastojaka", "Niske VOC emisije", "Sportska otpornost", "Lako odrzavanje"]
                  : product.categoryId === '9'
                    ? ["Brza renovacija", "Visoka otpornost na saobracaj", "Laka parcijalna zamena", "Nisko odrzavanje"]
                : product.categoryId === '4'
                  ? ["Bez ftalata", "100% reciklabilno", "Smanjenje buke", "Laka ugradnja"]
                  : ["Bez ftalata", "100% reciklabilno", "30% recikliranog sadržaja", "Niske VOC emisije"]
            }
            underfloorHeating={product.brandId !== '8'}
          />
        </div>
      </>
    ) : null;

    const documentsCategoryKey = product.categoryId === '1'
      ? 'laminat'
      : product.categoryId === '3'
        ? 'parket'
        : product.categoryId === '6'
      ? 'lvt'
      : product.categoryId === '4'
        ? 'carpet'
        : product.categoryId === '7'
          ? 'linoleum'
            : product.categoryId === '2'
              ? 'vinil'
              : product.categoryId === '8'
                ? 'elektroprovodni'
                : product.categoryId === '9'
                  ? 'industrijske-ploce'
                  : product.categoryId === '10'
                    ? 'sport'
              : '';
    const documentsIndex = (['1', '3'].includes(product.categoryId)
      ? tarkettDocumentsIndexData
      : documentsIndexData) as DocumentsIndex;
    const normalizedCollectionSlug = product.slug
      .replace(/^gerflor-/, '')
      .replace(/^tarkett-/, '')
      .replace(/^wolflor-/, '');
    const hasIndexedDocuments = Boolean(
      documentsCategoryKey &&
      documentsIndex[documentsCategoryKey]?.[normalizedCollectionSlug]?.length
    );

    // Server-side replica of the list the ProductDocuments effect derives when no ?color=
    // is present: normalized index docs win when the category prefers the index ('1'/'3')
    // or when the product has no documents of its own; otherwise the product's docs win.
    const indexedCollectionDocuments = documentsCategoryKey
      ? normalizeProductDocuments(documentsIndex[documentsCategoryKey]?.[normalizedCollectionSlug] ?? [])
      : [];
    const normalizedProductDocuments = normalizeProductDocuments(product.documents || []);
    const preferIndexedDocuments = ['1', '3'].includes(product.categoryId);
    const initialProductDocuments =
      indexedCollectionDocuments.length > 0 && (preferIndexedDocuments || normalizedProductDocuments.length === 0)
        ? indexedCollectionDocuments
        : normalizedProductDocuments;

    const sharedDocs = ((product.documents && product.documents.length > 0) || hasIndexedDocuments) ? (
      <div className="h-full">
        <ProductDocuments
          initialDocuments={selectedColorSlug ? (product.documents || []) : initialProductDocuments}
          categoryId={product.categoryId}
          collectionSlug={product.slug}
        />
      </div>
    ) : null;

    // Lep naziv kolekcije za breadcrumb: prvo iz `collection` spec-a; ako ga nema,
    // umesto sirovog sluga (npr. "gerflor-creation-55-clic") prikaži uredan naziv
    // ("Creation 55 Clic") — skini brend prefiks, zameni crtice, Title Case.
    const prettifyCollectionSlug = (value: string) =>
      value
        .replace(/^(gerflor|tarkett|wolflor|techem|romus|bloq|timbertech|podovi)-/i, '')
        .replace(/-/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .replace(/\b\w/g, (ch) => ch.toUpperCase());
    const rawCollectionSlug = (product as { collectionSlug?: string }).collectionSlug || routeSlug;
    const collectionLabel = product.specs?.find((spec) => spec.key === 'collection')?.value
      || (rawCollectionSlug ? prettifyCollectionSlug(rawCollectionSlug) : '');
    const collectionHref = (product as { collectionSlug?: string }).collectionSlug && (product as { collectionSlug?: string }).collectionSlug !== routeSlug
      ? `/proizvodi/${(product as { collectionSlug?: string }).collectionSlug}`
      : undefined;
    const showSeparateCollectionBreadcrumb =
      !selectedColorSlug &&
      Boolean(collectionLabel) &&
      collectionLabel.toLowerCase() !== displayName.toLowerCase();
    const categoryBreadcrumbSchemaItems = category
      ? [{ name: category.name, url: `${baseUrl}/kategorije/${category.slug}` }]
      : [];
    const categoryBreadcrumbItems = category
      ? [{ label: category.name, href: `/kategorije/${category.slug}` }]
      : [];
    const breadcrumbSchemaItems = [
      ...categoryBreadcrumbSchemaItems,
      ...(selectedColorSlug
        ? (collectionLabel
          ? [{ name: collectionLabel, url: `${baseUrl}/proizvodi/${routeSlug}` }]
          : [])
        : (showSeparateCollectionBreadcrumb && collectionHref
          ? [{ name: collectionLabel, url: new URL(collectionHref, baseUrl).toString() }]
          : [])),
      { name: displayName, url: currentProductUrl },
    ];

    return (
      <>
        {/* Schema.org JSON-LD */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([
              schemaData,
              generateBreadcrumbSchema(breadcrumbSchemaItems),
            ]),
          }}
        />

        <ProductViewTracker product={{
          id: product.id,
          name: (() => {
            const rawCollection = product.specs?.find((s: any) => s.key === 'collection')?.value || (product as { collectionSlug?: string }).collectionSlug;
            const { collection, color } = splitProductTitle(displayName, rawCollection);
            return collection && collection.toLowerCase() !== color.toLowerCase() ? `${color} (${collection})` : color;
          })(),
          slug: product.slug,
          images: product.images,
          price: product.price
        }} />

        <div className="min-h-screen bg-white">
          {/* Product Content */}
          <div className="container py-8 pb-20 md:pb-12">
            <div className="mb-4">
              <Breadcrumbs
                items={[
                  ...categoryBreadcrumbItems,
                  ...(selectedColorSlug ? [
                    {
                      label: collectionLabel,
                      href: `/proizvodi/${routeSlug}`
                    },
                    { label: displayName }
                  ] : showSeparateCollectionBreadcrumb ? [
                    {
                      label: collectionLabel,
                      href: collectionHref,
                    },
                    { label: displayName },
                  ] : [
                    { label: displayName }
                  ])
                ]}
              />
            </div>
            {isColorSelectorCategory ? (
              <>
                {/* LVT, Linoleum, Parket, Laminat, Vinil, Tekstilne: layout sa color selectorom */}
                <ProductColorSelector
                  key={`${product.slug}`}
                  initialImage={primaryImage}
                  imagePriority={true}
                  collectionSlug={(product as { collectionSlug?: string }).collectionSlug || routeSlug}
                  productName={displayName}
                  originalProductName={originalProductName}
                  productPrice={product.price && product.price > 0 ? product.price : undefined}
                  priceUnit={product.priceUnit}
                  brand={brand ? { name: brand.name, slug: brand.slug, logo: brand.logo } : null}
                  shortDescription={product.shortDescription}
                  specs={filterSpecsForDisplay(product.specs, { categoryId: product.categoryId, productSlug: product.slug })}
                  inStock={product.inStock}
                  productSlug={product.slug}
                  externalLink={product.externalLink}
                  customColors={(product.categoryId === '3' || product.categoryId === '1' || (product.categoryId === '4' && product.sku?.startsWith('BLOQ'))) ? (customColors ?? []) : customColors}
                  collectionDisplayName={product.specs.find(s => s.key === 'collection')?.value}
                  collectionCategoryLabel={
                    product.categoryId === '3' ? 'Parket'
                      : product.categoryId === '1' ? 'Laminat'
                        : product.categoryId === '6' ? 'LVT'
                          : product.categoryId === '7' ? 'Linoleum'
                            : product.categoryId === '2' ? 'Vinil'
                              : product.categoryId === '5' ? 'Deking'
                                : product.categoryId === '4' ? 'Tekstilne ploče'
                                : product.categoryId === '8' ? 'ESD'
                                  : product.categoryId === '9' ? 'Industrijske ploče'
                                    : product.categoryId === '10' ? 'Sport'
                                      : product.categoryId === '11' ? 'Lajsne'
                                  : undefined
                    }
                    apiCategory={product.categoryId === '11' ? 'lajsne' : product.categoryId === '5' && product.brandId === '14' ? 'deking' : undefined}
                    uiMode={product.categoryId === '11' || (product.categoryId === '5' && product.brandId === '14') || Boolean((customColors as Array<{ isPatternGroup?: boolean }> | undefined)?.[0]?.isPatternGroup) ? 'variants' : 'colors'}
                    videoEmbedUrl={routeSlug === 'privilege-waltz' || product.specs?.find(s => s.key === 'collection')?.value === 'Privilege Waltz' ? 'https://www.youtube.com/embed/0g9jyUd3fPk' : undefined}
                    inquiryRef={product.specs?.find(s => s.key === 'ref' || s.key === 'Ref.')?.value}
                    productId={product.id}
                    hideColorSelector={
                      (product.categoryId === '5' && !(product.brandId === '14' && customColors && customColors.length > 0)) ||
                      (['2', '9', '10'].includes(product.categoryId) && (!customColors || customColors.length === 0))
                    }
                  />
              </>
            ) : (
              /* Non-color-selector categories - standard layout */
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-start">
                {/* Image Section */}
                <div>
                  <div className="aspect-square relative overflow-hidden bg-paper">
                    {primaryImage ? (
                      <ProductImage
                        sources={orderedHeroImages}
                        alt={primaryImage.alt}
                        className={product.categoryId === '5' ? 'object-cover object-left' : 'object-cover'}
                        sizes="(max-width: 768px) 100vw, 50vw"
                        quality={100}
                        priority={true}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-ink-500">
                        <span>Bez slike</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Info Section */}
                <div className="space-y-8 lg:sticky lg:top-24 lg:self-start">
                  {brand?.name && <p className="eyebrow">{brand.name}</p>}

                  <div>
                    {(() => {
                      const collectionName = product.specs?.find((s: any) => s.key === 'collection')?.value;
                      const fallbackCollection = (product as { collectionSlug?: string }).collectionSlug;
                      const { collection, color } = splitProductTitle(displayName, collectionName || fallbackCollection);
                      return (
                        <>
                          <h1 className="text-3xl md:text-4xl font-normal tracking-tight text-ink-900 mb-2">{color}</h1>
                          {collection && (
                            <p className="text-base text-ink-600 mb-4">{collection}</p>
                          )}
                        </>
                      );
                    })()}
                    {product.shortDescription && (
                      <p className="text-base text-ink-600">{product.shortDescription}</p>
                    )}
                  </div>

                  {(product.price !== undefined && product.price > 0) ? (
                    <p className="text-[13px] text-ink-500">
                      {product.price.toLocaleString('sr-RS')} RSD{product.priceUnit ? ` / ${product.priceUnit}` : ''}
                    </p>
                  ) : (
                    <p className="text-[13px] text-ink-500">Cena na upit</p>
                  )}

                  {/* CTA Buttons */}
                  <div className="flex flex-col gap-5">
                    <Link
                      href={(() => {
                        const p = new URLSearchParams();
                        p.set('product', product.slug);
                        if (searchParams?.color) p.set('color', searchParams.color);
                        const refSpec = product.specs?.find(s => s.key === 'ref' || s.key === 'Ref.');
                        if (refSpec?.value) p.set('ref', refSpec.value);
                        return `/upiti?${p.toString()}`;
                      })()}
                      className="btn-primary block w-full text-center min-h-[44px]"
                    >
                      Pošaljite upit
                    </Link>
                    {product.externalLink && (
                      <a
                        href={product.externalLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-link self-start"
                      >
                        {product.brandId === '14' ? 'Pogledaj izvorni katalog' : 'Pogledaj na sajtu proizvođača'} →
                      </a>
                    )}
                  </div>

                  <ProductActions product={product} />
                </div>
              </div>
            )}

            {/* Product Details Tabs (Universal Layout) */}
            {(() => {
              const displaySpecs = filterSpecsForDisplay(product.specs, { categoryId: product.categoryId, productSlug: product.slug });
              const useFilteredSpecs = (product.categoryId === '3' || product.categoryId === '1' || product.categoryId === '6')
                ? displaySpecs.filter((s) => s.key !== 'collection' && s.key !== 'type')
                : displaySpecs;

              const tabs = [];

              // Tab 1: Description
              const descriptionContent = (product.categoryId === '3' || product.categoryId === '1' || product.categoryId === '6') ? (
                <ProductDescriptionWithCharacteristics
                  description={product.description || ''}
                  characteristicsSection={product.detailsSections?.find(
                    (s) => s.title === 'Ključne karakteristike'
                  )}
                />
              ) : (
                <DescriptionSection product={product} />
              );

              if (product.categoryId !== '5') {
                tabs.push({
                  id: 'description',
                  label: 'Opis proizvoda',
                  content: (
                    <div className="text-ink-600">
                      {descriptionContent}
                    </div>
                  )
                });
              }

              // Tab 2: Specifications
              if (useFilteredSpecs.length > 0) {
                tabs.push({
                  id: 'specs',
                  label: 'Tehničke specifikacije',
                  content: (
                    <ProductCharacteristics
                      specs={useFilteredSpecs}
                      categoryId={product.categoryId}
                      title=""
                    />
                  )
                });
              }

              // Tab 3: Certificates & Eco
              if (sharedCertsAndEco) {
                tabs.push({
                  id: 'eco',
                  label: 'Sertifikati',
                  content: (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {sharedCertsAndEco}
                    </div>
                  )
                });
              }

              // Tab 4: Documents
              if (sharedDocs) {
                tabs.push({
                  id: 'docs',
                  label: 'Dokumentacija',
                  content: (
                    <div className="w-full">
                      {sharedDocs}
                    </div>
                  )
                });
              }

              return <ProductDetailsTabs tabs={tabs} />;
            })()}

            {/* Certifications & Eco Features are now rendered alongside Descriptions in the Flex Masonry layout! */}

            {/* Benefits + Accessories + Documents — for products with enriched data */}
            {(product.benefits || accessoryProducts.length > 0 || (product.documents && product.documents.length > 0 && !['6', '7', '4', '2', '8'].includes(product.categoryId))) && (
              <div className="mt-8 space-y-6">
                {/* Benefits */}
                {product.benefits && product.benefits.length > 0 && (
                  <ProductBenefits benefits={product.benefits} />
                )}

                {/* Recommended Accessories */}
                {accessoryProducts.length > 0 && (
                  <RecommendedAccessories accessories={accessoryProducts} />
                )}

                {/* Removed duplicate Documents block from here as it is now shown in Product Details Tabs for all products */}


              </div>
            )}

          </div>

          <RelatedProducts
            currentProductId={product.id}
            categoryId={product.categoryId}
            currentProductSlug={product.slug}
          />
          <RecentlyViewed />

          {/* Sticky CTA na mobilnom */}
          <ProductInquiryStickyCTA
            productSlug={routeSlug}
            inquiryRef={product.specs?.find(s => s.key === 'ref' || s.key === 'Ref.')?.value}
          />
        </div>
      </>
    );
  } catch (error) {
    if (error && typeof error === 'object' && 'digest' in error && typeof error.digest === 'string' && error.digest.startsWith('NEXT_REDIRECT')) {
      throw error;
    }
    console.error('Error rendering product page:', error);
    notFound();
  }
}

// ─── Sub-components (inline, used only in this page) ─────────────────────────

function DescriptionSection({ product }: { product: Product }) {
  const descriptionSections = product.description
    ? parseDescriptionToSections(product.description)
    : [];
  const plainDescription = product.description?.trim() || '';
  const detailSections = product.detailsSections || [];

  if (descriptionSections.length > 0) {
    return (
      <>
        <div className="space-y-6">
          {descriptionSections.map((section, idx) => (
            <div key={`${section.title}-${idx}`} className="border-b border-ink-200 pb-4 last:border-0 last:pb-0">
              <h3 className="text-base font-medium text-ink-900 mb-3">{section.title}</h3>
              {section.items && section.items.length > 0 && (
                <ul className="list-disc pl-5 text-ink-600 space-y-2">
                  {section.items.map((item, index) => (
                    <li key={`${section.title}-${index}`} className="text-base leading-relaxed">{item}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </>
    );
  }

  if (plainDescription || detailSections.length > 0) {
    return (
      <>
        <div className="space-y-6">
          {plainDescription && (
            <div className="prose max-w-none text-ink-600">
              <p className="whitespace-pre-line">{plainDescription}</p>
            </div>
          )}

          {detailSections.map((section, idx) => (
            <div key={`${section.title}-${idx}`} className="border-t border-ink-200 pt-6">
              <h3 className="text-base font-medium text-ink-900 mb-3">{section.title}</h3>
              {section.items && section.items.length > 0 && (
                <ul className="list-disc pl-5 text-ink-600 space-y-2">
                  {section.items.map((item, index) => (
                    <li key={`${section.title}-${index}`} className="text-base leading-relaxed">{item}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </>
    );
  }

  return null;
}
