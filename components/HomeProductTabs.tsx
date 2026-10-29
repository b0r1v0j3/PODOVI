'use client';

import Link from 'next/link';
import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { Brand, Category } from '@/types';
import ProductCardClient from '@/components/ProductCardClient';
import HomeFilterPanel, { CheckIcon } from '@/components/HomeFilterPanel';
import { useScrollLock } from '@/components/useScrollLock';
import {
  hasPricedProducts,
  sortHomepageProducts,
  type HomepageSortMode,
} from '@/lib/catalog/home-filter-utils';
import {
  parseHomeFilterSelection,
  serializeHomeFilterSelection,
  type HomeFilterTab,
} from '@/lib/catalog/home-filter-url';
import { OPEN_HOME_FILTERS_EVENT } from '@/lib/catalog/home-filter-events';
import type { HomeFacetSchemaEntry } from '@/lib/catalog/home-facet-schema';
import type { HomeCatalogItem } from '@/lib/catalog/home-catalog-index';
import {
  EMPTY_HOME_SELECTION,
  countHomeSelection,
  evaluateHomeFilters,
  collectHomePresentValues,
  pruneHomeSelection,
  removeHomeChip,
  sanitizeHomeSelection,
  setHomeRange,
  toggleHomeListValue,
  type HomeFilterSelection,
  type HomeRangeSelection,
} from '@/lib/catalog/home-filter-engine';

const INITIAL_PRODUCT_LIMIT = 12;
/** Prve kartice taba Kolekcije su LCP — slike se traže odmah. */
const PRIORITY_CARD_COUNT = 4;

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  vinil: 'Profesionalni homogeni i heterogeni vinil podovi za stambene i komercijalne prostore.',
  parket: 'Prirodni drveni podovi i kolekcije parketa za stambene i reprezentativne prostore.',
  lvt: 'LVT kolekcije za prostore kojima trebaju postojan dizajn, laka ugradnja i jednostavno održavanje.',
  'tekstilne-ploce': 'Tekstilne ploče za kancelarije, hotele i komercijalne enterijere sa modularnom ugradnjom.',
  deking: 'Spoljašnje podne obloge, WPC deking i prateći sistemi za terase i eksterijere.',
  laminat: 'Laminat kolekcije sa dekorima drveta za brzo i praktično opremanje enterijera.',
  linoleum: 'Linoleum podovi od prirodnih materijala za škole, zdravstvo i javne objekte.',
};

export interface HomeProductGroup {
  category: Pick<Category, 'id' | 'name' | 'slug'>;
  /** Sažete stavke (lib/catalog/home-catalog-index.ts) — ne puni proizvodi. */
  products: HomeCatalogItem[];
  totalCount: number;
  colorCount?: number;
}

interface HomeProductTabsProps {
  groups: HomeProductGroup[];
  brandsRecord: Record<string, Brand>;
  facetSchema: HomeFacetSchemaEntry[];
}

function ArrowRightIcon({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CloseIcon({ className }: { className: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function SlidersIcon({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 7h10M18 7h2M4 17h4M12 17h8M14 4v6M8 14v6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

// 1 rezultat / 2 rezultata / 5 rezultata (mobilno dugme "Prikaži N rezultata").
function pluralizeResults(count: number): string {
  return count % 10 === 1 && count % 100 !== 11 ? 'rezultat' : 'rezultata';
}

// 1 kolekcija / 3 kolekcije / 5 kolekcija; 1 boja / 3 boje / 5 boja.
function pluralizeItems(count: number, tab: HomeFilterTab, flatOnly: boolean): string {
  const lastTwo = count % 100;
  const last = count % 10;
  const few = last >= 2 && last <= 4 && (lastTwo < 12 || lastTwo > 14);
  if (tab === 'colors') return few ? 'boje' : 'boja';
  if (flatOnly) return last === 1 && lastTwo !== 11 ? 'proizvod' : 'proizvoda';
  if (last === 1 && lastTwo !== 11) return 'kolekcija';
  return few ? 'kolekcije' : 'kolekcija';
}

function dedupeItemsBySlug(items: HomeCatalogItem[]): HomeCatalogItem[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (!item.slug || seen.has(item.slug)) return false;
    seen.add(item.slug);
    return true;
  });
}

function getNextProductRowSize(): number {
  if (typeof window === 'undefined') return 4;
  if (window.matchMedia('(min-width: 1280px)').matches) return 4;
  if (window.matchMedia('(min-width: 768px)').matches) return 3;
  return 2;
}

function sameSelection(a: HomeFilterSelection, b: HomeFilterSelection): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

export default function HomeProductTabs({ groups, brandsRecord, facetSchema }: HomeProductTabsProps) {
  const [selection, setSelection] = useState<HomeFilterSelection>(EMPTY_HOME_SELECTION);
  const [sortMode, setSortMode] = useState<HomepageSortMode>('featured');
  const [activeProductTab, setActiveProductTab] = useState<HomeFilterTab>('collections');
  const [visibleProductCount, setVisibleProductCount] = useState(INITIAL_PRODUCT_LIMIT);
  const [loadedColorGroups, setLoadedColorGroups] = useState<Record<string, HomeCatalogItem[]>>({});
  const [colorLoadError, setColorLoadError] = useState<string | null>(null);
  const [colorLoadAttempt, setColorLoadAttempt] = useState(0);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  // Stanje iz URL-a je primenjeno (strana je statička, pa se URL čita posle montiranja).
  const [urlApplied, setUrlApplied] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const hasUserScrolledRef = useRef(false);
  const drawerCloseButtonRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const drawerReturnFocusRef = useRef<HTMLElement | null>(null);
  const applyingHistoryRef = useRef(false);
  const historyModeRef = useRef<'push' | 'replace'>('push');

  const categories = useMemo(
    () => groups.map((group) => ({ slug: group.category.slug, name: group.category.name })),
    [groups],
  );
  const brandNames = useMemo(
    () => Object.fromEntries(Object.values(brandsRecord).map((brand) => [brand.id, brand.name])),
    [brandsRecord],
  );
  const brandIds = useMemo(() => new Set(Object.keys(brandsRecord)), [brandsRecord]);

  const selectedCategorySlugs = useMemo(() => selection.lists.category || [], [selection.lists.category]);
  const selectedGroups = useMemo(
    () => groups.filter((group) => selectedCategorySlugs.includes(group.category.slug)),
    [groups, selectedCategorySlugs],
  );
  const tabGroups = selectedCategorySlugs.length > 0 ? selectedGroups : groups;

  // ===== Podaci po tabu =====
  const collectionItems = useMemo(() => dedupeItemsBySlug(groups.flatMap((group) => group.products)), [groups]);
  const colorCategoryIds = useMemo(
    () => tabGroups.filter((group) => (group.colorCount || 0) > 0).map((group) => group.category.id),
    [tabGroups],
  );
  const missingColorCategoryIds = useMemo(
    () => colorCategoryIds.filter((categoryId) => !loadedColorGroups[categoryId]),
    [colorCategoryIds, loadedColorGroups],
  );
  const missingColorCategoryIdsKey = missingColorCategoryIds.join(',');
  const colorItems = useMemo(
    () => dedupeItemsBySlug(groups.flatMap((group) => loadedColorGroups[group.category.id] || [])),
    [groups, loadedColorGroups],
  );
  const colorFallbackCounts = useMemo(() => Object.fromEntries(
    groups
      .filter((group) => !loadedColorGroups[group.category.id])
      .map((group) => [group.category.slug, group.colorCount || 0]),
  ), [groups, loadedColorGroups]);

  useEffect(() => {
    if (activeProductTab !== 'colors') return;
    if (!missingColorCategoryIdsKey) {
      setColorLoadError(null);
      return;
    }

    let cancelled = false;
    setColorLoadError(null);

    fetch(`/api/home-colors?categoryIds=${encodeURIComponent(missingColorCategoryIdsKey)}`)
      .then(async (response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json() as Promise<{ groups?: Array<{ categoryId: string; products: HomeCatalogItem[] }> }>;
      })
      .then((payload) => {
        if (cancelled) return;
        setLoadedColorGroups((current) => {
          const next = { ...current };
          for (const group of payload.groups || []) next[group.categoryId] = group.products || [];
          for (const categoryId of missingColorCategoryIdsKey.split(',')) next[categoryId] ??= [];
          return next;
        });
      })
      .catch((error) => {
        if (!cancelled) setColorLoadError(error instanceof Error ? error.message : 'Boje nisu učitane');
      });

    return () => {
      cancelled = true;
    };
  }, [activeProductTab, colorLoadAttempt, missingColorCategoryIdsKey]);

  const isLoadingColors = activeProductTab === 'colors'
    && missingColorCategoryIds.length > 0
    && !colorLoadError;

  // ===== Filtriranje (jedan engine za rezultate, brojače i čipove) =====
  const collectionEvaluation = useMemo(() => evaluateHomeFilters(collectionItems, facetSchema, selection, {
    missing: 'exclude',
    categories,
    brandNames,
  }), [brandNames, categories, collectionItems, facetSchema, selection]);

  const colorEvaluation = useMemo(() => evaluateHomeFilters(colorItems, facetSchema, selection, {
    // Tab „Boje": boja bez podatka (ni nasleđenog) ostaje vidljiva — bolje lažno
    // uključena nego pogrešno sakrivena (postojeće pravilo kataloga).
    missing: 'include',
    categories,
    brandNames,
    categoryFallbackCounts: colorFallbackCounts,
    contextItems: collectionItems,
  }), [brandNames, categories, collectionItems, colorFallbackCounts, colorItems, facetSchema, selection]);

  const evaluation = activeProductTab === 'colors' ? colorEvaluation : collectionEvaluation;
  const tabItems = activeProductTab === 'colors' ? colorItems : collectionItems;
  const activeFilterCount = countHomeSelection(selection);
  // Dok boje nisu učitane, tačan broj postoji samo kad je jedini filter kategorija.
  const onlyCategoryFilters = activeFilterCount === selectedCategorySlugs.length;
  const colorResultsCount = missingColorCategoryIds.length === 0
    ? colorEvaluation.results.length
    : onlyCategoryFilters
      ? tabGroups.reduce((sum, group) => sum + (group.colorCount || 0), 0)
      : null;

  const filteredProducts = useMemo(
    () => sortHomepageProducts(evaluation.results, sortMode) as HomeCatalogItem[],
    [evaluation.results, sortMode],
  );
  const activeProductCount = filteredProducts.length;

  const canSortByPrice = useMemo(
    () => hasPricedProducts(tabItems.filter((item) => selectedCategorySlugs.length === 0 || selectedCategorySlugs.includes(item.categorySlug))),
    [selectedCategorySlugs, tabItems],
  );
  const activeTabDataReady = activeProductTab !== 'colors' || missingColorCategoryIds.length === 0;
  useEffect(() => {
    if (activeTabDataReady && sortMode === 'price' && !canSortByPrice) {
      historyModeRef.current = 'replace';
      setSortMode('featured');
    }
  }, [activeTabDataReady, canSortByPrice, sortMode]);

  // ===== URL stanje (strana je statička — URL se čita posle montiranja) =====
  const applyUrlState = useCallback((search: string) => {
    const parsed = parseHomeFilterSelection(search, facetSchema);
    applyingHistoryRef.current = true;
    setSelection(pruneHomeSelection(parsed.selection, facetSchema, collectionItems));
    setActiveProductTab(parsed.tab);
    setSortMode(parsed.sort);
    setUrlApplied(true);
  }, [collectionItems, facetSchema]);

  // Katalog je bio sakriven (inline skripta u app/page.tsx) dok se stanje iz linka ne primeni.
  useEffect(() => {
    if (urlApplied) document.documentElement.removeAttribute('data-home-filters');
  }, [urlApplied]);

  useEffect(() => {
    applyUrlState(window.location.search);

    const restoreFromHistory = () => {
      applyUrlState(window.location.search);
      setIsFilterDrawerOpen(false);
    };
    window.addEventListener('popstate', restoreFromHistory);
    return () => window.removeEventListener('popstate', restoreFromHistory);
  }, [applyUrlState]);

  useEffect(() => {
    // Pre primene linka stanje je još podrazumevano — upis bi obrisao parametre.
    if (!urlApplied) return;
    const params = serializeHomeFilterSelection({ selection, tab: activeProductTab, sort: sortMode }, facetSchema, window.location.search);
    const nextSearch = params.toString();
    const nextUrl = `${window.location.pathname}${nextSearch ? `?${nextSearch}` : ''}${window.location.hash}`;
    const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;

    // Prvo primenjivanje URL-a (ili Nazad/Napred) samo kanonizuje adresu.
    const mode = applyingHistoryRef.current ? 'replace' : historyModeRef.current;
    applyingHistoryRef.current = false;
    historyModeRef.current = 'push';

    if (nextUrl !== currentUrl) {
      if (mode === 'replace') {
        // Sačuvaj Next-ov history state umesto da ga obrišeš sa `null`.
        window.history.replaceState(window.history.state, '', nextUrl);
      } else {
        window.history.pushState(null, '', nextUrl);
      }
    }
  }, [activeProductTab, facetSchema, selection, sortMode, urlApplied]);

  // Fantomske vrednosti iz linka (nema ih u podacima) se odbacuju kad su podaci taba učitani.
  const tabPresentValues = useMemo(() => collectHomePresentValues(tabItems), [tabItems]);
  useEffect(() => {
    if (!activeTabDataReady) return;
    const sanitized = sanitizeHomeSelection(selection, facetSchema, tabPresentValues, categories, brandIds, collectionItems);
    if (!sameSelection(sanitized, selection)) {
      historyModeRef.current = 'replace';
      setSelection(sanitized);
    }
  }, [activeTabDataReady, brandIds, categories, collectionItems, facetSchema, selection, tabPresentValues]);

  // ===== Akcije =====
  const updateSelection = useCallback((update: (current: HomeFilterSelection) => HomeFilterSelection) => {
    // Sinhrono (klik je diskretan događaj): startTransition je na sporom telefonu
    // odlagao primenu i za ~0,6 s bez stvarnog posla na glavnoj niti.
    setSelection((current) => pruneHomeSelection(update(current), facetSchema, collectionItems));
  }, [collectionItems, facetSchema]);

  const handleToggle = useCallback((groupId: string, value: string) => {
    updateSelection((current) => toggleHomeListValue(current, groupId, value));
  }, [updateSelection]);

  const handleRangeChange = useCallback((groupId: string, range: HomeRangeSelection | null) => {
    updateSelection((current) => setHomeRange(current, groupId, range));
  }, [updateSelection]);

  const resetFilters = () => {
    setSelection(EMPTY_HOME_SELECTION);
    setSortMode('featured');
  };

  const removeLastFilter = () => {
    const last = evaluation.chips[evaluation.chips.length - 1];
    if (last) updateSelection((current) => removeHomeChip(current, last));
  };

  // ===== Fioka (telefon/tablet) =====
  useScrollLock(isFilterDrawerOpen);

  const openDrawer = useCallback(() => {
    drawerReturnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setIsFilterDrawerOpen(true);
  }, []);

  // Header na početnoj emituje događaj (mobilni trigger vizuelno pripada globalnom headeru).
  useEffect(() => {
    const openFilters = () => openDrawer();
    window.addEventListener(OPEN_HOME_FILTERS_EVENT, openFilters);
    return () => window.removeEventListener(OPEN_HOME_FILTERS_EVENT, openFilters);
  }, [openDrawer]);

  // Escape, pravi Tab focus-trap i povratak fokusa.
  useEffect(() => {
    if (!isFilterDrawerOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setIsFilterDrawerOpen(false);
        return;
      }

      if (event.key !== 'Tab' || !drawerRef.current) return;

      const focusable = Array.from(drawerRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
      )).filter((element) => element.offsetParent !== null);
      if (focusable.length === 0) {
        event.preventDefault();
        drawerRef.current.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    drawerCloseButtonRef.current?.focus();

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      const returnTarget = drawerReturnFocusRef.current;
      if (returnTarget?.isConnected) returnTarget.focus();
    };
  }, [isFilterDrawerOpen]);

  // Ako se viewport proširi na desktop, zatvori CSS-sakrivenu fioku i oslobodi scroll.
  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 1024px)');
    const closeOnDesktop = (event: MediaQueryListEvent | MediaQueryList) => {
      if (event.matches) setIsFilterDrawerOpen(false);
    };

    closeOnDesktop(desktop);
    desktop.addEventListener('change', closeOnDesktop);
    return () => desktop.removeEventListener('change', closeOnDesktop);
  }, []);

  // ===== Postepeno učitavanje kartica =====
  useEffect(() => {
    const markUserScroll = () => {
      hasUserScrolledRef.current = true;
    };
    window.addEventListener('scroll', markUserScroll, { passive: true });
    return () => window.removeEventListener('scroll', markUserScroll);
  }, []);

  // Mreža kartica (slike, raspored) se osvežava odloženo: checkbox, brojači i čipovi
  // reaguju odmah, a skupo iscrtavanje novih kartica ide u sledećem, prekidivom renderu.
  const gridProducts = useDeferredValue(filteredProducts);

  useEffect(() => {
    hasUserScrolledRef.current = false;
    setVisibleProductCount(INITIAL_PRODUCT_LIMIT);
  }, [gridProducts]);

  const loadNextProductRow = useCallback(() => {
    setVisibleProductCount((current) => Math.min(current + getNextProductRowSize(), gridProducts.length));
  }, [gridProducts.length]);

  const visibleProducts = gridProducts.slice(0, visibleProductCount);
  const hasMoreProducts = visibleProducts.length < gridProducts.length;

  useEffect(() => {
    const loadVisibleRowOnScroll = () => {
      hasUserScrolledRef.current = true;
      const target = loadMoreRef.current;
      if (!target || !hasMoreProducts) return;
      const rect = target.getBoundingClientRect();
      if (rect.top <= window.innerHeight + 160 && rect.bottom >= -160) loadNextProductRow();
    };

    window.addEventListener('scroll', loadVisibleRowOnScroll, { passive: true });
    return () => window.removeEventListener('scroll', loadVisibleRowOnScroll);
  }, [hasMoreProducts, loadNextProductRow]);

  useEffect(() => {
    const target = loadMoreRef.current;
    if (!target || !hasMoreProducts || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver((entries) => {
      if (hasUserScrolledRef.current && entries.some((entry) => entry.isIntersecting)) loadNextProductRow();
    }, { rootMargin: '0px 0px 160px 0px' });

    observer.observe(target);
    return () => observer.disconnect();
  }, [hasMoreProducts, loadNextProductRow, visibleProductCount]);

  // ===== Prikaz =====
  const selectedCategorySlug = selectedCategorySlugs.length === 1 ? selectedCategorySlugs[0] : null;
  const singleSelectedGroup = selectedCategorySlug
    ? groups.find((group) => group.category.slug === selectedCategorySlug)
    : null;
  const selectedBrands = selection.lists.brand || [];
  const assortmentGroups = tabGroups.filter(group => selectedBrands.length === 0 || group.products.some(item => selectedBrands.includes(item.brandId)));
  const flatOnly = assortmentGroups.length > 0 && assortmentGroups.every(group => !group.colorCount);
  const activeName = singleSelectedGroup?.category.name || (flatOnly ? 'Asortiman' : selectedCategorySlugs.length > 1 ? 'Katalog' : 'Sve kolekcije');
  const activeDescription = singleSelectedGroup
    ? CATEGORY_DESCRIPTIONS[singleSelectedGroup.category.slug] || (flatOnly ? 'Pregled proizvoda za pripremu, ugradnju i održavanje.' : 'Pregled kolekcija i dekora za stambene, poslovne i tehničke prostore.')
    : 'Izaberite kategoriju ili odmah suzite ceo katalog po brendu, nameni, klasi, ugradnji, dezenu, debljini i drugim osobinama.';
  const headerCount = activeProductTab === 'colors' && isLoadingColors ? null : activeProductCount;
  const chips = evaluation.chips;

  const renderFilterPanel = (withHeader: boolean) => (
    <>
      {withHeader ? (
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[14px] font-semibold text-ink-900">Filteri</h2>
          {activeFilterCount > 0 ? (
            <button
              type="button"
              onClick={resetFilters}
              className="text-[11px] text-ink-500 transition-colors hover:text-ink-900"
            >
              Očisti sve
            </button>
          ) : null}
        </div>
      ) : null}
      <HomeFilterPanel groups={evaluation.groups} onToggle={handleToggle} onRangeChange={handleRangeChange} />
    </>
  );

  const renderChip = (chip: (typeof chips)[number], extraClassName = '') => (
    <button
      key={chip.id}
      type="button"
      onClick={() => updateSelection((current) => removeHomeChip(current, chip))}
      aria-label={`Ukloni filter ${chip.label}`}
      className={`inline-flex h-8 items-center gap-2 border border-ink-200 bg-white px-2.5 text-[12px] text-ink-800 transition-colors hover:border-ink-900 ${extraClassName}`}
    >
      {chip.label}
      <span className="text-ink-500" aria-hidden="true">×</span>
    </button>
  );

  return (
    <section className="bg-white">
      <h1 className="sr-only">Podovi.online katalog proizvoda</h1>

      <div className="mx-auto w-full max-w-[1536px] px-6 pb-16 pt-2 md:pt-6 lg:pb-20">
        <div className="grid gap-8 lg:grid-cols-[262px_minmax(0,1fr)] xl:gap-11" data-home-catalog>
          <aside className="hidden lg:block">
            <div className="sticky top-24 space-y-4">
              <div className="border border-ink-200 bg-white p-4">
                {renderFilterPanel(true)}
              </div>

              <div className="border border-ink-200 bg-white p-4">
                <h2 className="text-[16px] font-semibold text-ink-900">Imate projekat?</h2>
                <p className="mt-2 text-[12px] leading-5 text-ink-700">
                  Pošaljite nam upit i dobićete ponudu u najkraćem roku.
                </p>
                <Link href="/upiti" className="mt-4 flex h-10 w-full items-center justify-between bg-ink-900 px-4 text-[13px] font-semibold text-white transition-colors hover:bg-ink-700">
                  Pošalji upit
                  <ArrowRightIcon className="h-4 w-4" />
                </Link>
                <div className="mt-4 space-y-2 text-[12px] text-ink-700">
                  {['Brz odgovor', 'Stručna podrška', 'Najbolje rešenje'].map((item) => (
                    <div key={item} className="flex items-center gap-2">
                      <CheckIcon className="h-3.5 w-3.5 text-emerald-600" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          <div className="relative min-w-0 pt-0 md:pt-2">
            <div className="pb-0 md:pb-3">
              <div className="hidden flex-col gap-5 md:flex md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="flex flex-wrap items-end gap-x-4 gap-y-2">
                    <h2 className="text-[30px] font-semibold leading-tight text-ink-900 md:text-[32px]">
                      {activeName}
                    </h2>
                    <span className="pb-1.5 text-[12px] text-ink-500" aria-live="polite">
                      {headerCount === null ? 'Učitavam…' : `${headerCount} ${pluralizeItems(headerCount, activeProductTab, flatOnly)}`}
                    </span>
                  </div>
                  <p className="mt-2 max-w-3xl text-[13px] leading-6 text-ink-700">
                    {activeDescription}
                  </p>
                </div>
              </div>

              {/* Telefon: aktivni čipovi u jednom skrolabilnom redu. */}
              {chips.length > 0 ? (
                <div className="flex items-center border-y border-ink-200 py-2 md:mt-5 lg:hidden">
                  <div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto" aria-label="Aktivni filteri">
                    {chips.map((chip) => renderChip(chip, 'shrink-0'))}
                  </div>
                </div>
              ) : null}
            </div>

            {/* Desktop red čipova */}
            {chips.length > 0 ? (
              <div className="mb-5 hidden flex-wrap items-center gap-2 border-y border-ink-200 py-3 lg:flex">
                {chips.map((chip) => renderChip(chip))}
                <button
                  type="button"
                  onClick={resetFilters}
                  className="h-8 px-1 text-[12px] font-semibold text-ink-900 underline underline-offset-4"
                >
                  Očisti sve
                </button>
              </div>
            ) : null}

            <div className="mb-5 flex flex-col gap-3 border-b border-ink-200 text-[12px] text-ink-500 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex items-center gap-8">
                <button
                  type="button"
                  onClick={() => setActiveProductTab('collections')}
                  aria-pressed={activeProductTab === 'collections'}
                  className={`pb-3 transition-colors ${
                    activeProductTab === 'collections'
                      ? 'border-b-[3px] border-ink-900 font-medium text-ink-900'
                      : 'border-b-[3px] border-transparent text-ink-500 hover:text-ink-900'
                  }`}
                >
                  {flatOnly ? 'Proizvodi' : 'Kolekcije'} ({collectionEvaluation.results.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveProductTab('colors')}
                  aria-pressed={activeProductTab === 'colors'}
                  className={`pb-3 transition-colors ${
                    activeProductTab === 'colors'
                      ? 'border-b-[3px] border-ink-900 font-medium text-ink-900'
                      : 'border-b-[3px] border-transparent text-ink-500 hover:text-ink-900'
                  }`}
                >
                  {colorResultsCount === null ? 'Boje' : `Boje (${colorResultsCount})`}
                </button>
              </div>
              <div className="mb-3 flex items-center gap-2 sm:mb-2">
                {/* Telefon/tablet: vidljivo dugme „Filteri" pored sortiranja (uz ikonu u zaglavlju). */}
                <button
                  type="button"
                  onClick={openDrawer}
                  aria-controls="home-filter-drawer"
                  aria-expanded={isFilterDrawerOpen}
                  className="inline-flex h-9 flex-none items-center justify-center gap-2 border border-ink-900 bg-white px-4 text-[12px] font-semibold text-ink-900 transition-colors hover:bg-ink-900 hover:text-white lg:hidden"
                  data-testid="home-filters-open"
                >
                  <SlidersIcon className="h-4 w-4" />
                  Filteri{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
                </button>
                <label className="flex flex-1 flex-col gap-2 text-[12px] text-ink-500 sm:w-[180px] sm:flex-none">
                  <span className="sr-only">Sortiraj proizvode</span>
                  <select
                    value={sortMode}
                    onChange={(event) => setSortMode(event.target.value as HomepageSortMode)}
                    className="h-9 w-full border border-ink-200 bg-white px-3 text-[12px] text-ink-900 outline-none transition-colors focus:border-ink-900"
                  >
                    <option value="featured">Sortiraj: Preporučeno</option>
                    <option value="name">Sortiraj: Naziv</option>
                    {canSortByPrice || (!activeTabDataReady && sortMode === 'price') ? <option value="price">Sortiraj: Cena</option> : null}
                  </select>
                </label>
              </div>
            </div>

            {isLoadingColors ? (
              <div className="border border-ink-200 bg-white p-12 text-center">
                <h3 className="mb-2 text-lg font-medium text-ink-900">Učitavam boje</h3>
                <p className="text-[13px] text-ink-500">Pripremamo dekore za izabrane kategorije.</p>
              </div>
            ) : activeProductTab === 'colors' && colorLoadError ? (
              <div className="border border-ink-200 bg-white p-12 text-center">
                <h3 className="mb-2 text-lg font-medium text-ink-900">Boje nisu učitane</h3>
                <p className="text-[13px] text-ink-500">Pokušajte ponovo za nekoliko trenutaka.</p>
                <button
                  type="button"
                  onClick={() => setColorLoadAttempt((current) => current + 1)}
                  className="mt-4 border border-ink-200 bg-white px-4 py-2 text-[12px] font-semibold text-ink-900 transition-colors hover:border-ink-900"
                >
                  Pokušaj ponovo
                </button>
              </div>
            ) : visibleProducts.length > 0 ? (
              <>
                <div className="grid grid-cols-2 gap-x-4 gap-y-5 md:grid-cols-3 xl:grid-cols-4">
                  {visibleProducts.map((product, index) => (
                    <ProductCardClient
                      key={`${activeProductTab}-${product.id}`}
                      product={product}
                      brand={brandsRecord[product.brandId] || null}
                      compact={activeProductTab === 'colors'}
                      priority={activeProductTab === 'collections' && index < PRIORITY_CARD_COUNT}
                    />
                  ))}
                </div>
                {hasMoreProducts ? (
                  <div ref={loadMoreRef} className="flex justify-center py-8">
                    <button
                      type="button"
                      onClick={loadNextProductRow}
                      className="border border-ink-200 bg-white px-4 py-2 text-[12px] font-semibold text-ink-900 transition-colors hover:border-ink-900"
                    >
                      Učitaj još {activeProductTab === 'colors' ? 'boja' : flatOnly ? 'proizvoda' : 'kolekcija'}
                    </button>
                  </div>
                ) : null}
              </>
            ) : (
              <div className="border border-ink-200 bg-white p-12 text-center">
                <h3 className="mb-2 text-lg font-medium text-ink-900">Nema proizvoda za izabrane filtere</h3>
                <p className="text-[13px] text-ink-500">Uklonite poslednji filter ili očistite izbor.</p>
                {chips.length > 0 ? (
                  <div className="mt-4 flex flex-wrap justify-center gap-3">
                    <button
                      type="button"
                      onClick={removeLastFilter}
                      className="border border-ink-200 bg-white px-4 py-2 text-[12px] font-semibold text-ink-900 transition-colors hover:border-ink-900"
                    >
                      Ukloni „{chips[chips.length - 1].label}“
                    </button>
                    <button
                      type="button"
                      onClick={resetFilters}
                      className="px-2 py-2 text-[12px] font-semibold text-ink-900 underline underline-offset-4"
                    >
                      Očisti sve
                    </button>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MOBILNA FIOKA FILTERA: overlay + panel zdesna iznad lepljivog headera (z-50).
          Sadržaj = ISTI deljeni panel kao desktop <aside>; dno sa živim brojem rezultata. */}
      {isFilterDrawerOpen ? (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div
            className="absolute inset-0 bg-black/20"
            aria-hidden="true"
            onClick={() => setIsFilterDrawerOpen(false)}
          />

          <div
            id="home-filter-drawer"
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="home-filter-drawer-title"
            tabIndex={-1}
            className="absolute inset-y-0 right-0 flex h-[100dvh] w-full max-w-md flex-col border-l border-ink-200 bg-white"
          >
            <div className="flex items-center justify-between border-b border-ink-200 px-6 py-4">
              <h2 id="home-filter-drawer-title" className="text-[14px] font-semibold text-ink-900">
                Filteri{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
              </h2>
              <button
                type="button"
                ref={drawerCloseButtonRef}
                onClick={() => setIsFilterDrawerOpen(false)}
                aria-label="Zatvori filtere"
                className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center text-ink-900 transition-opacity hover:opacity-60"
              >
                <CloseIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overscroll-contain overflow-y-auto px-6 py-6">
              {renderFilterPanel(false)}
            </div>

            <div className="flex gap-3 border-t border-ink-200 px-6 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4">
              {activeFilterCount > 0 ? (
                <button type="button" onClick={resetFilters} className="btn-secondary flex-1">
                  Očisti sve
                </button>
              ) : null}
              {activeProductTab === 'colors' && colorLoadError ? (
                <button
                  type="button"
                  onClick={() => setColorLoadAttempt((current) => current + 1)}
                  className="btn-primary flex-1"
                >
                  Pokušaj ponovo
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsFilterDrawerOpen(false)}
                  disabled={isLoadingColors}
                  className="btn-primary flex-1 disabled:cursor-wait disabled:opacity-60"
                  data-testid="home-filters-drawer-apply"
                >
                  {isLoadingColors
                    ? 'Učitavam rezultate…'
                    : `Prikaži ${activeProductCount} ${pluralizeResults(activeProductCount)}`}
                </button>
              )}
              <span className="sr-only" role="status" aria-live="polite">
                {isLoadingColors ? 'Učitavam rezultate' : `${activeProductCount} ${pluralizeResults(activeProductCount)}`}
              </span>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
