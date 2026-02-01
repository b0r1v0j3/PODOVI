'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';

interface ProductInquiryStickyCTAProps {
  productSlug: string;
  inquiryRef?: string;
}

/** Sticky CTA na mobilnom: "Pošalji upit" donji bar – vodi na kontakt sa prefill (product, color, ref). */
export default function ProductInquiryStickyCTA({ productSlug, inquiryRef }: ProductInquiryStickyCTAProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const color = searchParams.get('color') || '';

  const params = new URLSearchParams();
  params.set('product', productSlug);
  if (color) params.set('color', color);
  if (inquiryRef) params.set('ref', inquiryRef);
  const href = `/kontakt?${params.toString()}`;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] safe-area-pb">
      <div className="container py-3 px-4">
        <Link
          href={href}
          className="btn bg-primary-600 text-white hover:bg-primary-700 text-center text-base font-semibold w-full py-3 rounded-xl block"
        >
          Pošalji upit
        </Link>
      </div>
    </div>
  );
}
