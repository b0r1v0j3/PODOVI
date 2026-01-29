const fs = require('fs');

try {
    const content = fs.readFileSync('d:/PODOVI/SAJT/tmp/main_category.html', 'utf8');

    // Regex to find hrefs with collection
    // href="/sr_RS/kolekcija-C000966-salsa-art"
    const regex = /href="([^"]*\/kolekcija-[^"]*)"/g;
    const links = new Set();

    let match;
    while ((match = regex.exec(content)) !== null) {
        // Fix relative URLs if needed, but they seem to start with /
        links.add('https://www.tarkett.rs' + match[1]);
    }

    console.log([...links].join('\n'));

} catch (e) {
    console.error(e);
}
