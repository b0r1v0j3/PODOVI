// Vrati dijakritiku + prevedi zaostale engleske reči u 9 ASCII-srpskih opisa
// (GTI/Attraction industrijske, DLW sport, Mipolam clean-room). Isti sadržaj, ispravan pravopis.
const fs = require('fs');
const path = require('path');
const core = require('./lib/ingest-core.js');

const FIX = {
    'industrial_colors.json': {
        'gti-max-cleantech': `Opis:
GTI Max Cleantech su modularne industrijske ploče za čiste tehničke prostore i brzu renovaciju bez dugog prekida rada.

Ugradnja:
Loose lay / Connect sistem sa vodonepropusnim rešenjem za zahtevne objekte.

Primena:
Clean room, farmacija, laboratorije, proizvodnja i logistika sa visokim saobraćajem.

Ključne prednosti:
Pogodno za clean room.
Vodonepropusan sistem.
Otpornost na visok saobraćaj.`,
        'gti-max-connect': `Opis:
GTI Max Connect su industrijske ploče za brze renovacije, logistiku i zone sa velikim opterećenjem gde je važno brzo puštanje prostora u rad.

Ugradnja:
Loose lay / Connect sistem bez komplikovane pripreme podloge.

Primena:
Industrija, logistika, radionice, skladišta i prostori visokog saobraćaja.

Ključne prednosti:
Loose lay ugradnja.
Visok saobraćaj.
Laka renovacija.`,
        'gti-pure-connect': `Opis:
GTI Pure Connect su modularne ploče za komercijalne i tehničke prostore gde je važna brza renovacija, dobar habajući sloj i čisto, uredno zoniranje.

Ugradnja:
Loose lay / Connect sistem za brzo puštanje prostora u rad.

Primena:
Komercijalni i tehnički prostori, radionice, izložbeni prostori i zone visokog saobraćaja.

Ključne prednosti:
Loose lay ugradnja.
Visok saobraćaj.
Laka renovacija.`,
        'attraction-connect': `Opis:
Attraction Connect su dekorativne tehničke ploče za prostore gde je potrebno brzo obnoviti pod i dobiti jaku vizuelnu signalizaciju kroz boju i dezen.

Ugradnja:
Loose lay / Connect sistem za brzu ugradnju i jednostavnu parcijalnu zamenu ploča.

Primena:
Komercijalni i industrijski prostori, brze renovacije, zone signalizacije i intenzivnog prolaza.

Ključne prednosti:
Loose lay ugradnja.
Trend boje.
Laka renovacija.`,
    },
    'sport_colors.json': {
        'dlw-colorette-sport': `Opis:
DLW Colorette Sport je prirodni sportski linoleum za sale i više-namenske sportske prostore, sa izraženijom paletom boja i Neocare površinom.

Ugradnja:
Lepljenje u sistemu sportskog poda; linije terena mogu se nanositi nakon ugradnje.

Primena:
Školske sale, sportske dvorane, gimnazije i rekreativni objekti.

Ključne prednosti:
Prirodni sportski pod.
Premium sportski dizajn.
Neocare površinska obrada.`,
        'dlw-marmorette-sport-32mm': `Opis:
DLW Marmorette Sport 3.2mm je sportski linoleum sa mramornim izgledom za sale i gimnastičke prostore gde je važna prirodna osnova i lakši izbor boja.

Ugradnja:
Lepljenje u sistemu sportskog poda sa mogućnošću naknadnog obeležavanja linija.

Primena:
Sportske sale, gimnastički prostori i više-namenski objekti.

Ključne prednosti:
3.2 mm debljina.
8 boja za slobodno kombinovanje.
Prirodni sportski linoleum.`,
        'dlw-linodur-sport': `Opis:
DLW Linodur Sport je prirodni sportski linoleum za unutrašnje više-namenske sportske sale i gimnazije, sa suptilnim zrnastim dizajnom i Neocare površinom.

Ugradnja:
Lepljenje; lako se seče i postavlja, bez potrebe za dodatnim premazom odmah nakon ugradnje.

Primena:
Unutrašnje sportske sale, gimnazije i više-namenski sportski prostori.

Ključne prednosti:
98% prirodnih sastojaka.
Mat efekat i moderna suptilna zrnasta tekstura.
Lako održavanje i dobro klizanje/prijanjanje u sportskom okruženju.`,
    },
    'vinyl_special_colors.json': {
        'mipolam-biocontrol-clean': `Opis:
Mipolam Biocontrol Clean je homogeni vinil za clean room, laboratorije i farmaceutske prostore gde su higijena, hemijska otpornost i dugoročna dekontaminacija podjednako važni.

Ugradnja:
Lepljenje na pripremljenu podlogu uz zavarivanje spojeva i detalja za visok nivo higijene.

Primena:
Clean room, farmacija, laboratorije, zdravstveni i tehnički prostori sa visokim zahtevima za čistoću.

Ključne prednosti:
Odlična otpornost na H2O2, mrlje i hemikalije.
Visoka otpornost na bakterije i viruse.
Pogodno za nuklearnu dekontaminaciju i jak saobraćaj.`,
        'mipolam-biocontrol-performance': `Opis:
Mipolam Biocontrol Performance je homogeni vinil za clean room i tehničke prostore u kojima su potrebni hemijska otpornost, otpornost na procese dekontaminacije i stabilan rad pri velikom opterećenju.

Ugradnja:
Lepljenje na pripremljenu podlogu uz zavarivanje spojeva za visoke higijenske standarde.

Primena:
Clean room, nuklearni i tehnički prostori, laboratorije i objekti sa intenzivnim saobraćajem.

Ključne prednosti:
Odlična otpornost na procese dekontaminacije, hemikalije i mikroorganizme.
Prilagođen clean room i tehničkim objektima sa visokim opterećenjem.
Biosadržaj 17%.`,
    },
};

let total = 0;
for (const [file, bySlug] of Object.entries(FIX)) {
    const fp = path.join(process.cwd(), 'public', 'data', file);
    const d = JSON.parse(fs.readFileSync(fp, 'utf8'));
    let applied = 0;
    const setOn = (node, key) => {
        if (!node) return;
        if ((node.slug === key || node.collection === key) && typeof node.description === 'string') {
            node.description = bySlug[key];
            applied++;
        }
    };
    const walk = (arr) => {
        for (const c of (arr || [])) {
            for (const key of Object.keys(bySlug)) {
                setOn(c, key);
                // propagiraj na boje kolekcije čiji slug se poklapa
                if (c && (c.slug === key) && Array.isArray(c.colors)) {
                    for (const col of c.colors) if (col && typeof col.description === 'string') { col.description = bySlug[key]; applied++; }
                }
            }
            if (c && Array.isArray(c.colors)) walk(c.colors);
        }
    };
    walk(Array.isArray(d.collections) ? d.collections : []);
    walk(Array.isArray(d.colors) ? d.colors : []);
    if (applied > 0) { core.writeJsonWithBackup(fp, d, 'fix-ascii-' + file.replace(/\.json$/, '')); console.log(`✏️ ${file}: ${applied} izmena`); total += applied; }
    else console.log(`⚠️ ${file}: 0 (slugovi nisu nađeni!)`);
}
console.log('UKUPNO:', total);
