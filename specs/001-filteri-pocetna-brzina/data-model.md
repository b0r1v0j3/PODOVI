# Data Model: Filteri na početnoj strani

Sve strukture su nove i serijalizabilne (server → klijent); postojeći `Product` tip se ne menja.

## HomeCatalogItem (sažeta stavka kataloga)

Nastaje u `lib/catalog/home-catalog-index.ts` iz `Product` + konteksta kategorije. Oblik je kompatibilan sa `Product` za `ProductCardClient`/`CompareButton`/`FavoriteButton`.

| Polje | Tip | Napomena |
|---|---|---|
| `id`, `slug`, `name`, `sku` | string | kao u `Product` |
| `categoryId`, `brandId` | string | |
| `categorySlug` | string | ključ za kategorijske grupe |
| `price?`, `priceUnit?` | number, string | samo kad `price > 0` |
| `inStock`, `featured` | boolean | |
| `description`, `createdAt`, `updatedAt` | `''` | prazno (tip kompatibilnost) |
| `href` | string | `getCanonicalProductHref(product)` izračunat na serveru |
| `images` | `{ url, alt }[]` (≤2) | već rešeni `card` URL-ovi |
| `swatchImages?` | string[] (≤3) | `thumb` URL-ovi |
| `specs` | `ProductSpec[]` | samo `collection` (naslov kartice) |
| `fv` | `Record<GroupId, string[]>` | kanonske vrednosti po grupi (uklj. nasleđene); odsutan ključ = nema podatka |
| `nv` | `Record<GroupId, number[]>` | intervali spljošteni `[lo1, hi1, lo2, hi2…]` |
| `compareSlim` | `true` | znak za „Uporedi" da dopuni specifikacije |

**GroupId**: opšta grupa → `param` (npr. `klasa`); kategorijska → `${categorySlug}.${param}` (npr. `vinil.materijal`, `parket.type`, `lvt.collection`).

**Pravila**:
- Vrednosti dolaze samo iz specifikacija (spec.key ili `specKeyFromLabel(spec.label)`), polja `price`/`availability`, ili izvođenja definisanog u D4.
- Nasleđivanje (po kategoriji, brend-skopirano): stavka bez sopstvene vrednosti dobija uniju vrednosti istog identiteta kolekcije (`normalizeCollectionKey`).
- Kolekcija tip (`type`) i Kolekcija (`collection`) su kategorijske liste; vrednost = normalizovana labela (lowercase), labela opcije = prva viđena prikazna vrednost.

## FacetSchemaEntry (opis grupe za klijent i URL)

| Polje | Tip | Napomena |
|---|---|---|
| `id` | GroupId | |
| `param` | string | URL parametar opšte grupe; za kategorijske `facet=` (ili `type=`/`collection=`) |
| `scope` | `'all'` \| categorySlug | |
| `label` | string | naslov u panelu |
| `kind` | `'list'` \| `'boolean'` \| `'range'` | |
| `unit?` | `'mm'` \| `'dB'` \| `'RSD'` | za `range` |
| `presets?` | `{ label, min?, max? }[]` | prečice opsega |
| `order?` | string[] | fiksni redosled; ostalo `sr-Latn` |
| `optionLabels?` | Record<value, label> | npr. `33` → `33 · lokal`; za `type`/`collection` iz podataka |
| `chipPrefix?` | string | npr. `Klasa ` |
| `collapsed?` | boolean | sklopljena po defaultu |
| `note?` | string | npr. „Samo proizvodi sa cenom" |

## HomeFilterState

| Polje | Tip | URL |
|---|---|---|
| `categories` | string[] | `category=` (ponovljiv) |
| `brands` | string[] | `brand=` |
| `lists` | `Record<GroupId, string[]>` | opšte: `<param>=vrednost`; kategorijske: `facet=kat::param::vrednost`, `type=kat::vrednost`, `collection=kat::vrednost` |
| `ranges` | `Record<GroupId, [number \| null, number \| null]>` | opšte: `<param>=min-max` (otvoreno: `2-`, `-4`) |
| `tab` | `'collections'` \| `'colors'` | `tab=colors` (default se ne piše) |
| `sort` | `'featured'` \| `'name'` \| `'price'` | `sort=` (default se ne piše) |

**Prelazi**:
- Izbor/skidanje kategorije: kategorijske selekcije kategorije koja više nije izabrana se brišu; opšte ostaju.
- „Očisti sve": sve prazno, sort ostaje default.
- Sanitizacija: vrednosti koje ne postoje u šemi/podacima se odbacuju posle učitavanja podataka (bez fantomskih filtera).

## Engine izlaz

| Polje | Opis |
|---|---|
| `results` | stavke sa punom maskom (pa sortiranje) |
| `groups[]` | za vidljive grupe: opcije `{ value, label, count, selected, disabled }` ili za `range`: `{ min, max, bounds, presets[{label,count}] }`, `selectedCount` |
| `chips[]` | `{ id, label, remove() }` u redosledu grupa |
