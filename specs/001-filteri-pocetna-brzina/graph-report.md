# Graphify graf koda — katalog i filteri

> Generisano 2026-10-17 (`/graphify` nad `app/`, `components/`, `lib/`, `types/`, `tests/contracts/`, `middleware.ts`; samo AST, bez LLM tokena). Interaktivni `graph.html` i `graph.json` nisu u repou (lokalni artefakti).

# Graph Report - FILTRI  (2026-10-17)

## Corpus Check
- 180 files · ~0 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1340 nodes · 3751 edges · 60 communities (53 shown, 7 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 45 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Ops repository
- Tarkett wood & product routes
- Inquiries & mailer
- Essence configurator
- Homepage URL state & SSR page
- PDP page sections
- Homepage filter UI
- Facet config engine
- Product cards & images
- Product data loader core
- Color helpers
- Search & favorites
- Welding rods
- Spec normalization
- Image surfaces & SEO
- Layout & branding
- Loader transforms A
- Loader transforms B
- Ops service contract
- Product repository & id mapping
- Ops API routes
- Ops types
- Retired BLOQ & breadcrumbs
- Product repository merges
- Home colors & listing APIs
- Category repository & assets
- Internal auth middleware
- Color grid selector
- Ops invariants
- Compatible accessories
- SEO contracts
- Spec display helpers
- Brand repository
- Product resolver
- Documents & recommendations
- Color API contracts
- Tarkett parse
- Listing curation
- Resolver contracts
- Gerflor parse
- Misc 40
- Misc 41
- Misc 42
- Misc 43
- Misc 44
- Misc 45
- Misc 46
- Misc 47
- Misc 48
- Misc 49
- Misc 50
- Misc 51
- Misc 52
- Misc 53
- Misc 54
- Misc 55

## God Nodes (most connected - your core abstractions)
1. `Product` - 69 edges
2. `ProductPage()` - 49 edges
3. `HomeProductTabs()` - 45 edges
4. `getServerSupabase()` - 31 edges
5. `getProductBySlug()` - 31 edges
6. `assertOpsDbReady()` - 29 edges
7. `opsRepository` - 29 edges
8. `Inquiry` - 28 edges
9. `getProductsByCategory()` - 27 edges
10. `requireOpsBasicAuth()` - 25 edges

## Surprising Connections (you probably didn't know these)
- `ProductCardOverlayProps` --references--> `Product`  [EXTRACTED]
  components/ProductCardOverlay.tsx → types/index.ts
- `ProductColorSelectorProps` --references--> `ProductSpec`  [EXTRACTED]
  components/ProductColorSelector.tsx → types/index.ts
- `ProductViewTrackerProps` --references--> `Product`  [EXTRACTED]
  components/ProductViewTracker.tsx → types/index.ts
- `selectHomepageRail()` --indirect_call--> `hasCollectionSku()`  [INFERRED]
  tests/contracts/homepage-collection-filter-contract.test.ts → lib/utils/homepage-collection-filter.ts
- `loadCategory()` --indirect_call--> `hasCollectionSku()`  [INFERRED]
  tests/contracts/homepage-facet-contract.test.ts → lib/utils/homepage-collection-filter.ts

## Import Cycles
- None detected.

## Communities (60 total, 7 thin omitted)

### Community 0 - "Ops repository"
Cohesion: 0.08
Nodes (43): assertOpsDbReady(), CreateChangeSetParams, CreateReleaseParams, CreateSnapshotParams, ensureSuccess(), InsertAuditEventParams, InsertReviewDecisionParams, ListAuditEventsFilters (+35 more)

### Community 1 - "Tarkett wood & product routes"
Cohesion: 0.06
Nodes (56): BrandListingMode, COLLECTION_FIRST_BRAND_IDS, curateBrandPageProducts(), isCollectionRepresentative(), isParketCollectionHeader(), getEffectiveParketCollection(), getParketCollectionBySlug(), getParketCollectionSlug() (+48 more)

### Community 2 - "Inquiries & mailer"
Cohesion: 0.06
Nodes (27): InquiryButton(), InquiryButtonProps, InquiryModal(), InquiryModalProps, closedInquiryStatuses, getFollowUpState(), inquiryStatusFlow, inquiryStatusMap (+19 more)

### Community 3 - "Essence configurator"
Cohesion: 0.07
Nodes (44): EssenceConfiguratorPage(), metadata, ConfiguratorStep(), ConfiguratorStepProps, ConfiguratorSummary(), ROWS, EMPTY, EssenceConfigurator() (+36 more)

### Community 4 - "Homepage URL state & SSR page"
Cohesion: 0.08
Nodes (48): addSwatches(), backfillCollectionImages(), buildSwatchIndex(), collectCollectionSwatches(), COLLECTION_SWATCH_INDEX, dedupeBySlug(), getCollectionName(), getIndexedCollectionSwatches() (+40 more)

### Community 5 - "PDP page sections"
Cohesion: 0.08
Nodes (40): cloneProductForPage(), dedupeMetadataValues(), DescriptionSection(), DocumentsIndex, dynamic, extractRouteSlugFromProductHref(), fetchCache, findBrandByIdForRequest (+32 more)

### Community 6 - "Homepage filter UI"
Cohesion: 0.09
Nodes (43): APPLICATION_FILTERS, ArrowRightIcon(), buildApplicationOptions(), buildBrandOptions(), buildScopedFacetValue(), buildScopedOptionValue(), buildScopedSelectionMap(), buildValueOptions() (+35 more)

### Community 7 - "Facet config engine"
Cohesion: 0.07
Nodes (41): appendMapping(), baseCollectionKeys(), buildFacetInheritanceMap(), cachedSpecKeyFromLabel(), canonicalizeFacetValue(), CATEGORY_FACETS, collectFacetOptionValues(), collectionLookupKeys() (+33 more)

### Community 8 - "Product cards & images"
Cohesion: 0.16
Nodes (26): ComparePageClient(), ComparePage(), metadata, CompareBar(), CompareButton(), ProductCard(), ProductCardClient(), ProductCardOverlay() (+18 more)

### Community 9 - "Product data loader core"
Cohesion: 0.09
Nodes (28): tarkettCollectionCoverAssetPaths, formatLvtSpecs(), enrichProductDescription(), ALPOD_NUMERIC_AGGREGATE_LABELS, COLLECTION_OVERLAYS, dessoDisplayName(), formatProductName(), GERFLOR_VINYL_COLLECTION_COVER_SLUGS (+20 more)

### Community 10 - "Color helpers"
Cohesion: 0.11
Nodes (23): alpodFloorCollections, alpodVinylCollections, baseVinylCollections, buildCharacteristicsFromColor(), buildNestedColorFromCollection(), buildNestedColorSlug(), buildSpecsFromColor(), collectionFromColor() (+15 more)

### Community 11 - "Search & favorites"
Cohesion: 0.10
Nodes (18): FavoritesPageClient(), FavoritesPage(), metadata, FavoriteButton(), FavoriteButtonProps, GlobalSearch(), renderResults(), GlobalSearchProps (+10 more)

### Community 12 - "Welding rods"
Cohesion: 0.16
Nodes (27): generateMetadata(), getColorsByWeldingRod(), Props, WeldingRodPage(), findAccessoryBySlug(), findAccessoryByValue(), gerflorAccordAffinityCollections, gerflorCr40Collections (+19 more)

### Community 13 - "Spec normalization"
Cohesion: 0.12
Nodes (21): isAlpodImportBrand(), isFirstPartyImageUrl(), normalizeThicknessValue(), parseCoverageM2(), resolveBrandTokens(), specKeyFromLabel(), getParketCollectionNameBySlug(), alpodDekingCollections (+13 more)

### Community 14 - "Image surfaces & SEO"
Cohesion: 0.12
Nodes (20): generateProductMetadata(), SITE_NAME, SITE_URL, generateBreadcrumbSchema(), generateCollectionPageSchema(), generateProductListSchema(), generateProductSchema(), createMetadataImage() (+12 more)

### Community 15 - "Layout & branding"
Cohesion: 0.13
Nodes (19): inter, metadata, RootLayout(), BackToTop(), BrandLogoMark(), BrandLogoMarkProps, hasUsableBrandLogo(), isRetiredPodoviPlaceholder() (+11 more)

### Community 16 - "Loader transforms A"
Cohesion: 0.17
Nodes (26): enrichShortDescription(), characteristicLabelToKey(), fixAlpodSerbian(), getAllRomusToolProducts(), getCollectionOverlay(), isAdmonterCollection(), loadRomusToolsDataset(), mergeUniqueSpecs() (+18 more)

### Community 17 - "Loader transforms B"
Cohesion: 0.22
Nodes (25): getManualCollectionProducts(), selectPreferredCollectionHeroAsset(), buildDescriptionFromCharacteristics(), buildSpecsFromCharacteristicRecord(), buildTarkettVinylCollectionHeaders(), getAllCarpetProducts(), getAllGerflorProducts(), getAllLinoleumProducts() (+17 more)

### Community 18 - "Ops service contract"
Cohesion: 0.25
Nodes (11): audit(), blocking(), docTarget(), err(), findVariant(), opsServiceContract, requireRole(), resolveCollection() (+3 more)

### Community 19 - "Product repository & id mapping"
Cohesion: 0.17
Nodes (14): BRAND_LEGACY_TO_UUID, BRAND_UUID_TO_LEGACY, CATEGORY_LEGACY_TO_UUID, CATEGORY_UUID_TO_LEGACY, mapBrandId(), mapBrandIdToUUID(), mapCategoryId(), mapCategoryIdToUUID() (+6 more)

### Community 20 - "Ops API routes"
Cohesion: 0.15
Nodes (17): GET(), POST(), GET(), RouteParams, POST(), RouteParams, POST(), POST() (+9 more)

### Community 21 - "Ops types"
Cohesion: 0.12
Nodes (19): RouteParams, VariantPayload, OPS_ACTOR_ROLES, OPS_AUDIT_ACTIONS, OPS_CHANGE_ITEM_TYPES, OPS_CHANGE_SET_STATUSES, OPS_RELEASE_KINDS, OPS_RELEASE_STATUSES (+11 more)

### Community 22 - "Retired BLOQ & breadcrumbs"
Cohesion: 0.14
Nodes (17): InquiryPage(), metadata, BreadcrumbItem, Breadcrumbs(), BreadcrumbsProps, ContactForm(), ProductViewTracker(), ProductViewTrackerProps (+9 more)

### Community 23 - "Product repository merges"
Cohesion: 0.16
Nodes (10): CompareButtonProps, ProductActionsProps, ProductCardProps, CompareContextType, getProductsByBrand(), IProductRepository, isAlpodVariantProduct(), MockProductRepository (+2 more)

### Community 24 - "Home colors & listing APIs"
Cohesion: 0.18
Nodes (15): GET(), dedupeBySlug(), dynamic, GET(), HomeColorGroup, selectHomepageColors(), GET(), GET() (+7 more)

### Community 25 - "Category repository & assets"
Cohesion: 0.18
Nodes (10): HomeProductGroup, ScopedOptionGroup, ICategoryRepository, MockCategoryRepository, SupabaseCategoryRepository, toCategory(), isPlaceholderCatalogAsset(), normalizeCatalogAssetCandidate() (+2 more)

### Community 26 - "Internal auth middleware"
Cohesion: 0.14
Nodes (18): AuthFailure, AuthSuccess, canAccessCrm(), decodeBase64(), getCrmBasicAuthConfig(), getCrmUnauthorizedResponse(), getOpsBasicAuthConfig(), hasValidCredentials() (+10 more)

### Community 27 - "Color grid selector"
Cohesion: 0.17
Nodes (13): buildCharacteristics(), Color, ColorGrid(), ColorGridProps, ImageWithFallback(), normalizeSrc(), LeadSaveButtonProps, ProductColorSelector() (+5 more)

### Community 28 - "Ops invariants"
Cohesion: 0.18
Nodes (16): METADATA_FIELDS, normalizeDocumentForStorage(), normalizeDocumentUrl(), productToDocumentSet(), validateDocumentDraft(), validateDocumentSet(), validateMetadataFieldValue(), validateMetadataPatch() (+8 more)

### Community 29 - "Compatible accessories"
Cohesion: 0.12
Nodes (16): ACCESSORY_BY_CATEGORY, ESD, GERFLOR_SHOWER, GERFLOR_STAIRS, getCompatibleAccessorySlugs(), LP, LV, MED (+8 more)

### Community 30 - "SEO contracts"
Cohesion: 0.10
Nodes (16): boldFixtureCollection, componentStub, dancefloorFixtureCollection, extractJsonLdScripts(), gerflorBrand, lvtCategory, navigationMocks, redirectingVariantFixture (+8 more)

### Community 31 - "Spec display helpers"
Cohesion: 0.23
Nodes (12): ProductCharacteristics(), ProductCharacteristicsProps, mergeSpecs(), filterSpecsForDisplay(), parseDescriptionToSections(), ColorFromJSON, ColorSource, Props (+4 more)

### Community 32 - "Brand repository"
Cohesion: 0.22
Nodes (8): HomeProductTabsProps, ProductCardClientProps, getBrandBySlug(), IBrandRepository, MockBrandRepository, SupabaseBrandRepository, toBrand(), Brand

### Community 33 - "Product resolver"
Cohesion: 0.16
Nodes (16): esdCollections, gerflorStairShowerCollections, industrialCollections, lajsneCollections, lvtColors, sportCollections, vinylCollections, attachTechemCollectionSlug() (+8 more)

### Community 34 - "Documents & recommendations"
Cohesion: 0.14
Nodes (10): Document, DocumentsSourceConfig, getDocumentsSourceConfig(), normalizeDocuments(), normalizeDocumentUrl(), ProductDocuments(), ProductDocumentsProps, AccessoryProduct (+2 more)

### Community 35 - "Color API contracts"
Cohesion: 0.15
Nodes (8): GET(), getColorsForCategory(), fixtureCollection, fixtureColor, NestedCollection, vinylFixtureCollection, vinylFixtureColor, ALPOD_BRAND_IDS

### Community 36 - "Tarkett parse"
Cohesion: 0.12
Nodes (4): DEAL_DESIGN0, {
  extractCollectionItem,
  mediaImageUrl,
  toSerbianCharacteristics,
  homogeneousColorCharacteristics,
  cleanColorName,
  colorCode,
  collectionDocsFromAssets,
  galleryImagesFromAssets,
  stripHtml,
  keyFeatureItems,
}, IQ_MOTION_DESIGN0, IQ_RAW_SPECS

### Community 37 - "Listing curation"
Cohesion: 0.19
Nodes (14): CategoryListingMode, CategoryListingSegment, CategoryTaxonomyRule, filterCategoryListingCollections(), getAccessoryCollectionSlugs(), getCategoryCollectionSegment(), getCategoryDefaultListingMode(), getCategoryListingSegmentCounts() (+6 more)

### Community 38 - "Resolver contracts"
Cohesion: 0.14
Nodes (11): collections, EXEMPT, boldFixtureCollection, boldFixtureColor, lajsneFixtureCollection, linoleumFixtureCollection, NestedCollection, repositoryMocks (+3 more)

### Community 40 - "Misc 40"
Cohesion: 0.16
Nodes (9): cloneManualCollectionProduct(), CollectionImageSource, createCollectionProduct(), DEFAULT_DATE, ManualCollectionConfig, manualCollectionImageSources, manualCollectionProducts, normalizeDocumentUrl() (+1 more)

### Community 41 - "Misc 41"
Cohesion: 0.24
Nodes (12): buildOrderedCollectionHeroFixture(), FlatCollectionColor, gerflorLinoleumHeroFixture, gerflorLvtHeroFixture, NestedCollection, normalizeCandidate(), pickFirstNonEmpty(), pickLongestNonEmpty() (+4 more)

### Community 43 - "Misc 43"
Cohesion: 0.17
Nodes (8): ColorRow, GetColorsOptions, GetColorsResult, TarkettProduct, homoCollections, lvtItems, NEW_HOMO, NEW_LVT

### Community 44 - "Misc 44"
Cohesion: 0.19
Nodes (5): headerSource, homeSource, pageSource, searchSource, expectedCollections

### Community 45 - "Misc 45"
Cohesion: 0.20
Nodes (9): FacetSectionGroup, CategoryFacetDef, facetChipLabel(), facetOptionLabel(), getFacetDefsForCategory(), parseFacetSelectionsFromParams(), parseRClasses(), parseUsageClasses() (+1 more)

### Community 46 - "Misc 46"
Cohesion: 0.27
Nodes (6): gerflor_products, linoleumProducts, brands, categories, products, loadAdmonterProducts()

### Community 47 - "Misc 47"
Cohesion: 0.33
Nodes (6): getVisibleFilterOptions(), hasPricedProducts(), HomepageCountOption, HomepageSortMode, sortHomepageProducts(), withLiveOptionCounts()

### Community 48 - "Misc 48"
Cohesion: 0.38
Nodes (5): getSupabase(), getSupabaseOrNull(), hasSupabaseAnonConfig(), supabase, SupabaseClientInstance

### Community 49 - "Misc 49"
Cohesion: 0.48
Nodes (4): isLocalImageSrc(), isOptimizableImageSrc(), OPTIMIZABLE_REMOTE_IMAGE_HOSTS, shouldBypassNextImageOptimization()

### Community 50 - "Misc 50"
Cohesion: 0.47
Nodes (5): POST(), RouteParams, toBadRequest(), UpsertDocumentPayload, OpsDocumentDraftInput

### Community 51 - "Misc 51"
Cohesion: 0.47
Nodes (5): getAllAlpodProducts(), getAlpodCollectionProducts(), getAlpodRawCollections(), getAlpodVariantProducts(), loadArtisanProducts()

### Community 52 - "Misc 52"
Cohesion: 0.33
Nodes (5): allowed, DATA_DIR, gerflorAllowed, gerflorPendingPath, pendingPath

### Community 53 - "Misc 53"
Cohesion: 0.60
Nodes (4): getNewestDate(), sitemap(), categoryRepository, getTechemDatasetGeneratedAt()

### Community 54 - "Misc 54"
Cohesion: 0.67
Nodes (3): ReviewPayload, RouteParams, ReviewChangeSetInput

## Knowledge Gaps
- **7 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Product` connect `Product repository merges` to `Tarkett wood & product routes`, `Inquiries & mailer`, `Homepage URL state & SSR page`, `PDP page sections`, `Homepage filter UI`, `Product cards & images`, `Product data loader core`, `Color helpers`, `Search & favorites`, `Spec normalization`, `Image surfaces & SEO`, `Layout & branding`, `Product repository & id mapping`, `Ops types`, `Retired BLOQ & breadcrumbs`, `Home colors & listing APIs`, `Category repository & assets`, `Ops invariants`, `Compatible accessories`, `SEO contracts`, `Spec display helpers`, `Brand repository`, `Product resolver`, `Resolver contracts`, `Misc 40`, `Misc 41`, `Misc 46`, `Misc 47`?**
  _High betweenness centrality (0.119) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `HomeProductTabs()` (e.g. with `getCollectionFilterValue()` and `parseThicknessValue()`) actually correct?**
  _`HomeProductTabs()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Should `Ops repository` be split into smaller, more focused modules?**
  _Cohesion score 0.08128772635814889 - nodes in this community are weakly interconnected._
- **Why does `Category` connect `Category repository & assets` to `Inquiries & mailer`, `Homepage filter UI`, `Misc 45`, `Misc 46`, `Image surfaces & SEO`, `Home colors & listing APIs`, `SEO contracts`?**
  _High betweenness centrality (0.033) - this node is a cross-community bridge._
- **Should `Tarkett wood & product routes` be split into smaller, more focused modules?**
  _Cohesion score 0.06013986013986014 - nodes in this community are weakly interconnected._
- **Why does `resolveProductBySlug()` connect `Product resolver` to `Tarkett wood & product routes`, `Color API contracts`, `PDP page sections`, `Resolver contracts`, `Color helpers`, `Spec normalization`, `Ops service contract`, `Home colors & listing APIs`, `Ops invariants`, `Spec display helpers`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._
- **Should `Inquiries & mailer` be split into smaller, more focused modules?**
  _Cohesion score 0.062003968253968256 - nodes in this community are weakly interconnected._