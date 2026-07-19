# S7 — Tarkett linoleum (xf²) ingest + integracija (2026-06-16)

**Cilj:** Dodati Tarkett linoleum (xf²) program u katalog (kategorija 7), sve slike/PDF self-hostovano na Supabase, vidljivo na kategoriji i PDP-u.

## Rezultat
- **23 kolekcije, 501 boja, 581 dokument** — Veneto / Etrusco / Style Emme / Style Elle / Originale / Trentino / LinoMarine familije (2.0/2.5/3.2mm, Bfl, Silencio, Acoustic Cork, Sicuro, Essenza).
- Sve slike `/XXL/` (1920px) + PDF (`/docs/`) na Supabase (`product-images/products/linoleum/...`, `product-documents/products/linoleum/...`). **0 hotlinkova, 0 ne-Supabase asseta** (data-contract test pokriva novi JSON).
- LinoWall (C000833) namerno isključen — zidna obloga, ne pod.

## Tok izvođenja
1. **Recon** (`tmp/s7-linoleum-recon.md`): kategorija `https://www.tarkett.rs/sr_RS/kategorija-rs_C01010-linoleum`; oblik = homogeni vinil (hex popunjen). 24 kolekcije dumpovane sa `tools/extract_tarkett_core.js`.
2. **Parser fix** (`tools/lib/tarkett-parse.js`): `encodeAssetPath()` u `mediaImageUrl`/`mediaDocUrl` — `²` (U+00B2) u imenu PDF-a daje HTTP 400 sirovo, 200 kao `%C2%B2`. Idempotentno, no-op za obične nazive (S3 asseti netaknuti).
3. **Ingest** (`tools/ingest_tarkett.js`): dodato 23 `LINOLEUM_COLLECTIONS` (`kind:'homogeneous'`, `categoryId:'7'`, `targetJson:'tarkett_linoleum_colors.json'`); per-boja petlja paralelizovana (worker-pool 8 + tvrdi `core.withTimeout(120s)` po swatch-u — lekcija iz S4); multi-target write (`homoDataByFile` mapa). Run: `node tools/ingest_tarkett.js --skip-existing` (preskače 4 S3 vinil kolekcije, obrađuje samo linoleum). ~501 boja za par minuta, bez zastoja.
4. **Loader/wiring**:
   - `productDataLoader.ts`: `getTarkettLinoleumCollections()` (categoryId 7) + uvezeno u `getProductsByCategory('7')`, `getProductBySlug`.
   - `product-repository.ts`: kat-7 merge spaja Gerflor DLW **+** Tarkett linoleum (oba JSON-only, nijedan u Supabase DB); import + mock dodati.
   - `color-helpers.ts`: `tarkettLinoleumCollections` nested izvor.
   - `prepare-colors.ts`: kat-7 Tarkett grana (pre Gerflor) → `mapNestedCollectionColors(..., {categoryId:'7'})` daje **customColors** (SSR boje na PDP-u, kao vinil/iQ Motion).
   - `get-colors.ts`: linoleum **ostaje flat** (Gerflor DLW iz Supabase); Tarkett dodat kao flat append (isto kao `lvt`/`tarkettLvtData`) → API vraća oba (203 DLW + 501 Tarkett).

## Ključne lekcije / zamke
- **PDP boje ne idu kroz nested API za linoleum.** ColorGrid `isLinoleum` heuristika je `normalizedSlug.startsWith('dlw-')` (samo Gerflor) → Tarkett slug pada na `lvt` kategoriju → 0 boja. Ispravan put: `prepareCustomColors` (server) daje boje za sve Tarkett/Gerflor linoleum kolekcije; ColorGrid koristi `customColors` i ne fetuje. **Svaki novi JSON-only brend u postojećoj kategoriji mora dobiti granu u `prepare-colors.ts`, ne samo loader.**
- **Ne dodavati linoleum u `nestedCollectionsMap` (get-colors).** To bi izbacilo Gerflor DLW (Supabase flat) iz `/api/colors?category=linoleum`. JSON-only Tarkett ide kao flat append (kao lvt).
- Verifikacija MORA biti vizuelna (Playwright screenshot PDP-a) — build+contract su prolazili dok je PDP imao 0 boja.

## Verifikacija (sve zeleno)
- `npm run test:contract` 206/206 (uklj. hotlink-skener nad novim JSON-om), `npm run build` 24/24.
- `/kategorije/linoleum`: 23 Tarkett + 15 Gerflor DLW kartica.
- PDP `tarkett-veneto-xf2-2-5-mm`: 41 boja u color-gridu, pune srpske specifikacije, 28 dok, 0 hotlinkova (Playwright potvrdio).
- Gerflor DLW PDP (`dlw-marmorette-2-mm`): bez regresije (9 boja).
- `/api/colors?category=linoleum`: 203 Gerflor DLW + 501 Tarkett.

## Otvoreno
- Neki naslovi dokumenata generički ("Sertifikat"/"Brošura") — kozmetička dorada `DOCUMENT_ROLE_SR`, ne blokira.
