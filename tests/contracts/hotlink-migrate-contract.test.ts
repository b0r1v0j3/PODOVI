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
