// Ukloni 7 trajno-mrtvih (403) media.tarkett-image.com referenci (vlasnik odobrio 2026-06-16).
// Dok-objekti {title,url} i string-URL-ovi u nizovima se brišu; skalarna slika boje (Srento)
// se vraća na Supabase kolekcijsku sliku (da boja ima fallback, ne prazno). Pending lista se prazni.
const fs = require('fs');
const path = require('path');
const core = require('./lib/ingest-core.js');

const DATA_DIR = path.join(process.cwd(), 'public', 'data');
const PENDING_PATH = path.join(DATA_DIR, 'tarkett-migration-pending.json');
const TARGET_FILES = [
    'tarkett_lvt_products.json',
    'tarkett_homogeneous_vinyl_colors.json',
    'tarkett_vinyl_home_colors.json',
    'tarkett_heterogeneous_vinyl_colors.json',
    'tarkett_sport_colors.json',
    'tarkett_documents_index.json',
    'tarkett_wood_collection_index.json',
    'tarkett_lajsne_variants.json',
];

const pending = fs.existsSync(PENDING_PATH) ? JSON.parse(fs.readFileSync(PENDING_PATH, 'utf8')) : [];
const dead = new Set(pending.map((x) => x.url));
const isImg = (u) => /\.(jpe?g|png|webp)$/i.test(u);

let removedDocs = 0;
let fallbackImgs = 0;

// 1) Skalarna slika boje → fallback na kolekcijsku Supabase sliku (pre brisanja nizova).
function fixScalarImages(node, collectionImg) {
    if (Array.isArray(node)) { for (const el of node) fixScalarImages(el, collectionImg); return; }
    if (!node || typeof node !== 'object') return;
    const myImg = typeof node.collection_image_url === 'string' ? node.collection_image_url : collectionImg;
    for (const k of Object.keys(node)) {
        const v = node[k];
        if (typeof v === 'string' && dead.has(v) && isImg(v)) {
            if (myImg && !dead.has(myImg)) { node[k] = myImg; fallbackImgs++; }
        } else if (v && typeof v === 'object') {
            fixScalarImages(v, myImg);
        }
    }
}

// 2) Ukloni mrtve string-URL-ove i {url} objekte iz nizova.
function clean(node) {
    if (Array.isArray(node)) {
        const kept = [];
        for (const el of node) {
            if (typeof el === 'string' && dead.has(el)) { removedDocs++; continue; }
            if (el && typeof el === 'object' && !Array.isArray(el) && typeof el.url === 'string' && dead.has(el.url)) { removedDocs++; continue; }
            kept.push(clean(el));
        }
        return kept;
    }
    if (node && typeof node === 'object') { for (const k of Object.keys(node)) node[k] = clean(node[k]); return node; }
    return node;
}

console.log(`🧹 mrtvih (403) referenci za uklanjanje: ${dead.size}`);
let total = 0;
for (const f of TARGET_FILES) {
    const p = path.join(DATA_DIR, f);
    if (!fs.existsSync(p)) continue;
    const data = JSON.parse(fs.readFileSync(p, 'utf8'));
    removedDocs = 0; fallbackImgs = 0;
    fixScalarImages(data, null);
    const cleaned = clean(data);
    if (removedDocs > 0 || fallbackImgs > 0) {
        core.writeJsonWithBackup(p, cleaned, `remove-403-${f.replace(/\.json$/, '')}`);
        console.log(`   ${f}: uklonjeno ${removedDocs} dok | slika→fallback ${fallbackImgs}`);
        total += removedDocs + fallbackImgs;
    }
}
fs.writeFileSync(PENDING_PATH, JSON.stringify([], null, 2));
console.log(`✅ ukupno izmena: ${total} | pending sada: 0`);
