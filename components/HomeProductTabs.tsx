'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Brand, Category, Product } from '@/types';
import ProductCardClient from '@/components/ProductCardClient';

const INITIAL_PRODUCT_LIMIT = 12;

export interface HomeProductGroup {
  category: Pick<Category, 'id' | 'name' | 'slug'>;
  products: Product[];
  totalCount: number;
}

interface HomeProductTabsProps {
  groups: HomeProductGroup[];
  brandsRecord: Record<string, Brand>;
}

function buildAllProducts(groups: HomeProductGroup[], limit = 12): Product[] {
  const products: Product[] = [];
  const seen = new Set<string>();
  let index = 0;

  while (products.length < limit) {
    let addedInRound = false;

    for (const group of groups) {
      const product = group.products[index];
      if (!product || seen.has(product.slug)) {
        continue;
      }

      products.push(product);
      seen.add(product.slug);
      addedInRound = true;

      if (products.length >= limit) {
        break;
      }
    }

    if (!addedInRound) {
      break;
    }

    index += 1;
  }

  return products;
}

export default function HomeProductTabs({ groups, brandsRecord }: HomeProductTabsProps) {
  const [activeSlug, setActiveSlug] = useState('sve');

  const initialAllProducts = useMemo(() => buildAllProducts(groups, INITIAL_PRODUCT_LIMIT), [groups]);
  const expandedAllProducts = useMemo(() => buildAllProducts(groups, Number.POSITIVE_INFINITY), [groups]);
  const activeGroup = groups.find((group) => group.category.slug === activeSlug);
  const activeProducts = activeSlug === 'sve'
    ? initialAllProducts
    : (activeGroup?.products || []).slice(0, INITIAL_PRODUCT_LIMIT);
  const activeName = activeSlug === 'sve' ? 'Sve' : activeGroup?.category.name || 'Sve';
  const activeTotal = activeSlug === 'sve'
    ? expandedAllProducts.length
    : activeGroup?.totalCount || activeProducts.length;
  const canOpenCategoryPage = Boolean(activeGroup);
  const categoryButtonClass = 'shrink-0 text-[1.65rem] font-semibold leading-none tracking-normal transition-colors sm:text-[2rem] md:text-[2.35rem] lg:text-[2.65rem]';

  return (
    <section className="bg-white">
      <div className="container">
        <h1 className="sr-only">Podovi.online katalog proizvoda</h1>

        <div className="overflow-hidden border-b border-[#1D1D1F]">
          <div className="no-scrollbar -mx-6 flex gap-3 overflow-x-auto px-6 pb-4 pt-6 sm:gap-4 md:pt-8 lg:gap-5">
            <button
              type="button"
              onClick={() => setActiveSlug('sve')}
              aria-pressed={activeSlug === 'sve'}
              className={`${categoryButtonClass} ${
                activeSlug === 'sve' ? 'text-[#050505]' : 'text-[#A8A8A8] hover:text-[#555555]'
              }`}
            >
              Sve
            </button>

            {groups.map((group) => {
              const active = activeSlug === group.category.slug;

              return (
                <button
                  key={group.category.slug}
                  type="button"
                  onClick={() => setActiveSlug(group.category.slug)}
                  aria-pressed={active}
                  className={`${categoryButtonClass} ${
                    active ? 'text-[#050505]' : 'text-[#A8A8A8] hover:text-[#555555]'
                  }`}
                >
                  {group.category.name}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-3 border-b border-[#1D1D1F] py-5 text-[13px] font-semibold uppercase tracking-normal text-[#1D1D1F] sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span>{activeName}</span>
            <span className="text-[#8A8A8A]">
              {activeProducts.length} prikazano{activeTotal > activeProducts.length ? ` od ${activeTotal}` : ''}
            </span>
          </div>
          {canOpenCategoryPage && activeGroup ? (
            <Link
              href={`/kategorije/${activeGroup.category.slug}`}
              className="inline-flex w-fit items-center text-[#1D1D1F] transition-colors hover:text-primary-600"
            >
              Pogledaj sve
              <svg className="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          ) : null}
        </div>

        {activeProducts.length > 0 ? (
          <div className="grid grid-cols-1 gap-5 py-6 sm:grid-cols-2 lg:grid-cols-3">
            {activeProducts.map((product) => (
              <ProductCardClient
                key={`${activeSlug}-${product.id}`}
                product={product}
                brand={brandsRecord[product.brandId] || null}
              />
            ))}
          </div>
        ) : (
          <div className="py-16 text-center">
            <p className="text-base font-medium text-[#1D1D1F]">Trenutno nema proizvoda za ovu kategoriju.</p>
          </div>
        )}
      </div>
    </section>
  );
}
