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

## Key Features

### Product Catalog
- Browse products by **category** (Laminat, Vinil, Parket, LVT, Linoleum, Tekstilne ploče, Deking)
- Browse by **brand** (Tarkett, Gerflor, BLOQ)
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

## Project Structure

```
PODOVI/
├── app/                    # Next.js App Router pages
│   ├── page.tsx            # Homepage
│   ├── layout.tsx          # Root layout (providers, analytics, header/footer)
│   ├── kategorije/         # Categories (Laminat, Vinil, Parket, etc.)
│   ├── proizvodi/          # Individual product pages
│   ├── brendovi/           # Brand pages (Tarkett, Gerflor)
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
│   │   ├── gerflor-products-generated.ts  # Auto-generated Gerflor catalog
│   │   ├── linoleum-products.ts # Linoleum products
│   │   ├── parket-collection-mapping.ts # Parket variants mapping
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
│   │   ├── linoleum_colors_complete.json
│   │   ├── carpet_tiles_complete.json  # Gerflor carpet tiles (26 colors)
│   │   └── bloq_carpet_tiles.json      # BLOQ carpet tiles (18 collections, 210 colors)
│   ├── documents/          # Product PDF documents (231 files)
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
│   ├── seed-database.ts            # Seed Supabase database
│   ├── run-migration.mjs           # Run database migration
│   └── test-email.ts               # Email sending test
│
├── tools/                  # Dev tools
│   ├── check-images.js             # Image checker
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

## Brands

- **Tarkett** (ID: 3) — Global flooring leader
- **Gerflor** (ID: 6) — French vinyl/commercial flooring specialist
- **BLOQ** (ID: 8) — Dutch premium carpet tile manufacturer (18 collections, 210 colors)

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
