// Native fetch is available in Node v24

const skuId = "260056010";
const slug = "ess30-scratched-cement-grey-33-3x66-6-0v";
const collectionSlug = "kolekcija-C002790-essence";

const candidates = [
    `https://www.tarkett.rs/sr_RS/dezen-${skuId}-${slug}`,
    `https://www.tarkett.rs/sr_RS/${collectionSlug}/dezen-${skuId}-${slug}`,
    `https://www.tarkett.rs/sr_RS/dezen-${slug}`,
    `https://www.tarkett.rs/sr_RS/product/${skuId}`,
];

(async () => {
    for (const url of candidates) {
        try {
            const res = await fetch(url, { method: 'HEAD' });
            console.log(`Checking ${url} -> ${res.status}`);
            if (res.status === 200) {
                console.log(`MATCH FOUND: ${url}`);
                // Stop after first match if you want, or check all to be sure
            }
        } catch (e) {
            console.log(`Error checking ${url}: ${e.message}`);
        }
    }
})();
