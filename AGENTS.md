# 🏠 Podovi.online — AGENTS.md

> **Poslednje ažuriranje:** 11.02.2026 (EGGER fix: product-repository merge)

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
- **Multi-brand** — Tarkett, Gerflor, BLOQ, EGGER — svaki brend ima drugačiju strukturu podataka
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
| Laminat | 1 | Tarkett (3), EGGER (9) | `lib/data/tarkett-products.ts`, `lib/data/mock-data.ts` |
| Vinil | 2 | Gerflor (6) | `vinyl_colors_complete.json` |
| Parket | 3 | Tarkett (3) | `lib/data/tarkett-products.ts` |
| Tekstilne ploče | 4 | Gerflor (6), BLOQ (8) | `carpet_tiles_complete.json`, `bloq_carpet_tiles.json` |
| Deking | 5 | — | Supabase |
| LVT | 6 | Gerflor (6) | `lvt_colors_complete.json` |
| Linoleum | 7 | Gerflor (6) | `linoleum_colors_complete.json` |
| Ugradnja | 8 | EGGER (9) | `lib/data/mock-data.ts` |
| Lajsne | 9 | EGGER (9) | `lib/data/mock-data.ts` |
| Alati | 10 | EGGER (9) | `lib/data/mock-data.ts` |

### EGGER (6 kolekcija podova + 6 pribora):
| Kategorija | Kolekcije |
|---|---|
| NatureSense (Laminat, cat 1) | NatureSense, Herringbone, Aqua, Aqua+ |
| AquaDura (Laminat, cat 1) | AquaDura, AquaDura+ |
| Ugradnja (cat 8) | Silenzio Easy, Silenzio Easy SD, Silenzio Professional SD, Silenzio Duo |
| Lajsne (cat 9) | Lajsna CUBICAL 8cm, Profil 3-u-1 |

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

**EGGER integracija — Faza 1 (11.02.2026)**
- Dodat EGGER brend (id: 9, slug: 'egger', Austrija)
- Dodate nove kategorije: "Ugradnja" (id: 8), "Lajsne" (id: 9), "Alati" (id: 10)
- Dodato 4 NatureSense laminat kolekcije + 2 AquaDura kolekcije (sve u cat 1 — Laminat)
- Dodato 4 podloge u Ugradnja (cat 8) + 2 lajsne/profili u Lajsne (cat 9)
- Preuzete slike sa EGGER CDN (logo SVG, 6 slika kolekcija)
- Ažurirana kategorijska stranica za prepoznavanje EGGER- SKU prefiksa

**EGGER integracija — Faza 1.5: Obogaćivanje podataka + UI (11.02.2026)**
- Product tip proširen sa `benefits`, `compatibleAccessories`, `documents.type`
- Obogaćeno 6 EGGER kolekcija: 10-13 specs, 6-7 prednosti, kompatibilan pribor, 4-5 PDF dokumenata
- PDF dokumenti sa EGGER CDN-a: uputstva za ugradnju (srpski), garancija (srpski), čišćenje (srpski), TDS, EHD
- Nova komponenta `ProductBenefits.tsx` — zeleni gradient card sa checkmark listom
- Nova komponenta `RecommendedAccessories.tsx` — grid kartica sa slikama i hover efektima
- Product stranica proširena: prednosti → pribor → dokumenti → sertifikati za EGGER

**EGGER integracija — Faza 2: Dekori kao boje (11.02.2026)**
- Scrape-ovano svih 284 EGGER dekora sa API-ja (`api.www.egger.com/pimebp/decor-search/api/searchPage`)
- Generisan `public/data/egger-decors.json` (284 boja u Color formatu)
- Mapirano 16 API kolekcija → 3 sajt kolekcije: NatureSense (238), AquaDura (40), Herringbone (6)
- Dodata EGGER grana u `prepare-colors.ts` (prepareCustomColors + mergeSelectedColor)
- Skripta `scripts/generate-egger-decor-data.js` za regenerisanje podataka

### 🔲 TODO
- [ ] EGGER Faza 3: Preostali pribor (još lajsni, lepkovi, silikoni, alati, čišćenje, popravka)
- [ ] Poboljšati SEO meta description i OG tagove za sve kategorije
- [ ] Implementirati prikaz dokumenata na product detail stranici (Dokumentacija sekcija)
- [ ] Izvući detaljne specifikacije iz PDF tech datasheet-ova (debljina, akustika, težina)
- [ ] Dodati "Dostupne podloge" prikaz za Trinity kolekcije
- [ ] Razmotriti prebacivanje klijentskih JSON import-ova na API rute (bundle size)

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
│   ├── data/               # Tarkett/Gerflor/Parket statički podaci
│   └── repositories/       # Data access layer (Supabase)
│
├── public/data/            # JSON fajlovi sa bojama i specifikacijama
│
├── types/                  # TypeScript tipovi (Product, Category, Brand)
│
└── scripts/                # Utility skripte (enrichment, image validation)
```

## 8. ⚡ COMMON GOTCHAS
> Lekcije naučene iz prethodnih grešaka — čitaj ovo da ne ponavljaš iste greške.

1. **DB vs JSON priority**: `productRepository.findBySlug(slug)` je PRVI pokušaj u resolveru. Ako DB ima proizvod, JSON podaci se ne koriste automatski. Za obogaćivanje, moraš EKSPLICITNO proveriti i merge-ovati JSON podatke u DB proizvod.
2. **`read_url_content` ne prikazuje sve**: Crawler tool flatuje HTML sekcije. Koristi `Select-String` na raw HTML-u da potvrdiš da li je sadržaj zaista renderovan.
3. **Next.js dev server kešira agresivno**: Posle promene `resolve-product.ts`, moraš restartovati dev server ili obrisati `.next/` direktorijum.
4. **Slug prefix konvencije**: Vinil i LVT koriste `gerflor-` prefix u slug-u, ali JSON fajlovi čuvaju slug BEZ prefixa. Uvek proveri oba oblika.
5. **`parseDescriptionToSections()`**: Sekcioni naslovi moraju biti na ZASEBNOJ LINIJI i moraju se završavati sa `:`. Linija mora tačno da se poklopi sa `sectionTitles` nizom u `spec-helpers.ts`.
6. **AŽURIRAJ AGENTS.md PRE git push**: Svaka značajna promena MORA da ažurira AGENTS.md changelog i TODO listu kao deo istog commit-a. Ne push-uj bez ažuriranog AGENTS.md.
7. **Mock-data proizvodi MORAJU biti merge-ovani u SupabaseProductRepository**: Sajt koristi Supabase kao primarni izvor podataka. Proizvodi u `mock-data.ts` se NEĆE prikazati na sajtu osim ako nisu EKSPLICITNO merge-ovani u `SupabaseProductRepository.findAll()`. Pogledaj BLOQ (cat 4) i EGGER (cat 1,8,9,10) blokove za primer. Bez ovog koraka proizvodi postoje u kodu ali su nevidljivi na sajtu!
8. **EGGER koristi `brand_line` spec, ne `collection`**: Tarkett laminat koristi `collection` spec key za kolekciju. EGGER koristi `brand_line`. Kategorijska stranica MORA da proveri oba ključa pri grupiranju (`p.specs?.find(s => s.key === 'collection')?.value || p.specs?.find(s => s.key === 'brand_line')?.value`). Isto važi za SKU filter — mora da uključi `EGGER-` pored `LAM-`.

---

## 7. 💡 PREDLOZI ZA UNAPREĐENJE
> AI treba da dopunjuje ovu listu kad vidi priliku. Korisnik odlučuje šta se implementira.

### Prioritet: Visok
- [ ] **SEO poboljšanja** — dodati collection-level opise u meta tagove
- [ ] **Bundle size optimizacija** — ProductDocuments importuje ceo bloq JSON (~700KB) na klijentu

### Prioritet: Srednji
- [ ] **Filteri za BLOQ** — dodati filter po kolekciji/familiji na kategorijskoj stranici
- [ ] **PDF viewer** — pregled PDF dokumenata inline umesto download-a
- [ ] **Breadcrumbs poboljšanje** — dodati kolekciju u breadcrumbs za BLOQ

### Prioritet: Nizak
- [ ] **Uporedni prikaz** — dodati BLOQ proizvode u compare funkcionalnost
- [ ] **Welding rod matching** — automatsko povezivanje welding rod-ova sa bojama
