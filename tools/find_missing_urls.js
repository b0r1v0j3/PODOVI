const fs = require('fs');
const path = 'd:/PODOVI/SAJT/tmp/collection_urls.txt';

try {
    const content = fs.readFileSync(path, 'utf8');
    const lines = content.split('\n');

    const privilege = lines.find(l => l.includes('privilege') && !l.includes('waltz'));
    console.log("Privilege Base:", privilege || "Not found");

    const samba = lines.find(l => l.includes('C000974'));
    console.log("Samba:", samba || "Not found");

    const bolero = lines.find(l => l.includes('C000976'));
    console.log("Bolero:", bolero || "Not found");

} catch (e) {
    console.error(e);
}
