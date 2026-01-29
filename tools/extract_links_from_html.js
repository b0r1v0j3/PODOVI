const fs = require('fs');
const path = 'd:/PODOVI/SAJT/tmp/category_parket.html';

try {
    const content = fs.readFileSync(path, 'utf8');
    const regex = /href="([^"]*kolekcija-[^"]*)"/g;
    const matches = [...content.matchAll(regex)];

    const urls = matches.map(m => m[1]);
    const uniqueUrls = [...new Set(urls)];

    console.log(`Found ${uniqueUrls.length} unique collection URLs:`);
    uniqueUrls.forEach(u => console.log(u));

} catch (e) {
    console.error(e);
}
