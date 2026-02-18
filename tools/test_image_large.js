// Native fetch

const baseUrl = 'https://media.tarkett-image.com/XXS/TH_LVT_Essence_Scratched_Cement_Grey.jpg';

(async () => {
    const hugeUrl = baseUrl.replace('/XXS/', '/large/');
    console.log(`Testing: ${hugeUrl}`);
    try {
        const res = await fetch(hugeUrl, { method: 'HEAD' });
        console.log(`Status: ${res.status}`);
    } catch (e) {
        console.log(`Error: ${e.message}`);
    }
})();
