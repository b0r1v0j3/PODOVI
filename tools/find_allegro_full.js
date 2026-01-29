const fs = require('fs');
const path = 'd:/PODOVI/SAJT/tmp/category_parket.html';

try {
    const content = fs.readFileSync(path, 'utf8');

    // Search Allegro
    const index = content.toLowerCase().indexOf('allegro');
    if (index !== -1) {
        console.log(`Allegro found at ${index}`);
        // Expanding window to find parent link
        const start = Math.max(0, index - 1000);
        const end = Math.min(content.length, index + 1000);
        console.log("Allegro Context:");
        console.log(content.substring(start, end));
    }

    // Search Europarquet
    const euro = content.toLowerCase().indexOf('europarquet');
    if (euro !== -1) {
        console.log(`Europarquet found at ${euro}`);
        const start = Math.max(0, euro - 1000);
        const end = Math.min(content.length, euro + 1000);
        console.log("Europarquet Context:");
        console.log(content.substring(start, end));
    }

} catch (e) {
    console.error(e);
}
