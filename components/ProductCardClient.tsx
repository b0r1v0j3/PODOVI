'use client';

import Link from 'next/link';
import { Product, Brand } from '@/types';
import CompareButton from './CompareButton';
import ProductCardOverlay from './ProductCardOverlay';
import ProductImage from './ProductImage';
import { splitProductTitle } from '@/lib/utils/name-parser';
import {
  areProductCardTextsEqual,
  getProductCardDisplayName,
} from '@/lib/utils/product-card-text';
import { getCanonicalProductHref } from '@/lib/utils/product-routes';
import { getProductImageCandidates, getProductSwatchCandidates } from '@/lib/utils/product-images';

interface ProductCardClientProps {
  product: Product;
  brand: Brand | null;
  /** Kompaktna kartica (samo slika + naziv + link) – za tab Boje na parket kategoriji */
  compact?: boolean;
}

export default function ProductCardClient({ product, brand, compact = false }: ProductCardClientProps) {
  const imageCandidates = getProductImageCandidates(product, compact ? 'thumb' : 'card').slice(0, 4);
  const primaryImage = imageCandidates[0];
  const swatchCandidates = getProductSwatchCandidates(product, 'thumb').slice(0, 3);

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
      <Link href={productHref} className="group block overflow-hidden border border-ink-200 bg-white transition duration-200 hover:border-ink-900">
        <div className="relative aspect-[4/5] overflow-hidden bg-paper">
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
          <div className="opacity-100 transition-opacity duration-300">
            <ProductCardOverlay product={product} />
          </div>
          {swatchCandidates.length > 0 && (
            <div className="absolute bottom-3 left-3 z-10 flex gap-1">
              {swatchCandidates.map((candidate) => (
                <span
                  key={candidate.url}
                  className="h-7 w-7 border border-white bg-cover bg-center shadow-[0_0_0_1px_rgba(17,17,17,0.35)]"
                  style={{ backgroundImage: `url("${candidate.url}")` }}
                  aria-hidden="true"
                />
              ))}
            </div>
          )}
        </div>
        <div className="px-3 pb-3 pt-3">
          {brand && (
            <p className="eyebrow mb-1">{brand.name}</p>
          )}
          {splitCollection && !areProductCardTextsEqual(splitCollection, splitColor) && (
            <p className="text-[12px] text-ink-500 mb-0.5 leading-tight truncate">
              {splitCollection}
            </p>
          )}
          <p className="text-sm font-normal text-ink-900 line-clamp-2 underline-offset-4 group-hover:underline group-focus-visible:underline">
            {splitColor}
          </p>
        </div>
      </Link>
    );
  }

  return (
    <Link href={productHref} className="group flex h-full flex-col overflow-hidden border border-ink-200 bg-white transition duration-200 hover:border-ink-900">
      <div className="relative aspect-[7/6] overflow-hidden bg-paper">
        {primaryImage ? (
          <ProductImage
            sources={imageCandidates}
            alt={primaryImage.alt}
            sizes="(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 22vw"
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
        <div className="opacity-100 transition-opacity duration-300">
          <ProductCardOverlay product={product} />
        </div>
        {swatchCandidates.length > 0 && (
          <div className="absolute bottom-3 left-3 z-10 flex gap-1">
            {swatchCandidates.map((candidate) => (
              <span
                key={candidate.url}
                className="h-8 w-8 border border-white bg-cover bg-center shadow-[0_0_0_1px_rgba(17,17,17,0.35)]"
                style={{ backgroundImage: `url("${candidate.url}")` }}
                aria-hidden="true"
              />
            ))}
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col px-3 pb-4 pt-3">
        {brand && (
          <span className="eyebrow mb-1 text-ink-600">
            {brand.name}
          </span>
        )}

        {splitCollection && !areProductCardTextsEqual(splitCollection, splitColor) && (
          <p className="mb-0.5 truncate text-[12px] leading-tight text-ink-500">
            {splitCollection}
          </p>
        )}
        <h3 className="text-[15px] font-semibold leading-snug text-ink-900 underline-offset-4 group-hover:underline group-focus-visible:underline">
          {splitColor}
        </h3>

        <div className="mt-auto flex items-end justify-between gap-3 pt-3">
          <p className="text-[12px] text-ink-700">
            {product.price && product.price > 0
              ? `${product.price.toLocaleString('sr-RS')} RSD/${product.priceUnit}`
              : 'Cena na upit'}
          </p>
          <CompareButton product={product} variant="text" />
        </div>
      </div>
    </Link>
  );
}
