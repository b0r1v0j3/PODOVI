'use client';

import { useState } from 'react';

interface ProductImageProps {
  src: string;
  alt: string;
  className?: string;
  sizes?: string;
  quality?: number;
}

export default function ProductImage({ src, alt, className, sizes, quality }: ProductImageProps) {
  const [imgSrc, setImgSrc] = useState(src);

  return (
    <img
      src={imgSrc || '/images/placeholder.svg'}
      alt={alt}
      className={className}
      style={{ 
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        objectFit: 'cover'
      }}
      onError={() => setImgSrc('/images/placeholder.svg')}
    />
  );
}
