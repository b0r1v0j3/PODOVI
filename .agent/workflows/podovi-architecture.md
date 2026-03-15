---
description: PODOVI site architecture — data flow from JSON to rendered product pages
---

# PODOVI Site Architecture & Data Flow

> **Read this FIRST before making ANY product data or page changes.**

## Core Principle

Data flows through a strict 4-step pipeline. **Missing ANY step = data won't display.**

```
JSON data file → resolve-product.ts → Product object → page.tsx → UI components
```

---

## 1. Data Sources (JSON files in `/public/data/`)

| File | Category | Brand | Key Fields |
|------|----------|-------|------------|
| `bloq_carpet_tiles.json` | Tekstilne (4) | BLOQ (8) | `colors[]` with `collection_slug`, `collection_name`, `characteristics`, `description`, `collection_description_sr`, `color_range_text`, `documents`, `backing_variants` |
| `carpet_tiles_complete.json` | Tekstilne (4) | Gerflor (6) | `colors[]` with `collection_slug`, `characteristics` |
| `lvt_colors_complete.json` | LVT (6) | Gerflor (6) | `colors[]` with `collection`, `specs`, `documents` |
| `linoleum_colors_complete.json` | Linoleum (7) | Gerflor (6) | `colors[]` with `collection`, `specs`, `documents` |
| `vinyl_colors_complete.json` | Vinil (2) | Gerflor (6) | `collections[]` with `colors[]` inside |
| `vinyl_special_colors.json` | Vinil (2) | Gerflor (6) | `collections[]` with `colors[]`, collection `description`, `characteristics`, optional `collection_image_url`, color `image` |
| `tarkett_vinyl_home_colors.json` | Vinil (2) | Tarkett (3) | `collections[]` with `colors[]`, `documents`, `detailsSections`, `collection_image_url`, `url`, `characteristics` scraped from the official Tarkett home vinyl catalog |
| `esd_colors.json` | Elektroprovodni (8) | Gerflor (6) | `collections[]` with `colors[]`, local `image` paths |
| `industrial_colors.json` | Industrijske ploce (9) | Gerflor (6) | `collections[]` with `colors[]`, collection `description`, `characteristics`, optional `collection_image_url`, color `image` |
| `sport_colors.json` | Sport (10) | Gerflor (6) | `collections[]` with `colors[]`, collection `description`, `characteristics`, optional `collection_image_url`, color `image` |
| `tarkett_sport_colors.json` | Sport (10) | Tarkett (3) | `collections[]` with `colors[]`, `documents`, `detailsSections`, `collection_image_url`, `url`, `characteristics` scraped from the official Tarkett sports catalog |
| `tis_deking_products.json` | Deking (5) | TimberTech (10)| array of products with `categoryId`, `brandId`, `specs`, `images` |
| `documents_index.json` | All | — | Fallback doc lookup by category + collection |
| `tarkett_documents_index.json` | Laminat (1), Parket (3) | Tarkett (3) | Kurirani PDF indeks po kolekciji (`laminat`, `parket`) za dokument tab fallback |
| `welding_rods.json` | Accessories | — | Welding rod products |

Other data: `lib/data/tarkett-products.ts` (Parket cat 3, Laminat cat 1; parket legacy `collection: Parket` fallback sloj je očišćen i više ne treba uvoditi nove generičke varijante van pravih kolekcija), `lib/data/tarkett-laminate-slug-mapping.ts` (stari lokalni Tarkett laminat slugovi → zvanični kanonski slugovi, koristi se za redirect kompatibilnost i metadata canonical lookups), `lib/repositories/product-repository.ts` (DB + merge sloj), `lib/data/manual-collection-products.ts` (manual collection header proizvodi za Vinil specijalne, Industrijske ploce i Sport; cita `collection_image_url` iz JSON-a kad postoji, ne proverava `public/` preko `fs`, i vraca klonirane proizvode da color merge ne bi mutirao shared kolekcije), `lib/data/mock-data.ts` (legacy/mock category + brand fallback podaci), `tools/download_gerflor_highres_zip.js` (Gerflor ZIP downloader koji lokalno raspakuje arhivu, bira najbolji JPG — uz preferenciju za clean fajl bez `loupe/zoom` preview oznaka — i opciono uploaduje samo tu finalnu sliku u `product-images` bucket; ako se na Supabase prepisuje ista object putanja, JSON `image` URL treba dobiti novu `?v=...` verziju da browser/CDN ne zadrze staru sliku u kešu), `tools/extract_tarkett_sports.js` (Playwright + `window.__NUXT__` extractor za zvanični Tarkett sport katalog; od 16.03.2026 sanitizuje polomljene reči/razmake iz zvaničnog payload-a i uklanja inventarske stavke poput `Na lageru` iz `detailsSections` pre upisa u JSON), `tools/extract_tarkett_vinyl_home.js` (Playwright + `window.__NUXT__` extractor za zvanični Tarkett `Vinil za kuću` katalog; collection page HTML se uzima preko `page.content()`, a detalji boja preko `json-collection-product/...` endpointa), `scripts/audit-tarkett-sync.ts` (duboki audit Parket/Laminat vs zvanični Tarkett katalog, docs index i Supabase kada su env varijable dostupne; od 15.03.2026 prijavljuje raw count, comparable count, missing/extra/duplicate design slugove i normalizuje parket alias slugove poput `rumba-/tango-` copper/premium), `scripts/sync-tarkett-supabase.ts` (dry-run/apply sync alat koji pravi backup u `output/` i poravnava produkcioni Supabase Parket/Laminat sa kanonskim `tarkett-products.ts` skupom po slug/SKU match pravilima).

### Category IDs
- `1` = Laminat, `2` = Vinil, `3` = Parket, `4` = Tekstilne ploce, `5` = Deking, `6` = LVT, `7` = Linoleum, `8` = Elektroprovodni, `9` = Industrijske ploce, `10` = Sport (Gerflor + Tarkett)

### Brand IDs
- `3` = Tarkett, `6` = Gerflor, `8` = BLOQ, `10` = TimberTech

---

## 2. Product Resolution (`lib/product-page/resolve-product.ts`)

**This is the MOST CRITICAL file.** It converts raw JSON data → `Product` object.

`resolveProductBySlug(slug)` tries these in order:
1. Parket collection check (Tarkett products)
2. DB product lookup (`productRepository.findBySlug`)
3. `gerflor-*` slug: tries LVT → Linoleum → Vinil → Industrijske ploce → Sport → Carpet JSON
4. direct Sport / ESD / Industrijske nested collection match (supports mixed-brand sport slugs including `tarkett-*`)
5. `bloq-*` slug: finds first matching color in `bloq_carpet_tiles.json`, builds Product
6. `tarkett-*` slug fallback for Tarkett collection/product records
7. Collection-color format: matches collection then extracts color
8. Direct color slug lookup

### ⚠️ CRITICAL: When adding new fields to JSON
You MUST also update `resolve-product.ts` to map those fields into the returned `Product` object. The `Product` type (`types/index.ts` line 42-63) defines what fields are available:

```typescript
interface Product {
  id, name, slug, sku, categoryId, brandId,
  shortDescription, description,      // ← text content
  images: ProductImage[],              // ← hero/product images
  specs: ProductSpec[],                // ← { key, label, value }[]
  price?, priceUnit?,
  inStock, featured,
  externalLink?,
  detailsSections?,                    // ← parsed description sections
  documents?: { title, url }[],       // ← PDF links (tech sheets, brochures)
  createdAt, updatedAt
}
```

**If a field isn't in this type, the page component can't use it.**

---

## 3. Product Page Module (`lib/product-page/`)

| File | Purpose |
|------|---------|
| `resolve-product.ts` | Slug → Product object (main resolver) |
| `prepare-colors.ts` | Builds color swatches for `ProductColorSelector`; handles `mergeSelectedColor` when user picks a color across LVT/Vinil/ESD/Industrijske/Sport |
| `color-helpers.ts` | Low-level helpers: `loadColorFromJson`, `colorToProduct`, `collectionFromColor`, `buildSpecsFromColor`, nested collection merge helpers |
| `spec-helpers.ts` | `filterSpecsForDisplay()` (hides internal specs), `parseDescriptionToSections()` (splits description into titled sections) |
| `types.ts` | `ColorFromJSON`, `ColorSource`, `Props` types |
| `index.ts` | Barrel exports |

### ⚠️ CRITICAL: `mergeSelectedColor` in `prepare-colors.ts`
When a user selects a color (?color=xxx), this function **overwrites** `product.name`, `product.images`, `product.specs`, and `product.description` with the selected color's data. If you add new fields that should update on color change, update this function too. The caller must pass a cloned product object, not a shared cached object from a loader/repository.

### ⚠️ CRITICAL: `prepareCustomColors` in `prepare-colors.ts`
This builds the color swatch list for `ProductColorSelector`. For BLOQ it reads `bloq_carpet_tiles.json`; for Vinil/ESD/Industrijske/Sport it reads nested `collections[].colors` JSON sources and normalizes them to `{ collection, code, name, slug, image_url, characteristics }`. For the newer Gerflor nested sources, those `image` / `collection_image_url` fields can now be Supabase public URLs populated by `tools/download_gerflor_highres_zip.js --upload-supabase`, and they may intentionally include a `?v=...` cache-bust query when a Supabase object was overwritten in place with a newer clean JPG.

---

## 4. Product Detail Page (`app/proizvodi/[slug]/page.tsx`)

### Page Structure (for color-selector categories: LVT, Linoleum, Tekstilne, Vinil, Elektroprovodni, Industrijske, Sport, Parket, Laminat)

```
ProductColorSelector (hero image + color swatches + CTA)
  └── passes: initialImage, specs, customColors, brand, price, etc.

Description + Specs content:
  ├── `ProductDescriptionWithCharacteristics` → for Parket/Laminat/LVT tabs with prose opis + jedna `Ključne karakteristike` sekcija
  ├── `DescriptionSection` → for ostale kategorije; parses sectioned descriptions, a kada opis nije strukturiran prikazuje prose opis pa zatim `detailsSections`
  └── `ProductCharacteristics` → reads product.specs

Certifications row (for cat 6, 7, 4, 2, 8, 9, 10):
  ├── CertificationBadges (hardcoded per category)
  ├── EcoFeatures (hardcoded per category)
  └── ProductDocuments → reads product.documents
        └── Also searches JSON for color-level docs via ?color= param
```

### Component → Product Field Mapping

| Component | Reads | File |
|-----------|-------|------|
| `ProductColorSelector` | `specs`, `images`, `customColors`, `brand`, `price`, `shortDescription` | `components/ProductColorSelector.tsx` |
| `DescriptionSection` | `product.description` (parsed into sections) | inline in `page.tsx` |
| `ProductCharacteristics` | `product.specs` (filtered) | `components/ProductCharacteristics.tsx` |
| `ProductDocuments` | `product.documents` + searches JSON by color slug + collection docs index (`documents_index.json` / `tarkett_documents_index.json`) | `components/ProductDocuments.tsx` |
| `CertificationBadges` | hardcoded certifications array | `components/CertificationBadges.tsx` |
| `EcoFeatures` | hardcoded features per category | `components/EcoFeatures.tsx` |
| `ProductActions` | `product` (favorites, share) | `components/ProductActions.tsx` |
| `ProductInquiryStickyCTA` | `productSlug`, `inquiryRef` | `components/ProductInquiryStickyCTA.tsx` |

---

## 5. Checklist: Adding New Data to a Product

> [!IMPORTANT]
> Follow ALL steps. Missing any one = data won't appear on site.

### Step 1: Update JSON Data
- Edit the relevant JSON file in `/public/data/`
- Or create an enrichment script in `/scripts/` and run it

### Step 2: Update Product Type (if needed)
- If adding a completely new field type, add it to `Product` interface in `types/index.ts`

### Step 3: Update Resolver
- In `lib/product-page/resolve-product.ts`, find the block that handles your product category/brand
- Map the new JSON field → Product field in the returned object

### Step 4: Update Color Merge (if field changes per color)
- In `lib/product-page/prepare-colors.ts` → `mergeSelectedColor()`, add logic to update the field when user selects a different color

### Step 5: Update Component Display
- In `app/proizvodi/[slug]/page.tsx`, ensure the component that should display this data receives it as a prop
- If an existing component handles it (e.g. `ProductDocuments` for docs), make sure that component can find the new data

### Step 6: Update Client/API Components that read JSON directly
- Components like `CategoryTabs`, `ColorGrid` and API routes like `/api/colors`, `/api/color-data` normalize JSON differently depending on category
- If data comes from a new JSON source (e.g. `industrial_colors.json` or `sport_colors.json`), add that import and update nested/flat normalization logic

### Step 7: Build & Verify
- Run `npx next build` to check for type errors
- Test locally with `npx next dev`
- Push → Vercel auto-deploys

---

## 6. Category Pages (`app/kategorije/[slug]/page.tsx`)

Category listing pages use `CategoryTabs` component. Product cards come from:
- DB products via `productRepository`
- BLOQ products via `getAllBloqCarpetProducts()`
- Tarkett products for Parket/Laminat
- Tarkett home vinyl collection headers via `getTarkettVinylHomeCollections()` from `public/data/tarkett_vinyl_home_colors.json`
- Tarkett sport collection headers via `getTarkettSportCollections()` from `public/data/tarkett_sport_colors.json`
- Manual collection headers for Vinil specijalne kolekcije, Industrijske ploce i Sport via `lib/data/manual-collection-products.ts`
  - Header hero images come from JSON `collection_image_url` when present (typically Supabase public URLs written by the Gerflor ZIP downloader)

The `ProductCardClient` component renders each card.

`CategoryTabs` / `ColorGrid` expectations:
- Flat JSON categories: `lvt`, `linoleum`, `tekstilne-ploce`
- Nested JSON categories: `vinil`, `elektroprovodni`, `industrijske-ploce`, `sport`
- Nested categories generate color slugs as `{collection-slug}-{code}-{name}` unless the JSON source already provides an explicit `slug`
- Vinil is now also a mixed-brand nested category, so collection slugs like `tarkett-bold` must stay intact through category/product routes and should not be auto-prefixed with `gerflor-`
- Sport is a mixed-brand nested category, so route normalization must preserve `tarkett-` collection prefixes and only add `gerflor-` for Gerflor sport collections

---

## 7. Common Gotchas

1. **"Data in JSON but not on page"**: You forgot Step 3 (update resolver)
2. **"Shows on page load but disappears when switching colors"**: You forgot Step 4 (update `mergeSelectedColor`)
3. **"Works for Gerflor carpet but not BLOQ"**: The resolver has SEPARATE code paths for Gerflor carpet (line ~101) vs BLOQ (line ~139). Both need updating.
4. **"ProductDocuments shows docs for one brand but ne za novi izvor"**: `ProductDocuments.tsx` je CLIENT komponenta koja direktno učitava documents index fajlove. Ako dodaš novi documents JSON source ili novu kategoriju/brend mapu, moraš da ga povežeš i tamo i u `app/proizvodi/[slug]/page.tsx`.
5. **"Description shows bullet points instead of paragraphs"**: `parseDescriptionToSections()` in `spec-helpers.ts` parses descriptions with "Keyword:" headers into titled sub-sections. Plain paragraph text renders as-is.
6. **Bundle size increase**: Client components that import JSON directly (like `ProductDocuments`) increase the JS bundle. Consider moving to API routes if bundle grows too large.
7. **Parket `Step XL & L` ima legacy alias**: zvanični Tarkett slug je `step-xl-l`, ali stari lokalni linkovi mogu i dalje koristiti `step-xl-and-l`. Kad menjaš parket kolekcijske URL-ove, sačuvaj alias/redirect kompatibilnost.
8. **Tarkett laminat sada ima canonical redirect sloj.** Ako menjaš laminat slugove, ažuriraj `lib/data/tarkett-laminate-slug-mapping.ts` i `getCanonicalProductRouteSlug()` u `app/proizvodi/[slug]/page.tsx`, inače će stari URL-ovi i metadata canonical razići.
9. **Ne vraćaj generičke `collection: Parket` fallback zapise bez potrebe.** Posle cleanup-a iz 15.03.2026 parket kolekcije imaju kanonske varijante; ako moraš da zadržiš stari URL zbog kompatibilnosti, prebaci ga u stvarnu kolekciju (`Tango`, `Tango Classic`, itd.) umesto da ostane na generičkom `Parket`.
10. **`vercel link` / `env pull` upisuje quoted vrednosti u `.env.local`.** Ako Node skripta ručno čita taj fajl umesto da dobije env direktno iz procesa, mora da skine spoljne navodnike sa `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` i `SUPABASE_SERVICE_ROLE_KEY`; u suprotnom Supabase klijent pada na `Invalid supabaseUrl`.

---

## 8. Maintenance Rule

> [!IMPORTANT]
> After every significant architecture change (new data source, new component, new category, new resolver path, changed data flow), you MUST:
> 1. Update THIS workflow file (`.agent/workflows/podovi-architecture.md`) to reflect the new state
> 2. Update `README.md` if project structure, scripts, or setup changed
> 3. Do this as part of the same commit — not as a separate task

