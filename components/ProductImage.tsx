'use client';

import { useState, useEffect, useRef } from 'react';
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
  const [isLoaded, setIsLoaded] = useState(false);
  const [displayedSrc, setDisplayedSrc] = useState(src);
  const previousSrcRef = useRef(src);

  // When src changes, keep old image visible until new one loads
  useEffect(() => {
    if (src !== previousSrcRef.current) {
      setIsLoaded(false); // Start loading new image
      setHasError(false);
      previousSrcRef.current = src;
    }
  }, [src]);

  // Update displayed src only after new image loads
  const handleLoad = () => {
    setIsLoaded(true);
    setDisplayedSrc(src); // Update to new image
  };

  const effectiveSrc = src && !hasError ? src : '/images/placeholder.svg';

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

  const isLocal = effectiveSrc.startsWith('/');

  return (
    <>
      {/* Current/Old image - stays visible */}
      <Image
        key={displayedSrc}
        src={displayedSrc}
        alt={alt}
        fill
        className={`${className || ''} transition-opacity duration-200`}
        style={{ objectFit: 'cover', opacity: isLoaded || displayedSrc === src ? 1 : 1 }}
        sizes={sizes ?? '(max-width: 768px) 100vw, 50vw'}
        quality={quality}
        priority={priority}
        unoptimized={!displayedSrc.startsWith('/')}
        onError={() => setHasError(true)}
      />
      {/* New image loading in background - hidden until loaded */}
      {src !== displayedSrc && (
        <Image
          key={src}
          src={src}
          alt={alt}
          fill
          className={className}
          style={{ objectFit: 'cover', opacity: 0 }}
          sizes={sizes ?? '(max-width: 768px) 100vw, 50vw'}
          quality={quality}
          unoptimized={!isLocal}
          onLoad={handleLoad}
          onError={() => setHasError(true)}
        />
      )}
    </>
  );
}
