const http = require('http');

async function testCategoryPage() {
    console.log("Fetching /kategorije/deking on localhost:3000...");
    const req = http.request('http://localhost:3000/kategorije/deking', (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
            console.log(`Status code: ${res.statusCode}`);
            if (data.includes('Deking') && data.includes('TimberTech')) {
                console.log("SUCCESS: Category page loaded and contains Deking/TimberTech text");
            } else {
                console.log("ERROR: Page did not contain expected text. Length was " + data.length);
            }
            if (data.includes('Coconut Husk') || data.includes('Dark Teak')) {
                console.log("SUCCESS: Products are rendered.");
            } else {
                console.log("ERROR: Products are not rendered.");
            }
            process.exit(0);
        });
    });

    req.on('error', e => {
        console.error("Error making request", e.message);
        process.exit(1);
    });

    req.end();
}

testCategoryPage();
