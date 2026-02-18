const https = require('https');
const fs = require('fs');
const path = require('path');

const url = 'https://www.tarkett.rs/sr_RS/json-collection-product/C002929-bold/mist-1';

https.get(url, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            console.log("Fetched JSON for mist-1");
            fs.writeFileSync(path.join(__dirname, 'mist1_dump.json'), JSON.stringify(json, null, 2));
            console.log("Dumped to mist1_dump.json");
        } catch (e) {
            console.error("Error", e);
        }
    });
});
