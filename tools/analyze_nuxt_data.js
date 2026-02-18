const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'debug_collection_scroll.html');
const content = fs.readFileSync(filePath, 'utf8');

// Extract the script content
// Attempt 1: Standard pattern
let match = content.match(/window\.__NUXT__=\((function[\s\S]*?)\)(?:;|<\/script>)/);

if (!match) {
    console.log("Could not find window.__NUXT__ with regex.");
    // Print the last 500 chars to see what's there
    console.log("Last 500 chars of file:");
    console.log(content.slice(-500));
    process.exit(1);
}

const scriptBody = match[1];

// Write the script body to a file for inspection
fs.writeFileSync(path.join(__dirname, 'nuxt_dump.js'), scriptBody);
console.log("Dumped NUXT script to nuxt_dump.js");

// We can't easily eval() this context-dependent script without a DOM.
// But we can try to look for SKU patterns or array lengths using regex.

// Look for SKUs or products in the text
const skuMatches = content.match(/sku_id:"(\d+)"/g);
console.log(`Found ${skuMatches ? skuMatches.length : 0} 'sku_id' occurrences in regex check.`);
if (skuMatches) {
    console.log("Sample SKUs:", skuMatches.slice(0, 5));
}

// look for `Ref. ` in HTML
const refMatches = content.match(/Ref\.\s*(\d+)/g);
console.log(`Found ${refMatches ? refMatches.length : 0} 'Ref.' matches in HTML body.`);

// Check for "load more" button presence
const hasLoadMore = content.includes('load-more-button');
console.log(`Has 'load-more-button': ${hasLoadMore}`);

// Let's try to extract the large JSON object if possible, or at least structure traces
// The NUXT script creates a complex object.
// If we see many SKUs in the source, it might be preloaded.

// Let's verify if the JSON endpoint mentioned in previous steps is a better bet.
// The attribute was `formats-url`.
const formatsUrlMatch = content.match(/formats-url="([^"]+)"/);
if (formatsUrlMatch) {
    console.log(`Found formats-url: ${formatsUrlMatch[1]}`);
} else {
    console.log("No formats-url attribute found.");
}
