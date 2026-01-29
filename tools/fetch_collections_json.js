const https = require('https');
const fs = require('fs');

const url = 'https://www.tarkett.rs/sr_RS/collections-json';
const dest = 'd:/PODOVI/SAJT/tmp/collections.json';

const file = fs.createWriteStream(dest);

console.log(`Fetching ${url}...`);

https.get(url, (response) => {
    if (response.statusCode !== 200) {
        console.error(`Request Failed. Status Code: ${response.statusCode}`);
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
