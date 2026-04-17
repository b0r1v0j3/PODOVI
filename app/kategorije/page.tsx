import { Metadata } from 'next';
import { categoryRepository } from '@/lib/repositories/category-repository';
import { brandRepository } from '@/lib/repositories/brand-repository';
import { productRepository } from '@/lib/repositories/product-repository';
import { generateBreadcrumbSchema } from '@/lib/seo/structured-data';
import CategoryCard from '@/components/CategoryCard';
import Breadcrumbs from '@/components/Breadcrumbs';

const categoriesPageDescription = 'Pregledajte sve kategorije asortimana na podovi.online: podne obloge, lajsne, otirače i specijalne sisteme za stambene, poslovne i tehničke prostore.';

export const metadata: Metadata = {
  title: 'Kategorije asortimana - Podovi.online',
  description: categoriesPageDescription,
  alternates: {
    canonical: 'https://www.podovi.online/kategorije',
  },
};

export default async function CategoriesPage() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.podovi.online';
  const [categories, brands, products] = await Promise.all([
    categoryRepository.findAll(),
    brandRepository.findAll(),
    productRepository.findAll(),
  ]);

  const productCountByCategory = new Map<string, number>();
  for (const product of products) {
    productCountByCategory.set(product.categoryId, (productCountByCategory.get(product.categoryId) || 0) + 1);
  }

  const repoBackedBrandIds = new Set(brands.map((brand) => brand.id));
  const activeBrandCount = new Set(
    products
      .map((product) => product.brandId)
      .filter((brandId) => repoBackedBrandIds.has(brandId))
  ).size;
  const featuredCategories = categories.slice(0, 6);
  const categoriesHubSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Kategorije asortimana',
    description: categoriesPageDescription,
    url: `${baseUrl}/kategorije`,
    inLanguage: 'sr-RS',
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: categories.length,
      itemListElement: categories.map((category, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: category.name,
        url: `${baseUrl}/kategorije/${category.slug}`,
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
              { name: 'Kategorije', url: `${baseUrl}/kategorije` },
            ]),
            categoriesHubSchema,
          ]),
        }}
      />
      <div className="container pt-6 pb-8">
        <div className="mb-4">
          <Breadcrumbs items={[{ label: 'Kategorije' }]} />
        </div>

        <section className="mb-8 rounded-[1.75rem] border border-stone-200 bg-white px-6 py-8 shadow-sm">
          <div className="max-w-4xl">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">
              Kategorije asortimana
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl">
              Pregled svih kategorija kroz katalog
            </h1>
            <p className="mt-4 text-base leading-7 text-stone-700 sm:text-lg">
              Katalog je organizovan po stvarnim tipovima proizvoda i sistema, od podnih obloga do lajsni, otirača i tehničkih rešenja za objekte sa specifičnim zahtevima.
            </p>
            <p className="mt-3 text-sm leading-7 text-stone-600 sm:text-base">
              Ovaj hub služi kao najkraći ulaz u ceo asortiman kada korisnik još ne bira brend, već želi da krene od namene, tipa prostora ili klase proizvoda.
            </p>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-stone-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                Aktivne kategorije
              </p>
              <p className="mt-1 text-2xl font-semibold text-stone-900">
                {categories.length}
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
                Aktivni brendovi
              </p>
              <p className="mt-1 text-2xl font-semibold text-stone-900">
                {activeBrandCount}
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {categories.map((category) => (
            <CategoryCard
              key={category.id}
              category={category}
              productCount={productCountByCategory.get(category.id) || 0}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
