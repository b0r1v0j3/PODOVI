const { chromium } = require('playwright');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const extract = require('extract-zip');

const typeArg = process.argv.find((arg) => arg.startsWith('--type='));
const collectionArg = process.argv.find((arg) => arg.startsWith('--collection='));
const projectRefArg = process.argv.find((arg) => arg.startsWith('--project-ref='));
const projectNameArg = process.argv.find((arg) => arg.startsWith('--project-name='));
const bucketArg = process.argv.find((arg) => arg.startsWith('--bucket='));

const shouldUploadToSupabase = process.argv.includes('--upload-supabase');
const forceDownload = process.argv.includes('--force');

if (!typeArg) {
    console.error('Usage: node tools/download_gerflor_highres_zip.js --type=<esd|vinyl|vinyl-special|lvt|linoleum|industrial|sport> [--collection=<slug>] [--upload-supabase] [--force]');
    process.exit(1);
}

const type = typeArg.split('=')[1];
const targetCollectionSlug = collectionArg ? collectionArg.split('=')[1] : null;
const preferredProjectRef = projectRefArg ? projectRefArg.split('=')[1] : process.env.SUPABASE_PROJECT_REF || null;
const preferredProjectName = projectNameArg ? projectNameArg.split('=')[1] : process.env.SUPABASE_PROJECT_NAME || 'podovi';
const storageBucketName = bucketArg ? bucketArg.split('=')[1] : 'product-images';

let dataFileName = '';
let localOutDirName = '';
let storageDirName = '';

switch (type) {
    case 'esd':
        dataFileName = 'esd_colors.json';
        localOutDirName = 'esd';
        storageDirName = 'esd';
        break;
    case 'vinyl':
        dataFileName = 'vinyl_colors_complete.json';
        localOutDirName = 'products/vinyl';
        storageDirName = 'vinyl';
        break;
    case 'vinyl-special':
        dataFileName = 'vinyl_special_colors.json';
        localOutDirName = 'products/vinyl';
        storageDirName = 'vinyl';
        break;
    case 'lvt':
        dataFileName = 'lvt_colors_complete.json';
        localOutDirName = 'products/lvt';
        storageDirName = 'lvt';
        break;
    case 'linoleum':
        dataFileName = 'linoleum_colors_complete.json';
        localOutDirName = 'products/linoleum';
        storageDirName = 'linoleum';
        break;
    case 'industrial':
        dataFileName = 'industrial_colors.json';
        localOutDirName = 'products/industrial';
        storageDirName = 'industrial';
        break;
    case 'sport':
        dataFileName = 'sport_colors.json';
        localOutDirName = 'products/sport';
        storageDirName = 'sport';
        break;
    default:
        console.error(`Unknown type: ${type}`);
        process.exit(1);
}

const dataPath = path.join(__dirname, '..', 'public', 'data', dataFileName);
let jsonData;
try {
    jsonData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
} catch (error) {
    console.error(`Could not read data file ${dataPath}`);
    process.exit(1);
}

const tmpDir = path.join(__dirname, '..', 'tmp_downloads');
const stagingRootDir = shouldUploadToSupabase
    ? path.join(tmpDir, 'staging')
    : path.join(__dirname, '..', 'public', 'images');
const baseOutDir = path.join(stagingRootDir, localOutDirName);

if (!fs.existsSync(baseOutDir)) {
    fs.mkdirSync(baseOutDir, { recursive: true });
}

if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir, { recursive: true });
}

function sanitizeName(value) {
    return String(value || '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
}

function isRemoteUrl(value) {
    return /^https?:\/\//i.test(String(value || ''));
}

function findLargestJpgFile(dirPath) {
    const files = [];

    function walk(currentDir) {
        for (const entry of fs.readdirSync(currentDir, { withFileTypes: true })) {
            const fullPath = path.join(currentDir, entry.name);
            if (entry.isDirectory()) {
                walk(fullPath);
                continue;
            }

            if (entry.isFile() && /\.jpe?g$/i.test(entry.name)) {
                files.push(fullPath);
            }
        }
    }

    walk(dirPath);

    if (files.length === 0) {
        return null;
    }

    return files
        .map((filePath) => ({ filePath, size: fs.statSync(filePath).size }))
        .sort((left, right) => right.size - left.size)[0].filePath;
}

async function saveDownloadAsJpg(download, destPath, tmpPrefix) {
    const suggestedName = download.suggestedFilename ? download.suggestedFilename() : `${tmpPrefix}.zip`;
    const tmpPath = path.join(tmpDir, `${tmpPrefix}-${suggestedName}`);
    await download.saveAs(tmpPath);

    const isZip = tmpPath.toLowerCase().endsWith('.zip');
    if (isZip) {
        const extractDir = path.join(tmpDir, `${tmpPrefix}-extracted`);
        await extract(tmpPath, { dir: extractDir });

        const jpgFile = findLargestJpgFile(extractDir);
        if (!jpgFile) {
            fs.rmSync(extractDir, { recursive: true, force: true });
            fs.rmSync(tmpPath, { force: true });
            throw new Error(`ZIP ${suggestedName} does not contain a JPG`);
        }

        fs.mkdirSync(path.dirname(destPath), { recursive: true });
        fs.copyFileSync(jpgFile, destPath);
        fs.rmSync(extractDir, { recursive: true, force: true });
        fs.rmSync(tmpPath, { force: true });
        return;
    }

    fs.mkdirSync(path.dirname(destPath), { recursive: true });
    fs.copyFileSync(tmpPath, destPath);
    fs.rmSync(tmpPath, { force: true });
}

async function resolveSupabaseConfig() {
    const explicitUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const explicitKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (explicitUrl && explicitKey) {
        return {
            url: explicitUrl,
            key: explicitKey,
            ref: explicitUrl.replace(/^https?:\/\//i, '').replace(/\.supabase\.co.*$/i, ''),
        };
    }

    const accessToken = process.env.SUPABASE_ACCESS_TOKEN;
    if (!accessToken) {
        throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL + SUPABASE key, and SUPABASE_ACCESS_TOKEN is not available.');
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

async function uploadJpgToSupabase(supabase, localPath, objectPath) {
    const fileBuffer = fs.readFileSync(localPath);
    let lastError = null;

    for (let attempt = 1; attempt <= 4; attempt += 1) {
        try {
            const { error: uploadError } = await supabase.storage
                .from(storageBucketName)
                .upload(objectPath, fileBuffer, {
                    contentType: 'image/jpeg',
                    upsert: true,
                });

            if (!uploadError) {
                const { data } = supabase.storage.from(storageBucketName).getPublicUrl(objectPath);
                return data.publicUrl;
            }

            lastError = uploadError;
        } catch (error) {
            lastError = error;
        }

        if (attempt < 4) {
            console.log(`    Retrying Supabase upload (${attempt}/4) for ${objectPath}...`);
            await new Promise((resolve) => setTimeout(resolve, attempt * 1500));
        }
    }

    const errorMessage = lastError?.message || String(lastError || 'Unknown upload error');
    throw new Error(`Supabase upload failed for ${objectPath}: ${errorMessage}`);
}

async function finalizeImage(localPath, storageObjectPath, localPublicPath, supabase) {
    if (shouldUploadToSupabase) {
        const publicUrl = await uploadJpgToSupabase(supabase, localPath, storageObjectPath);
        fs.rmSync(localPath, { force: true });
        return publicUrl;
    }

    return localPublicPath;
}

function getCollectionImageValue(collection) {
    return collection.collection_image_url || collection.image || collection.image_url || '';
}

function getColorImageValue(color) {
    return color.image || color.image_url || '';
}

function shouldSkipExisting(value) {
    return !forceDownload && Boolean(value);
}

function setCollectionImageValue(collection, url) {
    collection.collection_image_url = url;
}

function setColorImageValue(color, url) {
    if (type === 'lvt' || type === 'linoleum') {
        color.image_url = url;
        return;
    }

    color.image = url;
}

function collectionLocalPublicPath(collectionSlug) {
    return `/images/${localOutDirName}/${collectionSlug}/collection.jpg`;
}

function colorLocalPublicPath(collectionSlug, fileName) {
    return `/images/${localOutDirName}/${collectionSlug}/${fileName}`;
}

function collectionStorageObjectPath(collectionSlug) {
    return `products/${storageDirName}/${collectionSlug}/collection.jpg`;
}

function colorStorageObjectPath(collectionSlug, fileName) {
    return `products/${storageDirName}/${collectionSlug}/${fileName}`;
}

async function downloadCollectionImage(page, collection, collectionDir, supabase) {
    const existingCollectionImage = getCollectionImageValue(collection);
    if (shouldSkipExisting(existingCollectionImage)) {
        console.log('  Collection image already exists in JSON, skipping.');
        return false;
    }

    const collectionImagePath = path.join(collectionDir, 'collection.jpg');

    try {
        const directLink = await page.evaluate(() => {
            const NUXT = window.__NUXT__;
            const item = NUXT?.state?.collectionProductPage?.item;
            if (!item) return null;

            const documentCandidates = [...(item.documents || []), ...(item.medias || [])];
            const doc = documentCandidates.find((entry) => {
                const fileUrl = entry?.file_url || entry?.url || '';
                return fileUrl.endsWith('.zip') || fileUrl.endsWith('.jpg');
            });

            return doc?.file_url || doc?.url || null;
        });

        if (directLink) {
            console.log('  Downloading collection image from product download asset...');
            const [download] = await Promise.all([
                page.waitForEvent('download', { timeout: 30000 }),
                page.evaluate((url) => {
                    const anchor = document.createElement('a');
                    anchor.href = url;
                    anchor.download = '';
                    document.body.appendChild(anchor);
                    anchor.click();
                    document.body.removeChild(anchor);
                }, directLink),
            ]);

            await saveDownloadAsJpg(download, collectionImagePath, `${collection.slug}-collection`);
        } else {
            console.log('  Direct collection download link not found, trying UI download...');
            await openDownloadMenu(page);

            const [download] = await Promise.all([
                page.waitForEvent('download', { timeout: 30000 }),
                clickDownloadImagesButton(page),
            ]);

            await saveDownloadAsJpg(download, collectionImagePath, `${collection.slug}-collection`);
            await page.mouse.click(0, 0);
            await page.waitForTimeout(1000);
        }

        const finalUrl = await finalizeImage(
            collectionImagePath,
            collectionStorageObjectPath(collection.slug),
            collectionLocalPublicPath(collection.slug),
            supabase,
        );
        setCollectionImageValue(collection, finalUrl);
        console.log('  ✅ Saved collection roomshot.');
        return true;
    } catch (error) {
        console.log(`  ⚠️ Could not download collection roomshot for ${collection.slug}: ${error.message}`);
        try {
            await page.mouse.click(0, 0);
        } catch (clickError) { }
        return false;
    }
}

async function reloadCollectionPage(page, collectionUrl) {
    await page.goto(collectionUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(3000);
}

async function openDownloadMenu(page) {
    try {
        await page.click('.download-button--trigger', { timeout: 10000 });
    } catch (error) {
        const clicked = await page.evaluate(() => {
            const trigger = document.querySelector('.download-button--trigger');
            if (!trigger) return false;
            trigger.click();
            return true;
        });

        if (!clicked) {
            throw error;
        }
    }

    await page.waitForTimeout(1000);
}

async function clickDownloadImagesButton(page) {
    try {
        await page.click('.download-button--images', { timeout: 10000 });
    } catch (error) {
        const clicked = await page.evaluate(() => {
            const button = document.querySelector('.download-button--images');
            if (!button) return false;
            button.click();
            return true;
        });

        if (!clicked) {
            throw error;
        }
    }
}

function buildCollectionsToProcess(data) {
    if (data.collections && Array.isArray(data.collections)) {
        return data.collections;
    }

    if (data.colors && Array.isArray(data.colors)) {
        const collectionMap = new Map();
        for (const color of data.colors) {
            const collectionSlug = (color.collection_slug || color.collection || '').replace(/^gerflor-/, '');
            if (!collectionSlug) continue;

            if (!collectionMap.has(collectionSlug)) {
                let collectionUrl = color.collection_url || color.url || `https://www.gerflor-cee.com/products/${collectionSlug}`;
                if (color.code && collectionUrl.includes(`-${color.code}-`)) {
                    collectionUrl = collectionUrl.substring(0, collectionUrl.indexOf(`-${color.code}-`));
                }

                collectionMap.set(collectionSlug, {
                    slug: collectionSlug,
                    url: collectionUrl,
                    colors: [],
                });
            }

            collectionMap.get(collectionSlug).colors.push(color);
        }

        return Array.from(collectionMap.values());
    }

    console.error('Unknown JSON structure. Needs either "collections" or "colors" array.');
    process.exit(1);
}

(async () => {
    const collectionsToProcess = buildCollectionsToProcess(jsonData).filter((collection) => (
        !targetCollectionSlug || collection.slug === targetCollectionSlug
    ));

    if (targetCollectionSlug && collectionsToProcess.length === 0) {
        console.error(`Collection ${targetCollectionSlug} not found in data.`);
        process.exit(1);
    }

    let supabase = null;
    if (shouldUploadToSupabase) {
        const supabaseConfig = await resolveSupabaseConfig();
        supabase = createClient(supabaseConfig.url, supabaseConfig.key, {
            auth: { persistSession: false },
        });
        await ensureBucket(supabase, storageBucketName);
        console.log(`Supabase storage ready (${supabaseConfig.ref}/${storageBucketName}).`);
    }

    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext({
        acceptDownloads: true,
    });
    const page = await context.newPage();

    let totalUpdated = 0;

    console.log('Accepting cookies...');
    await page.goto(collectionsToProcess[0].url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(3000);
    try {
        const acceptedInShadowRoot = await page.evaluate(() => {
            const element = document.querySelector('#uc-center-container');
            if (element && element.shadowRoot) {
                const button = element.shadowRoot.querySelector('button[data-testid="uc-accept-all-button"]');
                if (button) {
                    button.click();
                    return true;
                }
            }
            return false;
        });

        if (!acceptedInShadowRoot) {
            const selectors = [
                'button[data-testid="uc-accept-all-button"]',
                '#uc-btn-accept-banner',
                '.uc-btn-accept',
            ];

            for (const selector of selectors) {
                try {
                    await page.click(selector, { timeout: 2000 });
                    break;
                } catch (error) { }
            }
        }
    } catch (error) { }

    for (const collection of collectionsToProcess) {
        console.log(`\nProcessing collection: ${collection.slug}`);

        const collectionDir = path.join(baseOutDir, collection.slug);
        if (!fs.existsSync(collectionDir)) {
            fs.mkdirSync(collectionDir, { recursive: true });
        }

        const response = await page.goto(collection.url, { waitUntil: 'domcontentloaded', timeout: 60000 });
        if (response && response.status() === 404) {
            console.log(`  ❌ Collection URL returned 404, skipping: ${collection.url}`);
            continue;
        }

        await page.waitForTimeout(4000);

        if (await downloadCollectionImage(page, collection, collectionDir, supabase)) {
            totalUpdated += 1;
        }

        for (const color of collection.colors) {
            const currentImageValue = getColorImageValue(color);
            if (shouldSkipExisting(currentImageValue)) {
                console.log(`  Skipping ${color.code} ${color.name} (image already exists in JSON).`);
                continue;
            }

            console.log(`  Processing ${color.code} ${color.name}`);

            try {
                const downloadLink = await page.evaluate((code) => {
                    const NUXT = window.__NUXT__;
                    const item = NUXT?.state?.collectionProductPage?.item;
                    if (!item || !item.designs) return null;

                    const design = item.designs.find((entry) => (
                        entry.product_design_key === code
                        || entry.product_design_key === code.replace(/^0+/, '')
                        || String(entry.product_design_key).endsWith(code)
                    ));

                    if (!design || !Array.isArray(design.documents)) {
                        return null;
                    }

                    const doc = design.documents.find((entry) => {
                        const fileUrl = entry?.file_url || '';
                        return fileUrl.endsWith('.zip') || fileUrl.endsWith('.jpg');
                    });

                    return doc?.file_url || null;
                }, color.code);

                const colorFileName = `${color.code}-${sanitizeName(color.name)}.jpg`;
                const colorImagePath = path.join(collectionDir, colorFileName);

                if (downloadLink) {
                    console.log('    Downloading color image from design download asset...');
                    const [download] = await Promise.all([
                        page.waitForEvent('download', { timeout: 30000 }),
                        page.evaluate((url) => {
                            const anchor = document.createElement('a');
                            anchor.href = url;
                            anchor.download = '';
                            document.body.appendChild(anchor);
                            anchor.click();
                            document.body.removeChild(anchor);
                        }, downloadLink),
                    ]);

                    await saveDownloadAsJpg(download, colorImagePath, `${collection.slug}-${color.code}`);
                } else {
                    console.log('    Download link not in payload, trying swatch + download UI...');

                    const swatchLabel = `View product ${color.code} ${color.name}`;
                    try {
                        await page.click(`[aria-label="${swatchLabel}"]`, { timeout: 10000 });
                        await page.waitForTimeout(3000);
                    } catch (error) {
                        try {
                            const fallbackLabel = `View product ${color.code} ${String(color.name || '').toLowerCase()}`;
                            await page.click(`[aria-label="${fallbackLabel}" i]`, { timeout: 5000 });
                            await page.waitForTimeout(3000);
                        } catch (innerError) {
                            try {
                                await page.click(`[aria-label*="${color.code}"]`, { timeout: 5000 });
                                await page.waitForTimeout(3000);
                            } catch (finalError) {
                                let selectedByText = false;

                                try {
                                    const clickedByNameOnlyLink = await page.evaluate((name) => {
                                        const targetLabel = `view product ${String(name || '').trim().toLowerCase()}`;
                                        const links = Array.from(document.querySelectorAll('a[aria-label]'));
                                        const link = links.find((entry) => (
                                            String(entry.getAttribute('aria-label') || '').trim().toLowerCase() === targetLabel
                                        ));

                                        if (!link) {
                                            return false;
                                        }

                                        link.click();
                                        return true;
                                    }, color.name);

                                    if (clickedByNameOnlyLink) {
                                        await page.waitForTimeout(3000);
                                        selectedByText = true;
                                    }
                                } catch (nameLinkError) { }

                                const textCandidates = [
                                    `${color.code} ${color.name}`,
                                    color.code,
                                    color.name,
                                ].filter(Boolean);

                                for (const candidate of selectedByText ? [] : textCandidates) {
                                    try {
                                        await page.getByText(candidate, { exact: false }).first().click({ timeout: 4000 });
                                        await page.waitForTimeout(3000);
                                        selectedByText = true;
                                        break;
                                    } catch (textError) { }
                                }

                                if (!selectedByText) {
                                    console.log(`    Skipping swatch ${color.code}`);
                                    await reloadCollectionPage(page, collection.url);
                                    continue;
                                }
                            }
                        }
                    }

                    await openDownloadMenu(page);

                    const [download] = await Promise.all([
                        page.waitForEvent('download', { timeout: 30000 }),
                        clickDownloadImagesButton(page),
                    ]);

                    await saveDownloadAsJpg(download, colorImagePath, `${collection.slug}-${color.code}`);
                    await page.mouse.click(0, 0);
                    await page.waitForTimeout(1000);
                }

                const finalUrl = await finalizeImage(
                    colorImagePath,
                    colorStorageObjectPath(collection.slug, colorFileName),
                    colorLocalPublicPath(collection.slug, colorFileName),
                    supabase,
                );
                setColorImageValue(color, finalUrl);
                console.log(`    ✅ Saved final image: ${colorFileName}`);
                totalUpdated += 1;
            } catch (error) {
                console.error(`    ❌ Error processing ${color.code}: ${error.message}`);
                try {
                    await page.mouse.click(0, 0);
                } catch (clickError) { }
                try {
                    await reloadCollectionPage(page, collection.url);
                } catch (reloadError) { }
            }
        }
    }

    fs.writeFileSync(dataPath, `${JSON.stringify(jsonData, null, 4)}\n`);
    console.log(`\n✅ Done! Saved ${totalUpdated} Gerflor download images and updated ${dataFileName}.`);

    if (fs.existsSync(tmpDir)) {
        fs.rmSync(tmpDir, { recursive: true, force: true });
    }
    await browser.close();
})();
