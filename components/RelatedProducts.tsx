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
        <section className="py-16 md:py-20 bg-white border-t border-ink-200">
            <div className="container">
                <p className="eyebrow mb-3">Iz iste kategorije</p>
                <h2 className="text-xl md:text-2xl font-normal text-ink-900 mb-10">
                    Slični proizvodi
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-10">
                    {relatedProducts.map((product) => (
                        <ProductCard
                            key={product.id}
                            product={product}
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        />
                    ))}
                </div>
            </div>
        </section>
    );
}
