# SCHÖNOX redovne cene — 29.10.2026.

Vlasnik je izričito tražio redovne cene iz cenovnika bez rabata. Objavljuje se
samo uparen podskup redovnih cena; interni PDF, privatna prepiska i nabavni
uslovi ostaju van javnog repozitorijuma.

## Izvor i obračun

- Sika Srbija, cenovnik od 17.8.2026, važi do 31.12.2026. Nova kolona
  „Nova kataloška cena 17.8.2026. RSD/JM“, ne prethodna julska kolona.
- Jedinica je KOMAD konkretnog pakovanja, iznosi bez PDV-a. Odobreni javni
  podskup u `tools/schonox-prices.json` čuva neto cenu u parama i stranicu izvora.
- Prodajna cena: `Math.round(netoPara * 120 / 100) / 100` RSD, bez rabata.
  Prikaz uključuje 20% PDV-a; PDP prikazuje i izvornu cenu bez PDV-a.
- Cena se ne množi ponovo kilogramima ili kvadraturom. EPOXY CLEAN 651696
  je 0,5 kg po komadu, iFIX 525976 je komplet 7,8 kg. Globalni paket ili karton
  proizvođača nije automatski prodajna jedinica srpskog cenovnika.

## Pokrivenost

Od 40 redova cenovnika, tri ponovljena SHP reda daju ukupno 37 jedinstvenih
šifara. Upareno je 35 šifara sa 30 postojećih proizvoda: 28 direktnim
proizvođačkim šiframa, sedam eksplicitnim nazivom i pakovanjem.
KH, SHP i AB imaju više pakovanja, zasebne cene i oznaku „od“ na kartici.
Anti Slip 14 kg (582475) i švedska gleterica 600 mm (483606) nemaju potvrđeno
podudaranje sa postojećim katalogom i nisu pridruženi sličnom proizvodu.
Ostalih 105 proizvoda nema cenu u ovom izvoru. Dostupnost ostaje uz potvrdu prodaje.

## Tok podataka i provere

`node tools/extract_schonox_catalog.js --prices-only` primenjuje pregledani
cenovnik bez mrežnog preuzimanja ambalaže i dokumenata. Redovan refresh ponovo
primenjuje isti podskup. Izvorni datum provere proizvođačkog sadržaja ostaje
sačuvan. Loader duboko kopira opcije i uklanja istekle cene nakon ponoći
1.1.2027. u Beogradu, uključujući prethodno zagrejane serverske keševe.

Početna šalje samo sažetu cenu i numeričke fasete: svako pakovanje je posebna
tačka, bez izmišljene kontinuirane cene između dva pakovanja. Pretraga,
omiljeni, poređenje i istorija obnavljaju cenu iz API-ja. PDP prikazuje tabelu
šifara i pakovanja; JSON-LD koristi tačne cene, jedinice, PDV i rok cenovnika.
Sačuvani korisnički proizvodi obnavljaju i uklanjaju stare iznose.

Regresije pokrivaju svih 35 cena, zaokruživanje na paru, različita pakovanja,
izostanak rabata, istek u Beogradu, filtere oba repozitorijuma i sažete podatke.
Završna lokalna i produkciona provera beleže se u `docs/schonox-improvements.md`.
