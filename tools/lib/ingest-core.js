const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const BROWSER_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'sec-ch-ua': '"Google Chrome";v="137", "Chromium";v="137", "Not/A)Brand";v="24"',
  'sec-ch-ua-mobile': '?0',
  'sec-ch-ua-platform': '"Windows"',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'none',
  'Sec-Fetch-User': '?1',
  'Upgrade-Insecure-Requests': '1',
};

function loadLocalEnvFile() {
  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex === -1) continue;
    const key = trimmed.slice(0, separatorIndex).trim();
    if (!key || process.env[key]) continue;
    let value = trimmed.slice(separatorIndex + 1).trim();
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    process.env[key] = value;
  }
}

function getSupabase() {
  loadLocalEnvFile();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('Nedostaju NEXT_PUBLIC_SUPABASE_URL i/ili SUPABASE_SERVICE_ROLE_KEY u .env.local');
  }
  return createClient(url, key);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let lastPageFetchAt = 0;
// Sekvencijalni pozivaoci only — nije pravi rate limiter za konkurentne pozive.
async function politePageDelay(minIntervalMs = 1100) {
  const wait = lastPageFetchAt + minIntervalMs - Date.now();
  if (wait > 0) await sleep(wait);
  lastPageFetchAt = Date.now();
}

async function fetchWithRetry(url, { headers = BROWSER_HEADERS, attempts = 3, asBuffer = false, timeoutMs = 30000 } = {}) {
  let lastError;
  for (let i = 0; i < attempts; i++) {
    try {
      // Tvrdi backstop: Promise.race tajmer fire-uje i kad AbortSignal ne prekine
      // zastali socket (uzrok višeminutnih visenja na čitanju tela). Pokriva fetch
      // I čitanje tela; ceiling = timeoutMs + 5s margine.
      return await withTimeout((async () => {
        const res = await fetch(url, { headers, redirect: 'follow', signal: AbortSignal.timeout(timeoutMs) });
        if (res.status === 403 || res.status === 429) {
          await res.body?.cancel().catch(() => {});
          const e = new Error(`HTTP ${res.status} za ${url}`);
          e.retryable = true;
          throw e;
        }
        if (!res.ok) {
          await res.body?.cancel().catch(() => {});
          const err = new Error(`HTTP ${res.status} za ${url}`);
          // Deterministički klijentski errori (4xx osim 403/429) — retry nema smisla.
          if (res.status >= 400 && res.status < 500) err.permanent = true;
          throw err;
        }
        return asBuffer ? Buffer.from(await res.arrayBuffer()) : await res.text();
      })(), timeoutMs + 5000, `fetch ${url}`);
    } catch (err) {
      if (err.permanent) throw err;
      lastError = err;
      // 403/429 dobijaju duži backoff (Akamai); ostalo kraći.
      if (i < attempts - 1) await sleep((err.retryable ? 5000 : 2000) * (i + 1));
    }
  }
  throw lastError;
}

async function fetchPage(url) {
  await politePageDelay();
  return fetchWithRetry(url, { asBuffer: false });
}

async function downloadAsset(url) {
  // cdn.gerflor.com nema zaštitu; bez polite delay-a, ali sa retry-jem
  return fetchWithRetry(url, { asBuffer: true });
}

function contentTypeFor(filePath) {
  if (/\.pdf$/i.test(filePath)) return 'application/pdf';
  if (/\.(jpe?g)$/i.test(filePath)) return 'image/jpeg';
  if (/\.png$/i.test(filePath)) return 'image/png';
  if (/\.webp$/i.test(filePath)) return 'image/webp';
  return 'application/octet-stream';
}

function cacheBustStamp() {
  return new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
}

function withTimeout(promise, ms, label) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`Timeout (${ms}ms): ${label}`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

async function uploadToBucket(supabase, bucket, storagePath, buffer, { cacheBust = true, timeoutMs = 60000 } = {}) {
  // Supabase storage upload nema sopstveni timeout — bez ovoga jedan zaglavljen
  // upload visi unedogled (uzrok 6h zaglavljivanja). Race protiv tajmera; greška
  // pada u per-collection try/catch i kolekcija se preskače.
  const { error } = await withTimeout(
    supabase.storage.from(bucket).upload(storagePath, buffer, {
      contentType: contentTypeFor(storagePath),
      upsert: true,
    }),
    timeoutMs,
    `upload ${bucket}/${storagePath}`,
  );
  if (error) throw new Error(`Upload ${bucket}/${storagePath}: ${error.message}`);
  const { data } = supabase.storage.from(bucket).getPublicUrl(storagePath);
  if (!data?.publicUrl) throw new Error(`getPublicUrl prazan za ${bucket}/${storagePath}`);
  return cacheBust ? `${data.publicUrl}?v=${cacheBustStamp()}` : data.publicUrl;
}

function writeJsonWithBackup(jsonPath, data, backupLabel) {
  const outputDir = path.join(process.cwd(), 'output');
  fs.mkdirSync(outputDir, { recursive: true });
  if (fs.existsSync(jsonPath)) {
    const stamp = new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_').replace('Z', '');
    const backupPath = path.join(outputDir, `${backupLabel}-backup-${stamp}.json`);
    fs.copyFileSync(jsonPath, backupPath);
    console.log(`📦 Backup: ${backupPath}`);
  }
  fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2), 'utf8');
}

function loadManifest(name) {
  const manifestPath = path.join(process.cwd(), 'output', `${name}-manifest.json`);
  let entries = {};
  if (fs.existsSync(manifestPath)) {
    try {
      entries = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    } catch {
      const corruptPath = `${manifestPath}.corrupt-${cacheBustStamp()}`;
      fs.renameSync(manifestPath, corruptPath);
      console.warn(`⚠️ Manifest oštećen, počinjem ispočetka: ${corruptPath}`);
      entries = {};
    }
  }
  return {
    has: (key) => Boolean(entries[key]),
    get: (key) => entries[key],
    record(key, value) {
      entries[key] = { ...value, at: new Date().toISOString() };
    },
    save() {
      fs.mkdirSync(path.dirname(manifestPath), { recursive: true });
      const tmpPath = `${manifestPath}.tmp`;
      fs.writeFileSync(tmpPath, JSON.stringify(entries, null, 2), 'utf8');
      fs.renameSync(tmpPath, manifestPath); // renameSync prepisuje postojeći fajl i na Windows-u
    },
    size: () => Object.keys(entries).length,
  };
}

function slugify(s) {
  const out = String(s || '').toLowerCase().replace(/đ/g, 'dj').normalize('NFKD').replace(/[^\w\s-]/g, '').trim().replace(/[\s_]+/g, '-').replace(/-+/g, '-');
  return out || 'stavka';
}

module.exports = {
  BROWSER_HEADERS,
  loadLocalEnvFile,
  getSupabase,
  sleep,
  withTimeout,
  fetchPage,
  fetchWithRetry,
  downloadAsset,
  uploadToBucket,
  writeJsonWithBackup,
  loadManifest,
  cacheBustStamp,
  slugify,
};
