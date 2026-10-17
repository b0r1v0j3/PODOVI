# Implementation Plan: Filteri na početnoj strani i brzina sajta

**Branch**: `claude/home-filters-speed` | **Date**: 2026-10-17 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/001-filteri-pocetna-brzina/spec.md`

## Summary

Početna strana (jedini katalog sajta) dobija novi filter sloj: opšte grupe filtera koje rade bez izbora kategorije (Brend, Namena, Klasa upotrebe, Ugradnja, Dezen, Ton, Boja, Format, Uzorak, Debljina, Sloj habanja, Zvučna izolacija, R-klasa, Požarna klasa, Podno grejanje, Cena, Dostupnost) plus grupe specifične za kategoriju. Vrednosti se izračunavaju **na serveru** iz stvarnih spec podataka (kanonsko svođenje + nasleđivanje kolekcija↔boja) i šalju pregledaču kao sažete stavke; klijent filtrira jednim prolazom sa bit-maskama pa su brojači po konstrukciji jednaki rezultatima. Uz to: početna postaje keširana (ISR, 300 s), šalje se ~10× manje podataka, prve slike se učitavaju prioritetno a swatch sličice kroz optimizator slika; PDP gubi 13,4 MB slučajno uvezenog JSON-a iz klijentskog paketa; server funkcije prelaze u region blizu baze (fra1).

## Technical Context

**Language/Version**: TypeScript 5.5, React 18.3, Next.js 14.2.5 (App Router), Node 24 lokalno

**Primary Dependencies**: Next.js, TailwindCSS 3, Supabase JS (podaci), postojeći `lib/catalog/*` helperi

**Storage**: Supabase Postgres + JSON/TS izvori u repou (bez izmena šeme)

**Testing**: Vitest contract testovi (`npm run test:contract`), `next lint`, `tsc` kroz `next build`, Playwright (lokalno merenje i pregled u Chrome-u)

**Target Platform**: Vercel (Fluid Compute), moderni mobilni i desktop pregledači

**Project Type**: web aplikacija (Next.js monorepo bez odvojenog backenda)

**Performance Goals**: HTML početne ≥5× manji; početna iz keša; filter promena <100 ms na telefonu (4× CPU usporenje); PDP klijentski JS bez JSON izvora boja

**Constraints**: zadržati „Galerija" vizuelni jezik; `/crm` ostaje 404; PDP cene ostaju sveže (`force-no-store`); stari URL-ovi filtera rade; minimalni dodir sa fajlovima koje menja paralelna grana (`Header.tsx`, `app/layout.tsx`, `middleware.ts`, PDP `page.tsx`, `productDataLoader.ts`, `types/index.ts`)

**Scale/Scope**: ~1.130 kolekcijskih stavki (15 kategorija, 10+ brendova), ~3.400 boja/dekora; ~25 grupa filtera

## Constitution Check

*Projekat nema `.specify/memory/constitution.md`; ulogu ustava ima `AGENTS.md` (pravila vlasnika). Kapije:*

| Kapija (AGENTS.md) | Status |
|---|---|
| Ne krpiti — ceo pipeline (JSON → resolver → tip → komponenta) | ✅ Vrednosti filtera se izvode iz postojećih spec podataka kroz jedan deljeni modul (`facet-config`) koji koriste i server (početna, `/api/home-colors`) i testovi; nema novih izvora podataka |
| Pravilo 9: katalog i filteri rastu zajedno | ✅ Brend/kategorija/opšte grupe automatski iz podataka; grupe sa <2 vrednosti se kriju; test proverava da nema mrtvih opcija ni vrednosti van podataka |
| Ne izmišljati vrednosti | ✅ Nemapirani tokeni se odbacuju (osim grupa bez mape gde se prenosi sirova vrednost, npr. SCHÖNOX „Program") |
| Sajt na srpskom, dizajn „Galerija" | ✅ Postojeće komponente `FilterSection`/`FilterButton`, bez zaobljenja/senki |
| `/crm` isključen | ✅ Ne diramo middleware ni CRM |
| Gotcha 19: bez `fs` nad `public/` u runtime kodu | ✅ Samo statički importi koji već postoje |
| Gotcha 20: ne mutirati deljene `Product` objekte | ✅ Sažete stavke su nove strukture |
| Ažurirati AGENTS.md + arhitekturu u istom commit-u | ✅ Zadatak u fazi Polish |
| Objava na produkciju samo uz odobrenje | ✅ Samo grana + izveštaj |

Rezultat: PASS (bez opravdanih odstupanja).

## Project Structure

### Documentation (this feature)

```text
specs/001-filteri-pocetna-brzina/
├── plan.md              # ovaj fajl
├── research.md          # odluke i izmereno stanje
├── data-model.md        # stavka kataloga, faseta, stanje filtera
├── quickstart.md        # kako proveriti
├── contracts/
│   ├── home-filter-url.md      # URL ugovor (novi + stari format)
│   └── home-catalog-payload.md # sažeta stavka + /api/home-colors
├── performance-report.md # merenja pre/posle (posle implementacije)
└── tasks.md             # /speckit-tasks
```

### Source Code (repository root)

```text
lib/catalog/
├── facet-config.ts          # PROŠIRENO: opšte (scope 'all') + kategorijske definicije, numeričke grupe, derive/passthrough
├── facet-schema.ts          # NOVO: serijalizabilna šema grupa (labela, param, vrsta, redosled, prevodi) za klijent/URL
├── home-catalog-index.ts    # NOVO (server+test): Product → sažeta stavka sa kanonskim vrednostima i opsezima
├── home-filter-engine.ts    # NOVO (pure): bit-maska filtriranje, brojači, čipovi
├── home-filter-url.ts       # PROŠIRENO: opšte grupe i numerički opsezi u URL-u, migracija starih ključeva
└── home-filter-utils.ts     # postojeće (sortiranje, prikaz opcija)
lib/product-page/
├── spec-merge.ts            # NOVO: čist mergeSpecs (bez JSON importa)
└── color-helpers.ts         # re-export mergeSpecs iz spec-merge
app/
├── page.tsx                 # ISR (revalidate 300), bez searchParams, sažete stavke
└── api/home-colors/route.ts # sažete stavke boja sa kanonskim vrednostima
app/api/products/route.ts    # +categoryIds za hidrataciju „Uporedi"
app/uporedi/ComparePageClient.tsx # dopuni specifikacije sažetih stavki
components/
├── HomeProductTabs.tsx      # nov filter UI nad engine-om (desktop + fioka), dugme „Filteri" na telefonu
├── HomeFilterPanel.tsx      # NOVO: grupe (lista / da-ne / opseg), sklapanje, brojač izabranih
├── ProductCardClient.tsx    # priority za prvi red, optimizovane swatch sličice, precomputed href
└── ProductCharacteristics.tsx # uvoz mergeSpecs iz spec-merge
vercel.json                  # NOVO: regions ["fra1"]
tests/contracts/
├── home-catalog-index-contract.test.ts  # NOVO: kanonizacija, nasleđivanje, bez izmišljenih vrednosti
├── home-filter-engine-contract.test.ts  # NOVO: brojači == rezultati nad celim katalogom
├── home-filter-url-contract.test.ts     # PROŠIRENO: novi ključevi + stari linkovi
├── home-filter-ui-contract.test.ts      # PROŠIRENO: dugme Filteri, fioka
└── pdp-client-bundle-contract.test.ts   # NOVO: klijentske komponente ne uvoze color-helpers/JSON
```

**Structure Decision**: Jedan Next.js projekat; nova logika u `lib/catalog` kao čisti moduli (testabilni u Vitest-u bez pregledača), UI ostaje u `components/HomeProductTabs.tsx` uz izdvojen panel.

## Faze

**Faza A — Brzina bez rizika (nezavisno od filtera)**
1. `mergeSpecs` u `lib/product-page/spec-merge.ts`; `ProductCharacteristics` uvozi odatle → PDP klijentski paket bez ~13 MB JSON-a.
2. `vercel.json` sa `regions: ["fra1"]`.
3. Kartice: `priority` za prve 4 kartice kolekcija, swatch sličice kroz `next/image` (64 px) umesto originala kao CSS pozadina.

**Faza B — Podaci za filtere (server)**
4. Proširen `facet-config`: opšte grupe (`scope: 'all'`), numeričke grupe (`kind: 'range'`), izvedene grupe (`derive`), passthrough za grupe bez mape; kategorijske grupe zadržane.
5. `home-catalog-index`: sažeta stavka (kartica + `fv`/`nv`), nasleđivanje kolekcija↔boja po kategoriji, precomputed `href`.
6. `app/page.tsx`: ISR, bez `searchParams`; `/api/home-colors`: sažete stavke.

**Faza C — Filter engine + UI**
7. `home-filter-engine`: maske po grupi, rezultati, brojači (skip-own-group), politika missing (exclude/include), opsezi, kategorijsko važenje grupa.
8. `home-filter-url`: ključevi opštih grupa, `param=min-max`, migracija `application`, `thicknessMin/Max`, `facet=` za grupe koje su sada opšte.
9. `HomeProductTabs` + `HomeFilterPanel`: nove grupe, sklapanje sa brojem izabranih, numerički opsezi sa prečicama, dugme „Filteri (N)" iznad rezultata na telefonu, prazno stanje sa „skini poslednji filter".

**Faza D — Provera i dokumentacija**
10. Contract testovi, lint, build, pregled u pregledaču (390 px i 1440 px), merenje posle, `performance-report.md`, AGENTS.md + arhitektura.
11. Usklađivanje sa granom `codex/podovi-commerce-schonox` ako je commit-ovana.

## Complexity Tracking

Nema odstupanja od kapija.
