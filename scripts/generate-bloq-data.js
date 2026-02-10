const fs = require('fs');
const path = require('path');

// BLOQ product definitions - all data extracted from bloq.nl
const collections = [
    // ============ THE TRINITY COLLECTION ============
    {
        collection: 'bloq-assembly',
        collection_name: 'Assembly',
        parent_collection: 'The Trinity Collection',
        description: 'ASSEMBLY evocira sirov industrijski karakter napuštenih urbanih prostora, sa teksturom istrošenog betona u srži dizajna. Savršena za dodavanje industrijskog prizvuka hladnim ili sterilnim prostorima.',
        dimension: '50 cm x 50 cm',
        format: 'Square tile',
        url: 'https://bloq.nl/assembly',
        colors: [
            { code: '201', name: 'Saffron' },
            { code: '202', name: 'Vermillion' },
            { code: '501', name: 'Iceblue' },
            { code: '502', name: 'Aquamarine' },
            { code: '601', name: 'Chartreuse' },
            { code: '901', name: 'Cement' },
        ]
    },
    {
        collection: 'bloq-sensity',
        collection_name: 'Sensity',
        parent_collection: 'The Trinity Collection',
        description: 'SENSITY je inspirisan prepoznatljivim venama u prirodnom kamenu, pukotinama u dubokom plavom polarnom ledu i starom patinom glaziranih površina. Sa neutralnom paletom boja, ova kolekcija odiše klasičnom, šik elegancijom.',
        dimension: '50 cm x 50 cm',
        format: 'Square tile',
        url: 'https://bloq.nl/sensity',
        colors: [
            { code: '503', name: 'Deep sea' },
            { code: '602', name: 'Patina' },
            { code: '902', name: 'Pietra Grey' },
            { code: '903', name: 'Grey Marble' },
        ]
    },
    {
        collection: 'bloq-unity',
        collection_name: 'Unity',
        parent_collection: 'The Trinity Collection',
        description: 'Inspiracija za UNITY dolazi od repetitivnih uzoraka poput lančanih ograda i ribarskih mreža, dajući mu poslovni karakter koji postaje originalniji i privlačniji zahvaljujući pažljivo odabranim bojama.',
        dimension: '50 cm x 50 cm',
        format: 'Square tile',
        url: 'https://bloq.nl/unity',
        colors: [
            { code: '203', name: 'Golden Ecru' },
            { code: '302', name: 'Crimson' },
            { code: '504', name: 'Oxford Blue' },
            { code: '603', name: 'Lichen' },
            { code: '904', name: 'Old Zinc' },
            { code: '905', name: 'Blue Grey' },
        ]
    },
    // ============ THE RELIEF COLLECTION ============
    {
        collection: 'bloq-solace',
        collection_name: 'Solace',
        parent_collection: 'The Relief Collection',
        description: 'SOLACE odražava i energiju i spokoj prirode. Hvata intenzitet i raznolikost prirodnih elemenata u nepravilnom uzorku koji dodaje sirov, prirodan izgled vašim prostorima.',
        dimension: '50 cm x 50 cm',
        format: 'Square tile',
        url: 'https://bloq.nl/solace',
        colors: [
            { code: '165', name: 'Off white' },
            { code: '630', name: 'Fern' },
            { code: '170', name: 'Light Taupe' },
            { code: '830', name: 'Driftwood' },
            { code: '240', name: 'Indian Summer' },
            { code: '975', name: 'Pepperwhite' },
            { code: '985', name: 'Northsea' },
            { code: '640', name: 'Eucalyptus' },
            { code: '550', name: 'Smoke blue' },
            { code: '995', name: 'Carbon' },
            { code: '990', name: 'Granite' },
        ]
    },
    // ============ THE CREATE COLLECTION ============
    {
        collection: 'bloq-small',
        collection_name: 'Small',
        parent_collection: 'The Create Collection',
        description: 'SMALL meri 50 x 50 cm i prikazuje suptilne akcentne boje od mahovine do tamnocrvene, pomešane sa neutralnom sivom bojom. Kombinovanjem sa MEDIUM i LARGE kreiraćete jedinstven uzorak koji svakoj prostoriji daje sopstveni identitet.',
        dimension: '50 cm x 50 cm',
        format: 'Square tile',
        url: 'https://bloq.nl/products/the-create-collection/small',
        colors: [
            { code: '156', name: 'Salt' },
            { code: '208', name: 'Honey' },
            { code: '212', name: 'Tangerine' },
            { code: '307', name: 'Ruby' },
            { code: '517', name: 'Persian blue' },
            { code: '622', name: 'Fern' },
        ]
    },
    {
        collection: 'bloq-medium',
        collection_name: 'Medium',
        parent_collection: 'The Create Collection',
        description: 'MEDIUM meri 50 x 50 cm i predstavlja neutralnu, sivu baznu ploču koja se slaže sa svim varijacijama boja. Kombinujte sa SMALL i LARGE za jedinstven uzorak u svakoj prostoriji.',
        dimension: '50 cm x 50 cm',
        format: 'Square tile',
        url: 'https://bloq.nl/products/the-create-collection/medium',
        colors: [
            { code: '928', name: 'Thunder' },
        ]
    },
    {
        collection: 'bloq-large',
        collection_name: 'Large',
        parent_collection: 'The Create Collection',
        description: 'LARGE meri 50 x 50 cm i sadrži velikih šara u boji. Šest varijacija boja kreće se od mahovine do tamnocrvene. Kombinujte sa MEDIUM i SMALL za jedinstven uzorak.',
        dimension: '50 cm x 50 cm',
        format: 'Square tile',
        url: 'https://bloq.nl/products/the-create-collection/large',
        colors: [
            { code: '155', name: 'Rice' },
            { code: '207', name: 'Dijon' },
            { code: '211', name: 'Pumpkin' },
            { code: '306', name: 'Scarlet' },
            { code: '516', name: 'Ultra marine' },
            { code: '621', name: 'Spring' },
        ]
    },
    // ============ THE BINARY COLLECTION ============
    {
        collection: 'bloq-flow',
        collection_name: 'Flow',
        parent_collection: 'The Binary Collection',
        description: 'FLOW je ploča od 50 x 50 cm. Pod inspirisan umirujućim zvukom kiše koja kuca po prozoru. Osetite kapi kiše pod nogama i uživajte u jedinstvenom uzorku u dva tona.',
        dimension: '50 cm x 50 cm',
        format: 'Square tile',
        url: 'https://bloq.nl/products/the-binary-collection/flow',
        colors: [
            { code: '111', name: 'Truffle' }, { code: '123', name: 'Greige' },
            { code: '124', name: 'Walnut' }, { code: '125', name: 'Flax' },
            { code: '130', name: 'Sahara' }, { code: '135', name: 'Nutmeg' },
            { code: '218', name: 'Paprika' }, { code: '410', name: 'Fuchsia' },
            { code: '522', name: 'Atlantic' }, { code: '530', name: 'Sea' },
            { code: '617', name: 'Moss' }, { code: '812', name: 'Coffee' },
            { code: '907', name: 'Iron' }, { code: '911', name: 'Mouse' },
            { code: '921', name: 'Elephant' }, { code: '937', name: 'Ash' },
            { code: '942', name: 'Shadow' }, { code: '946', name: 'Graphite' },
        ]
    },
    {
        collection: 'bloq-grain',
        collection_name: 'Grain',
        parent_collection: 'The Binary Collection',
        description: 'GRAIN dolazi u carpet plankama od 25 x 100 cm. Uzorak je dvobojni, inspirisan talasajućim poljima žita i trave. GRAIN se savršeno uklapa sa skandinavskim stilom.',
        dimension: '25 cm x 100 cm',
        format: 'Rectangular plank',
        url: 'https://bloq.nl/products/the-binary-collection/grain',
        colors: [
            { code: '111', name: 'Truffle' }, { code: '123', name: 'Greige' },
            { code: '124', name: 'Walnut' }, { code: '125', name: 'Flax' },
            { code: '130', name: 'Sahara' }, { code: '135', name: 'Nutmeg' },
            { code: '218', name: 'Paprika' }, { code: '410', name: 'Fuchsia' },
            { code: '522', name: 'Atlantic' }, { code: '530', name: 'Sea' },
            { code: '617', name: 'Moss' }, { code: '812', name: 'Coffee' },
            { code: '907', name: 'Iron' }, { code: '911', name: 'Mouse' },
            { code: '921', name: 'Elephant' }, { code: '937', name: 'Ash' },
            { code: '942', name: 'Shadow' }, { code: '946', name: 'Graphite' },
        ]
    },
    {
        collection: 'bloq-renegade',
        collection_name: 'Renegade',
        parent_collection: 'The Binary Collection',
        description: 'RENEGADE je ploča od 50 x 50 cm. Dizajn inspirisan oblacima sa sanjivim raspoloženjem. Uzorak otkriva oblake u dva tona: uvek različit, uvek stilski, uvek jedinstven.',
        dimension: '50 cm x 50 cm',
        format: 'Square tile',
        url: 'https://bloq.nl/products/the-binary-collection/renegade',
        colors: [
            { code: '111', name: 'Truffle' }, { code: '123', name: 'Greige' },
            { code: '124', name: 'Walnut' }, { code: '125', name: 'Flax' },
            { code: '130', name: 'Sahara' }, { code: '135', name: 'Nutmeg' },
            { code: '218', name: 'Paprika' }, { code: '410', name: 'Fuchsia' },
            { code: '522', name: 'Atlantic' }, { code: '530', name: 'Sea' },
            { code: '617', name: 'Moss' }, { code: '812', name: 'Coffee' },
            { code: '907', name: 'Iron' }, { code: '911', name: 'Mouse' },
            { code: '921', name: 'Elephant' }, { code: '937', name: 'Ash' },
            { code: '942', name: 'Shadow' }, { code: '946', name: 'Graphite' },
        ]
    },
    {
        collection: 'bloq-balance',
        collection_name: 'Balance',
        parent_collection: 'The Binary Collection',
        description: 'BALANCE je ploča od 50 x 50 cm sa dizajnom koji sadrži kompoziciju horizontalnih i vertikalnih linija, poput mreže. Proporcionalni uzorci u neutralnim i živahnim bojama.',
        dimension: '50 cm x 50 cm',
        format: 'Square tile',
        url: 'https://bloq.nl/products/the-binary-collection/balance',
        colors: [
            { code: '111', name: 'Truffle' }, { code: '123', name: 'Greige' },
            { code: '124', name: 'Walnut' }, { code: '125', name: 'Flax' },
            { code: '130', name: 'Sahara' }, { code: '135', name: 'Nutmeg' },
            { code: '218', name: 'Paprika' }, { code: '410', name: 'Fuchsia' },
            { code: '522', name: 'Atlantic' }, { code: '530', name: 'Sea' },
            { code: '617', name: 'Moss' }, { code: '812', name: 'Coffee' },
            { code: '907', name: 'Iron' }, { code: '911', name: 'Mouse' },
            { code: '921', name: 'Elephant' }, { code: '937', name: 'Ash' },
            { code: '942', name: 'Shadow' }, { code: '946', name: 'Graphite' },
        ]
    },
    {
        collection: 'bloq-sculpture',
        collection_name: 'Sculpture',
        parent_collection: 'The Binary Collection',
        description: 'SCULPTURE je ploča od 50 x 50 cm inspirisana nepredvidivim uzorkom betona. Savremene vibracije koje se savršeno uklapaju sa industrijskim stilom.',
        dimension: '50 cm x 50 cm',
        format: 'Square tile',
        url: 'https://bloq.nl/products/the-binary-collection/sculpture',
        colors: [
            { code: '111', name: 'Truffle' }, { code: '123', name: 'Greige' },
            { code: '124', name: 'Walnut' }, { code: '125', name: 'Flax' },
            { code: '130', name: 'Sahara' }, { code: '135', name: 'Nutmeg' },
            { code: '218', name: 'Paprika' }, { code: '410', name: 'Fuchsia' },
            { code: '522', name: 'Atlantic' }, { code: '530', name: 'Sea' },
            { code: '617', name: 'Moss' }, { code: '812', name: 'Coffee' },
            { code: '907', name: 'Iron' }, { code: '911', name: 'Mouse' },
            { code: '921', name: 'Elephant' }, { code: '937', name: 'Ash' },
            { code: '942', name: 'Shadow' }, { code: '946', name: 'Graphite' },
        ]
    },
    // ============ THE WORKPLACE COLLECTION ============
    {
        collection: 'bloq-rhythm',
        collection_name: 'Rhythm',
        parent_collection: 'The Workplace Collection',
        description: 'RHYTHM je tekstilna ploča od 50 x 50 cm. Ova bazna ploča predstavlja pravilnost svakodnevnog života. Savršeno se kombinuje sa TRADITION kolekcijom. Prugasti uzorak RHYTHM-a ujedinjuje dve zone boja.',
        dimension: '50 cm x 50 cm',
        format: 'Square tile',
        url: 'https://bloq.nl/products/the-workplace-collection/rhythm',
        colors: [
            { code: '121', name: 'Melody' }, { code: '216', name: 'Motion' },
            { code: '521', name: 'Synchrony' }, { code: '616', name: 'Sound' },
            { code: '811', name: 'Silence' }, { code: '906', name: 'Mute' },
            { code: '936', name: 'Beat' }, { code: '941', name: 'Frequency' },
        ]
    },
    {
        collection: 'bloq-connexion',
        collection_name: 'Connexion',
        parent_collection: 'The Workplace Collection',
        description: 'CONNEXION je ploča od 50 x 50 cm. Ima mešoviti prugasti uzorak dizajniran da povezuje. Uzorak stvara vezu u prostoriji između sive zone i naglašenije zone boja, napravljene sa TRADITION pločama.',
        dimension: '50 cm x 50 cm',
        format: 'Square tile',
        url: 'https://bloq.nl/products/the-workplace-collection/connexion',
        colors: [
            { code: '122', name: 'Dusty Trail' }, { code: '206', name: 'Smoky Track' },
            { code: '217', name: 'Burnt alley' }, { code: '406', name: 'Soft Road' },
            { code: '506', name: 'Toned Route' }, { code: '526', name: 'Clear Path' },
            { code: '611', name: 'Cool Passage' }, { code: '926', name: 'Silent Lane' },
        ]
    },
    {
        collection: 'bloq-tradition',
        collection_name: 'Tradition',
        parent_collection: 'The Workplace Collection',
        description: 'TRADITION je ploča od 50 x 50 cm sa solidnim i bazičnim uzorkom. Bezvremenski dizajn i širok raspon boja čine je savršenom kolekcijom za kreiranje sopstvenog radnog prostora, potpuno prilagođenog stilu vaše kompanije.',
        dimension: '50 cm x 50 cm',
        format: 'Square tile',
        url: 'https://bloq.nl/products/the-workplace-collection/tradition',
        colors: [
            { code: '105', name: 'Hemp' }, { code: '110', name: 'Linen' },
            { code: '115', name: 'Birch' }, { code: '120', name: 'Peat' },
            { code: '205', name: 'Mustard' }, { code: '210', name: 'Orange' },
            { code: '215', name: 'Terra' }, { code: '305', name: 'Red' },
            { code: '405', name: 'Pink' }, { code: '505', name: 'Denim' },
            { code: '510', name: 'Midnight' }, { code: '515', name: 'Sapphire' },
            { code: '520', name: 'Ocean' }, { code: '525', name: 'Teal' },
            { code: '605', name: 'Ice' }, { code: '610', name: 'Jade' },
            { code: '615', name: 'Forest' }, { code: '620', name: 'Grass' },
            { code: '805', name: 'Fox' }, { code: '810', name: 'Bark' },
            { code: '905', name: 'Rock' }, { code: '910', name: 'Stone' },
            { code: '915', name: 'Cloud' }, { code: '920', name: 'Dust' },
            { code: '925', name: 'Flint' }, { code: '930', name: 'Gray' },
            { code: '935', name: 'Slate' }, { code: '940', name: 'Anthracite' },
            { code: '945', name: 'Coal' }, { code: '950', name: 'Black' },
        ]
    },
    // ============ THE TEXTURED COLLECTION ============
    {
        collection: 'bloq-canvas',
        collection_name: 'Canvas',
        parent_collection: 'The Textured Collection',
        description: 'CANVAS meri 50 x 50 cm i deo je The Textured kolekcije, grupe tekstilnih ploča sa taktilnom i vidljivom strukturom. Proporcionalni uzorci u 18 prirodnih pastelnih boja koje odražavaju otvorenost, mekoću, mir i staložnost.',
        dimension: '50 cm x 50 cm',
        format: 'Square tile',
        url: 'https://bloq.nl/products/the-textured-collection/canvas',
        colors: [
            { code: '140', name: 'Cotton' }, { code: '145', name: 'Ivory' },
            { code: '150', name: 'Pearl' }, { code: '220', name: 'Melon' },
            { code: '225', name: 'Amber' }, { code: '230', name: 'Lime' },
            { code: '310', name: 'Sienna' }, { code: '415', name: 'Lilac' },
            { code: '535', name: 'Sky' }, { code: '540', name: 'Bluestone' },
            { code: '625', name: 'Sage' }, { code: '815', name: 'Olive' },
            { code: '820', name: 'Timber' }, { code: '935', name: 'Slate' },
            { code: '955', name: 'Silver' }, { code: '960', name: 'Concrete' },
            { code: '965', name: 'Smoke' }, { code: '970', name: 'Storm' },
        ]
    },
    {
        collection: 'bloq-positive',
        collection_name: 'Positive',
        parent_collection: 'The Textured Collection',
        description: 'Kao deo Textured kolekcije, Positive & Negative prikazuje organsku i aritmičnu igru pozitivnog i negativnog kontrasta na pločama od 50 x 50 cm. Dizajn inspirisan korom drveta. Positive dodaje svetli dodir, ispunjavajući prostoriju mirnim vibracijama.',
        dimension: '50 cm x 50 cm',
        format: 'Square tile',
        url: 'https://bloq.nl/products/the-textured-collection/positive',
        colors: [
            { code: '221', name: 'Salmon' }, { code: '226', name: 'Corn' },
            { code: '231', name: 'Tea' }, { code: '816', name: 'Nut' },
            { code: '626', name: 'Fennel' }, { code: '821', name: 'Celery' },
            { code: '980', name: 'Silt' }, { code: '971', name: 'Grit' },
        ]
    },
    {
        collection: 'bloq-negative',
        collection_name: 'Negative',
        parent_collection: 'The Textured Collection',
        description: 'Kao deo Textured kolekcije, Positive & Negative prikazuje organsku igru kontrasta. Dizajn inspirisan korom drveta. Negative dodaje karakter prostoriji sa tamnijim i zasićenijim nijansama.',
        dimension: '50 cm x 50 cm',
        format: 'Square tile',
        url: 'https://bloq.nl/products/the-textured-collection/negative',
        colors: [
            { code: '222', name: 'Peach' }, { code: '227', name: 'Dune' },
            { code: '232', name: 'Pear' }, { code: '817', name: 'Pine' },
            { code: '627', name: 'Rosema' }, { code: '822', name: 'Cedar' },
            { code: '981', name: 'Fossil' }, { code: '972', name: 'Fog' },
        ]
    },
];

// Shared BLOQ specs for all products
const sharedSpecs = {
    SURFACE_YARN: 'Polyamide 6 Solution Dyed Nylon (Aquafil)',
    CLASSIFICATION: 'Class 33 (Commercial Heavy)',
    FIRE_RESISTANCE: 'Bfl-s1',
    BACKING: 'Bitback (70% reciklirani materijali)',
    DIMENSIONAL_STABILITY: '≤ 0.2%',
    CERTIFICATIONS: 'GUT, EPD, CE',
};

// Generate final JSON
const allColors = [];
let totalCount = 0;

for (const coll of collections) {
    for (const color of coll.colors) {
        const slug = `${coll.collection_name.toLowerCase()}-${color.code}-${color.name.toLowerCase().replace(/\s+/g, '-')}`;
        const fullName = `${color.code} ${color.name}`;
        const imgFolder = coll.collection_name.toLowerCase();

        allColors.push({
            collection: coll.collection,
            collection_name: coll.collection_name,
            parent_collection: coll.parent_collection,
            brand: 'bloq',
            code: color.code,
            name: fullName,
            full_name: `${coll.collection_name} ${fullName}`,
            slug: slug,
            image_url: `/images/products/carpet/bloq/${imgFolder}/${color.code}-${color.name.toLowerCase().replace(/\s+/g, '-')}.jpg`,
            description: `BLOQ ${coll.collection_name} - Premium tekstilne ploče.\n\n${coll.description}\n\nProizvod:\n• 100% Polyamide 6 Solution Dyed Nylon (Aquafil)\n• Klasa upotrebe: 33 (Commercial Heavy)\n• Podloga: Bitback (70% reciklirani materijali)\n\nPerformanse:\n• Vatrostojnost: Bfl-s1 (najbolji rezultat za tepih)\n• Dimenzionalna stabilnost: ≤ 0.2%\n• Solution dyed vlakna - otporna na svetlo, tečnosti i belila\n• Visoka zvučna apsorpcija\n\nSertifikati:\n• GUT sertifikat\n• EPD (Environmental Product Declaration)\n• CE oznaka`,
            dimension: coll.dimension,
            format: coll.format,
            overall_thickness: 'N/A',
            specs: {
                ...sharedSpecs,
            },
            characteristics: {
                'Dimenzije': coll.dimension,
                'Format': coll.format,
                'Materijal vlakna': 'Polyamide 6 Solution Dyed Nylon',
                'Dobavljač vlakna': 'Aquafil',
                'Klasa upotrebe': 'Klasa 33 (Commercial Heavy)',
                'Vatrostojnost': 'Bfl-s1',
                'Podloga': 'Bitback (70% reciklirani materijali)',
                'Dimenzionalna stabilnost': '≤ 0.2%',
            },
            texture_url: '',
            image_count: 1,
            image_notes: {
                image_url: 'Slika ploče (potrebno ručno preuzeti sa bloq.nl)',
            },
            collection_slug: coll.collection,
            external_url: coll.url,
        });
        totalCount++;
    }
}

const output = {
    brand: 'BLOQ',
    brand_country: 'Holandija',
    brand_website: 'https://bloq.nl',
    total: totalCount,
    collections: collections.length,
    colors: allColors,
};

const outPath = path.join(__dirname, '..', 'public', 'data', 'bloq_carpet_tiles.json');
fs.writeFileSync(outPath, JSON.stringify(output, null, 2), 'utf-8');
console.log(`Generated ${outPath} with ${totalCount} color entries across ${collections.length} collections.`);
