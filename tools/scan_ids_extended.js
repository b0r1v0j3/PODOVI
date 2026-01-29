const https = require('https');

const ids = [];
for (let i = 2891; i <= 2910; i++) {
    ids.push(`C00${i}`);
}

ids.forEach(id => {
    const url = `https://www.tarkett.rs/sr_RS/kolekcija-${id}`;
    https.get(url, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
            if (res.statusCode >= 300) {
                // Redirect often leads to the valid category
                console.log(`${id} Redirect -> ${res.headers.location}`);
            }
            if (res.statusCode === 200) {
                const titleMatch = data.match(/<title>(.*?)<\/title>/);
                const title = titleMatch ? titleMatch[1] : 'No title found';
                console.log(`${id}: ${title.trim()}`);

                if (data.toLowerCase().includes('sommer') || data.toLowerCase().includes('europarquet')) {
                    console.log(`!!! MATCH FOUND FOR SOMMER: ${id} !!!`);
                }
            }
        });
    }).on('error', e => console.log(`${id} Error: ${e.message}`));
});
