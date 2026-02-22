import { productRepository } from '@/lib/repositories/product-repository';
import ProductCard from './ProductCard';
import { Product } from '@/types';

interface RelatedProductsProps {
    currentProductId: string;
    categoryId: string;
    currentProductSlug: string;
}

export default async function RelatedProducts({ currentProductId, categoryId, currentProductSlug }: RelatedProductsProps) {
    // Fetch products from the same category
    const products = await productRepository.findByCategory(categoryId);

    // Filter out the current product, collection-level products (keep only individual colors/variants), and limit to 4
    const relatedProducts = products
        .filter((p) => p.id !== currentProductId && p.slug !== currentProductSlug)
        .filter((p) => {
            // Exclude collection-level products (they have collection SKU patterns or no proper images)
            if (p.sku?.startsWith('TARKETT-COLL-') || p.sku?.startsWith('LAM-') || p.sku?.startsWith('BLOQ-COLL-')) return false;
            // Exclude products whose slug matches a collection slug pattern (e.g. gerflor-creation-30)
            if (p.slug?.startsWith('gerflor-creation-') && !p.slug.match(/\d{3,}/)) return false;
            if (p.slug?.startsWith('gerflor-saga') && !p.slug.match(/\d{3,}/)) return false;
            return true;
        })
        .sort(() => 0.5 - Math.random()) // Simple shuffle
        .slice(0, 4);

    if (relatedProducts.length === 0) {
        return null;
    }

    return (
        <section className="py-12 bg-gray-50 border-t border-gray-100">
            <div className="container">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">
                    Slični proizvodi
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {relatedProducts.map((product) => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>
            </div>
        </section>
    );
}
