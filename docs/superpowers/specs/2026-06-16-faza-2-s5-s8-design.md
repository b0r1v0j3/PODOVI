# Faza 2 — S5 (Protivklizni vinil) + S8 (Desso tepih-ploče) — dizajn

Dogovoreno sa vlasnikom 2026-06-16 (kroz Q&A). Oba segmenta su **dodatak u postojeće
kategorije** — BEZ nove vidljive kategorije i BEZ novog brenda.

## S5 — Protivklizni / Sigurnosni vinil

**Odluka:** Safety podovi NISU posebna kategorija u meniju. Idu **u Vinil (kat 2)**,
interno tagirani kao „protivklizno", i izdvajaju se novim **filterom „Protivklizni/Sigurnosni"**
na Vinil stranici. (Vlasnik: „ne pravimo kategoriju koja se vidi kao posebna … stavljaš ih u vinil pa onaj filter".)

**Naziv filtera:** „Protivklizni/Sigurnosni" (tarkett.rs zvanično koristi „Protivklizni podovi";
vlasnik tražio kombinovano u filteru).

**Obim:** ceo opseg (~27 kolekcija / ~345 boja):
- Tarkett (tarkett.rs, `kategorija-rs_C01005-protivklizni-podovi`): Safetred Universal/Universal Plus/
  Ion Linen/Spectrum/Transport/Design Collection + Granit Safe.T + Primo Safe.T + ostatak familije.
  Oblik = **homogeni vinil** → reuse `ingest_tarkett.js` `kind:'homogeneous'` → `tarkett_homogeneous_vinyl_colors.json`.
- Gerflor Tarasafe (gerflor-cee): 7 kol/~55 boja, **heterogeni** → reuse `ingest_gerflor_cee.js` → `vinyl_colors_complete.json`.

**Tagiranje:** pri ingestu setovati `protivklizno: true` (ili spec `otpornost_na_klizanje` = R10/R11)
na svaku safety kolekciju. Filter bira samo te kolekcije.

**Wiring (filter, 3 fajla):**
- `components/ProductFilters.tsx` — checkbox „Protivklizni/Sigurnosni" u `{isVinilCategory}` bloku → `?safety=1`.
- `components/CategoryTabs.tsx` — `safetyOnly` prop → filtrira kolekcije/boje.
- `app/kategorije/[slug]/page.tsx` — `safety?` searchParam → prosledi `safetyOnly`.

**Bez novog ingest koda. PDP koristi postojeće cat-2 grane (prepare-colors, product-repository).**

## S8 — Desso tepih-ploče

**Odluka:** Desso ide **u Tekstilne ploče (kat 4)** pod **brendom Tarkett (id 3)** (koristimo
prepoznatljivost Tarkett-a — vlasnik). Ime svake kolekcije dobija **prefiks „Desso "** (npr.
„Desso AirMaster", „Desso Origin") da se sačuva premium identitet. BEZ novog brenda/kategorije.

**Obim:** SVE — **51 kolekcija / 634 pločice** (tarkett.rs `category-json/rs_C01018`). „mi preuzimamo sve".

**Izvor:** tarkett.rs `kolekcija-C00XXXX-<slug>` (isti `__NUXT__` extractor kao Tarkett vinil; radi).
Oblik podataka = superset BLOQ carpet oblika.

**Net-new kod (sve mirror BLOQ):**
- `tools/ingest_tarkett.js`: nova `kind:'carpet'` grana + 51-stavka config (categoryId '4', brandId '3', `DESSO-<slug>` SKU, naziv „Desso <Name>"). Worker-pool + withTimeout (kao S7).
- `public/data/desso_carpet_tiles.json` (kao bloq_carpet_tiles.json).
- `getAllDessoCarpetProducts()` u productDataLoader (klon `getAllBloqCarpetProducts`).
- `prepare-colors.ts` cat-4 `DESSO-` grana (klon BLOQ ~160).
- `product-repository.ts` cat-4 merge + `getJsonProductBySlug` aggregate.

**Verifikacija (oba):** test:contract + build zeleni; vizuelna provera (Playwright) — boje se renderuju;
0 hotlinkova (data-contract); deploy push na main.

## Redosled
S5 (manji, reuse) → deploy → S8 (634 pločice, najveći uvoz) → deploy. Svaki sa vlasničkim pregledom.
