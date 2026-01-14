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

  return {
    metadataBase: new URL(baseUrl),
    title: `${category.name} - Podovi`,
    description: category.description,
    openGraph: {
      title: `${category.name} - Podovi`,
      description: category.description,
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
  };

  const products = await productRepository.findByCategory(category.id, filters);
  const allBrands = await brandRepository.findAll();
  
  // Get unique brands used in this category
  const categoryProducts = await productRepository.findByCategory(category.id);
  const categoryBrandIds = new Set(categoryProducts.map(p => p.brandId));
  const availableBrands = allBrands.filter(b => categoryBrandIds.has(b.id));

  // For LVT category, separate collections from colors
  const isLVTCategory = category.slug === 'lvt';
  let collections: typeof products = [];
  let colors: typeof products = [];
  
  if (isLVTCategory) {
    // Collections are products with SKU starting with "GER-" (main collection products)
    // Colors are individual color products with 4-digit SKU codes or other patterns
    collections = products.filter(p => p.sku?.startsWith('GER-') ?? false);
    colors = products.filter(p => !p.sku?.startsWith('GER-'));
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container py-8">
          <nav className="text-sm text-gray-600 mb-4">
            <a href="/" className="hover:text-primary-600">Početna</a>
            <span className="mx-2">/</span>
            <a href="/kategorije" className="hover:text-primary-600">Kategorije</a>
            <span className="mx-2">/</span>
            <span className="text-gray-900">{category.name}</span>
          </nav>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {category.name}
          </h1>
          <p className="text-lg text-gray-600">
            {category.description}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="container py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <aside className="lg:w-64 flex-shrink-0">
            <ProductFilters 
              availableBrands={availableBrands}
              currentFilters={filters}
            />
          </aside>

          {/* Products Grid */}
          <div className="flex-1">
            {isLVTCategory ? (
              <LVTTabs
                collections={collections}
                colors={colors}
                renderProducts={(productsToRender) => {
                  if (productsToRender.length === 0) {
                    return (
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
                    );
                  }
                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                      {productsToRender.map((product) => (
                        <ProductCard key={product.id} product={product} />
                      ))}
                    </div>
                  );
                }}
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
