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
  linoleumColors,
  filterSpecsForDisplay,
  parseDescriptionToSections,
  prepareCustomColors,
  mergeSelectedColor,
} from '@/lib/product-page';
import { enrichProductDescription, enrichShortDescription } from '@/lib/utils/description-enricher';
import { splitProductTitle } from '@/lib/utils/name-parser';
import { getParketCollectionVariantSlugs, getEffectiveParketCollection, getParketCollectionSlug } from '@/lib/data/parket-collection-mapping';
import { tarkettProducts } from '@/lib/data/tarkett-products';
import { getAllDekingProducts } from '@/lib/utils/productDataLoader';

export const dynamic = 'force-dynamic';

// ─── Metadata ────────────────────────────────────────────────────────────────

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.podovi.online';

  try {
    const selectedColorSlug = typeof searchParams?.color === 'string' ? searchParams.color : '';
    let product: (Product & { collectionSlug?: string }) | null = null;

    const { tarkettProducts } = await import('@/lib/data/tarkett-products');

    if (selectedColorSlug) {
      const colorSource = await loadColorFromJson(selectedColorSlug);
      if (colorSource) {
        product = colorToProduct(colorSource, selectedColorSlug, params.slug);
      } else {
        const parketColor = tarkettProducts.find(p => p.slug === selectedColorSlug);
        if (parketColor) {
          const collectionNameSpec = parketColor.specs.find(s => s.key === 'collection');
          if (collectionNameSpec) {
            const collectionHeader = tarkettProducts.find(p =>
              p.categoryId === '3' &&
              p.sku.startsWith('PARKET-') &&
              p.specs.find(s => s.key === 'collection' && s.value === collectionNameSpec.value)
            );
            if (collectionHeader) {
              product = {
                ...collectionHeader,
                name: parketColor.name,
                images: parketColor.images,
                specs: parketColor.specs,
                description: parketColor.description || collectionHeader.description,
                slug: params.slug,
                collectionSlug: collectionHeader.slug,
              };
            }
          }
          if (!product) {
            product = parketColor;
          }
        }
      }
    }

    if (!product) {
      product = await resolveProductBySlug(params.slug);
    }

    if (!product) {
      return { metadataBase: new URL(baseUrl), title: 'Proizvod nije pronađen' };
    }

    const category = product.categoryId ? await categoryRepository.findById(product.categoryId) : null;
    const brand = product.brandId ? await brandRepository.findById(product.brandId) : null;
    const primaryImage = product.images?.[0];

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
      const parentProduct = await resolveProductBySlug(params.slug);
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

    if (cleanCollectionDesc && cleanCollectionDesc.length > 20 && cleanCollectionDesc !== shortDesc) {
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
    const ogTitle = [cleanName, collectionName, brandText].filter(Boolean).join(' - ');
    const ogDescription = shortDesc || metaDescription;
    const keywords = [cleanName, collectionName, brandText, categoryText, 'podovi', 'podne obloge', 'Srbija'].filter(Boolean).join(', ');

    const urlWithColor = selectedColorSlug
      ? `${baseUrl}/proizvodi/${params.slug}?color=${selectedColorSlug}`
      : `${baseUrl}/proizvodi/${params.slug}`;

    return {
      metadataBase: new URL(baseUrl),
      title: pageTitle,
      description: metaDescription.substring(0, 160),
      keywords,
      authors: [{ name: 'podovi.online' }],
      openGraph: {
        title: ogTitle,
        description: ogDescription,
        type: 'website',
        locale: 'sr_RS',
        url: urlWithColor,
        siteName: 'podovi.online',
        images: primaryImage ? [{ url: primaryImage.url, width: 1200, height: 630, alt: primaryImage.alt || product.name }] : [],
      },
      twitter: {
        card: 'summary_large_image',
        title: ogTitle,
        description: ogDescription,
        images: primaryImage ? [primaryImage.url] : [],
      },
      alternates: { canonical: urlWithColor },
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return { metadataBase: new URL(baseUrl), title: 'Proizvod | podovi.online', description: '' };
  }
}

// ─── Page Component ──────────────────────────────────────────────────────────

export default async function ProductPage({ params, searchParams }: Props) {
  try {
    const categorySlugMap: Record<string, string> = {
      '1': 'laminat',
      '6': 'lvt',
      '7': 'linoleum',
      '4': 'tekstilne-ploce',
      '2': 'vinil',
      '5': 'deking',
      '8': 'elektroprovodni',
    };

    // ── Linoleum redirect: /proizvodi/gerflor-xxx → /proizvodi/xxx ──
    if (params.slug.startsWith('gerflor-')) {
      const collectionSlugWithoutPrefix = params.slug.substring('gerflor-'.length);
      const isLinoleumCollection = linoleumColors.some(color => color.collection === collectionSlugWithoutPrefix);
      if (isLinoleumCollection) {
        const colorParam = typeof searchParams?.color === 'string' && searchParams.color ? `?color=${searchParams.color}` : '';
        redirect(`/proizvodi/${collectionSlugWithoutPrefix}${colorParam}`);
      }
    }

    // ── Resolve product ──
    let selectedColorSlug = typeof searchParams?.color === 'string' ? searchParams.color : '';
    const product = await resolveProductBySlug(params.slug);
    if (!product) notFound();

    // ── Parket: redirect invalid color to first valid ──
    if (product.categoryId === '3' && product.sku?.startsWith('PARKET-') && selectedColorSlug) {
      const collectionSpec = product.specs.find(s => s.key === 'collection');
      const collectionName = collectionSpec?.value;
      const validSlugs = collectionName ? getParketCollectionVariantSlugs(collectionName) : [];
      if (validSlugs.length > 0 && !validSlugs.includes(selectedColorSlug)) {
        redirect(`/proizvodi/${params.slug}?color=${encodeURIComponent(validSlugs[0])}`);
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
        redirect(`/proizvodi/${params.slug}?color=${encodeURIComponent(validSlugs[0])}`);
      }
    }

    // ── Deking: redirect collection to first valid color ──
    if (product.categoryId === '5' && product.sku?.startsWith('DEKING-') && !selectedColorSlug) {
      const variants = getAllDekingProducts().filter(p => p.categoryId === '5' && !p.sku?.startsWith('DEKING-'));
      if (variants.length > 0) {
        redirect(`/proizvodi/${params.slug}?color=${encodeURIComponent(variants[0].slug)}`);
      }
    }

    // ── Redirect color-tiles to collection page with ?color= ──
    const collectionSlugFromProduct = (product as { collectionSlug?: string }).collectionSlug;
    const isBloqCollection = product.sku === 'BLOQ-CARPET' || product.sku?.startsWith('BLOQ-');
    const isTarkettCollection = product.sku?.startsWith('TARKETT-');
    // For deking (category 5), since we don't have separate collection pages, we should not redirect
    const shouldRedirectCollection = ['6', '7', '4', '2', '8'].includes(product.categoryId);

    if (shouldRedirectCollection && collectionSlugFromProduct && !isBloqCollection && !isTarkettCollection) {
      let normalizedCollectionSlug = collectionSlugFromProduct;
      if (product.categoryId === '6' && !collectionSlugFromProduct.startsWith('gerflor-')) {
        normalizedCollectionSlug = `gerflor-${collectionSlugFromProduct}`;
      }
      redirect(`/proizvodi/${normalizedCollectionSlug}?color=${encodeURIComponent(product.slug)}`);
    }

    // ── Parket variant: redirect to collection page with ?color= ──
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

    if (!product.slug || typeof product.slug !== 'string') product.slug = params.slug;
    if (!product.categoryId || typeof product.categoryId !== 'string') product.categoryId = '6';
    if (!product.brandId || typeof product.brandId !== 'string') product.brandId = '6';

    // ── Load related data ──
    const category = product.categoryId ? await categoryRepository.findById(product.categoryId) : null;
    let brand = product.brandId ? await brandRepository.findById(product.brandId) : null;

    // Fallback brand map for brands not yet in Supabase
    if (!brand && product.brandId) {
      const FALLBACK_BRANDS: Record<string, { id: string; name: string; slug: string; logo: string; description: string }> = {
        '3': { id: '3', name: 'Tarkett', slug: 'tarkett', logo: '/images/brands/tarkett-logo.png', description: 'Tarkett' },
        '8': { id: '8', name: 'BLOQ', slug: 'bloq', logo: '/images/brands/bloq-logo.png', description: 'BLOQ' },
        '10': { id: '10', name: 'TimberTech', slug: 'timbertech', logo: '/images/brands/timbertech-logo.png', description: 'TimberTech' },
      };
      brand = FALLBACK_BRANDS[product.brandId] || null;
    }
    let primaryImage: { url: string; alt: string } | null = product.images && product.images.length > 0
      ? (product.images.find(img => img.isPrimary) || product.images[0])
      : null;

    // ── Prepare color variants ──
    const customColors = await prepareCustomColors(product, params.slug);

    // ── Load compatible accessories ──
    let accessoryProducts: Product[] = [];
    if (product.compatibleAccessories && product.compatibleAccessories.length > 0) {
      const { products: allMockProducts } = await import('@/lib/data/mock-data');
      accessoryProducts = product.compatibleAccessories
        .map(slug => allMockProducts.find(p => p.slug === slug))
        .filter((p): p is Product => !!p);
    }

    // ── Laminat: fallback image from first variant ──
    if (product.categoryId === '1' && !primaryImage && customColors && customColors.length > 0) {
      const firstImg = (customColors[0] as { image_url?: string; texture_url?: string }).image_url || (customColors[0] as { texture_url?: string }).texture_url;
      if (firstImg) {
        primaryImage = { url: firstImg, alt: product.name };
      }
    }

    // ── Schema.org ──
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.podovi.online';
    const schemaData = {
      "@context": "https://schema.org",
      "@type": "Product",
      "name": product.name,
      "description": product.description || product.shortDescription || '',
      "image": primaryImage ? `${baseUrl}${primaryImage.url}` : undefined,
      "brand": brand ? { "@type": "Brand", "name": brand.name } : undefined,
      "category": category?.name,
      "offers": {
        "@type": "Offer",
        "price": product.price && product.price > 0 ? product.price : undefined,
        "priceCurrency": "RSD",
        "availability": product.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
        "url": `${baseUrl}/proizvodi/${product.slug}`,
        "priceValidUntil": new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
      },
      "sku": product.sku,
    };

    // ── Determine if this is a "color selector" category ──
    const isColorSelectorCategory = ['6', '7', '4', '2', '3', '1', '8'].includes(product.categoryId);

    // ── Helper JSX logic to populate masonry columns neatly ──
    const sharedCertsAndEco = (['6', '7', '4', '2', '8'].includes(product.categoryId)) ? (
      <>
        <div className="bg-gradient-to-b from-[#FFFFFF] to-[#F9F9FB] rounded-[28px] p-8 h-full flex flex-col justify-center border border-[#E5E5EA] shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
          <div className="flex items-center gap-3.5 mb-7">
            <div className="w-11 h-11 rounded-2xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
            <h3 className="text-[21px] font-semibold tracking-[-0.01em] text-[#1D1D1F]">Sertifikati kvaliteta</h3>
          </div>
          <CertificationBadges certifications={
            product.brandId === '8'
              ? ["Cradle to Cradle Silver", "Indoor Air Comfort Gold", "BREEAM A+", "GreenTag Level A", "CE"]
              : ["FloorScore", "Indoor Air Comfort Gold", "M1", "A+", "CE", "REACH", "EPD"]
          } />
        </div>

        <div className="h-full">
          <EcoFeatures
            features={product.brandId === '8'
              ? ["Cradle to Cradle Silver", "ECONYL® reciklirana vlakna", "70% reciklirani materijali u podlozi", "Smanjenje buke"]
              : product.categoryId === '7'
                ? ["98% prirodnih sastojaka", "100% reciklabilno", "Niske VOC emisije", "Antibakterijsko"]
                : product.categoryId === '4'
                  ? ["Bez ftalata", "100% reciklabilno", "Smanjenje buke", "Laka ugradnja"]
                  : ["Bez ftalata", "100% reciklabilno", "30% recikliranog sadržaja", "Niske VOC emisije"]
            }
            underfloorHeating={product.brandId !== '8'}
          />
        </div>
      </>
    ) : null;

    const sharedDocs = (product.documents && product.documents.length > 0) ? (
      <div className="bg-white rounded-2xl shadow-lg p-6 h-full">
        <ProductDocuments
          initialDocuments={product.documents}
          categoryId={product.categoryId}
          collectionSlug={product.slug}
        />
      </div>
    ) : null;

    return (
      <>
        {/* Schema.org JSON-LD */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }} />

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

        <div className="min-h-screen bg-gray-50">
          {/* Product Content */}
          <div className="container py-8 pb-20 md:pb-12">
            <div className="mb-4">
              <Breadcrumbs
                items={[
                  { label: 'Kategorije', href: '/kategorije' },
                  ...(category ? [{ label: category.name, href: `/kategorije/${category.slug}` }] : []),
                  ...(selectedColorSlug ? [
                    {
                      label: product.specs?.find(s => s.key === 'collection')?.value || (product as any).collectionSlug || params.slug,
                      href: `/proizvodi/${params.slug}`
                    },
                    { label: displayName }
                  ] : [
                    { label: product.specs?.find(s => s.key === 'collection')?.value || displayName }
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
                  collectionSlug={(product as { collectionSlug?: string }).collectionSlug || params.slug}
                  productName={displayName}
                  originalProductName={originalProductName}
                  productPrice={product.price && product.price > 0 ? product.price : undefined}
                  priceUnit={product.priceUnit}
                  brand={brand ? { name: brand.name, slug: brand.slug } : null}
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
                              : product.categoryId === '4' ? 'Tekstilne ploče'
                                : product.categoryId === '8' ? 'ESD'
                                  : undefined
                  }
                  videoEmbedUrl={params.slug === 'privilege-waltz' || product.specs?.find(s => s.key === 'collection')?.value === 'Privilege Waltz' ? 'https://www.youtube.com/embed/0g9jyUd3fPk' : undefined}
                  inquiryRef={product.specs?.find(s => s.key === 'ref' || s.key === 'Ref.')?.value}
                  productId={product.id}
                />
              </>
            ) : (
              /* Non-color-selector categories - standard layout */
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                {/* Image Section */}
                <div className="bg-white rounded-2xl shadow-lg p-8">
                  <div className="aspect-square relative overflow-hidden rounded-xl bg-gray-100">
                    {primaryImage ? (
                      <ProductImage
                        src={primaryImage.url}
                        alt={primaryImage.alt}
                        className={product.categoryId === '5' ? 'object-cover object-left' : 'object-cover'}
                        sizes="(max-width: 768px) 100vw, 50vw"
                        quality={100}
                        priority={true}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <span>Bez slike</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Info Section */}
                <div className="space-y-8">
                  {brand && (
                    <div className="flex items-center space-x-3">
                      <span className="text-sm text-gray-500">Brend:</span>
                      <Link href={`/brendovi/${brand.slug}`} className="text-primary-600 hover:text-primary-700 font-semibold">
                        {brand.name}
                      </Link>
                    </div>
                  )}

                  <div>
                    {(() => {
                      const collectionName = product.specs?.find((s: any) => s.key === 'collection')?.value;
                      const fallbackCollection = (product as { collectionSlug?: string }).collectionSlug;
                      const { collection, color } = splitProductTitle(displayName, collectionName || fallbackCollection);
                      return (
                        <>
                          <h1 className="text-4xl font-bold text-gray-900 mb-2">{color}</h1>
                          {collection && (
                            <p className="text-xl text-gray-500 font-medium mb-4">{collection}</p>
                          )}
                        </>
                      );
                    })()}
                    {product.shortDescription && (
                      <p className="text-xl text-gray-600">{product.shortDescription}</p>
                    )}
                  </div>

                  {(product.price !== undefined && product.price > 0) ? (
                    <div className="bg-primary-50 border border-primary-200 rounded-xl p-6">
                      <div className="flex items-baseline space-x-2">
                        <span className="text-4xl font-bold text-primary-600">{product.price.toLocaleString('sr-RS')}</span>
                        <span className="text-lg text-gray-600">RSD</span>
                        {product.priceUnit && <span className="text-lg text-gray-500">/ {product.priceUnit}</span>}
                      </div>
                    </div>
                  ) : (
                    <p className="text-xl font-medium text-gray-600">Cena na upit</p>
                  )}

                  {/* CTA Buttons */}
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Link
                      href={(() => {
                        const p = new URLSearchParams();
                        p.set('product', product.slug);
                        if (searchParams?.color) p.set('color', searchParams.color);
                        const refSpec = product.specs?.find(s => s.key === 'ref' || s.key === 'Ref.');
                        if (refSpec?.value) p.set('ref', refSpec.value);
                        return `/kontakt?${p.toString()}`;
                      })()}
                      className="btn bg-primary-600 text-white hover:bg-primary-700 text-center text-lg px-8 py-4 flex-1"
                    >
                      Pošaljite upit
                    </Link>
                    {product.externalLink && (
                      <a
                        href={product.externalLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn border-2 border-gray-300 text-gray-700 hover:border-primary-600 hover:text-primary-600 text-center text-lg px-8 py-4 flex-1"
                      >
                        Pogledaj na sajtu proizvođača
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
                    <div className="text-gray-700">
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
            {(product.benefits || accessoryProducts.length > 0 || (product.documents && product.documents.length > 0 && !['6', '7', '4', '2'].includes(product.categoryId))) && (
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
            productSlug={params.slug}
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
  const sectionsToDisplay = descriptionSections.length > 0
    ? descriptionSections
    : (product.detailsSections || []);

  if (sectionsToDisplay.length > 0) {
    return (
      <>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Opis proizvoda</h2>
        <div className="space-y-6">
          {sectionsToDisplay.map((section, idx) => (
            <div key={`${section.title}-${idx}`} className="border-b border-gray-200 pb-4 last:border-0 last:pb-0">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">{section.title}</h3>
              {section.items && section.items.length > 0 && (
                <ul className="list-disc pl-5 text-gray-700 space-y-2">
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

  if (product.description) {
    return (
      <>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Opis proizvoda</h2>
        <div className="prose prose-lg max-w-none text-gray-700">
          <p className="whitespace-pre-line">{product.description}</p>
        </div>
      </>
    );
  }

  return null;
}
