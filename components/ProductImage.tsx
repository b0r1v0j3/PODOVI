'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { shouldBypassNextImageOptimization } from '@/lib/utils/image-runtime';
import { normalizeProductImageCandidates } from '@/lib/utils/product-images';

interface ProductImageProps {
  src?: string;
  alt?: string;
  sources?: Array<{ url: string; alt?: string }>;
  className?: string;
  sizes?: string;
  quality?: number;
  /** Samo za glavnu (hero) sliku na stranici – poboljšava LCP. Thumbnails nemaju priority. */
  priority?: boolean;
}

export default function ProductImage({
  src,
  alt,
  sources,
  className,
  sizes,
  quality = 90,
  priority = false,
}: ProductImageProps) {
  const sourceCandidates = useMemo(
    () => normalizeProductImageCandidates(src ? { url: src, alt } : null, sources),
    [src, alt, sources]
  );
  const candidateSignature = useMemo(
    () => sourceCandidates.map((candidate) => `${candidate.url}::${candidate.alt}`).join('|'),
    [sourceCandidates]
  );
  const [sourceIndex, setSourceIndex] = useState(0);
  const [isExhausted, setIsExhausted] = useState(false);

  useEffect(() => {
    setSourceIndex(0);
    setIsExhausted(false);
  }, [candidateSignature]);

  const activeSource = !isExhausted ? sourceCandidates[sourceIndex] : null;

  const handleError = () => {
    const nextSourceIndex = sourceIndex + 1;

    if (nextSourceIndex < sourceCandidates.length) {
      setSourceIndex(nextSourceIndex);
      return;
    }

    setIsExhausted(true);
  };

  if (!activeSource) {
    return (
      <div className="flex items-center justify-center bg-gray-50 h-full w-full absolute inset-0">
        <svg className="w-16 h-16 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
    );
  }

  return (
    <Image
      key={activeSource.url}
      src={activeSource.url}
      alt={activeSource.alt || alt || ''}
      fill
      className={`object-cover ${className || ''}`}
      sizes={sizes ?? '(max-width: 768px) 100vw, 50vw'}
      quality={quality}
      priority={priority}
      unoptimized={shouldBypassNextImageOptimization(activeSource.url)}
      onError={handleError}
    />
  );
}
