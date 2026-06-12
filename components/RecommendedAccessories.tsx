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
        <div className="border-t border-ink-200 pt-8">
            <h3 className="eyebrow mb-6">Preporučeni pribor</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10">
                {accessories.map((acc) => {
                    const typeSpec = acc.specs?.find(s => s.key === 'type');
                    const primaryImage = acc.images?.[0];

                    return (
                        <Link
                            key={acc.slug}
                            href={`/proizvodi/${acc.slug}`}
                            className="group flex flex-col"
                        >
                            {/* Image */}
                            <div className="relative aspect-[4/3] bg-paper overflow-hidden">
                                {primaryImage ? (
                                    <ProductImage
                                        sources={acc.images}
                                        alt={primaryImage.alt || acc.name}
                                        className="object-cover group-hover:scale-[1.03] transition-transform duration-700"
                                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-ink-500 text-sm">
                                        Bez slike
                                    </div>
                                )}
                            </div>

                            {/* Info */}
                            <div className="pt-3 flex-1 flex flex-col">
                                {typeSpec && (
                                    <span className="eyebrow mb-1">
                                        {typeSpec.value}
                                    </span>
                                )}
                                <h4 className="text-[15px] font-normal text-ink-900 line-clamp-2">
                                    {acc.name}
                                </h4>
                                <p className="text-[13px] text-ink-500 mt-1 line-clamp-2">
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
