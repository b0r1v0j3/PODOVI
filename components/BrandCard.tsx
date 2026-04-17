import Image from 'next/image';
import Link from 'next/link';
import { Brand } from '@/types';
import { shouldBypassNextImageOptimization } from '@/lib/utils/image-runtime';

interface BrandCardProps {
  brand: Brand;
  productCount?: number;
}

function getWebsiteLabel(url?: string): string | null {
  if (!url) return null;

  try {
    return new URL(url).hostname.replace(/^www\./i, '');
  } catch {
    return null;
  }
}

export default function BrandCard({ brand, productCount }: BrandCardProps) {
  const brandHref = `/brendovi/${brand.slug}`;
  const hasBrandLogo = Boolean(brand.logo && brand.logo !== '/images/placeholder.svg');
  const websiteLabel = getWebsiteLabel(brand.website);

  return (
    <article className="group card card-hover h-full rounded-[1.25rem] overflow-hidden border border-gray-100 bg-white">
      <div className="h-1 bg-gradient-to-r from-primary-500 to-primary-700"></div>

      <Link
        href={brandHref}
        className="block focus:outline-none focus-visible:ring-4 focus-visible:ring-primary-100"
      >
        <div className="relative h-48 overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 p-8">
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23000' fill-opacity='1'%3E%3Ccircle cx='1' cy='1' r='1'/%3E%3C/g%3E%3C/svg%3E")`,
            }}
          ></div>

          {brand.countryOfOrigin ? (
            <span className="absolute right-4 top-4 z-10 inline-flex items-center rounded-full border border-white/70 bg-white/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500 shadow-sm">
              {brand.countryOfOrigin}
            </span>
          ) : null}

          <div className="relative z-10 flex h-full flex-col items-center justify-center text-center">
            {hasBrandLogo ? (
              <div className="relative mb-4 flex h-24 w-40 items-center justify-center rounded-2xl bg-white/90 p-4 shadow-lg transition-all duration-300 group-hover:scale-[1.03] group-hover:shadow-xl">
                <Image
                  src={brand.logo}
                  alt={`${brand.name} logo`}
                  fill
                  className="object-contain p-4"
                  sizes="160px"
                  unoptimized={shouldBypassNextImageOptimization(brand.logo)}
                />
              </div>
            ) : (
              <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 shadow-lg transition-all duration-300 group-hover:scale-105 group-hover:rotate-3 group-hover:shadow-xl">
                <span className="text-2xl font-bold text-white">
                  {brand.name.charAt(0)}
                </span>
              </div>
            )}

            <h2 className="text-xl font-bold text-gray-900 transition-colors duration-300 group-hover:text-primary-600">
              {brand.name}
            </h2>
            {productCount !== undefined ? (
              <p className="mt-2 text-sm font-medium text-gray-500">
                {productCount} proizvoda u katalogu
              </p>
            ) : null}
          </div>
        </div>

        <div className="p-6">
          <p className="text-sm leading-relaxed text-gray-600">
            {brand.description}
          </p>
          {websiteLabel ? (
            <p className="mt-4 text-xs font-medium uppercase tracking-[0.16em] text-gray-400">
              {websiteLabel}
            </p>
          ) : null}
        </div>
      </Link>

      <div className="flex items-center gap-3 border-t border-gray-100 px-6 pb-6 pt-4">
        <Link
          href={brandHref}
          className="inline-flex items-center text-sm font-semibold text-primary-600 transition-colors hover:text-primary-700"
        >
          Pogledaj proizvode
          <svg className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
        {brand.website ? (
          <a
            href={brand.website}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto inline-flex items-center text-xs font-medium text-gray-400 transition-colors hover:text-gray-600"
          >
            Zvanični sajt
            <svg className="ml-1 h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        ) : null}
      </div>
    </article>
  );
}
