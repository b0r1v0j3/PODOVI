import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { productRepository } from '@/lib/repositories/product-repository';
import { categoryRepository } from '@/lib/repositories/category-repository';
import { brandRepository } from '@/lib/repositories/brand-repository';
import CertificationBadges from '@/components/CertificationBadges';
import EcoFeatures from '@/components/EcoFeatures';
import ProductColorSelector from '@/components/ProductColorSelector';
import ProductImage from '@/components/ProductImage';
import Breadcrumbs from '@/components/Breadcrumbs';

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.podovi.online';
  
  try {
    const product = await productRepository.findBySlug(params.slug);
    
    if (!product) {
      return {
        metadataBase: new URL(baseUrl),
        title: 'Proizvod nije pronađen',
      };
    }

    const category = product.categoryId 
      ? await categoryRepository.findById(product.categoryId)
      : null;
    const brand = product.brandId 
      ? await brandRepository.findById(product.brandId)
      : null;
    const primaryImage = product.images?.[0];

    // Build rich description
    const priceText = product.price && product.price > 0 
      ? `Cena: ${product.price.toLocaleString('sr-RS')} RSD/${product.priceUnit || 'm²'}` 
      : '';
    const brandText = brand ? `${brand.name}` : '';
    const categoryText = category ? `${category.name}` : '';
    
    const description = `${product.shortDescription || product.description || ''} ${priceText}. ${brandText} ${categoryText}`.trim();

    // Build keywords
    const keywords = [
      product.name,
      brandText,
      categoryText,
      'podovi',
      'podne obloge',
      'Srbija',
      'laminat',
      'vinil',
      'LVT'
    ].filter(Boolean).join(', ');

    return {
      metadataBase: new URL(baseUrl),
      title: `${product.name} - Cena i Karakteristike | Podovi.online`,
      description: description.substring(0, 160), // SEO limit
      keywords,
      authors: [{ name: 'Podovi.online' }],
      openGraph: {
        title: product.name,
        description: product.shortDescription || product.description || '',
        type: 'website',
        locale: 'sr_RS',
        url: `${baseUrl}/proizvodi/${params.slug}`,
        siteName: 'Podovi.online',
        images: primaryImage ? [
          {
            url: primaryImage.url,
            width: 1200,
            height: 630,
            alt: primaryImage.alt || product.name,
          }
        ] : [],
      },
      twitter: {
        card: 'summary_large_image',
        title: product.name,
        description: product.shortDescription || product.description || '',
        images: primaryImage ? [primaryImage.url] : [],
      },
      alternates: {
        canonical: `${baseUrl}/proizvodi/${params.slug}`,
      },
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      metadataBase: new URL(baseUrl),
      title: 'Proizvod | Podovi.online',
      description: '',
    };
  }
}

export default async function ProductPage({ params }: Props) {
  try {
    const product = await productRepository.findBySlug(params.slug);
    
    if (!product) {
      notFound();
    }

    // Ensure product has required fields with defensive checks
    if (!product.images || !Array.isArray(product.images)) {
      product.images = [];
    }
    if (!product.specs || !Array.isArray(product.specs)) {
      product.specs = [];
    }
    if (!product.name || typeof product.name !== 'string') {
      product.name = 'Proizvod';
    }
    if (!product.shortDescription || typeof product.shortDescription !== 'string') {
      product.shortDescription = (product.description && typeof product.description === 'string') ? product.description : '';
    }
    if (!product.description || typeof product.description !== 'string') {
      product.description = (product.shortDescription && typeof product.shortDescription === 'string') ? product.shortDescription : '';
    }
    if (!product.slug || typeof product.slug !== 'string') {
      product.slug = params.slug;
    }
    if (!product.categoryId || typeof product.categoryId !== 'string') {
      product.categoryId = '6'; // Default to LVT
    }
    if (!product.brandId || typeof product.brandId !== 'string') {
      product.brandId = '6'; // Default to Gerflor
    }

    const category = product.categoryId 
      ? await categoryRepository.findById(product.categoryId)
      : null;
    const brand = product.brandId 
      ? await brandRepository.findById(product.brandId)
      : null;
    const primaryImage = product.images && product.images.length > 0 
      ? (product.images.find(img => img.isPrimary) || product.images[0])
      : null;

  // Schema.org structured data
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.podovi.online';
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name,
    "description": product.description || product.shortDescription || '',
    "image": primaryImage ? `${baseUrl}${primaryImage.url}` : undefined,
    "brand": brand ? {
      "@type": "Brand",
      "name": brand.name
    } : undefined,
    "category": category?.name,
    "offers": {
      "@type": "Offer",
      "price": product.price && product.price > 0 ? product.price : undefined,
      "priceCurrency": "RSD",
      "availability": product.inStock 
        ? "https://schema.org/InStock" 
        : "https://schema.org/OutOfStock",
      "url": `${baseUrl}/proizvodi/${product.slug}`,
      "priceValidUntil": new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
    },
    "sku": product.sku,
  };

  return (
    <>
      {/* Schema.org JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(schemaData)
        }}
      />

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
      <div className="container py-12">
        {(product.categoryId === '6' || product.categoryId === '7') ? (
          // LVT and Linoleum products with color selector
          <ProductColorSelector
            initialImage={primaryImage}
            collectionSlug={product.slug}
            productName={product.name}
            productPrice={product.price}
            priceUnit={product.priceUnit}
            brand={brand ? { name: brand.name, slug: brand.slug } : null}
            shortDescription={product.shortDescription}
            inStock={product.inStock}
            productSlug={product.slug}
            externalLink={product.externalLink}
          />
        ) : (
          // Non-LVT products - standard layout
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
              {/* Brand */}
              {brand && (
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-gray-500">Brend:</span>
                  <Link
                    href={`/brendovi/${brand.slug}`}
                    className="text-primary-600 hover:text-primary-700 font-semibold"
                  >
                    {brand.name}
                  </Link>
                </div>
              )}

              {/* Title */}
              <div>
                <h1 className="text-4xl font-bold text-gray-900 mb-3">
                  {product.name}
                </h1>
                {product.shortDescription && (
                  <p className="text-xl text-gray-600">
                    {product.shortDescription}
                  </p>
                )}
              </div>

              {/* Price (if available) */}
              {product.price && product.price > 0 && (
                <div className="bg-primary-50 border border-primary-200 rounded-xl p-6">
                  <div className="flex items-baseline space-x-2">
                    <span className="text-4xl font-bold text-primary-600">
                      {product.price.toLocaleString('sr-RS')}
                    </span>
                    <span className="text-lg text-gray-600">RSD</span>
                    {product.priceUnit && (
                      <span className="text-lg text-gray-500">/ {product.priceUnit}</span>
                    )}
                  </div>
                </div>
              )}

              {/* Availability */}
              <div className="flex items-center space-x-2">
                <div
                  className={`w-3 h-3 rounded-full ${
                    product.inStock ? 'bg-green-500' : 'bg-red-500'
                  }`}
                ></div>
                <span className="text-gray-700">
                  {product.inStock ? 'Na stanju' : 'Nije dostupno'}
                </span>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href={`/kontakt?product=${product.slug}`}
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
            </div>
          </div>
        )}

        {/* Description & Specs */}
        <div className="mt-16 grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Description */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Opis proizvoda</h2>
            {product.description && (
              <div className="prose prose-lg max-w-none text-gray-700">
                <p>{product.description}</p>
              </div>
            )}

            {/* Documents Download Section */}
            {product.slug && typeof product.slug === 'string' && product.slug.includes('creation') && (
              <div className="mt-10 pt-10 border-t border-gray-200">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <svg className="w-6 h-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Dokumentacija
                </h3>
                <p className="text-sm text-gray-600 mb-6">
                  Kompletna tehnička dokumentacija, uputstva za instalaciju i sertifikati
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <a
                    href={product.externalLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-xl hover:border-primary-600 hover:bg-primary-50 transition-all group"
                  >
                    <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center group-hover:bg-primary-600 transition-colors">
                      <svg className="w-6 h-6 text-red-600 group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 group-hover:text-primary-600">Sva dokumenta</p>
                      <p className="text-sm text-gray-500">Gerflor sajt</p>
                    </div>
                    <svg className="w-5 h-5 text-gray-400 group-hover:text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                  <div className="col-span-2 p-4 bg-gray-50 rounded-xl border border-gray-200">
                    <p className="text-sm text-gray-700 mb-3">
                      <strong>Napomena:</strong> Kompletna dokumentacija dostupna na Gerflor zvaničnom sajtu.
                    </p>
                    <p className="text-xs text-gray-500">
                      Tehnički podaci, uputstva za instalaciju, sertifikati i svi PDF dokumenti možete preuzeti klikom na dugme iznad.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Specifications */}
          {product.specs && Array.isArray(product.specs) && product.specs.length > 0 && (
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Specifikacije</h2>
              <dl className="space-y-4">
                {product.specs.map((spec) => (
                  <div key={spec.key} className="border-b border-gray-200 pb-4 last:border-0">
                    <dt className="text-sm font-medium text-gray-500 mb-1">
                      {spec.label}
                    </dt>
                    <dd className="text-base font-semibold text-gray-900">
                      {spec.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </div>

        {/* Certifications & Eco Features - Full Width Below */}
        {product.slug && typeof product.slug === 'string' && product.slug.includes('creation') && (
          <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Certifications */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <svg className="w-6 h-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
                Sertifikati kvaliteta
              </h3>
              <CertificationBadges certifications={["FloorScore", "Indoor Air Comfort Gold", "M1", "A+", "CE", "REACH", "EPD"]} />
            </div>

            {/* Eco Features */}
            <EcoFeatures 
              features={["Bez ftalata", "100% reciklabilno", "30% recikliranog sadržaja", "Niske VOC emisije"]} 
              underfloorHeating={true}
            />
          </div>
        )}

      </div>
      </div>
    </>
  );
  } catch (error) {
    console.error('Error rendering product page:', error);
    notFound();
  }
}
