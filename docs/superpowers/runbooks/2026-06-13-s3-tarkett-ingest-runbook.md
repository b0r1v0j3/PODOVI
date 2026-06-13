# Runbook — S3 Tarkett ingest

> Datum: 2026-06-13. Prati: `docs/superpowers/plans/2026-06-13-faza-2-s3-tarkett-ingest.md`.
> Alat: `tools/ingest_tarkett.js` (orkestracija) + `tools/lib/tarkett-parse.js` (čiste funkcije) + `tools/lib/ingest-core.js` (reuse iz S2).

## Šta radi

Preuzima Tarkett kolekcije sa `tarkett.rs` (Playwright čita `window.__NUXT__`), normalizuje, i **uploaduje SVE assete (slike + PDF) u našu Supabase bazu** (bez hotlinkova), pa upiše zapis u ciljni JSON. Konfiguracija 4 kolekcije je u `COLLECTIONS` na vrhu `tools/ingest_tarkett.js`.

| Kolekcija (key) | kind | ciljni JSON |
|---|---|---|
| `iq-motion` | homogeneous | `public/data/tarkett_homogeneous_vinyl_colors.json` (`collections[]`, replace-by-slug) |
| `deal-spc-30`, `real-spc-50`, `modulart-70` | lvt | `public/data/tarkett_lvt_products.json` (flat niz, filter-by-collection) |

## Pokretanje

```bash
# Preduslov: .env.local sa NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY.
# Provera env-a:
node -e "const c=require('./tools/lib/ingest-core.js'); c.loadLocalEnvFile(); console.log('URL', !!process.env.NEXT_PUBLIC_SUPABASE_URL, 'KEY', !!process.env.SUPABASE_SERVICE_ROLE_KEY)"

node tools/ingest_tarkett.js --dry-run                 # mreža, BEZ uploada — proveri brojeve (16/2/6/16)
node tools/ingest_tarkett.js --collection=iq-motion    # pun ingest jedne kolekcije (real upload)
node tools/ingest_tarkett.js --collection=deal-spc-30 --collection=real-spc-50 --collection=modulart-70
node tools/ingest_tarkett.js                           # sve 4
node tools/ingest_tarkett.js --skip-existing           # preskoči kolekcije već 'ok' u manifestu
```

Flagovi: `--dry-run` (bez upisa/uploada), `--collection=<key>` (može više puta), `--skip-existing` (preskoči gotove kolekcije po manifestu).

## Resume

- Manifest: `output/ingest-tarkett-manifest.json`. Po asset-u ključevi `doc:<url>`, `scene:<url>`, `swatch:<url>` → ponovno pokretanje **preskače već uploadovano** (ne preuzima ponovo). `collection:<key>` čuva `{status:'ok'|'error'}`.
- Prekinut run? Samo ponovo pokreni istu komandu — keširani asseti se preskaču, regeneriše se samo ostatak + JSON zapis.
- Izmenio parser (npr. naslove/labele)? Ponovni run je **jeftin**: asseti keširani, samo se JSON regeneriše sa novim poljima.

## Rollback

- `writeJsonWithBackup` pravi backup u `output/tarkett-*-backup-<timestamp>.json` PRE svakog upisa.
- Vrati: kopiraj backup preko ciljnog JSON-a, ili `git checkout -- public/data/tarkett_*.json`.
- Uploadovani Supabase asseti ostaju (bezopasno; prepisuju se pri sledećem runu po istoj putanji).

## Dodavanje nove kolekcije

1. Nađi URL: `https://www.tarkett.rs/sr_RS/kolekcija-CXXXXXX-<slug>`. **Sitemap je nepotpun/zastareo** — kolekcije traži preko kategorijske stranice (`kategorija-rs_CXXXXX-...`, DOM scrape `a[href*="kolekcija-"]`). Probni `kolekcija-CXXXXX-x` → 302 na pravi slug ako postoji, 404 ako ne.
2. Dodaj red u `COLLECTIONS` (`tools/ingest_tarkett.js`): `{ key, kind: 'homogeneous'|'lvt', type (za lvt: 'SPC'|'LVT'), collectionId, slug, categorySlug: 'vinil'|'lvt', url }`. Homogeni slug ima `tarkett-` prefiks; LVT bez prefiksa.
3. `node tools/ingest_tarkett.js --dry-run --collection=<key>` pa pun run.
4. Dopuni `tests/contracts/tarkett-new-collections-contract.test.ts` (NEW_HOMO ili NEW_LVT).

## Upozorenja / lekcije

- **Slike samo `/XXL/`** (1920px, maks). `XXXL`/`original` → 403. `large`/`XL` = 960px (grid fallback).
- **PDF samo `/docs/`** (`media.tarkett-image.com/docs/<file>`). `/large/`, `/documents/`, `/pdf/` za PDF → 403.
- **Playwright obavezan** za `__NUXT__` (Nuxt 2 SSR). Chromium već instaliran. `kategorija-*` stranice ne izlažu `__NUXT__` — DOM scrape za otkrivanje, `kolekcija-*` za sadržaj.
- **Tvrdi timeout-i** (ingest-core): fetch/telo 35s, sharp 20s, upload 60s — sprečavaju visenja (S2 lekcija: `AbortSignal` sam ne prekida zastale socket-e). Svaki asset je u try/catch → jedan loš asset se preskoči, run se ne ruši.
- **Supabase limit veličine fajla**: predimenzioniran PDF (npr. ModularT install ~>limit) baci „object exceeded the maximum allowed size" → taj dokument se preskoči (loguje `⚠️`), ostali prolaze. Bez hotlink curenja.
- **Naslovi dokumenata**: `document_role_translated` (srpski sa Tarketa) → fallback `DOCUMENT_ROLE_SR[role]` → fallback `mapDocumentTitle(ime fajla)`. Dedupe **po izvornom URL-u** (ne po naslovu) — dva različita PDF-a sa istom rolom (npr. dva „Uputstvo za instalaciju") oba preživljavaju.
- **Stari `modulart-7` (40)** ostaje netaknut (migracija postojećih hotlinkova = S4). Novi je `modulart-70`.

## /cenovnik

Nove kolekcije se auto-pojave: homogeni vinil preko nested `vinil` grane, LVT/SPC preko `tarkettLvtData` dodatka u flat `lvt` grani (`lib/colors/get-colors.ts`), grupisano pod brendom **Tarkett (3)**. Provereno za sve 4.
NB: šira /cenovnik rupa (BLOQ/Romus/Techem/TimberTech/laminat fale jer im JSON loaderi nisu povezani u `get-colors.ts`) je zaseban segment — vidi memoriju `podovi-cenovnik-kompletnost`.
