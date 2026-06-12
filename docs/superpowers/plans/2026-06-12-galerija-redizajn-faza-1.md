# Redizajn „Galerija" (Faza 1) — Implementacioni plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Kompletan vizuelni redizajn javnih stranica podovi.online u monohromni galerijski jezik (po specu `docs/superpowers/specs/2026-06-12-podovi-redizajn-design.md`), bez ijedne izmene data sloja, URL-ova, SEO-a ili logike.

**Architecture:** Task 1 uvodi dizajn tokene (`ink`/`paper` paleta, `tracking-label`) i nove globalne helpere (`.btn-*`, `.input`, `.label`, `.eyebrow`, `.container`) u `tailwind.config.ts` + `app/globals.css`; taskovi 2–7 zatim restilizuju komponente u logičkim grupama (globalni okvir → kartice → listing → proizvod jezgro → proizvod sekcije → sekundarne stranice), svaki sa buildom i commitom; Task 8 je završni sweep (grep verifikacija nula legacy klasa) + puna verifikacija iz speca §8.

**Tech Stack:** Next.js 14 (App Router), React 18, TypeScript, TailwindCSS 3, vitest contract testovi. Sajt na srpskom.

**Kritična pravila za izvođača:**
- Taskovi se rade REDOM (2–7 zavise od tokena/helpera iz Taska 1). Unutar taska, OLD snippeti su doslovne kopije iz repoa (verifikovano za svih 90 blokova, uključujući trailing spaces — kopiraj ih tačno; fajlovi su CRLF).
- NE diraju se: `app/crm/**`, `components/crm/LeadSaveButton.tsx`, `lib/**`, `types/**`, `public/data/**`, API rute, slugovi, SEO strukturirani podaci, aria atributi (osim dodavanja).
- Posle Taska 1 a pre Taska 3/7, klase `badge-*`/`card-hover`/`spec-chip` privremeno postoje u JSX-u ali bez CSS definicija — to je očekivano prelazno stanje (build prolazi, vizuelno se sređuje u tim taskovima).
- Commit posle svakog taska; BEZ push-a (Vercel auto-deploy sa main).

**Amandman posle quality review-a Taska 4 (važi za taskove 5 i 7):** postoji zajednički hook `components/useScrollLock.ts` (brojač + zaključavanje `documentElement` I `body` overflow-a) — SVAKI novi overlay (InquiryModal u Tasku 7) koristi `useScrollLock(open)` umesto ručnog `document.body.style.overflow`. Overlay šablon: jedan `<div className="fixed inset-0 z-[60]">` omotač sa `absolute inset-0 bg-black/20` backdrop-om unutra (iznad sticky headera z-50 i plutajućih z-40). Neaktivni tabovi/tekst manji od 18px koriste `text-ink-500` (ne ink-400 — pada AA kontrast). `ProductCard` sada ima opcioni `sizes` prop — mreže koje nisu 2/3/4 prosleđuju svoj `sizes` string (CompareBar/omiljeni u Tasku 7 proveriti isto).

**Amandman posle quality review-a Taska 3 (važi za Task 4):** kada mreže pređu na `grid-cols-2 md:grid-cols-3 xl:grid-cols-4`, u `components/ProductCard.tsx` i `components/ProductCardClient.tsx` (normal rezim) ažurirati `sizes` atribut slike sa `"(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"` na `"(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 25vw"` — inače mobilni preuzima 4× veće slike nego što treba. Opciono u istim fajlovima: dodati `group-focus-visible:underline` uz `group-hover:underline` na nazivu.

**Amandman posle quality review-a Taska 2 (važi za taskove 4, 5 i 7):** pravila slojeva i overlay ponašanja — fiksni plutajući elementi (WhatsAppButton, BackToTop, CompareBar, ProductInquiryStickyCTA) koriste `z-40`; full-screen/slide-over overlayi (mobilni meni, pretraga, fioka filtera, InquiryModal) ostaju iznad njih, zaključavaju body scroll dok su otvoreni (`document.body.style.overflow = 'hidden'` u efektu sa cleanup-om), zatvaraju se na Escape preko document-level listenera, i vraćaju fokus na element koji ih je otvorio. Ako NEW snippet u tasku navodi drugačiji z-index za plutajući element, koristiti `z-40`.

---

### Task 1: Temelj — dizajn tokeni i globalni helperi

**Files:**
- Modify: `tailwind.config.ts`
- Modify: `app/globals.css`

- [ ] **Step 1: Zameni ceo sadržaj `tailwind.config.ts`**

NOVA VERZIJA FAJLA:

```ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          900: '#111111',
          700: '#333333',
          600: '#555555',
          500: '#767676',
          400: '#8A8A8A',
          200: '#E5E5E5',
        },
        paper: '#F7F5F2',
        // Roza paleta ostaje ISKLJUČIVO zbog /crm i LeadSaveButton (van obima redizajna).
        primary: {
          50: '#fff1f2',
          100: '#ffe4e6',
          200: '#fecdd3',
          300: '#fda4af',
          400: '#fb7185',
          500: '#f43f5e',
          600: '#e11d48',
          700: '#be123c',
          800: '#9f1239',
          900: '#881337',
        },
      },
      letterSpacing: {
        label: '0.14em',
      },
    },
  },
  plugins: [],
};
export default config;
```

- [ ] **Step 2: Zameni ceo sadržaj `app/globals.css`**

Briše se: `.card`/`.card-hover`, svih 15 `.badge-*` klasa, `.spec-chip`, `.glass`/`.glass-dark`, `.text-apple-*`, `fadeScale`/`.animate-fadeScale`, `.btn-outline`, stari fokus ringovi i hardkodovane hex boje. Potrošači su isključivo u fajlovima koje taskovi 3, 4 i 7 potpuno prepravljaju (provereno grep-om; `.btn-outline` koristi `ProductFilters` koji se prepravlja u Tasku 4). `.no-scrollbar` OSTAJE (koristi ga `HomeProductTabs`).

Odluka o fokusu inputa (za izvođača Taska 7 — NE „popravljati" drugačije): fokus mišem pokazuje samo donju liniju (1px → ink-900), a tastaturni fokus dodatno dobija standardni 2px outline kroz `.input:focus-visible` pravilo ispod.

NOVA VERZIJA FAJLA:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  html {
    scroll-behavior: smooth;
    overflow-x: hidden;
  }

  body {
    @apply bg-white text-ink-900 antialiased;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 16px;
    line-height: 1.6;
    letter-spacing: -0.01em;
    overflow-x: hidden;
  }

  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    @apply font-normal text-ink-900;
    letter-spacing: -0.02em;
  }

  h1 {
    @apply text-[34px] leading-[1.15] md:text-[48px];
  }

  h2 {
    @apply text-[28px] md:text-[34px];
  }

  h3 {
    @apply text-xl md:text-2xl;
  }

  :focus-visible {
    outline: 2px solid theme(colors.ink.900);
    outline-offset: 2px;
  }
}

@layer components {
  .container {
    @apply mx-auto max-w-[1440px] px-6 md:px-10;
  }

  .btn {
    @apply inline-flex items-center justify-center px-[26px] py-3 text-[13px] font-medium transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50;
  }

  .btn-primary {
    @apply btn bg-ink-900 text-white hover:bg-ink-700;
  }

  .btn-secondary {
    @apply btn border border-ink-900 bg-transparent text-ink-900 hover:bg-ink-900 hover:text-white;
  }

  .btn-inverse {
    @apply btn bg-white text-ink-900 hover:bg-ink-200;
  }

  .btn-link {
    @apply border-b border-ink-900 pb-0.5 text-[13px] font-medium text-ink-900 transition-opacity hover:opacity-60;
  }

  .input {
    @apply block w-full border-0 border-b border-ink-200 bg-transparent px-0 py-2 text-[15px] text-ink-900 placeholder-ink-500 transition-colors focus:border-ink-900 focus:outline-none;
  }

  .input:focus-visible {
    outline: 2px solid theme(colors.ink.900);
    outline-offset: 2px;
  }

  .label {
    @apply mb-2 block text-[11px] font-medium uppercase tracking-label text-ink-500;
  }

  .eyebrow {
    @apply text-[11px] uppercase tracking-label text-ink-500;
  }

  .no-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }

  .no-scrollbar::-webkit-scrollbar {
    display: none;
  }
}
```

- [ ] **Step 3: Build provera**

Run: `npm run build` (u korenu repoa). Expected: uspešan build. Stranice će izgledati prelazno (stari JSX + novi tokeni) — to je očekivano.

- [ ] **Step 4: Commit**

```bash
git add tailwind.config.ts app/globals.css && git commit -m "style: uvedi Galerija dizajn tokene (ink/paper) i nove globalne helpere"
```

---

---

### Task 2: Globalni okvir — header, logo, footer, pretraga, layout

**Files:**
- Modify: components/PodoviWordmark.tsx
- Modify: components/Header.tsx
- Modify: components/GlobalSearch.tsx
- Modify: components/BrandLogoMark.tsx
- Modify: components/Footer.tsx
- Modify: components/BackToTop.tsx
- Modify: components/WhatsAppButton.tsx
- Modify: components/ScrollReveal.tsx
- Modify: app/layout.tsx

Napomene pre početka:
- `PodoviWordmark` se koristi na TAČNO tri mesta (provereno grep-om): `components/Header.tsx`, `components/Footer.tsx`, `components/BrandLogoMark.tsx`. OG slike ga NE koriste — ne postoji nijedan `opengraph-image`/`twitter-image` fajl u `app/`, a `metadata.openGraph.images` u `app/layout.tsx` pokazuje na statičnu sliku `/og-image.jpg`. Sva tri mesta korišćenja se ažuriraju u ovom tasku, pa je bezbedno ukloniti `lineClassName` prop (podvlaka ispod logotipa se ukida).
- CSS klase `.scroll-reveal` / `.revealed` koje `ScrollReveal.tsx` referencira NISU definisane ni u jednom CSS fajlu u repou (komponenta je trenutno vizuelno no-op). Nova verzija prelazi na inline Tailwind utility klase sa stišanim parametrima (pomak 12px, trajanje 400ms) — videti Step 8.
- Nijedan fajl iz ove grupe ne importuje framer-motion — nema importa za brisanje.

- [ ] **Step 1: PodoviWordmark.tsx — novi wordmark: malim slovima, Inter bold, zbijen tracking, bez podvlake**

Ceo fajl je mali i suštinski se menja (uklanja se roza `bg-primary-600` podvlaka sa `rounded-full`, `font-semibold` postaje `font-bold` — jedini dozvoljeni bold na sajtu — i `tracking-tighter` postaje `tracking-[-0.02em]`). NOVA VERZIJA FAJLA:

```tsx
type PodoviWordmarkProps = {
  className?: string;
  textClassName?: string;
};

export default function PodoviWordmark({
  className = '',
  textClassName = 'text-2xl text-ink-900',
}: PodoviWordmarkProps) {
  return (
    <span className={`inline-block ${className}`.trim()}>
      <span className={`font-bold lowercase tracking-[-0.02em] ${textClassName}`.trim()}>
        podovi
      </span>
    </span>
  );
}
```

Napomena: `lineClassName` prop je uklonjen — sva tri mesta korišćenja (Header, Footer, BrandLogoMark) se ažuriraju u Step 2, 4 i 5 ovog taska, ostalih korisnika nema.

- [ ] **Step 2: Header.tsx — beo sticky header sa hairline ivicom, ikonica-pretraga, full-screen mobilni meni**

Komponenta se suštinski prepravlja (>60% JSX-a): uklanja se centrirana desktop pretraga (GlobalSearch postaje ikonica-okidač, videti Step 3), uklanja se dekorativna fiksna bela 2px traka, harmonika mobilni meni postaje full-screen beli overlay, sve boje prelaze na ink tokene, CTA postaje mala varijanta `.btn-primary`. Logika (useState, usePathname, useFavorites, isActive) ostaje identična; helper `mobileNavLinkClass` se briše jer su mobilni linkovi restrukturirani. NOVA VERZIJA FAJLA:

```tsx
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import GlobalSearch from './GlobalSearch';
import PodoviWordmark from './PodoviWordmark';
import { useFavorites } from '@/lib/context/FavoritesContext';

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { count: favCount } = useFavorites();

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <header className="sticky top-0 z-50 isolate border-b border-ink-200 bg-white">
      <nav className="container flex h-14 items-center justify-between md:h-16">
        {/* Logo */}
        <Link href="/" className="flex min-h-[44px] items-center">
          <PodoviWordmark textClassName="text-xl md:text-2xl text-ink-900" />
        </Link>

        {/* Desktop actions */}
        <div className="hidden items-center gap-2 md:flex lg:gap-4">
          <GlobalSearch />

          <Link
            href="/omiljeni"
            className={`relative flex min-h-[44px] min-w-[44px] items-center justify-center transition-colors duration-200 ${isActive('/omiljeni') ? 'text-ink-900' : 'text-ink-600 hover:text-ink-900'}`}
            title="Omiljeni proizvodi"
          >
            <svg className="h-5 w-5" fill={isActive('/omiljeni') ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            {favCount > 0 && (
              <span className="absolute right-0 top-1 flex h-4 w-4 items-center justify-center bg-ink-900 text-[10px] font-medium text-white">
                {favCount > 9 ? '9+' : favCount}
              </span>
            )}
          </Link>

          <Link
            href="/upiti"
            className="btn-primary px-5 py-2"
            aria-current={isActive('/upiti') ? 'page' : undefined}
          >
            Pošalji upit
          </Link>
        </div>

        {/* Mobile: search + menu trigger */}
        <div className="flex items-center gap-1 md:hidden">
          <GlobalSearch />
          <button
            type="button"
            className="flex min-h-[44px] min-w-[44px] items-center justify-center text-ink-900 transition-colors duration-200 hover:text-ink-600"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Otvori meni"
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-menu"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </nav>

      {/* Mobile full-screen menu */}
      {mobileMenuOpen && (
        <div id="mobile-menu" className="fixed inset-0 z-[60] flex flex-col bg-white md:hidden">
          <div className="border-b border-ink-200">
            <div className="container flex h-14 items-center justify-between">
              <Link href="/" onClick={closeMobileMenu} className="flex min-h-[44px] items-center">
                <PodoviWordmark textClassName="text-xl text-ink-900" />
              </Link>
              <button
                type="button"
                className="flex min-h-[44px] min-w-[44px] items-center justify-center text-ink-900 transition-colors duration-200 hover:text-ink-600"
                onClick={closeMobileMenu}
                aria-label="Zatvori meni"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <nav className="container flex flex-1 flex-col justify-center" aria-label="Mobilna navigacija">
            <Link
              href="/omiljeni"
              className="flex min-h-[44px] items-center justify-between border-b border-ink-200 py-6 text-[26px] font-normal text-ink-900"
              aria-current={isActive('/omiljeni') ? 'page' : undefined}
              onClick={closeMobileMenu}
            >
              <span>Omiljeni</span>
              {favCount > 0 && <span className="text-[13px] text-ink-500">({favCount})</span>}
            </Link>
            <Link
              href="/upiti"
              className="flex min-h-[44px] items-center justify-between py-6 text-[26px] font-normal text-ink-900"
              aria-current={isActive('/upiti') ? 'page' : undefined}
              onClick={closeMobileMenu}
            >
              <span>Pošalji upit</span>
              <span aria-hidden="true">→</span>
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
```

Napomene:
- ❤️ emoji iz starog mobilnog menija je uklonjen (monohrom), zamenjen čistim tekstom „Omiljeni" + brojem.
- `aria-controls="mobile-menu"` ostaje na okidaču; overlay se sada renderuje uslovno (kada je zatvoren, element ne postoji — `aria-expanded` prenosi stanje, što je uobičajen obrazac).
- `fixed inset-0` unutar sticky headera radi ispravno (nema transform predaka).
- GlobalSearch se i dalje montira dvaput (jednom u desktop klasteru `hidden md:flex`, jednom u mobilnom `md:hidden`) — isto kao do sada, svaka instanca je vidljiva samo na svom breakpointu.

- [ ] **Step 3: GlobalSearch.tsx — pretraga koja se otvara preko cele širine headera (umesto dropdown kutije)**

Velika prepravka (>60% JSX-a): desktop inline input + dropdown kutija i odvojeni mobilni full-screen tok se spajaju u jedan obrazac — ikonica-okidač koja otvara beli panel preko cele širine vrha ekrana (na mobilnom full-screen, na desktopu top-sheet sa hairline donjom ivicom). Sva logika ostaje identična: isti `/api/search` poziv, debounce 300ms, keyboard navigacija (strelice/Enter/Escape), click-outside zatvaranje, `closeAndReset`, `formatPrice`. State `mobileExpanded` je preimenovan u `expanded` i sada važi za sve širine ekrana. Spiner je zamenjen skeleton blokovima `bg-paper animate-pulse` (pravilo 11). NOVA VERZIJA FAJLA:

```tsx
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import ProductImage from './ProductImage';

interface SearchProduct {
    id: string;
    slug: string;
    name: string;
    categoryId: string;
    image: string;
    imageCandidates?: Array<{ url: string; alt?: string }>;
    price?: number;
    subtitle?: string;
    url?: string;
}

interface SearchCategory {
    id: string;
    slug: string;
    name: string;
    image?: string;
}

interface SearchBrand {
    id: string;
    slug: string;
    name: string;
    logo?: string;
}

interface SearchResults {
    products: SearchProduct[];
    categories: SearchCategory[];
    brands: SearchBrand[];
}

export default function GlobalSearch() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResults | null>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const [expanded, setExpanded] = useState(false);

    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const debounceRef = useRef<NodeJS.Timeout | null>(null);

    const totalResults = results
        ? results.products.length
        : 0;

    // Fetch search results
    const fetchResults = useCallback(async (q: string) => {
        if (q.length < 2) {
            setResults(null);
            setIsOpen(false);
            return;
        }

        setIsLoading(true);
        try {
            const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
            const data: SearchResults = await res.json();
            setResults(data);
            setIsOpen(true);
            setActiveIndex(-1);
        } catch {
            setResults(null);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Debounced search
    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);

        if (query.length < 2) {
            setResults(null);
            setIsOpen(false);
            return;
        }

        debounceRef.current = setTimeout(() => {
            fetchResults(query);
        }, 300);

        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [query, fetchResults]);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
                setExpanded(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Build flat list of all result items for keyboard navigation
    const getAllItems = (): { type: string; href: string }[] => {
        if (!results) return [];
        const items: { type: string; href: string }[] = [];
        results.products.forEach(p => items.push({ type: 'product', href: p.url || `/proizvodi/${p.slug}` }));
        return items;
    };

    // Keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent) => {
        const items = getAllItems();

        if (e.key === 'Escape') {
            setIsOpen(false);
            setExpanded(false);
            inputRef.current?.blur();
            return;
        }

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveIndex(prev => (prev < items.length - 1 ? prev + 1 : 0));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveIndex(prev => (prev > 0 ? prev - 1 : items.length - 1));
        } else if (e.key === 'Enter' && activeIndex >= 0 && items[activeIndex]) {
            e.preventDefault();
            window.location.href = items[activeIndex].href;
            closeAndReset();
        }
    };

    const closeAndReset = () => {
        setIsOpen(false);
        setExpanded(false);
        setQuery('');
        setResults(null);
        setActiveIndex(-1);
    };

    const openSearch = () => {
        setExpanded(true);
        setTimeout(() => inputRef.current?.focus(), 100);
    };

    const handleResultClick = () => {
        closeAndReset();
    };

    // Track which flat index each result is at
    let flatIndex = 0;

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('sr-RS', {
            style: 'decimal',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(price) + ' RSD/m²';
    };

    return (
        <div ref={containerRef}>
            {/* Trigger */}
            <button
                type="button"
                className="flex min-h-[44px] min-w-[44px] items-center justify-center text-ink-600 transition-colors duration-200 hover:text-ink-900"
                onClick={openSearch}
                aria-label="Otvori pretragu"
                aria-expanded={expanded}
            >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
            </button>

            {/* Full-width search overlay preko headera */}
            {expanded && (
                <div className="fixed inset-0 z-[70] flex flex-col bg-white md:bottom-auto md:max-h-[85vh] md:border-b md:border-ink-200">
                    {/* Input red — puna širina */}
                    <div className="border-b border-ink-200">
                        <div className="container flex h-14 items-center gap-4 md:h-16">
                            <svg
                                className="h-5 w-5 flex-shrink-0 text-ink-500"
                                fill="none" viewBox="0 0 24 24" stroke="currentColor"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                                ref={inputRef}
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                onKeyDown={handleKeyDown}
                                onFocus={() => { if (results && totalResults > 0) setIsOpen(true); }}
                                placeholder="Pretraži proizvode..."
                                className="h-full flex-1 border-0 bg-transparent p-0 text-base text-ink-900 placeholder:text-ink-500 focus:outline-none md:text-lg"
                                aria-label="Pretraži proizvode"
                                aria-expanded={isOpen}
                                role="combobox"
                                aria-autocomplete="list"
                                aria-controls="search-results-list"
                            />
                            <button
                                type="button"
                                onClick={closeAndReset}
                                className="flex min-h-[44px] items-center text-[13px] text-ink-600 transition-colors duration-200 hover:text-ink-900"
                            >
                                Zatvori
                            </button>
                        </div>
                    </div>

                    {/* Rezultati */}
                    <div className="flex-1 overflow-y-auto md:max-h-[60vh] md:flex-none">
                        <div className="container py-4">
                            {isLoading && !results ? (
                                <div className="space-y-2" aria-hidden="true">
                                    <div className="h-14 animate-pulse bg-paper" />
                                    <div className="h-14 animate-pulse bg-paper" />
                                    <div className="h-14 animate-pulse bg-paper" />
                                </div>
                            ) : query.length < 2 && !results ? (
                                <div>
                                    <h3 className="eyebrow mb-3">Popularno</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {['LVT', 'Laminat', 'Parket', 'Vodootporno', 'Hrast', 'Tamno sivo', 'Belo'].map(term => (
                                            <button
                                                key={term}
                                                onClick={() => { setQuery(term); fetchResults(term); }}
                                                className="min-h-[44px] border border-ink-200 px-4 text-[13px] text-ink-600 transition-colors duration-200 hover:border-ink-900 hover:text-ink-900"
                                            >
                                                {term}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                renderResults()
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

    function renderResults() {
        if (!results) return null;

        if (totalResults === 0) {
            return (
                <div className="py-10 text-center">
                    <p className="text-sm text-ink-600">Nema rezultata za &ldquo;{query}&rdquo;</p>
                    <p className="mt-1 text-[13px] text-ink-500">Pokušajte sa drugim pojmom</p>
                </div>
            );
        }

        flatIndex = 0;

        return (
            <>
                {/* Products */}
                {results.products.length > 0 && (
                    <div id="search-results-list">
                        <div className="border-b border-ink-200 pb-2">
                            <span className="eyebrow">
                                Proizvodi ({results.products.length})
                            </span>
                        </div>
                        {results.products.map((product) => {
                            const idx = flatIndex++;
                            return (
                                <Link
                                    key={product.id}
                                    href={product.url || `/proizvodi/${product.slug}`}
                                    onClick={handleResultClick}
                                    className={`flex items-center gap-4 border-b border-ink-200 px-1 py-3 transition-colors duration-200 hover:bg-paper ${idx === activeIndex ? 'bg-paper' : ''
                                        }`}
                                >
                                    <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden bg-paper">
                                        <ProductImage
                                            src={product.image}
                                            alt={product.name}
                                            sources={product.imageCandidates}
                                            sizes="48px"
                                            className="object-cover"
                                        />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm text-ink-900">{product.name}</p>
                                        {product.price && (
                                            <p className="text-[13px] text-ink-500">{formatPrice(product.price)}</p>
                                        )}
                                        {!product.price && product.subtitle && (
                                            <p className="truncate text-[13px] text-ink-500">{product.subtitle}</p>
                                        )}
                                    </div>
                                    <svg className="h-4 w-4 flex-shrink-0 text-ink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                                    </svg>
                                </Link>
                            );
                        })}
                    </div>
                )}

            </>
        );
    }
}
```

Napomene:
- „Popularno" predlozi (ranije samo mobilni) sada se prikazuju u praznom stanju overlay-a na svim širinama — čisto prezentaciono, isti termini, isti `fetchResults` poziv.
- Dodat je `id="search-results-list"` na listu rezultata — `aria-controls` na inputu ga je i ranije referencirao, ali element sa tim id-jem nije postojao (dozvoljeno dodavanje aria/id atributa).
- Strelica `text-ink-400` je dekorativna ikonica, ne tekst — pravilo o ink-400 za tekst se ne odnosi na nju.
- Interfejsi `SearchCategory`/`SearchBrand` ostaju (deo `SearchResults` tipa koji API vraća).

- [ ] **Step 4: BrandLogoMark.tsx — ink tokeni umesto hex/gray, bez font-semibold**

OLD:
```tsx
      <div className="flex items-center">
        <PodoviWordmark textClassName="text-3xl text-[#1D1D1F]" />
      </div>
```
NEW:
```tsx
      <div className="flex items-center">
        <PodoviWordmark textClassName="text-3xl text-ink-900" />
      </div>
```

OLD:
```tsx
        <span className="text-gray-900 font-semibold">{brand.name}</span>
```
NEW:
```tsx
        <span className="text-ink-900 font-medium">{brand.name}</span>
```

- [ ] **Step 5: Footer.tsx — prelaz sa crnog na svetao footer (bg-white, hairline gornja ivica)**

Suštinska prepravka (>60% JSX-a): crna pozadina `bg-[#111111]` postaje bela sa `border-t border-ink-200`, tekst prelazi na ink-600/ink-500, socijalne ikonice iz belih krugova (`rounded-full bg-white/10`) u kvadrate sa hairline okvirom, ikonice-kutijice (`rounded-lg bg-white/10`) uz kontakt stavke se uklanjaju (čisti tekstualni linkovi), naslov „Kontakt" postaje etiketa (`.eyebrow`). Svi linkovi, telefoni, mejl i maps URL ostaju identični. SVG putanje Instagram/Facebook ikonica se prenose doslovno. NOVA VERZIJA FAJLA:

```tsx
import PodoviWordmark from './PodoviWordmark';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-ink-200 bg-white">
      <div className="container py-12 md:py-16">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-[minmax(0,560px)_minmax(280px,360px)] md:justify-between md:gap-14">
          {/* About + Branding */}
          <div>
            {/* Logo matching header style */}
            <div className="mb-4">
              <PodoviWordmark textClassName="text-2xl text-ink-900" />
            </div>
            <p className="text-sm leading-7 text-ink-600">
              Pažljivo biramo podne obloge i prateći asortiman za domove, lokale i projekte.
              Pomažemo vam da uporedite materijale, nijanse i tehnička rešenja, kako bi izbor poda bio jednostavan,
              siguran i usklađen sa prostorom.
            </p>
            {/* Social Links */}
            <div className="mt-6 flex items-center gap-3">
              <a
                href="https://www.instagram.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-11 w-11 items-center justify-center border border-ink-200 text-ink-900 transition-colors duration-200 hover:border-ink-900"
                aria-label="Instagram"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </a>
              <a
                href="https://www.facebook.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-11 w-11 items-center justify-center border border-ink-200 text-ink-900 transition-colors duration-200 hover:border-ink-900"
                aria-label="Facebook"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385h-3.047v-3.47h3.047v-2.642c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953h-1.514c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385c5.737-.9 10.125-5.864 10.125-11.854z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h3 className="eyebrow mb-5">Kontakt</h3>
            <ul className="space-y-3 text-sm text-ink-600">
              <li>
                <a href="tel:+381212982444" className="transition-colors duration-200 hover:text-ink-900">+381 21 2982 444</a>
              </li>
              <li>
                <a href="mailto:podovidoo@gmail.com" className="transition-colors duration-200 hover:text-ink-900">podovidoo@gmail.com</a>
              </li>
              <li>
                <a
                  href="https://www.google.com/maps/place/Podovi+doo/@45.2573343,19.8190724,17z/data=!3m1!4b1!4m6!3m5!1s0x475b112b635bb5e5:0xd096487f1e881485!8m2!3d45.2573306!4d19.8239433!16s%2Fg%2F11ymw3vs8b?entry=ttu&g_ep=EgoyMDI2MDEwNy4wIKXMDSoASAFQAw%3D%3D"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors duration-200 hover:text-ink-900"
                >
                  Hajduk Veljkova 11, Novi Sad
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-ink-200 pb-24 pt-8 text-center text-[13px] leading-6 text-ink-500 md:pb-0">
          <p>&copy; {currentYear} Podovi DOO. Sva prava zadržana.</p>
        </div>
      </div>
    </footer>
  );
}
```

Napomene:
- `pb-24 md:pb-0` na donjoj traci ostaje (prostor za plutajuća dugmad na mobilnom).
- `<h3 className="eyebrow">` — bez dodatne težine, kao i svi ostali eyebrow naslovi u planu. PREDUSLOV (Task 1): base sloj u `globals.css` mora resetovati težinu naslova h1–h6 na 400 (trenutno base nosi `font-semibold` i velike veličine za h1–h3) — u suprotnom bi svaki `<h2/h3 className="eyebrow">` u Taskovima 4–7 nasledio semibold.

- [ ] **Step 6: BackToTop.tsx — beli kvadrat sa hairline okvirom umesto roze kružnog FAB-a**

OLD (pazi na razmak na kraju reda `shadow-lg `):
```tsx
        <button
            onClick={scrollToTop}
            className={`fixed bottom-24 right-4 md:right-8 z-40 p-3 rounded-full bg-primary-600 text-white shadow-lg 
        hover:bg-primary-700 hover:scale-110 active:scale-95 transition-all duration-300 group
        ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}
            aria-label="Nazad na vrh"
        >
```
NEW:
```tsx
        <button
            onClick={scrollToTop}
            className="fixed bottom-24 right-4 md:right-8 z-40 flex h-11 w-11 items-center justify-center border border-ink-200 bg-white text-ink-900 transition-colors duration-200 hover:border-ink-900"
            aria-label="Nazad na vrh"
        >
```
(Uslovne `translate/opacity` klase su bile mrtav kod — komponenta vraća `null` kada `!isVisible`. `h-11 w-11` = 44px tap meta.)

OLD:
```tsx
            <svg
                className="w-6 h-6 transform group-hover:-translate-y-1 transition-transform"
```
NEW:
```tsx
            <svg
                className="h-5 w-5"
```

- [ ] **Step 7: WhatsAppButton.tsx — zelena ostaje, skidaju se senka, radius i scale; veličina usklađena**

OLD:
```tsx
      className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 bg-[#25D366] text-white rounded-full shadow-lg hover:bg-[#20BA5A] transition-all duration-300 hover:scale-110 group"
```
NEW:
```tsx
      className="fixed bottom-6 right-4 md:right-8 z-50 flex h-12 w-12 items-center justify-center bg-[#25D366] text-white transition-colors duration-200 hover:bg-[#20BA5A] group"
```
(`right-4 md:right-8` poravnava dugme u istu kolonu sa BackToTop; `h-12 w-12` = 48px, iznad minimuma tap mete.)

OLD:
```tsx
      <FaWhatsapp className="text-3xl" />
```
NEW:
```tsx
      <FaWhatsapp className="text-2xl" />
```

OLD:
```tsx
      <span className="absolute right-16 bg-gray-900 text-white px-3 py-2 rounded-lg text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
```
NEW:
```tsx
      <span className="absolute right-14 bg-ink-900 text-white px-3 py-2 text-[13px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
```

- [ ] **Step 8: ScrollReveal.tsx — stišani parametri kroz utility klase (pomak 12px, 400ms)**

Klase `.scroll-reveal`/`.revealed` ne postoje ni u jednom CSS fajlu (komponenta je trenutno vizuelno neaktivna). Nova verzija definiše tranziciju direktno utility klasama — `translate-y-3` = 12px pomak, `duration-[400ms]`, uz `motion-reduce` fallback. Logika (IntersectionObserver, delay, unobserve) ostaje identična.

OLD:
```tsx
    <div
      ref={ref}
      className={`scroll-reveal ${isRevealed ? 'revealed' : ''} ${className}`}
    >
```
NEW:
```tsx
    <div
      ref={ref}
      className={`transition-[opacity,transform] duration-[400ms] ease-out motion-reduce:transition-none motion-reduce:opacity-100 motion-reduce:translate-y-0 ${isRevealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'} ${className}`}
    >
```

Napomena (rizik): ovim ScrollReveal postaje stvarno aktivan — sadržaj ispod pregiba na početnoj kreće iz `opacity-0` dok ne uđe u viewport. Ako se na vizuelnoj proveri pokaže rušenje sadržaja pre hidratacije, fallback je da se `opacity-0` stanje izostavi (ostaviti samo translate), ali prvo proveriti ovako.

- [ ] **Step 9: app/layout.tsx — skip-link u ink tokenima, bez radiusa i ringa**

Jedina izmena u fajlu — metadata, skripte, provideri i struktura se NE diraju. OLD (pazi na razmak na kraju prvog reda className stringa):
```tsx
            <a
              href="#main-content"
              className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 
                     bg-primary-600 text-white px-4 py-2 rounded-md z-50
                     focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            >
```
NEW:
```tsx
            <a
              href="#main-content"
              className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-[80] bg-ink-900 px-4 py-2 text-white"
            >
```
(`z-[80]` da skip-link bude iznad headera z-50 i overlay-a z-[60]/z-[70].)

- [ ] **Step 10: Build provera**

Run: npm run build (u repou). Expected: uspesan build bez gresaka.

- [ ] **Step 11: Vizuelna provera**

Pokrenuti npm run dev i proveriti `/`, `/kategorije/lvt` i `/proizvodi` (bilo koji proizvod) na 1440px i 390px:
- Header: beo, sticky, hairline donja ivica, bez senke; wordmark „podovi" malim slovima, bold, zbijen, bez podvlake; srce sa brojem omiljenih monohromno; crno pravougaono „Pošalji upit" dugme.
- Pretraga: klik na lupu otvara panel preko cele širine vrha ekrana (desktop top-sheet sa hairline ivicom, mobilni full-screen); kucanje „hrast" daje rezultate sa hairline redovima i `paper` thumbnail podlogama; skeleton umesto spinera; Escape i klik van zatvaraju; strelice + Enter rade.
- Mobilni meni (390px): hamburger otvara full-screen beli overlay sa krupnim linkovima Omiljeni / Pošalji upit; X zatvara.
- Footer: svetao (bela pozadina, hairline gornja ivica), tekst ink-600/500, kvadratne monohromne socijalne ikonice, „Kontakt" kao etiketa.
- WhatsApp dugme zeleno, kvadratno, bez senke; BackToTop (skrol >500px) beli kvadrat sa hairline okvirom; vertikalno poravnati.
- Tab-om kroz header: globalni focus-visible outline vidljiv, skip-link crn bez radiusa.
- Početna: ScrollReveal sekcije ulaze blagim pomakom od 12px / 400ms, bez velikih skokova.

- [ ] **Step 12: Commit**

```bash
git add components/PodoviWordmark.tsx components/Header.tsx components/GlobalSearch.tsx components/BrandLogoMark.tsx components/Footer.tsx components/BackToTop.tsx components/WhatsAppButton.tsx components/ScrollReveal.tsx app/layout.tsx && git commit -m "style: galerijski monohrom za globalni okvir — header, wordmark, pretraga, footer"
```

---

### Task 3: Kartice proizvoda

**Files:**
- Modify: components/ProductCard.tsx
- Modify: components/ProductCardClient.tsx
- Modify: components/ProductCardOverlay.tsx
- Modify: components/FavoriteButton.tsx
- Modify: components/CompareButton.tsx

**Odluke (dosledne u celoj grupi):**
- "Detaljnije" link se UKLANJA; zamena je hover stanje naziva: `underline-offset-4 group-hover:underline` na nazivu proizvoda — isto u ProductCard, ProductCardClient (normal i compact rezim).
- Bedz kategorije, spec chipovi i kratak opis se uklanjaju sa kartice (pravilo 5 i 7: ispod slike samo .eyebrow brend + kolekcija (kada postoji i razlikuje se od boje) + naziv + cena). Time `categoryBadgeConfig`, `SPEC_CHIP_KEYS`, `normalizeInstallation`, `getSpecChips` i `cleanProductCardShortDescription` postaju mrtav kod u oba card fajla i brisu se zajedno sa pripadajucim importom — logika rutiranja, split naziva i izbora slika se NE menja.
- Compact rezim takodje prelazi na aspect-[4/5] bg-paper, ivica-do-ivice (umesto aspect-square + rounded-lg border); naziv u compact rezimu je text-sm (gusca mreza od 4-5 kolona), ostalo identicno pravilu 7.
- FavoriteButton/CompareButton: bele kruzne pozadine -> beli KVADRATI sa hairline okvirom (border-ink-200), monohrom (crveno srce i primary plava se uklanjaju — aktivno stanje je ink-900). Ovi dugmici se koriste i na detaljnoj strani (components/ProductActions.tsx, components/ProductColorSelector.tsx, app/omiljeni/FavoritesPageClient.tsx) — restilizacija se namerno propagira i tamo, bez izmena tih fajlova.
- Tap mete: size="sm" dugmici postaju w-11 h-11 na mobilnom (44px, pravilo 13), md:w-9 md:h-9 na desktopu.

- [ ] **Step 1: ProductCard.tsx — kompletna prepravka (server kartica)**

JSX se menja >60% (bedz, chipovi, opis, gradijent overlay, "Detaljnije" i cenovni blok se uklanjaju; slika 4/3 -> 4/5; card/card-hover klase se brisu), pa ide kompletan novi sadrzaj. NOVA VERZIJA FAJLA:

```tsx
import Link from 'next/link';
import { Product } from '@/types';
import { brandRepository } from '@/lib/repositories/brand-repository';
import ProductCardOverlay from './ProductCardOverlay';
import ProductImage from './ProductImage';
import { splitProductTitle } from '@/lib/utils/name-parser';
import {
  areProductCardTextsEqual,
  getProductCardDisplayName,
} from '@/lib/utils/product-card-text';
import { getCanonicalProductHref } from '@/lib/utils/product-routes';
import { getProductImageCandidates } from '@/lib/utils/product-images';

interface ProductCardProps {
  product: Product;
}

export default async function ProductCard({ product }: ProductCardProps) {
  const brand = await brandRepository.findById(product.brandId);
  const imageCandidates = getProductImageCandidates(product, 'card').slice(0, 4);
  const primaryImage = imageCandidates[0];
  const displayName = getProductCardDisplayName(product.name, brand?.name);
  const productHref = getCanonicalProductHref(product as Product & { collectionSlug?: string });
  const rawCollectionName = product.specs?.find(s => s.key === 'collection')?.value;
  const displayCollectionName = rawCollectionName
    ? getProductCardDisplayName(rawCollectionName, brand?.name)
    : rawCollectionName;

  // Split Name Logic
  const { collection: splitCollection, color: splitColor } = splitProductTitle(displayName, displayCollectionName);

  return (
    <Link href={productHref} className="group block h-full bg-white">
      <div className="relative aspect-[4/5] bg-paper overflow-hidden">
        {primaryImage ? (
          <ProductImage
            sources={imageCandidates}
            alt={primaryImage.alt}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            quality={90}
            className={`transition-transform duration-700 group-hover:scale-[1.03] ${product.categoryId === '5'
              ? 'object-left'
              : product.slug === 'gerflor-mipolam-technic-el5-eu'
                ? 'object-bottom'
                : ''
              }`}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-paper">
            <svg className="w-12 h-12 text-ink-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        {/* Favorite & Compare buttons */}
        <div className="opacity-100 md:opacity-0 md:group-hover:opacity-100 md:focus-within:opacity-100 transition-opacity duration-300">
          <ProductCardOverlay product={product} />
        </div>
      </div>
      <div className="pt-3 md:pt-4 flex flex-col">
        {brand && (
          <span className="eyebrow mb-1">
            {brand.name}
          </span>
        )}

        {splitCollection && !areProductCardTextsEqual(splitCollection, splitColor) && (
          <p className="text-[13px] text-ink-500 mb-0.5 leading-tight truncate">
            {splitCollection}
          </p>
        )}
        <h3 className="text-[15px] md:text-base font-normal text-ink-900 leading-snug underline-offset-4 group-hover:underline">
          {splitColor}
        </h3>

        {/* Price or "Cena na upit" */}
        <p className="mt-1 text-[13px] text-ink-500">
          {product.price && product.price > 0
            ? `${product.price.toLocaleString('sr-RS')} RSD/${product.priceUnit}`
            : 'Cena na upit'}
        </p>
      </div>
    </Link>
  );
}
```

- [ ] **Step 2: ProductCardClient.tsx — kompletna prepravka (klijentska kartica, normal + compact)**

Isti razlog (>60% JSX). NOVA VERZIJA FAJLA:

```tsx
'use client';

import Link from 'next/link';
import { Product, Brand } from '@/types';
import ProductCardOverlay from './ProductCardOverlay';
import ProductImage from './ProductImage';
import { splitProductTitle } from '@/lib/utils/name-parser';
import {
  areProductCardTextsEqual,
  getProductCardDisplayName,
} from '@/lib/utils/product-card-text';
import { getCanonicalProductHref } from '@/lib/utils/product-routes';
import { getProductImageCandidates } from '@/lib/utils/product-images';

interface ProductCardClientProps {
  product: Product;
  brand: Brand | null;
  /** Kompaktna kartica (samo slika + naziv + link) – za tab Boje na parket kategoriji */
  compact?: boolean;
}

export default function ProductCardClient({ product, brand, compact = false }: ProductCardClientProps) {
  const imageCandidates = getProductImageCandidates(product, compact ? 'thumb' : 'card').slice(0, 4);
  const primaryImage = imageCandidates[0];

  const displayName = getProductCardDisplayName(product.name, brand?.name);

  const productHref = getCanonicalProductHref(product as Product & { collectionSlug?: string });

  // Split the Product Title
  const rawCollectionName = product.specs?.find(s => s.key === 'collection')?.value;
  const displayCollectionName = rawCollectionName
    ? getProductCardDisplayName(rawCollectionName, brand?.name)
    : rawCollectionName;
  const { collection: splitCollection, color: splitColor } = splitProductTitle(displayName, displayCollectionName);

  if (compact) {
    return (
      <Link href={productHref} className="group block bg-white">
        <div className="relative aspect-[4/5] bg-paper overflow-hidden">
          {primaryImage ? (
            <ProductImage
              sources={imageCandidates}
              alt={primaryImage.alt}
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 20vw"
              quality={90}
              className="transition-transform duration-700 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-ink-500 text-sm">Bez slike</div>
          )}
          {/* Favorite & Compare buttons */}
          <div className="opacity-100 md:opacity-0 md:group-hover:opacity-100 md:focus-within:opacity-100 transition-opacity duration-300">
            <ProductCardOverlay product={product} />
          </div>
        </div>
        <div className="pt-3">
          {brand && (
            <p className="eyebrow mb-1">{brand.name}</p>
          )}
          {splitCollection && !areProductCardTextsEqual(splitCollection, splitColor) && (
            <p className="text-[12px] text-ink-500 mb-0.5 leading-tight truncate">
              {splitCollection}
            </p>
          )}
          <p className="text-sm font-normal text-ink-900 line-clamp-2 underline-offset-4 group-hover:underline">
            {splitColor}
          </p>
        </div>
      </Link>
    );
  }

  return (
    <Link href={productHref} className="group block h-full bg-white">
      <div className="relative aspect-[4/5] bg-paper overflow-hidden">
        {primaryImage ? (
          <ProductImage
            sources={imageCandidates}
            alt={primaryImage.alt}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            quality={90}
            className={`transition-transform duration-700 group-hover:scale-[1.03] ${product.categoryId === '5' ? 'object-left' :
              product.slug === 'gerflor-mipolam-technic-el5-eu' ? 'object-bottom' : ''
              }`}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-ink-500">
            <span>Bez slike</span>
          </div>
        )}
        {/* Favorite & Compare buttons */}
        <div className="opacity-100 md:opacity-0 md:group-hover:opacity-100 md:focus-within:opacity-100 transition-opacity duration-300">
          <ProductCardOverlay product={product} />
        </div>
      </div>
      <div className="pt-3 md:pt-4 flex flex-col">
        {brand && (
          <span className="eyebrow mb-1">
            {brand.name}
          </span>
        )}

        {splitCollection && !areProductCardTextsEqual(splitCollection, splitColor) && (
          <p className="text-[13px] text-ink-500 mb-0.5 leading-tight truncate">
            {splitCollection}
          </p>
        )}
        <h3 className="text-[15px] md:text-base font-normal text-ink-900 leading-snug underline-offset-4 group-hover:underline">
          {splitColor}
        </h3>

        {/* Price or "Cena na upit" */}
        <p className="mt-1 text-[13px] text-ink-500">
          {product.price && product.price > 0
            ? `${product.price.toLocaleString('sr-RS')} RSD/${product.priceUnit}`
            : 'Cena na upit'}
        </p>
      </div>
    </Link>
  );
}
```

- [ ] **Step 3: ProductCardOverlay.tsx — ukloniti senku**

OLD:
```tsx
        <div className="absolute top-3 right-3 z-10 flex flex-col gap-1.5 drop-shadow-md">
```
NEW:
```tsx
        <div className="absolute top-3 right-3 z-10 flex flex-col gap-1.5">
```

- [ ] **Step 4: FavoriteButton.tsx — beli kvadrat sa hairline okvirom, monohrom, 44px tap meta**

Izmena 4a — velicine (44px na mobilnom za sm):

OLD:
```tsx
    const sizeClasses = size === 'sm' ? 'w-8 h-8' : 'w-10 h-10';
    const iconSize = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';
```
NEW:
```tsx
    const sizeClasses = size === 'sm' ? 'w-11 h-11 md:w-9 md:h-9' : 'w-11 h-11';
    const iconSize = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';
```

Izmena 4b — dugme (PAZNJA: u originalu postoji trailing space iza `duration-200 ` — OLD mora da ga sadrzi):

OLD:
```tsx
        <button
            onClick={handleClick}
            title={active ? 'Ukloni iz omiljenih' : 'Dodaj u omiljene'}
            className={`
        inline-flex items-center justify-center rounded-full
        transition-all duration-200 
        ${sizeClasses}
        ${active
                    ? 'bg-red-50 text-red-500 hover:bg-red-100'
                    : 'bg-white/90 text-gray-400 hover:text-red-500 hover:bg-red-50 backdrop-blur-sm'
                }
      `}
        >
```
NEW:
```tsx
        <button
            onClick={handleClick}
            title={active ? 'Ukloni iz omiljenih' : 'Dodaj u omiljene'}
            aria-label={active ? 'Ukloni iz omiljenih' : 'Dodaj u omiljene'}
            aria-pressed={active}
            className={`
        inline-flex items-center justify-center bg-white border
        transition-colors duration-200
        ${sizeClasses}
        ${active
                    ? 'border-ink-900 text-ink-900'
                    : 'border-ink-200 text-ink-500 hover:border-ink-900 hover:text-ink-900'
                }
      `}
        >
```

Izmena 4c — ikona bez scale animacije (aktivno srce ostaje popunjeno preko fill="currentColor", sada ink-900 umesto crvene):

OLD:
```tsx
            <svg
                className={`${iconSize} transition-transform duration-200 ${active ? 'scale-110' : 'hover:scale-110'}`}
```
NEW:
```tsx
            <svg
                className={iconSize}
```

- [ ] **Step 5: CompareButton.tsx — kvadrat sa hairline okvirom, monohrom, 44px tap meta**

Izmena 5a — velicine:

OLD:
```tsx
    const sizeClasses = size === 'sm'
        ? 'w-8 h-8 text-xs'
        : 'px-3 py-1.5 text-sm';
```
NEW:
```tsx
    const sizeClasses = size === 'sm'
        ? 'w-11 h-11 md:w-9 md:h-9 text-xs'
        : 'px-4 py-2.5 min-h-[44px] text-[13px]';
```

Izmena 5b — dugme:

OLD:
```tsx
        <button
            onClick={handleClick}
            disabled={!active && isFull}
            title={active ? 'Ukloni iz poređenja' : isFull ? 'Maksimalno 3 proizvoda' : 'Uporedi'}
            className={`
        inline-flex items-center justify-center gap-1 rounded-full font-medium
        transition-all duration-200 border
        ${sizeClasses}
        ${active
                    ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
                    : isFull
                        ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                        : 'bg-white/90 text-gray-700 border-gray-300 hover:bg-primary-50 hover:border-primary-400 hover:text-primary-700 backdrop-blur-sm'
                }
      `}
        >
```
NEW:
```tsx
        <button
            onClick={handleClick}
            disabled={!active && isFull}
            title={active ? 'Ukloni iz poređenja' : isFull ? 'Maksimalno 3 proizvoda' : 'Uporedi'}
            aria-label={active ? 'Ukloni iz poređenja' : isFull ? 'Maksimalno 3 proizvoda' : 'Uporedi'}
            aria-pressed={active}
            className={`
        inline-flex items-center justify-center gap-1 font-medium
        transition-colors duration-200 border
        ${sizeClasses}
        ${active
                    ? 'bg-ink-900 text-white border-ink-900'
                    : isFull
                        ? 'bg-white text-ink-400 border-ink-200 cursor-not-allowed'
                        : 'bg-white text-ink-500 border-ink-200 hover:border-ink-900 hover:text-ink-900'
                }
      `}
        >
```

- [ ] **Step 6: Build provera**

Run: npm run build (u repou). Expected: uspesan build bez gresaka.

- [ ] **Step 7: Vizuelna provera**

Pokrenuti npm run dev i proveriti na 1440px i 390px:
- / (HomeProductTabs sa ProductCardClient): slika 4/5 na bg-paper bez okvira/radijusa/senki, eyebrow brend, naziv font-normal sa underline na hover, cena 13px ink-500, nema bedzeva ni spec chipova ni "Detaljnije" strelice.
- /kategorije/laminat (ProductCard, server): isto kao gore; hover na kartici uvecava sliku (scale 1.03, 700ms) bez gradijent overlay-a.
- /kategorije/parket, tab "Boje" (compact rezim): kompaktna kartica 4/5 bez rounded/border, eyebrow brend, naziv text-sm.
- Srce/uporedi ikonice: na 1440px nevidljive dok se ne hoveruje kartica (i vidljive na keyboard fokus), na 390px uvek vidljive; beli kvadrati sa border-ink-200, 44x44px na mobilnom; aktivno srce popunjeno crno (ne crveno), aktivno poredjenje crna pozadina (ne roza).
- Stranica proizvoda (npr. bilo koji /proizvod/... link sa kartice): ProductActions koristi size="md" dugmice — proveriti da restilizovani izgled (kvadrat, hairline, min 44px) ne lomi raspored; RelatedProducts kartice nove.
- /omiljeni: FavoriteButton u listi radi i izgleda monohromno.

- [ ] **Step 8: Commit**

```bash
git add components/ProductCard.tsx components/ProductCardClient.tsx components/ProductCardOverlay.tsx components/FavoriteButton.tsx components/CompareButton.tsx && git commit -m "style: kartice proizvoda u monohromni galerijski jezik (4/5 slika, eyebrow brend, bez bedzeva/senki/radijusa)"
```

---

### Task 4: Pocetna i stranice kategorija

**Files:**
- Modify: components/HomeProductTabs.tsx
- Modify: app/page.tsx
- Modify: app/kategorije/[slug]/page.tsx
- Modify: components/CategoryTabs.tsx
- Modify: components/ProductFilters.tsx
- Modify: components/Breadcrumbs.tsx

Napomena: zavisi od Task 1 (tokeni `ink-*`, `paper`, `tracking-label` i helperi `.eyebrow`, `.label`, `.input`, `.btn-primary`, `.btn-secondary`, `.btn-inverse`, `.btn-link` u tailwind.config.ts / globals.css). Logika, propsi, URL parametri, data flow i SEO strukturirani podaci se NE menjaju.

- [ ] **Step 1: HomeProductTabs.tsx — veliki tabovi font-normal sa underline indikatorom, hairline linije, monohromna meta traka**

Izmena 1 — klasa tab dugmadi (font-semibold -> font-normal, dodat underline indikator):

OLD:
```tsx
  const canOpenCategoryPage = Boolean(activeGroup);
  const categoryButtonClass = 'shrink-0 text-[1.65rem] font-semibold leading-none tracking-normal transition-colors sm:text-[2rem] md:text-[2.35rem] lg:text-[2.65rem]';
```
NEW:
```tsx
  const canOpenCategoryPage = Boolean(activeGroup);
  const categoryButtonClass = 'shrink-0 border-b-2 pb-2 text-[1.65rem] font-normal leading-none tracking-normal transition-colors sm:text-[2rem] md:text-[2.35rem] lg:text-[2.65rem]';
```

Izmena 2 — wrapper tabova i dugme "Sve" (hex boje -> ink tokeni, aktivan tab podvucen):

OLD:
```tsx
        <div className="overflow-hidden border-b border-[#1D1D1F]">
          <div className="no-scrollbar -mx-6 flex gap-3 overflow-x-auto px-6 pb-4 pt-6 sm:gap-4 md:pt-8 lg:gap-5">
            <button
              type="button"
              onClick={() => setActiveSlug('sve')}
              aria-pressed={activeSlug === 'sve'}
              className={`${categoryButtonClass} ${
                activeSlug === 'sve' ? 'text-[#050505]' : 'text-[#A8A8A8] hover:text-[#555555]'
              }`}
            >
              Sve
            </button>
```
NEW:
```tsx
        <div className="overflow-hidden border-b border-ink-200">
          <div className="no-scrollbar -mx-6 flex gap-4 overflow-x-auto px-6 pb-4 pt-6 sm:gap-5 md:pt-8 lg:gap-6">
            <button
              type="button"
              onClick={() => setActiveSlug('sve')}
              aria-pressed={activeSlug === 'sve'}
              className={`${categoryButtonClass} ${
                activeSlug === 'sve' ? 'border-ink-900 text-ink-900' : 'border-transparent text-ink-400 hover:text-ink-600'
              }`}
            >
              Sve
            </button>
```

Izmena 3 — dugmad kategorija u mapi:

OLD:
```tsx
                  className={`${categoryButtonClass} ${
                    active ? 'text-[#050505]' : 'text-[#A8A8A8] hover:text-[#555555]'
                  }`}
```
NEW:
```tsx
                  className={`${categoryButtonClass} ${
                    active ? 'border-ink-900 text-ink-900' : 'border-transparent text-ink-400 hover:text-ink-600'
                  }`}
```

Izmena 4 — meta traka ispod tabova (eyebrow umesto bold uppercase, "Pogledaj sve" kao .btn-link bez strelice i bez primary boje):

OLD:
```tsx
        <div className="flex flex-col gap-3 border-b border-[#1D1D1F] py-5 text-[13px] font-semibold uppercase tracking-normal text-[#1D1D1F] sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span>{activeName}</span>
            <span className="text-[#8A8A8A]">
              {activeProducts.length} prikazano{activeTotal > activeProducts.length ? ` od ${activeTotal}` : ''}
            </span>
          </div>
          {canOpenCategoryPage && activeGroup ? (
            <Link
              href={`/kategorije/${activeGroup.category.slug}`}
              className="inline-flex w-fit items-center text-[#1D1D1F] transition-colors hover:text-primary-600"
            >
              Pogledaj sve
              <svg className="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          ) : null}
        </div>
```
NEW:
```tsx
        <div className="flex flex-col gap-3 border-b border-ink-200 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="eyebrow">{activeName}</span>
            <span className="eyebrow">
              {activeProducts.length} prikazano{activeTotal > activeProducts.length ? ` od ${activeTotal}` : ''}
            </span>
          </div>
          {canOpenCategoryPage && activeGroup ? (
            <Link
              href={`/kategorije/${activeGroup.category.slug}`}
              className="btn-link inline-flex w-fit items-center"
            >
              Pogledaj sve →
            </Link>
          ) : null}
        </div>
```

Izmena 5 — mreza proizvoda (galerijska mreza 2/3/4 kolone, vise vertikalne beline):

OLD:
```tsx
        {activeProducts.length > 0 ? (
          <div className="grid grid-cols-1 gap-5 py-6 sm:grid-cols-2 lg:grid-cols-3">
```
NEW:
```tsx
        {activeProducts.length > 0 ? (
          <div className="grid grid-cols-2 gap-x-5 gap-y-10 py-8 md:grid-cols-3 xl:grid-cols-4">
```

Izmena 6 — prazno stanje:

OLD:
```tsx
          <div className="py-16 text-center">
            <p className="text-base font-medium text-[#1D1D1F]">Trenutno nema proizvoda za ovu kategoriju.</p>
          </div>
```
NEW:
```tsx
          <div className="py-16 text-center">
            <p className="text-base font-normal text-ink-600">Trenutno nema proizvoda za ovu kategoriju.</p>
          </div>
```

- [ ] **Step 2: app/page.tsx — "Zasto izabrati nas" sa hairline vertikalama i velikim svetlim brojevima; crni CTA blok sa .btn-inverse**

Izmena 1 — sekcija "Zasto izabrati nas" (uklanjaju se ikonice, hover sive kutije, font-semibold; tri kolone razdvojene hairline vertikalama, brojevi 01/02/03 veliki i svetli; ScrollReveal ostaje):

OLD:
```tsx
      {/* Why Choose Us */}
      <section className="border-y border-[#1D1D1F]/10 bg-white py-20 md:py-24">
        <div className="container">
          <div className="mb-12 md:mb-16">
            <h2 className="text-center text-4xl font-semibold tracking-tight text-[#111111] md:text-6xl">
              Zašto izabrati nas?
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-px overflow-hidden border-y border-[#1D1D1F]/10 bg-[#1D1D1F]/10 md:grid-cols-3">
            <ScrollReveal>
              <div className="group bg-white p-8 transition-colors duration-300 hover:bg-[#F5F5F7] md:min-h-[280px]">
                <div className="mb-10 flex items-center justify-between">
                  <span className="text-sm font-medium text-[#A1A1A6]">01</span>
                  <svg className="h-6 w-6 text-[#111111]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="mb-4 text-2xl font-semibold tracking-tight text-[#111111]">Proveren kvalitet</h3>
                <p className="leading-7 text-[#6E6E73]">
                  Radimo samo sa renomiranim evropskim proizvođačima sa dugogodišnjom tradicijom.
                </p>
              </div>
            </ScrollReveal>
            <ScrollReveal delay={100}>
              <div className="group bg-white p-8 transition-colors duration-300 hover:bg-[#F5F5F7] md:min-h-[280px]">
                <div className="mb-10 flex items-center justify-between">
                  <span className="text-sm font-medium text-[#A1A1A6]">02</span>
                  <svg className="h-6 w-6 text-[#111111]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="mb-4 text-2xl font-semibold tracking-tight text-[#111111]">Konkurentne cene</h3>
                <p className="leading-7 text-[#6E6E73]">
                  Najbolji odnos cene i kvaliteta zahvaljujući direktnoj saradnji sa proizvođačima.
                </p>
              </div>
            </ScrollReveal>
            <ScrollReveal delay={200}>
              <div className="group bg-white p-8 transition-colors duration-300 hover:bg-[#F5F5F7] md:min-h-[280px]">
                <div className="mb-10 flex items-center justify-between">
                  <span className="text-sm font-medium text-[#A1A1A6]">03</span>
                  <svg className="h-6 w-6 text-[#111111]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <h3 className="mb-4 text-2xl font-semibold tracking-tight text-[#111111]">Stručna podrška</h3>
                <p className="leading-7 text-[#6E6E73]">
                  Naš tim stručnjaka će vam pomoći da izaberete idealno rešenje za vaš prostor.
                </p>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>
```
NEW:
```tsx
      {/* Why Choose Us */}
      <section className="border-y border-ink-200 bg-white py-20 md:py-24">
        <div className="container">
          <div className="mb-12 md:mb-16">
            <h2 className="text-center text-3xl font-normal tracking-tight text-ink-900 md:text-5xl">
              Zašto izabrati nas?
            </h2>
          </div>

          <div className="grid grid-cols-1 divide-y divide-ink-200 md:grid-cols-3 md:divide-x md:divide-y-0">
            <ScrollReveal className="py-10 md:py-2 md:pr-10">
              <div className="md:min-h-[240px]">
                <span className="block text-[34px] font-normal leading-none text-ink-200">01</span>
                <h3 className="mb-3 mt-8 text-xl font-medium tracking-tight text-ink-900">Proveren kvalitet</h3>
                <p className="text-[15px] leading-7 text-ink-600">
                  Radimo samo sa renomiranim evropskim proizvođačima sa dugogodišnjom tradicijom.
                </p>
              </div>
            </ScrollReveal>
            <ScrollReveal delay={100} className="py-10 md:px-10 md:py-2">
              <div className="md:min-h-[240px]">
                <span className="block text-[34px] font-normal leading-none text-ink-200">02</span>
                <h3 className="mb-3 mt-8 text-xl font-medium tracking-tight text-ink-900">Konkurentne cene</h3>
                <p className="text-[15px] leading-7 text-ink-600">
                  Najbolji odnos cene i kvaliteta zahvaljujući direktnoj saradnji sa proizvođačima.
                </p>
              </div>
            </ScrollReveal>
            <ScrollReveal delay={200} className="py-10 md:py-2 md:pl-10">
              <div className="md:min-h-[240px]">
                <span className="block text-[34px] font-normal leading-none text-ink-200">03</span>
                <h3 className="mb-3 mt-8 text-xl font-medium tracking-tight text-ink-900">Stručna podrška</h3>
                <p className="text-[15px] leading-7 text-ink-600">
                  Naš tim stručnjaka će vam pomoći da izaberete idealno rešenje za vaš prostor.
                </p>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>
```

Napomena: `ScrollReveal` prima `className` prop (renderuje div), pa `md:divide-x` radi izmedju ScrollReveal wrappera, a padding ide na njih.

Izmena 2 — zavrsni CTA blok (ostaje crn `bg-ink-900`, dugme postaje `.btn-inverse`, bez rounded-full, bez focus:ring klasa, naslov font-normal):

OLD:
```tsx
      {/* CTA Section */}
      <section className="bg-[#111111] py-20 text-white md:py-24">
        <ScrollReveal>
          <div className="container">
            <div className="mx-auto max-w-5xl text-center">
              <p className="mb-5 text-sm font-medium uppercase tracking-[0.22em] text-white/45">Upit za ponudu</p>
              <h2 className="text-4xl font-semibold tracking-tight text-white md:text-6xl">
                Spremni da transformišete vaš prostor?
              </h2>
              <p className="mx-auto mt-8 max-w-3xl text-lg leading-8 text-white/65 md:text-xl">
              Pošaljite nam upit i naš stručni tim će vam se javiti u najkraćem roku sa personalizovanom ponudom.
              </p>
              <Link href="/upiti" className="mt-10 inline-flex items-center justify-center gap-3 rounded-full bg-white px-8 py-4 text-base font-semibold text-[#111111] transition-all duration-300 hover:bg-[#E8E8ED] focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[#111111]">
                Pošalji upit
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
            </div>
          </div>
        </ScrollReveal>
      </section>
```
NEW:
```tsx
      {/* CTA Section */}
      <section className="bg-ink-900 py-20 text-white md:py-24">
        <ScrollReveal>
          <div className="container">
            <div className="mx-auto max-w-5xl text-center">
              <p className="mb-5 text-[11px] uppercase tracking-label text-white/60">Upit za ponudu</p>
              <h2 className="text-3xl font-normal tracking-tight text-white md:text-5xl">
                Spremni da transformišete vaš prostor?
              </h2>
              <p className="mx-auto mt-8 max-w-3xl text-lg leading-8 text-white/65">
              Pošaljite nam upit i naš stručni tim će vam se javiti u najkraćem roku sa personalizovanom ponudom.
              </p>
              <Link href="/upiti" className="btn-inverse mt-10 inline-flex items-center justify-center">
                Pošalji upit
              </Link>
            </div>
          </div>
        </ScrollReveal>
      </section>
```

- [ ] **Step 3: components/ProductFilters.tsx — NOVA VERZIJA FAJLA: hairline traka (brend cipovi + dugme "Filteri") i fioka zdesna**

STRUKTURNA IZMENA: komponenta vise ne renderuje sticky bocni panel. Sada renderuje (a) hairline traku — levo brend cipovi (tekstualni, aktivan podvucen, toggle-uju isti `selectedBrands` state), desno dugme "Filteri" — i (b) fioku zdesna (`fixed inset-y-0 right-0 w-full max-w-md bg-white border-l border-ink-200`, overlay `bg-black/20`, bez radiusa) u kojoj zivi SAV postojeci sadrzaj filtera. Svi hookovi, state, URL sync, auto-apply efekat, toggleri i `clearFilters` ostaju DOSLOVNO isti; dodaju se samo `isDrawerOpen` state, Escape/scroll-lock efekat i `activeFilterCount` (cisto prezentaciono). Propsi nepromenjeni.

NOVA VERZIJA FAJLA:
```tsx
"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Brand, ProductFilters as IProductFilters } from '@/types';
import {
  getCategoryDefaultListingMode,
  hasCategoryAccessoryListingMode,
  resolveCategoryListingMode,
  type CategoryListingMode,
} from '@/lib/catalog/listing-curation';

interface ProductFiltersProps {
  availableBrands: Brand[];
  currentFilters: IProductFilters;
  availableCollections?: string[]; // For LVT collection filter
  availableFamilies?: string[]; // For BLOQ family filter
  availableWoodTypes?: { value: string; count: number }[]; // For Parket: Hrast / Jasen
  availableThickness?: string[]; // For LVT overall thickness filter
  availableThicknessByType?: { homogeni: string[]; heterogeni: string[] }; // For Vinil thickness by type
  availableToolGroups?: { value: string; slug: string; count: number }[]; // For Alat: Romus tool groups
  availableToolSubcategories?: { value: string; slug: string; group: string; groupSlug: string; count: number }[]; // For Alat: Romus tool subcategories
}

export default function ProductFilters({ availableBrands, currentFilters, availableCollections, availableFamilies, availableWoodTypes, availableThickness, availableThicknessByType, availableToolGroups, availableToolSubcategories }: ProductFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchParamsString = searchParams.toString();
  const categorySlug = pathname?.split('/').filter(Boolean).pop() || '';
  const supportsListingMode = hasCategoryAccessoryListingMode(categorySlug);
  const defaultListingMode = getCategoryDefaultListingMode(categorySlug);

  const isVinilCategory = pathname?.includes('/kategorije/vinil');
  const isLVTCategory = pathname?.includes('/kategorije/lvt') || pathname?.includes('/kategorije/parket');
  const isParketCategory = pathname?.includes('/kategorije/parket');
  const isLinoleumCategory = pathname?.includes('/kategorije/linoleum');
  const isLaminatCategory = pathname?.includes('/kategorije/laminat');
  const isToolCategory = pathname?.includes('/kategorije/alat');
  const currentType = searchParams.get('type');
  const currentCollections = searchParams.get('collections');
  const currentFamily = searchParams.get('family');
  const currentListing = searchParams.get('listing');
  const currentThickness = searchParams.get('thickness');
  const currentWoodTypes = searchParams.get('woodType')?.split(',').filter(Boolean) || [];
  const currentToolGroups = searchParams.get('toolGroup')?.split(',').filter(Boolean) || [];
  const currentToolSubcategories = searchParams.get('toolSubcategory')?.split(',').filter(Boolean) || [];

  const [search, setSearch] = useState(currentFilters.search || '');
  const [selectedBrands, setSelectedBrands] = useState<string[]>(currentFilters.brandIds || []);
  const [priceMin, setPriceMin] = useState(currentFilters.priceMin?.toString() || '');
  const [priceMax, setPriceMax] = useState(currentFilters.priceMax?.toString() || '');
  const [vinylType, setVinylType] = useState<'homogeni' | 'heterogeni' | null>(
    currentType === 'homogeni' ? 'homogeni' : currentType === 'heterogeni' ? 'heterogeni' : null
  );
  const [selectedCollections, setSelectedCollections] = useState<string[]>(
    currentCollections ? currentCollections.split(',') : []
  );
  const [selectedFamilies, setSelectedFamilies] = useState<string[]>(
    currentFamily ? currentFamily.split(',') : []
  );
  const [selectedListingMode, setSelectedListingMode] = useState<CategoryListingMode>(
    resolveCategoryListingMode(currentListing || currentFilters.listing, categorySlug)
  );
  const [selectedThickness, setSelectedThickness] = useState<string[]>(
    currentThickness ? currentThickness.split(',') : []
  );
  const [selectedWoodTypes, setSelectedWoodTypes] = useState<string[]>(currentWoodTypes);
  const [selectedToolGroups, setSelectedToolGroups] = useState<string[]>(currentToolGroups);
  const [selectedToolSubcategories, setSelectedToolSubcategories] = useState<string[]>(currentToolSubcategories);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Sync state with URL params when they change externally (e.g., browser back/forward)
  // This ensures state stays in sync with URL, but we skip updates that would cause loops
  const isSyncingRef = useRef(false);

  useEffect(() => {
    // Sync only when the URL changes externally. Local state changes are pushed by
    // the auto-apply effect below and must not be immediately overwritten here.
    if (isSyncingRef.current) return;

    const urlSearch = searchParams.get('search') || '';
    const urlBrands = searchParams.get('brands')?.split(',').filter(Boolean) || [];
    const urlPriceMin = searchParams.get('priceMin') || '';
    const urlPriceMax = searchParams.get('priceMax') || '';
    const urlType = searchParams.get('type');
    const urlCollections = searchParams.get('collections')?.split(',').filter(Boolean) || [];
    const urlFamily = searchParams.get('family')?.split(',').filter(Boolean) || [];
    const urlListingMode = resolveCategoryListingMode(searchParams.get('listing'), categorySlug);
    const urlThickness = searchParams.get('thickness')?.split(',').filter(Boolean) || [];
    const urlWoodType = searchParams.get('woodType');
    const urlToolGroups = searchParams.get('toolGroup')?.split(',').filter(Boolean) || [];
    const urlToolSubcategories = searchParams.get('toolSubcategory')?.split(',').filter(Boolean) || [];

    setSearch(urlSearch);
    setSelectedBrands(urlBrands);
    setPriceMin(urlPriceMin);
    setPriceMax(urlPriceMax);
    if (isVinilCategory) {
      const newType = urlType === 'homogeni' ? 'homogeni' : urlType === 'heterogeni' ? 'heterogeni' : null;
      setVinylType(newType);
    }
    if (isLVTCategory) {
      setSelectedCollections(urlCollections);
    }
    if (pathname?.includes('/kategorije/tekstilne-ploce')) {
      setSelectedFamilies(urlFamily);
    }
    if (supportsListingMode) {
      setSelectedListingMode(urlListingMode);
    }
    if (isLVTCategory || isVinilCategory || isLinoleumCategory || isLaminatCategory) {
      setSelectedThickness(urlThickness);
    }
    if (isParketCategory) {
      setSelectedWoodTypes(urlWoodType?.split(',').filter(Boolean) || []);
    }
    if (isToolCategory) {
      setSelectedToolGroups(urlToolGroups);
      setSelectedToolSubcategories(urlToolSubcategories);
    }
  }, [searchParams, searchParamsString, categorySlug, supportsListingMode, isVinilCategory, isLVTCategory, pathname, isLinoleumCategory, isLaminatCategory, isParketCategory, isToolCategory]);

  // Auto-remove incompatible thicknesses when vinyl type changes
  useEffect(() => {
    if (isVinilCategory && availableThicknessByType && vinylType && selectedThickness.length > 0) {
      const availableForType = vinylType === 'homogeni'
        ? availableThicknessByType.homogeni
        : vinylType === 'heterogeni'
          ? availableThicknessByType.heterogeni
          : [];

      const validThicknesses = selectedThickness.filter(t => availableForType.includes(t));
      if (validThicknesses.length !== selectedThickness.length) {
        setSelectedThickness(validThicknesses);
      }
    }
  }, [vinylType, isVinilCategory, availableThicknessByType, selectedThickness]);

  useEffect(() => {
    if (!isToolCategory || !availableToolSubcategories || selectedToolSubcategories.length === 0) {
      return;
    }

    const availableSubcategorySlugs = new Set(availableToolSubcategories.map((option) => option.slug));
    const validSubcategories = selectedToolSubcategories.filter((slug) => availableSubcategorySlugs.has(slug));
    if (validSubcategories.length !== selectedToolSubcategories.length) {
      setSelectedToolSubcategories(validSubcategories);
    }
  }, [isToolCategory, availableToolSubcategories, selectedToolSubcategories]);

  // Zakljucaj scroll pozadine i zatvori fioku na Escape dok je otvorena
  useEffect(() => {
    if (!isDrawerOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsDrawerOpen(false);
      }
    };

    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [isDrawerOpen]);

  // Auto-apply filters when values change (with debounce for search)
  const isInitialMount = useRef(true);

  useEffect(() => {
    // Skip auto-apply on initial mount
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    // Mark that we're syncing to prevent URL sync from triggering
    isSyncingRef.current = true;

    const params = new URLSearchParams(searchParams);

    // Clear only filter params we control, keep other params (like 'color' for LVT tabs)
    params.delete('search');
    params.delete('brands');
    params.delete('priceMin');
    params.delete('priceMax');
    params.delete('type');
    params.delete('collections');
    params.delete('family');
    params.delete('listing');
    params.delete('thickness');
    params.delete('woodType');
    params.delete('toolGroup');
    params.delete('toolSubcategory');

    // Add new filter params based on current state - ALL filters are preserved
    if (search) params.set('search', search);
    if (selectedBrands.length > 0) params.set('brands', selectedBrands.join(','));
    if (priceMin) params.set('priceMin', priceMin);
    if (priceMax) params.set('priceMax', priceMax);
    if (isVinilCategory && vinylType) params.set('type', vinylType);
    if (pathname?.includes('/kategorije/lvt') && selectedCollections.length > 0) params.set('collections', selectedCollections.join(','));
    if (pathname?.includes('/kategorije/tekstilne-ploce') && selectedFamilies.length > 0) params.set('family', selectedFamilies.join(','));
    if (supportsListingMode && selectedListingMode !== defaultListingMode) params.set('listing', selectedListingMode);
    if ((isLVTCategory || isVinilCategory || isLinoleumCategory || isLaminatCategory) && selectedThickness.length > 0) params.set('thickness', selectedThickness.join(','));
    if (isParketCategory && selectedWoodTypes.length > 0) params.set('woodType', selectedWoodTypes.join(','));
    if (isToolCategory && selectedToolGroups.length > 0) params.set('toolGroup', selectedToolGroups.join(','));
    if (isToolCategory && selectedToolSubcategories.length > 0) params.set('toolSubcategory', selectedToolSubcategories.join(','));

    // Debounce for search input (500ms), immediate for other filters
    const delay = search ? 500 : 0;

    const timeoutId = setTimeout(() => {
      router.push(`${pathname}?${params.toString()}`);
      // Reset sync flag after navigation
      setTimeout(() => {
        isSyncingRef.current = false;
      }, 100);
    }, delay);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [search, selectedBrands, priceMin, priceMax, vinylType, selectedCollections, selectedFamilies, selectedListingMode, selectedThickness, selectedWoodTypes, selectedToolGroups, selectedToolSubcategories, pathname, router, searchParams, supportsListingMode, defaultListingMode, isVinilCategory, isLVTCategory, isLinoleumCategory, isLaminatCategory, isParketCategory, isToolCategory]);

  const clearFilters = () => {
    setSearch('');
    setSelectedBrands([]);
    setPriceMin('');
    setPriceMax('');
    setVinylType(null);
    setSelectedCollections([]);
    setSelectedFamilies([]);
    setSelectedListingMode(defaultListingMode);
    setSelectedThickness([]);
    setSelectedWoodTypes([]);
    setSelectedToolGroups([]);
    setSelectedToolSubcategories([]);
    router.push(pathname);
  };

  const toggleBrand = (brandId: string) => {
    setSelectedBrands(prev =>
      prev.includes(brandId)
        ? prev.filter(id => id !== brandId)
        : [...prev, brandId]
    );
  };

  const toggleCollection = (collection: string) => {
    setSelectedCollections(prev =>
      prev.includes(collection)
        ? prev.filter(c => c !== collection)
        : [...prev, collection]
    );
  };

  const toggleFamily = (family: string) => {
    setSelectedFamilies(prev =>
      prev.includes(family)
        ? prev.filter(c => c !== family)
        : [...prev, family]
    );
  };

  const toggleThickness = (thickness: string) => {
    setSelectedThickness(prev =>
      prev.includes(thickness)
        ? prev.filter(t => t !== thickness)
        : [...prev, thickness]
    );
  };

  const toggleWoodType = (value: string) => {
    setSelectedWoodTypes(prev =>
      prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]
    );
  };

  const toggleToolGroup = (slug: string) => {
    setSelectedToolGroups(prev =>
      prev.includes(slug) ? prev.filter(value => value !== slug) : [...prev, slug]
    );
  };

  const toggleToolSubcategory = (slug: string) => {
    setSelectedToolSubcategories(prev =>
      prev.includes(slug) ? prev.filter(value => value !== slug) : [...prev, slug]
    );
  };

  const hasActiveFilters =
    Boolean(search || selectedBrands.length > 0 || priceMin || priceMax) ||
    Boolean(isVinilCategory && vinylType) ||
    Boolean(pathname?.includes('/kategorije/lvt') && selectedCollections.length > 0) ||
    Boolean(pathname?.includes('/kategorije/tekstilne-ploce') && selectedFamilies.length > 0) ||
    Boolean(supportsListingMode && selectedListingMode !== defaultListingMode) ||
    Boolean(isParketCategory && selectedWoodTypes.length > 0) ||
    Boolean((isLVTCategory || isVinilCategory || isLinoleumCategory || isLaminatCategory) && selectedThickness.length > 0) ||
    Boolean(isToolCategory && (selectedToolGroups.length > 0 || selectedToolSubcategories.length > 0));
  const priceUnitLabel = isToolCategory ? 'Cena (RSD/kom)' : 'Cena (RSD/m²)';

  const activeFilterCount =
    (search ? 1 : 0) +
    selectedBrands.length +
    (priceMin || priceMax ? 1 : 0) +
    (isVinilCategory && vinylType ? 1 : 0) +
    (pathname?.includes('/kategorije/lvt') ? selectedCollections.length : 0) +
    (pathname?.includes('/kategorije/tekstilne-ploce') ? selectedFamilies.length : 0) +
    (supportsListingMode && selectedListingMode !== defaultListingMode ? 1 : 0) +
    ((isLVTCategory || isVinilCategory || isLinoleumCategory || isLaminatCategory) ? selectedThickness.length : 0) +
    (isParketCategory ? selectedWoodTypes.length : 0) +
    (isToolCategory ? selectedToolGroups.length + selectedToolSubcategories.length : 0);

  return (
    <>
      {/* Hairline traka: levo brend cipovi, desno dugme Filteri */}
      <div className="flex items-center justify-between gap-4 border-b border-ink-200">
        <div className="no-scrollbar -mx-1 flex flex-1 items-center gap-5 overflow-x-auto px-1">
          {availableBrands.map((brand) => {
            const active = selectedBrands.includes(brand.id);
            return (
              <button
                key={brand.id}
                type="button"
                onClick={() => toggleBrand(brand.id)}
                aria-pressed={active}
                className={`min-h-[44px] shrink-0 border-b-2 text-[13px] transition-colors ${
                  active
                    ? 'border-ink-900 text-ink-900'
                    : 'border-transparent text-ink-500 hover:text-ink-900'
                }`}
              >
                {brand.name}
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={() => setIsDrawerOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={isDrawerOpen}
          className="inline-flex min-h-[44px] shrink-0 items-center gap-2 text-[13px] text-ink-900 transition-opacity hover:opacity-60"
        >
          Filteri{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
          </svg>
        </button>
      </div>

      {/* Overlay */}
      {isDrawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20"
          aria-hidden="true"
          onClick={() => setIsDrawerOpen(false)}
        />
      )}

      {/* Fioka filtera zdesna */}
      {isDrawerOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Filteri"
          className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-ink-200 bg-white"
        >
          <div className="flex items-center justify-between border-b border-ink-200 px-6 py-4">
            <h2 className="eyebrow">Filteri</h2>
            <button
              type="button"
              onClick={() => setIsDrawerOpen(false)}
              aria-label="Zatvori filtere"
              className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center text-ink-900 transition-opacity hover:opacity-60"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-6">
            {/* Search */}
            <div className="mb-8">
              <p className="label mb-3">Pretraga</p>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Pretraži proizvode..."
                className="input text-sm"
              />
            </div>

            {/* Brands */}
            {availableBrands.length > 0 && (
              <div className="mb-8">
                <p className="label mb-3">Brendovi</p>
                <div className="space-y-2">
                  {availableBrands.map((brand) => (
                    <label key={brand.id} className="flex cursor-pointer items-center">
                      <input
                        type="checkbox"
                        checked={selectedBrands.includes(brand.id)}
                        onChange={() => toggleBrand(brand.id)}
                        className="h-4 w-4 border-ink-400 text-ink-900"
                      />
                      <span className="ml-2.5 text-sm text-ink-700">{brand.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Price Range */}
            <div className="mb-8">
              <p className="label mb-3">{priceUnitLabel}</p>
              <div className="flex gap-4">
                <input
                  type="number"
                  value={priceMin}
                  onChange={(e) => setPriceMin(e.target.value)}
                  placeholder="Od"
                  className="input text-sm"
                />
                <input
                  type="number"
                  value={priceMax}
                  onChange={(e) => setPriceMax(e.target.value)}
                  placeholder="Do"
                  className="input text-sm"
                />
              </div>
            </div>

            {/* Romus Tool Group Filter (samo Alat) */}
            {isToolCategory && availableToolGroups && availableToolGroups.length > 0 && (
              <div className="mb-8">
                <p className="label mb-3">Grupa alata</p>
                <div className="space-y-2">
                  {availableToolGroups.map((option) => (
                    <label key={option.slug} className="flex cursor-pointer items-start">
                      <input
                        type="checkbox"
                        checked={selectedToolGroups.includes(option.slug)}
                        onChange={() => toggleToolGroup(option.slug)}
                        className="mt-0.5 h-4 w-4 border-ink-400 text-ink-900"
                      />
                      <span className="ml-2.5 text-sm leading-5 text-ink-700">
                        {option.value} <span className="text-ink-500">({option.count})</span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Romus Tool Subcategory Filter (samo Alat) */}
            {isToolCategory && availableToolSubcategories && availableToolSubcategories.length > 0 && (
              <div className="mb-8">
                <p className="label mb-3">Podgrupa</p>
                <div className="space-y-2">
                  {availableToolSubcategories.map((option) => (
                    <label key={`${option.groupSlug}-${option.slug}`} className="flex cursor-pointer items-start">
                      <input
                        type="checkbox"
                        checked={selectedToolSubcategories.includes(option.slug)}
                        onChange={() => toggleToolSubcategory(option.slug)}
                        className="mt-0.5 h-4 w-4 border-ink-400 text-ink-900"
                      />
                      <span className="ml-2.5 text-sm leading-5 text-ink-700">
                        {option.value} <span className="text-ink-500">({option.count})</span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Collections Filter (samo LVT – ne Parket) */}
            {pathname?.includes('/kategorije/lvt') && availableCollections && availableCollections.length > 0 && (
              <div className="mb-8">
                <p className="label mb-3">Kolekcije</p>
                <div className="space-y-2">
                  {availableCollections.map((collection) => (
                    <label key={collection} className="flex cursor-pointer items-center">
                      <input
                        type="checkbox"
                        checked={selectedCollections.includes(collection)}
                        onChange={() => toggleCollection(collection)}
                        className="h-4 w-4 border-ink-400 text-ink-900"
                      />
                      <span className="ml-2.5 text-sm text-ink-700">{collection}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* BLOQ Family Filter (samo Tekstilne ploče) */}
            {pathname?.includes('/kategorije/tekstilne-ploce') && availableFamilies && availableFamilies.length > 0 && (
              <div className="mb-8">
                <p className="label mb-3">Familija</p>
                <div className="space-y-2">
                  {availableFamilies.map((family) => (
                    <label key={family} className="flex cursor-pointer items-center">
                      <input
                        type="checkbox"
                        checked={selectedFamilies.includes(family)}
                        onChange={() => toggleFamily(family)}
                        className="h-4 w-4 border-ink-400 text-ink-900"
                      />
                      <span className="ml-2.5 text-sm text-ink-700">{family}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Listing Segment Filter (core / prateći asortiman) */}
            {supportsListingMode && (
              <div className="mb-8">
                <p className="label mb-3">Prikaz asortimana</p>
                <div className="space-y-2">
                  <label className="flex cursor-pointer items-center">
                    <input
                      type="radio"
                      name="listingMode"
                      checked={selectedListingMode === 'core'}
                      onChange={() => setSelectedListingMode('core')}
                      className="h-4 w-4 border-ink-400 text-ink-900"
                    />
                    <span className="ml-2.5 text-sm text-ink-700">Kolekcije</span>
                  </label>
                  <label className="flex cursor-pointer items-center">
                    <input
                      type="radio"
                      name="listingMode"
                      checked={selectedListingMode === 'accessory'}
                      onChange={() => setSelectedListingMode('accessory')}
                      className="h-4 w-4 border-ink-400 text-ink-900"
                    />
                    <span className="ml-2.5 text-sm text-ink-700">Prateći asortiman</span>
                  </label>
                  <label className="flex cursor-pointer items-center">
                    <input
                      type="radio"
                      name="listingMode"
                      checked={selectedListingMode === 'all'}
                      onChange={() => setSelectedListingMode('all')}
                      className="h-4 w-4 border-ink-400 text-ink-900"
                    />
                    <span className="ml-2.5 text-sm text-ink-700">Sve stavke</span>
                  </label>
                </div>
              </div>
            )}

            {/* Vrsta drveta (samo Parket) – više izbora kao brendovi */}
            {isParketCategory && availableWoodTypes && availableWoodTypes.length > 0 && (
              <div className="mb-8">
                <p className="label mb-3">Vrsta drveta</p>
                <div className="space-y-2">
                  {availableWoodTypes.map((w) => (
                    <label key={w.value} className="flex cursor-pointer items-center">
                      <input
                        type="checkbox"
                        checked={selectedWoodTypes.includes(w.value)}
                        onChange={() => toggleWoodType(w.value)}
                        className="h-4 w-4 border-ink-400 text-ink-900"
                      />
                      <span className="ml-2.5 text-sm text-ink-700">{w.value} ({w.count})</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Vinyl Type Filter */}
            {isVinilCategory && (
              <div className="mb-8">
                <p className="label mb-3">Tip Vinila</p>
                <div className="space-y-2">
                  <label className="flex cursor-pointer items-center">
                    <input
                      type="radio"
                      name="vinylType"
                      checked={vinylType === 'homogeni'}
                      onChange={() => setVinylType('homogeni')}
                      className="h-4 w-4 border-ink-400 text-ink-900"
                    />
                    <span className="ml-2.5 text-sm text-ink-700">Homogeni</span>
                  </label>
                  <label className="flex cursor-pointer items-center">
                    <input
                      type="radio"
                      name="vinylType"
                      checked={vinylType === 'heterogeni'}
                      onChange={() => setVinylType('heterogeni')}
                      className="h-4 w-4 border-ink-400 text-ink-900"
                    />
                    <span className="ml-2.5 text-sm text-ink-700">Heterogeni</span>
                  </label>
                  <label className="flex cursor-pointer items-center">
                    <input
                      type="radio"
                      name="vinylType"
                      checked={vinylType === null}
                      onChange={() => setVinylType(null)}
                      className="h-4 w-4 border-ink-400 text-ink-900"
                    />
                    <span className="ml-2.5 text-sm text-ink-700">Svi</span>
                  </label>
                </div>
              </div>
            )}

            {/* Overall Thickness Filter (for LVT, Vinil, Linoleum, and Laminat) */}
            {(isLVTCategory || isVinilCategory || isLinoleumCategory || isLaminatCategory) && availableThickness && availableThickness.length > 0 && (
              <div className="mb-8">
                <p className="label mb-3">Debljina</p>
                <div className="space-y-2">
                  {availableThickness.map((thickness) => {
                    // For Vinil: check if thickness is available for selected type
                    let isDisabled = false;
                    if (isVinilCategory && availableThicknessByType && vinylType) {
                      if (vinylType === 'homogeni') {
                        isDisabled = !availableThicknessByType.homogeni.includes(thickness);
                      } else if (vinylType === 'heterogeni') {
                        isDisabled = !availableThicknessByType.heterogeni.includes(thickness);
                      }
                    }

                    return (
                      <label
                        key={thickness}
                        className={`flex items-center ${isDisabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedThickness.includes(thickness)}
                          onChange={() => !isDisabled && toggleThickness(thickness)}
                          disabled={isDisabled}
                          className="h-4 w-4 border-ink-400 text-ink-900 disabled:cursor-not-allowed disabled:opacity-50"
                        />
                        <span className={`ml-2.5 text-sm ${isDisabled ? 'text-ink-500' : 'text-ink-700'}`}>
                          {thickness} mm
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3 border-t border-ink-200 px-6 py-4">
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="btn-secondary flex-1"
              >
                Obriši filtere
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsDrawerOpen(false)}
              className="btn-primary flex-1"
            >
              Prikaži rezultate
            </button>
          </div>
        </div>
      )}
    </>
  );
}
```

- [ ] **Step 4: app/kategorije/[slug]/page.tsx — bela pozadina, hairline header bez kartice, traka filtera umesto sticky sidebara, mreza 2/3/4**

Izmena 1 — pozadina stranice:

OLD:
```tsx
    <div className="bg-gray-50 min-h-screen">
```
NEW:
```tsx
    <div className="bg-white min-h-screen">
```

Izmena 2 — header sekcija (uklanja se zaobljena kartica sa senkom, bedz broja proizvoda postaje obican tekst, bullets postaju tekst bez pilula):

OLD:
```tsx
        <section className="mb-6 rounded-[1.75rem] border border-stone-200 bg-white px-6 py-8 shadow-sm">
          <div className="max-w-4xl">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">
              Kategorija
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl">
                {categoryCopy.heading}
              </h1>
              <span className="inline-flex items-center rounded-full bg-stone-100 px-3 py-1 text-sm font-medium text-stone-600">
                {allProducts.length} proizvoda
              </span>
            </div>
            <p className="mt-4 max-w-3xl text-base leading-7 text-stone-700 sm:text-lg">
              {categoryCopy.lead}
            </p>
            {categoryCopy.body ? (
              <p className="mt-3 max-w-3xl text-sm leading-7 text-stone-600 sm:text-base">
                {categoryCopy.body}
              </p>
            ) : null}
            {categoryCopy.bullets.length > 0 ? (
              <div className="mt-5 flex flex-wrap gap-2">
                {categoryCopy.bullets.map((bullet) => (
                  <span
                    key={bullet}
                    className="inline-flex items-center rounded-full border border-stone-200 bg-stone-50 px-3 py-1.5 text-sm text-stone-700"
                  >
                    {bullet}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </section>
```
NEW:
```tsx
        <section className="mb-6 pb-10 pt-2">
          <div className="max-w-4xl">
            <p className="eyebrow">
              Kategorija
            </p>
            <div className="mt-3 flex flex-wrap items-baseline gap-x-4 gap-y-2">
              <h1 className="text-3xl font-normal tracking-tight text-ink-900 sm:text-5xl">
                {categoryCopy.heading}
              </h1>
              <span className="text-[13px] text-ink-500">
                {allProducts.length} proizvoda
              </span>
            </div>
            <p className="mt-4 max-w-3xl text-base leading-7 text-ink-600 sm:text-lg">
              {categoryCopy.lead}
            </p>
            {categoryCopy.body ? (
              <p className="mt-3 max-w-3xl text-sm leading-7 text-ink-500 sm:text-base">
                {categoryCopy.body}
              </p>
            ) : null}
            {categoryCopy.bullets.length > 0 ? (
              <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2">
                {categoryCopy.bullets.map((bullet) => (
                  <span
                    key={bullet}
                    className="text-[13px] text-ink-700"
                  >
                    {bullet}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </section>
```

Izmena 3 — STRUKTURNA: sticky sidebar + flex layout se zamenjuju trakom filtera (puna sirina) + mrezom ispod. Propsi za `ProductFilters` i `CategoryTabs` ostaju IDENTICNI:

OLD:
```tsx
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Filters Sidebar */}
          <aside className="lg:w-60 flex-shrink-0">
            <ProductFilters
              availableBrands={availableBrands}
              currentFilters={{
                ...filtersWithoutCollections,
                listing: listingMode,
                toolGroup: selectedToolGroupSlugs,
                toolSubcategory: selectedToolSubcategorySlugs,
              }}
              availableCollections={availableCollections}
              availableFamilies={category.slug === 'tekstilne-ploce' ? availableFamilies : undefined}
              availableWoodTypes={category.slug === 'parket' ? availableWoodTypes : undefined}
              availableThickness={availableThickness}
              availableThicknessByType={category.slug === 'vinil' ? availableThicknessByType : undefined}
              availableToolGroups={category.slug === 'alat' ? availableToolGroups : undefined}
              availableToolSubcategories={category.slug === 'alat' ? availableToolSubcategories : undefined}
            />
          </aside>

          {/* Products Grid */}
          <div className="flex-1">
            {hasCollectionTabs ? (
              <CategoryTabs
                collections={collections}
                colors={colors}
                brandsRecord={brandsRecord}
                categorySlug={category.slug}
                initialColorSlug={searchParams.color}
                vinylType={searchParams.type}
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
                <div className="mb-6 flex items-center justify-between">
                  <p className="text-gray-600">
                    {filteredProducts.length === 0 ? 'Nema' : filteredProducts.length} {filteredProducts.length === 1 ? 'proizvod' : 'proizvoda'}
                  </p>
                </div>

                {filteredProducts.length === 0 ? (
                  <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                    <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Nema proizvoda
                    </h3>
                    <p className="text-gray-600">
                      Trenutno nema proizvoda koji odgovaraju izabranim filterima.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredProducts.map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
```
NEW:
```tsx
        {/* Traka filtera: brend cipovi + dugme Filteri (fioka) */}
        <ProductFilters
          availableBrands={availableBrands}
          currentFilters={{
            ...filtersWithoutCollections,
            listing: listingMode,
            toolGroup: selectedToolGroupSlugs,
            toolSubcategory: selectedToolSubcategorySlugs,
          }}
          availableCollections={availableCollections}
          availableFamilies={category.slug === 'tekstilne-ploce' ? availableFamilies : undefined}
          availableWoodTypes={category.slug === 'parket' ? availableWoodTypes : undefined}
          availableThickness={availableThickness}
          availableThicknessByType={category.slug === 'vinil' ? availableThicknessByType : undefined}
          availableToolGroups={category.slug === 'alat' ? availableToolGroups : undefined}
          availableToolSubcategories={category.slug === 'alat' ? availableToolSubcategories : undefined}
        />

        {/* Products Grid */}
        <div className="mt-8">
          {hasCollectionTabs ? (
            <CategoryTabs
              collections={collections}
              colors={colors}
              brandsRecord={brandsRecord}
              categorySlug={category.slug}
              initialColorSlug={searchParams.color}
              vinylType={searchParams.type}
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
              <p className="mb-6 text-[13px] text-ink-500">
                {filteredProducts.length === 0 ? 'Nema' : filteredProducts.length} {filteredProducts.length === 1 ? 'proizvod' : 'proizvoda'}
              </p>

              {filteredProducts.length === 0 ? (
                <div className="border border-ink-200 bg-white p-12 text-center">
                  <h3 className="text-lg font-medium text-ink-900 mb-2">
                    Nema proizvoda
                  </h3>
                  <p className="text-[13px] text-ink-500">
                    Trenutno nema proizvoda koji odgovaraju izabranim filterima.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-3 xl:grid-cols-4">
                  {filteredProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
```

- [ ] **Step 5: components/CategoryTabs.tsx — tekstualni tabovi sa underline, skeleton umesto spinera, monohromna prazna stanja i brojaci, mreza 2/3/4**

Izmena 1 — prazno stanje i grid klase u `renderProducts`:

OLD:
```tsx
    if (products.length === 0) {
      return (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Nema proizvoda
          </h3>
          <p className="text-gray-600">
            Trenutno nema proizvoda koji odgovaraju izabranim filterima.
          </p>
        </div>
      );
    }
    const gridClass = singleColumn
      ? 'grid grid-cols-1 gap-6 max-w-2xl'
      : 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6';
```
NEW:
```tsx
    if (products.length === 0) {
      return (
        <div className="border border-ink-200 bg-white p-12 text-center">
          <h3 className="text-lg font-medium text-ink-900 mb-2">
            Nema proizvoda
          </h3>
          <p className="text-[13px] text-ink-500">
            Trenutno nema proizvoda koji odgovaraju izabranim filterima.
          </p>
        </div>
      );
    }
    const gridClass = singleColumn
      ? 'grid grid-cols-1 gap-6 max-w-2xl'
      : 'grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-3 xl:grid-cols-4';
```

Izmena 2 — tabovi Kolekcije/Boje (pravilo 10: tekstualni, aktivan `text-ink-900 border-b-2 border-ink-900`, neaktivan `text-ink-400 hover:text-ink-600`, font-normal, min 44px tap meta):

OLD:
```tsx
      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <div className="flex space-x-8">
          <button
            onClick={() => setActiveTab('collections')}
            className={`pb-3 px-1 font-semibold text-base transition-colors duration-200 ${activeTab === 'collections'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-gray-500 hover:text-gray-900'
              }`}
          >
            Kolekcije ({collectionsToRender.length})
          </button>
          <button
            onClick={() => setActiveTab('colors')}
            className={`pb-3 px-1 font-semibold text-base transition-colors duration-200 ${activeTab === 'colors'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-gray-500 hover:text-gray-900'
              }`}
          >
            {colorsTabLabel} ({useJsonColors
              ? (loadingColors
                ? '...'
                : colorsToRender.length)
              : legacyColors.length
            })
          </button>
        </div>
      </div>
```
NEW:
```tsx
      {/* Tabs */}
      <div className="mb-6 border-b border-ink-200">
        <div className="flex gap-8">
          <button
            onClick={() => setActiveTab('collections')}
            className={`min-h-[44px] px-1 pb-3 text-base font-normal transition-colors duration-200 ${activeTab === 'collections'
              ? 'text-ink-900 border-b-2 border-ink-900'
              : 'text-ink-400 hover:text-ink-600 border-b-2 border-transparent'
              }`}
          >
            Kolekcije ({collectionsToRender.length})
          </button>
          <button
            onClick={() => setActiveTab('colors')}
            className={`min-h-[44px] px-1 pb-3 text-base font-normal transition-colors duration-200 ${activeTab === 'colors'
              ? 'text-ink-900 border-b-2 border-ink-900'
              : 'text-ink-400 hover:text-ink-600 border-b-2 border-transparent'
              }`}
          >
            {colorsTabLabel} ({useJsonColors
              ? (loadingColors
                ? '...'
                : colorsToRender.length)
              : legacyColors.length
            })
          </button>
        </div>
      </div>
```

Izmena 3 — brojac kolekcija:

OLD:
```tsx
            <p className="text-gray-600 mb-6">
              {collectionsToRender.length === 0 ? 'Nema' : collectionsToRender.length} {collectionsToRender.length === 1 ? 'kolekcija' : 'kolekcija'}
            </p>
```
NEW:
```tsx
            <p className="text-[13px] text-ink-500 mb-6">
              {collectionsToRender.length === 0 ? 'Nema' : collectionsToRender.length} {collectionsToRender.length === 1 ? 'kolekcija' : 'kolekcija'}
            </p>
```

Izmena 4 — spiner za boje postaje skeleton (pravilo 11):

OLD:
```tsx
              isColorsLoading ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                  <p className="mt-4 text-gray-600">{colorsLoadingLabel}</p>
                </div>
              ) : (
```
NEW:
```tsx
              isColorsLoading ? (
                <div aria-busy="true" aria-label={colorsLoadingLabel}>
                  <div className="mb-6 h-4 w-32 animate-pulse bg-paper" />
                  <div className="grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-3 xl:grid-cols-4">
                    {Array.from({ length: 8 }).map((_, index) => (
                      <div key={index}>
                        <div className="aspect-[4/5] animate-pulse bg-paper" />
                        <div className="mt-3 h-3 w-1/3 animate-pulse bg-paper" />
                        <div className="mt-2 h-4 w-2/3 animate-pulse bg-paper" />
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
```

Izmena 5 — brojac boja (JSON grana):

OLD:
```tsx
                  <p className="text-gray-600 mb-6">
                    {colorsToRender.length === 0 ? 'Nema' : colorsToRender.length} {colorsCountLabel}
                  </p>
```
NEW:
```tsx
                  <p className="text-[13px] text-ink-500 mb-6">
                    {colorsToRender.length === 0 ? 'Nema' : colorsToRender.length} {colorsCountLabel}
                  </p>
```

Izmena 6 — brojac boja (legacy grana):

OLD:
```tsx
                <p className="text-gray-600 mb-6">
                  {legacyColors.length === 0 ? 'Nema' : legacyColors.length} {colorsCountLabel}
                </p>
```
NEW:
```tsx
                <p className="text-[13px] text-ink-500 mb-6">
                  {legacyColors.length === 0 ? 'Nema' : legacyColors.length} {colorsCountLabel}
                </p>
```

- [ ] **Step 6: components/Breadcrumbs.tsx — NOVA VERZIJA FAJLA: text-[13px] text-ink-500, separator "/"**

Interfejs (`items`, `variant`) i aria atributi ostaju identicni; menja se samo prezentacija (SVG chevron -> "/", uklonjene focus:ring i primary klase; dark varijanta zadrzana za stranice sa tamnim hero blokom).

NOVA VERZIJA FAJLA:
```tsx
import Link from 'next/link';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  variant?: 'light' | 'dark';
}

export default function Breadcrumbs({ items, variant = 'light' }: BreadcrumbsProps) {
  const isDark = variant === 'dark';

  const linkClass = isDark
    ? 'text-white/60 transition-colors hover:text-white'
    : 'text-ink-500 transition-colors hover:text-ink-900';
  const currentClass = isDark ? 'text-white' : 'text-ink-900';
  const separatorClass = isDark ? 'text-white/40' : 'text-ink-400';

  return (
    <nav aria-label="Breadcrumb" className="mb-6">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px]">
        <li>
          <Link href="/" className={linkClass}>
            Početna
          </Link>
        </li>

        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={index} className="flex items-center gap-x-2">
              <span className={separatorClass} aria-hidden="true">/</span>

              {isLast || !item.href ? (
                <span className={currentClass} aria-current={isLast ? 'page' : undefined}>
                  {item.label}
                </span>
              ) : (
                <Link href={item.href} className={linkClass}>
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
```

- [ ] **Step 7: Build provera**

Run: npm run build (u repou). Expected: uspesan build bez gresaka.

- [ ] **Step 8: Vizuelna provera**

Pokrenuti npm run dev i proveriti `/`, `/kategorije/lvt`, `/kategorije/laminat`, `/kategorije/alat` i `/kategorije/otiraci` na 1440px i 390px:
- Pocetna: veliki tabovi kategorija font-normal sa underline indikatorom na aktivnom; hairline linije (ink-200) umesto crnih; meta traka kao eyebrow; mreza 2/3/4 kolone; "Zasto izabrati nas" tri kolone sa vertikalnim hairline linijama na 1440px (horizontalnim na 390px), brojevi 01/02/03 veliki i svetli, bez hover sivih kutija i ikonica; CTA blok crn, belo pravougaono dugme bez radiusa.
- Kategorije: header bez kartice/senke/pilula; ispod naslova hairline traka — levo brend cipovi (klik na cip menja `brands` URL parametar i podvlaci cip), desno dugme "Filteri" sa brojem aktivnih filtera; klik otvara fioku zdesna (max-w-md, overlay bg-black/20, bez radiusa); Escape i klik na overlay zatvaraju; svi filteri u fioci rade kao ranije (URL parametri identicni — proveriti `?brands=`, `?thickness=`, `?type=`, `?toolGroup=`); tabovi Kolekcije/Boje tekstualni sa underline; pri ucitavanju taba Boje prikazuju se skeleton blokovi (bg-paper, animate-pulse) umesto spinera; mreza grid-cols-2 / md:3 / xl:4; breadcrumb 13px sivi sa "/" separatorom.
- Na 390px: brend cipovi se horizontalno skroluju, fioka zauzima punu sirinu, tap mete >= 44px.

- [ ] **Step 9: Commit**

```bash
git add components/HomeProductTabs.tsx app/page.tsx "app/kategorije/[slug]/page.tsx" components/CategoryTabs.tsx components/ProductFilters.tsx components/Breadcrumbs.tsx && git commit -m "style: redizajn pocetne i stranica kategorija u monohromni galerijski jezik (tabovi sa underline, fioka filtera, hairline mreza)"
```

---

### Task 5: Stranica proizvoda — galerija i info kolona

**Files:**
- Modify: components/ProductColorSelector.tsx
- Modify: components/ColorGrid.tsx
- Modify: app/proizvodi/[slug]/page.tsx
- Modify: app/proizvodi/welding-rod/[ref]/page.tsx
- Modify: components/ProductActions.tsx
- Modify: components/ShareButtons.tsx
- Modify: components/ProductInquiryStickyCTA.tsx
- Modify: components/InquiryButton.tsx

Napomene za celu grupu:
- Sva logika, propsi, URL parametri (`?color=`), redirecti, prefill upita i SEO ostaju identični — menja se isključivo JSX/klase.
- "Thumbnail red ispod" iz speca: postojeći data flow nema niz thumbnail-a (boje se biraju kroz `ColorGrid` swatcheve, a više slika po boji postoji samo kroz `selectedImages` strelice/tačkice). Zato se strelice/tačkice samo restilizuju u monohrom — ne uvodi se novi data flow (pravilo 12). Fade pri promeni boje (opacity tranzicije na pre-renderovanim `<img>`) ostaje netaknut.
- `BrandLogoMark` se u info koloni zamenjuje `.eyebrow` tekstom brenda (spec 4.4: "brend etiketa"); import se briše u oba fajla koja ga koriste. Komponenta `BrandLogoMark.tsx` ostaje u repou (ne dira se).

- [ ] **Step 1: components/ProductColorSelector.tsx — kompletna prepravka JSX-a (split: galerija levo, sticky info kolona desno)**

Komponenta se suštinski prepravlja (>60% JSX-a) — **NOVA VERZIJA FAJLA**. Sva logika (state, hooks, handleri, IIFE za href upita, welding/backing logika) je doslovno prenesena iz postojećeg fajla; menjaju se samo raspored i klase. Jedina izmena importa: obrisan `BrandLogoMark`.

```tsx
'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import ProductImage from './ProductImage';
import ColorGrid from './ColorGrid';
import FavoriteButton from './FavoriteButton';
import { splitProductTitle } from '@/lib/utils/name-parser';
import { getCustomColorHeroImageState, getPrimaryColorImage } from '@/lib/utils/product-images';

import { ProductSpec } from '@/types';

interface ProductColorSelectorProps {
  initialImage: {
    url: string;
    alt: string;
  } | null;
  collectionSlug: string;
  productName: string;
  /** Original product/collection name before color merge — stable reference for subtitle */
  originalProductName?: string;
  productPrice?: number;
  priceUnit?: string;
  brand?: {
    name: string;
    slug: string;
    logo?: string | null;
  } | null;
  shortDescription?: string;
  specs?: ProductSpec[];
  inStock: boolean;
  productSlug: string;
  externalLink?: string;
  onCharacteristicsChange?: (characteristics: Record<string, string> | null) => void;
  customColors?: any[];
  /** Za parket/laminat: naziv kolekcije prikazan iznad (kao LVT "Creation 30"). Ispod slike ostaje boja/varijanta. */
  collectionDisplayName?: string;
  /** Kada je collectionDisplayName setovan: label ispod (npr. "Parket" ili "Laminat") – "Parket – ime boje" / "Laminat – ime boje". */
  collectionCategoryLabel?: string;
  /** YouTube embed URL (npr. za kolekciju) – prikazuje se ispod slike, u širini slike, play na sajtu. */
  videoEmbedUrl?: string;
  /** Ref proizvoda za link upita (upiti?product=&color=&ref=). */
  inquiryRef?: string;
  /** Da li je glavna slika hero/LCP – samo jedna po stranici ima priority. */
  imagePriority?: boolean;
  /** Product ID for Favorite button */
  productId?: string;
  /** Opcija da se potpuno sakrije prozor za boje (npr. za Deking proizvode) i popuni prostor */
  hideColorSelector?: boolean;
  apiCategory?: string;
  uiMode?: 'colors' | 'variants';
}

export default function ProductColorSelector({
  initialImage,
  collectionSlug,
  productName,
  originalProductName,
  productPrice,
  priceUnit,
  brand,
  shortDescription,
  specs,
  inStock,
  productSlug,
  externalLink,
  onCharacteristicsChange,
  customColors,
  collectionDisplayName,
  collectionCategoryLabel,
  videoEmbedUrl,
  inquiryRef,
  imagePriority,
  productId,
  hideColorSelector,
  apiCategory,
  uiMode = 'colors',
}: ProductColorSelectorProps) {
  const [selectedImage, setSelectedImage] = useState(initialImage);
  const [selectedImages, setSelectedImages] = useState<Array<{ url: string; alt: string }>>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedColor, setSelectedColor] = useState<{ code: string; name: string } | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const initialColorSlug = searchParams.get('color') || undefined;
  const [selectedColorSlug, setSelectedColorSlug] = useState<string | undefined>(initialColorSlug);
  const [selectedCharacteristics, setSelectedCharacteristics] = useState<Record<string, string> | null>(null);
  const [colorsCount, setColorsCount] = useState<number | null>(null);
  const externalLinkLabel = brand?.slug === 'podovi' ? 'Pogledaj izvorni katalog' : 'Pogledaj na sajtu proizvođača';
  const [isColorsModalOpen, setIsColorsModalOpen] = useState(false);
  const selectorTitle = uiMode === 'variants' ? 'Varijante' : 'Boje';
  const selectorCountLabel = uiMode === 'variants'
    ? (colorsCount === 1 ? 'varijanta' : 'varijanti')
    : 'boja';
  const selectorAllTitle = uiMode === 'variants' ? 'Sve varijante' : 'Sve boje';

  // Parket: ako je u URL-u ?color= koji nije u customColors (npr. winter-832), redirect na prvu validnu boju
  useEffect(() => {
    if (!customColors || customColors.length === 0) return;
    const urlColor = searchParams.get('color') || '';
    if (!urlColor) return;
    const validSlugs = customColors.map((c: { slug?: string }) => c.slug).filter((s): s is string => Boolean(s));
    const firstSlug = validSlugs[0];
    if (firstSlug && !validSlugs.includes(urlColor)) {
      const params = new URLSearchParams(searchParams);
      params.set('color', firstSlug);
      router.replace(`${pathname}?${params.toString()}`);
    }
  }, [customColors, searchParams, pathname, router]);

  // Compute clean collection name: strip brand prefix from originalProductName
  // e.g. "Gerflor Creation 40 Clic" → "Creation 40 Clic", "BLOQ Solace" → "Solace"
  const collectionName = useMemo(() => {
    const name = originalProductName || productName;
    if (brand?.name && name.toLowerCase().startsWith(brand.name.toLowerCase() + ' ')) {
      return name.substring(brand.name.length + 1);
    }
    return name;
  }, [originalProductName, productName, brand]);
  const customColorHeroState = useMemo(
    () => getCustomColorHeroImageState(customColors, selectedColorSlug, initialImage),
    [customColors, selectedColorSlug, initialImage]
  );
  const activeCustomColor = useMemo(
    () => (
      customColorHeroState.activeColorSlug
        ? customColors?.find((color: any) => color.slug === customColorHeroState.activeColorSlug) || null
        : null
    ),
    [customColors, customColorHeroState.activeColorSlug]
  );
  const activeColorContext = useMemo(() => {
    if (selectedColor) {
      return selectedColor;
    }

    if (!activeCustomColor) {
      return null;
    }

    return {
      code: String(activeCustomColor.code || '').trim(),
      name: String(activeCustomColor.name || activeCustomColor.full_name || '').trim(),
    };
  }, [selectedColor, activeCustomColor]);
  const displayProductTitle = useMemo(() => {
    const rawName = activeColorContext?.name
      ? (
        activeColorContext.code && activeColorContext.name.startsWith(activeColorContext.code)
          ? activeColorContext.name.substring(activeColorContext.code.length).trim()
          : activeColorContext.name
      )
      : productName;

    return splitProductTitle(rawName, collectionDisplayName || collectionName);
  }, [activeColorContext, productName, collectionDisplayName, collectionName]);
  const shareTitle = useMemo(() => {
    if (displayProductTitle.collection && displayProductTitle.collection !== displayProductTitle.color) {
      return `${displayProductTitle.color} - ${displayProductTitle.collection}`;
    }

    return displayProductTitle.color || productName;
  }, [displayProductTitle, productName]);

  // Update selectedColorSlug when URL changes
  useEffect(() => {
    const urlColorSlug = searchParams.get('color') || undefined;
    if (urlColorSlug !== selectedColorSlug) {
      setSelectedColorSlug(urlColorSlug);
    }
  }, [searchParams, selectedColorSlug]);

  // Track the previous image for cross-fade
  const [prevImage, setPrevImage] = useState<{ url: string; alt: string } | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const transitionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Update image when color is selected
  const handleColorSelect = useCallback((payload: {
    imageUrl: string;
    imageAlt: string;
    colorCode?: string;
    colorName?: string;
    characteristics?: Record<string, string>;
    colorSlug?: string;
  }) => {
    const { imageUrl, imageAlt, colorCode, colorName, characteristics } = payload;
    if (imageUrl) {
      // Start cross-fade: save current as prev, set new image
      if (selectedImage && selectedImage.url !== imageUrl) {
        setPrevImage(selectedImage);
        setIsTransitioning(true);
        if (transitionTimeoutRef.current) clearTimeout(transitionTimeoutRef.current);
        transitionTimeoutRef.current = setTimeout(() => {
          setPrevImage(null);
          setIsTransitioning(false);
        }, 250);
      }
      setSelectedImage({ url: imageUrl, alt: imageAlt });
      setCurrentImageIndex(0); // Reset to first image

      if (colorCode && colorName) {
        setSelectedColor({ code: colorCode, name: colorName });
      }

      if (payload.colorSlug) {
        setSelectedColorSlug(payload.colorSlug);
      }

      if (characteristics) {
        setSelectedCharacteristics(characteristics);
        if (onCharacteristicsChange) {
          onCharacteristicsChange(characteristics);
        }
      }
    }
  }, [selectedImage, onCharacteristicsChange]);

  // Za customColors kolekcije: bez ?color ostaje collection cover, sa ?color aktivna je izabrana boja.
  useEffect(() => {
    if (!customColors?.length) {
      return;
    }

    if (!selectedColorSlug) {
      setSelectedColor(null);
      setSelectedCharacteristics(null);
      setSelectedImages([]);
      setCurrentImageIndex(0);
      setSelectedImage(initialImage);
      if (onCharacteristicsChange) {
        onCharacteristicsChange(null);
      }
      return;
    }

    const color = customColors.find((c: any) => c.slug === selectedColorSlug);
    const colorImage = getPrimaryColorImage(color);
    if (!color || !colorImage?.url) {
      return;
    }

    setSelectedImage({ url: colorImage.url, alt: colorImage.alt });
    setSelectedImages([{ url: colorImage.url, alt: colorImage.alt }]);
    if (color.code && color.name) {
      setSelectedColor({ code: color.code, name: color.name });
    }
  }, [customColors, selectedColorSlug, initialImage, onCharacteristicsChange]);

  // Update selected image when currentImageIndex changes
  useEffect(() => {
    if (selectedImages.length > 0 && selectedImages[currentImageIndex]) {
      setSelectedImage(selectedImages[currentImageIndex]);
    }
  }, [currentImageIndex, selectedImages]);

  // Clean up transition timeout on unmount
  useEffect(() => {
    return () => {
      if (transitionTimeoutRef.current) clearTimeout(transitionTimeoutRef.current);
    };
  }, []);

  const handleModalColorSelect = (payload: {
    imageUrl: string;
    imageAlt: string;
    colorCode?: string;
    colorName?: string;
    characteristics?: Record<string, string>;
  }) => {
    handleColorSelect(payload);
    setIsColorsModalOpen(false);
  };

  const colorsCountLabel = colorsCount === null ? '...' : colorsCount;

  return (
    <>
      {/* Split raspored: levo galerija, desno sticky info kolona */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-start mb-12">
        {/* Levo: galerija */}
        <div>
          <div className="aspect-square relative overflow-hidden bg-paper">
            {/* Pre-render ALL color images - instant switching via CSS display */}
            {customColors && customColors.length > 0 ? (
              <>
                {customColorHeroState.image && !customColorHeroState.activeColorSlug && (
                  <img
                    key={`collection-cover-${customColorHeroState.image.url}`}
                    src={customColorHeroState.image.url}
                    alt={customColorHeroState.image.alt}
                    className="absolute inset-0 w-full h-full object-cover"
                    style={{
                      opacity: 1,
                      zIndex: 10,
                      transition: 'opacity 200ms ease-in-out',
                    }}
                    loading="eager"
                    decoding="async"
                  />
                )}
                {customColors.map((color: { slug?: string; image_url?: string; texture_url?: string; lifestyle_url?: string; image?: string; name?: string; full_name?: string }) => {
                  const primaryColorImage = getPrimaryColorImage(color);
                  const imgUrl = primaryColorImage?.url;
                  const isActive = color.slug === customColorHeroState.activeColorSlug;
                  if (!imgUrl) return null;
                  return (
                    <img
                      key={color.slug}
                      src={imgUrl}
                      alt={primaryColorImage?.alt || color.name || color.full_name || ''}
                      className="absolute inset-0 w-full h-full object-cover"
                      style={{
                        opacity: isActive ? 1 : 0,
                        zIndex: isActive ? 10 : 1,
                        transition: 'opacity 200ms ease-in-out',
                      }}
                      loading="eager"
                      decoding="async"
                    />
                  );
                })}
              </>
            ) : selectedImage ? (
              <>
                {/* Previous image fading out for smooth cross-fade */}
                {prevImage && isTransitioning && (
                  <img
                    src={prevImage.url}
                    alt={prevImage.alt}
                    className="absolute inset-0 w-full h-full object-cover"
                    style={{
                      zIndex: 5,
                      opacity: 0,
                      transition: 'opacity 250ms ease-in-out',
                    }}
                  />
                )}
                {/* Current image */}
                <img
                  key={selectedImage.url}
                  src={selectedImage.url}
                  alt={selectedImage.alt}
                  className="absolute inset-0 w-full h-full object-cover"
                  style={{
                    zIndex: 10,
                    opacity: 1,
                    transition: 'opacity 200ms ease-in-out',
                  }}
                  loading="eager"
                  decoding="async"
                />
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-ink-500">
                <span>Bez slike</span>
              </div>
            )}

            {/* Image switcher arrows - show only if multiple images */}
            {selectedImages.length > 1 && (
              <>
                <button
                  onClick={() => setCurrentImageIndex((currentImageIndex - 1 + selectedImages.length) % selectedImages.length)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 flex min-h-[44px] min-w-[44px] items-center justify-center bg-white border border-ink-200 hover:border-ink-900 transition-colors z-20"
                  aria-label="Prethodna slika"
                >
                  <svg className="w-5 h-5 text-ink-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={() => setCurrentImageIndex((currentImageIndex + 1) % selectedImages.length)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 flex min-h-[44px] min-w-[44px] items-center justify-center bg-white border border-ink-200 hover:border-ink-900 transition-colors z-20"
                  aria-label="Sledeća slika"
                >
                  <svg className="w-5 h-5 text-ink-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                {/* Image indicator dots */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex z-20">
                  {selectedImages.map((_: { url: string; alt: string }, idx: number) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentImageIndex(idx)}
                      className="p-2"
                      aria-label={`Slika ${idx + 1}`}
                    >
                      <span className={`block h-[3px] transition-all ${idx === currentImageIndex ? 'w-5 bg-white' : 'w-2 bg-white/60'}`} />
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Ispod slike: ime boje (levo) + Favorite & Share (desno) – sve u jednoj liniji */}
          <div className="flex items-center justify-between mt-4">
            {/* Levo: ime boje */}
            <div className="flex-1 min-w-0">
              {activeColorContext ? (
                <div className="flex items-baseline gap-2">
                  <p className="text-[15px] text-ink-900 truncate">
                    {(() => {
                      let name = activeColorContext.name;
                      // Strip code prefix if name starts with code
                      if (activeColorContext.code && name.startsWith(activeColorContext.code)) {
                        name = name.substring(activeColorContext.code.length).trim();
                      }

                      const collName = collectionDisplayName || collectionName;
                      const { color } = splitProductTitle(name, collName);
                      return color;
                    })()}
                  </p>
                  {activeColorContext.code && (
                    <p className="text-[13px] text-ink-500">{activeColorContext.code}</p>
                  )}
                </div>
              ) : null}
            </div>

            {/* Desno: Favorite & Share */}
            <div className="flex items-center gap-3 flex-shrink-0 ml-3">
              {productId && <FavoriteButton productId={productId} size="md" />}
              <button
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({ title: shareTitle, url: window.location.href }).catch(() => { });
                  } else {
                    navigator.clipboard.writeText(window.location.href).then(() => {
                      alert('Link kopiran!');
                    });
                  }
                }}
                className="inline-flex items-center gap-1.5 bg-white border border-ink-200 px-3 min-h-[44px] text-[13px] font-medium text-ink-900 hover:border-ink-900 transition-colors"
                title="Podeli"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                Podeli
              </button>
            </div>
          </div>
        </div>

        {/* Desno: sticky info kolona */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          {/* Brend etiketa */}
          {brand?.name && (
            <p className="eyebrow mb-3">{brand.name}</p>
          )}

          {/* Naziv (boja) + kolekcija */}
          <h1 className="text-3xl md:text-4xl font-normal tracking-tight text-ink-900 mb-2">
            {displayProductTitle.color}
          </h1>

          {displayProductTitle.collection ? (
            <p className="text-base text-ink-600 mb-4">
              {displayProductTitle.collection}
            </p>
          ) : shortDescription ? (
            <p className="text-base text-ink-600 mb-4">
              {shortDescription}
            </p>
          ) : null}

          {/* Cena — čist tekst, bez kutija */}
          {productPrice && productPrice > 0 ? (
            <p className="text-[13px] text-ink-500 mb-8">
              {productPrice.toLocaleString('sr-RS')} RSD{priceUnit ? ` / ${priceUnit}` : ''}
            </p>
          ) : (
            <p className="text-[13px] text-ink-500 mb-8">Cena na upit</p>
          )}

          {/* Varijante/boje – mreža kvadratnih swatcheva */}
          {!hideColorSelector && (
            <div className="mb-10">
              <div className="flex items-baseline justify-between gap-4 mb-4">
                <div>
                  <h3 className="eyebrow">{selectorTitle}</h3>
                  <p className="text-[13px] text-ink-500 mt-1">{colorsCountLabel} {selectorCountLabel}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsColorsModalOpen(true)}
                  className="btn-link whitespace-nowrap"
                >
                  Pogledaj sve →
                </button>
              </div>
              <ColorGrid
                collectionSlug={collectionSlug}
                onColorSelect={handleColorSelect}
                compact={true}
                limit={12}
                onColorsLoaded={setColorsCount}
                initialColorSlug={initialColorSlug}
                selectedColorSlug={selectedColorSlug}
                customColors={customColors}
                apiCategory={apiCategory}
                uiMode={uiMode}
              />
            </div>
          )}

          {/* Dostupne podloge */}
          {(() => {
            const backingVariants = activeCustomColor?.backing_variants;

            if (backingVariants && Array.isArray(backingVariants) && backingVariants.length > 0) {
              return (
                <div className="mb-8">
                  <p className="eyebrow mb-3">Dostupne podloge</p>
                  <div className="flex flex-wrap gap-2">
                    {backingVariants.map((variant: string) => (
                      <span key={variant} className="px-3 py-1 border border-ink-200 text-ink-900 text-[13px]">{variant}</span>
                    ))}
                  </div>
                </div>
              );
            }
            return null;
          })()}

          {/* Accessory: Welding Rod */}
          {(() => {
            const selectedWeldingCharacteristic = selectedCharacteristics
              ? Object.entries(selectedCharacteristics).find(([label]) =>
                /(elektrod|varila|welding|vrpca)/i.test(label)
              )
              : null;

            const weldingRodSpec = specs?.find(s =>
              /(welding|varil|vrpca|elektrod)/i.test(s.key) ||
              /(varilačk|welding|elektrod|vrpca)/i.test(s.label)
            );
            const weldingLabel = selectedWeldingCharacteristic?.[0] || weldingRodSpec?.label || 'Elektroda za varenje';
            const weldingValue = selectedWeldingCharacteristic?.[1] || weldingRodSpec?.value || '';

            if (weldingValue && weldingValue.trim() !== '' && weldingValue.trim() !== '-') {
              return (
                <div className="mb-8">
                  <p className="eyebrow mb-2">Dodatna oprema</p>
                  <div className="flex justify-between border-b border-ink-200 py-[9px] text-[13px]">
                    <span className="text-ink-500">{weldingLabel}</span>
                    <span className="text-ink-900 text-right">{weldingValue}</span>
                  </div>
                </div>
              );
            }
            return null;
          })()}

          {/* CTA - Pošaljite upit – prefill: proizvod + boja + ref */}
          <a
            href={(() => {
              const params = new URLSearchParams();
              params.set('product', productSlug);
              if (selectedColorSlug) params.set('color', selectedColorSlug);
              if (inquiryRef) params.set('ref', inquiryRef);
              if (selectedImage?.url) params.set('img', selectedImage.url);

              const category = collectionCategoryLabel || (collectionSlug.includes('lvt') ? 'LVT' : collectionSlug.includes('linoleum') ? 'Linoleum' : 'Podna obloga');
              params.set('category', category);

              // Construct nice name: deduplicate collection name if present in color name
              let niceName = collectionDisplayName || productName;

              if (activeColorContext?.name) {
                let variantName = activeColorContext.name;
                // Check if variant name starts with the collection/product name (case insensitive)
                if (niceName && variantName.toLowerCase().startsWith(niceName.toLowerCase())) {
                  // Remove the repeated prefix
                  variantName = variantName.substring(niceName.length).trim();
                  // Remove any leading separators like "- " or space
                  variantName = variantName.replace(/^[-–—\s]+/, '');
                }

                if (variantName) {
                  niceName = `${niceName} - ${variantName}`;
                }
              }

              params.set('name', niceName);

              return `/upiti?${params.toString()}`;
            })()}
            className="btn-primary block w-full text-center min-h-[44px]"
          >
            Pošaljite upit
          </a>

          {/* Link na sajt proizvođača / izvorni katalog */}
          {externalLink && (
            <div className="mt-6">
              <a
                href={externalLink}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-link"
              >
                {externalLinkLabel} →
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Ispod prvog reda: Video Embed (if available) */}
      {videoEmbedUrl && (
        <div className="w-full mb-12">
          <div className="w-full max-w-4xl mx-auto aspect-video overflow-hidden bg-paper">
            <iframe
              src={videoEmbedUrl}
              title="Video kolekcije"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              loading="lazy"
              className="w-full h-full"
            />
          </div>
        </div>
      )}

      {isColorsModalOpen && (
        <div className="fixed inset-0 z-[60]">
          <div
            className="absolute inset-0 bg-ink-900/60"
            onClick={() => setIsColorsModalOpen(false)}
          ></div>
          <div className="relative mx-auto mt-8 w-[92%] max-w-5xl bg-white overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-ink-200">
              <h3 className="text-[15px] font-medium text-ink-900">
                {selectorAllTitle} ({colorsCountLabel})
              </h3>
              <button
                type="button"
                onClick={() => setIsColorsModalOpen(false)}
                className="flex min-h-[44px] min-w-[44px] items-center justify-center text-ink-500 hover:text-ink-900"
                aria-label="Zatvori"
              >
                ✕
              </button>
            </div>
            <div className="p-6 overflow-y-auto">
              <ColorGrid
                collectionSlug={collectionSlug}
                onColorSelect={handleModalColorSelect}
                compact={false}
                initialColorSlug={initialColorSlug}
                selectedColorSlug={selectedColorSlug}
                customColors={customColors}
                apiCategory={apiCategory}
                uiMode={uiMode}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
```

Napomena: mobilni redosled se menja — ranije su boje bile iznad info kutije (`order-1`/`order-2`); u novom split rasporedu desna kolona je jedan tok (brend → naziv → cena → swatchevi → CTA) po spec 4.4, pa `order-*` trikovi više nisu potrebni.

- [ ] **Step 2: components/ColorGrid.tsx — kvadratni swatchevi, skeleton loading, monohromna paginacija**

Izmena 2a — loading spinner → skeleton (pravilo 11):

OLD:
```tsx
  if (loading) {
    return (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        <p className="mt-4 text-gray-600">{uiText.loading}</p>
      </div>
    );
  }
```
NEW:
```tsx
  if (loading) {
    return (
      <div
        className={`grid gap-3 ${compact ? 'grid-cols-6' : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'}`}
        aria-label={uiText.loading}
      >
        {Array.from({ length: compact ? 12 : 10 }).map((_, idx) => (
          <div key={idx} className="aspect-square bg-paper animate-pulse" />
        ))}
      </div>
    );
  }
```

Izmena 2b — naslov "Dostupne boje" → eyebrow (pravilo 9):

OLD:
```tsx
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{uiText.available}</h2>
            <p className="text-gray-600 mt-1">{colors.length} {uiText.count(colors.length)}</p>
          </div>
```
NEW:
```tsx
          <div>
            <h2 className="eyebrow">{uiText.available}</h2>
            <p className="text-[13px] text-ink-500 mt-1">{colors.length} {uiText.count(colors.length)}</p>
          </div>
```

Izmena 2c — dugme za brisanje pretrage (input postaje bottom-line `.input` iz Task 1, pa ✕ ide na `right-0`):

OLD:
```tsx
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">✕</button>
            )}
```
NEW:
```tsx
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="absolute right-0 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600">✕</button>
            )}
```
(Samo polje `className="input text-sm py-2 sm:w-64"` ostaje BEZ IZMENA — `.input` helper iz Task 1 ga već pretvara u bottom-line stil.)

Izmena 2d — swatch dugme: kvadrat bez radiusa/senke, aktivan `border-2 border-ink-900` (border-2 i kad je neaktivan da ne dođe do layout shifta):

OLD:
```tsx
            <button
              key={color.slug}
              onClick={() => handleColorClick(color)}
              className={`group bg-white rounded-lg shadow-sm hover:shadow-md transition-all overflow-hidden border text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500 w-full ${isSelected
                ? 'border-primary-600 ring-2 ring-primary-200'
                : 'border-gray-200 hover:border-primary-400'
                } hover:shadow-lg hover:scale-105 duration-200`}
            >
```
NEW:
```tsx
            <button
              key={color.slug}
              onClick={() => handleColorClick(color)}
              className={`group overflow-hidden border-2 text-left cursor-pointer w-full transition-colors ${isSelected
                ? 'border-ink-900'
                : 'border-transparent hover:border-ink-200'
                }`}
            >
```

Izmena 2e — slika swatcha: paper podloga + spori zum (pravilo 7):

OLD:
```tsx
              <div className="aspect-square relative overflow-hidden bg-gray-100">
                {primaryColorImage?.url ? (
                  <ImageWithFallback
                    src={primaryColorImage.url}
                    alt={primaryColorImage.alt || color.full_name}
                    className="object-cover group-hover:scale-110 transition-transform duration-300"
```
NEW:
```tsx
              <div className="aspect-square relative overflow-hidden bg-paper">
                {primaryColorImage?.url ? (
                  <ImageWithFallback
                    src={primaryColorImage.url}
                    alt={primaryColorImage.alt || color.full_name}
                    className="object-cover group-hover:scale-[1.03] transition-transform duration-700"
```

Izmena 2f — "Bez slike" fallback u swatchu:

OLD:
```tsx
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">Bez slike</div>
```
NEW:
```tsx
                  <div className="w-full h-full flex items-center justify-center text-ink-500 text-xs">Bez slike</div>
```

Izmena 2g — info ispod slike (non-compact, modal "Sve boje"):

OLD:
```tsx
              {!compact && (
                <div className="p-3">
                  <p className="font-semibold text-gray-900 text-sm truncate">{color.code}</p>
                  {color.collection_name && (
                    <p className="text-[11px] text-gray-500 truncate mt-0.5">{color.collection_name}</p>
                  )}
                  <p className="text-xs text-gray-600 truncate mt-1">{color.name}</p>
                </div>
              )}
```
NEW:
```tsx
              {!compact && (
                <div className="px-1 pt-2 pb-3">
                  <p className="text-[13px] text-ink-900 truncate">{color.code}</p>
                  {color.collection_name && (
                    <p className="eyebrow truncate mt-0.5">{color.collection_name}</p>
                  )}
                  <p className="text-[13px] text-ink-600 truncate mt-1">{color.name}</p>
                </div>
              )}
```

Izmena 2h — paginacija: strelica "Prethodna strana":

OLD:
```tsx
            <button
              onClick={goToPrevious}
              disabled={currentPage === 0}
              className="p-2 rounded-full bg-white border-2 border-gray-300 hover:border-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
              aria-label="Prethodna strana"
            >
              <svg className="w-5 h-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
```
NEW:
```tsx
            <button
              onClick={goToPrevious}
              disabled={currentPage === 0}
              className="flex min-h-[44px] min-w-[44px] items-center justify-center bg-white border border-ink-200 hover:border-ink-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              aria-label="Prethodna strana"
            >
              <svg className="w-5 h-5 text-ink-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
```

Izmena 2i — indikatori strana (tačkice → crtice, veća tap meta kroz padding):

OLD:
```tsx
              {Array.from({ length: totalPages }).map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToPage(index)}
                  className={`h-1.5 rounded-full transition-all ${index === currentPage
                    ? 'w-6 bg-primary-600'
                    : 'w-1.5 bg-gray-300 hover:bg-gray-400'
                    }`}
                  aria-label={`Strana ${index + 1}`}
                />
              ))}
```
NEW:
```tsx
              {Array.from({ length: totalPages }).map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToPage(index)}
                  className="py-3 px-0.5"
                  aria-label={`Strana ${index + 1}`}
                >
                  <span
                    className={`block h-[3px] transition-all ${index === currentPage
                      ? 'w-6 bg-ink-900'
                      : 'w-2 bg-ink-200 hover:bg-ink-400'
                      }`}
                  />
                </button>
              ))}
```

Izmena 2j — strelica "Sledeća strana":

OLD:
```tsx
            <button
              onClick={goToNext}
              disabled={currentPage === totalPages - 1}
              className="p-2 rounded-full bg-white border-2 border-gray-300 hover:border-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
              aria-label="Sledeća strana"
            >
              <svg className="w-5 h-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
```
NEW:
```tsx
            <button
              onClick={goToNext}
              disabled={currentPage === totalPages - 1}
              className="flex min-h-[44px] min-w-[44px] items-center justify-center bg-white border border-ink-200 hover:border-ink-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              aria-label="Sledeća strana"
            >
              <svg className="w-5 h-5 text-ink-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
```

Izmena 2k — prazna pretraga:

OLD:
```tsx
      {filteredColors.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-600">Nije pronađena {uiText.empty} sa &quot;{searchTerm}&quot;</p>
          <button onClick={() => setSearchTerm('')} className="mt-4 text-primary-600 hover:text-primary-700 font-medium">Očisti pretragu</button>
        </div>
      )}
```
NEW:
```tsx
      {filteredColors.length === 0 && (
        <div className="text-center py-12">
          <p className="text-ink-600">Nije pronađena {uiText.empty} sa &quot;{searchTerm}&quot;</p>
          <button onClick={() => setSearchTerm('')} className="btn-link mt-4">Očisti pretragu</button>
        </div>
      )}
```

- [ ] **Step 3: app/proizvodi/[slug]/page.tsx — bela pozadina, sticky info kolona za ne-color layout, čišćenje kartica/boja**

Izmena 3a — brisanje BrandLogoMark importa (zamenjuje ga `.eyebrow` tekst):

OLD:
```tsx
import ProductBenefits from '@/components/ProductBenefits';
import BrandLogoMark from '@/components/BrandLogoMark';
import { categoryRepository } from '@/lib/repositories/category-repository';
```
NEW:
```tsx
import ProductBenefits from '@/components/ProductBenefits';
import { categoryRepository } from '@/lib/repositories/category-repository';
```

Izmena 3b — pozadina stranice:

OLD:
```tsx
        <div className="min-h-screen bg-gray-50">
```
NEW:
```tsx
        <div className="min-h-screen bg-white">
```

Izmena 3c — ne-color layout, sekcija slike (bez kartice, paper podloga):

OLD:
```tsx
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                {/* Image Section */}
                <div className="bg-white rounded-2xl shadow-lg p-8">
                  <div className="aspect-square relative overflow-hidden rounded-xl bg-gray-100">
```
NEW:
```tsx
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-start">
                {/* Image Section */}
                <div>
                  <div className="aspect-square relative overflow-hidden bg-paper">
```

Izmena 3d — "Bez slike" fallback:

OLD:
```tsx
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <span>Bez slike</span>
                      </div>
```
NEW:
```tsx
                      <div className="w-full h-full flex items-center justify-center text-ink-500">
                        <span>Bez slike</span>
                      </div>
```

Izmena 3e — info kolona postaje sticky, BrandLogoMark → eyebrow:

OLD:
```tsx
                {/* Info Section */}
                <div className="space-y-8">
                  <BrandLogoMark brand={brand} />
```
NEW:
```tsx
                {/* Info Section */}
                <div className="space-y-8 lg:sticky lg:top-24 lg:self-start">
                  {brand?.name && <p className="eyebrow">{brand.name}</p>}
```

Izmena 3f — h1 i kolekcija (pravilo 4):

OLD:
```tsx
                          <h1 className="text-4xl font-bold text-gray-900 mb-2">{color}</h1>
                          {collection && (
                            <p className="text-xl text-gray-500 font-medium mb-4">{collection}</p>
                          )}
```
NEW:
```tsx
                          <h1 className="text-3xl md:text-4xl font-normal tracking-tight text-ink-900 mb-2">{color}</h1>
                          {collection && (
                            <p className="text-base text-ink-600 mb-4">{collection}</p>
                          )}
```

Izmena 3g — kratak opis:

OLD:
```tsx
                    {product.shortDescription && (
                      <p className="text-xl text-gray-600">{product.shortDescription}</p>
                    )}
```
NEW:
```tsx
                    {product.shortDescription && (
                      <p className="text-base text-ink-600">{product.shortDescription}</p>
                    )}
```

Izmena 3h — cena: roza kutija → čist tekst (pravilo 6):

OLD:
```tsx
                  {(product.price !== undefined && product.price > 0) ? (
                    <div className="bg-primary-50 border border-primary-200 rounded-xl p-6">
                      <div className="flex items-baseline space-x-2">
                        <span className="text-4xl font-bold text-primary-600">{product.price.toLocaleString('sr-RS')}</span>
                        <span className="text-lg text-gray-600">RSD</span>
                        {product.priceUnit && <span className="text-lg text-gray-500">/ {product.priceUnit}</span>}
                      </div>
                    </div>
                  ) : (
                    <p className="text-xl font-medium text-gray-600">Cena na upit</p>
                  )}
```
NEW:
```tsx
                  {(product.price !== undefined && product.price > 0) ? (
                    <p className="text-[13px] text-ink-500">
                      {product.price.toLocaleString('sr-RS')} RSD{product.priceUnit ? ` / ${product.priceUnit}` : ''}
                    </p>
                  ) : (
                    <p className="text-[13px] text-ink-500">Cena na upit</p>
                  )}
```

Izmena 3i — CTA blok: crno dugme pune širine + tekstualni link:

OLD:
```tsx
                  {/* CTA Buttons */}
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Link
                      href={(() => {
                        const p = new URLSearchParams();
                        p.set('product', product.slug);
                        if (searchParams?.color) p.set('color', searchParams.color);
                        const refSpec = product.specs?.find(s => s.key === 'ref' || s.key === 'Ref.');
                        if (refSpec?.value) p.set('ref', refSpec.value);
                        return `/upiti?${p.toString()}`;
                      })()}
                      className="btn bg-primary-600 text-white hover:bg-primary-700 text-center text-lg px-8 py-4 flex-1"
                    >
                      Pošaljite upit
                    </Link>
                    {product.externalLink && (
                      <a
                        href={product.externalLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn border-2 border-gray-300 text-gray-700 hover:border-primary-600 hover:text-primary-600 text-center text-lg px-8 py-4 flex-1"
                      >
                        {product.brandId === '14' ? 'Pogledaj izvorni katalog' : 'Pogledaj na sajtu proizvođača'}
                      </a>
                    )}
                  </div>
```
NEW:
```tsx
                  {/* CTA Buttons */}
                  <div className="flex flex-col gap-5">
                    <Link
                      href={(() => {
                        const p = new URLSearchParams();
                        p.set('product', product.slug);
                        if (searchParams?.color) p.set('color', searchParams.color);
                        const refSpec = product.specs?.find(s => s.key === 'ref' || s.key === 'Ref.');
                        if (refSpec?.value) p.set('ref', refSpec.value);
                        return `/upiti?${p.toString()}`;
                      })()}
                      className="btn-primary block w-full text-center min-h-[44px]"
                    >
                      Pošaljite upit
                    </Link>
                    {product.externalLink && (
                      <a
                        href={product.externalLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-link self-start"
                      >
                        {product.brandId === '14' ? 'Pogledaj izvorni katalog' : 'Pogledaj na sajtu proizvođača'} →
                      </a>
                    )}
                  </div>
```

Izmena 3j — `sharedCertsAndEco`: gradijent kartica + indigo ikona + font-semibold h3 → čist blok sa eyebrow naslovom:

OLD:
```tsx
        <div className="bg-gradient-to-b from-[#FFFFFF] to-[#F9F9FB] rounded-[28px] p-8 h-full flex flex-col justify-center border border-[#E5E5EA] shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
          <div className="flex items-center gap-3.5 mb-7">
            <div className="w-11 h-11 rounded-2xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
            <h3 className="text-[21px] font-semibold tracking-[-0.01em] text-[#1D1D1F]">Sertifikati kvaliteta</h3>
          </div>
```
NEW:
```tsx
        <div className="h-full">
          <h3 className="eyebrow mb-6">Sertifikati kvaliteta</h3>
```
(Bez `border-t`/`justify-center` — ovaj blok stoji u istoj `md:grid-cols-2` mreži taba "Sertifikati" pored `EcoFeatures`, koji u Task 6 postaje običan `<div className="h-full">` sa eyebrow naslovom; obe kolone moraju biti identično poravnate, a hairline separator već renderuje sekcijski wrapper iz `ProductDetailsTabs`.)

Izmena 3k — `sharedDocs` omotač bez kartice:

OLD:
```tsx
    const sharedDocs = ((product.documents && product.documents.length > 0) || hasIndexedDocuments) ? (
      <div className="bg-white rounded-2xl shadow-lg p-6 h-full">
```
NEW:
```tsx
    const sharedDocs = ((product.documents && product.documents.length > 0) || hasIndexedDocuments) ? (
      <div className="h-full">
```

Izmena 3l — tab "Opis proizvoda" omotač:

OLD:
```tsx
                tabs.push({
                  id: 'description',
                  label: 'Opis proizvoda',
                  content: (
                    <div className="text-gray-700">
                      {descriptionContent}
                    </div>
                  )
                });
```
NEW:
```tsx
                tabs.push({
                  id: 'description',
                  label: 'Opis proizvoda',
                  content: (
                    <div className="text-ink-600">
                      {descriptionContent}
                    </div>
                  )
                });
```

Izmena 3m — `DescriptionSection`, prva grana (descriptionSections). PAZNJA: unutrašnji `<h2>Opis proizvoda</h2>` se UKLANJA (ne pretvara u eyebrow) — sekcijski wrapper iz Task 6 (`ProductDetailsTabs`) već renderuje eyebrow sa labelom taba "Opis proizvoda", inače bi naslov bio dupliran (isti razlog zbog kog Task 6 uklanja h2 iz `ProductDescriptionWithCharacteristics`):

OLD:
```tsx
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Opis proizvoda</h2>
        <div className="space-y-6">
          {descriptionSections.map((section, idx) => (
            <div key={`${section.title}-${idx}`} className="border-b border-gray-200 pb-4 last:border-0 last:pb-0">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">{section.title}</h3>
              {section.items && section.items.length > 0 && (
                <ul className="list-disc pl-5 text-gray-700 space-y-2">
```
NEW:
```tsx
        <div className="space-y-6">
          {descriptionSections.map((section, idx) => (
            <div key={`${section.title}-${idx}`} className="border-b border-ink-200 pb-4 last:border-0 last:pb-0">
              <h3 className="text-base font-medium text-ink-900 mb-3">{section.title}</h3>
              {section.items && section.items.length > 0 && (
                <ul className="list-disc pl-5 text-ink-600 space-y-2">
```

Izmena 3n — `DescriptionSection`, druga grana (plainDescription). Isto kao 3m: unutrašnji h2 se uklanja zbog eyebrow naslova iz `ProductDetailsTabs` wrappera:

OLD:
```tsx
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Opis proizvoda</h2>
        <div className="space-y-6">
          {plainDescription && (
            <div className="prose prose-lg max-w-none text-gray-700">
              <p className="whitespace-pre-line">{plainDescription}</p>
            </div>
          )}

          {detailSections.map((section, idx) => (
            <div key={`${section.title}-${idx}`} className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">{section.title}</h3>
              {section.items && section.items.length > 0 && (
                <ul className="list-disc pl-5 text-gray-700 space-y-2">
```
NEW:
```tsx
        <div className="space-y-6">
          {plainDescription && (
            <div className="prose max-w-none text-ink-600">
              <p className="whitespace-pre-line">{plainDescription}</p>
            </div>
          )}

          {detailSections.map((section, idx) => (
            <div key={`${section.title}-${idx}`} className="border-t border-ink-200 pt-6">
              <h3 className="text-base font-medium text-ink-900 mb-3">{section.title}</h3>
              {section.items && section.items.length > 0 && (
                <ul className="list-disc pl-5 text-ink-600 space-y-2">
```

(Ostatak page.tsx — metadata, redirecti, schema, breadcrumbs items, `ProductDetailsTabs`/`ProductDocuments`/`EcoFeatures` pozivi — BEZ IZMENA: logika i SEO se ne diraju, a same komponente restilizuju druge grupe.)

- [ ] **Step 4: app/proizvodi/welding-rod/[ref]/page.tsx — monohrom, hairline spec redovi, kartice boja bez senki**

Izmena 4a — accessory grana, header:

OLD:
```tsx
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container max-w-5xl">
          <div className="mb-8">
            <nav className="text-sm text-gray-600 mb-4">
              <Link href="/" className="hover:text-primary-600">Početna</Link>
              <span className="mx-2">/</span>
              <span className="text-gray-900">Elektroda za varenje</span>
            </nav>

            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              {source?.displayName || accessory.displayName}
            </h1>
            <p className="text-lg text-gray-600">
```
NEW:
```tsx
    return (
      <div className="min-h-screen bg-white py-12">
        <div className="container max-w-5xl">
          <div className="mb-10">
            <nav className="text-[13px] text-ink-500 mb-4">
              <Link href="/" className="hover:text-ink-900">Početna</Link>
              <span className="mx-2">/</span>
              <span className="text-ink-900">Elektroda za varenje</span>
            </nav>

            <h1 className="text-3xl md:text-4xl font-normal tracking-tight text-ink-900 mb-4">
              {source?.displayName || accessory.displayName}
            </h1>
            <p className="text-base text-ink-600">
```

Izmena 4b — tehnički podaci: kartica → hairline redovi (pravilo 8):

OLD:
```tsx
          {specs.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-8 mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Tehnički podaci
              </h2>
              <dl className="divide-y divide-gray-200">
                {specs.map((spec: ProductSpec) => (
                  <div key={spec.key} className="flex items-center justify-between py-3.5">
                    <dt className="text-sm font-medium text-gray-500">{spec.label}</dt>
                    <dd className="text-sm font-semibold text-gray-900 text-right">{spec.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
```
NEW:
```tsx
          {specs.length > 0 && (
            <div className="mb-12">
              <h2 className="eyebrow mb-4">
                Tehnički podaci
              </h2>
              <dl>
                {specs.map((spec: ProductSpec) => (
                  <div key={spec.key} className="flex justify-between border-b border-ink-200 py-[9px] text-[13px]">
                    <dt className="text-ink-500">{spec.label}</dt>
                    <dd className="text-ink-900 text-right">{spec.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
```

Izmena 4c — "Izvor i primena" blok:

OLD:
```tsx
          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Izvor i primena
            </h2>
            <div className="prose prose-lg max-w-none text-gray-700">
```
NEW:
```tsx
          <div>
            <h2 className="eyebrow mb-4">
              Izvor i primena
            </h2>
            <div className="prose max-w-none text-ink-600">
```

Izmena 4d — link na zvanični izvor:

OLD:
```tsx
                    className="text-primary-600 underline underline-offset-4"
```
NEW:
```tsx
                    className="text-ink-900 underline underline-offset-4 hover:opacity-60"
```

Izmena 4e — grana sa bojama, header:

OLD:
```tsx
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container">
        {/* Header */}
        <div className="mb-8">
          <nav className="text-sm text-gray-600 mb-4">
            <Link href="/" className="hover:text-primary-600">Početna</Link>
            <span className="mx-2">/</span>
            <span>Linoleum</span>
            <span className="mx-2">/</span>
            <span className="text-gray-900">Elektroda za varenje {weldingRodRef}</span>
          </nav>

          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            ELEKTRODA ZA VARENJE {weldingRodRef.toUpperCase()}
          </h1>
          <p className="text-lg text-gray-600">
            Prikazano {colors.length} boja koje koriste ovu elektrodu za varenje
          </p>
        </div>
```
NEW:
```tsx
  return (
    <div className="min-h-screen bg-white py-12">
      <div className="container">
        {/* Header */}
        <div className="mb-10">
          <nav className="text-[13px] text-ink-500 mb-4">
            <Link href="/" className="hover:text-ink-900">Početna</Link>
            <span className="mx-2">/</span>
            <span>Linoleum</span>
            <span className="mx-2">/</span>
            <span className="text-ink-900">Elektroda za varenje {weldingRodRef}</span>
          </nav>

          <h1 className="text-3xl md:text-4xl font-normal tracking-tight text-ink-900 mb-4">
            ELEKTRODA ZA VARENJE {weldingRodRef.toUpperCase()}
          </h1>
          <p className="text-base text-ink-600">
            Prikazano {colors.length} boja koje koriste ovu elektrodu za varenje
          </p>
        </div>
```

Izmena 4f — kartica boje: bez kartice/senke, eyebrow kontekst + naziv (pravila 5 i 7):

OLD:
```tsx
              <Link
                key={color.slug || color.code}
                href={`/proizvodi/linoleum-${slug}`}
                className="group bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden"
              >
                <div className="aspect-square relative bg-gray-100">
                  {imageUrl && (
                    <ProductImage
                      src={imageUrl}
                      alt={color.name || `${color.code}`}
                      className="object-cover"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                    />
                  )}
                </div>
                <div className="p-4">
                  <p className="text-sm font-semibold text-gray-900 mb-1">
                    {color.code}
                  </p>
                  <p className="text-xs text-gray-600 line-clamp-2">
                    {color.name}
                  </p>
                  {color.collection && (
                    <p className="text-xs text-gray-500 mt-2">
                      {color.collection_name || color.collection}
                    </p>
                  )}
                </div>
              </Link>
```
NEW:
```tsx
              <Link
                key={color.slug || color.code}
                href={`/proizvodi/linoleum-${slug}`}
                className="group block"
              >
                <div className="aspect-square relative overflow-hidden bg-paper">
                  {imageUrl && (
                    <ProductImage
                      src={imageUrl}
                      alt={color.name || `${color.code}`}
                      className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                    />
                  )}
                </div>
                <div className="pt-3">
                  {color.collection && (
                    <p className="eyebrow mb-1 truncate">
                      {color.collection_name || color.collection}
                    </p>
                  )}
                  <p className="text-[15px] text-ink-900 line-clamp-2">
                    {color.code} {color.name}
                  </p>
                </div>
              </Link>
```
(Zadržan `aspect-square` — slike linoleum boja su kvadratne teksture/swatchevi, 4:5 bi ih nepotrebno kropovao.)

Izmena 4g — info kutija na dnu:

OLD:
```tsx
        {/* Info Box */}
        <div className="mt-12 bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            O elektrodi za varenje
          </h2>
          <div className="prose prose-lg max-w-none text-gray-700">
```
NEW:
```tsx
        {/* Info Box */}
        <div className="mt-16 border-t border-ink-200 pt-8">
          <h2 className="eyebrow mb-4">
            O elektrodi za varenje
          </h2>
          <div className="prose max-w-none text-ink-600">
```

- [ ] **Step 5: components/ProductActions.tsx — monohromno Podeli dugme**

OLD:
```tsx
            <button
                onClick={handleShare}
                title={copied ? 'Link kopiran!' : 'Podeli'}
                className={`
          inline-flex items-center justify-center gap-1.5 rounded-lg font-medium
          transition-all duration-200 border px-3 py-1.5 text-sm
          ${copied
                        ? 'bg-green-50 text-green-600 border-green-300'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-primary-50 hover:border-primary-400 hover:text-primary-700'
                    }
        `}
            >
```
NEW:
```tsx
            <button
                onClick={handleShare}
                title={copied ? 'Link kopiran!' : 'Podeli'}
                className={`
          inline-flex items-center justify-center gap-1.5 font-medium
          transition-colors duration-200 border px-3 min-h-[44px] text-[13px]
          ${copied
                        ? 'bg-ink-900 text-white border-ink-900'
                        : 'bg-white text-ink-900 border-ink-200 hover:border-ink-900'
                    }
        `}
            >
```
("Kopirano" potvrda menja zeleno stanje u inverzno crno — zeleni izuzetak važi samo za WhatsApp. `FavoriteButton`/`CompareButton` restilizuju druge grupe — ovde BEZ IZMENA.)

- [ ] **Step 6: components/ShareButtons.tsx — kvadratne 44px ikonice, WhatsApp zadržava zelenu**

Napomena: `ShareButtons` trenutno nije importovan ni u jednom fajlu (mrtav kod) — restilizuje se svejedno radi konzistentnosti, pošto je u obuhvatu speca.

Izmena 6a — etiketa:

OLD:
```tsx
            <span className="text-xs text-gray-500 mr-1">Podeli:</span>
```
NEW:
```tsx
            <span className="eyebrow mr-1">Podeli:</span>
```

Izmena 6b — WhatsApp (zelena OSTAJE, radius se uklanja, tap meta 44px):

OLD:
```tsx
                className="w-8 h-8 rounded-full bg-[#25D366] text-white flex items-center justify-center hover:opacity-80 transition-opacity"
```
NEW:
```tsx
                className="w-11 h-11 bg-[#25D366] text-white flex items-center justify-center hover:opacity-80 transition-opacity"
```

Izmena 6c — Viber (ljubičasta nije u izuzecima → monohrom, beli kvadrat sa hairline okvirom):

OLD:
```tsx
                className="w-8 h-8 rounded-full bg-[#7360F2] text-white flex items-center justify-center hover:opacity-80 transition-opacity"
```
NEW:
```tsx
                className="w-11 h-11 bg-white border border-ink-200 text-ink-900 flex items-center justify-center hover:border-ink-900 transition-colors"
```

Izmena 6d — Copy dugme + feedback klasa (zelena → inverzno crno):

OLD:
```tsx
                    if (btn) {
                        btn.classList.add('!bg-green-500');
                        setTimeout(() => btn.classList.remove('!bg-green-500'), 1000);
                    }
```
NEW:
```tsx
                    if (btn) {
                        btn.classList.add('!bg-ink-900', '!text-white');
                        setTimeout(() => btn.classList.remove('!bg-ink-900', '!text-white'), 1000);
                    }
```

OLD:
```tsx
                className="w-8 h-8 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center hover:bg-gray-300 transition-all"
```
NEW:
```tsx
                className="w-11 h-11 bg-white border border-ink-200 text-ink-900 flex items-center justify-center hover:border-ink-900 transition-colors"
```

- [ ] **Step 7: components/ProductInquiryStickyCTA.tsx — crna traka bez senke**

OLD:
```tsx
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white/90 backdrop-blur-md border-t border-gray-100 shadow-[0_-8px_16px_rgba(0,0,0,0.08)] safe-area-pb">
      <div className="container py-3 px-4">
        <Link
          href={href}
          className="btn bg-primary-600 text-white hover:bg-primary-700 text-center text-base font-semibold w-full py-3 rounded-xl block"
        >
          Pošalji upit
        </Link>
      </div>
    </div>
  );
```
NEW:
```tsx
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-ink-900 safe-area-pb">
      <Link
        href={href}
        className="flex min-h-[52px] w-full items-center justify-center text-white text-[13px] font-medium hover:bg-ink-700 transition-colors"
      >
        Pošalji upit
      </Link>
    </div>
  );
```
(Cela traka je tap meta — 52px visine, bez backdrop-blur, senke i radiusa. Prefill logika href-a netaknuta.)

- [ ] **Step 8: components/InquiryButton.tsx — čisto crno dugme bez ikone**

OLD:
```tsx
      <button
        onClick={() => setIsModalOpen(true)}
        className="btn-primary w-full text-lg py-4"
      >
        <svg className="w-5 h-5 mr-2 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        Pošalji upit
      </button>
```
NEW:
```tsx
      <button
        onClick={() => setIsModalOpen(true)}
        className="btn-primary w-full min-h-[44px]"
      >
        Pošalji upit
      </button>
```
(`text-lg py-4` bi pregazio novi `.btn-primary` (13px/py-3) — uklanja se; dekorativna koverta-ikona ide u skladu sa galerijskim jezikom. `InquiryModal` restilizuje druga grupa.)

- [ ] **Step 9: Build provera**

Run: npm run build (u repou). Expected: uspesan build bez gresaka.

- [ ] **Step 10: Vizuelna provera**

Pokrenuti npm run dev i proveriti na 1440px i 390px:
- Tarkett/Gerflor LVT proizvod sa mnogo boja (npr. `/proizvodi/gerflor-creation-40-clic` ili bilo koja Creation kolekcija iz početne): split raspored — galerija levo na `paper` podlozi bez okvira, desna kolona sticky pri skrolu (1440px); eyebrow brend → naziv (regular) → kolekcija → cena kao mali sivi tekst (bez roza/amber kutija); swatchevi kvadratni, aktivan ima crni `border-2`; promena boje i dalje radi fade + menja `?color=` u URL-u; "Pogledaj sve" otvara modal bez radiusa; CTA "Pošaljite upit" crno pune širine; link proizvođača kao podvučeni tekst.
- Linoleum proizvod sa welding podatkom (npr. DLW kolekcija): red "Dodatna oprema" kao hairline spec red, bez plave ikone.
- Romus/Techem proizvod bez boja (ne-color layout): slika na `paper`, sticky info kolona, cena "Cena na upit" kao čist tekst.
- `/proizvodi/welding-rod/<ref>` (uzeti ref sa linoleum stranice): hairline spec redovi, kartice boja bez senki sa eyebrow kolekcijom.
- 390px: sticky crna traka "Pošalji upit" na dnu, bez senke; tap mete (strelice galerije, Podeli) min 44px; skeleton `paper` pločice pri učitavanju boja umesto spinera.
- Provera da nigde nema `rounded-*`, `shadow-*`, `primary-*` roza ni plavih hex boja na ovim stranicama.

- [ ] **Step 11: Commit**

```bash
git add "app/proizvodi/[slug]/page.tsx" "app/proizvodi/welding-rod/[ref]/page.tsx" components/ProductColorSelector.tsx components/ColorGrid.tsx components/ProductActions.tsx components/ShareButtons.tsx components/ProductInquiryStickyCTA.tsx components/InquiryButton.tsx && git commit -m "style: stranica proizvoda u galerijski monohrom — split galerija + sticky info kolona"
```

---

### Task 6: Stranica proizvoda — sekcije umesto tabova i preporuke

**Files:**
- Modify: components/ProductDetailsTabs.tsx
- Modify: components/ProductCharacteristics.tsx
- Modify: components/ProductDescriptionWithCharacteristics.tsx
- Modify: components/ProductDocuments.tsx
- Modify: components/CertificationBadges.tsx
- Modify: components/EcoFeatures.tsx
- Modify: components/ProductBenefits.tsx
- Modify: components/RelatedProducts.tsx
- Modify: components/RecommendedAccessories.tsx
- Modify: components/RecentlyViewed.tsx

**Napomena o framer-motion (nalaz, ne menja se u ovom tasku):** `framer-motion` se u celom source stablu (`app/`, `components/`, `lib/`) koristi ISKLJUČIVO u `components/ProductDetailsTabs.tsx`. Posle ovog taska paket postaje neiskorišćen i može se ukloniti iz `package.json` u zasebnom cleanup tasku — ovde se NE dira `package.json`.

**Napomena o page.tsx:** `app/proizvodi/[slug]/page.tsx` gradi `tabs` niz (id: `description`, `specs`, `eco`, `docs`) i prosleđuje ga u `ProductDetailsTabs` — prazne sekcije se i dalje ne renderuju jer se tab uopšte ne push-uje u niz kad nema sadržaja (postojeći uslovi u page.tsx ostaju netaknuti). Wrapper kartice u page.tsx (`sharedCertsAndEco` gradient kartica, `sharedDocs` `bg-white rounded-2xl shadow-lg`) pripadaju drugom tasku i ovde se ne diraju.

- [ ] **Step 1: ProductDetailsTabs.tsx — kompletna prepravka: vertikalne sekcije umesto pill-tabova**

Komponenta gubi `'use client'`, `useState`, ceo `framer-motion` import (`motion`, `AnimatePresence`) i mapu `tabIcons`. Interfejs `TabListProps` (props `tabs: { id, label, content }[]`) ostaje identičan, pa page.tsx ne zahteva izmene. Sve sekcije su vidljive odjednom, svaka sa `.eyebrow` naslovom i `border-t border-ink-200` separatorom.

Import linije koje se brišu (sadržane u kompletnoj zameni ispod):
```tsx
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
```

NOVA VERZIJA FAJLA (`components/ProductDetailsTabs.tsx`):
```tsx
interface TabListProps {
    tabs: {
        id: string;
        label: string;
        content: React.ReactNode;
    }[];
}

export default function ProductDetailsTabs({ tabs }: TabListProps) {
    if (!tabs || tabs.length === 0) return null;

    return (
        <div className="w-full mt-10 mb-16">
            {tabs.map((tab) => (
                <section
                    key={tab.id}
                    aria-label={tab.label}
                    className="border-t border-ink-200 py-10 md:py-12"
                >
                    <h2 className="eyebrow mb-6">{tab.label}</h2>
                    {tab.content}
                </section>
            ))}
        </div>
    );
}
```

- [ ] **Step 2: ProductCharacteristics.tsx — redovi specifikacija po pravilu 8 (dva identična render bloka)**

Logika (fetch, merge, uslovi praznog renderovanja) se ne dira. Menjaju se samo dva return bloka — pazi: blokovi su tekstualno skoro identični, razlikuje ih bazna indentacija (prvi je uvučen dodatna 2 mesta jer je unutar `if`-a), pa su OLD stringovi jedinstveni. Naslov (`title` prop — trenutno se iz page.tsx prosleđuje `""`, pa se ne renderuje) postaje `.eyebrow`. Welding link gubi `primary-*` boje.

Izmena 2a (prvi return blok, unutar `if (selectedSpecs && selectedSpecs.length > 0)`):

OLD:
```tsx
    return (
      <div className="w-full">
        {title && <h2 className="text-2xl font-bold text-gray-900 mb-6">{title}</h2>}
        <dl className="divide-y divide-gray-200">
          {finalSpecs.map((spec, index) => {
            const isWeldingSpec = /(elektrod|varila|welding|vrpca)/i.test(spec.label);
            const weldingHref = isWeldingSpec ? getWeldingAccessoryHref(spec.value) : null;

            return (
              <div key={`${spec.label}-${index}`} className="flex items-center justify-between py-3.5">
                <dt className="text-sm font-medium text-gray-500">{spec.label}</dt>
                <dd className="text-sm font-semibold text-gray-900 text-right">
                  {weldingHref ? (
                    <Link
                      href={weldingHref}
                      className="text-primary-600 hover:text-primary-700 underline underline-offset-4"
                    >
                      {spec.value}
                    </Link>
                  ) : (
                    spec.value
                  )}
                </dd>
              </div>
            );
          })}
        </dl>
      </div>
    );
  }
```
NEW:
```tsx
    return (
      <div className="w-full">
        {title && <h2 className="eyebrow mb-6">{title}</h2>}
        <dl>
          {finalSpecs.map((spec, index) => {
            const isWeldingSpec = /(elektrod|varila|welding|vrpca)/i.test(spec.label);
            const weldingHref = isWeldingSpec ? getWeldingAccessoryHref(spec.value) : null;

            return (
              <div key={`${spec.label}-${index}`} className="flex items-center justify-between gap-4 border-b border-ink-200 py-[9px] text-[13px]">
                <dt className="text-ink-500">{spec.label}</dt>
                <dd className="text-ink-900 text-right">
                  {weldingHref ? (
                    <Link
                      href={weldingHref}
                      className="text-ink-900 underline underline-offset-4 hover:opacity-60"
                    >
                      {spec.value}
                    </Link>
                  ) : (
                    spec.value
                  )}
                </dd>
              </div>
            );
          })}
        </dl>
      </div>
    );
  }
```

Izmena 2b (drugi return blok, na dnu komponente — plića indentacija):

OLD:
```tsx
  return (
    <div className="w-full">
      {title && <h2 className="text-2xl font-bold text-gray-900 mb-6">{title}</h2>}
      <dl className="divide-y divide-gray-200">
        {finalSpecs.map((spec, index) => {
          const isWeldingSpec = /(elektrod|varila|welding|vrpca)/i.test(spec.label);
          const weldingHref = isWeldingSpec ? getWeldingAccessoryHref(spec.value) : null;

          return (
            <div key={`${spec.label}-${index}`} className="flex items-center justify-between py-3.5">
              <dt className="text-sm font-medium text-gray-500">{spec.label}</dt>
              <dd className="text-sm font-semibold text-gray-900 text-right">
                {weldingHref ? (
                  <Link
                    href={weldingHref}
                    className="text-primary-600 hover:text-primary-700 underline underline-offset-4"
                  >
                    {spec.value}
                  </Link>
                ) : (
                  spec.value
                )}
              </dd>
            </div>
          );
        })}
      </dl>
    </div>
  );
}
```
NEW:
```tsx
  return (
    <div className="w-full">
      {title && <h2 className="eyebrow mb-6">{title}</h2>}
      <dl>
        {finalSpecs.map((spec, index) => {
          const isWeldingSpec = /(elektrod|varila|welding|vrpca)/i.test(spec.label);
          const weldingHref = isWeldingSpec ? getWeldingAccessoryHref(spec.value) : null;

          return (
            <div key={`${spec.label}-${index}`} className="flex items-center justify-between gap-4 border-b border-ink-200 py-[9px] text-[13px]">
              <dt className="text-ink-500">{spec.label}</dt>
              <dd className="text-ink-900 text-right">
                {weldingHref ? (
                  <Link
                    href={weldingHref}
                    className="text-ink-900 underline underline-offset-4 hover:opacity-60"
                  >
                    {spec.value}
                  </Link>
                ) : (
                  spec.value
                )}
              </dd>
            </div>
          );
        })}
      </dl>
    </div>
  );
}
```

- [ ] **Step 3: ProductDescriptionWithCharacteristics.tsx — kompletna prepravka: bez kartica, redovi karakteristika**

Unutrašnji `<h2>Opis proizvoda</h2>` se UKLANJA jer sekcijski wrapper iz Step 1 sada renderuje eyebrow "Opis proizvoda" (komponenta se koristi isključivo unutar description taba u page.tsx — provereno grep-om). Kartice sa `rounded-xl`/senkama postaju hairline redovi; helper `getIconForCharacteristic` i ikonice ostaju, ali monohromne. Naslov "Ključne karakteristike" postaje `.eyebrow`.

NOVA VERZIJA FAJLA (`components/ProductDescriptionWithCharacteristics.tsx`):
```tsx
'use client';

import { FaCheck, FaWater, FaVolumeMute, FaShieldAlt, FaLeaf, FaTools, FaTemperatureHigh, FaRegStar } from 'react-icons/fa';
import { MdCleaningServices, MdTouchApp } from 'react-icons/md';

interface ProductDescriptionWithCharacteristicsProps {
  description: string;
  /** Sekcija "Ključne karakteristike" – uvek prikazana ispod opisa */
  characteristicsSection?: { title: string; items: string[] };
}

export default function ProductDescriptionWithCharacteristics({
  description,
  characteristicsSection,
}: ProductDescriptionWithCharacteristicsProps) {
  return (
    <div className="space-y-10">
      <div className="max-w-3xl text-[15px] md:text-base text-ink-600 leading-relaxed whitespace-pre-line">
        {description}
      </div>

      {characteristicsSection && characteristicsSection.items.length > 0 && (
        <div>
          <h3 className="eyebrow mb-4">
            {characteristicsSection.title}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10">
            {characteristicsSection.items.map((item, index) => {
              const Icon = getIconForCharacteristic(item);
              return (
                <div
                  key={index}
                  className="flex items-start gap-3 border-b border-ink-200 py-[9px]"
                >
                  <Icon className="w-4 h-4 mt-0.5 text-ink-500 flex-shrink-0" />
                  <span className="text-[13px] text-ink-900 leading-relaxed">
                    {item}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// Helper to pick icons based on text content
function getIconForCharacteristic(text: string) {
  const t = text.toLowerCase();
  if (t.includes('vod') || t.includes('vlag')) return FaWater;
  if (t.includes('zvuk') || t.includes('akust')) return FaVolumeMute;
  if (t.includes('otpor') || t.includes('habanj') || t.includes('ogreb')) return FaShieldAlt;
  if (t.includes('eko') || t.includes('recikl') || t.includes('zdrav') || t.includes('prirod')) return FaLeaf;
  if (t.includes('postav') || t.includes('ugrad') || t.includes('klik')) return FaTools;
  if (t.includes('topl') || t.includes('podno')) return FaTemperatureHigh;
  if (t.includes('održav') || t.includes('čišć')) return MdCleaningServices;
  if (t.includes('udob') || t.includes('komfor')) return MdTouchApp;
  if (t.includes('dizajn') || t.includes('izgled')) return FaRegStar;

  return FaCheck;
}
```

- [ ] **Step 4: ProductDocuments.tsx — kompletna prepravka JSX-a: redovi dokumenata po pravilu 8, monohromni PDF preview**

Sva logika (normalizacija URL-ova, fetch iz `/api/color-data`, documents index, `activeDocument` state za inline PDF preview) ostaje IDENTIČNA — menja se samo render. Unutrašnji `<h3>Tehnička dokumentacija</h3>` (sa crvenom ikonom) se UKLANJA jer sekcijski wrapper iz Step 1 renderuje eyebrow "Dokumentacija" (komponenta se koristi isključivo unutar docs taba u page.tsx — provereno grep-om). Crvene boje, radiusi i senke se zamenjuju ink tokenima; "Preuzmi" dugmad postaju `.btn-primary`. Lista dokumenata: red sa ikonom fajla + naziv `text-[13px] text-ink-900` + ikona preuzimanja desno, `border-b border-ink-200 py-[9px]`, `min-h-[44px]` tap meta. Klik na red i dalje otvara inline preview (postojeća logika).

NOVA VERZIJA FAJLA (`components/ProductDocuments.tsx`):
```tsx
'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

interface Document {
    title: string;
    url: string;
}

interface ProductDocumentsProps {
    initialDocuments?: Document[];
    categoryId: string;
    collectionSlug?: string;
}

interface DocumentsSourceConfig {
    categoryKey: string;
    dataUrl: string;
    preferIndex: boolean;
}

function normalizeDocumentUrl(url: string) {
    const value = String(url || '').trim();
    if (!value) return '';
    if (!/media\.tarkett-image\.com/i.test(value) || !/\.pdf(?:\?|$)/i.test(value)) {
        return value;
    }

    return value
        .replace('://media.tarkett-image.com/large-high/', '://media.tarkett-image.com/docs/')
        .replace('://media.tarkett-image.com/large/', '://media.tarkett-image.com/docs/')
        .replace('://media.tarkett-image.com/medium/', '://media.tarkett-image.com/docs/');
}

function normalizeDocuments(documents: Document[] = []): Document[] {
    const seen = new Set<string>();

    return documents.reduce<Document[]>((result, document) => {
        const url = normalizeDocumentUrl(document?.url || '');
        if (!url || seen.has(url)) {
            return result;
        }

        seen.add(url);
        result.push({
            title: String(document?.title || '').trim() || 'Dokument',
            url,
        });
        return result;
    }, []);
}

function getDocumentsSourceConfig(categoryId: string): DocumentsSourceConfig | null {
    if (categoryId === '1') {
        return { categoryKey: 'laminat', dataUrl: '/data/tarkett_documents_index.json', preferIndex: true };
    }

    if (categoryId === '3') {
        return { categoryKey: 'parket', dataUrl: '/data/tarkett_documents_index.json', preferIndex: true };
    }

    const categoryKey = categoryId === '6'
        ? 'lvt'
        : categoryId === '4'
            ? 'carpet'
            : categoryId === '7'
                ? 'linoleum'
                : categoryId === '2'
                    ? 'vinil'
                    : categoryId === '8'
                        ? 'elektroprovodni'
                        : categoryId === '9'
                            ? 'industrijske-ploce'
                            : categoryId === '10'
                                ? 'sport'
                                : '';

    if (!categoryKey) {
        return null;
    }

    return { categoryKey, dataUrl: '/data/documents_index.json', preferIndex: false };
}

export default function ProductDocuments({ initialDocuments = [], categoryId, collectionSlug }: ProductDocumentsProps) {
    const searchParams = useSearchParams();
    const [documents, setDocuments] = useState<Document[]>(normalizeDocuments(initialDocuments));
    const [activeDocument, setActiveDocument] = useState<Document | null>(null);
    const colorSlug = searchParams.get('color');

    useEffect(() => {
        let isActive = true;

        const loadDocuments = async () => {
            let nextDocuments = normalizeDocuments(initialDocuments);

            if (colorSlug) {
                try {
                    const res = await fetch(`/api/color-data?color=${encodeURIComponent(colorSlug)}&categoryId=${encodeURIComponent(categoryId)}`);
                    if (res.ok) {
                        const data = await res.json();
                        if (data.documents && data.documents.length > 0) {
                            nextDocuments = normalizeDocuments(data.documents);
                        }
                    }
                } catch {
                    // Ignore fetch errors, fall through to collection-level docs
                }
            }

            const sourceConfig = getDocumentsSourceConfig(categoryId);

            if (collectionSlug && sourceConfig) {
                try {
                    const response = await fetch(sourceConfig.dataUrl, { cache: 'no-store' });
                    if (response.ok) {
                        const index = await response.json();
                        const normalizedCollectionSlug = collectionSlug
                            .replace(/^gerflor-/, '')
                            .replace(/^tarkett-/, '')
                            .replace(/^wolflor-/, '');

                        const docsFromIndex = index?.[sourceConfig.categoryKey]?.[normalizedCollectionSlug]
                            ? normalizeDocuments(index[sourceConfig.categoryKey][normalizedCollectionSlug])
                            : [];

                        const shouldUseIndex = docsFromIndex.length > 0 && (sourceConfig.preferIndex || !nextDocuments || nextDocuments.length === 0);

                        if (shouldUseIndex) {
                            nextDocuments = docsFromIndex;
                            if (!sourceConfig.preferIndex && colorSlug && nextDocuments.length > 3) {
                                nextDocuments = nextDocuments.slice(0, 3);
                            }
                        }
                    }
                } catch (error) {
                    // Ignore index load errors
                }
            }

            if (isActive) {
                setDocuments(normalizeDocuments(nextDocuments));
            }
        };

        loadDocuments();
        return () => {
            isActive = false;
        };
    }, [colorSlug, categoryId, initialDocuments, collectionSlug]);

    if (!documents || documents.length === 0) {
        return null;
    }

    return (
        <div className="w-full">
            {activeDocument ? (
                <div className="flex flex-col border border-ink-200 bg-white overflow-hidden mb-8">
                    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-ink-200 bg-white p-4">
                        <button
                            onClick={() => setActiveDocument(null)}
                            className="flex min-h-[44px] items-center gap-2 text-[13px] text-ink-600 hover:text-ink-900 transition-colors cursor-pointer"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                            Nazad na listu
                        </button>
                        <h4 className="text-[13px] font-medium text-ink-900 truncate flex-1 block max-w-full lg:max-w-md text-center">
                            {activeDocument.title}
                        </h4>
                        <div className="flex items-center gap-2 ml-auto">
                            <a
                                href={activeDocument.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn-primary inline-flex items-center gap-2"
                                title="Otvori u novom tabu"
                            >
                                Preuzmi
                            </a>
                        </div>
                    </div>
                    <div className="w-full bg-paper" style={{ height: '75vh', minHeight: '600px' }}>
                        <object
                            data={activeDocument.url}
                            type="application/pdf"
                            className="w-full h-full"
                        >
                            <div className="flex flex-col items-center justify-center p-12 text-center h-full">
                                <svg className="w-12 h-12 text-ink-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                <p className="text-ink-500 text-[13px] mb-6">Vaš pretraživač ne podržava ugrađeni PDF pregled.</p>
                                <a
                                    href={activeDocument.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn-primary inline-flex items-center gap-2"
                                >
                                    Preuzmi PDF direktno
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                </a>
                            </div>
                        </object>
                    </div>
                </div>
            ) : (
                <div className="max-w-3xl">
                    {documents.map((doc, index) => (
                        <button
                            key={`${doc.url}-${index}`}
                            onClick={() => setActiveDocument(doc)}
                            className="group flex w-full min-h-[44px] items-center gap-3 border-b border-ink-200 py-[9px] text-left cursor-pointer"
                        >
                            <svg className="w-4 h-4 text-ink-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                            </svg>
                            <span className="flex-1 min-w-0 truncate text-[13px] text-ink-900">{doc.title}</span>
                            <svg className="w-4 h-4 text-ink-500 transition-colors group-hover:text-ink-900 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
```

- [ ] **Step 5: CertificationBadges.tsx — kompletna prepravka: hairline čipovi bez emoji ikona**

Emoji ikone (🌿, 🏅, ♻️...) su kolorne i ispadaju iz monohromnog jezika — uklanjaju se zajedno sa mapom `certIcons`. Pilule postaju kvadratni čipovi sa hairline okvirom, bez radiusa i senki.

NOVA VERZIJA FAJLA (`components/CertificationBadges.tsx`):
```tsx
interface CertificationBadgesProps {
  certifications: string[];
}

export default function CertificationBadges({ certifications }: CertificationBadgesProps) {
  if (!certifications || certifications.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {certifications.map((cert) => (
        <span
          key={cert}
          className="inline-flex items-center border border-ink-200 px-3 py-1.5 text-[12px] text-ink-900 transition-colors hover:border-ink-900"
          title={cert}
        >
          {cert}
        </span>
      ))}
    </div>
  );
}
```

- [ ] **Step 6: EcoFeatures.tsx — kompletna prepravka: monohromna lista bez kartice**

Gradient kartica, emerald boje, radiusi i senke se uklanjaju. Naslov postaje `.eyebrow`, kvačice monohromne. Logika (`underfloorHeating` push) netaknuta. Spoljnu karticu oko ove komponente i dalje renderuje page.tsx (`sharedCertsAndEco`, drugi task).

NOVA VERZIJA FAJLA (`components/EcoFeatures.tsx`):
```tsx
interface EcoFeaturesProps {
  features: string[];
  underfloorHeating?: boolean;
}

export default function EcoFeatures({ features, underfloorHeating }: EcoFeaturesProps) {
  if ((!features || features.length === 0) && !underfloorHeating) return null;

  const allFeatures = [...features];
  if (underfloorHeating) {
    allFeatures.push("Kompatibilno sa podnim grejanjem");
  }

  return (
    <div className="h-full">
      <h3 className="eyebrow mb-6">Ekološke karakteristike</h3>
      <ul className="space-y-3">
        {allFeatures.map((feature, index) => (
          <li key={index} className="flex items-start gap-3">
            <svg className="w-4 h-4 mt-0.5 text-ink-900 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-[13px] leading-relaxed text-ink-900">{feature}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

- [ ] **Step 7: ProductBenefits.tsx — kompletna prepravka: monohromna lista sa border-t separatorom**

Zelena gradient kartica se uklanja; naslov "Prednosti" postaje `.eyebrow` sa `border-t border-ink-200` separatorom (komponenta stoji samostalno ispod sekcija u page.tsx).

NOVA VERZIJA FAJLA (`components/ProductBenefits.tsx`):
```tsx
'use client';

interface ProductBenefitsProps {
    benefits: string[];
}

export default function ProductBenefits({ benefits }: ProductBenefitsProps) {
    if (!benefits || benefits.length === 0) return null;

    return (
        <div className="border-t border-ink-200 pt-8">
            <h3 className="eyebrow mb-6">Prednosti</h3>
            <ul className="space-y-3">
                {benefits.map((benefit, index) => (
                    <li key={index} className="flex items-start gap-3">
                        <svg className="w-4 h-4 text-ink-900 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-[15px] text-ink-600 leading-relaxed">{benefit}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
}
```

- [ ] **Step 8: RecommendedAccessories.tsx — kompletna prepravka: eyebrow naslov + galerijske mini-kartice**

Bela kartica sa `rounded-2xl shadow-lg` postaje sekcija sa `border-t border-ink-200`. Naslov sa ikonom postaje `.eyebrow`. Mini-kartice pribora: slika na `bg-paper` bez okvira/radiusa, hover `scale-[1.03] duration-700`, tip pribora kao `.eyebrow`, naziv `text-[15px] font-normal`. Logika (`typeSpec`, `primaryImage`, linkovi) netaknuta.

NOVA VERZIJA FAJLA (`components/RecommendedAccessories.tsx`):
```tsx
import Link from 'next/link';
import ProductImage from '@/components/ProductImage';

interface AccessoryProduct {
    slug: string;
    name: string;
    shortDescription: string;
    images: { url: string; alt: string }[];
    specs: { key: string; value: string }[];
}

interface RecommendedAccessoriesProps {
    accessories: AccessoryProduct[];
}

export default function RecommendedAccessories({ accessories }: RecommendedAccessoriesProps) {
    if (!accessories || accessories.length === 0) return null;

    return (
        <div className="border-t border-ink-200 pt-8">
            <h3 className="eyebrow mb-6">Preporučeni pribor</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10">
                {accessories.map((acc) => {
                    const typeSpec = acc.specs?.find(s => s.key === 'type');
                    const primaryImage = acc.images?.[0];

                    return (
                        <Link
                            key={acc.slug}
                            href={`/proizvodi/${acc.slug}`}
                            className="group flex flex-col"
                        >
                            {/* Image */}
                            <div className="relative aspect-[4/3] bg-paper overflow-hidden">
                                {primaryImage ? (
                                    <ProductImage
                                        sources={acc.images}
                                        alt={primaryImage.alt || acc.name}
                                        className="object-cover group-hover:scale-[1.03] transition-transform duration-700"
                                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-ink-500 text-sm">
                                        Bez slike
                                    </div>
                                )}
                            </div>

                            {/* Info */}
                            <div className="pt-3 flex-1 flex flex-col">
                                {typeSpec && (
                                    <span className="eyebrow mb-1">
                                        {typeSpec.value}
                                    </span>
                                )}
                                <h4 className="text-[15px] font-normal text-ink-900 line-clamp-2">
                                    {acc.name}
                                </h4>
                                <p className="text-[13px] text-ink-500 mt-1 line-clamp-2">
                                    {acc.shortDescription}
                                </p>
                            </div>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
```

- [ ] **Step 9: RelatedProducts.tsx — eyebrow + naslov sekcije, bela pozadina**

Logika fetch-ovanja/filtriranja se NE dira — samo wrapper. Napomena (posle fix-a Taska 4): `ProductCard` poziv u ovom fajlu sada prosleđuje `sizes` prop kroz više linija — to NE dirati, OLD snippet wrappera i dalje važi.

OLD:
```tsx
        <section className="py-12 bg-gray-50 border-t border-gray-100">
            <div className="container">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">
                    Slični proizvodi
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
```
NEW:
```tsx
        <section className="py-16 md:py-20 bg-white border-t border-ink-200">
            <div className="container">
                <p className="eyebrow mb-3">Iz iste kategorije</p>
                <h2 className="text-xl md:text-2xl font-normal text-ink-900 mb-10">
                    Slični proizvodi
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-10">
```

- [ ] **Step 10: RecentlyViewed.tsx — eyebrow + naslov sekcije, monohromne mini-kartice**

Logika (`localStorage`, `addToRecentlyViewed` helper, horizontalni scroll, deking `object-left` izuzetak) se NE dira.

Izmena 10a (zaglavlje sekcije):

OLD:
```tsx
        <section className="py-12 bg-white border-t border-gray-100">
            <div className="container">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                    Nedavno pregledano
                </h2>
```
NEW:
```tsx
        <section className="py-16 bg-white border-t border-ink-200">
            <div className="container">
                <p className="eyebrow mb-3">Istorija pregleda</p>
                <h2 className="text-xl md:text-2xl font-normal text-ink-900 mb-8">
                    Nedavno pregledano
                </h2>
```

Izmena 10b (mini-kartica):

OLD:
```tsx
                                <div className="aspect-square relative rounded-lg overflow-hidden bg-gray-100 mb-2 border border-gray-200">
                                    <ProductImage
                                        src={product.image}
                                        alt={product.name}
                                        sources={product.imageCandidates}
                                        sizes="192px"
                                        className={`group-hover:scale-105 transition-transform duration-300${product.image.includes('/deking/') ? ' object-left' : ''}`}
                                    />
                                </div>
                                <h3 className="text-sm font-medium text-gray-900 truncate group-hover:text-primary-600 transition-colors">
                                    {product.name}
                                </h3>
                                {product.price && (
                                    <p className="text-xs text-gray-500 font-semibold mt-1">
                                        {product.price.toLocaleString('sr-RS')} RSD
                                    </p>
                                )}
```
NEW:
```tsx
                                <div className="aspect-square relative overflow-hidden bg-paper mb-3">
                                    <ProductImage
                                        src={product.image}
                                        alt={product.name}
                                        sources={product.imageCandidates}
                                        sizes="192px"
                                        className={`group-hover:scale-[1.03] transition-transform duration-700${product.image.includes('/deking/') ? ' object-left' : ''}`}
                                    />
                                </div>
                                <h3 className="text-sm font-normal text-ink-900 truncate">
                                    {product.name}
                                </h3>
                                {product.price && (
                                    <p className="text-[13px] text-ink-500 mt-1">
                                        {product.price.toLocaleString('sr-RS')} RSD
                                    </p>
                                )}
```

- [ ] **Step 11: Build provera**

Run: npm run build (u repou). Expected: uspesan build bez gresaka.

- [ ] **Step 12: Vizuelna provera**

Pokrenuti npm run dev i proveriti stranicu proizvoda (npr. otvoriti bilo koji proizvod iz /kategorije/laminat i jedan iz /kategorije/lvt-podovi, plus proizvod sa priborom/benefitima ako postoji) na 1440px i 390px:
- Tabovi/pilule i animacije prelaza su nestali — Opis, Tehničke specifikacije, Sertifikati i Dokumentacija se vide odjednom kao vertikalne sekcije sa eyebrow naslovima i hairline border-t separatorima; sekcije bez sadržaja se ne pojavljuju.
- Redovi specifikacija: ključ sivo (ink-500) levo, vrednost crno desno, hairline linija ispod svakog reda; promena boje preko ?color= parametra i dalje učitava specifične specifikacije.
- Dokumenti: redovi sa ikonom fajla i ikonom preuzimanja, klik otvara inline PDF preview, "Nazad na listu" i crno "Preuzmi" dugme rade; tap mete na 390px minimum 44px.
- Nigde nema rounded uglova, senki, roza/zelenih/crvenih/plavih akcenata (osim WhatsApp dugmeta) niti font-bold naslova.
- "Slični proizvodi" i "Nedavno pregledano" imaju eyebrow + naslov font-normal na beloj pozadini; slike preporuka na bg-paper podlozi sa sporim hover zoom-om.

- [ ] **Step 13: Commit**

```bash
git add components/ProductDetailsTabs.tsx components/ProductCharacteristics.tsx components/ProductDescriptionWithCharacteristics.tsx components/ProductDocuments.tsx components/CertificationBadges.tsx components/EcoFeatures.tsx components/ProductBenefits.tsx components/RelatedProducts.tsx components/RecommendedAccessories.tsx components/RecentlyViewed.tsx && git commit -m "style: stranica proizvoda - vertikalne sekcije umesto tabova, monohromne specifikacije, dokumenti i preporuke"
```

---

### Task 7: Sekundarne stranice — omiljeni, uporedi, upiti, greske

**Files:**
- Modify: app/omiljeni/FavoritesPageClient.tsx
- Modify: app/uporedi/ComparePageClient.tsx
- Modify: components/CompareBar.tsx
- Modify: app/upiti/page.tsx
- Modify: components/ContactForm.tsx
- Modify: components/InquiryModal.tsx
- Modify: components/FlooringCalculator.tsx
- Modify: app/not-found.tsx
- Modify: app/error.tsx
- Modify: app/global-error.tsx

BEZ IZMENA: `app/omiljeni/page.tsx` i `app/uporedi/page.tsx` — sadrže samo metadata i render klijentske komponente, nema UI klasa za menjanje.

Napomena: ovaj task pretpostavlja da je Task 1 već uveo `ink-*`/`paper` tokene, `tracking-label`, i nove `.container`, `.btn-primary`, `.btn-secondary`, `.btn-link`, `.input`, `.label`, `.eyebrow` helpere u `globals.css`. `.btn-outline` se u ovim fajlovima zamenjuje sa `.btn-secondary`. Crvene zvezdice (`text-red-500`) uz obavezna polja formi se zadržavaju (standardna tailwind red, dozvoljen izuzetak za forme).

- [ ] **Step 1: app/omiljeni/FavoritesPageClient.tsx — kompletna prepravka JSX-a (kartice po pravilu 7, skeleton po pravilu 11)**

Komponenta se suštinski prepravlja (>60% JSX-a). Logika (useFavorites, fetch, state) ostaje doslovno ista. NOVA VERZIJA FAJLA:

```tsx
'use client';

import { useFavorites } from '@/lib/context/FavoritesContext';
import { useEffect, useState } from 'react';
import { Product } from '@/types';
import Link from 'next/link';
import FavoriteButton from '@/components/FavoriteButton';
import ProductImage from '@/components/ProductImage';
import { getProductImageCandidates } from '@/lib/utils/product-images';

export default function FavoritesPageClient() {
    const { favoriteIds, count } = useFavorites();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    // Fetch product details for favorited IDs
    useEffect(() => {
        if (favoriteIds.length === 0) {
            setProducts([]);
            setLoading(false);
            return;
        }

        // Fetch each product by ID
        const fetchProducts = async () => {
            setLoading(true);
            try {
                const res = await fetch(`/api/products?ids=${favoriteIds.join(',')}`);
                if (res.ok) {
                    const data = await res.json();
                    setProducts(data.products || []);
                }
            } catch (err) {
                console.error('Failed to load favorites:', err);
            }
            setLoading(false);
        };

        fetchProducts();
    }, [favoriteIds]);

    if (!loading && count === 0) {
        return (
            <div className="container py-24 text-center">
                <p className="eyebrow mb-4">Omiljeni</p>
                <h1 className="text-3xl md:text-4xl font-normal text-ink-900 mb-4">Nemate omiljenih proizvoda</h1>
                <p className="text-ink-600 mb-10 max-w-md mx-auto">
                    Kliknite na srce na karticama proizvoda da ih dodate u omiljene.
                </p>
                <Link href="/" className="btn-primary inline-flex items-center min-h-[44px]">
                    Pogledaj proizvode
                </Link>
            </div>
        );
    }

    return (
        <div className="container py-12 md:py-16">
            <div className="mb-10">
                <p className="eyebrow mb-3">Omiljeni</p>
                <h1 className="text-3xl md:text-4xl font-normal text-ink-900">Omiljeni proizvodi</h1>
                <p className="text-[13px] text-ink-500 mt-2">{count} {count === 1 ? 'proizvod' : 'proizvoda'} sačuvano</p>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-10">
                    {Array.from({ length: count }).map((_, i) => (
                        <div key={i}>
                            <div className="aspect-[4/5] bg-paper animate-pulse" />
                            <div className="mt-4 space-y-2">
                                <div className="h-3 w-3/4 bg-paper animate-pulse" />
                                <div className="h-3 w-1/2 bg-paper animate-pulse" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-10">
                    {products.map(product => {
                        const imageCandidates = getProductImageCandidates(product, 'card').slice(0, 4);
                        const img = imageCandidates[0];
                        return (
                            <div key={product.id} className="relative group">
                                <div className="absolute top-3 right-3 z-10">
                                    <FavoriteButton productId={product.id} />
                                </div>
                                <Link href={`/proizvodi/${product.slug}`} className="block">
                                    <div className="relative aspect-[4/5] bg-paper overflow-hidden">
                                        {img?.url ? (
                                            <ProductImage
                                                sources={imageCandidates}
                                                alt={product.name}
                                                className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                                                sizes="(max-width: 768px) 100vw, 25vw"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <svg className="w-12 h-12 text-ink-200" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                            </div>
                                        )}
                                    </div>
                                    <div className="mt-4">
                                        <h3 className="text-[15px] md:text-base font-normal text-ink-900">{product.name}</h3>
                                        <p className="text-[13px] text-ink-500 line-clamp-2 mt-1">{product.shortDescription}</p>
                                        <p className="mt-2 text-[13px] text-ink-500">
                                            {product.price && product.price > 0
                                                ? `${product.price.toLocaleString('sr-RS')} RSD/${product.priceUnit}`
                                                : 'Cena na upit'}
                                        </p>
                                    </div>
                                </Link>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
```

Uklonjeno: `.card`/`.card-hover`, `rounded-*`, crveni krug sa srcem u praznom stanju, emoji ❤️, `font-bold` naslovi, `hover:text-primary-600`. `FavoriteButton` ostaje na istoj poziciji (komponenta se restilizuje u svom task-u).

- [ ] **Step 2: app/uporedi/ComparePageClient.tsx — kompletna prepravka (hairline tabela po pravilu 8)**

Komponenta se suštinski prepravlja (>60% JSX-a). Logika (allSpecKeys, specRows, formatSpecName) ostaje doslovno ista. NOVA VERZIJA FAJLA:

```tsx
'use client';

import { useCompare } from '@/lib/context/CompareContext';
import Link from 'next/link';
import ProductImage from '@/components/ProductImage';
import { getProductImageCandidates } from '@/lib/utils/product-images';

export default function ComparePageClient() {
    const { compareItems, removeFromCompare, clearAll } = useCompare();

    if (compareItems.length === 0) {
        return (
            <div className="container py-24 text-center">
                <p className="eyebrow mb-4">Poređenje</p>
                <h1 className="text-3xl md:text-4xl font-normal text-ink-900 mb-4">Nema proizvoda za poređenje</h1>
                <p className="text-ink-600 mb-10 max-w-md mx-auto">
                    Izaberite do 3 proizvoda za poređenje klikom na ikonu za poređenje na karticama proizvoda.
                </p>
                <Link href="/" className="btn-primary inline-flex items-center min-h-[44px]">
                    Pogledaj proizvode
                </Link>
            </div>
        );
    }

    // Collect all unique spec keys from all products
    const allSpecKeys = new Map<string, string>();
    compareItems.forEach(product => {
        product.specs?.forEach(spec => {
            if (!allSpecKeys.has(spec.key)) {
                allSpecKeys.set(spec.key, spec.label || spec.key);
            }
        });
    });

    const specRows = Array.from(allSpecKeys.keys());

    // Helper to format spec display name (used as fallback)
    const formatSpecName = (key: string) => {
        const label = allSpecKeys.get(key);
        if (label && label !== key) return label;

        return key
            .replace(/_/g, ' ')
            .replace(/\b\w/g, l => l.toUpperCase());
    };

    return (
        <div className="container py-12 md:py-16">
            {/* Header */}
            <div className="flex items-end justify-between gap-4 mb-10">
                <div>
                    <p className="eyebrow mb-3">Poređenje</p>
                    <h1 className="text-3xl md:text-4xl font-normal text-ink-900">Uporedi proizvode</h1>
                    <p className="text-[13px] text-ink-500 mt-2">{compareItems.length} proizvoda izabrano</p>
                </div>
                <button
                    onClick={clearAll}
                    className="btn-link min-h-[44px]"
                >
                    Obriši sve
                </button>
            </div>

            {/* Comparison table */}
            <div className="overflow-x-auto -mx-6 px-6 md:-mx-10 md:px-10">
                <table className="w-full border-collapse min-w-[600px]">
                    {/* Product header row */}
                    <thead>
                        <tr>
                            <th className="w-40 py-4 pr-4 border-b border-ink-200 bg-white text-left align-bottom sticky left-0 z-10">
                                <span className="eyebrow">Proizvod</span>
                            </th>
                            {compareItems.map(product => {
                                const imageCandidates = getProductImageCandidates(product, 'thumb').slice(0, 4);
                                const img = imageCandidates[0];
                                return (
                                    <th key={product.id} className="p-4 border-b border-ink-200 bg-white text-center align-top min-w-[200px]">
                                        <div className="space-y-3">
                                            <button
                                                onClick={() => removeFromCompare(product.id)}
                                                className="ml-auto flex items-center justify-center w-11 h-11 md:w-9 md:h-9 border border-ink-200 bg-white text-ink-500 hover:border-ink-900 hover:text-ink-900 transition-colors text-xs"
                                                title="Ukloni"
                                            >
                                                ✕
                                            </button>
                                            {img?.url && (
                                                <div className="relative w-32 aspect-[4/5] mx-auto overflow-hidden bg-paper">
                                                    <ProductImage
                                                        sources={imageCandidates}
                                                        alt={product.name}
                                                        className="object-cover"
                                                        sizes="128px"
                                                    />
                                                </div>
                                            )}
                                            <Link href={`/proizvodi/${product.slug}`} className="text-[15px] font-normal text-ink-900 hover:opacity-60 transition-opacity block">
                                                {product.name}
                                            </Link>
                                        </div>
                                    </th>
                                );
                            })}
                        </tr>
                    </thead>

                    <tbody>
                        {/* Price row */}
                        <tr>
                            <td className="py-[9px] pr-4 border-b border-ink-200 bg-white text-[13px] text-ink-500 sticky left-0 z-10">
                                Cena
                            </td>
                            {compareItems.map(product => (
                                <td key={product.id} className="px-4 py-[9px] border-b border-ink-200 text-center text-[13px] text-ink-500">
                                    {product.price && product.price > 0
                                        ? `${product.price.toLocaleString('sr-RS')} RSD/${product.priceUnit}`
                                        : 'Cena na upit'}
                                </td>
                            ))}
                        </tr>

                        {/* Stock row */}
                        <tr>
                            <td className="py-[9px] pr-4 border-b border-ink-200 bg-white text-[13px] text-ink-500 sticky left-0 z-10">
                                Dostupnost
                            </td>
                            {compareItems.map(product => (
                                <td key={product.id} className="px-4 py-[9px] border-b border-ink-200 text-center text-[13px]">
                                    <span className={product.inStock ? 'text-ink-900' : 'text-ink-500'}>
                                        {product.inStock ? 'Na stanju' : 'Nije na stanju'}
                                    </span>
                                </td>
                            ))}
                        </tr>

                        {/* Description row */}
                        <tr>
                            <td className="py-[9px] pr-4 border-b border-ink-200 bg-white text-[13px] text-ink-500 align-top sticky left-0 z-10">
                                Opis
                            </td>
                            {compareItems.map(product => (
                                <td key={product.id} className="px-4 py-[9px] border-b border-ink-200 text-[13px] text-ink-900">
                                    {product.shortDescription || '—'}
                                </td>
                            ))}
                        </tr>

                        {/* Spec rows */}
                        {specRows.map(specKey => (
                            <tr key={specKey}>
                                <td className="py-[9px] pr-4 border-b border-ink-200 bg-white text-[13px] text-ink-500 sticky left-0 z-10">
                                    {formatSpecName(specKey)}
                                </td>
                                {compareItems.map(product => {
                                    const spec = product.specs?.find(s => s.key === specKey);
                                    return (
                                        <td key={product.id} className="px-4 py-[9px] border-b border-ink-200 text-[13px] text-ink-900 text-center">
                                            {spec?.value || '—'}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}

                        {/* CTA row */}
                        <tr>
                            <td className="py-4 pr-4 bg-white sticky left-0 z-10"></td>
                            {compareItems.map(product => (
                                <td key={product.id} className="px-4 py-6 text-center">
                                    <Link
                                        href={`/proizvodi/${product.slug}`}
                                        className="btn-secondary inline-flex items-center justify-center min-h-[44px]"
                                    >
                                        Pogledaj detalje
                                    </Link>
                                </td>
                            ))}
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
}
```

Uklonjeno: vertikalne `border border-gray-200` ivice, zebra `bg-gray-50/50`, `rounded-full` ✕ dugme (zamena: beli kvadrat sa hairline okvirom), zelena/crvena tačka dostupnosti (monohrom tekst), `font-bold`/`font-semibold`, `text-primary-600` cena (sada pravilo 6). Sticky prva kolona zadržana (`bg-white` da pokrije sadržaj pri skrolu). Negativne margine overflow kontejnera usklađene sa novim `.container` paddingom (px-6/md:px-10).

- [ ] **Step 3: components/CompareBar.tsx — restilizacija (bg-white, border-t hairline, bez senke)**

Logika i struktura ostaju; samo klase. Parovi izmena:

OLD:
```tsx
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t-2 border-primary-500 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] animate-slideUp">
            <div className="max-w-7xl mx-auto px-4 py-3">
```
NEW:
```tsx
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-ink-200">
            <div className="container py-3">
```

OLD:
```tsx
                        <span className="text-sm font-semibold text-gray-700 whitespace-nowrap hidden sm:block">
                            Poređenje ({compareItems.length}/3):
                        </span>
```
NEW:
```tsx
                        <span className="eyebrow whitespace-nowrap hidden sm:block">
                            Poređenje ({compareItems.length}/3)
                        </span>
```

OLD:
```tsx
                                    <div key={product.id} className="relative flex items-center gap-2 bg-gray-50 rounded-lg px-2 py-1.5 min-w-0 flex-shrink-0">
                                        {img && (
                                            <div className="relative w-8 h-8 rounded overflow-hidden flex-shrink-0">
```
NEW:
```tsx
                                    <div key={product.id} className="relative flex items-center gap-2 border border-ink-200 bg-white px-2 py-1.5 min-w-0 flex-shrink-0">
                                        {img && (
                                            <div className="relative w-8 h-8 overflow-hidden flex-shrink-0 bg-paper">
```

OLD:
```tsx
                                        <span className="text-xs font-medium text-gray-700 truncate max-w-[100px]" title={formattedName}>
                                            {formattedName}
                                        </span>
                                        <button
                                            onClick={() => removeFromCompare(product.id)}
                                            className="flex-shrink-0 w-5 h-5 rounded-full bg-gray-200 hover:bg-red-100 text-gray-500 hover:text-red-600 flex items-center justify-center transition-colors"
                                            title="Ukloni"
                                        >
```
NEW:
```tsx
                                        <span className="text-xs text-ink-900 truncate max-w-[100px]" title={formattedName}>
                                            {formattedName}
                                        </span>
                                        <button
                                            onClick={() => removeFromCompare(product.id)}
                                            className="flex-shrink-0 p-2 -m-1 text-ink-500 hover:text-ink-900 flex items-center justify-center transition-colors"
                                            title="Ukloni"
                                        >
```

OLD:
```tsx
                        <button
                            onClick={clearAll}
                            className="text-xs text-gray-500 hover:text-red-600 transition-colors px-2 py-1"
                        >
                            Obriši sve
                        </button>
                        <Link
                            href="/uporedi"
                            className="btn-primary text-sm px-4 py-2 whitespace-nowrap"
                        >
```
NEW:
```tsx
                        <button
                            onClick={clearAll}
                            className="text-[13px] text-ink-500 hover:text-ink-900 transition-colors px-2 py-1 min-h-[44px]"
                        >
                            Obriši sve
                        </button>
                        <Link
                            href="/uporedi"
                            className="btn-primary inline-flex items-center whitespace-nowrap min-h-[44px]"
                        >
```

Napomena: `animate-slideUp` je uklonjen (nije ni definisan u tailwind configu — mrtva klasa).

- [ ] **Step 4: app/upiti/page.tsx — kompletna prepravka (bela podloga, hairline sekcije, eyebrow naslovi)**

Server komponenta, čista prezentacija. Metadata, Breadcrumbs, Suspense i linkovi (tel/mailto/maps) ostaju identični. Uklonjen je nekorišćeni `import Link from 'next/link';`. NOVA VERZIJA FAJLA:

```tsx
import Breadcrumbs from '@/components/Breadcrumbs';
import ContactForm from '@/components/ContactForm';
import { Suspense } from 'react';

export const metadata = {
  title: 'Pošalji upit - Podovi',
  description: 'Pošaljite upit za proizvode koji vas interesuju. Naš tim će vam se javiti u najkraćem roku.',
};

export default function InquiryPage() {
  return (
    <div className="bg-white min-h-screen">
      <div className="container pt-6 pb-24">
        <div className="mb-10">
          <Breadcrumbs items={[{ label: 'Upiti' }]} />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-20">
          {/* Form Column */}
          <div className="lg:col-span-2">
            <h2 className="eyebrow mb-8">Kontakt Forma</h2>
            <Suspense fallback={<div className="h-64 bg-paper animate-pulse" aria-label="Učitavanje forme" />}>
              <ContactForm />
            </Suspense>
          </div>

          {/* Sidebar Column */}
          <div className="space-y-12">
            {/* Contact Info */}
            <div>
              <h3 className="eyebrow mb-4">Kontakt Informacije</h3>
              <div className="border-t border-ink-200">
                <div className="flex justify-between gap-4 border-b border-ink-200 py-[9px] text-[13px]">
                  <span className="text-ink-500">Telefon</span>
                  <a href="tel:+381212982444" className="text-ink-900 text-right hover:opacity-60 transition-opacity">
                    +381 21 2982 444
                  </a>
                </div>
                <div className="flex justify-between gap-4 border-b border-ink-200 py-[9px] text-[13px]">
                  <span className="text-ink-500">Email</span>
                  <a href="mailto:podovidoo@gmail.com" className="text-ink-900 text-right break-all hover:opacity-60 transition-opacity">
                    podovidoo@gmail.com
                  </a>
                </div>
                <div className="flex justify-between gap-4 border-b border-ink-200 py-[9px] text-[13px]">
                  <span className="text-ink-500">Lokacija</span>
                  <a
                    href="https://www.google.com/maps/place/Podovi+doo/@45.2573343,19.8190724,17z"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-ink-900 text-right hover:opacity-60 transition-opacity"
                  >
                    Hajduk Veljkova 11,<br />Novi Sad, Srbija
                  </a>
                </div>
              </div>
            </div>

            {/* Why Choose Us (Compact) */}
            <div>
              <h3 className="eyebrow mb-4">Zašto izabrati nas?</h3>
              <ul className="border-t border-ink-200">
                <li className="flex items-center gap-3 border-b border-ink-200 py-[9px] text-[13px] text-ink-900">
                  <svg className="w-4 h-4 flex-shrink-0 text-ink-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
                  </svg>
                  Brz odgovor na upite
                </li>
                <li className="flex items-center gap-3 border-b border-ink-200 py-[9px] text-[13px] text-ink-900">
                  <svg className="w-4 h-4 flex-shrink-0 text-ink-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
                  </svg>
                  Stručno savetovanje
                </li>
                <li className="flex items-center gap-3 border-b border-ink-200 py-[9px] text-[13px] text-ink-900">
                  <svg className="w-4 h-4 flex-shrink-0 text-ink-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
                  </svg>
                  Najbolji odnos cene i kvaliteta
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

Heading semantika (h2/h3) i svi tekstovi zadržani 1:1; samo su stilizovani kao `.eyebrow` (pravilo 9). Bele kartice sa `rounded-2xl shadow-xl` i roza krugovi sa ikonama su uklonjeni; zeleni checkmarkovi su sada monohromni.

- [ ] **Step 5: components/ContactForm.tsx — kompletna prepravka (bottom-line inputi, crno dugme)**

Logika (useSearchParams, prefill useEffect, handleSubmit, status state) ostaje doslovno ista. NOVA VERZIJA FAJLA:

```tsx
'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

export default function ContactForm() {
    const searchParams = useSearchParams();

    // Initial state from URL params
    const initialProduct = searchParams.get('product') || '';
    const initialColor = searchParams.get('color') || '';
    const initialRef = searchParams.get('ref') || '';
    const initialCategory = searchParams.get('category') || '';
    const initialName = searchParams.get('name') || '';

    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phone: '',
        subject: '',
        message: '',
    });

    const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        if (initialName) {
            setFormData(prev => ({
                ...prev,
                subject: `Upit za: ${initialName}`
            }));
        } else if (initialProduct) {
            setFormData(prev => ({
                ...prev,
                subject: `Upit za proizvod: ${initialProduct}`
            }));
        }

        if (initialCategory || initialColor || initialRef) {
            let details = '';
            if (initialCategory) details += `Kategorija: ${initialCategory}\n`;
            if (initialName) details += `Proizvod: ${initialName}\n`;
            if (initialColor) details += `Boja/Dezen: ${initialColor}\n`;
            if (initialRef) details += `Referenca: ${initialRef}\n`;

            if (details) {
                setFormData(prev => ({
                    ...prev,
                    message: `Poštovani,\n\nZainteresovan sam za sledeći proizvod:\n${details}\nMolim vas za ponudu i informaciju o dostupnosti.\n\nHvala.`
                }));
            }
        }
    }, [initialProduct, initialCategory, initialColor, initialRef, initialName]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setStatus('submitting');
        setErrorMessage('');

        try {
            const res = await fetch('/api/contact', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Došlo je do greške prilikom slanja.');
            }

            setStatus('success');
            setFormData({ fullName: '', email: '', phone: '', subject: '', message: '' });
        } catch (error: any) {
            setStatus('error');
            setErrorMessage(error.message || 'Došlo je do greške. Molimo pokušajte ponovo.');
        }
    };

    if (status === 'success') {
        return (
            <div className="border border-ink-200 p-8 text-center">
                <div className="inline-flex w-16 h-16 items-center justify-center border border-ink-200 text-ink-900 mx-auto mb-4">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
                    </svg>
                </div>
                <h3 className="text-2xl font-normal text-ink-900 mb-2">Hvala na upitu!</h3>
                <p className="text-ink-600 mb-8">
                    Vaša poruka je uspešno poslata. Naš tim će vas kontaktirati u najkraćem mogućem roku.
                </p>
                <button
                    onClick={() => setStatus('idle')}
                    className="btn-link"
                >
                    Pošalji novi upit
                </button>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                    <label htmlFor="fullName" className="label">
                        Ime i prezime <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        id="fullName"
                        required
                        className="input w-full"
                        placeholder="Vaše ime"
                        value={formData.fullName}
                        onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                    />
                </div>
                <div>
                    <label htmlFor="email" className="label">
                        Email adresa <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="email"
                        id="email"
                        required
                        className="input w-full"
                        placeholder="vase.ime@email.com"
                        value={formData.email}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                    <label htmlFor="phone" className="label">
                        Telefon <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="tel"
                        id="phone"
                        required
                        className="input w-full"
                        placeholder="+381 6..."
                        value={formData.phone}
                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    />
                </div>
                <div>
                    <label htmlFor="subject" className="label">
                        Naslov <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        id="subject"
                        required
                        className="input w-full"
                        placeholder="Naslov poruke"
                        value={formData.subject}
                        onChange={e => setFormData({ ...formData, subject: e.target.value })}
                    />
                </div>
            </div>

            <div>
                <label htmlFor="message" className="label">
                    Poruka <span className="text-red-500">*</span>
                </label>
                <textarea
                    id="message"
                    required
                    rows={6}
                    className="input w-full resize-y"
                    placeholder="Napišite vašu poruku ovde..."
                    value={formData.message}
                    onChange={e => setFormData({ ...formData, message: e.target.value })}
                ></textarea>
            </div>

            {status === 'error' && (
                <div className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {errorMessage}
                </div>
            )}

            <button
                type="submit"
                disabled={status === 'submitting'}
                className="btn-primary w-full md:w-auto min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {status === 'submitting' ? 'Slanje...' : 'Pošalji Poruku'}
            </button>
        </form>
    );
}
```

Uklonjeno: spinner SVG u dugmetu (pravilo 11 — ostaje samo tekst "Slanje..."), `rounded-*`, `focus:ring-*` (globalni focus-visible iz Task 1), zeleni success karton (sada monohrom sa hairline okvirom), `shadow-lg hover:-translate-y-0.5`.

- [ ] **Step 6: components/InquiryModal.tsx — restilizacija modala (beo, bez radiusa, hairline, overlay bg-black/20)**

Polja forme već koriste `.label`/`.input` helpere (redefinisani u Task 1) — ne diraju se. Parovi izmena:

OLD:
```tsx
        {/* Overlay */}
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
```
NEW:
```tsx
        {/* Overlay */}
        <div
          className="fixed inset-0 transition-opacity bg-black/20"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="inline-block align-bottom bg-white border border-ink-200 text-left overflow-hidden transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
```

OLD (success stanje):
```tsx
            <div className="p-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 text-green-600 rounded-full mb-4">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Upit uspešno poslat!
              </h3>
              <p className="text-gray-600">
                Kontaktiraćemo vas u najkraćem mogućem roku.
              </p>
            </div>
```
NEW:
```tsx
            <div className="p-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 border border-ink-200 text-ink-900 mb-4">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-2xl font-normal text-ink-900 mb-2">
                Upit uspešno poslat!
              </h3>
              <p className="text-ink-600">
                Kontaktiraćemo vas u najkraćem mogućem roku.
              </p>
            </div>
```

OLD (sličica proizvoda u headeru):
```tsx
                      <div className="w-20 h-20 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
```
NEW:
```tsx
                      <div className="w-20 h-20 flex-shrink-0 bg-paper overflow-hidden border border-ink-200">
```

OLD (naslov + naziv + SKU red):
```tsx
                      <h3 className="text-xl font-bold text-gray-900 leading-tight">
                        Pošalji upit
                      </h3>
                      <p className="font-medium text-primary-600 mt-1">
                        {product.name}
                      </p>
                      <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                        <span>SKU: {product.sku}</span>
                        {product.category && (
                          <>
                            <span className="w-1 h-1 rounded-full bg-gray-300"></span>
```
NEW:
```tsx
                      <h3 className="text-xl font-medium text-ink-900 leading-tight">
                        Pošalji upit
                      </h3>
                      <p className="font-normal text-ink-600 mt-1">
                        {product.name}
                      </p>
                      <div className="flex items-center gap-2 text-[13px] text-ink-500 mt-1">
                        <span>SKU: {product.sku}</span>
                        {product.category && (
                          <>
                            <span aria-hidden="true">·</span>
```

OLD (dugme za zatvaranje):
```tsx
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-500 p-1"
                  >
```
NEW:
```tsx
                  <button
                    onClick={onClose}
                    className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center text-ink-500 hover:text-ink-900 transition-colors"
                  >
```

OLD (dugmad preferiranog kontakta):
```tsx
                        <button
                          key={method.value}
                          type="button"
                          onClick={() => togglePreferredContact(method.value)}
                          className={`p-3 rounded-lg border-2 text-sm font-medium transition-colors ${formData.preferredContact.includes(method.value)
                              ? 'border-primary-600 bg-primary-50 text-primary-700'
                              : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                            }`}
                        >
                          <span className="block mb-1">{method.icon}</span>
                          {method.label}
                        </button>
```
NEW:
```tsx
                        <button
                          key={method.value}
                          type="button"
                          onClick={() => togglePreferredContact(method.value)}
                          className={`p-3 min-h-[44px] border text-sm font-medium transition-colors ${formData.preferredContact.includes(method.value)
                              ? 'border-ink-900 bg-ink-900 text-white'
                              : 'border-ink-200 bg-white text-ink-600 hover:border-ink-900 hover:text-ink-900'
                            }`}
                        >
                          {method.label}
                        </button>
```
(Emoji ikone 📞📧💬 se uklanjaju iz prikaza — monohrom; niz `{ value, label, icon }` ostaje netaknut, `icon` se samo više ne renderuje.)

OLD (validaciona poruka):
```tsx
                      <p className="text-xs text-red-500 mt-1">
                        Izaberite najmanje jedan način kontakta
                      </p>
```
NEW:
```tsx
                      <p className="text-xs text-red-600 mt-1">
                        Izaberite najmanje jedan način kontakta
                      </p>
```

OLD (kutija greške):
```tsx
                    <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                      {error}
                    </div>
```
NEW:
```tsx
                    <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 text-sm">
                      {error}
                    </div>
```

OLD (submit red):
```tsx
                    <button
                      type="button"
                      onClick={onClose}
                      className="btn-outline flex-1"
                      disabled={isSubmitting}
                    >
                      Otkaži
                    </button>
                    <button
                      type="submit"
                      className="btn-primary flex-1"
                      disabled={isSubmitting || formData.preferredContact.length === 0}
                    >
```
NEW:
```tsx
                    <button
                      type="button"
                      onClick={onClose}
                      className="btn-secondary flex-1 min-h-[44px] disabled:opacity-50"
                      disabled={isSubmitting}
                    >
                      Otkaži
                    </button>
                    <button
                      type="submit"
                      className="btn-primary flex-1 min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={isSubmitting || formData.preferredContact.length === 0}
                    >
```

- [ ] **Step 7: components/FlooringCalculator.tsx — kompletna prepravka (hairline kutija, spec-redovi za rezultate)**

Logika proračuna ostaje doslovno ista; gradijent, krugovi, plava/žuta info kutija i emoji se uklanjaju. NOVA VERZIJA FAJLA:

```tsx
"use client";

import { useState } from 'react';

interface FlooringCalculatorProps {
  productName: string;
  coveragePerPackage?: number; // m² po pakovanju
}

export default function FlooringCalculator({
  productName,
  coveragePerPackage = 2.25,
}: FlooringCalculatorProps) {
  const [area, setArea] = useState<string>('');
  const [calculated, setCalculated] = useState(false);

  const WASTE_PERCENTAGE = 5; // 5% otpada

  const handleCalculate = () => {
    if (area && parseFloat(area) > 0) {
      setCalculated(true);
    }
  };

  const areaNumber = parseFloat(area) || 0;
  const wasteAmount = areaNumber * (WASTE_PERCENTAGE / 100);
  const totalAreaWithWaste = areaNumber + wasteAmount;
  const packagesNeeded = Math.ceil(totalAreaWithWaste / coveragePerPackage);
  const totalCoverage = packagesNeeded * coveragePerPackage;

  return (
    <div className="border border-ink-200 p-6">
      <div className="mb-6">
        <p className="eyebrow mb-2">Kalkulator</p>
        <h3 className="text-lg font-medium text-ink-900">
          Kalkulator potrebne količine
        </h3>
        <p className="text-[13px] text-ink-600 mt-1">
          Izračunajte koliko paketa vam je potrebno za vaš prostor
        </p>
      </div>

      <div className="mb-6">
        <label htmlFor="area-input" className="label">
          Površina prostora (m²) <span className="text-red-500">*</span>
        </label>
        <div className="flex items-end gap-3">
          <input
            id="area-input"
            type="number"
            min="0"
            step="0.01"
            value={area}
            onChange={(e) => {
              setArea(e.target.value);
              setCalculated(false);
            }}
            onKeyPress={(e) => e.key === 'Enter' && handleCalculate()}
            placeholder="Unesite površinu u m²..."
            className="input flex-1"
          />
          <button
            onClick={handleCalculate}
            disabled={!area || parseFloat(area) <= 0}
            className="btn-primary min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Izračunaj
          </button>
        </div>
        <p className="text-[13px] text-ink-500 mt-2">
          Jedno pakovanje pokriva {coveragePerPackage} m²
        </p>
      </div>

      {calculated && areaNumber > 0 && (
        <div className="space-y-6">
          {/* Rezultati */}
          <div>
            <p className="eyebrow mb-2">Rezultat proračuna</p>

            <div className="flex justify-between border-b border-ink-200 py-[9px] text-[13px]">
              <span className="text-ink-500">Vaša površina</span>
              <span className="text-ink-900">{areaNumber.toFixed(2)} m²</span>
            </div>

            <div className="flex justify-between border-b border-ink-200 py-[9px] text-[13px]">
              <span className="text-ink-500">Otpad ({WASTE_PERCENTAGE}%)</span>
              <span className="text-ink-900">+{wasteAmount.toFixed(2)} m²</span>
            </div>

            <div className="flex justify-between border-b border-ink-200 py-[9px] text-[13px]">
              <span className="text-ink-500">Ukupno potrebno</span>
              <span className="text-ink-900">{totalAreaWithWaste.toFixed(2)} m²</span>
            </div>

            <div className="flex items-baseline justify-between border-b border-ink-200 py-[9px]">
              <span className="text-[13px] text-ink-500">Broj paketa</span>
              <span className="text-2xl font-normal text-ink-900">
                {packagesNeeded} <span className="text-[13px] text-ink-500">kom</span>
              </span>
            </div>

            <p className="text-[13px] text-ink-500 mt-2">
              Ukupna pokrivenost: {totalCoverage.toFixed(2)} m²
            </p>
          </div>

          {/* Info */}
          <p className="text-[13px] text-ink-600 leading-relaxed">
            Preporuka: uračunali smo samo 5% otpada (umesto standardnih 10%), što znači uštedu za vas.
            Za prostorije sa dosta uglova ili dijagonalno postavljanje, razmotrite dodavanje još 1–2 paketa.
          </p>

          {/* CTA napomena */}
          <p className="text-[13px] text-ink-600">
            Kliknite na dugme „Pošalji upit” gore na stranici da pošaljete upit za {packagesNeeded} paketa.
          </p>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 8: app/not-found.tsx — kompletna prepravka (velika svetla tipografija, .btn-link nazad)**

NOVA VERZIJA FAJLA:

```tsx
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] bg-white flex items-center justify-center px-6 py-24">
      <div className="text-center max-w-xl">
        <p className="eyebrow mb-6">Greška 404</p>
        <h1 className="text-4xl md:text-5xl font-normal text-ink-900 mb-6">Stranica nije pronađena</h1>
        <p className="text-ink-600 mb-12">
          Izgleda da smo zagubili podnu oblogu koju tražite. <br />
          Vratite se na početnu ili pogledajte naš katalog.
        </p>
        <div className="flex flex-col sm:flex-row gap-6 items-center justify-center">
          <Link href="/" className="btn-link inline-flex items-center min-h-[44px]">
            Nazad na početnu
          </Link>
          <Link href="/" className="btn-primary inline-flex items-center min-h-[44px]">
            Pregledaj katalog
          </Link>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 9: app/error.tsx — kompletna prepravka (zadržati 'use client', useEffect logging i reset)**

NOVA VERZIJA FAJLA:

```tsx
'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to error reporting service
    console.error('Error boundary caught:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-6">
      <div className="max-w-xl text-center">
        <p className="eyebrow mb-6">Greška</p>
        <h1 className="text-4xl md:text-5xl font-normal text-ink-900 mb-6">
          Ups! Nešto nije u redu
        </h1>
        <p className="text-ink-600 mb-10">
          Došlo je do greške prilikom učitavanja stranice.
          Molimo pokušajte ponovo ili se vratite na početnu stranicu.
        </p>

        {error.message && (
          <div className="mb-10 p-4 bg-red-50 border border-red-200 text-left">
            <p className="text-sm text-red-600 font-mono">
              {error.message}
            </p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-6 items-center justify-center">
          <button onClick={reset} className="btn-primary min-h-[44px]">
            Pokušaj ponovo
          </button>
          <a href="/" className="btn-link inline-flex items-center min-h-[44px]">
            Nazad na početnu
          </a>
        </div>
      </div>
    </div>
  );
}
```

Uklonjeni `focus:ring-*` (globalni `:focus-visible` outline iz Task 1) i `btn-outline`.

- [ ] **Step 10: app/global-error.tsx — kompletna prepravka**

`global-error` se renderuje umesto root layouta, pa namerno koristi sirove utility klase (tokeni iz tailwind configa) umesto `.btn-*` helpera — minimalna zavisnost od `@layer components`. NOVA VERZIJA FAJLA:

```tsx
'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="sr">
      <body>
        <div className="min-h-screen flex items-center justify-center bg-white p-6">
          <div className="max-w-xl w-full text-center">
            <p className="text-[11px] uppercase tracking-label text-ink-500 mb-6">Greška</p>
            <h1 className="text-4xl font-normal text-ink-900 mb-6">
              Kritična greška
            </h1>
            <p className="text-ink-600 mb-10">
              Došlo je do kritične greške. Molimo osvežite stranicu ili pokušajte kasnije.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 items-center justify-center">
              <button
                onClick={reset}
                className="bg-ink-900 text-white text-[13px] font-medium px-[26px] py-3 hover:bg-ink-700 transition-colors min-h-[44px]"
              >
                Pokušaj ponovo
              </button>
              <a
                href="/"
                className="text-[13px] text-ink-900 border-b border-ink-900 pb-0.5 hover:opacity-60 transition-opacity"
              >
                Nazad na početnu
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
```

- [ ] **Step 11: Build provera**

Run: `npm run build` (u repou). Expected: uspešan build bez grešaka.

- [ ] **Step 12: Vizuelna provera**

Pokrenuti `npm run dev` i proveriti na 1440px i 390px:
- `/omiljeni` (prazno stanje + sa 2-3 omiljena): kartice 4:5 na `paper` podlozi bez okvira/senke, hover scale 1.03, cena 13px siva; skeleton `bg-paper animate-pulse` tokom učitavanja; srce-dugme vidljivo gore-desno.
- `/uporedi` (prazno + sa 3 proizvoda): tabela samo sa horizontalnim hairline linijama, bez zebre, sticky prva kolona pri horizontalnom skrolu na 390px, kvadratno ✕ dugme, monohromna dostupnost.
- `CompareBar` (dodati 2 proizvoda u poređenje sa kataloga): beo, `border-t` hairline, bez senke, čipovi sa hairline okvirom, crno "Uporedi" dugme.
- `/upiti`: bottom-line inputi, uppercase etikete, crno submit dugme; sidebar hairline redovi; test slanja sa praznim poljima (browser validacija) i success stanje.
- `InquiryModal` (sa stranice proizvoda, dugme "Pošalji upit"): overlay `bg-black/20`, beli modal bez radiusa sa hairline okvirom, izbor načina kontakta (aktivno = crno popunjeno), error stanje crveno.
- `FlooringCalculator` (stranica proizvoda sa kalkulatorom): hairline kutija, rezultat kao spec-redovi.
- Nepostojeća ruta (npr. `/xyz`) za 404 i namerna greška za error stranicu: velika svetla tipografija, tekstualni link nazad, fokus outline crn (Tab navigacija).

- [ ] **Step 13: Commit**

```bash
git add app/omiljeni/FavoritesPageClient.tsx app/uporedi/ComparePageClient.tsx components/CompareBar.tsx app/upiti/page.tsx components/ContactForm.tsx components/InquiryModal.tsx components/FlooringCalculator.tsx app/not-found.tsx app/error.tsx app/global-error.tsx && git commit -m "style: redizajn sekundarnih stranica (omiljeni, uporedi, upiti, greske) u galerijskom jeziku"
```

---

### Task 8: Završni sweep i puna verifikacija

**Files:**
- Modify: samo fajlovi kod kojih grep nađe zaostatke (očekivano: nijedan ili sitnice)

- [ ] **Step 1: Grep verifikacija — nula legacy klasa**

Pokrenuti iz korena repoa (rg = ripgrep; alternativno koristiti Grep tool sa istim šablonima). Izuzeci su isključeni glob filterima; WhatsApp zelena i `red-*` za greške formi su legitimni i nisu među šablonima:

```sh
rg -n "primary-[0-9]" app components -g "!app/crm/**" -g "!components/crm/**"
rg -n "badge-" app components -g "!app/crm/**" -g "!components/crm/**"
rg -n "rounded-" app components -g "!app/crm/**" -g "!components/crm/**"
rg -n "shadow-" app components -g "!app/crm/**" -g "!components/crm/**" | rg -v "shadow-none"
rg -in "#F5F5F7|#1D1D1F|#0071E3|#0066CC|#86868B" app components -g "!app/crm/**" -g "!components/crm/**"
rg -n "card-hover|font-semibold|font-bold|\bitalic\b" app components -g "!app/crm/**" -g "!components/crm/**"
```

Expected: svih šest komandi vraća prazan izlaz (rg exit kod 1). Jedini dozvoljeni `font-bold` je u `components/PodoviWordmark.tsx` (logotip) — ako se pojavi, to NIJE zaostatak. Svaki drugi pogodak ispraviti po rečniku: `primary-600` → `ink-900`, `#86868B` → `text-ink-500`, `rounded-*` → ukloniti, `shadow-*` → ukloniti, `font-semibold` → `font-normal` ili `font-medium`, `italic` → ukloniti.

- [ ] **Step 1b: Ukloniti framer-motion zavisnost**

Posle Taska 6 nijedan izvorni fajl ne koristi framer-motion (provereno grep-om). Run: `npm uninstall framer-motion`, zatim build u Step 2 potvrđuje da ništa nije puklo. Napomene za sweep: `components/useScrollLock.ts` je novi legitiman fajl; `app/proizvodi/[slug]/page.tsx` sadrži namerno preslikane normalizer helpere iz `ProductDocuments` (server/client granica) — kandidat za kasniju konsolidaciju, NE dirati sada.

- [ ] **Step 2: Build i contract testovi**

Run: `npm run build` — Expected: uspešan build (uključuje validate:images).
Run: `npm run test:contract` — Expected: svi testovi prolaze.

- [ ] **Step 3: Vizuelna verifikacija (spec §8) — desktop 1440px i mobilni 390px**

Pokrenuti `npm run dev` i proveriti:

1. Početna: listač tabovi (underline indikator), kartice 4:5 bez senki/bedževa, „Zašto izabrati nas" hairline kolone, crni CTA blok sa belim dugmetom.
2. `/kategorije/vinil` i `/kategorije/lvt`: traka sa brend čipovima, fioka „Filteri" (otvaranje, Escape zatvaranje, scroll-lock), mreža 2/3/4, tabovi Kolekcije/Boje, skeleton učitavanje boja. Promeniti filter → URL parametri se menjaju kao pre.
3. `/kategorije/otiraci`: flat katalog bez tabova boja.
4. Proizvod Tarkett LVT (mnogo boja): split raspored, sticky info kolona, swatch mreža (klik menja sliku sa fade-om, `?color=` se menja), diskretna cena, sekcije Opis/Specifikacije/Dokumenti umesto tabova.
5. Proizvod BLOQ (roomshots + dokumenti): galerija, redovi dokumenata sa ikonama preuzimanja.
6. Proizvod Romus alat (bez boja): info kolona bez swatch mreže.
7. `/proizvodi/welding-rod/[bilo koji ref]`: hairline spec redovi.
8. `/omiljeni` (sa 2+ proizvoda), `/uporedi` (3 proizvoda — hairline tabela, ✕ tap mete 44px), CompareBar na dnu.
9. `/upiti`: bottom-line inputi, label etikete, crno dugme, poruke grešaka crvene.
10. Globalna pretraga: otvaranje preko cele širine headera, tastatura (strelice + Enter + Escape), skeleton.
11. Mobilni meni: full-screen overlay, krupni linkovi.
12. Logotip „podovi" malim slovima bold u headeru i footeru; footer svetao.
13. ScrollReveal: sadržaj ispod pregiba se uredno pojavljuje; ako sadržaj „bljesne" sakriven pre hidratacije, primeniti fallback iz Taska 2 (ukloniti početni `opacity-0`).
14. Tastatura: Tab kroz karticu proizvoda — fokus prsten 2px vidljiv, srce/uporedi dostupni na focus-visible.

- [ ] **Step 4: Namerna odstupanja — samo potvrditi, ne „popravljati"**

1. Brend čipovi u filterima: neaktivno stanje `text-ink-500` (ne ink-400) — namerno, WCAG za 13px tekst.
2. Header CTA: `btn-primary px-5 py-2` (manji padding od spec 12×26) — namerno, header je nizak.
3. Viber dugme u ShareButtons je monohromno (jedini brend-izuzetak je WhatsApp zelena).
4. `/crm` i `LeadSaveButton` i dalje koriste roza `primary` paletu — van obima.

- [ ] **Step 5: Završni commit**

```bash
git add -A && git commit -m "style: zavrsno ciscenje legacy stilova posle Galerija redizajna"
```

(Push na main ostaje ručna odluka vlasnika — pokreće Vercel deploy.)

