'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Product, Brand } from '@/types';

interface ProductCardClientProps {
  product: Product;
  brand: Brand | null;
}

export default function ProductCardClient({ product, brand }: ProductCardClientProps) {
  const primaryImage = product.images && product.images.length > 0
    ? (product.images.find(img => img.isPrimary) || product.images[0])
    : null;
  const isLocalImage = !!primaryImage?.url?.startsWith('/');

  // For local images, use Next.js Image with unoptimized flag
  const imageSrc = primaryImage?.url || '';

  // Remove "Gerflor" prefix from product name for LVT collections
  const displayName = product.categoryId === '6' && product.name.startsWith('Gerflor ')
    ? product.name.replace(/^Gerflor\s+/, '')
    : product.name;

  // Map category IDs to category slugs
  const categorySlugMap: Record<string, string> = {
    '6': 'lvt',
    '7': 'linoleum',
    '4': 'tekstilne-ploce',
    '2': 'vinil',
    '3': 'parket',
  };

  // Logic to determine if we should link to a category filter (for variants or headers) vs single product page
  // 1. Color Tiles (LVT/Linoleum/etc variants): Link to category?color=slug
  // 2. Parket Headers (Collection Hubs): Link to category?collections=name

  const isColorTileCategory = ['6', '7', '4', '2'].includes(product.categoryId);
  const colorCollectionSlug = (product as { collectionSlug?: string }).collectionSlug;
  const isParket = product.categoryId === '3';

  let productHref = `/proizvodi/${product.slug}`;

  if (isColorTileCategory && colorCollectionSlug) {
    const categorySlug = categorySlugMap[product.categoryId] || 'lvt';
    productHref = `/kategorije/${categorySlug}?color=${product.slug}`;
  } else if (isParket) {
    // Parket Collection Headers have SKU starting with 'PARKET-' (e.g., 'PARKET-SALSA')
    // We link them to the Product Page directly (where variants will be shown via customColors)
    if (product.sku && product.sku.startsWith('PARKET-') && !product.sku.includes('OAK') && !product.sku.includes('ASH')) {
      productHref = `/proizvodi/${product.slug}`;
    } else {
      // Parket Variant
      // Link to Collection Header + color param
      // Try to find collection name from specs or similar?
      // ProductCardClient doesn't have full specs easily accessible or parsing logic might be complex.
      // BUT, we can try to guess collection slug from name or specs if passed.
      // Actually, we don't have collectionSlug in props easily.
      // If we can't reliably determine collection, linking to variant page is safer, 
      // and ProductPage will redirect to Collection?color=variant.
      // So linking to /proizvodi/variant-slug is fine, because we implemented the redirect in Page.tsx!
      productHref = `/proizvodi/${product.slug}`;
    }
  }

  return (
    <Link
      href={productHref}
      className="group card card-hover"
    >
      <div className="relative h-64 bg-gray-100 overflow-hidden">
        {primaryImage ? (
          <img
            src={imageSrc}
            alt={primaryImage.alt}
            loading="lazy"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
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
        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      </div>
      <div className="p-6">
        {brand && (
          <p className="text-[11px] text-primary-600 mb-2 uppercase tracking-wider font-semibold">
            {brand.name}
          </p>
        )}
        <h3 className="font-bold text-lg mb-2 line-clamp-2 text-gray-900 group-hover:text-primary-600 transition-colors duration-300">
          {displayName}
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
        <div className="flex items-center text-primary-600 font-semibold text-sm group-hover:text-primary-700 transition-colors duration-300">
          <span>Detaljnije</span>
          <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </Link>
  );
}