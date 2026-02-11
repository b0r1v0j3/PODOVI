import Link from 'next/link';
import ProductImage from '@/components/ProductImage';

interface AccessoryProduct {
    slug: string;
    name: string;
    shortDescription: string;
    images: { url: string; alt: string }[];
    specs: { key: string; value: string }[];
}

interface RecommendedAccessoriesProps {
    accessories: AccessoryProduct[];
}

export default function RecommendedAccessories({ accessories }: RecommendedAccessoriesProps) {
    if (!accessories || accessories.length === 0) return null;

    return (
        <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <svg className="w-6 h-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                Preporučeni pribor
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {accessories.map((acc) => {
                    const typeSpec = acc.specs?.find(s => s.key === 'type');
                    const primaryImage = acc.images?.[0];

                    return (
                        <Link
                            key={acc.slug}
                            href={`/proizvodi/${acc.slug}`}
                            className="group flex flex-col border border-gray-200 rounded-xl overflow-hidden hover:border-primary-400 hover:shadow-md transition-all duration-200"
                        >
                            {/* Image */}
                            <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
                                {primaryImage ? (
                                    <ProductImage
                                        src={primaryImage.url}
                                        alt={primaryImage.alt || acc.name}
                                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                                        Bez slike
                                    </div>
                                )}
                            </div>

                            {/* Info */}
                            <div className="p-3 flex-1 flex flex-col">
                                {typeSpec && (
                                    <span className="text-xs font-medium text-primary-600 uppercase tracking-wider mb-1">
                                        {typeSpec.value}
                                    </span>
                                )}
                                <h4 className="text-sm font-semibold text-gray-900 group-hover:text-primary-600 transition-colors line-clamp-2">
                                    {acc.name}
                                </h4>
                                <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                    {acc.shortDescription}
                                </p>
                            </div>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
