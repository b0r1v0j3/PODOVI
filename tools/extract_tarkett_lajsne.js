const { chromium } = require('playwright');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const https = require('https');
const vm = require('vm');

const CATEGORY_URL = 'https://www.tarkett.rs/sr_RS/kategorija-rs_C01047-lajsne';
const OUTPUT_PATH = path.join(process.cwd(), 'public', 'data', 'tarkett_lajsne_variants.json');
const CATEGORY_DESCRIPTION =
  'Da biste vašem podu dali savršen završni dodatak, odaberite iz našeg asortimana Tarkett lajsni i pratećeg pribora. U ponudi su dekorativne i furnirane lajsne, sportske lajsne, MDF rešenja i kompatibilni dodaci za različite podne sisteme.';
const TARKETT_MEDIA_ORIGIN = 'https://media.tarkett-image.com';
const REPO_ROOT = path.resolve(__dirname, '..');
const SUPABASE_BUCKET_NAME = 'product-images';
const DEFAULT_SUPABASE_PROJECT_NAME = 'podovi';
const shouldUploadToSupabase = process.argv.includes('--upload-supabase');
const forceUpload = process.argv.includes('--force-upload') || process.argv.includes('--force');
const preferredProjectRef =
  process.argv.find((arg) => arg.startsWith('--project-ref='))?.split('=')[1]
  || process.env.SUPABASE_PROJECT_REF
  || null;
const preferredProjectName =
  process.argv.find((arg) => arg.startsWith('--project-name='))?.split('=')[1]
  || process.env.SUPABASE_PROJECT_NAME
  || DEFAULT_SUPABASE_PROJECT_NAME;
const UPLOAD_CACHE_BUST_VERSION = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);

let existingCollectionsCache = null;

const SPEC_LABELS = {
  box_per_pallet: 'Kutija na paleti',
  format: 'Format',
  format_type: 'Tip formata',
  height: 'Visina',
  is_cutable: 'Može da se seče',
  items_per_box: 'Komada u pakovanju',
  length: 'Dužina',
  length_per_box: 'Dužina po pakovanju',
  pattern: 'Dizajn',
  pattern_type: 'Tip dezena',
  product_type: 'Tip proizvoda',
  profile: 'Profil',
  surface: 'Pokrivenost',
  surface_per_box: 'Pokrivenost po pakovanju',
  total_thickness: 'Ukupna debljina',
  width: 'Širina',
};

function fetchText(url) {
  return new Promise((resolve, reject) => {
    const normalizedUrl = url.startsWith('//') ? `https:${url}` : url;

    https
      .get(normalizedUrl, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => resolve(data));
      })
      .on('error', reject);
  });
}

function fetchBinary(url) {
  return new Promise((resolve, reject) => {
    const normalizedUrl = url.startsWith('//') ? `https:${url}` : url;

    https
      .get(
        normalizedUrl,
        {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; PodoviBot/1.0; +https://www.podovi.online)',
            Accept: 'image/jpeg,image/*,*/*;q=0.8',
          },
        },
        (res) => {
          if (res.statusCode && res.statusCode >= 400) {
            reject(new Error(`Request failed with status ${res.statusCode} for ${normalizedUrl}`));
            res.resume();
            return;
          }

          const chunks = [];
          res.on('data', (chunk) => {
            chunks.push(chunk);
          });
          res.on('end', () => resolve(Buffer.concat(chunks)));
        }
      )
      .on('error', reject);
  });
}

function getPreferredTarkettImageUrls(url) {
  const value = String(url || '').trim();
  if (!value) {
    return [];
  }

  const candidates = new Set([value]);
  if (!/tarkett-image\.com/i.test(value)) {
    return Array.from(candidates);
  }

  candidates.add(
    value
      .replace('/medium/', '/large-high/')
      .replace('/large/', '/large-high/')
      .replace('://media.tarkett-image.com/S/', '://media.tarkett-image.com/large-high/')
  );
  candidates.add(
    value
      .replace('/large-high/', '/large/')
      .replace('/medium/', '/large/')
      .replace('://media.tarkett-image.com/S/', '://media.tarkett-image.com/large/')
  );
  candidates.add(
    value
      .replace('/large-high/', '/medium/')
      .replace('/large/', '/medium/')
      .replace('://media.tarkett-image.com/S/', '://media.tarkett-image.com/medium/')
  );

  return Array.from(candidates);
}

async function fetchBestImageBinary(url) {
  const candidates = getPreferredTarkettImageUrls(url);
  let lastError = null;

  for (const candidate of candidates) {
    try {
      return await fetchBinary(candidate);
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error(`Could not download image ${url}`);
}

function extractNuxtData(html) {
  const match = html.match(/window\.__NUXT__=\((function[\s\S]*?)\)(?:;|<\/script>)/);
  if (!match) return null;

  const sandbox = {
    window: {},
    document: {},
    location: { href: '', search: '', hash: '' },
  };

  vm.createContext(sandbox);
  vm.runInContext(`window.__NUXT__=(${match[1]});`, sandbox);
  return sandbox.window.__NUXT__;
}

function stripHtml(raw) {
  return String(raw || '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function sanitizeTarkettText(raw) {
  return stripHtml(raw)
    .replace(/([.!?])(?=[A-ZČĆŽŠĐ])/g, '$1 ')
    .replace(/Naša ponudaLajsne/gi, 'Naša ponuda lajsni')
    .replace(/napopularnije/gi, 'najpopularnije')
    .replace(/fobezbeđuje/gi, 'obezbeđuje')
    .replace(/\s*;\s*/g, ': ')
    .replace(/\s+/g, ' ')
    .trim();
}

function cleanListItems(html) {
  return Array.from(String(html || '').matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi))
    .map((match) => sanitizeTarkettText(match[1]))
    .filter(Boolean);
}

function toSlugFragment(urlPath) {
  return String(urlPath)
    .replace(/^.*\/kolekcija-[^-]+-/, '')
    .replace(/^\/+/, '')
    .trim();
}

function collectionUrlToSlug(urlPath) {
  return `tarkett-${toSlugFragment(urlPath)}`;
}

function buildMediaUrl(mediaBaseUri, assetPath, kind = 'image') {
  if (!assetPath) return '';
  const raw = String(assetPath).trim();
  if (!raw || /not specified/i.test(raw)) return '';

  if (/^\/\//.test(raw)) {
    return buildMediaUrl(mediaBaseUri, `https:${raw}`, kind);
  }

  if (/^https?:\/\//i.test(raw)) {
    if (kind === 'document') {
      if (/tarkett\.rs\/sr_RS\/pdf\//i.test(raw)) {
        return raw;
      }

      return raw
        .replace('://media.tarkett-image.com/large-high/', '://media.tarkett-image.com/docs/')
        .replace('://media.tarkett-image.com/large/', '://media.tarkett-image.com/docs/')
        .replace('://media.tarkett-image.com/medium/', '://media.tarkett-image.com/docs/');
    }

    return raw
      .replace('/medium/', '/large/')
      .replace('://media.tarkett-image.com/S/', '://media.tarkett-image.com/large/');
  }

  const normalizedPath = raw.replace(/^\/+/, '');
  if (kind === 'document') {
    if (/^sr_RS\/pdf\//i.test(normalizedPath)) {
      return `https://www.tarkett.rs/${normalizedPath}`;
    }

    return `${TARKETT_MEDIA_ORIGIN}/docs/${normalizedPath}`;
  }

  const normalizedBase = (mediaBaseUri || TARKETT_MEDIA_ORIGIN).replace(/\/+$/, '');
  return `${normalizedBase}/large/${normalizedPath}`;
}

function translateCharacteristics(source, allowedKeys) {
  const result = {};

  for (const key of allowedKeys) {
    const value = source?.[key];
    if (!value) continue;

    const label = SPEC_LABELS[key] || key;
    result[label] = String(value).trim();
  }

  return result;
}

function dedupeDocuments(documents) {
  const seen = new Set();

  return documents.filter((document) => {
    if (!document.url || seen.has(document.url)) return false;
    seen.add(document.url);
    return true;
  });
}

function buildCollectionDocuments(item, mediaBaseUri) {
  const assetDocuments = (item.collection_assets || [])
    .filter((asset) => asset.document_mime_type === 'pdf' && asset.document_asset_url)
    .map((asset) => ({
      title: sanitizeTarkettText(asset.document_title || asset.document_label || asset.document_role || 'Dokument'),
      url: buildMediaUrl(mediaBaseUri, asset.document_asset_url, 'document'),
      type: 'pdf',
    }));

  const directDocuments = [
    item.specifications_pdf_url
      ? {
          title: 'Tehnički list',
          url: buildMediaUrl(mediaBaseUri, item.specifications_pdf_url, 'document'),
          type: 'pdf',
        }
      : null,
    item.format_table_pdf_url
      ? {
          title: 'Tabela formata',
          url: buildMediaUrl(mediaBaseUri, item.format_table_pdf_url, 'document'),
          type: 'pdf',
        }
      : null,
  ].filter(Boolean);

  return dedupeDocuments([...assetDocuments, ...directDocuments]);
}

function buildShortDescription(rawDescription, fallbackName) {
  const cleaned = sanitizeTarkettText(rawDescription);
  if (!cleaned) return fallbackName;

  const firstSentence = cleaned.match(/^(.{20,220}?[.!?])(?:\s|$)/);
  if (firstSentence?.[1]) {
    return firstSentence[1].trim();
  }

  return cleaned.length > 180 ? `${cleaned.slice(0, 177).trim()}...` : cleaned;
}

function loadEnvFile(envPath) {
  if (!fs.existsSync(envPath)) {
    return;
  }

  for (const rawLine of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#') || !line.includes('=')) {
      continue;
    }

    const separatorIndex = line.indexOf('=');
    const key = line.slice(0, separatorIndex).trim();
    if (!key || process.env[key]) {
      continue;
    }

    let value = line.slice(separatorIndex + 1).trim();
    if (
      value.length >= 2
      && value[0] === value[value.length - 1]
      && (value[0] === '"' || value[0] === "'")
    ) {
      value = value.slice(1, -1);
    }

    process.env[key] = value;
  }
}

function appendCacheBust(url) {
  if (!url) return url;

  const parsed = new URL(url);
  parsed.searchParams.set('v', UPLOAD_CACHE_BUST_VERSION);
  return parsed.toString();
}

function isSupabasePublicUrl(value, supabaseUrl) {
  return String(value || '').startsWith(
    `${String(supabaseUrl || '').replace(/\/+$/, '')}/storage/v1/object/public/${SUPABASE_BUCKET_NAME}/`
  );
}

async function resolveSupabaseConfig() {
  loadEnvFile(path.join(REPO_ROOT, '.env.local'));

  const explicitUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const explicitKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (explicitUrl && explicitKey) {
    return {
      url: explicitUrl.replace(/\/+$/, ''),
      key: explicitKey,
      ref: explicitUrl.replace(/^https?:\/\//i, '').replace(/\.supabase\.co.*$/i, ''),
    };
  }

  const accessToken = process.env.SUPABASE_ACCESS_TOKEN;
  if (!accessToken) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL + SUPABASE key, and SUPABASE_ACCESS_TOKEN is not available.'
    );
  }

  const projectsResponse = await fetch('https://api.supabase.com/v1/projects', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    },
  });

  if (!projectsResponse.ok) {
    throw new Error(`Could not list Supabase projects (${projectsResponse.status})`);
  }

  const projects = await projectsResponse.json();
  const targetProject = projects.find((project) => (
    (preferredProjectRef && (project.ref === preferredProjectRef || project.id === preferredProjectRef))
    || (!preferredProjectRef && project.name === preferredProjectName)
  ));

  if (!targetProject) {
    throw new Error(`Supabase project not found (${preferredProjectRef || preferredProjectName}).`);
  }

  const projectRef = targetProject.ref || targetProject.id;
  const keysResponse = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/api-keys`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    },
  });

  if (!keysResponse.ok) {
    throw new Error(`Could not fetch Supabase API keys (${keysResponse.status})`);
  }

  const keys = await keysResponse.json();
  const serviceRoleKey = keys.find((entry) => entry.name === 'service_role' && entry.api_key)?.api_key;

  if (!serviceRoleKey) {
    throw new Error(`No usable service_role key found for Supabase project ${projectRef}.`);
  }

  return {
    url: `https://${projectRef}.supabase.co`,
    key: serviceRoleKey,
    ref: projectRef,
  };
}

async function ensureBucket(supabase, bucketName) {
  const { data: buckets, error } = await supabase.storage.listBuckets();
  if (error) {
    throw new Error(`Could not list storage buckets: ${error.message}`);
  }

  if (Array.isArray(buckets) && buckets.some((bucket) => bucket.name === bucketName || bucket.id === bucketName)) {
    return;
  }

  const { error: createError } = await supabase.storage.createBucket(bucketName, {
    public: true,
    fileSizeLimit: 25 * 1024 * 1024,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
  });

  if (createError && !/already exists/i.test(createError.message)) {
    throw new Error(`Could not create storage bucket ${bucketName}: ${createError.message}`);
  }
}

async function uploadBinaryToSupabase(supabase, objectPath, fileBuffer, contentType = 'image/jpeg') {
  let lastError = null;

  for (let attempt = 1; attempt <= 4; attempt += 1) {
    try {
      const { error: uploadError } = await supabase.storage
        .from(SUPABASE_BUCKET_NAME)
        .upload(objectPath, fileBuffer, {
          contentType,
          upsert: true,
        });

      if (!uploadError) {
        const { data } = supabase.storage.from(SUPABASE_BUCKET_NAME).getPublicUrl(objectPath);
        return data.publicUrl;
      }

      lastError = uploadError;
    } catch (error) {
      lastError = error;
    }

    if (attempt < 4) {
      console.log(`Retrying Supabase upload (${attempt}/4) for ${objectPath}...`);
      await new Promise((resolve) => setTimeout(resolve, attempt * 1500));
    }
  }

  const errorMessage = lastError?.message || String(lastError || 'Unknown upload error');
  throw new Error(`Supabase upload failed for ${objectPath}: ${errorMessage}`);
}

function collectionStorageObjectPath(collectionSlug) {
  return `products/lajsne/${collectionSlug}/collection.jpg`;
}

function variantStorageObjectPath(collectionSlug, variantSlug) {
  return `products/lajsne/${collectionSlug}/${slugify(variantSlug) || 'variant'}.jpg`;
}

function loadExistingCollections() {
  if (existingCollectionsCache) {
    return existingCollectionsCache;
  }

  try {
    const payload = JSON.parse(fs.readFileSync(OUTPUT_PATH, 'utf8'));
    existingCollectionsCache = new Map(
      (payload.collections || []).map((collection) => [collection.slug, collection])
    );
  } catch {
    existingCollectionsCache = new Map();
  }

  return existingCollectionsCache;
}

function cloneCollection(collection) {
  return JSON.parse(JSON.stringify(collection));
}

function normalizeStoredDocuments(documents) {
  return (documents || []).map((document) => ({
    ...document,
    url: buildMediaUrl(TARKETT_MEDIA_ORIGIN, document.url, 'document'),
  }));
}

function buildStoredCollectionFallback(link, previewImageUrl = '') {
  const slug = collectionUrlToSlug(link);
  const existing = loadExistingCollections().get(slug);
  if (!existing) {
    return null;
  }

  const fallback = cloneCollection(existing);
  fallback.slug = slug;
  fallback.url = String(link).startsWith('http') ? String(link) : `https://www.tarkett.rs${link}`;
  fallback.documents = normalizeStoredDocuments(fallback.documents);
  fallback.colors = (fallback.colors || []).map((color) => ({
    ...color,
    documents: normalizeStoredDocuments(color.documents),
  }));

  const nextHero = buildMediaUrl(TARKETT_MEDIA_ORIGIN, previewImageUrl || fallback.collection_image_url);
  if (nextHero) {
    fallback.collection_image_url = nextHero;
  }

  return fallback;
}

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function parseDesignName(productName, fallbackRaw) {
  const primary = sanitizeTarkettText(productName || fallbackRaw || '');
  const fallback = sanitizeTarkettText(fallbackRaw || '');

  if (primary && fallback && fallback.length > primary.length && fallback !== primary) {
    return fallback;
  }

  return primary || fallback || 'Varijanta';
}

function hasUsableImage(variant) {
  return Boolean(variant?.image && !/not specified/i.test(String(variant.image)));
}

function normalizeNameTokens(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

function areLikelyDuplicateVariants(left, right) {
  const leftCode = String(left?.code || '').trim();
  const rightCode = String(right?.code || '').trim();
  if (!leftCode || leftCode !== rightCode) {
    return false;
  }

  if (hasUsableImage(left) && hasUsableImage(right)) {
    return false;
  }

  const leftTokens = new Set(normalizeNameTokens(left?.name));
  const rightTokens = new Set(normalizeNameTokens(right?.name));
  if (leftTokens.size === 0 || rightTokens.size === 0) {
    return false;
  }

  let overlap = 0;
  for (const token of leftTokens) {
    if (rightTokens.has(token)) {
      overlap += 1;
    }
  }

  const smallerSetSize = Math.min(leftTokens.size, rightTokens.size);
  return smallerSetSize > 0 && overlap / smallerSetSize >= 0.66;
}

function pickPreferredVariant(left, right) {
  const leftHasUsableImage = hasUsableImage(left);
  const rightHasUsableImage = hasUsableImage(right);

  if (leftHasUsableImage !== rightHasUsableImage) {
    return rightHasUsableImage ? right : left;
  }

  const leftName = String(left?.name || '');
  const rightName = String(right?.name || '');
  if (leftName.length !== rightName.length) {
    return rightName.length < leftName.length ? right : left;
  }

  return left;
}

function backfillMissingVariantImages(variants) {
  const variantsByCode = new Map();

  for (const variant of variants) {
    const codeKey = String(variant.code || '').trim();
    if (!codeKey) {
      continue;
    }

    if (!variantsByCode.has(codeKey)) {
      variantsByCode.set(codeKey, []);
    }

    variantsByCode.get(codeKey).push(variant);
  }

  for (const variant of variants) {
    if (hasUsableImage(variant)) {
      continue;
    }

    const siblings = variantsByCode.get(String(variant.code || '').trim()) || [];
    const fallbackWithImage = siblings.find((sibling) => hasUsableImage(sibling));
    if (fallbackWithImage) {
      variant.image = fallbackWithImage.image;
    }
  }
}

function reuseExistingSupabaseUrls(collections) {
  const previousCollections = Array.from(loadExistingCollections().values());
  const previousBySlug = new Map(previousCollections.map((collection) => [collection.slug, collection]));

  for (const collection of collections) {
    const previous = previousBySlug.get(collection.slug);
    if (!previous) {
      continue;
    }

    if (
      previous.collection_image_url
      && String(previous.collection_image_url).includes('/storage/v1/object/public/product-images/')
    ) {
      collection.collection_image_url = previous.collection_image_url;
    }

    const previousColorsByCode = new Map(
      (previous.colors || []).map((color) => [String(color.slug || ''), color])
    );

    for (const color of collection.colors || []) {
      const previousColor = previousColorsByCode.get(String(color.slug || ''));
      if (
        previousColor?.image
        && String(previousColor.image).includes('/storage/v1/object/public/product-images/')
      ) {
        color.image = previousColor.image;
      }
    }
  }
}

function collectUploadJobs(collections, supabaseUrl) {
  const jobs = [];

  for (const collection of collections) {
    const collectionImage = String(collection.collection_image_url || '');
    if (collectionImage && (forceUpload || !isSupabasePublicUrl(collectionImage, supabaseUrl))) {
      jobs.push({
        kind: 'collection',
        collection,
        imageUrl: collectionImage,
        objectPath: collectionStorageObjectPath(collection.slug),
      });
    }

    for (const color of collection.colors || []) {
      const colorImage = String(color.image || '');
      if (!colorImage || (!forceUpload && isSupabasePublicUrl(colorImage, supabaseUrl))) {
        continue;
      }

      jobs.push({
        kind: 'variant',
        collection,
        color,
        imageUrl: colorImage,
        objectPath: variantStorageObjectPath(collection.slug, color.slug || `${color.code}-${color.name}`),
      });
    }
  }

  return jobs;
}

async function uploadCollectionImagesToSupabase(collections) {
  const supabaseConfig = await resolveSupabaseConfig();
  const supabase = createClient(supabaseConfig.url, supabaseConfig.key, {
    auth: { persistSession: false },
  });

  await ensureBucket(supabase, SUPABASE_BUCKET_NAME);
  console.log(`Supabase storage ready (${supabaseConfig.ref}/${SUPABASE_BUCKET_NAME}).`);

  if (!forceUpload) {
    reuseExistingSupabaseUrls(collections);
  }

  const jobs = collectUploadJobs(collections, supabaseConfig.url);
  if (jobs.length === 0) {
    console.log('All Tarkett lajsne images already point to Supabase.');
    return;
  }

  const failures = [];
  let completed = 0;
  for (const job of jobs) {
    try {
      const binary = await fetchBestImageBinary(job.imageUrl);
      const publicUrl = await uploadBinaryToSupabase(supabase, job.objectPath, binary);
      const versionedUrl = appendCacheBust(publicUrl);

      if (job.kind === 'collection') {
        job.collection.collection_image_url = versionedUrl;
      } else if (job.color) {
        job.color.image = versionedUrl;
      }
    } catch (error) {
      const label = job.kind === 'collection'
        ? job.collection.slug
        : (job.color?.slug || job.collection.slug);
      failures.push(`${job.kind}:${label}: ${error.message}`);
    }

    completed += 1;
    if (completed % 25 === 0 || completed === jobs.length) {
      console.log(`Uploaded ${completed}/${jobs.length} Tarkett lajsne images...`);
    }
  }

  if (failures.length > 0) {
    console.warn(`Tarkett lajsne upload completed with ${failures.length} fallback image(s).`);
    failures.slice(0, 10).forEach((failure) => console.warn(`  ${failure}`));
  }
}

async function getCollectionLinks() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.goto(CATEGORY_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(2500);

    const links = await page
      .locator('a[href*="/sr_RS/kolekcija-"]')
      .evaluateAll((nodes) =>
        nodes
          .map((node) => ({
            href: node.getAttribute('href'),
            image: node.querySelector('img')?.getAttribute('src') || node.querySelector('img')?.currentSrc || '',
          }))
          .filter((node) => node.href)
      );

    const uniqueLinks = [];
    const seen = new Set();

    for (const entry of links) {
      if (seen.has(entry.href)) continue;
      seen.add(entry.href);
      uniqueLinks.push(entry);
    }

    if (uniqueLinks.length > 0) {
      return uniqueLinks;
    }

    return Array.from(loadExistingCollections().values()).map((collection) => ({
      href: new URL(collection.url).pathname,
      image: collection.collection_image_url || '',
    }));
  } finally {
    await browser.close();
  }
}

async function mapDesignToVariant(collection, design, mediaBaseUri) {
  const jsonUrl = design.productDataUrl?.startsWith('//')
    ? `https:${design.productDataUrl}`
    : design.productDataUrl;

  let payload = null;
  if (jsonUrl) {
    try {
      const body = await fetchText(jsonUrl);
      payload = JSON.parse(body)?.item || null;
    } catch (error) {
      console.warn(`Skipping design payload for ${design.product_name}:`, error.message);
    }
  }

  const rawColor =
    payload?.product_collection?.collection_default_sku?.sku_raw_technical_characteristics ||
    {};
  const colorTech =
    payload?.product_collection?.collection_default_sku?.sku_technical_caracteristics ||
    {};

  const sku = rawColor.sap_sku_number || '';
  const displayName = parseDesignName(
    payload?.product_name || design.product_name,
    rawColor.design_label || rawColor.color_label || colorTech.pattern || design.product_name
  );

  const variantCharacteristics = translateCharacteristics(
    {
      pattern: colorTech.pattern || rawColor.pattern,
      pattern_type: colorTech.pattern_type || rawColor.pattern_type,
      profile: colorTech.profile || rawColor.profile,
      format: colorTech.format,
      total_thickness: colorTech.total_thickness || rawColor.total_thickness,
      height: colorTech.height || rawColor.height,
      width: colorTech.width || rawColor.width,
      length: colorTech.length || rawColor.length,
      items_per_box: colorTech.items_per_box,
      length_per_box: colorTech.length_per_box || rawColor.length_per_box,
      surface_per_box: colorTech.surface_per_box,
      surface: colorTech.surface,
    },
    [
      'pattern',
      'pattern_type',
      'profile',
      'format',
      'total_thickness',
      'height',
      'width',
      'length',
      'items_per_box',
      'length_per_box',
      'surface_per_box',
      'surface',
    ]
  );

  if (rawColor.color_family) {
    variantCharacteristics['Porodica boje'] = String(rawColor.color_family).trim();
  }

  const variantDocuments = dedupeDocuments(
    (payload?.product_gallery || [])
      .filter((asset) => asset?.document_mime_type === 'pdf' && asset?.document_asset_url)
      .map((asset) => ({
        title: sanitizeTarkettText(
          asset.document_title || asset.document_label || asset.document_role || 'Dokument'
        ),
        url: buildMediaUrl(mediaBaseUri, asset.document_asset_url, 'document'),
        type: 'pdf',
      }))
  );

  const designSlugBase =
    payload?.product_name_slug ||
    design.product_name_slug ||
    slugify(displayName);

  return {
    code: sku,
    name: displayName,
    slug: `${collection.slug}-${designSlugBase}`.replace(/-+/g, '-'),
    image:
      buildMediaUrl(
        mediaBaseUri,
        design.product_thumbnail
      )
      || buildMediaUrl(mediaBaseUri, payload?.product_hero_image)
      || buildMediaUrl(mediaBaseUri, payload?.product_thumbnail),
    description: sanitizeTarkettText(
      payload?.description_stripped || payload?.description || collection.description || ''
    ),
    characteristics: Object.keys(variantCharacteristics).length > 0 ? variantCharacteristics : undefined,
    documents: variantDocuments,
    brandId: '3',
  };
}

async function fetchVariants(collection, designs, mediaBaseUri) {
  const variants = [];
  const batchSize = 8;

  for (let index = 0; index < designs.length; index += batchSize) {
    const batch = designs.slice(index, index + batchSize);
    const resolved = await Promise.all(
      batch.map((design) => mapDesignToVariant(collection, design, mediaBaseUri))
    );
    variants.push(...resolved.filter(Boolean));
  }

  const dedupedVariants = [];
  for (const variant of variants) {
    const existingIndex = dedupedVariants.findIndex((existing) => (
      areLikelyDuplicateVariants(existing, variant)
    ));

    if (existingIndex === -1) {
      dedupedVariants.push(variant);
      continue;
    }

    dedupedVariants[existingIndex] = pickPreferredVariant(dedupedVariants[existingIndex], variant);
  }

  backfillMissingVariantImages(dedupedVariants);
  return dedupedVariants;
}

async function fetchCollection(link, previewImageUrl = '') {
  const url = `https://www.tarkett.rs${link}`;
  const html = await fetchText(url);
  const nuxt = extractNuxtData(html);
  const mediaBaseUri = nuxt?.state?.mediaBaseUri || TARKETT_MEDIA_ORIGIN;
  const item = nuxt?.state?.collectionProductPage?.item;

  if (!item) {
    const storedFallback = buildStoredCollectionFallback(link, previewImageUrl);
    if (storedFallback) {
      console.warn(`Using stored lajsne fallback for ${url} because official payload is unavailable.`);
      return storedFallback;
    }

    throw new Error(`Collection payload missing for ${url}`);
  }

  const defaultSku =
    item.collection_default_sku ||
    item.product_collection?.collection_default_sku ||
    {};

  const collectionCharacteristics = translateCharacteristics(defaultSku.sku_technical_caracteristics || {}, [
    'product_type',
    'profile',
    'format',
    'format_type',
    'total_thickness',
    'height',
    'width',
    'length',
    'items_per_box',
    'length_per_box',
    'surface_per_box',
    'surface',
    'box_per_pallet',
    'is_cutable',
    'pattern',
    'pattern_type',
  ]);

  const coverAsset =
    (item.collection_assets || []).find((asset) => asset.document_role === 'COVER') ||
    (item.collection_assets || []).find((asset) => asset.document_mime_type === 'jpg');

  const documents = buildCollectionDocuments(item, mediaBaseUri);

  const keyFeatures = cleanListItems(item.key_features);
  const detailsSections = keyFeatures.length > 0
    ? [
        {
          title: 'Ključne karakteristike',
          items: keyFeatures,
        },
      ]
    : undefined;

  const collection = {
    name: sanitizeTarkettText(item.collection_name || item.name || toSlugFragment(link)),
    slug: collectionUrlToSlug(link),
    brandId: '3',
    url,
    colorCount: Array.isArray(item.designs) ? item.designs.length : 0,
    shortDescription: buildShortDescription(
      item.short_description_stripped || item.short_description || item.description_stripped || item.description || '',
      sanitizeTarkettText(item.collection_name || item.name || '')
    ),
    description: sanitizeTarkettText(item.description_stripped || item.description || ''),
    categoryDescription: CATEGORY_DESCRIPTION,
    characteristics: collectionCharacteristics,
    documents,
    detailsSections,
    collection_image_url: buildMediaUrl(
      mediaBaseUri,
      previewImageUrl || coverAsset?.document_asset_url || item.collection_picture
    ),
    colors: [],
  };

  collection.colors = await fetchVariants(collection, item.designs || [], mediaBaseUri);
  collection.colorCount = collection.colors.length;

  if (!collection.collection_image_url) {
    collection.collection_image_url = collection.colors[0]?.image || '';
  }

  return collection;
}

async function main() {
  const links = await getCollectionLinks();
  const collections = [];

  for (const link of links) {
    const collection = await fetchCollection(link.href, link.image);
    collections.push(collection);
  }

  if (shouldUploadToSupabase) {
    await uploadCollectionImagesToSupabase(collections);
  }

  const output = {
    collections,
    generatedAt: new Date().toISOString(),
    source: CATEGORY_URL,
  };

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, `${JSON.stringify(output, null, 2)}\n`, 'utf8');

  const totalVariants = collections.reduce((sum, collection) => sum + (collection.colors?.length || 0), 0);
  console.log(`Saved ${collections.length} Tarkett lajsne collections (${totalVariants} variants) to ${OUTPUT_PATH}`);
}

main().catch((error) => {
  console.error('Failed to extract Tarkett lajsne data:', error);
  process.exit(1);
});
