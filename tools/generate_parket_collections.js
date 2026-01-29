const fs = require('fs');

const collections = [
    { name: 'Salsa', id: 'PARKET-SALSA', desc: 'Salsa parket kolekcija' },
    { name: 'Salsa Premium', id: 'PARKET-SALSA-PREMIUM', desc: 'Premium Salsa kolekcija' },
    { name: 'Salsa Art', id: 'PARKET-SALSA-ART', desc: 'Umetnička Salsa kolekcija' },
    { name: 'Tango', id: 'PARKET-TANGO', desc: 'Tango parket - elegancija u svakom koraku' },
    { name: 'Tango Classic', id: 'PARKET-TANGO-CLASSIC', desc: 'Klasični Tango dizajn' },
    { name: 'Rumba', id: 'PARKET-RUMBA', desc: 'Rumba kolekcija za moderne prostore' },
    { name: 'Step XL & L', id: 'PARKET-STEP', desc: 'Step kolekcija velikih formata' },
    { name: 'Privilege', id: 'PARKET-PRIVILEGE', desc: 'Privilege kolekcija' },
    { name: 'Privilege Waltz', id: 'PARKET-PRIVILEGE-WALTZ', desc: 'Privilege Waltz varijanta' },
    { name: 'Allegro', id: 'PARKET-ALLEGRO', desc: 'Allegro parket' },
    { name: 'Sommer Europarquet', id: 'PARKET-SOMMER', desc: 'Sommer Europarquet ekonomična opcija' },
];

const collectionProducts = collections.map((c, idx) => ({
    id: c.id.toLowerCase(),
    name: c.name,
    slug: c.name.toLowerCase().replace(/ /g, '-').replace('&', 'and'),
    sku: c.id,
    categoryId: '3',
    brandId: '3',
    shortDescription: c.desc,
    description: c.desc,
    images: [{
        id: c.id.toLowerCase() + '-img',
        url: '/images/categories/parket.jpg', // Placeholder, using category image for now
        alt: c.name,
        isPrimary: true,
        order: 0
    }],
    specs: [
        { key: 'collection', label: 'Kolekcija', value: c.name },
        { key: 'type', label: 'Tip', value: 'Parket' } // Helper for filtering if needed
    ],
    price: 0,
    priceUnit: 'm²',
    inStock: true,
    featured: true,
    createdAt: new Date(),
    updatedAt: new Date()
}));

// Read existing products
const rawFile = fs.readFileSync('d:/PODOVI/SAJT/lib/data/tarkett-products.ts', 'utf8');
// This is hacky because the file is TS. We need to extract the array.
// But wait, the file format is `export const tarkettProducts: Product[] = [...];`
// We can just append the new items to the array.

// Better approach: Regenerate the file with BOTH lists.
// We can use the previously scraped JSON logic, or just parse the text.
// Or just prepend the Collection Products to the list in `scrape_all.js`.

console.log(JSON.stringify(collectionProducts, null, 2));
