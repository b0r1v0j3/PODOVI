# Contract: URL stanje filtera početne strane

Parser: `parseHomeFilterUrlState(search, schema)`; serializer: `serializeHomeFilterUrlState(state, currentSearch, schema)` u `lib/catalog/home-filter-url.ts`. Oba su čista (bez pregledača).

## Novi format (od 17.10.2026)

| Stanje | Ključ | Primer |
|---|---|---|
| Kategorije | `category` (ponovljiv) | `?category=vinil&category=lvt` |
| Brendovi | `brand` (ponovljiv, ID brenda) | `?brand=6` |
| Opšta lista / da-ne | `<param>` (ponovljiv) | `?klasa=33&klasa=34&ugradnja=Klik&grejanje=1` |
| Opšti opseg | `<param>=min-max` | `?debljina=2-4.5`, `?cena=-2000`, `?habanje=0.55-` |
| Tip kategorije | `type=kat::vrednost` | `?type=vinil::heterogeni` |
| Kolekcija | `collection=kat::vrednost` | `?collection=lvt::creation 55` |
| Kategorijska faseta | `facet=kat::param::vrednost` | `?facet=vinil::materijal::SPC` |
| Tab | `tab=colors` | default `collections` se ne piše |
| Sortiranje | `sort=name\|price` | default `featured` se ne piše |

Pravila:
- Ponovljivi parametri umesto zareza (vrednosti mogu sadržati zarez).
- Liste se pri upisu deduplikuju i sortiraju; ključevi idu fiksnim redom (stabilan URL).
- Nepovezani parametri (npr. `utm_*`) se čuvaju u originalnom redu.
- Vrednosti duže od 240 znakova, sa kontrolnim znakovima ili nepoznatim parametrom grupe se odbacuju; posle učitavanja podataka odbacuju se i vrednosti kojih nema u podacima.
- Opseg: brojevi sa tačkom ili zarezom; `min ≤ max`; bar jedna granica.

## Stari format (11.07.2026) — i dalje se čita

| Stari ključ | Tumačenje |
|---|---|
| `application=stambeni prostor` / `komercijalni prostor` | `namena=Stambeni` / `namena=Komercijalni` |
| `thicknessMin=a&thicknessMax=b` | `debljina=a-b` |
| `facet=kat::param::v` gde je `param` sada opšta grupa (npr. `vinil::klasa::33`, `vinil::ugradnja::Klik`, `parket::uzorak::Riblja kost`) | opšta grupa `param=v` |
| `facet=laminat::klasa::AC5` | `facet=laminat::ac::AC5` |
| `facet=…::grejanje::1` | `grejanje=1` |

Upis uvek koristi novi format (stari link se pri prvom učitavanju kanonizuje preko `history.replaceState`).
