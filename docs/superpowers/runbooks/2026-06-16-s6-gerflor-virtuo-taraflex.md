# S6 — Gerflor Virtuo (LVT) + Taraflex (sport) ingest (2026-06-16)

**Cilj:** Dodati Gerflor Virtuo LVT (kat. 6) + Taraflex sport (kat. 10) program, sve slike/PDF self-hostovano na Supabase.

> **Ispravka brifa:** Virtuo i Taraflex su **Gerflor** brendovi (NE Tarkett) — izvor `gerflor-cee.com`, alat = Gerflor stack (`gerflor-parse.js` + `ingest-core.js`). Gerflor blokira headless Playwright/WebFetch (403), ali `core.fetchPage()` prolazi.

## Rezultat
- **Virtuo (LVT, kat 6): 6 kolekcija / 133 boje** — virtuo-30, virtuo-30-rigid-acoustic, virtuo-55, virtuo-55-herringbone, virtuo-55-rigid-acoustic, virtuo-55-rigid-acoustic-herringbone. → `lvt_colors_complete.json` (flat, `collection` BEZ gerflor- prefiksa; auto-derive preko `getGerflorLVTCollections()`).
- **Taraflex (sport, kat 10): 9 kolekcija / 179 boja** — comfort-2, evolution-2 (+drytex +sl), multi-use-62, performance-2 (+drytex +sl), surface-2. → `sport_colors.json` (nested) + **9 ručnih `createCollectionProduct` unosa** u `lib/data/manual-collection-products.ts` (slug `gerflor-taraflex-*`).
- Sve slike (boje + ambijent) + PDF na Supabase (`product-images/products/{lvt,sport}/gerflor-<slug>/...`). **0 asset hotlinkova** (jedini `cdn/gerflor-cee` ostatak je `url` provenance polje kolekcije, kao kod svih kolekcija).
- Alat: `tools/ingest_gerflor_s6.js` (eksplicitna lista kolekcija, worker-pool 8 + `withTimeout(120s)` po asset-u, manifest resume, dry-run, idempotentan upis po slug-u).

## Tooling fit — bez prepare-colors izmena
- **Virtuo kat-6**: postojeća `prepare-colors.ts` gerflor-LVT grana (~249) i `getGerflorLVTCollections()` pokrivaju (slug `gerflor-virtuo-*` auto-derived). 
- **Taraflex kat-10**: postojeća sport grana (~336) matchuje `sportColors` (= sport_colors.json ∪ tarkett_sport_colors.json) — `taraflex-*` slug se poklopi. Ručni product daje PDP shell; `collection_image_url` auto-resolve iz JSON-a.

## Zamke (rešene)
- **TS build pukao** posle ingesta: Virtuo color objektima su falila polja `dimension/format/overall_thickness` koja `creation-*` boje imaju → `colors[]` postao heterogena unija → `lvtColorsData as {colors?: ColorFromJSON[]}` (color-helpers:36) odbijen ("neither type sufficiently overlaps"). **Fix (oba):** (1) skripta sad emituje ta 3 polja (derivirano iz spec tabele, fallback null) da oblik poklopi; (2) cast u color-helpers prebačen na `as unknown as` (robusno na buduće drift-ove JSON podataka). **Lekcija: novi flat-color izvor MORA tačno poklopiti ključeve postojećih boja u istom JSON-u, inače TS cast nad importom puca.**
- Vizuelna provera OBAVEZNA (Playwright) — build+contract prolaze i kad bi PDP imao 0 boja (lekcija iz S7); ovde potvrđeno 31/20 boja renderovano.

## Verifikacija (zeleno)
- `npm run test:contract` 206/206, `npm run build` 24/24.
- PDP `gerflor-virtuo-55`: 31 boja (1 upstream swatch pao od 32), pune spec/dok. PDP `gerflor-taraflex-evolution-2`: 20 boja, spec/dok, „Slični proizvodi" meša Taraflex+Omnisports.

## Otvoreno / follow-up
- **Oversized PDF** (`brosura-36911.pdf`, deljena Virtuo brošura) preskočen — prelazi Supabase „Upload file size limit" (isti blok kao 8 Tarkett oversized; čeka da vlasnik digne limit u dashboard-u pa re-run).
- **Engleski opisi** na Taraflex/Virtuo PDP-u (iz Gerflor izvora, kao postojeći Gerflor vinil) — kozmetička dorada (prevod), ne blokira.
- **Preskočeno (mogući kasniji segment):** 4 my-taraflex landing, 10 subflex podloge, 6 single-color specijalnih/portabilnih sistema (table-tennis/badminton/bateco/isolsport).
