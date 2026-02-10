'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';

interface ProductImageProps {
  src: string;
  alt: string;
  className?: string;
  sizes?: string;
  quality?: number;
  /** Samo za glavnu (hero) sliku na stranici – poboljšava LCP. Thumbnails nemaju priority. */
  priority?: boolean;
}

export default function ProductImage({ src, alt, className, sizes, quality = 90, priority = false }: ProductImageProps) {
  const [hasError, setHasError] = useState(false);
  // displayedSrc = the image currently visible to the user
  const [displayedSrc, setDisplayedSrc] = useState(src);
  // pendingSrc = a new image loading in the background (null if nothing is loading)
  const [pendingSrc, setPendingSrc] = useState<string | null>(null);

  // When src prop changes, start loading the new image in the background
  useEffect(() => {
    if (src !== displayedSrc && src !== pendingSrc) {
      setPendingSrc(src);
      setHasError(false);
    }
  }, [src, displayedSrc, pendingSrc]);

  // Called when the hidden (pending) image finishes loading
  const handlePendingLoad = useCallback(() => {
    // Swap: the pending image becomes the displayed image
    setDisplayedSrc(pendingSrc!);
    setPendingSrc(null);
  }, [pendingSrc]);

  // Za placeholder ili nakon greške koristimo običan img da ne zahtevamo Next/Image optimizaciju
  if (hasError || !src) {
    return (
      <div className="flex items-center justify-center bg-gray-50 h-full w-full absolute inset-0">
        <svg className="w-16 h-16 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
    );
  }

  return (
    <>
      {/* Currently displayed image - always visible, stable */}
      <Image
        src={displayedSrc}
        alt={alt}
        fill
        className={`${className || ''}`}
        style={{ objectFit: 'cover', zIndex: 1 }}
        sizes={sizes ?? '(max-width: 768px) 100vw, 50vw'}
        quality={quality}
        priority={priority}
        unoptimized={!displayedSrc.startsWith('/')}
        onError={() => setHasError(true)}
      />
      {/* New image loading invisibly in background - swaps in once loaded */}
      {pendingSrc && (
        <Image
          key={pendingSrc}
          src={pendingSrc}
          alt={alt}
          fill
          className={className}
          style={{ objectFit: 'cover', opacity: 0, zIndex: 2 }}
          sizes={sizes ?? '(max-width: 768px) 100vw, 50vw'}
          quality={quality}
          unoptimized={!pendingSrc.startsWith('/')}
          onLoad={handlePendingLoad}
          onError={() => setHasError(true)}
        />
      )}
    </>
  );
}
