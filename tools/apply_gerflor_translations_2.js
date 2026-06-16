// Inline prevodi preostalih 5 Gerflor engleskih opisa (workflow ih je propustio zbog rate-limita).
// Uzemljeno: samo činjenice iz izvora. Match po TAČNOM izvornom engleskom tekstu (hvata i per-boja kopije).
const fs = require('fs');
const path = require('path');
const core = require('./lib/ingest-core.js');

const src = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'tmp', 'eng-full2.json'), 'utf8'));

const SR = {
  0: 'Nova Rigid LVT podna obloga sa uključenom akustičnom podlogom, u bogatom izboru modernih dezena. Dolazi u 3 dimenzije (uključujući XL dasku od 1,5 m) i 32 dezena realističnog dekora, sa ekskluzivnom „full rigid core" konstrukcijom za visoku stabilnost, PUR+Matt lakom za prirodan izgled i lako čišćenje, EIR reljefom za ultrarealizam i 4 zakošene ivice. Postavlja se sistemom uglavljivanja (moguće i u nameštenom prostoru), a kao puna kruta ploča i direktno na keramiku ako je fuga <8mm/3mm. Evropska klasa 23/31 (idealno za stambeni prostor), otporna do 60° (ugradnja ispred prozorske niše) i akustična izolacija 21 dB. Proizvedeno u Evropi (nizak CO2 otisak), 100% reciklabilno sa do 35% recikliranog sadržaja, 30% lakše od standardnih krutih ploča na tržištu, COV < 10 µg/m3, bez ftalata i REACH usklađeno.',
  1: 'Nova lepljiva (glue down) LVT podna obloga u modernom formatu riblje kosti. Male daske za riblju kost, 5 boja drveta realističnog dekora, PUR+Matt lak za prirodan izgled i lako čišćenje, sa 4 zakošene ivice za efekat pločica i dasaka. Postavlja se lepljenjem (profesionalna ugradnja), uz mogućnost samolepljive akustične podloge Smartfix 16 dB. Evropska klasa 33/42 (idealno za komercijalni prostor). 100% reciklabilno sa do 35% recikliranog sadržaja, COV < 10 µg/m3, bez ftalata i REACH usklađeno.',
  2: 'Nova Rigid LVT podna obloga sa uključenom akustičnom podlogom, u modernom formatu riblje kosti. Male daske za riblju kost, 5 boja drveta realističnog dekora, ekskluzivna „full rigid core" konstrukcija za visoku stabilnost, PUR+Matt lak za prirodan izgled i lako čišćenje, 4 zakošene ivice za efekat pločica i dasaka. Postavlja se uglavljivanjem (moguće i u nameštenom prostoru), a kao puna kruta ploča i direktno na keramiku ako je fuga <8mm/3mm. Evropska klasa 33/42 (idealno za komercijalni prostor), otporna do 60° i akustična izolacija 21 dB. Proizvedeno u Evropi, 100% reciklabilno sa do 35% recikliranog sadržaja, 30% lakše od standardnih krutih ploča, COV < 10 µg/m3, bez ftalata i REACH usklađeno.',
  3: 'Referenca u sportskim podovima još od 1976. godine. Taraflex sa biosadržajem, kategorija P1 visokih performansi i bezbednosti za igrače, sa CXP-HD penom i D-max konstrukcijom za visoku trajnost i izuzetnu dimenzionalnu stabilnost, te jedinstvenim Protecsol tretmanom površine trostrukog dejstva (maksimalan klizaj i prijanjanje, lako održavanje i površina koja ne izaziva opekotine od trenja). Dolazi u bogatoj paleti prirodnih i živih boja i dezena, sa novom serijom realističnijih dezena drveta i uz inovativnu uslugu MyTaraflex za jedinstven izgled svake dvorane. Postavlja se lepljenjem, a dostupan je i sa Dry-Tex sistemom. Pruža odličan balans trajnosti, udobnosti i performansi i pogodan je za sve sportove (rukomet, odbojka, pickleball, futsal). Do 81% biosadržaja (mineralnog i recikliranog), vodeći ugljenični otisak u klasi, formulacija bez ftalata, proizvedeno u Evropi (nizak CO2 otisak), TVOC nakon 28 dana < 100 µg/m3, 100% REACH i bez formaldehida, 100% reciklabilno.',
  7: 'Sigurnosni protivklizni pod sa izdignutim reljefom, namenjen tuš-kabinama i mokrim prostorima. Tarasafe Ultra H2O je visokoučinkovita protivklizna podna obloga za mokre i suve uslove, bosonogu i obuvenu upotrebu, sa izdignutim reljefom projektovanim za prostore sa stalnom vlagom. Pruža izuzetnu udobnost pri bosonogom hodu i idealno je rešenje za mokre prostorije, tuševe, svlačionice i druge zone visokog rizika od klizanja gde je potreban robustan sigurnosni pod (osim bazena). Ima garanciju od 12 godina i 100% je reciklabilan. Visoka protivklizna zaštita R11 (mokro i suvo) postiže se gustom koncentracijom duboko utisnutih protivkliznih čestica kroz ceo habajući sloj, dok teksturisana reljefna površina pojačava trajnost. Kombinuje se sa kolekcijom Tarasafe Ultra (Mix & Match) i fleksibilnim zidnim oblogama poput Mural Calypso ili Ceramics. Kompatibilan je sa Tarafoam podlogom (akustična izolacija do 17 dB) i Clean Corner sistemom, vodonepropusan prema EN13553, a usklađen sa zahtevima za bosonoge (C) i obuvene (R11) protivklizne površine. Popularan je izbor u obrazovanju, zdravstvu, ugostiteljstvu i stanovanju. TVOC nakon 28 dana < 100 µg/m3, 100% reciklabilan sa 29% recikliranog sadržaja, 100% REACH i bez formaldehida (CH₂O), proizveden u Francuskoj uz smanjen CO2 otisak transporta.',
};

// Match po TAČNOM izvornom engleskom opisu → zameni svuda (i per-boja kopije).
const fileBuckets = {};
for (const [i, sr] of Object.entries(SR)) {
  const item = src[Number(i)];
  (fileBuckets[item.file] = fileBuckets[item.file] || []).push({ orig: item.desc, sr });
}

let total = 0;
for (const [file, pairs] of Object.entries(fileBuckets)) {
  const fp = path.join(process.cwd(), 'public', 'data', file);
  const d = JSON.parse(fs.readFileSync(fp, 'utf8'));
  let applied = 0;
  const visit = (arr) => {
    for (const c of (arr || [])) {
      if (c && typeof c.description === 'string') {
        for (const p of pairs) { if (c.description === p.orig) { c.description = p.sr; applied++; } }
      }
      if (c && Array.isArray(c.colors)) visit(c.colors);
    }
  };
  visit(Array.isArray(d.collections) ? d.collections : []);
  visit(Array.isArray(d.colors) ? d.colors : []);
  if (applied > 0) { core.writeJsonWithBackup(fp, d, 'gerflor-tr2-' + file.replace(/\.json$/, '')); console.log('✏️ ' + file + ': ' + applied + ' zamena'); total += applied; }
}
console.log('UKUPNO zamena:', total);
