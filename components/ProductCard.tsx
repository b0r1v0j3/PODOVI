import Link from 'next/link';
import { Product } from '@/types';
import { brandRepository } from '@/lib/repositories/brand-repository';
import ProductCardOverlay from './ProductCardOverlay';
import ProductImage from './ProductImage';
import { splitProductTitle } from '@/lib/utils/name-parser';
import { getCanonicalProductHref } from '@/lib/utils/product-routes';
import { getProductImageCandidates } from '@/lib/utils/product-images';

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
  '8': { label: 'Elektroprovodni', className: 'badge-elektroprovodni' },
  '9': { label: 'Industrijske ploče', className: 'badge-industrijske' },
  '10': { label: 'Sport', className: 'badge-sport' },
  '11': { label: 'Lajsne', className: 'badge-lajsne' },
  '12': { label: 'Otirači', className: 'badge-otiraci' },
};

// Keys to extract from specs for chip display
const SPEC_CHIP_KEYS = [
  { key: 'thickness', label: 'Debljina' },
  { key: 'overall_thickness', label: 'Debljina' },
  { key: 'installation', label: 'Ugradnja' },
  { key: 'wear_layer', label: 'Sloj habanja' },
  { key: 'format', label: 'Format' },
  { key: 'dimension', label: 'Dimenzije' },
  { key: 'klasa_upotrebe', label: 'Klasa' },
];

/**
 * Normalize installation system label for LVT products
 */
function normalizeInstallation(name: string, slug: string, existingValue?: string): string {
  if (existingValue) {
    const lower = existingValue.toLowerCase();
    if (lower.includes('clic') || lower.includes('click') || lower.includes('connect') || lower.includes('klik')) return 'Klik';
    if (lower.includes('lepljen') || lower.includes('glue') || lower.includes('looselay') || lower.includes('loose')) return 'Lepljenje';
  }
  const lower = (name + ' ' + slug).toLowerCase();
  if (lower.includes('clic') || lower.includes('click') || lower.includes('megaclic') || lower.includes('connect')) return 'Klik';
  return 'Lepljenje';
}

function getSpecChips(specs: Product['specs'], categoryId?: string, productName?: string, productSlug?: string): { label: string; value: string }[] {
  if (!specs || specs.length === 0) return [];

  // For LVT: normalize the installation spec value
  let augmentedSpecs = [...specs];
  if (categoryId === '6' && productName && productSlug) {
    const installSpec = augmentedSpecs.find(s => s.key === 'installation');
    if (installSpec) {
      installSpec.value = normalizeInstallation(productName, productSlug, installSpec.value);
    } else {
      const installValue = normalizeInstallation(productName, productSlug);
      augmentedSpecs.push({ key: 'installation', label: 'Ugradnja', value: installValue });
    }
  }

  const chips: { label: string; value: string }[] = [];
  const seen = new Set<string>();

  for (const config of SPEC_CHIP_KEYS) {
    if (chips.length >= 2) break; // Max 2 chips
    const spec = augmentedSpecs.find(s => s.key === config.key);
    if (spec && spec.value && spec.value !== 'N/A' && !seen.has(config.label)) {
      seen.add(config.label);
      chips.push({ label: config.label, value: spec.value });
    }
  }
  return chips;
}

export default async function ProductCard({ product }: ProductCardProps) {
  const brand = await brandRepository.findById(product.brandId);
  const imageCandidates = getProductImageCandidates(product, 'card').slice(0, 4);
  const primaryImage = imageCandidates[0];
  // Remove "Gerflor" prefix from product name for LVT collections
  const displayName = product.categoryId === '6' && product.name.startsWith('Gerflor ')
    ? product.name.replace(/^Gerflor\s+/, '')
    : product.name;
  const productHref = getCanonicalProductHref(product as Product & { collectionSlug?: string });
  let rawCollectionName = product.specs?.find(s => s.key === 'collection')?.value;

  // Badge config
  const badge = categoryBadgeConfig[product.categoryId];

  // Spec chips
  const specChips = getSpecChips(product.specs, product.categoryId, product.name, product.slug);

  // Split Name Logic
  const { collection: splitCollection, color: splitColor } = splitProductTitle(displayName, rawCollectionName);


  // Determine if shortDescription is just the product/collection name (not useful)
  const isShortDescUseful = product.shortDescription
    && product.shortDescription !== product.name
    && product.shortDescription !== displayName
    && product.shortDescription !== splitColor
    && product.shortDescription.length > 5;

  // Strip category name and product name from shortDescription to avoid redundancy
  // e.g. "Blues 1033 4V Laminat" on the Laminat page → redundant
  const categoryNames = ['Laminat', 'LVT', 'Parket', 'Linoleum', 'Vinil', 'Tekstilne ploče', 'Deking', 'Elektroprovodni', 'Industrijske ploče', 'Sport', 'Lajsne', 'Otirači', 'Podna obloga'];
  let cleanShortDesc = product.shortDescription || '';
  for (const catName of categoryNames) {
    cleanShortDesc = cleanShortDesc.replace(new RegExp(`\\s*${catName}\\s*$`, 'i'), '').trim();
    cleanShortDesc = cleanShortDesc.replace(new RegExp(`^${catName}\\s*[-–]\\s*`, 'i'), '').trim();
  }
  // If after stripping, it's the same as the name, it's not useful
  const isCleanDescUseful = cleanShortDesc
    && cleanShortDesc !== product.name
    && cleanShortDesc !== displayName
    && cleanShortDesc !== splitColor
    && cleanShortDesc.length > 5
    && isShortDescUseful;

  return (
    <Link
      href={productHref}
      className="group card card-hover block h-full bg-white"
    >
      <div className="relative aspect-[4/3] bg-[#F5F5F7] overflow-hidden">
        {primaryImage ? (
          <ProductImage
            sources={imageCandidates}
            alt={primaryImage.alt}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            quality={90}
            className={`transition-transform duration-500 group-hover:scale-[1.03] ${product.categoryId === '5'
              ? 'object-left'
              : product.slug === 'gerflor-mipolam-technic-el5-eu'
                ? 'object-bottom'
                : ''
              }`}
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
      <div className="p-5 flex flex-col h-[calc(100%-aspect-[4/3])]">
        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
          {brand && (
            <span className="text-[11px] font-bold tracking-wider text-[#86868B] uppercase">
              {brand.name}
            </span>
          )}
        </div>

        {splitCollection && splitCollection.toLowerCase() !== splitColor.toLowerCase() && (
          <p className="text-[13px] font-medium text-gray-500 mb-0.5 leading-tight truncate">
            {splitCollection}
          </p>
        )}
        <h3 className="text-[17px] font-semibold text-[#1D1D1F] mb-2 leading-tight group-hover:text-[#0071E3] transition-colors duration-300">
          {splitColor}
        </h3>

        {/* Spec chips */}
        {specChips.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {specChips.map((chip) => (
              <span key={chip.label} className="spec-chip">
                {chip.value}
              </span>
            ))}
          </div>
        )}

        {/* Short description — only if it adds info beyond the name */}
        {isCleanDescUseful && specChips.length === 0 && (
          <p className="text-[13px] text-[#86868B] mb-4 line-clamp-2 leading-relaxed">
            {cleanShortDesc}
          </p>
        )}

        {/* Price or "Cena na upit" */}
        <div className="mt-auto pt-4 border-t border-[#F5F5F7]">
          {product.price && product.price > 0 ? (
            <div className="flex items-baseline justify-between">
              <span className="text-lg font-semibold text-[#1D1D1F]">
                {product.price.toLocaleString('sr-RS')}
                <span className="text-xs font-normal text-[#86868B] ml-1">RSD/{product.priceUnit}</span>
              </span>
              <span className="text-[#0071E3] text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-x-[-10px] group-hover:translate-x-0">
                Detaljnije &rarr;
              </span>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-[#86868B] italic">
                Cena na upit
              </span>
              <span className="text-[#0071E3] text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-x-[-10px] group-hover:translate-x-0">
                Detaljnije &rarr;
              </span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
