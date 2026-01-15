'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import ProductImage from './ProductImage';
import ColorGrid from './ColorGrid';
import type { ProductSpec } from '@/types';

interface ProductColorSelectorProps {
  initialImage: {
    url: string;
    alt: string;
  } | null;
  collectionSlug: string;
  productName: string;
  productPrice?: number;
  priceUnit?: string;
  brand?: {
    name: string;
    slug: string;
  } | null;
  shortDescription?: string;
  specs?: ProductSpec[];
  inStock: boolean;
  productSlug: string;
  externalLink?: string;
}

export default function ProductColorSelector({
  initialImage,
  collectionSlug,
  productName,
  productPrice,
  priceUnit,
  brand,
  shortDescription,
  specs,
  inStock,
  productSlug,
  externalLink,
}: ProductColorSelectorProps) {
  const [selectedImage, setSelectedImage] = useState(initialImage);
  const [selectedColor, setSelectedColor] = useState<{ code: string; name: string } | null>(null);
  const [selectedCharacteristics, setSelectedCharacteristics] = useState<Record<string, string> | null>(null);
  const searchParams = useSearchParams();
  const initialColorSlug = searchParams.get('color') || undefined;

  // Update image when color is selected
  const handleColorSelect = (payload: {
    imageUrl: string;
    imageAlt: string;
    colorCode?: string;
    colorName?: string;
    characteristics?: Record<string, string>;
  }) => {
    const { imageUrl, imageAlt, colorCode, colorName, characteristics } = payload;
    console.log('ProductColorSelector: Color selected', { imageUrl, imageAlt, colorCode, colorName });
    if (imageUrl) {
      setSelectedImage({ url: imageUrl, alt: imageAlt });
      if (colorCode && colorName) {
        setSelectedColor({ code: colorCode, name: colorName });
      }
      if (characteristics && Object.keys(characteristics).length > 0) {
        setSelectedCharacteristics(characteristics);
      } else {
        setSelectedCharacteristics(null);
      }
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Left Column - Image and Info */}
      <div className="space-y-6">
        {/* Large Image Section */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="aspect-square relative overflow-hidden rounded-xl bg-gray-100">
            {selectedImage ? (
              <ProductImage
                key={selectedImage.url}
                src={selectedImage.url}
                alt={selectedImage.alt}
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
                quality={100}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <span>Bez slike</span>
              </div>
            )}
          </div>
          
          {/* Selected Color Info */}
          {selectedColor && (
            <div className="mt-4 text-center">
              <p className="text-lg font-semibold text-gray-900">{selectedColor.code}</p>
              <p className="text-base text-gray-700">{selectedColor.name}</p>
            </div>
          )}

        </div>

        {/* Product Info - Below Image */}
        <div className="bg-white rounded-2xl shadow-lg p-6 space-y-6">
          {/* Brand */}
          {brand && (
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-500">Brend:</span>
              <a
                href={`/brendovi/${brand.slug}`}
                className="text-primary-600 hover:text-primary-700 font-semibold"
              >
                {brand.name}
              </a>
            </div>
          )}

          {/* Title */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {productName}
            </h1>
            {shortDescription && (
              <p className="text-lg text-gray-600">
                {shortDescription}
              </p>
            )}
          </div>

          {/* Price (if available) */}
          {productPrice && productPrice > 0 && (
            <div className="bg-primary-50 border border-primary-200 rounded-xl p-4">
              <div className="flex items-baseline space-x-2">
                <span className="text-3xl font-bold text-primary-600">
                  {productPrice.toLocaleString('sr-RS')}
                </span>
                <span className="text-base text-gray-600">RSD</span>
                {priceUnit && (
                  <span className="text-base text-gray-500">/ {priceUnit}</span>
                )}
              </div>
            </div>
          )}

          {/* Availability */}
          <div className="flex items-center space-x-2">
            <div
              className={`w-3 h-3 rounded-full ${
                inStock ? 'bg-green-500' : 'bg-red-500'
              }`}
            ></div>
            <span className="text-gray-700">
              {inStock ? 'Na stanju' : 'Nije dostupno'}
            </span>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col gap-3">
            <a
              href={`/kontakt?product=${productSlug}`}
              className="btn bg-primary-600 text-white hover:bg-primary-700 text-center text-base px-6 py-3"
            >
              Pošaljite upit
            </a>
            {externalLink && (
              <a
                href={externalLink}
                target="_blank"
                rel="noopener noreferrer"
                className="btn border-2 border-gray-300 text-gray-700 hover:border-primary-600 hover:text-primary-600 text-center text-base px-6 py-3"
              >
                Pogledaj na sajtu proizvođača
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Right Column - Color Grid and Characteristics */}
      <div className="space-y-6">
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <ColorGrid 
            collectionSlug={collectionSlug} 
            onColorSelect={handleColorSelect}
            compact={true}
            initialColorSlug={initialColorSlug}
          />
        </div>
        {specs && specs.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Karakteristike</h3>
            <dl className="space-y-3">
              {specs.map((spec) => (
                <div key={spec.key} className="border-b border-gray-200 pb-3 last:border-0">
                  <dt className="text-xs font-medium text-gray-500 mb-1">{spec.label}</dt>
                  <dd className="text-sm font-semibold text-gray-900">{spec.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}
        {selectedCharacteristics && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Karakteristike boje</h3>
            <dl className="space-y-3">
              {Object.entries(selectedCharacteristics).map(([label, value]) => (
                <div key={label} className="border-b border-gray-200 pb-3 last:border-0">
                  <dt className="text-xs font-medium text-gray-500 mb-1">{label}</dt>
                  <dd className="text-sm font-semibold text-gray-900">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}
      </div>
    </div>
  );
}
