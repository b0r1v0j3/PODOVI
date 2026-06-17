// Skida SVE Essence konfigurator slike (alpod.rs) → naša Supabase (product-images),
// pa prepiše URL-ove u lib/data/essence-configurator-axes.ts. Princip projekta:
// preuzimamo sve u našu bazu, bez hotlinkova.
//   node tools/migrate_essence_configurator_images.js [--dry-run]
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const sharp = require('sharp');
const core = require('./lib/ingest-core.js');

const AXES = path.join(process.cwd(), 'lib', 'data', 'essence-configurator-axes.ts');
const BUCKET = 'product-images';
const DEST_PREFIX = 'products/alpod-migrated/essence';
const DRY = process.argv.includes('--dry-run');

function destPath(url) {
  const m = url.match(/uploads\/(.+)\.(?:jpg|jpeg|png|webp)/i);
  const stem = core.slugify((m ? m[1] : url).replace(/\//g, '-')).slice(0, 80);
  const hash = crypto.createHash('md5').update(url).digest('hex').slice(0, 6);
  return `${DEST_PREFIX}/${stem}-${hash}.jpg`;
}

(async () => {
  const src = fs.readFileSync(AXES, 'utf8');

  // Baze (const C/G/S = 'https://www.alpod.rs/...')
  const baseMap = {};
  for (const m of src.matchAll(/const\s+([CGS])\s*=\s*'([^']+)'/g)) baseMap[m[1]] = m[2];

  // Template literali `${C|G|S}filename` (i u osama i u mapi uzoraka)
  const seen = new Set();
  const items = [];
  for (const m of src.matchAll(/`\$\{([CGS])\}([^`]+)`/g)) {
    const full = baseMap[m[1]] + m[2];
    if (seen.has(full)) continue;
    seen.add(full);
    items.push({ full, tplSrc: m[0] });
  }

  console.log(`🎯 Essence slika za migraciju: ${items.length}${DRY ? ' (DRY-RUN)' : ''}`);
  if (DRY) {
    items.slice(0, 6).forEach((i) => console.log('   ', i.full.replace(/^https?:\/\/www\.alpod\.rs\/wp-content\/uploads\//, ''), '→', destPath(i.full)));
    console.log(`   … (+${Math.max(0, items.length - 6)} više)`);
    return;
  }

  const supabase = core.getSupabase();
  const replacements = [];
  let ok = 0, fail = 0;
  for (const it of items) {
    try {
      let buf = await core.downloadAsset(it.full);
      const meta = await core.withTimeout(sharp(buf).metadata(), 20000, `sharp ${it.full}`);
      if (meta.format !== 'jpeg') buf = await sharp(buf).jpeg({ quality: 90 }).toBuffer();
      const pub = await core.withTimeout(core.uploadToBucket(supabase, BUCKET, destPath(it.full), buf), 90000, 'upload');
      replacements.push({ tplSrc: it.tplSrc, pub });
      ok++;
      if (ok % 10 === 0) console.log(`   … ${ok}/${items.length}`);
      await core.sleep(200);
    } catch (e) {
      fail++;
      console.log(`   ⚠️ ${it.full.replace(/^https?:\/\/www\.alpod\.rs\/wp-content\/uploads\//, '')}: ${e.message}`);
    }
  }
  console.log(`✅ migrirano: ${ok} | greške: ${fail}`);
  if (fail > 0) { console.log('🛑 ima grešaka — fajl NIJE menjan, sredi pa pokreni ponovo'); process.exit(1); }

  // Prepiši template literale punim Supabase URL-ovima i ukloni sad neiskorišćene baze.
  let out = src;
  for (const r of replacements) out = out.split(r.tplSrc).join(`'${r.pub}'`);
  out = out.replace(/^const [CGS] = '[^']+';\n/gm, '');
  out = out.replace(/Slike hotlink sa alpod\.rs[^\n]*\n/, 'Sve slike su migrirane na našu Supabase (product-images/products/alpod-migrated/essence).\n');

  if (out !== src) { fs.writeFileSync(AXES, out); console.log('💾 essence-configurator-axes.ts ažuriran (Supabase URL-ovi)'); }
})().catch((e) => { console.error('❌', e); process.exit(1); });
