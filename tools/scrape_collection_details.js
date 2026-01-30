const https = require('https');

const collections = [
    { name: 'Allegro', url: 'https://www.tarkett.rs/sr_RS/kolekcija-C002886-allegro' },
    { name: 'Privilege', url: 'https://www.tarkett.rs/sr_RS/kolekcija-C002662-privilege' },
    { name: 'Privilege Waltz', url: 'https://www.tarkett.rs/sr_RS/kolekcija-C002975-privilege-waltz' },
    { name: 'Rumba', url: 'https://www.tarkett.rs/sr_RS/kolekcija-C000973-rumba' },
    { name: 'Salsa', url: 'https://www.tarkett.rs/sr_RS/kolekcija-C000964-salsa' },
    { name: 'Salsa Art', url: 'https://www.tarkett.rs/sr_RS/kolekcija-C000966-salsa-art' },
    { name: 'Salsa Premium', url: 'https://www.tarkett.rs/sr_RS/kolekcija-C000965-salsa-premium' },
    { name: 'Sommer Europarquet', url: 'https://www.tarkett.rs/sr_RS/kolekcija-C002946-sommer-europarquet' },
    { name: 'Step XL & L', url: 'https://www.tarkett.rs/sr_RS/kolekcija-C000975-step-xl-l' },
    { name: 'Tango', url: 'https://www.tarkett.rs/sr_RS/kolekcija-C000969-tango' },
    { name: 'Tango Classic', url: 'https://www.tarkett.rs/sr_RS/kolekcija-C000972-tango-classic' }
];

async function fetchUrl(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data));
        }).on('error', reject);
    });
}

function extractContent(html) {
    const sandbox = { result: {} };

    // 1. Hero Image
    // Look for <img class="hero-image__image" src="...">
    const imgMatch = html.match(/class="hero-image__image"\s+src="([^"]+)"/);
    if (imgMatch) sandbox.result.image = imgMatch[1];

    // 2. Description
    // Look for <div class="hero-box__textbox"> ... <p>...</p> or similar text content
    // The description usually starts after the h1.
    // Let's try to extract the specific text block.
    // It is often in a specific container or just the first few paragraphs.

    // Tarkett structure often has description in a 'text-component' or similar.
    // Based on previous logs:
    // <div class="hero-box__textbox">
    //    <h1 data-test="category-title">Allegro</h1>
    //    <div class="rich-text"> <p>...</p> </div>

    const descMatch = html.match(/<div class="hero-box__textbox">([\s\S]*?)<\/div>/);
    if (descMatch) {
        // Clean tags but keep paragraph structure? Or just text.
        // User wants text.
        const cleanText = descMatch[1]
            .replace(/<h1.*?>.*?<\/h1>/, '') // Remove title
            .replace(/<.*?>/g, ' ') // Remove tags
            .replace(/\s+/g, ' ')
            .trim();
        sandbox.result.description = cleanText;
    }

    // 3. Key Features (Karakteristike)
    // "Ključne karakteristike"
    // Usually in a list <ul> under a section title.
    const featuresMatch = html.match(/Ključne karakteristike[\s\S]*?<ul>([\s\S]*?)<\/ul>/i);
    if (featuresMatch) {
        const lis = featuresMatch[1].match(/<li>([\s\S]*?)<\/li>/g);
        if (lis) {
            sandbox.result.features = lis.map(li => li.replace(/<.*?>/g, '').trim());
        }
    }

    return sandbox.result;
}

async function run() {
    const results = [];
    for (const c of collections) {
        console.log(`Scraping ${c.name}...`);
        try {
            const html = await fetchUrl(c.url);
            const data = extractContent(html);
            results.push({
                ...c,
                ...data
            });
        } catch (e) {
            console.error(`Error ${c.name}: ${e.message}`);
        }
    }

    console.log(JSON.stringify(results, null, 2));
}

run();
