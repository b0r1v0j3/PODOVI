---

description: "Task list — Filteri na početnoj strani i brzina sajta"
---

# Tasks: Filteri na početnoj strani i brzina sajta

**Input**: Design documents from `specs/001-filteri-pocetna-brzina/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Traženi su (vlasnik: „contract testovi"; SC-002/SC-003 zahtevaju automatsku proveru nad celim katalogom). Testovi se pišu uz modul koji pokrivaju.

**Organization**: Po korisničkim pričama iz spec.md (US1–US5).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: može paralelno (drugi fajlovi, bez zavisnosti)
- Putanje su relativne u odnosu na koren repoa (`PODOVI`)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Bazna merenja i alati

- [X] T001 Izmeriti stanje pre izmena (production build + `next start`, Playwright/Chrome profil telefon i desktop) i sačuvati sirove rezultate za `specs/001-filteri-pocetna-brzina/performance-report.md`
- [X] T002 [P] Sačuvati graphify izveštaj grafa koda (filter/katalog tok) u `specs/001-filteri-pocetna-brzina/graph-report.md`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Deljeni moduli koje koriste sve priče (podaci → engine → URL)

**⚠️ CRITICAL**: US1–US4 zavise od ove faze

- [X] T003 Proširiti `CategoryFacetDef` u `lib/catalog/facet-config.ts`: `scope` (`'all'` | kategorija), `kind` (`'list'` | `'boolean'` | `'range'`), `derive(product)`, `unit`, `presets`, `note`; passthrough tokena kada grupa nema `canonicalMap`/`parse` (split po `,`, `/`, `|`); zadržati postojeće izvoze (`getFacetDefsForCategory`, `productMatchesFacetSelections`, …) i `CATEGORY_FACETS` mapu radi kompatibilnosti
- [X] T004 Dodati opšte definicije u `lib/catalog/facet-config.ts` (`getUniversalFacetDefs()`): namena (derive po D4), klasa (svi ključevi klasa upotrebe; laminat `commercial_class`), ugradnja (svi ključevi načina ugradnje/spoja), dezen, ton, boja (porodice boja; split `|`), format (Daska/Ploča/Rolna/Tepih), uzorak, grejanje (boolean), rklasa, pozar (EN 13501 `Afl…Ffl-s1/s2`), dostupnost (`availability`), i numeričke: debljina (mm, ≤100), habanje (mm), zvuk (dB, apsolutna vrednost), cena (RSD iz `price`)
- [X] T005 Preurediti kategorijske definicije u `lib/catalog/facet-config.ts`: vinil `materijal`; parket `obrada`, `drvo`; laminat `ac`; elektroprovodni `esd`; otiraci `tip`; lajsne i pribor `vrsta` (prevod engleskih `tip_proizvoda`, passthrough ostalog); deking `profil`; tekstilne-ploce `podloga`; ukloniti iz kategorijskih lista grupe koje su postale opšte
- [X] T006 Napraviti `lib/catalog/home-catalog-index.ts`: `parseNumericIntervals(raw, kind)` (lista/raspon/zarez-decimala), `buildCategoryFacetIndex(products, categorySlug)` (nasleđivanje kolekcija↔boja, brend-skopirano), `toHomeCatalogItem(product, ctx)` (polja iz data-model.md: `href`, ≤2 `card` slike, ≤3 `thumb` swatch-a, samo `collection` spec, `fv`, `nv`, `compareSlim: true`), `buildHomeFacetSchema(groups)` (samo grupe sa podacima, `optionLabels` za type/collection)
- [X] T007 [P] Napraviti `lib/catalog/home-filter-engine.ts`: `evaluateHomeFilters(items, schema, state, { missing: 'exclude' | 'include' })` → `{ results, groups, chips }` sa bit-maskama; brojač = prolazi sve osim svoje grupe ∧ (ima vrednost ∨ (nema podatak ∧ include)); kategorijske grupe važe samo za svoju kategoriju; range preklapanje intervala; prečice sa brojačima; grupe sa <2 opcije (boolean: 0 pokrivenih) se ne vraćaju osim ako imaju izbor
- [X] T008 [P] Proširiti `lib/catalog/home-filter-url.ts`: `HomeFilterState` (data-model.md), parse/serialize sa šemom (opšte `<param>`, opsezi `min-max`, `type=`/`collection=`/`facet=`), migracija starog formata po `contracts/home-filter-url.md`, čuvanje nepovezanih parametara; zadržati `parseHomeFilterUrlState`/`serializeHomeFilterUrlState` imena
- [X] T009 [P] Contract test `tests/contracts/home-catalog-index-contract.test.ts`: kanonizacija (ugradnja, klasa, format, boja, požar, numerički intervali), nasleđivanje u oba smera, passthrough (`program: "Podovi, Keramika"`), nijedna vrednost van podataka nad celim katalogom (SC-003)
- [X] T010 [P] Contract test `tests/contracts/home-filter-engine-contract.test.ts`: nad celim katalogom (`USE_MOCK_DATA`) za svaku opciju svake vidljive grupe brojač == broj rezultata posle izbora (SC-002), bez izabrane kategorije ≥12 vidljivih grupa sa ≥2 vrednosti (SC-001), OR unutar / AND između, kategorijska grupa ne isključuje druge kategorije, include politika, opsezi
- [X] T011 Proširiti `tests/contracts/home-filter-url-contract.test.ts`: novi ključevi, opsezi, stari linkovi (application, thicknessMin/Max, facet→opšta grupa, laminat AC), nepovezani parametri

**Checkpoint**: moduli i testovi zeleni — UI može da počne

---

## Phase 3: User Story 1 - Sužavanje celog kataloga po stvarnim osobinama (Priority: P1) 🎯 MVP

**Goal**: Panel sa opštim i kategorijskim grupama nad tačnim podacima, brojači == rezultati

**Independent Test**: Bez kategorije izabrati Ugradnja → Klik i Klasa → 33; broj uz opciju = broj kartica; kartice imaju te osobine

- [X] T012 [US1] `app/page.tsx`: ukloniti `searchParams` i stari swatch/backfill tok zameniti pozivom `home-catalog-index` (kolekcije + boje po kategoriji za nasleđivanje), proslediti `facetSchema`; `export const revalidate = 300`
- [X] T013 [US1] `app/api/home-colors/route.ts`: vraćati `HomeCatalogItem[]` za boje uz isti indeks kategorije (format iz `contracts/home-catalog-payload.md`)
- [X] T014 [US1] Napraviti `components/HomeFilterPanel.tsx`: render grupa iz engine izlaza — lista (postojeći `FilterButton` + „Prikaži još", pretraga za >12), boolean, opseg (Od/Do + prečice sa brojačima), sklopljene grupe sa brojem izabranih u naslovu, napomena grupe; „Galerija" stil
- [X] T015 [US1] Prepisati filter logiku u `components/HomeProductTabs.tsx` na `home-filter-engine` (ukloniti stare predikate, `APPLICATION_FILTERS`, tihi prefetch boja za nasleđivanje); stanje `HomeFilterState`; kategorijska promena briše samo selekcije te kategorije; čipovi iz engine-a; prazno stanje sa „Ukloni poslednji filter"
- [X] T016 [US1] Ažurirati `tests/contracts/homepage-facet-contract.test.ts` i `tests/contracts/homepage-collection-filter-contract.test.ts` za novi tok (iste poslovne tvrdnje: vinil klasa 33 sužava, parket riblja kost, laminat AC5, include ≥ exclude)

**Checkpoint**: US1 radi na desktopu

---

## Phase 4: User Story 2 - Filteri jasni i brzi na telefonu (Priority: P1)

**Goal**: Dugme „Filteri (N)" iznad rezultata, fioka sa istim panelom, živo „Prikaži N rezultata"

**Independent Test**: 390 px — otvori, izaberi 2 opcije, broj na dugmetu = kartice posle zatvaranja

- [X] T017 [US2] `components/HomeProductTabs.tsx`: mobilni red iznad mreže sa dugmetom „Filteri (N)" (aria-controls `home-filter-drawer`) pored sortiranja; zadržati header trigger (`OPEN_HOME_FILTERS_EVENT`), focus-trap, Escape, scroll-lock, 44 px mete
- [X] T018 [US2] Memoizacija: engine se računa jednom po promeni stanja/podataka (`useMemo`), `startTransition` za klikove u fioci; izmeriti <100 ms na 4× CPU
- [X] T019 [US2] Ažurirati `tests/contracts/home-filter-ui-contract.test.ts` (dugme iznad rezultata, fioka, aria) — bez izmene asercija o `Header.tsx`

---

## Phase 5: User Story 3 - Deljiv i trajan izbor (URL) (Priority: P2)

**Goal**: URL ↔ stanje, stari linkovi rade

**Independent Test**: 3 filtera → novi prozor isti rezultat; Nazad/Napred; stari link iz quickstart-a

- [X] T020 [US3] `components/HomeProductTabs.tsx`: posle montiranja pročitati `window.location.search` (statička strana), kanonizovati preko `replaceState`, `pushState` na promene, `popstate` vraćanje; sanitizacija posle učitavanja podataka (bez fantomskih filtera)

---

## Phase 6: User Story 4 - Novi brendovi i grupe ulaze sami (Priority: P2)

**Goal**: Novi brend/kategorija/vrednost bez izmene filter koda

**Independent Test**: test-stavka novog brenda u novoj kategoriji → pojavljuje se u Kategoriji/Brendu i opštim grupama

- [X] T021 [US4] Contract test u `tests/contracts/home-catalog-index-contract.test.ts`: sintetički proizvodi novog brenda/kategorije (`type`, `program`, `availability`) → šema i engine ih prikazuju bez izmene koda

---

## Phase 7: User Story 5 - Brža početna i PDP (Priority: P2)

**Goal**: manje HTML/JS/slika, keš, region

**Independent Test**: merenje pre/posle istim postupkom

- [X] T022 [P] [US5] Napraviti `lib/product-page/spec-merge.ts` (`mergeSpecs`), re-export iz `lib/product-page/color-helpers.ts`, uvoz u `components/ProductCharacteristics.tsx` iz `spec-merge`
- [X] T023 [P] [US5] Contract test `tests/contracts/pdp-client-bundle-contract.test.ts`: nijedan `'use client'` fajl ne uvozi `color-helpers`, `prepare-colors`, `resolve-product`, `productDataLoader` niti `@/public/data/*` (osim izuzetaka sa obrazloženjem)
- [X] T024 [P] [US5] `components/ProductCardClient.tsx`: `priority` prop (prve 4 kartice taba Kolekcije), swatch sličice kroz `next/image` (`sizes="32px"`, quality 60, `unoptimized` po `shouldBypassNextImageOptimization`), koristi `product.href` kad postoji
- [X] T025 [P] [US5] `vercel.json` sa `{ "regions": ["cdg1"] }` (konačno podešavanje posle spajanja 18.10.2026, Pariz)
- [X] T026 [US5] `app/api/products/route.ts` (+`categoryIds`) i `app/uporedi/ComparePageClient.tsx` (dopuna specifikacija za `compareSlim` stavke)

---

## Phase 8: Polish & Cross-Cutting Concerns

- [X] T027 `npm run test:contract`, `npm run lint`, `npm run build` — sve zeleno
- [X] T028 Pregled u pregledaču: desktop 1440 px i telefon 390 px po `quickstart.md` (scenariji 1–10)
- [X] T029 Merenje posle (isti postupak kao T001) i `specs/001-filteri-pocetna-brzina/performance-report.md` (SC-004 TTFB iz CDN keša označiti „proveriti posle objave")
- [X] T030 [P] `AGENTS.md` (Završeno + datum) i `.agent/workflows/podovi-architecture.md` (novi moduli i tok)
- [x] T031 Usklađivanje sa granom `codex/podovi-commerce-schonox` (ako je commit-ovana): merge, razrešiti `facet-config.ts`/dokumentaciju, ponoviti testove i build — 17.10.2026 grana još NIJE commit-ovana (samo necommit-ovane izmene u glavnom checkout-u); uputstvo za spajanje: `specs/001-filteri-pocetna-brzina/merge-notes.md`

---

## Dependencies & Execution Order

- Phase 1 → Phase 2 → (US1 → US2 → US3) ; US4 posle Phase 2 (+US1 za UI proveru); US5 nezavisna od Phase 2 (T022–T025 mogu odmah)
- T003 → T004/T005 → T006 → T012/T013; T007 i T008 nezavisni od T004–T006 (rade nad šemom/stanjem)
- T014 → T015 → T017/T018/T020
- Polish posle svih priča

## Parallel Example

```text
Odmah posle T001: T022, T023, T024, T025 (US5 brzina — različiti fajlovi)
Phase 2: T007 (engine) ‖ T008 (URL) ‖ T009/T010 testovi posle T006/T007
```

## Implementation Strategy

1. MVP = Phase 2 + US1 (desktop filteri sa tačnim brojačima) + T022 (PDP paket, najveći pojedinačni dobitak).
2. Zatim US2 (telefon) i US3 (URL) — zajedno čine ceo UX.
3. US4 je pretežno test (arhitektura je već data-driven).
4. US5 ostatak + merenje posle + dokumentacija; usklađivanje sa granom na kraju.
