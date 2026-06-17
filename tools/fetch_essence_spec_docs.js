// Skida Essence tehničke listove (PDF) sa alpod.eu, vadi dimenzije, i upload-uje
// na našu Supabase (bucket product-documents, folder essence). Princip: sve kod nas.
//   node tools/fetch_essence_spec_docs.js [--dry-run]
const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');
const core = require('./lib/ingest-core.js');

const BASE = 'https://www.alpod.eu/wp-content/uploads/2025/03/';
const BUCKET = 'product-documents';
const DRY = process.argv.includes('--dry-run');

// pattern = naziv kao u konfiguratoru; wood = 'Hrast' | 'Orah' | 'Hrast i Orah'
const E = (file, pattern, wood) => ({ file, pattern, wood });
const ENTRIES = [
  // Rhombus (potvrđeno na alpodu)
  E('Rhombus_Diamond_Regular_EuropeanOak.pdf', 'Rhombus Diamond Regular', 'Hrast'),
  E('Rhombus_Diamond_Regular_AmericanWalnut.pdf', 'Rhombus Diamond Regular', 'Orah'),
  E('Rhombus_Diamond_Irregular_EuropeanOak.pdf', 'Rhombus Diamond Irregular', 'Hrast'),
  E('Rhombus_Diamond_Irregular_AmericanWalnut.pdf', 'Rhombus Diamond Irregular', 'Orah'),
  E('Rhombus_Chevron_Regular_EuropeanOak.pdf', 'Rhombus Chevron Regular', 'Hrast'),
  E('Rhombus_Chevron_Regular_AmericanWalnut.pdf', 'Rhombus Chevron Regular', 'Orah'),
  E('Rhombus_Chevron_Irregular_EuropeanOak.pdf', 'Rhombus Chevron Irregular', 'Hrast'),
  E('Rhombus_Chevron_Irregular_AmericanWalnut.pdf', 'Rhombus Chevron Irregular', 'Orah'),
  E('Rhombus_Cliff_Regular_EuropeanOak.pdf', 'Rhombus Cliff Regular', 'Hrast'),
  E('Rhombus_Cliff_Regular_AmericanWalnut.pdf', 'Rhombus Cliff Regular', 'Orah'),
  E('Rhombus_Cliff_Irregular_EuropeanOak.pdf', 'Rhombus Cliff Irregular', 'Hrast'),
  E('Rhombus_Cliff_Irregular_AmericanWalnut.pdf', 'Rhombus Cliff Irregular', 'Orah'),
  // Waves (potvrđeno)
  E('Waves_Ocean_and_Ocean_XXL_EuropeanOak.pdf', 'Waves Ocean', 'Hrast'),
  E('Waves_Sea_and_Sea_XXL_EuropeanOak.pdf', 'Waves Sea', 'Hrast'),
  E('Waves_Herringbone_EuropeanOak_and_AmericanWalnut.pdf', 'Waves Herringbone', 'Hrast i Orah'),
  // Forest (potvrđeno)
  E('Forest_Trees_EuropeanOak.pdf', 'Forest Trees', 'Hrast'),
  // KANDIDATI (pogađanje imena — skripta preskoči ako 404)
  E('Waves_Ocean_and_Ocean_XXL_AmericanWalnut.pdf', 'Waves Ocean', 'Orah'),
  E('Waves_Sea_and_Sea_XXL_AmericanWalnut.pdf', 'Waves Sea', 'Orah'),
  E('Forest_Trees_AmericanWalnut.pdf', 'Forest Trees', 'Orah'),
  E('Trapezium_Hive_Regular_EuropeanOak.pdf', 'Trapezium Hive Regular', 'Hrast'),
  E('Trapezium_Hive_Regular_AmericanWalnut.pdf', 'Trapezium Hive Regular', 'Orah'),
  E('Trapezium_Hive_Irregular_EuropeanOak.pdf', 'Trapezium Hive Irregular', 'Hrast'),
  E('Trapezium_Hive_Irregular_AmericanWalnut.pdf', 'Trapezium Hive Irregular', 'Orah'),
  E('Trapezium_Aloe_EuropeanOak.pdf', 'Trapezium Aloe', 'Hrast'),
  E('Trapezium_Aloe_AmericanWalnut.pdf', 'Trapezium Aloe', 'Orah'),
  E('Mosaic_Stellar_EuropeanOak.pdf', 'Mosaic Stellar', 'Hrast'),
  E('Mosaic_Stellar_AmericanWalnut.pdf', 'Mosaic Stellar', 'Orah'),
  E('Mosaic_Threads_EuropeanOak.pdf', 'Mosaic Threads', 'Hrast'),
  E('Mosaic_Threads_AmericanWalnut.pdf', 'Mosaic Threads', 'Orah'),
  E('Waves_Fish_Scale_EuropeanOak.pdf', 'Waves Fish Scale', 'Hrast'),
  E('Waves_Fish_Scale_AmericanWalnut.pdf', 'Waves Fish Scale', 'Orah'),
  E('Forest_Flowers_EuropeanOak.pdf', 'Forest Flowers', 'Hrast'),
  E('Forest_Flowers_AmericanWalnut.pdf', 'Forest Flowers', 'Orah'),
  E('Forest_Leafs_EuropeanOak.pdf', 'Forest Leaves', 'Hrast'),
  E('Forest_Leafs_AmericanWalnut.pdf', 'Forest Leaves', 'Orah'),
  E('Forest_Leaves_EuropeanOak.pdf', 'Forest Leaves', 'Hrast'),
  E('Forest_Branches_EuropeanOak.pdf', 'Forest Branches', 'Hrast'),
  E('Forest_Branches_AmericanWalnut.pdf', 'Forest Branches', 'Orah'),
];

function parseSpecs(text) {
  const t = text.replace(/\s+/g, ' ');
  const out = {};
  const size = t.match(/Size\s*([\d]+\/[\d]+)\s*x\s*([\d]+)\s*x\s*([\d]+)\s*mm/i);
  if (size) out.sizeText = `${size[1]} × ${size[2]} × ${size[3]} mm`;
  const grade = t.match(/Grade\s*([A-Za-z/ ]+?)\s*(?:Surface|Finish|Construction)/i);
  if (grade) out.grade = grade[1].trim().replace(/\s*\/\s*/g, ' / ');
  return out;
}

(async () => {
  console.log(`🎯 kandidata: ${ENTRIES.length}${DRY ? ' (DRY-RUN)' : ''}`);
  const supabase = DRY ? null : core.getSupabase();
  const results = [];
  let ok = 0, miss = 0;
  for (const e of ENTRIES) {
    const url = BASE + e.file;
    try {
      const buf = await core.downloadAsset(url);
      let specs = {};
      try { specs = parseSpecs((await pdf(buf)).text); } catch {}
      let pub = url;
      if (!DRY) pub = await core.uploadToBucket(supabase, BUCKET, `essence/${e.file}`, buf, { cacheBust: false });
      results.push({ pattern: e.pattern, wood: e.wood, file: e.file, url: pub, ...specs });
      ok++;
      console.log(`   ✅ ${e.file}  ${specs.sizeText || ''} ${specs.grade ? '['+specs.grade+']' : ''}`);
      await core.sleep(150);
    } catch (err) {
      miss++;
      if (!/HTTP 40[34]/.test(err.message)) console.log(`   ⚠️ ${e.file}: ${err.message}`);
    }
  }
  console.log(`\n✅ nađeno/skinuto: ${ok} | nema (404): ${miss}`);
  if (!DRY) {
    fs.mkdirSync(path.join(process.cwd(), 'output'), { recursive: true });
    fs.writeFileSync(path.join(process.cwd(), 'output', 'essence-spec-docs.json'), JSON.stringify(results, null, 2));
    console.log('💾 output/essence-spec-docs.json');
  }
})().catch((e) => { console.error('❌', e); process.exit(1); });
