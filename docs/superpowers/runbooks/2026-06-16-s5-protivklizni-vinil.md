# S5 — Protivklizni/Sigurnosni vinil (2026-06-16)

**Cilj:** Safety (anti-klizni) podovi u katalog — BEZ nove vidljive kategorije. Idu u Vinil (kat 2),
tagirani `protivklizno`, izdvojeni novim filterom „Protivklizni/Sigurnosni". (Vlasnička odluka.)

## Rezultat
- **13 kolekcija / 125 boja**, sve self-hostovano na Supabase, sve `protivklizno:true`:
  - **Tarkett (6, homogeni, ~70 boja)**: Safetred Universal (16), Universal R11 (4), Granit Safe.T (24),
    Granit Multisafe (8), Multisafe Aqua (10), Primo Safe.T (8) → `tarkett_homogeneous_vinyl_colors.json`.
  - **Gerflor Tarasafe (7, ~55 boja)**: Ultra Compact Sparclean (17), Compact Standard (14), H2O (8),
    Compact Design 2022 (6), Ultra H2O (5), Plus (3), Super (2) → `vinyl_colors_complete.json`.
- **Filter** „Protivklizni/Sigurnosni" (`?safety=1`) na Vinil stranici → prikazuje samo tih 13. Potvrđeno
  interaktivno (klik checkbox → URL `?safety=1` → 13 kartica).

## Ključno otkriće — opseg
tarkett.rs protivklizni kategorija (`kategorija-rs_C01005-protivklizni-podovi`) DOM-scrape: samo **4-6 živih
kolekcija**. Dekorativni **Safetred Design Collection / Ion Contrast / Ion Linen / Spectrum / Transport /
Aqua / Rail** opseg je **DISKONTINUISAN na srpskom sajtu** — stari C-ID-evi (iz all_kolekcije.txt) sad
**redirektuju na kategoriju** (probe: `hasNuxt:false`, h1 „Protivklizni podovi"). Config trimovan sa 21 na 6
realnih. Dekorativnu raznolikost daje Gerflor Tarasafe. (Ako vlasnik kasnije hoće Safetred Design opseg —
nije na tarkett.rs; treba professionals.tarkett.com ili drugi izvor.)

## Tagiranje + filter (wiring)
- **Ingest**: `protivklizno:true` u config → record dobija `protivklizno` + `characteristics['Protivklizno']='Da'`
  (na kolekciji i svakoj boji). `buildSpecsFromCharacteristicRecord` auto-derivira spec `{key:'protivklizno'}`.
- **Filter, 5 fajlova**: `ProductFilters.tsx` (checkbox „Namena → Protivklizni/Sigurnosni", `?safety=1`),
  `CategoryTabs.tsx` (`safetyOnly` prop), `app/kategorije/[slug]/page.tsx` (`safety` searchParam +
  `filtersWithoutCollections.safety`), `lib/repositories/product-repository.ts` (filtrira proizvode sa
  `protivklizno` specom — 2 mesta, uz `type` filter), `types/index.ts` (`safety?:string` u ProductFilters).
  - **LEKCIJA (kao S7)**: filter na CategoryTabs (color explorer) NIJE dovoljan — glavni grid kolekcija je
    server-renderovan kroz `productRepository.findByCategory(filters)`, pa `safety` MORA u repo filter + u
    `filtersWithoutCollections`. Inače checkbox „radi" ali grid ostaje pun.

## Zamke (rešene)
- 15/21 Tarkett safety kolekcija je padalo „__NUXT__ item nije pronađen" — NIJE rate-limit (veneto radi u
  istom trenutku), nego **redirektujući mrtvi URL-ovi** (pogrešni stari id-jevi). Rešeno trimovanjem.
- `gerflor-vinyl-data-contract.test.ts` „ima 25 kolekcija" pukao (Tarasafe dodao 7 u vinyl JSON) → test
  isključuje `protivklizno` kolekcije (čuva originalnih 25 S2).

## Verifikacija (zeleno)
- test:contract 206/206, build 24/24. `?safety=1` = 13 kolekcija, 0 ne-safety. PDP granit-safe-t 24 boje
  (Playwright), protivklizno spec prisutan. 0 hotlinkova (data-contract).
