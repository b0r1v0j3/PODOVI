const http = require('http');

async function testProductPage() {
    console.log("Fetching /proizvodi/edge-ravan-profil-dark-teak-4880-x-136-x-24-mm on localhost:3000...");
    const req = http.request('http://localhost:3000/proizvodi/edge-ravan-profil-dark-teak-4880-x-136-x-24-mm', (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
            console.log(`Status code: ${res.statusCode}`);
            if (data.includes('EDGE ravan profil, Dark Teak')) {
                console.log("SUCCESS: Product name rendered");
            } else {
                console.log("ERROR: Option name not rendered");
            }
            if (data.includes('TimberTech')) {
                console.log("SUCCESS: TimberTech brand is rendered.");
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

testProductPage();
