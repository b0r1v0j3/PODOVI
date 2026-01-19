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
  
  // For LVT, Linoleum, Carpet, and Vinil categories, link appropriately
  // Collections don't have collectionSlug, only individual colors do
  const isColorTile = product.categoryId === '6' || product.categoryId === '7' || product.categoryId === '4' || product.categoryId === '2';
  const colorCollectionSlug = (product as { collectionSlug?: string }).collectionSlug;
  
  let productHref = `/proizvodi/${product.slug}`;
  
  // For Vinil: colors link to category with ?color=, collections link to category
  if (product.categoryId === '2') {
    // Check if it's a color (SKU is numbers only) or collection (SKU starts with 'GER-')
    const isVinylColor = /^\d+$/.test(product.sku);
    const isVinylCollection = product.sku.startsWith('GER-');
    
    if (isVinylColor) {
      // For vinyl colors, link directly to category page with color parameter
      productHref = `/kategorije/vinil?color=${product.slug}`;
    } else if (isVinylCollection) {
      // For vinyl collections, link to category page
      productHref = `/kategorije/vinil`;
    }
  } else if (isColorTile && colorCollectionSlug) {
    // For LVT/Linoleum/Carpet colors with collectionSlug
    let collectionSlug = colorCollectionSlug;
    // For LVT, ensure gerflor- prefix
    if (product.categoryId === '6' && !collectionSlug.startsWith('gerflor-')) {
      collectionSlug = `gerflor-${collectionSlug}`;
    }
    // For Linoleum, use slug WITHOUT gerflor- prefix
    if (product.categoryId === '7' && collectionSlug.startsWith('gerflor-')) {
      collectionSlug = collectionSlug.replace(/^gerflor-/, '');
    }
    // For Carpet, collection_slug already has gerflor- prefix
    // Link to COLLECTION page with color parameter (product.slug is the color slug)
    productHref = `/proizvodi/${collectionSlug}?color=${product.slug}`;
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
            onError={(e) => {
              console.error('Image failed to load:', primaryImage.url);
              // Don't hide, just log the error
            }}
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
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      </div>
      <div className="p-6">
        {brand && (
          <p className="text-[11px] text-primary-600 mb-2 uppercase tracking-wider font-semibold">
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
