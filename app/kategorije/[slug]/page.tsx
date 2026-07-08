import { notFound } from 'next/navigation';
import Link from 'next/link';
import { readFileSync } from 'fs';
import { join } from 'path';
import { categoryRepository } from '@/lib/repositories/category-repository';
import { productRepository } from '@/lib/repositories/product-repository';
import { brandRepository } from '@/lib/repositories/brand-repository';
import { getEffectiveParketCollection, getAllParketVariantSlugs } from '@/lib/data/parket-collection-mapping';
import { isAlpodImportBrand, normalizeThicknessValue, resolveBrandTokens } from '@/lib/catalog/spec-normalize';
import { filterCategoryListingCollections, resolveCategoryListingMode } from '@/lib/catalog/listing-curation';
import { generateBreadcrumbSchema, generateCollectionPageSchema, generateProductListSchema } from '@/lib/seo/structured-data';
import { getCategoryPageCopy } from '@/lib/seo/listing-page-copy';
import { createMetadataImage, getMetadataImageUrls } from '@/lib/utils/product-images';
import ProductCard from '@/components/ProductCard';
import ProductFilters from '@/components/ProductFilters';
import CategoryToolbar, {
  buildCategoryQueryString,
  buildFilterRemovalHref,
  removeFilterValue,
  resolveCategorySortMode,
  sortCategoryProducts,
  type ActiveFilterChip,
} from '@/components/CategoryToolbar';
import CategoryTabs from '@/components/CategoryTabs';
import Breadcrumbs from '@/components/Breadcrumbs';
import EssenceConfiguratorBanner from '@/components/configurator/EssenceConfiguratorBanner';
import type { Product } from '@/types';

interface CategoryPageProps {
  params: { slug: string };
  searchParams: {
    search?: string;
    brands?: string;
    priceMin?: string;
    priceMax?: string;
    inStock?: string;
    color?: string;
    type?: string; // For vinyl type filter: 'homogeni' | 'heterogeni'
    safety?: string; // For vinyl safety filter: '1' = only protivklizni/sigurnosni collections
    zidne?: string; // For vinyl wall-covering filter: '1' = only zidne obloge collections
    collections?: string; // For LVT collection filter (comma-separated)
    family?: string; // For BLOQ family filter (comma-separated)
    listing?: string; // For core/accessory listing segmentation
    thickness?: string; // For overall thickness filter (comma-separated values)
    woodType?: string; // For Parket: Hrast | Jasen
    toolGroup?: string; // For Alat: Romus top-level tool group slugs
    toolSubcategory?: string; // For Alat: Romus tool subcategory slugs
    sort?: string; // Sortiranje listinga: 'preporuceno' | 'naziv' | 'cena' | 'najnovije'
  };
}

type ToolFilterOption = {
  value: string;
  slug: string;
  count: number;
};

type ToolSubcategoryFilterOption = ToolFilterOption & {
  group: string;
  groupSlug: string;
};

function slugifyFilterValue(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function parseFilterSlugList(value?: string): string[] {
  return value?.split(',').map((item) => item.trim()).filter(Boolean) || [];
}

// Srpska množina: 1 kolekcija / 2-4 kolekcije / 5+ kolekcija (paukal)
function pluralizeSr(count: number, one: string, few: string, many: string): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}

function getProductSpecValue(product: Product, key: string): string {
  return product.specs?.find((spec) => spec.key === key)?.value?.trim() || '';
}

// Collection-header SKU prefiksi — jedini izvor istine za razdvajanje kolekcija od boja.
function hasCollectionSku(p: { sku?: string | null }): boolean {
  return (
    p.sku?.startsWith('GER-') ||
    p.sku?.startsWith('TARKETT-') ||
    p.sku?.startsWith('PODOVI-COLLECTION-') ||
    p.sku?.startsWith('WOLFLOR-VINYL-') ||
    p.sku?.startsWith('LINOLEUM-') ||
    p.sku?.startsWith('VINIL-') ||
    p.sku?.startsWith('PARKET-') ||
    p.sku?.startsWith('LAM-') ||
    p.sku?.startsWith('BLOQ-') ||
    p.sku?.startsWith('DESSO-') ||
    p.sku?.startsWith('DEKING-') ||
    p.sku?.startsWith('GRASS-') ||
    p.sku?.startsWith('PRIBOR-') ||
    p.sku?.startsWith('ESD-') ||
    p.sku?.startsWith('IND-') ||
    p.sku?.startsWith('SPORT-') ||
    p.sku?.startsWith('TARKETT-LAJSNE-') ||
    p.sku?.startsWith('GERFLOR-LAJSNE-')
  ) ?? false;
}

// ===== FILTERI 2.0 Faza 1: pomoćne funkcije za poređenje filtera =====
// Ista logika služi i za prikazano filtriranje i za brojače uz opcije —
// umesto dupliranja poređenja po granama.

function getNormalizedProductThickness(p: Product): string | null {
  const spec = p.specs?.find((s) => s.key === 'thickness' || s.key === 'overall_thickness');
  return normalizeThicknessValue(spec?.value);
}

// Vrednost opcije "Kolekcija" za proizvod — ogledalo logike kojom se grade availableCollections.
function getCollectionFacetValue(p: Product, categorySlug: string): string | null {
  if (categorySlug === 'lvt') {
    const collSpec = p.specs?.find((s) => s.key === 'collection')?.value;
    if (p.sku?.startsWith('TARKETT-') && collSpec) return collSpec;
    const name = p.name || '';
    if (name.includes('Saga') || name.includes('SAGA')) return 'SAGA²';
    if (name.includes('Creation 30')) return 'Creation 30';
    if (name.includes('Creation 40')) return 'Creation 40';
    if (name.includes('Creation 55')) return 'Creation 55';
    if (name.includes('Creation 70')) return 'Creation 70';
    return null;
  }
  if (categorySlug === 'parket') {
    const specVal = p.specs?.find((s) => s.key === 'collection')?.value;
    return getEffectiveParketCollection(p.slug, specVal) || specVal || p.name || null;
  }
  return (
    p.specs?.find((s) => s.key === 'collection')?.value ||
    p.specs?.find((s) => s.key === 'brand_line')?.value ||
    p.name ||
    null
  );
}

// Parket vrsta drveta — spec wood_type/wood_species ili infer iz slug-a (izvučeno iz bloka za parket).
function getProductWoodTypes(p: { specs?: { key: string; value: string }[]; slug: string }): string[] {
  const spec = p.specs?.find((s) => s.key === 'wood_type' || s.key === 'wood_species');
  const raw = spec?.value?.trim();
  if (raw) return raw.split(',').map((part) => part.trim()).filter(Boolean);
  const s = (p.slug || '').toLowerCase();
  if (s.startsWith('jasen') || s.includes('-jasen-')) return ['Jasen'];
  if (s.startsWith('hrast') || s.includes('-hrast-') || s.includes('oak')) return ['Hrast'];
  return ['Hrast'];
}

function productMatchesWoodType(p: { specs?: { key: string; value: string }[]; slug: string }, wt: string): boolean {
  const spec = p.specs?.find((s) => s.key === 'wood_type' || s.key === 'wood_species');
  const raw = spec?.value?.trim();
  if (raw) return raw.split(',').map((s) => s.trim()).includes(wt);
  const s = (p.slug || '').toLowerCase();
  if (wt === 'Jasen') return s.startsWith('jasen') || s.includes('-jasen-');
  if (wt === 'Hrast') return s.startsWith('hrast') || s.includes('-hrast-') || s.includes('oak');
  return false;
}

interface FacetSelections {
  brandIds: string[];
  collections: string[];
  families: string[];
  thickness: string[]; // normalizovane vrednosti (normalizeThicknessValue)
  woodTypes: string[];
  vinylType?: 'homogeni' | 'heterogeni';
  safetyOnly: boolean;
  wallOnly: boolean;
  search?: string;
  priceMin?: number;
  priceMax?: number;
}

function productMatchesFacets(p: Product, f: FacetSelections, categorySlug: string): boolean {
  if (f.brandIds.length > 0 && !f.brandIds.includes(p.brandId)) return false;

  if (f.collections.length > 0) {
    const value = getCollectionFacetValue(p, categorySlug);
    if (!value || !f.collections.includes(value)) return false;
  }

  // Familija važi samo za BLOQ (brand 8) — ostali brendovi prolaze (postojeće ponašanje).
  if (f.families.length > 0 && p.brandId === '8') {
    const familySpec = p.specs?.find((s) => s.key === 'family')?.value;
    if (!familySpec || !f.families.includes(familySpec)) return false;
  }

  if (f.thickness.length > 0) {
    const thickness = getNormalizedProductThickness(p);
    if (!thickness || !f.thickness.includes(thickness)) return false;
  }

  if (f.woodTypes.length > 0 && !f.woodTypes.some((wt) => productMatchesWoodType(p, wt))) return false;

  if (categorySlug === 'vinil') {
    if (f.vinylType) {
      const typeSpec = p.specs?.find((s) => s.key === 'type')?.value?.toLowerCase();
      if (typeSpec !== f.vinylType) return false;
    }
    if (f.safetyOnly && !p.specs?.some((s) => s.key === 'protivklizno')) return false;
    if (f.wallOnly && !p.specs?.some((s) => s.key === 'zidna_obloga')) return false;
  }

  if (f.search) {
    const term = f.search.toLowerCase();
    const haystack = `${p.name || ''} ${p.sku || ''} ${p.shortDescription || ''}`.toLowerCase();
    if (!haystack.includes(term)) return false;
  }

  if (f.priceMin !== undefined || f.priceMax !== undefined) {
    const price = typeof p.price === 'number' && Number.isFinite(p.price) ? p.price : null;
    if (price === null) return false;
    if (f.priceMin !== undefined && price < f.priceMin) return false;
    if (f.priceMax !== undefined && price > f.priceMax) return false;
  }

  return true;
}

type CountableFacet = 'brandIds' | 'collections' | 'families' | 'thickness';

// Count za opciju X = broj rezultata kad se X primeni preko OSTALIH aktivnih filtera
// (unutar iste grupe važi samo X, selekcije te grupe se ignorišu — standardno OR fasetiranje).
function countFacetOption(
  products: Product[],
  base: FacetSelections,
  categorySlug: string,
  facet: CountableFacet,
  value: string
): number {
  const overridden: FacetSelections = { ...base };
  overridden[facet] = [value];
  let count = 0;
  for (const product of products) {
    if (productMatchesFacets(product, overridden, categorySlug)) count += 1;
  }
  return count;
}

function getRomusToolGroup(product: Product): string {
  return getProductSpecValue(product, 'tool_group') || getProductSpecValue(product, 'collection');
}

function getRomusToolSubcategory(product: Product): string {
  return getProductSpecValue(product, 'tool_subcategory');
}

function buildToolGroupOptions(products: Product[]): ToolFilterOption[] {
  const options = new Map<string, ToolFilterOption>();

  for (const product of products) {
    const value = getRomusToolGroup(product);
    if (!value) continue;

    const slug = slugifyFilterValue(value);
    const existing = options.get(slug);
    if (existing) {
      existing.count += 1;
    } else {
      options.set(slug, { value, slug, count: 1 });
    }
  }

  return Array.from(options.values()).sort((a, b) => b.count - a.count || a.value.localeCompare(b.value, 'sr'));
}

function buildToolSubcategoryOptions(products: Product[], selectedGroupSlugs: string[]): ToolSubcategoryFilterOption[] {
  const selectedGroups = new Set(selectedGroupSlugs);
  const options = new Map<string, ToolSubcategoryFilterOption>();

  for (const product of products) {
    const group = getRomusToolGroup(product);
    const value = getRomusToolSubcategory(product);
    if (!group || !value) continue;

    const groupSlug = slugifyFilterValue(group);
    if (selectedGroups.size > 0 && !selectedGroups.has(groupSlug)) {
      continue;
    }

    const slug = slugifyFilterValue(value);
    const key = `${groupSlug}:${slug}`;
    const existing = options.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      options.set(key, { value, slug, group, groupSlug, count: 1 });
    }
  }

  return Array.from(options.values()).sort((a, b) =>
    a.group.localeCompare(b.group, 'sr') ||
    a.value.localeCompare(b.value, 'sr')
  );
}

function filterRomusToolProducts(
  products: Product[],
  selectedGroupSlugs: string[],
  selectedSubcategorySlugs: string[]
): Product[] {
  if (selectedGroupSlugs.length === 0 && selectedSubcategorySlugs.length === 0) {
    return products;
  }

  const selectedGroups = new Set(selectedGroupSlugs);
  const selectedSubcategories = new Set(selectedSubcategorySlugs);

  return products.filter((product) => {
    const groupSlug = slugifyFilterValue(getRomusToolGroup(product));
    const subcategorySlug = slugifyFilterValue(getRomusToolSubcategory(product));

    if (selectedGroups.size > 0 && !selectedGroups.has(groupSlug)) {
      return false;
    }

    if (selectedSubcategories.size > 0 && !selectedSubcategories.has(subcategorySlug)) {
      return false;
    }

    return true;
  });
}

export async function generateMetadata({ params }: CategoryPageProps) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.podovi.online';
  const category = await categoryRepository.findBySlug(params.slug);

  if (!category) {
    return {
      metadataBase: new URL(baseUrl),
      title: 'Kategorija nije pronađena',
    };
  }

  const categoryCopy = getCategoryPageCopy(category);
  const metadataImages = [
    createMetadataImage(category.image, baseUrl, {
      width: 1200,
      height: 630,
      alt: category.name,
    }),
  ].filter((image): image is NonNullable<ReturnType<typeof createMetadataImage>> => Boolean(image));
  const twitterImages = getMetadataImageUrls(metadataImages);

  return {
    metadataBase: new URL(baseUrl),
    title: categoryCopy.metaTitle,
    description: categoryCopy.metaDescription,
    keywords: categoryCopy.keywords,
    openGraph: {
      title: categoryCopy.metaTitle,
      description: categoryCopy.metaDescription,
      type: 'website',
      locale: 'sr_RS',
      url: `${baseUrl}/kategorije/${params.slug}`,
      siteName: 'podovi.online',
      images: metadataImages.length > 0 ? metadataImages : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: categoryCopy.metaTitle,
      description: categoryCopy.metaDescription,
      images: twitterImages,
    },
    alternates: {
      canonical: `${baseUrl}/kategorije/${params.slug}`,
    },
  };
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const category = await categoryRepository.findBySlug(params.slug);

  if (!category) {
    notFound();
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.podovi.online';
  const categoryCopy = getCategoryPageCopy(category);

  // Parse filters from search params (but exclude collections filter for now)
  // For laminat: don't apply thickness filter here - we handle it manually since laminat uses 'overall_thickness' spec
  const isLaminat = category.slug === 'laminat';

  // ?brands= mora da se validira pre upita: UI upisuje ID ('3'), ali ručni URL-ovi
  // nose ime/slug — nevalidni tokeni bi inače dali 0 rezultata u svim granama.
  const allBrands = await brandRepository.findAll();
  const resolvedBrandIds = searchParams.brands
    ? resolveBrandTokens(searchParams.brands.split(','), allBrands)
    : [];

  const filtersWithoutCollections = {
    categoryId: category.id,
    search: searchParams.search,
    brandIds: resolvedBrandIds.length > 0 ? resolvedBrandIds : undefined,
    priceMin: searchParams.priceMin ? parseFloat(searchParams.priceMin) : undefined,
    priceMax: searchParams.priceMax ? parseFloat(searchParams.priceMax) : undefined,
    inStock: searchParams.inStock === 'true' ? true : undefined,
    type: searchParams.type, // For vinyl type filter
    safety: searchParams.safety, // For vinyl protivklizni/sigurnosni filter (?safety=1)
    zidne: searchParams.zidne, // For vinyl zidne obloge filter (?zidne=1)
    // Laminat: don't filter by thickness in repository (we do it manually); others: use repository filter
    thickness: isLaminat ? undefined : (searchParams.thickness ? searchParams.thickness.split(',') : undefined),
    woodType: searchParams.woodType, // For Parket: Hrast | Jasen
    // collections and family filter will be applied separately after separating collections from colors
  };
  const selectedToolGroupSlugs = parseFilterSlugList(searchParams.toolGroup);
  const selectedToolSubcategorySlugs = parseFilterSlugList(searchParams.toolSubcategory);

  // FILTERI 2.0 Faza 1: jedinstveno parsirane aktivne vrednosti filtera —
  // koriste ih brojači uz opcije i čipovi aktivnih filtera.
  const selectedCollectionValues = parseFilterSlugList(searchParams.collections);
  const selectedFamilyValues = parseFilterSlugList(searchParams.family);
  const selectedThicknessValues = parseFilterSlugList(searchParams.thickness)
    .map((value) => normalizeThicknessValue(value))
    .filter((value): value is string => Boolean(value));
  const selectedWoodTypeValues = parseFilterSlugList(searchParams.woodType);
  const vinylTypeFilter = category.slug === 'vinil' && (searchParams.type === 'homogeni' || searchParams.type === 'heterogeni')
    ? searchParams.type
    : undefined;
  const facetSelections: FacetSelections = {
    brandIds: resolvedBrandIds,
    collections: selectedCollectionValues,
    families: category.slug === 'tekstilne-ploce' ? selectedFamilyValues : [],
    thickness: selectedThicknessValues,
    woodTypes: category.slug === 'parket' ? selectedWoodTypeValues : [],
    vinylType: vinylTypeFilter,
    safetyOnly: category.slug === 'vinil' && searchParams.safety === '1',
    wallOnly: category.slug === 'vinil' && searchParams.zidne === '1',
    search: searchParams.search?.trim() || undefined,
    priceMin: Number.isFinite(filtersWithoutCollections.priceMin) ? filtersWithoutCollections.priceMin : undefined,
    priceMax: Number.isFinite(filtersWithoutCollections.priceMax) ? filtersWithoutCollections.priceMax : undefined,
  };

  // Get all products first (without collection filter) to properly separate collections from colors
  let [
    allProducts,
    categoryProducts,
    allCategories,
  ] = await Promise.all([
    productRepository.findByCategory(category.id, filtersWithoutCollections),
    productRepository.findByCategory(category.id),
    categoryRepository.findAll(),
  ]);
  const allProductsForThickness = categoryProducts;

  // Get unique brands used in this category
  const categoryBrandIds = new Set(categoryProducts.map(p => p.brandId));
  const availableBrands = allBrands.filter(b => categoryBrandIds.has(b.id));
  const availableToolGroups = category.slug === 'alat' ? buildToolGroupOptions(categoryProducts) : [];
  const availableToolSubcategories = category.slug === 'alat'
    ? buildToolSubcategoryOptions(categoryProducts, selectedToolGroupSlugs)
    : [];

  if (category.slug === 'alat') {
    allProducts = filterRomusToolProducts(allProducts, selectedToolGroupSlugs, selectedToolSubcategorySlugs);
  }

  // For LVT, Linoleum, Carpet, Vinil, Parket, Laminat – separate collections from colors
  const isTechemMatCategory = category.slug === 'otiraci';
  // Techem enters the catalog as a flat branch until the supplier data model proves real
  // color/variant selectors that should split listing into collection tabs.
  const hasCollectionTabs = !isTechemMatCategory && (
    category.slug === 'lvt' ||
    category.slug === 'linoleum' ||
    category.slug === 'tekstilne-ploce' ||
    category.slug === 'vinil' ||
    category.slug === 'parket' ||
    category.slug === 'deking' ||
    category.slug === 'laminat' ||
    category.slug === 'elektroprovodni' ||
    category.slug === 'industrijske-ploce' ||
    category.slug === 'sport' ||
    category.slug === 'lajsne' ||
    category.slug === 'vestacka-trava' ||
    category.slug === 'pribor'
  );
  const listingMode = resolveCategoryListingMode(searchParams.listing, category.slug);
  let collections: typeof allProducts = [];
  let colors: typeof allProducts = [];
  let availableCollections: string[] = [];
  let availableFamilies: string[] = [];
  let availableWoodTypes: { value: string; count: number }[] = [];
  let availableThickness: string[] = [];
  let availableThicknessByType: { homogeni: string[]; heterogeni: string[] } = { homogeni: [], heterogeni: [] };
  // Broj JSON boja po (normalizovanoj) debljini — fallback za brojače kad nijedan
  // collection header ne nosi tu debljinu (da opcija ne bude pogrešno posivljena).
  const jsonThicknessColorCounts = new Map<string, { homogeni: number; heterogeni: number; total: number }>();

  // For non-LVT categories, get filtered products
  const filteredProducts = hasCollectionTabs ? [] : allProducts;

  // Create brands object for Client Component (serializable)
  const brandsRecord: Record<string, typeof allBrands[0]> = {};
  if (hasCollectionTabs) {
    // Collections: GER-, TARKETT-, WOLFLOR-VINYL-, LINOLEUM-, VINIL-, PARKET-, LAM-, BLOQ-, DESSO-, DEKING-, ESD-, IND-, SPORT-, PODOVI-COLLECTION-
    // Colors: products without those SKU prefixes (hasCollectionSku je izvučen na module scope
    // da bi brojači uz filter opcije koristili identično razdvajanje).
    const allCollections = filterCategoryListingCollections(
      category.slug,
      allProducts.filter(p => hasCollectionSku(p)),
      listingMode
    );
    if (category.slug === 'parket') {
      // Parket: tab Boje prikazuje samo 73 varijante iz kolekcija (jedan proizvod po slug-u), ne sve proizvode
      const validSlugs = new Set(getAllParketVariantSlugs());
      const seen = new Set<string>();
      colors = allProducts
        .filter(p => !hasCollectionSku(p))
        .filter(p => {
          if (!isAlpodImportBrand(p.brandId) && !validSlugs.has(p.slug)) return false;
          if (seen.has(p.slug)) return false;
          seen.add(p.slug);
          return true;
        });
    } else {
      colors = allProducts.filter(p => !hasCollectionSku(p));
      // Laminat: jedan proizvod po slug-u u tabu Boje (bez duplikata)
      if (category.slug === 'laminat') {
        const seen = new Set<string>();
        colors = colors.filter(p => {
          if (!p.slug) return true;
          if (seen.has(p.slug)) return false;
          seen.add(p.slug);
          return true;
        });

        // Takođe dedup kolekcija (za svaki slučaj) i BACKFILL slika iz varijanti ako header nema sliku
        const byCollectionName = new Map<string, typeof collections[0]>();
        for (const p of collections) {
          const collectionName = getCollectionFacetValue(p, 'laminat') || p.name;

          // Try to find a better image if current one is missing
          let productToStore = p;
          if ((!p.images || p.images.length === 0) && colors.length > 0) {
            const variant = colors.find(c => c.specs?.find(s => s.key === 'collection')?.value === collectionName);
            if (variant && variant.images && variant.images.length > 0) {
              productToStore = { ...p, images: variant.images };
            }
          }

          if (!byCollectionName.has(collectionName)) {
            byCollectionName.set(collectionName, productToStore);
          }
        }
        collections = Array.from(byCollectionName.values());
      }
    }

    // Extract unique LVT collection names for filter FIRST (before filtering)
    // This ensures all collections remain visible in the filter dropdown
    if (category.slug === 'lvt') {
      const collectionGroups = new Set<string>();
      allCollections.forEach(p => {
        // Tarkett: 'collection' spec; Gerflor: name-based grupa (Creation/SAGA) — shared helper
        const group = getCollectionFacetValue(p, 'lvt');
        if (group) {
          collectionGroups.add(group);
        }
      });
      // Sort: Gerflor first (Creation order), then Tarkett alphabetically
      const gerflorOrder = ['Creation 30', 'Creation 40', 'Creation 55', 'Creation 70', 'SAGA²'];
      availableCollections = Array.from(collectionGroups).sort((a, b) => {
        const indexA = gerflorOrder.indexOf(a);
        const indexB = gerflorOrder.indexOf(b);
        if (indexA === -1 && indexB === -1) return a.localeCompare(b);
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;
        return indexA - indexB;
      });
    }

    // Laminat: kolekcije iz LAM- proizvoda (spec "collection" ili name)
    if (category.slug === 'laminat') {
      const names = allCollections
        .filter(p => p.sku?.startsWith('LAM-'))
        .map(p => getCollectionFacetValue(p, 'laminat'))
        .filter((v): v is string => Boolean(v));
      availableCollections = Array.from(new Set(names)).sort((a, b) => a.localeCompare(b));
    }

    // Parket: kolekcije iz spec "collection", za varijante (collection "Parket") koristimo efektivnu kolekciju iz mapiranja
    if (category.slug === 'parket') {
      const names = allCollections
        .map(p => getCollectionFacetValue(p, 'parket'))
        .filter((v): v is string => Boolean(v) && v !== 'Parket');
      availableCollections = Array.from(new Set(names)).sort((a, b) => a.localeCompare(b));

      // Parket: vrsta drveta (Hrast / Jasen) – iz spec wood_type/wood_species ili iz slug-a (hrast-*, jasen-*, *-oak)
      const woodCounts: Record<string, number> = {};
      colors.forEach(p => {
        getProductWoodTypes(p).forEach(value => {
          woodCounts[value] = (woodCounts[value] ?? 0) + 1;
        });
      });
      availableWoodTypes = Object.entries(woodCounts)
        .map(([value, count]) => ({ value, count }))
        .sort((a, b) => a.value.localeCompare(b.value));
    }

    // Tekstilne ploče: extract BLOQ families (brand 8)
    if (category.slug === 'tekstilne-ploce') {
      const familySet = new Set<string>();
      allCollections.forEach(p => {
        if (p.brandId !== '8') return; // Only BLOQ
        const familySpec = p.specs?.find((s: { key: string }) => s.key === 'family')?.value;
        if (familySpec) {
          familySet.add(familySpec);
        }
      });
      availableFamilies = Array.from(familySet).sort((a, b) => a.localeCompare(b));
    }

    // Extract unique thickness values from our actual data (collections + colors from JSON)
    // For LVT: from collections specs and JSON colors
    // For Vinil: from collections specs and JSON colors (if available)
    // For Linoleum: from collections specs
    // IMPORTANT: Use allProductsForThickness (without filters) to ensure all options remain visible
    if (category.slug === 'lvt' || category.slug === 'vinil' || category.slug === 'linoleum') {
      const thicknessSet = new Set<string>();
      const thicknessSetHomogeni = new Set<string>();
      const thicknessSetHeterogeni = new Set<string>();

      // Get all collections from unfiltered products to calculate available thickness
      const allCollectionsForThickness = allProductsForThickness.filter(p =>
        (
          p.sku?.startsWith('GER-') ||
          p.sku?.startsWith('TARKETT-') ||
          p.sku?.startsWith('PODOVI-COLLECTION-') ||
          p.sku?.startsWith('WOLFLOR-VINYL-') ||
          p.sku?.startsWith('LINOLEUM-') ||
          p.sku?.startsWith('VINIL-')
        ) ?? false
      );

      // Get thicknesses from collections (using unfiltered products)
      allCollectionsForThickness.forEach(p => {
        const thicknessSpec = p.specs.find(s => s.key === 'thickness');
        if (thicknessSpec) {
          const thicknessStr = normalizeThicknessValue(thicknessSpec.value);
          if (thicknessStr) {
            thicknessSet.add(thicknessStr);

            // For Vinil: separate by type
            if (category.slug === 'vinil') {
              const typeSpec = p.specs.find(s => s.key === 'type');
              if (typeSpec) {
                const productType = typeSpec.value.toLowerCase();
                if (productType === 'homogeni') {
                  thicknessSetHomogeni.add(thicknessStr);
                } else if (productType === 'heterogeni') {
                  thicknessSetHeterogeni.add(thicknessStr);
                }
              }
            }
          }
        }
      });

      // Get thicknesses from colors in JSON file
      try {
        let jsonFileName: string;
        if (category.slug === 'lvt') {
          jsonFileName = 'lvt_colors_complete.json';
        } else if (category.slug === 'vinil') {
          jsonFileName = 'vinyl_colors_complete.json';
        } else if (category.slug === 'linoleum') {
          jsonFileName = 'linoleum_colors_complete.json';
        } else {
          jsonFileName = '';
        }

        if (jsonFileName) {
          const jsonPath = join(process.cwd(), 'public', 'data', jsonFileName);
          const jsonData = JSON.parse(readFileSync(jsonPath, 'utf8'));

          if (category.slug === 'vinil' && jsonData.collections && Array.isArray(jsonData.collections)) {
            // For Vinil: process collections structure
            jsonData.collections.forEach((collection: any) => {
              const collectionSlug = (collection.slug || '').toLowerCase();
              const isHomogeniCollection = collectionSlug.startsWith('mipolam-');

              if (collection.colors && Array.isArray(collection.colors)) {
                collection.colors.forEach((color: any) => {
                  const thicknessValue = color.overall_thickness || color.thickness || color.debljina;
                  const thicknessStr = normalizeThicknessValue(thicknessValue);
                  if (thicknessStr) {
                    thicknessSet.add(thicknessStr);
                    const countEntry = jsonThicknessColorCounts.get(thicknessStr) || { homogeni: 0, heterogeni: 0, total: 0 };
                    countEntry.total += 1;
                    if (isHomogeniCollection) {
                      thicknessSetHomogeni.add(thicknessStr);
                      countEntry.homogeni += 1;
                    } else {
                      thicknessSetHeterogeni.add(thicknessStr);
                      countEntry.heterogeni += 1;
                    }
                    jsonThicknessColorCounts.set(thicknessStr, countEntry);
                  }
                });
              }
            });
          } else if (jsonData.colors && Array.isArray(jsonData.colors)) {
            // For LVT and Linoleum: process colors array
            jsonData.colors.forEach((color: any) => {
              const thicknessValue = color.overall_thickness || color.thickness || color.debljina;
              const thicknessStr = normalizeThicknessValue(thicknessValue);
              if (thicknessStr) {
                thicknessSet.add(thicknessStr);
                const countEntry = jsonThicknessColorCounts.get(thicknessStr) || { homogeni: 0, heterogeni: 0, total: 0 };
                countEntry.total += 1;
                jsonThicknessColorCounts.set(thicknessStr, countEntry);
              }
            });
          }
        }
      } catch (error) {
        console.error(`Error reading ${category.slug} colors JSON:`, error);
      }

      // Sort thickness values numerically
      availableThickness = Array.from(thicknessSet).sort((a, b) => parseFloat(a) - parseFloat(b));

      // For Vinil: also sort by type
      if (category.slug === 'vinil') {
        availableThicknessByType = {
          homogeni: Array.from(thicknessSetHomogeni).sort((a, b) => parseFloat(a) - parseFloat(b)),
          heterogeni: Array.from(thicknessSetHeterogeni).sort((a, b) => parseFloat(a) - parseFloat(b))
        };
      }
    }

    // Laminat: extract thickness values from product specs
    // IMPORTANT: Use allProductsForThickness (without filters) to ensure all options remain visible
    if (category.slug === 'laminat') {
      const thicknessSet = new Set<string>();

      // Get thickness from all laminate products (using unfiltered products)
      allProductsForThickness.forEach(p => {
        const thicknessSpec = p.specs?.find(s => s.key === 'thickness' || s.key === 'overall_thickness');
        if (thicknessSpec) {
          // Normalize: "8 mm" -> "8", "10mm" -> "10"
          const normalizedValue = thicknessSpec.value.replace(/\s+/g, '').replace(/mm/gi, '').trim();
          const thicknessValue = parseFloat(normalizedValue);
          if (!isNaN(thicknessValue)) {
            thicknessSet.add(thicknessValue.toString());
          }
        }
      });

      availableThickness = Array.from(thicknessSet).sort((a, b) => parseFloat(a) - parseFloat(b));
    }

    // Apply collection filter ONLY to collections (not to colors) - for LVT and Parket
    // This happens AFTER extracting availableCollections so filter options remain visible
    if (category.slug === 'lvt') {
      const selectedCollections = searchParams.collections ? searchParams.collections.split(',') : [];
      if (selectedCollections.length > 0) {
        collections = allCollections.filter(p => {
          // Tarkett po 'collection' spec-u, Gerflor po imenu (Creation/SAGA grupe) — shared helper
          const group = getCollectionFacetValue(p, 'lvt');
          return Boolean(group && selectedCollections.includes(group));
        });
        // Also filter Tarkett colors by their collection spec
        colors = colors.filter(p => {
          const collSpec = p.specs?.find((s: { key: string }) => s.key === 'collection')?.value;
          if (!collSpec) return true; // Keep non-Tarkett colors
          return selectedCollections.includes(collSpec);
        });
      } else {
        collections = allCollections;
      }
    } else if (category.slug === 'laminat') {
      // Laminat: LAM- proizvodi (header po kolekciji), jedna kartica po kolekciji – bez duplikata
      const isLaminatCollection = (p: { sku?: string | null }) => p.sku?.startsWith('LAM-');
      const laminatHeaders = allCollections.filter(p => isLaminatCollection(p));
      const byCollectionName = new Map<string, (typeof allProducts)[0]>();
      for (const p of laminatHeaders) {
        const name = getCollectionFacetValue(p, 'laminat') || p.name;
        if (!byCollectionName.has(name)) byCollectionName.set(name, p);
      }
      const selectedCollections = searchParams.collections ? searchParams.collections.split(',') : [];
      if (selectedCollections.length > 0) {
        collections = selectedCollections
          .map(name => byCollectionName.get(name))
          .filter((p): p is (typeof allProducts)[0] => p != null);
        colors = colors.filter(p => {
          const name = p.specs?.find(s => s.key === 'collection')?.value;
          return name && selectedCollections.includes(name);
        });
      } else {
        collections = Array.from(byCollectionName.values())
          .filter((p): p is (typeof allProducts)[0] => !!isLaminatCollection(p))
          .sort((a, b) =>
            (getCollectionFacetValue(a, 'laminat') || a.name).localeCompare(getCollectionFacetValue(b, 'laminat') || b.name)
          );
      }

      // Laminat: filter by thickness
      // Build a map of collection name -> thickness value from collection headers
      // Poređenje ide preko normalizeThicknessValue da "8", "8.00" i "8 mm" budu ista vrednost
      const collectionThicknessMap = new Map<string, string>();
      byCollectionName.forEach((collProduct, collName) => {
        const thicknessSpec = collProduct.specs?.find((s: { key: string; value: string }) => s.key === 'thickness' || s.key === 'overall_thickness');
        const normalized = normalizeThicknessValue(thicknessSpec?.value);
        if (normalized) {
          collectionThicknessMap.set(collName, normalized);
        }
      });

      const selectedThickness = (searchParams.thickness ? searchParams.thickness.split(',') : [])
        .map((value) => normalizeThicknessValue(value))
        .filter((value): value is string => Boolean(value));
      if (selectedThickness.length > 0) {
        // Filter collections by their direct thickness spec
        collections = collections.filter(p => {
          const thicknessSpec = p.specs?.find(s => s.key === 'thickness' || s.key === 'overall_thickness');
          const normalized = normalizeThicknessValue(thicknessSpec?.value);
          return normalized !== null && selectedThickness.includes(normalized);
        });

        // Filter colors by their collection's thickness (since variants don't have thickness spec)
        colors = colors.filter(p => {
          const collName = p.specs?.find(s => s.key === 'collection')?.value;
          if (!collName) return false;
          const thickness = collectionThicknessMap.get(collName);
          return Boolean(thickness && selectedThickness.includes(thickness));
        });
      }
    } else if (category.slug === 'parket') {
      const selectedCollections = searchParams.collections ? searchParams.collections.split(',') : [];
      if (selectedCollections.length > 0) {
        collections = allCollections.filter(p => {
          const collectionName = getCollectionFacetValue(p, 'parket');
          return Boolean(collectionName && selectedCollections.includes(collectionName));
        });
        // Za Parket, filtriraj i "boje" (varijante) po efektivnoj kolekciji da CategoryTabs prikaže ispravne varijante
        colors = colors.filter(p => {
          const specVal = p.specs?.find(s => s.key === 'collection')?.value;
          const effective = getEffectiveParketCollection(p.slug, specVal) || specVal || (p as Product & { collectionSlug?: string }).collectionSlug;
          return effective && selectedCollections.includes(effective);
        });
      } else {
        collections = allCollections;
      }
      // Parket: filtriraj boje po vrstama drveta (Hrast / Jasen) – više izbora, spec ili infer iz slug-a
      const selectedWoodTypes = searchParams.woodType?.split(',').map(s => s.trim()).filter(Boolean) || [];
      if (selectedWoodTypes.length > 0) {
        colors = colors.filter(p => selectedWoodTypes.some(wt => productMatchesWoodType(p, wt)));
        // Prikaži samo kolekcije koje imaju bar jednu varijantu izabrane vrste drveta
        const collectionNamesWithSelectedWood = new Set(
          colors
            .map(p => {
              const specVal = p.specs?.find(s => s.key === 'collection')?.value;
              return getEffectiveParketCollection(p.slug, specVal) || specVal || (p as Product & { collectionSlug?: string }).collectionSlug;
            })
            .filter(Boolean)
        );
        collections = collections.filter(p => {
          const specVal = p.specs?.find(s => s.key === 'collection')?.value;
          const name = getEffectiveParketCollection(p.slug, specVal) || specVal || p.name;
          return collectionNamesWithSelectedWood.has(name);
        });
      }
    } else if (category.slug === 'tekstilne-ploce') {
      const selectedFamilies = searchParams.family ? searchParams.family.split(',') : [];
      if (selectedFamilies.length > 0) {
        // Obuhvati i BLOQ (porodice) i ostale (npr. Gerflor nema family filter)
        collections = allCollections.filter(p => {
          if (p.brandId !== '8') return true; // Gerflor prođe nepovređen
          const familySpec = p.specs?.find(s => s.key === 'family')?.value;
          return familySpec && selectedFamilies.includes(familySpec);
        });

        colors = colors.filter(p => {
          if (p.brandId !== '8') return true;
          const familySpec = p.specs?.find(s => s.key === 'family')?.value;
          return familySpec && selectedFamilies.includes(familySpec);
        });
      } else {
        collections = allCollections;
      }
    } else {
      // For Vinil and other categories, show all collections (no collection filter)
      collections = allCollections;
    }

    // Za parket u tabu Boje prikazujemo stvarne boje (varijante) sa njihovim imenom i slikom, kao na Tekstilne ploče – bez preslikavanja na kolekciju.

    // Build brands record for all products
    for (const product of allProducts) {
      if (!brandsRecord[product.brandId]) {
        const brand = allBrands.find(b => b.id === product.brandId);
        if (brand) {
          brandsRecord[product.brandId] = brand;
        }
      }
    }
  }

  // ===== FILTERI 2.0 Faza 1: sortiranje, brojači po opciji, čipovi aktivnih filtera =====
  const hasPrices = categoryProducts.some((p) => typeof p.price === 'number' && p.price > 0);
  const sortMode = resolveCategorySortMode(searchParams.sort, hasPrices);
  // Sort po PRIKAZNOM imenu: deo DB proizvoda nosi brend prefiks u name ("Gerflor Creation 30"),
  // a kartice ga skidaju (pravilo: brend se ne ponavlja u naslovu) — bez strip-a bi
  // "Deal SPC 30" stajao ispred "Creation 30" iako korisnik vidi imena bez brenda.
  const brandNameById = new Map(allBrands.map((brand) => [brand.id, brand.name]));
  const getListingSortName = (p: Product): string => {
    const name = p.name || '';
    const brandName = brandNameById.get(p.brandId);
    if (brandName && name.toLowerCase().startsWith(`${brandName.toLowerCase()} `)) {
      return name.slice(brandName.length + 1);
    }
    return name;
  };
  collections = sortCategoryProducts(collections, sortMode, getListingSortName);
  colors = sortCategoryProducts(colors, sortMode, getListingSortName);
  const displayedFlatProducts = hasCollectionTabs ? [] : sortCategoryProducts(filteredProducts, sortMode, getListingSortName);

  // Univerzum za brojače uz opcije: kolekcijske kartice (uz listing curation) za tab
  // kategorije, svi proizvodi kategorije za flat kategorije (alat, otirači...).
  let facetCountUniverse: Product[];
  if (hasCollectionTabs) {
    let headers = filterCategoryListingCollections(
      category.slug,
      categoryProducts.filter((p) => hasCollectionSku(p)),
      listingMode
    );
    if (category.slug === 'laminat') {
      const seen = new Set<string>();
      headers = headers.filter((p) => {
        const name = getCollectionFacetValue(p, 'laminat') || p.name;
        if (seen.has(name)) return false;
        seen.add(name);
        return true;
      });
    }
    facetCountUniverse = headers;
  } else {
    facetCountUniverse = categoryProducts;
  }

  const categoryColorUniverse = hasCollectionTabs ? categoryProducts.filter((p) => !hasCollectionSku(p)) : [];
  const brandFilterOptions = availableBrands.map((brand) => {
    let count = countFacetOption(facetCountUniverse, facetSelections, category.slug, 'brandIds', brand.id);
    if (count === 0 && categoryColorUniverse.length > 0) {
      // Brend može da postoji samo kroz boje/varijante (bez header kartice) — ne sivi ga pogrešno.
      count = countFacetOption(categoryColorUniverse, facetSelections, category.slug, 'brandIds', brand.id);
    }
    return { value: brand, count };
  });
  const collectionFilterOptions = availableCollections.map((value) => ({
    value,
    count: countFacetOption(facetCountUniverse, facetSelections, category.slug, 'collections', value),
  }));
  const familyFilterOptions = availableFamilies.map((value) => ({
    value,
    count: countFacetOption(facetCountUniverse, facetSelections, category.slug, 'families', value),
  }));
  const thicknessFilterOptions = availableThickness.map((value) => {
    // Laminat opcije nose kratki format ("8"), lvt/vinil/linoleum normalizovan ("2.00") —
    // brojanje uvek ide preko normalizovane vrednosti.
    const normalizedValue = normalizeThicknessValue(value) ?? value;
    let count = countFacetOption(facetCountUniverse, facetSelections, category.slug, 'thickness', normalizedValue);
    if (count === 0) {
      // Debljina može da postoji samo na JSON bojama (ne na headerima) — fallback da ne posivi opciju.
      const jsonCounts = jsonThicknessColorCounts.get(normalizedValue);
      if (jsonCounts) {
        count = category.slug === 'vinil' && facetSelections.vinylType
          ? (facetSelections.vinylType === 'homogeni' ? jsonCounts.homogeni : jsonCounts.heterogeni)
          : jsonCounts.total;
      }
    }
    return { value, count };
  });

  const resultsCount = hasCollectionTabs ? collections.length + colors.length : displayedFlatProducts.length;
  const resultsLabel = hasCollectionTabs
    ? `${collections.length} ${pluralizeSr(collections.length, 'kolekcija', 'kolekcije', 'kolekcija')} · ${colors.length} ${pluralizeSr(colors.length, 'boja', 'boje', 'boja')}`
    : `${displayedFlatProducts.length} ${pluralizeSr(displayedFlatProducts.length, 'proizvod', 'proizvoda', 'proizvoda')}`;

  // Čipovi aktivnih filtera: kanonski oblik parametara (brands = ID-jevi, thickness = normalizovano),
  // svaki čip vodi na isti URL bez TE vrednosti; sort i color preživljavaju.
  const basePath = `/kategorije/${params.slug}`;
  const canonicalFilterParams: Record<string, string | undefined> = {
    search: facetSelections.search,
    brands: resolvedBrandIds.length > 0 ? resolvedBrandIds.join(',') : undefined,
    type: vinylTypeFilter,
    safety: facetSelections.safetyOnly ? '1' : undefined,
    zidne: facetSelections.wallOnly ? '1' : undefined,
    collections: selectedCollectionValues.length > 0 ? selectedCollectionValues.join(',') : undefined,
    family: facetSelections.families.length > 0 ? facetSelections.families.join(',') : undefined,
    listing: searchParams.listing || undefined,
    thickness: selectedThicknessValues.length > 0 ? selectedThicknessValues.join(',') : undefined,
    woodType: facetSelections.woodTypes.length > 0 ? facetSelections.woodTypes.join(',') : undefined,
    toolGroup: selectedToolGroupSlugs.length > 0 ? selectedToolGroupSlugs.join(',') : undefined,
    toolSubcategory: selectedToolSubcategorySlugs.length > 0 ? selectedToolSubcategorySlugs.join(',') : undefined,
    priceMin: searchParams.priceMin || undefined,
    priceMax: searchParams.priceMax || undefined,
    inStock: searchParams.inStock || undefined,
    color: searchParams.color || undefined,
    sort: searchParams.sort || undefined,
  };

  const activeFilterChips: ActiveFilterChip[] = [];
  const addFilterChip = (paramKey: string, label: string, value?: string) => {
    activeFilterChips.push({
      key: `${paramKey}:${value ?? '*'}`,
      label,
      href: buildFilterRemovalHref(basePath, canonicalFilterParams, paramKey, value),
    });
  };

  if (facetSelections.search) addFilterChip('search', `Pretraga: ${facetSelections.search}`);
  for (const brandId of resolvedBrandIds) {
    const brand = allBrands.find((b) => b.id === brandId);
    addFilterChip('brands', brand?.name || brandId, brandId);
  }
  for (const value of selectedCollectionValues) addFilterChip('collections', value, value);
  for (const value of facetSelections.families) addFilterChip('family', value, value);
  for (const value of selectedThicknessValues) addFilterChip('thickness', `${parseFloat(value)} mm`, value);
  for (const value of facetSelections.woodTypes) addFilterChip('woodType', value, value);
  if (vinylTypeFilter) addFilterChip('type', vinylTypeFilter === 'homogeni' ? 'Homogeni' : 'Heterogeni');
  if (facetSelections.safetyOnly) addFilterChip('safety', 'Protivklizni/Sigurnosni');
  if (facetSelections.wallOnly) addFilterChip('zidne', 'Zidne obloge');
  if (searchParams.listing) {
    addFilterChip('listing', listingMode === 'accessory' ? 'Prateći asortiman' : listingMode === 'all' ? 'Sve stavke' : 'Kolekcije');
  }
  for (const slug of selectedToolGroupSlugs) {
    const option = availableToolGroups.find((o) => o.slug === slug);
    addFilterChip('toolGroup', option?.value || slug, slug);
  }
  for (const slug of selectedToolSubcategorySlugs) {
    const option = availableToolSubcategories.find((o) => o.slug === slug);
    addFilterChip('toolSubcategory', option?.value || slug, slug);
  }
  if (canonicalFilterParams.priceMin || canonicalFilterParams.priceMax) {
    const priceLabel = canonicalFilterParams.priceMin && canonicalFilterParams.priceMax
      ? `Cena ${canonicalFilterParams.priceMin}–${canonicalFilterParams.priceMax}`
      : canonicalFilterParams.priceMin
        ? `Cena od ${canonicalFilterParams.priceMin}`
        : `Cena do ${canonicalFilterParams.priceMax}`;
    activeFilterChips.push({
      key: 'price:*',
      label: priceLabel,
      href: `${basePath}${buildCategoryQueryString(removeFilterValue(removeFilterValue(canonicalFilterParams, 'priceMin'), 'priceMax'))}`,
    });
  }
  // 'Očisti sve' briše sve filtere, a sort preživljava.
  const clearAllFiltersHref = `${basePath}${buildCategoryQueryString({ sort: searchParams.sort })}`;

  const breadcrumbItems = [
    { name: 'Početna', url: baseUrl },
    { name: category.name, url: `${baseUrl}/kategorije/${params.slug}` },
  ];
  const schemaProducts = (hasCollectionTabs ? collections : allProducts).slice(0, 100);
  const categoryPageSchema = generateCollectionPageSchema({
    name: categoryCopy.heading,
    description: categoryCopy.metaDescription,
    url: `${baseUrl}/kategorije/${params.slug}`,
    image: category.image,
    baseUrl,
    about: {
      '@type': 'Thing',
      name: category.name,
    },
  });
  const primaryCategorySlugs = ['parket', 'laminat', 'lvt', 'tekstilne-ploce', 'deking', 'vinil', 'linoleum'];
  const categoryNavItems = primaryCategorySlugs
    .map((slug) => allCategories.find((item) => item.slug === slug))
    .filter((item): item is (typeof allCategories)[number] => Boolean(item));
  return (
    <div className="min-h-screen bg-[#fbfaf8]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            generateBreadcrumbSchema(breadcrumbItems),
            categoryPageSchema,
            generateProductListSchema(schemaProducts, {
              ...category,
              description: categoryCopy.metaDescription,
            }),
          ]),
        }}
      />
      <div className="border-b border-ink-200 bg-white">
        <div className="container">
          <nav className="no-scrollbar flex min-h-[58px] items-end gap-8 overflow-x-auto" aria-label="Kategorije">
            <Link
              href="/"
              className="flex min-h-[58px] shrink-0 items-center border-b-2 border-transparent text-[18px] text-ink-700 transition-colors hover:text-ink-900 sm:text-[20px]"
            >
              Sve
            </Link>
            {categoryNavItems.map((item) => {
              const active = item.slug === category.slug;
              return (
                <Link
                  key={item.slug}
                  href={`/kategorije/${item.slug}`}
                  aria-current={active ? 'page' : undefined}
                  className={`flex min-h-[58px] shrink-0 items-center border-b-2 text-[18px] transition-colors sm:text-[20px] ${
                    active
                      ? 'border-ink-900 text-ink-900'
                      : 'border-transparent text-ink-500 hover:text-ink-900'
                  }`}
                >
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="container py-6 lg:py-8">
        <div className="mb-4">
          <Breadcrumbs items={[
            { label: category.name }
          ]} />
        </div>

        <section className="border-b border-ink-200 pb-6 pt-2">
          <div className="max-w-4xl">
            <div className="flex flex-wrap items-end gap-x-4 gap-y-2">
              <h1 className="text-4xl font-medium leading-tight text-ink-900 sm:text-5xl">
                {categoryCopy.heading}
              </h1>
              <span className="pb-1 text-[13px] text-ink-500">
                {hasCollectionTabs
                  ? `${collections.length} ${pluralizeSr(collections.length, 'kolekcija', 'kolekcije', 'kolekcija')} · ${colors.length} ${pluralizeSr(colors.length, 'boja', 'boje', 'boja')}`
                  : `${allProducts.length} ${pluralizeSr(allProducts.length, 'proizvod', 'proizvoda', 'proizvoda')}`}
              </span>
            </div>
            <p className="mt-4 max-w-3xl text-base leading-7 text-ink-700">
              {categoryCopy.lead}
            </p>
            {categoryCopy.body ? (
              <p className="mt-3 max-w-3xl text-sm leading-7 text-ink-500">
                {categoryCopy.body}
              </p>
            ) : null}
          </div>
        </section>

        {category.slug === 'parket' && (
          <div className="mt-8">
            <EssenceConfiguratorBanner />
          </div>
        )}

        <div className="mt-8 grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)] lg:items-start">
          <ProductFilters
            availableBrands={brandFilterOptions}
            currentFilters={{
              ...filtersWithoutCollections,
              listing: listingMode,
              toolGroup: selectedToolGroupSlugs,
              toolSubcategory: selectedToolSubcategorySlugs,
            }}
            availableCollections={collectionFilterOptions}
            availableFamilies={category.slug === 'tekstilne-ploce' ? familyFilterOptions : undefined}
            availableWoodTypes={category.slug === 'parket' ? availableWoodTypes : undefined}
            availableThickness={thicknessFilterOptions}
            availableThicknessByType={category.slug === 'vinil' ? availableThicknessByType : undefined}
            availableToolGroups={category.slug === 'alat' ? availableToolGroups : undefined}
            availableToolSubcategories={category.slug === 'alat' ? availableToolSubcategories : undefined}
            resultsCount={resultsCount}
            hasPrices={hasPrices}
          />

          {/* Products Grid */}
          <main className="min-w-0">
            <CategoryToolbar
              resultsLabel={resultsLabel}
              sortMode={sortMode}
              hasPriceSort={hasPrices}
              chips={activeFilterChips}
              clearAllHref={clearAllFiltersHref}
            />
            {hasCollectionTabs ? (
              <CategoryTabs
                collections={collections}
                colors={colors}
                brandsRecord={brandsRecord}
                categorySlug={category.slug}
                initialColorSlug={searchParams.color}
                vinylType={searchParams.type}
                safetyOnly={searchParams.safety === '1'}
                wallOnly={searchParams.zidne === '1'}
                listingMode={listingMode}
                searchParams={{
                  search: searchParams.search,
                  brands: searchParams.brands,
                  collections: searchParams.collections,
                  family: searchParams.family,
                  listing: searchParams.listing,
                  thickness: searchParams.thickness,
                  woodType: searchParams.woodType,
                }}
              />
            ) : (
              <>
                {displayedFlatProducts.length === 0 ? (
                  <div className="rounded-lg border border-ink-200 bg-white p-12 text-center">
                    <h3 className="mb-2 text-lg font-medium text-ink-900">
                      Nema proizvoda
                    </h3>
                    <p className="text-[13px] text-ink-500">
                      Trenutno nema proizvoda koji odgovaraju izabranim filterima.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
                    {displayedFlatProducts.map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
