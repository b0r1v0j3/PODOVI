# Contract: sažeti podaci kataloga (server → pregledač)

## Početna (`app/page.tsx`, ISR 300 s)

`HomeProductTabs` props:

```text
groups: Array<{
  category: { id, name, slug },
  products: HomeCatalogItem[],   // kolekcijske stavke (ili sve stavke ako kategorija nema kolekcije)
  totalCount: number,
  colorCount: number,
}>
brandsRecord: Record<brandId, { id, name, slug }>
facetSchema: FacetSchemaEntry[]   // opšte + kategorijske grupe koje postoje u podacima
```

`HomeCatalogItem` — vidi `data-model.md`. Nijedna stavka ne nosi `description`, `documents`, `detailsSections`, pune galerije ni specifikacije osim `collection`.

## `GET /api/home-colors?categoryIds=1,2`

```text
200 { groups: Array<{ categoryId: string, products: HomeCatalogItem[] }> }
Cache-Control: public, max-age=0, s-maxage=3600, stale-while-revalidate=86400
```

- `fv`/`nv` boja su izračunati uz nasleđivanje od kolekcije iste kategorije (i obrnuto).
- Nepoznat/prazan `categoryIds` → `{ groups: [] }`.

## `GET /api/products?ids=a,b[&categoryIds=2]`

Postojeći odgovor (`id, slug, name, shortDescription, categoryId, brandId, images, specs, price, priceUnit, inStock`). Novo: opcioni `categoryIds` ograničava pretragu na te kategorije (uključujući boje/varijante) — koristi ga „Uporedi" da dopuni specifikacije sažetih stavki.
