# Faza 2 — S4: Migracija Tarkett hotlinkova u Supabase — Implementacioni plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (preporučeno) ili superpowers:executing-plans. Koraci koriste checkbox (`- [ ]`) sintaksu.

**Goal:** Premestiti sve postojeće Tarkett hotlinkove (`media.tarkett-image.com`, 2.844 jedinstvena asseta / 16.835 pojava) iz `public/data/*.json` u našu Supabase bazu, uz upgrade slika na XXL (1920px), bez izmena loadera.

**Architecture:** Čiste funkcije (`tools/lib/hotlink-migrate.js`: klasifikacija URL-a, XXL transformacija, ekstrakcija, prepis-po-mapi) testirane TDD-om; orkestrator (`tools/migrate_tarkett_hotlinks.js`) reuse-uje `ingest-core` (download/upload/manifest/backup/withTimeout) — dedupe-uje, preuzme svaki asset jednom (slika: XXL pa fallback /large/; PDF: /docs/), uploaduje u `product-images|documents/products/tarkett-migrated/`, pa prepiše SVE pojave u JSON-u preko `origUrl→supabaseUrl` mape. Predimenzionirani PDF-ovi (>50 MiB) → `pending` lista (ostaju hotlink dok vlasnik ne digne limit).

**Tech Stack:** Node 24 (global fetch), sharp ^0.34.5, Supabase JS ^2.95.3, Vitest ^3.2.4. Supabase **Pro** (100GB storage). Bez novih zavisnosti.

---

## Dokazi (provereno 2026-06-13)

- **2.844 jedinstvena asseta** (1.582 slike + 1.250 PDF) / 16.835 pojava; po fajlu: lvt 13.723, homogeni vinil 945, vinyl home 886, heterogeni 578, sport 452, documents 130, wood 116, lajsne 5.
- **XXL postoji za stare slike**: `/large/IN-LVT-Floor-iD-TILT-...jpg` 200 0.17MB; ista `/XXL/...` 200 **0.62MB** (1920px). Upgrade radi. (`large-high` == `XXL`.)
- PDF veličine tipično 0.3–9MB; >50 MiB redak (npr. ModularT install 52,7MB). Supabase globalni limit = **50 MiB (52.428.800 B)** (Pro, diže se u dashboard-u).
- `ingest-core`: `downloadAsset(url)` baca na 404 (permanent 4xx, no-retry) → omogućava fallback; `uploadToBucket(supabase, bucket, path, buffer, {cacheBust, timeoutMs})` (cacheBust dodaje `?v=`); `withTimeout`, `writeJsonWithBackup`, `loadManifest`, `slugify`, `getSupabase`, `cacheBustStamp`.
- Supabase prefiks: `https://nnjmrfwepylrheykalik.supabase.co/storage/v1/object/public/`; bucket-i `product-images`, `product-documents`.

---

## File Structure

| Fajl | Odgovornost | Akcija |
|---|---|---|
| `tools/lib/hotlink-migrate.js` | Čiste funkcije: `classifyTarkettUrl`, `extractTarkettUrls`, `rewriteString`. Bez mreže/FS. | Create |
| `tools/migrate_tarkett_hotlinks.js` | Orkestracija: dedupe, download (XXL/fallback, PDF), upload, prepis JSON, pending lista. | Create |
| `tests/contracts/hotlink-migrate-contract.test.ts` | TDD za čiste funkcije. | Create |
| `tests/contracts/tarkett-hotlinks-migrated-contract.test.ts` | Posle migracije: nema hotlinkova osim `tarkett-migration-pending.json`. | Create |
| `public/data/*.json` (8 fajlova) | URL vrednosti prepisane na Supabase. | Modify (migracija) |
| `public/data/tarkett-migration-pending.json` | Lista neuspelih/oversized (dozvoljeni izuzetak). | Create (migracija) |
| `docs/superpowers/runbooks/2026-06-13-s4-hotlink-migracija-runbook.md` | Pokretanje/resume/oversized follow-up. | Create |

---

## Task 1: `hotlink-migrate.js` — čiste funkcije (TDD)

**Files:**
- Create: `tools/lib/hotlink-migrate.js`
- Test: `tests/contracts/hotlink-migrate-contract.test.ts`

- [ ] **Step 1: Napiši failing test**

Create `tests/contracts/hotlink-migrate-contract.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
const { classifyTarkettUrl, extractTarkettUrls, rewriteString } = require('../../tools/lib/hotlink-migrate.js');

describe('hotlink-migrate: classifyTarkettUrl', () => {
  it('slika /large/ → tip image + XXL transformacija + fallback', () => {
    const r = classifyTarkettUrl('https://media.tarkett-image.com/large/IN-LVT-iD-TILT_001.jpg');
    expect(r.type).toBe('image');
    expect(r.xxlUrl).toBe('https://media.tarkett-image.com/XXL/IN-LVT-iD-TILT_001.jpg');
    expect(r.fallbackUrl).toBe('https://media.tarkett-image.com/large/IN-LVT-iD-TILT_001.jpg');
    expect(r.basename).toBe('IN-LVT-iD-TILT_001.jpg');
  });
  it('slika /medium/ → XXL', () => {
    expect(classifyTarkettUrl('https://media.tarkett-image.com/medium/A_B-c.png').xxlUrl)
      .toBe('https://media.tarkett-image.com/XXL/A_B-c.png');
  });
  it('PDF /docs/ → tip pdf', () => {
    const r = classifyTarkettUrl('https://media.tarkett-image.com/docs/DS-Tarkett-x.pdf');
    expect(r.type).toBe('pdf');
    expect(r.basename).toBe('DS-Tarkett-x.pdf');
  });
  it('skida ?query pri klasifikaciji', () => {
    expect(classifyTarkettUrl('https://media.tarkett-image.com/large/x.jpg?v=123').basename).toBe('x.jpg');
  });
  it('nepoznato → other', () => {
    expect(classifyTarkettUrl('https://media.tarkett-image.com/foo/bar').type).toBe('other');
  });
});

describe('hotlink-migrate: extractTarkettUrls', () => {
  it('vadi jedinstvene pune URL-ove iz JSON stringa', () => {
    const s = '{"a":"https://media.tarkett-image.com/large/x.jpg","b":["https://media.tarkett-image.com/large/x.jpg","https://media.tarkett-image.com/docs/y.pdf"]}';
    const urls = extractTarkettUrls(s).sort();
    expect(urls).toEqual([
      'https://media.tarkett-image.com/docs/y.pdf',
      'https://media.tarkett-image.com/large/x.jpg',
    ]);
  });
  it('ne hvata druge hostove', () => {
    expect(extractTarkettUrls('"https://cdn.gerflor.com/a.jpg"')).toEqual([]);
  });
});

describe('hotlink-migrate: rewriteString', () => {
  it('zameni SVE pojave svakog origUrl-a iz mape', () => {
    const s = 'x https://media.tarkett-image.com/large/a.jpg y https://media.tarkett-image.com/large/a.jpg z';
    const out = rewriteString(s, { 'https://media.tarkett-image.com/large/a.jpg': 'https://supa/a.jpg' });
    expect(out).toBe('x https://supa/a.jpg y https://supa/a.jpg z');
  });
  it('ne dira URL-ove van mape', () => {
    const s = 'https://media.tarkett-image.com/large/b.jpg';
    expect(rewriteString(s, { 'https://media.tarkett-image.com/large/a.jpg': 'X' })).toBe(s);
  });
});
```

- [ ] **Step 2: Pokreni test — mora da padne**

Run: `npm run test:contract -- hotlink-migrate-contract`
Expected: FAIL — `Cannot find module '../../tools/lib/hotlink-migrate.js'`.

- [ ] **Step 3: Implementiraj `tools/lib/hotlink-migrate.js`**

```js
// Čiste funkcije za migraciju Tarkett hotlinkova. Bez mreže/FS.
const TARKETT_HOST = 'media.tarkett-image.com';

// Klasifikuj Tarkett URL: image (sa XXL transformacijom + fallback), pdf, ili other.
function classifyTarkettUrl(url) {
  const clean = String(url || '').split('?')[0];
  const basename = clean.split('/').pop() || '';
  if (/\/docs\//.test(clean) || /\.pdf$/i.test(basename)) {
    return { type: 'pdf', clean, basename };
  }
  if (/\.(jpe?g|png|webp)$/i.test(basename)) {
    // size segment (/large/, /medium/, /XL/, /large-high/) -> /XXL/ (1920px); fallback = original
    const xxlUrl = clean.replace(/\/(large-high|large|medium|XL)\//, '/XXL/');
    return { type: 'image', clean, basename, xxlUrl, fallbackUrl: clean };
  }
  return { type: 'other', clean, basename };
}

// Izvuci jedinstvene pune media.tarkett-image.com URL-ove iz JSON stringa.
function extractTarkettUrls(jsonString) {
  const re = /https:\/\/media\.tarkett-image\.com\/[^\s"'\\)]+/g;
  const set = new Set();
  let m;
  while ((m = re.exec(String(jsonString || '')))) set.add(m[0]);
  return [...set];
}

// Zameni SVE pojave svakog origUrl-a iz mape (literal, bez regexa). Duži URL-ovi prvi
// da prefiks-poklapanja ne pokvare zamenu.
function rewriteString(str, map) {
  let out = String(str || '');
  const keys = Object.keys(map).sort((a, b) => b.length - a.length);
  for (const orig of keys) {
    out = out.split(orig).join(map[orig]);
  }
  return out;
}

module.exports = { TARKETT_HOST, classifyTarkettUrl, extractTarkettUrls, rewriteString };
```

- [ ] **Step 4: Pokreni test — mora da prođe**

Run: `npm run test:contract -- hotlink-migrate-contract`
Expected: PASS (svi blokovi).

- [ ] **Step 5: Commit**

```bash
git add tools/lib/hotlink-migrate.js tests/contracts/hotlink-migrate-contract.test.ts
git commit -m "feat(s4): ciste funkcije za migraciju hotlinkova + contract test"
```

---

## Task 2: `migrate_tarkett_hotlinks.js` — orkestracija + dry-run

**Files:**
- Create: `tools/migrate_tarkett_hotlinks.js`

- [ ] **Step 1: Implementiraj orkestrator**

Create `tools/migrate_tarkett_hotlinks.js`:

```js
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const core = require('./lib/ingest-core.js');
const hm = require('./lib/hotlink-migrate.js');

const DATA_DIR = path.join(process.cwd(), 'public', 'data');
const PENDING_PATH = path.join(DATA_DIR, 'tarkett-migration-pending.json');
const IMAGES_BUCKET = 'product-images';
const DOCS_BUCKET = 'product-documents';
const DEST_PREFIX = 'products/tarkett-migrated';
const MIN_IMG_WIDTH = 600;
const MAX_PDF_BYTES = 52_000_000; // ~49.6 MiB, ispod Supabase 50 MiB globalnog limita

// Redosled: LVT prvi (najveći), pa ostali. Samo fajlovi koji sadrže Tarkett hotlinkove.
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

function parseArgs() {
  const args = { dryRun: false, files: [], skipExisting: false };
  for (const a of process.argv.slice(2)) {
    if (a === '--dry-run') args.dryRun = true;
    else if (a === '--skip-existing') args.skipExisting = true;
    else if (a.startsWith('--file=')) args.files.push(a.split('=')[1]);
  }
  return args;
}

function destPath(basename) {
  const dot = basename.lastIndexOf('.');
  const stem = dot > 0 ? basename.slice(0, dot) : basename;
  const ext = dot > 0 ? basename.slice(dot + 1).toLowerCase() : 'bin';
  return `${DEST_PREFIX}/${core.slugify(stem)}.${ext === 'jpeg' ? 'jpg' : ext}`;
}

async function migrateImage(supabase, manifest, info) {
  const mKey = `asset:${info.clean}`;
  if (manifest.has(mKey)) return manifest.get(mKey).publicUrl;
  // probaj XXL, fallback na original
  let buffer;
  try { buffer = await core.downloadAsset(info.xxlUrl); }
  catch { buffer = await core.downloadAsset(info.fallbackUrl); }
  const meta = await core.withTimeout(sharp(buffer).metadata(), 20000, `sharp ${info.basename}`);
  if (!meta.width || meta.width < MIN_IMG_WIDTH) throw new Error(`slika ${meta.width || '?'}px < ${MIN_IMG_WIDTH}px`);
  const publicUrl = await core.uploadToBucket(supabase, IMAGES_BUCKET, destPath(info.basename), buffer);
  manifest.record(mKey, { publicUrl });
  return publicUrl;
}

async function migratePdf(supabase, manifest, info) {
  const mKey = `asset:${info.clean}`;
  if (manifest.has(mKey)) return manifest.get(mKey).publicUrl;
  // HEAD provera veličine (da ne preuzimamo 50MB uzalud)
  let size = 0;
  try {
    const head = await core.withTimeout(fetch(info.clean, { method: 'HEAD', headers: core.BROWSER_HEADERS }), 20000, `head ${info.basename}`);
    size = Number(head.headers.get('content-length') || 0);
  } catch { /* ako HEAD padne, probaćemo download pa upload */ }
  if (size > MAX_PDF_BYTES) { const e = new Error(`PDF ${(size / 1048576).toFixed(1)}MB > limit`); e.oversized = true; throw e; }
  const buffer = await core.downloadAsset(info.clean);
  if (!buffer.slice(0, 5).toString().startsWith('%PDF')) throw new Error('nije PDF');
  if (buffer.length > MAX_PDF_BYTES) { const e = new Error(`PDF ${(buffer.length / 1048576).toFixed(1)}MB > limit`); e.oversized = true; throw e; }
  const publicUrl = await core.uploadToBucket(supabase, DOCS_BUCKET, destPath(info.basename), buffer);
  manifest.record(mKey, { publicUrl });
  return publicUrl;
}

(async () => {
  const args = parseArgs();
  const manifest = core.loadManifest('migrate-tarkett');
  const supabase = args.dryRun ? null : core.getSupabase();
  const targets = TARGET_FILES.filter((f) => args.files.length === 0 || args.files.includes(f));

  // 1) Sakupi sve jedinstvene URL-ove iz ciljnih fajlova
  const fileStrings = new Map();
  const allUrls = new Set();
  for (const f of targets) {
    const p = path.join(DATA_DIR, f);
    if (!fs.existsSync(p)) { console.log(`⚠️  nema ${f}`); continue; }
    const s = fs.readFileSync(p, 'utf8');
    fileStrings.set(f, s);
    for (const u of hm.extractTarkettUrls(s)) allUrls.add(u);
  }
  console.log(`🎯 fajlova: ${targets.length} | jedinstvenih Tarkett URL-ova: ${allUrls.size}${args.dryRun ? ' (DRY-RUN)' : ''}`);

  // 2) Migriraj svaki jedinstveni asset → URL mapa
  const urlMap = {};
  const pending = [];
  let done = 0, img = 0, pdf = 0;
  for (const url of allUrls) {
    const info = hm.classifyTarkettUrl(url);
    if (info.type === 'other') { pending.push({ url, reason: 'nepoznat tip' }); continue; }
    if (args.dryRun) { (info.type === 'image' ? img++ : pdf++); continue; }
    try {
      const publicUrl = info.type === 'image'
        ? await migrateImage(supabase, manifest, info)
        : await migratePdf(supabase, manifest, info);
      urlMap[url] = publicUrl;
      info.type === 'image' ? img++ : pdf++;
      if (++done % 50 === 0) { manifest.save(); console.log(`   … ${done}/${allUrls.size}`); }
    } catch (err) {
      if (err.oversized) pending.push({ url, reason: err.message });
      else { pending.push({ url, reason: err.message }); console.log(`   ⚠️ ${info.basename}: ${err.message}`); }
    }
  }
  if (!args.dryRun) manifest.save();
  console.log(`✅ migrirano: slike ${img} | pdf ${pdf} | pending ${pending.length}`);

  if (args.dryRun) {
    console.log(`(dry-run: slike ${img}, pdf ${pdf}, other/pending ${pending.length})`);
    return;
  }

  // 3) Prepiši sve pojave u svakom fajlu preko mape (oversized/pending ostaju kako jesu)
  for (const f of targets) {
    const s = fileStrings.get(f);
    if (!s) continue;
    const out = hm.rewriteString(s, urlMap);
    if (out !== s) core.writeJsonWithBackup(path.join(DATA_DIR, f), JSON.parse(out), `migrate-${f.replace(/\.json$/, '')}`);
  }

  // 4) Upiši/azuriraj pending listu (dozvoljeni izuzetak za contract test)
  const prevPending = fs.existsSync(PENDING_PATH) ? JSON.parse(fs.readFileSync(PENDING_PATH, 'utf8')) : [];
  const mergedByUrl = new Map(prevPending.map((x) => [x.url, x]));
  for (const x of pending) mergedByUrl.set(x.url, x);
  // ukloni iz pending one koji su sada migrirani (re-run posle dizanja limita)
  for (const u of Object.keys(urlMap)) mergedByUrl.delete(u);
  fs.writeFileSync(PENDING_PATH, JSON.stringify([...mergedByUrl.values()], null, 2));
  console.log(`📝 pending lista: ${mergedByUrl.size} (public/data/tarkett-migration-pending.json)`);
})().catch((err) => { console.error('❌', err); process.exit(1); });
```

- [ ] **Step 2: Syntax check**

Run: `node --check tools/migrate_tarkett_hotlinks.js`
Expected: bez izlaza (exit 0).

- [ ] **Step 3: Commit (kod, podaci netaknuti)**

```bash
git add tools/migrate_tarkett_hotlinks.js
git commit -m "feat(s4): orkestrator migracije Tarkett hotlinkova (XXL, pending lista)"
```

---

## Task 3: Pilot — LVT fajl (najveći) + vizuelna provera

**Files:**
- Modify (migracija): `public/data/tarkett_lvt_products.json`, `public/data/tarkett-migration-pending.json`

- [ ] **Step 1: Dry-run na LVT (mreža, bez uploada)**

Run: `node tools/migrate_tarkett_hotlinks.js --dry-run --file=tarkett_lvt_products.json`
Expected: ispiše broj jedinstvenih URL-ova za LVT (npr. ~stotine slika + PDF). Bez upisa.

- [ ] **Step 2: Pun pilot run na LVT (real upload)**

Run: `node tools/migrate_tarkett_hotlinks.js --file=tarkett_lvt_products.json`
Expected: `✅ migrirano: slike N | pdf M | pending K`. Backup ispisan. (Aktivno monitorisati — tvrdi timeout-i sprečavaju visenja; manifest resume ako se prekine.)

- [ ] **Step 3: Verifikuj prepis**

Run:
```bash
node -e "const s=require('fs').readFileSync('public/data/tarkett_lvt_products.json','utf8'); const left=(s.match(/media\.tarkett-image\.com/g)||[]).length; const pend=require('./public/data/tarkett-migration-pending.json').length; console.log('preostalo hotlinkova u LVT:', left, '| pending ukupno:', pend); const sup=(s.match(/nnjmrfwepylrheykalik\.supabase\.co/g)||[]).length; console.log('supabase URL-ova u LVT:', sup);"
```
Expected: `preostalo hotlinkova` == broj pending URL-ova koji se pojavljuju u LVT (idealno 0 osim oversized); `supabase URL-ova` veliki broj.

- [ ] **Step 4: Vizuelna provera**

`npm run dev`, otvori PDP postojeće LVT kolekcije (npr. `/proizvodi/tarkett-id-mixonomi` ili `tarkett-ideal-spc-50`). Slike sa Supabase, oštrije (XXL). Ugasi `npm run dev` posle.

- [ ] **Step 5: Commit pilota**

```bash
git add public/data/tarkett_lvt_products.json public/data/tarkett-migration-pending.json
git commit -m "feat(s4): pilot migracija LVT hotlinkova u Supabase (XXL)"
```

---

## Task 4: Pun run — preostalih 7 fajlova

**Files:**
- Modify (migracija): preostalih 7 `public/data/tarkett_*.json` + pending

- [ ] **Step 1: Pun run (svi osim već-urađenog LVT — manifest preskače uploadovano)**

Run: `node tools/migrate_tarkett_hotlinks.js`
Expected: REZIME sa ukupnim brojevima; LVT asseti preskočeni (manifest); ostali fajlovi prepisani. Monitorisati.

- [ ] **Step 2: Verifikuj sve fajlove**

Run:
```bash
node -e "const fs=require('fs'); let tot=0; for (const f of fs.readdirSync('public/data').filter(x=>x.endsWith('.json'))){const s=fs.readFileSync('public/data/'+f,'utf8'); const n=(s.match(/media\.tarkett-image\.com/g)||[]).length; if(n)console.log(n,f); tot+=n;} const pend=require('./public/data/tarkett-migration-pending.json'); console.log('UKUPNO preostalo:', tot, '| pending:', pend.length);"
```
Expected: `UKUPNO preostalo` == broj pojava pending URL-ova (oversized). Idealno samo nekoliko (veliki PDF-ovi).

- [ ] **Step 3: Commit**

```bash
git add public/data/*.json
git commit -m "feat(s4): migracija svih preostalih Tarkett hotlinkova u Supabase"
```

---

## Task 5: Contract test + pun gate

**Files:**
- Create: `tests/contracts/tarkett-hotlinks-migrated-contract.test.ts`

- [ ] **Step 1: Napiši test**

Create `tests/contracts/tarkett-hotlinks-migrated-contract.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const DATA_DIR = path.join(process.cwd(), 'public', 'data');
const pendingPath = path.join(DATA_DIR, 'tarkett-migration-pending.json');
const pending: Array<{ url: string }> = fs.existsSync(pendingPath)
  ? JSON.parse(fs.readFileSync(pendingPath, 'utf8'))
  : [];
const allowed = new Set(pending.map((p) => p.url));

describe('S4: Tarkett hotlinkovi migrirani (osim pending)', () => {
  it('nijedan media.tarkett-image.com URL u public/data osim pending liste', () => {
    const offenders: string[] = [];
    for (const f of fs.readdirSync(DATA_DIR).filter((x) => x.endsWith('.json'))) {
      if (f === 'tarkett-migration-pending.json') continue;
      const s = fs.readFileSync(path.join(DATA_DIR, f), 'utf8');
      const urls = s.match(/https:\/\/media\.tarkett-image\.com\/[^\s"'\\)]+/g) || [];
      for (const u of urls) if (!allowed.has(u)) offenders.push(`${f}: ${u}`);
    }
    expect(offenders, `nemigrirani hotlinkovi:\n${offenders.slice(0, 20).join('\n')}`).toEqual([]);
  });

  it('pending lista je mala (samo veliki/neuspeli asseti)', () => {
    expect(pending.length).toBeLessThan(20);
  });
});
```

- [ ] **Step 2: Pokreni test**

Run: `npm run test:contract -- tarkett-hotlinks-migrated`
Expected: PASS (svi preostali hotlinkovi su u pending listi).

- [ ] **Step 3: Pun gate**

Run: `npm run test:contract` pa `npm run build`
Expected: sve zeleno; build „✓ Compiled successfully".

- [ ] **Step 4: Audit**

Run: `npx tsx scripts/audit-catalog-quality.ts`
Expected: bez novih grešaka.

- [ ] **Step 5: Commit**

```bash
git add tests/contracts/tarkett-hotlinks-migrated-contract.test.ts
git commit -m "test(s4): contract — nema Tarkett hotlinkova osim pending"
```

---

## Task 6: Runbook + oversized follow-up + memorija

**Files:**
- Create: `docs/superpowers/runbooks/2026-06-13-s4-hotlink-migracija-runbook.md`

- [ ] **Step 1: Runbook**

Create runbook sa: pokretanje (`node tools/migrate_tarkett_hotlinks.js [--dry-run] [--file=] [--skip-existing]`), resume (manifest `output/migrate-tarkett-manifest.json`), rollback (`writeJsonWithBackup` backup u `output/` + `git checkout`), i **oversized follow-up**: kad vlasnik digne globalni upload limit (Supabase dashboard → Settings → Storage → „Upload file size limit" → npr. 100MB), obriši odgovarajuće iz `tarkett-migration-pending.json` i pokreni `node tools/migrate_tarkett_hotlinks.js` ponovo (preuzme+uploaduje njih, prepiše, isprazni pending) — uključujući „taj" ModularT install-PDF (re-ingest preko `tools/ingest_tarkett.js --collection=modulart-70` posle dizanja limita).

- [ ] **Step 2: Ažuriraj memoriju**

U `podovi-galerija-redizajn-stanje.md`: S4 isporučen — svi Tarkett hotlinkovi (2.844 asseta) u Supabasu, slike na XXL; pending oversized lista + korak za vlasnika.

- [ ] **Step 3: Finalni pregled + deploy odluka**

Run: `git log --oneline -8` i `git status`. Sažmi: broj migriranih asseta, pending. Deploy (`push main`) ostaje ručna odluka vlasnika. Naglasi oversized follow-up (dashboard limit).

- [ ] **Step 4: Commit**

```bash
git add docs/superpowers/runbooks/2026-06-13-s4-hotlink-migracija-runbook.md
git commit -m "docs(s4): runbook + oversized follow-up za migraciju hotlinkova"
```

---

## Self-Review

**1. Spec coverage:**
- §4 reuse ingest-core + novi orkestrator → Task 2. ✅
- §4 čiste funkcije (klasifikacija/XXL/ekstrakcija/prepis) → Task 1. ✅
- §3 slike XXL + fallback → Task 1 `classifyTarkettUrl` + Task 2 `migrateImage`. ✅
- §3 PDF + oversized→pending → Task 2 `migratePdf` + pending upis. ✅
- §4.5 pending fajl kao dozvoljeni izuzetak → Task 2 + Task 5 test. ✅
- §5 bez izmena loadera (samo URL vrednost) → prepis stringa, loaderi netaknuti. ✅
- §7 gate (build + test:contract + novi contract + audit + vizuelno) → Task 5. ✅
- §7.5 oversized follow-up → Task 6 runbook. ✅
- §3 fazno LVT prvi → Task 3 pilot, Task 4 ostalo. ✅

**2. Placeholder scan:** Nema „TBD". Kod kompletan (čiste funkcije + orkestrator cele). Brojevi/limiti iz dokaza (MAX_PDF_BYTES, MIN_IMG_WIDTH, XXL).

**3. Type/ime konzistentnost:**
- `classifyTarkettUrl`/`extractTarkettUrls`/`rewriteString` — isti potpisi u Task 1 (impl+test) i Task 2 (poziv `hm.*`). ✅
- `info.{type,clean,basename,xxlUrl,fallbackUrl}` — vraćeno u Task 1, korišćeno u Task 2 `migrateImage/migratePdf`. ✅
- `urlMap` (origUrl→supabaseUrl) → `rewriteString` u Task 2; isti oblik kao Task 1 test. ✅
- `tarkett-migration-pending.json` (lista `{url, reason}`) — pisano u Task 2, čitano u Task 5 test (`{url}`). ✅
- manifest ime `migrate-tarkett` (Task 2) = runbook `output/migrate-tarkett-manifest.json` (Task 6). ✅
