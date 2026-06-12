'use client';

import Link from 'next/link';
import { Product, Brand } from '@/types';
import ProductCardOverlay from './ProductCardOverlay';
import ProductImage from './ProductImage';
import { splitProductTitle } from '@/lib/utils/name-parser';
import {
  areProductCardTextsEqual,
  getProductCardDisplayName,
} from '@/lib/utils/product-card-text';
import { getCanonicalProductHref } from '@/lib/utils/product-routes';
import { getProductImageCandidates } from '@/lib/utils/product-images';

interface ProductCardClientProps {
  product: Product;
  brand: Brand | null;
  /** Kompaktna kartica (samo slika + naziv + link) – za tab Boje na parket kategoriji */
  compact?: boolean;
}

export default function ProductCardClient({ product, brand, compact = false }: ProductCardClientProps) {
  const imageCandidates = getProductImageCandidates(product, compact ? 'thumb' : 'card').slice(0, 4);
  const primaryImage = imageCandidates[0];

  const displayName = getProductCardDisplayName(product.name, brand?.name);

  const productHref = getCanonicalProductHref(product as Product & { collectionSlug?: string });

  // Split the Product Title
  const rawCollectionName = product.specs?.find(s => s.key === 'collection')?.value;
  const displayCollectionName = rawCollectionName
    ? getProductCardDisplayName(rawCollectionName, brand?.name)
    : rawCollectionName;
  const { collection: splitCollection, color: splitColor } = splitProductTitle(displayName, displayCollectionName);

  if (compact) {
    return (
      <Link href={productHref} className="group block bg-white">
        <div className="relative aspect-[4/5] bg-paper overflow-hidden">
          {primaryImage ? (
            <ProductImage
              sources={imageCandidates}
              alt={primaryImage.alt}
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 20vw"
              quality={90}
              className="transition-transform duration-700 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-ink-500 text-sm">Bez slike</div>
          )}
          {/* Favorite & Compare buttons */}
          <div className="opacity-100 md:opacity-0 md:group-hover:opacity-100 md:focus-within:opacity-100 transition-opacity duration-300">
            <ProductCardOverlay product={product} />
          </div>
        </div>
        <div className="pt-3">
          {brand && (
            <p className="eyebrow mb-1">{brand.name}</p>
          )}
          {splitCollection && !areProductCardTextsEqual(splitCollection, splitColor) && (
            <p className="text-[12px] text-ink-500 mb-0.5 leading-tight truncate">
              {splitCollection}
            </p>
          )}
          <p className="text-sm font-normal text-ink-900 line-clamp-2 underline-offset-4 group-hover:underline">
            {splitColor}
          </p>
        </div>
      </Link>
    );
  }

  return (
    <Link href={productHref} className="group block h-full bg-white">
      <div className="relative aspect-[4/5] bg-paper overflow-hidden">
        {primaryImage ? (
          <ProductImage
            sources={imageCandidates}
            alt={primaryImage.alt}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            quality={90}
            className={`transition-transform duration-700 group-hover:scale-[1.03] ${product.categoryId === '5' ? 'object-left' :
              product.slug === 'gerflor-mipolam-technic-el5-eu' ? 'object-bottom' : ''
              }`}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-ink-500">
            <span>Bez slike</span>
          </div>
        )}
        {/* Favorite & Compare buttons */}
        <div className="opacity-100 md:opacity-0 md:group-hover:opacity-100 md:focus-within:opacity-100 transition-opacity duration-300">
          <ProductCardOverlay product={product} />
        </div>
      </div>
      <div className="pt-3 md:pt-4 flex flex-col">
        {brand && (
          <span className="eyebrow mb-1">
            {brand.name}
          </span>
        )}

        {splitCollection && !areProductCardTextsEqual(splitCollection, splitColor) && (
          <p className="text-[13px] text-ink-500 mb-0.5 leading-tight truncate">
            {splitCollection}
          </p>
        )}
        <h3 className="text-[15px] md:text-base font-normal text-ink-900 leading-snug underline-offset-4 group-hover:underline">
          {splitColor}
        </h3>

        {/* Price or "Cena na upit" */}
        <p className="mt-1 text-[13px] text-ink-500">
          {product.price && product.price > 0
            ? `${product.price.toLocaleString('sr-RS')} RSD/${product.priceUnit}`
            : 'Cena na upit'}
        </p>
      </div>
    </Link>
  );
}
