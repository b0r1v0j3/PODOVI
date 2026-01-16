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
    
    // Try exact match first
    let color = colors.find((c: any) => c.slug === colorSlug);
    
    // If not found, try to find by partial match (in case slug format differs)
    if (!color) {
      color = colors.find((c: any) => {
        const cSlug = c.slug || '';
        return cSlug.includes(colorSlug) || colorSlug.includes(cSlug);
      });
    }
    
    if (color) {
      const colorCharacteristics: Record<string, string> = {};
      
      // Add characteristics from color.characteristics if exists
      if (color.characteristics) {
        Object.assign(colorCharacteristics, color.characteristics);
      }
      
      // Add dimension, format, overall_thickness, welding_rod if they exist
      if (color.dimension) {
        colorCharacteristics['Dimenzije'] = color.dimension;
      }
      if (color.format) {
        colorCharacteristics['Format'] = color.format;
      }
      if (color.overall_thickness) {
        colorCharacteristics['Ukupna debljina'] = color.overall_thickness;
      }
      if (color.welding_rod) {
        colorCharacteristics['Šifra šipke za varenje'] = color.welding_rod;
      }
      
      if (Object.keys(colorCharacteristics).length > 0) {
        setSelectedCharacteristics(colorCharacteristics);
      } else {
        setSelectedCharacteristics(null);
      }
    } else {
      setSelectedCharacteristics(null);
    }
  }, [colorSlug, categoryId]);

  if ((!specs || specs.length === 0) && !selectedCharacteristics) {
    return null;
  }

  // Merge specs and selectedCharacteristics, prioritizing selectedCharacteristics
  // to avoid duplicates. If selectedCharacteristics exists, use it as primary source
  // and only add specs that are not already in selectedCharacteristics.
  const mergedSpecs = new Map<string, { label: string; value: string }>();
  
  if (selectedCharacteristics && Object.keys(selectedCharacteristics).length > 0) {
    // If we have color-specific characteristics, use them as primary source
    Object.entries(selectedCharacteristics).forEach(([label, value]) => {
      mergedSpecs.set(label.toLowerCase(), { label, value });
    });
    
    // Add any specs from collection that are not in selectedCharacteristics
    if (specs && specs.length > 0) {
      specs.forEach((spec) => {
        const key = spec.label.toLowerCase();
        if (!mergedSpecs.has(key)) {
          mergedSpecs.set(key, { label: spec.label, value: spec.value });
        }
      });
    }
  } else {
    // If no color-specific characteristics, just use collection specs
    if (specs && specs.length > 0) {
      specs.forEach((spec) => {
        mergedSpecs.set(spec.label.toLowerCase(), { label: spec.label, value: spec.value });
      });
    }
  }

  const finalSpecs = Array.from(mergedSpecs.values());

  if (finalSpecs.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Karakteristike</h2>
      <dl className="space-y-4">
        {finalSpecs.map((spec, index) => (
          <div key={`${spec.label}-${index}`} className="border-b border-gray-200 pb-4 last:border-0">
            <dt className="text-sm font-medium text-gray-500 mb-1">{spec.label}</dt>
            <dd className="text-lg font-semibold text-gray-900">{spec.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
