import { Metadata } from 'next';
import { brandRepository } from '@/lib/repositories/brand-repository';
import { categoryRepository } from '@/lib/repositories/category-repository';
import { productRepository } from '@/lib/repositories/product-repository';
import { generateBreadcrumbSchema } from '@/lib/seo/structured-data';
import BrandCard from '@/components/BrandCard';
import Breadcrumbs from '@/components/Breadcrumbs';

const brandsPageDescription = 'Pregledajte brendove iz aktuelnog kataloga podovi.online: Tarkett, Gerflor, BLOQ, TimberTech, Wolflor i Techem, sa direktnim ulazom u njihove kolekcije i proizvode.';

export const metadata: Metadata = {
  title: 'Brendovi asortimana - Podovi.online',
  description: brandsPageDescription,
  alternates: {
    canonical: 'https://www.podovi.online/brendovi',
  },
};

export default async function BrandsPage() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.podovi.online';
  const [brands, categories, products] = await Promise.all([
    brandRepository.findAll(),
    categoryRepository.findAll(),
    productRepository.findAll(),
  ]);

  const productCountByBrand = new Map<string, number>();
  for (const product of products) {
    productCountByBrand.set(product.brandId, (productCountByBrand.get(product.brandId) || 0) + 1);
  }

  const coveredCategoryIds = new Set(products.map((product) => product.categoryId));
  const coveredCategories = categories.filter((category) => coveredCategoryIds.has(category.id));
  const featuredCategories = coveredCategories.slice(0, 6);

  const brandHubSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Brendovi asortimana',
    description: brandsPageDescription,
    url: `${baseUrl}/brendovi`,
    inLanguage: 'sr-RS',
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: brands.length,
      itemListElement: brands.map((brand, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: brand.name,
        url: `${baseUrl}/brendovi/${brand.slug}`,
      })),
    },
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            generateBreadcrumbSchema([
              { name: 'Brendovi', url: `${baseUrl}/brendovi` },
            ]),
            brandHubSchema,
          ]),
        }}
      />
      <div className="container pt-6 pb-8">
        <div className="mb-4">
          <Breadcrumbs items={[{ label: 'Brendovi' }]} />
        </div>

        <section className="mb-8 rounded-[1.75rem] border border-stone-200 bg-white px-6 py-8 shadow-sm">
          <div className="max-w-4xl">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">
              Partner brendovi
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl">
              Brendovi koje vodimo kroz katalog
            </h1>
            <p className="mt-4 text-base leading-7 text-stone-700 sm:text-lg">
              Na jednom mestu su okupljeni proizvođači sa kojima radimo kroz stambene, komercijalne, spoljašnje i tehničke sisteme, uključujući TimberTech deking i Techem lane za otirače i ulazne zone.
            </p>
            <p className="mt-3 text-sm leading-7 text-stone-600 sm:text-base">
              Sa brand stranica korisnik može odmah da uđe u konkretne kolekcije i proizvode, uz bogatiji SEO/structured-data sloj i jasniji prelaz ka zvaničnim supplier katalozima kada je to korisno.
            </p>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-stone-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                Aktivni brendovi
              </p>
              <p className="mt-1 text-2xl font-semibold text-stone-900">
                {brands.length}
              </p>
            </div>
            <div className="rounded-2xl bg-stone-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                Proizvodi u katalogu
              </p>
              <p className="mt-1 text-2xl font-semibold text-stone-900">
                {products.length}
              </p>
            </div>
            <div className="rounded-2xl bg-stone-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                Pokrivene kategorije
              </p>
              <p className="mt-1 text-2xl font-semibold text-stone-900">
                {coveredCategories.length}
              </p>
            </div>
          </div>

          {featuredCategories.length > 0 ? (
            <div className="mt-5 flex flex-wrap gap-2">
              {featuredCategories.map((category) => (
                <span
                  key={category.id}
                  className="inline-flex items-center rounded-full border border-stone-200 bg-stone-50 px-3 py-1.5 text-sm text-stone-700"
                >
                  {category.name}
                </span>
              ))}
            </div>
          ) : null}
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {brands.map((brand) => (
            <BrandCard
              key={brand.id}
              brand={brand}
              productCount={productCountByBrand.get(brand.id) || 0}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
