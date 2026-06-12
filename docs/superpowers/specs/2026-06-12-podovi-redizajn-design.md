# Redizajn sajta podovi.online — „Galerija" (Faza 1)

> Datum: 2026-06-12
> Status: spec odobren kroz brainstorming sa vlasnikom (vizuelni pravac, rasporedi i tretman cena izabrani kroz mockupe)
> Referenca: https://www.prostoria.eu/products/ — galerijska estetika, slika u prvom planu, što manje okvira

## 1. Kontekst i cilj

Sajt je katalog podnih obloga (Next.js 14 + Tailwind 3, srpski jezik, bez e-commerce-a — vrednost je katalog + SEO + upiti). Trenutni dizajn je „Apple-style" ali nekonzistentan: mešaju se hex vrednosti i Tailwind paleta, pet različitih border-radius vrednosti, šareni bedževi kategorija, senke na karticama, slike u 4:3 sa elementima preko njih.

Cilj Faze 1: kompletan vizuelni redizajn svih javnih stranica u čist galerijski monohrom, sa postojećim podacima. Obogaćivanje podataka sa sajtova proizvođača je Faza 2 (poseban projekat, videti §10).

## 2. Donete odluke

| Odluka | Izbor |
|---|---|
| Vizuelni pravac | Galerijski monohrom — potpuno crno-belo, bez akcentne boje (opcija A od tri ponuđene) |
| Početna strana | Listač (tabovi + mreža) zadržava strukturu, restilizuje se |
| Fazranje | Prvo redizajn sa postojećim podacima, pa obogaćivanje podataka brend po brend |
| Stranica proizvoda | Split: galerija levo, sticky info kolona desno |
| Filteri kategorija | Traka sa brend čipovima na vrhu + fioka (slide-over) za detaljne filtere |
| Cene | Prikazane svuda, tipografski diskretne (male, sive); „Cena na upit" kao uredan tekst, bez italika |
| Logotip | malim slovima „podovi", deblji rez (bold), zbijen — kao Prostoria wordmark |

## 3. Dizajn sistem „Galerija"

### 3.1 Boje

Jedina paleta su nijanse; semantički tokeni u Tailwind konfiguraciji se zovu `ink` (skala sivih) i `paper` (podloga slika):

| Token | Hex | Upotreba |
|---|---|---|
| ink-900 | `#111111` | primarni tekst, CTA pozadina, logo |
| ink-600 | `#555555` | sekundarni tekst |
| ink-500 | `#767676` | etikete i mali tekst (minimum za WCAG AA na belom) |
| ink-400 | `#8A8A8A` | samo za veliki/dekorativni tekst (≥18px) |
| hairline | `#E5E5E5` | sve linije razdvajanja, 1px |
| paper | `#F7F5F2` | podloga iza slika dekora (topao neutral) |
| bela | `#FFFFFF` | pozadina celog sajta (zamenjuje `#F5F5F7`) |

Izuzeci: WhatsApp dugme zadržava zvaničnu zelenu; sistemske greške standardnu crvenu (forme, error stranice). Šareni bedževi kategorija (`badge-laminat` itd.) se ukidaju — zamena je uppercase tekstualna etiketa.

Roza/crvena `primary` paleta, Apple plava (`#0071E3`, `#0066CC`) i sve ad-hoc hex vrednosti po komponentama se uklanjaju.

### 3.2 Tipografija

Inter ostaje. Težine: 400 (podrazumevano), 500 (naglasak), 700 samo logotip. Hijerarhija veličinom i belinom, ne podebljanjem.

| Stil | Veličina (mobilni/desktop) | Detalji |
|---|---|---|
| h1 | 34 / 48px | regular, tracking −0.02em |
| h2 | 28 / 34px | regular |
| h3 | 20 / 24px | regular ili medium |
| telo | 16px | line-height 1.6 |
| malo | 13–14px | cene, meta podaci |
| etiketa | 11px | uppercase, tracking 0.14em, ink-500 |

### 3.3 Oblik i dubina

- Border-radius: 0 svuda (dugmad, kartice, inputi, modali, fioke).
- Senke: nijedna. Razdvajanje hairline linijama (1px `#E5E5E5`) i belinom.
- Kontejner: `max-w-[1440px]`, padding 24px mobilni / 40px desktop (sa 1200px).
- Inputi: bez okvira — samo donja linija (1px ink-900 u fokusu, hairline inače), etiketa iznad u stilu „etiketa". Tastaturni fokus (`focus-visible`) dodatno dobija standardni 2px outline iz §7; fokus mišem samo donju liniju.
- Fokus za tastaturu: 2px outline ink-900 sa offsetom 2px (zamenjuje plave/roze ringove).

### 3.4 Dugmad

| Tip | Stil |
|---|---|
| Primarno | pozadina `#111111`, beo tekst 13px, padding 12×26, hover `#333333` |
| Sekundarno | 1px okvir ink-900, transparentno; hover: pozadina ink-900, beo tekst |
| Tekstualno | tekst + donja linija, strelica `→` |

U crnim sekcijama dugmad se invertuju (belo na crnom).

### 3.5 Kartica proizvoda

- Slika 4:5, ivica-do-ivice, bez okvira i radiusa, podloga `paper` dok se učitava / za transparentne slike.
- Hover: blagi zum slike (scale ~1.03, ~700ms ease) + donja linija ispod naziva.
- Ispod slike: brend (etiketa 11px uppercase ink-500) → naziv (15–16px regular ink-900) → cena (13px ink-500; „Cena na upit" istim stilom, bez italika).
- Bez trajnih elemenata preko slike (bedževi i tekst se uklanjaju). Jedini izuzetak su prolazne akcije: srce/uporedi kao monohromne ikonice u gornjem desnom uglu, na desktopu vidljive samo na hover i `focus-visible`, na mobilnom uvek (postojeća logika ProductCardOverlay, restilizovana).
- Bedž kategorije se uklanja sa kartica (kontekst daje stranica/tab).

### 3.6 Animacije

ScrollReveal se stišava (kraći pomak, brže trajanje). Framer-motion pill animacije se uklanjaju zajedno sa pill-tabovima. Tranzicije: opacity/transform, 150–300ms.

## 4. Stranice

### 4.1 Header

Beo, sticky, hairline donja ivica, bez senke. Levo logotip (malim slovima „podovi", Inter bold, zbijen — `PodoviWordmark` se menja; važi i za footer i OG slike koje ga koriste). Desno: pretraga (otvara se preko cele širine headera umesto dropdown kutije), omiljeni sa brojem, crno pravougaono dugme „Pošalji upit". Mobilni meni: full-screen beli overlay sa krupnim linkovima (umesto harmonika-menija).

### 4.2 Početna

- Listač (`HomeProductTabs`): struktura ostaje (tabovi kategorija + mreža + „Pogledaj sve"). Tabovi veliki regular sa underline indikatorom (aktivan ink-900, neaktivni ink-400). Kartice po §3.5.
- „Zašto izabrati nas": tri kolone razdvojene hairline vertikalama, veliki svetli brojevi 01/02/03, bez hover sivih kutija.
- Završni CTA blok: ostaje crn — jedini tamni blok na sajtu, belo dugme.

### 4.3 Kategorija (`/kategorije/[slug]`)

- Zaglavlje: naslov + broj proizvoda (etiketa stil).
- Hairline traka: levo brend čipovi (tekstualni, aktivan podvučen), desno „Filteri" dugme → fioka zdesna (bela, hairline, bez radiusa) sa svim postojećim filterima (cena, debljina, kolekcija, tip vinila, asortiman…).
- Tabovi Kolekcije/Boje: tekstualni sa underline (umesto pilula).
- Mreža: 2 / 3 / 4 kolone (mobilni / tablet / desktop), veći razmaci.
- URL parametri filtera i ponašanje (debounce, auto-apply) ostaju identični — menja se samo prezentacija.
- Loading: skeleton pločice u `paper` boji umesto spinera.

### 4.4 Proizvod (`/proizvodi/[slug]`, `/proizvodi/welding-rod/[ref]`)

- Breadcrumbs: 13px, ink-500, separator „/".
- Levo: galerija — glavna slika (podloga `paper`, bez okvira), red thumbnail-a ispod, strelice i tačkice monohromne. Fade pri promeni boje ostaje.
- Desno (sticky): brend etiketa → h1 naziv (regular) → kolekcija → cena (diskretna, §2) → mreža kvadratnih swatch-eva boja (klik menja sliku kao sad; „+N boja" vodi na sve) → backing varijante/welding info gde postoje → crni CTA „Pošalji upit" pune širine → link „Pogledaj na sajtu proizvođača" (tekstualni stil).
- Pill-tabovi (`ProductDetailsTabs`) se ukidaju: Opis, Specifikacije (dvokolonska tabela sa hairline redovima), Eko, Dokumenti (red: ikona fajla + naziv + ikona preuzimanja, hairline između) postaju sekcije vidljive odmah, jedna ispod druge, sa etiketa-naslovima. Prazne sekcije se ne renderuju.
- Video embed, Related, Recommended accessories, Recently viewed: ostaju, restilizovani (kartice §3.5).
- Sticky CTA na mobilnom (`ProductInquiryStickyCTA`): ostaje, crn.

### 4.5 Footer

Svetao: bela pozadina, hairline gornja ivica, logotip (mala slova, bold, ink-900), opis i kontakt u ink-500/600, socijalne ikonice monohromne. (Crni footer se ukida; kontrast daje crni CTA blok iznad.)

### 4.6 Ostale stranice

- `/omiljeni`, `/uporedi`: mreže/tabela u novom jeziku; uporedna tabela sa hairline redovima kao specifikacije; `CompareBar` beo sa hairline gornjom ivicom.
- `/upiti` + `InquiryModal` + `ContactForm`: bottom-line inputi, crno dugme; modal beo, bez radiusa, hairline.
- `FlooringCalculator`, `GlobalSearch` (overlay preko headera), `BackToTop`, `Breadcrumbs`, `CertificationBadges`, `EcoFeatures`, `ProductBenefits`: isti jezik.
- `not-found` / `error`: velika svetla tipografija, tekstualni link nazad.
- `/crm` se NE dira (interni alat).

## 5. Obuhvaćeni fajlovi

Temelj: `tailwind.config.ts`, `app/globals.css`.

Komponente: `ProductCard`, `ProductCardClient`, `ProductCardOverlay`, `ProductColorSelector`, `ColorGrid`, `HomeProductTabs`, `Header`, `PodoviWordmark`, `Footer`, `CategoryTabs`, `ProductFilters`, `ProductDetailsTabs`, `ProductCharacteristics`, `ProductDescriptionWithCharacteristics`, `ProductDocuments`, `Breadcrumbs`, `GlobalSearch`, `CompareBar`, `CompareButton`, `FavoriteButton`, `InquiryButton`, `InquiryModal`, `ContactForm`, `FlooringCalculator`, `RelatedProducts`, `RecommendedAccessories`, `RecentlyViewed`, `ProductInquiryStickyCTA`, `ProductActions`, `ShareButtons`, `BackToTop`, `ScrollReveal` (parametri), `CertificationBadges`, `EcoFeatures`, `ProductBenefits`, `BrandLogoMark` (po potrebi), `WhatsAppButton` (samo pozicija/veličina; zelena ostaje).

Stranice: `app/page.tsx`, `app/kategorije/[slug]/page.tsx`, `app/proizvodi/[slug]/page.tsx`, `app/proizvodi/welding-rod/[ref]/page.tsx`, `app/omiljeni/*`, `app/uporedi/*`, `app/upiti/page.tsx`, `app/not-found.tsx`, `app/error.tsx`, `app/layout.tsx`.

## 6. Šta se NE dira

- Data sloj: `public/data/*.json`, `lib/data/*`, `lib/repositories/*`, `lib/product-page/*` (resolve-product, prepare-colors), `types/index.ts`.
- Kanonski slugovi, URL-ovi, redirecti, sitemap, robots.
- SEO strukturirani podaci (Organization, Product, Breadcrumb…), meta tagovi (osim ako vizuelni OG asseti koriste wordmark — onda samo wordmark).
- API rute, `/crm`, email tok, analitika.
- Nikakav e-commerce.

## 7. Pristupačnost

- Mali tekst na belom: minimum `#767676` (4.5:1). `#8A8A8A` samo ≥18px.
- Sve hover-only akcije imaju `focus-visible` ekvivalent.
- Fokus indikator: 2px ink-900 outline, offset 2px.
- Tap mete na mobilnom ≥44px.
- Underline tabovi i čipovi imaju `aria-selected`/`aria-pressed` kao postojeći.

## 8. Verifikacija

1. `npm run build` (uključuje `validate:images`) — bez grešaka.
2. `npm run test:contract` — zeleno.
3. Vizuelni pregled u dev serveru, desktop (1440) i mobilni (390) viewport, za: početnu; kategorije `vinil` i `lvt` (najveće) + `otiraci` (flat katalog); proizvod iz Tarkett LVT (mnogo boja), BLOQ (roomshots + dokumenti), Romus alat (bez boja), welding-rod stranicu; omiljeni; uporedi sa 3 proizvoda; upiti; globalnu pretragu; mobilni meni.
4. Provera da nijedna stranica ne renderuje stare token klase (`primary-*` roza, `badge-*` šareni, `rounded-*`, `shadow-*` van dozvoljenih izuzetaka).

## 9. Rizici i ublažavanje

- Veliki broj fajlova u jednom zahvatu → raditi token-temelj prvo, pa komponente u logičkim grupama (kartice → listing → proizvod → globalno), sa buildom posle svake grupe.
- Uklanjanje framer-motion pill animacija može ostaviti mrtve zavisnosti → proveriti import-e posle izmene `ProductDetailsTabs`.
- `PodoviWordmark` se koristi i u OG generisanju → proveriti sva mesta korišćenja pre izmene.
- Slike 300–800px na većim površinama → u mreži od 3–4 kolone na 1440px kartice su široke ~320–430px, pa postojeće slike ostaju oštre; full-bleed hero NIJE deo Faze 1 upravo zbog toga.

## 10. Faza 2 (van obima ovog speca)

Obogaćivanje podataka brend po brend sa sajtova proizvođača, redosled po ozbiljnosti praznina: Gerflor vinil (12 kolekcija bez slika) → slike visoke rezolucije svuda → Alpod PDF dokumenti (851 proizvod) → TimberTech deking → Tarkett room-scene fotografije → Techem/Romus dokumentacija i specifikacije. Svaki brend dobija svoj spec → plan → implementaciju, i tek tada se uključuju full-bleed hero i editorijal galerije gde slike to dozvole.
