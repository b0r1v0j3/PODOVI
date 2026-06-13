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
  decodeEntities,
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

  it('classifies taralay-initial-acoustic variations via alias prefix (collection slug has -0 suffix)', () => {
    expect(classifyProductPath('taralay-initial-acoustic-azay-cream', CEE_SLUGS))
      .toEqual({ type: 'variation', ceeSlug: 'taralay-initial-acoustic-0', code: null, nameSlug: 'azay-cream', sku: null });
    expect(classifyProductPath('taralay-initial-acoustic-0', CEE_SLUGS))
      .toEqual({ type: 'collection', ceeSlug: 'taralay-initial-acoustic-0' });
  });

  it('rejects code-less variations for collections outside the exception set', () => {
    expect(classifyProductPath('premium-compact-accessories', CEE_SLUGS)).toBeNull();
    expect(classifyProductPath('mipolam-accord-something-random', CEE_SLUGS)).toBeNull();
  });

  it('classifies 608x608 collection and variation despite prefix overlap with mipolam-affinity', () => {
    expect(classifyProductPath('mipolam-affinity-608x608', CEE_SLUGS))
      .toEqual({ type: 'collection', ceeSlug: 'mipolam-affinity-608x608' });
    expect(classifyProductPath('mipolam-affinity-608x608-0001-foo-12345678', CEE_SLUGS))
      .toMatchObject({ type: 'variation', ceeSlug: 'mipolam-affinity-608x608', code: '0001' });
  });

  it('decodeEntities: nbsp and amp-last', () => {
    expect(decodeEntities('technical&nbsp;data sheet')).toBe('technical data sheet');
    expect(decodeEntities('&amp;quot;')).toBe('&quot;');
  });

  it('parseDocumentLinks tolerates attribute order and .PDF case', () => {
    const html = '<ul class="product-documents-list"><li><a download class="js-file-download" href="https://cdn.gerflor.com/media/2/1/x.PDF">X</a></li></ul>';
    expect(parseDocumentLinks(html)).toHaveLength(1);
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

  it('maps document names to clean Serbian titles', () => {
    expect(mapDocumentTitle('Taralay Impression Compact - Technical Data Sheet', '')).toBe('Tehnički list');
    expect(mapDocumentTitle('Nerok 55 - DOP', '')).toBe('Izjava o svojstvima (DoP)');
    expect(mapDocumentTitle('Taralay Impression Compact Acoustic - Déclaration de performance', '')).toBe('Izjava o svojstvima (DoP)');
    expect(mapDocumentTitle('Taralay Impression/Initial Compact - EPD', '')).toBe('EPD');
    expect(mapDocumentTitle('TARALAY IMPRESSION COMPACT - EDS', '')).toBe('Ekološki list (EDS)');
    expect(mapDocumentTitle('Installation instructions', 'Installation & maintenance')).toBe('Uputstvo za ugradnju');
    expect(mapDocumentTitle('Maintenance guide', 'Installation & maintenance')).toBe('Uputstvo za održavanje');
    expect(mapDocumentTitle('Gerflor Contractual waranty - Commercial applications', '')).toBe('Garancija');
    expect(mapDocumentTitle('Taralay Impression Compact - Fire Certificate Bfls1', '')).toBe('Sertifikat — vatrootpornost');
    expect(mapDocumentTitle('Gerflor-slip resistance-TARALAY IMPRESSION COMPACT-EN 16165 ann B-en- R10', '')).toBe('Sertifikat — otpornost na klizanje');
    expect(mapDocumentTitle('GERFLOR-FLOORSCORE', '')).toBe('Sertifikat — FloorScore');
    expect(mapDocumentTitle('Taralay Impression Compact - Product description', '')).toBe('Opis proizvoda');
    // brošure/vodiči/binderi → jedan čist naslov (bez sirovog imena fajla, .pdf strip)
    expect(mapDocumentTitle('BROCHURE-TARALAY IMPRESSION-A4-TAP-GB-07-2023-BV.pdf', '')).toBe('Brošura');
    expect(mapDocumentTitle('My Taralay Impression - Guide', 'Commercial documents')).toBe('Brošura');
    expect(mapDocumentTitle('Taralay Impression Binder GB', '')).toBe('Brošura');
    expect(mapDocumentTitle('Mipolam Classic - Card', '')).toBe('Brošura');
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
