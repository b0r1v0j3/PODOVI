'use client';

import { useState } from 'react';
import { Product, Brand } from '@/types';
import ProductCardClient from '@/components/ProductCardClient';

interface LVTTabsProps {
  collections: Product[];
  colors: Product[];
  brandsRecord: Record<string, Brand>;
}

export default function LVTTabs({ collections, colors, brandsRecord }: LVTTabsProps) {
  const [activeTab, setActiveTab] = useState<'collections' | 'colors'>('collections');

  const renderProducts = (products: Product[]) => {
    if (products.length === 0) {
      return (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Nema proizvoda
          </h3>
          <p className="text-gray-600">
            Trenutno nema proizvoda koji odgovaraju izabranim filterima.
          </p>
        </div>
      );
    }
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {products.map((product) => {
          const brand = brandsRecord[product.brandId] || null;
          return (
            <ProductCardClient key={product.id} product={product} brand={brand} />
          );
        })}
      </div>
    );
  };

  return (
    <div>
      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <div className="flex space-x-8">
          <button
            onClick={() => setActiveTab('collections')}
            className={`pb-4 px-1 font-semibold text-lg transition-colors duration-200 ${
              activeTab === 'collections'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Kolekcije ({collections.length})
          </button>
          <button
            onClick={() => setActiveTab('colors')}
            className={`pb-4 px-1 font-semibold text-lg transition-colors duration-200 ${
              activeTab === 'colors'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Boje ({colors.length})
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'collections' ? (
          <div>
            <p className="text-gray-600 mb-6">
              {collections.length === 0 ? 'Nema' : collections.length} {collections.length === 1 ? 'kolekcija' : 'kolekcija'}
            </p>
            {renderProducts(collections)}
          </div>
        ) : (
          <div>
            <p className="text-gray-600 mb-6">
              {colors.length === 0 ? 'Nema' : colors.length} {colors.length === 1 ? 'boja' : 'boja'}
            </p>
            {renderProducts(colors)}
          </div>
        )}
      </div>
    </div>
  );
}
