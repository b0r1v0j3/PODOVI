'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import ProductImage from './ProductImage';
import ColorGrid from './ColorGrid';
import FavoriteButton from './FavoriteButton';
import { splitProductTitle } from '@/lib/utils/name-parser';
import { getCustomColorHeroImageState, getPrimaryColorImage } from '@/lib/utils/product-images';
import { useScrollLock } from './useScrollLock';

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
    logo?: string | null;
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
  /** Ref proizvoda za link upita (upiti?product=&color=&ref=). */
  inquiryRef?: string;
  /** Da li je glavna slika hero/LCP – samo jedna po stranici ima priority. */
  imagePriority?: boolean;
  /** Product ID for Favorite button */
  productId?: string;
  /** Opcija da se potpuno sakrije prozor za boje (npr. za Deking proizvode) i popuni prostor */
  hideColorSelector?: boolean;
  apiCategory?: string;
  uiMode?: 'colors' | 'variants';
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
  inquiryRef,
  imagePriority,
  productId,
  hideColorSelector,
  apiCategory,
  uiMode = 'colors',
}: ProductColorSelectorProps) {
  const [selectedImage, setSelectedImage] = useState(initialImage);
  const [selectedImages, setSelectedImages] = useState<Array<{ url: string; alt: string }>>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedColor, setSelectedColor] = useState<{ code: string; name: string } | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  // Bez ?color= u URL-u, podrazumevano se bira PRVA boja (ne collection cover / room-scene),
  // da se na otvaranju kolekcije odmah vidi stvarni dekor. Radi i na SSR-u (useState init),
  // pa nema treperenja; URL ostaje čist (kanonika nepromenjena).
  const firstCustomColorSlug = useMemo(
    () => customColors?.find((c: any) => c?.slug)?.slug || undefined,
    [customColors]
  );
  const initialColorSlug = searchParams.get('color') || firstCustomColorSlug;
  const [selectedColorSlug, setSelectedColorSlug] = useState<string | undefined>(initialColorSlug);
  const [selectedCharacteristics, setSelectedCharacteristics] = useState<Record<string, string> | null>(null);
  const [colorsCount, setColorsCount] = useState<number | null>(null);
  const externalLinkLabel = brand?.slug === 'podovi' ? 'Pogledaj izvorni katalog' : 'Pogledaj na sajtu proizvođača';
  const [isColorsModalOpen, setIsColorsModalOpen] = useState(false);
  const colorsModalTriggerRef = useRef<HTMLButtonElement>(null);
  const colorsModalCloseButtonRef = useRef<HTMLButtonElement>(null);
  const selectorTitle = uiMode === 'variants' ? 'Varijante' : 'Boje';
  const selectorCountLabel = uiMode === 'variants'
    ? (colorsCount === 1 ? 'varijanta' : 'varijanti')
    : 'boja';
  const selectorAllTitle = uiMode === 'variants' ? 'Sve varijante' : 'Sve boje';

  // Zakljucaj scroll pozadine dok je modal boja otvoren
  useScrollLock(isColorsModalOpen);

  // Zatvori modal na Escape i upravljaj fokusom dok je otvoren
  useEffect(() => {
    if (!isColorsModalOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsColorsModalOpen(false);
      }
    };

    document.addEventListener('keydown', onKeyDown);
    // Pri otvaranju fokus ulazi u dijalog — na dugme za zatvaranje
    colorsModalCloseButtonRef.current?.focus();

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      // Vrati fokus na dugme "Pogledaj sve" koje je otvorilo modal
      colorsModalTriggerRef.current?.focus();
    };
  }, [isColorsModalOpen]);

  // Parket: ako je u URL-u ?color= koji nije u customColors (npr. winter-832), redirect na prvu validnu boju
  useEffect(() => {
    if (!customColors || customColors.length === 0) return;
    const urlColor = searchParams.get('color') || '';
    if (!urlColor) return;
    const validSlugs = customColors.map((c: { slug?: string }) => c.slug).filter((s): s is string => Boolean(s));
    const firstSlug = validSlugs[0];
    if (firstSlug && !validSlugs.includes(urlColor)) {
      const params = new URLSearchParams(searchParams);
      params.set('color', firstSlug);
      router.replace(`${pathname}?${params.toString()}`);
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
  const customColorHeroState = useMemo(
    () => getCustomColorHeroImageState(customColors, selectedColorSlug, initialImage),
    [customColors, selectedColorSlug, initialImage]
  );
  const activeCustomColor = useMemo(
    () => (
      customColorHeroState.activeColorSlug
        ? customColors?.find((color: any) => color.slug === customColorHeroState.activeColorSlug) || null
        : null
    ),
    [customColors, customColorHeroState.activeColorSlug]
  );
  const activeColorContext = useMemo(() => {
    if (selectedColor) {
      return selectedColor;
    }

    if (!activeCustomColor) {
      return null;
    }

    return {
      code: String(activeCustomColor.code || '').trim(),
      name: String(activeCustomColor.name || activeCustomColor.full_name || '').trim(),
    };
  }, [selectedColor, activeCustomColor]);
  const displayProductTitle = useMemo(() => {
    const rawName = activeColorContext?.name
      ? (
        activeColorContext.code && activeColorContext.name.startsWith(activeColorContext.code)
          ? activeColorContext.name.substring(activeColorContext.code.length).trim()
          : activeColorContext.name
      )
      : productName;

    return splitProductTitle(rawName, collectionDisplayName || collectionName);
  }, [activeColorContext, productName, collectionDisplayName, collectionName]);
  const shareTitle = useMemo(() => {
    if (displayProductTitle.collection && displayProductTitle.collection !== displayProductTitle.color) {
      return `${displayProductTitle.color} - ${displayProductTitle.collection}`;
    }

    return displayProductTitle.color || productName;
  }, [displayProductTitle, productName]);

  // Update selectedColorSlug when URL changes (bez ?color= → prva boja, ne reset na cover)
  useEffect(() => {
    const urlColorSlug = searchParams.get('color') || firstCustomColorSlug;
    if (urlColorSlug !== selectedColorSlug) {
      setSelectedColorSlug(urlColorSlug);
    }
  }, [searchParams, selectedColorSlug, firstCustomColorSlug]);

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

  // Za customColors kolekcije: bez ?color ostaje collection cover, sa ?color aktivna je izabrana boja.
  useEffect(() => {
    if (!customColors?.length) {
      return;
    }

    if (!selectedColorSlug) {
      setSelectedColor(null);
      setSelectedCharacteristics(null);
      setSelectedImages([]);
      setCurrentImageIndex(0);
      setSelectedImage(initialImage);
      if (onCharacteristicsChange) {
        onCharacteristicsChange(null);
      }
      return;
    }

    const color = customColors.find((c: any) => c.slug === selectedColorSlug);
    const colorImage = getPrimaryColorImage(color);
    if (!color || !colorImage?.url) {
      return;
    }

    setSelectedImage({ url: colorImage.url, alt: colorImage.alt });
    setSelectedImages([{ url: colorImage.url, alt: colorImage.alt }]);
    if (color.code && color.name) {
      setSelectedColor({ code: color.code, name: color.name });
    }
  }, [customColors, selectedColorSlug, initialImage, onCharacteristicsChange]);

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
      {/* Split raspored: levo galerija, desno sticky info kolona */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-start mb-12">
        {/* Levo: galerija */}
        <div>
          <div className="aspect-square relative overflow-hidden bg-paper">
            {/* Pre-render ALL color images - instant switching via CSS display */}
            {customColors && customColors.length > 0 ? (
              <>
                {customColorHeroState.image && !customColorHeroState.activeColorSlug && (
                  <img
                    key={`collection-cover-${customColorHeroState.image.url}`}
                    src={customColorHeroState.image.url}
                    alt={customColorHeroState.image.alt}
                    className="absolute inset-0 w-full h-full object-cover"
                    style={{
                      opacity: 1,
                      zIndex: 10,
                      transition: 'opacity 200ms ease-in-out',
                    }}
                    loading="eager"
                    decoding="async"
                  />
                )}
                {customColors.map((color: { slug?: string; image_url?: string; texture_url?: string; lifestyle_url?: string; image?: string; name?: string; full_name?: string }) => {
                  const primaryColorImage = getPrimaryColorImage(color);
                  const imgUrl = primaryColorImage?.url;
                  const isActive = color.slug === customColorHeroState.activeColorSlug;
                  if (!imgUrl) return null;
                  return (
                    <img
                      key={color.slug}
                      src={imgUrl}
                      alt={primaryColorImage?.alt || color.name || color.full_name || ''}
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
              <div className="w-full h-full flex items-center justify-center text-ink-500">
                <span>Bez slike</span>
              </div>
            )}

            {/* Image switcher arrows - show only if multiple images */}
            {selectedImages.length > 1 && (
              <>
                <button
                  onClick={() => setCurrentImageIndex((currentImageIndex - 1 + selectedImages.length) % selectedImages.length)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 flex min-h-[44px] min-w-[44px] items-center justify-center bg-white border border-ink-200 hover:border-ink-900 transition-colors z-20"
                  aria-label="Prethodna slika"
                >
                  <svg className="w-5 h-5 text-ink-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={() => setCurrentImageIndex((currentImageIndex + 1) % selectedImages.length)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 flex min-h-[44px] min-w-[44px] items-center justify-center bg-white border border-ink-200 hover:border-ink-900 transition-colors z-20"
                  aria-label="Sledeća slika"
                >
                  <svg className="w-5 h-5 text-ink-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                {/* Image indicator dots */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex z-20">
                  {selectedImages.map((_: { url: string; alt: string }, idx: number) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentImageIndex(idx)}
                      className="p-2"
                      aria-label={`Slika ${idx + 1}`}
                    >
                      <span className={`block h-[3px] transition-all ${idx === currentImageIndex ? 'w-5 bg-white' : 'w-2 bg-white/60'}`} />
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Ispod slike: ime boje (levo) + Favorite & Share (desno) – sve u jednoj liniji */}
          <div className="flex items-center justify-between mt-4">
            {/* Levo: ime boje */}
            <div className="flex-1 min-w-0">
              {activeColorContext ? (
                <div className="flex items-baseline gap-2">
                  <p className="text-[15px] text-ink-900 truncate">
                    {(() => {
                      let name = activeColorContext.name;
                      // Strip code prefix if name starts with code
                      if (activeColorContext.code && name.startsWith(activeColorContext.code)) {
                        name = name.substring(activeColorContext.code.length).trim();
                      }

                      const collName = collectionDisplayName || collectionName;
                      const { color } = splitProductTitle(name, collName);
                      return color;
                    })()}
                  </p>
                  {activeColorContext.code && (
                    <p className="text-[13px] text-ink-500">{activeColorContext.code}</p>
                  )}
                </div>
              ) : null}
            </div>

            {/* Desno: Favorite & Share */}
            <div className="flex items-center gap-3 flex-shrink-0 ml-3">
              {productId && <FavoriteButton productId={productId} size="md" />}
              <button
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({ title: shareTitle, url: window.location.href }).catch(() => { });
                  } else {
                    navigator.clipboard.writeText(window.location.href).then(() => {
                      alert('Link kopiran!');
                    });
                  }
                }}
                className="inline-flex items-center gap-1.5 bg-white border border-ink-200 px-3 min-h-[44px] text-[13px] font-medium text-ink-900 hover:border-ink-900 transition-colors"
                title="Podeli"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                Podeli
              </button>
            </div>
          </div>
        </div>

        {/* Desno: sticky info kolona */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          {/* Brend etiketa */}
          {brand?.name && (
            <p className="eyebrow mb-3">{brand.name}</p>
          )}

          {/* Naziv (boja) + kolekcija */}
          <h1 className="text-3xl md:text-4xl font-normal tracking-tight text-ink-900 mb-2">
            {displayProductTitle.color}
          </h1>

          {displayProductTitle.collection ? (
            <p className="text-base text-ink-600 mb-4">
              {displayProductTitle.collection}
            </p>
          ) : shortDescription ? (
            <p className="text-base text-ink-600 mb-4">
              {shortDescription}
            </p>
          ) : null}

          {/* Cena — čist tekst, bez kutija */}
          {productPrice && productPrice > 0 ? (
            <p className="text-[13px] text-ink-500 mb-8">
              {productPrice.toLocaleString('sr-RS')} RSD{priceUnit ? ` / ${priceUnit}` : ''}
            </p>
          ) : (
            <p className="text-[13px] text-ink-500 mb-8">Cena na upit</p>
          )}

          {/* Varijante/boje – mreža kvadratnih swatcheva */}
          {!hideColorSelector && (
            <div className="mb-10">
              <div className="flex items-baseline justify-between gap-4 mb-4">
                <div>
                  <h3 className="eyebrow">{selectorTitle}</h3>
                  <p className="text-[13px] text-ink-500 mt-1">{colorsCountLabel} {selectorCountLabel}</p>
                </div>
                <button
                  type="button"
                  ref={colorsModalTriggerRef}
                  onClick={() => setIsColorsModalOpen(true)}
                  className="btn-link whitespace-nowrap"
                >
                  Pogledaj sve →
                </button>
              </div>
              <ColorGrid
                collectionSlug={collectionSlug}
                onColorSelect={handleColorSelect}
                compact={true}
                limit={12}
                onColorsLoaded={setColorsCount}
                initialColorSlug={initialColorSlug}
                selectedColorSlug={selectedColorSlug}
                customColors={customColors}
                apiCategory={apiCategory}
                uiMode={uiMode}
              />
            </div>
          )}

          {/* Dostupne podloge */}
          {(() => {
            const backingVariants = activeCustomColor?.backing_variants;

            if (backingVariants && Array.isArray(backingVariants) && backingVariants.length > 0) {
              return (
                <div className="mb-8">
                  <p className="eyebrow mb-3">Dostupne podloge</p>
                  <div className="flex flex-wrap gap-2">
                    {backingVariants.map((variant: string) => (
                      <span key={variant} className="px-3 py-1 border border-ink-200 text-ink-900 text-[13px]">{variant}</span>
                    ))}
                  </div>
                </div>
              );
            }
            return null;
          })()}

          {/* Accessory: Welding Rod */}
          {(() => {
            const selectedWeldingCharacteristic = selectedCharacteristics
              ? Object.entries(selectedCharacteristics).find(([label]) =>
                /(elektrod|varila|welding|vrpca)/i.test(label)
              )
              : null;

            const weldingRodSpec = specs?.find(s =>
              /(welding|varil|vrpca|elektrod)/i.test(s.key) ||
              /(varilačk|welding|elektrod|vrpca)/i.test(s.label)
            );
            const weldingLabel = selectedWeldingCharacteristic?.[0] || weldingRodSpec?.label || 'Elektroda za varenje';
            const weldingValue = selectedWeldingCharacteristic?.[1] || weldingRodSpec?.value || '';

            if (weldingValue && weldingValue.trim() !== '' && weldingValue.trim() !== '-') {
              return (
                <div className="mb-8">
                  <p className="eyebrow mb-2">Dodatna oprema</p>
                  <div className="flex justify-between border-b border-ink-200 py-[9px] text-[13px]">
                    <span className="text-ink-500">{weldingLabel}</span>
                    <span className="text-ink-900 text-right">{weldingValue}</span>
                  </div>
                </div>
              );
            }
            return null;
          })()}

          {/* CTA - Pošaljite upit – prefill: proizvod + boja + ref */}
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

              if (activeColorContext?.name) {
                let variantName = activeColorContext.name;
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

              return `/upiti?${params.toString()}`;
            })()}
            className="btn-primary block w-full text-center min-h-[44px]"
          >
            Pošaljite upit
          </a>

          {/* Link na sajt proizvođača / izvorni katalog */}
          {externalLink && (
            <div className="mt-6">
              <a
                href={externalLink}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-link"
              >
                {externalLinkLabel} →
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Ispod prvog reda: Video Embed (if available) */}
      {videoEmbedUrl && (
        <div className="w-full mb-12">
          <div className="w-full max-w-4xl mx-auto aspect-video overflow-hidden bg-paper">
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

      {isColorsModalOpen && (
        <div className="fixed inset-0 z-[60]">
          <div
            className="absolute inset-0 bg-ink-900/60"
            aria-hidden="true"
            onClick={() => setIsColorsModalOpen(false)}
          ></div>
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`${selectorAllTitle} kolekcije`}
            className="relative mx-auto mt-8 w-[92%] max-w-5xl bg-white overflow-hidden max-h-[90vh] flex flex-col"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-ink-200">
              <h3 className="text-[15px] font-medium text-ink-900">
                {selectorAllTitle} ({colorsCountLabel})
              </h3>
              <button
                type="button"
                ref={colorsModalCloseButtonRef}
                onClick={() => setIsColorsModalOpen(false)}
                className="flex min-h-[44px] min-w-[44px] items-center justify-center text-ink-500 hover:text-ink-900"
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
                apiCategory={apiCategory}
                uiMode={uiMode}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
