# Faza 2 — S3: Tarkett ingest pipeline + nove vinil/LVT kolekcije

> Datum: 2026-06-13
> Status: dizajn odobren u brainstormingu sa vlasnikom
> Prethodi: S1+S2 (Gerflor vinil ingest) na produkciji (commit e3206cbe)
> Master roadmap: `docs/superpowers/specs/2026-06-13-faza-2-podaci-master-s1-s2-design.md`

## 1. Kontekst i cilj

S3 je prvi **Tarkett-fokusiran** segment Faze 2. Cilj: izgraditi Tarkett self-host ingest put (po uzoru na Gerflor iz S2) i njime dodati **4 nove vinil/LVT kolekcije** koje nedostaju u katalogu, sa svim assetima u našoj Supabase bazi (bez hotlinkova).

Provera stvarnog stanja (2026-06-13):
- Sve postojeće Tarkett slike su **hotlinkovane** sa `media.tarkett-image.com` — **16.835** referenci u `public/data/*.json`. To je u sukobu sa direktivom „sve u našu bazu". Migracija postojećih = zaseban segment **S4** (van obima S3).
- Tarkett extractor je obrisan u istoriji; S1 je rekonstruisao minimalni `tools/extract_tarkett_core.js` koji čita `window.__NUXT__` payload jedne kolekcije (dokazano na „Bold", 10 boja), ali NE normalizuje i NE uploaduje.

## 2. Donete odluke (brainstorming)

| Odluka | Izbor |
|---|---|
| Pristup | Izgraditi Tarkett self-host pipeline + nove kolekcije self-hostovane (opcija A) |
| Postojeći Tarkett hotlinkovi | Ostaju za sad; migracija 16.835 slika = S4 (poseban segment) |
| Obim S3 | 4 nove vinil/LVT kolekcije (isti `*_colors.json` format) |
| Van S3 (→ S3b) | Parket dezeni (6 Sommer + Step XL hrast-baron), Gerflor Libertex/Initial novi dekori |
| /cenovnik | Auto-discovery iz kataloga — nove kolekcije se pojave same; S3 samo verifikuje |

## 3. Obuhvaćene kolekcije

| Kolekcija | Tarkett kategorija | Ciljni JSON | Status kod nas |
|---|---|---|---|
| **iQ Motion** | Homogeni vinil | `public/data/tarkett_homogeneous_vinyl_colors.json` | ✗ ne postoji |
| **Deal SPC 30** | SPC klik (LVT) | `public/data/tarkett_lvt_products.json` (ili LVT izvor) | ✗ ne postoji |
| **Real SPC 50** | SPC klik (LVT) | `public/data/tarkett_lvt_products.json` (ili LVT izvor) | ✗ ne postoji |
| **ModularT 70** | LVT lepljeni | LVT izvor | delimično — imamo stari „ModularT 7"; refresh na novi ID |

Tačne `tarkett.rs` URL-ove kolekcija i ciljni JSON po SPC/LVT kolekciji potvrđuje pilot (Task u planu); SPC format treba uskladiti sa postojećim LVT/colors strukturom u repou.

## 4. Principi pipeline-a (nasleđeni iz S2 + Tarkett specifičnosti)

- **Reuse**: `tools/lib/ingest-core.js` (env parser, fetch sa tvrdim `withTimeout` backstop-om, Supabase upload sa timeout-om, manifest sa resume-om, backup) se koristi netaknut — generičko je.
- **Novo, Tarkett-specifično**:
  - `tools/lib/tarkett-parse.js` — čiste funkcije: parsiranje `window.__NUXT__` / `json-collection-product` payload-a u normalizovane boje (`{code, name, slug, image, characteristics, documents}`), hero/collection sliku, dokumente. Pokrivene contract testovima sa verbatim payload fixtures (kao gerflor-parse).
  - `tools/ingest_tarkett.js` — orkestracija: za zadatu kolekciju (URL ili slug) pročita payload (Playwright, jer je tarkett.rs Nuxt-renderovan), preuzme slike (`media.tarkett-image.com/large/...`) i PDF-ove, uploaduje u Supabase, upiše normalizovan zapis u ciljni JSON sa Supabase URL-ovima. Flagovi `--dry-run`, `--collection=`, `--skip-existing`; manifest `output/ingest-tarkett-manifest.json`.
- **Self-hosting (direktiva)**: za NOVE kolekcije svaka slika i PDF se preuzima i uploaduje u Supabase (`product-images` / `product-documents`, putanja `products/<kategorija>/<kolekcija-slug>/...`). JSON čuva samo Supabase URL-ove; upstream `tarkett.rs` link ostaje samo kao `url`/`externalLink` metadata. Postojeće Tarkett kolekcije se NE diraju (ostaju hotlink do S4).
- **Tehnički**: tarkett.rs je Nuxt — koristi se Playwright (već dev zavisnost) za `__NUXT__`; `media.tarkett-image.com` (slike) i `tarkett.rs/.../pdf` (dokumenti) se preuzimaju direktno. Pristojan tempo, tvrdi timeout-i iz ingest-core (fetch/telo 35s, sharp 20s, upload 60s) — sprečavaju visenja kao u S2.
- **Srpski nazivi dokumenata**: reuse `mapDocumentTitle` obrasca (čisti srpski naslovi, dedupe po naslovu) — ili Tarkett već daje srpske naslove (Tehnički list, Tabela formata) pa se zadržavaju + dedupe.

## 5. Data put i prikaz

- Nove kolekcije su DB-first kao Gerflor vinil (mock-data/Supabase može imati red ili ne). Loader (`getVinylCollectionProducts` ili odgovarajući LVT/homogeni loader) i resolver (`enrichProductFromCollectionData`) već prenose `documents`/`collection_image_url`/`room_scene_images` na PDP (urađeno u S2) — nove kolekcije ih dobijaju besplatno ako prate isti format polja.
- Na PDP-u se podrazumevano bira prva boja (urađeno posle S2).
- Breadcrumb prikazuje lep naziv (urađeno).

## 6. /cenovnik (provera, ne novi kod)

`/cenovnik` (skrivena zaštićena strana za unos cena, Tatjana) gradi listu kolekcija kroz `lib/cenovnik/tree.ts` → `loadPriceEntryTree` → `getColorsForCategory(categorySlug)` za SVE kategorije. To čita isti katalog kao i javne stranice. Posledica: **nove kolekcije se automatski pojave** u cenovniku, grupisane po brendu (Tarkett, brandId 3).

S3 obaveza: posle ingesta **verifikovati** da se sve 4 nove kolekcije vide u `/cenovnik` price-entry stablu, pod ispravnim brendom (Tarkett) i kategorijom. Ako neka kategorija (npr. SPC) nije pokrivena `getColorsForCategory`-jem ili završi pod „Ostali brendovi", to je jedina situacija gde se dira `lib/cenovnik/tree.ts` (mapiranje), inače bez izmena.

## 7. Verifikacija (gate)

1. `npm run build` + `npm run test:contract` zeleno.
2. Novi data contract test `tests/contracts/tarkett-new-collections-contract.test.ts`: nove kolekcije imaju boje sa slikama; svi asset URL-ovi (slike, dokumenti, hero) počinju sa našim Supabase prefiksom; **nijedan ne pokazuje na `media.tarkett-image.com` ili `tarkett.rs/pdf`** (za NOVE kolekcije); `colorCount === colors.length`.
3. `npx tsx scripts/audit-catalog-quality.ts` — bez novih grešaka.
4. Vizuelna provera na dev-u: PDP svake nove kolekcije (slike sa Supabase, dokumenti, prva boja izabrana) + **`/cenovnik`** (login podovi/online) pokazuje 4 nove kolekcije pod Tarkett-om.
5. Deploy na main (push) ostaje ručna odluka vlasnika.

## 8. Šta NIJE u obimu

- Migracija 16.835 postojećih Tarkett hotlink slika → **S4**.
- Parket dezeni (6 Sommer + Step XL) i Gerflor Libertex/Initial novi dekori → **S3b** (drugačija struktura: parket živi u `lib/data/tarkett-products.ts` + wood index).
- Bilo kakva izmena postojećih Tarkett kolekcija.
- Cene se NE unose (to radi Tatjana kroz /cenovnik); S3 samo obezbeđuje da su nove kolekcije tamo vidljive.

## 9. Rizici i ublažavanje

- **Nuxt struktura varira po kategoriji**: homogeni vinil / SPC / LVT stranice mogu imati različit `__NUXT__` oblik. Ublažavanje: pilot na JEDNOJ novoj kolekciji prvo (de-rizikuje parser pre punog run-a), kao Gerflor pilot.
- **tarkett.rs anti-bot / prazan DOM u headless modu**: postojeći (obrisani) extractori su imali stored-JSON fallback i `page.content()` fallback; ako Playwright vrati prazan grid, parser pada nazad na HTML parsing. Tvrdi timeout-i iz ingest-core sprečavaju visenja.
- **SPC kategorija/mapiranje**: Deal/Real SPC mogu da ne legnu čisto u postojeću LVT kategoriju ili cenovnik grupisanje — pilot to otkriva; rešava se mapiranjem (kategorija + brand) bez širih izmena.
- **Veličina repoa**: asseti idu isključivo u Supabase, ne u git.
- **Supabase kvote**: 4 kolekcije × desetine boja — mali obim u odnosu na S2.
