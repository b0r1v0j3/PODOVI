import Link from 'next/link';
import { categoryRepository } from '@/lib/repositories/category-repository';
import { productRepository } from '@/lib/repositories/product-repository';
import { brandRepository } from '@/lib/repositories/brand-repository';
import HomeProductTabs, { HomeProductGroup } from '@/components/HomeProductTabs';
import ScrollReveal from '@/components/ScrollReveal';
import { Product } from '@/types';

export const metadata = {
  title: 'podovi',
  description: 'Pronađite pravo rešenje za vaš prostor: laminat, vinil, parket, alati, lajsne, otirači i drugi sistemi vodećih evropskih brendova.',
};

const COLLECTION_SKU_PREFIXES = [
  'GER-',
  'TARKETT-',
  'PODOVI-COLLECTION-',
  'WOLFLOR-VINYL-',
  'LINOLEUM-',
  'VINIL-',
  'PARKET-',
  'LAM-',
  'BLOQ-',
  'DEKING-',
  'TIMBERTECH-',
  'ESD-',
  'IND-',
  'SPORT-',
  'TARKETT-LAJSNE-',
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

function selectHomepageProducts(products: Product[]): Product[] {
  const collectionProducts = products.filter(hasCollectionSku);
  const source = collectionProducts.length > 0 ? collectionProducts : products;

  return dedupeBySlug(source)
    .map((product) => backfillCollectionImages(product, products))
    .sort((a, b) => Number((b.images?.length || 0) > 0) - Number((a.images?.length || 0) > 0));
}

export default async function HomePage() {
  const categories = await categoryRepository.findAll();
  const homepageCategories = categories;
  const [brands, productBuckets] = await Promise.all([
    brandRepository.findAll(),
    Promise.all(homepageCategories.map((category) => productRepository.findByCategory(category.id))),
  ]);
  const brandsRecord = Object.fromEntries(brands.map((brand) => [brand.id, brand]));
  const productGroups: HomeProductGroup[] = homepageCategories
    .map((category, index) => {
      const products = productBuckets[index] || [];
      const selectedProducts = selectHomepageProducts(products);

      return {
        category: {
          id: category.id,
          name: category.name,
          slug: category.slug,
        },
        products: selectedProducts,
        totalCount: selectedProducts.length,
      };
    })
    .filter((group) => group.products.length > 0);

  return (
    <div>
      <HomeProductTabs groups={productGroups} brandsRecord={brandsRecord} />

      {/* Why Choose Us */}
      <section className="border-y border-[#1D1D1F]/10 bg-white py-20 md:py-24">
        <div className="container">
          <div className="mb-12 md:mb-16">
            <h2 className="text-center text-4xl font-semibold tracking-tight text-[#111111] md:text-6xl">
              Zašto izabrati nas?
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-px overflow-hidden border-y border-[#1D1D1F]/10 bg-[#1D1D1F]/10 md:grid-cols-3">
            <ScrollReveal>
              <div className="group bg-white p-8 transition-colors duration-300 hover:bg-[#F5F5F7] md:min-h-[280px]">
                <div className="mb-10 flex items-center justify-between">
                  <span className="text-sm font-medium text-[#A1A1A6]">01</span>
                  <svg className="h-6 w-6 text-[#111111]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="mb-4 text-2xl font-semibold tracking-tight text-[#111111]">Proveren kvalitet</h3>
                <p className="leading-7 text-[#6E6E73]">
                  Radimo samo sa renomiranim evropskim proizvođačima sa dugogodišnjom tradicijom.
                </p>
              </div>
            </ScrollReveal>
            <ScrollReveal delay={100}>
              <div className="group bg-white p-8 transition-colors duration-300 hover:bg-[#F5F5F7] md:min-h-[280px]">
                <div className="mb-10 flex items-center justify-between">
                  <span className="text-sm font-medium text-[#A1A1A6]">02</span>
                  <svg className="h-6 w-6 text-[#111111]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="mb-4 text-2xl font-semibold tracking-tight text-[#111111]">Konkurentne cene</h3>
                <p className="leading-7 text-[#6E6E73]">
                  Najbolji odnos cene i kvaliteta zahvaljujući direktnoj saradnji sa proizvođačima.
                </p>
              </div>
            </ScrollReveal>
            <ScrollReveal delay={200}>
              <div className="group bg-white p-8 transition-colors duration-300 hover:bg-[#F5F5F7] md:min-h-[280px]">
                <div className="mb-10 flex items-center justify-between">
                  <span className="text-sm font-medium text-[#A1A1A6]">03</span>
                  <svg className="h-6 w-6 text-[#111111]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <h3 className="mb-4 text-2xl font-semibold tracking-tight text-[#111111]">Stručna podrška</h3>
                <p className="leading-7 text-[#6E6E73]">
                  Naš tim stručnjaka će vam pomoći da izaberete idealno rešenje za vaš prostor.
                </p>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-[#111111] py-20 text-white md:py-24">
        <ScrollReveal>
          <div className="container">
            <div className="mx-auto max-w-5xl text-center">
              <p className="mb-5 text-sm font-medium uppercase tracking-[0.22em] text-white/45">Upit za ponudu</p>
              <h2 className="text-4xl font-semibold tracking-tight text-white md:text-6xl">
                Spremni da transformišete vaš prostor?
              </h2>
              <p className="mx-auto mt-8 max-w-3xl text-lg leading-8 text-white/65 md:text-xl">
              Pošaljite nam upit i naš stručni tim će vam se javiti u najkraćem roku sa personalizovanom ponudom.
              </p>
              <Link href="/upiti" className="mt-10 inline-flex items-center justify-center gap-3 rounded-full bg-white px-8 py-4 text-base font-semibold text-[#111111] transition-all duration-300 hover:bg-[#E8E8ED] focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[#111111]">
                Pošalji upit
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
            </div>
          </div>
        </ScrollReveal>
      </section>
    </div>
  );
}
