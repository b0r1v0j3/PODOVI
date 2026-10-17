# Research: Filteri na početnoj strani i brzina sajta

Datum: 2026-10-17. Izvori: graphify graf koda (1.340 čvorova, 60 zajednica; tok `app/page.tsx` → `product-repository` → `productDataLoader` → `HomeProductTabs` + `facet-config`), revizija stvarnih spec podataka (skripta nad `productRepository.findByCategory` za svih 15 kategorija), merenja produkcije i lokalnog production build-a.

## Izmereno stanje (pre)

| Nalaz | Vrednost | Posledica |
|---|---|---|
| HTML početne (produkcija) | 6,24 MB (431 KB gzip), `Cache-Control: no-store`, TTFB 2,7 s | svaki posetilac čeka generisanje + preuzima ceo katalog sa opisima |
| Sastav props-a početne | 4,9 MB JSON: `images` 2,5 MB, `specs` 0,8 MB, `documents` 0,7 MB, `description` 0,3 MB | kartice koriste <10% toga |
| Slike početne (telefon) | 6,6 MB, od toga swatch sličice = originali kao CSS pozadina | sporo i skupo na mobilnoj mreži |
| Prve kartice | sve `loading="lazy"`, bez prioriteta | lošiji LCP |
| PDP klijentski JS | `/proizvodi/[slug]` 787 kB first-load, chunk stranice 13,4 MB sirovo | uzrok: `ProductCharacteristics` (client) uvozi `mergeSpecs` iz `color-helpers.ts`, koji statički uvozi 16 JSON izvora boja |
| Region | produkcija `fra1::iad1` (funkcija u SAD); Supabase odgovara ~40 ms RTT iz Beograda (Evropa) | svaki upit iz funkcije prelazi Atlantik |
| Učitavanje podataka početne | ~6,2 s lokalno za 15 kategorija | ISR uklanja ovo iz putanje posetioca |
| Build | 16 min lokalno | nije cilj ove izmene |

Lokalna Web Vitals merenja (Playwright + Chrome, telefon: Slow 4G 150 ms RTT / 1,6 Mbps, 4× CPU; desktop: 40 ms / 10 Mbps): vidi `performance-report.md`.

## Revizija podataka za filtere (kolekcijske stavke početne)

| Kategorija | Kolekcija | Ključni spec ključevi (broj stavki) |
|---|---|---|
| vinil | 164 | type 151, thickness 151, format 106, nacin_ugradnje 57, komercijalna/industrijska/rezidencijalna klasifikacija 48/40/12, podno_grejanje 53, wear_layer 47, otpornost_na_klizanje 36 (R9/R10), tip_dezena 38, dizajn 41, debljina_habajuceg_sloja 30, zvucna_izolacija 20+22 |
| lvt | 45 | format 35, installation 19 + installation_method 16, classification_commercial_iso_10874 16, wear_layer_thickness 16, impact_sound_insulation 14, pattern_type 15, thickness/total_thickness 36 |
| tekstilne-ploce | 49 | klasa_upotrebe 43, podloga 46, vatrostojnost 27 |
| parket | 18 | wood_type 14, wear_layer 12, surface_treatment 9, locking_system 9, nijansa/boja/uzorak_polaganja/povrsinska_zastita 5 (Alpod), podno_grejanje 5 |
| laminat | 10 | commercial_class 10, abrasion_resistance_en_13329 8, overall_thickness 9, locking_system 9, underfloor_heating 8 |
| linoleum | 38 | ukupna_debljina 38, komercijalna_klasifikacija 23, industrijska 22, otpornost_na_klizanje_din_51130 19, impact_sound_insulation 19, akustika 9 |
| deking | 14 | debljina 14, ton_boje 12, vrsta_drveta 12, profil 12, tekstura 12, primena 12 („Uređenje eksterijera") |
| sport | 34 | format 34, nacin_ugradnje 21, ukupna_debljina 21, debljina_sloja_habanja 13, zvucna_izolacija 13 |
| elektroprovodni | 8 | esd_klasa 8, tip_instalacije 7, ukupna_debljina 8 |
| industrijske-ploce | 12 | installation 12, thickness 10 |
| lajsne | 35 | tip_proizvoda 30 (engleski: Wall base, Transitions & profiles…) |
| otiraci | 46 | __techem_top_category, boje 29, visina 25, nacin_ugradnje 25, namena 23 |
| vestacka-trava | 10 | rezidencijalna_klasifikacija 7, format 10, ukupna_debljina 8 |
| pribor | 16 (+135 SCHÖNOX u paralelnoj grani) | tip_proizvoda 12; SCHÖNOX: `type`, `program`, `availability` |
| alat | 0 kolekcija (635 Romus artikala kao stavke) | — |

Cene: samo 12 kolekcijskih stavki ima cenu (laminat 10, 1 industrijska, 1 ESD).

## Odluke

### D1 — Vrednosti filtera se računaju na serveru
- **Decision**: Kanonske vrednosti (`fv`) i numerički opsezi (`nv`) za svaku stavku računaju se u `lib/catalog/home-catalog-index.ts` na serveru (početna i `/api/home-colors`) uz nasleđivanje kolekcija↔boja nad celom kategorijom; klijent dobija samo rezultat.
- **Rationale**: Klijent više ne nosi pune specifikacije (0,8 MB) ni parsere; nasleđivanje je potpuno odmah (bez tihog prefetch-a boja); isti modul testira Vitest nad celim katalogom.
- **Alternatives**: klijentsko parsiranje kao do sada (sporije, veći payload, nepotpuno nasleđivanje do učitavanja boja).

### D2 — Jedan engine sa bit-maskama za rezultate i brojače
- **Decision**: `home-filter-engine.ts` za svaku stavku računa masku grupa koje prolazi; rezultat = stavke sa punom maskom; brojač opcije u grupi G = stavke koje prolaze sve osim G i imaju opciju (u „include" režimu i stavke bez podatka).
- **Rationale**: Brojači su po konstrukciji jednaki rezultatima (SC-002); O(stavke × grupe) ≈ 1.100 × 25 — ispod 10 ms.
- **Alternatives**: posebni predikati po grupi (sadašnje stanje — sporo, lako se razilaze).

### D3 — Opšte grupe + kategorijske grupe
- **Decision**: `CategoryFacetDef` dobija `scope` (opšta = sve kategorije), `kind` (`list` | `boolean` | `range`), `derive` (izvedene vrednosti, npr. Namena) i passthrough kad nema mape/parsera. Opšte: namena, klasa, ugradnja, dezen, ton, boja, format, uzorak, debljina, habanje, zvuk, rklasa, pozar, grejanje, cena, dostupnost. Kategorijske: tip (postojeći `type`), materijal (vinil), obrada/drvo (parket), ac (laminat), esd (elektroprovodni), tip (otirači), vrsta (lajsne/pribor), profil (deking), podloga (tekstilne ploče), kolekcija.
- **Rationale**: Kupac sužava ceo katalog bez biranja kategorije (FR-001); nova kategorija/brend automatski dobija opšte grupe (FR-005); passthrough čini grupu iz paralelne grane (`pribor: program`) ispravnom bez dodatnog koda.
- **Alternatives**: zadržati samo kategorijske grupe (ne ispunjava FR-001).

### D4 — Namena iz klase upotrebe
- **Decision**: 21–23 → Stambeni, 31–34 → Komercijalni, 41–43 → Industrijski (EN ISO 10874); Spoljašnji iz eksplicitne primene/namene („eksterijer", „spoljašnj", „outdoor"); engleske namene iz izvora („Home"→Stambeni; „School/Office/Hospital/Healthcare/Retail/Hotel"→Komercijalni).
- **Rationale**: Uklanja pogađanje iz opisa (FR-004); standardno izvođenje, ne izmišljanje.

### D5 — Numerički opsezi sa preklapanjem
- **Decision**: Sirova vrednost → lista intervala (`"2,5, 3,5"` → [2,5][3,5]; `"0.10 - 1.2mm"` → [0,10–1,2]; `"-19 dB"` → [19]); stavka prolazi opseg ako se bilo koji interval preklapa. Debljina/habanje u mm (vrednosti >100 mm se odbacuju), zvuk u dB, cena iz `price`. Prečice opsega (npr. „do 2,5 mm") prikazuju se samo kad imaju rezultate.
- **Rationale**: Podaci kolekcija često nose više debljina (varijante); preklapanje je jedino pošteno tumačenje bez izmišljanja.

### D6 — Početna kao ISR (300 s), URL stanje na klijentu
- **Decision**: `app/page.tsx` više ne čita `searchParams`; `export const revalidate = 300`. Klijent posle montiranja čita `window.location.search` i primenjuje stanje; Nazad/Napred preko `popstate` kao do sada.
- **Rationale**: Strana iz CDN keša (FR-019); generisanje (6 s podataka) van putanje posetioca. Cena na kartici kasni najviše ~5 min; PDP ostaje `force-no-store` (FR-021).
- **Alternatives**: zadržati dinamiku uz `unstable_cache` (i dalje render po zahtevu i 6 MB→0,8 MB HTML po zahtevu); `useSearchParams` (u statičkoj strani isključuje SSR kataloga).
- **Trade-off**: deep link sa filterima prvo prikaže podrazumevani raspored, pa posle hidratacije filtrirani (jedan re-render).

### D7 — Sažeta kartica
- **Decision**: Stavka nosi samo polja kartice: id, slug, name, sku, categoryId, brandId, price, priceUnit, inStock, `href` (precomputed), `images` (do 2 URL-a za `card`), `swatchImages` (do 3 `thumb` URL-a), spec `collection`. „Uporedi" dopunjuje specifikacije preko `/api/products?ids=` (proširen sa `categoryIds`).
- **Rationale**: ~5–8× manji HTML; kartica izgleda isto.

### D8 — PDP: čist `mergeSpecs`
- **Decision**: `mergeSpecs` u `lib/product-page/spec-merge.ts`; `color-helpers.ts` ga re-eksportuje (postojeći importi rade); `ProductCharacteristics.tsx` uvozi iz `spec-merge`. Contract test zabranjuje klijentskim komponentama uvoz `color-helpers`/`public/data`.
- **Rationale**: Uklanja ~13 MB iz PDP klijentskog paketa bez diranja PDP `page.tsx` (koji menja paralelna grana).

### D9 — Slike
- **Decision**: Prve 4 kartice taba Kolekcije dobijaju `priority`; swatch sličice idu kroz `next/image` (32 px, `sizes="32px"`, quality 60) umesto originala kao CSS `background-image`; nepodržani hostovi ostaju `unoptimized` po postojećem pravilu `image-runtime`.
- **Rationale**: LCP slika se traži odmah; ~5 MB manje slika na telefonu. Napomena: swatch URL-ovi su uglavnom isti izvori koje već optimizuje tab Boje/PDP.

### D10 — Region fra1
- **Decision**: `vercel.json` `{ "regions": ["fra1"] }`.
- **Rationale**: Baza je u Evropi; PDP i API (dinamični) gube transatlantski RTT po upitu. Stupa na snagu tek objavom (vlasnik).
- **Alternatives**: `vercel.ts` (`@vercel/config`) — dodatna zavisnost samo za jedno polje; podešavanje u Vercel dashboard-u (nije u repou).

### D11 — Spajanje sa granom `codex/podovi-commerce-schonox`
- **Decision**: Ne diramo `Header.tsx`, `app/layout.tsx`, `middleware.ts`, PDP `page.tsx`, `productDataLoader.ts`, `types/index.ts`, `homepage-collection-filter.ts`. U `facet-config.ts` zadržavamo `CATEGORY_FACETS` mapu (njihova linija `pribor: [...]` se spaja trivijalno) i dodajemo passthrough koji čini tu grupu ispravnom. `availability` se čita defanzivno (polje stiže iz njihove grane).
