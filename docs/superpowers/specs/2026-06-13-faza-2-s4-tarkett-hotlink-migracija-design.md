# Faza 2 — S4: Migracija Tarkett hotlinkova u Supabase

> Datum: 2026-06-13
> Status: dizajn odobren u brainstormingu sa vlasnikom
> Prethodi: S2 (Gerflor vinil), S3 (4 nove Tarkett kolekcije) na produkciji
> Direktiva: „mi preuzimamo sve i stavljamo u našu bazu, ne zavisimo od drugih"

## 1. Kontekst i problem

Posle S2/S3, sve NOVE kolekcije su self-hostovane, ali **postojeće Tarkett kolekcije i dalje hotlinkuju** sa `media.tarkett-image.com`. Inventar (provereno 2026-06-13):

- **16.835 pojava** `media.tarkett-image.com` u `public/data/*.json`, ali samo **2.844 jedinstvenih asseta** (ostalo su ponavljanja iste slike/dokumenta kroz stavke).
  - **1.582 jedinstvene slike** (`/large/` 960px + 25× `/medium/`).
  - **1.250 jedinstvenih PDF-ova** (`/docs/`).
  - (~12 ostalih).
- Pojave po fajlu: `tarkett_lvt_products.json` 13.723 (najviše), `tarkett_homogeneous_vinyl_colors.json` 945, `tarkett_vinyl_home_colors.json` 886, `tarkett_heterogeneous_vinyl_colors.json` 578, `tarkett_sport_colors.json` 452, `tarkett_documents_index.json` 130, `tarkett_wood_collection_index.json` 116, `tarkett_lajsne_variants.json` 5.

Rizik hotlinkova: ako Tarkett ukloni/promeni sliku, naša stranica puca; i krši direktivu „ne zavisimo od drugih".

## 2. Infrastruktura (provereno 2026-06-13)

- Supabase org `neodswoshmnehhfmjczi` plan = **`pro`** → **100GB storage** (nema problema sa kvotom za ceo S4) i mogućnost dizanja upload limita do 50GB.
- Globalni „Upload file size limit" trenutno = **50 MiB (52,4 MB)** (potvrđeno: `updateBucket(51MB)` OK, `55MB`/`60MB`/`150MB` „exceeded maximum allowed size"). Diže se u Supabase dashboard-u (Settings → Storage) — Pro dozvoljava; ne može preko service-role ključa (ni preko dostupnog MCP-a).
- Bucket-i `product-images` i `product-documents` postoje (iz S2), `file_size_limit` = null (globalni važi), public.

## 3. Donete odluke (brainstorming)

| Pitanje | Izbor |
|---|---|
| Obim | Sve postojeće Tarkett hotlinkove (slike + PDF) u Supabase |
| Kvalitet slike | **Podići na `/XXL/` (1920px)** umesto `/large/` (960px); fallback na `/large/` ako XXL → 404. Usput popravlja kvalitet svih starih slika. |
| PDF | Migrirati sve (`/docs/`). Pro storage to nosi. |
| Predimenzionirani PDF (>50 MiB) | Ne preskakati trajno: logovati; vlasnik digne globalni limit u dashboard-u (30 sek), pa se uploaduju full-kvalitet. NE blokira ostatak migracije. |
| „Taj" ModularT install-PDF (52,7MB, u S3 preskočen, nije ni hotlink) | Re-uploaduje se zajedno sa predimenzioniranim, posle dizanja limita. |
| Tempo | Fazno po fajlu, LVT prvi (najveći); resumable. |

## 4. Arhitektura

Generički „rewrite" alat — odvojen od ingest-a (ne pravi nove kolekcije, već premešta postojeće assete).

- **Reuse `tools/lib/ingest-core.js`** (netaknut): `downloadAsset`, `uploadToBucket`, `withTimeout`, `loadManifest`, `writeJsonWithBackup`, `getSupabase`, `slugify`, `cacheBustStamp`.
- **Novo `tools/migrate_tarkett_hotlinks.js`** — orkestracija:
  1. Za zadati JSON fajl (ili sve), nađe sve `https://media.tarkett-image.com/...` URL-ove (regex), normalizuje (skine `?query`), **dedupe** u skup jedinstvenih.
  2. Za svaki jedinstveni asset (manifest preskače već urađene):
     - **Slika** (`/large/` ili `/medium/`, ekstenzija slike): preuzmi **`/XXL/` varijantu** (zameni size segment); ako XXL → 404/greška, fallback na original `/large/`. Validiraj `sharp` (min širina). Upload u `product-images/products/tarkett-migrated/<slug-iz-imena-fajla>.jpg`.
     - **PDF** (`/docs/`): preuzmi; ako `%PDF` i ≤ limit → upload u `product-documents/products/tarkett-migrated/<slug>.pdf`. Ako > limita → zapiši u `oversized` listu (ne ruši run), zadrži hotlink za sad.
     - Upiši `origUrl → supabaseUrl` u mapu + manifest.
  3. Posle svih asseta: **prepiši SVE pojave** u JSON-u kroz mapu (svaki `origUrl` → `supabaseUrl`; oversized ostaju kako jesu). `writeJsonWithBackup`.
  4. Flagovi `--file=<ime>`, `--dry-run`, `--skip-existing`; manifest `output/migrate-tarkett-manifest.json`.
  5. Predimenzionirani/neuspeli asseti se upisuju u `public/data/tarkett-migration-pending.json` (lista izvornih URL-ova + razlog) — taj fajl je „dozvoljeni izuzetak" za contract test; prazni se kad se posle dizanja limita uspešno uploaduju.
- **Naslovi/putanje**: asset ime iz poslednjeg segmenta izvornog URL-a (slugify), pod `products/tarkett-migrated/` (ne diramo postojeću kolekciju-strukturu; samo zamena URL-a u JSON-u). Dedup po izvornom URL-u → po jedan upload.

## 5. Data flow

1. Migracija (offline, `node tools/migrate_tarkett_hotlinks.js`) prepisuje `public/data/*.json`: `media.tarkett-image.com/...` → `nnjmrfwepylrheykalik.supabase.co/.../product-images|documents/...`.
2. Loaderi (`productDataLoader.ts`, `get-colors.ts`) čitaju iste JSON-ove → sada serviraju Supabase URL-ove. **Bez izmena loadera** (samo se menja vrednost URL-a u podacima).
3. Stranice/`/cenovnik` rade isto, slike sa Supabase (bolji kvalitet — XXL).

## 6. Error handling

- XXL 404 → fallback `/large/`; ako i to padne → loguj, zadrži hotlink (ne prepisuj tu pojavu).
- PDF > limita → `oversized` lista, zadrži hotlink.
- Ne-`%PDF` / ne-slika sadržaj → preskoči, loguj.
- Tvrdi `withTimeout` (fetch 35s, sharp 20s, upload 60s) — bez visenja (S2 lekcija).
- Manifest resume + per-asset try/catch — jedan loš asset ne ruši run.

## 7. Verifikacija (gate)

1. Novi contract test `tests/contracts/tarkett-hotlinks-migrated-contract.test.ts`: u `public/data/*.json` **nema** `media.tarkett-image.com` URL-ova OSIM onih izričito izlistanih u `public/data/tarkett-migration-pending.json` (oversized/neuspeli). Test učita pending listu i dozvoli tačno te; sve ostalo mora biti Supabase. Kad je pending prazan → nula hotlinkova.
2. `npm run test:contract` + `npm run build` zeleno.
3. `npx tsx scripts/audit-catalog-quality.ts` — bez novih grešaka.
4. Vizuelno: par postojećih Tarkett PDP (npr. iD Inspiration, iQ Granit) — slike sa Supabase, oštrije (XXL).
5. **Oversized follow-up**: izlistati predimenzionirane PDF-ove + tačne korake (dashboard limit); posle dizanja, re-run uploaduje njih + ModularT install-PDF; tada contract test traži NULA PDF hotlinkova.

## 8. Šta NIJE u obimu

- Promena strukture postojećih kolekcija (samo zamena URL vrednosti).
- Re-organizacija Supabase putanja postojećih S2/S3 asseta.
- Gerflor/ostali hotlinkovi (nema ih — Gerflor je self-hostovan u S2; provera u planu).
- Dizanje globalnog upload limita (vlasnik, dashboard) — van koda.

## 9. Rizici i ublažavanje

- **XXL ne postoji za neke stare slike** → fallback `/large/` (ista rezolucija kao sad, i dalje self-host). Pilot na LVT fajlu otkriva stopu fallback-a.
- **Veliki broj asseta (2.844)** → ~1.5–2h; manifest resume; aktivni monitoring (S2/S3 obrazac).
- **Predimenzionirani PDF** → ne blokira (oversized lista); reši se dizanjem limita.
- **Pogrešna zamena URL-a** (delimično poklapanje) → zamena po PUNOM URL-u iz mape (ne substring delova); contract test hvata zaostatke.
- **Supabase kvota** → Pro 100GB, dovoljno.
