'use client';

import { useCompare } from '@/lib/context/CompareContext';
import Link from 'next/link';
import ProductImage from '@/components/ProductImage';
import { getProductImageCandidates } from '@/lib/utils/product-images';

export default function ComparePageClient() {
    const { compareItems, removeFromCompare, clearAll } = useCompare();

    if (compareItems.length === 0) {
        return (
            <div className="container py-24 text-center">
                <p className="eyebrow mb-4">Poređenje</p>
                <h1 className="text-3xl md:text-4xl font-normal text-ink-900 mb-4">Nema proizvoda za poređenje</h1>
                <p className="text-ink-600 mb-10 max-w-md mx-auto">
                    Izaberite do 3 proizvoda za poređenje klikom na ikonu za poređenje na karticama proizvoda.
                </p>
                <Link href="/" className="btn-primary inline-flex items-center min-h-[44px]">
                    Pogledaj proizvode
                </Link>
            </div>
        );
    }

    // Collect all unique spec keys from all products
    const allSpecKeys = new Map<string, string>();
    compareItems.forEach(product => {
        product.specs?.forEach(spec => {
            if (!allSpecKeys.has(spec.key)) {
                allSpecKeys.set(spec.key, spec.label || spec.key);
            }
        });
    });

    const specRows = Array.from(allSpecKeys.keys());

    // Helper to format spec display name (used as fallback)
    const formatSpecName = (key: string) => {
        const label = allSpecKeys.get(key);
        if (label && label !== key) return label;

        return key
            .replace(/_/g, ' ')
            .replace(/\b\w/g, l => l.toUpperCase());
    };

    return (
        <div className="container py-12 md:py-16">
            {/* Header */}
            <div className="flex items-end justify-between gap-4 mb-10">
                <div>
                    <p className="eyebrow mb-3">Poređenje</p>
                    <h1 className="text-3xl md:text-4xl font-normal text-ink-900">Uporedi proizvode</h1>
                    <p className="text-[13px] text-ink-500 mt-2">{compareItems.length} proizvoda izabrano</p>
                </div>
                <button
                    onClick={clearAll}
                    className="btn-link min-h-[44px]"
                >
                    Obriši sve
                </button>
            </div>

            {/* Comparison table */}
            <div className="overflow-x-auto -mx-6 px-6 md:-mx-10 md:px-10">
                <table className="w-full border-collapse min-w-[600px]">
                    {/* Product header row */}
                    <thead>
                        <tr>
                            <th className="w-40 py-4 pr-4 border-b border-ink-200 bg-white text-left align-bottom sticky left-0 z-10">
                                <span className="eyebrow">Proizvod</span>
                            </th>
                            {compareItems.map(product => {
                                const imageCandidates = getProductImageCandidates(product, 'thumb').slice(0, 4);
                                const img = imageCandidates[0];
                                return (
                                    <th key={product.id} className="p-4 border-b border-ink-200 bg-white text-center align-top min-w-[200px]">
                                        <div className="space-y-3">
                                            <button
                                                onClick={() => removeFromCompare(product.id)}
                                                className="ml-auto flex items-center justify-center w-11 h-11 md:w-9 md:h-9 border border-ink-200 bg-white text-ink-500 hover:border-ink-900 hover:text-ink-900 transition-colors text-xs"
                                                title="Ukloni"
                                            >
                                                ✕
                                            </button>
                                            {img?.url && (
                                                <div className="relative w-32 aspect-[4/5] mx-auto overflow-hidden bg-paper">
                                                    <ProductImage
                                                        sources={imageCandidates}
                                                        alt={product.name}
                                                        className="object-cover"
                                                        sizes="128px"
                                                    />
                                                </div>
                                            )}
                                            <Link href={`/proizvodi/${product.slug}`} className="text-[15px] font-normal text-ink-900 hover:opacity-60 transition-opacity block">
                                                {product.name}
                                            </Link>
                                        </div>
                                    </th>
                                );
                            })}
                        </tr>
                    </thead>

                    <tbody>
                        {/* Price row */}
                        <tr>
                            <td className="py-[9px] pr-4 border-b border-ink-200 bg-white text-[13px] text-ink-500 sticky left-0 z-10">
                                Cena
                            </td>
                            {compareItems.map(product => (
                                <td key={product.id} className="px-4 py-[9px] border-b border-ink-200 text-center text-[13px] text-ink-500">
                                    {product.price && product.price > 0
                                        ? `${product.price.toLocaleString('sr-RS')} RSD/${product.priceUnit}`
                                        : 'Cena na upit'}
                                </td>
                            ))}
                        </tr>

                        {/* Stock row */}
                        <tr>
                            <td className="py-[9px] pr-4 border-b border-ink-200 bg-white text-[13px] text-ink-500 sticky left-0 z-10">
                                Dostupnost
                            </td>
                            {compareItems.map(product => (
                                <td key={product.id} className="px-4 py-[9px] border-b border-ink-200 text-center text-[13px]">
                                    <span className={product.inStock ? 'text-ink-900' : 'text-ink-500'}>
                                        {product.inStock ? 'Na stanju' : 'Nije na stanju'}
                                    </span>
                                </td>
                            ))}
                        </tr>

                        {/* Description row */}
                        <tr>
                            <td className="py-[9px] pr-4 border-b border-ink-200 bg-white text-[13px] text-ink-500 align-top sticky left-0 z-10">
                                Opis
                            </td>
                            {compareItems.map(product => (
                                <td key={product.id} className="px-4 py-[9px] border-b border-ink-200 text-[13px] text-ink-900">
                                    {product.shortDescription || '—'}
                                </td>
                            ))}
                        </tr>

                        {/* Spec rows */}
                        {specRows.map(specKey => (
                            <tr key={specKey}>
                                <td className="py-[9px] pr-4 border-b border-ink-200 bg-white text-[13px] text-ink-500 sticky left-0 z-10">
                                    {formatSpecName(specKey)}
                                </td>
                                {compareItems.map(product => {
                                    const spec = product.specs?.find(s => s.key === specKey);
                                    return (
                                        <td key={product.id} className="px-4 py-[9px] border-b border-ink-200 text-[13px] text-ink-900 text-center">
                                            {spec?.value || '—'}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}

                        {/* CTA row */}
                        <tr>
                            <td className="py-4 pr-4 bg-white sticky left-0 z-10"></td>
                            {compareItems.map(product => (
                                <td key={product.id} className="px-4 py-6 text-center">
                                    <Link
                                        href={`/proizvodi/${product.slug}`}
                                        className="btn-secondary inline-flex items-center justify-center min-h-[44px]"
                                    >
                                        Pogledaj detalje
                                    </Link>
                                </td>
                            ))}
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
}
