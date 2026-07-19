# /parket/essence — Essence Premium konfigurator parketa po meri

> Datum: 2026-06-17
> Status: dizajn odobren u brainstormingu sa vlasnikom
> Povezano: [[podovi-galerija-redizajn-stanje]], [[vlasnik-nacin-rada]]

## 1. Kontekst i cilj

Alpod ima konfigurator „Essence" (`alpod.rs/kolekcija-parketa-essence/`) — biranje parketa po meri u 4 koraka koje na kraju **ne pravi jednu kombinovanu sliku**, nego skupi izbore i ubaci ih u formu za ponudu. Vlasnik želi isti princip na podovi.online, ali kao **wizard (korak po korak)**: klik na opciju vodi na sledeći korak, a na kraju se dobije „finalni proizvod" sa dugmetom za ponudu.

Stvarno stanje u bazi (`public/data/alpod_floor_collections.json` → `collections[11]`, „Essence Premium"):
- ✅ **19 uzoraka** već uvezeno kao `colors[]` (svaki sa `image`/`lifestyle_url`/`texture_url`, `code` ESS-01..ESS-19), grupisani po familiji (`characteristics.Podkolekcija`): Rhombus (6), Trapezium (3), Mosaic (2), Waves (4), Forest (4).
- ⚠️ **Boje (20), Gradacije (3), Obrade (4)** postoje samo kao tekst u `characteristics` (`Gradacija`, `Površina`) — **bez slika**. Slike postoje na alpod stranici i skidaju se istim mehanizmom kao ostatak kataloga.

Koraci su **nezavisni** (izbor uzorka ne filtrira boje — potvrđeno na alpodu).

## 2. Donete odluke (brainstorming)

| Pitanje | Izbor |
|---|---|
| URL / mesto | `/parket/essence`, povezano dugmetom iz kategorije Parket i sa Essence kolekcije |
| Tok | **Wizard, korak po korak** — klik na opciju → auto-prelaz na sledeći korak; „Vaš izbor" stalno sa strane |
| Finalni proizvod | **Sažetak izbora + „Zatraži ponudu"** (slika uzorka, 4 izbora, generisan naziv + šifra, crno dugme → `/upiti` već popunjen). Bez kombinovanog rendera, bez cene (cena = moguća Faza 2) |
| Slike koraka 2–4 | **Skinuti prave slike sa alpod.rs** (Supabase upload, isti folder kao ostalo); fallback na ton+naziv ako slika fali |
| Brend | Ostaje **Podovi** (kao i ostatak uvezenog kataloga) |

## 3. Arhitektura (jedinice i odgovornosti)

### 3.1 Podaci — skreper (`tools/`)
Proširiti postojeći `tools/extract_alpod_floor_collections.js` (ili novi `tools/extract_essence_configurator_axes.js`) da sa Essence stranice skine **20 boja + 3 gradacije + 4 obrade** (naziv + slika), upload-uje slike na Supabase `product-images/products/alpod-migrated/essence/...` (flag `--upload-supabase` kao i ostali alat), i upiše ih u data fajl pod **novim ključem** `collections[11].essenceAxes`:
```
essenceAxes: {
  colors:     [{ code, name, image }, …20],
  gradations: [{ code, name, image }, …3],
  surfaces:   [{ code, name, image }, …4]
}
```
Uzorci se NE dupliraju — i dalje žive u `collections[11].colors[]`. Plan mora prvo da **pregleda stvarni HTML** alpod stranice (da li su slikice `<img>` ili CSS background, koji su tačni URL-ovi) pre pisanja skrepera.

### 3.2 Tipizovan loader (`lib/data/essence-configurator.ts`)
Jedna granica prema UI-ju:
```
type EssenceOption   = { code: string; name: string; image: string | null; family?: string }
type EssenceConfiguratorData = {
  patterns: EssenceOption[];   // iz collections[11].colors[] (+ family iz characteristics.Podkolekcija)
  colors: EssenceOption[];     // iz essenceAxes.colors
  gradations: EssenceOption[]; // iz essenceAxes.gradations
  surfaces: EssenceOption[];   // iz essenceAxes.surfaces
}
getEssenceConfiguratorData(): EssenceConfiguratorData
```
Ako `essenceAxes` fali ili je nepotpun → vrati prazne/parcijalne nizove (ne baca); UI tu granu degradira na ton+naziv pločice.

### 3.3 Stranica (`app/parket/essence/page.tsx`) — server component
- `metadata` (title/description, OG), breadcrumbs (Parket → Essence Premium).
- `getEssenceConfiguratorData()` → prosledi `<EssenceConfigurator data={…} />`.
- (Opciono, van obima: `app/parket/page.tsx` redirect na `/kategorije/parket` da `/parket` ne baca 404.)

### 3.4 Wizard (`components/configurator/EssenceConfigurator.tsx`) — `"use client"`
- Stanje: `{ uzorak, boja, gradacija, obrada }` (svako `EssenceOption | null`) + `activeStep`.
- Renderuje **stepper** (4 koraka, aria-current, ✓ na završenom), aktivni `ConfiguratorStep`, i `ConfiguratorSummary`.
- Klik na opciju → set izbor → auto-prelaz na prvi nepopunjen korak; stepper dozvoljava ručnu navigaciju nazad/napred.
- Kad su sva 4 popunjena → gradi `/upiti` link (3.6).

### 3.5 Korak (`components/configurator/ConfiguratorStep.tsx`) — prezentaciona, reused za sva 4 koraka
- Props: `items: EssenceOption[]`, `selected`, `onSelect`, `label`.
- Mreža `<button>` pločica (Next/Image kad ima `image`; ton+naziv fallback kad `image === null`). Selektovano = 2px crni okvir + ✓. Tastatura/fokus pristupačno.

### 3.6 Sažetak + finalni proizvod (`components/configurator/ConfiguratorSummary.tsx`)
- „Vaš izbor": 4 reda (Uzorak/Boja/Gradacija/Obrada) sa vrednošću ili „—", + brojač x/4.
- Kad kompletno → kartica „finalni proizvod": slika uzorka (lifestyle), naziv **„Essence Premium {uzorak}"**, linija **„{boja} · {gradacija} · {obrada}"**, deterministička **šifra** `{pattern.code}-{color.code}{grad.code}{surface.code}` (gradacija E/N/S, obrada B/Č/H/P — npr. `ESS-01-C03EB` = Rhombus Diamond Regular · boja C03 · Elegant · Brušeno), i crno dugme **„Zatraži ponudu"**.

### 3.7 Integracija sa upitom (`components/ContactForm.tsx` + `/upiti`)
- Dugme „Zatraži ponudu" → `/upiti?konfigurator=essence&uzorak=…&boja=…&gradacija=…&obrada=…&naziv=…&sifra=…` (uskladiti sa **postojećim** ContactForm prefill mehanizmom — plan mora pročitati `ContactForm.tsx` i proširiti minimalno).
- ContactForm prikaže read-only blok „Vaša konfiguracija" (4 stavke + šifra) i uključi ih u telo mejla, da prodaja zna tačno šta je traženo.

## 4. Data flow
1. (jednokratno/po potrebi) skreper → `essenceAxes` + Supabase slike.
2. `getEssenceConfiguratorData()` (server) → patterns + 3 ose.
3. `EssenceConfigurator` (client) → wizard izbor → finalni proizvod.
4. „Zatraži ponudu" → `/upiti` prefilovan → postojeći tok mejla (Nodemailer/Resend) + `inquiries` tabela.

## 5. Stil i mobilni
- „Galerija" jezik: monohromatski (`ink`), bez zaobljenja, bez senki, hairline linije, crno CTA dugme (kao ostatak sajta).
- Slike sa Supabase hosta — host je već dozvoljen u `next.config.mjs` (postojeći katalog ih koristi); potvrditi.
- Mobilni: stepper kompaktan/horizontalno skrolabilan; „Vaš izbor" postaje sticky traka na dnu (progres + CTA kad je kompletno), tap proširuje.

## 6. Error handling
- `essenceAxes` fali/parcijalan → loader vrati prazno/parcijalno; korak degradira na ton+naziv (ne-fatalno).
- Slika opcije ne učita → `<img>` fallback na ton+naziv (isti vizuelni jezik kao mockap).
- Nepotpun izbor → finalni proizvod skriven, CTA neaktivan; jasan x/4 indikator.
- Skreper: ako neka osa ne može da se sparsira sa alpoda → upiše šta može, ostalo prazno (UI i dalje radi).

## 7. Testiranje (gate)
1. Novi shape/contract test (`tests/contracts/essence-configurator-contract.test.ts`):
   - `getEssenceConfiguratorData()` → 19 patterns, 20 colors, 3 gradations, 4 surfaces.
   - Svaki pattern ima `code` + `family`; svaka osa ima `code` + `name`.
   - Graciozno na nedostajuće slike (`image` sme biti `null`, ne baca).
2. Postojeći `npm run test:contract` zelen (alpod snapshot — `essenceAxes` ne sme da obori postojeće; snapshot ažurirati namerno).
3. `npm run build` zelen. (Napomena: `validate:images` proverava **lokalne** putanje; Supabase remote slike nisu lokalni fajlovi → nisu pokrivene tim validatorom — pokriti tačkom 4.)
4. Vizuelno na dev-u (Playwright dostupan): proći sva 4 koraka, proveriti finalni proizvod, klik „Zatraži ponudu" → `/upiti` popunjen tačnom konfiguracijom; mobilni prikaz.

## 8. Šta NIJE u obimu
- Kombinovani „živi" render po kombinaciji uzorak×boja (nema 380 slika; odbačeno).
- Cena u konfiguratoru (izabrano A; moguća kasnija faza nakon definisanja izvora cena).
- Tip drveta (hrast/orah) kao 5. korak (alpod ima 4 koraka; podatak postoji ali YAGNI sada).
- `/parket` index stranica (samo `/parket/essence`; opcioni redirect kasnije).

## 9. Rizici i ublažavanje
- **Skrejp osa sa alpoda:** markup boja/gradacija/obrada se mora potvrditi na stvarnoj stranici pre pisanja skrepera; fallback na ton+naziv drži feature isporučivim i ako neke slike padnu.
- **Rast 5MB data fajla + alpod contract snapshot:** dodavanje `essenceAxes` mora svesno da ažurira postojeći snapshot; ne menjati oblik `colors[]` (uzoraka).
- **Supabase upload:** skreper sa `--upload-supabase` traži `SUPABASE_SERVICE_ROLE_KEY` u env (postojeći obrazac); pokreće se jednokratno.
- **Prefill ugovor sa ContactForm:** ne izmišljati nove parametre naslepo — pročitati postojeći prefill u `ContactForm.tsx` i proširiti ga minimalno.
