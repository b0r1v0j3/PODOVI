const fs = require('fs');
const path = 'd:/PODOVI/SAJT/tmp/collection_urls.txt';

try {
    const content = fs.readFileSync(path, 'utf8');
    const lines = content.split('\n');

    const collections = lines.map(line => {
        const match = line.match(/kolekcija-(C\d+)-(.*)/);
        if (match) {
            return { id: match[1], name: match[2], url: line.trim() };
        }
        return null;
    }).filter(c => c !== null); // Filter nulls

    // Sort by ID
    collections.sort((a, b) => a.id.localeCompare(b.id));

    console.log(`Found ${collections.length} collections.`);

    // Dump to file for viewing
    const out = collections.map(c => `${c.id} : ${c.name} : ${c.url}`).join('\n');
    fs.writeFileSync('d:/PODOVI/SAJT/tmp/all_collections_list.txt', out);

} catch (e) {
    console.error(e);
}
