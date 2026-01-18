import Link from 'next/link';
import Image from 'next/image';
import { Category } from '@/types';

interface CategoryCardProps {
  category: Category;
}

export default function CategoryCard({ category }: CategoryCardProps) {
  const isLVT = category.slug === 'lvt' || category.id === '6';
  const isLinoleum = category.slug === 'linoleum' || category.id === '7';
  const isCarpet = category.slug === 'tekstilne-ploce' || category.id === '4';
  const saharaNoirImage = '/images/products/lvt/colors/creation-55/1742-sahara-noir/pod/1742-sahara-noir-pod.jpg';

  return (
    <Link 
      href={`/kategorije/${category.slug}`}
      className="group card card-hover"
    >
      <div className="relative h-48 bg-gray-100 overflow-hidden">
        {isLVT ? (
          // Show sahara noir pod image for LVT
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="relative w-full h-full rounded-lg overflow-hidden shadow-md transition-transform duration-300 group-hover:scale-[1.02]">
              <Image
                src={saharaNoirImage}
                alt="Sahara Noir LVT"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 20vw, 200px"
              />
            </div>
          </div>
        ) : (isLinoleum || isCarpet) && category.image ? (
          // Show category image for Linoleum and Carpet
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="relative w-full h-full rounded-lg overflow-hidden shadow-md transition-transform duration-300 group-hover:scale-[1.02]">
              <Image
                src={category.image}
                alt={category.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 20vw, 200px"
              />
            </div>
          </div>
        ) : (
          // Show generic icon for other categories
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center p-4">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl mb-3 group-hover:scale-105 transition-all duration-300 shadow-md">
                <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                </svg>
              </div>
            </div>
          </div>
        )}
        {/* Decorative gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-white/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      </div>
      <div className="p-6 text-center">
        <h3 className="font-bold text-xl mb-2 text-gray-900 group-hover:text-gray-950 transition-colors">
          {category.name}
        </h3>
        <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
          {category.description}
        </p>
      </div>
    </Link>
  );
}
