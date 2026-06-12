'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useCompare } from '@/lib/context/CompareContext';

interface ProductInquiryStickyCTAProps {
  productSlug: string;
  inquiryRef?: string;
}

/** Sticky CTA na mobilnom: "Pošalji upit" donji bar – vodi na upit sa prefill (product, color, ref). */
export default function ProductInquiryStickyCTA({ productSlug, inquiryRef }: ProductInquiryStickyCTAProps) {
  const pathname = usePathname();
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
    <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-ink-900 pb-[env(safe-area-inset-bottom)]">
      <Link
        href={href}
        className="flex min-h-[52px] w-full items-center justify-center text-white text-[13px] font-medium hover:bg-ink-700 transition-colors"
      >
        Pošalji upit
      </Link>
    </div>
  );
}
