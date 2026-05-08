import Link from 'next/link';
import { categoryRepository } from '@/lib/repositories/category-repository';
import { productRepository } from '@/lib/repositories/product-repository';
import { brandRepository } from '@/lib/repositories/brand-repository';
import HomeProductTabs, { HomeProductGroup } from '@/components/HomeProductTabs';
import ScrollReveal from '@/components/ScrollReveal';
import { Product } from '@/types';

export const metadata = {
  title: 'Podovi.online - Katalog podnih obloga i pratećeg asortimana',
  description: 'Pronađite pravo rešenje za vaš prostor: laminat, vinil, parket, lajsne, otirači i drugi sistemi vodećih evropskih brendova.',
};

const HOMEPAGE_CATEGORY_SLUGS = [
  'parket',
  'laminat',
  'lvt',
  'tekstilne-ploce',
  'deking',
  'vinil',
  'linoleum',
  'industrijske-ploce',
  'sport',
  'elektroprovodni',
];

const COLLECTION_SKU_PREFIXES = [
  'GER-',
  'TARKETT-',
  'WOLFLOR-VINYL-',
  'LINOLEUM-',
  'VINIL-',
  'PARKET-',
  'LAM-',
  'BLOQ-',
  'DEKING-',
  'ESD-',
  'IND-',
  'SPORT-',
];

function hasCollectionSku(product: Product): boolean {
  return COLLECTION_SKU_PREFIXES.some((prefix) => product.sku?.startsWith(prefix));
}

function dedupeBySlug(products: Product[]): Product[] {
  const seen = new Set<string>();

  return products.filter((product) => {
    if (!product.slug || seen.has(product.slug)) {
      return false;
    }

    seen.add(product.slug);
    return true;
  });
}

function getCollectionName(product: Product): string {
  return product.specs?.find((spec) => spec.key === 'collection')?.value ||
    product.specs?.find((spec) => spec.key === 'brand_line')?.value ||
    product.name;
}

function backfillCollectionImages(product: Product, allProducts: Product[]): Product {
  if (product.images?.length > 0) {
    return product;
  }

  const collectionName = getCollectionName(product);
  const variantWithImage = allProducts.find((candidate) => {
    if (candidate.id === product.id || hasCollectionSku(candidate) || !candidate.images?.length) {
      return false;
    }

    return getCollectionName(candidate) === collectionName;
  });

  return variantWithImage ? { ...product, images: variantWithImage.images } : product;
}

function selectHomepageProducts(products: Product[], limit = 12): Product[] {
  const collectionProducts = products.filter(hasCollectionSku);
  const source = collectionProducts.length > 0 ? collectionProducts : products;

  return dedupeBySlug(source)
    .map((product) => backfillCollectionImages(product, products))
    .sort((a, b) => Number((b.images?.length || 0) > 0) - Number((a.images?.length || 0) > 0))
    .slice(0, limit);
}

export default async function HomePage() {
  const categories = await categoryRepository.findAll();
  const categoriesBySlug = new Map(categories.map((category) => [category.slug, category]));
  const homepageCategories = HOMEPAGE_CATEGORY_SLUGS
    .map((slug) => categoriesBySlug.get(slug))
    .filter((category): category is NonNullable<typeof category> => Boolean(category));
  const [brands, productBuckets] = await Promise.all([
    brandRepository.findAll(),
    Promise.all(homepageCategories.map((category) => productRepository.findByCategory(category.id))),
  ]);
  const brandsRecord = Object.fromEntries(brands.map((brand) => [brand.id, brand]));
  const productGroups: HomeProductGroup[] = homepageCategories
    .map((category, index) => {
      const products = productBuckets[index] || [];
      const selectedProducts = selectHomepageProducts(products);
      const totalCount = (products.filter(hasCollectionSku).length || products.length);

      return {
        category: {
          id: category.id,
          name: category.name,
          slug: category.slug,
        },
        products: selectedProducts,
        totalCount,
      };
    })
    .filter((group) => group.products.length > 0);

  return (
    <div>
      <HomeProductTabs groups={productGroups} brandsRecord={brandsRecord} />

      {/* Why Choose Us */}
      <section className="py-24 bg-gray-50 relative overflow-hidden border-y border-gray-100/50">
        <div className="container relative z-10">
          <div className="text-center mb-20 animate-fadeInUp">
            <span className="inline-block py-1 px-3 rounded-full bg-primary-50 text-primary-600 font-semibold tracking-wider uppercase text-xs mb-4">Naše prednosti</span>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 tracking-tight">
              Zašto izabrati nas?
            </h2>
            <div className="w-16 h-1 bg-primary-500 mx-auto rounded-full"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 max-w-5xl mx-auto">
            <ScrollReveal>
              <div className="text-center group p-8 rounded-3xl hover:bg-white hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)] transition-all duration-300">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-2xl mb-8 group-hover:-translate-y-2 transition-transform duration-300 shadow-sm border border-gray-100">
                  <svg className="w-8 h-8 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-900 tracking-tight">Proveren kvalitet</h3>
                <p className="text-gray-500 leading-relaxed font-light">
                  Radimo samo sa renomiranim evropskim proizvođačima sa dugogodišnjom tradicijom.
                </p>
              </div>
            </ScrollReveal>
            <ScrollReveal delay={100}>
              <div className="text-center group p-8 rounded-3xl hover:bg-white hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)] transition-all duration-300">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-2xl mb-8 group-hover:-translate-y-2 transition-transform duration-300 shadow-sm border border-gray-100">
                  <svg className="w-8 h-8 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-900 tracking-tight">Konkurentne cene</h3>
                <p className="text-gray-500 leading-relaxed font-light">
                  Najbolji odnos cene i kvaliteta zahvaljujući direktnoj saradnji sa proizvođačima.
                </p>
              </div>
            </ScrollReveal>
            <ScrollReveal delay={200}>
              <div className="text-center group p-8 rounded-3xl hover:bg-white hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)] transition-all duration-300">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-2xl mb-8 group-hover:-translate-y-2 transition-transform duration-300 shadow-sm border border-gray-100">
                  <svg className="w-8 h-8 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-900 tracking-tight">Stručna podrška</h3>
                <p className="text-gray-500 leading-relaxed font-light">
                  Naš tim stručnjaka će vam pomoći da izaberete idealno rešenje za vaš prostor.
                </p>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gray-900 text-white relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0djItaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTItMnYyaDJ2LTJoLTJ6bTQgMHYyaDJ2LTJoLTJ6bTQgMHYyaDJ2LTJoLTJ6bTQgMHYyaDJ2LTJoLTJ6bTQgMHYyaDJ2LTJoLTJ6bTIgMnYyaDJ2LTJoLTJ6bTAgNHYyaDJ2LTJoLTJ6bTAgNHYyaDJ2LTJoLTJ6bTAgNHYyaDJ2LTJoLTJ6bTAgNHYyaDJ2LTJoLTJ6bS0yIDJ2Mmgydi0yaC0yem0tNCAwdjJoMnYtMmgtMnptLTQgMHYyaDJ2LTJoLTJ6bS00IDB2Mmgydi0yaC0yem0tNCAwdjJoMnYtMmgtMnptLTItMnYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary-900/20 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary-900/20 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2"></div>

        <ScrollReveal>
          <div className="container text-center relative z-10">
            <h2 className="text-4xl md:text-6xl font-bold mb-8 text-white tracking-tight">
              Spremni da transformišete <br /> <span className="text-primary-400">vaš prostor?</span>
            </h2>
            <p className="text-xl md:text-2xl mb-12 text-gray-300 max-w-3xl mx-auto leading-relaxed font-light">
              Pošaljite nam upit i naš stručni tim će vam se javiti u najkraćem roku sa personalizovanom ponudom.
            </p>
            <Link href="/upiti" className="group inline-flex items-center justify-center px-10 py-5 text-lg font-bold text-white bg-primary-600 rounded-xl hover:bg-primary-500 hover:scale-105 transition-all duration-300 shadow-2xl hover:shadow-primary-600/50">
              Pošalji upit
              <svg className="w-6 h-6 ml-3 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
          </div>
        </ScrollReveal>
      </section>
    </div>
  );
}
