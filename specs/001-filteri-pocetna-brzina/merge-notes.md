# Spajanje sa granom `codex/podovi-commerce-schonox`

> **Završeno 18.10.2026:** grane su spojene. Nalozi, korpa i porudžbine (`ProductOrderPanel` i ostalo) uklonjeni su po odluci vlasnika u `75533ea8`; od commerce grane ostao je samo SCHÖNOX katalog. Server region je `cdg1` (Pariz).

Stanje 17.10.2026: commerce grana još nije commit-ovana (izmene postoje samo u glavnom checkout-u). Ova grana (`claude/home-filters-speed`) je napravljena od `main` @ `069cd66c`.

## Preklapanja i kako ih razrešiti

| Fajl | Ova grana | Commerce grana | Očekivano |
|---|---|---|---|
| `lib/catalog/facet-config.ts` | nove funkcije/grupe POSLE `getFacetDefsForCategory`; linije `CATEGORY_FACETS` nisu dirane | dodaje `pribor: [...]` posle `otiraci:` | automatsko spajanje |
| `app/page.tsx` | bez `searchParams`, `revalidate = 300`, `buildHomeCatalogItems` + `facetSchema` | uvoz `toHomepageListingProduct` + `.map(... toHomepageListingProduct(backfillCollectionImages(...)))` | verovatno automatski; ako ne: zadržati OBA (njihov uvoz i `.map`, naš ISR i indeks) — `toHomepageListingProduct` čuva `specs`, pa indeks filtera radi isto |
| `components/ProductColorSelector.tsx` | hero stek (linije ~157–180, ~350–390) | uvoz `ProductOrderPanel`, labela cene, panel porudžbine | različiti delovi — automatski |
| `tests/contracts/home-filter-ui-contract.test.ts` | blokovi o panelu/URL-u/dugmetu | jedna linija o širini header pretrage | automatski |
| `AGENTS.md`, `.agent/workflows/podovi-architecture.md` | datum + unos u „Završeno" + gotchas 42–43 | njihovi unosi | ručno: zadržati oba unosa, noviji datum na vrhu |

## Posle spajanja proveriti

1. `npm run test:contract` (uklj. `schonox-catalog-contract`, `home-filter-engine-contract`, `home-catalog-index-contract`).
2. Početna: Kategorija „Pribor" i Brend „SCHÖNOX" se pojavljuju sami sa tačnim brojem; izbor Pribor prikazuje „Vrsta pribora" (iz `type`) i „Program" (njihova grupa).
3. „Dostupnost" se prikazuje tek kada podaci imaju bar dve različite vrednosti `availability` (SCHÖNOX je ceo „Na upit", pa se grupa još ne vidi — namerno).
4. Cene: posle 19.10.2026 (cenovnik) grupa „Cena" automatski uključuje SCHÖNOX proizvode sa cenom; početna osvežava cene najviše na 5 minuta (ISR), PDP uvek sveže.
5. Ako commerce prikazuje cene/rabat na karticama početne, to mora da ostane klijentska logika (početna je statička — ne vraćati `searchParams`/`cookies()` u `app/page.tsx`).
