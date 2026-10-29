# SCHÖNOX — prihvaćene popravke od 22.10.2026.

Vlasnik je prihvatio sve predloge iz pregleda sajta i integracije na `4bb81ccf`.
Detaljni lokalni dokazi pregleda su u `output/audit-2026-10-22/izvestaj.md`.
Ovaj dokument beleži obim i rezultat popravki, bez vraćanja ranije uklonjene
korpe, naloga ili porudžbina.

## Prihvaćen obim

- SCHÖNOX ambalaža se prikazuje cela na beloj pozadini, sa unutrašnjim razmakom,
  u karticama, PDP-u, pretrazi, omiljenim, poređenju i nedavno pregledanom.
  Postojeće fotografije enterijera i dekora zadržavaju kadriranje.
- Koriste se kvalitetniji zvanični originali gde postoje, bez precrtavanja
  ambalaže. Sačuvati bolje postojeće KH/RM/ZM isečke. Slike i PDF-ovi ostaju u
  našim Supabase bucket-ima, uz sadržajne heševe i izvore u manifestu.
- Osvežavanje proverava novi sadržaj sa istog URL-a; validacija i uspešan upis
  prethode zameni postojeće datoteke. Promenjeni sadržaj dobija novu javnu putanju.
- FPL PLUS razlikuje 3–50 mm bez agregata i 10–60 mm sa agregatom; D proizvodi
  su zidne zaptivne manžetne. GEA se odvaja od dodatnog QUARZSAND materijala.
  Nesaglasnosti se rešavaju proverom cenovnika i pojedinačnog tehničkog lista.
  Dopuna 29.10: javna pakovanja 2K PU SOLID (5 kg A+B) i 1K DS PREMIUM
  (18 kg) prate priloženi PDS, dok sukob sa marketinškom tabelom ostaje u
  izvornom manifestu. Sporni brojevi mešanja/klase ne prenose se na sajt.
- Proizvodi dobijaju korisne srpske opise iz zvaničnog izvora. Napomena o
  tehničkom listu mora da prati stvarni tip priloženog dokumenta.
- Nepoznata cena ne prolazi aktivan cenovni opseg. Sortiranje iz URL-a ostaje
  sačuvano dok se ne učitaju podaci aktivnog taba; brojači i rezultat ostaju isti.
- Flat SCHÖNOX asortiman se naziva proizvodima, uz lakše nalaženje grupe i
  programa. Ispraviti doslovnu nulu u istoriji pregleda i upozorenje o cleanup
  referenci, uz očuvanu mobilnu pristupačnost.
- Sačuvati brzinu, ISR, sažete podatke i postojeće ponašanje dekora. Nema novih
  zavisnosti. Cene se ne izmišljaju; nabavka ostaje uz potvrdu prodaje.

## Provera pre završetka

Proveriti relevantne regresije, kompletan contract suite sa jednim worker-om,
lint i produkcioni build. Pregledati desktop i telefon, sve tipove ambalaže,
upit, pretragu i sačuvane proizvode. Uskladiti AGENTS, arhitekturu, README i
runbook sa stvarnim konačnim stanjem. Rezultat i ograničenja dopisati ovde.

## Rezultat

Implementirano na grani `codex/schonox-catalog-fixes`, nastavak posle prekida
29.10.2026. Zvanični izvori su provereni 22.10.2026; provera dostupnosti naših
javnih datoteka ponovljena je 29.10.2026. To su različite provere i datumi.

- 135 proizvoda ima pregledane srpske detaljne opise. Duži izvorni opis postoji
  kod 120 proizvoda; ostali prevodi koriste pojedinačnu namenu i sistemski kontekst.
- 133 zvanična providna PNG originala su 1600×1600. ANMACHEIMER i WASSEREIMER
  ostaju izvorni JPEG-ovi 300×400, bez veštačkog povećanja. Sva ambalaža ostaje
  cela unutar belog okvira, uključujući fallback, omiljene, poređenje i pretragu.
- Manifest sadrži 135 slika i 437 veza ka dokumentima, odnosno 521 jedinstvenu
  javnu adresu (135 slika i 386 PDF-ova). Sve su vratile HTTP 200, ispravan MIME
  i nepraznu veličinu jednaku manifestu. Novi engleski HS 8 DoP od 21.10.2026.
  je uključen; raniji neispravan nemački izvor i pogrešna Q9 W deklaracija nisu.
- Promenjeni bajtovi dobijaju novu SHA-256 putanju. Ceo raster i svaka stranica
  PDF-a proveravaju se pre zamene keša, a neispravno osvežavanje čuva prethodne
  bajtove i zapis provere. Prethodni javni objekti ostaju sačuvani.
- Opseg cene isključuje nepoznate cene. Direktan link za sortiranje boja po ceni,
  promena brenda uz aktivan Program, osvežavanje i Nazad čuvaju ispravno stanje.
  Mobilni panel se zatvara tasterom Escape i vraća fokus na dugme Filteri.

## Završne provere

Dokazi su u lokalnom `output/schonox-fixes-2026-10-22/`:

- Ponovljeno 29.10: 45 contract fajlova / 382 testa prolaze, TypeScript bez
  grešaka i lint bez grešaka i upozorenja.
- Extractor `--self-test` prolazi: isti broj bajtova sa drugačijim sadržajem,
  novo preuzimanje uz `--refresh`, odbacivanje skraćene slike/PDF-a i očuvanje
  prethodnog keša. Nezavisna provera pročitala je 2.073 stranice svih 387
  staging PDF-ova; nisu svi staging fajlovi namenjeni javnoj objavi.
- Pregledane su sve fotografije u contact-sheet prikazu, desktop PDP/kartice,
  pretraga, omiljeni, poređenje, istorija pregleda i mobilni prikaz 390×844.
  Upit zadržava izabrani proizvod; probna poruka nije poslata.
- Produkcioni build ponovo prolazi 29.10, uključujući validaciju slika. Svih 29
  server trace-ova je provereno: nema uvlačenja `public/images` ili `public/documents`.

## Preostali komercijalni podaci

Postojeći cenovnik Sika Srbija od 17.8.2026, dostavljen 19.10, sadrži 37
jedinstvenih SCHÖNOX šifara i ne navodi ova dva proizvoda. Njihova pakovanja
su preuzeta iz zvaničnih PDS-ova: 2K PU SOLID 5 kg (A+B), 1K DS PREMIUM
18 kg. Proveru dostupnih izvora radi agent, bez novog zahteva vlasniku.
Cene bez proverenog podudaranja šifre, pakovanja i prodajne jedinice ostaju
na upit; podaci iz privatnog cenovnika se ne objavljuju kao dokument u javnom Git-u.
Sedam proizvoda nema dokumente, a 28 nema priložen tehnički list; sajt to
razlikuje od SDS-a i sertifikata i upućuje kupca da zatraži PDS pre izbora/primene.
Za dve kante bolji izvorni snimak trenutno nije dostupan. Nema otvorenih
nalaza iz nezavisnog pregleda koda; objava koristi postojeći Git → main → Vercel tok.
