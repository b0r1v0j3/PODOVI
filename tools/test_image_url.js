const https = require('https');

const imageUrl = 'https://media.tarkett-image.com/large/THH_LVT_Essence_Primary_Oak_Light_Grey_mini_plank_10x60.jpg';

console.log(`Checking URL: ${imageUrl}`);

https.get(imageUrl, (res) => {
    console.log(`Status Code: ${res.statusCode}`);
    if (res.statusCode === 200) {
        console.log("Image exists!");
    } else {
        console.log("Image not found or error.");
    }
}).on('error', (e) => {
    console.error("Error fetching image:", e);
});
