'use client';

import { useCompare } from '@/lib/context/CompareContext';
import Link from 'next/link';
import ProductImage from '@/components/ProductImage';
import { getProductImageCandidates } from '@/lib/utils/product-images';

export default function ComparePageClient() {
    const { compareItems, removeFromCompare, clearAll } = useCompare();

    if (compareItems.length === 0) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-16 text-center">
                <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                    <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-3">Nema proizvoda za poređenje</h1>
                <p className="text-gray-600 mb-6">
                    Izaberite do 3 proizvoda za poređenje klikom na ikonu za poređenje na karticama proizvoda.
                </p>
                <Link href="/" className="btn-primary inline-flex items-center gap-2">
                    <span>Pogledaj proizvode</span>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
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
        <div className="max-w-7xl mx-auto px-4 py-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Uporedi proizvode</h1>
                    <p className="text-gray-600 mt-1">{compareItems.length} proizvoda izabrano</p>
                </div>
                <button
                    onClick={clearAll}
                    className="text-sm text-gray-500 hover:text-red-600 transition-colors border border-gray-300 hover:border-red-300 px-3 py-1.5 rounded-lg"
                >
                    Obriši sve
                </button>
            </div>

            {/* Comparison table */}
            <div className="overflow-x-auto -mx-4 px-4">
                <table className="w-full border-collapse min-w-[600px]">
                    {/* Product header row */}
                    <thead>
                        <tr>
                            <th className="w-40 p-3 bg-gray-50 border border-gray-200 text-left text-sm font-semibold text-gray-700 sticky left-0 z-10">
                                Proizvod
                            </th>
                            {compareItems.map(product => {
                                const imageCandidates = getProductImageCandidates(product, 'thumb').slice(0, 4);
                                const img = imageCandidates[0];
                                return (
                                    <th key={product.id} className="p-4 border border-gray-200 bg-white text-center align-top min-w-[200px]">
                                        <div className="space-y-3">
                                            <button
                                                onClick={() => removeFromCompare(product.id)}
                                                className="ml-auto block w-6 h-6 rounded-full bg-gray-100 hover:bg-red-100 text-gray-400 hover:text-red-600 transition-colors text-xs"
                                                title="Ukloni"
                                            >
                                                ✕
                                            </button>
                                            {img?.url && (
                                                <div className="relative w-32 h-32 mx-auto rounded-lg overflow-hidden bg-gray-50">
                                                    <ProductImage
                                                        sources={imageCandidates}
                                                        alt={product.name}
                                                        className="object-cover"
                                                        sizes="128px"
                                                    />
                                                </div>
                                            )}
                                            <Link href={`/proizvodi/${product.slug}`} className="text-sm font-bold text-gray-900 hover:text-primary-600 transition-colors block">
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
                            <td className="p-3 bg-gray-50 border border-gray-200 text-sm font-semibold text-gray-700 sticky left-0 z-10">
                                Cena
                            </td>
                            {compareItems.map(product => (
                                <td key={product.id} className="p-3 border border-gray-200 text-center">
                                    {product.price && product.price > 0 ? (
                                        <span className="text-lg font-bold text-primary-600">
                                            {product.price.toLocaleString('sr-RS')} <span className="text-sm text-gray-500 font-normal">RSD/{product.priceUnit}</span>
                                        </span>
                                    ) : (
                                        <span className="text-sm text-gray-400">Na upit</span>
                                    )}
                                </td>
                            ))}
                        </tr>

                        {/* Stock row */}
                        <tr className="bg-gray-50/50">
                            <td className="p-3 bg-gray-50 border border-gray-200 text-sm font-semibold text-gray-700 sticky left-0 z-10">
                                Dostupnost
                            </td>
                            {compareItems.map(product => (
                                <td key={product.id} className="p-3 border border-gray-200 text-center">
                                    <span className={`inline-flex items-center gap-1 text-sm font-medium ${product.inStock ? 'text-green-600' : 'text-red-500'}`}>
                                        <span className={`w-2 h-2 rounded-full ${product.inStock ? 'bg-green-500' : 'bg-red-400'}`}></span>
                                        {product.inStock ? 'Na stanju' : 'Nije na stanju'}
                                    </span>
                                </td>
                            ))}
                        </tr>

                        {/* Description row */}
                        <tr>
                            <td className="p-3 bg-gray-50 border border-gray-200 text-sm font-semibold text-gray-700 sticky left-0 z-10">
                                Opis
                            </td>
                            {compareItems.map(product => (
                                <td key={product.id} className="p-3 border border-gray-200 text-sm text-gray-600">
                                    {product.shortDescription || '—'}
                                </td>
                            ))}
                        </tr>

                        {/* Spec rows */}
                        {specRows.map((specKey, idx) => (
                            <tr key={specKey} className={idx % 2 === 0 ? 'bg-gray-50/50' : ''}>
                                <td className="p-3 bg-gray-50 border border-gray-200 text-sm font-semibold text-gray-700 sticky left-0 z-10">
                                    {formatSpecName(specKey)}
                                </td>
                                {compareItems.map(product => {
                                    const spec = product.specs?.find(s => s.key === specKey);
                                    return (
                                        <td key={product.id} className="p-3 border border-gray-200 text-sm text-gray-700 text-center">
                                            {spec?.value || '—'}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}

                        {/* CTA row */}
                        <tr>
                            <td className="p-3 bg-gray-50 border border-gray-200 sticky left-0 z-10"></td>
                            {compareItems.map(product => (
                                <td key={product.id} className="p-4 border border-gray-200 text-center">
                                    <Link
                                        href={`/proizvodi/${product.slug}`}
                                        className="btn-primary inline-block text-sm px-4 py-2"
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
