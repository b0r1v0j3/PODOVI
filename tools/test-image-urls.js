const https = require('https');

const testURLs = [
  'https://www.podovi.online/images/products/vinyl/mipolam-accord/collection.jpg',
  'https://www.podovi.online/images/products/vinyl/mipolam-symbioz/collection.jpg',
  'https://www.podovi.online/images/products/vinyl/nerok-55/collection.jpg'
];

testURLs.forEach(url => {
  https.get(url, (res) => {
    console.log(`${url.split('/').pop()}: ${res.statusCode} (${res.headers['content-length']} bytes)`);
    res.destroy();
  }).on('error', (e) => console.log(`${url.split('/').pop()}: Error - ${e.message}`));
});

setTimeout(() => {}, 3000);
