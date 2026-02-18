const https = require('https');

const url = 'https://www.tarkett.rs/sr_RS/json-collection-product/C002790-essence/ess30-scratched-cement-grey-33-3x66-6-0v';

https.get(url, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            console.log("Fetched JSON successfully.");

            const fs = require('fs');
            const path = require('path');
            fs.writeFileSync(path.join(__dirname, 'product_dump.json'), JSON.stringify(json, null, 2));
            console.log("Dumped JSON to product_dump.json");

        } catch (e) {
            console.error("Error parsing JSON:", e);
        }
    });

}).on('error', (err) => {
    console.error("Error fetching URL:", err);
});
