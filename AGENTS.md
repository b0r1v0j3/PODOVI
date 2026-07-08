# 🏠 Podovi.online — AGENTS.md

> **Poslednje ažuriranje:** 08.07.2026 (Filteri 2.0 Faza 0 + dnevni pregled proizvoda)

---

## ⚠️ UPUTSTVO ZA AI (OBAVEZNO PROČITAJ PRVO)

Ovaj fajl je **jedini izvor istine** za ceo projekat. Svaki novi chat MORA da pročita ovaj fajl na početku rada.

### Pravila za čitanje:
1. Pročitaj **ceo** ovaj fajl pre nego što napišeš jednu liniju koda
2. Za detaljni data flow i pipeline, pročitaj `.agent/workflows/podovi-architecture.md`
3. Ako korisnik traži nešto što se kosi sa ovim planom — **pitaj ga** pre nego što uradiš bilo šta
4. Ne krpi — svaku promenu radi kompletno kroz **ceo pipeline** (JSON → resolver → tip → komponenta)
5. **UVEK predlaži unapređenja** — ti si partner u razvoju, ne samo izvršilac
6. **PROAKTIVNO USKLAĐIVANJE** — kad menjaš jedan sloj (npr. JSON), UVEK proveri šta treba na ostalim slojevima (resolver, komponente, klijentski importi). **NE ČEKAJ da korisnik primeti.**
7. **POSTAVLJAJ PITANJA** — ako nešto nije jasno, pitaj pre nego što nastaviš
8. **AŽURIRAJ DOKUMENTACIJU** — posle svake značajne promene ažuriraj `AGENTS.md` i `.agent/workflows/podovi-architecture.md` kao deo istog commit-a
9. **KATALOG I FILTERI RASTU ZAJEDNO** (pravilo vlasnika, 08.07.2026) — svaki put kad se proizvodi dodaju, menjaju ili uklanjaju, OBAVEZNO proveri i filtere i ostatak sajta: da li novi proizvodi imaju spec ključeve koje filteri očekuju, da li se pojavila nova vrednost/atribut koji zaslužuje filter opciju ili novu filter grupu, da li je neki filter ostao bez rezultata (mrtav), i da li brojevi u headeru/tabovima/brojačima i dalje štimaju. Ne čekaj da vlasnik primeti — pri svakoj promeni kataloga eksplicitno razmisli i predloži unapređenja filtera i sajta.
10. **DNEVNI PREGLED PROIZVODA** (pravilo vlasnika, 08.07.2026) — proizvode usavršavamo jedan dnevno, detaljno: naš prikaz + izvorni sajt podataka + sajt proizvođača. Evidencija pregledanih i nalazi: `docs/pregled-proizvoda.md` — OBAVEZNO proveri pre pregleda (bez duplih pregleda) i ažuriraj posle. Unapređenja sadržaja i prikaza da — promena dizajn jezika sajta NE.

### Pravila za ažuriranje ovog fajla:
1. **NIKAD ne briši Sekcije 1-4** — menjaju se samo kad vlasnik projekta to eksplicitno traži
2. **Sekcija 5 (Stanje Projekta)** — ažuriraj posle svakog završenog posla:
   - Dodaj novi unos u "✅ Završeno" sa datumom i kratkim opisom
   - Ažuriraj TODO listu ako si nešto završio ili dodao
   - **Nikad ne briši stare unose iz "Završeno"**
3. **Sekcija 6 (Arhitektura)** — ažuriraj SAMO kad se menja struktura fajlova ili data flow
4. Sajt je na **srpskom jeziku**. Ovaj fajl je na srpskom.
5. Kad ažuriraš ovaj fajl, promeni datum "Poslednje ažuriranje" na vrhu

---

## 1. 📌 ŠTA JE PODOVI.ONLINE

Podovi.online je **katalog podnih obloga, otirača i pratećeg asortimana** za tržište Srbije. Sajt služi kao online katalog firme Podovi DOO (Novi Sad) — kupci pregledaju proizvode, šalju upite, a prodaja se vrši offline.

### Ključni principi:
- **Nije e-commerce** — nema korpu ni checkout. Korisnici šalju upite za proizvode
- **Sajt je na srpskom jeziku** — sav sadržaj, nazivi, specifikacije su na srpskom
- **Multi-brand** — Tarkett, Gerflor, BLOQ, TimberTech, Wolflor, Techem, Romus, Podovi — svaki brend ima drugačiju strukturu podataka
- **Data-driven** — proizvodi dolaze iz kombinacije JSON fajlova, TypeScript data fajlova i Supabase baze
- **SEO optimizovan** — structured data, sitemap, meta tagovi za svaku stranicu

---

## 2. 🎨 DIZAJN I RAZVOJ — PRAVILA

### Tehnički stack:
- **Framework:** Next.js 14 (App Router), TypeScript
- **Styling:** TailwindCSS 3
- **Database:** Supabase (PostgreSQL) — upiti i kontakt forme
- **Email:** Nodemailer (Gmail SMTP)
- **Analytics:** Google Analytics 4
- **Deployment:** Vercel (auto-deploy sa main grane)

### Setup i pokretanje:
```bash
npm install
npm run dev        # Development (localhost:3000)
npm run build      # Production build (+ local/category/brand metadata asset validation + Techem first-party image contract)
npm start          # Production server
```

### Environment Variables:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Gmail SMTP
GMAIL_USER=podovidoo@gmail.com
GMAIL_APP_PASSWORD=

# App
NEXT_PUBLIC_BASE_URL=https://www.podovi.online
NEXT_PUBLIC_GA_MEASUREMENT_ID=

# Internal auth
CRM_BASIC_AUTH_USERNAME=
CRM_BASIC_AUTH_PASSWORD=
OPS_BASIC_AUTH_USERNAME=
OPS_BASIC_AUTH_PASSWORD=
OPS_BASIC_AUTH_ACTOR_ID=
```

---

## 3. 📦 PROIZVODI I KATEGORIJE

### Kategorije:
| Kategorija | ID | Brendovi | Izvor podataka |
|---|---|---|---|
| Laminat | 1 | Tarkett (3) | `lib/data/tarkett-products.ts` |
| Vinil | 2 | Gerflor (6), Tarkett (3), Wolflor (11), Podovi (14) | `vinyl_colors_complete.json` (25 kolekcija, 939 boja), `vinyl_special_colors.json` (2 kolekcije, 34 boje), `tarkett_vinyl_home_colors.json` (12 kolekcija, 281 boja), `tarkett_homogeneous_vinyl_colors.json` (20 kolekcija, 544 boje), `tarkett_heterogeneous_vinyl_colors.json` (15 kolekcija, 441 boja), `wolflor_vinyl_colors.json` (64 kolekcije, 771 dekora; 57 live + 7 PDF suplement, slike na Supabase), `alpod_floor_collections.json` (4 Podovi kolekcije / 372 dekora, izvor Alpod Store API) |
| Parket | 3 | Tarkett (3), Podovi (14) | `lib/data/tarkett-products.ts`, `alpod_floor_collections.json` (7 Podovi kolekcija / 359 opcija: 5 Store API kolekcija + Essence Premium + Four Seasons) |
| Tekstilne ploče | 4 | Gerflor (6), BLOQ (8) | `carpet_tiles_complete.json`, `bloq_carpet_tiles.json` |
| Deking | 5 | TimberTech (10), Podovi (14) | `tis_deking_products.json`, `alpod_floor_collections.json` (2 Podovi kolekcije / 120 artikala iz Alpod Store API; završne lajsne i WPC prateći artikli ostaju u Deking kategoriji, ne u našem `Lajsne` lane-u) |
| LVT | 6 | Gerflor (6), Tarkett | `lvt_colors_complete.json` (19 kolekcija, 595 boja), `tarkett_lvt_products.json` |
| Linoleum | 7 | Gerflor (6) | `linoleum_colors_complete.json` (15 kolekcija, 203 boje) |
| Elektroprovodni | 8 | Gerflor (6) | `esd_colors.json` (7 kolekcija, 42 boje) |
| Industrijske ploče | 9 | Gerflor (6) | `industrial_colors.json` (4 kolekcije, 75 boja) + `manual-collection-products.ts` |
| Sport | 10 | Gerflor (6), Tarkett (3) | `sport_colors.json` (3 kolekcije, 33 boje), `tarkett_sport_colors.json` (22 kolekcije, 255 boja) + `manual-collection-products.ts` |
| Lajsne | 11 | Tarkett (3) | `tarkett_lajsne_variants.json` (12 kolekcija, 326 varijanti) |
| Otirači | 12 | Techem (12) | `techem_mats.json` (46 kanonskih proizvoda; flat product dataset sa top-level `generatedAt`, mirrored product slikama na Supabase `product-images`, per-image `variants` mapom za `thumb/card/hero/og`, plus `characteristics`, `detailsSections`, `featureBullets`, `documents`, `alternateUrls`, `canonicalUrl`) |

### BLOQ Carpet Tiles (18 kolekcija, 210 boja):
| Familija | Kolekcije |
|---|---|
| Trinity | Assembly, Sensity, Unity (RELAX + BITBACK podloge) |
| Relief | Solace |
| Binary | Sculpture, Flow, Grain (planke 25x100cm), Renegade, Balance |
| Workplace | Rhythm, Connexion, Tradition |
| Textured | Canvas, Positive, Negative |
| Create | Small, Medium, Large |

---

## 4. 🔧 KRITIČNI DATA PIPELINE

> Za kompletni pipeline detaljno pročitaj `.agent/workflows/podovi-architecture.md`

```
JSON fajl → resolve-product.ts → Product objekat → page.tsx → UI komponente
```

### ⚠️ Kad dodaješ podatke — MORAŠ SVE KORAKE:
1. **JSON** — dodaj podatke u odgovarajući JSON fajl
2. **Tip** — ako je novo polje, dodaj u `Product` interface (`types/index.ts`)
3. **Resolver** — mapiraj novo polje u `lib/product-page/resolve-product.ts`
4. **Color merge** — ako se menja po boji, ažuriraj `mergeSelectedColor()` u `prepare-colors.ts`
5. **Komponenta** — osiguraj da UI komponenta prima i prikazuje polje
6. **Klijentski import** — ako komponenta direktno čita JSON, dodaj import novog izvora
7. **Build + test** — `npx next build`, lokalno testiranje, push

### Ključni fajlovi:
| Fajl | Uloga |
|---|---|
| `lib/product-page/resolve-product.ts` | **NAJKRITIČNIJI** — pretvara JSON → Product objekat |
| `lib/product-page/prepare-colors.ts` | Gradi color swatche, merge pri promeni boje |
| `app/proizvodi/[slug]/page.tsx` | Stranica proizvoda — renderuje sve sekcije |
| `components/ProductDocuments.tsx` | Prikazuje PDF dokumente (import JSON direktno!) |
| `components/ProductColorSelector.tsx` | Color selector sa instant image switching |
| `types/index.ts` | Product, Category, Brand tipovi |

### Ingest izvori (obogaćivanje kataloga):
- `tools/ingest_gerflor_cee.js` obogaćuje Gerflor vinil kolekcije u `vinyl_colors_complete.json` assetima u NAŠEM Supabase storage-u (bucket `product-images` za slike, `product-documents` za PDF; direktiva: nijedan asset se ne hotlinkuje sa sajtova proizvođača). Polja po kolekciji: `collection_image_url`, `documents[]` (čisti srpski naslovi, dedupe po naslovu), `room_scene_images[]`; `colors[].image` → Supabase 1500px. DB-resolvovani proizvodi dobijaju ova polja kroz `enrichProductFromCollectionData` (`lib/product-page/resolve-product.ts`). Manifest/backup u `output/`. Tvrdi timeout backstop (fetch/telo 35s, sharp 20s, upload 60s) u `tools/lib/ingest-core.js` sprečava višeminutna visenja.

---

## 5. 📋 STANJE PROJEKTA

### ✅ Završeno

**Filteri 2.0 — Faza 0 higijena + pregled proizvoda #1 Admonter (08.07.2026)**
- Novi util `lib/catalog/spec-normalize.ts`: `normalizeThicknessValue` (jedan format za sva poređenja debljine — "8"/"8.00"/"8 mm"/"8,0" su ista vrednost) i `resolveBrandTokens` (`?brands=` prihvata ID, slug i ime brenda; nepoznati tokeni se odbacuju umesto da daju 0 rezultata).
- `app/kategorije/[slug]/page.tsx`: validacija `?brands=` pre upita; laminat debljina poređenja normalizovana (bug `?thickness=8.00` → 0 rezultata); header sada prikazuje realne brojeve "X kolekcija · Y boja" umesto zbunjujućeg zbira "N proizvoda".
- `components/ProductFilters.tsx`: sanitizacija URL vrednosti (brend/debljina/vrsta drveta) protiv stvarnih opcija — brojač "N aktivno" više ne broji fantomske filtere koje nijedan checkbox ne prikazuje.
- `lib/repositories/product-repository.ts`: uklonjeno 15 duplih linoleum kolekcija u listinzima (legacy seed `dlw-*` vs catalog-derived `gerflor-dlw-*` — catalog verzija pobeđuje; legacy red ostaje u DB za direktnu rutu).
- Novi contract test `tests/contracts/filter-hygiene-contract.test.ts`; svi contract testovi prolaze, `next build` prolazi.
- Predlog Filteri 2.0 (istraženo: katalog, živi sajt, Tarkett/Gerflor/Forbo/Kährs/Quick-Step, Baymard) prihvaćen od vlasnika — sledi Faza 1: sortiranje na kategorijama, brojači uz opcije, čipovi aktivnih filtera, nove filter grupe iz postojećih specova (klasa upotrebe, ton, dezen, ugradnja...).
- Pokrenut dnevni pregled proizvoda (pravilo t.10): #1 Admonter — nalazi i predlozi u `docs/pregled-proizvoda.md` (16 nalaza: dupli specovi sa `?color=`, polomljeni decimali, izgubljene slike galerije, ERP šifre kao naslovi, kolekcija bez svoje slike...).

**Homepage faceted catalog pass (06.07.2026)**
- Početna strana je usmerena ka prihvaćenom minimalističkom katalog dizajnu sa oštrijim ivicama: uklonjen je gornji category rail (`Sve / Parket / Vinil...`) jer kategorije sada žive u levom filteru.
- `HomeProductTabs` sada podržava multi-select kategorije i filtere; logika je OR unutar iste sekcije i AND između sekcija, uz aktivne filter chipove i `Očisti sve`.
- Inquiry CTA `Imate projekat?` je izmešten iz apsolutnog overlay-a preko product grida u levi rail ispod filtera, pa više ne prekriva kolekcije.
- Homepage kolekcijske kartice dobijaju `swatchImages` iz postojećih color JSON izvora (`vinyl`, `tarkett`, `wolflor`, `lvt`, `linoleum`, `carpet`, `alpod`) kroz `app/page.tsx`, a `ProductCard*` koristi shared `getProductSwatchCandidates()` helper.
- Kartice/favorite/filter kontrole su vizuelno zategnute bez zaobljenih card ivica i bez teških hover senki, u skladu sa novim PDP pravcem.
- Verifikovano: `npm run lint`, `USE_MOCK_DATA=true npm run build`, Chrome QA za `/` desktop i mobile; potvrđeno 3 swatch kvadrata na karticama, bez top category rail-a, bez CTA preklapanja grida i sa multi-select category klikom.

**Homepage mockup fidelity pass (06.07.2026)**
- Početna strana je dodatno poravnata sa prihvaćenim ImageGen mockupom: globalni header/search/upit dugme, kraća top navigacija (`Sve`, `Parket`, `Vinil`, `LVT`, `Tekstilne ploče`, `Deking`), `Sve` kao aktivna gornja stavka i Vinil kao početni katalog fokus.
- `HomeProductTabs` sada koristi odvojeno stanje za top nav i aktivnu filter kategoriju, kompaktniji levi filter panel sa sekcijama iz mockupa (`Tip vinila`, `Primena`, `Debljina`, `Brand / brend`, collapsed `Izgled/Boja/Kolekcija`) i inquiry karticu overlay preko desne kolone na desktopu.
- Product kartice su vizuelno zategnute prema mockupu: slike idu do ivice kartice, proporcija slike je veća, tekst je kompaktniji, favorite dugme je manji rounded control, a grid počinje na istoj visini kao referenca.
- Verifikovano: `npm run lint`, browser QA za desktop `1536x1024`, mobile `390x844`, bez horizontalnog overflow-a, bez starog hero teksta i sa Wolflor brand filter interakcijom.

**Homepage katalog-first redizajn (06.07.2026)**
- `/` više ne renderuje stari full-bleed hero `Pod čini prostor`; početna strana sada odmah otvara katalog-first iskustvo u pravcu prihvaćenog ImageGen mockupa.
- `HomeProductTabs` je preuređen u stabilan home catalog shell: primarna horizontalna navigacija, desktop filter rail levo, Vinil kao početni fokus, sort kontrola, brend/type/debljina lokalni filteri, gušći grid proizvoda i desktop upit kartica.
- Uklonjena je client-side randomizacija početnih proizvoda da prvi viewport ostane stabilan za QA i produkciju.
- `ProductCard` / `ProductCardClient` su dodatno zategnuti za katalog density: stalno vidljiv favorite, mirniji hover, kompaktniji tekst i `Uporedi` kao stvarno klikabilan control.
- Verifikovano: `npm run lint`, `USE_MOCK_DATA=true npm run build`, browser QA za `/` desktop, mobile 390x844 i Wolflor brand filter interakciju.

**Katalog UI redizajn kategorijskih stranica (06.07.2026)**
- `/kategorije/[slug]` je preuređen u katalog-first layout: gornja traka glavnih kategorija, kompaktniji uvod, desktop filter rail levo i gušći grid proizvoda/kolekcija.
- `Header` sada na desktopu prikazuje centralnu search traku koja koristi postojeći `GlobalSearch` overlay, bez promene search API-ja ili navigacionog contract-a.
- `ProductCard` i `ProductCardClient` su vizuelno poravnati: framed slike, kompaktniji odnos slike/teksta, swatch preview iz postojećih image kandidata i vidljiv `Uporedi` affordance, uz zadržan shared `getCanonicalProductHref()` / `getProductImageCandidates()` lane.
- `ProductFilters` zadržava postojeći mobile drawer, a na desktopu renderuje isti filter state kao lepljivi panel; query parametri i CategoryTabs data flow nisu menjani.
- Verifikovano: `npm run lint`, `USE_MOCK_DATA=true npx next build`, browser QA za `/kategorije/vinil` desktop, mobile 390x844, filter drawer i `type=heterogeni` interakciju.

**Alpod-source Parket/Vinil/Deking kompletiran kao Podovi katalog (14.05.2026)**
- `public/data/alpod_floor_collections.json`, generisan kroz `tools/extract_alpod_floor_collections.js`, sada uvozi sve što javni Alpod Store API vraća pod Parket, Vinil i Spoljašnje podne obloge, plus Parket menijske stranice `Essence Premium` i `Four Seasons`: ukupno 851 stavka u 13 kolekcija (Parket 7/359, Vinil 4/372, Deking 2/120).
- Deking prateći artikli iz Alpod stabla (`Podkonstrukcija`, `Pričvršćivači`, `Šrafovi`, `Završne lajsne`, `Poklopci za daske`, `Premazi...`) ostaju mapirani u našu Deking kategoriju (`5`), a ne u našu kategoriju `Lajsne` (`11`).
- Alpod se čuva kao upstream izvor/eksterni URL, ali nije vidljivi brend. Za prikaz brenda/logoa koristi se novi interni fallback brend `Podovi` (ID `14`) i `public/images/brands/podovi.svg`, jer proizvođački logoi nisu dostupni.
- Proširen je ceo collection-aware tok: `productDataLoader.ts`, `product-repository.ts`, `color-helpers.ts`, `prepare-colors.ts`, `/api/colors`, `/api/color-data`, kategorijski tabovi, canonical rute i PDP selector za Podovi imported Vinil/Parket/Deking kolekcije.
- Ispravljeno posle produkcijske provere: `product-repository.ts` sada za category flow vraća i Podovi varijante (ne samo header kolekcije), `app/kategorije/[slug]/page.tsx` uvodi Deking u `CategoryTabs` i dopušta Podovi parket varijante u tabu Boje, a `app/proizvodi/[slug]/page.tsx` više ne skriva selector za Podovi Deking kolekcije.
- Regression gate `tests/contracts/podovi-import-contract.test.ts` zaključava 4/372 Vinil, 7/359 Parket i 2/120 Deking Podovi import, PDP selector boje/varijante i `/api/colors` nested payload za Podovi Parket/Deking. Verifikovano: `npm run lint`, `npm run validate:images`, `npm run test:contract`, `npm run build`, produkcijski Vercel deploy.
- `www.alpod.rs` je dodat u image allowlist contract (`next.config.mjs`, `image-runtime.ts`, `image-runtime-contract.test.ts`, `validate-images.js`) da uvezene slike mogu da rade kroz isti Next image pipeline.

**Otirači uklonjeni iz glavne navigacije (22.04.2026)**
- `components/Header.tsx` više ne prikazuje link `Otirači` u desktop navigaciji.
- Isti link je uklonjen i iz mobilnog menija, dok sama kategorija/stranica ostaje dostupna direktnim URL-om.

**Alpod parket banner dodat iznad kategorija (22.04.2026)**
- `app/page.tsx` sada prikazuje uzak kvalitetan image banner iznad početne mreže kategorija, bez vraćanja starog hero teksta i CTA dugmadi.
- Banner asset je preuzet sa Alpod parketi stranice i dodat lokalno kao `public/images/homepage/alpod-parketi-banner.webp` u proporciji 2560x486.

**Otirači uklonjeni sa početne strane (22.04.2026)**
- `app/page.tsx` više ne prikazuje kategoriju `otiraci` u početnoj mreži kategorija.
- Uklonjen Techem/otirač primer iz početne sekcije "Izdvojeni proizvodi".

**Početna strana otvara direktno kategorije (22.04.2026)**
- Uklonjen početni hero/banner sa velikom podnom slikom i CTA dugmadima iz `app/page.tsx`.
- Uklonjen uvodni naslov, divider i opis iznad mreže kategorija, tako da klikabilne kategorije počinju odmah ispod glavne navigacije.

**Vercel deploy trace hotfix za Techem/Otirači release slice (17.04.2026)**
- Produkcioni deploy za commit `feat: ship Techem catalog and discovery updates` nije padao na compile/test/build fazi, već na Vercel trace/packaging sloju: serverless NFT za `api/ops/*` i `api/search` je zbog runtime `fs` proverâ u `lib/utils/productDataLoader.ts` uvlačio ogromne foldere iz `public/`, uključujući `public/images/products` i teške lokalne PDF dokumente.
- `productDataLoader.ts` više ne koristi runtime `fs.existsSync` / `path.join(process.cwd(), 'public', ...)` za izbor lokalnih collection hero asseta, niti dinamički čita Techem JSON sa diska. Techem sada ide preko direktnog `techem_mats.json` importa, a izbor lokalnih Tarkett/BLOQ collection asseta koristi statičke manifeste iz novog `lib/data/local-asset-manifests.ts`.
- Time su `getTarkettLVTCollections()`, `getAllBloqCarpetProducts()`, `getAllTechemProducts()` i ops/search import lane zadržali isti user-facing contract, ali bez Vercel trace eksplozije nad celim `public/` stablom.
- Verifikovano: `npm run test:contract`, `npm run lint`, `npx tsx scripts/audit-catalog-quality.ts`, `npm run check:health`, `npm run build`, plus lokalna provera da `.next/server/app/api/*/*.nft.json` više ne sadrži `public/images/products`, `public/documents/lvt` ni `public/documents/wolflor`.

**Legacy code-only direct-color canonical slug poravnat za Gerflor vinil/sport route alias-e (17.04.2026)**
- `lib/utils/product-routes.ts` sada za Gerflor direct-color rute u kategorijama `Vinil` i `Sport` ne zadržava sirovi code-only slug u canonical query parametru kada route već ide na parent collection PDP. Route oblici tipa `/proizvodi/0319` i `/proizvodi/1123` sada canonicalizuju na `/proizvodi/gerflor-...?...color=<generated-color-slug>` umesto na skraćeni `?color=0319/1123`.
- Time su metadata i runtime redirect ponovo poravnati i za starije code-only alias ulaze, ne samo za full direct-color slugove sa foreign same-category `?color=`. Ovo posebno zatvara drift gde je parent PDP bio ispravan, ali je query param ostajao nekononski i gubio puni nested slug oblik.
- `tests/contracts/seo-contract.test.ts` je proširen novim metadata + runtime regression gate-ovima za `/proizvodi/0319` i `/proizvodi/1123`, a postojeći direct-color vinyl/sport canaryji su ojačani da koriste non-first route boju i generated Gerflor sport foreign slug (`dlw-colorette-sport-1001-banana-yellow`) umesto praznog `color.slug` fixture lookup-a.
- Verifikovano: `npx vitest run --config vitest.contract.config.ts tests/contracts/seo-contract.test.ts`.

**Direct-color vinil canonical short-circuit poravnat za stray `?color=` query na metadata + runtime sloju (17.04.2026)**
- `app/proizvodi/[slug]/page.tsx` sada pre selected-color normalizacije prepoznaje direct-color PDP hit za mixed-brand kategorije `Vinil` i `Sport` i odmah ga kanonizuje na parent collection PDP (`/proizvodi/<collection>?color=<route-color>`), umesto da dodatni query param uopšte uđe u širi selected-color fallback lane.
- Time route oblici tipa `/proizvodi/tarkett-bold-color-mist-1?color=wolflor-andes-wl91600` više ne mogu da emituju pogrešan canonical/OG URL niti da prođu kroz runtime sa foreign same-category dekorom; metadata i redirect sada odmah gađaju isti finalni collection URL za sam route color.
- `tests/contracts/seo-contract.test.ts` je proširen direct-color canary proverama za mixed-brand vinil: jedan metadata test i jedan runtime redirect test sada eksplicitno zaključavaju da foreign same-category `?color=` na direct-color ruti završava na parent collection PDP-u bez helper drifta.
- Verifikovano: `npx vitest run --config vitest.contract.config.ts tests/contracts/seo-contract.test.ts`, `npm run test:contract`, `npm run lint`, `npm run build`.

**Alias collection invalid-color canonical redirect poravnat single-hop kroz metadata + runtime lane (17.04.2026)**
- `app/proizvodi/[slug]/page.tsx` sada u `resolveCanonicalSelectedColorSlug()` validira `?color=` prvo preko collection-scoped `prepareCustomColors()` za kanonsku collection rutu, pa tek onda pada nazad na shared server selected-color helper; time alias hit više ne može da prihvati “tuđu” ali stvarnu boju iz druge kolekcije samo zato što globalni JSON lookup zna taj slug.
- U istom prolazu je uklonjen poseban rani linoleum redirect `/proizvodi/gerflor-xxx -> /proizvodi/xxx` sa sirovim query stringom; prefixed linoleum aliasi sada prolaze kroz isti kasniji canonical redirect lane kao ostale collection alias rute, pa `/proizvodi/gerflor-dlw-uni-walton?color=...` više ne ide kroz međukorak sa zadržanim nevažećim `?color=`.
- `tests/contracts/seo-contract.test.ts` je proširen sa dva nova regression gate-a: alias metadata mora da canonicalizuje i foreign same-catalog color slug na prvi validan dekor ciljne kolekcije, a runtime `ProductPage` mora da uradi tačno jedan redirect za linoleum alias + invalid color direktno na finalni kanonski URL.
- Verifikovano: `npx vitest run --config vitest.contract.config.ts tests/contracts/seo-contract.test.ts`, `npm run test:contract`, `npm run lint`, `npx tsx scripts/audit-catalog-quality.ts`, `npm run check:health`, `npm run build`.

**Selected-color docs/specs SSR i canonical alias metadata poravnati kroz shared server helper (17.04.2026)**
- `lib/product-page/color-helpers.ts` sada nosi shared `resolveSelectedColorServerData()` koji preko kanonskog `loadColorFromJson()` sklapa isti selected-color payload za server i client lane: `specs` iz `buildSpecsFromColor()`, `characteristics` projektovane iz tih istih specova i normalizovana `documents` lista. `ColorFromJSON` i nested collection merge sada čuvaju i `documents`, pa direct color resolution (`colorToProduct()`) više ne gubi color-level PDF-ove.
- `lib/product-page/prepare-colors.ts` je prevezan na isti helper, pa `mergeSelectedColor()` više ne ažurira samo hero/specs/opis nego i `product.documents`; time `app/proizvodi/[slug]/page.tsx` sada dobija tačan `sharedDocs` gate već na SSR-u, umesto da `ProductDocuments` tek posle mount-a ispravlja stale collection dokumenta za validan `?color=`.
- `/api/color-data` više ne održava poseban slabiji slug matcher i ručno sklapan `characteristics` map; ruta sada koristi isti shared helper i vraća `documents`, `characteristics` i `specs`, dok `components/ProductCharacteristics.tsx` preferira kanonski `specs` payload i resetuje transient state pri promeni `?color=` kako specs ne bi kratko ostajale na prethodnoj boji.
- `lib/utils/product-routes.ts` je dobio `getCanonicalCollectionAliasHref()`, a `app/proizvodi/[slug]/page.tsx` ga sada koristi i u runtime redirect lane-u i u `generateMetadata()`. Time alias hitovi tipa `/proizvodi/creation-30?color=ballerina-41870347` više ne emituju alias canonical / OG URL, već kanonski prefixed PDP href.
- Regression gate je proširen kroz `tests/contracts/color-api-contract.test.ts`, `tests/contracts/resolver-contract.test.ts` i `tests/contracts/seo-contract.test.ts`: selected-color API sada mora da vrati doc-backed nested vinyl payload, server merge mora da uveze color-level dokumente i ključne specove, a metadata mora da canonicalizuje alias collection URL i kada je validan `?color=` već prisutan.
- Verifikovano: `npm run test:contract`, `npm run lint`, `npx tsx scripts/audit-catalog-quality.ts`, `npm run check:health`, `npm run build`.

**Selected-color image precedence poravnata kroz client, resolver i SEO (17.04.2026)**
- `lib/utils/product-images.ts` sada nosi shared helper `getColorImageCandidates()` / `getPrimaryColorImage()`, pa eksplicitni `?color=` više nema tri različita image redosleda zavisno od toga da li ga bira `ColorGrid`, server `mergeSelectedColor()` ili SEO metadata lane.
- `components/ColorGrid.tsx`, `components/ProductColorSelector.tsx`, `lib/product-page/prepare-colors.ts` i `lib/product-page/color-helpers.ts` su prevezani na isti helper: klik na dekor, client hero render, resolver fallback (`colorToProduct` / `collectionFromColor`) i server merge sada biraju isti primary color asset (`texture` → `lifestyle` → `image_url` → legacy `image`), umesto ranijeg drifta između `image_url`-first i `texture`-first grana.
- U istom prolazu je zatvoren i konkretan BLOQ correctness bug: `loadColorFromJson()` sada ume da vrati BLOQ tile slug iz `bloq_carpet_tiles.json`, pa `mergeSelectedColor()` konačno ažurira `product.images` i za BLOQ collection PDP; time OG/Twitter/Product JSON-LD više ne ostaju na collection cover-u kada je izabrana konkretna BLOQ ploča.
- `components/ProductColorSelector.tsx` sada ima i derived active-color context, pa `share` naslov i `kontakt?name=` više ne ostaju collection-only na prvom renderu kada je `?color=` već eksplicitan i validan.
- Regression gate je proširen u `tests/contracts/product-image-variants-contract.test.ts`, `tests/contracts/resolver-contract.test.ts` i `tests/contracts/seo-contract.test.ts`: helper contract proverava ordered candidate lane, resolver merge očekuje shared hero izbor, a colored PDP metadata sada mora da deli isti primary image kao selected-color helper.
- Verifikovano: `npx vitest run --config vitest.contract.config.ts tests/contracts/product-image-variants-contract.test.ts`, `npx vitest run --config vitest.contract.config.ts tests/contracts/resolver-contract.test.ts`, `npx vitest run --config vitest.contract.config.ts tests/contracts/seo-contract.test.ts`, `npm run test:contract`, `npm run lint`, `npx tsx scripts/audit-catalog-quality.ts`, `npm run check:health`, `npm run build`.

**Collection-first PDP hero i linoleum customColors fallback poravnati kroz resolver + selector pipeline (17.04.2026)**
- `components/ProductColorSelector.tsx` i `components/ColorGrid.tsx` sada čuvaju collection cover kao vidljivi PDP hero dok ne postoji eksplicitni `?color=` izbor; više nema tihog auto-pomeranja na prvu varijantu pri mount-u, niti info blok prikazuje `backing_variants` prve boje kada korisnik još nije izabrao dekor.
- `lib/utils/product-images.ts` dobio je shared helper `getCustomColorHeroImageState()`, pa selector render, aktivna varijanta i contract testovi dele isti source-of-truth za pravilo: bez `?color=` ostaje `initialImage`, sa validnim `?color=` prelazi se na odgovarajući variant image.
- `lib/product-page/prepare-colors.ts` sada uključuje i category `7` (`linoleum`) u `prepareCustomColors()`, koristeći route/product slug kandidata umesto globalnog fallback-a; time server-side validacija `?color=` više nije globalna po celom JSON-u nego collection-scoped i za linoleum lane.
- `lib/product-page/resolve-product.ts` više ne pada odmah na `collectionFromColor()` kada repo promaši collection/product slug, već pre toga koristi loader-grade `getProductBySlug()` fallback sa slug-candidate normalizacijom (`gerflor-/tarkett-/wolflor-/bloq-/techem-`). Time collection PDP fallback zadržava isti hero/spec/docs contract kao listing lane, umesto da se vrati na “prvu boju” proizvod.
- Regression gate je proširen kroz `tests/contracts/product-image-variants-contract.test.ts` i `tests/contracts/resolver-contract.test.ts`: collection cover mora da ostane vidljiv bez eksplicitne boje, linoleum mora da vrati `customColors`, a resolver snapshot baseline je osvežen na bogatiji loader contract.
- Verifikovano: `npx vitest run --config vitest.contract.config.ts tests/contracts/product-image-variants-contract.test.ts`, `npx vitest run --config vitest.contract.config.ts tests/contracts/resolver-contract.test.ts -u`, `npm run test:contract`, `npm run lint`, `npx tsx scripts/audit-catalog-quality.ts`, `npm run check:health`, `npm run build`.

**BLOQ roomshot i Tarkett LVT collection hero source-of-truth poravnati kroz loader contract (17.04.2026)**
- `lib/utils/productDataLoader.ts` sada i za preostala dva lane-a koristi shared collection hero izbor: BLOQ collection headeri biraju stvarni lokalni roomshot asset (`/images/products/bloq-roomshots/bloq-<slug>-roomshot.jpg`) kada postoji, uz fallback na prvi tile/swatch image, dok Tarkett LVT collection headeri prvo koriste kurirani override iz `public/data/collection_images.json`, pa tek zatim lokalni `/images/tarkett/collections/<slug>.jpg` i prvi design image.
- Time je uklonjen stari split source-of-truth za Tarkett LVT: `lib/repositories/product-repository.ts` više ne radi poseban post-merge remap collection hero slike samo za listing/search lane, pa isti `tarkett-*` collection slug više ne može da dobije jedan hero na listingu, a drugi na PDP fallback-u.
- U istom prolazu je zatvoren i konkretan BLOQ naming bug: loader je ranije sastavljao roomshot putanje kao `${slug}-roomshot.jpg`, dok su realni fajlovi u `public/images/products/bloq-roomshots/` imenovani kao `bloq-<slug>-roomshot.jpg`.
- Regression gate `tests/contracts/product-image-variants-contract.test.ts` sada eksplicitno zakucava oba lane-a: BLOQ collection roomshot ostaje ispred prvog swatch-a, a Tarkett LVT collection header ostaje na kuriranom `collection_images.json` cover assetu ispred prvog design image URL-a.
- Verifikovano: `npm run test:contract`, `npm run lint`, `npx tsx scripts/audit-catalog-quality.ts`, `npm run check:health`, `npm run build`.

**Shared collection hero asset contract uveden kroz loader i manual collection lane (17.04.2026)**
- `lib/utils/catalog-assets.ts` je proširen novim shared helperom `selectPreferredCollectionHeroAsset()`, pa ordered izbor kolekcijske hero slike više nije rasut kroz sirove `a || b || ''` grane ili implicitni fallback po dužini stringa.
- `lib/utils/productDataLoader.ts` i `lib/data/manual-collection-products.ts` sada dele isti contract za collection/header hero lane: Gerflor vinyl/ESD override slike, Tarkett `collection_image_url`, BLOQ roomshot, Tarkett LVT curated/local cover fallback, manual collection JSON hero i Wolflor first-color precedence svi prolaze kroz isti helper, uz eksplicitno zadržan Wolflor izuzetak (`firstColor` pre `collection_image_url`).
- Gerflor LVT i Linoleum collection headeri više ne biraju hero preko `pickRichestText()` i dužine URL-a; sada koriste ordered candidate lane (`lifestyle_url` pa `image_url` za LVT, odnosno prvi validni `image_url` za linoleum), što zatvara latentni drift kada više dekora u istoj kolekciji ima različito dugačke putanje.
- U istom prolazu `productDataLoader.ts` je očišćen od function-local `require('@/public/data/...')` za `vinyl_colors_complete.json` i `esd_colors.json`, pa su i ti lane-ovi konačno stabilni u Vitest contract harness-u umesto da budu zavisni od runtime alias rezolucije.
- Regression gate je proširen u `tests/contracts/catalog-asset-selection-contract.test.ts` i `tests/contracts/product-image-variants-contract.test.ts`: helper sada ima direktan ordered/placeholder test, a loader suite eksplicitno proverava Gerflor vinyl override, Tarkett lajsne `collection_image_url` i ordered Gerflor LVT/Linoleum collection hero izbor.
- `scripts/audit-catalog-quality.ts` local asset proveru sada radi nad oba file-system kandidata (`raw %20` path i `decodeURIComponent` path), pa URL-encoded lokalni BLOQ asseti više ne dižu lažne `missing_local_primary_image_asset` nalaze.
- Verifikovano: `npm run test:contract`, `npm run lint`, `npx tsx scripts/audit-catalog-quality.ts`, `npm run check:health`, `npm run build`.

**Repo-level metadata asset selection poravnat za kategorije i brendove + build guard proširen (17.04.2026)**
- Uveden je shared helper `lib/utils/catalog-assets.ts` sa `selectPreferredCatalogAsset()` / `isPlaceholderCatalogAsset()`, a `brandRepository` i `categoryRepository` su sada owner repo-level metadata asset izbora: page/SEO sloj više ne sme da zavisi od sirovog Supabase `row.logo` / `row.image` prioriteta kada postoji bolji kurirani fallback u `mock-data.ts`.
- Pravilo je sada eksplicitno: kurirani fallback iz `mock-data.ts` ima prednost nad DB override-om kada nije placeholder; DB asset sme da pobedi samo ako je fallback placeholder ili prazan, pa stale DB hero/logo više ne može tiho da pregazi kanonski category/brand metadata asset.
- Dodat je regression gate `tests/contracts/catalog-asset-selection-contract.test.ts` koji proverava helper contract i repo ponašanje za oba smera prioriteta (`curated > weak DB`, `real DB > placeholder fallback`), dok je `tests/contracts/seo-contract.test.ts` proširen page-level proverama da category metadata i `CollectionPage.image` ostanu poravnati, a brand metadata/schema izostave placeholder logo assete.
- `scripts/validate-images.js` sada pored lokalnih asset putanja i Techem remote contract-a proverava i category/brand metadata assete iz `mock-data.ts` (`categories[].image`, `brands[].logo` bez placeholdera): lokalni fajl mora da postoji, remote asset mora da bude `https`, na allowlist hostu i bez supplier hostova.
- Verifikovano: `npm run test:contract`, `npm run lint`, `npm run build`.

**SEO image/schema parity centralizovan kroz shared helper za PDP, kategorije i brendove (17.04.2026)**
- `lib/utils/product-images.ts` i `lib/seo/structured-data.ts` sada zajedno čine kanonski SEO image contract: `resolveMetadataImageUrl()` propušta samo validne `https` URL-ove, `getMetadataImageSet()` više ne tvrdi `1200x630` kada realno padne na non-OG fallback, a `generateProductSchema()` / `generateCollectionPageSchema()` više ne održavaju paralelne page-local image heuristike.
- `app/proizvodi/[slug]/page.tsx` više ne sklapa Product JSON-LD ručno iz `hero` lane-a, već koristi `generateProductSchema()` sa istim shared metadata image izborom koji već hrane OG/Twitter tagovi; time `Product.image`, `openGraph.images[0]` i `twitter.images[0]` više ne mogu da driftuju.
- `app/kategorije/[slug]/page.tsx` i `app/brendovi/[slug]/page.tsx` sada koriste isti `createMetadataImage()` / `getMetadataImageUrls()` contract za OG/Twitter i isti `generateCollectionPageSchema()` helper za `CollectionPage` JSON-LD; category/brand schema sada dobija `image` samo kroz shared normalizator, bez ručnog sastavljanja URL-a.
- Brand metadata/schema više ne emituju placeholder logo asset kao social/schema sliku: kada brend nema stvarni logo, metadata i JSON-LD sada radije izostavljaju `image/logo` nego da guraju `/images/placeholder.svg`.
- `tests/contracts/seo-contract.test.ts` je proširen regression gate-om koji renderuje PDP JSON-LD script i proverava parity sa OG/Twitter slikom, plus helper testom da `generateProductSchema()` odbacuje non-`https` image candidate; verifikovano: `npm run test:contract`, `npm run lint`, `npm run build`, `npx tsx scripts/audit-catalog-quality.ts`, `npm run check:health`.

**Shared runtime image fallback uveden kroz PDP, kartice, search i saved-item surface-e (17.04.2026)**
- `components/ProductImage.tsx` više ne pada direktno na placeholder čim prvi URL pukne, već pokušava sledeći ordered kandidat i tek kada nijedan ne prođe prikazuje fallback stanje; isti runtime lane sada koriste PDP hero, product kartice, favorites, compare, search rezultati, recommended accessories i recently-viewed površine.
- `lib/utils/product-images.ts` je proširen u pravi source-of-truth i za fallback redosled: pored surface izbora (`thumb/card/hero/og`) sada daje i deduplikovane ordered candidate nizove, pa surface-i više ne smeju lokalno da čitaju `images[0]` ili da održavaju svoje paralelne image heuristike.
- `components/ProductViewTracker.tsx`, `components/RecentlyViewed.tsx` i `/api/search` više ne čuvaju samo jedan spljošteni image URL kada imaju bolji source, već prenose i kratki ordered candidate lane (`imageCandidates`) tako da recently-viewed/search UI može da preživi prvi broken thumb bez novog otvaranja proizvoda.
- U istom prolazu je zatvoren correctness bug u `lib/utils/productDataLoader.ts`: Techem raw image `variants` iz `techem_mats.json` više se ne gube pri normalizaciji, pa runtime surface/fallback helper zaista dobija `thumb/card/hero/og` lane umesto da tiho pada nazad na originalni `url`.
- Regression gate `tests/contracts/product-image-variants-contract.test.ts` sada pored surface izbora proverava i loader-preserved Techem variants + candidate normalizaciju, a verifikovano je: `npm run test:contract`, `npm run lint`, `npm run build`, `npx tsx scripts/audit-catalog-quality.ts`, `npm run check:health`.

**Techem image variants uvedene kroz extractor, shared helper i flat UI surface-e (17.04.2026)**
- `tools/extract_techem_mats.py` sada pri `--upload-supabase` ne mirroruje samo originalne Techem slike, već za svaki asset generiše i uploaduje `thumb`, `card`, `hero` i `og` varijante u isti `product-images` bucket; regenerisani `public/data/techem_mats.json` sada čuva `heroImage`, `galleryImages` i `images` kao object lane sa `url` + `variants`, umesto čistih string URL-ova.
- `types/index.ts`, `lib/utils/productDataLoader.ts` i `lib/utils/product-images.ts` su prošireni tako da `ProductImage` sada opciono nosi `variants`, a shared helper bira odgovarajući URL po surface-u: `thumb` za search/compare/recently-viewed, `card` za listing/favorites, `hero` za PDP i `og` za metadata.
- `app/api/search/route.ts`, `components/ProductCard.tsx`, `components/ProductCardClient.tsx`, `components/ProductViewTracker.tsx`, `components/CompareBar.tsx`, `app/omiljeni/FavoritesPageClient.tsx` i `app/uporedi/ComparePageClient.tsx` više ne čitaju Techem slike kroz sirovi `images[0]` lane, već kroz shared surface-aware helper.
- Dodat je novi regression gate `tests/contracts/product-image-variants-contract.test.ts`, dok su `tests/contracts/seo-contract.test.ts`, `scripts/validate-images.js` i `scripts/audit-catalog-quality.ts` prošireni da proveravaju i variant URL-ove, ne samo prve 3 legacy image reference.
- Verifikovano: `python -m py_compile tools/extract_techem_mats.py`, `python tools/extract_techem_mats.py --upload-supabase`, `npm run test:contract`, `npm run lint`, `npm run build`, `npx tsx scripts/audit-catalog-quality.ts`, `npm run check:health`.

**Next/Image runtime contract zategnut na eksplicitan host allowlist + flat client surface-i više ne gube remote slike (17.04.2026)**
- Uveden je novi shared helper `lib/utils/image-runtime.ts` koji predstavlja runtime contract za `next/image`: `isOptimizableImageSrc()` i `shouldBypassNextImageOptimization()` sada centralno odlučuju da li je slika optimizabilna, umesto starog blanket obrasca `unoptimized={!src.startsWith('/')}` razasutog po karticama i pretragama.
- `next.config.mjs` više ne koristi wildcard `hostname: '**'`; `remotePatterns` su svedeni na eksplicitne katalog hostove koje realno puštamo kroz `next/image` (`Supabase product-images`, `media.tarkett-image.com`, `cdn.gerflor.com`, plus first-party `podovi.online` / `www.podovi.online` za apsolutne lokalne asset URL-ove kada se pojave kroz DB/fallback sloj).
- `components/ProductImage.tsx`, `components/ProductCard.tsx`, `components/ProductCardClient.tsx`, `components/BrandCard.tsx`, `components/CategoryCard.tsx`, `components/GlobalSearch.tsx`, `components/RecentlyViewed.tsx`, `components/CompareBar.tsx`, `app/omiljeni/FavoritesPageClient.tsx` i `app/uporedi/ComparePageClient.tsx` sada dele isti helper, pa favorites/compare/recently-viewed/search više ne odbacuju remote first-party katalog slike samo zato što URL nije lokalni `/...` path.
- `lib/seo/metadata.ts` sada za OG/Twitter image set koristi isti metadata URL normalizator kao category/brand/PDP surface-i, pa više ne postoji latentni bypass gde raw image URL može da preskoči first-party/allowlist contract samo kroz generic metadata helper.
- Dodat je novi regression gate `tests/contracts/image-runtime-contract.test.ts` koji proverava da su samo lokalni + allowlist hostovi optimizabilni i da `next.config.mjs` više nikada ne vrati wildcard remote host obrazac.
- Verifikovano: `npm run test:contract`, `npm run lint`, `npm run build`.

**Techem product slike prebačene na first-party hosting + metadata asset lane zatvoren (17.04.2026)**
- `tools/extract_techem_mats.py` sada podržava `--upload-supabase`: nakon kanonizacije, deduplikacije i srpske lokalizacije diže svih 196 Techem hero/gallery asseta u Supabase `product-images` bucket pod `products/otiraci/...`, upisuje verzionisane public URL-ove nazad u `public/data/techem_mats.json` i time uklanja supplier hotlink zavisnost sa PDP-a, kartica, JSON-LD i social metadata sloja.
- `lib/data/mock-data.ts` više ne koristi supplier thumbnail/logo za Techem category/brand hub surface-e: `/kategorije/otiraci` sada ide preko lokalnog `public/images/categories/otiraci.jpg`, a `/brendovi/techem` preko lokalnog `public/images/brands/techem-logo-en.png`, pa category/brand metadata više nisu vezani za Techem WordPress asset host.
- `lib/utils/product-images.ts` je proširen shared `resolveMetadataImageUrl()` helperom, pa `app/kategorije/[slug]/page.tsx`, `app/brendovi/[slug]/page.tsx`, `app/proizvodi/[slug]/page.tsx`, `components/ProductCard.tsx`, `components/ProductCardClient.tsx` i `scripts/audit-catalog-quality.ts` sada dele isti contract za primary image / metadata image URL normalizaciju umesto paralelnih lokalnih heuristika.
- `scripts/validate-images.js` sada proverava lokalne `url`/`image`/`logo` asset reference iz `mock-data.ts` i enforce-uje da Techem metadata image candidates više ne smeju da ostanu na supplier hostu, već moraju da budu na first-party kontrolisanom hostu (`Supabase` ili `podovi.online`); od image-variant prolaza proverava i sve Techem variant URL-ove, ne samo legacy hero/gallery reference.
- `tests/contracts/seo-contract.test.ts` sada pored PDP metadata proverava i da `/kategorije/otiraci` i `/brendovi/techem` emituju first-party metadata slike, dok `scripts/audit-catalog-quality.ts` prijavljuje `techem_supplier_image_hotlink` ako supplier hero ikad ponovo uđe u Techem dataset.

**Techem sitemap freshness + PDP metadata polish poravnati na kanonski dataset (17.04.2026)**
- `lib/utils/productDataLoader.ts` sada kešira ceo Techem dataset payload i izlaže `getTechemDatasetGeneratedAt()`, dok `getAllTechemProducts()` koristi top-level `generatedAt` iz `public/data/techem_mats.json` kao fallback `createdAt` / `updatedAt` za flat Techem proizvode kada supplier zapis nema sopstveni timestamp.
- `app/sitemap.ts` više ne emituje redirecting PDP slugove, već koristi shared canonical product href contract iz `lib/utils/product-routes.ts`; shared hub stranice (`/`, `/kategorije`, `/brendovi`, `/kontakt`, `/upiti`) sada nose freshest poznati katalog datum, dok category/brand detail i Techem PDP-ovi dobijaju `lastModified` iz realnog product skupa, a `/kategorije/otiraci` i `/brendovi/techem` dodatno mešaju i Techem dataset `generatedAt` kako copy-only SEO izmene ne bi ostale nevidljive sitemap-u.
- `app/proizvodi/[slug]/page.tsx` metadata grana sada za Techem koristi prirodniji srpski meta description bez flooring/color fallback fraza tipa `dostupne boje`, uz keyword enrichment iz hidden `__techem_family` / `__techem_top_category` signala, capped social description i sigurniji OG/Twitter image set iz prve stvarne galerije/hero slike; wording za `dokumentacija` se prikazuje samo kada PDP zaista ima dokumente.
- Uveden je novi shared helper `lib/utils/product-images.ts`, pa PDP metadata, vidljivi hero i catalog audit više ne biraju primary/ordered sliku kroz odvojene lokalne heuristike; `app/proizvodi/[slug]/page.tsx` i `scripts/audit-catalog-quality.ts` sada dele isti product-image selection contract.
- `scripts/validate-images.js` više ne proverava samo lokalne `/images` assete iz statičkih data fajlova, već i Techem metadata image contract offline-safe: regex sada zaista hvata i `mock-data.ts` `url/image/logo` putanje, odsutan `public/data/techem_mats.json` ruši build umesto tihog prolaza, a svaka Techem stavka mora da ima bar jedan metadata image candidate sa validnim `https` URL-om, na first-party kontrolisanom hostu i sa image-like putanjom, bez live HTTP zavisnosti u build-u.
- Dodat je novi regression gate u `tests/contracts/seo-contract.test.ts` koji sada pokriva kanonske sitemap PDP href-ove, Techem freshness za sitemap surface-e, Techem flat-product metadata copy i dataset-wide first-party metadata image host/protocol contract.
- U istom prolazu je poravnat i page-local fallback brand map za TimberTech sa aktuelnim mock fallback contract-om kako PDP ne bi držao zastareli logo path mimo `mock-data.ts`.
- Verifikovano: `npm run lint`, `npm run test:contract`, `npm run build`.

**Brand source completeness + repo count simetrija poravnati za TimberTech i hub metrike (17.04.2026)**
- `lib/data/mock-data.ts` sada konačno uključuje i kanonski brend `TimberTech` (`id: 10`), pa `/brendovi`, `/brendovi/timbertech` i summary metrike više ne zavise od toga da li je taj brend ručno dodat u Supabase ili ostane orphan samo kroz deking proizvode.
- `lib/repositories/product-repository.ts` više nema poseban divergentan `findByBrand()` merge lane; Supabase implementacija sada delegira na `findAll({ brandIds: [brandId] })`, tako da brand detail i brand hub koriste isti DB + JSON/manual merge contract za Gerflor, Tarkett, BLOQ, TimberTech, Wolflor i Techem.
- `app/kategorije/page.tsx` više ne računa `Aktivni brendovi` iz sirovih product foreign key vrednosti, već iz preseka proizvoda i `brandRepository.findAll()` skupa; time `/kategorije` summary ostaje poravnat sa `/brendovi` čak i kada se pojavi parcijalni ili fallback-only brand lane.
- `app/brendovi/page.tsx` metadata i intro copy su poravnati sa aktuelnim brend scope-om i sada eksplicitno priznaju TimberTech uz Techem/Tarkett/Gerflor/BLOQ/Wolflor lane.
- Verifikovano: repo sanity-check (`brandCount=6`, aktivni brand IDs `3,6,8,10,11,12`), `npm run lint`, `npm run test:contract`, `npm run build`.

**Brand detail curation + canonical product href helper poravnati kroz listing/search/PDP sloj (17.04.2026)**
- Uveden je novi shared util `lib/utils/product-routes.ts` koji sada predstavlja source-of-truth za kanonski public product href: `ProductCard`, `ProductCardClient`, `/api/search`, `generateProductListSchema()` i `app/proizvodi/[slug]/page.tsx` više ne drže divergentne ručne grane za `/kategorije/...` naspram `/proizvodi/...`, već svi gađaju isti PDP canonical contract sa `?color=` tamo gde zaista postoji collection-grade route.
- `lib/product-page/resolve-product.ts` više ne održava zasebnu copy-paste collection normalizaciju, već koristi isti route normalization sloj, pa prefix pravila za `gerflor-`, `tarkett-`, `wolflor-`, `bloq-` i `techem-` više nisu razasuta po resolver/page/card/search kodu.
- `app/brendovi/[slug]/page.tsx` sada radi collection-first curation preko `lib/catalog/brand-curation.ts`: Gerflor, Tarkett, BLOQ i Wolflor brand stranice više ne izlistavaju mešavinu kolekcija i pojedinačnih varijanti pod jednim gridom, već prikazuju kurirani collection view, dok Techem i TimberTech ostaju flat `products/asortiman` lane.
- Brand detail copy i schema su poravnati sa novim režimom: count kartica, grid heading, `CollectionPage` name i Gerflor info blok sada koriste `kolekcije` / `asortiman` semantiku umesto da sve nazivaju `proizvodi`; fallback brand SEO copy u `lib/seo/listing-page-copy.ts` je prebačen sa `Proizvodi` na širi `Katalog`.
- Verifikovano: `npm run lint`, `npm run test:contract`, `npm run build`.

**Category/home discoverability sloj + repo fallback hardening poravnati posle Techem launch-a (17.04.2026)**
- `app/kategorije/page.tsx` više nije samo breadcrumb + grid, već category hub sa pravim `h1` uvodom, summary count blokovima, `BreadcrumbList` + `CollectionPage` JSON-LD i server-side brojem proizvoda po kategoriji; `components/CategoryCard.tsx` sada opcionalno prikazuje category count i u istom prolazu je očišćen dupli `isDeking` branch.
- `app/page.tsx`, `app/layout.tsx`, `lib/seo/structured-data.ts`, `components/Footer.tsx` i `components/WhatsAppButton.tsx` su poravnati na aktuelni katalog scope: sajt više nije copy/SEO-wise predstavljen kao flooring-only, već kao katalog podnih obloga, lajsni, otirača i pratećih sistema.
- Header i global search dobili su jači discoverability signal za novi lane: `components/Header.tsx` sada ima direktan quick-link ka `/kategorije/otiraci`, a `components/GlobalSearch.tsx` + `app/api/search/route.ts` više ne glume product-only search, već koriste category slike i brand logo signal za dropdown rezultate.
- Homepage sada daje eksplicitniji entry za `Otirače`: hero ima direktan CTA ka `/kategorije/otiraci`, a `Izdvojeni proizvodi` više nisu ograničeni samo na stari LVT/Linoleum/Tekstilne set, već rezervišu i Techem slot kroz `getAllTechemProducts()`.
- Ispravljen je i repo correctness sloj koji je počeo da utiče na live hub count-ove: `category-repository.ts` sada mapira DB kategorije nazad na legacy/mock identitet po slug-u (umesto sirovih UUID-jeva), `brand-repository.ts` radi field-level backfill iz mock fallback-a za logo/description/website/country kada DB red postoji ali je tanak, a `product-repository.ts` više ne prekida ceo merge lane na `findAll()` DB grešci pre nego što JSON/manual izvori stignu do surface-a.
- Verifikovano: `npm run lint`, `npm run test:contract`, `npm run build`.

**Brand hub semantika + kartice poravnate sa novim listing SEO slojem (17.04.2026)**
- `components/BrandCard.tsx` više nema neispravan nested link obrazac (`/brendovi/[slug]` link oko internog sadržaja + zaseban spoljašnji `website` CTA); kartice sada drže odvojene interakcije za interni katalog i supplier sajt, uz prikaz stvarnog `brand.logo` gde postoji i fallback inicijala samo za placeholder/no-logo scenarije.
- `app/brendovi/page.tsx` je pojačan iz prostog grida u pravi brand hub: uvodni `h1` blok, summary count kartice (`brendovi`, `proizvodi`, `pokrivene kategorije`), category chips i `BreadcrumbList` + `CollectionPage` JSON-LD za `/brendovi`.
- Brand kartice sada dobijaju `productCount` iz server-side agregacije (`brandRepository` + `productRepository` + `categoryRepository`), pa listing odmah pokazuje dubinu kataloga po brendu umesto čistog statičkog opisa.
- `README.md` je dodatno poravnat da `BrandCard.tsx` više ne stoji kao homepage komponenta, već kao kartica za `/brendovi` listing.
- Verifikovano: `npm run lint`, `npm run build`.

**Techem SEO/content landing sloj + search discoverability poravnati (17.04.2026)**
- Dodat je novi helper `lib/seo/listing-page-copy.ts` koji centralizuje metadata i user-facing intro copy za category/brand listing stranice, sa specijalizovanim srpskim SEO copy-jem za `Otirači` i `Techem`, uz bezbedan fallback za ostale kategorije i brendove.
- `app/kategorije/[slug]/page.tsx` i `app/brendovi/[slug]/page.tsx` sada renderuju stvarni `h1` + uvodni sadržaj iznad grida, koriste bogatiji metadata sloj (`title`, `description`, `keywords`, `canonical`, `OG`, `Twitter`) i emituju `BreadcrumbList` + `CollectionPage` / `ItemList` JSON-LD za listing površine.
- `app/proizvodi/[slug]/page.tsx` je očvrsnut za flat Techem katalog: product JSON-LD sada normalizuje apsolutne Techem image URL-ove, upisuje `url` i više ne emituje prazan `Offer` kada cena ne postoji.
- `/api/search` sada za category/brand rezultate match-uje i SEO/helper copy, dok Techem product search u `product-repository.ts` pretražuje i `shortDescription` + hidden `__techem_family` / `__techem_top_category` signal; `components/GlobalSearch.tsx` više ne menja Techem remote slike placeholder-om i prikazuje koristan subtitle kada cena ne postoji.
- `lib/data/mock-data.ts`, `app/brendovi/page.tsx` i `README.md` su poravnati na aktuelni `Otirači` / `Techem` scope, uključujući Techem website kao product-catalog entry point umesto generičkog English home-a.
- Verifikovano: `npm run lint`, `npm run test:contract`, `npm run build`.

**Techem supplier copy lokalizovan na srpski bez menjanja kanonskog URL/slug contract-a (17.04.2026)**
- `tools/extract_techem_mats.py` sada radi user-facing lokalizaciju tek posle Techem kanonizacije, deduplikacije i `technical data sheet` attach koraka, tako da English `/en/products/` tree ostaje jedini source-of-truth za discovery, `slug`, `sourceSlug`, `canonicalUrl`, `alternateUrls` i `lineages`, dok sajt dobija srpske nazive, opise, sekcije, dokument naslove i spec label-e.
- Uveden je lokalizacioni sloj za `topCategory`, `family`, `name`, `shortDescription`, `description`, `characteristics`, `detailsSections`, `featureBullets` i `documents`, uz kurirane override-e za branded/family proizvode i ručne fallback specifikacije za Techem stavke koje supplier payload ostavlja previše tanke (`Trend Mats`, `Steel Gratings`, anti-fatigue podloge).
- `scripts/audit-catalog-quality.ts` i `scripts/product-health-check.ts` sada za Techem računaju samo user-facing/specs koji nisu hidden `__techem_*`, a audit dodatno prijavljuje `unlocalized_techem_copy` ako se English supplier copy vrati u budućem refresh-u.
- Verifikovano: `python tools/extract_techem_mats.py`, `python -m py_compile tools/extract_techem_mats.py`, `npx tsx scripts/audit-catalog-quality.ts`, `npm run test:contract`, `npm run check:health`, `npm run lint`, `npm run build`.

**Techem otirači uvedeni kao nova flat kategorija kroz ceo katalog pipeline (16.04.2026)**
- Dodat je novi kanonski izvor `public/data/techem_mats.json`, generisan kroz `tools/extract_techem_mats.py`, koji sa javnog Techem English sitemap/product stabla uvodi 46 kanonskih proizvoda za novu kategoriju `Otirači` i brend `Techem`.
- Extractor sada radi family-first kanonizaciju: izbacuje `Visit our e-shop`, spaja 2 exact duplicate grupe, ručno collapse-uje 6 secondary-navigation alias URL-ova iz `external-wipers` na kanonske family/product rute i čuva `alternateUrls`, `lineages`, `canonicalUrl`, tehničke PDF-ove i scrape pravila u samom datasetu.
- Proširen je flat category `12` pipeline kroz `mock-data.ts`, `productDataLoader.ts`, `product-repository.ts`, `resolve-product.ts`, `ProductCard*`, `CategoryCard`, footer, search i product/category rute, tako da `/kategorije/otiraci`, `/brendovi/techem` i `/proizvodi/techem-...` rade bez color-selector toka i bez naslanjanja na `/api/colors`.
- `productDataLoader.ts` sada za Techem mapira `characteristics` u `specs`, `featureBullets` u `benefits`, `heroImage + galleryImages` u product gallery, `detailsSections` i `documents` u postojeći `Product` contract, dok se supplier linking metadata čuva kao hidden spec (`__techem_*`) i filtrira iz user-facing prikaza preko `filterSpecsForDisplay()`.
- Quality gate je proširen i na Techem: `scripts/audit-catalog-quality.ts` i `scripts/product-health-check.ts` sada uključuju `getAllTechemProducts()`, a audit dodatno hvata polomljen `www.www.techem...` URL obrazac ako se vrati u budućem refresh-u.
- Verifikovano: `python tools/extract_techem_mats.py`, `npm run lint`, `npm run test:contract`, `npm run check:health`, `npx tsx scripts/audit-catalog-quality.ts`, `npm run build`.

**Ops auth hardening + rollback snapshot fix + listing cache invalidation (07.04.2026)**
- Uveden je shared internal Basic Auth helper `lib/auth/internal-basic-auth.ts`, a `middleware.ts` i svi `app/api/ops/*` handleri sada zahtevaju autentifikovan interni identitet pre bilo kakvog draft/review/publish/rollback/audit poziva.
- `/api/ops` više ne veruje `actorId` vrednosti iz request body-ja: route sloj vezuje poziv za autentifikovani Basic Auth identitet (`OPS_BASIC_AUTH_*`, uz fallback na `CRM_BASIC_AUTH_*` ako se namerno deli isti interni nalog), a kada auth nije konfigurisan ops rute ostaju eksplicitno disabled umesto javno otvorene površine.
- `lib/ops/repository.ts` više nema bootstrap fallback koji je svakom actoru davao `publisher` rolu kada je `ops_role_bindings` tabela prazna; sada je role binding obavezan bez implicitnih privilegija.
- `lib/ops/service-contract.ts` rollback više ne reaplikuje snapshot target release-a, već vraća poslednje prethodno stabilno stanje (ili za undo rollback-a snapshot release-a koji je rollback poništio), tako da rollback zaista vraća katalog na raniji state.
- `components/CategoryTabs.tsx` sada invalidira client color cache kada se promeni `listing` mode, pa `core/accessory/all` filter više ne može da ostavi stale boje/varijante iz prethodnog segmenta.
- `lib/product-page/resolve-product.ts` je popravljen da Gerflor collection fallback zaista vrati enriched collection podatke umesto da enrichment pozove i odbaci rezultat.
- Verifikovano: `npm run test:contract`, `npm run lint`, `npm run check:health`, `npm run build`.

**Extractor refresh + rollback runbook uveden za kanonske supplier izvore (07.04.2026)**
- Dodat je novi operativni runbook `.agent/workflows/extractor-refresh-rollback-runbook.md` sa punim refresh redosledom za sve kanonske extractore (`extract_tarkett_wood`, `extract_tarkett_vinyl_home`, `extract_tarkett_homogeneous_vinyl`, `extract_tarkett_heterogeneous_vinyl`, `extract_tarkett_sports`, `extract_tarkett_lajsne`, `extract_wolflor_vinyl`), obaveznim pre-flight/post-flight checkovima i incident rollback matricom.
- `.agent/workflows/podovi-architecture.md` je proširen linkom ka runbook-u i pravilom da svaka promena extractor contract-a mora u istom commit-u da ažurira i taj runbook.
- Runbook eksplicitno definiše ownership handoff za budućeg Data Automation Engineera (cadence, artefakti, rollback disciplina), tako da lane više nema implicitno usmeno znanje.

**Accessory taxonomy listing contract + filter mode uvedeni kroz ceo category pipeline (07.04.2026)**
- Uveden je kanonski taxonomy izvor `public/data/catalog_listing_taxonomy.json` (`defaultModeByCategory` + `categories[].accessoryCollectionSlugs`) koji sada predstavlja jedini source-of-truth za `core`/`accessory` razdvajanje na category listingu.
- `lib/catalog/listing-curation.ts` je proširen iz hardcode lajsne hide liste u shared taxonomy sloj sa eksplicitnim API-jem: `resolveCategoryListingMode`, `getCategoryCollectionSegment`, `filterCategoryListingCollections`, segment count helper i backward-compatible `isCollectionHiddenFromCategoryListing`.
- Category SSR i client listing flow su poravnati na isti contract: `app/kategorije/[slug]/page.tsx` sada čita `listing` query (`core`/`accessory`/`all`) i prosleđuje mode u `CategoryTabs`, dok `CategoryTabs` i `/api/colors` koriste isti listing mode za nested collection/count normalization (bez tihog drifta između taba i API odgovora).
- `components/ProductFilters.tsx` dobio je user-facing segment filter `Prikaz asortimana` (`Kolekcije`, `Prateći asortiman`, `Sve stavke`) sa URL sinhronizacijom preko `listing` query parametra, uključujući reset i deep-link ponašanje.
- `types/index.ts` (`ProductFilters`) i `.agent/workflows/podovi-architecture.md` su ažurirani sa novim listing taxonomy contract-om i migration pravilom: svaki novi accessory collection slug mora da se registruje u `catalog_listing_taxonomy.json`.

**Ops-console Phase 1 lifecycle, publish i rollback contract kompletiran (07.04.2026)**
- Ops domen je proširen sa punim schema slojem u `supabase/migration.sql`: dodate su tabele `ops_collections`, `ops_variants`, `ops_documents`, `ops_releases`, `ops_release_change_sets`, `ops_snapshots`, `ops_audit_events`, `ops_role_bindings`, plus proširen `ops_change_items` check constraint za `variant_metadata`/`curation_rule`.
- Uveden je append-only audit guard (`prevent_ops_audit_events_mutation`) i service-role RLS politike za sve nove ops tabele, tako da release/snapshot/audit lane radi kao interni, server-side tok.
- `lib/ops/service-contract.ts` i `lib/ops/repository.ts` sada pokrivaju ceo lifecycle: draft (`collection_metadata`, `variant_metadata`, `document`) → submit → review (`approve/reject`, no self-approve za high/critical) → publish release + snapshot + audit → rollback release preko snapshot-a sa kompenzacionim release zapisom.
- Minimalni interni API contract iz spec-a je kompletiran kroz nove rute: `POST /api/ops/change-sets/[id]/submit`, `POST /api/ops/change-sets/[id]/approve`, `POST /api/ops/releases/publish`, `POST /api/ops/releases/[id]/rollback`, `GET /api/ops/audit-events`, plus pomoćni `POST /api/ops/change-sets/[id]/variants` za variant draft upis.
- Verifikovano: `npm run build`, `npm run test:contract`.

**Ops-console metadata/docs service contract slice uveden (07.04.2026)**
- Uveden je novi server-side ops sloj (`lib/ops/*`) sa tipovima, Supabase repo adapterom i servisnim contract metodama za metadata draft (`createMetadataDraft`) i document draft (`upsertDocumentDraft`) nad kolekcijama.
- Dodate su minimalne interne API rute `POST /api/ops/change-sets`, `GET /api/ops/change-sets/[id]` i `POST /api/ops/change-sets/[id]/documents` kao Phase 1 handoff površina za budući admin UI.
- Ugrađena je invariant validacija protiv postojećeg product pipeline-a: collection slug mora da prođe kroz `resolveProductBySlug`, metadata patch ima allowlist pravila, a document URL-ovi moraju da budu PDF i pod uslovima (`/documents/...` ili apsolutni `http/https`), uz Tarkett `/docs/` normalizaciju.
- `supabase/migration.sql` je proširen ops schema draft-om za `ops_change_sets`, `ops_change_items`, `ops_review_decisions`, `ops_publish_audit_events` + indeksi i service-role RLS politike, tako da su change-set, review decision i publish audit event tokovi spremni za implementaciju inženjera.
- Verifikovano: `npm run build`.

**Resolver + color API contract regression test gate uveden (07.04.2026)**
- Uveden je Vitest contract harness (`vitest.contract.config.ts`) sa setup slojem za `USE_MOCK_DATA`, tako da `resolve-product.ts` i `prepare-colors.ts` imaju stabilne regression testove bez zavisnosti od live Supabase query-ja.
- Dodati su snapshot/contract testovi u `tests/contracts/resolver-contract.test.ts` i `tests/contracts/color-api-contract.test.ts` koji pokrivaju `resolveProductBySlug`, `mergeSelectedColor`, `/api/colors` i `/api/color-data` payload oblike.
- `package.json` sada ima `test:contract` i `test:contract:update` skripte za redovan drift check i namerno re-baseline-ovanje snapshota.
- Dodat GitHub Actions workflow `.github/workflows/contract-tests.yml` koji pokreće contract suite na svakom PR-u i push-u ka `main`, kao merge gate protiv tihog schema/API drifta.
- Verifikovano: `npm run test:contract:update`, `npm run test:contract`, `npm run build`.

**Prateći Tarkett asortiman privremeno sakriven iz `Lajsne` kategorijskog listinga (05.04.2026)**
- `TARKETT GENIUS Traka` i `Tarkodry podloga za podove i zidove` nisu obrisani iz kanonskog `tarkett_lajsne_variants.json` izvora niti iz product ruta, ali su privremeno isključeni iz server-side `Kolekcije` taba na `/kategorije/lajsne` jer su user-facing prateći asortiman, a ne same lajsne.
- Dodata je shared curation logika u `lib/catalog/listing-curation.ts`, pa isto pravilo važi i za client-side `Varijante` tab u `CategoryTabs`: count i grid više ne uvlače varijante iz ta dva accessory sluga samo na kategorijskoj stranici.
- Time kanonski data source i direktni URL-ovi ostaju netaknuti, ali live `Lajsne` kategorija ostaje vizuelno čista i fokusirana na stvarne lajsne dok ne uvedemo posebnu taksonomiju za prateći asortiman.
- Verifikovano: `npm run build`.

**Tarkett lajsne uključene u canonical catalog audit + dopunjeni collection PDF-ovi (31.03.2026)**
- `scripts/audit-catalog-quality.ts` sada pokriva i Tarkett lajsne kao pun kanonski izvor: collection header proizvode iz `getTarkettLajsneCollections()`, nested JSON dataset `tarkett_lajsne_variants.json` i `missing_documents` proveru za `TARKETT-LAJSNE-*` SKU obrasce.
- U istom prolazu je otkriveno da deo Tarkett lajsni ne drži dokumenta u `collection_assets`, već u zasebnim poljima `specifications_pdf_url` i `format_table_pdf_url`; `tools/extract_tarkett_lajsne.js` sada spaja i te direktne collection PDF URL-ove, uključujući `//www.tarkett.rs/sr_RS/pdf/...` oblike.
- Time lajsne više ne ostaju van standardnog repo quality gate-a za opise, hero slike, dokumenta i eventualni declared-count mismatch, a refresh extractora više ne gubi tehnički list / tabelu formata samo zato što Tarkett payload koristi drugi obrazac za dokumenta.
- U istom prolazu dokumentacija je poravnata na trenutni kanonski count od 12 kolekcija i 326 varijanti, bez starog 327 mismatch-a.
- Verifikovano: `node tools/extract_tarkett_lajsne.js --upload-supabase`, `npx tsx scripts/audit-catalog-quality.ts` (`Actionable: high=0, medium=0, low=0`), `npm run build`.

**Tarkett lajsne asset pipeline prebačen na Supabase + hi-res cleanup (31.03.2026)**
- `tools/extract_tarkett_lajsne.js` sada više ne ostavlja lajsne na vendor hotlinkovima: podržava `--upload-supabase`, automatski diže collection i variant JPG assete u `product-images` bucket pod `products/lajsne/...` i upisuje verzionisane Supabase public URL-ove nazad u `public/data/tarkett_lajsne_variants.json`.
- Za Tarkett slike je uveden kvalitetniji source izbor: downloader prioritetno pokušava `large-high` (`1920x1920` / `3000x1688`) i pada nazad na `large` / `medium` samo kad konkretan asset ne postoji u jačem formatu, umesto da sajt ostane na slabijim `large` URL-ovima po default-u.
- Uveden je fallback za Tarkett placeholder / alias edge-case-ove kod lajsni: extractor sada ignoriše `NOT SPECIFIED` assete, preferira stabilniji design thumbnail ispred polomljenog hero URL-a, a prazne slike popunjava iz sibling varijante sa istim SKU-om samo kad je konkretna varijanta ostala bez asseta.
- Katalog je očišćen od jednog duplog vendor alias zapisa, pa lajsne sada završavaju kao 12 kolekcija i 326 varijanti sa `0` preostalih vendor image URL-ova u JSON-u; i `mock-data.ts` kategorijska slika za `lajsne` sada pokazuje naš Supabase-hostovan hero umesto Tarkett CDN linka.
- Verifikovano: `node tools/extract_tarkett_lajsne.js --upload-supabase --force-upload`, sanity-check da `badCount=0 / vendorImages=0` u finalnom JSON-u, `npm run build`.

**Tarkett lajsne dodat kao nova kategorija kroz ceo katalog pipeline (31.03.2026)**
- Dodat je novi zvanični izvor `public/data/tarkett_lajsne_variants.json` sa Tarkett Srbija stranice `Lajsne`: 12 kolekcija i 326 varijanti, uključujući dekorativne zidne lajsne, furnir/MDF kolekcije, sportske lajsne i prateći pribor koji zvanični Tarkett katalog grupiše na toj category strani.
- Kreiran je novi extractor `tools/extract_tarkett_lajsne.js` koji preko Playwright-a uzima collection linkove sa category grida, koristi `window.__NUXT__` payload po collection stranici i sanitizuje očigledne Tarkett typo/spojene reči pre snimanja JSON-a.
- Proširen je ceo category `11` pipeline kroz `mock-data.ts`, `productDataLoader.ts`, `product-repository.ts`, `resolve-product.ts`, `prepare-colors.ts`, `color-helpers.ts`, `/api/colors`, `/api/color-data`, `CategoryTabs`, `ColorGrid`, `ProductColorSelector`, `ProductCard*` i product/category rute, tako da `/kategorije/lajsne` i `/proizvodi/tarkett-...` rade isto kao ostale nested kolekcije.
- UI za novu kategoriju više ne koristi generički termin `Boje`, već user-facing `Varijante`, uključujući tab label, compact selector, modal i grid headinge na product strani.
- Verifikovano: `node tools/extract_tarkett_lajsne.js`, `npx tsx` sanity-check za `findByCategory('11')` + `resolveProductBySlug(...)`, `npm run build`.

**Minimalni CRM skeleton dodat preko postojećih inquiry leadova (29.03.2026)**
- Dodata je interna ruta `app/crm/page.tsx` koja čita postojeće product inquiry leadove iz Supabase-a i grupiše ih po osnovnom sales flow-u (`new`, `contacted`, `qualified`, `offer_sent`, `negotiation`, `won`, `lost`, `closed`), uz pregled follow-up obaveza za danas i kašnjenja.
- Svaki lead sada ima radni CRM edit blok sa `status`, `sledeći kontakt` i `beleške`, a izmene se čuvaju kroz server action `app/crm/actions.ts` direktno u postojećoj `inquiries` tabeli bez paralelnog CRM sistema.
- `middleware.ts` sada opcionalno štiti `/crm` preko HTTP Basic Auth-a kada su postavljeni `CRM_BASIC_AUTH_USERNAME` i `CRM_BASIC_AUTH_PASSWORD`, tako da interni ekran ne mora da ostane javno dostupan dok ne uvedemo pun auth sloj.
- `types/index.ts`, `lib/repositories/inquiry-repository.ts`, `lib/crm/inquiry-status.ts` i `supabase/migration.sql` su prošireni tako da inquiry sloj sada podržava bogatiji status pipeline, `next_contact_date` i interne beleške.
- Verifikovano: `npm run build`.

**Terminologija za elektrode usklađena na user-facing welding stranicama (24.03.2026)**
- U `public/data/welding_accessories.json` svi Gerflor/Tarkett accessory opisi i tipovi više ne koriste termin `varilacka vrpca`, već dosledno `elektroda za varenje`, uz uklanjanje neispravne formulacije `pod/pod`.
- `lib/product-page/welding-helpers.ts` sada za collection/spec pipeline izbacuje etikete `Kompatibilna elektroda za varenje` i `Alternativna elektroda za varenje`, pa isti naziv dobijaju SSR render, `/api/colors`, `/api/color-data`, `ProductCharacteristics` i `ProductColorSelector`.
- `app/proizvodi/welding-rod/[ref]/page.tsx` više ne prikazuje breadcrumb i metadata tekst kao `Sistem varenja`, već kao stranu elektrode za varenje sa prirodnijim srpskim opisom.

**Dodati sistemi varenja i elektrode za varive vinil / linoleum kolekcije (24.03.2026)**
- Uveden je novi kanonski izvor `public/data/welding_accessories.json` sa kuriranim Gerflor i Tarkett sistemima varenja koji trenutno koristimo na sajtu: `Gerflor CR40`, `MCR40`, `BBR40`, `CR50`, generički `Gerflor linoleum 4 mm (prema dekoru)`, kao i zvanične Tarkett accessory kolekcije `Elektrode za varenje - vinil podovi` i `Elektrode za varenje - linoleum`.
- Dodat je centralni helper `lib/product-page/welding-helpers.ts` koji iz novih podataka i postojećih collection karakteristika izvodi koje elektrode za varenje treba prikazati po kolekciji, bez nepouzdanog matchovanja Tarkett dekora samo po šifri; linoleum ostaje na postojećim tačnim `welding_rod` referencama po boji.
- Ceo pipeline je povezan kroz `color-helpers.ts`, `prepare-colors.ts`, `resolve-product.ts`, `/api/colors`, `/api/color-data`, `ProductCharacteristics` i `ProductColorSelector`, tako da se kompatibilna elektroda za varenje sada vidi i na collection SSR renderu i pri promeni boje / fetch toku za potvrđene Gerflor i Tarkett varive kolekcije.
- Ruta `app/proizvodi/welding-rod/[ref]/page.tsx` više nije samo linoleum-exact stranica: i dalje podržava tačne DLW/linoleum reference po boji, ali sada ume da renderuje i generičke system/family stranice za `Gerflor CR40`, `MCR40`, `BBR40`, `CR50` i zvanične Tarkett vinyl/linoleum welding accessory kolekcije.
- Verifikovano: targetirani `npx tsx` sanity-check nad mapiranjem kolekcija, `npm run build`.

**Wolflor PDF kolekcije dobile kvalitetnije dekor slike i cache-bust refresh (23.03.2026)**
- Problem na PDF-only Wolflor kolekcijama nije bio samo u maloj rezoluciji PDF izvora, već i u tome što je stari crop bio centriran po OCR tekstu šifre, pa je hvatao deo belog gutter-a i samo deo realnog swatch-a; konkretno `Andes WL91600` je ranije završavao kao mutan `300x227` JPG.
- `tools/extract_wolflor_vinyl.py` sada za PDF kolekcije radi OCR nad lakšim renderom strane, a finalni swatch crop vadi iz većeg rendera preko pametnijeg component-based izračuna granica samog uzorka; time isti `Andes WL91600` sada izlazi kao znatno puniji `686x510` JPG bez fake roomshot fallback-a.
- Isti extractor sada pri `--upload-supabase` upsert-u dodaje novi `?v=` cache-bust query na Wolflor image URL-ove, tako da overwrite postojećeg Supabase object path-a odmah probije browser/CDN keš i live sajt odmah povuče noviji kvalitet.
- Verifikovano: targetirani `build_pdf_collection()` test za `ANDES-Wolflor.pdf`, `python tools/extract_wolflor_vinyl.py --upload-supabase --force-upload`, provera da `wl91600.jpg?v=...` na Supabase vraća `686x510`, `npx tsx scripts/audit-catalog-quality.ts`, `npm run build`.

**Wolflor kolekcije prebačene na color-shot hero slike umesto roomshot-a (23.03.2026)**
- Wolflor kolekcijske kartice i collection hero prikaz više ne koriste `collection.jpg` / ambijentalne roomshot slike čak ni kada postoje; za Wolflor je standardizovano da se kao `collection_image_url` koristi prva dostupna slika dekora/boje iz same kolekcije.
- `tools/extract_wolflor_vinyl.py` sada normalizuje Wolflor `collection_image_url` na prvi color image pri live ekstrakciji, PDF suplement merge-u, reuse Supabase URL-ova i posle eventualnog `--upload-supabase` prolaza, tako da budući refresh više ne može da vrati roomshot hero samo za neke Wolflor kolekcije.
- `lib/utils/productDataLoader.ts` dodatno za Wolflor collection header proizvode daje prioritet `firstColor.image` nad `collection.collection_image_url`, pa UI i pri starijem JSON stanju i dalje ostaje na color-shot prikazu samo za Wolflor.

**Wolflor collection kartice vraćene u Vinil kategoriju i brand filter tok (23.03.2026)**
- Ispravljen je server-side collection/header detection na `app/kategorije/[slug]/page.tsx`: Wolflor vinil kolekcije koriste SKU prefiks `WOLFLOR-VINYL-`, a prethodna logika je kao collection prepoznavala samo prefikse tipa `GER-`, `TARKETT-`, `VINIL-` i slično, pa su Wolflor header proizvodi nestajali iz `Kolekcije` taba na `/kategorije/vinil`.
- Ispravljen je i `SupabaseProductRepository.findAll()` za mock-only brand filtere: kada korisnik traži `brands=11` (Wolflor) ili drugi brend koji nema `products.brand_id` UUID redove u Supabase-u, repo više ne šalje sirovi legacy ID (`11`) u UUID kolonu i više ne prekida pre JSON/manual merge sloja.
- Posledica tog buga je bila da live `/kategorije/vinil` prikazuje samo 74 collection kartice (Gerflor + Tarkett), dok Wolflor ostaje dostupan na `/brendovi/wolflor` ali ne i kroz kategorijski listing i `brands=11` filter scenario.
- Isti fix je proširen i na izračun dostupnih debljina u Vinilu, tako da `WOLFLOR-VINYL-` kolekcije ulaze u isti collection-spec thickness skup zajedno sa `TARKETT-`, `GER-` i `VINIL-` header proizvodima.

**`.vercelignore` zaštita za lokalni deploy šum (23.03.2026)**
- Dodat je root `.vercelignore` koji iz lokalnog `vercel deploy` pakovanja izbacuje teške i nerelevantne foldere (`.next`, `node_modules`, `tmp`, `output`, `archive*`, editor/agent metadata i lokalne env fajlove), kako CLI ne bi pokušao da uploaduje više gigabajta lokalnog workspace šuma.
- Kanonski sajt sadržaj ostaje uključen: `app/`, `components/`, `lib/`, `public/data/` i `public/documents/` nisu ignorisani, pa Git/Vercel repo deploy i dalje nosi stvarne proizvode, Wolflor katalog i PDF dokumenta.
- Pravilo za ovaj repo ostaje: za produkciju koristi se `git push` + Vercel auto-deploy sa `main`; lokalni `vercel deploy` treba koristiti samo ako postoji jasan razlog i uz `.vercelignore` zaštitu.

**Wolflor slike prebačene na Supabase iz extract pipeline-a (23.03.2026)**
- `tools/extract_wolflor_vinyl.py` sada podržava `--upload-supabase`: posle live + PDF ekstrakcije uploaduje Wolflor color JPG assete u `product-images` bucket, automatski čisti lokalni staging folder `public/images/wolflor/`, a `collection_image_url` za svih 64 kolekcija vezuje na prvu dostupnu color/dekor sliku umesto na poseban roomshot hero asset.
- Isti extractor sada pri sledećim refresh prolazima automatski reusuje već postojeće Supabase URL-ove iz prethodnog `wolflor_vinyl_colors.json`, pa redovan refresh više ne radi nepotreban mass re-upload; za ručni full refresh postoji `--force-upload`.
- `public/data/wolflor_vinyl_colors.json` je osvežen tako da više nema lokalne `public/images` putanje niti direktne `wolflor.cn` image URL-ove; svih 64 kolekcija i 771 dekora sada koriste Supabase public URL-ove, dok PDF dokumenta ostaju lokalno u `public/documents/wolflor/`.
- Verifikovano: `python tools/extract_wolflor_vinyl.py --upload-supabase`, provera da `mismatches=0 / local=0 / wolflor.cn=0` u finalnom JSON-u, `npx tsx scripts/audit-catalog-quality.ts`, `npm run build`.

**Wolflor vinil dodat iz live sajta + PDF suplementa kroz ceo pipeline (23.03.2026)**
- Dodat je novi izvor `public/data/wolflor_vinyl_colors.json`, generisan kroz `tools/extract_wolflor_vinyl.py`, koji kombinuje 57 live Wolflor kolekcija sa WooCommerce Store API-ja i 7 novijih PDF kolekcija (`Andes`, `Atlas`, `Aurora`, `Baikal`, `Bermuda`, `Everest`, `Rockies`).
- Ukupno je ubačeno 64 Wolflor kolekcije i 771 dekora; PDF kolekcije generišu hero slike i swatch cropove koji sada produkciono završavaju na Supabase-u preko `--upload-supabase`, dok se originalni PDF-ovi kopiraju u `public/documents/wolflor/`.
- Proširen je ceo Vinil pipeline kroz `productDataLoader.ts`, `product-repository.ts`, `resolve-product.ts`, `prepare-colors.ts`, `color-helpers.ts`, `/api/colors`, `/api/color-data`, `CategoryTabs`, `ColorGrid`, `ProductCardClient` i `app/proizvodi/[slug]/page.tsx`, tako da Wolflor radi na kategoriji, brend strani, product ruti, color selectoru i dokument tab-u zajedno sa Gerflor/Tarkett izvorima.
- `scripts/audit-catalog-quality.ts` sada pokriva i Wolflor dataset, uz eksplicitni izuzetak za PDF-only kolekcije koje nemaju canonical live URL, pa kanonski katalog i dalje ostaje na `0` actionable nalaza.
- Verifikovano: `python tools/extract_wolflor_vinyl.py`, `npx tsx scripts/audit-catalog-quality.ts`, `npm run build`.

**Tarkett sport count mismatch fix za stale opise (18.03.2026)**
- Proveren je zvanični Tarkett URL za `OMNISPORTS PUREPLAY (9.4 mm)` i utvrđeno je da njihova ista collection stranica i payload kontradiktorno tvrde `dostupna je u 33 boje`, dok na istoj stranici `Pogledaj sve dezene` i `item.designs.length` vraćaju samo 6 dekora; to znači da broj 33 nije nastao kod nas, već dolazi iz zvaničnog Tarkett opisa.
- `tools/extract_tarkett_sports.js` sada potpuno uklanja početnu marketing rečenicu tipa `Ova sportska vinil podna obloga dostupna je u X boja/boje/boji.` iz Tarkett sport `description` i `shortDescription`, jer UI već jasno prikazuje stvarni broj boja/dekora iznad opisa.
- `scripts/audit-catalog-quality.ts` je dopunjen novim actionable nalazom `declared_color_count_mismatch` nad nested JSON izvorima, tako da budući mismatch između zvaničnog opisa i realnog broja boja/dekora više ne može tiho da prođe audit.
- Verifikovano: direktan fetch zvaničnog Tarkett `__NUXT__` payload-a za `OMNISPORTS PUREPLAY (9.4 mm)`, `node tools/extract_tarkett_sports.js`, `npx tsx scripts/audit-catalog-quality.ts`, `npm run build`.

**Tarkett Heterogeni vinil dodat u kategoriju Vinil kroz ceo pipeline (16.03.2026)**
- Dodat je novi zvanični izvor `public/data/tarkett_heterogeneous_vinyl_colors.json` sa live Tarkett Srbija kategorije `Heterogeni vinil`: 15 kolekcija i 441 dekor, sa kolekcijskim opisima, PDF dokumentima, key features blokovima, hero slikama i color-level tehničkim listovima / tabelama formata.
- Kreiran je novi extractor `tools/extract_tarkett_heterogeneous_vinyl.js` koji koristi Playwright + `json-collection-product` endpoint za svaki dekor, stored-JSON fallback kad collection payload pukne, i HTML / `page.content()` fallback za collection grid linkove jer Tarkett heterogeni category page u headless shell okruženju može da vrati prazan DOM query iako je sadržaj renderovan u HTML-u.
- Proširen je category 2 pipeline kroz `color-helpers.ts`, `productDataLoader.ts`, `product-repository.ts`, `/api/colors`, `/api/color-data` i katalog audit, tako da Tarkett heterogeni vinil radi na kategoriji, brand strani, product page ruti i documents/specs toku zajedno sa Tarkett `Vinil za kuću` i `Homogeni vinil`.
- `getTarkettHeterogeneousVinylCollections()` uvodi kolekcijske header proizvode sa `type=Heterogeni`, dok boje ostaju dostupne kroz nested color selector i server-side `/api/color-data` dokument lookup; završna provera je potvrdila da novi JSON nema prazne kolekcijske slike, prazna dokumenta ni duplicate color slugove.
- Verifikovano: `node tools/extract_tarkett_heterogeneous_vinyl.js`, `npx tsx scripts/audit-catalog-quality.ts`, `npm run build`.

**Duboki audit postojećih Tarkett grupa + stabilizacija PDF i fallback pipeline-a (16.03.2026)**
- Urađen je duboki audit za već ubačene Tarkett grupe `Sport`, `Vinil za kuću` i `Homogeni vinil`, uz ponovno pokretanje zvaničnih extractora i proveru opisa, hero slika, dokumenata, karakteristika i color-level dokumenata; ciljane grupe sada prolaze bez actionable nalaza.
- `tools/extract_tarkett_sports.js`, `tools/extract_tarkett_vinyl_home.js` i `tools/extract_tarkett_homogeneous_vinyl.js` sada imaju stored-JSON fallback kada zvanični Tarkett payload vrati prazan rezultat / `Please Contact You Admin`, pa refresh više ne puca zbog nestabilnih live collection stranica.
- U istom auditu otkriveno je da je deo Tarkett collection PDF-ova koristio pogrešan CDN obrazac `https://media.tarkett-image.com/large/*.pdf`; ispravljeno je pravilo da collection dokumenta moraju da idu na `https://media.tarkett-image.com/docs/*.pdf`, dok color-level specifikacije za Tarkett vinil i dalje ostaju na zvaničnim `tarkett.rs/sr_RS/pdf/...` URL-ovima.
- `tools/extract_tarkett_wood.js` sada generiše ispravne `/docs/` collection PDF linkove za Parket i Laminat, `lib/data/tarkett-wood-enrichment.ts` normalizuje Tarkett PDF URL-ove pri merge-u, a `components/ProductDocuments.tsx` radi client-side zaštitnu normalizaciju ako neki stari `/large/*.pdf` ipak preživi u izvoru.
- Isti PDF fix proširen je i na Tarkett LVT: `public/data/tarkett_lvt_products.json` je očišćen od starih `/large/*.pdf` dokumenata, `lib/utils/productDataLoader.ts` normalizuje Tarkett LVT dokumenta pri mapiranju, a `tools/scrape_tarkett_deep.js` ubuduće snima LVT PDF-ove na `/docs/` obrazac.
- Završna verifikacija: `node tools/extract_tarkett_wood.js`, `npx tsx scripts/audit-catalog-quality.ts`, `npm run lint`, `npm run build`; audit trenutno prijavljuje `0` actionable high/medium/low nalaza nad kanonskim katalogom, dok preostali high nalazi dolaze samo iz legacy `mock-products` šuma koji ne blokira live katalog.

**Tarkett Homogeni vinil dodat u kategoriju Vinil kroz ceo pipeline (16.03.2026)**
- Dodat je novi zvanični izvor `public/data/tarkett_homogeneous_vinyl_colors.json` sa live Tarkett Srbija kategorije `Homogeni vinil`: 20 kolekcija i 544 dekora, sa kolekcijskim opisima, PDF dokumentima, key features blokovima, hero slikama i color-level tehničkim listovima/tabelama formata.
- Kreiran je novi extractor `tools/extract_tarkett_homogeneous_vinyl.js` koji koristi Playwright + `json-collection-product` endpoint za svaki dekor, a za polomljene Tarkett kolekcijske stranice (npr. `iQ Granit Acoustic`) ima fallback preko zvaničnog `sitemap_1.xml` i direktnog product JSON URL-a.
- Proširen je category 2 pipeline kroz `color-helpers.ts`, `productDataLoader.ts`, `product-repository.ts`, `/api/colors`, `/api/color-data` i katalog audit, tako da Tarkett homogeni vinil radi na kategoriji, brand strani, product page ruti i documents/specs toku isto kao Tarkett `Vinil za kuću`.
- `getTarkettHomogeneousVinylCollections()` uvodi kolekcijske header proizvode sa `type=Homogeni`, dok boje ostaju dostupne kroz nested color selector i server-side `/api/color-data` dokument lookup.
- Verifikovano: `node tools/extract_tarkett_homogeneous_vinyl.js`, runtime check za `tarkett-eclipse-premium`, `npx tsx scripts/audit-catalog-quality.ts`, `npm run lint`, `npm run build`.

**Duboki katalog audit + zvanični enrichment za opise, dokumenta i specifikacije (16.03.2026)**
- Dodata je nova skripta `scripts/audit-catalog-quality.ts` koja radi duboki audit kanonskog kataloga preko JSON izvora, ručnih collection header proizvoda, Tarkett/Gerflor/TimberTech/BLOQ loadera i opcionalnog Supabase sloja; rezultat se zapisuje u `output/catalog-quality-audit.json` i razdvaja actionable nalaze od legacy/mock šuma.
- Dodat je `tools/extract_tarkett_wood.js` extractor koji sa zvaničnog Tarkett Srbija sajta puni `public/data/tarkett_wood_collection_index.json` za svih 11 parket i 10 laminat kolekcija, uključujući zvanične opise, ključne karakteristike, hero slike, PDF dokumenta i tehničke specifikacije po kolekciji.
- Uveden je `lib/data/tarkett-wood-enrichment.ts`, a `product-repository.ts` i `resolve-product.ts` sada kroz taj sloj obogaćuju Tarkett Parket/Laminat proizvode i kada dolaze iz Supabase-a i kada dolaze iz statičkog fallback-a, tako da kolekcijski opisi, dokumentacija, hero slike i specifikacije više ne zavise od slabijeg lokalnog teksta.
- Ojačan je collection/header pipeline u `lib/utils/productDataLoader.ts`: BLOQ sada koristi kolekcijske opise i dokumenta umesto prvog dekora, Gerflor LVT/Linoleum/Vinil/ESD kolekcije dobijaju bogatije opise, `externalLink` i specs fallback iz zvaničnih karakteristika, a TimberTech deking kolekcije sada nose ispravan `externalLink`.
- `lib/data/manual-collection-products.ts` sada nosi i zvanične Gerflor PDF dokumente za svih 9 ručno vođenih collection proizvoda u kategorijama Vinil specijal, Industrijske ploče i Sport, sa normalizovanim URL-ovima bez tracking query stringova.
- Završna verifikacija: `node tools/extract_tarkett_wood.js`, `npx tsx scripts/audit-catalog-quality.ts`, `npm run lint`, `npm run build`; audit trenutno prijavljuje `0` actionable high/medium/low nalaza nad kanonskim katalogom.

**Tarkett opis cleanup za Sport i pravilan prikaz opisa na product strani (16.03.2026)**
- `app/proizvodi/[slug]/page.tsx` više ne gasi plain-text opis čim postoji `detailsSections`: kada opis nije strukturiran u sekcije, sada se prvo renderuje stvarni prose opis proizvoda, pa tek onda `Ključne karakteristike`.
- `tools/extract_tarkett_sports.js` je dopunjen sanitizacijom zvaničnog Tarkett sport teksta, tako da se pri ekstrakciji automatski popravljaju spojene reči i nestali razmaci (`za plesne`, `povećava performanse`, `tretiran je površinskom`, itd.) umesto da takav sirov tekst završi na sajtu.
- Isti extractor sada za `collection_image_url` prioritetno koristi thumbnail sa zvanične category grid stranice kad postoji, čime su kolekcijske kartice poravnate sa onim što Tarkett stvarno prikazuje u listingu; time je konkretno ispravljen pogrešan hero za `Linosport Classic (4.0 mm)`.
- Iz `public/data/tarkett_sport_colors.json` je uklonjen inventarski šum `Na lageru`, a očišćeni su i problematični opisi za `Dancefloor`, `Table Tennis`, `Droptile Speckle`, `Protectiles+`, `Omnisports Active+` i Lumaflex kolekcije sa zalepljenim rečenicama.
- Dodatna provera je potvrdila da Tarkett `Vinil za kuću` kolekcije nemaju isti problem sa opisima, dokumentima, karakteristikama ili hero slikama; jedini sport izuzetak koji i dalje nema dokumenta u zvaničnom payload-u je `Protectiles+`.
- Verifikovano: `node tools/extract_tarkett_sports.js`, audit nad `tarkett_sport_colors.json` i `tarkett_vinyl_home_colors.json`, `npm run lint`, `npm run build`.

**Tarkett Vinil za kuću dodat u kategoriju Vinil kroz ceo pipeline (15.03.2026)**
- Dodat je novi izvor `public/data/tarkett_vinyl_home_colors.json` sa zvaničnih 12 Tarkett kolekcija i 281 boje iz kategorije `Vinil za kuću`, izvučen kroz novi `tools/extract_tarkett_vinyl_home.js` Playwright + `window.__NUXT__` workflow.
- Proširen je category 2 pipeline kroz `color-helpers.ts`, `prepare-colors.ts`, `/api/colors`, `/api/color-data`, `productDataLoader.ts` i `product-repository.ts`, tako da `Vinil` sada podržava i Gerflor i Tarkett kolekcije, boje, dokumenta, detaljne karakteristike i kolekcijske hero slike.
- Uvedeni su Tarkett vinil collection header proizvodi kroz `getTarkettVinylHomeCollections()` sa pravilnim `type`, `thickness`, `format`, `documents`, `detailsSections` i `externalLink` podacima, pa kolekcije rade na kategoriji, brendu i product page ruti bez dodatnog DB unosa.
- Zvanični engleski opis za `Eruption S` je ručno preveden na srpski u JSON-u da Vinil sekcija ostane jezički konzistentna sa ostatkom sajta.
- Verifikovano: `node tools/extract_tarkett_vinyl_home.js`, `npm run lint`, `npm run build`.

**Tarkett Supabase sync za parket i laminat (15.03.2026)**
- Lokalni repo je povezan na `borivojes-projects/podovi` preko Vercel CLI-ja, pa su produkcione env promenljive (`NEXT_PUBLIC_SUPABASE_*`, `SUPABASE_SERVICE_ROLE_KEY`) povučene u `.env.local` umesto ručnog kopiranja ključeva.
- Dodata je skripta `scripts/sync-tarkett-supabase.ts` koja pravi timestamp backup u `output/`, radi dry-run diff i po `--apply` sinhronizuje produkcioni Supabase sa kanonskim lokalnim `tarkett-products.ts` izvorom za kategorije Laminat/Parket.
- Produkcioni Tarkett parket je očišćen sa 92 na 84 ukupna reda (11 header proizvoda + 73 varijante): obrisano je 9 zastarelih/legacy zapisa, ubačen je `step-xl-l`, a svi preostali parket proizvodi sada imaju isti kanonski skup kao zvanični Tarkett katalog.
- Tarkett laminat je u istoj sinhronizaciji dobio kanonske slugove direktno u Supabase-u kroz SKU match, bez gubitka postojećih proizvoda (`easy-line`, `river`, `journey`, `timeless`, `winter`, `woodstock` rename set).
- Posle sync-a `scripts/audit-tarkett-sync.ts` potvrđuje da i statički fallback i Supabase vraćaju zvaničnih 11/73 za parket i 10/54 za laminat.

**Tarkett laminat canonical slugovi + redirect kompatibilnost (15.03.2026)**
- Uveden je centralni helper `lib/data/tarkett-laminate-slug-mapping.ts` koji mapira stare lokalne laminat URL slugove na zvanične Tarkett kanonske slugove (`easy-line`, `river`, `journey`, `timeless`, `winter`, `woodstock`).
- `lib/data/tarkett-products.ts` sada za tih 21 laminat proizvod koristi zvanične Tarkett slugove, a `Journey 731 4V Oak Natural` je usklađen i po imenu sa zvaničnim `Journey 731 4V Panonian Oak`.
- `app/proizvodi/[slug]/page.tsx` sada normalizuje i parket i Tarkett laminat slugove kroz zajednički `getCanonicalProductRouteSlug()`, pa stari lokalni URL-ovi rade kao server-side redirect na nove kanonske rute, dok metadata i canonical URL takođe koriste novu verziju.
- Verifikovano kroz `npm run lint`, `npm run build`, `npx tsx scripts/audit-tarkett-sync.ts` i dodatni helper check da stari laminat slugovi mapiraju na zvanične Tarkett vrednosti.

**Tarkett parket cleanup + audit refinement (15.03.2026)**
- `lib/data/tarkett-products.ts` je očišćen od legacy parket fallback sloja sa generičkim `collection: Parket` zapisima: lokalni parket je spušten sa 116 na zvaničnih 73 varijante, bez duplih dekora i bez zastarelih dodataka.
- Zadržana su samo 3 nužna legacy URL proizvoda (`hrast-bourbon-1-strip`, `hrast-cumin-1-strip`, `hrast-sepia`) i prebačena u prave kolekcije (`Tango`, `Tango Classic`) da linkovi ostanu stabilni bez zagađenja kataloga.
- `scripts/audit-tarkett-sync.ts` sada radi dublji pregled: poredi zvanične Tarkett design slugove, normalizuje naše parket alias slugove za kolizije (`rumba-/tango-` copper/premium), prijavljuje duplikate / višak / manjak po kolekciji i ostaje TypeScript-safe za `next build`.
- `public/data/tarkett_documents_index.json` je dopunjen dodatnim `Privilege Waltz` tehničkim listom koji zvanična Tarkett kolekcijska stranica prikazuje kroz assets payload.
- Verifikovano: `npm run lint`, `npm run build`, `npx tsx scripts/audit-tarkett-sync.ts`; parket audit sada vraća 11/11 kolekcija i 73/73 varijante bez missing/extra/dead slugova.

**Tarkett sport kategorija + zvanični Step XL & L slug (15.03.2026)**
- Dodat novi izvor `public/data/tarkett_sport_colors.json` sa 22 Tarkett sportske kolekcije i 255 boja, izvučen direktno sa zvaničnog Tarkett Srbija sport kataloga kroz `tools/extract_tarkett_sports.js` i `window.__NUXT__` payload.
- Proširen ceo sport pipeline kroz `productDataLoader.ts`, `product-repository.ts`, `resolve-product.ts`, `prepare-colors.ts`, `color-helpers.ts`, `/api/colors`, `/api/color-data`, `CategoryTabs`, `ColorGrid`, `ProductCardClient` i product page tako da kategorija `10` sada podržava i Gerflor/DLW i Tarkett sport kolekcije, boje, dokumenta i karakteristike.
- `Step XL & L` parket kolekcija je prebačena na zvanični Tarkett slug `step-xl-l` u `tarkett-products.ts` i `parket-collection-mapping.ts`, dok stari lokalni slug `step-xl-and-l` sada ostaje kao kompatibilni alias/redirect radi starih linkova.
- Verifikovano runtime proverom da `resolveProductBySlug()` i `prepareCustomColors()` uspešno podižu Tarkett sport kolekcije sa dokumentima, sekcijama i bojama.

**Tarkett audit faza 2: duboka provera parketa/laminata i dopuna dokumentacije (15.03.2026)**
- Dodata skripta `scripts/audit-tarkett-sync.ts` koja upoređuje zvanični Tarkett Srbija Parket/Laminat katalog sa lokalnim `tarkett-products.ts`, `tarkett_documents_index.json` i Supabase bazom kada su env promenljive dostupne.
- Početni audit je potvrdio da je Laminat statički usklađen 1:1 po broju kolekcija/proizvoda (10 kolekcija / 54 proizvoda), dok je Parket tada još imao višak legacy varijanti i 46 proizvoda sa generičkim `collection: Parket`; taj nalaz je zatim poslužio kao osnova za kasniji cleanup iznad.
- `public/data/tarkett_documents_index.json` je dopunjen zvaničnim PDF-ovima za Parket kolekcije (`rumba`, `salsa`, `salsa-art`, `salsa-premium`, `tango`, `tango-classic`, `step-xl-l`) i dodat je alias za stari `step-xl-and-l`.
- Početni bloker pristupa je kasnije rešen Vercel link/pull korakom; produkcioni Supabase sync za parket/laminat je zatim stvarno izvršen kroz `scripts/sync-tarkett-supabase.ts` (vidi noviji entry iznad).

**Tarkett audit faza 1: dokumentacija za laminat/parket + kompletiranje LVT kolekcijskih detalja (15.03.2026)**
- Dodat novi izvor `public/data/tarkett_documents_index.json` sa kuriranim Tarkett PDF dokumentima za svih 10 laminat i 11 parket kolekcija, na osnovu zvaničnog Tarkett Srbija kataloga i search/documents endpointa.
- `components/ProductDocuments.tsx` sada ume da čita i `tarkett_documents_index.json`, a za kategorije `1` (Laminat) i `3` (Parket) kolekcijski Tarkett indeks ima prioritet nad praznim ili nepotpunim fallback dokumentima.
- `app/proizvodi/[slug]/page.tsx` sada prepoznaje Tarkett dokumenta kroz isti documents-tab pipeline kao i Gerflor kolekcije, pa se Dokumentacija sekcija prikazuje i kad PDF-ovi dolaze iz Tarkett JSON indeksa.
- `public/data/tarkett_collection_details.json` je dopunjen tako da svih 16 Tarkett LVT kolekcija sada imaju `Ključne karakteristike` blok umesto da 8 kolekcija ostaje bez enriched detalja.
- Duboka provera je potvrdila da Tarkett parket/laminat na live sajtu i dalje zavise prvenstveno od Supabase baze, pa puna sinhronizacija naziva, SKU-ova i asortimana mora da obuhvati DB + `tarkett-products.ts`, ne samo statički fajl.

**Marmorette sport collection kartica vracena na roomshot (14.03.2026)**
- `sport_colors.json` za `DLW Marmorette Sport 3.2mm` vise ne koristi color JPG kao `collection_image_url`, vec Supabase `collection.jpg` sliku prostora.
- Time sport kolekcija na `/kategorije/sport` ponovo prikazuje realan prostor za Marmorette, dok pojedinacne boje i dalje ostaju dostupne na product strani i u color tabu.

**GTI image cache-bust posle Supabase overwrite-a (14.03.2026)**
- `industrial_colors.json` sada za `GTI Max Cleantech`, `GTI Max Connect` i `GTI Pure Connect` koristi verzionisane Supabase image URL-ove (`?v=...`) na color slikama.
- Ovo forsira browser i CDN da odmah povuku novi clean JPG kad je isti Supabase object path prethodno prepisan boljom slikom iz Gerflor ZIP-a.
- Time su stare keširane GTI preview/loupe slike izbačene iz product page i swatch prikaza bez promene samog Supabase storage layout-a.

**GTI Max clean JPG izbor iz Gerflor ZIP-a (14.03.2026)**
- `tools/download_gerflor_highres_zip.js` sada pri raspakivanju ZIP-a ne bira samo najveci JPG, vec prioritetno uzima fajl bez `loupe/zoom/detail` oznaka kada u arhivi postoje i cista boja i preview sa uvecanim detaljem.
- Time su `GTI Max Cleantech` i `GTI Max Connect` boje na Supabase prepisane cistim JPG fajlovima bez kruzica za uvecanje, dok su URL putanje ostale iste.
- Dva tvrdoglava tona (`0236 BLACK`, `0253 ALUMINIUM`) za `GTI Max Connect` su dodatno ciljano prepisana direktno na iste Supabase object path-ove da cela GTI Max grupa ostane konzistentna.

**Fix mutiranja shared collection proizvoda + Marmorette Sport hero zamena (14.03.2026)**
- `getManualCollectionProducts()` sada vraca duboke kopije umesto originalnog singleton niza, tako da collection header proizvodi vise ne mogu da ostanu mutirani iz prethodnog request-a.
- `resolve-product.ts` vise ne obogacuje collection podatke mutiranjem izvornog `Product` objekta, vec radi nad kopijom.
- `app/proizvodi/[slug]/page.tsx` i metadata grana sada kloniraju resolved product pre `mergeSelectedColor()`, pa izbor boje na product strani vise ne moze da pretvori collection kartice u boje pri povratku na kategoriju.
- `sport_colors.json` za `DLW Marmorette Sport 3.2mm` sada koristi bolju plavu Supabase sliku (`1026 SKY BLUE`) kao collection hero umesto sivog close-up `collection.jpg`.
- Verifikovano: `npm run lint`, `npm run build`, plus runtime provera da `getManualCollectionProducts()` vraca nove objekte (`sameObject: false`).

**Vercel trace fix za `public/images/products` (14.03.2026)**
- Uklonjen runtime `fs.existsSync(join(process.cwd(), 'public', ...))` check iz `lib/data/manual-collection-products.ts`, jer je terao Next/Vercel file tracing da uvuce `public/images/products` u serverless bundle za `/api/products` i `/api/search`.
- Manual collection hero slike se sada oslanjaju direktno na `collection_image_url` iz JSON-a (Supabase URL) ili na prosledjeni fallback string, bez server-side proveravanja lokalnog fajl sistema.
- Lokalno potvrđeno kroz `.next/server/**/*.nft.json` da `api/products` i `api/search` vise ne traguju `public/images/products`, sto uklanja uzrok Vercel greske o prevelikoj funkciji.
- Verifikovano: `npm run build` prolazi i trace check vraca `hits=0` za `public/images/products`.

**Gerflor ZIP download izvor + JPG upload na Supabase za specijalni vinil, Industrijske ploče i Sport (14.03.2026)**
- `tools/download_gerflor_highres_zip.js` je proširen da za tipove `vinyl-special`, `industrial` i `sport` klikće Gerflor download flow (`download` → `.jpg`) i preuzima stvarne ZIP arhive visokog kvaliteta umesto preview slika sa stranice.
- ZIP se lokalno raspakuje, bira se najbolji/najveći JPG iz arhive, i samo ta finalna slika ide na Supabase; sama ZIP arhiva se ne hostuje niti koristi u renderu sajta.
- Skripta sada opciono radi i Supabase upload (`--upload-supabase`), sama pronalazi projekat preko `SUPABASE_ACCESS_TOKEN` kad treba, kreira `product-images` bucket ako ne postoji i upisuje javne URL-ove nazad u JSON.
- `public/data/vinyl_special_colors.json`, `public/data/industrial_colors.json` i `public/data/sport_colors.json` sada sadrže realne `collection_image_url` hero slike i color `image` URL-ove za svih 9 kolekcija, bez placeholder-a i bez praznih boja.
- `manual-collection-products.ts` sada cita `collection_image_url` iz JSON-a, tako da collection kartice i hero sekcije koriste iste Supabase-hostovane slike kao ostatak sajta.
- Verifikovano: sve 3 JSON grupe imaju `hero=true` i `missing=0`, a posle integracije su `npm run lint` i `npm run build` ponovo potvrđeni kao obavezna zavrsna provera.

**Gerflor specijalni vinil + nove kategorije Industrijske ploče i Sport (14.03.2026)**
- Dodati novi izvori podataka `public/data/vinyl_special_colors.json`, `public/data/industrial_colors.json` i `public/data/sport_colors.json` za 9 novih Gerflor/DLW kolekcija (boje + opisi + karakteristike).
- Proširen ceo JSON → resolver → API → UI pipeline: `color-helpers.ts`, `prepare-colors.ts`, `resolve-product.ts`, `/api/colors`, `/api/color-data`, `CategoryTabs`, `ColorGrid`, `ProductCard`, `ProductCardClient`, category/product page logika za category ID 9 i 10.
- `tools/download_gerflor_highres_zip.js` sada razume tipove `vinyl-special`, `industrial`, `sport` i priprema `collection.jpg` roomshot zajedno sa color JPG downloadom u lokalne `public/images/...` putanje.
- Manual collection header proizvodi sada koriste standardizovane lokalne `collection.jpg` putanje samo ako fajl stvarno postoji; pogresni placeholder roomshot-ovi su uklonjeni da sajt ne prikazuje netacne Gerflor slike.
- Verifikovano: `npm run lint` i `npm run build` prolaze.

**Finalizacija Podataka: PDF Specifikacije, Trinity Podloge, Supabase čišćenje (23.02.2026)**
- Dodata skripta `extract-pdf-specs.js` za AI ekstrakciju specifikacija (Debljina, Težina, Akustika) direktno iz PDF fajlova (Node `pdf-parse`) i automatsku JSON dopunu (LVT, Vinil, Linoleum).
- Trinity kolekcija (BLOQ) je obogaćena novim UI elementom koji vizuelno prikazuje "Dostupne podloge" (npr. RELAX, BITBACK) unutar `ProductColorSelector` komponente.
- Potvrđeno smanjenje Next.js klijentskog bundle-a (~150kb za stranice detalja) jer su `ColorGrid` i `GlobalSearch` komponente već ranije uspešno prebačene na pozivanje `/api/colors` endpointe.
- Kreirana i izvršena `clean-supabase.js` skripta koja je selektivno očistila produkcionu bazu uklanjanjem zaostalih mock (EGGER) kategorija, oslanjajući se na UUID tabele.

**Inline PDF Viewer i Univerzalni Playwright Scraper (23.02.2026)**
- Ažurirana `ProductDocuments.tsx` komponenta za prikazivanje liste dokumenata. Klikom na tehnički list sada se renderuje aktivni `<object>` embed direktno unutar istog prozora umesto `target="_blank"`. Dodati "Nazad" i fallback "Preuzmi direktno" tasteri na viewer-u.
- Zamijenjeni prastari crawler scrapers novim `tools/download_gerflor_highres_zip.js`. Skripta prima CLI parametre (`--type`, `--collection`), preskače lažne DOM node-ove iz različitih Gerflor UI tema tako što evaluira Vue `window.__NUXT__` payload na samoj stranici i hvata specifičan download CDN link. Omogućeno robusno preuzimanje punih slika bez CDN blokada.
- Ubačen *graceful fallback* u scraper-u da samo prijavi grešku a ne sruši proces kad kolekcija baca 404 (npr. kod nesinhronizovanih promena APIja - *Taralay Libertex*).

**Fix ESD Product Images i URL Routingovanje (23.02.2026)**
- Prepravljen Playwright scraper (`tools/download_esd_highres.js`) da prihvata kolačiće, klikće swatch i skida slike direktno iz skinute ZIP arhive umesto starog CDN endpoint-a. Skinute sve 42 high-res ESD slike lokalno.
- Rešen 404 Not Found issue za ESD boje - Next.js `resolveProductBySlug` nije rešavao `esd_colors.json`. Ažuriran `resolve-product.ts` i `color-helpers.ts` da dinamički mapiraju URL (npr. `mipolam-el5?color=mipolam-el5-0354-blue`) na ispravan `Category 8`.

**Dodavanje Deking (TimberTech) proizvoda sa TIS (22.02.2026)**
- Scrapovano 12 proizvoda (EDGE i EDGE+ profili) sa deking sekcije `tis.rs` sajta koristeći prilagođeni js scraper.
- Konvertovano u JSON format u `public/data/tis_deking_products.json`.
- Integrisani podaci u funkcije `productDataLoader.ts`.
- Implementiran novi logički blok za Category 5 (Deking) u `product-repository.ts`.
- Podržan TimberTech brand fallback u `proizvodi/[slug]/page.tsx` i dodeljen mu je ID 10.
- Izmenjen kod kako bi Deking proizvodi ignorisali kolekcijsko preusmeravanje, što dozvoljava prikaz direktnih detaljnih stranica bez padanja sistema.

**Apple-Style Vizuelni Redizajn sajta - Faza 2 (20.02.2026)**
- Drastično redizajniran Hero deo na početnoj strani (`page.tsx`) u stilu Apple-ovog minimalizma.
- Redizajniran sistem prikaza kategorija u asimetrični *Bento-box* raspored.
- Potpuno preuređene 'Why Choose Us' i CTA sekcije (minimalistički layout, `#F5F5F7` teme).
- Optimizovana visina glavne navigacije (`Header.tsx`) za preciznije iOS/macOS staklo efekat (`44px`/`48px`).

**Filteri za BLOQ i Tekstilne ploče (20.02.2026)**
- Dodata mogućnost filtriranja po "Familiji" u sidebar filtere na stranici Kategorija > Tekstilne ploče
- Ažuriran `productDataLoader.ts` da učitava `parent_collection` kao `family` spec
- Podržano prenošenje i čitanje iz `searchParams` URL parametara preko komponente `CategoryTabs` i `ProductFilters` 

**Standardizacija naziva boja (20.02.2026)**
- Dodata `formatProductName` utility funkcija u `productDataLoader.ts`
- Boje iz JSON fajlova (Tarkett, Gerflor LVT/Linoleum/Carpet, BLOQ) se sada automatski formatiraju u Title Case
- Uklonjeni su redundantni kodovi i prefiksi iz samog naziva boje prilikom učitavanja (npr. "0347 BALLERINA" -> "Ballerina")

**Obogaćivanje BLOQ podataka (10.02.2026)**
- Dodati opisi kolekcija (EN + SR) za svih 18 BLOQ kolekcija
- Dodati dokumenti (tehničke specifikacije, brošure, LRV) za sve kolekcije
- Dodat color range text, backing varijante (RELAX/BITBACK) za Trinity
- Ispravljena Grain dimenzija (25x100cm plank umesto 50x50 tile)
- Wirovani novi podaci u product page (resolve-product + ProductDocuments)

**Agent dokumentacija (10.02.2026)**
- Kreiran `.agent/workflows/podovi-architecture.md` sa kompletnim data flow-om
- Kreiran `AGENTS.md` (ovaj fajl)

**Poboljšanje kartica proizvoda (10.02.2026)**
- ProductCardClient redizajniran sa hover efektima i overlay akcijama
- Product detail page refaktorisan u module (`lib/product-page/`)

**Fiksiranje BLOQ slika (10.02.2026)**
- Downloadovani roomshot-ovi za sve 18 BLOQ kolekcija
- Ažuriran `getAllBloqCarpetProducts()` da koristi roomshot umesto tile slike

**Poboljšanje sadržaja proizvoda (11.02.2026)**
- Obogaćeno 23 Gerflor Vinil kolekcija profesionalnim srpskim opisima i tehničkim specifikacijama (900+ boja)
- BLOQ opisi formirani u strukturirane sekcije (Opis, Paleta boja, Dostupne podloge) za `parseDescriptionToSections()`
- BLOQ spec ključevi prevedeni na srpski (FIBRE→Vlakno, CLASSIFICATION→Klasa upotrebe, itd.)
- Diferencirane certifikacije (Cradle to Cradle, BREEAM za BLOQ vs Gerflor sertifikati) i eko-karakteristike
- Fiksiran `collectionFromColor()` da pravilno prosleđuje specs
- Implementirano JSON→DB enrichment za Vinil kolekcije u `resolve-product.ts`
- Poboljšan `shortDescription` fallback logic

**EGGER brend uklonjen (11.02.2026)**
- EGGER brend (id: 9) potpuno uklonjen iz projekta
- Uklonjene kategorije: "Ugradnja" (id: 8), "Lajsne" (id: 9), "Alati" (id: 10)
- Obrisani svi EGGER fajlovi: `egger-decors.json`, `generate-egger-decor-data.js`, EGGER slike
- Očišćeni resolver, prepare-colors, product-repository, mock-data od EGGER grana
- Očišćen AGENTS.md od svih EGGER referenci

**Brend prikaz fiksan za Tarkett i BLOQ (12.02.2026)**
- Ispravljeno `id-mapping.ts`: Tarkett UUID mapiran na legacy `'3'` (bilo pogrešno `'1'`)
- Dodat fallback brand map u `page.tsx` za brendove koji nisu u Supabase (BLOQ `'8'`, Tarkett `'3'`)
- ⚠️ **Gotcha**: Kad dodaješ novi brend, moraš ažurirati i `id-mapping.ts` I fallback u `page.tsx`

**Integracija LVT/SPC podataka (18.02.2026)**
- Scrapovan Tarkett LVT/SPC (549 proizvoda) sa `tools/scrape_tarkett_deep.js`
- Konvertovani podaci u `public/data/tarkett_lvt_products.json`
- Implementiran `getAllTarkettLVTProducts` u `productDataLoader.ts` sa LVT mapiranjem
- Ažuriran `product-repository.ts` da merge-uje nove LVT podatke
- Dodat `formatLvtSpecs` u `spec-helpers.ts`
- Verifikovan prikaz na sajtu (Proizvod: Beton GREY)

**Refaktoring color-helpers i resolve-product (18.02.2026)**
- Dodat `brandId` u `ColorFromJSON` i `ColorSource` (`types.ts`)
- `colorToProduct` i `collectionFromColor` koriste dinamički `brandId` (default: Gerflor '6')
- Dodata podrška za `tarkett-` prefiks u `resolve-product.ts`
- Build verified (exit code 0)

**BLOQ brend fix (15.02.2026)**
- Ažuriran `SupabaseBrandRepository` da merge-uje mock brendove (BLOQ) sa DB rezultatima
- **Fix duplikata**: Dedup logic promenjen na `slug` (umesto `id`) jer DB koristi UUID a mock legacy ID
- Uklonjen EGGER i legacy kategorije iz `mock-data.ts` (čišćenje zaostalih podataka)


**Fix image flicker na color change (12.02.2026)**
- Uklonjen redundantni async fetch u `ProductColorSelector.tsx` koji je za Armonia trkao sa instant `handleColorSelect`
- Dodat CSS cross-fade za glatku tranziciju slika kad `customColors` nije dostupan
- Zamenjeno `ProductImage` sa native `<img>` za instant switching bez re-mount-ovanja
- Uklonjen stale `console.log` iz `handleColorSelect`

**Rework title/subtitle na product page (12.02.2026)**
- h1 prikazuje **ime boje** kad je izabrana (stripovan šifra prefiks), inače **ime kolekcije** (stripovan brend)
- Subtitle uvek prikazuje ime kolekcije bez brenda (brend je već prikazan iznad kao link)
- Dodat `originalProductName` prop u `page.tsx` — čuva originalni naziv proizvoda PRE `mergeSelectedColor`
- Dodat `collectionName` useMemo u `ProductColorSelector` — stripuje brend prefiks dinamički koristeći `brand.name`
- Ujednačen prikaz šifre/imena boje ispod slike za sve tipove proizvoda (BLOQ, Gerflor, Parket — svi imaju bold šifru)

**Fix duplih tačaka u opisu (12.02.2026)**
- `parseDescriptionToSections()` sada stripuje vodeće `•`, `-`, `*` karaktere iz stavki
- Rendering koristi `list-disc` koji dodaje svoju tačku, pa izvorni bullet karakter pravio duplu tačku
**SEO metadata poboljšanje (12.02.2026)**
- `generateMetadata()` u `page.tsx` kompletno prepisan
- Tab title: stripuje šifru boje i brend prefiks, format "BALLERINA - Creation 40 Clic | Podovi.online"
- OG title: uključuje ime boje, kolekciju i brend
- Meta description: koristi `shortDescription` sa brendom i kategorijom, bez usamljenih tačaka
- Fallback za collection name: ako `collection` spec ne postoji, resolvuje parent product

### 🔲 TODO
- [x] Poboljšati SEO meta description i OG tagove za sve kategorije
- [x] Implementirati prikaz dokumenata na product detail stranici (Dokumentacija sekcija)
- [x] Izvući detaljne specifikacije iz PDF tech datasheet-ova (debljina, akustika, težina)
- [x] Dodati "Dostupne podloge" prikaz za Trinity kolekcije
- [x] Razmotriti prebacivanje klijentskih JSON import-ova na API rute (bundle size)
- [x] Proveriti da li su kategorije 8, 9, 10 obrisane iz Supabase baze (bile su EGGER-ove)
- [x] Pokrenuti stvarni Gerflor ZIP download za `vinyl_special`, `industrial` i `sport` kolekcije i podici roomshot + color JPG slike na Supabase umesto preview URL-ova sa Gerflor sajta.
- [x] Dodati Tarkett sport kolekcije u kategoriju `Sport` kroz ceo JSON → resolver → API → UI pipeline, sa dokumentima i key features podacima iz zvaničnog kataloga.
- [x] Završiti Tarkett Supabase sync kada env pristup bude dostupan, da baza dobije isti parket/laminat kanonski skup proizvoda i iste Tarkett slugove kao statički fallback.
- [x] Nastaviti Tarkett proširenje posle `Homogeni vinil` na `Heterogeni vinil`, uz poseban fallback za kolekcije koje na live sajtu ne vraćaju standardni `__NUXT__` payload.
- [x] Dodati Wolflor vinil iz kombinacije live sajta i lokalnih PDF suplement kolekcija kroz kompletan JSON → resolver → API → UI pipeline.
- [x] Dodati Tarkett `Lajsne` kao novu nested kategoriju (`11`) sa collection + variant tokovima i zvaničnim JSON extractorom.
- [x] Dodati Techem `Otirači` kao novu flat kategoriju (`12`) sa kanonskim extractorom, repo merge slojem i audit coverage-om.
- [x] Uvesti snapshot contract testove za `resolve-product` i `/api/colors` + `/api/color-data` sa CI merge gate-om.
- [x] Dokumentovati kanonski supplier extractor refresh + rollback runbook i povezati ga iz workflow arhitekture.
- [x] Lokalizovati Techem supplier copy (opise + ključne spec label-e) na srpski pre nego što krenemo sa većim SEO/content prolazom nad kategorijom `Otirači`.
- [x] Poravnati canonical brand source sa category hub summary count-ovima tako da TimberTech (`brandId=10`) više ne ostane orphan u `/kategorije` metrikama kad `/brendovi` nema isti entitet iz brand repo sloja.
- [x] Poravnati Techem `generatedAt` freshness signal sa sitemap-om i PDP metadata slojem tako da `Otirači` ne ostanu na generičkom request-time datumu i fallback copy-ju za boje.
- [ ] Zameniti privremeni `/crm` Basic Auth punim auth slojem i dodati istoriju pojedinačnih aktivnosti po leadu.

---

## 6. 🏛️ ARHITEKTURA

> Za detaljnu tehničku arhitekturu pogledaj `.agent/workflows/podovi-architecture.md`

```
PODOVI/
├── app/                    # Next.js App Router pages
│   ├── kategorije/         # Stranice kategorija
│   ├── proizvodi/[slug]/   # Stranice proizvoda (GLAVNI)
│   ├── brendovi/           # Stranice brendova
│   ├── kontakt/            # Kontakt forma
│   ├── crm/                # Interni CRM skeleton za leadove i follow-up
│   ├── omiljeni/           # Omiljeni proizvodi
│   ├── uporedi/            # Poređenje proizvoda
│   └── api/                # API rute (search, contact, inquiries)
│
├── components/             # React komponente (30+), uključujući `components/crm/` helpere za CRM form flow
│
├── lib/
│   ├── catalog/            # Listing/brand curation helperi (`listing-curation`, `brand-curation`)
│   ├── product-page/       # KRITIČNO: resolver, color merge, spec helpers (uključujući nested category 11 / lajsne)
│   ├── crm/                # CRM status meta + follow-up helperi za inquiry leadove
│   ├── data/               # Tarkett/Gerflor/Parket statički podaci + mock category fallback (`lajsne`) + Podovi display brand fallback + manual collection header proizvodi + Tarkett wood enrichment + statički manifesti lokalnih collection asseta
│   ├── utils/              # Shared pure helperi poput `product-routes.ts` i `product-images.ts` za canonical href/slug/image-selection contract
│   └── repositories/       # Data access layer (Supabase, uključujući inquiries + CRM update sloj)
│
├── public/data/            # JSON fajlovi sa bojama/specifikacijama i dokument indeksima (LVT, Vinil, Tarkett vinil za kuću, Tarkett homogeni vinil, Tarkett heterogeni vinil, Wolflor vinil, Alpod-source Podovi kolekcije, ESD, Industrijske, Sport, Tarkett sport, Tarkett lajsne, Techem otirači sa `generatedAt`, Tarkett wood collection index + PDF indeksi)
│
├── types/                  # TypeScript tipovi (Product, Category, Brand)
│
├── scripts/                # Utility skripte (enrichment, image validation, Tarkett audit/sync, catalog quality audit)
│
└── tools/                  # Ekstraktori/scraperi za zvanične kataloge (Gerflor, Tarkett, Wolflor, uključujući `extract_tarkett_lajsne.js`, fallback preko sitemap/json endpointa kada treba)
```

## 8. ⚡ COMMON GOTCHAS
> Lekcije naučene iz prethodnih grešaka — čitaj ovo da ne ponavljaš iste greške.

1. **DB vs JSON priority**: `productRepository.findBySlug(slug)` je PRVI pokušaj u resolveru. Ako DB ima proizvod, JSON podaci se ne koriste automatski. Za obogaćivanje, moraš EKSPLICITNO proveriti i merge-ovati JSON podatke u DB proizvod.
2. **`read_url_content` ne prikazuje sve**: Crawler tool flatuje HTML sekcije. Koristi `Select-String` na raw HTML-u da potvrdiš da li je sadržaj zaista renderovan.
3. **Next.js dev server kešira agresivno**: Posle promene `resolve-product.ts`, moraš restartovati dev server ili obrisati `.next/` direktorijum.
4. **Slug prefix konvencije**: Vinil i LVT koriste `gerflor-` prefix u slug-u, ali JSON fajlovi čuvaju slug BEZ prefixa. Uvek proveri oba oblika.
5. **`parseDescriptionToSections()`**: Sekcioni naslovi moraju biti na ZASEBNOJ LINIJI i moraju se završavati sa `:`. Linija mora tačno da se poklopi sa `sectionTitles` nizom u `spec-helpers.ts`.
6. **AŽURIRAJ AGENTS.md PRE git push**: Svaka značajna promena MORA da ažurira AGENTS.md changelog i TODO listu kao deo istog commit-a. Ne push-uj bez ažuriranog AGENTS.md.
7. **Mock-data proizvodi MORAJU biti merge-ovani u SupabaseProductRepository**: Sajt koristi Supabase kao primarni izvor podataka. Proizvodi u `mock-data.ts` se NEĆE prikazati na sajtu osim ako nisu EKSPLICITNO merge-ovani u `SupabaseProductRepository.findAll()`. Pogledaj BLOQ (cat 4) blok za primer. Bez ovog koraka proizvodi postoje u kodu ali su nevidljivi na sajtu!
8. **Kad brišeš brend** — moraš očistiti SVE slojeve: JSON fajlove, slike, resolver grane, prepare-colors grane, product-repository merge blokove, mock-data, kategorije u Supabase, AGENTS.md i workflow dokumentaciju. Napravi checklist pre nego što počneš.
9. **Async fetch u `useEffect` ne sme da prepisuje stanje koje `handleColorSelect` postavlja.** Ako `ColorGrid.onColorSelect` već daje tačnu sliku, nemoj praviti još jedan fetch koji menja istu state varijablu — to pravi race condition i flicker. Uvek koristi callback podatke kad su dovoljni.
10. **Nemoj se oslanjati na DOM selektore kod Gerflor Scrapera**. Puno njihovih kolekcija koristi razičite framework verzije i strukturu. Ako trebaš pouzdano naći neku vezu (stranicu/skuplet/fajl), izvuci `window.__NUXT__` sa `page.evaluate` unutar Playwright-a — to je njihov standardni backend payload i daleko je otporniji na pucanje nego `page.click('css-selector')`.
10. **`mergeSelectedColor()` menja `product.name` u ime boje.** Nikad ne koristi `productName` kao izvor za ime kolekcije posle merge-a. Uvek sačuvaj originalni naziv PRE poziva `mergeSelectedColor()` i prosledi ga kao `originalProductName`.
11. **Brend se ne ponavlja u naslovu/podnaslovu.** Brend (Gerflor, Tarkett, BLOQ) je već prikazan iznad kao link. U h1 i subtitle koristi `collectionName` koji stripuje brend prefiks. Logika: `name.startsWith(brand.name + ' ')` → strip.
12. **Formatiranje naziva boja:** Uvek propusti sirova imena boja iz JSON-a kroz `formatProductName` utility iz `productDataLoader.ts`. Ovo osigurava konzistentan Title Case i uklanja šifre iz naziva.
13. **Gerflor slike moraju ici preko download ZIP flow-a:** Ne koristi preview slike koje su renderovane na stranici. Za kvalitetne assete klikni download dugme, zatim `.jpg`, preuzmi ZIP i odatle uzmi najveci JPG; posle toga slike hostuj na Supabase i upisi javni URL u JSON.
301. **Novi vinil proizvodi moraju imati merge u repo:** Kad dodaješ novi proizvod u `vinyl_colors_complete.json`, moraš dodati i merging logiku u `SupabaseProductRepository.findAll()` za cat 2, ili ručno dodati u Supabase. Pogledaj `getVinylCollectionProducts()` u `productDataLoader.ts`.
15. **Dinamičko mapiranje boja za nove kolekcije:** Kada dodaješ novi fajl poput `esd_colors.json`, NIJE DOVOLJNO dodati ga samo u `productDataLoader.ts`. UVEK moraš da ažuriraš `loadColorFromJson`, `colorToProduct` za `categoryId` i UVEK prepraviš rutensku pretragu u `resolveProductBySlug` kako bi Next.js znao kako da instancira stranicu kad neko poseti `/proizvod...color=...`, inače će dovesti do 404 greške!
16. **ESD slug pattern:** ESD kolekcije (mipolam-el5, gti-el5-connect, itd.) koriste slug BEZ `gerflor-` prefiksa, za razliku od LVT/Vinil/Linoleum kolekcija. SVAKA nova logika u `resolve-product.ts`, `prepare-colors.ts`, `color-helpers.ts` mora da proverava slug i sa i bez prefiksa. Takođe, ESD boje koriste `image` polje umesto `image_url`/`texture_url` — uvek dodaj fallback na `(color as any).image`.
17. **Ne pokreci Gerflor downloader paralelno nad istim JSON fajlom.** Skripta drži stanje celog fajla u memoriji i poslednji upis moze da pregazi prethodni uspesan prolaz ako dve instance rade nad istim `vinyl_special_colors.json`, `industrial_colors.json` ili `sport_colors.json`.
18. **Neki Gerflor product template-i gutaju normalan Playwright klik zbog consent/overlay sloja.** Kad download dugme postoji u DOM-u, ali `page.click()` ne prolazi, koristi DOM `.click()` fallback nad stvarnim download triggerom i `.jpg` opcijom.
19. **Ne koristi `fs` proveru nad `public/` u runtime repository/resolver kodu.** Cak i bez direktnog importa slika, `existsSync(join(process.cwd(), 'public', ...))` moze da natera Vercel trace da uvuce ogromne `public/images/*` foldere u serverless funkcije i probije size limit. Ako ti treba uslovni lokalni asset fallback, koristi staticki manifest (`lib/data/local-asset-manifests.ts`) ili JSON mapu, ne runtime filesystem lookup.
20. **Ne mutiraj shared `Product` objekte iz loadera/repozitorijuma.** `mergeSelectedColor()` menja ime, sliku i specifikacije proizvoda; zato svaki product koji dolazi iz cache-ovanih JSON/manual izvora mora prvo da se klonira, inace ce collection kartice na kategorijama poceti da prikazuju poslednju izabranu boju.
21. **Kad Gerflor ZIP sadrzi i clean i loupe JPG, uvek biraj clean.** Posebno kod `GTI Max` kolekcija arhiva cesto ima fajl tipa `LOUPE-...jpg` i zaseban cist `GTI Max - Color.jpg`; za sajt koristi cistu boju, ne preview sa kruzicem.
22. **Kad na Supabase prepisujes sliku na istoj putanji, URL u JSON-u mora da dobije novu verziju.** Ako ostane identican URL, browser i CDN mogu satima da serviraju staru GTI/industrijsku preview sliku iako je object vec zamenjen clean JPG-om; dodaj `?v=...` cache-bust na `image` polje kad hoces da promena odmah postane vidljiva.
23. **Tarkett `Vinil za kuću` extractor ne treba da se oslanja na običan `https.get` HTML fetch za collection page.** Za ove kolekcije sirovi response često nema `window.__NUXT__` payload, dok ga `page.content()` iz Playwright-a uredno vrati posle rendera; zato `tools/extract_tarkett_vinyl_home.js` mora da učitava collection stranice kroz browser, a product JSON može direktno preko `json-collection-product/...` endpointa.
24. **Tarkett `Heterogeni vinil` category grid ume da vrati prazan DOM query u headless shell-u.** Ako `document.querySelectorAll('a[href*=\"/sr_RS/kolekcija-\"]')` vrati `0`, proveri `page.content()` pre nego što proglasiš stranicu praznom. `tools/extract_tarkett_heterogeneous_vinyl.js` zato mora da ima HTML regex fallback za collection href-ove / slike i ne sme da zavisi samo od live DOM selektorâ.
25. **Wolflor slike za produkciju idu na Supabase, ne na `public/images` i ne ostaju na `wolflor.cn`.** Kad osvežavaš `public/data/wolflor_vinyl_colors.json`, pokreni `python tools/extract_wolflor_vinyl.py --upload-supabase`; bez tog flag-a ostaće lokalni staging JPG-ovi ili direktni vendor URL-ovi, što nije kanonski storage obrazac projekta. Ako baš želiš da pregaziš postojeće Supabase assete novim uploadom, koristi `--force-upload`.
26. **Za ovaj repo ne radi lokalni `vercel deploy` bez zaštite.** Workspace ima ogromne lokalne foldere (`.next`, `tmp`, `output`, `archive*`, `node_modules`), pa CLI bez `.vercelignore` može pokušati da uploaduje više gigabajta šuma. Standardni put je `git push` i Vercel auto-deploy sa `main`.
27. **Vercel `env pull` upisuje navodnike u `.env.local`.** Ako neka skripta ručno parsira `.env.local` i setuje `process.env`, mora da skine spoljne `"` navodnike; u suprotnom `NEXT_PUBLIC_SUPABASE_URL` postane `"https://..."` i `createClient()` pada sa `Invalid supabaseUrl`.
28. **Wolflor Vinil kolekcije koriste SKU prefiks `WOLFLOR-VINYL-` i moraju da budu tretirane kao collection header proizvodi.** Ako collection/header detekcija u kategorijskim stranicama ili tabovima proverava samo prefikse poput `GER-`, `TARKETT-` ili `VINIL-`, Wolflor će završiti u pogrešnom toku i nestaće iz `Kolekcije` taba i `brands=11` filter rendera na `/kategorije/vinil`.
29. **Mock-only brand filteri ne smeju sirovo u Supabase UUID `brand_id` query.** Brendovi poput `BLOQ`, `TimberTech`, `Wolflor`, `Romus` i internog `Podovi` brenda (`14`) žive kroz mock/JSON/manual sloj; ako `product-repository.ts` pošalje legacy ID tipa `8`, `10`, `11`, `13` ili `14` direktno u `.in('brand_id', ...)` nad UUID kolonom, Supabase grana pukne i merge blokovi ispod se nikad ne izvrše.
30. **Za Wolflor kolekcije nemoj koristiti roomshot/ambijentalni hero kao kanonski collection image.** Čak i kada vendor ima `collection.jpg` ili category hero u prostoru, Wolflor kolekcijski prikaz kod nas treba da koristi prvu dostupnu sliku dekora/boje; to važi samo za Wolflor i ne treba prelivati na ostale brendove.
31. **Kad pregaziš Wolflor JPG na istoj Supabase putanji, promeni i URL query verziju.** PDF kolekcije poput `Andes`/`Atlas` sada često dobijaju kvalitetniji crop na istom object path-u (`products/vinyl/.../wl91600.jpg`), pa bez novog `?v=` cache-bust query-ja browser i CDN mogu da nastave da serviraju stari mutni JPG iako je object već zamenjen boljom verzijom.
32. **`/crm` traži `SUPABASE_SERVICE_ROLE_KEY` za čitanje leadova.** `inquiries` tabela je pod RLS pravilom da javnost može samo `INSERT`; ako service-role env nije dostupan, CRM može da se renderuje ali neće moći da povuče leadove iz baze.
33. **`/crm` zaštita trenutno je env-based Basic Auth u `middleware.ts`.** Ako postaviš `CRM_BASIC_AUTH_USERNAME` i `CRM_BASIC_AUTH_PASSWORD`, ruta traži HTTP Basic Auth; ako ih ne postaviš, `/crm` ostaje bez te zaštite i ne treba ga tretirati kao produkciono bezbedan admin panel.
34. **`/api/ops` ne sme više da bude “otvoren dok ne stigne pravi auth”.** Sada moraš imati `OPS_BASIC_AUTH_USERNAME` + `OPS_BASIC_AUTH_PASSWORD` (ili namerno deliti CRM Basic Auth kredencijale), a `actorId` više ne dolazi proizvoljno iz request body-ja nego iz autentifikovanog internog identiteta / `OPS_BASIC_AUTH_ACTOR_ID`.
35. **Ops rollback mora da vraća prethodni stabilni snapshot, ne snapshot samog target release-a.** Publish snapshot predstavlja stanje POSLE publish-a; ako ga rollback reaplikuješ, ništa nisi vratio unazad. Za normalan rollback uzima se prethodni stabilni release snapshot, a za undo rollback-a snapshot release-a koji je rollback poništio.
36. **Kanonski product klik više ne sme da živi u kartici/search copy-paste granama.** `components/ProductCard.tsx`, `components/ProductCardClient.tsx`, `/api/search`, `generateProductListSchema()` i `app/proizvodi/[slug]/page.tsx` sada dele `lib/utils/product-routes.ts`; ako menjaš canonical product URL obrazac, ažuriraj shared helper umesto da vraćaš lokalne `categorySlugMap` / ručne `/kategorije?...color=` grane.
37. **Brand detail stranice imaju collection-first lane za mešovite brendove.** `app/brendovi/[slug]/page.tsx` preko `lib/catalog/brand-curation.ts` mora da zadrži collection-only prikaz za Gerflor/Tarkett/BLOQ/Wolflor, dok flat katalozi poput Techem i TimberTech ostaju `asortiman/products` view; nemoj vraćati repo-global filter niti `spec.collection` heuristiku koja bi sasekla flat lane.
38. **`findByBrand()` i brand hub metrike moraju ostati simetrični sa `findAll()`.** Ako uvodiš novi mock-backed ili parcijalno-DB brend, nemoj praviti poseban brand-detail merge lane koji zaobilazi `findAll({ brandIds })`; u suprotnom `/brendovi`, `/brendovi/[slug]` i `/kategorije` summary count-ovi ponovo odlaze u drift.
39. **`lib/utils/product-images.ts` je owner i za surface izbor i za fallback redosled.** Komponente i API surface-i ne smeju ručno da čitaju `images[0]`, da spljoštavaju prvi URL bez candidate niza ili da održavaju lokalni “probaj sledeću sliku” lane mimo shared helpera.
40. **`lib/utils/image-runtime.ts` ne odlučuje fallback redosled.** “Validna slika” za shared fallback znači da posle surface rezolucije postoji neprazan lokalni path ili parsabilan `https` URL; runtime helper odlučuje samo optimizaciju/bypass, ne to koji kandidat ide prvi.
41. **Kad menjaš image host/variant/fallback contract, moraš zatvoriti ceo lane u istom prolazu.** Minimum: `lib/utils/product-images.ts`, `lib/utils/image-runtime.ts`, `next.config.mjs`, `lib/utils/productDataLoader.ts`, `scripts/validate-images.js`, `scripts/audit-catalog-quality.ts` i contract testovi moraju ostati poravnati, inače build/runtime/SEO vrlo lako odu u drift.

---

## 7. 💡 PREDLOZI ZA UNAPREĐENJE
> AI treba da dopunjuje ovu listu kad vidi priliku. Korisnik odlučuje šta se implementira.

### Prioritet: Visok
- [x] **SEO poboljšanja** — dodati collection-level opise u meta tagove za stranice proizvoda i kategorija
- [x] **Bundle size optimizacija** — `ProductDocuments` već čita iz API rute, bez klijentskog bundle bloata.
- [x] **Čišćenje mrtvih kategorija** — kategorije 8, 9, 10 su zauvek obrisane iz Supabase produkcije
- [x] **Dead code čišćenje** — proveriti `mock-data.ts`, `category-repository.ts` za nekorišćeni kod
- [x] **Nova kategorija: Elektroprovodni / ESD podovi** — 7 Gerflor kolekcija (Mipolam EL5/EL7, GTI EL5 Connect/Cleantech, Biocontrol EL5, Technic EL5 EU, Robust EL7) sa 42 boja. `esd_colors.json`, `getEsdCollectionProducts()`, Category 8 merge blok. (23.02.2026)

### Prioritet: Srednji
- [x] **Scraper optimizacija** — refaktorisati stare Playwright scrapere (npr. LVT) da koriste novu sigurniju logiku učitavanja slika (download ZIP archive) u slučaju da Gerflor skroz ograniči CDN i za LVT.
- [x] **PDF viewer** — pregled PDF dokumenata je sada inline pomoću `<object>` embeda.
- [x] **Breadcrumbs poboljšanje** — dodati međukorak u breadcrumbs: Kategorija > Kolekcija > Proizvod (posebno za BLOQ ploče)
- [x] **Unified data source** — proizvodi dolaze iz 4 izvora (JSON, TS fajlovi, Supabase, hardcoded). Supabase migracijska skripta je kreirana za lakše održavanje (spremna za izvršavanje).
- [x] **Automatski health check** — skripta koja proverava da svaki proizvod u bazi ima sliku, opis i bar 3 specifikacije (`npm run check:health`)
- [x] **PDF dokumenti za Gerflor** — dodati za svih 62 kolekcija u `documents_index.json`: vinil (25 kol, ~85 PDF-ova), LVT (19), Linoleum (15), Carpet (3). `ProductDocuments.tsx` ažuriran za cat 2.

### Prioritet: Nizak
- [x] **Uporedni prikaz** — dodati BLOQ proizvode u compare funkcionalnost
- [x] **Welding rod matching** — automatsko povezivanje welding rod-ova sa bojama
- [x] **Workflow za brisanje brenda** — napraviti `.agent/workflows/remove-brand.md` sa checklist-om svih mesta za čišćenje

---

## Common Gotchas

1. **Mock-only kategorije** — Kad dodaješ kategoriju samo u `mock-data.ts` (bez Supabase), moraš:
   - Dodati fallback u `category-repository.ts` (`findBySlug`, `findById`, `findAll`)
   - Koristiti dummy UUID u `product-repository.ts` za Supabase query (`'00000000-0000-0000-0000-000000000000'`) da izbegneš error
   - Dodati merge blok u `findAll()` za novu kategoriju

2. **UUID mapping** — `mapCategoryIdToUUID('X')` vraća `'X'` ako nema maping → Supabase error jer column `category_id` je UUID tip. Uvek proveri da li postoji mapping pre query-ja.

3. **Variable shadowing u API route** — `for (const collection of ...)` preklapa `collection` query param. Koristiti drugi naziv za loop varijablu.

4. **isColorSelectorCategory u page.tsx** — Kad dodaješ novu kategoriju, moraš da dodaš njen ID u SVE liste u `app/proizvodi/[slug]/page.tsx`:
   - `isColorSelectorCategory` (line ~367) — bez ovoga stranica koristi bare layout
   - `sharedCertsAndEco` (line ~370) — sertifikati i eko features
   - `shouldRedirectCollection` (line ~250) — redirect boja na kolekciju
   - `collectionCategoryLabel` (line ~461) — labela u color selectoru
   - `categorySlugMap` (line ~190) — mapiranje ID → slug
