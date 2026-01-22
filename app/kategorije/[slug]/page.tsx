import { notFound } from 'next/navigation';
import { categoryRepository } from '@/lib/repositories/category-repository';
import { productRepository } from '@/lib/repositories/product-repository';
import { brandRepository } from '@/lib/repositories/brand-repository';
import ProductCard from '@/components/ProductCard';
import ProductFilters from '@/components/ProductFilters';
import LVTTabs from '@/components/LVTTabs';

interface CategoryPageProps {
  params: { slug: string };
  searchParams: {
    search?: string;
    brands?: string;
    priceMin?: string;
    priceMax?: string;
    inStock?: string;
    color?: string;
    type?: string; // For vinyl type filter: 'homogeni' | 'heterogeni'
    collections?: string; // For LVT collection filter (comma-separated)
  };
}

export async function generateMetadata({ params }: CategoryPageProps) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.podovi.online';
  const category = await categoryRepository.findBySlug(params.slug);

  if (!category) {
    return {
      metadataBase: new URL(baseUrl),
      title: 'Kategorija nije pronađena',
    };
  }

  const products = await productRepository.findByCategory(category.id);
  const productCount = products.length;

  return {
    metadataBase: new URL(baseUrl),
    title: `${category.name} - ${productCount} Proizvoda | Podovi.online`,
    description: `${category.description} Pregledajte našu ponudu od ${productCount} proizvoda u kategoriji ${category.name}.`,
    keywords: `${category.name}, podovi, podne obloge, laminat, vinil, parket, Srbija`,
    openGraph: {
      title: `${category.name} - Podovi.online`,
      description: category.description,
      type: 'website',
      locale: 'sr_RS',
      url: `${baseUrl}/kategorije/${params.slug}`,
      siteName: 'Podovi.online',
      images: category.image ? [
        {
          url: category.image,
          width: 1200,
          height: 630,
          alt: category.name,
        }
      ] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${category.name} - Podovi.online`,
      description: category.description,
      images: category.image ? [category.image] : [],
    },
    alternates: {
      canonical: `${baseUrl}/kategorije/${params.slug}`,
    },
  };
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const category = await categoryRepository.findBySlug(params.slug);

  if (!category) {
    notFound();
  }

  // Parse filters from search params
  const filters = {
    categoryId: category.id,
    search: searchParams.search,
    brandIds: searchParams.brands ? searchParams.brands.split(',') : undefined,
    priceMin: searchParams.priceMin ? parseFloat(searchParams.priceMin) : undefined,
    priceMax: searchParams.priceMax ? parseFloat(searchParams.priceMax) : undefined,
    inStock: searchParams.inStock === 'true' ? true : undefined,
    type: searchParams.type, // For vinyl type filter
    collections: searchParams.collections ? searchParams.collections.split(',') : undefined, // For LVT collection filter
  };

  const products = await productRepository.findByCategory(category.id, filters);
  const allBrands = await brandRepository.findAll();

  // Get unique brands used in this category
  const categoryProducts = await productRepository.findByCategory(category.id);
  const categoryBrandIds = new Set(categoryProducts.map(p => p.brandId));
  const availableBrands = allBrands.filter(b => categoryBrandIds.has(b.id));

  // For LVT, Linoleum, Carpet, and Vinil categories, separate collections from colors
  const isLVTCategory = category.slug === 'lvt' || category.slug === 'linoleum' || category.slug === 'tekstilne-ploce' || category.slug === 'vinil';
  let collections: typeof products = [];
  let colors: typeof products = [];
  let availableCollections: string[] = [];

  // Create brands object for Client Component (serializable)
  const brandsRecord: Record<string, typeof allBrands[0]> = {};
  if (isLVTCategory) {
    // Collections are products with SKU starting with "GER-" (LVT/Vinil), "LINOLEUM-" (Linoleum), "VINIL-" (Vinil)
    // Colors are individual color products with 4-digit SKU codes or other patterns
    collections = products.filter(p => (p.sku?.startsWith('GER-') || p.sku?.startsWith('LINOLEUM-') || p.sku?.startsWith('VINIL-')) ?? false);
    colors = products.filter(p => !(p.sku?.startsWith('GER-') || p.sku?.startsWith('LINOLEUM-') || p.sku?.startsWith('VINIL-')));

    // Build brands record for all products
    for (const product of products) {
      if (!brandsRecord[product.brandId]) {
        const brand = allBrands.find(b => b.id === product.brandId);
        if (brand) {
          brandsRecord[product.brandId] = brand;
        }
      }
    }

    // Extract unique LVT collection names for filter (grouped like Gerflor: Creation 30, 40, 55, 70, SAGA²)
    // Zen variants are part of their respective collections (40, 55, 70)
    if (category.slug === 'lvt') {
      const collectionGroups = new Set<string>();
      collections.forEach(p => {
        const name = p.name;
        if (name.includes('Creation')) {
          // Extract base collection number (30, 40, 55, 70)
          // Zen variants are included in their base collection
          if (name.includes('Creation 30')) {
            collectionGroups.add('Creation 30');
          } else if (name.includes('Creation 40')) {
            collectionGroups.add('Creation 40');
          } else if (name.includes('Creation 55')) {
            collectionGroups.add('Creation 55');
          } else if (name.includes('Creation 70')) {
            collectionGroups.add('Creation 70');
          }
        } else if (name.includes('Saga')) {
          collectionGroups.add('SAGA²');
        }
      });
      // Sort in specific order: Creation 30, 40, 55, 70, SAGA²
      const order = ['Creation 30', 'Creation 40', 'Creation 55', 'Creation 70', 'SAGA²'];
      availableCollections = Array.from(collectionGroups).sort((a, b) => {
        const indexA = order.indexOf(a);
        const indexB = order.indexOf(b);
        if (indexA === -1 && indexB === -1) return a.localeCompare(b);
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;
        return indexA - indexB;
      });
    }
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container py-6">
          <nav className="text-sm text-gray-600 mb-4">
            <a href="/" className="hover:text-primary-600">Početna</a>
            <span className="mx-2">/</span>
            <a href="/kategorije" className="hover:text-primary-600">Kategorije</a>
            <span className="mx-2">/</span>
            <span className="text-gray-900">{category.name}</span>
          </nav>
          <h1 className="text-3xl md:text-4xl font-semibold text-gray-900 mb-3">
            {category.name}
          </h1>
          <p className="text-base md:text-lg text-gray-600">
            {category.description}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="container py-8">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Filters Sidebar */}
          <aside className="lg:w-60 flex-shrink-0">
            <ProductFilters
              availableBrands={availableBrands}
              currentFilters={filters}
              availableCollections={availableCollections}
            />
          </aside>

          {/* Products Grid */}
          <div className="flex-1">
            {isLVTCategory ? (
              <LVTTabs
                collections={collections}
                colors={colors}
                brandsRecord={brandsRecord}
                categorySlug={category.slug}
                initialColorSlug={searchParams.color}
                vinylType={searchParams.type}
              />
            ) : (
              <>
                <div className="mb-6 flex items-center justify-between">
                  <p className="text-gray-600">
                    {products.length === 0 ? 'Nema' : products.length} {products.length === 1 ? 'proizvod' : 'proizvoda'}
                  </p>
                </div>

                {products.length === 0 ? (
                  <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                    <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Nema proizvoda
                    </h3>
                    <p className="text-gray-600">
                      Trenutno nema proizvoda koji odgovaraju izabranim filterima.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {products.map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
