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

// Kolekcioni CEE slug -> prefiks koji varijacioni URL-ovi stvarno koriste
// (npr. kolekcija je `taralay-initial-acoustic-0`, ali boje su `/products/taralay-initial-acoustic-...`).
const VARIATION_PREFIX_ALIASES = {
  'taralay-initial-acoustic-0': 'taralay-initial-acoustic',
};

// Kolekcije čije varijacije nemaju {code}-{sku} u URL-u — jedini dozvoljeni code-less izuzeci.
const CODELESS_VARIATION_CEE_SLUGS = new Set([
  'taralay-initial-acoustic-0',
  'taralay-initial-compact-new',
  'taralay-impression-hop-acoustic',
]);

// path = slug deo URL-a posle /products/
function classifyProductPath(pathSlug, ceeSlugs) {
  // 1) Tačno poklapanje = kolekciona stranica (pre varijacionog matchinga,
  // da npr. `taralay-initial-acoustic-0` ne upadne kao varijacija alias prefiksa).
  for (const ceeSlug of ceeSlugs) {
    if (pathSlug === ceeSlug) return { type: 'collection', ceeSlug };
  }
  // 2) Kandidati za prefiks: sopstveni slug + eventualni alias; najduži prefiks prvi.
  const candidates = [];
  for (const ceeSlug of ceeSlugs) {
    candidates.push({ prefix: ceeSlug, ceeSlug });
    const alias = VARIATION_PREFIX_ALIASES[ceeSlug];
    if (alias) candidates.push({ prefix: alias, ceeSlug });
  }
  candidates.sort((a, b) => b.prefix.length - a.prefix.length);
  for (const { prefix, ceeSlug } of candidates) {
    if (!pathSlug.startsWith(prefix + '-')) continue;
    const rest = pathSlug.slice(prefix.length + 1);
    const standard = rest.match(/^(\d{4})-([a-z0-9-]+)-([a-z]{0,2}\d{6,8})$/);
    if (standard) {
      return { type: 'variation', ceeSlug, code: standard[1], nameSlug: standard[2], sku: standard[3] };
    }
    // Izuzeci bez šifre/SKU — samo za poznate kolekcije; sve ostalo su nepoznate pod-stranice.
    if (CODELESS_VARIATION_CEE_SLUGS.has(ceeSlug)) {
      return { type: 'variation', ceeSlug, code: null, nameSlug: rest, sku: null };
    }
    return null;
  }
  return null;
}

function decodeEntities(s) {
  // &amp; se dekodira POSLEDNJI (da &amp;quot; ne postane " duplim dekodiranjem);
  // &nbsp; -> običan razmak pre sažimanja whitespace-a.
  return String(s || '')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#0?39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ').trim();
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
    const linkRe = /<a [^>]*?href="(https:\/\/cdn\.gerflor\.com\/[^"]+?\.pdf(?:\?[^"]*)?)"[^>]*>([\s\S]*?)<\/a>/gi;
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
    const resRe = /class="res-link js-file-download"[^>]*?href="(https:\/\/cdn\.gerflor\.com\/[^"]+?\.pdf(?:\?[^"]*)?)"[\s\S]*?<span class="res-info">([\s\S]*?)<\/span>/gi;
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
  VARIATION_PREFIX_ALIASES,
  CODELESS_VARIATION_CEE_SLUGS,
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
