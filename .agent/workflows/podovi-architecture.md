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

Contract drift for the resolver, color APIs and key SEO/sitemap surfaces is covered by snapshot-based / assertion-based Vitest tests:

- Config: `vitest.contract.config.ts`
- Tests: `tests/contracts/resolver-contract.test.ts`, `tests/contracts/color-api-contract.test.ts`, `tests/contracts/seo-contract.test.ts`, `tests/contracts/image-runtime-contract.test.ts`, `tests/contracts/product-image-variants-contract.test.ts`, `tests/contracts/catalog-asset-selection-contract.test.ts`
- Commands: `npm run test:contract`, `npm run test:contract:update`
- CI gate: `.github/workflows/contract-tests.yml` (runs on PR + push to `main`)
- `image-runtime-contract.test.ts` je obavezan guard za `next.config.mjs` + `lib/utils/image-runtime.ts`: wildcard remote hostovi (`'**'`) ne smeju da se vrate, a novi optimizovani image host mora istovremeno da bude dodat i u runtime helper i u `remotePatterns`
- `product-image-variants-contract.test.ts` je obavezan guard za surface-aware image selection: `thumb/card/hero/og` varijante ne smeju da driftuju nazad na jedan neimenovani primary URL bez eksplicitne odluke, fallback lane mora da garantuje da se sledeći ordered kandidat koristi pre placeholder stanja, a loader-side collection header hero izbor (`override` / `collection_image_url` / `lifestyle_url` / `image_url` / `roomshot` / `collection_images` cover) mora da ostane na shared ordered contract-u
- isti contract sada pokriva i selected-color lane: kada postoji eksplicitni `?color=`, client hero, resolver merge i metadata moraju da dele isti ordered color candidate lane (`texture_url` → `lifestyle_url` → `image_url` → legacy `image`)
- selected-color docs/specs lane sada ima isti zahtev: `mergeSelectedColor()`, `/api/color-data` i `ProductCharacteristics` / `ProductDocuments` ne smeju da održavaju paralelne selected-color lookup grane; isti commit mora da poravna `resolveSelectedColorServerData()` helper, SSR `product.documents/specs`, API payload i contract testove
- `seo-contract.test.ts` je obavezan guard za metadata/schema parity: PDP `Product.image`, `openGraph.images` i `twitter.images` moraju da dele isti shared helper lane, a category/brand `CollectionPage` schema ne sme da održava poseban image izbor mimo `lib/utils/product-images.ts`
- isti SEO/runtime gate sada pokriva i canonical alias lane: alias collection ruta sa validnim, foreign-valid ili potpuno nevažećim `?color=` mora da završi na istom finalnom kanonskom collection URL-u koji emituju i runtime redirect i metadata (`getCanonicalCollectionAliasHref()` + collection-scoped `prepareCustomColors()`), bez dodatnog međukoraka na alias/bad-color URL-u
- Isto pravilo važi i za mixed-brand nested kategorije (`Vinil`, `Sport`) kada direct-color route dobije strani same-category `?color=`: metadata i runtime treba odmah da kanonizuju na parent collection PDP za sam route color, bez ulaska u širi fallback za query param
- Isti guard sada pokriva i legacy code-only direct-color alias rute (`/proizvodi/0319`, `/proizvodi/1123`): kada direct-color route ide na parent collection PDP, canonical `?color=` mora da se podigne na puni generated nested slug (`<collection>-<code>-<name>`), ne da ostane na sirovom code-only aliasu
- `catalog-asset-selection-contract.test.ts` je obavezan guard za repo-level category/brand metadata asset parity: stale DB logo/hero ne sme da pregazi kanonski curated asset iz `mock-data.ts`, dok placeholder fallback mora da ustupi mesto realnom DB assetu kada je to jedini kvalitetan kandidat
- Shared SEO normalizator mora da odbaci non-`https` image candidate za metadata/schema surface-e; kada nema validnog kandidata, JSON-LD treba da izostavi `image` umesto da emituje placeholder ili supplier fallback
- Kada se menja repo-level metadata asset contract, isti commit mora da poravna ceo lane: `lib/data/mock-data.ts` → `lib/utils/catalog-assets.ts` → `lib/repositories/brand-repository.ts` / `category-repository.ts` → `app/brendovi/[slug]/page.tsx` / `app/kategorije/[slug]/page.tsx` / `lib/seo/structured-data.ts` → contract testove i `scripts/validate-images.js`
- Kada se menja loader-side collection hero precedence, isti commit mora da poravna ceo lane: `lib/utils/catalog-assets.ts` → `lib/utils/productDataLoader.ts` → `lib/data/manual-collection-products.ts` → relevant listing/PDP surface-e → `tests/contracts/product-image-variants-contract.test.ts`

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
- `lib/auth/internal-basic-auth.ts` (shared internal Basic Auth guard for CRM/ops surfaces)
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
- `/api/ops/*` routes now require internal Basic Auth before any handler logic; when `OPS_BASIC_AUTH_USERNAME` / `OPS_BASIC_AUTH_PASSWORD` are missing, the ops routes stay disabled instead of falling back to a public surface
- `actorId` used by the ops service contract is bound to the authenticated Basic Auth identity (`OPS_BASIC_AUTH_ACTOR_ID` or username), so callers can no longer spoof arbitrary actor IDs in request bodies
- empty `ops_role_bindings` no longer auto-promotes the caller to `publisher`; explicit role bindings are now required
- rollback restores the previous stable snapshot (or, when undoing a rollback release, the snapshot of the release that rollback had reverted), not the snapshot of the target release itself

---

## 1. Data Sources (JSON files in `/public/data/`)

| File | Category | Brand | Key Fields |
|------|----------|-------|------------|
| `bloq_carpet_tiles.json` | Tekstilne (4) | BLOQ (8) | `colors[]` with `collection_slug`, `collection_name`, `characteristics`, `description`, `collection_description_sr`, `color_range_text`, `documents`, `backing_variants` |
| `collection_images.json` | LVT helper map | Tarkett (3) | Kurirani local hero override map za Tarkett LVT collection headere; `productDataLoader.ts` ga koristi kao prvi candidate za `getTarkettLVTCollections()`, pre lokalnog `/images/tarkett/collections/<slug>.jpg` fallback-a i pre prvog design image URL-a |
| `carpet_tiles_complete.json` | Tekstilne (4) | Gerflor (6) | `colors[]` with `collection_slug`, `characteristics` |
| `lvt_colors_complete.json` | LVT (6) | Gerflor (6) | `colors[]` with `collection`, `specs`, `documents` |
| `linoleum_colors_complete.json` | Linoleum (7) | Gerflor (6) | `colors[]` with `collection`, `specs`, `documents` |
| `vinyl_colors_complete.json` | Vinil (2) | Gerflor (6) | `collections[]` with `colors[]` inside |
| `vinyl_special_colors.json` | Vinil (2) | Gerflor (6) | `collections[]` with `colors[]`, collection `description`, `characteristics`, optional `collection_image_url`, color `image` |
| `tarkett_vinyl_home_colors.json` | Vinil (2) | Tarkett (3) | `collections[]` with `colors[]`, `documents`, `detailsSections`, `collection_image_url`, `url`, `characteristics` scraped from the official Tarkett home vinyl catalog; collection-level PDFs must resolve to `media.tarkett-image.com/docs/*.pdf`, while color-level spec sheets can stay on `tarkett.rs/sr_RS/pdf/...` |
| `tarkett_homogeneous_vinyl_colors.json` | Vinil (2) | Tarkett (3) | `collections[]` with `colors[]`, `documents`, `detailsSections`, `collection_image_url`, `url`, `characteristics` scraped from the official Tarkett homogeneous vinyl catalog; collection-level PDFs must resolve to `media.tarkett-image.com/docs/*.pdf`, while color-level spec sheets can stay on `tarkett.rs/sr_RS/pdf/...` |
| `tarkett_heterogeneous_vinyl_colors.json` | Vinil (2) | Tarkett (3) | `collections[]` with `colors[]`, `documents`, `detailsSections`, `collection_image_url`, `url`, `characteristics` scraped from the official Tarkett heterogeneous vinyl catalog; collection-level PDFs must resolve to `media.tarkett-image.com/docs/*.pdf`, while color-level spec sheets can stay on `tarkett.rs/sr_RS/pdf/...` |
| `wolflor_vinyl_colors.json` | Vinil (2) | Wolflor (11) | `collections[]` with `colors[]`, `documents`, `collection_image_url`, `url`, `characteristics`; generated by `tools/extract_wolflor_vinyl.py` from the live Wolflor WooCommerce Store API plus 7 local PDF supplement collections, with production color image URLs uploaded to Supabase `product-images` via `--upload-supabase`, `collection_image_url` normalized to the first available decor/color image for Wolflor only, PDF swatches cropped from a higher-resolution render than the OCR pass, cached/reused from the previous JSON on subsequent refreshes, and copied source PDFs in `public/documents/wolflor/` |
| `alpod_floor_collections.json` | Vinil (2), Parket (3), Deking (5) | Podovi (14, display brand) | `collections[]` with nested `colors[]`, generated by `tools/extract_alpod_floor_collections.js` from the public Alpod WooCommerce Store API. Only products with empty `price_html` and `prices.price = 0` are imported. Alpod is the upstream source/external URL, not the visible brand; product cards/PDP brand logo use the internal `Podovi` fallback logo because manufacturer logos are not available. Current payload: 812 products grouped into 11 collections (4 Vinil, 5 Parket, 2 Deking). |
| `esd_colors.json` | Elektroprovodni (8) | Gerflor (6) | `collections[]` with `colors[]`, local `image` paths |
| `industrial_colors.json` | Industrijske ploce (9) | Gerflor (6) | `collections[]` with `colors[]`, collection `description`, `characteristics`, optional `collection_image_url`, color `image` |
| `sport_colors.json` | Sport (10) | Gerflor (6) | `collections[]` with `colors[]`, collection `description`, `characteristics`, optional `collection_image_url`, color `image` |
| `tarkett_sport_colors.json` | Sport (10) | Tarkett (3) | `collections[]` with `colors[]`, `documents`, `detailsSections`, `collection_image_url`, `url`, `characteristics` scraped from the official Tarkett sports catalog; collection-level PDFs must resolve to `media.tarkett-image.com/docs/*.pdf` |
| `tarkett_lajsne_variants.json` | Lajsne (11) | Tarkett (3) | `collections[]` with `colors[]`, `documents`, `detailsSections`, `collection_image_url`, `url`, `characteristics` scraped from the official Tarkett `Lajsne` category page; final JSON currently holds 12 collections / 326 variants, collection+variant JPG asseti su prebačeni na Supabase `product-images` pod `products/lajsne/...`, extractor prioritizuje `large-high` i pada nazad na slabiji format samo kad jači ne postoji, a UI treba da koristi user-facing label `Varijante` umesto generičkog `Boje` |
| `techem_mats.json` | Otirači (12) | Techem (12) | Flat `products[]` dataset scraped from the public Techem English WordPress sitemap/product tree; top-level payload now also carries `generatedAt`, while each record stores `characteristics`, `detailsSections`, `featureBullets`, `documents`, mirrored `heroImage` / `galleryImages` / `images` on Supabase `product-images` as image objects with `url` + `variants.thumb/card/hero/og`, `alternateUrls`, `lineages` and `canonicalUrl`; extractor collapses exact duplicates plus selected `/external-wipers/` aliases onto family-first canonical product URLs, then lokalizuje user-facing copy na srpski dok upstream English URL tree ostaje kanonski, pa ovaj source i dalje **ne** učestvuje u nested color API/tab tokovima |
| `catalog_listing_taxonomy.json` | Listing taxonomy | — | Kanonski category listing contract za `core` vs `accessory` segmentaciju po kategoriji (`defaultModeByCategory` + `categories[].accessoryCollectionSlugs`); koristi ga `lib/catalog/listing-curation.ts` i on je jedini izvor istine za category curation filter mode (`core`/`accessory`/`all`) |
| `tarkett_wood_collection_index.json` | Laminat (1), Parket (3) | Tarkett (3) | `parket[]` + `laminat[]` with official collection `description`, `shortDescription`, `keyFeatures`, `documents`, `heroImage`, `specs`, `url` scraped from the official Tarkett wood catalog; collection-level PDFs must resolve to `media.tarkett-image.com/docs/*.pdf` |
| `tis_deking_products.json` | Deking (5) | TimberTech (10)| array of products with `categoryId`, `brandId`, `specs`, `images` |
| `documents_index.json` | All | — | Fallback doc lookup by category + collection |
| `tarkett_documents_index.json` | Laminat (1), Parket (3) | Tarkett (3) | Kurirani PDF indeks po kolekciji (`laminat`, `parket`) za dokument tab fallback |
| `welding_rods.json` | Accessories | — | Exact DLW / Gerflor linoleum welding rod references grouped by `welding_rod_ref` |
| `welding_accessories.json` | Accessories | Gerflor / Tarkett | Curated generic welding electrode / family references (`CR40`, `MCR40`, `BBR40`, `CR50`, Tarkett vinyl/linoleum rod collections) used when the site knows the compatible system but not a safe per-color code |


Techem note:
- `tools/extract_techem_mats.py` sada radi lokalizaciju tek posle kanonizacije/deduplikacije, pa English upstream ostaje source-of-truth za `url`, `canonicalUrl`, `alternateUrls`, `lineages`, `slug` i `sourceSlug`, dok se user-facing copy u `techem_mats.json` upisuje na srpskom.
- `lib/utils/productDataLoader.ts` sada kešira ceo Techem dataset payload i izlaže `getTechemDatasetGeneratedAt()`, dok `getAllTechemProducts()` koristi top-level `generatedAt` kao fallback `createdAt` / `updatedAt` za flat Techem proizvode.
- `scripts/audit-catalog-quality.ts` za Techem sada dodatno proverava `unlocalized_techem_copy` i broji samo user-facing specifikacije, bez hidden `__techem_*` metadata ključeva.
- `app/sitemap.ts` mora da emituje kanonske product href-ove preko `lib/utils/product-routes.ts`; shared hub stranice koriste freshest poznati katalog datum, dok Techem proizvodi i ostali category/brand detail surface-i dobijaju `lastModified` iz realnog product skupa umesto `new Date()` request-time šuma. Za `/kategorije/otiraci` i `/brendovi/techem` obavezno umešaj i Techem `generatedAt`, jer deo SEO copy-ja za te landing stranice živi van samih product redova.
- `brandRepository` i `categoryRepository` su source-of-truth za repo-level metadata asset izbor. Page/SEO sloj ne sme da čita sirovi Supabase `row.logo` / `row.image` niti direktno `mock-data.ts`, već samo normalizovan repo entitet; kurirani fallback iz `mock-data.ts` ima prednost nad DB override-om kada nije placeholder.
- Collection/header hero slike iz `productDataLoader.ts` i `manual-collection-products.ts` moraju da se rezolvuju kroz `lib/utils/catalog-assets.ts`; ne uvoditi nove page-local ili loader-local `a || b || ''` grane za collection hero precedence mimo shared helpera.
- Lokalni collection hero fallback-i koji zavise od stvarno postojećih fajlova više ne smeju da koriste runtime `fs` lookup nad `public/`; `lib/utils/productDataLoader.ts` sada za to koristi statičke liste iz `lib/data/local-asset-manifests.ts`, kako Vercel trace ne bi uvukao ceo `public/images/*` i `public/documents/*` lane u serverless funkcije.
- BLOQ collection headeri koriste lokalni roomshot asset kao prvi candidate (`/images/products/bloq-roomshots/bloq-<slug>-roomshot.jpg`), pa tek onda prvi color/tile image iz `bloq_carpet_tiles.json`.
- Tarkett LVT collection headeri koriste `collection_images.json` kao kanonski local cover override, zatim lokalni `/images/tarkett/collections/<slug>.jpg`, pa tek onda prvi design image iz `tarkett_lvt_products.json`; repo sloj ne sme više da radi poseban drugi override preko istog JSON-a.

### Category IDs
- `1` = Laminat, `2` = Vinil (Gerflor + Tarkett + Wolflor + Podovi imported collections), `3` = Parket (Tarkett + Podovi imported collections), `4` = Tekstilne ploce, `5` = Deking (TimberTech + Podovi imported collections), `6` = LVT, `7` = Linoleum, `8` = Elektroprovodni, `9` = Industrijske ploce, `10` = Sport (Gerflor + Tarkett), `11` = Lajsne (Tarkett), `12` = Otirači (Techem, flat catalog branch), `13` = Alat (Romus)

### Brand IDs
- `3` = Tarkett, `6` = Gerflor, `8` = BLOQ, `10` = TimberTech, `11` = Wolflor, `12` = Techem, `13` = Romus, `14` = Podovi (internal display brand/logo for imported collections where manufacturer logos are not available)

---

## 2. Product Resolution (`lib/product-page/resolve-product.ts`)

**This is the MOST CRITICAL file.** It converts raw JSON data → `Product` object.

`resolveProductBySlug(slug)` tries these in order:
1. Parket collection check (Tarkett products)
2. DB product lookup (`productRepository.findBySlug`)
3. loader fallback (`lib/utils/productDataLoader.ts::getProductBySlug`) with normalized slug candidates (`gerflor-/tarkett-/wolflor-/bloq-/techem-`) plus direct `podovi-*` imported collection/variant slugs, so collection PDP fallback reuses the same hero/spec/docs contract as listing cards
4. `gerflor-*` slug: tries LVT → Linoleum → Vinil → Industrijske ploce → Sport → Carpet JSON
5. direct Sport / ESD / Industrijske / Lajsne nested collection match (supports mixed-brand sport slugs including `tarkett-*`, and Tarkett lajsne collection slugs in category `11`)
6. direct flat Techem product lookup (`techem-*` slugs from `techem_mats.json`; no color/nested fallback lane)
7. `bloq-*` slug: finds first matching color in `bloq_carpet_tiles.json`, builds Product
8. `tarkett-*` slug fallback for Tarkett collection/product records
9. Collection-color format: matches collection then extracts color
10. Direct color slug lookup

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
| `color-helpers.ts` | Low-level helpers: `loadColorFromJson`, `resolveSelectedColorServerData`, `colorToProduct`, `collectionFromColor`, `buildSpecsFromColor`, nested collection merge helpers |
| `welding-helpers.ts` | Centralized derivation for exact/generic welding specs + welding accessory route mapping |
| `spec-helpers.ts` | `filterSpecsForDisplay()` (hides internal specs), `parseDescriptionToSections()` (splits description into titled sections) |
| `types.ts` | `ColorFromJSON`, `ColorSource`, `Props` types |
| `index.ts` | Barrel exports |

### ⚠️ CRITICAL: `mergeSelectedColor` in `prepare-colors.ts`
When a user selects a color (?color=xxx), this function **overwrites** `product.name`, `product.images`, `product.specs`, `product.description`, and kada postoje color-level PDF-ovi i `product.documents` with the selected color's data. Selected-color SSR data sada mora da dolazi kroz `resolveSelectedColorServerData()` (ne kroz page-local ili API-local rekonstrukciju), tako da `ProductDocuments`, `ProductCharacteristics` i metadata lane dele isti source-of-truth. The caller must pass a cloned product object, not a shared cached object from a loader/repository. Primary color image selection inside this lane must go through `lib/utils/product-images.ts::getPrimaryColorImage()` so client hero, resolver fallback and metadata stay aligned.

### ⚠️ CRITICAL: `prepareCustomColors` in `prepare-colors.ts`
This builds the color swatch list for `ProductColorSelector`. For BLOQ it reads `bloq_carpet_tiles.json`; for Vinil/ESD/Industrijske/Sport/Lajsne it reads nested `collections[].colors` JSON sources and normalizes them to `{ collection, code, name, slug, image_url, characteristics }`. Gerflor flat sources now also include both `LVT` **and** `Linoleum`, and the linoleum lane must resolve by route/product slug candidates so collection PDP validation stays scoped to the active collection instead of falling back to a global JSON match. Podovi imported Alpod-source collections reuse this nested selected-color contract for Vinil plus explicit Parket/Deking selector branches. For the newer Gerflor nested sources, those `image` / `collection_image_url` fields can now be Supabase public URLs populated by `tools/download_gerflor_highres_zip.js --upload-supabase`, and they may intentionally include a `?v=...` cache-bust query when a Supabase object was overwritten in place with a newer clean JPG. For category `11`, the same selector pipeline is reused but the UI text must say `Varijante` instead of `Boje`.

Collection-first PDP rule:
- `ProductColorSelector` + `ColorGrid` must keep the collection cover (`initialImage`) visible until an explicit `?color=` exists.
- `ColorGrid` compact mode must **not** auto-select or URL-write the first color on mount.
- Any UI that depends on an active variant (`backing_variants`, variant code/name, variant-only hero) must stay inert until `selectedColorSlug` is explicit and valid.
- Kada `selectedColorSlug` jeste eksplicitan i validan, `ProductColorSelector`, `ColorGrid`, server merge i SEO metadata moraju da biraju isti primary asset preko shared color-image helpera; ne uvoditi nove local `texture || image || lifestyle` varijacije po komponenti.
- BLOQ collection PDP je sada deo tog istog contract-a: `loadColorFromJson()` mora da razume BLOQ tile slugove iz `bloq_carpet_tiles.json`, inače client hero može da pređe na tile, dok server metadata/schema ostanu na collection cover-u.

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
        └── SSR mora već da dobije selected-color docs kroz `mergeSelectedColor()`, a client `/api/color-data` fetch služi samo kao confirmation/update lane
```

`generateMetadata()` on the same page now has a Techem-specific flat-product branch:
- category `12` ne sme da pada nazad na generic copy tipa `dostupne boje`
- metadata keywords mogu da uključe hidden `__techem_family` / `__techem_top_category` signal
- OG/Twitter images i vidljivi PDP hero treba da dolaze iz istog shared helpera (`lib/utils/product-images.ts`), ne iz paralelnih lokalnih heuristika; placeholder je dozvoljen tek kada nijedan ordered kandidat ne preživi surface/fallback lane
- runtime redirect lane i `generateMetadata()` moraju da dele isti canonical alias helper (`getCanonicalCollectionAliasHref()`); ako collection alias sa validnim ili nevažećim `?color=` završava na prefixed/unprefixed kanonskom PDP-u, metadata `alternates.canonical` i `openGraph.url` moraju da emituju isti finalni URL, ne sirovi `params.slug` niti alias/bad-color međukorak
- PDP `Product` JSON-LD, category `CollectionPage` JSON-LD i brand `CollectionPage` / `Brand.logo` schema moraju da koriste isti shared metadata image normalizator (`lib/utils/product-images.ts` + `lib/seo/structured-data.ts`); ne sastavljati ručno `image` iz `hero` lane-a ili direktnog `logo/image` stringa u page fajlu
- Ako shared helper ne vrati upotrebljiv kandidat, schema treba da izostavi `image` / `logo` polje umesto da emituje `/images/placeholder.svg`, non-`https` URL ili supplier fallback
- wording za `dokumentacija` u Techem meta snippet-u mora biti uslovljen time da `product.documents` zaista postoji
- build-time `scripts/validate-images.js` sada offline-validira i Techem first-party metadata image contract, pa supplier-hosted/non-https/neodobren host ne sme da prođe `npm run build`; u istom prolazu validator zaista hvata i `mock-data.ts` lokalne `url/image/logo` asset putanje, a odsutan `public/data/techem_mats.json` mora da obori build umesto tihog prolaza bez Techem coverage-a

### Component → Product Field Mapping

| Component | Reads | File |
|-----------|-------|------|
| `ProductColorSelector` | `specs`, `images`, `customColors`, `brand`, `price`, `shortDescription` | `components/ProductColorSelector.tsx` |
| `DescriptionSection` | `product.description` (parsed into sections) | inline in `page.tsx` |
| `ProductCharacteristics` | `product.specs` (filtered) + kanonski selected-color `specs` payload iz `/api/color-data`; welding-related values can link to `/proizvodi/welding-rod/[ref]` via `welding-helpers.ts`, sa user-facing labelima tipa `Elektroda za varenje` / `Kompatibilna elektroda za varenje` | `components/ProductCharacteristics.tsx` |
| `ProductDocuments` | `product.documents` (SSR already selected-color aware) + confirmation lookup preko `/api/color-data` / collection docs index (`documents_index.json` / `tarkett_documents_index.json`); normalizuje Tarkett stale `/large/*.pdf` URL-ove na `/docs/*.pdf` pre prikaza | `components/ProductDocuments.tsx` |
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
- Ako isto polje koristi i client fetch lane (`/api/color-data`), obavezno poravnaj shared server helper (`resolveSelectedColorServerData()`) i `ProductCharacteristics` / `ProductDocuments`; ne uvoditi novi page-local/API-local selected-color matcher

### Step 5: Update Component Display
- In `app/proizvodi/[slug]/page.tsx`, ensure the component that should display this data receives it as a prop
- If an existing component handles it (e.g. `ProductDocuments` for docs), make sure that component can find the new data

### Step 6: Update Client/API Components that read JSON directly
- Components like `CategoryTabs`, `ColorGrid` and API routes like `/api/colors`, `/api/color-data` normalize JSON differently depending on category
- If data comes from a new JSON source (e.g. `industrial_colors.json` or `sport_colors.json`), add that import and update nested/flat normalization logic
- If the new source is a flat catalog branch like `techem_mats.json`, wire it through `productDataLoader.ts` + `product-repository.ts` + `ProductCard*`/search/category maps, and explicitly confirm that it should **not** enter `/api/colors` or `CategoryTabs`
- Ako selected-color polje treba i na SSR-u i na client update-u, `/api/color-data` ne sme da sklapa drugi payload od onoga što `mergeSelectedColor()` koristi; oba lane-a moraju da delegiraju na isti helper i isti spec/doc contract

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
- Podovi imported collection headers via `getAlpodCollectionProducts()` from `public/data/alpod_floor_collections.json`; category detail flows for Vinil/Parket/Deking also keep `getAlpodVariantProducts()` available so `CategoryTabs` and PDP selectors can render the imported colors/variants, while brand-wide listings stay collection-first
- Tarkett sport collection headers via `getTarkettSportCollections()` from `public/data/tarkett_sport_colors.json`
- Tarkett lajsne collection headers via `getTarkettLajsneCollections()` from `public/data/tarkett_lajsne_variants.json`
- Techem otirači flat products via `getAllTechemProducts()` from `public/data/techem_mats.json`
- Gerflor LVT collection headers via `getGerflorLVTCollections()` from `public/data/lvt_colors_complete.json`
- Gerflor Linoleum collection headers via `getGerflorLinoleumCollections()` from `public/data/linoleum_colors_complete.json`
- Manual collection headers for Vinil specijalne kolekcije, Industrijske ploce i Sport via `lib/data/manual-collection-products.ts`
  - Header hero images come from JSON `collection_image_url` when present (typically Supabase public URLs written by the Gerflor ZIP downloader)

The `ProductCardClient` component renders each card.

Techem `Otirači` are intentionally a flat listing branch:
- no `CategoryTabs`
- no `/api/colors` or `/api/color-data` participation
- cards link directly to `/proizvodi/techem-*`
- resolver/search can still expose supplier family metadata via hidden `__techem_*` specs, but those keys must stay filtered out of user-facing spec tables

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
- Na collection PDP-u `ColorGrid` compact mode ne sme da upisuje prvi dekor u URL bez korisničkog klika; kada nema `?color=`, grid sme samo da highlight-uje explicitno selektovani slug, a hero ostaje collection cover.
- Kada se uvodi novi accessory SKU u nested JSON kolekcije, obavezno dodaj collection slug u `catalog_listing_taxonomy.json` (`categories.<slug>.accessoryCollectionSlugs`) ili category filter `Prateći asortiman` neće imati kompletan set
- `CategoryTabs` mora da invalidira client-side JSON cache kada se promeni `listing` mode (`core` / `accessory` / `all`); u suprotnom SSR kolekcije i client boje/varijante mogu da odu u tihi drift

## 6b. Category Hub + Shared Shell

- `/kategorije` (`app/kategorije/page.tsx`) sada je category hub, ne samo grid: koristi `categoryRepository.findAll()` + `brandRepository.findAll()` + `productRepository.findAll()` za count-ove, emituje `BreadcrumbList` + `CollectionPage` JSON-LD i prosleđuje `productCount` u `CategoryCard`.
- `CategoryCard` je shared surface i sada opcionalno prikazuje broj proizvoda po kategoriji; homepage može i dalje da ga koristi bez count-a.
- `Aktivni brendovi` count na `/kategorije` ne sme da dolazi iz sirovih product FK vrednosti; računa se iz preseka proizvoda i `brandRepository.findAll()` skupa, tako da summary ostane poravnat sa `/brendovi` čak i kada neki brand lane živi kroz fallback/mock source.
- Root shell copy (`app/layout.tsx`, `lib/seo/structured-data.ts`, `components/Footer.tsx`, `components/WhatsAppButton.tsx`) mora ostati usklađen sa činjenicom da katalog više nije flooring-only: `Otirači`, lajsne i ostali prateći sistemi moraju biti priznati i u metadata/microcopy sloju, ne samo u JSON/product pipeline-u.
- Homepage (`app/page.tsx`) sada nosi direktan CTA ka `/kategorije/otiraci` i treba da zadrži makar jedan curated Techem slot u hero/featured discoverability sloju; nemoj vraćati homepage na hardcoded flooring-only merchandising bez eksplicitne odluke.

## 6a. Brand Pages (`app/brendovi/page.tsx`, `app/brendovi/[slug]/page.tsx`)

- Brand hub (`/brendovi`) sada koristi `brandRepository.findAll()` + `productRepository.findAll()` + `categoryRepository.findAll()` da izračuna count-ove po brendu, ukupni katalog coverage i `CollectionPage` / `BreadcrumbList` JSON-LD za ceo brend listing.
- `components/BrandCard.tsx` mora da zadrži semantički odvojene CTA površine: interni link ka `/brendovi/[slug]` i spoljašnji supplier `website` link **ne smeju** biti ugnježdeni jedan u drugi.
- Ako brand ima validan `logo`, kartica ga prikazuje kao primarni vizuel; fallback na inicijal slovo ostaje samo za placeholder/no-logo scenarije (trenutno relevantno za Wolflor fallback).
- Per-brand stranice i dalje koriste `lib/seo/listing-page-copy.ts` za metadata + intro copy, a brand hub treba da ostane usklađen sa istim Techem/Tarkett/Gerflor/BLOQ/TimberTech/Wolflor/Romus/Podovi scope-om koji postoji u `mock-data.ts` / Supabase brand tabeli.
- Detail brand stranica koristi page-local curation preko `lib/catalog/brand-curation.ts`, ne repo-global filter: isti kurirani niz mora da hrani count karticu, grid heading, empty state i `generateProductListSchema()` / `CollectionPage` JSON-LD.
- Trenutni contract je `collections` view za Gerflor (`6`), Tarkett (`3`), BLOQ (`8`), Wolflor (`11`) i Podovi imported kolekcije (`14`); Podovi Deking ide kroz isti collection/variant UI, dok flat katalog branch-evi poput Techem (`12`), Romus (`13`) i TimberTech (`10`) ostaju `asortiman/products` surface; ne vraćaj generički `spec.collection` filter koji bi sasekao flat lane.
- Brand detail copy mora da prati mode: `kolekcije` kada je collection-first curation aktivna, `asortiman` / `stavke` za flat prikaz. Nemoj da statički nazivaš sve `proizvodi`.
- `mock-data.ts` mora da sadrži kompletan kanonski fallback spisak brendova koji imaju live proizvode u katalogu. Ako proizvod lane postoji (npr. TimberTech deking), a brand fallback ne postoji, `/brendovi` i `/kategorije` summary count-ovi će otići u drift čak i ako `productRepository` vraća ispravne proizvode.

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
2a. **"Dokumentacija/specs su tačni tek posle mount-a"**: `mergeSelectedColor()`, `/api/color-data` i `ProductCharacteristics` / `ProductDocuments` više ne smeju da žive na tri različita selected-color resolvera; poravnaj ih preko `resolveSelectedColorServerData()`.
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
12. **Tarkett laminat sada ima shared canonical redirect sloj.** Ako menjaš laminat slugove, ažuriraj `lib/data/tarkett-laminate-slug-mapping.ts` i `lib/utils/product-routes.ts`, inače će stari URL-ovi, kartice, search i metadata canonical razići.
12a. **Kanonski product href contract živi u `lib/utils/product-routes.ts`.** `ProductCard`, `ProductCardClient`, `/api/search`, `generateProductListSchema()` i `app/proizvodi/[slug]/page.tsx` moraju ostati na istom helperu; ne uvodi novu ručnu `categorySlugMap` / `/kategorije?...color=` granu mimo shared util-a.
12b. **Metadata canonical mora da prati runtime redirect.** Ako alias collection ruta sa validnim `?color=` redirectuje preko `getCanonicalCollectionAliasHref()`, isti helper mora da hrani i `generateMetadata()` (`alternates.canonical`, `openGraph.url`), inače SEO lane ostaje na alias URL-u iako je runtime redirect ispravan.
12c. **Invalid alias color canonicalization ne sme da ide u dva koraka.** Za alias collection rutu prvo odredi finalni kanonski collection href, pa validiraj `?color=` collection-scoped preko `prepareCustomColors()`; ne vraćaj poseban pre-redirect koji samo skida prefix (`gerflor-`) i zadržava loš query string za sledeći hop.
12d. **Direct-color route sa stray `?color=` ne sme da validira query kao novi izbor boje.** Za mixed-brand `Vinil`/`Sport` direct-color PDP prvo kanonizuj na parent collection href za sam route color, pa tek na collection strani dozvoli standardni selected-color tok; u suprotnom metadata/runtime mogu da prihvate foreign same-category dekor koji uopšte nije route proizvod.
12e. **Globalni bare-code lookup (`0319`, `1004`, `1123`) je dvosmislen i ne rešava se prostim reorder-om.** Ako diraš `loadColorFromJson()` / nested search redosled, ne pomeraj samo `sport` ispred `vinil` ili obrnuto; uvedi collection-scoped ili context-scoped code fallback, inače ćeš samo prebaciti isti correctness bug iz jedne kategorije u drugu.
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

