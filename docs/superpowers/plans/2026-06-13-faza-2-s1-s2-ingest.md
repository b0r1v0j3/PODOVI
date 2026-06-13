# Faza 2 — S1 (ingest infra) + S2 (Gerflor vinil prezentacija) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Izgraditi ingest infrastrukturu (S1) i njome obogatiti svih 25 Gerflor vinil kolekcija PDF dokumentima, room-scene fotografijama i 1500px slikama dekora, sa svim assetima u našem Supabase storage-u (S2).

**Architecture:** Čiste parse funkcije (`tools/lib/gerflor-parse.js`, pokrivene contract testovima sa verbatim HTML fixtures) + ingest jezgro (`tools/lib/ingest-core.js`: env, fetch sa Akamai headerima, download/upload, JSON backup, manifest) + orkestracija (`tools/ingest_gerflor_cee.js`: sitemap → kolekcija → boja → asseti → `vinyl_colors_complete.json`). Loader (`getVinylCollectionProducts`) dobija nova polja sa fallback-om na staro ponašanje, pa je bezbedno menjati ga pre punog run-a.

**Tech Stack:** Node CJS (tools/ konvencija), @supabase/supabase-js ^2.95.3, sharp (provera dimenzija), vitest contract testovi, Playwright (samo Tarkett core extractor).

**Kritična pravila za izvođača:**
- Spec: `docs/superpowers/specs/2026-06-13-faza-2-podaci-master-s1-s2-design.md`. Evidence packovi sa verbatim dokazima: `tmp/ingest-plan-notes/repo-pack.md` i `tmp/ingest-plan-notes/upstream-pack.md` — konsultuj ih pri svakoj nedoumici, NE pogađaj.
- Radi na grani `faza-2/s1-s2-gerflor-ingest` (napravi je sa main). Commit po tasku; BEZ push-a.
- `www.gerflor-cee.com`: GET (nikad HEAD), tempo max 1 req/s, OBAVEZNI headeri uključujući `Sec-Fetch-*` + `Upgrade-Insecure-Requests` (bez njih 403). `cdn.gerflor.com`: bez ograničenja, ali razmaci u PDF putanjama → `%20`.
- Env: `.env.local` sadrži `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` (vrednosti mogu biti pod navodnicima — parser ih skida). Ako env fali, skripte staju sa jasnom porukom — NE hardkodovati ključeve.
- `public/images/products/vinyl/` se NE menja i NE briše (ostaje fallback); novi asseti idu isključivo u Supabase.
- Posle SVAKOG taska koji menja kod: `npm run test:contract` zeleno.

**Amandman posle review-a orkestracije (pre pilota):** (1) telo per-collection petlje obmotano `try/catch` — jedna 404/mrežna greška na kolekciji se loguje i preskače (`status: 'error'` u manifestu), ne obara ceo run; ostale kolekcije se i dalje upisuju na kraju. (2) ODLUKA o putanji storage-a: koristi se `products/vinil/<kolekcija>/...` (po KATEGORIJI), a NE `products/gerflor/...` iz speca §6 — jer je postojeća konvencija bucketa po kategoriji (`products/otiraci/`, `products/lajsne/`, `products/sport/`, `products/industrial/`); spec §6.1/6.4 je tu bio neprecizan, konzistentnost sa postojećim layoutom ima prednost.

**Amandman posle dry-run-a Taska 6 (ingest skripta dopunjena):** dry-run je otkrio da CEE kolekcije `taralay-initial-acoustic-0` i `taralay-initial-compact-new` imaju nov, *codeless* opseg boja (40 dekora, ključ po imenu) koji se ne poklapa sa našim starim opsegom (49 boja sa šiframa, ~12% poklapanja imena). Da se ne napravi nered: uveden `SKIP_COLOR_INGEST_CEE_SLUGS = new Set(['taralay-initial-acoustic-0','taralay-initial-compact-new'])` — za te kolekcije radi se SAMO obogaćivanje na nivou kolekcije (dokumenti + room-scene + hero), a per-color decor loop (korak 6) i dodavanje novih upstream boja (korak 7) se PRESKAČU; postojećih 49 boja ostaje netaknuto. Odluka o usaglašavanju opsega (zadržati 49 starih vs preći na 40 novih CEE) je OTVORENA za vlasnika (Faza 2 follow-up). Dodatno: varijacije se dedupliraju po ključu (`code:` ili `name:`) pre obrade — `taralay-libertex` ima 3 URL-a po boji (60→20), dedup uklanja redundantna preuzimanja u svim kolekcijama. ODLUKA potvrđena sa vlasnikom u toku.

**Amandman posle review-a Taska 1 (modul `gerflor-parse.js` je dopunjen mimo originalnog koda u planu):** (1) `classifyProductPath` prvo proverava TAČAN match protiv svih kolekcijskih slugova, a varijacije matchuje i preko `VARIATION_PREFIX_ALIASES` (CEE kolekcija `taralay-initial-acoustic-0` ima varijacije sa prefiksom `taralay-initial-acoustic` BEZ `-0`); (2) varijacije bez šifre/SKU dozvoljene su SAMO za kolekcije u `CODELESS_VARIATION_CEE_SLUGS` (`taralay-initial-acoustic-0`, `taralay-initial-compact-new`, `taralay-impression-hop-acoustic`) — sve ostalo vraća `null` da nepoznate stranice ne postanu proizvodi; (3) decodeEntities: `&amp;` se dekodira poslednji + dodat `&nbsp;`; PDF regex je case-insensitive i toleriše atribute pre `href`. ODLUKA (descope): „prednost EN verziji" dedupe se NE implementira — CEE je engleski sajt, duplikati po jeziku se ne javljaju; dedupe ostaje po URL-u.

---

### Task 1: Čiste parse funkcije + contract testovi (TDD)

**Files:**
- Create: `tools/lib/gerflor-parse.js`
- Test: `tests/contracts/gerflor-parse-contract.test.ts`

- [ ] **Step 1: Napiši failing testove sa verbatim fixtures**

Fixtures su DOSLOVNI isečci sa živih stranica (iz upstream-pack.md §1–§3). Napravi `tests/contracts/gerflor-parse-contract.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
const {
  rewriteSitemapHost,
  classifyProductPath,
  parseSpecTables,
  parseDocumentLinks,
  parseHeroSlides,
  parseColorCount,
  mapDocumentTitle,
  encodeAssetUrl,
  CEE_SLUG_BY_OUR_SLUG,
} = require('../../tools/lib/gerflor-parse.js');

const CEE_SLUGS = Object.values(CEE_SLUG_BY_OUR_SLUG).filter(Boolean) as string[];

describe('Gerflor CEE parse contracts', () => {
  it('rewrites internal sitemap host to public host', () => {
    expect(rewriteSitemapHost('https://prod-peco.gerflor.io/products/nerok-55'))
      .toBe('https://www.gerflor-cee.com/products/nerok-55');
  });

  it('classifies collection vs variation paths, incl. exceptions', () => {
    expect(classifyProductPath('taralay-impression-compact', CEE_SLUGS))
      .toEqual({ type: 'collection', ceeSlug: 'taralay-impression-compact' });

    expect(classifyProductPath('taralay-impression-compact-0523-cemento-genova-20010523', CEE_SLUGS))
      .toEqual({
        type: 'variation', ceeSlug: 'taralay-impression-compact',
        code: '0523', nameSlug: 'cemento-genova', sku: '20010523',
      });

    expect(classifyProductPath('premium-compact-0027-tweed-beige-hd420027', CEE_SLUGS))
      .toMatchObject({ type: 'variation', ceeSlug: 'premium-compact', code: '0027', sku: 'hd420027' });

    expect(classifyProductPath('taralay-initial-compact-new-azay-cream', CEE_SLUGS))
      .toEqual({
        type: 'variation', ceeSlug: 'taralay-initial-compact-new',
        code: null, nameSlug: 'azay-cream', sku: null,
      });

    expect(classifyProductPath('mipolam-elegance-nesto', CEE_SLUGS)).toBeNull();
  });

  it('longest CEE slug wins (hop-acoustic vs impression-acoustic prefix overlap)', () => {
    expect(classifyProductPath('taralay-impression-hop-acoustic-finesse-nature', CEE_SLUGS))
      .toMatchObject({ type: 'variation', ceeSlug: 'taralay-impression-hop-acoustic', nameSlug: 'finesse-nature' });
  });

  it('parses spec table rows', () => {
    const html = `<table class="responsive-enabled" data-striping="1">
      <tbody>
              <tr>
                      <td><strong>Surface treatment</strong></td>
                      <td>Protecsol®2</td>
                  </tr>
              <tr>
                      <td><strong>Overall thickness</strong></td>
                      <td>2.00 mm</td>
                  </tr>
      </tbody></table>`;
    expect(parseSpecTables(html)).toEqual({
      'Surface treatment': 'Protecsol®2',
      'Overall thickness': '2.00 mm',
    });
  });

  it('parses document links from sticky list and resources, with categories', () => {
    const html = `<ul class="product-documents-list"><li>
        <a href="https://cdn.gerflor.com/media/2/41666/taralay impression compact - technical data sheet.pdf" download class="js-file-download">Taralay Impression Compact - Technical Data Sheet</a>
      </li></ul>
      <details class="acc-item"><summary class="acc-title">
          Commercial documents
        </summary><div class="acc-content"><div  class="res-item"><div class="res-content"><a
      class="res-link js-file-download"
      href="https://cdn.gerflor.com/media/2/38688/my taralay impression - guide.pdf"
      data-file-name="My Taralay Impression - Guide"
      target="_blank" rel="noopener"><i class="res-icon font-icon icon-pdf"></i><span class="res-info">
          My Taralay Impression - Guide
      </span></a></div></div></div></details>`;
    const docs = parseDocumentLinks(html);
    expect(docs).toHaveLength(2);
    expect(docs[0]).toMatchObject({
      url: 'https://cdn.gerflor.com/media/2/41666/taralay impression compact - technical data sheet.pdf',
      name: 'Taralay Impression Compact - Technical Data Sheet',
    });
    expect(docs[1]).toMatchObject({ category: 'Commercial documents', name: 'My Taralay Impression - Guide' });
  });

  it('parses hero slides with alt (collection ambience + variation decor)', () => {
    const html = `<div class="slide-item"><picture>
            <img loading="eager" fetchpriority="high" width="1200" height="877" src="https://cdn.gerflor.com/media/1642426083/1/16067.jpg" alt="gerflor-taralay-impression-0523-cemento-genova" />
  </picture></div>`;
    expect(parseHeroSlides(html)).toEqual([
      { src: 'https://cdn.gerflor.com/media/1642426083/1/16067.jpg', alt: 'gerflor-taralay-impression-0523-cemento-genova' },
    ]);
  });

  it('parses color count header', () => {
    expect(parseColorCount('<h2 tabindex="0">95 colors</h2>')).toBe(95);
  });

  it('maps document names to Serbian titles', () => {
    expect(mapDocumentTitle('Taralay Impression Compact - Technical Data Sheet', '')).toBe('Tehnički list');
    expect(mapDocumentTitle('Nerok 55 - DOP', '')).toBe('Izjava o svojstvima (DoP)');
    expect(mapDocumentTitle('Taralay Impression/Initial Compact - EPD', '')).toBe('EPD');
    expect(mapDocumentTitle('TARALAY IMPRESSION COMPACT - EDS', '')).toBe('Ekološki list (EDS)');
    expect(mapDocumentTitle('Installation instructions', 'Installation & maintenance')).toBe('Uputstvo za ugradnju');
    expect(mapDocumentTitle('Maintenance guide', 'Installation & maintenance')).toBe('Uputstvo za održavanje');
    expect(mapDocumentTitle('My Taralay Impression - Guide', 'Commercial documents')).toBe('Brošura — My Taralay Impression - Guide');
    expect(mapDocumentTitle('FloorScore Certificate', '')).toBe('Sertifikat — FloorScore Certificate');
    expect(mapDocumentTitle('Nešto neprepoznato', '')).toBe('Nešto neprepoznato');
  });

  it('percent-encodes spaces in asset URLs', () => {
    expect(encodeAssetUrl('https://cdn.gerflor.com/media/2/41666/taralay impression compact - technical data sheet.pdf'))
      .toBe('https://cdn.gerflor.com/media/2/41666/taralay%20impression%20compact%20-%20technical%20data%20sheet.pdf');
  });

  it('maps all 25 our slugs (mipolam-elegance → null, 4 renamed)', () => {
    expect(Object.keys(CEE_SLUG_BY_OUR_SLUG)).toHaveLength(25);
    expect(CEE_SLUG_BY_OUR_SLUG['mipolam-elegance']).toBeNull();
    expect(CEE_SLUG_BY_OUR_SLUG['taralay-initial-acoustic']).toBe('taralay-initial-acoustic-0');
    expect(CEE_SLUG_BY_OUR_SLUG['taralay-initial-compact']).toBe('taralay-initial-compact-new');
    expect(CEE_SLUG_BY_OUR_SLUG['taralay-millenium-acoustic']).toBe('taralay-millenium-acoustic-order');
    expect(CEE_SLUG_BY_OUR_SLUG['taralay-libertex']).toBe('taralay-libertex-duplicated-new-sept-2025');
    expect(CEE_SLUG_BY_OUR_SLUG['mipolam-classic-1-5mm']).toBe('mipolam-classic-15mm');
    expect(CEE_SLUG_BY_OUR_SLUG['nerok-55']).toBe('nerok-55');
  });
});
```

- [ ] **Step 2: Pokreni — mora da padne**

Run: `npm run test:contract -- tests/contracts/gerflor-parse-contract.test.ts`
Expected: FAIL (`Cannot find module '../../tools/lib/gerflor-parse.js'`).

- [ ] **Step 3: Implementiraj `tools/lib/gerflor-parse.js`**

CJS, bez novih zavisnosti, bez mrežnih poziva:

```js
const PUBLIC_HOST = 'https://www.gerflor-cee.com';
const INTERNAL_HOST_RE = /^https:\/\/prod-peco\.gerflor\.io/;

// Naš slug -> CEE slug (sitemap). null = ne postoji na CEE (preskoči, loguj u manifest).
// Izvor: tmp/ingest-plan-notes/upstream-pack.md §4 (provereno na sitemap-u 2026-06-13).
const CEE_SLUG_BY_OUR_SLUG = {
  'nerok-55': 'nerok-55',
  'nerok-70': 'nerok-70',
  'premium-acoustic': 'premium-acoustic',
  'premium-compact': 'premium-compact',
  'taralay-impression-acoustic': 'taralay-impression-acoustic',
  'taralay-impression-compact': 'taralay-impression-compact',
  'taralay-impression-hop-acoustic': 'taralay-impression-hop-acoustic',
  'taralay-impression-hop-compact': 'taralay-impression-hop-compact',
  'taralay-initial-acoustic': 'taralay-initial-acoustic-0',
  'taralay-initial-compact': 'taralay-initial-compact-new',
  'taralay-millenium-acoustic': 'taralay-millenium-acoustic-order',
  'taralay-millenium-compact': 'taralay-millenium-compact',
  'taralay-libertex': 'taralay-libertex-duplicated-new-sept-2025',
  'mipolam-accord': 'mipolam-accord',
  'mipolam-affinity': 'mipolam-affinity',
  'mipolam-affinity-608x608': 'mipolam-affinity-608x608',
  'mipolam-astro': 'mipolam-astro',
  'mipolam-bioplanet': 'mipolam-bioplanet',
  'mipolam-classic-1-5mm': 'mipolam-classic-15mm',
  'mipolam-classic-2mm': 'mipolam-classic-2mm',
  'mipolam-elegance': null,
  'mipolam-evo': 'mipolam-evo',
  'mipolam-planet': 'mipolam-planet',
  'mipolam-symbioz': 'mipolam-symbioz',
  'mipolam-troplan': 'mipolam-troplan',
};

function rewriteSitemapHost(url) {
  return String(url || '').replace(INTERNAL_HOST_RE, PUBLIC_HOST);
}

function parseSitemapLocs(xml) {
  const locs = [];
  const re = /<loc>([^<]+)<\/loc>/g;
  let m;
  while ((m = re.exec(xml))) locs.push(rewriteSitemapHost(m[1].trim()));
  return locs;
}

// path = slug deo URL-a posle /products/
function classifyProductPath(pathSlug, ceeSlugs) {
  const sorted = [...ceeSlugs].sort((a, b) => b.length - a.length);
  for (const ceeSlug of sorted) {
    if (pathSlug === ceeSlug) return { type: 'collection', ceeSlug };
    if (!pathSlug.startsWith(ceeSlug + '-')) continue;
    const rest = pathSlug.slice(ceeSlug.length + 1);
    const standard = rest.match(/^(\d{4})-([a-z0-9-]+)-([a-z]{0,2}\d{6,8})$/);
    if (standard) {
      return { type: 'variation', ceeSlug, code: standard[1], nameSlug: standard[2], sku: standard[3] };
    }
    // Izuzeci bez šifre/SKU (taralay-initial-*, pojedinačne hop varijacije)
    return { type: 'variation', ceeSlug, code: null, nameSlug: rest, sku: null };
  }
  return null;
}

function decodeEntities(s) {
  return String(s || '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/\s+/g, ' ').trim();
}

function parseSpecTables(html) {
  const out = {};
  const rowRe = /<td><strong>([^<]+)<\/strong><\/td>\s*<td>([^<]*)<\/td>/g;
  let m;
  while ((m = rowRe.exec(html))) {
    const key = decodeEntities(m[1]);
    const value = decodeEntities(m[2]);
    if (key && value) out[key] = value;
  }
  return out;
}

function parseDocumentLinks(html) {
  const docs = [];
  const seen = new Set();
  // 1) sticky lista: <ul class="product-documents-list"> ... <a href="..pdf" download>NAME</a>
  const stickyBlock = html.match(/<ul class="product-documents-list">([\s\S]*?)<\/ul>/);
  if (stickyBlock) {
    const linkRe = /<a href="(https:\/\/cdn\.gerflor\.com\/[^"]+\.pdf)"[^>]*>([\s\S]*?)<\/a>/g;
    let m;
    while ((m = linkRe.exec(stickyBlock[1]))) {
      const url = m[1];
      if (seen.has(url)) continue;
      seen.add(url);
      docs.push({ url, name: decodeEntities(m[2]), category: '' });
    }
  }
  // 2) Resources: <details class="acc-item"><summary class="acc-title">KATEGORIJA</summary> ... res-link ...
  const accRe = /<details class="acc-item">\s*<summary class="acc-title">([\s\S]*?)<\/summary>([\s\S]*?)<\/details>/g;
  let acc;
  while ((acc = accRe.exec(html))) {
    const category = decodeEntities(acc[1]);
    const body = acc[2];
    const resRe = /class="res-link js-file-download"\s+href="(https:\/\/cdn\.gerflor\.com\/[^"]+\.pdf)"[\s\S]*?<span class="res-info">([\s\S]*?)<\/span>/g;
    let r;
    while ((r = resRe.exec(body))) {
      const url = r[1];
      if (seen.has(url)) continue;
      seen.add(url);
      docs.push({ url, name: decodeEntities(r[2]), category });
    }
  }
  return docs;
}

function parseHeroSlides(html) {
  const slides = [];
  const re = /<div class="slide-item">\s*<picture>\s*<img[^>]*src="(https:\/\/cdn\.gerflor\.com\/[^"]+\.jpg)"[^>]*alt="([^"]*)"/g;
  let m;
  while ((m = re.exec(html))) slides.push({ src: m[1], alt: decodeEntities(m[2]) });
  return slides;
}

function parseColorCount(html) {
  const m = html.match(/<h2[^>]*>(\d+)\s+colors<\/h2>/);
  return m ? Number(m[1]) : null;
}

function parseDescriptionDialog(html) {
  const dialog = html.match(/<dialog class="js-dlg dlg js-dlg-slide dlg-slide description-dialog"[\s\S]*?<\/dialog>/);
  if (!dialog) return null;
  const intro = dialog[0].match(/layout__region--intro">\s*([\s\S]*?)<\/div>/);
  const body = dialog[0].match(/layout__region--description">([\s\S]*?)<\/div>/);
  const stripTags = (s) => decodeEntities(String(s || '').replace(/<li>/g, '\n- ').replace(/<\/p>|<br\s*\/?>/g, '\n').replace(/<[^>]+>/g, ''));
  return {
    intro: intro ? stripTags(intro[1]) : '',
    body: body ? stripTags(body[1]) : '',
  };
}

const TITLE_RULES = [
  { re: /technical data sheet|tds\b/i, title: () => 'Tehnički list' },
  { re: /\bdop\b|declaration of performance/i, title: () => 'Izjava o svojstvima (DoP)' },
  { re: /\bepd\b/i, title: () => 'EPD' },
  { re: /\beds\b/i, title: () => 'Ekološki list (EDS)' },
  { re: /installation/i, title: () => 'Uputstvo za ugradnju' },
  { re: /maintenance|cleaning/i, title: () => 'Uputstvo za održavanje' },
  { re: /warranty|guarantee/i, title: () => 'Garancija' },
  { re: /floorscore|certificat|fire|antislip|iso \d|reach\b/i, title: (n) => `Sertifikat — ${n}` },
  { re: /brochure|guide|catalog/i, title: (n) => `Brošura — ${n}` },
];

function mapDocumentTitle(name, category) {
  const n = decodeEntities(name);
  for (const rule of TITLE_RULES) {
    if (rule.re.test(n)) return rule.title(n);
  }
  if (/installation/i.test(category)) return 'Uputstvo za ugradnju';
  return n;
}

function encodeAssetUrl(url) {
  return String(url || '').replace(/ /g, '%20');
}

module.exports = {
  PUBLIC_HOST,
  CEE_SLUG_BY_OUR_SLUG,
  rewriteSitemapHost,
  parseSitemapLocs,
  classifyProductPath,
  parseSpecTables,
  parseDocumentLinks,
  parseHeroSlides,
  parseColorCount,
  parseDescriptionDialog,
  mapDocumentTitle,
  encodeAssetUrl,
  decodeEntities,
};
```

- [ ] **Step 4: Testovi zeleni**

Run: `npm run test:contract`
Expected: svi prolaze (novi fajl + postojećih 9).

- [ ] **Step 5: Commit**

```bash
git add tools/lib/gerflor-parse.js tests/contracts/gerflor-parse-contract.test.ts
git commit -m "feat(ingest): gerflor-cee parse funkcije sa contract testovima"
```

---

### Task 2: Ingest jezgro (`tools/lib/ingest-core.js`)

**Files:**
- Create: `tools/lib/ingest-core.js`

- [ ] **Step 1: Implementiraj jezgro**

CJS. Env parser je KOPIJA obrasca iz `scripts/sync-tarkett-supabase.ts` (skida navodnike — AGENTS pravilo 27); browser headeri su DOKAZANI set iz upstream-pack.md §5a.

```js
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const BROWSER_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'sec-ch-ua': '"Google Chrome";v="137", "Chromium";v="137", "Not/A)Brand";v="24"',
  'sec-ch-ua-mobile': '?0',
  'sec-ch-ua-platform': '"Windows"',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'none',
  'Sec-Fetch-User': '?1',
  'Upgrade-Insecure-Requests': '1',
};

function loadLocalEnvFile() {
  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex === -1) continue;
    const key = trimmed.slice(0, separatorIndex).trim();
    if (!key || process.env[key]) continue;
    let value = trimmed.slice(separatorIndex + 1).trim();
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    process.env[key] = value;
  }
}

function getSupabase() {
  loadLocalEnvFile();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('Nedostaju NEXT_PUBLIC_SUPABASE_URL i/ili SUPABASE_SERVICE_ROLE_KEY u .env.local');
  }
  return createClient(url, key);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let lastPageFetchAt = 0;
async function politePageDelay(minIntervalMs = 1100) {
  const wait = lastPageFetchAt + minIntervalMs - Date.now();
  if (wait > 0) await sleep(wait);
  lastPageFetchAt = Date.now();
}

async function fetchWithRetry(url, { headers = BROWSER_HEADERS, attempts = 3, asBuffer = false } = {}) {
  let lastError;
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url, { headers, redirect: 'follow' });
      if (res.status === 403 || res.status === 429) {
        lastError = new Error(`HTTP ${res.status} za ${url}`);
        await sleep(5000 * (i + 1));
        continue;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status} za ${url}`);
      return asBuffer ? Buffer.from(await res.arrayBuffer()) : await res.text();
    } catch (err) {
      lastError = err;
      await sleep(2000 * (i + 1));
    }
  }
  throw lastError;
}

async function fetchPage(url) {
  await politePageDelay();
  return fetchWithRetry(url, { asBuffer: false });
}

async function downloadAsset(url) {
  // cdn.gerflor.com nema zaštitu; bez polite delay-a, ali sa retry-jem
  return fetchWithRetry(url, { asBuffer: true });
}

function contentTypeFor(filePath) {
  if (/\.pdf$/i.test(filePath)) return 'application/pdf';
  if (/\.(jpe?g)$/i.test(filePath)) return 'image/jpeg';
  if (/\.png$/i.test(filePath)) return 'image/png';
  if (/\.webp$/i.test(filePath)) return 'image/webp';
  return 'application/octet-stream';
}

function cacheBustStamp() {
  return new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
}

async function uploadToBucket(supabase, bucket, storagePath, buffer, { cacheBust = true } = {}) {
  const { error } = await supabase.storage.from(bucket).upload(storagePath, buffer, {
    contentType: contentTypeFor(storagePath),
    upsert: true,
  });
  if (error) throw new Error(`Upload ${bucket}/${storagePath}: ${error.message}`);
  const { data } = supabase.storage.from(bucket).getPublicUrl(storagePath);
  if (!data?.publicUrl) throw new Error(`getPublicUrl prazan za ${bucket}/${storagePath}`);
  return cacheBust ? `${data.publicUrl}?v=${cacheBustStamp()}` : data.publicUrl;
}

function writeJsonWithBackup(jsonPath, data, backupLabel) {
  const outputDir = path.join(process.cwd(), 'output');
  fs.mkdirSync(outputDir, { recursive: true });
  if (fs.existsSync(jsonPath)) {
    const stamp = new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_').replace('Z', '');
    const backupPath = path.join(outputDir, `${backupLabel}-backup-${stamp}.json`);
    fs.copyFileSync(jsonPath, backupPath);
    console.log(`📦 Backup: ${backupPath}`);
  }
  fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2), 'utf8');
}

function loadManifest(name) {
  const manifestPath = path.join(process.cwd(), 'output', `${name}-manifest.json`);
  let entries = {};
  if (fs.existsSync(manifestPath)) {
    entries = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  }
  return {
    has: (key) => Boolean(entries[key]),
    get: (key) => entries[key],
    record(key, value) {
      entries[key] = { ...value, at: new Date().toISOString() };
    },
    save() {
      fs.mkdirSync(path.dirname(manifestPath), { recursive: true });
      fs.writeFileSync(manifestPath, JSON.stringify(entries, null, 2), 'utf8');
    },
    size: () => Object.keys(entries).length,
  };
}

function slugify(s) {
  return String(s || '').toLowerCase().normalize('NFKD').replace(/[^\w\s-]/g, '').trim().replace(/[\s_]+/g, '-').replace(/-+/g, '-');
}

module.exports = {
  BROWSER_HEADERS,
  loadLocalEnvFile,
  getSupabase,
  sleep,
  fetchPage,
  fetchWithRetry,
  downloadAsset,
  uploadToBucket,
  writeJsonWithBackup,
  loadManifest,
  cacheBustStamp,
  slugify,
};
```

- [ ] **Step 2: Smoke test protiv živog sajta (read-only)**

Run:
```bash
node -e "const c=require('./tools/lib/ingest-core.js');(async()=>{const xml=await c.fetchPage('https://www.gerflor-cee.com/sitemap.xml');const p=require('./tools/lib/gerflor-parse.js');const locs=p.parseSitemapLocs(xml);console.log('locs:',locs.length, locs.find(u=>u.includes('nerok-55')));})()"
```
Expected: `locs: 4500+` (broj ≥ 4400) i jedan `https://www.gerflor-cee.com/products/nerok-55...` URL. Ako 403 → proveri headere (mora pun set).

- [ ] **Step 3: Commit**

```bash
git add tools/lib/ingest-core.js
git commit -m "feat(ingest): ingest jezgro — env, Akamai fetch, Supabase upload, backup, manifest"
```

---

### Task 3: Bucket `product-documents`

**Files:**
- Create: `tools/create_product_documents_bucket.js`

- [ ] **Step 1: Skripta (idempotentna)**

```js
const { getSupabase } = require('./lib/ingest-core.js');

(async () => {
  const supabase = getSupabase();
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();
  if (listError) throw listError;
  if (buckets.some((b) => b.name === 'product-documents')) {
    console.log('✅ Bucket product-documents već postoji.');
    return;
  }
  const { error } = await supabase.storage.createBucket('product-documents', { public: true });
  if (error) throw error;
  console.log('✅ Kreiran javni bucket product-documents.');
})().catch((err) => { console.error('❌', err.message); process.exit(1); });
```

- [ ] **Step 2: Pokreni i verifikuj round-trip**

Run: `node tools/create_product_documents_bucket.js` → Expected: `✅ Kreiran...` (ili `već postoji` pri ponovnom pokretanju).

Zatim round-trip proba (upload → GET → obriši):
```bash
node -e "const c=require('./tools/lib/ingest-core.js');(async()=>{const s=c.getSupabase();const url=await c.uploadToBucket(s,'product-documents','_smoke/test.pdf',Buffer.from('%PDF-1.4 smoke'),{cacheBust:false});const res=await fetch(url);console.log('GET',res.status);const {error}=await s.storage.from('product-documents').remove(['_smoke/test.pdf']);console.log('cleanup',error?error.message:'ok');})()"
```
Expected: `GET 200`, `cleanup ok`.

- [ ] **Step 3: Commit**

```bash
git add tools/create_product_documents_bucket.js
git commit -m "feat(ingest): product-documents bucket (javni read)"
```

---

### Task 4: Tarkett core extractor (obnova osnove) — kraj S1

**Files:**
- Create: `tools/extract_tarkett_core.js`

- [ ] **Step 1: Implementiraj minimalni extractor**

Cilj S1: dokazano čitanje JEDNE kolekcije sa tarkett.rs u format kompatibilan sa `tarkett_vinyl_home_colors.json` (referenca: repo-pack.md §10). Piše u `output/`, NE dira `public/data/`.

```js
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

// Minimalna obnova obrisanih extract_tarkett_* skripti (runbook §1).
// Upotreba: node tools/extract_tarkett_core.js <kolekcija-URL>
// Primer:   node tools/extract_tarkett_core.js https://www.tarkett.rs/sr_RS/kolekcija-C002929-bold

(async () => {
  const url = process.argv[2];
  if (!url || !url.includes('tarkett.rs')) {
    console.error('Upotreba: node tools/extract_tarkett_core.js <https://www.tarkett.rs/sr_RS/kolekcija-...>');
    process.exit(2);
  }

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });

  const nuxt = await page.evaluate(() => (window.__NUXT__ ? JSON.parse(JSON.stringify(window.__NUXT__)) : null));
  let payload = null;
  if (nuxt) {
    const stack = [nuxt];
    while (stack.length) {
      const node = stack.pop();
      if (!node || typeof node !== 'object') continue;
      if (node.collection && node.collection.name && Array.isArray(node.products || node.colors || node.items)) {
        payload = node; break;
      }
      if (Array.isArray(node)) { stack.push(...node); continue; }
      for (const key of Object.keys(node)) {
        if (key === 'collection' && node[key]?.name) { payload = node; }
        stack.push(node[key]);
      }
      if (payload) break;
    }
  }

  // Fallback: json-collection-product skripta u DOM-u (obrazac iz README za homogeni/heterogeni)
  if (!payload) {
    payload = await page.evaluate(() => {
      const el = document.querySelector('script[type="application/json"][data-json="collection-product"], #json-collection-product');
      return el ? JSON.parse(el.textContent) : null;
    });
  }

  await browser.close();

  if (!payload) {
    console.error('❌ Nije pronađen __NUXT__/json-collection-product payload. Stranica možda zahteva drugačiji selektor — vidi .agent/workflows/extractor-refresh-rollback-runbook.md');
    process.exit(1);
  }

  const outDir = path.join(process.cwd(), 'output');
  fs.mkdirSync(outDir, { recursive: true });
  const slug = url.split('/').pop().replace(/[^a-z0-9-]/gi, '-');
  const outPath = path.join(outDir, `tarkett-core-${slug}.json`);
  fs.writeFileSync(outPath, JSON.stringify(payload, null, 2), 'utf8');
  console.log(`✅ Payload sačuvan: ${outPath}`);
  console.log('Top-level ključevi:', Object.keys(payload).slice(0, 20).join(', '));
})().catch((err) => { console.error('❌', err.message); process.exit(1); });
```

- [ ] **Step 2: Dokaži na živoj kolekciji**

Run: `node tools/extract_tarkett_core.js https://www.tarkett.rs/sr_RS/kolekcija-C002929-bold`
Expected: `✅ Payload sačuvan: output/tarkett-core-kolekcija-C002929-bold.json`. Otvori fajl i potvrdi da sadrži naziv kolekcije „Bold" i listu boja/proizvoda (poklapanje sa `public/data/tarkett_vinyl_home_colors.json` kolekcijom `tarkett-bold`: 10 boja). Ako selektori ne pogode payload, prilagodi traversal i ZABELEŽI nalaz u runbook (Task 9) — ovo je istraživačko-obnovni alat.

- [ ] **Step 3: Commit (S1 gotov)**

```bash
git add tools/extract_tarkett_core.js
git commit -m "feat(ingest): tarkett core extractor — obnova osnove za citanje kolekcija (S1)"
```

---

### Task 5: Loader — nova polja sa fallback-om

**Files:**
- Modify: `lib/utils/productDataLoader.ts` (COVER_SLUGS ~44–67; getVinylCollectionProducts ~2012–2080)

Izmene su unapred kompatibilne: pre punog run-a polja ne postoje u JSON-u pa se ponašanje ne menja (postojeći snapshot testovi to dokazuju).

- [ ] **Step 1: Dodaj `taralay-millenium-acoustic` u COVER_SLUGS**

OLD (verbatim, deo seta — jedinstven):
```ts
    'taralay-initial-compact',
    'taralay-millenium-compact',
]);
```
NEW:
```ts
    'taralay-initial-compact',
    'taralay-millenium-acoustic',
    'taralay-millenium-compact',
]);
```

- [ ] **Step 2: Hero prioritet + dokumenti + room scene u `getVinylCollectionProducts`**

PAŽNJA: `const collectionImageOverrides...` header linija NIJE jedinstvena u fajlu (ista mapa postoji u ESD funkciji, linija ~2478) — OLD stringovi ispod su jedinstveni jer obuhvataju okolni kod.

Izmena A — hero prioritet. OLD (verbatim):
```ts
        const imageUrl = selectPreferredCollectionHeroAsset(
            collectionImageOverrides[col.slug],
            localCollectionCover,
            firstColor?.image
        );
```
NEW:
```ts
        const imageUrl = selectPreferredCollectionHeroAsset(
            col.collection_image_url,
            collectionImageOverrides[col.slug],
            localCollectionCover,
            firstColor?.image
        );
```

Izmena B — slike (room scene) + dokumenti. OLD (verbatim):
```ts
            images: imageUrl ? [{
                id: `vinyl-coll-${col.slug}-img`,
                url: imageUrl,
                alt: col.name,
                isPrimary: true,
                order: 0,
            }] : [],
            specs,
            externalLink: col.url || firstColor?.href,
```
NEW:
```ts
            images: [
                ...(imageUrl ? [{
                    id: `vinyl-coll-${col.slug}-img`,
                    url: imageUrl,
                    alt: col.name,
                    isPrimary: true,
                    order: 0,
                }] : []),
                ...(Array.isArray(col.room_scene_images) ? col.room_scene_images : [])
                    .filter((sceneUrl: string) => sceneUrl && sceneUrl !== imageUrl)
                    .map((sceneUrl: string, sceneIndex: number) => ({
                        id: `vinyl-coll-${col.slug}-room-${sceneIndex + 1}`,
                        url: sceneUrl,
                        alt: `${col.name} — ambijent ${sceneIndex + 1}`,
                        isPrimary: false,
                        order: sceneIndex + 1,
                    })),
            ],
            specs,
            documents: Array.isArray(col.documents) && col.documents.length > 0 ? col.documents : undefined,
            externalLink: col.url || firstColor?.href,
```

- [ ] **Step 3: Verifikacija bez novih podataka**

Run: `npm run test:contract` → Expected: svi prolaze, snapshotovi NEPROMENJENI (polja još ne postoje u JSON-u → identično ponašanje; jedini dozvoljeni snapshot diff bio bi hero za `taralay-millenium-acoustic` ako snapshot pokriva tu kolekciju — ako se pojavi, pregledaj i prihvati sa `npm run test:contract:update` uz obrazloženje u commit poruci).
Run: `npm run build` → Expected: uspešan.

- [ ] **Step 4: Commit**

```bash
git add lib/utils/productDataLoader.ts
git commit -m "feat(vinil): loader cita collection_image_url, documents i room_scene_images sa fallback-om"
```

---

### Task 6: Ingest orkestracija (`tools/ingest_gerflor_cee.js`)

**Files:**
- Create: `tools/ingest_gerflor_cee.js`

- [ ] **Step 1: Implementiraj skriptu**

Flagovi: `--dry-run` (bez download/upload/upisa), `--collection=<naš-slug>` (može više puta), `--skip-existing` (preskoči boje koje već imaju Supabase URL — za resume).

```js
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const core = require('./lib/ingest-core.js');
const parse = require('./lib/gerflor-parse.js');

const JSON_PATH = path.join(process.cwd(), 'public', 'data', 'vinyl_colors_complete.json');
const IMAGES_BUCKET = 'product-images';
const DOCS_BUCKET = 'product-documents';
const MIN_DECOR_WIDTH = 800;

function parseArgs() {
  const args = { dryRun: false, collections: [], skipExisting: false };
  for (const a of process.argv.slice(2)) {
    if (a === '--dry-run') args.dryRun = true;
    else if (a === '--skip-existing') args.skipExisting = true;
    else if (a.startsWith('--collection=')) args.collections.push(a.split('=')[1]);
  }
  return args;
}

function colorKeyFromOurColor(color) {
  // Standardno mapiranje: po šifri; izuzeci (bez šifre) po imenu
  return color.code ? `code:${color.code}` : `name:${core.slugify(color.name)}`;
}

function colorKeyFromVariation(variation) {
  return variation.code ? `code:${variation.code}` : `name:${variation.nameSlug}`;
}

async function uploadImageChecked(supabase, storagePath, buffer, label) {
  const meta = await sharp(buffer).metadata();
  if (!meta.width || meta.width < MIN_DECOR_WIDTH) {
    throw new Error(`${label}: slika ${meta.width || '?'}px < ${MIN_DECOR_WIDTH}px`);
  }
  return core.uploadToBucket(supabase, IMAGES_BUCKET, storagePath, buffer);
}

(async () => {
  const args = parseArgs();
  const manifest = core.loadManifest('ingest-gerflor-cee');
  const supabase = args.dryRun ? null : core.getSupabase();

  const data = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'));
  const targets = data.collections.filter((c) =>
    args.collections.length === 0 || args.collections.includes(c.slug)
  );

  console.log(`🎯 Kolekcija za obradu: ${targets.length}${args.dryRun ? ' (DRY-RUN)' : ''}`);

  // 1) Sitemap → mapa CEE slug → varijacije
  const sitemapXml = await core.fetchPage(`${parse.PUBLIC_HOST}/sitemap.xml`);
  const locs = parse.parseSitemapLocs(sitemapXml);
  const ceeSlugs = Object.values(parse.CEE_SLUG_BY_OUR_SLUG).filter(Boolean);
  const variationsByCee = new Map();
  for (const loc of locs) {
    const m = loc.match(/\/products\/([a-z0-9-]+)$/);
    if (!m) continue;
    const cls = parse.classifyProductPath(m[1], ceeSlugs);
    if (cls?.type === 'variation') {
      if (!variationsByCee.has(cls.ceeSlug)) variationsByCee.set(cls.ceeSlug, []);
      variationsByCee.get(cls.ceeSlug).push({ ...cls, url: loc });
    }
  }
  console.log(`🗺️  Sitemap: ${locs.length} URL-ova; varijacija za naše kolekcije: ${[...variationsByCee.values()].reduce((a, v) => a + v.length, 0)}`);

  const summary = [];

  for (const col of targets) {
    const ceeSlug = parse.CEE_SLUG_BY_OUR_SLUG[col.slug];
    if (ceeSlug === undefined) {
      console.log(`⚠️  ${col.slug}: nije u mapiranju — preskačem`);
      continue;
    }
    if (ceeSlug === null) {
      console.log(`⚠️  ${col.slug}: ne postoji na CEE (povučena?) — preskačem, podaci ostaju`);
      manifest.record(`collection:${col.slug}`, { status: 'missing-upstream' });
      continue;
    }

    console.log(`\n📂 ${col.name} (${col.slug} → ${ceeSlug})`);
    const pageHtml = await core.fetchPage(`${parse.PUBLIC_HOST}/products/${ceeSlug}`);

    // 2a) Dokumenti
    const rawDocs = parse.parseDocumentLinks(pageHtml);
    const documents = [];
    const seenTitles = new Set();
    for (const doc of rawDocs) {
      const title = parse.mapDocumentTitle(doc.name, doc.category);
      if (seenTitles.has(title + doc.url)) continue;
      seenTitles.add(title + doc.url);
      documents.push({ title, sourceUrl: parse.encodeAssetUrl(doc.url) });
    }

    // 2b) Ambijentalne slike (hero slider kolekcije)
    const slides = parse.parseHeroSlides(pageHtml);

    // 2c) Spec tabela + opis (informativno; ne prepisuje postojeće srpske opise)
    const specs = parse.parseSpecTables(pageHtml);
    const colorCount = parse.parseColorCount(pageHtml);

    // 3) Varijacije → mapiranje na naše boje
    const variations = variationsByCee.get(ceeSlug) || [];
    const ourColorByKey = new Map(col.colors.map((c) => [colorKeyFromOurColor(c), c]));
    let matched = 0;
    const unmatchedUpstream = [];
    for (const variation of variations) {
      if (!ourColorByKey.has(colorKeyFromVariation(variation))) unmatchedUpstream.push(variation);
    }

    console.log(`   📄 dokumenta: ${documents.length} | 🖼️ ambijent: ${slides.length} | 🎨 CEE varijacija: ${variations.length} (header kaže ${colorCount ?? '?'}) vs naših boja: ${col.colors.length} | novih upstream: ${unmatchedUpstream.length} | spec polja: ${Object.keys(specs).length}`);

    if (args.dryRun) {
      summary.push({ slug: col.slug, documents: documents.length, scenes: slides.length, variations: variations.length, ours: col.colors.length, newUpstream: unmatchedUpstream.length });
      continue;
    }

    // 4) Upload dokumenata
    const uploadedDocs = [];
    for (const doc of documents) {
      const manifestKey = `doc:${doc.sourceUrl}`;
      if (manifest.has(manifestKey)) {
        uploadedDocs.push({ title: doc.title, url: manifest.get(manifestKey).publicUrl, type: 'pdf' });
        continue;
      }
      try {
        const buffer = await core.downloadAsset(doc.sourceUrl);
        if (!buffer.slice(0, 5).toString().startsWith('%PDF')) throw new Error('nije PDF');
        const fileName = `${core.slugify(doc.title)}-${doc.sourceUrl.match(/media\/2\/(\d+)\//)?.[1] || 'x'}.pdf`;
        const publicUrl = await core.uploadToBucket(supabase, DOCS_BUCKET, `products/vinil/${col.slug}/${fileName}`, buffer);
        uploadedDocs.push({ title: doc.title, url: publicUrl, type: 'pdf' });
        manifest.record(manifestKey, { publicUrl, collection: col.slug });
      } catch (err) {
        console.log(`   ⚠️ dokument "${doc.title}": ${err.message}`);
      }
    }

    // 5) Upload ambijentalnih slika
    const sceneUrls = [];
    for (let i = 0; i < slides.length; i++) {
      const manifestKey = `scene:${slides[i].src}`;
      if (manifest.has(manifestKey)) { sceneUrls.push(manifest.get(manifestKey).publicUrl); continue; }
      try {
        const buffer = await core.downloadAsset(slides[i].src);
        const publicUrl = await uploadImageChecked(supabase, `products/vinil/${col.slug}/ambience/scena-${i + 1}.jpg`, buffer, `${col.slug} scena ${i + 1}`);
        sceneUrls.push(publicUrl);
        manifest.record(manifestKey, { publicUrl, collection: col.slug });
      } catch (err) {
        console.log(`   ⚠️ scena ${i + 1}: ${err.message}`);
      }
    }

    // 6) Dekor slike po boji (stranica varijacije → hero 1500px)
    for (const variation of variations) {
      const ourColor = ourColorByKey.get(colorKeyFromVariation(variation));
      if (!ourColor) continue; // nova upstream boja — obrađeno u koraku 7
      if (args.skipExisting && /supabase\.co/.test(ourColor.image || '')) { matched++; continue; }
      const manifestKey = `decor:${variation.url}`;
      let publicUrl = manifest.get(manifestKey)?.publicUrl;
      if (!publicUrl) {
        try {
          const varHtml = await core.fetchPage(variation.url);
          const hero = parse.parseHeroSlides(varHtml)[0];
          if (!hero) throw new Error('hero slika nije nađena');
          const buffer = await core.downloadAsset(hero.src);
          const fileBase = ourColor.code ? `${ourColor.code}-${core.slugify(ourColor.name)}` : core.slugify(ourColor.name);
          publicUrl = await uploadImageChecked(supabase, `products/vinil/${col.slug}/decor/${fileBase}.jpg`, buffer, `${col.slug}/${fileBase}`);
          manifest.record(manifestKey, { publicUrl, collection: col.slug });
        } catch (err) {
          console.log(`   ⚠️ dekor ${variation.code || variation.nameSlug}: ${err.message} — zadržavam postojeću sliku`);
          continue;
        }
      }
      ourColor.image = publicUrl;
      matched++;
    }

    // 7) Nove upstream boje koje nemamo → dodaj (nasleđuju opis/karakteristike kolekcije)
    for (const variation of unmatchedUpstream) {
      const manifestKey = `decor:${variation.url}`;
      let publicUrl = manifest.get(manifestKey)?.publicUrl;
      let displayName = variation.nameSlug.replace(/-/g, ' ').toUpperCase();
      try {
        if (!publicUrl) {
          const varHtml = await core.fetchPage(variation.url);
          const h1 = varHtml.match(/<h1>([^<]+)<\/h1>/);
          if (h1) displayName = parse.decodeEntities(h1[1]).replace(/^\d{4}\s+/, '');
          const hero = parse.parseHeroSlides(varHtml)[0];
          if (!hero) throw new Error('hero slika nije nađena');
          const buffer = await core.downloadAsset(hero.src);
          const fileBase = variation.code ? `${variation.code}-${variation.nameSlug}` : variation.nameSlug;
          publicUrl = await uploadImageChecked(supabase, `products/vinil/${col.slug}/decor/${fileBase}.jpg`, buffer, `${col.slug}/${fileBase}`);
          manifest.record(manifestKey, { publicUrl, collection: col.slug, addedAsNew: true });
        }
        col.colors.push({
          code: variation.code || '',
          name: displayName,
          sku: variation.sku,
          href: variation.url,
          collection_slug: col.slug,
          image: publicUrl,
          description: col.description || '',
          characteristics: col.characteristics || {},
        });
        console.log(`   ➕ nova boja: ${variation.code || ''} ${displayName}`);
      } catch (err) {
        console.log(`   ⚠️ nova boja ${variation.nameSlug}: ${err.message}`);
      }
    }
    col.colorCount = col.colors.length;

    // 8) Upis polja kolekcije
    if (uploadedDocs.length > 0) col.documents = uploadedDocs;
    if (sceneUrls.length > 0) {
      col.collection_image_url = sceneUrls[0];
      col.room_scene_images = sceneUrls.slice(1);
    }

    manifest.record(`collection:${col.slug}`, {
      status: 'ok', documents: uploadedDocs.length, scenes: sceneUrls.length,
      decorMatched: matched, decorTotalOurs: col.colors.length, specFields: Object.keys(specs).length,
    });
    manifest.save();
    summary.push({ slug: col.slug, documents: uploadedDocs.length, scenes: sceneUrls.length, matched, ours: col.colors.length });
  }

  if (!args.dryRun) {
    data.totalColors = data.collections.reduce((a, c) => a + (c.colors?.length || 0), 0);
    data.generatedAt = new Date().toISOString();
    core.writeJsonWithBackup(JSON_PATH, data, 'vinyl-colors-complete');
    manifest.save();
  }

  console.log('\n===== REZIME =====');
  for (const row of summary) console.log(JSON.stringify(row));
})().catch((err) => { console.error('❌', err); process.exit(1); });
```

- [ ] **Step 2: Dry-run preko svih 25 kolekcija**

Run: `node tools/ingest_gerflor_cee.js --dry-run` (traje ~30s — 1 GET po kolekciji + sitemap)
Expected: za svaku kolekciju red sa brojevima; `mipolam-elegance` preskočen sa porukom; broj CEE varijacija približno jednak našem broju boja (odstupanja su nove/povučene boje — to je u redu); dokumenta tipično 15–30; ambijent 2–4. NIŠTA nije pisano (nema backup poruke).

- [ ] **Step 3: Commit**

```bash
git add tools/ingest_gerflor_cee.js
git commit -m "feat(ingest): gerflor-cee ingest skripta (dry-run verifikovan na 25 kolekcija)"
```

---

### Task 7: Pilot — 2 kolekcije + vizuelna provera

- [ ] **Step 1: Pilot run**

Run: `node tools/ingest_gerflor_cee.js --collection=taralay-impression-compact --collection=mipolam-classic-2mm`
(Trajanje: ~95+14 boja × ~1.1s + asseti ≈ 4–6 min.)
Expected: backup u `output/`, manifest popunjen, rezime sa `documents>0`, `scenes>=2`, `matched` blizu broja boja. JSON diff (`git diff --stat public/data/vinyl_colors_complete.json`) pokazuje izmene SAMO u te 2 kolekcije + `totalColors`/`generatedAt`.

- [ ] **Step 2: Validacije**

Run: `npm run test:contract` → zeleno (snapshotovi koji pokrivaju te kolekcije možda se menjaju — pregledaj diff: nove Supabase URL-ove prihvati sa `test:contract:update`).
Run: `npm run build` → zeleno (validate-images proverava lokalne putanje — Supabase URL-ovi se preskaču).

- [ ] **Step 3: Vizuelna provera**

Run: `npm run dev` pa otvori `/proizvodi/gerflor-taralay-impression-compact` i `/proizvodi/gerflor-mipolam-classic-2mm` (1440px i 390px):
1. Galerija: prva slika hero (ambijent), strelicama do room-scene slika („— ambijent N" alt).
2. Sekcija „Dokumentacija" se pojavila; klik na „Preuzmi" otvara PDF sa `supabase.co/storage/v1/object/public/product-documents/...`.
3. Boje u mreži imaju oštrije slike (1500px sa Supabase), klik i dalje menja sliku.
4. Nijedan novi link ne vodi na `gerflor-cee.com`/`cdn.gerflor.com` (proveri u DevTools Network pri učitavanju stranice).

- [ ] **Step 4: Commit pilota**

```bash
git add public/data/vinyl_colors_complete.json
git commit -m "data(vinil): pilot ingest — taralay-impression-compact + mipolam-classic-2mm (dokumenta, ambijent, 1500px dekor)"
```

---

### Task 8: Pun run — svih 25 kolekcija + data contract test

- [ ] **Step 1: Pun run**

Run: `node tools/ingest_gerflor_cee.js --skip-existing`
(Trajanje: ~939 boja × ~1.1s za stranice varijacija + asseti ≈ 30–45 min; manifest omogućava resume ako pukne — samo ponovi komandu.)
Expected: rezime za 24 kolekcije (Elegance preskočen); bez neobrađenih grešaka. Proveri u logu ukupan broj `➕ nova boja` (očekivano: malo, npr. novi Libertex/Initial dekori).

- [ ] **Step 2: Data contract test**

Create `tests/contracts/gerflor-vinyl-data-contract.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import vinylData from '@/public/data/vinyl_colors_complete.json';

const SUPABASE_PREFIX = 'https://nnjmrfwepylrheykalik.supabase.co/storage/v1/object/public/';
const UPSTREAM_HOSTS = /gerflor-cee\.com|cdn\.gerflor\.com|prod-peco\.gerflor\.io/;
// Elegance je povučena kod proizvođača — jedina bez upstream obogaćivanja.
const EXEMPT = new Set(['mipolam-elegance']);

describe('Gerflor vinyl enrichment data contract', () => {
  const collections = (vinylData as any).collections as any[];

  it('has 25 collections', () => {
    expect(collections).toHaveLength(25);
  });

  it.each(collections.filter((c) => !EXEMPT.has(c.slug)).map((c) => [c.slug, c]))(
    '%s: dokumenta + ambijent + Supabase asseti',
    (_slug, col: any) => {
      expect(Array.isArray(col.documents) && col.documents.length > 0).toBe(true);
      for (const doc of col.documents) {
        expect(doc.title).toBeTruthy();
        expect(doc.url.startsWith(SUPABASE_PREFIX + 'product-documents/')).toBe(true);
      }
      expect(typeof col.collection_image_url).toBe('string');
      expect(col.collection_image_url.startsWith(SUPABASE_PREFIX + 'product-images/')).toBe(true);
      expect(Array.isArray(col.room_scene_images)).toBe(true);
    }
  );

  it('nijedan asset URL ne pokazuje na gerflor servere', () => {
    for (const col of collections) {
      for (const doc of col.documents || []) expect(doc.url).not.toMatch(UPSTREAM_HOSTS);
      expect(col.collection_image_url || '').not.toMatch(UPSTREAM_HOSTS);
      for (const scene of col.room_scene_images || []) expect(scene).not.toMatch(UPSTREAM_HOSTS);
      for (const color of col.colors || []) {
        // href (externalLink ka STRANICI proizvođača) sme; image NE sme
        expect(color.image || '').not.toMatch(UPSTREAM_HOSTS);
      }
    }
  });

  it('colorCount je usklađen sa colors.length', () => {
    for (const col of collections) expect(col.colorCount).toBe(col.colors.length);
  });
});
```

Run: `npm run test:contract` → Expected: PASS (ako neka kolekcija padne, pogledaj manifest/log za nju, ponovi run za tu kolekciju sa `--collection=<slug>`).

- [ ] **Step 3: Pune validacije**

```bash
npx tsx scripts/audit-catalog-quality.ts
npm run test:contract
npm run build
```
Expected: sve zeleno; audit izveštaj u `output/catalog-quality-audit.json` pokazuje rast pokrivenosti dokumenata za vinil.

- [ ] **Step 4: Vizuelni spot-check**

`npm run dev` → 3 nasumične kolekcije (jedna Nerok, jedna Mipolam, jedna Taralay) — galerija/dokumenta/boje kao u Tasku 7 Step 3.

- [ ] **Step 5: Commit**

```bash
git add public/data/vinyl_colors_complete.json tests/contracts/gerflor-vinyl-data-contract.test.ts
git commit -m "data(vinil): pun gerflor-cee ingest — 24 kolekcije (PDF, room-scene, 1500px) + data contract"
```

---

### Task 9: Dokumentacija + završna verifikacija

**Files:**
- Modify: `.agent/workflows/extractor-refresh-rollback-runbook.md`
- Modify: `AGENTS.md` (sekcija o data izvorima)

- [ ] **Step 1: Runbook**

U tabelu skripti (sekcija „## 1) Scope i vlasništvo") dodaj redove i ukloni/označi obrisane:

```
| `tools/ingest_gerflor_cee.js` | `public/data/vinyl_colors_complete.json` + Supabase `product-images`/`product-documents` | Gerflor CEE vinil — dokumenta, ambijent, 1500px dekor; `--dry-run`, `--collection=`, `--skip-existing`; manifest u `output/ingest-gerflor-cee-manifest.json` |
| `tools/extract_tarkett_core.js` | `output/tarkett-core-*.json` | Obnovljena osnova za čitanje tarkett.rs kolekcija (S1); puni refresh alati se obnavljaju po segmentima Faze 2 |
```

Iznad tabele dodaj napomenu: „NAPOMENA (2026-06-13): originalnih 7 extract skripti je obrisano iz repoa; obnova ide kroz Fazu 2 (spec `docs/superpowers/specs/2026-06-13-faza-2-podaci-master-s1-s2-design.md`). Stare komande u sekciji 3 su istorijske dok se alati ne obnove."

- [ ] **Step 2: AGENTS.md**

U sekciju o katalogu podataka dodaj (pored postojećih opisa izvora): „`tools/ingest_gerflor_cee.js` obogaćuje Gerflor vinil kolekcije u `vinyl_colors_complete.json` assetima u NAŠEM Supabase storage-u (bucket `product-images` za slike, `product-documents` za PDF; direktiva: nijedan asset se ne hotlinkuje sa sajtova proizvođača). Polja: `collection_image_url`, `documents[]`, `room_scene_images[]` po kolekciji; `colors[].image` → Supabase 1500px. Manifest/backup u `output/`."

- [ ] **Step 3: Završna verifikacija + commit**

```bash
npm run test:contract && npm run build
git add .agent/workflows/extractor-refresh-rollback-runbook.md AGENTS.md
git commit -m "docs(ingest): runbook + AGENTS za gerflor ingest i obnovu extractora"
```

Merge/push odluka ide vlasniku (push na main = produkcijski deploy).
