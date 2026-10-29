---
description: Operational runbook for canonical supplier extractor refreshes, validation gates, and rollback handling
---

# Extractor Refresh + Rollback Runbook

> Operativni runbook za osvežavanje kanonskih supplier izvora. Koristi ga svaki put kada radiš katalog refresh ili incident rollback.

## 1) Scope i vlasništvo

Ovaj runbook pokriva sve kanonske extractore koji pune `public/data/*` katalog izvore:

> **NAPOMENA (2026-06-13):** originalnih 7 `extract_tarkett_*` / `wolflor` skripti je obrisano iz repoa; obnova ide kroz Fazu 2 (spec `docs/superpowers/specs/2026-06-13-faza-2-podaci-master-s1-s2-design.md`). Stare komande u sekciji 3 su istorijske dok se alati ne obnove.

| Skripta | Kanonski izlaz | Napomena |
|---|---|---|
| `tools/ingest_gerflor_cee.js` | `public/data/vinyl_colors_complete.json` + Supabase `product-images`/`product-documents` | Gerflor CEE vinil — dokumenti (čisti srpski nazivi, dedupe), room-scene, 1500px dekor; flagovi `--dry-run`, `--collection=`, `--skip-existing`; manifest `output/ingest-gerflor-cee-manifest.json`; sve self-hostovano (bez hotlinkova) |
| `tools/extract_tarkett_core.js` | `output/tarkett-core-*.json` | Obnovljena osnova za čitanje tarkett.rs kolekcija (S1); puni refresh alati se obnavljaju po segmentima Faze 2 |
| `tools/extract_tarkett_wood.js` | `public/data/tarkett_wood_collection_index.json` | Parket + Laminat collection enrichment |
| `tools/extract_tarkett_vinyl_home.js` | `public/data/tarkett_vinyl_home_colors.json` | Tarkett Vinil za kuću |
| `tools/extract_tarkett_homogeneous_vinyl.js` | `public/data/tarkett_homogeneous_vinyl_colors.json` | Tarkett Homogeni vinil |
| `tools/extract_tarkett_heterogeneous_vinyl.js` | `public/data/tarkett_heterogeneous_vinyl_colors.json` | Tarkett Heterogeni vinil |
| `tools/extract_tarkett_sports.js` | `public/data/tarkett_sport_colors.json` | Tarkett Sport |
| `tools/extract_tarkett_lajsne.js` | `public/data/tarkett_lajsne_variants.json` | Lajsne (opciono `--upload-supabase`) |
| `tools/extract_wolflor_vinyl.py` | `public/data/wolflor_vinyl_colors.json` + `public/documents/wolflor/*` | Live + PDF supplement (preporučeno `--upload-supabase`) |

## 2) Pre-flight checklist

1. Radi iz čistog working tree-a ili eksplicitno izdvoji nepovezane izmene.
2. Potvrdi env za Supabase upload tok kada treba:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
3. Ne pokreći dva extractora paralelno nad istim JSON izvorom.
4. Pre osvežavanja zabeleži baseline:
   - `git status --short`
   - `npx tsx scripts/audit-catalog-quality.ts`
5. Ako je active release period, otvori issue komentar pre starta sa planom refresh window-a.

## 3) Refresh workflow (redosled izvršavanja)

Pokreći sekvencijalno, ovim redom:

```bash
node tools/extract_tarkett_wood.js
node tools/extract_tarkett_vinyl_home.js
node tools/extract_tarkett_homogeneous_vinyl.js
node tools/extract_tarkett_heterogeneous_vinyl.js
node tools/extract_tarkett_sports.js
node tools/extract_tarkett_lajsne.js --upload-supabase
python tools/extract_wolflor_vinyl.py --upload-supabase
```

Napomene:
- Za Wolflor/Tarkett lajsne koristi `--force-upload` samo kad svesno pregazuješ postojeće Supabase assete.
- Ako live supplier payload vrati degradiran sadržaj, oslanjaj se na ugrađene stored-JSON fallback putanje umesto ručnog brisanja podataka.

## 4) Post-flight validacija (obavezni gate)

Nijedan refresh ne ide dalje bez sva 3 koraka:

```bash
npx tsx scripts/audit-catalog-quality.ts
npm run test:contract
npm run build
```

Pass kriterijumi:
- `audit-catalog-quality` nema actionable `high`/`medium` nalaze
- contract testovi prolaze bez snapshot drift-a (osim namernog rebaseline-a)
- build prolazi bez TypeScript/runtime grešaka

Artefakti koje treba sačuvati u issue komentaru:
- lista skripti koje su pokrenute
- kratki diff summary (`public/data/*`, `public/documents/wolflor/*`, eventualno `lib/data/*`)
- rezultat gate komandi

## 5) Rollback matrica

| Incident | Kako detektuješ | Odmah uradi | Zatvaranje incidenta |
|---|---|---|---|
| Extractor runtime crash / parcijalni JSON | Skripta puca, JSON ostane polu-upisan | Vrati pogođeni fajl iz `HEAD` (`git restore --source=HEAD -- <fajl>`) i ne nastavljaj sledeći extractor | Otvori bug issue za skriptu sa stack trace-om i payload URL-om |
| Supplier payload je validan ali semantički loš (pogrešni opisi/dokumenti) | Audit prolazi delimično, ali spot-check otkrije regressiju | Revertuj samo pogođene data fajlove na poslednji dobar commit (`git restore --source=<good-sha> -- public/data/...`) | Dokumentuj supplier mismatch i dodaj guard/fix u extractor |
| Supabase upload dao loše slike / stale cache | Vizuelni QA vidi stare ili pogrešne assete | Ponovi extractor sa ciljanim `--force-upload` i version bump URL-ova | Potvrdi finalne javne URL-ove + dimenzije u komentaru |
| `audit-catalog-quality` daje actionable high/medium | `output/catalog-quality-audit.json` ima actionable nalaze | STOP release; rollback pogođene izmene ili patch extractor pre commit-a | Ponovo pokreni audit do `high=0, medium=0` |
| Posle deploy-a produkcija regresira | User report / monitoring posle merge-a | Hitan `git revert <refresh-commit>` i redeploy | Root cause + follow-up fix issue sa owner-om i ETA |

## 6) Handoff notes (Data Automation Engineer)

Budući owner mora da preuzme sledeći minimum:

1. Nedeljni refresh cadence (ili ad-hoc kad supplier objavi nove kolekcije).
2. Održavanje ovog runbook-a kada se doda/ukloni extractor.
3. Obavezno ažuriranje `AGENTS.md` + `.agent/workflows/podovi-architecture.md` u istom commit-u kada se menja extractor contract.
4. Incident postmortem disciplina: svaki rollback mora imati issue komentar sa uzrokom, opsegom i finalnim statusom.

## SCHÖNOX — evropski/globalni katalog (22.10.2026)

`node tools/extract_schonox_catalog.js` čita zvanične Sika ulaze `floor-range`,
`tile-range` i `marine-range`, uključujući pomoćni pribor. Provera od 22.10.2026.
obuhvata 26 kategorijskih stranica, 157 linkovanih proizvodnih stranica i četiri
inline unosa pribora: nakon 26 duplikata ostaje 135 proizvoda. Marine kategorija
`parquet-adhesives` je prazna na zvaničnom izvoru i ima eksplicitan status.
Američke formulacije ne mešati sa evropskim/globalnim programom.

- `--discover` zapisuje izvore u `output/schonox/source.json`, bez zamene kataloga.
- `--refresh` ponovo preuzima i stranice i assete, uključujući postojeće fajlove.
  PDF mora imati ispravan potpis i bar jednu stranicu; `pdf-parse` mora uspešno
  pročitati sadržaj svake stranice (`getTextContent`), uz rok od 20 sekundi.
  Broje se samo uspešno pročitane stranice, jer parser može prećutati grešku
  pojedinačne stranice. Slike se u celosti dekodiraju i proverava se format.
  Tek zatim atomska zamena ažurira lokalni keš; neispravno osvežavanje čuva
  stari fajl i njegov zapis provere.
  Bez flag-a koristi provereni staging keš. `--from-source` gradi iz pregledanog
  `output/schonox/source.json`; u kombinaciji sa `--refresh` ponovo preuzima assete.
  Datumi provere stranica i asseta ostaju odvojeni od vremena gradnje; ponavljanje
  iz keša ne sme da tvrdi da je izvor upravo ponovo proveren.
- `tools/schonox-copy.json` sadrži kratke srpske opise, a
  `tools/schonox-details.json` detaljne opise sa primenom i uslovima. Svih 135
  ključeva mora biti pregledano; 120 proizvoda ima neprazan duži zvanični opis.
  Nepoznat proizvod bez oba prevoda zaustavlja uvoz.
- Manifest `docs/products/schonox-source-manifest.json` beleži sve kategorije,
  proizvode, alias URL-ove, izvornu specifikaciju/pakovanje, dokument verzije,
  heševe lokalnih datoteka, neuspehe i izuzetke. Neuspeh preuzimanja ne sme tiho
  zameniti postojeći katalog delimičnim.
- Pre preuzimanja proverava se exact-product zapis u `../media-library`.
  Zvanični Dynamic Media zahtev traži 1600 × 1600 bez `smartcrop`; slabiji ili
  nedostupan rezultat ne zamenjuje bolji postojeći master. Trenutno je 133
  originalnih providnih PNG fotografija 1600 × 1600, dok su ANMACHEIMER i
  WASSEREIMER dostupni samo kao JPEG 300 × 400; ne povećavati ih veštački.
  Sve fotografije pregledati u contact-sheet prikazu pre predaje.
- Slike/PDF-ovi se keširaju u `output/schonox/assets` i objavljuju isključivo
  pod putanjom sa punim SHA-256 sadržaja u postojećim Supabase bucket-ima
  `product-images/schonox/` i `product-documents/schonox/`. Upload je bez upsert-a,
  a javno čitanje mora potvrditi isti hash. Jednaka veličina nije dokaz jednakog
  sadržaja. Stari objekti se čuvaju za rollback i prethodno sačuvane prikaze.
  Nove mastere registrovati u `../media-library/catalog.json`, `CATALOG.md` i
  media-use lokalni/globalni ledger; istorijski KH/RM/ZM zapisi ostaju sačuvani.
  Nema hotlinkova ni SCHÖNOX slika/PDF-ova u `public/`.
- HS 8 DoP izvor ranije je vraćao Office ZIP sadržaj iako se zvao `.pdf`, a pri
  proveri 22.10.2026. vraća HTTP 404/HTML; ostaje izuzet. Q9 W marine deklaracija koja je
  identična Q6 dokumentu takođe ostaje izuzeta. Sedam proizvoda nema dokumente,
  a 28 nema priložen tehnički list (`product_data_sheet`); SDS/sertifikat nije PDS.
  Opis samo uz stvarni PDS upućuje na priloženi tehnički list, inače traži da ga
  kupac zatraži od prodaje. Ove izuzetke proveriti pri narednom osvežavanju.
- Korekcije izvora: FPL PLUS 3–50 mm bez agregata / 10–60 mm sa agregatom; D
  8/15/21/35/65 su zidne manžetne. GEA tabela ne sme da preuzme tuđi QUARZSAND
  red 488270 / 25 kg. 2K PU SOLID ima neusaglašeno 4,5/5 kg, a 1K DS Premium
  28/18 kg i nesaglasne podatke mešanja/klase; aktuelno pakovanje i tehnički
  dokument potvrđuje prodaja. Ne birati stari PDF kao komercijalnu istinu.
- Svi proizvodi su `availability: on_request`, `inStock: false`. Regionalno
  pakovanje proizvođača ne predstavlja potvrđenu jedinicu konkretne isporuke.
  Cena se izostavlja do potvrđenog cenovnika; nula nije
  zamena za nepoznatu cenu. Refresh čuva postojeće pozitivne lokalne cene i
  njihove jedinice i nikada ih ne preuzima sa sajta proizvođača. Uvoz cenovnika
  mora zasebno proveriti šifru, pakovanje, jedinicu, PDV i datum primene.
- Flat loader `lib/data/schonox-products.ts` dodaje se postojećem Pribor toku;
  ne uvodi boje niti automatske količine pakovanja. Brend je `17`, kategorija
  `15`; homepage tipovi nastaju iz stvarnog skupa, uz dodatni Program filter.

Pre predaje pokrenuti `node tools/extract_schonox_catalog.js --self-test` (parser,
AVIF → PNG, odbijanje nepotpune slike i PDF-a uprkos validnom zaglavlju,
validan PDF, hash putanje, same-size refresh i očuvanje dobrog keša i zapisa
provere pri grešci) i
`npx vitest run --config vitest.contract.config.ts tests/contracts/schonox-catalog-contract.test.ts --maxWorkers=1 --no-file-parallelism`,
zatim zajedničke lint/build provere. Pri rollback-u vratiti dataset, oba copy fajla i
manifest iz istog pregledanog stanja; ne brisati prethodne slike/PDF-ove dok se
ne potvrdi da nijedan aktivni zapis na njih ne upućuje. Uvoz sam ne objavljuje
sajt i ne menja Supabase tabele; upload dodaje nove Storage objekte.

