# Podovi poručivanje — priprema za puštanje

Dogovor vlasnika, 17.10.2026: mejl prijava bez lozinke, 10% rabata nakon potvrde
mejla i porudžbina koju potvrđuje Podovi prodaja. Individualni rabat zamenjuje
osnovni, uključujući 0%. Slanje zahteva ne predstavlja plaćanje.

## Konfiguracija pre objave

1. Pregledati i primeniti `supabase/migrations/20261017144116_customer_commerce.sql`
   na Podovi projekat. Migracija je dodatna; ne koristiti staru monolitnu
   `supabase/migration.sql` kao zamenu. Ne menjati postojeće podatke kataloga.
2. Proveriti `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` i
   serverski `SUPABASE_SERVICE_ROLE_KEY`. Service role nikad nije javna promenljiva.
3. U Supabase Auth zadržati obaveznu potvrdu mejla. Podesiti Site URL i dozvoljene
   callback adrese za produkcioni `/nalog/potvrda` (uključujući `returnTo` query),
   kao i konkretne lokalne/preview adrese koje se zaista koriste. Izbegavati
   široke produkcione wildcard domene.
4. Podesiti i proveriti Auth SMTP za stvarne kupce. Postojeći Gmail Nodemailer
   za porudžbine nije automatski i SMTP za Supabase prijavu. Proveriti ograničenja
   slanja, SPF/DKIM/DMARC i dolazak prijave na odobrenu test adresu.
5. Podesiti `GMAIL_USER`, `GMAIL_APP_PASSWORD` i po potrebi `ADMIN_EMAIL` za
   potvrde sačuvanih porudžbina. Ne slati stvarne mejlove iz automatizovanih testova.
6. Za prodaju podesiti `OPS_BASIC_AUTH_USERNAME`, `OPS_BASIC_AUTH_PASSWORD` i
   po potrebi `OPS_BASIC_AUTH_ACTOR_ID`. U `ops_role_bindings` dati eksplicitnu
   ulogu `publisher` tom identitetu. Bez oba sloja staff pristup ostaje zatvoren;
   migracija ne otvara nalog i ne dodeljuje uloge.

## Proba pre puštanja

- Gost doda konkretnu varijantu, prijavi se mejl linkom i zadrži korpu.
- Server prikaže 10%; odobrenih 0% i drugi individualni rabat zamenjuju osnovni.
- Proveriti jednu poznatu cenu i jednu SCHÖNOX stavku bez cene. Nema lažne nule,
  tvrdnje o lageru ili generičkog pakovanja. PDV, dostava i konačna ponuda čekaju
  potvrdu prodaje.
- Slanje sačuva jednu porudžbinu sa svim stavkama; ponovljen isti zahtev ne pravi
  duplikat. Neuspeo mejl ne gubi porudžbinu. Kupac vidi svoj zahtev i status.
- Drugi nalog ne vidi tuđu porudžbinu. Odjava i promena naloga uklanjaju privatni
  prikaz. Staff vidi zahteve, menja status i rabat samo uz eksplicitnu ulogu.
- Proveriti desktop i telefon, istekli link, promenu cene i ponavljanje zahteva
  posle prekida mreže. `/crm` mora ostati 404.

## SCHÖNOX i cenovnik

Celokupan popisani zvanični program je za nabavku uz potvrdu Podovi prodaje.
Tatjana treba da dostavi cenovnik u ponedeljak, 19.10.2026. Pre unosa proveriti
identitet artikla, pakovanje/jedinicu, valutu, PDV i osnovicu rabata; ne mapirati
cene samo po sličnom nazivu i ne prepisivati ih budućim refreshom sadržaja.
Ne izmišljati lager ili cenu za proizvod koji cenovnik ne obuhvata.

## Dodatne napomene (17.10.2026, posle pregleda)

- `OPS_BASIC_AUTH_ACTOR_ID` podesiti na vrednost različitu od Basic Auth korisničkog
  imena; ta vrednost se upisuje kao `updated_by` (kupci je ne mogu čitati).
- Podrazumevani Supabase mejl servis šalje samo članovima tima i ima nizak limit;
  za prave kupce je obavezan sopstveni Auth SMTP (tačka 4).
- Preporuka bez koda: Vercel WAF limit od oko 30 zahteva/min po IP adresi za
  `POST /api/commerce/quote` i `POST /api/commerce/orders`.
- Cene koje se unesu u Supabase pojavljuju se u obračunu najkasnije posle 60 s
  (keš po serverskoj instanci).

## Trenutno stanje

Implementacija je na grani `codex/podovi-commerce-schonox` (necommit-ovano).
Lokalno provereno: contract testovi, TypeScript, lint, production build,
PGlite provera migracije (20 provera) i tok gosta u pregledaču (PDP → korpa →
prijava, cena na upit, mešovita korpa, neispravna stavka, parket po meri samo
na upit, mobilni prikaz).

Produkcija (Supabase projekat `podovi`, 17.10.2026):
- Migracija `20261017144116_customer_commerce` je primenjena (Supabase CLI,
  jedna transakcija, upisana u `supabase_migrations.schema_migrations`).
  Provereno: RLS i polise, RPC samo za service_role, kupac ne vidi interne
  kolone, REST vidi prazne tabele.
- `ops_role_bindings`: `podovi-prodaja` ima ulogu `publisher`. Na Vercelu
  treba postaviti `OPS_BASIC_AUTH_USERNAME`, `OPS_BASIC_AUTH_PASSWORD` i
  `OPS_BASIC_AUTH_ACTOR_ID=podovi-prodaja`.
- Auth: Site URL je sada `https://www.podovi.online`; dozvoljene adrese su
  `/nalog/potvrda**` na `www.podovi.online`, `podovi.online` i
  `localhost:3000` (podešeno CLI `config push`, potvrđeno bez razlike).
  Sopstveni SMTP još nije podešen; bez njega mejlovi stižu samo članovima tima.
- Kod još nije commit-ovan ni objavljen; stvarna mejl prijava nije testirana.
