'use client';

import { useState } from 'react';
import Image from 'next/image';

interface ProductImageProps {
  src: string;
  alt: string;
  className?: string;
  sizes?: string;
  quality?: number;
}

export default function ProductImage({ src, alt, className, sizes, quality = 100 }: ProductImageProps) {
  const [imgSrc, setImgSrc] = useState(src);
  const [hasError, setHasError] = useState(false);

  if (hasError || !imgSrc) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/placeholder.svg"
          alt={alt}
          className={className}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </div>
    );
  }

  return (
    <Image
      src={imgSrc}
      alt={alt}
      fill
      className={className}
      sizes={sizes}
      quality={quality}
      unoptimized
      onError={() => {
        setHasError(true);
        setImgSrc('/images/placeholder.svg');
      }}
    />
  );
}
