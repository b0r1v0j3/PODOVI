/**
 * Enriches bloq_carpet_tiles.json with:
 * - Collection description (EN, from bloq.nl)
 * - Color range description (EN)
 * - Documents (tech datasheet, brochure URLs)
 * - Backing variants info for Trinity collections
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const JSON_PATH = path.join(__dirname, '..', 'public', 'data', 'bloq_carpet_tiles.json');

// ─── Collection enrichment data ──────────────────────────────────────────
const collectionData = {
    // ─── THE TRINITY COLLECTION ────────────────────────────────────────
    "Assembly": {
        collection_description_en: "ASSEMBLY captures the characterful essence of abandoned urban spaces, with the rugged texture of weathered concrete at its core. The name reflects the countless ways you can combine the different colours and designs to create a unique floor. It's perfect for adding an industrial touch to cold or sterile spaces, bringing a vibrant urban vibe with the tough look of concrete and the comfort of carpet tiles.",
        collection_description_sr: "ASSEMBLY evocira sirov industrijski karakter napuštenih urbanih prostora, sa teksturom istrošenog betona u srži dizajna. Ime odražava bezbroj načina na koje možete kombinovati različite boje i dezene da biste kreirali jedinstven pod. Savršena za dodavanje industrijskog prizvuka hladnim ili sterilnim prostorima, donoseći živu urbanu atmosferu sa čvrstim izgledom betona i udobnošću tekstilnih ploča.",
        color_range_text: "Dostupna u šest usklađenih boja – Saffron, Chartreuse, Aquamarine, Vermillion, Cement i Iceblue – Cement služi kao bazni ton, olakšavajući kombinovanje sa ostalim bojama.",
        backing_variants: ["RELAX", "BITBACK"],
        documents: [
            { title: "Tehničke karakteristike (BITBACK)", url: "https://bloq.nl/sites/default/files/2025-01/BLOQ_Trinity_ASSEMBLY_TF_EN_JAN25_BITBACK_1.pdf", type: "tech_datasheet" },
            { title: "Tehničke karakteristike (RELAX)", url: "https://bloq.nl/sites/default/files/2025-01/BLOQ_Trinity_ASSEMBLY_TF__EN_JAN25_RELAX.pdf", type: "tech_datasheet" },
            { title: "Brošura", url: "https://bloq.nl/sites/default/files/2025-01/BLOQ_Trinity_ASSEMBLY_Jan25.pdf", type: "brochure" },
            { title: "LRV (Light Reflectance Value)", url: "https://bloq.nl/sites/default/files/2025-01/LRV_ASSEMBLY.pdf", type: "lrv" }
        ]
    },
    "Sensity": {
        collection_description_en: "SENSITY is inspired by the distinctive veins in natural stone, the cracks in deep blue polar ice, and the aged patina of glazed surfaces. With its neutral colour palette, this collection exudes a classic, chic elegance. It brings to mind the grandeur of majestic palaces with their luxurious marble floors, but with the added comfort of carpet tiles.",
        collection_description_sr: "SENSITY je inspirisan prepoznatljivim venama u prirodnom kamenu, pukotinama u dubokom plavom polarnom ledu i starom patinom glaziranih površina. Sa neutralnom paletom boja, ova kolekcija odiše klasičnom, šik elegancijom. Priziva veličanstvenost palata sa luksuznim mermernim podovima, ali sa dodatnom udobnošću tekstilnih ploča.",
        color_range_text: "Dostupna u četiri klasične boje: Deep Sea, Patina, Pietra Grey i Grey Marble. Svaka boja nudi četiri različite varijacije pločica, omogućavajući kreiranje realističnih i sofisticiranih uzoraka.",
        backing_variants: ["RELAX", "BITBACK"],
        documents: [
            { title: "Tehničke karakteristike (BITBACK)", url: "https://bloq.nl/sites/default/files/2025-01/BLOQ_Trinity_SENSITY_TF_EN_JAN25_BITBACK_0.pdf", type: "tech_datasheet" },
            { title: "Tehničke karakteristike (RELAX)", url: "https://bloq.nl/sites/default/files/2025-01/BLOQ_Trinity_SENSITY_TF_EN_JAN25_RELAX.pdf", type: "tech_datasheet" },
            { title: "Brošura", url: "https://bloq.nl/sites/default/files/2025-01/BLOQ_Trinity_SENSITY_Jan25.pdf", type: "brochure" },
            { title: "LRV (Light Reflectance Value)", url: "https://bloq.nl/sites/default/files/2025-01/LRV_SENSITY.pdf", type: "lrv" }
        ]
    },
    "Unity": {
        collection_description_en: "The inspiration for UNITY comes from repetitive patterns like chainlink and fishing nets, giving it a business-like edge that's made more original and inviting through its thoughtful colour selection.",
        collection_description_sr: "Inspiracija za UNITY dolazi od repetitivnih uzoraka poput lančanih ograda i ribarskih mreža, dajući mu poslovni karakter koji postaje originalniji i privlačniji zahvaljujući pažljivo odabranim bojama.",
        color_range_text: "Dostupna u šest boja: Golden Ecru, Crimson, Oxford Blue, Lichen, Old Zinc i Blue Grey. Old Zinc služi kao svestrana osnova, savršeno se uklapajući sa ostalim bojama. Svaka boja dolazi u četiri varijacije.",
        backing_variants: ["RELAX", "BITBACK"],
        documents: [
            { title: "Tehničke karakteristike (BITBACK)", url: "https://bloq.nl/sites/default/files/2025-01/BLOQ_Trinity_UNITY_TF_EN_JAN25_BITBACK_0.pdf", type: "tech_datasheet" },
            { title: "Tehničke karakteristike (RELAX)", url: "https://bloq.nl/sites/default/files/2025-01/BLOQ_Trinity_UNITY_TF__EN_JAN25_RELAX.pdf", type: "tech_datasheet" },
            { title: "Brošura", url: "https://bloq.nl/sites/default/files/2025-01/BLOQ_Trinity_UNITY_Jan25.pdf", type: "brochure" },
            { title: "LRV (Light Reflectance Value)", url: "https://bloq.nl/sites/default/files/2025-01/LRV_UNITY.pdf", type: "lrv" }
        ]
    },

    // ─── THE RELIEF COLLECTION ─────────────────────────────────────────
    "Solace": {
        collection_description_en: "SOLACE, part of The Relief Collection, reflects both the energy and tranquillity of nature. It captures the intensity and variety of the natural elements, in an irregular pattern that adds a raw, natural look to your spaces.",
        collection_description_sr: "SOLACE, deo Relief kolekcije, odražava i energiju i spokoj prirode. Hvata intenzitet i raznolikost prirodnih elemenata u nepravilnom uzorku koji dodaje sirov, prirodan izgled vašim prostorima.",
        color_range_text: "Dostupna u 11 suptilnih prirodnih tonova. Inspirišite se prostranstvom planinske stene, mirnoćom bež plaže, toplinom zarđalog metala...",
        backing_variants: null,
        documents: [
            { title: "Tehničke karakteristike", url: "https://bloq.nl/sites/default/files/2024-08/BLOQ_Relief_SOLACE_TF_EN_Jun24_WEB_0.pdf", type: "tech_datasheet" },
            { title: "Brošura", url: "https://bloq.nl/sites/default/files/2024-08/BLOQ_Relief_SOLACE_brochure_EN_Jun24_WEB_0.pdf", type: "brochure" },
            { title: "LRV (Light Reflectance Value)", url: "https://bloq.nl/sites/default/files/2024-08/BLOQ_03887_SOLACE_LRV_EN_v1.pdf", type: "lrv" }
        ]
    },

    // ─── THE BINARY COLLECTION ─────────────────────────────────────────
    "Sculpture": {
        collection_description_en: "SCULPTURE is a tile of 50 x 50 cm and is inspired by the unpredictable pattern of concrete. Contemporary vibes that blend perfectly with an industrial style.",
        collection_description_sr: "SCULPTURE je pločica dimenzija 50 x 50 cm inspirisana nepredvidivim uzorkom betona. Savremeni tonovi koji se savršeno uklapaju u industrijski stil.",
        color_range_text: "Dostupna u 18 usklađenih boja. Koristite boje čiste za jednobojni ton, ili igrajte se bojama i mešajte po svom ukusu.",
        backing_variants: null,
        documents: [
            { title: "Tehničke karakteristike", url: "https://bloq.nl/sites/default/files/2024-04/BLOQ_Binary_SCULPTURE_TF_EN_MRT24.pdf", type: "tech_datasheet" },
            { title: "Brošura", url: "https://bloq.nl/sites/default/files/2024-07/BLOQ_Binary_SCULPTURE_JUL24.pdf", type: "brochure" },
            { title: "LRV (Light Reflectance Value)", url: "https://bloq.nl/sites/default/files/2021-10/LRV_SCULPTURE.pdf", type: "lrv" }
        ]
    },
    "Flow": {
        collection_description_en: "FLOW is a tile of 50 x 50 cm. A floor inspired by the soothing sound of rain tapping against the window. Feel the raindrops underneath your feet and enjoy the unique pattern in two shades.",
        collection_description_sr: "FLOW je pločica dimenzija 50 x 50 cm. Pod inspirisan umirujućim zvukom kiše koja kuca o prozor. Osetite kapi kiše pod svojim stopalima i uživajte u jedinstvenom uzorku u dve nijanse.",
        color_range_text: "Dostupna u 18 usklađenih boja. Koristite boje čiste za jednobojni ton, ili igrajte se bojama i mešajte po svom ukusu.",
        backing_variants: null,
        documents: [
            { title: "Tehničke karakteristike", url: "https://bloq.nl/sites/default/files/2024-04/BLOQ_Binary_FLOW_TF_EN_FEB24.pdf", type: "tech_datasheet" },
            { title: "Brošura", url: "https://bloq.nl/sites/default/files/2024-04/BLOQ_Binary_FLOW_brochure_EN_FEB2024.pdf", type: "brochure" },
            { title: "LRV (Light Reflectance Value)", url: "https://bloq.nl/sites/default/files/2021-10/LRV_FLOW.pdf", type: "lrv" }
        ]
    },
    "Grain": {
        collection_description_en: "GRAIN comes in carpet planks of 25 x 100 cm. The pattern is two-toned and is inspired by waving fields of grain and grasses. GRAIN matches perfectly with Scandinavian styles.",
        collection_description_sr: "GRAIN dolazi u formatu tepih ploča 25 x 100 cm. Dvobojni uzorak inspirisan talasastim poljima žitarica i trava. GRAIN se savršeno uklapa u skandinavski stil.",
        color_range_text: "Dostupna u 18 usklađenih boja. Koristite boje čiste za jednobojni ton, ili igrajte se bojama i mešajte po svom ukusu.",
        backing_variants: null,
        documents: [
            { title: "Tehničke karakteristike", url: "https://bloq.nl/sites/default/files/2024-04/BLOQ_Binary_GRAIN_TF_EN_FEB24.pdf", type: "tech_datasheet" },
            { title: "Brošura", url: "https://bloq.nl/sites/default/files/2024-04/BLOQ_Binary_GRAIN_brochure_EN_FEB2024.pdf", type: "brochure" },
            { title: "LRV (Light Reflectance Value)", url: "https://bloq.nl/sites/default/files/2021-10/LRV_GRAIN.pdf", type: "lrv" }
        ]
    },
    "Renegade": {
        collection_description_en: "RENEGADE is a tile of 50 x 50 cm. It has a cloud-inspired design with a dreamy mood. The pattern reveals clouds in two shades: always different, always in style, always unique.",
        collection_description_sr: "RENEGADE je pločica dimenzija 50 x 50 cm. Dizajn inspirisan oblacima sa sanjivim ugođajem. Uzorak otkriva oblake u dve nijanse: uvek drugačiji, uvek u trendu, uvek jedinstven.",
        color_range_text: "Dostupna u 18 usklađenih boja. Koristite boje čiste za jednobojni ton, ili igrajte se bojama i mešajte po svom ukusu.",
        backing_variants: null,
        documents: [
            { title: "Tehničke karakteristike", url: "https://bloq.nl/sites/default/files/2024-04/BLOQ_Binary_RENEGADE_TF_EN_MRT24.pdf", type: "tech_datasheet" },
            { title: "Brošura", url: "https://bloq.nl/sites/default/files/2024-04/BLOQ_Binary_RENEGADE_brochure_EN_MRT24.pdf", type: "brochure" },
            { title: "LRV (Light Reflectance Value)", url: "https://bloq.nl/sites/default/files/2021-10/BLOQ%20carpet%20tiles%20-%20LRV_RENEGADE.pdf", type: "lrv" }
        ]
    },
    "Balance": {
        collection_description_en: "BALANCE is a tile of 50 x 50 cm and has a design with a composition of horizontal and vertical lines, like a grid. The tile boasts proportional patterns in neutral and lively colours.",
        collection_description_sr: "BALANCE je pločica dimenzija 50 x 50 cm sa dizajnom koji ima kompoziciju horizontalnih i vertikalnih linija, poput mreže. Pločica se ponosi proporcionalnim uzorcima u neutralnim i živopisnim bojama.",
        color_range_text: "Dostupna u 18 usklađenih boja. Koristite boje čiste za jednobojni ton, ili igrajte se bojama i mešajte po svom ukusu.",
        backing_variants: null,
        documents: [
            { title: "Tehničke karakteristike", url: "https://bloq.nl/sites/default/files/2024-04/BLOQ_Binary_BALANCE_TF_EN_FEB24.pdf", type: "tech_datasheet" },
            { title: "Brošura", url: "https://bloq.nl/sites/default/files/2024-04/BLOQ_Binary_BALANCE_brochure_EN_FEB2024.pdf", type: "brochure" },
            { title: "LRV (Light Reflectance Value)", url: "https://bloq.nl/sites/default/files/2021-10/LRV_BALANCE.pdf", type: "lrv" }
        ]
    },

    // ─── THE WORKPLACE COLLECTION ──────────────────────────────────────
    "Rhythm": {
        collection_description_en: "RHYTHM is a carpet tile of 50 x 50 cm. This basic tile represents the regularity of daily life. It makes a perfect marriage with TRADITION. The striped pattern of RHYTHM unites two coloured zones, consisting of TRADITION tiles.",
        collection_description_sr: "RHYTHM je tekstilna pločica dimenzija 50 x 50 cm. Ova osnovna pločica predstavlja pravilnost svakodnevnog života. Savršeno se kombinuje sa TRADITION kolekcijom. Prugasti uzorak RHYTHM-a ujedinjuje dve površine u boji, sačinjene od TRADITION pločica.",
        color_range_text: "Dostupna u osam jedinstvenih boja: pet ton-na-ton boja i tri vibrantne boje.",
        backing_variants: null,
        documents: [
            { title: "Tehničke karakteristike", url: "https://bloq.nl/sites/default/files/2024-04/BLOQ_Workplace_RHYTHM_TF_EN_MRT24.pdf", type: "tech_datasheet" },
            { title: "Brošura", url: "https://bloq.nl/sites/default/files/2024-04/BLOQ_Workplace_RHYTHM_brochure_MRT24.pdf", type: "brochure" },
            { title: "LRV (Light Reflectance Value)", url: "https://bloq.nl/sites/default/files/2021-10/LRV_RHYTHM.pdf", type: "lrv" }
        ]
    },
    "Connexion": {
        collection_description_en: "CONNEXION is a tile of 50 x 50 cm. It has a mixed striped pattern designed to connect. The pattern makes a connection in your room between a grey zone and a more pronounced coloured zone, made with TRADITION tiles.",
        collection_description_sr: "CONNEXION je pločica dimenzija 50 x 50 cm. Ima mešoviti prugasti uzorak dizajniran da povezuje. Uzorak stvara vezu u vašoj prostoriji između sive zone i naglašenije zone u boji, kreirane TRADITION pločicama.",
        color_range_text: "Dostupna u osam boja za povezivanje: dve ton-na-ton i šest vibrantnih boja.",
        backing_variants: null,
        documents: [
            { title: "Tehničke karakteristike", url: "https://bloq.nl/sites/default/files/2024-04/BLOQ_Workplace_CONNEXION_TF_EN_MRT24.pdf", type: "tech_datasheet" },
            { title: "Brošura", url: "https://bloq.nl/sites/default/files/2024-04/BLOQ_Workplace_CONNEXION_brochure_MRT24.pdf", type: "brochure" },
            { title: "LRV (Light Reflectance Value)", url: "https://bloq.nl/sites/default/files/2021-10/LRV_CONNEXION.pdf", type: "lrv" }
        ]
    },
    "Tradition": {
        collection_description_en: "TRADITION is a tile of 50 x 50 cm with a solid and basic pattern. The timeless design and wide colour range make it a perfect collection to create your own workspace, fully tailored to the style of your company.",
        collection_description_sr: "TRADITION je pločica dimenzija 50 x 50 cm sa klasičnim jednobojnim uzorkom. Bezvremenski dizajn i širok raspon boja čine je savršenom kolekcijom za kreiranje vašeg radnog prostora, potpuno prilagođenog stilu vaše kompanije.",
        color_range_text: "Dostupna u 30 fantastičnih boja: ton-na-ton ili naglašene i upečatljive.",
        backing_variants: null,
        documents: [
            { title: "Tehničke karakteristike", url: "https://bloq.nl/sites/default/files/2024-04/BLOQ_Workplace_TRADITION_TF_EN_MRT24.pdf", type: "tech_datasheet" },
            { title: "Brošura", url: "https://bloq.nl/sites/default/files/2024-04/BLOQ_Workplace_TRADITION_brochure_MRT24.pdf", type: "brochure" },
            { title: "LRV (Light Reflectance Value)", url: "https://bloq.nl/sites/default/files/2021-10/LRV_TRADITION.pdf", type: "lrv" }
        ]
    },

    // ─── THE TEXTURED COLLECTION ───────────────────────────────────────
    "Positive": {
        collection_description_en: "POSITIVE is part of The Textured collection. Soft hues with an even softer touch. Choose subtlety with one colour tone or go for a playful look by combining two patterns.",
        collection_description_sr: "POSITIVE je deo Textured kolekcije. Nežni tonovi sa još nežnijim dodirom. Izaberite suptilnost sa jednim tonom boje ili se igrajte kombinovanjem dva uzorka.",
        color_range_text: "Dostupna u više usklađenih boja za suptilne kombinacije.",
        backing_variants: null,
        documents: [
            { title: "Tehničke karakteristike", url: "https://bloq.nl/sites/default/files/2024-04/BLOQ_Textured_POSITIVE_TF_EN_FEB24.pdf", type: "tech_datasheet" },
            { title: "Brošura", url: "https://bloq.nl/sites/default/files/2024-04/BLOQ_Textured_POSITIVE_brochure_EN_FEB2024.pdf", type: "brochure" }
        ]
    },
    "Negative": {
        collection_description_en: "NEGATIVE is part of The Textured collection. Soft hues with an even softer touch. A complement to POSITIVE, offering an inverted pattern for creative floor designs.",
        collection_description_sr: "NEGATIVE je deo Textured kolekcije. Nežni tonovi sa još nežnijim dodirom. Komplement POSITIVE uzorku, nudeći invertovan dezen za kreativne podne dizajne.",
        color_range_text: "Dostupna u više usklađenih boja za suptilne kombinacije.",
        backing_variants: null,
        documents: [
            { title: "Tehničke karakteristike", url: "https://bloq.nl/sites/default/files/2024-04/BLOQ_Textured_NEGATIVE_TF_EN_FEB24.pdf", type: "tech_datasheet" },
            { title: "Brošura", url: "https://bloq.nl/sites/default/files/2024-04/BLOQ_Textured_NEGATIVE_brochure_EN_FEB2024.pdf", type: "brochure" }
        ]
    },
    "Canvas": {
        collection_description_en: "CANVAS is part of The Textured collection. A versatile base tile that pairs beautifully with POSITIVE and NEGATIVE, creating harmonious floor compositions.",
        collection_description_sr: "CANVAS je deo Textured kolekcije. Svestrana osnovna pločica koja se lepo kombinuje sa POSITIVE i NEGATIVE uzorcima, kreirajući harmonične podne kompozicije.",
        color_range_text: "Dostupna u više usklađenih boja za suptilne kombinacije.",
        backing_variants: null,
        documents: [
            { title: "Tehničke karakteristike", url: "https://bloq.nl/sites/default/files/2024-04/BLOQ_Textured_CANVAS_TF_EN_FEB24.pdf", type: "tech_datasheet" },
            { title: "Brošura", url: "https://bloq.nl/sites/default/files/2024-04/BLOQ_Textured_CANVAS_brochure_EN_FEB2024.pdf", type: "brochure" }
        ]
    },

    // ─── THE CREATE COLLECTION ─────────────────────────────────────────
    "Small": {
        collection_description_en: "SMALL is part of The Create collection. The three patterns in this creative collection breathe creativity and emphasise the close link with nature. SMALL offers a fine, detailed pattern.",
        collection_description_sr: "SMALL je deo Create kolekcije. Tri uzorka u ovoj kreativnoj kolekciji odišu kreativnošću i naglašavaju blisku vezu sa prirodom. SMALL nudi fin, detaljan uzorak.",
        color_range_text: "Dostupna u šest boja u rasponu od mahovine zelene do duboko crvene.",
        backing_variants: null,
        documents: [
            { title: "Tehničke karakteristike", url: "https://bloq.nl/sites/default/files/2024-04/BLOQ_Create_SMALL_TF_EN_FEB24.pdf", type: "tech_datasheet" },
            { title: "Brošura", url: "https://bloq.nl/sites/default/files/2024-04/BLOQ_Create_SMALL_brochure_EN_FEB2024.pdf", type: "brochure" }
        ]
    },
    "Medium": {
        collection_description_en: "MEDIUM is part of The Create collection. A unique pattern inspired by nature, offering a mid-scale design. MEDIUM, SMALL and LARGE come in six colours ranging from moss green to deep red.",
        collection_description_sr: "MEDIUM je deo Create kolekcije. Jedinstven uzorak inspirisan prirodom, nudeći dizajn srednje veličine. MEDIUM, SMALL i LARGE dolaze u šest boja u rasponu od mahovine zelene do duboko crvene.",
        color_range_text: "Dostupna u šest boja u rasponu od mahovine zelene do duboko crvene.",
        backing_variants: null,
        documents: [
            { title: "Tehničke karakteristike", url: "https://bloq.nl/sites/default/files/2024-04/BLOQ_Create_MEDIUM_TF_EN_FEB24.pdf", type: "tech_datasheet" },
            { title: "Brošura", url: "https://bloq.nl/sites/default/files/2024-04/BLOQ_Create_MEDIUM_brochure_EN_FEB2024.pdf", type: "brochure" }
        ]
    },
    "Large": {
        collection_description_en: "LARGE is part of The Create collection. Bold and expressive, LARGE features the most prominent pattern of the trio. Combined with SMALL and MEDIUM, it creates dynamic floor designs.",
        collection_description_sr: "LARGE je deo Create kolekcije. Smeo i ekspresivan, LARGE ima najizraženiji uzorak u kolekciji. U kombinaciji sa SMALL i MEDIUM, kreira dinamične podne dizajne.",
        color_range_text: "Dostupna u šest boja u rasponu od mahovine zelene do duboko crvene.",
        backing_variants: null,
        documents: [
            { title: "Tehničke karakteristike", url: "https://bloq.nl/sites/default/files/2024-04/BLOQ_Create_LARGE_TF_EN_FEB24.pdf", type: "tech_datasheet" },
            { title: "Brošura", url: "https://bloq.nl/sites/default/files/2024-04/BLOQ_Create_LARGE_brochure_EN_FEB2024.pdf", type: "brochure" }
        ]
    }
};

// ─── Update dimension for Grain (planks, not tiles) ──────────────────
const GRAIN_DIMENSION = "25 cm x 100 cm";
const GRAIN_FORMAT = "Plank";

// ─── Main ────────────────────────────────────────────────────────────
const raw = fs.readFileSync(JSON_PATH, 'utf8');
const data = JSON.parse(raw);

let updatedCount = 0;
let docCount = 0;

for (const color of data.colors) {
    const colName = color.collection_name;
    const enrichment = collectionData[colName];
    if (!enrichment) {
        console.warn(`⚠️  No enrichment data for collection: ${colName}`);
        continue;
    }

    // Add collection description (separate from color-level description)
    color.collection_description_en = enrichment.collection_description_en;
    color.collection_description_sr = enrichment.collection_description_sr;
    color.color_range_text = enrichment.color_range_text;

    // Add documents
    if (enrichment.documents && enrichment.documents.length > 0) {
        color.documents = enrichment.documents;
        docCount++;
    }

    // Add backing variants for Trinity collections
    if (enrichment.backing_variants) {
        color.backing_variants = enrichment.backing_variants;
    }

    // Fix Grain dimensions
    if (colName === 'Grain') {
        color.dimension = GRAIN_DIMENSION;
        color.format = GRAIN_FORMAT;
        if (color.characteristics) {
            color.characteristics['Dimenzije'] = GRAIN_DIMENSION;
            color.characteristics['Format'] = GRAIN_FORMAT;
        }
    }

    updatedCount++;
}

// Write back
fs.writeFileSync(JSON_PATH, JSON.stringify(data, null, 2), 'utf8');

console.log(`\n✅ Enrichment complete!`);
console.log(`   Updated: ${updatedCount} / ${data.colors.length} colors`);
console.log(`   Documents added to: ${docCount} colors`);
console.log(`   Output: ${JSON_PATH}`);
