import Link from 'next/link';
import Image from 'next/image';
import { Category } from '@/types';

interface CategoryCardProps {
  category: Category;
  className?: string;
  imageHeightClass?: string;
}

export default function CategoryCard({ category, className, imageHeightClass }: CategoryCardProps) {
  const isLVT = category.slug === 'lvt' || category.id === '6';
  const isLinoleum = category.slug === 'linoleum' || category.id === '7';
  const isCarpet = category.slug === 'tekstilne-ploce' || category.id === '4';
  const isVinil = category.slug === 'vinil' || category.id === '2';
  const isParket = category.slug === 'parket' || category.id === '3';
  const isLaminat = category.slug === 'laminat' || category.id === '1';
  const isDeking = category.slug === 'deking' || category.id === '5';

  const saharaNoirImage = '/images/products/lvt/colors/creation-55/1742-sahara-noir/pod/1742-sahara-noir-pod.jpg';
  const parketImage = '/images/products/galloni-oak.jpg';
  // Attempt to map category to its primary image, fallback to category.image
  const catImage = isLVT ? saharaNoirImage : isParket ? parketImage : category.image;

  // Apple style: we merge default card behaviors with custom passed classes
  const rootClass = className ? `group block overflow-hidden transition-all duration-500 hover:scale-[1.02] hover:shadow-xl bg-white ${className}` : "group card card-hover block rounded-2xl overflow-hidden bg-[#F5F5F7]";
  const imgContainerClass = `relative w-full ${imageHeightClass || 'h-[220px]'} bg-[#F5F5F7] overflow-hidden`;

  return (
    <Link
      href={`/kategorije/${category.slug}`}
      className={rootClass}
    >
      <div className={imgContainerClass}>
        {catImage ? (
          <Image
            src={catImage}
            alt={category.name}
            fill
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.05]"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center p-4">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-200 rounded-3xl mb-3 group-hover:scale-105 transition-all duration-300">
                <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                </svg>
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="p-6 md:p-8 text-left flex flex-col justify-center h-[calc(100%-auto)]">
        <h3 className="font-semibold text-2xl tracking-tight text-[#1D1D1F] mb-2 group-hover:text-[#0071E3] transition-colors">
          {category.name}
        </h3>
        <p className="text-[15px] text-[#86868B] line-clamp-2 leading-relaxed">
          {category.description}
        </p>
      </div>
    </Link>
  );
}
