# Podovi.online — Katalog podnih obloga

> Serbian flooring catalog website — [podovi.online](https://www.podovi.online)

## Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
- **Language**: TypeScript
- **Styling**: [TailwindCSS 3](https://tailwindcss.com/)
- **Database**: Supabase (PostgreSQL)
- **Email**: Nodemailer
- **Analytics**: Google Analytics 4
- **Deployment**: Vercel

## Getting Started

```bash
# Install dependencies
npm install

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

### Contact & Inquiries
- Contact form with product pre-fill from product pages
- Email notifications via SMTP (Nodemailer)

### SEO & Performance
- Structured data (Organization, Website, Product schemas)
- Dynamic meta tags and Open Graph images
- Sitemap generation
- Optimized images with Next.js Image component

## Project Structure

```
PODOVI/
├── app/                    # Next.js App Router pages
│   ├── page.tsx            # Homepage
│   ├── kategorije/         # Categories (Laminat, Vinil, Parket, etc.)
│   ├── proizvodi/          # Individual product pages
│   ├── brendovi/           # Brand pages (Tarkett, Gerflor)
│   ├── kontakt/            # Contact page with form
│   ├── omiljeni/           # Favorites page
│   ├── uporedi/            # Product comparison page
│   ├── upiti/              # Inquiry page
│   └── api/                # API routes (contact, inquiries, products, colors)
│
├── components/             # React components
│   ├── Header.tsx          # Site navigation with favorites badge
│   ├── Footer.tsx          # Site footer
│   ├── ColorGrid.tsx       # Color variant grid for collections
│   ├── ProductCard.tsx     # Product card with overlay buttons
│   ├── ProductCardOverlay.tsx  # Favorite + Compare buttons overlay
│   ├── ProductActions.tsx  # Favorite + Compare + Share for detail pages
│   ├── ProductColorSelector.tsx # Color selector with image switching
│   ├── ProductFilters.tsx  # Category page filters
│   ├── FavoriteButton.tsx  # Heart toggle button
│   ├── CompareButton.tsx   # Compare toggle button
│   ├── CompareBar.tsx      # Sticky bottom comparison bar
│   └── ...                 # Additional components
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
│   │   └── parket-collection-mapping.ts # Parket variants mapping
│   ├── repositories/       # Data access layer (repository pattern)
│   └── seo/                # SEO utilities & structured data
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
├── types/                  # TypeScript type definitions
├── scripts/                # Active utility scripts
│   ├── validate-images.js  # Image path validator (used in build)
│   └── test-email.ts       # Email sending test
├── tools/                  # Active dev tools
│   ├── check-images.js     # Image checker
│   ├── normalize-json.js   # JSON normalizer
│   └── suggest-fixes-unknowns.js  # Unknown product fix suggestions
└── archive/                # Historical scripts (not in git)
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
| `npm run check:images` | Check product image paths |
| `npm run validate:images` | Validate all image paths exist (runs before build) |
| `npm run normalize:colors` | Normalize JSON color data |
| `npm run suggest:unknowns` | Suggest fixes for unknown product codes |

## Environment Variables

Copy `.env.example` to `.env.local`:

```env
SMTP_HOST=        # SMTP server for email
SMTP_PORT=        # SMTP port
SMTP_USER=        # SMTP username
SMTP_PASS=        # SMTP password
NEXT_PUBLIC_BASE_URL=https://www.podovi.online
NEXT_PUBLIC_GA_MEASUREMENT_ID=  # Google Analytics 4
NEXT_PUBLIC_SUPABASE_URL=       # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=  # Supabase anonymous key
```
