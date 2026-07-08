# 📋 Dnevni pregled proizvoda — evidencija

> **Pravilo vlasnika (08.07.2026):** proizvode usavršavamo jedan po jedan, **jedan dnevno**. Svaki pregled obuhvata: (1) naš prikaz na podovi.online (galerija, opis, specifikacije, dokumentacija, kartica na listingu, SEO), (2) izvorni sajt sa kog su podaci došli (alpod.rs, Tarkett, Romus...) — izvor svih informacija, (3) sajt proizvođača ako postoji. Cilj: predložiti i sprovesti unapređenja sadržaja i prikaza — **bez menjanja dizajn jezika sajta** (minimalizam, ink/hairline — unapređenja prate postojeći dizajn).
>
> **Obavezno:** pre početka pregleda proveri ovu tabelu da se proizvod ne pregleda dva puta. Posle pregleda upiši red u tabelu i dodaj sekciju sa nalazima.

## Evidencija

| # | Datum | Proizvod (slug) | Kategorija | Status |
|---|-------|-----------------|------------|--------|
| 1 | 2026-07-08 | podovi-parket-admonter | Parket | ✅ Pregledan + IMPLEMENTIRANO (nalazi #1–#6, #8–#14; zvanični materijal uvezen; brend Admonter) |

---

## #1 — Admonter (parket, 21 boja) — 2026-07-08

- **Naša strana:** /proizvodi/podovi-parket-admonter
- **Izvor:** https://www.alpod.rs/parketi/admonter/ (Alpod Store API import)
- **Proizvođač:** Admonter (Austrija) — admonter.com (gradacija „noblesse" = deo Oak familije: admonter.com/en/product/wooden-floor-oak/)

### Nalazi — bugovi (sistemski, važe za svih 13 Alpod kolekcija)

1. **Dupli redovi specifikacija sa `?color=`** — 20 od 25 labela se prikazuje 2× (agregat kolekcije + vrednost boje) jer dva različita algoritma prave spec key: `characteristicLabelToKey` (productDataLoader.ts:129, underscore + skida dijakritike) vs `toSpecKey` (color-helpers.ts:84, crtica + zadržava rupe: „Habajući sloj"→`habaju-i-sloj`). Fix: ujediniti na jednu funkciju.
2. **Polomljeni decimalni zarezi u agregaciji** — „Habajući sloj: 3, 6, 2, 5" (u stvari 3,6 i 2,5 mm), „Toplotna otpornost: 0, 067, 098, 107". Agregacija splituje po zarezu unutar decimalnih brojeva. + širine nesortirane (120, 192, 162, 158, 138).
3. **Dupla labela dekora** — „Dekor / Vrsta drveta" i „Vrsta drveta / dekor" kao dva reda iste vrednosti (normalizeAlpodSpecs dodaje wood_type sa drugom labelom, productDataLoader.ts:456–475).
4. **Galerija gubi 2/3 slika** — 20/21 boja ima 2–3 slike u `images[]` (uklj. ambijentalne!), ali `mapNestedCollectionColors` (prepare-colors.ts:34–68) prosleđuje samo `image_url` → strelice galerije se nikad ne aktiviraju. PAŽNJA: slike 2 i 3 hotlinkuju www.alpod.rs — treba ih migrirati u Supabase pre prikaza.
5. **Duplikat-slike među varijantama** — ADMOAK-EL3065/EL3045 i EL3064/EL3043 dele isti fajl slike. ⚠️ ISPRAVKA (mapiranje 08.07.2026): to NISU duplikati nego **različite dimenzije daske istog dekora** (Oak elegance lock-it: 158×2000 / 192×2000 / 192×2400 mm — potvrđeno zvaničnim Admonter PDF-om). Pravi fix: prikazati dimenziju u nazivu/caption-u varijante, ne uklanjati „duplikat".
6. **`coveragePerPackage` se gubi** — opis svake boje sadrži „(1,5840 m2)" ali se ne parsira; `FlooringCalculator.tsx` postoji ali NIJE montiran ni na jednoj strani (mrtva komponenta).
7. **Performanse** — PDP eager-renderuje po 1 full-size sliku za SVAKU boju (Admonter 21, Artisan 142, Winflex 221); swatch grid koristi full-size umesto `variants.thumb` 345×345.
8. **Slovenački ostatak** — „EC OLJE" umesto „EC ULJE" kod ONDFRI/ONDKAR SKU-ova.

### Nalazi — sadržaj/prikaz

9. **Kolekcija nema svoju sliku** (vlasnikova primedba ✓) — `collection_image_url` u JSON-u = slika prve boje, za 12/13 Alpod kolekcija. Susedne Tarkett kartice imaju ambijentalne fotografije. **Rešenje postoji:** Alpod ima kolekcijski baner `cdn.alpod.rs/wp-content/uploads/2024/03/parket_Admonter.webp`, a Admonter ima room-shot fotografije po dekoru.
10. **ERP šifre kao naslovi** — H1 = „DGP HRAST NOBLESSE ČETKAN EC ULJE"; DGP/TGP/EC/5G/ČTK ništa ne znače kupcu. Treba rečnik skraćenica → „Hrast Noblesse — četkan, EC ulje" (šifra kao sitni sekundarni red).
11. **Opis = red iz cenovnika** — „ADMONTER FLOORS 10/3,6x120x1200 mm (1,5840 m2)". Treba: pravi opis kolekcije (Admonter/Austrija/troslojni/ulje) + parsirane stavke „Pakovanje: 1,584 m²", „Format: 10×120×1200 mm" + opis gradacije („noblesse — praktično bez čvorova, mirna slika drveta, bez beljike" — sa admonter.com).
12. **Selektor boja bez imena i grupisanja** — 21 skoro identičan svoč bez naziva; podaci već sadrže linije (Noblesse/Basic/Elegance/Stone/Vivid/Wild/Orah) i obradu (ulje/mat lak) — grupisati modal + caption sa imenom boje.
13. **Brend na kartici = „PODOVI" umesto „ADMONTER"** — Admonter je tretiran kao kolekcija brenda Podovi (displayBrand iz importa).
14. **Nema dokumentacije** — Alpod nema prave PDF-ove (generiše ih iz tabele), ali proizvođač ima sve (verifikovani URL-ovi): Data-sheets-Oak.zip, Wooden-floor-Oak_EN.pdf, PEFC/EPD/Ecolabel sertifikati, uputstva za održavanje/ugradnju/podno grejanje/kupatilo, garancija 30 god.
15. **Neprevedene vrednosti** — „Podkolekcija: hardwood", „Sistem montaže: LOCK-IT", „Gradacija: AB" bez objašnjenja; pribor sa engleskim kategorijama (Wall base, Care & Cleaning) i delom nerelevantan za uljeni parket (vinil trake).
16. **SEO** — title sa šifrom na prvom mestu („ADMOAK-N02020 DGP HRAST..."); 21 boja = 21 kanonska skoro identična strana (thin content rizik); og:image lista sadrži 2 URL-a sa alpod.rs.

### Šta izvor/proizvođač imaju a mi ne (gap)

- Room-shot fotografije po dekoru (Admonter webshop „Raumbild" + referenzen) — mi imamo samo teksture
- Šabloni polaganja kao ilustracije (Wild Bond, Twin, Chevron... — PNG-ovi na admonter.com)
- Vizuelizator „Admonter Wohnwelten" — može se linkovati sa naše strane
- Brend storytelling (austrijski manastir Admont, održivost, PEFC)
- Alpod cena: 12.240 RSD/m² (−22% = 9.547 RSD/m²) — orijentir za naš cenovnik

### Predlog prioriteta (čeka odluku vlasnika)

- **Brzo (bugovi u kodu):** dupli specovi (#1), polomljeni decimali (#2), dupla labela (#3), coveragePerPackage + kalkulator (#6), OLJE→ULJE (#8)
- **Srednje (podaci + kod):** galerija svih slika uz migraciju u Supabase (#4, #5), kolekcijska slika sa Alpod banera (#9), rečnik ERP skraćenica (#10), parsiran opis (#11), grupisan selektor boja (#12)
- **Traži odluku/kontakt:** brend Admonter vs Podovi (#13), mejl Alpodu/Admonteru za zvanični foto-paket + dozvolu (najčistiji put za room-shot slike), PDF dokumentacija sa admonter.com (#14), SEO canonical strategija (#16)

### Dopuna 08.07.2026 (2) — References = slike kolekcija ✅

Vlasnik pokazao References sekciju na admonter.com/en/product/wooden-floor-oak/ — **referentne fotografije proizvođača postaju slike kolekcija**. Primarna slika Admonter kolekcije = „Parquet Oak" referenca (dnevna soba, DSF9790), + 6 galerijskih (uklj. kuhinju). Referenca „oak-private-home-germany-2" preskočena (fajlovi nose `copyright-BerschneiderBerschneider` — potpisani fotograf). Sve migrirano u naš Supabase (`products/admonter-official/`), 121 asset ukupno, 0 grešaka. Pravilo upisano u AGENTS.md t.11.

### Dopuna 08.07.2026 — mapiranje na zvanične materijale ✅

Vlasnik potvrdio pravilo (AGENTS.md t.11): asortiman = Alpod, materijal = admonter.com. Urađeno kompletno mapiranje svih 21 dekora → **[docs/admonter-materijali.md](admonter-materijali.md)**: 20/21 mapirano (jedini izuzetak ADMOAK-WL3010 „Oak Wild" — ukinut dekor, ne postoji više na sajtu proizvođača), 63 verifikovana URL-a slika (teksture persp/frontal + room-shot), zvanični opisi gradacija, brend intro, PDF-ovi (Oak/Walnut/Frijo/Kari datasheet, nega, garancija, PEFC/EPD), šabloni polaganja. Dešifrovano: EC ULJE = „natur geölt easy care", SB = Softwood-Backing, ONDFRI/ONDKAR = ugašena OndO linija (dekori Frijo/Kari žive u glavnom programu). Napomena: mat-lak artikli koriste fotografiju uljane verzije (proizvođač ne fotografiše lak zasebno).
