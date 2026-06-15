import { describe, expect, it } from 'vitest';
const {
  classifyTarkettUrl,
  extractTarkettUrls,
  rewriteString,
  encodeFetchUrl,
  hasExtension,
  destPathFor,
  fetchSourceUrl,
} = require('../../tools/lib/hotlink-migrate.js');
const { slugify } = require('../../tools/lib/ingest-core.js');

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
  it('hvata CEO URL sa razmacima u putanji (ne preseca na razmaku)', () => {
    // Regresija: stari regex /[^\s"]+/ presekao bi na razmaku → fragment .../IN_iD
    const s = '{"img":"https://media.tarkett-image.com/large/IN_iD Tilt HIT_24749018_002.jpg"}';
    expect(extractTarkettUrls(s)).toEqual([
      'https://media.tarkett-image.com/large/IN_iD Tilt HIT_24749018_002.jpg',
    ]);
  });
  it('hvata PDF sa razmacima i ne curi van navodnika', () => {
    const s = '["https://media.tarkett-image.com/docs/DoP_iD_Tilt_HIT_all language.pdf","x"]';
    expect(extractTarkettUrls(s)).toEqual([
      'https://media.tarkett-image.com/docs/DoP_iD_Tilt_HIT_all language.pdf',
    ]);
  });
});

describe('hotlink-migrate: encodeFetchUrl (razmaci → %20 za fetch)', () => {
  it('enkoduje razmake za mrežu, ostavlja validan URL netaknut', () => {
    expect(encodeFetchUrl('https://media.tarkett-image.com/large/IN_iD Tilt HIT.jpg'))
      .toBe('https://media.tarkett-image.com/large/IN_iD%20Tilt%20HIT.jpg');
    expect(encodeFetchUrl('https://media.tarkett-image.com/large/x.jpg'))
      .toBe('https://media.tarkett-image.com/large/x.jpg');
  });
  it('idempotentno (već enkodovan ostaje isti)', () => {
    const enc = 'https://media.tarkett-image.com/large/IN_iD%20Tilt.jpg';
    expect(encodeFetchUrl(enc)).toBe(enc);
  });
  it('classifyTarkettUrl daje *Fetch polja sa enkodovanim razmacima, literal ostaje za rewrite', () => {
    const r = classifyTarkettUrl('https://media.tarkett-image.com/large/IN_iD Tilt.jpg');
    expect(r.clean).toBe('https://media.tarkett-image.com/large/IN_iD Tilt.jpg');
    expect(r.xxlFetch).toBe('https://media.tarkett-image.com/XXL/IN_iD%20Tilt.jpg');
    expect(r.fallbackFetch).toBe('https://media.tarkett-image.com/large/IN_iD%20Tilt.jpg');
    const pdf = classifyTarkettUrl('https://media.tarkett-image.com/docs/DoP all language.pdf');
    expect(pdf.cleanFetch).toBe('https://media.tarkett-image.com/docs/DoP%20all%20language.pdf');
  });
});

describe('hotlink-migrate: destPathFor (kolizijski-bezbedna storage putanja)', () => {
  const PREFIX = 'products/tarkett-migrated';
  it('fajl sa ekstenzijom: slug(stem).ext, jpeg→jpg', () => {
    const info = classifyTarkettUrl('https://media.tarkett-image.com/large/IN_LVT.jpg');
    expect(destPathFor(info, PREFIX, slugify)).toBe('products/tarkett-migrated/in-lvt.jpg');
    const jpeg = classifyTarkettUrl('https://media.tarkett-image.com/large/A.jpeg');
    expect(destPathFor(jpeg, PREFIX, slugify)).toBe('products/tarkett-migrated/a.jpg');
  });
  it('bez-ekstenzije /docs/ dokumenti: DVE razlicite boje → DVE razlicite putanje (regresija kolizije)', () => {
    const a = classifyTarkettUrl('https://media.tarkett-image.com/docs/sr_RS/pdf/collection-C000119-iq-eminent/eminent-black-0130/specifications');
    const b = classifyTarkettUrl('https://media.tarkett-image.com/docs/sr_RS/pdf/collection-C000119-iq-eminent/eminent-blue-0889/specifications');
    const pa = destPathFor(a, PREFIX, slugify);
    const pb = destPathFor(b, PREFIX, slugify);
    expect(a.type).toBe('pdf');
    expect(pa).not.toBe(pb); // pre fiksa: oba 'specifications.bin'
    expect(pa.endsWith('.pdf')).toBe(true);
    expect(pa).toContain('eminent-black-0130');
    expect(pb).toContain('eminent-blue-0889');
  });
  it('format-table i specifications iste boje NE kolidiraju', () => {
    const base = 'https://media.tarkett-image.com/docs/sr_RS/pdf/collection-C000119-iq-eminent/eminent-black-0130/';
    const spec = destPathFor(classifyTarkettUrl(base + 'specifications'), PREFIX, slugify);
    const fmt = destPathFor(classifyTarkettUrl(base + 'format-table'), PREFIX, slugify);
    expect(spec).not.toBe(fmt);
  });
  it('hasExtension razlikuje fajl od bez-ekstenzije putanje', () => {
    expect(hasExtension('x.jpg')).toBe(true);
    expect(hasExtension('specifications')).toBe(false);
    expect(hasExtension('DoP_all language.pdf')).toBe(true);
  });
});

describe('hotlink-migrate: fetchSourceUrl (generisani /docs/<locale>/pdf/ → tarkett.rs)', () => {
  it('rerutira specifications endpoint na tarkett.rs (media 403)', () => {
    expect(fetchSourceUrl('https://media.tarkett-image.com/docs/sr_RS/pdf/collection-C000119-iq-eminent/eminent-black-0130/specifications'))
      .toBe('https://www.tarkett.rs/sr_RS/pdf/collection-C000119-iq-eminent/eminent-black-0130/specifications');
  });
  it('rerutira format-table endpoint na tarkett.rs', () => {
    expect(fetchSourceUrl('https://media.tarkett-image.com/docs/sr_RS/pdf/collection-X/color-Y/format-table'))
      .toBe('https://www.tarkett.rs/sr_RS/pdf/collection-X/color-Y/format-table');
  });
  it('obične /docs/<fajl>.pdf NE rerutira (rade na media)', () => {
    const u = 'https://media.tarkett-image.com/docs/DS-Tarkett-x.pdf';
    expect(fetchSourceUrl(u)).toBe(u);
  });
  it('classifyTarkettUrl koristi tarkett.rs za cleanFetch generisanih endpoint-a', () => {
    const r = classifyTarkettUrl('https://media.tarkett-image.com/docs/sr_RS/pdf/collection-X/color-Y/specifications');
    expect(r.type).toBe('pdf');
    expect(r.cleanFetch).toBe('https://www.tarkett.rs/sr_RS/pdf/collection-X/color-Y/specifications');
    expect(r.clean).toContain('media.tarkett-image.com'); // rewrite ključ ostaje original
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
