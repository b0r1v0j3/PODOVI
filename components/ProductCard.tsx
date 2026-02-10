import Link from 'next/link';
import Image from 'next/image';
import { Product } from '@/types';
import { brandRepository } from '@/lib/repositories/brand-repository';
import { categoryRepository } from '@/lib/repositories/category-repository';
import ProductCardOverlay from './ProductCardOverlay';

interface ProductCardProps {
  product: Product;
}

// Category badge configuration
const categoryBadgeConfig: Record<string, { label: string; className: string }> = {
  '1': { label: 'Laminat', className: 'badge-laminat' },
  '2': { label: 'Vinil', className: 'badge-vinil' },
  '3': { label: 'Parket', className: 'badge-parket' },
  '4': { label: 'Tekstilne ploče', className: 'badge-tekstilne' },
  '5': { label: 'Deking', className: 'badge-deking' },
  '6': { label: 'LVT', className: 'badge-lvt' },
  '7': { label: 'Linoleum', className: 'badge-linoleum' },
};

// Keys to extract from specs for chip display
const SPEC_CHIP_KEYS = [
  { key: 'thickness', label: 'Debljina' },
  { key: 'overall_thickness', label: 'Debljina' },
  { key: 'wear_layer', label: 'Sloj habanja' },
  { key: 'format', label: 'Format' },
  { key: 'dimension', label: 'Dimenzije' },
  { key: 'klasa_upotrebe', label: 'Klasa' },
];

function getSpecChips(specs: Product['specs']): { label: string; value: string }[] {
  if (!specs || specs.length === 0) return [];
  const chips: { label: string; value: string }[] = [];
  const seen = new Set<string>();

  for (const config of SPEC_CHIP_KEYS) {
    if (chips.length >= 2) break; // Max 2 chips
    const spec = specs.find(s => s.key === config.key);
    if (spec && spec.value && spec.value !== 'N/A' && !seen.has(config.label)) {
      seen.add(config.label);
      chips.push({ label: config.label, value: spec.value });
    }
  }
  return chips;
}

export default async function ProductCard({ product }: ProductCardProps) {
  const brand = await brandRepository.findById(product.brandId);
  const primaryImage = product.images && product.images.length > 0
    ? (product.images.find(img => img.isPrimary) || product.images[0])
    : null;

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
  };

  // For LVT, Linoleum, Carpet, and Vinil categories, link to category page with color parameter
  const colorCollectionSlug = (product as { collectionSlug?: string }).collectionSlug;
  const isColorTile = product.categoryId === '6' || product.categoryId === '7' || product.categoryId === '4' || product.categoryId === '2';

  let productHref = `/proizvodi/${product.slug}`;

  if (isColorTile && colorCollectionSlug) {
    const categorySlug = categorySlugMap[product.categoryId] || 'lvt';
    productHref = `/kategorije/${categorySlug}?color=${product.slug}`;
  }

  // Badge config
  const badge = categoryBadgeConfig[product.categoryId];

  // Spec chips
  const specChips = getSpecChips(product.specs);

  // Determine if shortDescription is just the product/collection name (not useful)
  const isShortDescUseful = product.shortDescription
    && product.shortDescription !== product.name
    && product.shortDescription !== displayName
    && product.shortDescription.length > 5;

  // Strip category name and product name from shortDescription to avoid redundancy
  // e.g. "Blues 1033 4V Laminat" on the Laminat page → redundant
  const categoryNames = ['Laminat', 'LVT', 'Parket', 'Linoleum', 'Vinil', 'Tekstilne ploče', 'Deking', 'Podna obloga'];
  let cleanShortDesc = product.shortDescription || '';
  for (const catName of categoryNames) {
    cleanShortDesc = cleanShortDesc.replace(new RegExp(`\\s*${catName}\\s*$`, 'i'), '').trim();
    cleanShortDesc = cleanShortDesc.replace(new RegExp(`^${catName}\\s*[-–]\\s*`, 'i'), '').trim();
  }
  // If after stripping, it's the same as the name, it's not useful
  const isCleanDescUseful = cleanShortDesc
    && cleanShortDesc !== product.name
    && cleanShortDesc !== displayName
    && cleanShortDesc.length > 5
    && isShortDescUseful;

  return (
    <Link
      href={productHref}
      className="group card card-hover"
    >
      <div className="relative h-64 bg-gray-100 overflow-hidden">
        {primaryImage ? (
          <Image
            src={primaryImage.url.startsWith('/') ? primaryImage.url : '/images/placeholder.svg'}
            alt={primaryImage.alt}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            quality={90}
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            unoptimized={!primaryImage.url.startsWith('/')}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-50 group-hover:bg-gray-100 transition-colors duration-300">
            <svg className="w-12 h-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        {/* Category badge */}
        {badge && (
          <span className={`absolute top-3 left-3 z-10 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider shadow-sm ${badge.className}`}>
            {badge.label}
          </span>
        )}
        {/* Favorite & Compare buttons */}
        <div className="opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300">
          <ProductCardOverlay product={product} />
        </div>
        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
      </div>
      <div className="p-5">
        {brand && (
          <p className="text-[11px] text-primary-600 mb-1.5 uppercase tracking-wider font-semibold">
            {brand.name}
          </p>
        )}
        <h3 className="font-bold text-lg mb-1.5 line-clamp-2 text-gray-900 group-hover:text-primary-600 transition-colors duration-300">
          {displayName}
        </h3>

        {/* Spec chips */}
        {specChips.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2.5">
            {specChips.map((chip) => (
              <span key={chip.label} className="spec-chip">
                {chip.value}
              </span>
            ))}
          </div>
        )}

        {/* Short description — only if it adds info beyond the name */}
        {isCleanDescUseful && specChips.length === 0 && (
          <p className="text-sm text-gray-500 mb-3 line-clamp-2 leading-relaxed">
            {cleanShortDesc}
          </p>
        )}

        {/* Price or "Cena na upit" */}
        {product.price && product.price > 0 ? (
          <div className="flex items-baseline mb-3">
            <span className="text-2xl font-bold text-gray-900">
              {product.price.toLocaleString('sr-RS')}
            </span>
            <span className="text-sm text-gray-500 ml-1">
              RSD/{product.priceUnit}
            </span>
          </div>
        ) : (
          <div className="mb-3">
            <span className="text-sm font-medium text-gray-400 italic">
              Cena na upit
            </span>
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
