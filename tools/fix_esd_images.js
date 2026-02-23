/**
 * Fix ESD color swatch images in esd_colors.json
 * Updates all color image URLs with correct per-color images from Gerflor CDN
 * Also fixes Mipolam EL7 color codes that were incorrect
 */
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'public', 'data', 'esd_colors.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

// Correct per-color image URLs scraped from Gerflor product pages
const imageOverrides = {
    'mipolam-el5': {
        '0350': 'https://www.gerflor-cee.com/sites/web_peco/files/styles/product_variation_colorbox_b2b/public/externals/0/f/0f81870f659c0208a2b16346184a65b0.jpg.webp?itok=mlJIhXOr',
        '0351': 'https://www.gerflor-cee.com/sites/web_peco/files/styles/product_variation_colorbox_b2b/public/externals/3/6/3690ab016c9dd8ce714df5f2688a6a23.jpg.webp?itok=aU6Azsc4',
        '0352': 'https://www.gerflor-cee.com/sites/web_peco/files/styles/product_variation_colorbox_b2b/public/externals/d/b/db4e41809442de89674f45f160665ac4.jpg.webp?itok=pmwMdFTd',
        '0353': 'https://www.gerflor-cee.com/sites/web_peco/files/styles/product_variation_colorbox_b2b/public/externals/c/7/c72ee188a46e15d9c37d4871e3fa4d91.jpg.webp?itok=1G557tvC',
        '0354': 'https://www.gerflor-cee.com/sites/web_peco/files/styles/product_variation_colorbox_b2b/public/externals/3/4/34989921375e9f220a3b32aa65a251aa.jpg.webp?itok=pOL7A2sp',
        '0355': 'https://www.gerflor-cee.com/sites/web_peco/files/styles/product_variation_colorbox_b2b/public/externals/b/3/b3e6ce7c3a4ba563820a92549543e216.jpg.webp?itok=kl-FtfvS',
    },
    'gti-el5-connect': {
        '0350': 'https://www.gerflor-cee.com/sites/web_peco/files/styles/product_variation_colorbox_b2b/public/externals/0/f/0f81870f659c0208a2b16346184a65b0.jpg.webp?itok=mlJIhXOr',
        '0351': 'https://www.gerflor-cee.com/sites/web_peco/files/styles/product_variation_colorbox_b2b/public/externals/3/6/3690ab016c9dd8ce714df5f2688a6a23.jpg.webp?itok=aU6Azsc4',
        '0352': 'https://www.gerflor-cee.com/sites/web_peco/files/styles/product_variation_colorbox_b2b/public/externals/d/b/db4e41809442de89674f45f160665ac4.jpg.webp?itok=pmwMdFTd',
        '0353': 'https://www.gerflor-cee.com/sites/web_peco/files/styles/product_variation_colorbox_b2b/public/externals/c/7/c72ee188a46e15d9c37d4871e3fa4d91.jpg.webp?itok=1G557tvC',
        '0354': 'https://www.gerflor-cee.com/sites/web_peco/files/styles/product_variation_colorbox_b2b/public/externals/3/4/34989921375e9f220a3b32aa65a251aa.jpg.webp?itok=pOL7A2sp',
    },
    'gti-el5-cleantech': {
        '0350': 'https://www.gerflor-cee.com/sites/web_peco/files/styles/product_variation_colorbox_b2b/public/externals/0/f/0f81870f659c0208a2b16346184a65b0.jpg.webp?itok=mlJIhXOr',
        '0351': 'https://www.gerflor-cee.com/sites/web_peco/files/styles/product_variation_colorbox_b2b/public/externals/3/6/3690ab016c9dd8ce714df5f2688a6a23.jpg.webp?itok=aU6Azsc4',
        '0352': 'https://www.gerflor-cee.com/sites/web_peco/files/styles/product_variation_colorbox_b2b/public/externals/d/b/db4e41809442de89674f45f160665ac4.jpg.webp?itok=pmwMdFTd',
        '0353': 'https://www.gerflor-cee.com/sites/web_peco/files/styles/product_variation_colorbox_b2b/public/externals/c/7/c72ee188a46e15d9c37d4871e3fa4d91.jpg.webp?itok=1G557tvC',
        '0354': 'https://www.gerflor-cee.com/sites/web_peco/files/styles/product_variation_colorbox_b2b/public/externals/3/4/34989921375e9f220a3b32aa65a251aa.jpg.webp?itok=pOL7A2sp',
    },
    'mipolam-biocontrol-el5': {
        '2001': 'https://www.gerflor-cee.com/sites/web_peco/files/styles/product_variation_colorbox_b2b/public/externals/3/9/3955124b91d80d18a88da6f0a2fc1e11.jpg.webp?itok=bY7GQSBR',
        '2002': 'https://www.gerflor-cee.com/sites/web_peco/files/styles/product_variation_colorbox_b2b/public/externals/4/d/4df55a98999e26f4d55e026cff57762c.jpg.webp?itok=H6n3oYXU',
        '2004': 'https://www.gerflor-cee.com/sites/web_peco/files/styles/product_variation_colorbox_b2b/public/externals/8/5/859e0b81b8f25541676f9d0de109eba7.jpg.webp?itok=sDpdRC6X',
        '2006': 'https://www.gerflor-cee.com/sites/web_peco/files/styles/product_variation_colorbox_b2b/public/externals/e/8/e8ebee9fdede52f92ebb5477bd621df2.jpg.webp?itok=ut3SzFRM',
    },
    'mipolam-technic-el5-eu': {
        '0635': 'https://www.gerflor-cee.com/sites/web_peco/files/styles/product_variation_colorbox_b2b/public/externals/6/d/6dd2d94d6c41a1686822482139106764.jpg.webp?itok=NAs3dghz',
        '0636': 'https://www.gerflor-cee.com/sites/web_peco/files/styles/product_variation_colorbox_b2b/public/externals/2/7/27a78713992900c8ffeb45f1a66e1994.jpg.webp?itok=3jxsmbG-',
        '0637': 'https://www.gerflor-cee.com/sites/web_peco/files/styles/product_variation_colorbox_b2b/public/externals/8/f/8f88017034ee2f5733901406174726f1.jpg.webp?itok=qDMVjoXt',
        '0638': 'https://www.gerflor-cee.com/sites/web_peco/files/styles/product_variation_colorbox_b2b/public/externals/d/4/d40b9f3b048afeda1b4c7e37ac1e730e.jpg.webp?itok=62X9ZGwO',
        '0639': 'https://www.gerflor-cee.com/sites/web_peco/files/styles/product_variation_colorbox_b2b/public/externals/c/e/ce90c6788a8ee82f38343081b2535fb4.jpg.webp?itok=-uP-8BCU',
        '0640': 'https://www.gerflor-cee.com/sites/web_peco/files/styles/product_variation_colorbox_b2b/public/externals/6/6/66509ff2ed524dd6b9e1bd1c758e6c4b.jpg.webp?itok=pOFLmf1m',
    },
    'mipolam-robust-el7': {
        '0002': 'https://www.gerflor-cee.com/sites/web_peco/files/styles/product_variation_colorbox_b2b/public/externals/3/7/377941ccd0471d9fd7e1ed994e1a365a.jpg.webp?itok=HDmUDKxb',
        '0003': 'https://www.gerflor-cee.com/sites/web_peco/files/styles/product_variation_colorbox_b2b/public/externals/d/a/da8a81abdf5d5ee9d444fb8ef670ab3f.jpg.webp?itok=EBtssoM1',
        '0005': 'https://www.gerflor-cee.com/sites/web_peco/files/styles/product_variation_colorbox_b2b/public/externals/4/4/449cdbefcc81754eeb07ecbe17122a75.jpg.webp?itok=C9dtNPVA',
        '0013': 'https://www.gerflor-cee.com/sites/web_peco/files/styles/product_variation_colorbox_b2b/public/externals/6/4/64293e7202db1b0714f6807365d355fb.jpg.webp?itok=AmeA_AtT',
        '0112': 'https://www.gerflor-cee.com/sites/web_peco/files/styles/product_variation_colorbox_b2b/public/externals/f/a/fa13d70ce535f978557ea43ea801e84a.jpg.webp?itok=5Opkba7l',
        '0306': 'https://www.gerflor-cee.com/sites/web_peco/files/styles/product_variation_colorbox_b2b/public/externals/d/3/d3f122dba3c46e64d3f67091c4d348cb.jpg.webp?itok=WFtAyQgd',
    },
    'mipolam-el7': {
        '4101': 'https://www.gerflor-cee.com/sites/web_peco/files/styles/product_variation_colorbox_b2b/public/externals/8/0/80fedec1c85122cec2add5a01b72c70c.jpg.webp?itok=_zEiEFnj',
        '4110': 'https://www.gerflor-cee.com/sites/web_peco/files/styles/product_variation_colorbox_b2b/public/externals/b/6/b61ac1fdfdeca39c4844c25c906b4ec6.jpg.webp?itok=pyPbwRIn',
        '4111': 'https://www.gerflor-cee.com/sites/web_peco/files/styles/product_variation_colorbox_b2b/public/externals/c/d/cd45da7e091fef9ad8844bff54ecd2f2.jpg.webp?itok=RDAmM6E7',
        '4116': 'https://www.gerflor-cee.com/sites/web_peco/files/styles/product_variation_colorbox_b2b/public/externals/1/3/130bb681ec6ab580f24769385241917f.jpg.webp?itok=UI4W3TPy',
        '4120': 'https://www.gerflor-cee.com/sites/web_peco/files/styles/product_variation_colorbox_b2b/public/externals/0/1/010571b448518a8148d07ff8ec21bd3b.jpg.webp?itok=EQCAE_Sg',
        '4124': 'https://www.gerflor-cee.com/sites/web_peco/files/styles/product_variation_colorbox_b2b/public/externals/0/b/0bb023c2d98ab3e6ac670f5baff1d5c4.jpg.webp?itok=8QwRstCr',
        '4132': 'https://www.gerflor-cee.com/sites/web_peco/files/styles/product_variation_colorbox_b2b/public/externals/b/7/b746b3445b42204493a0e3fc33a2efd2.jpg.webp?itok=mFHQ5lqM',
        '4144': 'https://www.gerflor-cee.com/sites/web_peco/files/styles/product_variation_colorbox_b2b/public/externals/f/0/f03934b6962a2e0188e74acd5a93a376.jpg.webp?itok=TI4sVAsP',
        '4159': 'https://www.gerflor-cee.com/sites/web_peco/files/styles/product_variation_colorbox_b2b/public/externals/f/8/f804a0983a33540201111594ba132372.jpg.webp?itok=OQilRp6z',
    },
};

let totalUpdated = 0;

for (const collection of data.collections) {
    const slug = collection.slug;
    const overrides = imageOverrides[slug];
    if (!overrides) {
        console.log(`⚠️  No overrides for ${slug}`);
        continue;
    }

    let updated = 0;
    for (const color of collection.colors) {
        const newImg = overrides[color.code];
        if (newImg) {
            const oldImg = color.image;
            color.image = newImg;
            if (oldImg !== newImg) {
                updated++;
            }
        } else {
            console.log(`  ⚠️  ${slug}: No image for code ${color.code} (${color.name})`);
        }
    }
    console.log(`✓ ${slug}: ${updated} images updated (${collection.colors.length} colors)`);
    totalUpdated += updated;
}

console.log(`\nTotal: ${totalUpdated} images updated`);
fs.writeFileSync(filePath, JSON.stringify(data, null, 4));
console.log('✓ esd_colors.json saved');
