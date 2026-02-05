const fs = require('fs');
const path = require('path');

// Read the tarkett-products.ts file
const filePath = path.join(__dirname, '..', 'lib', 'data', 'tarkett-products.ts');
let content = fs.readFileSync(filePath, 'utf-8');

// Mapping of CDN URLs to local paths
const cdnToLocal = {
    // Salsa 3-Strip variants
    'https://media.tarkett-image.com/large/TH_3_Strip_Salsa_Oak_Linen.jpg': '/images/products/hrast-linen-3-strip.jpg',
    'https://media.tarkett-image.com/large/TH_3_Strip_Salsa_Oak_Original_Shiny.jpg': '/images/products/hrast-original-shiny-3-strip.jpg',
    'https://media.tarkett-image.com/large/TH_3_Strip_Salsa_Oak_Supreme_Matt.jpg': '/images/products/hrast-supreme-matt-3-strip.jpg',
    'https://media.tarkett-image.com/large/TH_3_Strip_Oak_Chocolate.jpg': '/images/products/hrast-chocolate-3-strip.jpg',
    'https://media.tarkett-image.com/large/TH_3_Strip_OAK_COCOA.jpg': '/images/products/hrast-cocoa-3-strip.jpg',
    'https://media.tarkett-image.com/large/TH_3_Strip_Salsa_Oak_Original_Copper.jpg': '/images/products/hrast-copper-original-3-strip.jpg',
    'https://media.tarkett-image.com/large/TH_3_Strip_Salsa_Oak_Cotton.jpg': '/images/products/hrast-cotton-3-strip.jpg',
    'https://media.tarkett-image.com/large/TH_3_Strip_Salsa_Oak_Elegant_High_Gloss.jpg': '/images/products/hrast-elegant-high-gloss-3-strip.jpg',
    'https://media.tarkett-image.com/large/TH_3_Strip_Salsa_Oak_Elegant_Matt.jpg': '/images/products/hrast-elegant-matt-3-strip.jpg',
    'https://media.tarkett-image.com/large/TH_3_Strip_Salsa_Oak_Elegant_Shiny.jpg': '/images/products/hrast-elegant-shiny-3-strip.jpg',
    'https://media.tarkett-image.com/large/TH_3_Strip_OAK_ICEBERG_BR.jpg': '/images/products/hrast-iceberg-3-strip.jpg',
    'https://media.tarkett-image.com/large/TH_3_Strip_Salsa_Oak_Original_HG.jpg': '/images/products/hrast-original-high-gloss-3-strip.jpg',
    'https://media.tarkett-image.com/large/TH_3_Strip_Oak_Robust_white.jpg': '/images/products/hrast-robust-white-3-strip.jpg',
    'https://media.tarkett-image.com/large/TH_3_Strip_Salsa_Ash_Silky_White.jpg': '/images/products/jasen-silky-white-3-strip.jpg',
    'https://media.tarkett-image.com/large/TH_3_Strip_Oak_Jasper.jpg': '/images/products/hrast-jasper-3-strip.jpg',
    'https://media.tarkett-image.com/large/TH_3_Strip_Oak_Moonstone.jpg': '/images/products/hrast-moonstone-3-strip.jpg',
    'https://media.tarkett-image.com/large/TH_3_Strip_WHITE_LIGHTNING.jpg': '/images/products/hrast-white-lightning-3-strip.jpg',
    'https://media.tarkett-image.com/large/TH_3_Strip_IVORY_DREAMS.jpg': '/images/products/jasen-ivory-dreams-3-strip.jpg',
    'https://media.tarkett-image.com/large/TH_3_Strip_White_Canvas.jpg': '/images/products/jasen-white-canvas-3-strip.jpg',

    // Tango 1-Strip variants
    'https://media.tarkett-image.com/large/TH_1_Strip_Tango_Oak_Bourbon.jpg': '/images/products/hrast-bourbon-1-strip.jpg',
    'https://media.tarkett-image.com/large/TH_1_Strip_Tango_Oak_Cumin.jpg': '/images/products/hrast-cumin-1-strip.jpg',
    'https://media.tarkett-image.com/large/TH_1_Strip_Tango_Oak_Premium.jpg': '/images/products/hrast-premium-1-strip.jpg',
    'https://media.tarkett-image.com/large/TH_1_Strip_Tango_Classic_Oak_Sepia.jpg': '/images/products/hrast-sepia.jpg',

    // Step variants
    'https://media.tarkett-image.com/large/TH_1_Strip_Step_Oak_Baron_Brown.jpg': '/images/products/hrast-baron-brown.jpg',
    'https://media.tarkett-image.com/large/TH_1_Strip_Step_Oak_Baron_Sienna.jpg': '/images/products/hrast-baron-sienna.jpg',
    'https://media.tarkett-image.com/large/TH_1_Step_Oak_Copper.jpg': '/images/products/hrast-copper-1-strip.jpg',
    'https://media.tarkett-image.com/large/TH_1_Step_Oak_Premium.jpg': '/images/products/hrast-premium-1-strip.jpg',
    'https://media.tarkett-image.com/large/TH_1_Strip_Step_Oak_Royal_Antique_White.jpg': '/images/products/hrast-royal-antique-white.jpg',
    'https://media.tarkett-image.com/large/TH_1_Strip_Step_Oak_Royal_Grey.jpg': '/images/products/hrast-royal-grey.jpg',

    // Europarquet variants
    'https://media.tarkett-image.com/large/TH_Sinteros_Europarquet_OAK_BRONZE.jpg': '/images/products/hrast-bronze.jpg',
    'https://media.tarkett-image.com/large/TH_eUROPARQUET_Oak_ESPRESSO.jpg': '/images/products/hrast-espresso.jpg',
    'https://media.tarkett-image.com/large/TH_Europarquet_Oak_Golden.jpg': '/images/products/hrast-golden.jpg',
    'https://media.tarkett-image.com/large/TH_Europarquet_Oak_Original.jpg': '/images/products/hrast-original.jpg',
    'https://media.tarkett-image.com/large/TH_Europarquet_Oak_Polar.jpg': '/images/products/hrast-polar.jpg',
};

// Count replacements
let replacementCount = 0;
const notFound = [];

// Replace each CDN URL with local path
for (const [cdnUrl, localPath] of Object.entries(cdnToLocal)) {
    if (content.includes(cdnUrl)) {
        content = content.split(cdnUrl).join(localPath);
        replacementCount++;
        console.log(`✓ Replaced: ${cdnUrl.split('/').pop()} → ${localPath}`);
    } else {
        notFound.push(cdnUrl);
    }
}

// Check for remaining CDN URLs
const remainingCdn = content.match(/https:\/\/media\.tarkett-image\.com[^"]+/g) || [];

console.log('\n--- Summary ---');
console.log(`Replacements made: ${replacementCount}`);
console.log(`Remaining CDN URLs: ${remainingCdn.length}`);

if (remainingCdn.length > 0) {
    console.log('\nRemaining CDN URLs:');
    remainingCdn.forEach(url => console.log(`  - ${url}`));
}

// Write the updated content back
fs.writeFileSync(filePath, content, 'utf-8');
console.log('\n✓ File updated successfully!');
