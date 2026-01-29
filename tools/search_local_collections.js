const fs = require('fs');
const path = 'd:/PODOVI/SAJT/tmp/all_collections_list.txt';

try {
    const content = fs.readFileSync(path, 'utf8');
    const lines = content.split('\n');

    console.log("Searching for specific IDs...");
    lines.forEach(line => {
        const match = line.match(/(C00096[0-9]|C00097[0-9]|C00098[0-9])/);
        if (match) {
            console.log(line);
        }
    });

    console.log("\nSearching for names (allegro, sommer, euro)...");
    lines.forEach(line => {
        const lower = line.toLowerCase();
        if (lower.includes('allegro') || lower.includes('sommer') || lower.includes('euro')) {
            console.log(line);
        }
    });

} catch (e) {
    console.error(e);
}
