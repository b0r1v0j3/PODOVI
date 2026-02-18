const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'tarkett_html', 'debug_product_essence.html');
const content = fs.readFileSync(filePath, 'utf8');

const keywords = ['download', 'href=', 'data-src='];

console.log(`File size: ${content.length}`);

for (const keyword of keywords) {
    const index = content.toLowerCase().indexOf(keyword);
    if (index !== -1) {
        console.log(`\nFound keyword: "${keyword}" at index ${index}`);
        // Show context
        const start = Math.max(0, index - 100);
        const end = Math.min(content.length, index + 200);
        console.log(content.substring(start, end));
    } else {
        console.log(`Keyword "${keyword}" not found.`);
    }
}
