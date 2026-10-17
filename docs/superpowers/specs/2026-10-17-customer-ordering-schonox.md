# Podovi nalozi, poručivanje i SCHÖNOX — dogovoreni obim

Datum: 17.10.2026. Vlasnik je izabrao porudžbinu koju potvrđuje Podovi prodaja,
10% rabata po potvrdi mejla i ceo aktuelni SCHÖNOX program iz direktnog Sika
dobavljačkog odnosa. Cenovnik stiže od Tatjane u ponedeljak, 19.10.2026.

## Tok kupca

- Pregledanje i lokalna korpa rade pre prijave. Korpa čuva konkretan proizvod,
  izabranu varijantu i količinu; ne čuva autoritativnu cenu ili rabat.
- Prijava preko mejl linka koristi Supabase Auth. Potvrđen korisnik dobija 10%;
  individualni rabat koji odobri Podovi zamenjuje osnovni, ne sabira se.
- Jedan serverski obračun koristi aktuelni katalog, identitet varijante i rabat.
  Isti obračun se ponavlja pri slanju. Nevažeća varijanta ili količina se odbija.
- Poznate cene su informativne do potvrde prodaje. Nepoznata cena je null i
  prikazuje se kao „Cena na upit”, nikada kao nula. Mešovita korpa prikazuje
  poznati zbir uz jasno objašnjenje da cena ostalih stavki, PDV, dostava i
  raspoloživost čekaju konačnu ponudu.
- Ne koristiti podrazumevani lager ni generičkih 2,25 m²/paket iz kalkulatora
  kao prodajni podatak. Zaokruživanje pakovanja dozvoljeno je samo uz podatak
  konkretne izabrane varijante.
- Slanje stvara porudžbinu `pending_confirmation` i ne predstavlja naplatu.
  Jedna transakcija upisuje porudžbinu i snapshot svih stavki; idempotency ključ
  sprečava duple porudžbine. Email sledi tek posle uspešnog upisa.
- Moj nalog prikazuje isključivo sopstvene porudžbine, rabat i detalje. Podovi
  ima zaštićen pregled zahteva i može menjati status i individualni rabat.

## Bezbednost i integracija

Zadržati postojeći vizuelni jezik, srpski jezik i postojeće upite. Identitet
proverava Supabase `getUser` na serveru. Klijent ne određuje korisnika, rabat,
status ni iznose. Privatni odgovori nisu javno keširani. RLS ograničava čitanje
na vlasnika; poslovne izmene rade samo autorizovane serverske rute. Service key
ostaje na serveru. Novi tok ne otvara isključeni `/crm`.

## SCHÖNOX

Obuhvat je ceo aktuelni evropski/globalni SCHÖNOX floor/tile/marine program,
uključujući prateće proizvode zvaničnog Sika izvora, uz deduplikaciju proizvoda
koji pripadaju više grupa. Ne mešati
američke formulacije istog imena sa evropskim. Nabavljivost je uz potvrdu
Podovi prodaje; ne tvrditi trenutni lager. Cene ostaju nepopunjene do cenovnika.
Sačuvati izvore i datum, tačne nazive, dokumente, pakovanja i tehničke podatke;
srpski tekst mora odgovarati izvornom proizvodu. Reuse KH/RM/ZM slika iz
media-library; ostale slike i PDF-ove servirati sa našeg hosta, bez hotlinkova.
Integracija mora obuhvatiti brend, kategoriju Pribor, pretragu, filtere,
listinge, PDP, sitemap i brojače. Asortiman i izostavljeni/neuspešni izvori
moraju biti proverljivi u manifestu.

## Provera i isporuka

Proveriti 10% i individualnih 0%, izmenjene klijentske cene, tuđu varijantu,
nepoznatu cenu, količine/pakovanja, idempotency, vlasništvo i privatno keširanje.
Pokrenuti relevantne contract testove, lint, TypeScript i production build;
pregledati lokalni desktop i mobilni tok. Produkcioni Auth/SMTP i DB migracija
moraju imati jasno prijavljeno stanje. Rad je na posebnoj grani; objava sajta
ide posle konkretnog pregleda rezultata.
