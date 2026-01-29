const fs = require('fs');
const path = 'd:/PODOVI/SAJT/tmp/category_parket.html';

try {
    const content = fs.readFileSync(path, 'utf8');
    const index = content.toLowerCase().indexOf('allegro');

    if (index !== -1) {
        console.log(`Found 'allegro' at index ${index}.`);
        console.log("Context:");
        console.log(content.substring(Math.max(0, index - 200), Math.min(content.length, index + 300)));
    } else {
        console.log("'allegro' not found.");
    }

    const sommer = content.toLowerCase().indexOf('sommer');
    if (sommer !== -1) {
        console.log(`\nFound 'sommer' at index ${sommer}.`);
        console.log(content.substring(Math.max(0, sommer - 200), Math.min(content.length, sommer + 300)));
    }

} catch (e) {
    console.error(e);
}
