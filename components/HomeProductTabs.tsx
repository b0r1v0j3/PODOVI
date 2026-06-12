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
  const categoryButtonClass = 'shrink-0 border-b-2 pb-2 text-[1.65rem] font-normal leading-none tracking-normal transition-colors sm:text-[2rem] md:text-[2.35rem] lg:text-[2.65rem]';

  return (
    <section className="bg-white">
      <div className="container">
        <h1 className="sr-only">Podovi.online katalog proizvoda</h1>

        <div className="overflow-hidden border-b border-ink-200">
          <div className="no-scrollbar -mx-6 flex gap-4 overflow-x-auto px-6 pb-4 pt-6 sm:gap-5 md:pt-8 lg:gap-6">
            <button
              type="button"
              onClick={() => setActiveSlug('sve')}
              aria-pressed={activeSlug === 'sve'}
              className={`${categoryButtonClass} ${
                activeSlug === 'sve' ? 'border-ink-900 text-ink-900' : 'border-transparent text-ink-400 hover:text-ink-600'
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
                    active ? 'border-ink-900 text-ink-900' : 'border-transparent text-ink-400 hover:text-ink-600'
                  }`}
                >
                  {group.category.name}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-3 border-b border-ink-200 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="eyebrow">{activeName}</span>
            <span className="eyebrow">
              {activeProducts.length} prikazano{activeTotal > activeProducts.length ? ` od ${activeTotal}` : ''}
            </span>
          </div>
          {canOpenCategoryPage && activeGroup ? (
            <Link
              href={`/kategorije/${activeGroup.category.slug}`}
              className="btn-link inline-flex w-fit items-center"
            >
              Pogledaj sve →
            </Link>
          ) : null}
        </div>

        {activeProducts.length > 0 ? (
          <div className="grid grid-cols-2 gap-x-5 gap-y-10 py-8 md:grid-cols-3 xl:grid-cols-4">
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
            <p className="text-base font-normal text-ink-600">Trenutno nema proizvoda za ovu kategoriju.</p>
          </div>
        )}
      </div>
    </section>
  );
}
