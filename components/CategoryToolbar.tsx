import Link from 'next/link';
import CategorySortSelect from '@/components/CategorySortSelect';

/**
 * FILTERI 2.0 — Faza 1: toolbar red iznad grida kategorije.
 * Server komponenta bez klijentskog state-a: levo broj rezultata, desno
 * "Sortiraj:" select (klijentski child), ispod red čipova aktivnih filtera.
 * Čisti util-i (sort + gradnja URL-a čipa) žive ovde da bi ih contract test
 * (tests/contracts/category-toolbar-contract.test.ts) i page.tsx delili.
 */

export type CategorySortMode = 'preporuceno' | 'naziv' | 'cena' | 'najnovije';

/**
 * ?sort= validacija: nepoznata vrednost pada na 'preporuceno' (postojeći
 * redosled), a 'cena' je dozvoljena SAMO kad bar jedan proizvod ima cenu —
 * u suprotnom bi sort opcija bez efekta zbunjivala.
 */
export function resolveCategorySortMode(raw: string | undefined | null, hasPrices: boolean): CategorySortMode {
  if (raw === 'naziv' || raw === 'najnovije') return raw;
  if (raw === 'cena' && hasPrices) return 'cena';
  return 'preporuceno';
}

export interface SortableCategoryProduct {
  name: string;
  price?: number | null;
  createdAt?: Date | string | null;
}

function getSortablePrice(product: SortableCategoryProduct): number | null {
  return typeof product.price === 'number' && Number.isFinite(product.price) && product.price > 0
    ? product.price
    : null;
}

function getCreatedAtTime(value: Date | string | null | undefined): number {
  if (!value) return 0;
  const time = value instanceof Date ? value.getTime() : new Date(value).getTime();
  return Number.isFinite(time) ? time : 0;
}

/**
 * Server-side sortiranje listinga kategorije.
 * 'preporuceno' vraća ulazni redosled; ostali modovi sortiraju kopiju (stabilno):
 * 'naziv' = localeCompare srpska latinica, 'cena' = rastuće sa proizvodima bez cene
 * na kraju, 'najnovije' = createdAt opadajuće (nepoznat datum ide na kraj).
 *
 * `getName` dozvoljava sort po PRIKAZNOM imenu — deo proizvoda u bazi nosi brend
 * prefiks u name ("Gerflor Creation 30"), a kartice ga skidaju, pa bi sort po sirovom
 * imenu izgledao pogrešno korisniku.
 */
export function sortCategoryProducts<T extends SortableCategoryProduct>(
  products: T[],
  mode: CategorySortMode,
  getName: (product: T) => string = (product) => product.name || ''
): T[] {
  if (mode === 'preporuceno') return products;

  const sorted = [...products];
  if (mode === 'naziv') {
    // 'sr-Latn': sajt je na srpskoj latinici — golo 'sr' u Node ICU pada na ćiriličku
    // kolaciju gde su Š/S primarno jednaki pa bi redosled bio pogrešan (Šampanj pre Sene).
    sorted.sort((a, b) => getName(a).localeCompare(getName(b), 'sr-Latn'));
  } else if (mode === 'cena') {
    sorted.sort((a, b) => {
      const priceA = getSortablePrice(a);
      const priceB = getSortablePrice(b);
      if (priceA === null && priceB === null) return 0;
      if (priceA === null) return 1;
      if (priceB === null) return -1;
      return priceA - priceB;
    });
  } else if (mode === 'najnovije') {
    sorted.sort((a, b) => getCreatedAtTime(b.createdAt) - getCreatedAtTime(a.createdAt));
  }
  return sorted;
}

export type CategoryFilterParams = Record<string, string | undefined>;

/**
 * Ukloni JEDNU vrednost iz (potencijalno viševrednosnog, zapetom razdvojenog)
 * URL parametra. Bez `value` briše ceo parametar; kad posle uklanjanja ne
 * ostane nijedna vrednost, parametar se briše umesto da ostane prazan.
 */
export function removeFilterValue(params: CategoryFilterParams, key: string, value?: string): CategoryFilterParams {
  const next: CategoryFilterParams = { ...params };
  if (value === undefined) {
    delete next[key];
    return next;
  }

  const remaining = (next[key] || '')
    .split(',')
    .map((token) => token.trim())
    .filter(Boolean)
    .filter((token) => token !== value);

  if (remaining.length > 0) {
    next[key] = remaining.join(',');
  } else {
    delete next[key];
  }
  return next;
}

/** Query string iz param zapisa: prazne/undefined vrednosti se preskaču; '' kad nema ničega. */
export function buildCategoryQueryString(params: CategoryFilterParams): string {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') {
      searchParams.set(key, value);
    }
  }
  const query = searchParams.toString();
  return query ? `?${query}` : '';
}

/** Href čipa: isti URL sa uklonjenom TOM vrednošću filtera (ostali parametri, uključujući sort, preživljavaju). */
export function buildFilterRemovalHref(
  basePath: string,
  params: CategoryFilterParams,
  key: string,
  value?: string
): string {
  return `${basePath}${buildCategoryQueryString(removeFilterValue(params, key, value))}`;
}

export interface ActiveFilterChip {
  key: string;
  label: string;
  href: string;
}

interface CategoryToolbarProps {
  resultsLabel: string;
  sortMode: CategorySortMode;
  hasPriceSort: boolean;
  chips: ActiveFilterChip[];
  clearAllHref: string;
}

export default function CategoryToolbar({ resultsLabel, sortMode, hasPriceSort, chips, clearAllHref }: CategoryToolbarProps) {
  return (
    <div className="mb-6 border-b border-ink-200 pb-4">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
        <p className="text-[13px] text-ink-500">{resultsLabel}</p>
        <CategorySortSelect sortMode={sortMode} hasPriceSort={hasPriceSort} />
      </div>

      {chips.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {chips.map((chip) => (
            <Link
              key={chip.key}
              href={chip.href}
              scroll={false}
              aria-label={`Ukloni filter: ${chip.label}`}
              className="inline-flex items-center gap-2 border border-ink-200 bg-white px-3 py-1 text-[12px] text-ink-600 transition-colors hover:border-ink-400 hover:text-ink-900"
            >
              <span>{chip.label}</span>
              <span aria-hidden="true">×</span>
            </Link>
          ))}
          <Link
            href={clearAllHref}
            scroll={false}
            className="px-1 text-[12px] text-ink-500 transition-colors hover:text-ink-900"
          >
            Očisti sve
          </Link>
        </div>
      )}
    </div>
  );
}
