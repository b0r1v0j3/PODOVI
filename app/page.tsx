import Link from 'next/link';
import { categoryRepository } from '@/lib/repositories/category-repository';
import { productRepository } from '@/lib/repositories/product-repository';
import { brandRepository } from '@/lib/repositories/brand-repository';
import HomeHero from '@/components/HomeHero';
import HomeProductTabs, { HomeProductGroup } from '@/components/HomeProductTabs';
import ScrollReveal from '@/components/ScrollReveal';
import { Product } from '@/types';
import { hasCollectionSku } from '@/lib/utils/homepage-collection-filter';

export const metadata = {
  title: 'podovi',
  description: 'Pronađite pravo rešenje za vaš prostor: laminat, vinil, parket, alati, lajsne, otirači i drugi sistemi vodećih evropskih brendova.',
};

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
      <HomeHero />

      <HomeProductTabs groups={productGroups} brandsRecord={brandsRecord} />

      {/* Why Choose Us */}
      <section className="border-y border-ink-200 bg-white py-20 md:py-24">
        <div className="container">
          <div className="mb-12 md:mb-16">
            <h2 className="text-center text-3xl font-normal tracking-tight text-ink-900 md:text-5xl">
              Zašto izabrati nas?
            </h2>
          </div>

          <div className="grid grid-cols-1 divide-y divide-ink-200 md:grid-cols-3 md:divide-x md:divide-y-0">
            <ScrollReveal className="py-10 md:py-2 md:pr-10">
              <div className="md:min-h-[240px]">
                <span className="block text-[34px] font-normal leading-none text-ink-200">01</span>
                <h3 className="mb-3 mt-8 text-xl font-medium tracking-tight text-ink-900">Proveren kvalitet</h3>
                <p className="text-[15px] leading-7 text-ink-600">
                  Radimo samo sa renomiranim evropskim proizvođačima sa dugogodišnjom tradicijom.
                </p>
              </div>
            </ScrollReveal>
            <ScrollReveal delay={100} className="py-10 md:px-10 md:py-2">
              <div className="md:min-h-[240px]">
                <span className="block text-[34px] font-normal leading-none text-ink-200">02</span>
                <h3 className="mb-3 mt-8 text-xl font-medium tracking-tight text-ink-900">Konkurentne cene</h3>
                <p className="text-[15px] leading-7 text-ink-600">
                  Najbolji odnos cene i kvaliteta zahvaljujući direktnoj saradnji sa proizvođačima.
                </p>
              </div>
            </ScrollReveal>
            <ScrollReveal delay={200} className="py-10 md:py-2 md:pl-10">
              <div className="md:min-h-[240px]">
                <span className="block text-[34px] font-normal leading-none text-ink-200">03</span>
                <h3 className="mb-3 mt-8 text-xl font-medium tracking-tight text-ink-900">Stručna podrška</h3>
                <p className="text-[15px] leading-7 text-ink-600">
                  Naš tim stručnjaka će vam pomoći da izaberete idealno rešenje za vaš prostor.
                </p>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-ink-900 py-20 text-white md:py-24">
        <ScrollReveal>
          <div className="container">
            <div className="mx-auto max-w-5xl text-center">
              <p className="mb-5 text-[11px] uppercase tracking-label text-white/60">Upit za ponudu</p>
              <h2 className="text-3xl font-normal tracking-tight text-white md:text-5xl">
                Spremni da transformišete vaš prostor?
              </h2>
              <p className="mx-auto mt-8 max-w-3xl text-lg leading-8 text-white/65">
              Pošaljite nam upit i naš stručni tim će vam se javiti u najkraćem roku sa personalizovanom ponudom.
              </p>
              <Link href="/upiti" className="btn-inverse mt-10 inline-flex items-center justify-center">
                Pošalji upit
              </Link>
            </div>
          </div>
        </ScrollReveal>
      </section>
    </div>
  );
}
