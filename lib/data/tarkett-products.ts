import { Product } from '@/types';

export const tarkettProducts: Product[] = [
    {
        id: 'tarkett-parket-1',
        name: 'Salsa Art',
        slug: 'tarkett-salsa-art',
        sku: 'TARKETT-SALSA-ART',
        categoryId: '3', // Parket
        brandId: '3',    // Tarkett
        shortDescription: 'Višeslojni parket jedinstvenog dizajna i umetničkog izraza',
        description: `Salsa Art kolekcija parketa donosi umetnost u vaš dom. 
    Svaka daska je pažljivo obrađena kako bi se istakla prirodna lepota drveta.
    
    Karakteristike:
    - Jedinstven izgled svake daske
    - Površinska obrada koja naglašava strukturu drveta
    - Jednostavna i brza ugradnja zahvaljujući T-Lock sistemu
    - Pogodan za podno grejanje (uz poštovanje propisa)
    - Dugotrajnost i otpornost na habanje`,
        images: [
            {
                id: 'salsa-art-1',
                url: 'https://media.tarkett-image.com/larges/780005.jpg',
                alt: 'Salsa Art Parket',
                isPrimary: true,
                order: 1
            }
        ],
        specs: [
            { key: 'wood_species', label: 'Vrsta drveta', value: 'Hrast' },
            { key: 'installation', label: 'Tip instalacije', value: 'T-Lock klik sistem' },
            { key: 'surface', label: 'Površinska obrada', value: 'Proteco Strong lak' },
            { key: 'dimensions', label: 'Dimenzije', value: '14mm x 194mm x 2283mm' },
            { key: 'wear_layer', label: 'Debljina habajućeg sloja', value: '3.6 mm' },
        ],
        detailsSections: [
            {
                title: 'Opis kolekcije',
                items: [
                    'Ekskluzivni dizajni inspirisani prirodom',
                    'Višeslojna konstrukcija za veću stabilnost',
                    'Ekološki prihvatljiv proizvod',
                    'Garancija 30 godina'
                ]
            }
        ],
        price: 0,
        priceUnit: 'm²',
        inStock: true,
        featured: true,
        externalLink: 'https://www.tarkett.rs/sr_RS/kolekcija-C000966-salsa',
        createdAt: new Date(),
        updatedAt: new Date(),
    },
    {
        id: 'tarkett-parket-2',
        name: 'Tarkett Hrast',
        slug: 'tarkett-hrast-parket',
        sku: 'TARKETT-HRAST',
        categoryId: '3', // Parket
        brandId: '3',    // Tarkett
        shortDescription: 'Klasičan hrastov parket vrhunskog kvaliteta',
        description: `Hrast je simbol snage i izdržljivosti. Tarkett hrastov parket nudi bezvremensku eleganciju i toplinu.
    Idealan izbor za svaki enterijer, od tradicionalnog do modernog.`,
        images: [
            {
                id: 'tarkett-hrast-1',
                url: 'https://media.tarkett-image.com/larges/7876101_001.jpg',
                alt: 'Tarkett Hrast Parket',
                isPrimary: true,
                order: 1
            }
        ],
        specs: [
            { key: 'wood_species', label: 'Vrsta drveta', value: 'Hrast' },
            { key: 'installation', label: 'Tip instalacije', value: 'T-Lock klik sistem' },
            { key: 'surface', label: 'Površinska obrada', value: 'Lak ili Ulje' },
            { key: 'wear_layer', label: 'Debljina habajućeg sloja', value: '3.6 mm' },
        ],
        detailsSections: [
            {
                title: 'Prednosti',
                items: [
                    'Prirodan izgled i osećaj',
                    'Mogućnost reparacije (brušenja)',
                    'Odlična toplotna i zvučna izolacija',
                    'Povećava vrednost nekretnine'
                ]
            }
        ],
        price: 0,
        priceUnit: 'm²',
        inStock: true,
        featured: false,
        externalLink: 'https://www.tarkett.rs/sr_RS/kategorija-rs_C01012-parket',
        createdAt: new Date(),
        updatedAt: new Date(),
    },
    {
        id: 'tarkett-parket-3',
        name: 'Salsa Premium',
        slug: 'tarkett-salsa-premium',
        sku: 'TARKETT-SALSA-PREMIUM',
        categoryId: '3', // Parket
        brandId: '3',    // Tarkett
        shortDescription: 'Luksuzan parket sa naglašenom strukturom',
        description: `Salsa Premium je kolekcija za one koji traže nešto više. 
    Posebne tehnike obrade površine daju ovom parketu jedinstveni karakter.`,
        images: [
            {
                id: 'salsa-premium-1',
                url: 'https://media.tarkett-image.com/larges/7877046_001.jpg',
                alt: 'Salsa Premium Parket',
                isPrimary: true,
                order: 1
            }
        ],
        specs: [
            { key: 'wood_species', label: 'Vrsta drveta', value: 'Jasen / Hrast' },
            { key: 'installation', label: 'Tip instalacije', value: 'T-Lock klik sistem' },
            { key: 'surface', label: 'Površinska obrada', value: 'Proteco Natura' },
            { key: 'wear_layer', label: 'Debljina habajućeg sloja', value: '3.6 mm' },
        ],
        detailsSections: [
            {
                title: 'Karakteristike',
                items: [
                    'Sofisticiran dizajn',
                    'Visoka otpornost',
                    'Jednostavno održavanje'
                ]
            }
        ],
        price: 0,
        priceUnit: 'm²',
        inStock: true,
        featured: true,
        externalLink: 'https://www.tarkett.rs/sr_RS/kolekcija-C000966-salsa',
        createdAt: new Date(),
        updatedAt: new Date(),
    }
];
