# Podovi.online — Katalog podnih obloga

> Serbian flooring catalog website — [podovi.online](https://www.podovi.online)

## Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
- **Language**: TypeScript
- **Styling**: [TailwindCSS 3](https://tailwindcss.com/)
- **Email**: Nodemailer
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

## Project Structure

```
PODOVI/
├── app/                    # Next.js App Router pages
│   ├── page.tsx            # Homepage
│   ├── kategorije/         # Categories (Laminat, Vinil, Parket, etc.)
│   ├── proizvodi/          # Individual product pages
│   ├── brendovi/           # Brand pages (Tarkett, Gerflor)
│   ├── kontakt/            # Contact page with form
│   ├── upiti/              # Inquiry page
│   └── api/                # API routes (contact, inquiries)
│
├── components/             # React components
│   ├── Header.tsx          # Site navigation
│   ├── Footer.tsx          # Site footer
│   ├── ColorGrid.tsx       # Color variant grid for collections
│   ├── ProductCard.tsx     # Product card (server)
│   ├── ProductCardClient.tsx # Product card (client-side interactions)
│   ├── ProductFilters.tsx  # Category page filters
│   ├── InquiryModal.tsx    # Product inquiry form modal
│   └── ...                 # 23 total components
│
├── lib/
│   ├── data/               # Product data files
│   │   ├── mock-data.ts    # Categories, brands, vinyl & LVT products
│   │   ├── tarkett-products.ts  # Tarkett brand products
│   │   ├── gerflor-products-generated.ts  # Auto-generated Gerflor catalog
│   │   └── linoleum-products.ts # Linoleum products
│   ├── repositories/       # Data access layer (repository pattern)
│   └── seo/                # SEO utilities
│
├── public/
│   ├── data/               # JSON color/variant data files
│   │   ├── lvt_colors_complete.json
│   │   ├── vinyl_colors_complete.json
│   │   ├── linoleum_colors_complete.json
│   │   └── carpet_tiles_complete.json
│   ├── documents/          # Product PDF documents (231 files)
│   └── images/             # Product images
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
| Parket | Parket | 3 |
| Laminat | Laminat | 1 |
| LVT | LVT | 6 |
| Tekstilne ploče | Carpet tiles | 4 |
| Deking | Decking | 5 |
| Vinil | Vinyl | 2 |
| Linoleum | Linoleum | 7 |

## Brands

- **Tarkett** (ID: 3) — Global flooring leader
- **Gerflor** (ID: 6) — French vinyl/commercial flooring specialist

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
```
