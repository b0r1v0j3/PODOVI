# 🏠 Podovi.online — AGENTS.md

> **Poslednje ažuriranje:** 24.03.2026 (Welding systems added for weldable vinyl/linoleum lines)

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

Podovi.online je **katalog podnih obloga** za tržište Srbije. Sajt služi kao online katalog firme Podovi DOO (Novi Sad) — kupci pregledaju proizvode, šalju upite, a prodaja se vrši offline.

### Ključni principi:
- **Nije e-commerce** — nema korpu ni checkout. Korisnici šalju upite za proizvode
- **Sajt je na srpskom jeziku** — sav sadržaj, nazivi, specifikacije su na srpskom
- **Multi-brand** — Tarkett, Gerflor, BLOQ, Wolflor — svaki brend ima drugačiju strukturu podataka
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
npm run build      # Production build (+ image validation)
npm start          # Production server
```

### Environment Variables:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Gmail SMTP
GMAIL_USER=prodaja@podovi.online
GMAIL_APP_PASSWORD=

# App
NEXT_PUBLIC_BASE_URL=https://www.podovi.online
NEXT_PUBLIC_GA_MEASUREMENT_ID=
```

---

## 3. 📦 PROIZVODI I KATEGORIJE

### Kategorije:
| Kategorija | ID | Brendovi | Izvor podataka |
|---|---|---|---|
| Laminat | 1 | Tarkett (3) | `lib/data/tarkett-products.ts` |
| Vinil | 2 | Gerflor (6), Tarkett (3), Wolflor (11) | `vinyl_colors_complete.json` (25 kolekcija, 939 boja), `vinyl_special_colors.json` (2 kolekcije, 34 boje), `tarkett_vinyl_home_colors.json` (12 kolekcija, 281 boja), `tarkett_homogeneous_vinyl_colors.json` (20 kolekcija, 544 boje), `tarkett_heterogeneous_vinyl_colors.json` (15 kolekcija, 441 boja), `wolflor_vinyl_colors.json` (64 kolekcije, 771 dekora; 57 live + 7 PDF suplement, slike na Supabase) |
| Parket | 3 | Tarkett (3) | `lib/data/tarkett-products.ts` |
| Tekstilne ploče | 4 | Gerflor (6), BLOQ (8) | `carpet_tiles_complete.json`, `bloq_carpet_tiles.json` |
| Deking | 5 | TimberTech (10) | `tis_deking_products.json` |
| LVT | 6 | Gerflor (6), Tarkett | `lvt_colors_complete.json` (19 kolekcija, 595 boja), `tarkett_lvt_products.json` |
| Linoleum | 7 | Gerflor (6) | `linoleum_colors_complete.json` (15 kolekcija, 203 boje) |
| Elektroprovodni | 8 | Gerflor (6) | `esd_colors.json` (7 kolekcija, 42 boje) |
| Industrijske ploče | 9 | Gerflor (6) | `industrial_colors.json` (4 kolekcije, 75 boja) + `manual-collection-products.ts` |
| Sport | 10 | Gerflor (6), Tarkett (3) | `sport_colors.json` (3 kolekcije, 33 boje), `tarkett_sport_colors.json` (22 kolekcije, 255 boja) + `manual-collection-products.ts` |

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

---

## 5. 📋 STANJE PROJEKTA

### ✅ Završeno

**Dodati sistemi varenja i elektrode za varive vinil / linoleum kolekcije (24.03.2026)**
- Uveden je novi kanonski izvor `public/data/welding_accessories.json` sa kuriranim Gerflor i Tarkett sistemima varenja koji trenutno koristimo na sajtu: `Gerflor CR40`, `MCR40`, `BBR40`, `CR50`, generički `Gerflor linoleum 4 mm (prema dekoru)`, kao i zvanične Tarkett accessory kolekcije `Elektrode za varenje - vinil podovi` i `Elektrode za varenje - linoleum`.
- Dodat je centralni helper `lib/product-page/welding-helpers.ts` koji iz novih podataka i postojećih collection karakteristika izvodi koje varilačke vrpce treba prikazati po kolekciji, bez nepouzdanog matchovanja Tarkett dekora samo po šifri; linoleum ostaje na postojećim tačnim `welding_rod` referencama po boji.
- Ceo pipeline je povezan kroz `color-helpers.ts`, `prepare-colors.ts`, `resolve-product.ts`, `/api/colors`, `/api/color-data`, `ProductCharacteristics` i `ProductColorSelector`, tako da se kompatibilna varilačka vrpca sada vidi i na collection SSR renderu i pri promeni boje / fetch toku za potvrđene Gerflor i Tarkett varive kolekcije.
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
│   ├── omiljeni/           # Omiljeni proizvodi
│   ├── uporedi/            # Poređenje proizvoda
│   └── api/                # API rute (search, contact, inquiries)
│
├── components/             # React komponente (30+)
│
├── lib/
│   ├── product-page/       # KRITIČNO: resolver, color merge, spec helpers
│   ├── data/               # Tarkett/Gerflor/Parket statički podaci + manual collection header proizvodi + Tarkett wood enrichment
│   └── repositories/       # Data access layer (Supabase)
│
├── public/data/            # JSON fajlovi sa bojama/specifikacijama i dokument indeksima (LVT, Vinil, Tarkett vinil za kuću, Tarkett homogeni vinil, Tarkett heterogeni vinil, Wolflor vinil, ESD, Industrijske, Sport, Tarkett sport, Tarkett wood collection index + PDF indeksi)
│
├── types/                  # TypeScript tipovi (Product, Category, Brand)
│
├── scripts/                # Utility skripte (enrichment, image validation, Tarkett audit/sync, catalog quality audit)
│
└── tools/                  # Ekstraktori/scraperi za zvanične kataloge (Gerflor, Tarkett, Wolflor, fallback preko sitemap/json endpointa kada treba)
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
19. **Ne koristi `fs` proveru nad `public/` u runtime repository/resolver kodu.** Cak i bez direktnog importa slika, `existsSync(join(process.cwd(), 'public', ...))` moze da natera Vercel trace da uvuce ogromne `public/images/*` foldere u serverless funkcije i probije size limit.
20. **Ne mutiraj shared `Product` objekte iz loadera/repozitorijuma.** `mergeSelectedColor()` menja ime, sliku i specifikacije proizvoda; zato svaki product koji dolazi iz cache-ovanih JSON/manual izvora mora prvo da se klonira, inace ce collection kartice na kategorijama poceti da prikazuju poslednju izabranu boju.
21. **Kad Gerflor ZIP sadrzi i clean i loupe JPG, uvek biraj clean.** Posebno kod `GTI Max` kolekcija arhiva cesto ima fajl tipa `LOUPE-...jpg` i zaseban cist `GTI Max - Color.jpg`; za sajt koristi cistu boju, ne preview sa kruzicem.
22. **Kad na Supabase prepisujes sliku na istoj putanji, URL u JSON-u mora da dobije novu verziju.** Ako ostane identican URL, browser i CDN mogu satima da serviraju staru GTI/industrijsku preview sliku iako je object vec zamenjen clean JPG-om; dodaj `?v=...` cache-bust na `image` polje kad hoces da promena odmah postane vidljiva.
23. **Tarkett `Vinil za kuću` extractor ne treba da se oslanja na običan `https.get` HTML fetch za collection page.** Za ove kolekcije sirovi response često nema `window.__NUXT__` payload, dok ga `page.content()` iz Playwright-a uredno vrati posle rendera; zato `tools/extract_tarkett_vinyl_home.js` mora da učitava collection stranice kroz browser, a product JSON može direktno preko `json-collection-product/...` endpointa.
24. **Tarkett `Heterogeni vinil` category grid ume da vrati prazan DOM query u headless shell-u.** Ako `document.querySelectorAll('a[href*=\"/sr_RS/kolekcija-\"]')` vrati `0`, proveri `page.content()` pre nego što proglasiš stranicu praznom. `tools/extract_tarkett_heterogeneous_vinyl.js` zato mora da ima HTML regex fallback za collection href-ove / slike i ne sme da zavisi samo od live DOM selektorâ.
25. **Wolflor slike za produkciju idu na Supabase, ne na `public/images` i ne ostaju na `wolflor.cn`.** Kad osvežavaš `public/data/wolflor_vinyl_colors.json`, pokreni `python tools/extract_wolflor_vinyl.py --upload-supabase`; bez tog flag-a ostaće lokalni staging JPG-ovi ili direktni vendor URL-ovi, što nije kanonski storage obrazac projekta. Ako baš želiš da pregaziš postojeće Supabase assete novim uploadom, koristi `--force-upload`.
26. **Za ovaj repo ne radi lokalni `vercel deploy` bez zaštite.** Workspace ima ogromne lokalne foldere (`.next`, `tmp`, `output`, `archive*`, `node_modules`), pa CLI bez `.vercelignore` može pokušati da uploaduje više gigabajta šuma. Standardni put je `git push` i Vercel auto-deploy sa `main`.
27. **Vercel `env pull` upisuje navodnike u `.env.local`.** Ako neka skripta ručno parsira `.env.local` i setuje `process.env`, mora da skine spoljne `"` navodnike; u suprotnom `NEXT_PUBLIC_SUPABASE_URL` postane `"https://..."` i `createClient()` pada sa `Invalid supabaseUrl`.
28. **Wolflor Vinil kolekcije koriste SKU prefiks `WOLFLOR-VINYL-` i moraju da budu tretirane kao collection header proizvodi.** Ako collection/header detekcija u kategorijskim stranicama ili tabovima proverava samo prefikse poput `GER-`, `TARKETT-` ili `VINIL-`, Wolflor će završiti u pogrešnom toku i nestaće iz `Kolekcije` taba i `brands=11` filter rendera na `/kategorije/vinil`.
29. **Mock-only brand filteri ne smeju sirovo u Supabase UUID `brand_id` query.** Brendovi poput `BLOQ`, `TimberTech` i `Wolflor` žive kroz mock/JSON/manual sloj; ako `product-repository.ts` pošalje legacy ID tipa `8`, `10` ili `11` direktno u `.in('brand_id', ...)` nad UUID kolonom, Supabase grana pukne i merge blokovi ispod se nikad ne izvrše.
30. **Za Wolflor kolekcije nemoj koristiti roomshot/ambijentalni hero kao kanonski collection image.** Čak i kada vendor ima `collection.jpg` ili category hero u prostoru, Wolflor kolekcijski prikaz kod nas treba da koristi prvu dostupnu sliku dekora/boje; to važi samo za Wolflor i ne treba prelivati na ostale brendove.
31. **Kad pregaziš Wolflor JPG na istoj Supabase putanji, promeni i URL query verziju.** PDF kolekcije poput `Andes`/`Atlas` sada često dobijaju kvalitetniji crop na istom object path-u (`products/vinyl/.../wl91600.jpg`), pa bez novog `?v=` cache-bust query-ja browser i CDN mogu da nastave da serviraju stari mutni JPG iako je object već zamenjen boljom verzijom.

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
