import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const homeSource = readFileSync('components/HomeProductTabs.tsx', 'utf8');
const headerSource = readFileSync('components/Header.tsx', 'utf8');
const searchSource = readFileSync('components/GlobalSearch.tsx', 'utf8');
const pageSource = readFileSync('app/page.tsx', 'utf8');
const panelSource = readFileSync('components/HomeFilterPanel.tsx', 'utf8');
const engineSource = readFileSync('lib/catalog/home-filter-engine.ts', 'utf8');

describe('homepage filter UI contract', () => {
  it('keeps the mobile summary hidden and opens filters from the header', () => {
    expect(homeSource).toContain('hidden flex-col gap-5 md:flex');
    expect(headerSource).toContain('<GlobalSearch variant="inline" />');
    expect(headerSource).toContain("window.dispatchEvent(new Event(OPEN_HOME_FILTERS_EVENT))");
    expect(headerSource).toContain("aria-controls={isHomepage ? 'home-filter-drawer' : 'mobile-menu'}");
    expect(homeSource).toContain('window.addEventListener(OPEN_HOME_FILTERS_EVENT, openFilters)');
    expect(headerSource).toContain('className="min-w-0 lg:hidden"');
    expect(headerSource).toContain('className="hidden w-[590px] justify-center lg:flex"');
  });

  it('keeps the drawer keyboard-safe and releases it on desktop resize', () => {
    expect(homeSource).toContain('id="home-filter-drawer"');
    expect(homeSource).toContain("event.key !== 'Tab'");
    expect(homeSource).toContain("window.matchMedia('(min-width: 1024px)')");
    expect(homeSource).toContain('h-[100dvh]');
  });

  it('uses expandable/searchable lists and live zero-disabled counters from one engine', () => {
    expect(panelSource).toContain('function ExpandableFilterOptions');
    expect(panelSource).toContain('function SearchableFilterOptions');
    expect(panelSource).toContain('disabled={option.disabled}');
    expect(homeSource).toContain('evaluateHomeFilters(collectionItems, facetSchema, selection');
    expect(homeSource).toContain('evaluateHomeFilters(colorItems, facetSchema, selection');
    // Brojač i onemogućena opcija dolaze iz istog prolaza kao rezultat.
    expect(engineSource).toContain('disabled: count === 0 && !selected');
  });

  it('offers a visible Filteri button above results on phones in addition to the header trigger', () => {
    expect(homeSource).toContain('data-testid="home-filters-open"');
    expect(homeSource).toContain('aria-controls="home-filter-drawer"');
    expect(homeSource).toContain('Prikaži ${activeProductCount} ${pluralizeResults(activeProductCount)}');
  });

  it('uses honest sorting and hides price sorting when prices do not exist', () => {
    expect(homeSource).toContain('Sortiraj: Preporučeno');
    expect(homeSource).not.toContain('Sortiraj: Najnovije');
    expect(homeSource).toContain("canSortByPrice ? <option value=\"price\"");
  });

  it('serves the homepage from ISR and hydrates/persists shareable filter URL state on the client', () => {
    expect(pageSource).toContain('export const revalidate = 300;');
    expect(pageSource).not.toContain('searchParams?:');
    expect(homeSource).toContain('parseHomeFilterSelection(search, facetSchema)');
    expect(homeSource).toContain('serializeHomeFilterSelection({ selection, tab: activeProductTab, sort: sortMode }, facetSchema, window.location.search)');
    expect(homeSource).toContain("window.addEventListener('popstate', restoreFromHistory)");
    expect(homeSource).toContain("window.history.replaceState(window.history.state, '', nextUrl)");
    expect(homeSource).toContain("window.history.pushState(null, '', nextUrl)");
    expect(homeSource).toContain('sanitizeHomeSelection(selection, facetSchema, tabPresentValues, categories, brandIds)');
  });

  it('shows an honest loading state on a direct colors-tab URL', () => {
    expect(homeSource).toContain("activeProductTab === 'colors'");
    expect(homeSource).toContain('missingColorCategoryIds.length > 0');
    expect(homeSource).toContain('&& !colorLoadError');
    expect(homeSource).not.toContain('missingColorCategoryIds.length > 0 && loadingColorCategoryIds.length > 0');
  });

  it('renders a real inline search input instead of an icon-only trigger on mobile', () => {
    expect(searchSource).toContain("variant?: 'icon' | 'bar' | 'inline'");
    expect(searchSource).toContain("variant === 'inline'");
    expect(searchSource).toContain('placeholder="Pretraži..."');
    expect(searchSource).toContain('role="listbox"');
    expect(searchSource).toContain('aria-activedescendant=');
    expect(searchSource).toContain('new AbortController()');
    expect(searchSource).toContain('if (!res.ok)');
  });
});
