---
description: Obavezni postupak i checklist za bezbedno brisanje celog brenda (npr. EGGER) iz sistema.
---
# Uklanjanje Brenda - Checklist

Ovaj dokument služi kao referenca kada je potrebno trajno obrisati neki brend (npr. Tarkett, EGGER, BLOQ) iz PODOVI.ONLINE aplikacije. S obzirom da podaci dolaze iz 4 različita izvora (Supabase, JSON fajlovi, Mocks, Hardcoded skripte), proces brisanja se **mora** izvesti prateći sve korake, inače će aplikacija pući (Error 500) ili će mrtvi linkovi ostati vidljivi korisnicima.

## 1. Uklanjanje Hardkodovanih Podataka & Mockova
- Otvoriti `lib/data/mock-data.ts`.
- Izbrisati sve proizvode, kolekcije i kategorije vezane za brend.
- U okviru modula izbrisati referentne boje u nizu (ako prate isti brend).

## 2. Ažuriranje Repozitorijuma (Data Loaders)
- Otvoriti `lib/repositories/category-repository.ts`.
- Obrisati fallback `Category` objekte unutar `findAll()`, `findBySlug()`, `findById()`.
- Otvoriti `lib/repositories/product-repository.ts`.
- U metodi za spajanje (*merge*) obrisati logiku guranja mock podataka nazad u glavni tok asinhronih funkcija.

## 3. Ažuriranje Skripti i Alatki
- Pronaći funkcije u `lib/utils/productDataLoader.ts` (npr. `getEggerProducts()`) i obrisati ih.
- Ako brend ima eksterne datoteke u `public/data/` (kao `tarkett_lvt_products.json`), bezbedno ih obrisati (`rm public/data/...`).
- Obrisati foldere sa slikama brenda: `public/images/products/[brand_name]`.

## 4. Očistiti Bazu (Supabase)
Neophodno je obrisati brend iz Supabase tabele kako ga backend API ne bi više povlačio:
1. Otvoriti Supabase dashboard.
2. Ući u tabelu `brands`.
3. Izbrisati dati brend. Tabele sa kaskadnim on-delete referencama (ako su tako podešene) bi trebale automatski ukloniti asocirane proizvode. Uveri se da li su tabele `products`, `categories` prebačene i očišćene.

## 5. UI/UX Navigacija i Meni
Sajt možda ima ugrađene menije za taj brend (ako se ne prate asinhrono).
- Proveriti `Header.tsx` (ako sadrži megamenu sa hardkodovanim slikovnim banerom).
- Proveriti `Footer.tsx` brze linkove.

## 6. Provera i Deployment
- [ ] Pokrenuti proveru `npm run check:health` — ako izbaci grešku da pokušava pročitati nedefinisani JSON resurs, nisi uklonio *loader* import.
- [ ] Pokrenuti statički kompilator: `npm run build`
- [ ] Zapisati promene u fajl `AGENTS.md` - uneti pod "Lekcije" i "Common Gotchas" da je uklonjen brend tog-i-tog datuma.
- [ ] Git commit i push promena.

---
// turbo-all
// Ova skripta može pokušati auto-grep komandu ako pokrenete workflow:
// `npm run lint` da vidite ostale "dead code" variable!
