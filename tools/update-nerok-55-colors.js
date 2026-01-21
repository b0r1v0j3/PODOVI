const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const colorsJsonPath = path.join(rootDir, 'public', 'data', 'gerflor_linoleum_colors_complete.json');

// All 36 colors from the website
const allColors = [
  { code: "0476", name: "NOMA MIEL", slug: "nerok-55-0476-noma-miel", href: "https://www.gerflor-cee.com/products/nerok-55-0476-noma-miel-28130476", sku: "28130476" },
  { code: "0492", name: "TIMBER CABANA", slug: "nerok-55-0492-timber-cabana", href: "https://www.gerflor-cee.com/products/nerok-55-0492-timber-cabana-28130492", sku: "28130492" },
  { code: "0597", name: "PIXEL SILVER", slug: "nerok-55-0597-pixel-silver", href: "https://www.gerflor-cee.com/products/nerok-55-0597-pixel-silver-28130597", sku: "28130597" },
  { code: "0621", name: "PIXEL VANILLA", slug: "nerok-55-0621-pixel-vanilla", href: "https://www.gerflor-cee.com/products/nerok-55-0621-pixel-vanilla-28130621", sku: "28130621" },
  { code: "0632", name: "PIXEL ANTHRACITE", slug: "nerok-55-0632-pixel-anthracite", href: "https://www.gerflor-cee.com/products/nerok-55-0632-pixel-anthracite-28130632", sku: "28130632" },
  { code: "0639", name: "PIXEL SAND", slug: "nerok-55-0639-pixel-sand", href: "https://www.gerflor-cee.com/products/nerok-55-0639-pixel-sand-28130639", sku: "28130639" },
  { code: "0669", name: "CHENE LIGHT", slug: "nerok-55-0669-chene-light", href: "https://www.gerflor-cee.com/products/nerok-55-0669-chene-light-28130669", sku: "28130669" },
  { code: "0720", name: "TIMBER CLEAR", slug: "nerok-55-0720-timber-clear", href: "https://www.gerflor-cee.com/products/nerok-55-0720-timber-clear-28130720", sku: "28130720" },
  { code: "1430", name: "OAK SELECT DARK GREY", slug: "nerok-55-1430-oak-select-dark-grey", href: "https://www.gerflor-cee.com/products/nerok-55-1430-oak-select-dark-grey-28131430", sku: "28131430" },
  { code: "1451", name: "NOMA KOLA", slug: "nerok-55-1451-noma-kola", href: "https://www.gerflor-cee.com/products/nerok-55-1451-noma-kola-28131451", sku: "28131451" },
  { code: "1518", name: "FACTORY WHITE", slug: "nerok-55-1518-factory-white", href: "https://www.gerflor-cee.com/products/nerok-55-1518-factory-white-28131518", sku: "28131518" },
  { code: "1751", name: "TIMBER GREY", slug: "nerok-55-1751-timber-grey", href: "https://www.gerflor-cee.com/products/nerok-55-1751-timber-grey-28131751", sku: "28131751" },
  { code: "1893", name: "HARBOR BLUE", slug: "nerok-55-1893-harbor-blue", href: "https://www.gerflor-cee.com/products/nerok-55-1893-harbor-blue-28131893", sku: "28131893" },
  { code: "2012", name: "SHERWOOD CLEAR", slug: "nerok-55-2012-sherwood-clear", href: "https://www.gerflor-cee.com/products/nerok-55-2012-sherwood-clear-28132012", sku: "28132012" },
  { code: "2013", name: "SHERWOOD BLOND", slug: "nerok-55-2013-sherwood-blond", href: "https://www.gerflor-cee.com/products/nerok-55-2013-sherwood-blond-28132013", sku: "28132013" },
  { code: "2015", name: "SHERWOOD BROWN", slug: "nerok-55-2015-sherwood-brown", href: "https://www.gerflor-cee.com/products/nerok-55-2015-sherwood-brown-28132015", sku: "28132015" },
  { code: "2017", name: "SHERWOOD GREY", slug: "nerok-55-2017-sherwood-grey", href: "https://www.gerflor-cee.com/products/nerok-55-2017-sherwood-grey-28132017", sku: "28132017" },
  { code: "2131", name: "LEONE MOUSE", slug: "nerok-55-2131-leone-mouse", href: "https://www.gerflor-cee.com/products/nerok-55-2131-leone-mouse-28132131", sku: "28132131" },
  { code: "2132", name: "LEONE METAL", slug: "nerok-55-2132-leone-metal", href: "https://www.gerflor-cee.com/products/nerok-55-2132-leone-metal-28132132", sku: "28132132" },
  { code: "2133", name: "LEONE ANTHRACITE", slug: "nerok-55-2133-leone-anthracite", href: "https://www.gerflor-cee.com/products/nerok-55-2133-leone-anthracite-28132133", sku: "28132133" },
  { code: "2134", name: "LEONE BROWN", slug: "nerok-55-2134-leone-brown", href: "https://www.gerflor-cee.com/products/nerok-55-2134-leone-brown-28132134", sku: "28132134" },
  { code: "2135", name: "LEONE CREAM", slug: "nerok-55-2135-leone-cream", href: "https://www.gerflor-cee.com/products/nerok-55-2135-leone-cream-28132135", sku: "28132135" },
  { code: "2151", name: "SHADE LIGHT GREY", slug: "nerok-55-2151-shade-light-grey", href: "https://www.gerflor-cee.com/products/nerok-55-2151-shade-light-grey-28132151", sku: "28132151" },
  { code: "2152", name: "SHADE GREY", slug: "nerok-55-2152-shade-grey", href: "https://www.gerflor-cee.com/products/nerok-55-2152-shade-grey-28132152", sku: "28132152" },
  { code: "2153", name: "SHADE ANTHRACITE", slug: "nerok-55-2153-shade-anthracite", href: "https://www.gerflor-cee.com/products/nerok-55-2153-shade-anthracite-28132153", sku: "28132153" },
  { code: "2175", name: "PIXEL CLEAR", slug: "nerok-55-2175-pixel-clear", href: "https://www.gerflor-cee.com/products/nerok-55-2175-pixel-clear-28132175", sku: "28132175" },
  { code: "2176", name: "PIXEL TAUPE", slug: "nerok-55-2176-pixel-taupe", href: "https://www.gerflor-cee.com/products/nerok-55-2176-pixel-taupe-28132176", sku: "28132176" },
  { code: "2178", name: "PIXEL PAPRIKA", slug: "nerok-55-2178-pixel-paprika", href: "https://www.gerflor-cee.com/products/nerok-55-2178-pixel-paprika-28132178", sku: "28132178" },
  { code: "2179", name: "PIXEL BLACK", slug: "nerok-55-2179-pixel-black", href: "https://www.gerflor-cee.com/products/nerok-55-2179-pixel-black-28132179", sku: "28132179" },
  { code: "2181", name: "PIXEL MEADOW", slug: "nerok-55-2181-pixel-meadow", href: "https://www.gerflor-cee.com/products/nerok-55-2181-pixel-meadow-28132181", sku: "28132181" },
  { code: "2182", name: "PIXEL OCEAN", slug: "nerok-55-2182-pixel-ocean", href: "https://www.gerflor-cee.com/products/nerok-55-2182-pixel-ocean-28132182", sku: "28132182" },
  { code: "2242", name: "OAK SELECT COUNTRY", slug: "nerok-55-2242-oak-select-country", href: "https://www.gerflor-cee.com/products/nerok-55-2242-oak-select-country-28132242", sku: "28132242" },
  { code: "2244", name: "NEWPORT CLEAR", slug: "nerok-55-2244-newport-clear", href: "https://www.gerflor-cee.com/products/nerok-55-2244-newport-clear-28132244", sku: "28132244" },
  { code: "2245", name: "NEWPORT NATURAL", slug: "nerok-55-2245-newport-natural", href: "https://www.gerflor-cee.com/products/nerok-55-2245-newport-natural-28132245", sku: "28132245" },
  { code: "2249", name: "BROOKLYN BLUE", slug: "nerok-55-2249-brooklyn-blue", href: "https://www.gerflor-cee.com/products/nerok-55-2249-brooklyn-blue-28132249", sku: "28132249" },
  { code: "2253", name: "BROOKLYN SILVER", slug: "nerok-55-2253-brooklyn-silver", href: "https://www.gerflor-cee.com/products/nerok-55-2253-brooklyn-silver-28132253", sku: "28132253" }
];

// Load existing data
const existingData = JSON.parse(fs.readFileSync(colorsJsonPath, 'utf8'));
const nerok55Collection = existingData.collections.find(c => c.slug === 'nerok-55');

if (!nerok55Collection) {
  console.log('❌ Nerok 55 collection not found in JSON');
  process.exit(1);
}

// Create a map of existing colors by code
const existingColorsMap = new Map();
nerok55Collection.colors.forEach(color => {
  existingColorsMap.set(color.code, color);
});

// Add missing colors
const newColors = [];
allColors.forEach(color => {
  if (!existingColorsMap.has(color.code)) {
    newColors.push({
      code: color.code,
      name: color.name,
      slug: color.slug,
      href: color.href,
      sku: color.sku,
      collection_slug: 'nerok-55',
      collection_name: 'Nerok 55'
    });
  }
});

// Update collection with all colors (merge existing and new)
const updatedColors = [...nerok55Collection.colors];
newColors.forEach(color => {
  updatedColors.push(color);
});

// Sort by code
updatedColors.sort((a, b) => a.code.localeCompare(b.code));

nerok55Collection.colors = updatedColors;
nerok55Collection.colorCount = updatedColors.length;

// Update total colors
existingData.totalColors = existingData.collections.reduce((sum, col) => sum + (col.colorCount || col.colors.length || 0), 0);
existingData.generatedAt = new Date().toISOString();

// Save updated JSON
fs.writeFileSync(colorsJsonPath, JSON.stringify(existingData, null, 2));

console.log(`✅ Updated Nerok 55 colors:`);
console.log(`   Existing: ${nerok55Collection.colors.length - newColors.length}`);
console.log(`   New: ${newColors.length}`);
console.log(`   Total: ${nerok55Collection.colors.length} colors\n`);

if (newColors.length > 0) {
  console.log('🆕 New colors added:');
  newColors.forEach(c => console.log(`   - ${c.code} ${c.name}`));
}

console.log(`\n💾 Saved to: ${colorsJsonPath}`);
