# Podovi.online — Katalog podnih obloga

> Serbian flooring catalog website — [podovi.online](https://www.podovi.online)

## Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
- **Language**: TypeScript
- **Styling**: [TailwindCSS 3](https://tailwindcss.com/)
- **Database**: [Supabase](https://supabase.com/) (PostgreSQL)
- **Email**: Nodemailer (Gmail SMTP)
- **Analytics**: Google Analytics 4
- **Deployment**: Vercel

## Getting Started

```bash
# Install dependencies
npm install

# Copy env file and fill in values
cp .env.example .env.local

# Run in development
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Deployment Notes

- Production deploy for this repo should go through `git push` and Vercel auto-deploy from `main`.
- Root `.vercelignore` excludes local heavyweight artifacts such as `.next`, `node_modules`, `tmp`, `output`, and archive folders so an accidental local `vercel deploy` cannot package gigabytes of workspace noise.

## Key Features

### Product Catalog
- Browse products by **category** (Laminat, Vinil, Parket, LVT, Linoleum, Tekstilne ploče, Deking, Elektroprovodni, Industrijske ploče, Sport)
- Browse by **brand** (Tarkett, Gerflor, BLOQ, Wolflor)
- **Product filters**: search, brand, price range, stock status, color, collection, thickness, wood type
- **Color variant selector** with instant image switching (no page reload)
- **Product detail pages** with image galleries, specs, and inquiry CTA

### Product Interactions
- **❤️ Favorites**: Save products to a favorites list (persisted in localStorage)
  - Heart icon in header nav with count badge
  - Dedicated `/omiljeni` page showing all saved products
  - Favorite button on product cards and detail pages
- **📊 Compare**: Side-by-side product comparison (up to 3 products)
  - Compare button on product cards (overlay on hover)
  - Sticky `CompareBar` at bottom when products are selected
  - Dedicated `/uporedi` page with full comparison table
- **🔗 Share**: Share product pages via native Web Share API (mobile) or clipboard copy (desktop)
- Product card overlay with Favorite/Compare buttons (always visible on mobile, hover on desktop)

### Search & Discovery
- **🔍 Global Search**: Full-text search across all products with instant results
- **🧮 Flooring Calculator**: Calculate how much material is needed based on room dimensions

### Contact & Inquiries
- Contact form with product pre-fill from product pages
- **Inquiry modal** accessible from product pages
- Email notifications via Gmail SMTP (Nodemailer)
- **WhatsApp button** for quick customer communication

### SEO & Performance
- Structured data (Organization, Website, Product schemas)
- Dynamic meta tags and Open Graph images
- Sitemap generation (`/sitemap.xml`) & robots.txt (`/robots.txt`)
- Optimized images with Next.js Image component

## Catalog Data Sources

- `public/data/vinyl_colors_complete.json` + `public/data/vinyl_special_colors.json` + `public/data/tarkett_vinyl_home_colors.json` + `public/data/tarkett_homogeneous_vinyl_colors.json` + `public/data/tarkett_heterogeneous_vinyl_colors.json` + `public/data/wolflor_vinyl_colors.json` power Vinil collections and colors, with Wolflor image assets served from Supabase storage
- `public/data/esd_colors.json` powers Elektroprovodni / ESD collections
- `public/data/industrial_colors.json` powers Industrijske ploče collections
- `public/data/sport_colors.json` powers Gerflor / DLW Sport collections
- `public/data/tarkett_vinyl_home_colors.json` powers Tarkett home vinyl collections (12 collections, 281 colors)
- `public/data/tarkett_homogeneous_vinyl_colors.json` powers Tarkett homogeneous vinyl collections (20 collections, 544 colors)
- `public/data/tarkett_heterogeneous_vinyl_colors.json` powers Tarkett heterogeneous vinyl collections (15 collections, 441 colors)
- `public/data/tarkett_sport_colors.json` powers Tarkett Sport collections (22 collections, 255 colors)
- `public/data/tarkett_wood_collection_index.json` stores official Tarkett Parket/Laminat collection descriptions, hero images, PDF documents, and collection specs scraped from the live Serbia catalog; collection PDFs are normalized to `media.tarkett-image.com/docs/*.pdf`
- `public/data/tarkett_documents_index.json` provides curated Tarkett PDF fallbacks for Laminat and Parket collection pages
- `lib/data/manual-collection-products.ts` defines collection headers and reads remote `collection_image_url` values from the nested JSON sources when they exist
- `lib/data/tarkett-wood-enrichment.ts` enriches Tarkett Parket/Laminat products from the official wood collection index regardless of whether the product came from Supabase or the static fallback, and normalizes stale Tarkett collection PDF URLs to the `/docs/` CDN path
- `lib/data/tarkett-laminate-slug-mapping.ts` keeps legacy local Tarkett laminate URLs redirecting to the official Tarkett canonical variant slugs
- `tools/download_gerflor_highres_zip.js --upload-supabase` uses Gerflor ZIP downloads as the source, extracts them locally, prefers the clean JPG when both a plain image and a `loupe/zoom` preview exist, uploads only that final image to Supabase, and writes the public URL back into JSON (`collection_image_url` for hero shots, `image` / `image_url` for colors)
- `tools/extract_tarkett_sports.js` scrapes the official Tarkett Serbia sports catalog through `window.__NUXT__`, keeps stored-JSON fallback when Tarkett payloads break, and generates `public/data/tarkett_sport_colors.json` with collection PDFs normalized to `/docs/`
- `tools/extract_tarkett_vinyl_home.js` scrapes the official Tarkett Serbia `Vinil za kuću` catalog through `window.__NUXT__`, keeps stored-JSON fallback when Tarkett payloads break, writes collection PDFs to `/docs/`, and keeps color-level spec sheets on `tarkett.rs/sr_RS/pdf/...`
- `tools/extract_tarkett_homogeneous_vinyl.js` scrapes the official Tarkett Serbia `Homogeni vinil` catalog through Playwright + `json-collection-product`, with sitemap + stored-JSON fallback for broken collection pages, writes collection PDFs to `/docs/`, and keeps color-level spec sheets on `tarkett.rs/sr_RS/pdf/...`
- `tools/extract_tarkett_heterogeneous_vinyl.js` scrapes the official Tarkett Serbia `Heterogeni vinil` catalog through Playwright + `json-collection-product`, keeps stored-JSON fallback per collection, falls back to `page.content()` / HTML parsing when the category grid returns an empty DOM query in headless shell mode, writes collection PDFs to `/docs/`, and keeps color-level spec sheets on `tarkett.rs/sr_RS/pdf/...`
- `tools/extract_wolflor_vinyl.py` combines the live Wolflor WooCommerce Store API with 7 local Wolflor PDF supplements, generates `public/data/wolflor_vinyl_colors.json`, and with `--upload-supabase` pushes all Wolflor hero/color JPG assets to the `product-images` bucket while copying source PDFs into `public/documents/wolflor/`; subsequent refreshes reuse the already-uploaded Supabase URLs unless `--force-upload` is explicitly passed
- `tools/extract_tarkett_wood.js` scrapes the official Tarkett Serbia Parket/Laminat collection pages and generates `public/data/tarkett_wood_collection_index.json` with normalized `/docs/` collection PDF URLs
- `tools/scrape_tarkett_deep.js` scrapes Tarkett LVT data and now also normalizes collection PDF URLs to `/docs/`
- `scripts/audit-tarkett-sync.ts` compares official Tarkett Parket/Laminat collections against `lib/data/tarkett-products.ts`, `public/data/tarkett_documents_index.json`, and Supabase when env vars are available, including exact design-slug comparison, duplicate detection, and parket alias normalization for collection-specific URL collisions
- `scripts/sync-tarkett-supabase.ts` creates a timestamped backup in `output/`, performs a dry-run diff, and can apply the canonical Tarkett Parket/Laminat sync into Supabase once `.env.local` contains the pulled Vercel env vars
- `scripts/audit-catalog-quality.ts` runs a broader product-quality audit over the canonical catalog sources, collection headers, documents, hero images, descriptions, and specs, explicitly flags stale Tarkett `/large/*.pdf` document URLs, and writes `output/catalog-quality-audit.json`

## Project Structure

```
PODOVI/
├── app/                    # Next.js App Router pages
│   ├── page.tsx            # Homepage
│   ├── layout.tsx          # Root layout (providers, analytics, header/footer)
│   ├── kategorije/         # Categories (Laminat, Vinil, Parket, etc.)
│   ├── proizvodi/          # Individual product pages
│   ├── brendovi/           # Brand pages (Tarkett, Gerflor, BLOQ, Wolflor)
│   ├── kontakt/            # Contact page with form
│   ├── omiljeni/           # Favorites page
│   ├── uporedi/            # Product comparison page
│   ├── upiti/              # Inquiry page
│   ├── api/                # API routes
│   │   ├── colors/         #   Color/variant data endpoint
│   │   ├── contact/        #   Contact form submission
│   │   ├── inquiries/      #   Product inquiry submission
│   │   ├── products/       #   Product data endpoint
│   │   └── search/         #   Global product search
│   ├── sitemap.ts          # Dynamic sitemap generation
│   ├── robots.ts           # Robots.txt generation
│   ├── error.tsx           # Error boundary
│   ├── global-error.tsx    # Global error boundary
│   └── not-found.tsx       # 404 page
│
├── components/             # React components
│   ├── Header.tsx          # Site navigation with favorites badge
│   ├── Footer.tsx          # Site footer
│   ├── GlobalSearch.tsx    # Full-text product search
│   ├── ProductCard.tsx     # Product card (server component)
│   ├── ProductCardClient.tsx   # Product card (client component)
│   ├── ProductCardOverlay.tsx  # Favorite + Compare buttons overlay
│   ├── ProductActions.tsx  # Favorite + Compare + Share for detail pages
│   ├── ProductColorSelector.tsx # Color selector with image switching
│   ├── ProductFilters.tsx  # Category page filters (search, brand, price, etc.)
│   ├── ProductImage.tsx    # Optimized product image component
│   ├── ProductCharacteristics.tsx # Product specs table
│   ├── ProductDocuments.tsx     # Downloadable PDF documents section
│   ├── ProductInquiryStickyCTA.tsx # Sticky inquiry CTA on product detail
│   ├── ColorGrid.tsx       # Color variant grid for collections
│   ├── FavoriteButton.tsx  # Heart toggle button
│   ├── CompareButton.tsx   # Compare toggle button
│   ├── CompareBar.tsx      # Sticky bottom comparison bar
│   ├── InquiryButton.tsx   # Inquiry trigger button
│   ├── InquiryModal.tsx    # Inquiry form modal
│   ├── FlooringCalculator.tsx  # Material quantity calculator
│   ├── ShareButtons.tsx    # Share via Web Share API / clipboard
│   ├── WhatsAppButton.tsx  # Direct WhatsApp link button
│   ├── CategoryCard.tsx    # Category card on homepage
│   ├── BrandCard.tsx       # Brand card on homepage
│   ├── Breadcrumbs.tsx     # Breadcrumb navigation
│   ├── CertificationBadges.tsx  # Product certification badges
│   ├── EcoFeatures.tsx     # Eco-friendly features display
│   ├── LVTTabs.tsx         # LVT category tabbed layout
│   ├── ScrollReveal.tsx    # Scroll-based animation wrapper
│   └── GoogleAnalytics.tsx # GA4 script injection
│
├── lib/
│   ├── context/            # React Context providers
│   │   ├── CompareContext.tsx   # Comparison state (localStorage)
│   │   └── FavoritesContext.tsx # Favorites state (localStorage)
│   ├── data/               # Product data files
│   │   ├── mock-data.ts    # Categories, brands, vinyl & LVT products
│   │   ├── tarkett-products.ts  # Tarkett brand products
│   │   ├── tarkett-wood-enrichment.ts # Official Tarkett Parket/Laminat enrichment
│   │   ├── gerflor-products-generated.ts  # Auto-generated Gerflor catalog
│   │   ├── linoleum-products.ts # Linoleum products
│   │   ├── parket-collection-mapping.ts # Parket variants mapping
│   │   ├── manual-collection-products.ts # Manual collection headers for nested JSON sources
│   │   ├── lvt-detailed-info.ts # LVT detailed specifications
│   │   └── lvt-extra.ts    # Additional LVT data
│   ├── repositories/       # Data access layer (repository pattern)
│   │   ├── product-repository.ts   # Product CRUD & queries
│   │   ├── category-repository.ts  # Category data access
│   │   ├── brand-repository.ts     # Brand data access
│   │   ├── inquiry-repository.ts   # Inquiry persistence (Supabase)
│   │   └── id-mapping.ts          # ID mapping utilities
│   ├── mailer/             # Email sending utilities
│   ├── seo/                # SEO utilities & structured data
│   ├── supabase/           # Supabase client configuration
│   └── utils/              # General utility functions
│
├── public/
│   ├── data/               # JSON color/variant data files
│   │   ├── lvt_colors_complete.json
│   │   ├── vinyl_colors_complete.json
│   │   ├── tarkett_vinyl_home_colors.json
│   │   ├── tarkett_homogeneous_vinyl_colors.json
│   │   ├── tarkett_heterogeneous_vinyl_colors.json
│   │   ├── wolflor_vinyl_colors.json
│   │   ├── linoleum_colors_complete.json
│   │   ├── industrial_colors.json
│   │   ├── sport_colors.json
│   │   ├── tarkett_sport_colors.json
│   │   ├── tarkett_wood_collection_index.json
│   │   ├── documents_index.json
│   │   ├── tarkett_documents_index.json
│   │   ├── carpet_tiles_complete.json  # Gerflor carpet tiles (26 colors)
│   │   └── bloq_carpet_tiles.json      # BLOQ carpet tiles (18 collections, 210 colors)
│   ├── documents/          # Product PDF documents + Wolflor PDF supplements
│   └── images/             # Product images
│       └── products/bloq-roomshots/  # BLOQ collection hero images (18 roomshots)
│
├── supabase/
│   └── migration.sql       # Database schema migration
│
├── types/                  # TypeScript type definitions
│
├── scripts/                # Utility scripts
│   ├── validate-images.js          # Image path validator (runs before build)
│   ├── generate-bloq-data.js       # Generate BLOQ product data
│   ├── download-bloq-images.ps1    # Download BLOQ roomshot images
│   ├── update-bloq-image-paths.js  # Update BLOQ image references
│   ├── audit-tarkett-sync.ts       # Official Tarkett vs local/supabase audit
│   ├── audit-catalog-quality.ts    # Broad canonical catalog quality audit
│   ├── sync-tarkett-supabase.ts    # Dry-run/apply Supabase sync for Tarkett parket/laminat
│   ├── seed-database.ts            # Seed Supabase database
│   ├── run-migration.mjs           # Run database migration
│   └── test-email.ts               # Email sending test
│
├── tools/                  # Dev tools
│   ├── check-images.js             # Image checker
│   ├── extract_tarkett_sports.js   # Tarkett sports catalog extractor
│   ├── extract_tarkett_vinyl_home.js # Tarkett home vinyl catalog extractor
│   ├── extract_wolflor_vinyl.py    # Wolflor live + PDF vinyl extractor
│   ├── extract_tarkett_homogeneous_vinyl.js # Tarkett homogeneous vinyl catalog extractor
│   ├── extract_tarkett_heterogeneous_vinyl.js # Tarkett heterogeneous vinyl catalog extractor
│   ├── extract_tarkett_wood.js     # Tarkett parket/laminat collection extractor
│   ├── normalize-json.js           # JSON normalizer
│   └── suggest-fixes-unknowns.js   # Unknown product fix suggestions
│
└── archive/                # Historical scripts (not in git)
```

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Next.js App Router                │
│  ┌───────────┐  ┌───────────┐  ┌─────────────────┐  │
│  │   Pages   │  │   API     │  │   Components    │  │
│  │ /kategorije│  │ /api/     │  │ ProductCard     │  │
│  │ /proizvodi │  │  search   │  │ ProductFilters  │  │
│  │ /brendovi  │  │  contact  │  │ GlobalSearch    │  │
│  │ /omiljeni  │  │  products │  │ InquiryModal    │  │
│  │ /uporedi   │  │  colors   │  │ CompareBar      │  │
│  │ /kontakt   │  │  inquiries│  │ ...             │  │
│  └─────┬─────┘  └─────┬─────┘  └────────┬────────┘  │
│        │              │                  │           │
│  ┌─────▼──────────────▼──────────────────▼────────┐  │
│  │              Repository Layer                  │  │
│  │  product / category / brand / inquiry repos    │  │
│  └─────────────────────┬──────────────────────────┘  │
│                        │                             │
│  ┌─────────────────────▼──────────────────────────┐  │
│  │           Data Sources                         │  │
│  │  Static TS files  │  JSON files  │  Supabase   │  │
│  └────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

## Product Categories

| Category | Serbian | ID |
|----------|---------|-----|
| Laminat | Laminat | 1 |
| Vinil | Vinyl | 2 |
| Parket | Parket | 3 |
| Tekstilne ploče | Carpet tiles | 4 |
| Deking | Decking | 5 |
| LVT | LVT | 6 |
| Linoleum | Linoleum | 7 |
| Elektroprovodni | ESD floors | 8 |
| Industrijske ploče | Industrial tiles | 9 |
| Sport | Sports floors | 10 |

## Brands

- **Tarkett** (ID: 3) — Global flooring leader
- **Gerflor** (ID: 6) — French vinyl/commercial flooring specialist
- **BLOQ** (ID: 8) — Dutch premium carpet tile manufacturer (18 collections, 210 colors)
- **TimberTech** (ID: 10) — Decking / outdoor flooring brand

## npm Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Validate images + build production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run check:images` | Check product image paths |
| `npm run validate:images` | Validate all image paths exist (runs before build) |
| `npm run normalize:colors` | Normalize JSON color data |
| `npm run suggest:unknowns` | Suggest fixes for unknown product codes |
| `npx tsx scripts/audit-tarkett-sync.ts` | Audit official Tarkett Parket/Laminat vs local data and docs |

## Environment Variables

Copy `.env.example` to `.env.local`:

```env
# Gmail SMTP Configuration for inquiry emails
# Create an App Password at: https://myaccount.google.com/apppasswords
# (Requires 2-Factor Authentication to be enabled on the Gmail account)
GMAIL_USER=prodaja@podovi.online
GMAIL_APP_PASSWORD=your-16-character-app-password

# Optional: Override admin email if different from GMAIL_USER
# ADMIN_EMAIL=prodaja@podovi.online
```

Additional variables used in `.env.local`:

```env
NEXT_PUBLIC_BASE_URL=https://www.podovi.online
NEXT_PUBLIC_GA_MEASUREMENT_ID=  # Google Analytics 4
NEXT_PUBLIC_SUPABASE_URL=       # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=  # Supabase anonymous key
SUPABASE_SERVICE_ROLE_KEY=      # Required for storage uploads and admin scripts
SUPABASE_ACCESS_TOKEN=          # Optional fallback for scripts that discover the project/keys via Supabase Management API
SUPABASE_PROJECT_REF=           # Optional explicit project ref for upload scripts
SUPABASE_PROJECT_NAME=podovi    # Optional fallback project name for upload scripts
```

## Database

The project uses **Supabase** (PostgreSQL) for storing product inquiries. The schema migration is in `supabase/migration.sql`.

```bash
# Run migration
node scripts/run-migration.mjs

# Seed database with product data
npx tsx scripts/seed-database.ts
```

## License

Private — All rights reserved.
