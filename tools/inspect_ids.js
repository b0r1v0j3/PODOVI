const https = require('https');

const ids = ['C002884', 'C002890'];

ids.forEach(id => {
    const url = `https://www.tarkett.rs/sr_RS/kolekcija-${id}`;
    https.get(url, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
            const titleMatch = data.match(/<title>(.*?)<\/title>/);
            const title = titleMatch ? titleMatch[1] : 'No title found';
            console.log(`${id}: ${title.trim()}`);
            if (res.statusCode >= 300) {
                console.log(`${id} Redirects to: ${res.headers.location}`);
            }
        });
    }).on('error', e => console.log(`${id} Error: ${e.message}`));
});
