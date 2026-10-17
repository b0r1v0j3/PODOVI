# Quickstart: provera filtera i brzine

## Priprema
```bash
npm ci
# .env.local sa Supabase ključevima (isti kao za lokalni rad)
```

## Automatske provere
```bash
npm run test:contract     # uklj. home-catalog-index, home-filter-engine, home-filter-url, pdp-client-bundle
npm run lint
npm run build             # validate:images + next build (provera tipova)
```
Očekivano: svi testovi zeleni; u build izveštaju `/` je `○`/ISR (revalidate 300), `/proizvodi/[slug]` first-load JS ispod ~150 kB.

## Ručni scenariji (`npm run build && npx next start -p 3100`)
1. `/` desktop 1440 px: panel bez izabrane kategorije ima ≥12 grupa; izaberi **Ugradnja → Klik** pa **Klasa upotrebe → 33**: broj uz opciju = broj kartica (naslov i tab „Kolekcije").
2. Izaberi **Kategorija → Vinil**: pojavljuju se „Tip vinila", „Materijal", „Kolekcije vinila"; opšti filteri ostaju.
3. Skini Vinil: kategorijski filteri nestaju, opšti ostaju.
4. **Debljina → prečica „2,5–5 mm"**: čip „Debljina: 2,5–5 mm", rezultati odgovaraju.
5. Kopiraj URL, otvori u novom tabu → isto stanje; Nazad/Napred vraćaju prethodna stanja.
6. Stari link: `/?category=vinil&facet=vinil%3A%3Aklasa%3A%3A33&application=komercijalni%20prostor&thicknessMin=2&thicknessMax=3` → prikazuje Vinil + Klasa 33 + Komercijalni + Debljina 2–3 mm, URL se prepisuje u novi format.
7. Telefon 390 px: dugme „Filteri" iznad rezultata otvara fioku; „Prikaži N rezultata" = broj kartica posle zatvaranja; čipovi se skidaju dodirom.
8. Tab „Boje" sa filterom Klasa 33: brojevi se ne prikazuju lažno dok se boje učitavaju.
9. PDP `/proizvodi/gerflor-creation-55`: specifikacije i izbor boje rade kao pre; u Network tabu nema JS chunk-a od više MB.
10. „Uporedi" sa početne: dodaj 2 kartice → `/uporedi` prikazuje specifikacije.

## Merenje
```bash
node <scratch>/measure.cjs http://localhost:3100 after vitals-after.json
```
Rezultati i metodologija: `performance-report.md`.
