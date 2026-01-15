'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import ProductImage from './ProductImage';
import ColorGrid from './ColorGrid';

import { ProductSpec } from '@/types';

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
  const [colorsCount, setColorsCount] = useState<number | null>(null);
  const [isColorsModalOpen, setIsColorsModalOpen] = useState(false);
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
    console.log('ProductColorSelector: Color selected', { imageUrl, imageAlt, colorCode, colorName, characteristics });
    if (imageUrl) {
      setSelectedImage({ url: imageUrl, alt: imageAlt });
      if (colorCode && colorName) {
        setSelectedColor({ code: colorCode, name: colorName });
      }
      if (characteristics) {
        setSelectedCharacteristics(characteristics);
      }
    }
  };

  const handleModalColorSelect = (payload: {
    imageUrl: string;
    imageAlt: string;
    colorCode?: string;
    colorName?: string;
    characteristics?: Record<string, string>;
  }) => {
    handleColorSelect(payload);
    setIsColorsModalOpen(false);
  };

  const colorsCountLabel = colorsCount === null ? '...' : colorsCount;

  return (
    <>
      {/* Main Grid - Image Left, Info + Colors Right */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Left Column - Image + External Link */}
        <div className="bg-white rounded-2xl shadow-lg p-6 flex flex-col">
          <div className="aspect-square relative overflow-hidden rounded-xl bg-gray-100 flex-shrink-0">
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

          {/* External Link Button - Below Image */}
          {externalLink && (
            <div className="mt-4">
              <a
                href={externalLink}
                target="_blank"
                rel="noopener noreferrer"
                className="btn border-2 border-gray-300 text-gray-700 hover:border-primary-600 hover:text-primary-600 text-center text-base px-6 py-3 w-full"
              >
                Pogledaj na sajtu proizvođača
              </a>
            </div>
          )}
        </div>

        {/* Right Column - Info + Colors Stacked */}
        <div className="flex flex-col gap-6">
          {/* Product Info + CTA */}
          <div className="bg-white rounded-2xl shadow-lg p-6 space-y-4">
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

            {/* CTA Button - Only "Pošaljite upit" */}
            <div>
              <a
                href={`/kontakt?product=${productSlug}`}
                className="btn bg-primary-600 text-white hover:bg-primary-700 text-center text-base px-6 py-3 w-full"
              >
                Pošaljite upit
              </a>
            </div>
          </div>

          {/* Colors Section */}
          <div className="bg-white rounded-2xl shadow-lg p-6 flex flex-col flex-1">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Boje</h3>
                <p className="text-sm text-gray-500">{colorsCountLabel} {colorsCount === 1 ? 'boja' : 'boja'}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsColorsModalOpen(true)}
                className="text-primary-600 hover:text-primary-700 text-sm font-semibold whitespace-nowrap"
              >
                Pogledaj sve →
              </button>
            </div>
            <div className="flex-1">
              <ColorGrid
                collectionSlug={collectionSlug}
                onColorSelect={handleColorSelect}
                compact={true}
                initialColorSlug={initialColorSlug}
                limit={12}
                onColorsLoaded={setColorsCount}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Full Width - Characteristics & Color Characteristics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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

      {isColorsModalOpen && (
        <div className="fixed inset-0 z-[60]">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setIsColorsModalOpen(false)}
          ></div>
          <div className="relative mx-auto mt-8 w-[92%] max-w-5xl bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="text-xl font-semibold text-gray-900">
                Sve boje ({colorsCountLabel})
              </h3>
              <button
                type="button"
                onClick={() => setIsColorsModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
                aria-label="Zatvori"
              >
                ✕
              </button>
            </div>
            <div className="p-6 overflow-y-auto">
              <ColorGrid
                collectionSlug={collectionSlug}
                onColorSelect={handleModalColorSelect}
                compact={false}
                initialColorSlug={initialColorSlug}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}