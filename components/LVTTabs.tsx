'use client';

import { useState } from 'react';
import { Product } from '@/types';

interface LVTTabsProps {
  collections: Product[];
  colors: Product[];
  renderProducts: (products: Product[]) => React.ReactNode;
}

export default function LVTTabs({ collections, colors, renderProducts }: LVTTabsProps) {
  const [activeTab, setActiveTab] = useState<'collections' | 'colors'>('collections');

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
