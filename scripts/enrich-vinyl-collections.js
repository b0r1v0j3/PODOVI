/**
 * Enrich Vinyl Collections with Serbian descriptions and characteristics
 * 
 * All 23 Gerflor vinyl collections currently have ZERO descriptions and ZERO specs.
 * This script adds professional Serbian descriptions and basic technical characteristics.
 * 
 * Run: node scripts/enrich-vinyl-collections.js
 */

const fs = require('fs');
const path = require('path');

const jsonPath = path.join(__dirname, '..', 'public', 'data', 'vinyl_colors_complete.json');
const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

// Collection-level descriptions and specs for all 23 Gerflor vinyl collections
const collectionEnrichment = {
    // === MIPOLAM (Homogeni vinil podovi) ===
    'mipolam-accord': {
        description: `Proizvod:
Gerflor Mipolam Accord — profesionalni homogeni vinil podovi sa Evercare™ površinskom obradom.
Kompaktan, jednoslojan dizajn sa harmoničnom paletom boja.
Dizajniran za srednje do visoko opterećene komercijalne prostore.

Ugradnja:
Lepljenje na pripremljenu podlogu.
Obavezno varenje spojeva termovarilnom elektrodom.
Kompatibilno sa podnim grejanjem.

Primena:
Kancelarije i poslovni prostori.
Obrazovne ustanove.
Trgovinski objekti.

Održivost:
Bez ftalata.
100% reciklabilno po završetku životnog veka.
Niske VOC emisije — A+ ocena.`,
        characteristics: {
            'Tip': 'Homogeni vinil',
            'Format': 'Rolna',
            'Ukupna debljina': '2.0 mm',
            'Sloj habanja': 'Kroz celu debljinu',
            'Površinska obrada': 'Evercare™',
            'Klasa upotrebe': 'Klasa 34/43',
            'Vatrostojnost': 'Bfl-s1',
            'Tip instalacije': 'Lepljenje',
        },
    },
    'mipolam-affinity': {
        description: `Proizvod:
Gerflor Mipolam Affinity — homogeni vinil pod sa organskim vizuelnim efektima.
Bogata paleta od 50 boja sa suptilnim šarama inspirisanim prirodom.
Evercare™ površinska obrada za lako održavanje.

Ugradnja:
Lepljenje na pripremljenu podlogu.
Obavezno varenje spojeva.
Kompatibilno sa podnim grejanjem.

Primena:
Zdravstvene ustanove i bolnice.
Obrazovne institucije.
Kancelarijski prostori.
Prostori sa visokim prometom.

Održivost:
Bez ftalata.
100% reciklabilno.
Niske VOC emisije.`,
        characteristics: {
            'Tip': 'Homogeni vinil',
            'Format': 'Rolna',
            'Ukupna debljina': '2.0 mm',
            'Sloj habanja': 'Kroz celu debljinu',
            'Površinska obrada': 'Evercare™',
            'Klasa upotrebe': 'Klasa 34/43',
            'Vatrostojnost': 'Bfl-s1',
            'Tip instalacije': 'Lepljenje',
        },
    },
    'mipolam-affinity-608x608': {
        description: `Proizvod:
Gerflor Mipolam Affinity 608x608 — homogeni vinil pod u formatu pločica.
Ista paleta od 50 boja kao Affinity rolna, ali u praktičnom formatu 608x608 mm.
Idealan za prostore gde je potrebna fleksibilnost u dizajnu i lakša zamena oštećenih delova.

Ugradnja:
Lepljenje na pripremljenu podlogu.
Format pločica olakšava ugradnju u nepravilnim prostorima.

Primena:
Zdravstvene ustanove.
Obrazovne institucije.
Prostori gde je potrebna laka zamena pojedinačnih pločica.

Održivost:
Bez ftalata.
100% reciklabilno.`,
        characteristics: {
            'Tip': 'Homogeni vinil',
            'Format': 'Pločice 608x608 mm',
            'Ukupna debljina': '2.0 mm',
            'Sloj habanja': 'Kroz celu debljinu',
            'Površinska obrada': 'Evercare™',
            'Klasa upotrebe': 'Klasa 34/43',
            'Vatrostojnost': 'Bfl-s1',
            'Tip instalacije': 'Lepljenje',
        },
    },
    'mipolam-astro': {
        description: `Proizvod:
Gerflor Mipolam Astro — homogeni vinil pod dizajniran za čiste sobe i laboratorije.
Antistatički pod sa ESD (Electrostatic Discharge) zaštitom.
Evercare™ površinska obrada za najlakše održavanje.

Ugradnja:
Lepljenje na pripremljenu podlogu.
Varenje spojeva termovarilnom elektrodom.
Provodni sistem za ESD zaštitu.

Primena:
Čiste sobe i laboratorije.
IT prostori i server sobe.
Elektronska industrija.

Održivost:
Bez ftalata.
100% reciklabilno.`,
        characteristics: {
            'Tip': 'Homogeni vinil — ESD',
            'Format': 'Rolna',
            'Ukupna debljina': '2.0 mm',
            'Površinska obrada': 'Evercare™',
            'Klasa upotrebe': 'Klasa 34/43',
            'Vatrostojnost': 'Bfl-s1',
            'ESD zaštita': 'Da',
            'Tip instalacije': 'Lepljenje',
        },
    },
    'mipolam-bioplanet': {
        description: `Proizvod:
Gerflor Mipolam Bioplanet — ekološki homogeni vinil pod sa visokim sadržajem recikliranih materijala.
Bogata paleta od 40 boja sa organskim teksturama.
Osmišljen sa fokusom na održivost i smanjenje ekološkog otiska.

Ugradnja:
Lepljenje na pripremljenu podlogu.
Varenje spojeva.
Kompatibilno sa podnim grejanjem.

Primena:
Obrazovne ustanove i vrtići.
Kancelarije sa visokim zahtevima za održivošću.
Javne ustanove.

Održivost:
Bez ftalata.
Visok sadržaj recikliranih materijala.
100% reciklabilno.
Niske VOC emisije.`,
        characteristics: {
            'Tip': 'Homogeni vinil — ekološki',
            'Format': 'Rolna',
            'Ukupna debljina': '2.0 mm',
            'Sloj habanja': 'Kroz celu debljinu',
            'Površinska obrada': 'Evercare™',
            'Klasa upotrebe': 'Klasa 34/43',
            'Vatrostojnost': 'Bfl-s1',
            'Tip instalacije': 'Lepljenje',
        },
    },
    'mipolam-classic-1-5mm': {
        description: `Proizvod:
Gerflor Mipolam Classic 1.5 mm — ekonomičan homogeni vinil pod.
Tanja verzija (1.5 mm) za projekte sa umerenim budžetom.
Kompaktan jednoslojan dizajn.

Ugradnja:
Lepljenje na pripremljenu podlogu.
Varenje spojeva.

Primena:
Komercijalni prostori sa umerenim prometom.
Renoviranje postojećih prostora.

Održivost:
Bez ftalata.
100% reciklabilno.`,
        characteristics: {
            'Tip': 'Homogeni vinil',
            'Format': 'Rolna',
            'Ukupna debljina': '1.5 mm',
            'Sloj habanja': 'Kroz celu debljinu',
            'Klasa upotrebe': 'Klasa 34/43',
            'Vatrostojnost': 'Bfl-s1',
            'Tip instalacije': 'Lepljenje',
        },
    },
    'mipolam-classic-2mm': {
        description: `Proizvod:
Gerflor Mipolam Classic 2mm — klasičan homogeni vinil pod standardne debljine.
Dokazano rešenje za profesionalne komercijalne prostore.
Jednoslojan dizajn sa konzistentnim izgledom.

Ugradnja:
Lepljenje na pripremljenu podlogu.
Varenje spojeva termovarilnom elektrodom.
Kompatibilno sa podnim grejanjem.

Primena:
Komercijalni i javni prostori.
Obrazovne ustanove.
Zdravstvene ustanove.

Održivost:
Bez ftalata.
100% reciklabilno.`,
        characteristics: {
            'Tip': 'Homogeni vinil',
            'Format': 'Rolna',
            'Ukupna debljina': '2.0 mm',
            'Sloj habanja': 'Kroz celu debljinu',
            'Površinska obrada': 'Evercare™',
            'Klasa upotrebe': 'Klasa 34/43',
            'Vatrostojnost': 'Bfl-s1',
            'Tip instalacije': 'Lepljenje',
        },
    },
    'mipolam-elegance': {
        description: `Proizvod:
Gerflor Mipolam Elegance — premium homogeni vinil pod sa elegantnim dizajnima.
Sofisticirane boje sa suptilnim šarama za ekskluzivne prostore.
Evercare™ površinska obrada za dugotrajnu lepotu.

Ugradnja:
Lepljenje na pripremljenu podlogu.
Varenje spojeva.
Kompatibilno sa podnim grejanjem.

Primena:
Poslovni prostori visokog standarda.
Hoteli i recepcije.
Zdravstvene ustanove.
Reprezentativni javni prostori.

Održivost:
Bez ftalata.
100% reciklabilno.
Niske VOC emisije.`,
        characteristics: {
            'Tip': 'Homogeni vinil',
            'Format': 'Rolna',
            'Ukupna debljina': '2.0 mm',
            'Sloj habanja': 'Kroz celu debljinu',
            'Površinska obrada': 'Evercare™',
            'Klasa upotrebe': 'Klasa 34/43',
            'Vatrostojnost': 'Bfl-s1',
            'Tip instalacije': 'Lepljenje',
        },
    },
    'mipolam-planet': {
        description: `Proizvod:
Gerflor Mipolam Planet — homogeni vinil pod sa mermerno inspirisanim dizajnima.
Bogata paleta od 40 boja sa karakterističnim mineralnim šarama.
Idealan za prostore koji zahtevaju vizuelnu toplinu uz profesionalne performanse.

Ugradnja:
Lepljenje na pripremljenu podlogu.
Varenje spojeva.
Kompatibilno sa podnim grejanjem.

Primena:
Zdravstvene ustanove i bolnice.
Obrazovne institucije.
Javni objekti.

Održivost:
Bez ftalata.
100% reciklabilno.
Niske VOC emisije.`,
        characteristics: {
            'Tip': 'Homogeni vinil',
            'Format': 'Rolna',
            'Ukupna debljina': '2.0 mm',
            'Sloj habanja': 'Kroz celu debljinu',
            'Površinska obrada': 'Evercare™',
            'Klasa upotrebe': 'Klasa 34/43',
            'Vatrostojnost': 'Bfl-s1',
            'Tip instalacije': 'Lepljenje',
        },
    },
    'mipolam-symbioz': {
        description: `Proizvod:
Gerflor Mipolam Symbioz — inovativni homogeni vinil pod sa bio-baziranim sadržajem.
Kombinacija održivosti i modernog dizajna sa 31 bojom.
Evercare™ površinska obrada za jednostavno održavanje.

Ugradnja:
Lepljenje na pripremljenu podlogu.
Varenje spojeva.
Kompatibilno sa podnim grejanjem.

Primena:
Projekti sa zahtevima za zelenom gradnjom.
Obrazovne ustanove.
Kancelarijski prostori.

Održivost:
Sadržaj bio-baziranih materijala.
Bez ftalata.
100% reciklabilno.`,
        characteristics: {
            'Tip': 'Homogeni vinil — bio-baziran',
            'Format': 'Rolna',
            'Ukupna debljina': '2.0 mm',
            'Sloj habanja': 'Kroz celu debljinu',
            'Površinska obrada': 'Evercare™',
            'Klasa upotrebe': 'Klasa 34/43',
            'Vatrostojnost': 'Bfl-s1',
            'Tip instalacije': 'Lepljenje',
        },
    },
    'mipolam-troplan': {
        description: `Proizvod:
Gerflor Mipolam Troplan — troslojna elastična obloga povećane otpornosti na habanje.
Specijalizovana za ekstremno opterećene industrijske i komercijalne prostore.
Ojačana struktura za dugotrajne performanse.

Ugradnja:
Lepljenje na pripremljenu podlogu.
Varenje spojeva.

Primena:
Industrijski pogoni.
Skladišta i logistički centri.
Prostori sa teškim mašinama i kolicima.

Održivost:
Bez ftalata.
100% reciklabilno.`,
        characteristics: {
            'Tip': 'Troslojni vinil',
            'Format': 'Rolna',
            'Ukupna debljina': '2.0 mm',
            'Površinska obrada': 'Evercare™',
            'Klasa upotrebe': 'Klasa 34/43',
            'Vatrostojnost': 'Bfl-s1',
            'Tip instalacije': 'Lepljenje',
        },
    },

    // === NEROK (Heterogeni vinil podovi) ===
    'nerok-55': {
        description: `Proizvod:
Gerflor Nerok 55 — heterogeni vinil pod sa pojačanim slojem habanja od 0.55 mm.
Široka paleta od 36 boja sa realističnim dizajnima drveta i kamena.
Protecsol™ površinska obrada za dugotrajnu zaštitu.

Ugradnja:
Lepljenje na pripremljenu podlogu.
Varenje spojeva toplim varenjem.
Kompatibilno sa podnim grejanjem.

Primena:
Komercijalni prostori sa visokim prometom.
Hoteli i ugostiteljstvo.
Maloprodajni objekti.

Održivost:
Bez ftalata.
100% reciklabilno.
Niske VOC emisije.`,
        characteristics: {
            'Tip': 'Heterogeni vinil',
            'Format': 'Rolna',
            'Ukupna debljina': '2.0 mm',
            'Sloj habanja': '0.55 mm',
            'Površinska obrada': 'Protecsol™',
            'Klasa upotrebe': 'Klasa 34/43',
            'Vatrostojnost': 'Bfl-s1',
            'Tip instalacije': 'Lepljenje',
        },
    },
    'nerok-70': {
        description: `Proizvod:
Gerflor Nerok 70 — heterogeni vinil pod sa premium slojem habanja od 0.70 mm.
Identična paleta dizajna kao Nerok 55, ali sa pojačanom otpornošću.
Protecsol™ površinska obrada za najzahtevnije objekte.

Ugradnja:
Lepljenje na pripremljenu podlogu.
Varenje spojeva.
Kompatibilno sa podnim grejanjem.

Primena:
Objekti sa intenzivnim prometom.
Zdravstvene ustanove.
Javni i komercijalni prostori.

Održivost:
Bez ftalata.
100% reciklabilno.`,
        characteristics: {
            'Tip': 'Heterogeni vinil',
            'Format': 'Rolna',
            'Ukupna debljina': '2.6 mm',
            'Sloj habanja': '0.70 mm',
            'Površinska obrada': 'Protecsol™',
            'Klasa upotrebe': 'Klasa 34/43',
            'Vatrostojnost': 'Bfl-s1',
            'Tip instalacije': 'Lepljenje',
        },
    },

    // === PREMIUM (Heterogeni vinil sa specijalnim izgledom) ===
    'premium-acoustic': {
        description: `Proizvod:
Gerflor Premium Acoustic — heterogeni vinil pod sa akustičnom podlogom.
Smanjenje buke koraka za 17 dB za udobnije okruženje.
Raznovrsni dizajni drveta, kamena i apstraktnih uzoraka.

Ugradnja:
Lepljenje na pripremljenu podlogu.
Akustična podloga integrisana u proizvod — nije potrebna dodatna izolacija.

Primena:
Hoteli i smeštajni objekti.
Kancelarije gde je tišina prioritet.
Stambeni prostori premium klase.
Domovi za stare i zdravstvene ustanove.

Održivost:
Bez ftalata.
100% reciklabilno.`,
        characteristics: {
            'Tip': 'Heterogeni vinil — akustički',
            'Format': 'Rolna',
            'Ukupna debljina': '3.35 mm',
            'Sloj habanja': '0.70 mm',
            'Smanjenje buke': '17 dB',
            'Klasa upotrebe': 'Klasa 34/43',
            'Vatrostojnost': 'Bfl-s1',
            'Tip instalacije': 'Lepljenje',
        },
    },
    'premium-compact': {
        description: `Proizvod:
Gerflor Premium Compact — heterogeni vinil pod sa kompaktnom strukturom.
Široka paleta od 81 boje sa realističnim dizajnima drveta, kamena i kreativnim uzorcima.
Kompaktna konstrukcija za prostore sa teškim opterećenjem.

Ugradnja:
Lepljenje na pripremljenu podlogu.
Varenje spojeva.
Kompatibilno sa podnim grejanjem.

Primena:
Komercijalni prostori visokog prometa.
Maloprodajni objekti.
Ugostiteljstvo.

Održivost:
Bez ftalata.
100% reciklabilno.
Niske VOC emisije.`,
        characteristics: {
            'Tip': 'Heterogeni vinil — kompaktni',
            'Format': 'Rolna',
            'Ukupna debljina': '2.0 mm',
            'Sloj habanja': '0.70 mm',
            'Klasa upotrebe': 'Klasa 34/43',
            'Vatrostojnost': 'Bfl-s1',
            'Tip instalacije': 'Lepljenje',
        },
    },

    // === TARALAY (Dizajnerski heterogeni vinil) ===
    'taralay-impression-acoustic': {
        description: `Proizvod:
Gerflor Taralay Impression Acoustic — premium heterogeni vinil sa akustičnom podlogom.
Izuzetni vizuelni efekti sa dubinom i teksturom — 96 dizajna.
Smanjenje buke koraka za 17 dB.

Ugradnja:
Lepljenje na pripremljenu podlogu.
Integrisana akustična podloga.
Kompatibilno sa podnim grejanjem.

Primena:
Hoteli i premium smeštajni objekti.
Zdravstvene ustanove.
Obrazovne institucije.
Luksuzni komercijalni prostori.

Održivost:
Bez ftalata.
100% reciklabilno.
Niske VOC emisije.`,
        characteristics: {
            'Tip': 'Heterogeni vinil — akustički',
            'Format': 'Rolna',
            'Ukupna debljina': '3.35 mm',
            'Sloj habanja': '0.70 mm',
            'Smanjenje buke': '17 dB',
            'Klasa upotrebe': 'Klasa 34/43',
            'Vatrostojnost': 'Bfl-s1',
            'Tip instalacije': 'Lepljenje',
        },
    },
    'taralay-impression-compact': {
        description: `Proizvod:
Gerflor Taralay Impression Compact — premium heterogeni vinil sa kompaktnom strukturom.
Ista paleta izuzetnih dizajna kao Impression Acoustic, u kompaktnom formatu.
Protecsol 2PUR™ površinska obrada za vrhunsku zaštitu.

Ugradnja:
Lepljenje na pripremljenu podlogu.
Varenje spojeva.
Kompatibilno sa podnim grejanjem.

Primena:
Komercijalni prostori sa visokim prometom.
Hoteli i restorani.
Maloprodajni objekti.

Održivost:
Bez ftalata.
100% reciklabilno.`,
        characteristics: {
            'Tip': 'Heterogeni vinil — kompaktni',
            'Format': 'Rolna',
            'Ukupna debljina': '2.0 mm',
            'Sloj habanja': '0.70 mm',
            'Površinska obrada': 'Protecsol 2PUR™',
            'Klasa upotrebe': 'Klasa 34/43',
            'Vatrostojnost': 'Bfl-s1',
            'Tip instalacije': 'Lepljenje',
        },
    },
    'taralay-impression-hop-acoustic': {
        description: `Proizvod:
Gerflor Taralay Impression Hop Acoustic — dizajnerski vinil sa akustičnom podlogom.
"Hop" kolekcija sa kreativnim geometrijskim i apstraktnim uzorcima.
Smanjenje buke koraka za tiho i udobno okruženje.

Ugradnja:
Lepljenje na pripremljenu podlogu.
Integrisana akustična podloga.

Primena:
Obrazovne ustanove i vrtići.
Kreativni kancelarijski prostori.
Zdravstvene ustanove.

Održivost:
Bez ftalata.
100% reciklabilno.`,
        characteristics: {
            'Tip': 'Heterogeni vinil — akustički',
            'Format': 'Rolna',
            'Ukupna debljina': '3.35 mm',
            'Sloj habanja': '0.65 mm',
            'Smanjenje buke': '17 dB',
            'Klasa upotrebe': 'Klasa 34/43',
            'Vatrostojnost': 'Bfl-s1',
            'Tip instalacije': 'Lepljenje',
        },
    },
    'taralay-impression-hop-compact': {
        description: `Proizvod:
Gerflor Taralay Impression Hop Compact — dizajnerski vinil sa kompaktnom strukturom.
Kreativni geometrijski i apstraktni uzorci u kompaktnom formatu.
Protecsol 2PUR™ površinska obrada.

Ugradnja:
Lepljenje na pripremljenu podlogu.
Varenje spojeva.

Primena:
Obrazovne ustanove.
Kreativni prostori.
Komercijalni objekti.

Održivost:
Bez ftalata.
100% reciklabilno.`,
        characteristics: {
            'Tip': 'Heterogeni vinil — kompaktni',
            'Format': 'Rolna',
            'Ukupna debljina': '2.0 mm',
            'Sloj habanja': '0.65 mm',
            'Površinska obrada': 'Protecsol 2PUR™',
            'Klasa upotrebe': 'Klasa 34/43',
            'Vatrostojnost': 'Bfl-s1',
            'Tip instalacije': 'Lepljenje',
        },
    },
    'taralay-initial-acoustic': {
        description: `Proizvod:
Gerflor Taralay Initial Acoustic — heterogeni vinil ulaznog nivoa sa akustičnom podlogom.
Kvalitetni dizajni drveta i kamena po pristupačnoj ceni.
Smanjenje buke koraka za udobniji prostor.

Ugradnja:
Lepljenje na pripremljenu podlogu.
Integrisana akustična podloga.

Primena:
Stambene zgrade — hodnici i zajednički prostori.
Obrazovne ustanove.
Kancelarije.

Održivost:
Bez ftalata.
100% reciklabilno.`,
        characteristics: {
            'Tip': 'Heterogeni vinil — akustički',
            'Format': 'Rolna',
            'Ukupna debljina': '3.15 mm',
            'Sloj habanja': '0.50 mm',
            'Smanjenje buke': '17 dB',
            'Klasa upotrebe': 'Klasa 34/42',
            'Vatrostojnost': 'Bfl-s1',
            'Tip instalacije': 'Lepljenje',
        },
    },
    'taralay-initial-compact': {
        description: `Proizvod:
Gerflor Taralay Initial Compact — heterogeni vinil ulaznog nivoa sa kompaktnom strukturom.
Ekonomično rešenje sa kvalitetnim dizajnima.
Kompaktna konstrukcija za sve komercijalne prostore.

Ugradnja:
Lepljenje na pripremljenu podlogu.
Varenje spojeva.

Primena:
Komercijalni prostori sa umerenim prometom.
Obrazovne ustanove.
Kancelarije.

Održivost:
Bez ftalata.
100% reciklabilno.`,
        characteristics: {
            'Tip': 'Heterogeni vinil — kompaktni',
            'Format': 'Rolna',
            'Ukupna debljina': '2.0 mm',
            'Sloj habanja': '0.50 mm',
            'Klasa upotrebe': 'Klasa 34/42',
            'Vatrostojnost': 'Bfl-s1',
            'Tip instalacije': 'Lepljenje',
        },
    },
    'taralay-millenium-acoustic': {
        description: `Proizvod:
Gerflor Taralay Millenium Acoustic — heterogeni vinil sa jednoboijnim i chip dizajnima i akustičnom podlogom.
Jednobojna i mineral-chip estetika za čiste, profesionalne prostore.
Akustična podloga za smanjenje buke koraka.

Ugradnja:
Lepljenje na pripremljenu podlogu.
Integrisana akustična podloga.

Primena:
Zdravstvene ustanove.
Laboratorije.
Čiste sobe.
Javni prostori.

Održivost:
Bez ftalata.
100% reciklabilno.`,
        characteristics: {
            'Tip': 'Heterogeni vinil — akustički',
            'Format': 'Rolna',
            'Ukupna debljina': '3.15 mm',
            'Sloj habanja': '0.65 mm',
            'Smanjenje buke': '17 dB',
            'Klasa upotrebe': 'Klasa 34/43',
            'Vatrostojnost': 'Bfl-s1',
            'Tip instalacije': 'Lepljenje',
        },
    },
    'taralay-millenium-compact': {
        description: `Proizvod:
Gerflor Taralay Millenium Compact — heterogeni vinil sa jednobojnim i chip dizajnima.
Kompaktna verzija za profesionalne prostore sa visokim opterećenjem.
Jednobojna i mineral-chip estetika za čiste linije.

Ugradnja:
Lepljenje na pripremljenu podlogu.
Varenje spojeva.

Primena:
Zdravstvene ustanove.
Laboratorije.
Industrijski objekti.

Održivost:
Bez ftalata.
100% reciklabilno.`,
        characteristics: {
            'Tip': 'Heterogeni vinil — kompaktni',
            'Format': 'Rolna',
            'Ukupna debljina': '2.0 mm',
            'Sloj habanja': '0.65 mm',
            'Klasa upotrebe': 'Klasa 34/43',
            'Vatrostojnost': 'Bfl-s1',
            'Tip instalacije': 'Lepljenje',
        },
    },
};

// Apply enrichment to collections
let enrichedCount = 0;
for (const collection of data.collections) {
    const enrichment = collectionEnrichment[collection.slug];
    if (enrichment) {
        // Add description to the collection level
        collection.description = enrichment.description;
        collection.characteristics = enrichment.characteristics;

        // Also propagate description and characteristics to each color in the collection
        for (const color of collection.colors) {
            if (!color.description) {
                color.description = enrichment.description;
            }
            if (!color.characteristics) {
                color.characteristics = enrichment.characteristics;
            }
        }
        enrichedCount++;
        console.log(`✅ Enriched: ${collection.name} (${collection.colors.length} colors)`);
    } else {
        console.log(`⚠️  No enrichment data for: ${collection.slug} (${collection.name})`);
    }
}

// Write back
fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2), 'utf8');
console.log(`\n✅ Done! Enriched ${enrichedCount}/${data.collections.length} collections.`);
console.log(`📄 File written: ${jsonPath}`);
