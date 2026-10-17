# Feature Specification: Filteri na početnoj strani i brzina sajta

**Feature Branch**: `claude/home-filters-speed`

**Created**: 2026-10-17

**Status**: Draft

**Input**: User description: "Filteri na početnoj strani Podovi kataloga — ozbiljno poboljšanje i proširenje: brzi i jasni filteri na telefonu i desktopu, brojači koji tačno odgovaraju rezultatima, kombinovanje više filtera, stanje u URL-u, i mnogo više opcija iz stvarnih spec podataka proizvoda (brend, tip/kategorija, namena/klasa upotrebe, dezen, ton/boja, format, debljina, sloj habanja, ugradnja, protivklizna klasa, akustika, podno grejanje, cena gde postoji). Novi brendovi i grupe (npr. SCHÖNOX, Pribor) moraju automatski ulaziti iz podataka. Ne izmišljati vrednosti koje podaci nemaju. Uz to: ubrzati početnu stranu i PDP (manje JSON-a i JS-a na klijentu, keširanje/statička generacija, slike) uz merenje pre/posle."

## Kontekst (stanje pre izmene, izmereno 17.10.2026)

- Početna strana je jedini katalog sajta (stranice `/kategorije/*` više ne postoje), pa su njeni filteri glavni alat za pronalaženje proizvoda.
- Bez izabrane kategorije panel nudi samo: Kategorija, Primena (2 opcije pogođene iz slobodnog teksta opisa), Debljina (mešano preko svih kategorija) i Brend. Bogatije grupe (klasa, dezen, ton, ugradnja…) postoje samo za vinil, parket, LVT, laminat i otirače, i pojavljuju se tek kad se izabere tačno ta kategorija.
- „Primena" se određuje pretragom reči u opisu (npr. „stan", „objek"), pa brojevi ne odgovaraju stvarnim osobinama proizvoda.
- Živa početna strana šalje oko 6,2 MB HTML-a (≈430 KB komprimovano), ne kešira se (`no-store`) i do prvog bajta treba oko 2,7 s; prve slike kartica se učitavaju „lenjo".
- Stranica proizvoda (PDP) se takođe generiše na svaki zahtev (≈2,7 s do prvog bajta), a server funkcije rade u SAD (iad1) dok je baza u Evropi.

## Clarifications

### Session 2026-10-17

Pregled nejasnoća nije našao pitanje koje blokira rad: sve tačke imaju bezbednu, lako promenljivu podrazumevanu vrednost. Vlasniku nisu postavljena pitanja; ispod su odluke koje važe dok ih vlasnik ne promeni (navedene i u završnom izveštaju):

- Podrazumevano: kašnjenje cena na karticama početne strane posle izmene u bazi je najviše 5 minuta (+ prvi posetilac posle isteka može dobiti prethodnu verziju dok se nova generiše); stranica proizvoda ostaje uvek sveža. Promena na drugu vrednost je jedna linija koda.
- Podrazumevano: „Namena" se izvodi iz klase upotrebe po EN ISO 10874 (21–23 stambeni, 31–34 komercijalni, 41–43 industrijski) i iz eksplicitne namene „eksterijer/spoljašnja upotreba" (Spoljašnji); proizvod bez takvog podatka nema Namenu.
- Podrazumevano: grupa Cena se prikazuje tek kad trenutni skup ima bar dva proizvoda sa cenom; proizvodi „Cena na upit" tada nisu u rezultatu i to piše uz grupu.
- Podrazumevano: server funkcije prelaze u region Frankfurt (fra1) jer je baza u Evropi; stupa na snagu tek kada vlasnik objavi.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Sužavanje celog kataloga po stvarnim osobinama (Priority: P1)

Kupac (stambeni ili poslovni) dolazi na početnu stranu i, bez prethodnog biranja kategorije, sužava katalog po osobinama koje ga zanimaju: brend, kategorija, namena (stambeni/komercijalni/industrijski prostor), klasa upotrebe, način ugradnje, dezen, ton/boja, format, debljina, sloj habanja, zvučna izolacija, protivkliznost, požarna klasa, podno grejanje i cena (gde postoji). Svaka opcija prikazuje tačan broj proizvoda koje će dobiti.

**Why this priority**: To je suština zahteva vlasnika — filteri su glavni put do proizvoda, a sada su siromašni i netačni.

**Independent Test**: Na početnoj strani, bez izabrane kategorije, izabrati „Klik" u grupi Ugradnja i „33" u Klasi upotrebe; broj kartica u mreži mora biti jednak broju koji je stajao uz poslednje kliknutu opciju, a sve kartice moraju zaista imati te osobine u svojim specifikacijama.

**Acceptance Scenarios**:

1. **Given** početna strana bez filtera, **When** kupac otvori panel filtera, **Then** vidi grupe za sve osobine koje postoje u podacima (najmanje: Kategorija, Brend, Namena, Klasa upotrebe, Ugradnja, Dezen, Format, Debljina, Sloj habanja, Podno grejanje) — bez potrebe da prvo bira kategoriju.
2. **Given** bilo koje stanje filtera, **When** kupac pogleda broj uz neizabranu opciju, **Then** taj broj je tačno broj rezultata koji će se prikazati kada klikne samo tu opciju u toj grupi (uz ostale aktivne grupe).
3. **Given** izabrane dve opcije u istoj grupi (npr. Klik i Lepljenje), **When** se primeni filter, **Then** rezultat je unija (ILI) unutar grupe, a presek (I) između različitih grupa.
4. **Given** opcija sa 0 rezultata u trenutnom stanju, **When** kupac pogleda listu, **Then** opcija je posivljena i ne može se izabrati (izabrana opcija se nikad ne zaključava — uvek se može skinuti).
5. **Given** grupa koja u trenutnom skupu ima manje od dve različite vrednosti, **When** se panel prikaže, **Then** ta grupa se ne prikazuje (nema mrtvih grupa).

---

### User Story 2 - Filteri koji su jasni i brzi na telefonu (Priority: P1)

Kupac na telefonu otvara filtere jednim dodirom, menja izbor, vidi živ broj rezultata na dugmetu „Prikaži N rezultata", zatvara fioku i vidi rezultat; aktivni filteri su vidljivi kao čipovi koji se skidaju jednim dodirom.

**Why this priority**: Većina posetilaca kataloga dolazi sa telefona; filter koji je spor ili nepregledan na telefonu ne pomaže.

**Independent Test**: Na ekranu širine 390 px otvoriti filtere, izabrati dve opcije iz različitih grupa, proveriti da dugme pokazuje isti broj koji se posle zatvaranja vidi u mreži, i da svaka promena reaguje bez primetnog kašnjenja.

**Acceptance Scenarios**:

1. **Given** telefon, **When** kupac dodirne dugme „Filteri" iznad rezultata ili u zaglavlju, **Then** otvara se fioka sa istim grupama kao na desktopu, a dugme pokazuje broj aktivnih filtera.
2. **Given** otvorena fioka, **When** kupac menja izbor, **Then** broj na dugmetu „Prikaži N rezultata" se ažurira odmah i jednak je broju kartica posle zatvaranja.
3. **Given** dugačke grupe (npr. kolekcije, brendovi), **When** se prikažu, **Then** vide se prve opcije, izabrane uvek ostaju vidljive, a ostatak je iza „Prikaži još"; dugačke liste imaju pretragu.
4. **Given** mnogo grupa, **When** se panel prikaže, **Then** manje bitne grupe su sklopljene, a naslov sklopljene grupe pokazuje koliko je u njoj izabrano.

---

### User Story 3 - Deljiv i trajan izbor (URL) (Priority: P2)

Kupac ili prodavac podesi filtere i pošalje link; primalac otvara isti izbor. Osvežavanje strane, Nazad i Napred vraćaju tačno stanje filtera.

**Why this priority**: Prodaja šalje kupcima linkove sa izborom; postojeći linkovi ne smeju da se pokvare.

**Independent Test**: Podesiti tri filtera, kopirati adresu, otvoriti je u novom prozoru — isti filteri i isti broj rezultata; dugme Nazad vraća prethodno stanje.

**Acceptance Scenarios**:

1. **Given** podešeni filteri, **When** se adresa otvori u novom prozoru, **Then** prikazuje se isti izbor i isti broj rezultata.
2. **Given** stari link u formatu od 11.07.2026 (`category=`, `brand=`, `facet=kategorija::grupa::vrednost`, `thicknessMin/Max`), **When** se otvori, **Then** i dalje radi i prikazuje odgovarajući izbor.
3. **Given** adresa sa nepoznatim ili nevažećim vrednostima, **When** se otvori, **Then** nevažeće vrednosti se tiho odbacuju (bez praznog kataloga zbog „fantomskog" filtera), a nepovezani parametri u adresi ostaju netaknuti.

---

### User Story 4 - Novi brendovi i grupe ulaze sami (Priority: P2)

Kada se katalogu doda novi brend ili grupa proizvoda (npr. SCHÖNOX u grupi „Pribor"), on se automatski pojavljuje u filterima Kategorija i Brend, sa tačnim brojevima, a postojeće opšte grupe (tip proizvoda, ugradnja, format…) rade nad njegovim proizvodima bez dodatnog posla, ukoliko podaci imaju te osobine.

**Why this priority**: Vlasnik je postavio pravilo „katalog i filteri rastu zajedno"; paralelno se uvodi SCHÖNOX (135 proizvoda).

**Independent Test**: Dodati test-proizvod novog brenda u novoj kategoriji kroz postojeći tok podataka; bez izmene filter koda pojavljuje se u Kategoriji i Brendu sa brojem 1, i u opštim grupama za osobine koje ima.

**Acceptance Scenarios**:

1. **Given** novi brend u podacima, **When** se početna strana ponovo generiše, **Then** brend je u grupi Brend sa tačnim brojem.
2. **Given** nova kategorija u podacima, **When** se početna strana ponovo generiše, **Then** kategorija je u grupi Kategorija, a opšte grupe (Tip proizvoda, Ugradnja, Format, Debljina…) pokazuju vrednosti njenih proizvoda ako ih imaju.

---

### User Story 5 - Brža početna strana i stranica proizvoda (Priority: P2)

Posetilac otvara početnu stranu i stranicu proizvoda znatno brže nego pre, posebno na telefonu i slabijoj mreži.

**Why this priority**: Vlasnik je tražio ubrzanje gde god realno pomaže; 6 MB HTML-a i 2,7 s čekanja direktno odbijaju posetioce i štete SEO-u.

**Independent Test**: Izmeriti istim postupkom pre i posle (veličina HTML-a i JS-a, vreme do prvog bajta, LCP/CLS/TBT) na početnoj i jednoj stranici proizvoda; rezultati su u izveštaju.

**Acceptance Scenarios**:

1. **Given** posle izmene, **When** se izmeri početna strana, **Then** prenos HTML-a je bar 5 puta manji nego pre, a strana se servira iz keša.
2. **Given** posle izmene, **When** se izmeri početna strana na simuliranom telefonu, **Then** prve kartice (najveći sadržaj) se učitavaju prioritetno, a LCP je bolji nego pre.
3. **Given** posle izmene, **When** se otvori stranica proizvoda, **Then** cene i prikaz ostaju tačni kao pre (bez zastarelih cena), a vreme do prvog bajta nije gore nego pre.

---

### Edge Cases

- Proizvod nema podatak za neku grupu: u tabu „Kolekcije" ne prolazi taj filter (strogo); u tabu „Boje" ostaje vidljiv ako ni njegova kolekcija nema podatak (bolje lažno uključen nego pogrešno sakriven — postojeće pravilo).
- Kolekcija nema podatak, a njene boje imaju (npr. LVT klasa postoji samo na bojama): kolekcija nasleđuje uniju vrednosti svojih boja; boja bez podatka nasleđuje vrednost kolekcije.
- Ista vrednost zapisana različito („2 mm", „2.0 mm", „2,00 mm"; „Glue down", „Lepljenje"; „34 Very Heavy", „Klasa 34/43"): svodi se na jednu kanonsku vrednost.
- Vrednost koju ne umemo pouzdano da protumačimo (npr. „Klasa DS (µ ≥ 0,30)" za R-klasu, „LROS"): ne pravi opciju (ne izmišlja se).
- Numerički raspon u podatku („2,5, 3,5" mm habajućeg sloja; „0.10 - 1.2 mm"): proizvod prolazi opseg ako mu se bilo koja vrednost/deo raspona preklapa sa izabranim opsegom.
- Cena postoji samo za mali deo proizvoda: grupa Cena se prikazuje samo kada u trenutnom skupu postoje bar dva proizvoda sa cenom; kada je aktivna, prikazuju se samo proizvodi sa cenom i to je jasno naznačeno.
- Tab „Boje" učitava podatke naknadno: dok se ne učitaju, dugme i brojevi ne prikazuju lažan broj.
- Promena kategorije ne briše opšte filtere (npr. Brend, Ugradnja), ali briše filtere vezane samo za kategoriju koja više nije izabrana.
- Prazan rezultat: prikazuje se poruka sa ponudom da se skine poslednji filter ili očisti sve.

## Requirements *(mandatory)*

### Functional Requirements

**Opseg i sadržaj filtera**

- **FR-001**: Panel filtera MORA da prikazuje opšte (međukategorijske) grupe i bez izabrane kategorije: Kategorija, Brend, Namena prostora, Klasa upotrebe, Ugradnja, Dezen, Ton, Boja, Format, Uzorak polaganja, Debljina, Sloj habanja, Zvučna izolacija, Protivkliznost (R-klasa), Požarna klasa, Podno grejanje, Cena i Dostupnost — svaka grupa samo ako trenutni skup ima bar dve različite vrednosti (boolean grupa: bar jedan pokriven proizvod).
- **FR-002**: Kada je izabrana kategorija, panel MORA dodatno da prikaže grupe specifične za nju (npr. tip proizvoda te kategorije — Tip vinila, Vrsta pribora/lajsni —, Materijal, Završna obrada i Vrsta drveta za parket, ESD klasa, Tip otirača, Kolekcije te kategorije).
- **FR-003**: Vrednosti opcija MORAJU poticati isključivo iz stvarnih specifikacija proizvoda (i nasleđivanja kolekcija↔boja); vrednost koja ne postoji u podacima ne sme da se pojavi kao opcija. Dozvoljeno je samo kanonsko svođenje sinonima i standardno izvođenje (Namena iz klase upotrebe po EN ISO 10874: 2x = stambeni, 3x = komercijalni, 4x = industrijski; „Spoljašnji" samo gde podatak kaže eksterijer/spoljašnja upotreba).
- **FR-004**: „Namena" MORA da se izvodi iz podataka (klasa upotrebe, eksplicitna namena/primena), a ne iz pretrage reči u opisu.
- **FR-005**: Brendovi i kategorije MORAJU se automatski preuzimati iz kataloga; novi brend/kategorija se pojavljuje bez izmene filter koda.
- **FR-006**: Numeričke grupe (Debljina, Sloj habanja, Zvučna izolacija, Cena) MORAJU da nude opseg Od/Do u jedinicama (mm, dB, RSD) sa granicama iz trenutnog skupa i prečicama za tipične opsege gde podaci to opravdavaju.

**Logika i brojači**

- **FR-007**: Unutar grupe izbor MORA da radi kao ILI, između grupa kao I.
- **FR-008**: Broj uz svaku opciju MORA biti broj rezultata koje bi kupac dobio izborom te opcije uz sve ostale aktivne grupe (grupa ne broji sama sebe); za grupu koja važi samo za jednu kategoriju broj se odnosi na proizvode te kategorije. Broj u naslovu rezultata, na tabovima i na mobilnom dugmetu MORA se poklapati sa brojem prikazanih kartica.
- **FR-009**: Opcija sa 0 rezultata MORA biti posivljena i onemogućena, osim ako je već izabrana.
- **FR-010**: Isti filteri MORAJU da rade u tabu „Kolekcije" (strogo) i u tabu „Boje" (blago, uz nasleđivanje).

**Stanje i URL**

- **FR-011**: Stanje svih filtera, taba i sortiranja MORA da se čuva u adresi; osvežavanje, deljenje linka, Nazad i Napred vraćaju isto stanje.
- **FR-012**: Linkovi u formatu od 11.07.2026 MORAJU nastaviti da rade.
- **FR-013**: Nevažeće vrednosti u adresi MORAJU se odbaciti, a nepovezani parametri sačuvati.

**Prikaz**

- **FR-014**: Na telefonu MORA postojati vidljivo dugme „Filteri (N)" iznad rezultata (pored postojećeg u zaglavlju) koje otvara fioku sa istim sadržajem kao desktop panel i živim dugmetom „Prikaži N rezultata".
- **FR-015**: Aktivni filteri MORAJU biti prikazani kao čipovi sa ljudskim nazivima (npr. „Klasa 33", „Klik", „2–4 mm"), svaki uklonjiv jednim dodirom, uz „Očisti sve".
- **FR-016**: Manje bitne grupe MORAJU biti podrazumevano sklopljene, a naslov grupe MORA da prikaže broj izabranih opcija u njoj.
- **FR-017**: Vizuelni jezik „Galerija" se zadržava (bez zaobljenja, bez senki, hairline linije, postojeća tipografija); `/crm` ostaje isključen.

**Brzina**

- **FR-018**: Početna strana MORA da šalje pregledaču samo podatke potrebne za kartice i filtere (bez opisa, dokumenata i pune galerije), a podaci tabova „Boje" takođe u sažetom obliku.
- **FR-019**: Početna strana MORA da se servira iz keša i osvežava periodično (najviše na 5 minuta) i pri svakom novom deploy-u, umesto generisanja na svaki zahtev.
- **FR-020**: Slike prvog reda kartica MORAJU se učitavati prioritetno; ostale lenjo.
- **FR-021**: Stranica proizvoda MORA da zadrži tačne (sveže) cene; ubrzanja tu ne smeju da uvedu zastarele cene.
- **FR-022**: Merenje pre/posle (veličina HTML/JS, vreme do prvog bajta, LCP/CLS/TBT) za početnu i jednu stranicu proizvoda MORA biti dokumentovano u repou.

### Key Entities

- **Stavka kataloga**: sažet prikaz kolekcije ili boje za karticu i filtere — identitet, naziv, kategorija, brend, cena (ako postoji), slike za karticu, kanonske vrednosti po grupama i numerički opsezi.
- **Grupa filtera (faseta)**: naziv, parametar u adresi, opseg važenja (opšta ili za jednu kategoriju), izvori podataka (spec ključevi), pravila kanonskog svođenja, vrsta (lista, da/ne, numerički opseg), podrazumevano otvorena/sklopljena.
- **Stanje filtera**: izabrane kategorije, vrednosti po grupama, numerički opsezi, tab i sortiranje — serijalizovano u adresu.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Bez izabrane kategorije panel nudi bar 12 grupa filtera sa stvarnim vrednostima (pre: 4).
- **SC-002**: Za 100% opcija u automatskoj proveri nad celim katalogom broj uz opciju je jednak broju rezultata posle izbora te opcije.
- **SC-003**: Nijedna opcija u filterima nema vrednost koja ne postoji u specifikacijama bar jednog prikazanog proizvoda (automatska provera).
- **SC-004**: Prenos HTML-a početne strane se smanjuje bar 5 puta, a početna se servira iz keša (vreme do prvog bajta iz keša ispod 0,3 s na produkciji).
- **SC-005**: LCP početne strane na simuliranom telefonu je bolji nego pre izmene; CLS ostaje ispod 0,1.
- **SC-006**: Svaka promena filtera osvežava rezultate i brojeve za manje od 100 ms na prosečnom telefonu (merljivo kroz vreme obrade u pregledaču).
- **SC-007**: Svi postojeći contract testovi, lint, provera tipova i production build prolaze; stari linkovi filtera iz 11.07.2026 i dalje rade.

## Assumptions

- Početna strana sme da prikazuje cene sa kašnjenjem do 5 minuta posle izmene u bazi (stranica proizvoda ostaje uvek sveža); ovo je podrazumevana odluka koju vlasnik može da promeni.
- Server funkcije treba da rade u evropskom regionu (Frankfurt), blizu baze; promena važi tek sa sledećim deploy-om koji pokreće vlasnik.
- SCHÖNOX katalog i grupa „Pribor" dolaze iz paralelne grane; filteri ih preuzimaju automatski kroz brend/kategoriju/opšte grupe, bez posebnog koda (cene SCHÖNOX-a stižu tek posle 19.10.2026).
- Filteri na stranicama koje više ne postoje (`/kategorije`) nisu u opsegu; komponente koje ih koriste ostaju neizmenjene.
- Redosled „Preporučeno" ostaje kurirani redosled iz repozitorijuma.
- Objava na produkciju nije deo ovog posla bez izričitog odobrenja vlasnika.
