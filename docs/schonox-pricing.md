# SCHÖNOX redovne cene i asortiman — 05.11.2026.

Vlasnik je izričito tražio redovne cene iz cenovnika bez rabata. Objavljuje se
samo uparen podskup redovnih cena; interni PDF, privatna prepiska i nabavni
uslovi ostaju van javnog repozitorijuma.

Poslednji nalog vlasnika 29.10: kupac vidi **samo konačnu cenu**, npr.
**11.883,44 RSD**. Bez teksta o PDV-u, izvorne/neto cene, šifara, datuma ili
ponovljene tabele. Cena već uključuje PDV. Više pakovanja prikazuje se kao
jednostavni redovi pakovanje–cena. Ova odluka zamenjuje prethodni neto/bruto prikaz.

Poslednja korekcija 05.11: javno polje **Pakovanje** prikazuje samo
`packages[].packagingLabel` iz `tools/schonox-prices.json`, po jedno u redu,
za svih 32 proizvoda / 37 stavki. Ključ `manufacturer_packaging` ostaje radi
postojećeg prikaza i poređenja. KH FIX ima samo **5 kg / 3.978,84 RSD**,
šifra 483277; globalna pakovanja 1 kg i 10 kg nisu deo naše ponude.
Ovo zamenjuje raniji javni prikaz globalnih proizvođačkih/PDS pakovanja;
sirovi podaci ostaju u manifestu. Istek cene ne uklanja odobrena pakovanja.

## Izvor i obračun

- Sika Srbija, cenovnik od 17.8.2026, važi do 31.12.2026. Nova kolona
  „Nova kataloška cena 17.8.2026. RSD/JM“, ne prethodna julska kolona.
- Jedinica je KOMAD konkretnog pakovanja, iznosi bez PDV-a. Odobreni javni
  podskup u `tools/schonox-prices.json` čuva neto cenu u parama i stranicu izvora.
- Prodajna cena: `Math.round(netoPara * 120 / 100) / 100` RSD, bez rabata.
  Konačni iznos uključuje 20% PDV-a; izvorna neto cena i PDV metapodaci služe
  obračunu i ne prikazuju se kupcu.
- Cena se ne množi ponovo kilogramima ili kvadraturom. EPOXY CLEAN 651696
  je 0,5 kg po komadu, iFIX 525976 je komplet 7,8 kg. Globalni paket ili karton
  proizvođača nije automatski prodajna jedinica srpskog cenovnika.

## Pokrivenost

Od 40 redova cenovnika, tri ponovljena SHP reda daju ukupno 37 jedinstvenih
šifara. Svih 37 šifara sada pripada 32 javna proizvoda. Anti Slip 14 kg (582475)
i švedska gleterica 600 mm (483606) dodati su kao zasebni proizvodi sa zvaničnim
fotografijama i proizvođačkim izvorima, bez preslikavanja na sličan proizvod.
Cene su 9.906,55 RSD i 3.346,81 RSD. KH, SHP i AB imaju više pakovanja i zasebne
cene, sa oznakom „od“ na kartici. Dostupnost ostaje uz potvrdu prodaje.

Po poslednjem nalogu vlasnika uklonjeno je 105 proizvoda kojih nema u cenovniku.
Asortiman određuju odobreni slugovi, nezavisno od važenja iznosa. Izvorni globalni
katalog i stari asseti ostaju za proveru porekla i povratak prethodne verzije.

## Tok podataka i provere

`node tools/extract_schonox_catalog.js --prices-only` primenjuje pregledani
cenovnik na cene i javnu specifikaciju pakovanja bez mrežnog preuzimanja ambalaže
i dokumenata. Isti `applyApprovedPrices` usklađuje pakovanja i pri
`--assortment-only` i redovnom uvozu; `--presentation-only` osvežava ta pakovanja
bez promene cena. Izvorni datum provere proizvođačkog sadržaja ostaje
sačuvan. Loader duboko kopira opcije i uklanja istekle cene nakon ponoći
1.1.2027. u Beogradu, uključujući prethodno zagrejane serverske keševe.

Početna šalje samo sažetu cenu i numeričke fasete: svako pakovanje je posebna
tačka, bez izmišljene kontinuirane cene između dva pakovanja. Pretraga,
omiljeni, poređenje i istorija obnavljaju cenu iz API-ja. PDP prikazuje jedan
konačni iznos ili jednostavne redove pakovanje–cena; JSON-LD zadržava tačne
cene, šifre, jedinice, PDV i rok cenovnika. Formatter uklanja vidljive oznake
PDV-a i sufiks `/pakovanje (...)`, uz očuvane značajne jedinice poput m².
Sačuvani korisnički proizvodi obnavljaju i uklanjaju stare iznose.

Regresije pokrivaju svih 37 cena, zaokruživanje na paru, različita pakovanja,
izostanak rabata, istek u Beogradu, filtere oba repozitorijuma i sažete podatke.
Završna lokalna i produkciona provera beleže se u `docs/schonox-improvements.md`.
