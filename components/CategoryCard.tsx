import Link from 'next/link';
import Image from 'next/image';
import { Category } from '@/types';
import { shouldBypassNextImageOptimization } from '@/lib/utils/image-runtime';

interface CategoryCardProps {
  category: Category;
  productCount?: number;
}

export default function CategoryCard({ category, productCount }: CategoryCardProps) {
  const isLVT = category.slug === 'lvt' || category.id === '6';
  const isLinoleum = category.slug === 'linoleum' || category.id === '7';
  const isCarpet = category.slug === 'tekstilne-ploce' || category.id === '4';
  const isVinil = category.slug === 'vinil' || category.id === '2';
  const isParket = category.slug === 'parket' || category.id === '3';
  const isLaminat = category.slug === 'laminat' || category.id === '1';
  const isDeking = category.slug === 'deking' || category.id === '5';
  const isESD = category.slug === 'elektroprovodni' || category.id === '8';
  const isIndustrial = category.slug === 'industrijske-ploce' || category.id === '9';
  const isSport = category.slug === 'sport' || category.id === '10';
  const isLajsne = category.slug === 'lajsne' || category.id === '11';
  const isOtiraci = category.slug === 'otiraci' || category.id === '12';
  const saharaNoirImage = '/images/products/lvt/colors/creation-55/1742-sahara-noir/pod/1742-sahara-noir-pod.jpg';
  const parketImage = '/images/products/galloni-oak.jpg';
  const dekingImage = '/EDGE-DarkTeak-Swatch.jpg';
  const carpetImage = '/images/products/carpet/bloq/assembly/bloq_trinity_assembly_501_a.jpg';

  return (
    <Link
      href={`/kategorije/${category.slug}`}
      className="group card card-hover block rounded-[1.25rem] overflow-hidden border border-gray-100 shadow-sm hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all duration-300 bg-white"
    >
      <div className="relative h-48 bg-gray-50 overflow-hidden">
        {isLVT ? (
          // Show sahara noir pod image for LVT
          <Image
            src={saharaNoirImage}
            alt="Sahara Noir LVT"
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 20vw, 200px"
          />
        ) : isParket ? (
          // Parket: use local image so it always loads on homepage and categories page
          <Image
            src={parketImage}
            alt={category.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 20vw, 200px"
          />
        ) : isDeking ? (
          <Image
            src={dekingImage}
            alt={category.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 20vw, 200px"
          />
        ) : isCarpet ? (
          <Image
            src={carpetImage}
            alt={category.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 20vw, 200px"
          />
        ) : (isLinoleum || isVinil || isLaminat || isESD || isIndustrial || isSport || isLajsne || isOtiraci) && category.image ? (
          // Show category image for categories that already have representative visuals
          <Image
            src={category.image}
            alt={category.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 20vw, 200px"
            unoptimized={shouldBypassNextImageOptimization(category.image)}
          />
        ) : (
          // Show generic icon for other categories
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center p-4">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl mb-3 group-hover:scale-105 transition-all duration-300 shadow-md">
                <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                </svg>
              </div>
            </div>
          </div>
        )}
        {/* Decorative gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      </div>
      <div className="p-6 text-center">
        <h3 className="font-semibold text-xl mb-2 text-gray-900 group-hover:text-primary-600 transition-colors tracking-tight">
          {category.name}
        </h3>
        <p className="text-[15px] text-gray-500 line-clamp-2 leading-relaxed font-light">
          {category.description}
        </p>
        {productCount !== undefined ? (
          <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
            {productCount} proizvoda
          </p>
        ) : null}
      </div>
    </Link>
  );
}
