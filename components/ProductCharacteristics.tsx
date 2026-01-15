'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import type { ProductSpec } from '@/types';
import lvtColorsData from '@/public/data/lvt_colors_complete.json';
import linoleumColorsData from '@/public/data/linoleum_colors_complete.json';

interface ProductCharacteristicsProps {
  specs?: ProductSpec[];
  categoryId: string;
}

export default function ProductCharacteristics({ specs, categoryId }: ProductCharacteristicsProps) {
  const searchParams = useSearchParams();
  const [selectedCharacteristics, setSelectedCharacteristics] = useState<Record<string, string> | null>(null);
  const colorSlug = searchParams.get('color');

  useEffect(() => {
    if (!colorSlug) {
      setSelectedCharacteristics(null);
      return;
    }

    // Load color characteristics from JSON
    const isLinoleum = categoryId === '7';
    const colorsData = isLinoleum ? linoleumColorsData : lvtColorsData;
    const colors = (colorsData as { colors?: any[] }).colors || [];
    
    const color = colors.find((c: any) => c.slug === colorSlug);
    if (color && color.characteristics) {
      setSelectedCharacteristics(color.characteristics);
    } else {
      setSelectedCharacteristics(null);
    }
  }, [colorSlug, categoryId]);

  if ((!specs || specs.length === 0) && !selectedCharacteristics) {
    return null;
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Karakteristike</h2>
      <dl className="space-y-3">
        {/* Collection specs */}
        {specs && specs.length > 0 && specs.map((spec) => (
          <div key={spec.key} className="border-b border-gray-200 pb-3 last:border-0">
            <dt className="text-sm font-medium text-gray-500 mb-1">{spec.label}</dt>
            <dd className="text-base font-semibold text-gray-900">{spec.value}</dd>
          </div>
        ))}
        {/* Color characteristics */}
        {selectedCharacteristics && Object.entries(selectedCharacteristics).map(([label, value]) => (
          <div key={label} className="border-b border-gray-200 pb-3 last:border-0">
            <dt className="text-sm font-medium text-gray-500 mb-1">{label}</dt>
            <dd className="text-base font-semibold text-gray-900">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
