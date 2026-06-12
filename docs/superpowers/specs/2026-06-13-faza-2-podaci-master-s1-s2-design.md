# Faza 2 — Obogaćivanje i kompletiranje kataloga (master roadmap + S1/S2)

> Datum: 2026-06-13
> Status: dizajn odobren u brainstormingu sa vlasnikom
> Prethodi: Faza 1 redizajn „Galerija" (na produkciji od 2026-06-12)

## 1. Kontekst i cilj

Firma drži **kompletan program Gerflor-a i Tarkett-a**. Provera stvarnog stanja (4 paralelna audita, 2026-06-13) pokazala je:

- Jezgro kataloga je dobro sinhronizovano (Gerflor heterogeni/homogeni/linoleum/ESD 100%; Tarkett parket/laminat/LVT/vinil/sport/lajsne ~100%).
- Gerflor vinil kolekcije NISU prazne (suprotno proceni iz Faze 1): 25 kolekcija, 701 boja, sve sa slikama/opisima/specifikacijama. `public/data/gerflor_collections_complete.json` je mrtav fajl (niko ga ne importuje).
- Stvarne praznine: (a) prezentacija — 0 PDF dokumenata i 0 room-scene fotografija kod Gerflor vinila, slike dekora ~400–600px iako proizvođač nudi 1500px; (b) pokrivenost — ~46 Gerflor podnih kolekcija (Virtuo, Tarasafe, Taraflex, R-Tile, zidovi) i ~236 Tarkett kolekcija (tekstil 132, linoleum 24, safety/ESD/mokri, pribor) ne postoji kod nas.

Cilj Faze 2: vremenom pokriti **ceo program oba proizvođača**, segment po segment, bez žurbe — uz potpunu nezavisnost od tuđe infrastrukture.

## 2. Direktive vlasnika

1. Radi se SVE, ali podeljeno u segmente; svaki segment je zaokružen (spec → plan → implementacija → verifikacija → deploy).
2. **Nijedan asset se ne linkuje sa sajta proizvođača**: sve slike i svi PDF-ovi se preuzimaju i čuvaju u našoj bazi (Supabase storage). Upstream URL sme da postoji samo kao metadata (`externalLink` ka STRANICI proizvođača, nikad ka fajlu).
3. To važi i retroaktivno: postojeći hotlinkovani asseti (npr. Tarkett `media.tarkett-image.com` slike i `/docs/` PDF-ovi) migriraju se u naš storage (segment S4).

## 3. Principi pipeline-a (zajednički za sve segmente)

- **Tok**: `tools/ingest_<izvor>.js` → JSON u `public/data/` → asseti u Supabase → validacija → build. Po uzoru na postojeći Wolflor tok (`--upload-supabase`, `?v=` cache-bust pri overwrite-u).
- **Storage**: slike → postojeći bucket `product-images` (struktura `products/<brend>/<kolekcija>/...`); PDF dokumenti → **novi bucket `product-documents`** (ista struktura). Javni read, upload kroz service key iz `.env.local`.
- **Idempotentnost**: ponovno pokretanje bezbedno; `--dry-run` ispisuje plan bez upisa; pre upisa JSON-a backup u `output/` (obrazac iz `sync-tarkett-supabase.ts`).
- **Manifest**: svaka ingest skripta vodi `output/ingest-<izvor>-manifest.json` (šta je preuzeto, odakle, kada, hash) — omogućava inkrementalno osvežavanje i reviziju.
- **Pristojan tempo**: 1–2 zahteva/s ka sajtovima proizvođača, retry sa backoff-om; download asseta sa CDN-a bez ograničenja (nemaju zaštitu).
- **Validacija po segmentu**: `npm run check:images`, `npx tsx scripts/audit-catalog-quality.ts`, `npm run test:contract`, `npm run build` — sve zeleno pre commita.
- **Cene**: novi proizvodi bez cene → „Cena na upit" (postojeći obrazac).
- **Kritični pipeline iz PROJECT_OPERATING.md se poštuje**: JSON → Product tip → resolver/prepare-colors → page/component → build/test; za nove kategorije ažurirati i `AGENTS.md` + arhitekturni workflow dokument.

## 4. Segmenti (redosled)

| # | Segment | Obim | Izvor |
|---|---|---|---|
| S1 | Infra: ingest okvir, `product-documents` bucket, obnova Tarkett extractor osnove | temelj | — |
| S2 | Gerflor vinil prezentacija: PDF + room-scene + 1500px slike, 25 kolekcija | ~700 boja | gerflor-cee.com |
| S3 | Brze pobede jezgra: iQ Motion, Deal SPC 30, Real SPC 50, ModularT 70 refresh, 6 Sommer + 1 Step XL parket dezena, novi Libertex/Initial dekori | ~12 stavki | tarkett.rs + gerflor-cee.com |
| S4 | Migracija postojećih upstream asseta u naš storage (Tarkett slike + PDF-ovi, ostali izvori po popisu) | veliki, mehanički | postojeći JSON-ovi |
| S5 | Safety (nova kategorija „Protivklizni"): Tarasafe (7) + Tarkett Safe.T (4) + mokri prostori (4) | 15 kolekcija | oba |
| S6 | Virtuo LVT (6) + Taraflex sport (16) | 22 | gerflor-cee.com |
| S7 | Tarkett linoleum xf² | 24 | tarkett.rs |
| S8 | Tekstil program (3 podsegmenta): Desso ploče (51) → tepisi (35) → rolne/tepisoni/iglani (46) | 132 | tarkett.rs |
| S9 | Ostalo: R-Tile/Design Tile (6), zidne obloge (36), lajsne C01034 (18), pribor/lepkovi/podloge/nega (~40), veštačka trava (10), Connor/Subflex (11), stepenice/tuš (8) | ~130 | oba |

Svaki segment od S3 nadalje dobija svoj kratak spec/plan pre rada; ovaj dokument detaljno definiše S1 i S2. Redosled S5–S9 se sme prekrojiti odlukom vlasnika između segmenata.

Posebne napomene za kasnije segmente:
- S4: posle migracije, `audit-catalog-quality` dobija proveru „nijedan asset URL van naših domena" (osim `externalLink`).
- S5: nova kategorija znači i unos u kategorije (lib/repositories/category-repository izvor), navigaciju, listing copy (`lib/seo/listing-page-copy.ts`) i sitemap — pratiti postojeći obrazac kategorija.
- S8: tekstil uvodi Desso brend — odluka o brend stranici pri specu segmenta.
- Provera `Mipolam Elegance` statusa (CEE je više ne lista) — uz S3.

## 5. S1 — Infra temelj

**5.1 `product-documents` bucket**: kreirati u Supabase (javni read). Konvencija putanja: `products/<brend>/<kolekcija-slug>/<dokument-slug>.pdf`.

**5.2 Zajednički ingest helper** (`tools/lib/ingest-core.js`, CommonJS kao postojeći tools): funkcije `fetchHtml(url, {headers})` (browser headeri za Akamai: realan Chrome UA + Accept + Accept-Language + sec-ch-ua* + Sec-Fetch-*; GET, nikad HEAD), `downloadAsset(url, tmpPath)` (retry/backoff), `uploadToSupabase(bucket, path, file, {cacheBust})`, `writeJsonWithBackup(path, data)` (backup u output/), `manifest` API, `politeQueue(rps)`. Bez novih npm zavisnosti ako je moguće (node fetch + postojeći @supabase/supabase-js).

**5.3 Obnova Tarkett extractor osnove**: rekonstruisati minimalni `tools/extract_tarkett_core.js` koji ume da pročita kolekciju sa tarkett.rs kroz `window.__NUXT__` / `json-collection-product` (referentni format postoji u `public/data/tarkett_*.json`; runbook: `.agent/workflows/extractor-refresh-rollback-runbook.md`). Obim S1: dovoljno za S3 potrebe (pojedinačne kolekcije), ne pun refresh svih kategorija. Playwright je već dev zavisnost u repou — koristi se gde `__NUXT__` zahteva render.

**5.4 Dokumentacija**: runbook ažurirati da pokazuje na nove alate; AGENTS.md beleška o ingest obrascu.

S1 ne menja ništa vidljivo na sajtu.

## 6. S2 — Gerflor vinil prezentacija

**6.1 Ingest skripta** `tools/ingest_gerflor_cee.js` (koristi ingest-core):

1. Učita `/sitemap.xml` (4.556 URL-ova; hostove `prod-peco.gerflor.io` zameniti sa `www.gerflor-cee.com`); filtrira na 25 ciljnih vinil kolekcija (12 Taralay/Nerok/Premium + 13 Mipolam, mapiranje slug→naša kolekcija u skripti).
2. Po kolekciji (1 GET): opis (strukturirane sekcije Construction/Design/Product/Installation/Market), spec tabela (`<td><strong>polje</strong></td><td>vrednost</td>`), PDF linkovi sa `cdn.gerflor.com/media/2/...` (pažnja: razmaci u imenima fajlova), ambijentalne fotke iz hero slidera (`cdn.gerflor.com/media/.../{id}.jpg`, 1500px, sufiks AMBIANCE).
3. Po boji (1 GET na stranicu varijacije, URL šablon `/products/{kolekcija}-{šifra}-{ime}-{sku}`): hero slika dekora 1500px.
4. Download svih asseta → upload: slike u `product-images` (`products/gerflor/<kolekcija>/...`), PDF-ovi u `product-documents`; postojeće lokalne slike u `public/images/products/vinyl/` se NE brišu (ostaju fallback) — JSON prelazi na Supabase URL-ove.
5. Upis u `public/data/vinyl_colors_complete.json` — nova/popunjena polja po kolekciji: `collection_image_url` (Supabase), `documents: [{title, url, type}]` (srpski naslovi: „Tehnički list", „Izjava o svojstvima (DoP)", „EPD", „Sertifikat — <ime>", „Uputstvo za ugradnju", „Uputstvo za održavanje", „Brošura"; mapiranje po imenu fajla, nepoznato → izvorno ime), `room_scene_images: [url]`; po boji: `image` → Supabase URL 1500px verzije.

PDF selekcija: sa ~25 PDF-ova po kolekciji uzimaju se svi tehnički relevantni (tehnički list, DoP, EPD, sertifikati, uputstva, brošura, garancija); duplikati po jeziku — prednost EN verziji ako postoji više.

**6.2 Loader izmene** (`lib/utils/productDataLoader.ts`, `getVinylCollectionProducts`):
- `collection_image_url` iz JSON-a postaje primaran; postojeći hardkod (`GERFLOR_VINYL_COLLECTION_COVER_SLUGS` + override mapa) ostaje samo kao fallback; dodati `taralay-millenium-acoustic` u set (poznata rupa).
- `documents` iz JSON-a se mapira u `Product.documents` (tip već postoji).
- `room_scene_images` se dodaju u `Product.images` POSLE dekor slika (alt: „<Kolekcija> — ambijent N"); galerija proizvoda ih prikazuje automatski (strelice/tačkice već postoje).

**6.3 UI**: bez strukturnih izmena — postojeća sekcija „Dokumentacija" i galerija rade nad novim podacima. Vizuelna provera na 2 kolekcije (jedna Taralay, jedna Mipolam).

**6.4 Definicija „gotovo" za S2**: svih 25 kolekcija ima ≥1 dokument, ≥2 room-scene slike (gde ih CEE nudi), 1500px dekor slike za sve boje koje CEE lista; nijedan novi URL ne pokazuje van Supabase/naše domene; validacije + build + contract testovi zeleni; vizuelna provera; deploy.

Napomena obima: boje koje postoje kod nas a CEE ih više ne lista ostaju netaknute (povučeni dekori se ne brišu u S2); nove boje sa CEE koje mi nemamo dodaju se u JSON (uz manifest zapis).

## 7. Šta se NE dira

- Postojeći slugovi i URL-ovi proizvoda (SEO); redirecti se ne uvode u S1/S2.
- `app/crm`, e-commerce se ne uvodi, dizajn sistem Faze 1 se ne menja.
- Drugi brendovi (BLOQ, Wolflor, TimberTech, Techem, Romus, Alpod) — kasniji segmenti.

## 8. Rizici

- **Akamai**: heuristički bot scoring — tempo 1–2 req/s, retry, GET umesto HEAD; ako blokada eskalira, fallback je Playwright sesija (već dev zavisnost).
- **Veličina repoa**: asseti idu ISKLJUČIVO u Supabase, ne u git (PROJECT_OPERATING upozorenje o veličini); `public/images/products/vinyl/` se ne proširuje.
- **JSON drift**: `vinyl_colors_complete.json` dobija nova polja — contract testovi + `audit-catalog-quality` se dopunjuju proverama novih polja (S2 plan).
- **Supabase kvote**: ~700 slika × ~300KB + ~300 PDF-ova — proceniti veličinu u dry-run-u pre upload-a i prijaviti vlasniku ako prelazi besplatni tier.
