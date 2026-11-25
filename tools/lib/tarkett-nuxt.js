// Čitanje tarkett.rs Nuxt payload-a iz Playwright stranice — jedino mesto za sve Tarkett alate.
// Nuxt 2 = window.__NUXT__ (sa state); Nuxt 3 (tarkett.rs od ~11/2026) = devalue niz u
// <script id="__NUXT_DATA__"> → parse.unflattenNuxtData (kolekcija u pinia.collectionProduct.item).
const core = require('./ingest-core.js');
const parse = require('./tarkett-parse.js');

// Payload sa već učitane stranice, ili null.
async function readNuxtPayload(page) {
  const res = await page.evaluate(() => {
    let n = window.__NUXT__;
    if (typeof n === 'function') { try { n = n(); } catch (_) { n = null; } }
    if (n && n.state) { try { return { nuxt2: JSON.parse(JSON.stringify(n)) }; } catch (_) { /* pada na Nuxt 3 */ } }
    const el = document.getElementById('__NUXT_DATA__');
    return { nuxt3: el ? el.textContent : null };
  });
  if (res.nuxt2) return res.nuxt2;
  return res.nuxt3 ? parse.unflattenNuxtData(JSON.parse(res.nuxt3)) : null;
}

// Otvori kolekcijsku stranicu u novoj kartici. finalUrl/status služe za prepoznavanje preusmerenih (mrtvih) kolekcija.
async function fetchNuxt(browser, url) {
  const page = await browser.newPage({ userAgent: core.BROWSER_HEADERS['User-Agent'] });
  try {
    const response = await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
    return { nuxt: await readNuxtPayload(page), finalUrl: page.url(), status: response ? response.status() : 0 };
  } finally {
    await page.close();
  }
}

module.exports = { readNuxtPayload, fetchNuxt };
