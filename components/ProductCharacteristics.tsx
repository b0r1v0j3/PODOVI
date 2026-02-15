'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import type { ProductSpec } from '@/types';

interface ProductCharacteristicsProps {
  specs?: ProductSpec[];
  categoryId: string;
  /** Naslov sekcije (npr. "Tehničke specifikacije" za Parket) */
  title?: string;
}

export default function ProductCharacteristics({ specs, categoryId, title }: ProductCharacteristicsProps) {
  const searchParams = useSearchParams();
  const [selectedCharacteristics, setSelectedCharacteristics] = useState<Record<string, string> | null>(null);
  const colorSlug = searchParams.get('color');

  useEffect(() => {
    if (!colorSlug) {
      setSelectedCharacteristics(null);
      return;
    }

    let isActive = true;

    const loadCharacteristics = async () => {
      try {
        const res = await fetch(`/api/color-data?color=${encodeURIComponent(colorSlug)}&categoryId=${encodeURIComponent(categoryId)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.characteristics && Object.keys(data.characteristics).length > 0) {
            if (isActive) setSelectedCharacteristics(data.characteristics);
            return;
          }
        }
      } catch {
        // Ignore fetch errors
      }
      if (isActive) setSelectedCharacteristics(null);
    };

    loadCharacteristics();
    return () => { isActive = false; };
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
        // Check if key already exists (simple check)
        if (mergedSpecs.has(key)) return;

        // Check for similar keys (e.g. "Ukupna debljina" vs "Debljina")
        const alreadyExists = Array.from(mergedSpecs.keys()).some(existingKey => {
          return existingKey.includes(key) || key.includes(existingKey) ||
            (existingKey === 'ukupna debljina' && key === 'debljina') ||
            (existingKey === 'debljina' && key === 'ukupna debljina');
        });

        if (!alreadyExists) {
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
      <h2 className="text-2xl font-bold text-gray-900 mb-4">{title ?? 'Tehničke specifikacije'}</h2>
      <dl className="space-y-4">
        {finalSpecs.map((spec, index) => {
          const isWeldingRod = spec.label === 'Elektroda za varenje';

          return (
            <div key={`${spec.label}-${index}`} className="border-b border-gray-200 pb-4 last:border-0">
              <dt className="text-sm font-medium text-gray-500 mb-1">{spec.label}</dt>
              <dd className="text-lg font-semibold text-gray-900">
                {isWeldingRod ? (
                  <Link
                    href={`/proizvodi/welding-rod/${spec.value}`}
                    className="text-primary-600 hover:text-primary-700 underline underline-offset-4"
                  >
                    {spec.value}
                  </Link>
                ) : (
                  spec.value
                )}
              </dd>
            </div>
          );
        })}
      </dl>
    </div>
  );
}
