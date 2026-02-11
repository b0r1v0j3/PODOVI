import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { categoryRepository } from '@/lib/repositories/category-repository';
import { brandRepository } from '@/lib/repositories/brand-repository';
import CertificationBadges from '@/components/CertificationBadges';
import EcoFeatures from '@/components/EcoFeatures';
import ProductColorSelector from '@/components/ProductColorSelector';
import ProductImage from '@/components/ProductImage';
import Breadcrumbs from '@/components/Breadcrumbs';
import ProductCharacteristics from '@/components/ProductCharacteristics';
import ProductDescriptionWithCharacteristics from '@/components/ProductDescriptionWithCharacteristics';
import ProductDocuments from '@/components/ProductDocuments';
import ProductInquiryStickyCTA from '@/components/ProductInquiryStickyCTA';
import ProductActions from '@/components/ProductActions';
import ProductBenefits from '@/components/ProductBenefits';
import RecommendedAccessories from '@/components/RecommendedAccessories';
import type { Product } from '@/types';
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

    const priceText = product.price && product.price > 0
      ? `Cena: ${product.price.toLocaleString('sr-RS')} RSD/${product.priceUnit || 'm²'}`
      : '';
    const brandText = brand ? `${brand.name}` : '';
    const categoryText = category ? `${category.name}` : '';
    const description = `${product.shortDescription || product.description || ''} ${priceText}. ${brandText} ${categoryText}`.trim();
    const keywords = [product.name, brandText, categoryText, 'podovi', 'podne obloge', 'Srbija', 'laminat', 'vinil', 'LVT'].filter(Boolean).join(', ');

    const urlWithColor = selectedColorSlug
      ? `${baseUrl}/proizvodi/${params.slug}?color=${selectedColorSlug}`
      : `${baseUrl}/proizvodi/${params.slug}`;

    const ogPriceText = product.price && product.price > 0
      ? `${product.price.toLocaleString('sr-RS')} RSD/${product.priceUnit || 'm²'}`
      : '';
    const ogTitle = categoryText && ogPriceText
      ? `${categoryText} | ${ogPriceText}`
      : categoryText || product.name;
    const ogDescription = product.name;

    return {
      metadataBase: new URL(baseUrl),
      title: `${product.name} - Cena i tehničke specifikacije | Podovi.online`,
      description: description.substring(0, 160),
      keywords,
      authors: [{ name: 'Podovi.online' }],
      openGraph: {
        title: ogTitle,
        description: ogDescription,
        type: 'website',
        locale: 'sr_RS',
        url: urlWithColor,
        siteName: 'Podovi.online',
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
    return { metadataBase: new URL(baseUrl), title: 'Proizvod | Podovi.online', description: '' };
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
    };

    // ── Linoleum redirect: /proizvodi/gerflor-xxx → /proizvodi/xxx ──
    if (params.slug.startsWith('gerflor-')) {
      const collectionSlugWithoutPrefix = params.slug.substring('gerflor-'.length);
      const isLinoleumCollection = linoleumColors.some(color => color.collection === collectionSlugWithoutPrefix);
      if (isLinoleumCollection) {
        const { redirect } = await import('next/navigation');
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
      const { getParketCollectionVariantSlugs } = await import('@/lib/data/parket-collection-mapping');
      const collectionSpec = product.specs.find(s => s.key === 'collection');
      const collectionName = collectionSpec?.value;
      const validSlugs = collectionName ? getParketCollectionVariantSlugs(collectionName) : [];
      if (validSlugs.length > 0 && !validSlugs.includes(selectedColorSlug)) {
        const { redirect } = await import('next/navigation');
        redirect(`/proizvodi/${params.slug}?color=${encodeURIComponent(validSlugs[0])}`);
      }
    }

    // ── Laminat: redirect invalid color to first valid ──
    if (product.categoryId === '1' && product.sku?.startsWith('LAM-') && selectedColorSlug) {
      const { tarkettProducts } = await import('@/lib/data/tarkett-products');
      const collectionName = product.specs?.find(s => s.key === 'collection')?.value;
      const variants = collectionName
        ? tarkettProducts.filter(p => p.categoryId === '1' && !p.sku?.startsWith('LAM-') && p.specs?.find(s => s.key === 'collection')?.value === collectionName)
        : [];
      const validSlugs = variants.map(p => p.slug);
      if (validSlugs.length > 0 && !validSlugs.includes(selectedColorSlug)) {
        const { redirect } = await import('next/navigation');
        redirect(`/proizvodi/${params.slug}?color=${encodeURIComponent(validSlugs[0])}`);
      }
    }

    // ── Redirect color-tiles to collection page with ?color= ──
    const collectionSlugFromProduct = (product as { collectionSlug?: string }).collectionSlug;
    const isBloqCollection = product.sku === 'BLOQ-CARPET' || product.sku?.startsWith('BLOQ-');
    if ((product.categoryId === '6' || product.categoryId === '7' || product.categoryId === '4' || product.categoryId === '2') && collectionSlugFromProduct && !isBloqCollection) {
      let normalizedCollectionSlug = collectionSlugFromProduct;
      if (product.categoryId === '6' && !collectionSlugFromProduct.startsWith('gerflor-')) {
        normalizedCollectionSlug = `gerflor-${collectionSlugFromProduct}`;
      }
      const { redirect } = await import('next/navigation');
      redirect(`/proizvodi/${normalizedCollectionSlug}?color=${encodeURIComponent(product.slug)}`);
    }

    // ── Parket variant: redirect to collection page with ?color= ──
    if (product.categoryId === '3' && product.sku && !product.sku.startsWith('PARKET-')) {
      const { getEffectiveParketCollection, getParketCollectionSlug } = await import('@/lib/data/parket-collection-mapping');
      const collectionSpec = product.specs.find(s => s.key === 'collection');
      const collectionName = getEffectiveParketCollection(product.slug, collectionSpec?.value);
      const collectionSlug = collectionName ? getParketCollectionSlug(collectionName) : null;
      if (collectionSlug) {
        const { redirect } = await import('next/navigation');
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
      // Generate a meaningful shortDescription based on category
      const categoryDescMap: Record<string, string> = {
        '1': 'Laminat pod visokog kvaliteta',
        '2': 'Profesionalni vinil pod',
        '3': 'Parket pod prirodnog drveta',
        '4': product.brandId === '8' ? 'Premium tekstilne ploče za poslovne prostore' : 'Tekstilne ploče za profesionalnu upotrebu',
        '6': 'LVT luksuzne vinil ploče',
        '7': 'Linoleum pod od prirodnih materijala',
      };
      const fallback = categoryDescMap[product.categoryId] || '';
      product.shortDescription = (product.description && typeof product.description === 'string' && product.description.length < 200)
        ? product.description
        : fallback;
    }
    if (!product.description || typeof product.description !== 'string') {
      product.description = (product.shortDescription && typeof product.shortDescription === 'string') ? product.shortDescription : '';
    }

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
    const brand = product.brandId ? await brandRepository.findById(product.brandId) : null;
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
    const isColorSelectorCategory = ['6', '7', '4', '2', '3', '1'].includes(product.categoryId);

    return (
      <>
        {/* Schema.org JSON-LD */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }} />

        <div className="min-h-screen bg-gray-50">
          {/* Breadcrumbs */}
          <div className="bg-white border-b">
            <div className="container py-4">
              <Breadcrumbs
                items={[
                  ...(category ? [{ label: category.name, href: `/kategorije/${category.slug}` }] : []),
                  { label: product.name }
                ]}
              />
            </div>
          </div>

          {/* Product Content */}
          <div className="container py-12 pb-20 md:pb-12">
            {isColorSelectorCategory ? (
              <>
                {/* LVT, Linoleum, Parket, Laminat, Vinil, Tekstilne: layout sa color selectorom */}
                <ProductColorSelector
                  initialImage={primaryImage}
                  imagePriority={true}
                  collectionSlug={(product as { collectionSlug?: string }).collectionSlug || params.slug}
                  productName={displayName}
                  productPrice={product.price && product.price > 0 ? product.price : undefined}
                  priceUnit={product.priceUnit}
                  brand={brand ? { name: brand.name, slug: brand.slug } : null}
                  shortDescription={product.shortDescription}
                  specs={filterSpecsForDisplay(product.specs, { categoryId: product.categoryId, productSlug: product.slug })}
                  inStock={product.inStock}
                  productSlug={product.slug}
                  externalLink={product.externalLink}
                  customColors={(product.categoryId === '3' || product.categoryId === '1' || (product.categoryId === '4' && product.sku?.startsWith('BLOQ'))) ? (customColors ?? []) : customColors}
                  collectionDisplayName={(product.categoryId === '3' || product.categoryId === '1') ? (product.specs.find(s => s.key === 'collection')?.value) : undefined}
                  collectionCategoryLabel={product.categoryId === '3' ? 'Parket' : product.categoryId === '1' ? 'Laminat' : undefined}
                  videoEmbedUrl={params.slug === 'privilege-waltz' || product.specs?.find(s => s.key === 'collection')?.value === 'Privilege Waltz' ? 'https://www.youtube.com/embed/0g9jyUd3fPk' : undefined}
                  rightColumnBottom={(product.categoryId === '3' || product.categoryId === '1') ? (
                    <ProductCharacteristics
                      specs={filterSpecsForDisplay(product.specs, { categoryId: product.categoryId, productSlug: product.slug }).filter(
                        (s) => s.key !== 'collection' && s.key !== 'type'
                      )}
                      categoryId={product.categoryId}
                      title="Tehničke specifikacije"
                    />
                  ) : undefined}
                  leftColumnBottom={(product.categoryId === '3' || product.categoryId === '1') ? (
                    <div className="bg-white rounded-2xl shadow-lg p-6">
                      <ProductDescriptionWithCharacteristics
                        description={product.description || ''}
                        characteristicsSection={product.detailsSections?.find(
                          (s) => s.title === 'Ključne karakteristike'
                        )}
                      />
                    </div>
                  ) : undefined}
                  inquiryRef={product.specs?.find(s => s.key === 'ref' || s.key === 'Ref.')?.value}
                  productId={product.id}
                />

                {/* Description + Tehničke spec za LVT/Linoleum/Tekstilne */}
                {product.categoryId !== '3' && product.categoryId !== '2' && product.categoryId !== '1' && (
                  <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white rounded-2xl shadow-lg p-6">
                      <DescriptionSection product={product} />
                    </div>
                    <ProductCharacteristics
                      specs={filterSpecsForDisplay(product.specs)}
                      categoryId={product.categoryId}
                    />
                  </div>
                )}
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
                        className="object-cover"
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
                    <h1 className="text-4xl font-bold text-gray-900 mb-3">{displayName}</h1>
                    {product.shortDescription && (
                      <p className="text-xl text-gray-600">{product.shortDescription}</p>
                    )}
                  </div>

                  {product.price && product.price > 0 && (
                    <div className="bg-primary-50 border border-primary-200 rounded-xl p-6">
                      <div className="flex items-baseline space-x-2">
                        <span className="text-4xl font-bold text-primary-600">{product.price.toLocaleString('sr-RS')}</span>
                        <span className="text-lg text-gray-600">RSD</span>
                        {product.priceUnit && <span className="text-lg text-gray-500">/ {product.priceUnit}</span>}
                      </div>
                    </div>
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

            {/* Description & Specs - Za vinil i ostale kategorije */}
            {product.categoryId !== '6' && product.categoryId !== '7' && product.categoryId !== '4' && product.categoryId !== '3' && product.categoryId !== '1' && (
              <div className="mt-16 grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg p-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Opis proizvoda</h2>
                  <DescriptionSection product={product} />
                </div>

                {(() => {
                  const displaySpecs = filterSpecsForDisplay(product.specs, { categoryId: product.categoryId, productSlug: product.slug });
                  return displaySpecs.length > 0 && (
                    <div className="bg-white rounded-2xl shadow-lg p-8">
                      <h2 className="text-2xl font-bold text-gray-900 mb-6">Tehničke specifikacije</h2>
                      <dl className="space-y-4">
                        {displaySpecs.map((spec) => (
                          <div key={spec.key} className="border-b border-gray-200 pb-4 last:border-0">
                            <dt className="text-sm font-medium text-gray-500 mb-1">{spec.label}</dt>
                            <dd className="text-lg font-semibold text-gray-900">{spec.value}</dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Certifications & Eco Features - Full Width Below for LVT, Linoleum, Vinil, Tekstilne */}
            {(product.categoryId === '6' || product.categoryId === '7' || product.categoryId === '4' || product.categoryId === '2') && (
              <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <svg className="w-6 h-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                    Sertifikati kvaliteta
                  </h3>
                  <CertificationBadges certifications={
                    product.brandId === '8'
                      ? ["Cradle to Cradle Silver", "Indoor Air Comfort Gold", "BREEAM A+", "GreenTag Level A", "CE"]
                      : ["FloorScore", "Indoor Air Comfort Gold", "M1", "A+", "CE", "REACH", "EPD"]
                  } />
                </div>

                <div className="bg-white rounded-2xl shadow-lg p-6">
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

                <div className="h-full">
                  <ProductDocuments
                    initialDocuments={product.documents}
                    categoryId={product.categoryId}
                    collectionSlug={product.slug}
                  />
                </div>
              </div>
            )}

            {/* Benefits + Accessories + Documents — for products with enriched data (e.g. EGGER) */}
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

                {/* Documents — for products NOT already showing docs above (LVT/Lin/Carpet/Vinil) */}
                {product.documents && product.documents.length > 0 && !['6', '7', '4', '2'].includes(product.categoryId) && (
                  <div className="bg-white rounded-2xl shadow-lg p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <svg className="w-6 h-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Dokumentacija
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {product.documents.map((doc, index) => (
                        <a
                          key={index}
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-primary-400 hover:bg-primary-50 transition-all group"
                        >
                          <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0">
                            <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 group-hover:text-primary-600 truncate">
                              {doc.title}
                            </p>
                            <p className="text-xs text-gray-500">PDF</p>
                          </div>
                          <svg className="w-4 h-4 text-gray-400 group-hover:text-primary-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* EGGER Certifications */}
                {product.brandId === '9' && (
                  <div className="bg-white rounded-2xl shadow-lg p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <svg className="w-6 h-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                      </svg>
                      Sertifikati kvaliteta
                    </h3>
                    <CertificationBadges certifications={[
                      "Blue Angel", "EU Ecolabel", "TÜV PROFiCERT", "M1", "CE"
                    ]} />
                  </div>
                )}
              </div>
            )}

          </div>
          {/* Sticky CTA na mobilnom */}
          <ProductInquiryStickyCTA
            productSlug={params.slug}
            inquiryRef={product.specs?.find(s => s.key === 'ref' || s.key === 'Ref.')?.value}
          />
        </div>
      </>
    );
  } catch (error) {
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
