import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getBrandBySlug } from '@/lib/repositories/brand-repository';
import { getProductsByBrand } from '@/lib/repositories/product-repository';
import { generateBreadcrumbSchema, generateCollectionPageSchema, generateProductListSchema } from '@/lib/seo/structured-data';
import { getBrandPageCopy } from '@/lib/seo/listing-page-copy';
import { createMetadataImage, getMetadataImageUrls } from '@/lib/utils/product-images';
import ProductCard from '@/components/ProductCard';
import Breadcrumbs from '@/components/Breadcrumbs';
import { FaExternalLinkAlt, FaGlobe } from 'react-icons/fa';
import { curateBrandPageProducts } from '@/lib/catalog/brand-curation';

interface BrandPageProps {
  params: {
    slug: string;
  };
}

export async function generateMetadata({ params }: BrandPageProps): Promise<Metadata> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.podovi.online';
  const brand = await getBrandBySlug(params.slug);

  if (!brand) {
    return {
      metadataBase: new URL(baseUrl),
      title: 'Brend nije pronađen',
    };
  }

  const brandCopy = getBrandPageCopy(brand);
  const metadataImageSource = brand.logo && !brand.logo.includes('/images/placeholder.svg')
    ? brand.logo
    : null;
  const metadataImages = [
    createMetadataImage(metadataImageSource, baseUrl, {
      width: 1200,
      height: 630,
      alt: brand.name,
    }),
  ].filter((image): image is NonNullable<ReturnType<typeof createMetadataImage>> => Boolean(image));
  const twitterImages = getMetadataImageUrls(metadataImages);

  return {
    metadataBase: new URL(baseUrl),
    title: brandCopy.metaTitle,
    description: brandCopy.metaDescription,
    keywords: brandCopy.keywords,
    openGraph: {
      title: brandCopy.metaTitle,
      description: brandCopy.metaDescription,
      type: 'website',
      locale: 'sr_RS',
      url: `${baseUrl}/brendovi/${params.slug}`,
      siteName: 'podovi.online',
      images: metadataImages.length > 0 ? metadataImages : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: brandCopy.metaTitle,
      description: brandCopy.metaDescription,
      images: twitterImages,
    },
    alternates: {
      canonical: `${baseUrl}/brendovi/${params.slug}`,
    },
  };
}

export default async function BrandPage({ params }: BrandPageProps) {
  const brand = await getBrandBySlug(params.slug);

  if (!brand) {
    notFound();
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.podovi.online';
  const brandCopy = getBrandPageCopy(brand);
  const allProducts = await getProductsByBrand(brand.id);
  const curatedListing = curateBrandPageProducts(brand, allProducts);
  const products = curatedListing.products;
  const listingMode = curatedListing.listingMode;
  const isCollectionListing = listingMode === 'collections';
  const listingTitle = isCollectionListing ? 'Kolekcije' : 'Asortiman';
  const inventoryHeading = isCollectionListing ? 'Dostupne kolekcije' : 'Dostupan asortiman';
  const inventoryValue = isCollectionListing
    ? `${products.length} kolekcija`
    : `${products.length} stavki`;
  const metadataImageSource = brand.logo && !brand.logo.includes('/images/placeholder.svg')
    ? brand.logo
    : null;
  const brandMetadataImage = createMetadataImage(metadataImageSource, baseUrl, {
    width: 1200,
    height: 630,
    alt: brand.name,
  });

  const isGerflor = brand.slug === 'gerflor';
  const breadcrumbItems = [
    { name: 'Brendovi', url: `${baseUrl}/brendovi` },
    { name: brand.name, url: `${baseUrl}/brendovi/${params.slug}` },
  ];
  const brandSchema = {
    '@context': 'https://schema.org',
    '@type': 'Brand',
    name: brand.name,
    description: brandCopy.metaDescription,
    url: brand.website || `${baseUrl}/brendovi/${params.slug}`,
    logo: brandMetadataImage?.url || undefined,
    sameAs: brand.website || undefined,
    areaServed: 'RS',
  };
  const brandCollectionPageSchema = generateCollectionPageSchema({
    name: isCollectionListing ? `${brand.name} kolekcije` : `${brand.name} katalog`,
    description: brandCopy.metaDescription,
    url: `${baseUrl}/brendovi/${params.slug}`,
    image: brandMetadataImage?.url,
    baseUrl,
    about: {
      '@type': 'Brand',
      name: brand.name,
    },
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            generateBreadcrumbSchema(breadcrumbItems),
            brandSchema,
            brandCollectionPageSchema,
            generateProductListSchema(products.slice(0, 100)),
          ]),
        }}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12">
        <div className="mb-4">
          <Breadcrumbs items={[
            { label: 'Brendovi', href: '/brendovi' },
            { label: brand.name }
          ]} />
        </div>

        <section className="mb-8 rounded-[1.75rem] border border-stone-200 bg-white px-6 py-8 shadow-sm">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-4xl">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">
                Brend
              </p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl">
                {brandCopy.heading}
              </h1>
              <p className="mt-4 text-base leading-7 text-stone-700 sm:text-lg">
                {brandCopy.lead}
              </p>
              {brandCopy.body ? (
                <p className="mt-3 text-sm leading-7 text-stone-600 sm:text-base">
                  {brandCopy.body}
                </p>
              ) : null}
              {brandCopy.bullets.length > 0 ? (
                <div className="mt-5 flex flex-wrap gap-2">
                  {brandCopy.bullets.map((bullet) => (
                    <span
                      key={bullet}
                      className="inline-flex items-center rounded-full border border-stone-200 bg-stone-50 px-3 py-1.5 text-sm text-stone-700"
                    >
                      {bullet}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="rounded-2xl bg-stone-50 p-5 text-sm text-stone-700 lg:min-w-[260px]">
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                    {inventoryHeading}
                  </p>
                  <p className="mt-1 text-base font-semibold text-stone-900">
                    {inventoryValue}
                  </p>
                  {isCollectionListing && curatedListing.totalItems !== products.length ? (
                    <p className="mt-1 text-xs text-stone-500">
                      Kurirano iz ukupno {curatedListing.totalItems} stavki u katalogu
                    </p>
                  ) : null}
                </div>
                {brand.countryOfOrigin ? (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                      Zemlja porekla
                    </p>
                    <p className="mt-1 text-sm text-stone-700">
                      {brand.countryOfOrigin}
                    </p>
                  </div>
                ) : null}
                {brand.website ? (
                  <a
                    href={brand.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-medium text-primary-600 hover:text-primary-700"
                  >
                    <FaGlobe className="text-sm" />
                    Zvanični sajt brenda
                  </a>
                ) : null}
              </div>
            </div>
          </div>
        </section>

        {/* Gerflor Special Notice */}
        {isGerflor && (
          <div className="bg-gradient-to-r from-primary-50 to-primary-100 border-l-4 border-primary-600 rounded-lg p-6 mb-8">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 bg-primary-600 text-white rounded-full w-10 h-10 flex items-center justify-center">
                <FaExternalLinkAlt />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  Gerflor kolekcije - zvanični zastupnik
                </h2>
                <p className="text-gray-700 mb-3">
                  Kao zvanični zastupnik Gerflor brenda za Srbiju, nudimo kompletan katalog njihovih profesionalnih podnih sistema.
                  Izaberite kolekciju ispod za detalje, specifikacije i slanje upita za cenu i dostupnost.
                </p>
                <a
                  href="https://www.gerflor-cee.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium"
                >
                  Pogledaj sve Gerflor kolekcije na zvaničnom sajtu
                  <FaExternalLinkAlt className="text-sm" />
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Products Grid */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            {listingTitle} ({products.length})
          </h2>

          {products.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <p className="text-gray-500 text-lg">
                {isCollectionListing
                  ? 'Trenutno nemamo izdvojene kolekcije ovog brenda u katalogu.'
                  : 'Trenutno nemamo stavke ovog brenda u katalogu.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>

        {/* Back Link */}
        <div className="mt-12 text-center">
          <a
            href="/brendovi"
            className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-semibold transition-colors"
          >
            ← Nazad na sve brendove
          </a>
        </div>
      </div>
    </div>
  );
}
