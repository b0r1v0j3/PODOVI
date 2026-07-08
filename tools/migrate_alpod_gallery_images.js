// Migracija GALERIJSKIH slika Alpod boja (images[] nizovi) → naš Supabase.
// migrate_alpod_images.js je migrirao samo main+swatch polja; images[] galerije
// (do 12 slika po boji, uklj. ambijentalne) su ostale na www.alpod.rs pa ih
// isFirstPartyImageUrl filter danas odseca iz prikaza. Posle ovog prolaza
// galerije se automatski pojavljuju (URL-ovi u JSON-u postaju first-party).
//   node tools/migrate_alpod_gallery_images.js [--dry-run] [--collection=<slug>]
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
const onlyCollection = (process.argv.find((a) => a.startsWith('--collection=')) || '').split('=')[1] || null;
const isAlpod = (u) => typeof u === 'string' && /^https?:\/\/www\.alpod\.rs\/.*\.(?:jpg|jpeg|png|webp)/i.test(u);

function collectGalleryUrls(d) {
    const urls = new Set();
    for (const c of d.collections) {
        if (onlyCollection && c.slug !== onlyCollection) continue;
        for (const col of (c.colors || [])) {
            for (const img of (col.images || [])) {
                if (isAlpod(img?.url)) urls.add(img.url);
            }
        }
    }
    return [...urls];
}

// Isti dest šablon kao migrate_alpod_images.js — manifest ključevi su odvojeni po URL-u.
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
    if (meta.format !== 'jpeg') buf = await sharp(buf).jpeg({ quality: 90 }).toBuffer();
    const publicUrl = await core.uploadToBucket(supabase, IMAGES_BUCKET, destPath(url), buf);
    manifest.record(mKey, { publicUrl });
    return publicUrl;
}

(async () => {
    const s = fs.readFileSync(DATA, 'utf8');
    const urls = collectGalleryUrls(JSON.parse(s));
    console.log(`🎯 alpod galerijskih slika za migraciju: ${urls.length}${onlyCollection ? ` (samo ${onlyCollection})` : ''}${DRY ? ' (DRY-RUN)' : ''}`);
    if (DRY) { console.log('   primeri dest:', urls.slice(0, 3).map(destPath)); return; }

    const manifest = core.loadManifest('migrate-alpod');
    const supabase = core.getSupabase();
    const urlMap = {};
    let ok = 0, newOk = 0, fail = 0, consec = 0, aborted = false, idx = 0;
    const DELAY = 200, BREAK_AFTER = 25, CONC = 5;

    async function worker() {
        while (idx < urls.length && !aborted) {
            const url = urls[idx++];
            const cached = manifest.has(`alpod:${url}`);
            try {
                const pub = await core.withTimeout(migrateImage(supabase, manifest, url), 90000, 'asset');
                urlMap[url] = pub; ok++; consec = 0;
                if (!cached && ++newOk % 50 === 0) { manifest.save(); console.log(`   … +${newOk} novih (ukupno ${ok}/${urls.length}, greške ${fail})`); }
            } catch (e) {
                fail++;
                // HTTP 404 = trajno mrtva slika na alpod strani (stare galerije) — ne broji se
                // u circuit breaker (on čuva od rate-limita/pada, ne od mrtvih URL-ova).
                const isDead = /HTTP 404/.test(e.message);
                if (!isDead) consec++;
                console.log(`   ⚠️ ${url.replace(/^https?:\/\/www\.alpod\.rs\/wp-content\/uploads\//, '')}: ${e.message}`);
                if (consec >= BREAK_AFTER) { aborted = true; console.log(`🛑 prekid: ${consec} uzastopnih grešaka — cooldown pa re-run`); }
            }
            if (!cached) await core.sleep(DELAY);
        }
    }
    await Promise.all(Array.from({ length: CONC }, () => worker()));
    manifest.save();
    console.log(`✅ migrirano: ${ok} | greške: ${fail}${aborted ? ' (PREKINUTO)' : ''}`);

    let out = s;
    for (const [from, to] of Object.entries(urlMap)) out = out.split(from).join(to);
    if (out !== s) { core.writeJsonWithBackup(DATA, JSON.parse(out), 'alpod-gallery'); console.log('💾 alpod_floor_collections.json ažuriran'); }
})().catch((e) => { console.error('❌', e); process.exit(1); });
