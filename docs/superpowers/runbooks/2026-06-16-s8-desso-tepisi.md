# S8 — Desso tepih-ploče (2026-06-16)

**Cilj:** Desso tepih program u Tekstilne ploče (kat 4), pod brendom Tarkett (id 3), ime kolekcije
prefiks „Desso ". Sve self-hostovano na Supabase. (Vlasnička odluka — koristimo prepoznatljivost Tarkett-a.)

## Rezultat
- **46 kolekcija / 629 pločica**, **100% Supabase**, 0 hotlinkova, sve „Desso " prefiks (AirMaster,
  Essence, Stratos, Fields, Linon, Palatino, Grain, Iconic, Arcade, Emerge, Patricia Urquiola…).
- Brend = **Tarkett (id 3)**; SKU `DESSO-<slug>`; slug `desso-<slug>`. Izvor: tarkett.rs
  `kolekcija-C00XXXX-*` (isti `__NUXT__` extractor).
- PDP renderuje boje (npr. Desso AirMaster Atmos = 12 boja), pune specifikacije, dokumentacija,
  „Slični proizvodi" vezuje Desso tepihe.

## Mode collection — isključeno
51 u sirovom category-json, ali **5 Mode kolekcija (Avenue/Eclectic/Metropol/Scenic/Vista) na
tarkett.rs imaju samo 1 placeholder dezen → 0 pločica** (prazne upstream). Isključene iz configa →
**46 realnih**. (Recon procena „Mode 5×42=210" je bila pogrešna; live ekstrakcija boja=1/kolekciji.)

## Net-new kod (mirror BLOQ)
- `tools/ingest_tarkett.js`: `kind:'carpet'` grana + 46-stavka DESSO_COLLECTIONS config (categoryId '4',
  brandId '3', `DESSO-` SKU, „Desso " display prefiks). Reuse worker-pool + withTimeout.
- `public/data/desso_carpet_tiles.json` (kao bloq_carpet_tiles.json, flat colors[]).
- `getAllDessoCarpetProducts()` u productDataLoader (klon BLOQ) + uvezeno u getProductsByCategory('4') + getProductBySlug.
- `prepare-colors.ts` cat-4 `DESSO-` grana (customColors, klon BLOQ).
- `product-repository.ts` cat-4 merge + getJsonProductBySlug aggregate.

## Zamka (rešena) — ista klasa kao S7/S5
Agent je gradio wiring sa PRAZNIM JSON-om pa nije video render. Na popunjenom JSON-u kategorija strana
je prikazivala „DESSO" tekst ali **0 kartica** — `hasCollectionSku` (`app/kategorije/[slug]/page.tsx`
+ `lib/utils/homepage-collection-filter.ts`) NIJE imao `DESSO-` prefiks → Desso proizvodi tretirani kao
boje, ne kolekcije. Fix: dodato `DESSO-` u obe `hasCollectionSku` liste. **LEKCIJA: novi collection-SKU
prefiks MORA u hasCollectionSku (obe instance), inače kolekcije ne postaju kartice.**

## Verifikacija (zeleno)
- test:contract 206/206, build 24/24, 0 hotlinkova (data-contract).
- /kategorije/tekstilne-ploce: 46 Desso + 18 BLOQ kartica. PDP desso-airmaster-atmos 12 boja (Playwright).
