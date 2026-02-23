'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Product, Brand } from '@/types';
import { getEffectiveParketCollection, getParketCollectionSlug, PARKET_HEADER_COLLECTIONS } from '@/lib/data/parket-collection-mapping';
import ProductCardOverlay from './ProductCardOverlay';
import { splitProductTitle } from '@/lib/utils/name-parser';

interface ProductCardClientProps {
  product: Product;
  brand: Brand | null;
  /** Kompaktna kartica (samo slika + naziv + link) – za tab Boje na parket kategoriji */
  compact?: boolean;
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
  // If there's an existing spec value, map it
  if (existingValue) {
    const lower = existingValue.toLowerCase();
    if (lower.includes('clic') || lower.includes('click') || lower.includes('connect') || lower.includes('klik')) return 'Klik';
    if (lower.includes('lepljen') || lower.includes('glue') || lower.includes('looselay') || lower.includes('loose')) return 'Lepljenje';
  }
  // Derive from product name/slug
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
      // Normalize existing installation value
      installSpec.value = normalizeInstallation(productName, productSlug, installSpec.value);
    } else {
      // Add derived installation spec
      const installValue = normalizeInstallation(productName, productSlug);
      augmentedSpecs.push({ key: 'installation', label: 'Ugradnja', value: installValue });
    }
  }

  const chips: { label: string; value: string }[] = [];
  const seen = new Set<string>();

  for (const config of SPEC_CHIP_KEYS) {
    if (chips.length >= 2) break;
    const spec = augmentedSpecs.find(s => s.key === config.key);
    if (spec && spec.value && spec.value !== 'N/A' && !seen.has(config.label)) {
      seen.add(config.label);
      chips.push({ label: config.label, value: spec.value });
    }
  }
  return chips;
}

// Strip redundant category-name suffix / product-name repetition from shortDescription
function cleanShortDescription(shortDesc: string | undefined, productName: string, displayName: string): string | null {
  if (!shortDesc || shortDesc.length <= 5) return null;

  const categoryNames = ['Laminat', 'LVT', 'Parket', 'Linoleum', 'Vinil', 'Tekstilne ploče', 'Deking', 'Podna obloga'];
  let cleaned = shortDesc;
  for (const catName of categoryNames) {
    cleaned = cleaned.replace(new RegExp(`\\s*${catName}\\s*$`, 'i'), '').trim();
    cleaned = cleaned.replace(new RegExp(`^${catName}\\s*[-–]\\s*`, 'i'), '').trim();
  }

  if (!cleaned || cleaned === productName || cleaned === displayName || cleaned.length <= 5) {
    return null;
  }
  return cleaned;
}

export default function ProductCardClient({ product, brand, compact = false }: ProductCardClientProps) {
  const primaryImage = product.images && product.images.length > 0
    ? (product.images.find(img => img.isPrimary) || product.images[0])
    : null;

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

  const isColorTileCategory = ['6', '7', '4', '2'].includes(product.categoryId);
  const colorCollectionSlug = (product as { collectionSlug?: string }).collectionSlug;
  const isParket = product.categoryId === '3';
  const isLaminat = product.categoryId === '1';

  let productHref = `/proizvodi/${product.slug}`;

  if (isColorTileCategory && colorCollectionSlug) {
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
    const isParketCollectionHeader =
      (product.sku && product.sku.startsWith('PARKET-') && !product.sku.includes('OAK') && !product.sku.includes('ASH')) ||
      (PARKET_HEADER_COLLECTIONS as readonly string[]).includes(product.name);
    if (isParketCollectionHeader) {
      productHref = `/proizvodi/${product.slug}`;
    } else {
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

  // Badge, chips, cleaned description
  const badge = categoryBadgeConfig[product.categoryId];
  const specChips = getSpecChips(product.specs, product.categoryId, product.name, product.slug);

  // Split the Product Title
  const rawCollectionName = product.specs?.find(s => s.key === 'collection')?.value;
  const { collection: splitCollection, color: splitColor } = splitProductTitle(displayName, rawCollectionName);

  const cleanedDesc = cleanShortDescription(product.shortDescription, splitColor, displayName);

  if (compact) {
    return (
      <Link href={productHref} className="group block rounded-lg border border-gray-200 bg-white overflow-hidden card-hover transition-all duration-300">
        <div className="relative aspect-square bg-gray-100 overflow-hidden">
          {primaryImage ? (
            <Image
              key={imageSrc}
              src={imageSrc || '/images/placeholder.svg'}
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
          {/* Favorite & Compare buttons */}
          <div className="opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300">
            <ProductCardOverlay product={product} />
          </div>
        </div>
        <div className="p-3">
          {brand && (
            <p className="text-[10px] text-primary-600 uppercase tracking-wider font-semibold mb-0.5">{brand.name}</p>
          )}
          {splitCollection && splitCollection.toLowerCase() !== splitColor.toLowerCase() && (
            <p className="text-[11px] font-medium text-gray-500 mb-0.5 leading-tight truncate">
              {splitCollection}
            </p>
          )}
          <p className="font-semibold text-sm text-gray-900 line-clamp-2 group-hover:text-primary-600 transition-colors">
            {splitColor}
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
      className="group card card-hover block h-full bg-white"
    >
      <div className="relative aspect-[4/3] bg-[#F5F5F7] overflow-hidden">
        {primaryImage ? (
          <Image
            key={imageSrc}
            src={imageSrc || '/images/placeholder.svg'}
            alt={primaryImage.alt}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            quality={90}
            className={`transition-transform duration-500 group-hover:scale-[1.03] ${product.categoryId === '5' ? 'object-cover object-left' :
                product.slug === 'gerflor-mipolam-technic-el5-eu' ? 'object-cover object-bottom' : 'object-cover'
              }`}
            unoptimized={!imageSrc.startsWith('/')}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <span>Bez slike</span>
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
        {cleanedDesc && specChips.length === 0 && (
          <p className="text-[13px] text-[#86868B] mb-4 line-clamp-2 leading-relaxed">
            {cleanedDesc}
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