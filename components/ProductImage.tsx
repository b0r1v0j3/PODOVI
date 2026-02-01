'use client';

import { useState } from 'react';
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
  const effectiveSrc = src && !hasError ? src : '/images/placeholder.svg';

  // Za placeholder ili nakon greške koristimo običan img da ne zahtevamo Next/Image optimizaciju
  if (hasError || !src) {
    return (
      <img
        src="/images/placeholder.svg"
        alt={alt}
        className={className}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
        }}
      />
    );
  }

  const isLocal = effectiveSrc.startsWith('/');

  return (
    <Image
      src={effectiveSrc}
      alt={alt}
      fill
      className={className}
      sizes={sizes ?? '(max-width: 768px) 100vw, 50vw'}
      quality={quality}
      priority={priority}
      unoptimized={!isLocal}
      onError={() => setHasError(true)}
      style={{ objectFit: 'cover' }}
    />
  );
}
