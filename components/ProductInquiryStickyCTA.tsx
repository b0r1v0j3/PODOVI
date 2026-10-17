'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useCompare } from '@/lib/context/CompareContext';

interface ProductInquiryStickyCTAProps {
  productSlug: string;
  inquiryRef?: string;
}

/** Sticky CTA na mobilnom: "Pošalji upit" donji bar – vodi na upit sa prefill (product, color, ref). */
export default function ProductInquiryStickyCTA({ productSlug, inquiryRef }: ProductInquiryStickyCTAProps) {
  const searchParams = useSearchParams();
  const { compareItems } = useCompare();
  const color = searchParams.get('color') || '';

  // CompareBar ima prednost na dnu ekrana (oba su bottom-0 z-40) — dok postoje
  // proizvodi za poređenje, sticky CTA se ne prikazuje.
  if (compareItems.length > 0) return null;

  const params = new URLSearchParams();
  params.set('product', productSlug);
  if (color) params.set('color', color);
  if (inquiryRef) params.set('ref', inquiryRef);
  const href = `/upiti?${params.toString()}`;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden flex border-t border-ink-200 bg-white pb-[env(safe-area-inset-bottom)]">
      <Link
        href={href}
        className="flex min-h-[52px] w-1/2 items-center justify-center text-ink-900 text-[13px] font-medium hover:bg-ink-100 transition-colors"
      >
        Pošalji upit
      </Link>
      <a href="#product-order" className="flex min-h-[52px] w-1/2 items-center justify-center bg-ink-900 text-white text-[13px] font-medium hover:bg-ink-700">Količina i korpa</a>
    </div>
  );
}
