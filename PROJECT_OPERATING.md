# PODOVI — Project Operating File

> Created: 2026-04-28  
> Local path: `/mnt/ssd2/projects/github/b0r1v0j3/PODOVI`  
> Remote: `https://github.com/b0r1v0j3/PODOVI`  
> Local clone note: partial/sparse checkout zbog ogromnih archive/output foldera.

## Jedna rečenica

**PODOVI je katalog podnih obloga firme Podovi d.o.o. tvoje majke: kupci pregledaju proizvode i šalju upite, prodaja ostaje offline.**

## Biznis kontekst

- Ovo nije e-commerce: nema korpe i checkout-a.
- Vrednost je katalog + SEO + upiti + uredan prikaz velikog broja proizvoda/boja/specifikacija.
- Podaci su kompleksni jer svaki brend ima drugačiji format.

## Stack

- Next.js 14 App Router + React 18 + TypeScript
- TailwindCSS 3
- Supabase Postgres/Storage
- Nodemailer/Gmail SMTP
- GA4
- Vercel deploy sa `main`
- Vitest contract tests

## Dizajn sistem „Galerija" (redizajn 2026-06-12)

- 2026-06-12 sve javne stranice su redizajnirane u monohromni galerijski jezik (Prostoria referenca): početna sa listačem (`HomeProductTabs`), kategorije sa brend čipovima + fiokom filtera, proizvod u split rasporedu sa sticky info kolonom i vertikalnim sekcijama umesto tabova, svetli footer, logotip malim slovima.
- Spec: `docs/superpowers/specs/2026-06-12-podovi-redizajn-design.md`
- Plan: `docs/superpowers/plans/2026-06-12-galerija-redizajn-faza-1.md`
- Dizajn tokeni u `tailwind.config.ts`: `ink` skala sivih (tekst, linije, CTA) + `paper` `#F7F5F2` (podloga slika); razdvajanje hairline linijama od 1px.
- Pravila: bez `rounded-*`, bez `shadow-*` i bez stare `primary` palete na javnim stranicama (izuzeci: zvanična WhatsApp zelena i sistemska crvena za greške u formama). `/crm` se ne dira.

## Source of truth

Pre rada pročitati ovim redom:

1. `AGENTS.md` — jedini izvor istine za projekat
2. `.agent/workflows/podovi-architecture.md`
3. `README.md`
4. relevantni JSON/data/resolver fajlovi

## Lokalni rad

```bash
npm install
npm run dev
npm run check:images
npm run check:health
npm run test:contract
npm run build
```

Build automatski radi image validation:

```bash
npm run validate:images && next build
```

## Kritični pipeline

Svaka promena proizvoda mora ići kroz ceo lanac:

```text
JSON/data fajl → Product tip → resolver/prepare-colors → page/component → build/test
```

Posebno proveriti:

- `lib/product-page/resolve-product.ts`
- `lib/product-page/prepare-colors.ts`
- `types/index.ts`
- `app/proizvodi/[slug]/page.tsx`
- `components/ProductColorSelector.tsx`
- `components/ProductDocuments.tsx`

## Kako agent treba da radi ovde

1. Ne krpiti samo jedan sloj podataka; svaki field mora biti usklađen kroz resolver, tipove i UI.
2. Ako se menja struktura ili data flow, ažurirati `AGENTS.md` i `.agent/workflows/podovi-architecture.md`.
3. Ako se dodaju slike, proveriti lokalne i Supabase URL-ove, alt tekstove, OG/hero/thumb varijante.
4. Za veće data promene pokrenuti contract tests i image validation.
5. Držati sajt na srpskom jeziku.

## Ne dirati bez eksplicitne odluke

- Ne uvoditi checkout/e-commerce flow bez jasne biznis odluke.
- Ne vraćati archive zipove, tmp/output ili node_modules u checkout/commit.
- Ne menjati kanonske proizvodne slugove bez redirect plana.

## Sledeći pametni koraci

1. Smanjiti repo istoriju/veličinu dugoročno: arhive prebaciti van git-a ako još postoje u istoriji.
2. Napraviti “product data health dashboard” za missing images/specs/docs.
3. Pojačati SEO za kategorije/brendove sa najviše komercijalne vrednosti.
4. Standardizovati data import procedure za nove brendove.
5. Faza 2 redizajna (§10 speca): obogaćivanje podataka brend po brend — Gerflor vinil slike → high-res slike svuda → Alpod PDF dokumenti → TimberTech deking → Tarkett room-scene fotografije → Techem/Romus dokumentacija; tek tada full-bleed hero i editorijal galerije.
6. Odlučiti sudbinu nepovezanih komponenti (`InquiryModal`, `InquiryButton`, `FlooringCalculator`, `ShareButtons`): ponovo ih uvezati ili obrisati.
