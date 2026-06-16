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

const args = { dryRun: process.argv.includes('--dry-run'), rewriteOnly: process.argv.includes('--rewrite-only'), files: [] };
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
    if (r.status === 404) { const e = new Error('HTTP 404'); e.notFound = true; throw e; } // genuino nema — ne blok
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
    let ok = 0, newOk = 0, consecFail = 0, aborted = false;
    // PRISTOJAN DRIP: tarkett.rs agresivno rate-limituje (HTML throttle „<div>Please…"). Jedan
    // tok, 1.2s pauza, 1 retry. CIRCUIT-BREAKER: posle 25 uzastopnih grešaka prekini ceo run
    // (blok je aktivan — probaj posle cooldown-a). Manifest čini re-run bezbednim (preskače gotove).
    const DELAY = 1200, BREAK_AFTER = 25;
    for (const info of infos) {
        const mKey = `portal:${info.url}`;
        if (manifest.has(mKey)) { urlMap[info.url] = manifest.get(mKey).publicUrl; ok++; continue; }
        if (args.rewriteOnly) continue; // bez mreže — nemanifestovani ostaju za kasniji cooldown-run
        let buf, err;
        for (let attempt = 0; attempt < 2 && !buf; attempt++) {
            if (attempt) await core.sleep(2000);
            try { buf = await core.withTimeout(fetchPdf(info.url, info.kind), 60000, `asset ${info.kind}`); }
            catch (e) { err = e; if (e.notFound) break; } // 404 = genuino nema, ne retry-uj
        }
        if (buf) {
            try {
                const publicUrl = await core.uploadToBucket(supabase, DOCS_BUCKET, info.dest, buf);
                urlMap[info.url] = publicUrl; manifest.record(mKey, { publicUrl });
                ok++; consecFail = 0;
                if (++newOk % 25 === 0) { manifest.save(); console.log(`   … +${newOk} novih (ukupno ${ok}/${infos.length}, pending ${pending.length})`); }
            } catch (e) { pending.push({ url: info.url, reason: e.message }); consecFail++; }
        } else {
            pending.push({ url: info.url, reason: err ? err.message : '?' });
            // 404 = server zdrav, samo nema dok → resetuj brojač; samo pravi throttle okida prekidač.
            if (err && err.notFound) consecFail = 0; else consecFail++;
        }
        if (consecFail >= BREAK_AFTER) { aborted = true; console.log(`🛑 prekid: ${consecFail} uzastopnih throttle grešaka (blok) — probaj posle cooldown-a`); break; }
        await core.sleep(DELAY);
    }
    if (aborted) console.log(`(prekinuto — migrirano ${newOk} novih ovog runa)`);
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
