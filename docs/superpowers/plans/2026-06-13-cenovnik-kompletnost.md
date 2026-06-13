# /cenovnik kompletnost — Implementacioni plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (preporučeno) ili superpowers:executing-plans za izvršavanje task-po-task. Koraci koriste checkbox (`- [ ]`) sintaksu.

**Goal:** `/cenovnik` prikazuje sve što katalog prikazuje (uklj. BLOQ, Romus, Techem, TimberTech), proizvodi sa cenom su pred-popunjeni (Romus, SA PDV-om), a obaveštenje stiže samo na izmenu.

**Architecture:** Tri sloja. (1) `get-colors.ts` flat grana postaje ne-fatalna (Supabase greška → prazne boje, JSON izvori i dalje prolaze). (2) `tree.ts` dobija catalog-derived sloj: `getProductsByCategory` proizvodi koji nisu već u stablu (po slug-u) i nemaju `?` u slug-u (po-boja rute) ulaze kao redovi `colorCount:0` pod svojim brendom, sa `existingPrice`. (3) Čiste pure funkcije za pred-popunu/izmenu (`prefill.ts`) koje `PriceEntryTable.tsx` koristi.

**Tech Stack:** Next.js 14, React 18, TypeScript, Vitest (`test:contract`, node env). Bez novih zavisnosti.

---

## Dokazi (provereno 2026-06-13)

- **Ravni proizvodi koji fale** (`getProductsByCategory`, `colorCount 0`, `collection: undefined`): tekstil/BLOQ, alat/Romus (635), otirači/Techem (46), deking/TimberTech (14). laminat = **0 proizvoda** (van obima).
- **Samo Romus ima cenu**: `product.price > 0` (634/635, npr. 899), i to je **cena SA PDV-om**. Sve ostalo `price: 0`.
- **Tekstil dedup**: katalog tekstil = brand 6 (Gerflor: 3 čista slug-a `gerflor-armonia-400/540/620` + 26 `?color=` ruta) + brand 8 (BLOQ: 18 čistih slug-ova `bloq-assembly/sensity/unity/…` + 210 `?color=` ruta). 3 Gerflor čista slug-a su VEĆ u stablu (Supabase tekstil = te 3 Armonia kolekcije). Pravilo: **dodaj samo čiste slug-ove (bez `?`) koji nisu već u stablu** → BLOQ 18 ulazi, Armonia preskočena, `?color=` rute preskočene.
- **Test env** (`tests/contracts/setup.ts`): lažni Supabase (`127.0.0.1:54321`) → flat upit uvek pukne → prirodno vežba ne-fatalnu granu.
- **VAT helperi** (`lib/cenovnik/vat.ts`): `withVatToBase`, `baseToWithVat`, `parseNum`, `formatInput`, `VAT_RATE`.
- **get-colors flat grana**: `try` (linije ~163) → Supabase upit; `if (error) return {status:500}` (linije ~175-178); za `lvt` dodaje `tarkettLvtData`; vraća 200 (linije ~238-245); spoljni `catch` (linije ~246-249) → `{status:500, error:'Internal server error'}`.
- **tree.ts**: `loadPriceEntryTree` mapira `categories` → `collectionsForCategory(slug,name)`, flat-uje, grupiše po brendu. `CenovnikCollection`/`RawCollection` nemaju `existingPrice`.

---

## File Structure

| Fajl | Odgovornost | Akcija |
|---|---|---|
| `lib/colors/get-colors.ts` | Ne-fatalna flat grana (Supabase greška → JSON izvori i dalje prolaze) | Modify |
| `lib/cenovnik/tree.ts` | `existingPrice` na tipovima + catalog-derived sloj (`flatProductsForCategory`) + integracija | Modify |
| `lib/cenovnik/prefill.ts` | Čiste funkcije: pred-popuna para cena + detekcija izmene | Create |
| `app/cenovnik/PriceEntryTable.tsx` | Inicijalizacija iz `existingPrice` + submit samo izmenjeno | Modify |
| `tests/contracts/cenovnik-get-colors-resilient.test.ts` | flat grana ne-fatalna | Create |
| `tests/contracts/cenovnik-tree-contract.test.ts` | catalog-derived stablo (Romus/Techem/TimberTech/BLOQ, existingPrice, dedup, S3 regresija) | Create |
| `tests/contracts/cenovnik-prefill-contract.test.ts` | pred-popuna/izmena pure funkcije | Create |

---

## Task 1: `get-colors.ts` — ne-fatalna flat grana

**Files:**
- Modify: `lib/colors/get-colors.ts` (flat grana, ~163-249)
- Test: `tests/contracts/cenovnik-get-colors-resilient.test.ts`

- [ ] **Step 1: Napiši failing test**

Create `tests/contracts/cenovnik-get-colors-resilient.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { getColorsForCategory } from '@/lib/colors/get-colors';

// U test okruženju Supabase je lažni (127.0.0.1) → upit na colors tabelu pukne.
// Flat grana MORA da preživi: za 'lvt' i dalje vrati JSON (tarkettLvtData) boje, status 200.
describe('get-colors flat grana je otporna na Supabase pad', () => {
  it("lvt vraća 200 sa JSON bojama čak i kad Supabase padne", async () => {
    const r = await getColorsForCategory('lvt');
    expect(r.status).toBe(200);
    expect(Array.isArray(r.body?.colors)).toBe(true);
    // tarkettLvtData se dodaje bez obzira na Supabase → mora biti boja
    expect(r.body.colors.length).toBeGreaterThan(0);
    // bar jedna poznata LVT kolekcija iz JSON-a
    const colls = new Set(r.body.colors.map((c: any) => c.collection));
    expect(colls.has('modulart-70') || colls.has('id-inspiration-55')).toBe(true);
  });

  it("kategorija bez JSON izvora (otiraci) ne baca 500 nego 200 sa praznim", async () => {
    const r = await getColorsForCategory('otiraci');
    expect(r.status).toBe(200);
    expect(Array.isArray(r.body?.colors)).toBe(true);
  });
});
```

- [ ] **Step 2: Pokreni test — mora da padne**

Run: `npm run test:contract -- cenovnik-get-colors-resilient`
Expected: FAIL — trenutno `getColorsForCategory('lvt')` vraća `status 500` (Supabase upit pukne → spoljni catch).

- [ ] **Step 3: Učini flat granu ne-fatalnom**

U `lib/colors/get-colors.ts`, zameni flat granu (od `try {` na ~163 do `return {status:200...}` na ~245) ovako — Supabase upit u inner try/catch koji na grešku da prazne `flatColors`, pa JSON izvori (lvt) uvek prolaze:

```ts
    let flatColors: any[] = [];
    try {
        let query = supabase
            .from('colors')
            .select('*')
            .eq('category_slug', category);

        if (requestedCollection) {
            query = query.eq('collection_slug', requestedCollection);
        }

        const { data, error } = await query.order('collection_slug').order('code');

        if (error) {
            // Ne-fatalno: bez Supabase boja, ali JSON izvori (dole) i dalje prolaze.
            console.error('Colors API error (non-fatal):', error.message);
        } else {
            flatColors = ((data || []) as ColorRow[]).map((color) => ({
                collection: color.collection_slug,
                collection_name: color.collection_name,
                code: color.code,
                name: color.name,
                full_name: color.full_name,
                slug: color.slug,
                image_url: color.image_url,
                texture_url: color.texture_url,
                image_count: color.image_count || 0,
                lifestyle_url: color.lifestyle_url,
                welding_rod: color.welding_rod,
                dimension: color.dimension,
                format: color.format,
                overall_thickness: color.overall_thickness,
                description: color.description,
                specs: color.specs,
                collection_specs: color.collection_specs,
                characteristics: color.characteristics,
                brandId: '6',
            }));
        }
    } catch (err: any) {
        // getSupabase ili mreža pukla → ne-fatalno; JSON izvori i dalje prolaze.
        console.error('Colors table unavailable (non-fatal):', err?.message || err);
    }

    if (category === 'lvt') {
        const tarkettColors = (tarkettLvtData as TarkettProduct[]).map((product) => {
            const imageUrl = product.images?.[0] || '';
            const cleanName = (product.name || '')
                .replace(/^(Ess\d+-|iD\s*\d+-|Tarkett\s*)/i, '')
                .replace(/-0v$/i, '')
                .trim();

            return {
                collection: product.collection,
                collection_name: product.collection,
                code: product.id,
                name: cleanName,
                full_name: product.name,
                slug: product.id,
                image_url: imageUrl,
                texture_url: imageUrl,
                image_count: product.images?.length || 0,
                lifestyle_url: null,
                welding_rod: null,
                dimension: null,
                format: null,
                overall_thickness: product.specs?.total_thickness || null,
                description: product.description,
                specs: product.specs,
                collection_specs: null,
                characteristics: null,
                brandId: '3',
            };
        });

        flatColors = requestedCollection
            ? [...flatColors, ...tarkettColors.filter((color) => color.collection === requestedCollection)]
            : [...flatColors, ...tarkettColors];
    }

    return {
        status: 200,
        body: {
            total: flatColors.length,
            collections: Array.from(new Set(flatColors.map((color) => color.collection))).length,
            colors: flatColors,
        },
    };
```

> Spoljni `catch (err) { return {status:500,...} }` (linije ~246-249) OSTAJE kao poslednja brana, ali se sada ne aktivira na Supabase pad jer je upit u inner try/catch. NE menjati nested granu (`if (category in nestedCollectionsMap)`).

- [ ] **Step 4: Pokreni test — mora da prođe**

Run: `npm run test:contract -- cenovnik-get-colors-resilient`
Expected: PASS (oba testa).

- [ ] **Step 5: Pun suite (regresija boje-API)**

Run: `npm run test:contract`
Expected: sve zeleno (postojeći `color-api-contract` i ostali netaknuti).

- [ ] **Step 6: Commit**

```bash
git add lib/colors/get-colors.ts tests/contracts/cenovnik-get-colors-resilient.test.ts
git commit -m "fix(cenovnik): flat grana get-colors ne-fatalna na Supabase pad"
```

---

## Task 2: `tree.ts` — catalog-derived sloj + `existingPrice`

**Files:**
- Modify: `lib/cenovnik/tree.ts`
- Test: `tests/contracts/cenovnik-tree-contract.test.ts`

- [ ] **Step 1: Napiši failing test**

Create `tests/contracts/cenovnik-tree-contract.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { loadPriceEntryTree } from '@/lib/cenovnik/tree';

describe('cenovnik stablo — kompletnost iz kataloga', () => {
  it('uključuje brendove koji su ranije falili (Romus/Techem/TimberTech/BLOQ)', async () => {
    const tree = await loadPriceEntryTree();
    const byBrandId = new Map(tree.brands.map((b) => [b.brandId, b]));
    for (const id of ['13', '12', '10', '8']) {
      expect(byBrandId.has(id), `brand ${id} mora postojati u stablu`).toBe(true);
      expect((byBrandId.get(id)!.collections.length)).toBeGreaterThan(0);
    }
    // Romus = puno alatki
    expect(byBrandId.get('13')!.collections.length).toBeGreaterThan(100);
  });

  it('Romus stavke imaju pred-popunjenu cenu (existingPrice > 0)', async () => {
    const tree = await loadPriceEntryTree();
    const romus = tree.brands.find((b) => b.brandId === '13')!;
    const priced = romus.collections.filter((c) => typeof c.existingPrice === 'number' && c.existingPrice! > 0);
    expect(priced.length).toBeGreaterThan(100);
  });

  it('nema duplih slug-ova u stablu (dedup), ni po-boja ruta (?)', async () => {
    const tree = await loadPriceEntryTree();
    const all = tree.brands.flatMap((b) => b.collections.map((c) => `${c.categorySlug}:::${c.slug}`));
    expect(new Set(all).size).toBe(all.length);
    expect(all.some((k) => k.includes('?'))).toBe(false);
  });

  it('S3 Tarkett kolekcije i dalje prisutne (regresija)', async () => {
    const tree = await loadPriceEntryTree();
    const slugs = new Set(tree.brands.flatMap((b) => b.collections.map((c) => c.slug)));
    for (const s of ['tarkett-iq-motion', 'deal-spc-30', 'real-spc-50', 'modulart-70']) {
      expect(slugs.has(s), `${s} mora ostati u stablu`).toBe(true);
    }
  });
});
```

- [ ] **Step 2: Pokreni test — mora da padne**

Run: `npm run test:contract -- cenovnik-tree-contract`
Expected: FAIL — Romus/Techem/TimberTech/BLOQ nisu u stablu (prvi test pada).

- [ ] **Step 3: Dodaj `existingPrice` na tipove + uvezi `getProductsByCategory`**

U `lib/cenovnik/tree.ts`, dopuni import i interfejse:

```ts
import { getColorsForCategory } from '@/lib/colors/get-colors';
import { categories, brands } from '@/lib/data/mock-data';
import { getProductsByCategory } from '@/lib/utils/productDataLoader';

export interface CenovnikCollection {
    slug: string;
    name: string;
    categorySlug: string;
    categoryName: string;
    brandId: string;
    colorCount: number;
    existingPrice?: number;
}
```

I u internom interfejsu `RawCollection` dodaj `existingPrice?: number;`:

```ts
interface RawCollection {
    slug: string;
    name: string;
    categorySlug: string;
    categoryName: string;
    brandId: string;
    colorCount: number;
    existingPrice?: number;
}
```

- [ ] **Step 4: Dodaj `flatProductsForCategory` i integriši u `loadPriceEntryTree`**

U `lib/cenovnik/tree.ts`, dodaj funkciju (iznad `loadPriceEntryTree`):

```ts
// Catalog-derived sloj: proizvodi iz kataloga koji nisu već u stablu (po slug-u) i nisu
// po-boja rute (slug sa "?"). Svaki ulazi kao red bez boja (colorCount 0) pod svojim brendom.
// existingPrice = product.price (SA PDV-om, popunjeno samo gde katalog ima cenu, npr. Romus).
function flatProductsForCategory(
    category: { id: string; slug: string; name: string },
    existingSlugs: Set<string>,
): RawCollection[] {
    let products: any[] = [];
    try {
        products = getProductsByCategory(category.id) || [];
    } catch {
        return [];
    }
    const seen = new Set(existingSlugs);
    const out: RawCollection[] = [];
    for (const p of products) {
        const slug = String(p?.slug || '');
        if (!slug || slug.includes('?')) continue; // preskoči prazno i po-boja rute
        if (seen.has(slug)) continue;              // već u stablu (kolekcija-header / dr. izvor)
        seen.add(slug);
        const price = typeof p?.price === 'number' && p.price > 0 ? p.price : undefined;
        out.push({
            slug,
            name: String(p?.name || slug),
            categorySlug: category.slug,
            categoryName: category.name,
            brandId: String(p?.brandId || '6'),
            colorCount: 0,
            existingPrice: price,
        });
    }
    return out;
}
```

Zatim izmeni početak `loadPriceEntryTree` da spoji oba izvora po kategoriji (dedup po slug-u unutar kategorije):

```ts
export async function loadPriceEntryTree(): Promise<CenovnikTree> {
    const perCategory = await Promise.all(
        categories.map(async (category) => {
            const fromColors = await collectionsForCategory(category.slug, category.name);
            const existingSlugs = new Set(fromColors.map((c) => c.slug));
            const fromCatalog = flatProductsForCategory(
                { id: category.id, slug: category.slug, name: category.name },
                existingSlugs,
            );
            return [...fromColors, ...fromCatalog];
        })
    );

    const allCollections = perCategory.flat();
    // ... ostatak funkcije nepromenjen (grupisanje po brendu) ...
```

I u delu gde se gradi `item: CenovnikCollection` (unutar petlje po `allCollections`), dodaj `existingPrice`:

```ts
        const item: CenovnikCollection = {
            slug: collection.slug,
            name: collection.name,
            categorySlug: collection.categorySlug,
            categoryName: collection.categoryName,
            brandId: collection.brandId,
            colorCount: collection.colorCount,
            existingPrice: collection.existingPrice,
        };
```

> `categories` u `mock-data.ts` imaju `id`, `slug`, `name`. `flatProductsForCategory` koristi `category.id` za `getProductsByCategory`. Postojeći `collectionsForCategory` i grupisanje ostaju netaknuti.

- [ ] **Step 5: Pokreni test — mora da prođe**

Run: `npm run test:contract -- cenovnik-tree-contract`
Expected: PASS (sva 4 testa).

- [ ] **Step 6: Pun suite**

Run: `npm run test:contract`
Expected: sve zeleno.

- [ ] **Step 7: Commit**

```bash
git add lib/cenovnik/tree.ts tests/contracts/cenovnik-tree-contract.test.ts
git commit -m "feat(cenovnik): catalog-derived stablo + existingPrice (BLOQ/Romus/Techem/TimberTech)"
```

---

## Task 3: `prefill.ts` — pred-popuna + detekcija izmene (pure)

**Files:**
- Create: `lib/cenovnik/prefill.ts`
- Test: `tests/contracts/cenovnik-prefill-contract.test.ts`

- [ ] **Step 1: Napiši failing test**

Create `tests/contracts/cenovnik-prefill-contract.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { initialPricePair, isCollectionChanged } from '@/lib/cenovnik/prefill';
import { withVatToBase } from '@/lib/cenovnik/vat';

describe('cenovnik prefill', () => {
  it('initialPricePair: pred-popuni SA PDV-om, izračuna BEZ PDV-a', () => {
    const pair = initialPricePair(899);
    expect(pair.withVat).toBe('899');
    // 899 / 1.2 = 749.17 (zaokruženo), srpski format bez grupisanja
    expect(pair.base).toBe(String(withVatToBase(899)).replace('.', ','));
  });

  it('initialPricePair: bez cene → prazno', () => {
    expect(initialPricePair(undefined)).toEqual({ base: '', withVat: '' });
    expect(initialPricePair(0)).toEqual({ base: '', withVat: '' });
  });

  it('isCollectionChanged: bez baseline → svaki unos je izmena', () => {
    expect(isCollectionChanged({ base: '', withVat: '' }, undefined)).toBe(false);
    expect(isCollectionChanged({ base: '', withVat: '1000' }, undefined)).toBe(true);
  });

  it('isCollectionChanged: ista pred-popunjena vrednost → nije izmena', () => {
    expect(isCollectionChanged({ base: '', withVat: '899' }, 899)).toBe(false);
  });

  it('isCollectionChanged: drugačija vrednost → izmena', () => {
    expect(isCollectionChanged({ base: '', withVat: '950' }, 899)).toBe(true);
  });

  it('isCollectionChanged: prazno (očišćeno) → nije izmena (ne šalje null cenu)', () => {
    expect(isCollectionChanged({ base: '', withVat: '' }, 899)).toBe(false);
  });
});
```

- [ ] **Step 2: Pokreni test — mora da padne**

Run: `npm run test:contract -- cenovnik-prefill-contract`
Expected: FAIL — `Cannot find module '@/lib/cenovnik/prefill'`.

- [ ] **Step 3: Implementiraj `lib/cenovnik/prefill.ts`**

```ts
import { baseToWithVat, withVatToBase, parseNum, formatInput } from './vat';

export interface PricePair {
    base: string;
    withVat: string;
}

// Pred-popuni par cena iz postojeće cene SA PDV-om (katalog `price`, npr. Romus).
// "Sa PDV-om" = cena; "Bez PDV-a" = withVatToBase(cena). Prazno ako cene nema.
export function initialPricePair(existingPrice?: number): PricePair {
    if (typeof existingPrice !== 'number' || !(existingPrice > 0)) {
        return { base: '', withVat: '' };
    }
    return {
        base: formatInput(withVatToBase(existingPrice)),
        withVat: formatInput(existingPrice),
    };
}

// Da li je red promenjen u odnosu na pred-popunjenu cenu (SA PDV-om).
// Bez unosa → nije izmena. Bez baseline-a → svaki unos je izmena. Sa baseline-om →
// izmena samo ako se trenutna vrednost (SA PDV-om) razlikuje.
export function isCollectionChanged(current: PricePair, existingPrice?: number): boolean {
    const wv = parseNum(current?.withVat);
    const base = parseNum(current?.base);
    const cur = wv != null ? wv : base != null ? baseToWithVat(base) : null;
    if (cur == null) return false;
    if (typeof existingPrice !== 'number' || !(existingPrice > 0)) return true;
    return Math.abs(cur - existingPrice) > 0.001;
}
```

- [ ] **Step 4: Pokreni test — mora da prođe**

Run: `npm run test:contract -- cenovnik-prefill-contract`
Expected: PASS (svih 6).

- [ ] **Step 5: Commit**

```bash
git add lib/cenovnik/prefill.ts tests/contracts/cenovnik-prefill-contract.test.ts
git commit -m "feat(cenovnik): pure funkcije za pred-popunu cena + detekciju izmene"
```

---

## Task 4: `PriceEntryTable.tsx` — pred-popuna + submit samo izmenjeno

**Files:**
- Modify: `app/cenovnik/PriceEntryTable.tsx`

- [ ] **Step 1: Uvezi prefill funkcije i ukloni lokalni `PricePair`**

U `app/cenovnik/PriceEntryTable.tsx`, izmeni import blok (vrh fajla) — dodaj `prefill` import; ukloni lokalnu `interface PricePair` (linije ~21-24) i koristi onu iz `prefill.ts`:

```ts
import {
  VAT_RATE,
  parseNum,
  formatNum,
  formatInput,
  baseToWithVat,
  withVatToBase,
} from '@/lib/cenovnik/vat';
import { initialPricePair, isCollectionChanged, type PricePair } from '@/lib/cenovnik/prefill';
```

I obriši lokalnu deklaraciju:

```ts
interface PricePair {
  base: string;
  withVat: string;
}
```

- [ ] **Step 2: Inicijalizuj `collPrices` iz `existingPrice`**

Zameni `const [collPrices, setCollPrices] = useState<Record<string, PricePair>>({});` ovim (lenja inicijalizacija iz stabla):

```ts
  const [collPrices, setCollPrices] = useState<Record<string, PricePair>>(() => {
    const init: Record<string, PricePair> = {};
    for (const brand of tree.brands) {
      for (const c of brand.collections) {
        const pair = initialPricePair(c.existingPrice);
        if (pair.base || pair.withVat) init[collKey(c)] = pair;
      }
    }
    return init;
  });
```

- [ ] **Step 3: Šalji samo izmenjene kolekcije**

U `handleSubmit`, zameni uslov uključivanja kolekcije. Trenutno:

```ts
        if (base != null || withVat != null || overrides.length > 0) {
```

novim (koristi `isCollectionChanged` u odnosu na pred-popunjenu cenu):

```ts
        const changed = isCollectionChanged(cp || { base: '', withVat: '' }, c.existingPrice);
        if (changed || overrides.length > 0) {
```

> `base`/`withVat` (parsirane vrednosti) ostaju kako jesu i šalju se u payload kao i sad — menja se samo ODLUKA da li red ide. Pred-popunjene a nepromenjene cene se ne šalju (nema lažnih „izmena").

- [ ] **Step 4: Provera tipova/lint (bez novog testa — logika je pokrivena Task 3)**

Run: `npx tsc --noEmit` (ili `npm run lint`)
Expected: bez grešaka tipova u `PriceEntryTable.tsx` (PricePair sada iz `prefill.ts`, polja se poklapaju).

- [ ] **Step 5: Commit**

```bash
git add app/cenovnik/PriceEntryTable.tsx
git commit -m "feat(cenovnik): pred-popuni postojece cene + salji samo izmenjeno"
```

---

## Task 5: Pun gate + vizuelna provera + dokumentacija

**Files:** (bez izmena koda osim ako gate otkrije problem)

- [ ] **Step 1: Pun contract suite**

Run: `npm run test:contract`
Expected: sve zeleno (3 nova test fajla + postojeći).

- [ ] **Step 2: Build**

Run: `npm run build`
Expected: „✓ Compiled successfully".

- [ ] **Step 3: Vizuelna provera na dev-u**

Run: `npm run dev` (zaseban terminal). Otvori `http://localhost:3000/cenovnik`, uloguj se (podovi/online).
Proveri: (a) novi brendovi u stablu — **Romus**, **Techem**, **TimberTech**, **BLOQ**; (b) Romus alat: cene **pred-popunjene** (Sa PDV-om = katalog cena, Bez PDV-a auto); (c) izmena jedne Romus cene + „Pošalji na pregled" → poruka o uspehu (samo izmenjeno ide); (d) postojeći brendovi (Gerflor/Tarkett/Wolflor/Podovi) i kolekcije-sa-bojama rade kao i pre. Ugasi `npm run dev` posle (ne ostavljati proces).

- [ ] **Step 4: Ažuriraj memoriju**

U `C:\Users\BORIVOJE\.claude\projects\C--GitHub-Repository-for-podovi\memory\podovi-cenovnik-kompletnost.md`: označi kao IMPLEMENTIRANO (catalog-derived stablo + pred-popuna Romus + ne-fatalna flat grana); zadrži pokazivače na [[podovi-cenovnik-stranica]].

- [ ] **Step 5: Finalni pregled + deploy odluka (vlasnik)**

Run: `git log --oneline -6` i `git status`. Sažmi promene. Deploy (`push main`) ostaje ručna odluka vlasnika.

---

## Self-Review

**1. Spec coverage:**
- §4.1 stablo iz kataloga → Task 2 (`flatProductsForCategory` + integracija). ✅
- §4.2 tip `existingPrice` → Task 2 Step 3. ✅
- §4.3 pred-popuna „Sa PDV-om" + obaveštenje na izmenu → Task 3 (pure) + Task 4 (wiring). ✅
- §4.4 ne-fatalna flat grana → Task 1. ✅
- §7 contract testovi → Task 1/2/3 testovi; gate Task 5. ✅
- §8 laminat van obima (0 proizvoda) — `flatProductsForCategory` na praznu listu vrati []; bez posebnog koda. ✅
- §9 dedup tekstil (skip `?` + skip postojeće slug-ove) → Task 2 `flatProductsForCategory` + test „nema duplih/`?`". ✅

**2. Placeholder scan:** Nema „TBD"/„handle edge cases". Sav kod kompletan (get-colors flat grana cela, tree integracija cela, prefill cela, table izmene cele). Brojevi/pravila iz dokaza.

**3. Type/ime konzistentnost:**
- `existingPrice?: number` isto u `CenovnikCollection` (Task 2) i čita se u Task 4 (`c.existingPrice`) i Task 3 testu. ✅
- `PricePair {base,withVat}` definisan u `prefill.ts` (Task 3), uvezen u `PriceEntryTable` (Task 4) — polja `base`/`withVat` se poklapaju sa postojećim korišćenjem. ✅
- `initialPricePair`/`isCollectionChanged` — potpisi isti u Task 3 (impl+test) i Task 4 (poziv). ✅
- `flatProductsForCategory(category, existingSlugs)` — definisan i pozvan u Task 2 sa istim argumentima. ✅
- dedup pravilo (skip `?`, skip existingSlugs) konzistentno sa testom „nema `?` ni duplih". ✅
