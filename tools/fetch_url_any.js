const https = require('https');
const fs = require('fs');

const url = process.argv[2];
const dest = process.argv[3];

if (!url || !dest) {
    console.error("Usage: node fetch_url_any.js <url> <dest>");
    process.exit(1);
}

const file = fs.createWriteStream(dest);

console.log(`Fetching ${url} to ${dest}...`);

https.get(url, (response) => {
    if (response.statusCode !== 200) {
        console.error(`Request Failed. Status Code: ${response.statusCode}`);
        fs.unlink(dest, () => { });
        process.exit(1);
    }

    response.pipe(file);

    file.on('finish', () => {
        file.close();
        console.log('Download completed.');
    });
}).on('error', (e) => {
    console.error(`Got error: ${e.message}`);
    fs.unlink(dest, () => { });
    process.exit(1);
});
