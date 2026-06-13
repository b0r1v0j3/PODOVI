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

  const nuxt = await page.evaluate(() => {
    let n = window.__NUXT__;
    if (typeof n === 'function') { try { n = n(); } catch (_) { n = null; } }
    if (!n) return null;
    try { return JSON.parse(JSON.stringify(n)); } catch (_) { return null; }
  });
  let payload = null;
  if (nuxt) {
    // Primarno: Nuxt 2 shape na tarkett.rs -> state.collectionProductPage.item
    // (flat `collection_*` polja + `designs` lista boja). Vidi runbook §1.
    const direct = nuxt.state?.collectionProductPage?.item;
    if (direct && (direct.collection_name || direct.collection_name_slug) && Array.isArray(direct.designs)) {
      payload = direct;
    }

    // Fallback traversal: pronađi bilo koji čvor sa imenom kolekcije + listom boja/proizvoda.
    // Podržava i stari pretpostavljeni oblik (node.collection.name) i ravan oblik (collection_name + designs).
    if (!payload) {
      const stack = [nuxt];
      while (stack.length) {
        const node = stack.pop();
        if (!node || typeof node !== 'object') continue;
        const colArr = node.designs || node.products || node.colors || node.items;
        const name = node.collection_name || node.collection?.name;
        if (name && Array.isArray(colArr) && colArr.length) {
          payload = node; break;
        }
        if (Array.isArray(node)) { stack.push(...node); continue; }
        for (const key of Object.keys(node)) stack.push(node[key]);
      }
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
  const collName = payload.collection_name || payload.collection?.name || '(nepoznato)';
  const colorArr = payload.designs || payload.products || payload.colors || payload.items;
  const colorCount = Array.isArray(colorArr) ? colorArr.length : 0;
  console.log(`✅ Payload sačuvan: ${outPath}`);
  console.log(`Kolekcija: ${collName} — boja/proizvoda: ${colorCount}`);
  console.log('Top-level ključevi:', Object.keys(payload).slice(0, 20).join(', '));
})().catch((err) => { console.error('❌', err.message); process.exit(1); });
