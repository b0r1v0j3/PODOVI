'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';

interface ProductInquiryStickyCTAProps {
  productSlug: string;
  inquiryRef?: string;
}

/** Sticky CTA na mobilnom: "Pošalji upit" donji bar – vodi na upit sa prefill (product, color, ref). */
export default function ProductInquiryStickyCTA({ productSlug, inquiryRef }: ProductInquiryStickyCTAProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const color = searchParams.get('color') || '';

  const params = new URLSearchParams();
  params.set('product', productSlug);
  if (color) params.set('color', color);
  if (inquiryRef) params.set('ref', inquiryRef);
  const href = `/upiti?${params.toString()}`;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white/90 backdrop-blur-md border-t border-gray-100 shadow-[0_-8px_16px_rgba(0,0,0,0.08)] safe-area-pb">
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
