import Link from 'next/link';
import { Product } from '@/types';
import { brandRepository } from '@/lib/repositories/brand-repository';
import ProductCardOverlay from './ProductCardOverlay';
import ProductImage from './ProductImage';
import { splitProductTitle } from '@/lib/utils/name-parser';
import {
  areProductCardTextsEqual,
  getProductCardDisplayName,
} from '@/lib/utils/product-card-text';
import { getCanonicalProductHref } from '@/lib/utils/product-routes';
import { getProductImageCandidates } from '@/lib/utils/product-images';

interface ProductCardProps {
  product: Product;
  sizes?: string;
}

export default async function ProductCard({ product, sizes = "(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 25vw" }: ProductCardProps) {
  const brand = await brandRepository.findById(product.brandId);
  const imageCandidates = getProductImageCandidates(product, 'card').slice(0, 4);
  const primaryImage = imageCandidates[0];
  const swatchCandidates = imageCandidates.slice(0, 3);
  const displayName = getProductCardDisplayName(product.name, brand?.name);
  const productHref = getCanonicalProductHref(product as Product & { collectionSlug?: string });
  const rawCollectionName = product.specs?.find(s => s.key === 'collection')?.value;
  const displayCollectionName = rawCollectionName
    ? getProductCardDisplayName(rawCollectionName, brand?.name)
    : rawCollectionName;

  // Split Name Logic
  const { collection: splitCollection, color: splitColor } = splitProductTitle(displayName, displayCollectionName);

  return (
    <Link href={productHref} className="group flex h-full flex-col rounded-lg border border-ink-200 bg-white p-2 shadow-[0_1px_0_rgba(17,17,17,0.03)] transition duration-300 hover:-translate-y-0.5 hover:border-ink-400 hover:shadow-[0_20px_50px_rgba(17,17,17,0.08)]">
      <div className="relative aspect-[4/3] overflow-hidden rounded-md bg-paper">
        {primaryImage ? (
          <ProductImage
            sources={imageCandidates}
            alt={primaryImage.alt}
            sizes={sizes}
            quality={90}
            className={`transition-transform duration-700 group-hover:scale-[1.03] ${product.categoryId === '5'
              ? 'object-left'
              : product.slug === 'gerflor-mipolam-technic-el5-eu'
                ? 'object-bottom'
                : ''
              }`}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-paper">
            <svg className="w-12 h-12 text-ink-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        {/* Favorite & Compare buttons */}
        <div className="opacity-100 md:opacity-0 md:group-hover:opacity-100 md:focus-within:opacity-100 transition-opacity duration-300">
          <ProductCardOverlay product={product} />
        </div>
        {swatchCandidates.length > 1 && (
          <div className="absolute bottom-3 left-3 z-10 flex gap-1.5">
            {swatchCandidates.map((candidate) => (
              <span
                key={candidate.url}
                className="h-8 w-8 rounded-[4px] border border-white/90 bg-cover bg-center shadow-[0_0_0_1px_rgba(17,17,17,0.18)]"
                style={{ backgroundImage: `url("${candidate.url}")` }}
                aria-hidden="true"
              />
            ))}
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col px-1 pb-1 pt-3 md:pt-4">
        {brand && (
          <span className="eyebrow mb-1 text-ink-600">
            {brand.name}
          </span>
        )}

        {splitCollection && !areProductCardTextsEqual(splitCollection, splitColor) && (
          <p className="text-[13px] text-ink-500 mb-0.5 leading-tight truncate">
            {splitCollection}
          </p>
        )}
        <h3 className="text-[15px] md:text-base font-medium text-ink-900 leading-snug underline-offset-4 group-hover:underline group-focus-visible:underline">
          {splitColor}
        </h3>

        <div className="mt-auto flex items-end justify-between gap-3 pt-4">
          <p className="text-[13px] text-ink-700">
            {product.price && product.price > 0
              ? `${product.price.toLocaleString('sr-RS')} RSD/${product.priceUnit}`
              : 'Cena na upit'}
          </p>
          <span className="inline-flex items-center gap-1.5 text-[12px] text-ink-600">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 20V10M12 20V4M17 20v-7" />
            </svg>
            Uporedi
          </span>
        </div>
      </div>
    </Link>
  );
}
