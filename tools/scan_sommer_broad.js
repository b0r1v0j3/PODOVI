const https = require('https');

const start = 2800;
const end = 3000;
const ids = [];
for (let i = start; i <= end; i++) {
    ids.push(`C00${i}`);
}

async function checkId(id) {
    return new Promise((resolve) => {
        https.get(`https://www.tarkett.rs/sr_RS/kolekcija-${id}`, (res) => {
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                // Follow redirect once
                https.get(res.headers.location, (res2) => {
                    let data = '';
                    res2.on('data', c => data += c);
                    res2.on('end', () => {
                        const titleMatch = data.match(/<title>(.*?)<\/title>/);
                        resolve({ id, status: res2.statusCode, title: titleMatch ? titleMatch[1] : 'No title', url: res.headers.location });
                    });
                }).on('error', () => resolve({ id, status: 'err' }));
            } else {
                let data = '';
                res.on('data', c => data += c);
                res.on('end', () => {
                    const titleMatch = data.match(/<title>(.*?)<\/title>/);
                    resolve({ id, status: res.statusCode, title: titleMatch ? titleMatch[1] : 'No title' });
                });
            }
        }).on('error', () => resolve({ id, status: 'err' }));
    });
}

async function run() {
    console.log(`Scanning C00${start} to C00${end}...`);
    // Process in chunks to avoid rate limits/socket errors
    const chunkSize = 20;
    for (let i = 0; i < ids.length; i += chunkSize) {
        const chunk = ids.slice(i, i + chunkSize);
        const promises = chunk.map(checkId);
        const results = await Promise.all(promises);

        results.forEach(r => {
            if (r.status === 200) {
                const t = r.title.toLowerCase();
                if (t.includes('sommer') || t.includes('europarquet') || t.includes('parket')) {
                    console.log(`MATCH: ${r.id} -> ${r.title}`);
                }
            }
        });
    }
}

run();
