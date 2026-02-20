'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import ProductImage from './ProductImage';
import ColorGrid from './ColorGrid';
import FavoriteButton from './FavoriteButton';
import { splitProductTitle } from '@/lib/utils/name-parser';

import { ProductSpec } from '@/types';

interface ProductColorSelectorProps {
  initialImage: {
    url: string;
    alt: string;
  } | null;
  collectionSlug: string;
  productName: string;
  /** Original product/collection name before color merge — stable reference for subtitle */
  originalProductName?: string;
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
  onCharacteristicsChange?: (characteristics: Record<string, string> | null) => void;
  customColors?: any[];
  /** Za parket/laminat: naziv kolekcije prikazan iznad (kao LVT "Creation 30"). Ispod slike ostaje boja/varijanta. */
  collectionDisplayName?: string;
  /** Kada je collectionDisplayName setovan: label ispod (npr. "Parket" ili "Laminat") – "Parket – ime boje" / "Laminat – ime boje". */
  collectionCategoryLabel?: string;
  /** YouTube embed URL (npr. za kolekciju) – prikazuje se ispod slike, u širini slike, play na sajtu. */
  videoEmbedUrl?: string;
  /** Sadržaj ispod Boja u desnoj koloni (npr. Tehničke specifikacije za parket). */
  rightColumnBottom?: React.ReactNode;
  /** Sadržaj ispod slike/videa u levoj koloni (npr. Opis za parket) – ispunjava prostor, bez supljine. */
  leftColumnBottom?: React.ReactNode;
  /** Ref proizvoda za link upita (kontakt?product=&color=&ref=). */
  inquiryRef?: string;
  /** Da li je glavna slika hero/LCP – samo jedna po stranici ima priority. */
  imagePriority?: boolean;
  /** Product ID for Favorite button */
  productId?: string;
}

export default function ProductColorSelector({
  initialImage,
  collectionSlug,
  productName,
  originalProductName,
  productPrice,
  priceUnit,
  brand,
  shortDescription,
  specs,
  inStock,
  productSlug,
  externalLink,
  onCharacteristicsChange,
  customColors,
  collectionDisplayName,
  collectionCategoryLabel,
  videoEmbedUrl,
  rightColumnBottom,
  leftColumnBottom,
  inquiryRef,
  imagePriority,
  productId,
}: ProductColorSelectorProps) {
  const [selectedImage, setSelectedImage] = useState(initialImage);
  const [selectedImages, setSelectedImages] = useState<Array<{ url: string; alt: string }>>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedColor, setSelectedColor] = useState<{ code: string; name: string } | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const initialColorSlug = searchParams.get('color') || undefined;
  const [selectedColorSlug, setSelectedColorSlug] = useState<string | undefined>(initialColorSlug);
  const [selectedCharacteristics, setSelectedCharacteristics] = useState<Record<string, string> | null>(null);
  const [colorsCount, setColorsCount] = useState<number | null>(null);
  const [isColorsModalOpen, setIsColorsModalOpen] = useState(false);

  // Parket: ako je u URL-u ?color= koji nije u customColors (npr. winter-832), redirect na prvu validnu boju
  useEffect(() => {
    if (!customColors || customColors.length === 0) return;
    const urlColor = searchParams.get('color') || '';
    if (!urlColor) return;
    const validSlugs = customColors.map((c: { slug?: string }) => c.slug).filter((s): s is string => Boolean(s));
    const firstSlug = validSlugs[0];
    if (firstSlug && !validSlugs.includes(urlColor)) {
      router.replace(`${pathname}?color=${encodeURIComponent(firstSlug)}`);
    }
  }, [customColors, searchParams, pathname, router]);

  // Compute clean collection name: strip brand prefix from originalProductName
  // e.g. "Gerflor Creation 40 Clic" → "Creation 40 Clic", "BLOQ Solace" → "Solace"
  const collectionName = useMemo(() => {
    const name = originalProductName || productName;
    if (brand?.name && name.toLowerCase().startsWith(brand.name.toLowerCase() + ' ')) {
      return name.substring(brand.name.length + 1);
    }
    return name;
  }, [originalProductName, productName, brand]);

  // Update selectedColorSlug when URL changes
  useEffect(() => {
    const urlColorSlug = searchParams.get('color') || undefined;
    if (urlColorSlug && urlColorSlug !== selectedColorSlug) {
      setSelectedColorSlug(urlColorSlug);
    }
  }, [searchParams, selectedColorSlug]);

  // Track the previous image for cross-fade
  const [prevImage, setPrevImage] = useState<{ url: string; alt: string } | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const transitionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Update image when color is selected
  const handleColorSelect = useCallback((payload: {
    imageUrl: string;
    imageAlt: string;
    colorCode?: string;
    colorName?: string;
    characteristics?: Record<string, string>;
    colorSlug?: string;
  }) => {
    const { imageUrl, imageAlt, colorCode, colorName, characteristics } = payload;
    if (imageUrl) {
      // Start cross-fade: save current as prev, set new image
      if (selectedImage && selectedImage.url !== imageUrl) {
        setPrevImage(selectedImage);
        setIsTransitioning(true);
        if (transitionTimeoutRef.current) clearTimeout(transitionTimeoutRef.current);
        transitionTimeoutRef.current = setTimeout(() => {
          setPrevImage(null);
          setIsTransitioning(false);
        }, 250);
      }
      setSelectedImage({ url: imageUrl, alt: imageAlt });
      setCurrentImageIndex(0); // Reset to first image

      if (colorCode && colorName) {
        setSelectedColor({ code: colorCode, name: colorName });
      }

      if (payload.colorSlug) {
        setSelectedColorSlug(payload.colorSlug);
      }

      if (characteristics) {
        setSelectedCharacteristics(characteristics);
        if (onCharacteristicsChange) {
          onCharacteristicsChange(characteristics);
        }
      }
    }
  }, [selectedImage, onCharacteristicsChange]);

  // Kad imamo customColors (parket) i ?color= u URL-u, odmah postavi sliku na tu boju
  useEffect(() => {
    if (!customColors?.length || !initialColorSlug) return;
    const color = customColors.find((c: any) => c.slug === initialColorSlug);
    if (color?.image_url) {
      setSelectedImage({ url: color.image_url, alt: color.name || color.full_name || '' });
      setSelectedImages([{ url: color.image_url, alt: color.name || color.full_name || '' }]);
      if (color.code && color.name) setSelectedColor({ code: color.code, name: color.name });
    }
  }, [customColors, initialColorSlug]);

  // Update selected image when currentImageIndex changes
  useEffect(() => {
    if (selectedImages.length > 0 && selectedImages[currentImageIndex]) {
      setSelectedImage(selectedImages[currentImageIndex]);
    }
  }, [currentImageIndex, selectedImages]);

  // Clean up transition timeout on unmount
  useEffect(() => {
    return () => {
      if (transitionTimeoutRef.current) clearTimeout(transitionTimeoutRef.current);
    };
  }, []);

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
      {/* Prvi red: SAMO slika (levo) i Info + Boje (desno) – ista visina, dno u istoj liniji */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch mb-6">
        {/* Levo: samo kvadrat sa slikom */}
        <div className="flex flex-col min-h-0">
          <div className="bg-white rounded-2xl shadow-lg p-6 flex flex-col h-full">
            <div className="aspect-square relative overflow-hidden rounded-xl bg-gray-100 flex-shrink-0">
              {/* Pre-render ALL color images - instant switching via CSS display */}
              {customColors && customColors.length > 0 ? (
                <>
                  {customColors.map((color: { slug?: string; image_url?: string; texture_url?: string; name?: string; full_name?: string }) => {
                    const imgUrl = color.image_url || color.texture_url;
                    const isActive = color.slug === selectedColorSlug ||
                      (color.slug === customColors[0]?.slug && !selectedColorSlug);
                    if (!imgUrl) return null;
                    return (
                      <img
                        key={color.slug}
                        src={imgUrl}
                        alt={color.name || color.full_name || ''}
                        className="absolute inset-0 w-full h-full object-cover"
                        style={{
                          opacity: isActive ? 1 : 0,
                          zIndex: isActive ? 10 : 1,
                          transition: 'opacity 200ms ease-in-out',
                        }}
                        loading="eager"
                        decoding="async"
                      />
                    );
                  })}
                </>
              ) : selectedImage ? (
                <>
                  {/* Previous image fading out for smooth cross-fade */}
                  {prevImage && isTransitioning && (
                    <img
                      src={prevImage.url}
                      alt={prevImage.alt}
                      className="absolute inset-0 w-full h-full object-cover"
                      style={{
                        zIndex: 5,
                        opacity: 0,
                        transition: 'opacity 250ms ease-in-out',
                      }}
                    />
                  )}
                  {/* Current image */}
                  <img
                    key={selectedImage.url}
                    src={selectedImage.url}
                    alt={selectedImage.alt}
                    className="absolute inset-0 w-full h-full object-cover"
                    style={{
                      zIndex: 10,
                      opacity: 1,
                      transition: 'opacity 200ms ease-in-out',
                    }}
                    loading="eager"
                    decoding="async"
                  />
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <span>Bez slike</span>
                </div>
              )}

              {/* Image switcher arrows - show only if multiple images */}
              {selectedImages.length > 1 && (
                <>
                  <button
                    onClick={() => setCurrentImageIndex((currentImageIndex - 1 + selectedImages.length) % selectedImages.length)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg transition-all z-20"
                    aria-label="Prethodna slika"
                  >
                    <svg className="w-6 h-6 text-gray-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setCurrentImageIndex((currentImageIndex + 1) % selectedImages.length)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg transition-all z-20"
                    aria-label="Sledeća slika"
                  >
                    <svg className="w-6 h-6 text-gray-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                  {/* Image indicator dots */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                    {selectedImages.map((_: { url: string; alt: string }, idx: number) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentImageIndex(idx)}
                        className={`w-2 h-2 rounded-full transition-all ${idx === currentImageIndex ? 'bg-white w-4' : 'bg-white/50'}`}
                        aria-label={`Slika ${idx + 1}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Ispod slike: ime boje (levo) + Favorite & Share (desno) – sve u jednoj liniji */}
            <div className="flex items-center justify-between mt-4">
              {/* Levo: ime boje */}
              <div className="flex-1 min-w-0">
                {selectedColor ? (
                  <div className="flex items-baseline gap-2">
                    {selectedColor.code && (
                      <p className="text-lg font-semibold text-gray-900">{selectedColor.code}</p>
                    )}
                    <p className="text-base text-gray-700 truncate">
                      {(() => {
                        let name = selectedColor.name;
                        // Strip code prefix if name starts with code
                        if (selectedColor.code && name.startsWith(selectedColor.code)) {
                          name = name.substring(selectedColor.code.length).trim();
                        }

                        const collName = collectionDisplayName || collectionName;
                        const { color } = splitProductTitle(name, collName);
                        return color;
                      })()}
                    </p>
                  </div>
                ) : null}
              </div>

              {/* Desno: Favorite & Share */}
              <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                {productId && <FavoriteButton productId={productId} size="md" />}
                <button
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({ title: productName, url: window.location.href }).catch(() => { });
                    } else {
                      navigator.clipboard.writeText(window.location.href).then(() => {
                        alert('Link kopiran!');
                      });
                    }
                  }}
                  className="btn bg-[#F5F5F7] text-[#1D1D1F] hover:bg-[#E8E8ED] border-0 gap-1.5 px-3 py-1.5 text-[13px] font-medium rounded-full transition-all"
                  title="Podeli"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  Podeli
                </button>
              </div>
            </div>

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
        </div>

        {/* Desno: Info + Boje – Boje raste da dno bude u liniji sa dnom slike */}
        <div className="flex flex-col gap-6 h-full min-h-0">
          {/* Product Info + CTA - Na mobilnom ide POSLE boja (order-2), na desktopu normalno */}
          <div className="bg-white rounded-2xl shadow-lg p-6 space-y-4 flex-shrink-0 order-2 lg:order-1">
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

            {/* Title: color name in h1 when selected, otherwise split color name; subtitle = collection name */}
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-1 tracking-tight">
                {(() => {
                  let rawName = selectedColor
                    ? (selectedColor.name.startsWith(selectedColor.code) ? selectedColor.name.substring(selectedColor.code.length).trim() : selectedColor.name)
                    : productName;

                  const { color } = splitProductTitle(rawName, collectionDisplayName || collectionName);
                  return color;
                })()}
              </h1>

              {(() => {
                let rawName = selectedColor
                  ? (selectedColor.name.startsWith(selectedColor.code) ? selectedColor.name.substring(selectedColor.code.length).trim() : selectedColor.name)
                  : productName;
                const { collection } = splitProductTitle(rawName, collectionDisplayName || collectionName);

                if (collection) {
                  return (
                    <p className="text-lg text-gray-500 font-medium mb-3">
                      {collection}
                    </p>
                  );
                } else if (shortDescription) {
                  return (
                    <p className="text-lg text-gray-600 mb-3">
                      {shortDescription}
                    </p>
                  );
                }
                return null;
              })()}
            </div>

            {/* Price or "Cena na upit" */}
            {productPrice && productPrice > 0 ? (
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
            ) : (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-amber-800">Cena na upit</p>
                    <p className="text-sm text-amber-600">Pošaljite upit za najbolju ponudu</p>
                  </div>
                </div>
              </div>
            )}

            {/* CTA Button - Pošaljite upit (veći, istaknut) – prefill: proizvod + boja + ref */}
            <div>
              <a
                href={(() => {
                  const params = new URLSearchParams();
                  params.set('product', productSlug);
                  if (selectedColorSlug) params.set('color', selectedColorSlug);
                  if (inquiryRef) params.set('ref', inquiryRef);
                  if (selectedImage?.url) params.set('img', selectedImage.url);

                  const category = collectionCategoryLabel || (collectionSlug.includes('lvt') ? 'LVT' : collectionSlug.includes('linoleum') ? 'Linoleum' : 'Podna obloga');
                  params.set('category', category);

                  // Construct nice name: deduplicate collection name if present in color name
                  let niceName = collectionDisplayName || productName;

                  if (selectedColor?.name) {
                    let variantName = selectedColor.name;
                    // Check if variant name starts with the collection/product name (case insensitive)
                    if (niceName && variantName.toLowerCase().startsWith(niceName.toLowerCase())) {
                      // Remove the repeated prefix
                      variantName = variantName.substring(niceName.length).trim();
                      // Remove any leading separators like "- " or space
                      variantName = variantName.replace(/^[-–—\s]+/, '');
                    }

                    if (variantName) {
                      niceName = `${niceName} - ${variantName}`;
                    }
                  }

                  params.set('name', niceName);

                  return `/kontakt?${params.toString()}`;
                })()}
                className="btn-primary text-center text-[17px] font-semibold px-8 py-4 w-full rounded-full shadow-lg hover:shadow-xl hover:scale-[1.01] transition-all"
              >
                Pošaljite upit
              </a>


            </div>
          </div>

          {/* Boje – Na mobilnom ide PRVO (order-1), na desktopu DRUGO (order-2) */}
          <div className="bg-white rounded-2xl shadow-lg p-6 flex flex-col flex-1 min-h-0 order-1 lg:order-2">
            <div className="flex items-start justify-between gap-4 mb-4 flex-shrink-0">
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
            <div className="flex-1 min-h-0">
              <ColorGrid
                collectionSlug={collectionSlug}
                onColorSelect={handleColorSelect}
                compact={true}
                limit={12}
                onColorsLoaded={setColorsCount}
                initialColorSlug={initialColorSlug}
                selectedColorSlug={selectedColorSlug}
                customColors={customColors}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Ispod prvog reda: video, opis, Tehničke spec (parket) */}
      {(videoEmbedUrl || leftColumnBottom || rightColumnBottom) ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="flex flex-col gap-6">
            {videoEmbedUrl && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="w-full aspect-video rounded-xl overflow-hidden bg-gray-100">
                  <iframe
                    src={videoEmbedUrl}
                    title="Video kolekcije"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    loading="lazy"
                    className="w-full h-full"
                  />
                </div>
              </div>
            )}
            {leftColumnBottom}
          </div>
          <div>
            {rightColumnBottom}
          </div>
        </div>
      ) : null}

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
                selectedColorSlug={selectedColorSlug}
                customColors={customColors}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}