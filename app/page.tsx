import { categoryRepository } from '@/lib/repositories/category-repository';
import { productRepository } from '@/lib/repositories/product-repository';
import { brandRepository } from '@/lib/repositories/brand-repository';
import HomeProductTabs, { HomeProductGroup } from '@/components/HomeProductTabs';
import { buildHomeCatalogItems, buildHomeFacetSchema } from '@/lib/catalog/home-catalog-index';
import { HOME_FILTER_QUERY_KEYS } from '@/lib/catalog/home-filter-url';
import { Product } from '@/types';
import { hasCollectionSku } from '@/lib/utils/homepage-collection-filter';
import { getEsdColorProducts } from '@/lib/product-page/color-helpers';
import { getProductImageCandidates } from '@/lib/utils/product-images';
import vinylColorsData from '@/public/data/vinyl_colors_complete.json';
import tarkettVinylHomeData from '@/public/data/tarkett_vinyl_home_colors.json';
import tarkettHeterogeneousVinylData from '@/public/data/tarkett_heterogeneous_vinyl_colors.json';
import tarkettHomogeneousVinylData from '@/public/data/tarkett_homogeneous_vinyl_colors.json';
import esdColorsData from '@/public/data/esd_colors.json';
import wolflorVinylData from '@/public/data/wolflor_vinyl_colors.json';
import lvtColorsData from '@/public/data/lvt_colors_complete.json';
import linoleumColorsData from '@/public/data/linoleum_colors_complete.json';
import gerflorLinoleumColorsData from '@/public/data/gerflor_linoleum_colors_complete.json';
import carpetTilesData from '@/public/data/carpet_tiles_complete.json';
import dessoCarpetTilesData from '@/public/data/desso_carpet_tiles.json';
import alpodCollectionsData from '@/public/data/alpod_floor_collections.json';

// ISR: početna se servira iz keša i osvežava najviše na 5 minuta (i pri svakom
// deploy-u). Filter stanje iz URL-a čita klijent posle montiranja, pa strana ne
// zavisi od searchParams (ranije: render po zahtevu, ~6 s podataka + 6 MB HTML-a).
export const revalidate = 300;

export const metadata = {
  title: 'podovi',
  description: 'Pronađite pravo rešenje za vaš prostor: laminat, vinil, parket, alati, lajsne, otirači i drugi sistemi vodećih evropskih brendova.',
};

function dedupeBySlug(products: Product[]): Product[] {
  const seen = new Set<string>();

  return products.filter((product) => {
    if (!product.slug || seen.has(product.slug)) {
      return false;
    }

    seen.add(product.slug);
    return true;
  });
}

function getCollectionName(product: Product): string {
  return product.specs?.find((spec) => spec.key === 'collection')?.value ||
    product.specs?.find((spec) => spec.key === 'brand_line')?.value ||
    product.name;
}

type SwatchColorSource = {
  collection?: string;
  collection_slug?: string;
  collection_name?: string;
  image?: string;
  image_url?: string;
  texture_url?: string;
};

type SwatchCollectionSource = {
  slug?: string;
  name?: string;
  colors?: SwatchColorSource[];
};

const SWATCH_DATASETS = [
  vinylColorsData,
  tarkettVinylHomeData,
  tarkettHeterogeneousVinylData,
  tarkettHomogeneousVinylData,
  esdColorsData,
  wolflorVinylData,
  lvtColorsData,
  linoleumColorsData,
  gerflorLinoleumColorsData,
  carpetTilesData,
  dessoCarpetTilesData,
  alpodCollectionsData,
] as const;

function normalizeSwatchKey(value: string | null | undefined): string {
  return String(value || '')
    .trim()
    .replace(/¹/g, '1')
    .replace(/²/g, '2')
    .replace(/³/g, '3')
    .toLowerCase()
    .replace(/^(gerflor|tarkett|wolflor|podovi|bloq|desso)(?:\s+|-)+/, '')
    .replace(/[^a-z0-9čćžšđ]+/gi, '-')
    .replace(/^-+|-+$/g, '');
}

function getSwatchImage(color: SwatchColorSource): string | null {
  return color.texture_url || color.image_url || color.image || null;
}

function addSwatches(index: Map<string, string[]>, keys: Array<string | null | undefined>, colors: SwatchColorSource[] = []) {
  const normalizedKeys = Array.from(new Set(keys.map(normalizeSwatchKey).filter(Boolean)));

  for (const color of colors) {
    const image = getSwatchImage(color);
    if (!image) {
      continue;
    }

    for (const key of normalizedKeys) {
      const existing = index.get(key) || [];
      if (!existing.includes(image)) {
        existing.push(image);
      }
      index.set(key, existing.slice(0, 6));
    }
  }
}

function buildSwatchIndex() {
  const index = new Map<string, string[]>();

  for (const dataset of SWATCH_DATASETS) {
    const source = dataset as {
      collections?: SwatchCollectionSource[] | number;
      colors?: SwatchColorSource[];
    };

    if (Array.isArray(source.collections)) {
      for (const collection of source.collections) {
        addSwatches(
          index,
          [
            collection.slug,
            collection.name,
            collection.slug ? `gerflor-${collection.slug}` : null,
            collection.slug ? `tarkett-${collection.slug}` : null,
            collection.slug ? `wolflor-${collection.slug}` : null,
            collection.slug ? `podovi-${collection.slug}` : null,
          ],
          collection.colors || [],
        );
      }
    }

    if (Array.isArray(source.colors)) {
      const grouped = new Map<string, SwatchColorSource[]>();

      for (const color of source.colors) {
        const key = color.collection_slug || color.collection || color.collection_name;
        const normalizedKey = normalizeSwatchKey(key);
        if (!normalizedKey) {
          continue;
        }

        grouped.set(normalizedKey, [...(grouped.get(normalizedKey) || []), color]);
      }

      for (const [key, colors] of Array.from(grouped.entries())) {
        const first = colors[0];
        addSwatches(index, [key, first?.collection, first?.collection_slug, first?.collection_name], colors);
      }
    }
  }

  return index;
}

const COLLECTION_SWATCH_INDEX = buildSwatchIndex();

function getIndexedCollectionSwatches(product: Product): string[] {
  const keys = [
    getCollectionName(product),
    product.slug,
    product.slug.replace(/^(gerflor|tarkett|wolflor|podovi|bloq|desso)-/, ''),
  ].map(normalizeSwatchKey);

  for (const key of keys) {
    const swatches = COLLECTION_SWATCH_INDEX.get(key);
    if (swatches?.length) {
      return swatches;
    }
  }

  return [];
}

function collectCollectionSwatches(product: Product, allProducts: Product[]): string[] {
  const indexedSwatches = getIndexedCollectionSwatches(product);
  if (indexedSwatches.length > 0) {
    return indexedSwatches;
  }

  const collectionName = getCollectionName(product);
  const seen = new Set<string>();
  const swatches: string[] = [];

  for (const candidate of allProducts) {
    if (candidate.id === product.id || getCollectionName(candidate) !== collectionName) {
      continue;
    }

    const image = getProductImageCandidates(candidate, 'thumb')[0];
    if (!image?.url || seen.has(image.url)) {
      continue;
    }

    seen.add(image.url);
    swatches.push(image.url);

    if (swatches.length >= 6) {
      break;
    }
  }

  return swatches;
}

function backfillCollectionImages(product: Product, allProducts: Product[]): Product {
  const swatchImages = collectCollectionSwatches(product, allProducts);
  const swatchPayload = swatchImages.length > 0 ? { swatchImages } : {};

  if (product.images?.length > 0) {
    return { ...product, ...swatchPayload };
  }

  const collectionName = getCollectionName(product);
  const variantWithImage = allProducts.find((candidate) => {
    if (candidate.id === product.id || hasCollectionSku(candidate) || !candidate.images?.length) {
      return false;
    }

    return getCollectionName(candidate) === collectionName;
  });

  return variantWithImage ? { ...product, images: variantWithImage.images, ...swatchPayload } : { ...product, ...swatchPayload };
}

function selectHomepageProducts(products: Product[]): Product[] {
  const collectionProducts = products.filter(hasCollectionSku);
  const source = collectionProducts.length > 0 ? collectionProducts : products;

  return dedupeBySlug(source)
    .map((product) => backfillCollectionImages(product, products))
    .sort((a, b) => Number((b.images?.length || 0) > 0) - Number((a.images?.length || 0) > 0));
}

function selectHomepageColors(products: Product[]): Product[] {
  return dedupeBySlug(products.filter((product) => !hasCollectionSku(product)));
}

export default async function HomePage() {
  const categories = await categoryRepository.findAll();
  const homepageCategories = categories;
  const [brands, productBuckets] = await Promise.all([
    brandRepository.findAll(),
    Promise.all(homepageCategories.map((category) => productRepository.findByCategory(category.id))),
  ]);
  const brandsRecord = Object.fromEntries(brands.map((brand) => [brand.id, brand]));
  const schemaSources: Parameters<typeof buildHomeFacetSchema>[0] = [];
  const productGroups: HomeProductGroup[] = homepageCategories
    .map((category, index) => {
      const products = productBuckets[index] || [];
      const contextProducts = category.id === '8' ? [...products, ...getEsdColorProducts()] : products;
      const selectedProducts = selectHomepageProducts(products);
      const colorProducts = selectHomepageColors(contextProducts);
      // Kontekst nasleđivanja = cela kategorija (kolekcije + boje); klijentu idu samo
      // sažete kolekcijske stavke. Boje služe ovde samo da šema zna sve grupe.
      const items = buildHomeCatalogItems(category.slug, contextProducts, selectedProducts);
      if (items.length > 0) {
        schemaSources.push({
          slug: category.slug,
          name: category.name,
          items: [...items, ...buildHomeCatalogItems(category.slug, contextProducts, colorProducts, 'color')],
          products: contextProducts,
        });
      }

      return {
        category: {
          id: category.id,
          name: category.name,
          slug: category.slug,
        },
        products: items,
        totalCount: items.length,
        colorCount: colorProducts.length,
      };
    })
    .filter((group) => group.products.length > 0);

  const facetSchema = buildHomeFacetSchema(schemaSources);
  // Statička strana se prvo iscrta bez filtera; kada link nosi filter parametre,
  // katalog ostaje nevidljiv dok klijent ne primeni stanje iz URL-a (bez bljeska
  // nefiltriranog kataloga i bez pomeranja sadržaja — CLS). Sigurnosni istek 3 s.
  const filterQueryKeys = Array.from(new Set([
    ...Object.values(HOME_FILTER_QUERY_KEYS),
    ...facetSchema.filter((entry) => entry.scope === 'all').map((entry) => entry.param),
  ]));
  const pendingFilterScript = `(function(){try{var k=${JSON.stringify(filterQueryKeys)};var p=new URLSearchParams(location.search);if(k.some(function(x){return p.has(x)})){var d=document.documentElement;d.setAttribute('data-home-filters','pending');setTimeout(function(){d.removeAttribute('data-home-filters')},3000)}}catch(e){}})();`;

  return (
    <div className="bg-white">
      <script dangerouslySetInnerHTML={{ __html: pendingFilterScript }} />
      <HomeProductTabs
        groups={productGroups}
        brandsRecord={brandsRecord}
        facetSchema={facetSchema}
      />
    </div>
  );
}
