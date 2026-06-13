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
