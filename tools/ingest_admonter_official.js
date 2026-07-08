// Migracija zvaničnog Admonter materijala (admonter.com / shop.admonter.com) → naš Supabase.
// Izvor istine: public/data/admonter_official_media.json (texture_sources/roomshot_sources/documents[].source).
// Skripta popunjava texture_urls/roomshot_urls/collection_image_url/documents[].url našim javnim URL-ovima.
// Princip projekta: preuzimamo SVE u našu bazu, bez hotlinkova (vlasnik 08.07.2026: javno dostupan
// marketinški materijal proizvođača — preuzimamo slobodno sa sajta).
//   node tools/ingest_admonter_official.js [--dry-run]
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const sharp = require('sharp');
const core = require('./lib/ingest-core.js');

const DATA = path.join(process.cwd(), 'public', 'data', 'admonter_official_media.json');
const IMAGES_BUCKET = 'product-images';
const DOCS_BUCKET = 'product-documents';
const IMG_PREFIX = 'products/admonter-official';
const DOC_PREFIX = 'admonter';
const MIN_W = 400;
const DRY = process.argv.includes('--dry-run');

function destName(url, ext) {
    const m = url.match(/uploads\/(?:sites\/\d+\/)?(.+)\.(?:jpg|jpeg|png|webp|pdf)/i);
    const stem = core.slugify((m ? m[1] : url).replace(/\//g, '-')).slice(0, 80);
    const hash = crypto.createHash('md5').update(url).digest('hex').slice(0, 6);
    return `${stem}-${hash}.${ext}`;
}

async function migrateImage(supabase, manifest, url) {
    const mKey = `admonter:${url}`;
    if (manifest.has(mKey)) return manifest.get(mKey).publicUrl;
    let buf = await core.downloadAsset(url);
    const meta = await core.withTimeout(sharp(buf).metadata(), 20000, `sharp ${url}`);
    if (!meta.width || meta.width < MIN_W) throw new Error(`${meta.width || '?'}px < ${MIN_W}`);
    if (meta.format !== 'jpeg') buf = await sharp(buf).jpeg({ quality: 90 }).toBuffer();
    const publicUrl = await core.uploadToBucket(supabase, IMAGES_BUCKET, `${IMG_PREFIX}/${destName(url, 'jpg')}`, buf);
    manifest.record(mKey, { publicUrl });
    return publicUrl;
}

async function migratePdf(supabase, manifest, url) {
    const mKey = `admonter-doc:${url}`;
    if (manifest.has(mKey)) return manifest.get(mKey).publicUrl;
    const buf = await core.downloadAsset(url);
    if (buf.slice(0, 5).toString() !== '%PDF-') throw new Error('nije PDF');
    const publicUrl = await core.uploadToBucket(supabase, DOCS_BUCKET, `${DOC_PREFIX}/${destName(url, 'pdf')}`, buf, { cacheBust: false, timeoutMs: 120000 });
    manifest.record(mKey, { publicUrl });
    return publicUrl;
}

(async () => {
    const raw = fs.readFileSync(DATA, 'utf8');
    const data = JSON.parse(raw);

    const imageJobs = [];
    const c = data.collection;
    if (c.collection_image_source) imageJobs.push({ kind: 'collection', url: c.collection_image_source });
    for (const url of c.collection_gallery_sources || []) imageJobs.push({ kind: 'gallery', url });
    for (const [sku, d] of Object.entries(data.decors)) {
        for (const url of d.texture_sources || []) imageJobs.push({ kind: 'texture', sku, url });
        for (const url of d.roomshot_sources || []) imageJobs.push({ kind: 'roomshot', sku, url });
    }
    const pdfJobs = (c.documents || []).filter((doc) => doc.source);

    console.log(`🎯 admonter zvanični materijal: ${imageJobs.length} slika + ${pdfJobs.length} PDF${DRY ? ' (DRY-RUN)' : ''}`);
    if (DRY) { console.log('   primeri:', imageJobs.slice(0, 3).map((j) => destName(j.url, 'jpg'))); return; }

    const manifest = core.loadManifest('ingest-admonter-official');
    const supabase = core.getSupabase();
    let ok = 0, fail = 0;

    for (const job of imageJobs) {
        try {
            const pub = await core.withTimeout(migrateImage(supabase, manifest, job.url), 90000, 'asset');
            if (job.kind === 'collection') {
                c.collection_image_url = pub;
            } else if (job.kind === 'gallery') {
                c.collection_gallery_urls = c.collection_gallery_urls || [];
                if (!c.collection_gallery_urls.includes(pub)) c.collection_gallery_urls.push(pub);
            } else {
                const field = job.kind === 'texture' ? 'texture_urls' : 'roomshot_urls';
                const list = data.decors[job.sku][field];
                if (!list.includes(pub)) list.push(pub);
            }
            ok++;
            await core.sleep(150);
        } catch (e) {
            fail++;
            console.log(`   ⚠️ ${job.kind} ${job.url}: ${e.message}`);
        }
    }

    for (const doc of pdfJobs) {
        try {
            doc.url = await core.withTimeout(migratePdf(supabase, manifest, doc.source), 120000, 'pdf');
            ok++;
            await core.sleep(150);
        } catch (e) {
            fail++;
            console.log(`   ⚠️ pdf ${doc.source}: ${e.message}`);
        }
    }

    manifest.save();
    core.writeJsonWithBackup(DATA, data, 'admonter-official');
    console.log(`✅ migrirano: ${ok} | greške: ${fail} — admonter_official_media.json ažuriran`);
})().catch((e) => { console.error('❌', e); process.exit(1); });
