import Link from 'next/link';
import Image from 'next/image';
import { Product } from '@/types';
import { brandRepository } from '@/lib/repositories/brand-repository';

interface ProductCardProps {
  product: Product;
}

export default async function ProductCard({ product }: ProductCardProps) {
  const brand = await brandRepository.findById(product.brandId);
  const primaryImage = product.images && product.images.length > 0 
    ? (product.images.find(img => img.isPrimary) || product.images[0])
    : null;

  // For LVT, Linoleum, and Carpet categories, link to category page with color parameter (NOT collection page)
  // Map category IDs to category slugs
  const categorySlugMap: Record<string, string> = {
    '6': 'lvt',
    '7': 'linoleum',
    '4': 'tekstilne-ploce',
  };
  
  const isColorTile = product.categoryId === '6' || product.categoryId === '7' || product.categoryId === '4';
  
  let productHref = `/proizvodi/${product.slug}`;
  
  // For color products (LVT/Linoleum/Carpet), link to category page with color parameter
  // This ensures that clicking on a featured product goes to the category page, not individual product pages
  if (isColorTile) {
    const categorySlug = categorySlugMap[product.categoryId] || 'lvt';
    productHref = `/kategorije/${categorySlug}?color=${product.slug}`;
  }

  return (
    <Link 
      href={productHref}
      className="group card card-hover border-0"
    >
      <div className="relative h-64 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden group-hover:scale-105 transition-transform duration-500">
        {primaryImage ? (
          <Image
            src={primaryImage.url}
            alt={primaryImage.alt}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <span>Bez slike</span>
          </div>
        )}
        {!product.inStock && (
          <div className="absolute top-3 right-3 badge-warning shadow-lg">
            Nema na stanju
          </div>
        )}
        {product.featured && (
          <div className="absolute top-3 left-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-lg">
            Izdvojeno
          </div>
        )}
        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      </div>
      <div className="p-5">
        {brand && (
          <p className="text-xs text-primary-600 mb-2 uppercase tracking-wider font-semibold">
            {brand.name}
          </p>
        )}
        <h3 className="font-bold text-lg mb-2 line-clamp-2 text-gray-900 group-hover:text-primary-600 transition-colors duration-300">
          {product.name}
        </h3>
        <p className="text-sm text-gray-600 mb-4 line-clamp-2 leading-relaxed">
          {product.shortDescription}
        </p>
        {product.price && product.price > 0 && (
          <div className="flex items-baseline justify-between mb-4">
            <div>
              <span className="text-2xl font-bold text-gray-900">
                {product.price.toLocaleString('sr-RS')}
              </span>
              <span className="text-sm text-gray-500 ml-1">
                RSD/{product.priceUnit}
              </span>
            </div>
          </div>
        )}
        <div className="flex items-center text-primary-600 font-semibold text-sm group-hover:gap-2 transition-all duration-300">
          <span>Detaljnije</span>
          <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </Link>
  );
}
