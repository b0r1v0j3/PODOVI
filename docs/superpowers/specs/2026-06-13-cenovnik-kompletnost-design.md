# /cenovnik kompletnost — povezati ceo katalog u stranicu za unos cena

> Datum: 2026-06-13
> Status: dizajn odobren u brainstormingu sa vlasnikom
> Povezano: [[podovi-cenovnik-stranica]], [[podovi-cenovnik-kompletnost]]

## 1. Kontekst i problem

`/cenovnik` (skrivena zaštićena strana, Tatjana unosi cene) gradi stablo kroz `lib/cenovnik/tree.ts` → `loadPriceEntryTree` → `getColorsForCategory(categorySlug)` po kategoriji. Ti izvori (nested JSON mape + Supabase `colors` tabela) su **podskup** onoga što katalog (`getProductsByCategory`) prikazuje. Posledica: brendovi čije boje/proizvodi žive samo u JSON loaderima nepovezanim u `get-colors.ts` **ne pojavljuju se** u /cenovnik.

Stvarno stanje (audit 2026-06-13), proizvodi u katalogu a ne u /cenovnik:

| Brend | Kategorija | ~proizvoda | oblik | cena u katalogu |
|---|---|---|---|---|
| BLOQ + Gerflor Armonia | tekstilne-ploce | 257 | ravni proizvodi (bez „boja") | price 0 |
| Romus | alat | 635 | ravni proizvodi | **price > 0 (634, npr. 899)** |
| Techem | otirači | 46 | ravni proizvodi | price 0 |
| TimberTech | deking | 14 | ravni proizvodi | price 0 |
| (laminat) | laminat | **0** | — | — |

Ključni nalazi:
- Sve kategorije koje fale su **ravni pojedinačni proizvodi** (`getProductsByCategory` ih vraća sa `collection: undefined`, bez `colors`/`customColors`).
- **laminat = 0 proizvoda** → nema šta da se prikaže (van obima).
- Jedino **Romus alat (634/635)** ima stvarnu `price` (display polje, `types/index.ts:59`). Sve ostalo je `price: 0` („Cena na upit").
- **Romus cena je SA PDV-om** (kako je prikazana na sajtu).
- `/cenovnik` flat grana `get-colors.ts` (linije ~163-178) vraća **500 ako Supabase upit pukne** → obara celu kategoriju (uklj. JSON LVT).

## 2. Cilj

`/cenovnik` prikazuje **sve što katalog prikazuje** (vlasnik: „apsolutno sve iz kataloga, uklj. Romus alat i Techem"), proizvodi koji već imaju cenu su **pred-popunjeni**, a obaveštenje stiže **samo kad Tatjana promeni cenu**.

## 3. Donete odluke (brainstorming)

| Pitanje | Izbor |
|---|---|
| Obim | Apsolutno sve iz kataloga (uklj. alat i otirače kao pojedinačne stavke) |
| Pristup | A — /cenovnik se izvodi iz kataloga (jedan izvor istine, budući brendovi se sami pojave) |
| Ravni proizvodi | Svaki = zaseban red pod svojim brendom (`colorCount: 0`, postojeći UI za kolekcije bez boja) |
| Pred-popuna | Proizvodi sa `price > 0` (Romus) pred-popunjeni; cena je SA PDV-om → ide u „Sa PDV-om", „Bez PDV-a" se auto-izračuna |
| Obaveštenje | Samo izmene u odnosu na pred-popunjenu vrednost se šalju |
| laminat | Van obima (0 proizvoda) |

## 4. Arhitektura

### 4.1 Stablo iz kataloga (`lib/cenovnik/tree.ts`)

`loadPriceEntryTree` zadržava postojeći `collectionsForCategory` (nested + flat, za kolekcije-sa-bojama koje rade kao i sad), pa **dodaje catalog-derived sloj**:

- Za svaku kategoriju, `getProductsByCategory(categoryId)`.
- Skup već prisutnih slug-ova iz postojećeg stabla (kolekcije-headeri se već poklapaju po slug-u, npr. `tarkett-iq-motion`).
- Svaki proizvod čiji slug **nije** već u stablu → dodaje se kao `CenovnikCollection`:
  ```
  { slug: product.slug, name: product.name, categorySlug, categoryName,
    brandId: String(product.brandId || '6'), colorCount: 0,
    existingPrice: (typeof product.price === 'number' && product.price > 0) ? product.price : undefined }
  ```
- Pošto se dodaje sve neuhvaćeno, **budući brendovi/proizvodi se sami pojave** — gasi klasu problema, ne samo trenutne rupe.
- Grupisanje po brendu (postojeća logika u `loadPriceEntryTree`) ostaje; `brandNameFor` mapira brandId → ime (Romus=13, Techem=12, TimberTech=10, BLOQ=8, Gerflor=6 — svi u `mock-data.ts`).

`colorCount: 0` znači da tabela tretira red kao „kolekciju bez boja" — jedan red sa poljem za cenu, bez lenjeg učitavanja boja (`/api/colors` se ne zove jer `loadColors` ide samo kad `colorCount > 0`). Zato **`get-colors.ts` ne mora da servira „boje" za ravne proizvode**.

### 4.2 Tip (`lib/cenovnik/tree.ts`)

`CenovnikCollection` (i `RawCollection`) dobija opciono `existingPrice?: number` (cena SA PDV-om iz kataloga, ako postoji).

### 4.3 Pred-popuna + obaveštenje-na-izmenu (`app/cenovnik/PriceEntryTable.tsx`)

- **Inicijalizacija:** za svaku kolekciju sa `existingPrice`, inicijalizovati `collPrices[key]` tako da je **„Sa PDV-om" = existingPrice** i **„Bez PDV-a" = `withVatToBase(existingPrice)`** (postojeći `setCollWithVat` obrazac / `lib/cenovnik/vat.ts`). Bez `existingPrice` → prazno kao sad.
- **Original baseline:** zapamtiti pred-popunjene vrednosti (npr. `originalPrices: Record<key, withVat:number>`), da bi se znalo šta je promenjeno.
- **Submit (`handleSubmit`):** kolekcija ide u payload samo ako je **promenjena** — trenutna vrednost ≠ pred-popunjena (`existingPrice`), ILI je uneta vrednost gde pred-popune nije bilo, ILI postoji color override. Nepromenjene pred-popunjene cene se **ne šalju** (inače bi se Romus „promene" lažirale na svako slanje).
- Boje za ravne proizvode ne postoje (`colorCount 0`) → grana sa bojama se ne aktivira.

### 4.4 Robusnost (`lib/colors/get-colors.ts`)

Flat grana: Supabase upit na `colors` tabelu obmotati tako da **greška/izuzetak ne ruši kategoriju** — na grešku vrati prazne `flatColors` (uz `console.error`), pa **i dalje** dodaj JSON izvore (`tarkettLvtData` za lvt, itd.) i vrati `status 200` sa onim što ima. Time jedan Supabase problem više ne „proguta" celu kategoriju.

## 5. Data flow

1. `loadPriceEntryTree` (server) → stablo: postojeće kolekcije + catalog-derived ravni proizvodi (sa `existingPrice` gde ima).
2. `PriceEntryTable` (client) → pred-popuni „Sa PDV-om" za `existingPrice`; ostalo prazno.
3. Tatjana menja vrednosti → na „Pošalji", samo izmenjeno (vs baseline) ide u `/api/cenovnik/submit` → email obaveštenje (postojeći tok).
4. Kolekcije-sa-bojama (vinil, lvt…) rade nepromenjeno (boje lenjo preko `/api/colors`).

## 6. Error handling

- Supabase greška u flat grani → ne-fatalno (4.4).
- `getProductsByCategory` za kategoriju baci → preskoči tu kategoriju (try/catch), ne ruši stablo.
- Proizvod bez slug-a → preskoči.
- Dedup po slug-u sprečava duple unose (kolekcija-header + isti proizvod).

## 7. Testiranje (gate)

1. Novi contract test `tests/contracts/cenovnik-tree-contract.test.ts`:
   - `loadPriceEntryTree` uključuje brendove Romus (alat), Techem (otirači), TimberTech (deking), BLOQ (tekstil).
   - Bar jedan Romus proizvod ima `existingPrice > 0`.
   - Sve 4 S3 Tarkett kolekcije i dalje prisutne (regresija).
   - laminat ne pravi prazne/š kvar.
2. Postojeći `npm run test:contract` zelen (uklj. da promene u `get-colors.ts` ne lome boje-API).
3. `npm run build` zelen.
4. Vizuelno na dev-u: `/cenovnik` (login podovi/online) → Romus alat sekcija sa pred-popunjenim cenama (Sa PDV-om), izmena → „Pošalji" šalje samo izmenjeno.

## 8. Šta NIJE u obimu

- laminat (0 proizvoda).
- Menjanje granularnosti unosa (ostaje cena po kolekciji/redu + opcioni override po boji).
- Perzistovanje pred-popunjenih cena u bazu (cene i dalje žive u katalogu/`price` polju; /cenovnik samo prikazuje i šalje izmene na pregled).
- Izmena postojećih kolekcija-sa-bojama (rade nepromenjeno).

## 9. Rizici i ublažavanje

- **Dedup tree ↔ catalog:** kolekcije-headeri (radne kategorije) imaju slug = slug kolekcije u stablu → preskaču se po slug-u; ravni proizvodi se dodaju. Rizik dvostrukog unosa → pokriti contract testom (broj kolekcija po brendu očekivan).
- **Preklapanje tekstil (Supabase 26 boja vs katalog 257 proizvoda):** kategorija `tekstilne-ploce` ima i Supabase flat boje (26, grupisane u kolekcije) i katalog ravne proizvode (257, Gerflor Armonia + BLOQ). Plan MORA prvo da ispita da li im se slug-ovi poklapaju; ako ne, dedup po slug-u nije dovoljan i pojavili bi se dupli/redundantni unosi. Rešenje u planu: za flat-proizvod kategorije katalog je autoritativan izvor (preskoči Supabase flat za te kategorije, ili dedup po normalizovanom slug-u/imenu). Odlučiti na osnovu stvarnih podataka u planu.
- **Veliki broj redova (Romus 635):** tabela je već lenja po brendu (expand); 635 redova pod „Romus" je scroll-abilno. Bez novih performans problema (nema 635 fetch-eva — `colorCount 0`).
- **Promena `get-colors.ts`:** flat grana se samo ojačava (ne menja se oblik uspešnog odgovora) → postojeći boje-API i /cenovnik za radne kategorije ostaju isti.
