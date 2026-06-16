// Editorska prepravka opisa Tarkett linoleum kolekcija (S7). Mašinski prevod sa tarkett.rs
// je imao pogrešnu terminologiju ("stepen požara"→"klasa reakcije na požar"), nepreveden
// engleski ("Carbon negative from cradle to gate"), typo-e (kf², ekstrmnu, prianjanjeIdealno)
// i loš redosled (protivpožarna klasa vodila opis). PRAVILO: koriste se ISKLJUČIVO činjenice
// iz izvornog opisa/karakteristika te kolekcije — ništa novo se ne dodaje.
const fs = require('fs');
const path = require('path');
const core = require('./lib/ingest-core.js');

const JSON_PATH = path.join(process.cwd(), 'public', 'data', 'tarkett_linoleum_colors.json');

// slug → { desc, feats } — sve tvrdnje izvedene iz originalnog opisa/karakteristika (vidi tmp/lino-src.json).
const REWRITES = {
  'tarkett-trentino-xf2-2-5-mm': {
    desc: 'Kreativan i živ višebojni uzorak sa polusmernim dizajnom. Izrađen od do 97% prirodnih sirovina — jedno od najodrživijih podnih rešenja na tržištu — sa jedinstvenom xf² zaštitom površine za izuzetnu izdržljivost, lako čišćenje i ekonomično održavanje.',
    feats: ['Višebojni dezen sa laganim, polusmernim dizajnom i mat izgledom', 'Ugljenično negativan od proizvodnje do isporuke', 'Pogodan za recikliranje nakon upotrebe', 'Cradle to Cradle® Silver sertifikat', 'Ekskluzivni xf² tretman površine za izdržljivost i hemijsku otpornost'],
  },
  'tarkett-originale-essenza-2-5-mm': {
    desc: 'Inspirisan čistoćom 100% lanenog dizajna, Originale Essenza spaja prepoznatljive šare sa mekim bojama od najfinijih pigmenata i paletom tonova preuzetom iz prirode. Izrađen od 97% prirodnih sirovina i 77% obnovljivih materijala — jedno od najodrživijih podnih rešenja na tržištu, sa Cradle to Cradle® Gold sertifikatom. Površina je obrađena novom Essenza+ zaštitom (ne-PU akril) za veću izdržljivost.',
    feats: ['Cradle to Cradle® Gold sertifikat', 'Ugljenično negativan od proizvodnje do isporuke', 'Pogodan za recikliranje nakon upotrebe', 'Nežne boje inspirisane prirodom sa pažljivo odabranim pigmentima', 'Essenza+ ne-PU akrilna zaštita površine za bolju izdržljivost'],
  },
  'tarkett-veneto-xf2-2-5-mm': {
    desc: 'Efekat mermera sa živim bojama za autentičan izgled. Izrađen od do 97% prirodnih sirovina — jedno od najodrživijih podnih rešenja na tržištu — sa jedinstvenom xf² zaštitom površine za izuzetnu izdržljivost, lako čišćenje i ekonomično održavanje.',
    feats: ['Efekat mermera sa mat površinom', 'Ugljenično negativan od proizvodnje do isporuke', 'Pogodan za recikliranje nakon upotrebe', 'Cradle to Cradle® Silver sertifikat', 'Ekskluzivni xf² tretman površine za izdržljivost i hemijsku otpornost'],
  },
  'tarkett-etrusco-xf2-2-5-mm': {
    desc: 'Moderan, minimalistički dizajn sa neutralnim nijansama koje uz Linowall mogu stvarati atraktivne blokove boja. Izrađen od do 97% prirodnih sirovina — jedno od najodrživijih podnih rešenja na tržištu — sa jedinstvenom xf² zaštitom površine za izuzetnu izdržljivost, lako čišćenje i ekonomično održavanje.',
    feats: ['Savremene jednostavne boje sa mat izgledom', 'Ugljenično negativan od proizvodnje do isporuke', 'Pogodan za recikliranje nakon upotrebe', 'Cradle to Cradle® Silver sertifikat', 'Ekskluzivni xf² tretman površine za izdržljivost i hemijsku otpornost'],
  },
  'tarkett-etrusco-xf2-bfl-2-5-mm': {
    desc: 'Moderan, minimalistički dizajn sa neutralnim nijansama koje uz Linowall mogu stvarati blokove boja. Izrađen od do 97% prirodnih sirovina, sa jedinstvenom xf² zaštitom površine za izuzetnu izdržljivost, lako čišćenje i ekonomično održavanje. Klasu reakcije na požar Bfl postiže prirodno, bez usporivača plamena, pa je pogodan i za evakuacione puteve. Proizvod dostupan na zahtev.',
    feats: ['Klasa reakcije na požar Bfl — bez dodatih usporivača plamena', 'Savremene jednostavne boje sa mat izgledom', 'Ugljenično negativan od proizvodnje do isporuke', 'Pogodan za recikliranje nakon upotrebe', 'Cradle to Cradle® Silver sertifikat', 'Ekskluzivni xf² tretman površine za izdržljivost i hemijsku otpornost'],
  },
  'tarkett-linomarine': {
    desc: 'LinoMarine je prirodni linoleum posebno razvijen za opremanje pomorskih objekata — sa IMO sertifikatom, usklađen sa zahtevima za brodove i druga plovila. Izrađen od maksimalno 97% prirodnih sirovina, proizveden u Narniju u Italiji. Nudi širok izbor dezena, od tradicionalnog mermernog do suptilnih modernih, sa paletom prirodnih tonova i savremenih boja. Poseduje Cradle to Cradle® Silver sertifikat, a xf² zaštita površine obezbeđuje izuzetnu izdržljivost, lako čišćenje i ekonomično održavanje.',
    feats: ['Proizvedeno u Italiji', 'Testiran i usklađen sa IMO/MED uredbom za pomorsku industriju', 'Wheelmark sertifikat', 'Prirodno rešenje', 'Pogodan za recikliranje nakon upotrebe, spreman za ReStart program', 'Cradle to Cradle® Silver sertifikat', 'Izdržljiv i otporan na visok intenzitet kretanja', '50 boja u 4 dezena'],
  },
  'tarkett-originale-silencio-xf2-19db-3-8mm': {
    desc: 'Inspirisan čistoćom 100% lanenog dizajna, Originale spaja prepoznatljive šare sa mekim bojama od najfinijih pigmenata i paletom tonova iz prirode. Akustičko rešenje sa redukcijom zvuka od 19 dB i prijatnom udobnošću pod nogama. Izrađen od do 97% prirodnih sirovina, sa jedinstvenom xf² zaštitom površine za izuzetnu izdržljivost, lako čišćenje i ekonomično održavanje.',
    feats: ['Redukcija zvuka od 19 dB', 'Dobra udobnost pod nogama', 'Meke boje inspirisane prirodom sa pažljivo odabranim pigmentima', 'Pogodan za recikliranje nakon upotrebe', 'Cradle to Cradle® Silver sertifikat', 'Ekskluzivni xf² tretman površine za izdržljivost i hemijsku otpornost'],
  },
  'tarkett-originale-xf2-2-5mm': {
    desc: 'Inspirisan čistoćom 100% lanenog dizajna, Originale spaja prepoznatljive šare sa mekim bojama od najfinijih pigmenata i paletom tonova iz prirode. Izrađen od 97% prirodnih sirovina i 77% obnovljivih materijala — jedno od najodrživijih podnih rešenja na tržištu. Površina je obrađena jedinstvenom xf² zaštitom za izuzetnu izdržljivost, lako čišćenje i ekonomično održavanje, sa Cradle to Cradle® Silver sertifikatom. Deo naše kružne selekcije.',
    feats: ['Ugljenično negativan od proizvodnje do isporuke', 'Pogodan za recikliranje nakon upotrebe', 'Cradle to Cradle® Silver sertifikat', 'Meke boje inspirisane prirodom sa pažljivo odabranim pigmentima', 'Ekskluzivni xf² tretman površine za izdržljivost i hemijsku otpornost'],
  },
  'tarkett-originale-xf2-bfl-2-5mm': {
    desc: 'Inspirisan čistoćom 100% lanenog dizajna, Originale spaja prepoznatljive šare sa mekim bojama od najfinijih pigmenata i paletom tonova iz prirode. Izrađen od do 97% prirodnih sirovina, sa jedinstvenom xf² zaštitom površine za izuzetnu izdržljivost, lako čišćenje i ekonomično održavanje. Klasu reakcije na požar Bfl postiže prirodno, bez usporivača plamena, pa je pogodan i za evakuacione puteve.',
    feats: ['Klasa reakcije na požar Bfl — bez dodatih usporivača plamena', 'Ugljenično negativan od proizvodnje do isporuke', 'Pogodan za recikliranje nakon upotrebe', 'Cradle to Cradle® Silver sertifikat', 'Meke boje inspirisane prirodom sa pažljivo odabranim pigmentima', 'Ekskluzivni xf² tretman površine za izdržljivost i hemijsku otpornost'],
  },
  'tarkett-style-elle-silencio-xf2-19db-3-8mm': {
    desc: 'Kreativan, dinamičan uzorak sa usmerenim linearnim dizajnom, idealan za osećaj pravca u hodnicima i otvorenim prostorima. Akustičko rešenje sa redukcijom zvuka od 19 dB i prijatnom udobnošću pod nogama. Izrađen od do 97% prirodnih sirovina, sa jedinstvenom xf² zaštitom površine za izuzetnu izdržljivost, lako čišćenje i ekonomično održavanje.',
    feats: ['Redukcija zvuka od 19 dB', 'Dobra udobnost pod nogama', 'Pravolinijski dizajn sa mat izgledom', 'Pogodan za recikliranje nakon upotrebe', 'Cradle to Cradle® Silver sertifikat', 'Ekskluzivni xf² tretman površine za izdržljivost i hemijsku otpornost'],
  },
  'tarkett-style-elle-xf2-2-5-mm': {
    desc: 'Kreativan, dinamičan uzorak sa usmerenim linearnim dizajnom, idealan za osećaj pravca u hodnicima i otvorenim prostorima. Izrađen od do 97% prirodnih sirovina — jedno od najodrživijih podnih rešenja na tržištu — sa jedinstvenom xf² zaštitom površine za izuzetnu izdržljivost, lako čišćenje i ekonomično održavanje.',
    feats: ['Pravolinijski dizajn sa mat izgledom', 'Ugljenično negativan od proizvodnje do isporuke', 'Pogodan za recikliranje nakon upotrebe', 'Cradle to Cradle® Silver sertifikat', 'Ekskluzivni xf² tretman površine za izdržljivost i hemijsku otpornost'],
  },
  'tarkett-style-elle-xf2-bfl-2-5-mm': {
    desc: 'Kreativan, dinamičan uzorak sa usmerenim linearnim dizajnom, idealan za osećaj pravca u hodnicima i otvorenim prostorima. Izrađen od do 97% prirodnih sirovina, sa jedinstvenom xf² zaštitom površine za izuzetnu izdržljivost, lako čišćenje i ekonomično održavanje. Klasu reakcije na požar Bfl postiže prirodno, bez usporivača plamena, pa je pogodan i za evakuacione puteve.',
    feats: ['Klasa reakcije na požar Bfl — bez dodatih usporivača plamena', 'Pravolinijski dizajn sa mat izgledom', 'Ugljenično negativan od proizvodnje do isporuke', 'Pogodan za recikliranje nakon upotrebe', 'Cradle to Cradle® Silver sertifikat', 'Ekskluzivni xf² tretman površine za izdržljivost i hemijsku otpornost'],
  },
  'tarkett-style-emme-silencio-xf2-19-db': {
    desc: 'Dizajn ton u ton sa suptilnim mermernim uzorkom — moderan klasik bezvremenskog kvaliteta. Akustičko rešenje sa redukcijom zvuka od 19 dB i prijatnom udobnošću pod nogama. Izrađen od do 97% prirodnih sirovina, sa jedinstvenom xf² zaštitom površine za izuzetnu izdržljivost, lako čišćenje i ekonomično održavanje.',
    feats: ['Redukcija zvuka od 19 dB', 'Dobra udobnost pod nogama', 'Kombinacija ton na ton sa suptilnim mermernim uzorkom i mat izgledom', 'Pogodan za recikliranje nakon upotrebe', 'Cradle to Cradle® Silver sertifikat', 'Ekskluzivni xf² tretman površine za izdržljivost i hemijsku otpornost'],
  },
  'tarkett-style-emme-xf2-2-5-mm': {
    desc: 'Dizajn ton u ton sa suptilnim mermernim uzorkom stvara moderan klasik bezvremenskog kvaliteta. Izrađen od do 97% prirodnih sirovina — jedno od najodrživijih podnih rešenja na tržištu. Površina je obrađena jedinstvenom xf² tehnologijom za izuzetnu izdržljivost, lako čišćenje i ekonomično održavanje.',
    feats: ['Kombinacija ton na ton sa suptilnim mermernim uzorkom i mat izgledom', 'Ugljenično negativan od proizvodnje do isporuke', 'Pogodan za recikliranje nakon upotrebe', 'Cradle to Cradle® Silver sertifikat', 'Ekskluzivni xf² tretman površine za izdržljivost i hemijsku otpornost'],
  },
  'tarkett-style-emme-xf2-bfl-2-5-mm': {
    desc: 'Dizajn ton u ton sa suptilnim mermernim uzorkom — moderan klasik bezvremenskog kvaliteta. Izrađen od do 97% prirodnih sirovina, sa jedinstvenom xf² zaštitom površine za izuzetnu izdržljivost, lako čišćenje i ekonomično održavanje. Klasu reakcije na požar Bfl postiže prirodno, bez usporivača plamena, pa je pogodan i za evakuacione puteve.',
    feats: ['Klasa reakcije na požar Bfl — bez dodatih usporivača plamena', 'Kombinacija ton na ton sa suptilnim mermernim uzorkom i mat izgledom', 'Ugljenično negativan od proizvodnje do isporuke', 'Pogodan za recikliranje nakon upotrebe', 'Cradle to Cradle® Silver sertifikat', 'Ekskluzivni xf² tretman površine za izdržljivost i hemijsku otpornost'],
  },
  'tarkett-trentino-xf2-bfl-2-5-mm': {
    desc: 'Kreativan i živ višebojni uzorak sa polusmernim dizajnom. Izrađen od do 97% prirodnih sirovina, sa jedinstvenom xf² zaštitom površine za izuzetnu izdržljivost, lako čišćenje i ekonomično održavanje. Klasu reakcije na požar Bfl postiže prirodno, bez usporivača plamena, pa je pogodan i za evakuacione puteve.',
    feats: ['Klasa reakcije na požar Bfl — bez dodatih usporivača plamena', 'Višebojni uzorak sa laganim, polusmernim dizajnom i mat izgledom', 'Ugljenično negativan od proizvodnje do isporuke', 'Pogodan za recikliranje nakon upotrebe', 'Cradle to Cradle® Silver sertifikat', 'Ekskluzivni xf² tretman površine za izdržljivost i hemijsku otpornost'],
  },
  'tarkett-veneto-acoustic-cork-xf2-15-db-4-4-mm': {
    desc: 'Veneto linoleum sa 100% prirodnim podslojem od plute koji donosi redukciju zvuka od 15 dB i prijatnu udobnost pod nogama. Efekat mermera nasleđa sa živim bojama za autentičan izgled. Izrađen od do 97% prirodnih sirovina, sa jedinstvenom xf² zaštitom površine za izuzetnu izdržljivost, lako čišćenje i ekonomično održavanje.',
    feats: ['Redukcija zvuka od 15 dB', 'Dobra udobnost pod nogama', 'Efekat mermera nasleđa sa mat izgledom', 'Ugljenično negativan od proizvodnje do isporuke', 'Pogodan za recikliranje nakon upotrebe', 'Cradle to Cradle® Silver sertifikat', 'Ekskluzivni xf² tretman površine za izdržljivost i hemijsku otpornost'],
  },
  'tarkett-veneto-essenza-2-5-mm': {
    desc: 'Klasičan efekat mermera sa vibrantnim bojama za autentičan i elegantan izgled. Izrađen od do 97% prirodnih sirovina — jedno od najodrživijih podnih rešenja na tržištu. Površina je obrađena novom Essenza+ zaštitom (unapređeni ne-PU akril) za izdržljivost, lako čišćenje i ekonomično održavanje.',
    feats: ['Efekat mermera u klasičnom stilu sa mat površinom', 'Ugljenično negativan od proizvodnje do isporuke', 'Pogodan za recikliranje nakon upotrebe', 'Cradle to Cradle® Silver sertifikat', 'Essenza+ ne-PU akrilna zaštita površine sa poboljšanom izdržljivošću'],
  },
  'tarkett-veneto-sicuro-xf2-r10-2-5mm': {
    desc: 'Klasičan efekat mermera sa živim bojama za autentičan i elegantan izgled. Sa otpornošću na klizanje R10 za sigurno prianjanje, idealan je za ulaze u zgrade. Izrađen od do 97% prirodnih sirovina — jedno od najodrživijih podnih rešenja na tržištu — sa jedinstvenom xf² zaštitom površine za izuzetnu izdržljivost, lako čišćenje i ekonomično održavanje.',
    feats: ['Otpornost na klizanje R10', 'Efekat mermera sa mat izgledom', 'Ugljenično negativan od proizvodnje do isporuke', 'Pogodan za recikliranje nakon upotrebe', 'Cradle to Cradle® Silver sertifikat', 'Ekskluzivni xf² tretman površine za izdržljivost i hemijsku otpornost'],
  },
  'tarkett-veneto-silencio-xf2-19db-3-8mm': {
    desc: 'Efekat mermera sa živim bojama za autentičan izgled. Akustičko rešenje sa redukcijom zvuka od 19 dB i prijatnom udobnošću pod nogama. Izrađen od do 97% prirodnih sirovina, sa jedinstvenom xf² zaštitom površine za izuzetnu izdržljivost, lako čišćenje i ekonomično održavanje.',
    feats: ['Redukcija zvuka od 19 dB', 'Dobra udobnost pod nogama', 'Efekat mermera sa mat izgledom', 'Pogodan za recikliranje nakon upotrebe', 'Cradle to Cradle® Silver sertifikat', 'Ekskluzivni xf² tretman površine za izdržljivost i hemijsku otpornost'],
  },
  'tarkett-veneto-xf2-2-0-mm': {
    desc: 'Veneto xf² u debljini od 2 mm. Efekat mermera sa živim bojama za autentičan izgled. Izrađen od do 97% prirodnih sirovina — jedno od najodrživijih podnih rešenja na tržištu — sa jedinstvenom xf² zaštitom površine za izuzetnu izdržljivost, lako čišćenje i ekonomično održavanje.',
    feats: ['Efekat mermera sa mat izgledom', 'Debljina 2 mm', 'Pogodan za recikliranje nakon upotrebe', 'Cradle to Cradle® Silver sertifikat', 'Ekskluzivni xf² tretman površine za izdržljivost i hemijsku otpornost'],
  },
  'tarkett-veneto-xf2-3-2-mm': {
    desc: 'Veneto xf² u debljini od 3,2 mm. Efekat mermera sa živim bojama za autentičan izgled. Izrađen od do 97% prirodnih sirovina — jedno od najodrživijih podnih rešenja na tržištu — sa jedinstvenom xf² zaštitom površine za izuzetnu izdržljivost, lako čišćenje i ekonomično održavanje.',
    feats: ['Efekat mermera sa mat izgledom', 'Debljina 3,2 mm', 'Pogodan za recikliranje nakon upotrebe', 'Cradle to Cradle® Silver sertifikat', 'Ekskluzivni xf² tretman površine za izdržljivost i hemijsku otpornost'],
  },
  'tarkett-veneto-xf2-bfl-2-5-mm': {
    desc: 'Efekat mermera sa živopisnim bojama za autentičan izgled. Izrađen od do 97% prirodnih sirovina — jedno od najodrživijih podnih rešenja na tržištu — sa jedinstvenom xf² zaštitom površine za izuzetnu izdržljivost, lako čišćenje i ekonomično održavanje. Klasu reakcije na požar Bfl postiže prirodno, bez usporivača plamena, pa je pogodan i za evakuacione puteve.',
    feats: ['Klasa reakcije na požar Bfl — bez dodatih usporivača plamena', 'Efekat mermera sa mat izgledom', 'Ugljenično negativan od proizvodnje do isporuke', 'Pogodan za recikliranje nakon upotrebe', 'Cradle to Cradle® Silver sertifikat', 'Ekskluzivni xf² tretman površine za izdržljivost i hemijsku otpornost'],
  },
};

const data = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'));
let applied = 0;
const sample = [];
for (const col of (data.collections || [])) {
  const r = REWRITES[col.slug];
  if (!r) { console.log('⚠️ nema prepravke za:', col.slug); continue; }
  const beforeDesc = col.description;
  col.description = r.desc;
  // shortDescription/categoryDescription su kopije opisa (sa istim lošim frazama) — usaglasi ih.
  if (typeof col.shortDescription === 'string') col.shortDescription = r.desc;
  if (typeof col.categoryDescription === 'string') col.categoryDescription = r.desc;
  if (Array.isArray(col.detailsSections) && col.detailsSections[0]) {
    col.detailsSections[0].items = r.feats;
  } else {
    col.detailsSections = [{ title: 'Ključne karakteristike', items: r.feats }];
  }
  // Svaka boja nosi KOPIJU opisa kolekcije (tu su loše fraze "stepen požara"/"kf²" itd. iz
  // mašinskog prevoda) — propagiraj prepravljen opis na sve boje da PDP po boji bude isti tekst.
  for (const color of (col.colors || [])) {
    if (color && typeof color.description === 'string') color.description = r.desc;
  }
  applied++;
  if (sample.length < 2) sample.push({ slug: col.slug, before: beforeDesc.slice(0, 90), after: r.desc.slice(0, 90) });
}
console.log('Prepravljeno kolekcija:', applied, '/', (data.collections || []).length);
data.generatedAt = data.generatedAt; // bez diranja
core.writeJsonWithBackup(JSON_PATH, data, 'fix-linoleum-descriptions');
console.log('Upisano sa backup-om.');
