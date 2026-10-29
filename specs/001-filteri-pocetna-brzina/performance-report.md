# Izveštaj o brzini — pre / posle (17.10.2026)

## Metod

- **Isti postupak pre i posle**: `npm run build` + `next start` (production) na istoj mašini, ista `.env.local` (prava Supabase baza), stranice zagrejane jednim zahtevom.
- **Merenje**: Playwright + Chrome (`channel: chrome`), keš isključen, medijana 3 učitavanja. Metrike iz pregledača: TTFB i FCP (Navigation/Paint Timing), LCP i CLS (PerformanceObserver), TBT ≈ zbir (longtask − 50 ms) posle FCP-a, preneti bajtovi iz CDP Network događaja.
  - **Telefon** (kao Lighthouse mobile): 390×844 @2x, Slow 4G (150 ms RTT, 1,6 Mbps ↓, 750 Kbps ↑), CPU 4× sporiji.
  - **Desktop**: 1440×900, 40 ms RTT, 10 Mbps, CPU 1×.
- Skripte: `measure.cjs`, `interaction.cjs`, `cpuwork.cjs` (lokalni alati, nisu u repou); sirovi rezultati: `vitals-before.json`, `vitals-after.json` u ovom folderu.
- Strane: `/` (početna), `/?category=vinil&facet=vinil::klasa::33` (stari deep link), `/proizvodi/gerflor-creation-55` (PDP sa 71 bojom), `/proizvodi/allegro` (PDP parketa).
- Lokalni TTFB ne pokazuje efekat promene regiona (lokalno nema transatlantskog puta) — vidi „Produkcija".

## Telefon (Slow 4G, 4× CPU)

| Strana | Metrika | Pre | Posle |
|---|---|---:|---:|
| Početna | TTFB | 1.996 ms | **73 ms** |
| | FCP | 4.196 ms | **1.140 ms** |
| | LCP | 22.712 ms | **2.040 ms** |
| | TBT | 5.479 ms | **1.341 ms** |
| | CLS | 0 | 0 |
| | HTML (preneto) | 454 KB | **106 KB** |
| | Slike | 6.645 KB | **408 KB** |
| | Ukupno preneto | 7.409 KB | **819 KB** |
| Početna, deep link (filter) | LCP | 13.228 ms | **1.828 ms** |
| | TBT | 7.818 ms | **1.212 ms** |
| | CLS | 0 | 0,048 |
| PDP Creation 55 | FCP | 5.076 ms | **2.700 ms** |
| | LCP | 6.024 ms | **3.184 ms** |
| | TBT | 4.794 ms | **758 ms** |
| | JS | 810 KB | **157 KB** |
| | Slike | 14.549 KB | **2.121 KB** |
| | Ukupno preneto | 15.642 KB | **2.620 KB** |
| PDP Allegro (parket) | LCP | 5.504 ms | **4.124 ms** |
| | TBT | 3.449 ms | **780 ms** |
| | JS | 810 KB | **157 KB** |

## Desktop

| Strana | Metrika | Pre | Posle |
|---|---|---:|---:|
| Početna | TTFB | 4.449 ms | **60 ms** |
| | LCP | 9.396 ms | **588 ms** |
| | TBT | 767 ms | **17 ms** |
| | Ukupno preneto | 7.202 KB | **627 KB** |
| Početna, deep link | LCP | 4.304 ms | **1.312 ms** |
| | CLS | 0 | 0 |
| PDP Creation 55 | LCP | 2.048 ms | 2.200 ms (TTFB lokalno varira 1,0–1,5 s zbog Supabase upita) |
| | TBT | 381 ms | **16 ms** |
| | Ukupno preneto | 15.613 KB | **2.637 KB** |
| PDP Allegro | LCP | 1.824 ms | **1.096 ms** |

## Paketi i podaci

| Šta | Pre | Posle |
|---|---:|---:|
| `/proizvodi/[slug]` First Load JS (build izveštaj) | 787 kB | **123 kB** |
| Chunk PDP strane (sirovo) | 13,36 MB | **52 KB** |
| `/` First Load JS | 122 kB | 120 kB |
| `/` režim | ƒ dinamički (render po zahtevu, `no-store`) | **○ ISR, `s-maxage=300, stale-while-revalidate`** |
| HTML početne (sirovo / gzip / brotli) | 6,22 MB / 460 KB / 307 KB | **1,28 MB / 108 KB / 81 KB** |
| `/api/home-colors` za vinil+LVT+parket (sirovo / gzip) | 13,6 MB / 440 KB | **1,5 MB / 106 KB** |
| Lokalni production build | 16 min 15 s | **3 min 44 s** |

## Odziv filtera (klik → iscrtan novi broj/izbor)

| CPU | Pre dorade odziva | Posle |
|---|---:|---:|
| 1× (desktop) | 165–176 ms | **58–65 ms** |
| 4× (simulirani telefon) | 965–1.101 ms | **211–398 ms** |

Dorada: sinhrono ažuriranje izbora umesto `startTransition`, mreža kartica kroz `useDeferredValue` (checkbox/brojači odmah, kartice odmah zatim), kartice bez Next `Link` prefetch-a dinamičkih PDP ruta. Ostatak vremena na 4× je iscrtavanje novih kartica sa slikama i raspored panela.

## Uzroci i popravke

1. **Početna slala ceo katalog** (opisi, dokumenti, pune galerije — 4,9 MB JSON-a) i renderovala se na svaki zahtev → sažete stavke (`lib/catalog/home-catalog-index.ts`) + ISR 300 s.
2. **PDP klijentski paket 13,4 MB** — `ProductCharacteristics` (client) je uvozio `mergeSpecs` iz `color-helpers.ts`, koji statički uvozi 16 JSON izvora boja → `lib/product-page/spec-merge.ts`; test `pdp-client-bundle-contract` čuva pravilo.
3. **PDP preuzimao slike svih boja** (14,5 MB na Creation 55): skriveni preloader u `ColorGrid` + hero stek svih boja → slika boje se preuzima na nameru (hover/fokus/dodir), hero montira samo aktivnu/viđene boje, prethodna ostaje vidljiva dok se nova ne učita.
4. **Swatch sličice na karticama** su bile originali (do 1.500 px) kao CSS pozadina → `next/image` 32 px.
5. **Prve kartice lazy** → `priority` za prve 4 kartice (LCP).
6. **Region**: pre promene produkcija je odgovarala sa `x-vercel-id: fra1::iad1` (funkcija u SAD), a Supabase je u Evropi (~40 ms RTT iz Beograda). Konačno spojeno podešavanje od 18.10.2026. je `vercel.json` `regions: ["cdg1"]` (Pariz); raniji predlog `fra1` je zamenjen.

## Produkcija (proveriti posle objave)

- **SC-004 (TTFB početne iz keša < 0,3 s)**: lokalno 52–73 ms iz ISR keša; na produkciji se potvrđuje tek posle objave (pre: 2,7 s, `no-store`).
- **PDP TTFB**: lokalno ostaje vezan za Supabase upite (strana je namerno dinamička zbog svežih cena). Na produkciji se očekuje pad zbog konačnog regiona `cdg1` (svaki upit više ne prelazi Atlantik) — izmeriti posle objave.

## Status kriterijuma uspeha

| Kriterijum | Status |
|---|---|
| SC-001 ≥12 grupa bez kategorije | ✅ 17 grupa (pre: 4) — `home-filter-engine-contract` |
| SC-002 brojač == rezultat | ✅ svaka opcija, ceo katalog (625+ provera, 0 odstupanja) |
| SC-003 nema vrednosti van podataka | ✅ `home-catalog-index-contract` |
| SC-004 HTML ≥5× manji, iz keša | ⚠️ delimično: sirovo 4,8×, gzip 4,3×, brotli 3,8×; ostatak su stvarni jedinstveni podaci (635 od 1.134 stavki su Romus alati). Keš ✅ lokalno, produkcija posle objave |
| SC-005 LCP bolji, CLS < 0,1 | ✅ LCP telefon 22,7 s → 2,0 s; CLS ≤ 0,048 |
| SC-006 < 100 ms po promeni filtera | ⚠️ delimično: 58–65 ms na 1× CPU, 211–398 ms na 4× CPU |
| SC-007 testovi, lint, tipovi, build, stari linkovi | ✅ 354/355 contract testova + jedan postojeći „flaky" test (vidi napomenu), lint bez grešaka, build OK, stari linkovi pokriveni testom i proverom u pregledaču |

Napomena (SC-007): `seo-contract › keeps PDP reads request-fresh…` pada samo u punom paralelnom suite-u zbog limita od 5 s na hladnom uvozu PDP modula; izolovano prolazi i na `main` (3,9–4,6 s) i na ovoj grani (3,7–3,8 s). Nije posledica ovih izmena.
