// Migracija svih Alpod slika (www.alpod.rs) → naša Supabase (product-images bucket).
// Princip projekta: preuzimamo SVE u našu bazu, bez hotlinkova.
//   node tools/migrate_alpod_images.js [--dry-run]
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const sharp = require('sharp');
const core = require('./lib/ingest-core.js');

const DATA = path.join(process.cwd(), 'public', 'data', 'alpod_floor_collections.json');
const IMAGES_BUCKET = 'product-images';
const DEST_PREFIX = 'products/alpod-migrated';
const MIN_W = 200;
const DRY = process.argv.includes('--dry-run');
const isAlpod = (u) => typeof u === 'string' && /^https?:\/\/www\.alpod\.rs\/.*\.(?:jpg|jpeg|png|webp)/i.test(u);

// Sakupi SAMO renderovane slike (main + swatch polja), ne responsive/galerijske varijante.
function collectRenderedUrls(d) {
    const urls = new Set();
    for (const c of d.collections) {
        for (const f of [c.collection_image_url, c.image, c.image_url]) if (isAlpod(f)) urls.add(f);
        for (const col of (c.colors || [])) for (const f of [col.image, col.image_url]) if (isAlpod(f)) urls.add(f);
    }
    return [...urls];
}

// Jedinstven stem iz putanje + kratak hash URL-a (razlikuje "-1" vs "_1" koje slugify spaja).
function destPath(url) {
    const m = url.match(/uploads\/(.+)\.(?:jpg|jpeg|png|webp)/i);
    const stem = core.slugify((m ? m[1] : url).replace(/\//g, '-')).slice(0, 80);
    const hash = crypto.createHash('md5').update(url).digest('hex').slice(0, 6);
    return `${DEST_PREFIX}/${stem}-${hash}.jpg`;
}

async function migrateImage(supabase, manifest, url) {
    const mKey = `alpod:${url}`;
    if (manifest.has(mKey)) return manifest.get(mKey).publicUrl;
    let buf = await core.downloadAsset(url);
    const meta = await core.withTimeout(sharp(buf).metadata(), 20000, `sharp ${url}`);
    if (!meta.width || meta.width < MIN_W) throw new Error(`${meta.width || '?'}px < ${MIN_W}`);
    if (meta.format !== 'jpeg') buf = await sharp(buf).jpeg({ quality: 90 }).toBuffer(); // webp/png → jpg
    const publicUrl = await core.uploadToBucket(supabase, IMAGES_BUCKET, destPath(url), buf);
    manifest.record(mKey, { publicUrl });
    return publicUrl;
}

(async () => {
    const s = fs.readFileSync(DATA, 'utf8');
    const urls = collectRenderedUrls(JSON.parse(s));
    console.log(`🎯 alpod renderovanih slika: ${urls.length}${DRY ? ' (DRY-RUN)' : ''}`);

    // Kolizijska provera dest putanja.
    const byDest = new Map();
    for (const u of urls) {
        const dp = destPath(u);
        const prev = byDest.get(dp);
        if (prev && prev !== u) throw new Error(`kolizija dest ${dp}: "${prev}" vs "${u}"`);
        byDest.set(dp, u);
    }
    if (DRY) { console.log('   primeri dest:', urls.slice(0, 3).map(destPath)); return; }

    const manifest = core.loadManifest('migrate-alpod');
    const supabase = core.getSupabase();
    const urlMap = {};
    let ok = 0, newOk = 0, fail = 0, consec = 0, aborted = false, idx = 0;
    // alpod.rs nepoznat rate-limit → umeren CONC + pauza + circuit-breaker (kao Tarkett lekcija).
    const DELAY = 200, BREAK_AFTER = 25, CONC = 5;

    async function worker() {
        while (idx < urls.length && !aborted) {
            const url = urls[idx++];
            const cached = manifest.has(`alpod:${url}`);
            try {
                const pub = await core.withTimeout(migrateImage(supabase, manifest, url), 90000, `asset`);
                urlMap[url] = pub; ok++; consec = 0;
                if (!cached && ++newOk % 25 === 0) { manifest.save(); console.log(`   … +${newOk} novih (ukupno ${ok}/${urls.length}, greške ${fail})`); }
            } catch (e) {
                fail++; consec++;
                console.log(`   ⚠️ ${url.replace(/^https?:\/\/www\.alpod\.rs\/wp-content\/uploads\//, '')}: ${e.message}`);
                if (consec >= BREAK_AFTER) { aborted = true; console.log(`🛑 prekid: ${consec} uzastopnih grešaka — cooldown pa re-run`); }
            }
            if (!cached) await core.sleep(DELAY);
        }
    }
    await Promise.all(Array.from({ length: CONC }, () => worker()));
    manifest.save();
    console.log(`✅ migrirano: ${ok} | greške: ${fail}${aborted ? ' (PREKINUTO)' : ''}`);

    // Prepiši sve pojave (manifest-pogoci + novi). Re-run safe.
    let out = s;
    for (const [from, to] of Object.entries(urlMap)) out = out.split(from).join(to);
    if (out !== s) { core.writeJsonWithBackup(DATA, JSON.parse(out), 'alpod-images'); console.log('💾 alpod_floor_collections.json ažuriran'); }
})().catch((e) => { console.error('❌', e); process.exit(1); });
