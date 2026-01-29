const fs = require('fs');
const path = 'd:/PODOVI/SAJT/tmp/sitemap_1.xml';
const output = 'd:/PODOVI/SAJT/tmp/collection_urls.txt';

try {
    const content = fs.readFileSync(path, 'utf8');
    const regex = /<loc>(.*?)<\/loc>/g;
    const matches = content.matchAll(regex);

    // Convert iterator to array and filter
    const urls = Array.from(matches, m => m[1])
        .filter(url => url.includes('kolekcija-'));

    console.log(`Found ${urls.length} collection URLs.`);

    fs.writeFileSync(output, urls.join('\n'));

} catch (e) {
    console.error(e);
}
