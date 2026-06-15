// Čiste funkcije za migraciju Tarkett hotlinkova. Bez mreže/FS.
const TARKETT_HOST = 'media.tarkett-image.com';

// URL-ovi za mrežu (download/HEAD) — percent-enkoduj razmake i ostale nesigurne
// znakove. `clean`/`basename`/`xxlUrl` ostaju literalni (= ključ za rewrite u JSON-u),
// a `*Fetch` varijante su bezbedne za fetch(). encodeURI ne dira već-validan URL.
function encodeFetchUrl(url) {
  // Ne re-enkoduj već enkodovane sekvence (npr. %20) — dekoduj pa enkoduj idempotentno.
  try {
    return encodeURI(decodeURI(String(url || '')));
  } catch {
    return encodeURI(String(url || ''));
  }
}

// Izvor za fetch generisanih dokumenata: media.tarkett-image.com/docs/<locale>/pdf/... vraća
// 403 (Akamai), ali isti put na www.tarkett.rs radi (specifications → PDF; format-table → JSON).
// Samo te /docs/<locale>/pdf/ endpoint-e rerutiramo; obični /docs/<fajl>.pdf ostaju na media.
function fetchSourceUrl(clean) {
  const m = String(clean || '').match(/^https:\/\/media\.tarkett-image\.com\/docs\/([a-z]{2}_[A-Z]{2}\/pdf\/.+)$/);
  return m ? `https://www.tarkett.rs/${m[1]}` : String(clean || '');
}

// Klasifikuj Tarkett URL: image (sa XXL transformacijom + fallback), pdf, ili other.
function classifyTarkettUrl(url) {
  const clean = String(url || '').split('?')[0];
  const basename = clean.split('/').pop() || '';
  if (/\/docs\//.test(clean) || /\.pdf$/i.test(basename)) {
    return { type: 'pdf', clean, basename, cleanFetch: encodeFetchUrl(fetchSourceUrl(clean)) };
  }
  if (/\.(jpe?g|png|webp)$/i.test(basename)) {
    // size segment (/large/, /medium/, /XL/, /large-high/) -> /XXL/ (1920px); fallback = original
    const xxlUrl = clean.replace(/\/(large-high|large|medium|XL)\//, '/XXL/');
    return {
      type: 'image',
      clean,
      basename,
      xxlUrl,
      fallbackUrl: clean,
      xxlFetch: encodeFetchUrl(xxlUrl),
      fallbackFetch: encodeFetchUrl(clean),
    };
  }
  return { type: 'other', clean, basename };
}

// Izvuci jedinstvene pune media.tarkett-image.com URL-ove iz JSON stringa.
// Hvata ceo literal sve do navodnika/backslash-a (uključujući razmake u putanji,
// npr. "/large/IN_iD Tilt HIT.jpg"). Razmaci se ne smeju isključiti iz klase znakova
// jer bi se URL prekinuo i pravi hotlink ostao u produkcijskom JSON-u.
function extractTarkettUrls(jsonString) {
  const re = /https:\/\/media\.tarkett-image\.com\/[^"'\\]+/g;
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

// Ima li basename pravu ekstenziju fajla (2–5 alfanum znakova posle tačke)?
function hasExtension(basename) {
  return /\.[a-z0-9]{2,5}$/i.test(String(basename || ''));
}

// Izvedi JEDINSTVENU storage putanju za asset. Kritično za bez-ekstenzije Tarkett
// dokumente (/docs/.../specifications, .../format-table): basename je deljen pa bi se
// SVI sudarili u jednu putanju i upsert:true bi servirao pogrešan PDF za svaku boju.
// Za takve gradimo stem iz značajnih segmenata putanje (collection-id + slug boje +
// naziv dokumenta) i forsiramo 'pdf'. `slugify` se prosleđuje da modul ostane čist.
function destPathFor(info, prefix, slugify) {
  const basename = (info && info.basename) || '';
  if (hasExtension(basename)) {
    const dot = basename.lastIndexOf('.');
    const stem = basename.slice(0, dot);
    let ext = basename.slice(dot + 1).toLowerCase();
    if (ext === 'jpeg') ext = 'jpg';
    return `${prefix}/${slugify(stem)}.${ext}`;
  }
  let pathname;
  try { pathname = new URL(info.clean).pathname; } catch { pathname = String((info && info.clean) || ''); }
  const meaningful = pathname.split('/').filter(Boolean)
    .filter((s) => !/^docs$/i.test(s) && !/^[a-z]{2}_[A-Z]{2}$/.test(s) && !/^pdf$/i.test(s));
  const stem = slugify(meaningful.join('-'));
  const ext = info && info.type === 'pdf' ? 'pdf' : 'bin';
  return `${prefix}/${stem}.${ext}`;
}

module.exports = {
  TARKETT_HOST,
  classifyTarkettUrl,
  extractTarkettUrls,
  rewriteString,
  encodeFetchUrl,
  hasExtension,
  destPathFor,
  fetchSourceUrl,
};
