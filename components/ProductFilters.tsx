"use client";

import { useState } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Brand, ProductFilters as IProductFilters } from '@/types';

interface ProductFiltersProps {
  availableBrands: Brand[];
  currentFilters: IProductFilters;
}

export default function ProductFilters({ availableBrands, currentFilters }: ProductFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const [search, setSearch] = useState(currentFilters.search || '');
  const [selectedBrands, setSelectedBrands] = useState<string[]>(currentFilters.brandIds || []);
  const [priceMin, setPriceMin] = useState(currentFilters.priceMin?.toString() || '');
  const [priceMax, setPriceMax] = useState(currentFilters.priceMax?.toString() || '');
  const [inStock, setInStock] = useState(currentFilters.inStock || false);

  const applyFilters = () => {
    const params = new URLSearchParams(searchParams);
    
    // Clear all filter params first
    params.delete('search');
    params.delete('brands');
    params.delete('priceMin');
    params.delete('priceMax');
    params.delete('inStock');

    // Add new filter params
    if (search) params.set('search', search);
    if (selectedBrands.length > 0) params.set('brands', selectedBrands.join(','));
    if (priceMin) params.set('priceMin', priceMin);
    if (priceMax) params.set('priceMax', priceMax);
    if (inStock) params.set('inStock', 'true');

    router.push(`${pathname}?${params.toString()}`);
  };

  const clearFilters = () => {
    setSearch('');
    setSelectedBrands([]);
    setPriceMin('');
    setPriceMax('');
    setInStock(false);
    router.push(pathname);
  };

  const toggleBrand = (brandId: string) => {
    setSelectedBrands(prev => 
      prev.includes(brandId) 
        ? prev.filter(id => id !== brandId)
        : [...prev, brandId]
    );
  };

  const hasActiveFilters = search || selectedBrands.length > 0 || priceMin || priceMax || inStock;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200/70 p-5 sticky top-24">
      <h2 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wide">Filteri</h2>

      {/* Search */}
      <div className="mb-6">
        <label className="label text-xs uppercase tracking-wide text-gray-500">Pretraga</label>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Pretraži proizvode..."
          className="input text-sm"
          onKeyPress={(e) => e.key === 'Enter' && applyFilters()}
        />
      </div>

      {/* Brands */}
      {availableBrands.length > 0 && (
        <div className="mb-6">
          <label className="label text-xs uppercase tracking-wide text-gray-500">Brendovi</label>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {availableBrands.map((brand) => (
              <label key={brand.id} className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedBrands.includes(brand.id)}
                  onChange={() => toggleBrand(brand.id)}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="ml-2 text-sm text-gray-700">{brand.name}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Price Range */}
      <div className="mb-6">
        <label className="label text-xs uppercase tracking-wide text-gray-500">Cena (RSD/m²)</label>
        <div className="flex gap-2">
          <input
            type="number"
            value={priceMin}
            onChange={(e) => setPriceMin(e.target.value)}
            placeholder="Od"
            className="input text-sm"
          />
          <input
            type="number"
            value={priceMax}
            onChange={(e) => setPriceMax(e.target.value)}
            placeholder="Do"
            className="input text-sm"
          />
        </div>
      </div>

      {/* In Stock */}
      <div className="mb-6">
        <label className="flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={inStock}
            onChange={(e) => setInStock(e.target.checked)}
            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
          <span className="ml-2 text-sm text-gray-700">Samo na stanju</span>
        </label>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2">
        <button
          onClick={applyFilters}
          className="btn-primary w-full"
        >
          Primeni filtere
        </button>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="btn-outline w-full"
          >
            Obriši filtere
          </button>
        )}
      </div>
    </div>
  );
}
