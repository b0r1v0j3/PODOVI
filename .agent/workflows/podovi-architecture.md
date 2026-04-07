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

## Contract Regression Harness

Contract drift for the resolver and color APIs is covered by snapshot-based Vitest tests:

- Config: `vitest.contract.config.ts`
- Tests: `tests/contracts/resolver-contract.test.ts`, `tests/contracts/color-api-contract.test.ts`
- Commands: `npm run test:contract`, `npm run test:contract:update`
- CI gate: `.github/workflows/contract-tests.yml` (runs on PR + push to `main`)

---

## Extractor Operations Runbook

Canonical supplier refresh + rollback procedure is documented in:

- `.agent/workflows/extractor-refresh-rollback-runbook.md`

Use that runbook whenever you touch extractor outputs under `public/data/*` (or related supplier docs/images), and keep it updated in the same commit when extractor contracts or validation gates change.

---

## Ops Console Service Contract (Phase 1 Lifecycle)

Internal ops-console flow now runs full lifecycle server-side:

```
collection slug → draft items (metadata/variant/document) → submit → review → publish release + snapshot → rollback release → audit trail query
```

Implemented files:
- `lib/ops/types.ts` (change-set/release/snapshot/audit/role contract types)
- `lib/ops/invariants.ts` (metadata + variant + document validation guards)
- `lib/ops/repository.ts` (Supabase service-role adapter for full `ops_*` tables, release/snapshot/audit CRUD, role resolution)
- `lib/ops/service-contract.ts` (`createMetadataDraft`, `upsertVariantDraft`, `upsertDocumentDraft`, `submitChangeSet`, `reviewChangeSet`, `publishRelease`, `rollbackRelease`, `getAuditEvents`)
- `app/api/ops/change-sets/route.ts` (`POST` metadata draft)
- `app/api/ops/change-sets/[id]/route.ts` (`GET` change-set details)
- `app/api/ops/change-sets/[id]/documents/route.ts` (`POST` document draft)
- `app/api/ops/change-sets/[id]/variants/route.ts` (`POST` variant draft)
- `app/api/ops/change-sets/[id]/submit/route.ts` (`POST` submit)
- `app/api/ops/change-sets/[id]/approve/route.ts` (`POST` approve/reject)
- `app/api/ops/releases/publish/route.ts` (`POST` publish release)
- `app/api/ops/releases/[id]/rollback/route.ts` (`POST` rollback release)
- `app/api/ops/audit-events/route.ts` (`GET` audit events)

DB migration coverage:
- `supabase/migration.sql` now covers full Phase 1 model: `ops_collections`, `ops_variants`, `ops_documents`, `ops_change_sets`, `ops_change_items`, `ops_releases`, `ops_release_change_sets`, `ops_snapshots`, `ops_audit_events`, `ops_role_bindings`.
- `ops_audit_events` is append-only (trigger guard blocks update/delete).
- service-role RLS policies exist for all ops tables.

Invariant coupling with existing product pipeline:
- collection must resolve through `resolveProductBySlug` before any draft creation
- metadata patch allowlist: `name`, `shortDescription`, `description`, `externalLink`, `detailsSections`
- variant draft must map to existing collection color/decor slug/code
- document drafts must be PDF URLs and obey local/absolute URL policy (`/documents/...` or `http/https`)
- publish blocks on validation errors + requires review approval for non-low risk change-sets
- high/critical change-sets enforce no self-approve policy

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
| `tarkett_vinyl_home_colors.json` | Vinil (2) | Tarkett (3) | `collections[]` with `colors[]`, `documents`, `detailsSections`, `collection_image_url`, `url`, `characteristics` scraped from the official Tarkett home vinyl catalog; collection-level PDFs must resolve to `media.tarkett-image.com/docs/*.pdf`, while color-level spec sheets can stay on `tarkett.rs/sr_RS/pdf/...` |
| `tarkett_homogeneous_vinyl_colors.json` | Vinil (2) | Tarkett (3) | `collections[]` with `colors[]`, `documents`, `detailsSections`, `collection_image_url`, `url`, `characteristics` scraped from the official Tarkett homogeneous vinyl catalog; collection-level PDFs must resolve to `media.tarkett-image.com/docs/*.pdf`, while color-level spec sheets can stay on `tarkett.rs/sr_RS/pdf/...` |
| `tarkett_heterogeneous_vinyl_colors.json` | Vinil (2) | Tarkett (3) | `collections[]` with `colors[]`, `documents`, `detailsSections`, `collection_image_url`, `url`, `characteristics` scraped from the official Tarkett heterogeneous vinyl catalog; collection-level PDFs must resolve to `media.tarkett-image.com/docs/*.pdf`, while color-level spec sheets can stay on `tarkett.rs/sr_RS/pdf/...` |
| `wolflor_vinyl_colors.json` | Vinil (2) | Wolflor (11) | `collections[]` with `colors[]`, `documents`, `collection_image_url`, `url`, `characteristics`; generated by `tools/extract_wolflor_vinyl.py` from the live Wolflor WooCommerce Store API plus 7 local PDF supplement collections, with production color image URLs uploaded to Supabase `product-images` via `--upload-supabase`, `collection_image_url` normalized to the first available decor/color image for Wolflor only, PDF swatches cropped from a higher-resolution render than the OCR pass, cached/reused from the previous JSON on subsequent refreshes, and copied source PDFs in `public/documents/wolflor/` |
| `esd_colors.json` | Elektroprovodni (8) | Gerflor (6) | `collections[]` with `colors[]`, local `image` paths |
| `industrial_colors.json` | Industrijske ploce (9) | Gerflor (6) | `collections[]` with `colors[]`, collection `description`, `characteristics`, optional `collection_image_url`, color `image` |
| `sport_colors.json` | Sport (10) | Gerflor (6) | `collections[]` with `colors[]`, collection `description`, `characteristics`, optional `collection_image_url`, color `image` |
| `tarkett_sport_colors.json` | Sport (10) | Tarkett (3) | `collections[]` with `colors[]`, `documents`, `detailsSections`, `collection_image_url`, `url`, `characteristics` scraped from the official Tarkett sports catalog; collection-level PDFs must resolve to `media.tarkett-image.com/docs/*.pdf` |
| `tarkett_lajsne_variants.json` | Lajsne (11) | Tarkett (3) | `collections[]` with `colors[]`, `documents`, `detailsSections`, `collection_image_url`, `url`, `characteristics` scraped from the official Tarkett `Lajsne` category page; final JSON currently holds 12 collections / 326 variants, collection+variant JPG asseti su prebačeni na Supabase `product-images` pod `products/lajsne/...`, extractor prioritizuje `large-high` i pada nazad na slabiji format samo kad jači ne postoji, a UI treba da koristi user-facing label `Varijante` umesto generičkog `Boje` |
| `catalog_listing_taxonomy.json` | Listing taxonomy | — | Kanonski category listing contract za `core` vs `accessory` segmentaciju po kategoriji (`defaultModeByCategory` + `categories[].accessoryCollectionSlugs`); koristi ga `lib/catalog/listing-curation.ts` i on je jedini izvor istine za category curation filter mode (`core`/`accessory`/`all`) |
| `tarkett_wood_collection_index.json` | Laminat (1), Parket (3) | Tarkett (3) | `parket[]` + `laminat[]` with official collection `description`, `shortDescription`, `keyFeatures`, `documents`, `heroImage`, `specs`, `url` scraped from the official Tarkett wood catalog; collection-level PDFs must resolve to `media.tarkett-image.com/docs/*.pdf` |
| `tis_deking_products.json` | Deking (5) | TimberTech (10)| array of products with `categoryId`, `brandId`, `specs`, `images` |
| `documents_index.json` | All | — | Fallback doc lookup by category + collection |
| `tarkett_documents_index.json` | Laminat (1), Parket (3) | Tarkett (3) | Kurirani PDF indeks po kolekciji (`laminat`, `parket`) za dokument tab fallback |
| `welding_rods.json` | Accessories | — | Exact DLW / Gerflor linoleum welding rod references grouped by `welding_rod_ref` |
| `welding_accessories.json` | Accessories | Gerflor / Tarkett | Curated generic welding electrode / family references (`CR40`, `MCR40`, `BBR40`, `CR50`, Tarkett vinyl/linoleum rod collections) used when the site knows the compatible system but not a safe per-color code |

Other data: `lib/data/tarkett-products.ts` (Parket cat 3, Laminat cat 1; parket legacy `collection: Parket` fallback sloj je očišćen i više ne treba uvoditi nove generičke varijante van pravih kolekcija), `lib/data/tarkett-laminate-slug-mapping.ts` (stari lokalni Tarkett laminat slugovi → zvanični kanonski slugovi, koristi se za redirect kompatibilnost i metadata canonical lookups), `lib/data/tarkett-wood-enrichment.ts` (centralni enrichment sloj koji za Tarkett Parket/Laminat dopunjava opise, hero slike, dokumenta, key features i kolekcijske specifikacije iz zvaničnog `tarkett_wood_collection_index.json` + kuriranog `tarkett_documents_index.json`, bez obzira da li proizvod dolazi iz Supabase-a ili statičkog fallback-a; od 16.03.2026 i normalizuje stare Tarkett collection PDF URL-ove sa `/large/*.pdf` na `/docs/*.pdf`), `lib/product-page/welding-helpers.ts` (centralna welding derivation logika: kombinuje tačne DLW linoleum `welding_rod` reference sa kuriranim `welding_accessories.json` family sistemima, prevodi ih u `ProductSpec` / color characteristics za SSR + API + client flow i mapira friendly nazive tipa `Gerflor CR40` ili `Tarkett elektrode za varenje - vinil podovi` na `/proizvodi/welding-rod/[ref]` rute, pri cemu user-facing labeli i accessory opisi sada dosledno koriste termin `elektroda za varenje` umesto `varilacka vrpca`), `lib/repositories/product-repository.ts` (DB + merge sloj; za mock-only kategoriju `11` mora da doda `getTarkettLajsneCollections()` u merge i brand fallback tokove), `lib/repositories/inquiry-repository.ts` (inquiry + CRM update sloj; čita i upisuje `status`, `next_contact_date` i `notes` za postojeće leadove), `lib/crm/inquiry-status.ts` (kanonski sales flow statusi i follow-up helperi za `app/crm`), `lib/data/manual-collection-products.ts` (manual collection header proizvodi za Vinil specijalne, Industrijske ploce i Sport; cita `collection_image_url` iz JSON-a kad postoji, ne proverava `public/` preko `fs`, vraca klonirane proizvode da color merge ne bi mutirao shared kolekcije, i nosi kurirane zvanične Gerflor PDF dokumente za tih 9 collection header proizvoda), `lib/data/mock-data.ts` (legacy/mock category + brand fallback podaci, uključujući Wolflor brand fallback i novu mock-only kategoriju `lajsne` dok taj category red ne postoji u Supabase-u; category hero za `lajsne` sada ide preko našeg Supabase URL-a, ne preko Tarkett CDN-a), `tools/download_gerflor_highres_zip.js` (Gerflor ZIP downloader koji lokalno raspakuje arhivu, bira najbolji JPG — uz preferenciju za clean fajl bez `loupe/zoom` preview oznaka — i opciono uploaduje samo tu finalnu sliku u `product-images` bucket; ako se na Supabase prepisuje ista object putanja, JSON `image` URL treba dobiti novu `?v=...` verziju da browser/CDN ne zadrze staru sliku u kešu), `tools/extract_wolflor_vinyl.py` (Wolflor extractor koji koristi live WooCommerce Store API za collection/product metadata i RapidOCR + PyMuPDF za 7 lokalnih PDF suplement kolekcija; generiše `public/data/wolflor_vinyl_colors.json`, kopira izvorne PDF-ove u `public/documents/wolflor/`, za PDF kolekcije radi OCR na lakšem renderu ali finalni swatch crop vadi iz većeg rendera preko component-based granica uzorka, sa `--upload-supabase` uploaduje Wolflor color JPG assete u `product-images` bucket, pri overwrite-u dodaje novi `?v=` cache-bust query, normalizuje `collection_image_url` na prvu dostupnu decor/color sliku i briše lokalni `public/images/wolflor/` staging, a na sledećim refresh prolazima automatski reusuje postojeće Supabase URL-ove iz prethodnog JSON-a osim ako eksplicitno ne tražiš `--force-upload`), `tools/extract_tarkett_sports.js` (Playwright + `window.__NUXT__` extractor za zvanični Tarkett sport katalog; od 16.03.2026 sanitizuje polomljene reči/razmake iz zvaničnog payload-a, uklanja inventarske stavke poput `Na lageru` iz `detailsSections`, za `collection_image_url` prioritetno koristi thumbnail sa category grid-a kada Tarkett collection page cover vodi na pogrešan hero, ima stored-JSON fallback kad live payload vrati prazan rezultat ili admin grešku, a od 18.03.2026 i potpuno uklanja početnu marketing rečenicu tipa `dostupna je u X boja/boje/boji` iz collection i color opisa jer UI već zasebno prikazuje stvarni broj boja/dekora), `tools/extract_tarkett_lajsne.js` (Playwright + `window.__NUXT__` extractor za zvaničnu Tarkett Srbija `Lajsne` kategoriju; uzima collection linkove sa category grida, koristi stored-JSON fallback ako collection payload pukne, sanitizuje tipične Tarkett spojene reči/typo-e poput `Naša ponudaLajsne`, `napopularnije` i `fobezbeđuje`, podržava `--upload-supabase`, bira najbolji Tarkett image source po prioritetu `large-high → large → medium`, ignoriše `NOT SPECIFIED` assete, spaja collection PDF-ove iz `collection_assets` i direktnih polja poput `specifications_pdf_url` / `format_table_pdf_url`, normalizuje i `//www.tarkett.rs/sr_RS/pdf/...` oblike, i upisuje verzionisane Supabase URL-ove nazad u `tarkett_lajsne_variants.json`), `tools/extract_tarkett_vinyl_home.js` (Playwright + `window.__NUXT__` extractor za zvanični Tarkett `Vinil za kuću` katalog; collection page HTML se uzima preko `page.content()`, detalji boja preko `json-collection-product/...` endpointa, a extractor od 16.03.2026 ima stored-JSON fallback i strogo razdvaja collection `/docs/*.pdf` linkove od color-level `tarkett.rs/sr_RS/pdf/...` listova), `tools/extract_tarkett_homogeneous_vinyl.js` (Playwright + `json-collection-product` extractor za zvanični Tarkett `Homogeni vinil` katalog; kada collection page pukne, koristi fallback preko `sitemap_1.xml` i direktnog product JSON endpointa da dobije kolekciju i sve dekore, a od 16.03.2026 ima i stored-JSON fallback + pravilnu `/docs/*.pdf` normalizaciju collection dokumenata), `tools/extract_tarkett_heterogeneous_vinyl.js` (Playwright + `json-collection-product` extractor za zvanični Tarkett `Heterogeni vinil` katalog; uz stored-JSON fallback po kolekciji ima i `page.content()` / HTML fallback za collection grid linkove jer headless shell okruženje na toj category strani ume da vrati prazan DOM query iako je grid već renderovan u finalnom HTML-u; collection PDF-ovi se normalizuju na `/docs/*.pdf`, a color-level listovi ostaju na `tarkett.rs/sr_RS/pdf/...`), `tools/extract_tarkett_wood.js` (Playwright extractor za zvanični Tarkett Srbija parket/laminat katalog; puni `tarkett_wood_collection_index.json` sa opisima, PDF-ovima, hero slikama i kolekcijskim specifikacijama, pri čemu Tarkett collection PDF-ovi moraju da se zapisuju na `/docs/*.pdf` CDN obrazac), `tools/scrape_tarkett_deep.js` (Tarkett LVT scraper; od 16.03.2026 i on zapisuje collection PDF dokumenta na `/docs/*.pdf` obrazac umesto na `/large/*.pdf`), `scripts/audit-tarkett-sync.ts` (duboki audit Parket/Laminat vs zvanični Tarkett katalog, docs index i Supabase kada su env varijable dostupne; od 15.03.2026 prijavljuje raw count, comparable count, missing/extra/duplicate design slugove i normalizuje parket alias slugove poput `rumba-/tango-` copper/premium), `scripts/sync-tarkett-supabase.ts` (dry-run/apply sync alat koji pravi backup u `output/` i poravnava produkcioni Supabase Parket/Laminat sa kanonskim `tarkett-products.ts` skupom po slug/SKU match pravilima), `scripts/audit-catalog-quality.ts` (širi katalog audit za collection/header proizvode, dokumenta, hero slike, opise i specs; od 16.03.2026 eksplicitno prijavljuje `broken_tarkett_document_urls` nalaze za svaki Tarkett izvor koji još nosi stare `/large/*.pdf` URL-ove, od 18.03.2026 prijavljuje i `declared_color_count_mismatch` kada zvanični opis tvrdi jedan broj boja/dekora a nested JSON stvarno nosi drugi broj, od 23.03.2026 pokriva i Wolflor dataset uz izuzetak za PDF-only kolekcije bez canonical live URL-a, a od 31.03.2026 i Tarkett lajsne collection + nested JSON sloj sa `missing_documents` proverom za `TARKETT-LAJSNE-*`; piše `output/catalog-quality-audit.json` i razdvaja actionable nalaze od legacy/mock šuma).

### Category IDs
- `1` = Laminat, `2` = Vinil (Gerflor + Tarkett + Wolflor), `3` = Parket, `4` = Tekstilne ploce, `5` = Deking, `6` = LVT, `7` = Linoleum, `8` = Elektroprovodni, `9` = Industrijske ploce, `10` = Sport (Gerflor + Tarkett), `11` = Lajsne (Tarkett)

### Brand IDs
- `3` = Tarkett, `6` = Gerflor, `8` = BLOQ, `10` = TimberTech, `11` = Wolflor

---

## 2. Product Resolution (`lib/product-page/resolve-product.ts`)

**This is the MOST CRITICAL file.** It converts raw JSON data → `Product` object.

`resolveProductBySlug(slug)` tries these in order:
1. Parket collection check (Tarkett products)
2. DB product lookup (`productRepository.findBySlug`)
3. `gerflor-*` slug: tries LVT → Linoleum → Vinil → Industrijske ploce → Sport → Carpet JSON
4. direct Sport / ESD / Industrijske / Lajsne nested collection match (supports mixed-brand sport slugs including `tarkett-*`, and Tarkett lajsne collection slugs in category `11`)
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
| `welding-helpers.ts` | Centralized derivation for exact/generic welding specs + welding accessory route mapping |
| `spec-helpers.ts` | `filterSpecsForDisplay()` (hides internal specs), `parseDescriptionToSections()` (splits description into titled sections) |
| `types.ts` | `ColorFromJSON`, `ColorSource`, `Props` types |
| `index.ts` | Barrel exports |

### ⚠️ CRITICAL: `mergeSelectedColor` in `prepare-colors.ts`
When a user selects a color (?color=xxx), this function **overwrites** `product.name`, `product.images`, `product.specs`, and `product.description` with the selected color's data. If you add new fields that should update on color change, update this function too. The caller must pass a cloned product object, not a shared cached object from a loader/repository.

### ⚠️ CRITICAL: `prepareCustomColors` in `prepare-colors.ts`
This builds the color swatch list for `ProductColorSelector`. For BLOQ it reads `bloq_carpet_tiles.json`; for Vinil/ESD/Industrijske/Sport/Lajsne it reads nested `collections[].colors` JSON sources and normalizes them to `{ collection, code, name, slug, image_url, characteristics }`. For the newer Gerflor nested sources, those `image` / `collection_image_url` fields can now be Supabase public URLs populated by `tools/download_gerflor_highres_zip.js --upload-supabase`, and they may intentionally include a `?v=...` cache-bust query when a Supabase object was overwritten in place with a newer clean JPG. For category `11`, the same selector pipeline is reused but the UI text must say `Varijante` instead of `Boje`.

---

## 4. Product Detail Page (`app/proizvodi/[slug]/page.tsx`)

### Page Structure (for color-selector categories: LVT, Linoleum, Tekstilne, Vinil, Elektroprovodni, Industrijske, Sport, Lajsne, Parket, Laminat)

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
| `ProductCharacteristics` | `product.specs` (filtered); welding-related values can link to `/proizvodi/welding-rod/[ref]` via `welding-helpers.ts`, sa user-facing labelima tipa `Elektroda za varenje` / `Kompatibilna elektroda za varenje` | `components/ProductCharacteristics.tsx` |
| `ProductDocuments` | `product.documents` + searches JSON by color slug + collection docs index (`documents_index.json` / `tarkett_documents_index.json`); normalizuje Tarkett stale `/large/*.pdf` URL-ove na `/docs/*.pdf` pre prikaza | `components/ProductDocuments.tsx` |
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
- Tarkett homogeneous vinyl collection headers via `getTarkettHomogeneousVinylCollections()` from `public/data/tarkett_homogeneous_vinyl_colors.json`
- Tarkett heterogeneous vinyl collection headers via `getTarkettHeterogeneousVinylCollections()` from `public/data/tarkett_heterogeneous_vinyl_colors.json`
- Wolflor vinyl collection headers via `getWolflorVinylCollections()` from `public/data/wolflor_vinyl_colors.json`
- Tarkett sport collection headers via `getTarkettSportCollections()` from `public/data/tarkett_sport_colors.json`
- Tarkett lajsne collection headers via `getTarkettLajsneCollections()` from `public/data/tarkett_lajsne_variants.json`
- Gerflor LVT collection headers via `getGerflorLVTCollections()` from `public/data/lvt_colors_complete.json`
- Gerflor Linoleum collection headers via `getGerflorLinoleumCollections()` from `public/data/linoleum_colors_complete.json`
- Manual collection headers for Vinil specijalne kolekcije, Industrijske ploce i Sport via `lib/data/manual-collection-products.ts`
  - Header hero images come from JSON `collection_image_url` when present (typically Supabase public URLs written by the Gerflor ZIP downloader)

The `ProductCardClient` component renders each card.

`lib/catalog/listing-curation.ts` je category listing taxonomy sloj:
- čita `public/data/catalog_listing_taxonomy.json`
- validira i normalizuje `listing` query mode (`core`, `accessory`, `all`) po kategoriji
- klasifikuje collection slug u segment i filteruje listing set
- isti helper mora da se koristi i u SSR category flow-u (`app/kategorije/[slug]/page.tsx`) i u nested API/client flow-u (`/api/colors`, `CategoryTabs`) da count/grid/URL ostanu usklađeni

`CategoryTabs` / `ColorGrid` expectations:
- Flat JSON categories: `lvt`, `linoleum`, `tekstilne-ploce`
- Nested JSON categories: `vinil`, `elektroprovodni`, `industrijske-ploce`, `sport`, `lajsne`
- Nested categories generate color slugs as `{collection-slug}-{code}-{name}` unless the JSON source already provides an explicit `slug`
- Vinil is now also a mixed-brand nested category, so collection slugs like `tarkett-bold`, `tarkett-eclipse-premium` and `wolflor-andes` must stay intact through category/product routes and should not be auto-prefixed with `gerflor-`
- Sport is a mixed-brand nested category, so route normalization must preserve `tarkett-` collection prefixes and only add `gerflor-` for Gerflor sport collections
- Lajsne are modeled as a nested Tarkett-only category with category ID `11`; cards/routes should preserve the existing `tarkett-` collection prefixes, and user-facing tabs/selectors should say `Varijante` instead of `Boje`
- Kada se uvodi novi accessory SKU u nested JSON kolekcije, obavezno dodaj collection slug u `catalog_listing_taxonomy.json` (`categories.<slug>.accessoryCollectionSlugs`) ili category filter `Prateći asortiman` neće imati kompletan set

### Lead CRM (`app/crm/page.tsx`)

- CRM reads the existing Supabase `inquiries` table on the server and groups leads through the canonical status flow from `lib/crm/inquiry-status.ts`
- The same table now stores `status`, `next_contact_date`, and `notes`, so there is no second parallel CRM source of truth
- Lead edits are saved through the server action `app/crm/actions.ts`, which calls `inquiryRepository.updateLead()` and revalidates `/crm`
- Because public RLS on `inquiries` only allows `INSERT`, CRM reads require service-role server access (`SUPABASE_SERVICE_ROLE_KEY`)
- `middleware.ts` can additionally protect `/crm` with HTTP Basic Auth when `CRM_BASIC_AUTH_USERNAME` and `CRM_BASIC_AUTH_PASSWORD` are present

---

## 7. Common Gotchas

1. **"Data in JSON but not on page"**: You forgot Step 3 (update resolver)
2. **"Shows on page load but disappears when switching colors"**: You forgot Step 4 (update `mergeSelectedColor`)
3. **"Works for Gerflor carpet but not BLOQ"**: The resolver has SEPARATE code paths for Gerflor carpet (line ~101) vs BLOQ (line ~139). Both need updating.
4. **"ProductDocuments shows docs for one brand but ne za novi izvor"**: `ProductDocuments.tsx` je CLIENT komponenta koja direktno učitava documents index fajlove. Ako dodaš novi documents JSON source ili novu kategoriju/brend mapu, moraš da ga povežeš i tamo i u `app/proizvodi/[slug]/page.tsx`.
4a. **Welding info ne živi samo u jednom polju.** Tačni DLW / Gerflor linoleum refovi ostaju u `welding_rod`, ali generički family sistemi (npr. `Gerflor CR40`, `Tarkett elektrode za varenje - vinil podovi`) dolaze iz `welding_accessories.json` + `welding-helpers.ts`; kad menjaš taj sloj, proveri `buildSpecsFromColor()`, `prepare-colors.ts`, `/api/colors`, `/api/color-data`, `ProductCharacteristics` i `ProductColorSelector`.
5. **Tarkett collection PDF-ovi nisu isto što i Tarkett color PDF-ovi.** Collection dokumenta treba da idu na `media.tarkett-image.com/docs/*.pdf`, dok Tarkett `Vinil za kuću`, `Homogeni vinil` i `Heterogeni vinil` color-level tehnički listovi mogu ostati na `tarkett.rs/sr_RS/pdf/...`. Nemoj ih mešati u extractorima.
6. **Kad Tarkett live payload pukne, nemoj brisati postojeće podatke.** `tools/extract_tarkett_sports.js`, `tools/extract_tarkett_vinyl_home.js`, `tools/extract_tarkett_homogeneous_vinyl.js` i `tools/extract_tarkett_heterogeneous_vinyl.js` sada imaju stored-JSON fallback; zadrži taj obrazac i za buduće Tarkett extractore.
7. **Tarkett Heterogeni vinil category grid ume da vrati prazan DOM query u headless shell-u.** Ako locator-based DOM lookup vrati 0 kolekcija, nemoj zaključiti da grid ne postoji; extractor treba da padne nazad na `page.content()` / HTML parsing za collection linkove.
8. **Tarkett sport opisi umeju da nose stale broj dekora iz zvaničnog payload-a.** Ako opis tvrdi npr. `dostupna je u 33 boje`, a `item.designs.length` / extracted `colors.length` pokazuje 6, tretiraj to kao Tarkett source mismatch i ukloni tu početnu rečenicu iz JSON opisa; nemoj je ni “ispravljati” ni prikazivati, jer UI već gore prikazuje stvarni broj boja.
9. **"Description shows bullet points instead of paragraphs"**: `parseDescriptionToSections()` in `spec-helpers.ts` parses descriptions with "Keyword:" headers into titled sub-sections. Plain paragraph text renders as-is.
10. **Bundle size increase**: Client components that import JSON directly (like `ProductDocuments`) increase the JS bundle. Consider moving to API routes if bundle grows too large.
10a. **Kategorija `11` (`lajsne`) je mock-only dok ne postoji u Supabase `categories` tabeli.** Moraš dodati fallback u `mock-data.ts` + osloniti se na `category-repository.ts` merge/fallback putanje, inače `/kategorije/lajsne` neće postojati iako JSON i repo merge blokovi rade.
11. **Parket `Step XL & L` ima legacy alias**: zvanični Tarkett slug je `step-xl-l`, ali stari lokalni linkovi mogu i dalje koristiti `step-xl-and-l`. Kad menjaš parket kolekcijske URL-ove, sačuvaj alias/redirect kompatibilnost.
12. **Tarkett laminat sada ima canonical redirect sloj.** Ako menjaš laminat slugove, ažuriraj `lib/data/tarkett-laminate-slug-mapping.ts` i `getCanonicalProductRouteSlug()` u `app/proizvodi/[slug]/page.tsx`, inače će stari URL-ovi i metadata canonical razići.
13. **Ne vraćaj generičke `collection: Parket` fallback zapise bez potrebe.** Posle cleanup-a iz 15.03.2026 parket kolekcije imaju kanonske varijante; ako moraš da zadržiš stari URL zbog kompatibilnosti, prebaci ga u stvarnu kolekciju (`Tango`, `Tango Classic`, itd.) umesto da ostane na generičkom `Parket`.
14. **`vercel link` / `env pull` upisuje quoted vrednosti u `.env.local`.** Ako Node skripta ručno čita taj fajl umesto da dobije env direktno iz procesa, mora da skine spoljne navodnike sa `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` i `SUPABASE_SERVICE_ROLE_KEY`; u suprotnom Supabase klijent pada na `Invalid supabaseUrl`.
15. **`app/crm` ne može da čita leadove samo preko anon ključa.** `inquiries` tabela pod RLS-om dozvoljava public `INSERT`, ali ne i `SELECT`, pa CRM mora da ide kroz server-side service-role čitanje ili će ostati bez podataka.
16. **`app/crm` basic auth je opcionalan i zavisi od env-a.** Ako `CRM_BASIC_AUTH_USERNAME` i `CRM_BASIC_AUTH_PASSWORD` nisu postavljeni, middleware neće zaključati `/crm`; ne računaj na tu zaštitu dok env nije zaista prisutan u target okruženju.

---

## 8. Maintenance Rule

> [!IMPORTANT]
> After every significant architecture change (new data source, new component, new category, new resolver path, changed data flow), you MUST:
> 1. Update THIS workflow file (`.agent/workflows/podovi-architecture.md`) to reflect the new state
> 2. Update `README.md` if project structure, scripts, or setup changed
> 3. If extractor workflow/rollback behavior changed, update `.agent/workflows/extractor-refresh-rollback-runbook.md`
> 4. Do this as part of the same commit — not as a separate task

