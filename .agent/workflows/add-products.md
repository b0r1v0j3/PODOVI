---
description: Obavezni koraci za dodavanje novih proizvoda ili brendova na sajt (EGGER, BLOQ, itd.)
---

# Dodavanje novog brenda/proizvoda — OBAVEZNI CHECKLIST

// turbo-all

> **PROČITAJ OVO PRE NEGO ŠTO POČNEŠ!**
> Svaki put kad dodaješ nove proizvode, MORAŠ proći kroz SVE korake.
> Ne preskaču se koraci. Ne push-uj dok SVE ne radi.

## 1. Data Source
- [ ] Dodaj podatke u odgovarajući fajl:
  - `lib/data/mock-data.ts` — za proizvode koji nisu u DB (EGGER, budući brendovi)
  - `public/data/*.json` — za boje/dekore/varijante
  - `lib/data/tarkett-products.ts` — samo za Tarkett

## 2. Repository Merge (KRITIČNO!)
- [ ] Otvori `lib/repositories/product-repository.ts`
- [ ] U `SupabaseProductRepository.findAll()`: dodaj merge blok za nove proizvode
  - Primer: BLOQ (cat 4, linija ~107), EGGER (cat 1,8,9,10, linija ~123)
  - Format: filtriranje po brandId/categoryId, primena search/brand filtera, dedup po slug-u
- [ ] U `findBySlug()`: dodaj fallback na mock-data (linija ~179)
- [ ] U `findByBrand()`: dodaj return za novi brandId (linija ~200)

## 3. Category Page (`app/kategorije/[slug]/page.tsx`)
- [ ] `hasCollectionSku()` (linija ~130): dodaj SKU prefix novog brenda (`EGGER-`, `BLOQ-`, itd.)
- [ ] Kolekcija grouping/dedup (linija ~158): proveri da spec key za collection postoji
  - Tarkett: `collection`
  - EGGER: `brand_line`
  - Ako novi brend koristi drugačiji key → dodaj fallback
- [ ] `availableCollections` filter (linija ~215): dodaj SKU prefix u `.filter()`
- [ ] Tab logika (`hasCollectionTabs`, linija ~114): dodaj slug nove kategorije ako treba

## 4. Product Page (`app/proizvodi/[slug]/page.tsx`)
- [ ] `customColors` prop (linija ~350): proveri da categoryId ulazi u uslov
- [ ] `prepare-colors.ts`: dodaj granu za učitavanje boja novog brenda
  - `prepareCustomColors()`: učitaj iz JSON-a i filtriraj po collection/slug
  - `mergeSelectedColor()`: ažuriraj ime, sliku, specs kad korisnik bira boju

## 5. Build + Verify
```bash
npx next build
```
- [ ] Build prolazi bez grešaka
- [ ] Proveri na dev serveru: kategorijska stranica prikazuje kolekcije
- [ ] Proveri na dev serveru: product page prikazuje boje/dekore
- [ ] Proveri na dev serveru: klik na boju menja sliku i specs

## 6. Dokumentacija
- [ ] Ažuriraj `AGENTS.md`: changelog + TODO
- [ ] Dodaj gotcha ako si naleteo na problem

## 7. Git Push
```bash
git add -A
git commit -m "<descriptive message>"
git push
```

## ⚠️ COMMON MISTAKES
1. **Ne pushuj pre nego što proveriš na dev serveru** — build ≠ radi na sajtu
2. **Mock-data != Supabase** — proizvodi u mock-data.ts se NE prikazuju automatski, MORAŠ da dodaš merge u repository
3. **EGGER koristi `brand_line`, ne `collection`** — svaki brend može imati drugačiji spec key
4. **Uvek proveri CELU putanju**: data → repository → category page → product page → color selector
