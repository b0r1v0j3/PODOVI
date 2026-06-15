# Runbook — S4 migracija Tarkett hotlinkova

> Datum: 2026-06-13 (izvršeno 2026-06-15). Prati: `docs/superpowers/plans/2026-06-13-faza-2-s4-tarkett-hotlink-migracija.md`.
> Alat: `tools/migrate_tarkett_hotlinks.js` + `tools/lib/hotlink-migrate.js` + `tools/remove_broken_tarkett_docs.js` (reuse `ingest-core`).

## Šta je urađeno

Premešteni svi važeći Tarkett hotlinkovi iz `public/data/*.json` u Supabase: **2.221 asseta** (slike na **`/XXL/` 1920px**, PDF na `/docs/`). **20.830 Supabase URL-ova** u podacima. Uklonjeno **616 polomljenih generisanih doc-referenci** (vidi dole). Preostalo **15 pending** (8 oversized + 7 upstream-403). Svi preostali hotlinkovi su izlistani u `public/data/tarkett-migration-pending.json`.

## Pokretanje

```bash
# Preduslov: .env.local (URL + SERVICE_ROLE_KEY). Supabase plan = Pro (100GB).
node tools/migrate_tarkett_hotlinks.js --dry-run                          # samo brojevi (bez mreže)
node tools/migrate_tarkett_hotlinks.js --file=tarkett_lvt_products.json   # jedan fajl
node tools/migrate_tarkett_hotlinks.js                                    # svi (manifest preskače gotovo)
```
**Paralelno:** orkestrator radi `CONCURRENCY=8` radnika iz zajedničkog reda (mrežno-vezan posao). Sekvencijalno je trajalo sat-dva; paralelno ~10-15 min.

## Resume

- Manifest `output/migrate-tarkett-manifest.json` (ključ `asset:<clean-url>`) → preskače uploadovano, snima na svakih 25 uspeha.
- Prekinut? Ponovo pokreni istu komandu — keširani asseti se preskaču.

## Rollback

- `writeJsonWithBackup` pravi backup `output/*-backup-<ts>.json` PRE upisa. Vrati: `git checkout -- public/data/tarkett_*.json` ili kopiraj backup.

## Generisani doc-endpoint-i (specifications / format-table)

- URL u podacima je `media.tarkett-image.com/docs/<locale>/pdf/.../specifications|format-table` — taj **403 (Akamai), već polomljen na sajtu**. Isti put na **`www.tarkett.rs` radi**: `specifications` → PDF (migrira se), `format-table` → JSON (nije dokument). `hm.fetchSourceUrl` rerutira fetch na tarkett.rs (rewrite ključ ostaje original media URL).
- Mnoge `specifications` na tarkett.rs vraćaju **ne-PDF/404** za pojedine kolekcije → ne mogu da se migriraju.
- **Uklanjanje polomljenih:** `node tools/remove_broken_tarkett_docs.js` — briše iz kataloga sve `/docs/<locale>/pdf/` doc-reference iz pending liste koje NISU oversized (format-table + ne-PDF/404 specifikacije). Čuva važeće dokumente (slike + ispravne PDF). Pokrenuto jednom; ako se pojave novi polomljeni, ponovi.

## Oversized PDF-ovi (follow-up za vlasnika)

8 PDF-ova > **50 MiB (52,4 MB)** ostalo u pending (Supabase globalni limit). Tačan plafon proveren preko `updateBucket` (≥51MB, <55MB). Kad ih želiš full-kvalitet:
1. Supabase dashboard → projekat `podovi` → **Settings → Storage → „Upload file size limit"** → npr. **100 MB** (Pro to dozvoljava; ja to NE mogu — nemam management token).
2. `node tools/migrate_tarkett_hotlinks.js` (re-run) — preuzme+uploaduje predimenzionirane, prepiše, isprazni ih iz pending.
3. „Taj" ModularT install-PDF (52,7MB) je među njima — biće rešen istim re-run-om.

## Lekcije (bitno)

- **Hang celog run-a:** zastao socket body-read može da prođe interne `withTimeout`-e iz ingest-core → run je dvaput zaglavio satima na jednom assetu. Fix: **tvrdi per-asset `core.withTimeout(..., 120000)`** u glavnoj petlji — nijedan asset ne blokira run (Promise.race vs setTimeout, event loop živ).
- **Zaostali node procesi:** posle ubijanja/prekida run-a, node child (worker) zna da preživi i drži proces živ uz retry. UVEK proveriti `Get-Process node` i pobiti pre re-runa (inače dvostruki run na istom manifestu).
- **Praćenje napretka:** bafer-ovani stdout (`node | tee`) kasni; **manifest mtime** (direktan `writeFileSync`) je pouzdan signal napretka — monitor njega.
- **Slike `/XXL/`** (1920px) — upgrade kvaliteta; `large-high`==`XXL`. Razmaci u URL-u (`IN_iD Tilt HIT.jpg`): `extractTarkettUrls` ih hvata cele, `encodeFetchUrl` percent-enkoduje za fetch, literal je rewrite ključ.
- **Kolizija storage putanje:** bez-ekstenzije dokumenti dele basename → `destPathFor` gradi jedinstven stem iz segmenata + `assertNoDestCollisions` ruši run pre upisa ako bi se sudarili.
