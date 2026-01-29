const fs = require('fs');
const path = 'd:/PODOVI/SAJT/tmp/category_parket.html';

try {
    const content = fs.readFileSync(path, 'utf8');

    const index = content.toLowerCase().indexOf('privilege');
    if (index !== -1) {
        console.log(`Privilege found at ${index}`);
        const start = Math.max(0, index - 1000);
        const end = Math.min(content.length, index + 1000);
        console.log("Privilege Context:");
        console.log(content.substring(start, end));
    } else {
        console.log("'privilege' not found.");
    }

} catch (e) {
    console.error(e);
}
