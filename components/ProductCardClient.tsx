'use client';

import Link from 'next/link';
import Image from 'next/image';
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
import { shouldBypassNextImageOptimization } from '@/lib/utils/image-runtime';
import { formatProductPrice } from '@/lib/utils/product-price';

interface ProductCardClientProps {
  product: Product;
  brand: Brand | null;
  /** Kompaktna kartica (samo slika + naziv + link) – za tab Boje na parket kategoriji */
  compact?: boolean;
  /** Prvi red kartica (LCP): slika se traži odmah, bez lazy učitavanja. */
  priority?: boolean;
}

// Swatch sličica (28–32 px) ide kroz optimizator slika umesto originala kao CSS pozadina —
// originali su i po 1500 px, pa je red kartica na telefonu vukao više MB.
function CardSwatch({ url, sizeClass }: { url: string; sizeClass: string }) {
  return (
    <span className={`relative ${sizeClass} overflow-hidden border border-white bg-paper shadow-[0_0_0_1px_rgba(17,17,17,0.35)]`} aria-hidden="true">
      <Image
        src={url}
        alt=""
        fill
        sizes="32px"
        quality={60}
        className="object-cover"
        unoptimized={shouldBypassNextImageOptimization(url)}
      />
    </span>
  );
}

export default function ProductCardClient({ product, brand, compact = false, priority = false }: ProductCardClientProps) {
  const imageCandidates = getProductImageCandidates(product, compact ? 'thumb' : 'card').slice(0, 4);
  const primaryImage = imageCandidates[0];
  const swatchCandidates = getProductSwatchCandidates(product, 'thumb')
    .filter((candidate) => candidate.url !== primaryImage?.url)
    .slice(0, 3);

  const displayName = getProductCardDisplayName(product.name, brand?.name);

  // Sažete stavke početne nose href izračunat na serveru (puni proizvod im ne stiže).
  const productHref = (product as Product & { href?: string }).href
    || getCanonicalProductHref(product as Product & { collectionSlug?: string });

  // Split the Product Title
  const rawCollectionName = product.specs?.find(s => s.key === 'collection')?.value;
  const displayCollectionName = rawCollectionName
    ? getProductCardDisplayName(rawCollectionName, brand?.name)
    : rawCollectionName;
  const { collection: splitCollection, color: splitColor } = splitProductTitle(displayName, displayCollectionName);

  if (compact) {
    return (
      <Link href={productHref} prefetch={false} className="group block overflow-hidden border border-ink-200 bg-white transition duration-200 hover:border-ink-900">
        <div className="relative aspect-[4/5] overflow-hidden bg-paper">
          {primaryImage ? (
            <ProductImage
              sources={imageCandidates}
              alt={primaryImage.alt}
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 20vw"
              quality={90}
              priority={priority}
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
                <CardSwatch key={candidate.url} url={candidate.url} sizeClass="h-7 w-7" />
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
    // prefetch={false}: PDP je dinamička ruta (sveže cene), pa prefetch ne donosi gotovu stranu,
    // a svaka promena filtera na početnoj je pokretala prefetch za sve nove kartice.
    <Link href={productHref} prefetch={false} className="group flex h-full flex-col overflow-hidden border border-ink-200 bg-white transition duration-200 hover:border-ink-900">
      <div className="relative aspect-[7/6] overflow-hidden bg-paper">
        {primaryImage ? (
          <ProductImage
            sources={imageCandidates}
            alt={primaryImage.alt}
            sizes="(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 22vw"
            quality={90}
            priority={priority}
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
              <CardSwatch key={candidate.url} url={candidate.url} sizeClass="h-8 w-8" />
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
            {formatProductPrice(product)}
          </p>
          <CompareButton product={product} variant="text" />
        </div>
      </div>
    </Link>
  );
}
