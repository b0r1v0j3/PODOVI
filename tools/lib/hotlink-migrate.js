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
