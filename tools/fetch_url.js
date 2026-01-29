const https = require('https');
const fs = require('fs');

const url = 'https://www.tarkett.rs/sr_RS/kategorija-rs_C01012-parket';
const dest = 'd:/PODOVI/SAJT/tmp/main_category.html';

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
    fs.unlink(dest, () => { }); // Delete the file async. (But we don't check result)
    process.exit(1);
});
