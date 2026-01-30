const https = require('https');

const url = 'https://www.tarkett.rs/sr_RS/kolekcija-C002662-privilege';

https.get(url, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        console.log(data);
    });
});
