// Migracija SVIH Tarkett www.tarkett.rs/sr_RS/pdf/ portal-dokumenata u Supabase (bez hotlinkova).
// Opšti (per-boja) — pokriva specifications (čist PDF) i format-table (PDF base64 u JSON stringu).
// Model po migrate_tarkett_hotlinks.js: extract → migrate (worker-pool + manifest) → rewriteString.
//   node tools/migrate_tarkett_portal_docs.js [--dry-run] [--file=ime.json]
const fs = require('fs');
const path = require('path');
const core = require('./lib/ingest-core.js');

const DATA_DIR = path.join(process.cwd(), 'public', 'data');
const DOCS_BUCKET = 'product-documents';
const DEST_PREFIX = 'products/tarkett-migrated';
// Bilo koji /sr_RS/pdf/.../(specifications|format-table) URL (proizvoljna dubina putanje).
const PORTAL_RE = /https?:\/\/www\.tarkett\.rs\/[^\s"']*?\/pdf\/([^\s"']*?\/(specifications|format-table))\b/gi;

const args = { dryRun: process.argv.includes('--dry-run'), files: [] };
for (const a of process.argv.slice(2)) if (a.startsWith('--file=')) args.files.push(a.split('=')[1]);

const TARGET_FILES = args.files.length ? args.files : [
    'tarkett_heterogeneous_vinyl_colors.json',
    'tarkett_homogeneous_vinyl_colors.json',
    'tarkett_vinyl_home_colors.json',
    'tarkett_lvt_products.json',
    'tarkett_sport_colors.json',
    'tarkett_documents_index.json',
    'tarkett_wood_collection_index.json',
];

function classify(url) {
    const kind = /\/format-table\b/i.test(url) ? 'format-table' : 'specifications';
    const m = url.match(/\/pdf\/(.+?)\/(specifications|format-table)\b/i);
    const stem = core.slugify(m ? m[1] : url).slice(0, 90);
    return { url, kind, dest: `${DEST_PREFIX}/portal-${stem}-${kind}.pdf` };
}

async function fetchPdf(url, kind) {
    const r = await core.withTimeout(fetch(url, { headers: core.BROWSER_HEADERS }), 60000, `fetch ${kind}`);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    let buf;
    if (kind === 'format-table') {
        const b64 = JSON.parse(await r.text());
        if (typeof b64 !== 'string') throw new Error('format-table nije base64 string');
        buf = Buffer.from(b64, 'base64');
    } else {
        buf = Buffer.from(await r.arrayBuffer());
    }
    if (!buf.slice(0, 5).toString().startsWith('%PDF')) throw new Error('nije PDF');
    return buf;
}

(async () => {
    // 1) Sakupi sve jedinstvene portal URL-ove iz ciljnih fajlova.
    const fileStrings = new Map();
    const all = new Set();
    for (const f of TARGET_FILES) {
        const p = path.join(DATA_DIR, f);
        if (!fs.existsSync(p)) continue;
        const s = fs.readFileSync(p, 'utf8');
        fileStrings.set(f, s);
        for (const m of s.matchAll(PORTAL_RE)) all.add(m[0]);
    }
    const urls = [...all];
    console.log(`🎯 jedinstvenih portal-PDF URL-ova: ${urls.length}${args.dryRun ? ' (DRY-RUN)' : ''}`);

    // 1b) Kolizijska provera dest putanja.
    const infos = urls.map(classify);
    const byDest = new Map();
    for (const i of infos) { const prev = byDest.get(i.dest); if (prev && prev !== i.url) throw new Error(`kolizija dest: ${i.dest}`); byDest.set(i.dest, i.url); }

    if (args.dryRun) {
        const spec = infos.filter((i) => i.kind === 'specifications').length;
        console.log(`   (dry-run: specifications ${spec}, format-table ${infos.length - spec})`);
        return;
    }

    // 2) Migriraj svaki jedinstveni asset (worker-pool + manifest, re-run safe).
    const manifest = core.loadManifest('migrate-tarkett-portal');
    const supabase = core.getSupabase();
    const urlMap = {};
    const pending = [];
    let idx = 0, ok = 0;
    // Niska konkurencija + politeness-delay + retry: tarkett.rs rate-limituje (vraća HTML throttle
    // stranicu) pod opterećenjem. 3 radnika, 200ms pauza, 4 pokušaja sa eksponencijalnim backoff-om.
    const CONC = 3;
    async function fetchWithRetry(info) {
        let lastErr;
        for (let attempt = 0; attempt < 4; attempt++) {
            if (attempt) await core.sleep(500 * Math.pow(3, attempt - 1)); // 500, 1500, 4500ms
            try { return await core.withTimeout(fetchPdf(info.url, info.kind), 120000, `asset ${info.kind}`); }
            catch (e) { lastErr = e; }
        }
        throw lastErr;
    }
    async function worker() {
        while (idx < infos.length) {
            const info = infos[idx++];
            const mKey = `portal:${info.url}`;
            if (manifest.has(mKey)) { urlMap[info.url] = manifest.get(mKey).publicUrl; ok++; continue; }
            try {
                const buf = await fetchWithRetry(info);
                const publicUrl = await core.uploadToBucket(supabase, DOCS_BUCKET, info.dest, buf);
                urlMap[info.url] = publicUrl;
                manifest.record(mKey, { publicUrl });
                if (++ok % 50 === 0) { manifest.save(); console.log(`   … ${ok}/${infos.length} (pending ${pending.length})`); }
            } catch (e) { pending.push({ url: info.url, reason: e.message }); }
            await core.sleep(200);
        }
    }
    await Promise.all(Array.from({ length: CONC }, () => worker()));
    manifest.save();
    console.log(`✅ migrirano: ${ok} | greške/pending: ${pending.length}`);

    // 3) Prepiši sve pojave u fajlovima.
    for (const f of TARGET_FILES) {
        const s = fileStrings.get(f);
        if (!s) continue;
        let out = s;
        for (const [from, to] of Object.entries(urlMap)) out = out.split(from).join(to);
        if (out !== s) core.writeJsonWithBackup(path.join(DATA_DIR, f), JSON.parse(out), `portal-${f.replace(/\.json$/, '')}`);
    }
    if (pending.length) {
        fs.writeFileSync(path.join(DATA_DIR, 'tarkett-portal-pending.json'), JSON.stringify(pending, null, 2));
        console.log(`📝 pending: ${pending.length} (tarkett-portal-pending.json)`);
    }
})().catch((e) => { console.error('❌', e); process.exit(1); });
