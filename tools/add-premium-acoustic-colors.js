const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const colorsJsonPath = path.join(rootDir, 'public', 'data', 'gerflor_linoleum_colors_complete.json');

// All 29 colors from the website
const allColors = [
  { code: "0027", name: "COCOON MUSLIN", slug: "premium-acoustic-0027-cocoon-muslin", href: "https://www.gerflor-cee.com/products/premium-acoustic-0027-cocoon-muslin-hd740027", sku: "hd740027" },
  { code: "0032", name: "COCOON SATIN", slug: "premium-acoustic-0032-cocoon-satin", href: "https://www.gerflor-cee.com/products/premium-acoustic-0032-cocoon-satin-hd740032", sku: "hd740032" },
  { code: "0051", name: "BRAZILIA ALVORADA", slug: "premium-acoustic-0051-brazilia-alvorada", href: "https://www.gerflor-cee.com/products/premium-acoustic-0051-brazilia-alvorada-hd310051", sku: "hd310051" },
  { code: "2152", name: "POESY OCTAVE", slug: "premium-acoustic-2152-poesy-octave", href: "https://www.gerflor-cee.com/products/premium-acoustic-2152-poesy-octave-hd562152", sku: "hd562152" },
  { code: "2501", name: "POESY RHAPSODY", slug: "premium-acoustic-2501-poesy-rhapsody", href: "https://www.gerflor-cee.com/products/premium-acoustic-2501-poesy-rhapsody-hd562501", sku: "hd562501" },
  { code: "2743", name: "NEOPOLIS CENTRAL PARK", slug: "premium-acoustic-2743-neopolis-central-park", href: "https://www.gerflor-cee.com/products/premium-acoustic-2743-neopolis-central-park-hd372743", sku: "hd372743" },
  { code: "2747", name: "POESY BALLADE", slug: "premium-acoustic-2747-poesy-ballade", href: "https://www.gerflor-cee.com/products/premium-acoustic-2747-poesy-ballade-hd562747", sku: "hd562747" },
  { code: "2749", name: "POESY LYRIQUE", slug: "premium-acoustic-2749-poesy-lyrique", href: "https://www.gerflor-cee.com/products/premium-acoustic-2749-poesy-lyrique-hd562749", sku: "hd562749" },
  { code: "2750", name: "POESY ELLIPSE", slug: "premium-acoustic-2750-poesy-ellipse", href: "https://www.gerflor-cee.com/products/premium-acoustic-2750-poesy-ellipse-hd562750", sku: "hd562750" },
  { code: "2752", name: "POESY LITOTE", slug: "premium-acoustic-2752-poesy-litote", href: "https://www.gerflor-cee.com/products/premium-acoustic-2752-poesy-litote-hd562752", sku: "hd562752" },
  { code: "3791", name: "OSMOZ SLATE GREY", slug: "premium-acoustic-3791-osmoz-slate-grey", href: "https://www.gerflor-cee.com/products/premium-acoustic-3791-osmoz-slate-grey-hd763791", sku: "hd763791" },
  { code: "4001", name: "INDIANA² OFU", slug: "premium-acoustic-4001-indiana2-ofu", href: "https://www.gerflor-cee.com/products/premium-acoustic-4001-indiana2-ofu-hd464001", sku: "hd464001" },
  { code: "4002", name: "INDIANA² MANUA", slug: "premium-acoustic-4002-indiana2-manua", href: "https://www.gerflor-cee.com/products/premium-acoustic-4002-indiana2-manua-hd464002", sku: "hd464002" },
  { code: "4009", name: "INDIANA² TUFOA", slug: "premium-acoustic-4009-indiana2-tufoa", href: "https://www.gerflor-cee.com/products/premium-acoustic-4009-indiana2-tufoa-hd464009", sku: "hd464009" },
  { code: "4047", name: "INDIANA² OKUZA", slug: "premium-acoustic-4047-indiana2-okuza", href: "https://www.gerflor-cee.com/products/premium-acoustic-4047-indiana2-okuza-hd464047", sku: "hd464047" },
  { code: "4052", name: "INDIANA² CALERO", slug: "premium-acoustic-4052-indiana2-calero", href: "https://www.gerflor-cee.com/products/premium-acoustic-4052-indiana2-calero-hd464052", sku: "hd464052" },
  { code: "4053", name: "INDIANA² DIWARAN", slug: "premium-acoustic-4053-indiana2-diwaran", href: "https://www.gerflor-cee.com/products/premium-acoustic-4053-indiana2-diwaran-hd464053", sku: "hd464053" },
  { code: "4205", name: "NEOTERRA DORATA", slug: "premium-acoustic-4205-neoterra-dorata", href: "https://www.gerflor-cee.com/products/premium-acoustic-4205-neoterra-dorata-hd754205", sku: "hd754205" },
  { code: "4206", name: "NEOTERRA LAZULI", slug: "premium-acoustic-4206-neoterra-lazuli", href: "https://www.gerflor-cee.com/products/premium-acoustic-4206-neoterra-lazuli-hd754206", sku: "hd754206" },
  { code: "4343", name: "INDIANA² TOKELAU", slug: "premium-acoustic-4343-indiana2-tokelau", href: "https://www.gerflor-cee.com/products/premium-acoustic-4343-indiana2-tokelau-hd464343", sku: "hd464343" },
  { code: "4349", name: "OSMOZ ANGORA", slug: "premium-acoustic-4349-osmoz-angora", href: "https://www.gerflor-cee.com/products/premium-acoustic-4349-osmoz-angora-hd764349", sku: "hd764349" },
  { code: "4364", name: "OSMOZ IVORY NEW", slug: "premium-acoustic-4364-osmoz-ivory-new", href: "https://www.gerflor-cee.com/products/premium-acoustic-4364-osmoz-ivory-new-hd764364", sku: "hd764364" },
  { code: "4365", name: "OSMOZ ALPAGA NEW", slug: "premium-acoustic-4365-osmoz-alpaga-new", href: "https://www.gerflor-cee.com/products/premium-acoustic-4365-osmoz-alpaga-new-hd764365", sku: "hd764365" },
  { code: "4382", name: "OSMOZ CYCLADES", slug: "premium-acoustic-4382-osmoz-cyclades", href: "https://www.gerflor-cee.com/products/premium-acoustic-4382-osmoz-cyclades-hd764382", sku: "hd764382" },
  { code: "8226", name: "INDIANA² FIDJI", slug: "premium-acoustic-8226-indiana2-fidji", href: "https://www.gerflor-cee.com/products/premium-acoustic-8226-indiana2-fidji-hd468226", sku: "hd468226" },
  { code: "8386", name: "BRAZILIA BOA VISTA", slug: "premium-acoustic-8386-brazilia-boa-vista", href: "https://www.gerflor-cee.com/products/premium-acoustic-8386-brazilia-boa-vista-hd318386", sku: "hd318386" },
  { code: "8621", name: "POESY ODE", slug: "premium-acoustic-8621-poesy-ode", href: "https://www.gerflor-cee.com/products/premium-acoustic-8621-poesy-ode-hd568621", sku: "hd568621" },
  { code: "8626", name: "POESY RIME", slug: "premium-acoustic-8626-poesy-rime", href: "https://www.gerflor-cee.com/products/premium-acoustic-8626-poesy-rime-hd568626", sku: "hd568626" },
  { code: "8736", name: "BRAZILIA RECIFE", slug: "premium-acoustic-8736-brazilia-recife", href: "https://www.gerflor-cee.com/products/premium-acoustic-8736-brazilia-recife-hd318736", sku: "hd318736" }
];

// Load existing data
const existingData = JSON.parse(fs.readFileSync(colorsJsonPath, 'utf8'));
const premiumAcousticCollection = existingData.collections.find(c => c.slug === 'premium-acoustic');

if (!premiumAcousticCollection) {
  console.log('❌ Premium Acoustic collection not found in JSON');
  process.exit(1);
}

// Create a map of existing colors by code
const existingColorsMap = new Map();
premiumAcousticCollection.colors.forEach(color => {
  existingColorsMap.set(color.code, color);
});

// Add all colors (replace existing if any)
const updatedColors = allColors.map(color => ({
  code: color.code,
  name: color.name,
  slug: color.slug,
  href: color.href,
  sku: color.sku,
  collection_slug: 'premium-acoustic',
  collection_name: 'Premium Acoustic'
}));

// Sort by code
updatedColors.sort((a, b) => a.code.localeCompare(b.code));

premiumAcousticCollection.colors = updatedColors;
premiumAcousticCollection.colorCount = updatedColors.length;

// Update total colors
existingData.totalColors = existingData.collections.reduce((sum, col) => sum + (col.colorCount || col.colors.length || 0), 0);
existingData.generatedAt = new Date().toISOString();

// Save updated JSON
fs.writeFileSync(colorsJsonPath, JSON.stringify(existingData, null, 2));

console.log(`✅ Updated Premium Acoustic colors:`);
console.log(`   Total: ${premiumAcousticCollection.colors.length} colors`);
console.log(`\n💾 Saved to: ${colorsJsonPath}`);
