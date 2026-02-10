'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Product, Brand } from '@/types';
import { getEffectiveParketCollection, getParketCollectionSlug, PARKET_HEADER_COLLECTIONS } from '@/lib/data/parket-collection-mapping';

interface ProductCardClientProps {
  product: Product;
  brand: Brand | null;
  /** Kompaktna kartica (samo slika + naziv + link) – za tab Boje na parket kategoriji */
  compact?: boolean;
}

export default function ProductCardClient({ product, brand, compact = false }: ProductCardClientProps) {
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
    '1': 'laminat',
    '6': 'lvt',
    '7': 'linoleum',
    '4': 'tekstilne-ploce',
    '2': 'vinil',
    '3': 'parket',
  };

  // Logic to determine if we should link to a category filter (for variants or headers) vs single product page
  // 1. Color Tiles (LVT/Linoleum/etc variants): Link to category?color=slug
  // 2. Parket / Laminat Headers (Collection Hubs): Link to product page; variants: product?color=slug

  const isColorTileCategory = ['6', '7', '4', '2'].includes(product.categoryId);
  const colorCollectionSlug = (product as { collectionSlug?: string }).collectionSlug;
  const isParket = product.categoryId === '3';
  const isLaminat = product.categoryId === '1';

  let productHref = `/proizvodi/${product.slug}`;

  if (isColorTileCategory && colorCollectionSlug) {
    // Link to collection page with color parameter (same pattern as Parket/Laminat)
    // Collection slug needs 'gerflor-' prefix for LVT to match the collection page URL
    const normalizedCollectionSlug = product.categoryId === '6' && !colorCollectionSlug.startsWith('gerflor-')
      ? `gerflor-${colorCollectionSlug}`
      : colorCollectionSlug;
    productHref = `/proizvodi/${normalizedCollectionSlug}?color=${encodeURIComponent(product.slug)}`;
  } else if (isLaminat) {
    const isLaminatCollectionHeader = product.sku?.startsWith('LAM-');
    if (isLaminatCollectionHeader) {
      productHref = `/proizvodi/${product.slug}`;
    } else {
      const collectionName = product.specs?.find(s => s.key === 'collection')?.value;
      const collectionSlug = collectionName ? collectionName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') : product.slug;
      productHref = `/proizvodi/${collectionSlug}?color=${encodeURIComponent(product.slug)}`;
    }
  } else if (isParket) {
    // Parket Collection Headers: SKU PARKET-* ili ime u listi header kolekcija → link samo na ?collections= (otvara kolekciju, ne karticu boje)
    const isParketCollectionHeader =
      (product.sku && product.sku.startsWith('PARKET-') && !product.sku.includes('OAK') && !product.sku.includes('ASH')) ||
      (PARKET_HEADER_COLLECTIONS as readonly string[]).includes(product.name);
    if (isParketCollectionHeader) {
      // Kao LVT: klik na kolekciju otvara stranicu proizvoda kolekcije (Allegro + grid varijanti), ne kategoriju
      productHref = `/proizvodi/${product.slug}`;
    } else {
      // Parket Variant: link na stranicu proizvoda kolekcije sa ?color= (kao LVT) – /proizvodi/allegro?color=hrast-elegant-shiny-3-strip
      const collectionSpec = product.specs?.find(s => s.key === 'collection');
      const collectionName = getEffectiveParketCollection(product.slug, collectionSpec?.value);
      const collectionSlug = collectionName ? getParketCollectionSlug(collectionName) : null;

      if (collectionSlug) {
        productHref = `/proizvodi/${collectionSlug}?color=${encodeURIComponent(product.slug)}`;
      } else {
        productHref = `/proizvodi/${product.slug}`;
      }
    }
  }

  if (compact) {
    return (
      <Link href={productHref} className="group block rounded-lg border border-gray-200 bg-white overflow-hidden hover:border-primary-500 hover:shadow-md transition-all duration-200">
        <div className="relative aspect-square bg-gray-100 overflow-hidden">
          {primaryImage ? (
            <Image
              key={imageSrc}
              src={imageSrc.startsWith('/') ? imageSrc : '/images/placeholder.svg'}
              alt={primaryImage.alt}
              fill
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 20vw"
              quality={90}
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              unoptimized={!imageSrc.startsWith('/')}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">Bez slike</div>
          )}
        </div>
        <div className="p-3">
          {brand && (
            <p className="text-[10px] text-primary-600 uppercase tracking-wider font-semibold mb-0.5">{brand.name}</p>
          )}
          <p className="font-semibold text-sm text-gray-900 line-clamp-2 group-hover:text-primary-600 transition-colors">
            {displayName}
          </p>
          <span className="inline-flex items-center text-primary-600 text-xs font-medium mt-1 group-hover:text-primary-700">
            Detaljnije
            <svg className="w-3 h-3 ml-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </span>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={productHref}
      className="group card card-hover"
    >
      <div className="relative h-64 bg-gray-100 overflow-hidden">
        {primaryImage ? (
          <Image
            key={imageSrc}
            src={imageSrc.startsWith('/') ? imageSrc : '/images/placeholder.svg'}
            alt={primaryImage.alt}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            quality={90}
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            unoptimized={!imageSrc.startsWith('/')}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <span>Bez slike</span>
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