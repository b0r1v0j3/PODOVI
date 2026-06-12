/**
 * Seed Supabase database with all product data
 * Usage: npx tsx scripts/seed-database.ts
 * 
 * Reads from:
 *   - lib/data/mock-data.ts (categories, brands, products)
 *   - lib/data/gerflor-products-generated.ts (LVT products)
 *   - lib/data/linoleum-products.ts (Linoleum products)
 *   - lib/data/tarkett-products.ts (Parket/Laminat products)
 *   - public/data/*.json (color data)
 */

import { createClient } from '@supabase/supabase-js';
import { categories, brands, products as mockProducts } from '../lib/data/mock-data';
import { gerflor_products } from '../lib/data/gerflor-products-generated';
import { tarkettProducts } from '../lib/data/tarkett-products';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// Note: linoleum-products uses `export default` so we import differently
import { linoleumProducts } from '../lib/data/linoleum-products';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, '..', 'public', 'data');

// Učitaj .env.local (tsx ga ne učitava sam); parser skida navodnike — isti obrazac
// kao scripts/sync-tarkett-supabase.ts (AGENTS pravilo 27: vercel env pull upisuje navodnike).
function loadLocalEnvFile() {
    const envPath = join(__dirname, '..', '.env.local');
    let raw: string;
    try {
        raw = readFileSync(envPath, 'utf8');
    } catch {
        return; // bez .env.local — env varijable moraju doći spolja
    }
    for (const line of raw.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const separatorIndex = trimmed.indexOf('=');
        if (separatorIndex === -1) continue;
        const key = trimmed.slice(0, separatorIndex).trim();
        if (!key || process.env[key]) continue;
        let value = trimmed.slice(separatorIndex + 1).trim();
        if (value.startsWith('"') && value.endsWith('"')) {
            value = value.slice(1, -1);
        }
        process.env[key] = value;
    }
}

loadLocalEnvFile();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error('❌ Nedostaju NEXT_PUBLIC_SUPABASE_URL i/ili SUPABASE_SERVICE_ROLE_KEY (postavi ih u .env.local).');
    process.exit(1);
}

// Supabase client (service_role — zaobilazi RLS; ključ NIKAD ne hardkodovati)
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

// =========================================
// ID Mapping: old string IDs → new UUIDs
// =========================================
const categoryIdMap = new Map<string, string>();
const brandIdMap = new Map<string, string>();
const productIdMap = new Map<string, string>();

// =========================================
// 1. Seed Categories
// =========================================
async function seedCategories() {
    console.log('\n📁 Seeding categories...');

    // Clear existing
    await supabase.from('product_specs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('product_images').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('products').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('categories').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    for (const cat of categories) {
        const { data, error } = await supabase
            .from('categories')
            .insert({
                name: cat.name,
                slug: cat.slug,
                description: cat.description,
                image: cat.image,
                order_num: cat.order,
            })
            .select('id')
            .single();

        if (error) {
            console.error(`  ❌ Category "${cat.name}":`, error.message);
        } else {
            categoryIdMap.set(cat.id, data.id);
            console.log(`  ✅ ${cat.name} (${cat.id} → ${data.id})`);
        }
    }
}

// =========================================
// 2. Seed Brands
// =========================================
async function seedBrands() {
    console.log('\n🏷️  Seeding brands...');

    // Clear existing
    await supabase.from('brands').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    for (const brand of brands) {
        const { data, error } = await supabase
            .from('brands')
            .insert({
                name: brand.name,
                slug: brand.slug,
                logo: brand.logo,
                description: brand.description,
                website: brand.website || null,
                country_of_origin: brand.countryOfOrigin || null,
            })
            .select('id')
            .single();

        if (error) {
            console.error(`  ❌ Brand "${brand.name}":`, error.message);
        } else {
            brandIdMap.set(brand.id, data.id);
            console.log(`  ✅ ${brand.name} (${brand.id} → ${data.id})`);
        }
    }
}

// =========================================
// 3. Seed Products (batched)
// =========================================
async function seedProducts() {
    // Combine all products
    const rawProducts = [
        ...mockProducts,
        ...gerflor_products,
        ...(Array.isArray(linoleumProducts) ? linoleumProducts : []),
        ...tarkettProducts,
    ];

    // Deduplicate by slug (first occurrence wins)
    const slugSeen = new Set<string>();
    const allProducts = rawProducts.filter(p => {
        if (slugSeen.has(p.slug)) return false;
        slugSeen.add(p.slug);
        return true;
    });

    console.log(`\n📦 Seeding ${allProducts.length} products (${rawProducts.length - allProducts.length} duplicates removed)...`);

    let success = 0;
    let errors = 0;
    const BATCH_SIZE = 50;

    for (let i = 0; i < allProducts.length; i += BATCH_SIZE) {
        const batch = allProducts.slice(i, i + BATCH_SIZE);

        // Insert products
        const productRows = batch.map(p => ({
            name: p.name,
            slug: p.slug,
            sku: p.sku || '',
            category_id: categoryIdMap.get(p.categoryId),
            brand_id: brandIdMap.get(p.brandId),
            short_description: p.shortDescription || '',
            description: p.description || '',
            price: p.price || null,
            price_unit: p.priceUnit || null,
            in_stock: p.inStock ?? true,
            featured: p.featured ?? false,
            coverage_per_package: p.coveragePerPackage || null,
            external_link: p.externalLink || null,
            details_sections: p.detailsSections || null,
            documents: p.documents || null,
        }));

        // Filter out products with missing category/brand mappings
        const validRows = productRows.filter(r => r.category_id && r.brand_id);
        if (validRows.length < productRows.length) {
            console.warn(`  ⚠️  Skipping ${productRows.length - validRows.length} products with unmapped category/brand`);
        }

        const { data, error } = await supabase
            .from('products')
            .insert(validRows)
            .select('id, slug');

        if (error) {
            console.error(`  ❌ Batch ${Math.floor(i / BATCH_SIZE) + 1}:`, error.message);
            errors += batch.length;
            continue;
        }

        // Map old IDs and insert images/specs
        for (let j = 0; j < batch.length; j++) {
            const product = batch[j];
            const inserted = data?.find(d => d.slug === product.slug);
            if (!inserted) continue;

            productIdMap.set(product.id, inserted.id);

            // Insert images
            if (product.images && product.images.length > 0) {
                const imageRows = product.images.map(img => ({
                    product_id: inserted.id,
                    url: img.url,
                    alt: img.alt || '',
                    is_primary: img.isPrimary ?? false,
                    order_num: img.order ?? 0,
                }));

                const { error: imgErr } = await supabase.from('product_images').insert(imageRows);
                if (imgErr) console.error(`  ❌ Images for "${product.slug}":`, imgErr.message);
            }

            // Insert specs
            if (product.specs && product.specs.length > 0) {
                const specRows = product.specs.map(spec => ({
                    product_id: inserted.id,
                    key: spec.key,
                    label: spec.label,
                    value: spec.value,
                }));

                const { error: specErr } = await supabase.from('product_specs').insert(specRows);
                if (specErr) console.error(`  ❌ Specs for "${product.slug}":`, specErr.message);
            }

            success++;
        }

        process.stdout.write(`  Products: ${Math.min(i + BATCH_SIZE, allProducts.length)}/${allProducts.length}\r`);
    }

    console.log(`  ✅ Products: ${success} success, ${errors} errors`);
}

// =========================================
// 4. Seed Colors from JSON files
// =========================================
async function seedColors() {
    console.log('\n🎨 Seeding colors...');

    // Clear existing
    await supabase.from('colors').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    let totalColors = 0;

    // --- LVT colors ---
    const lvtData = JSON.parse(readFileSync(join(dataDir, 'lvt_colors_complete.json'), 'utf-8'));
    if (lvtData.colors) {
        await insertFlatColors(lvtData.colors, 'lvt');
        totalColors += lvtData.colors.length;
        console.log(`  ✅ LVT: ${lvtData.colors.length} colors`);
    }

    // --- Linoleum colors (flat format) ---
    const linData = JSON.parse(readFileSync(join(dataDir, 'linoleum_colors_complete.json'), 'utf-8'));
    if (linData.colors) {
        await insertFlatColors(linData.colors, 'linoleum');
        totalColors += linData.colors.length;
        console.log(`  ✅ Linoleum: ${linData.colors.length} colors`);
    }

    // --- Carpet tiles (flat format) ---
    const carpetData = JSON.parse(readFileSync(join(dataDir, 'carpet_tiles_complete.json'), 'utf-8'));
    if (carpetData.colors) {
        await insertFlatColors(carpetData.colors, 'tekstilne-ploce');
        totalColors += carpetData.colors.length;
        console.log(`  ✅ Carpet tiles: ${carpetData.colors.length} colors`);
    }

    // --- Vinyl colors (nested format: collections[].colors[]) ---
    const vinylData = JSON.parse(readFileSync(join(dataDir, 'vinyl_colors_complete.json'), 'utf-8'));
    if (vinylData.collections) {
        let vinylCount = 0;
        for (const collection of vinylData.collections) {
            if (collection.colors) {
                const nestedColors = collection.colors.map((c: any) => ({
                    ...c,
                    collection: c.collection_slug || collection.slug,
                    collection_name: collection.name,
                    image_url: c.image || c.image_url,
                }));
                await insertFlatColors(nestedColors, 'vinil');
                vinylCount += nestedColors.length;
            }
        }
        totalColors += vinylCount;
        console.log(`  ✅ Vinyl: ${vinylCount} colors`);
    }

    // --- Gerflor Linoleum colors (nested format) ---
    const gerfLinData = JSON.parse(readFileSync(join(dataDir, 'gerflor_linoleum_colors_complete.json'), 'utf-8'));
    if (gerfLinData.collections) {
        let gerfLinCount = 0;
        for (const collection of gerfLinData.collections) {
            if (collection.colors) {
                const nestedColors = collection.colors.map((c: any) => ({
                    ...c,
                    collection: c.collection_slug || collection.slug,
                    collection_name: collection.name,
                    image_url: c.image || c.image_url,
                }));
                await insertFlatColors(nestedColors, 'linoleum');
                gerfLinCount += nestedColors.length;
            }
        }
        totalColors += gerfLinCount;
        console.log(`  ✅ Gerflor Linoleum: ${gerfLinCount} colors`);
    }

    // --- Additional color JSON files ---
    const extraFiles = [
        { file: 'parket_colors_complete.json', category: 'parket' },
        { file: 'laminat_colors_complete.json', category: 'laminat' },
    ];

    for (const { file, category } of extraFiles) {
        try {
            const data = JSON.parse(readFileSync(join(dataDir, file), 'utf-8'));
            const colors = data.colors || (Array.isArray(data) ? data : null);
            if (colors) {
                await insertFlatColors(colors, category);
                totalColors += colors.length;
                console.log(`  ✅ ${file}: ${colors.length} colors`);
            }
        } catch {
            // File may not exist, that's okay
            console.log(`  ⏭️  ${file}: not found (skipped)`);
        }
    }

    console.log(`  📊 Total colors seeded: ${totalColors}`);
}

async function insertFlatColors(colors: any[], categorySlug: string) {
    const BATCH_SIZE = 100;

    for (let i = 0; i < colors.length; i += BATCH_SIZE) {
        const batch = colors.slice(i, i + BATCH_SIZE);

        const rows = batch.map((c: any) => ({
            collection_slug: c.collection || c.collection_slug || '',
            collection_name: c.collection_name || '',
            category_slug: categorySlug,
            code: c.code || '',
            name: c.name || '',
            full_name: c.full_name || `${c.code || ''} ${c.name || ''}`.trim(),
            slug: c.slug || '',
            image_url: c.image_url || c.image || c.texture_url || null,
            texture_url: c.texture_url || c.image_url || c.image || null,
            lifestyle_url: c.lifestyle_url || null,
            image_count: c.image_count || 0,
            welding_rod: c.welding_rod || null,
            dimension: c.dimension || null,
            format: c.format || null,
            overall_thickness: c.overall_thickness || null,
            description: c.description || null,
            specs: c.specs || null,
            collection_specs: c.collection_specs || null,
            characteristics: c.characteristics || null,
        }));

        const { error } = await supabase.from('colors').insert(rows);
        if (error) {
            // If unique constraint violation, try inserting one by one
            if (error.message.includes('duplicate') || error.message.includes('unique')) {
                for (const row of rows) {
                    const { error: singleErr } = await supabase.from('colors').upsert(row, {
                        onConflict: 'collection_slug,code'
                    });
                    if (singleErr && !singleErr.message.includes('duplicate')) {
                        console.error(`    ❌ Color ${row.code} ${row.name}:`, singleErr.message);
                    }
                }
            } else {
                console.error(`    ❌ Batch error:`, error.message);
            }
        }
    }
}

// =========================================
// Main execution
// =========================================
async function main() {
    console.log('🚀 Starting database seed...\n');
    console.log('='.repeat(50));

    const start = Date.now();

    await seedCategories();
    await seedBrands();
    await seedProducts();
    await seedColors();

    const elapsed = ((Date.now() - start) / 1000).toFixed(1);

    console.log('\n' + '='.repeat(50));
    console.log(`\n✅ Seeding complete in ${elapsed}s`);
    console.log(`   Categories: ${categoryIdMap.size}`);
    console.log(`   Brands: ${brandIdMap.size}`);
    console.log(`   Products: ${productIdMap.size}`);

    // Verify counts
    const { count: catCount } = await supabase.from('categories').select('*', { count: 'exact', head: true });
    const { count: brandCount } = await supabase.from('brands').select('*', { count: 'exact', head: true });
    const { count: prodCount } = await supabase.from('products').select('*', { count: 'exact', head: true });
    const { count: colorCount } = await supabase.from('colors').select('*', { count: 'exact', head: true });

    console.log(`\n📊 Database counts:`);
    console.log(`   Categories: ${catCount}`);
    console.log(`   Brands: ${brandCount}`);
    console.log(`   Products: ${prodCount}`);
    console.log(`   Colors: ${colorCount}`);
}

main().catch(err => {
    console.error('\n💥 Fatal error:', err);
    process.exit(1);
});
