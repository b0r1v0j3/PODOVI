import { createClient } from '@supabase/supabase-js';
import * as loader from '@/lib/utils/productDataLoader';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials in .env.local");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
    const isDryRun = process.argv.includes('--dry-run');

    console.log('=== PODOVI.ONLINE SUPABASE MIGRATION ===\n');
    if (isDryRun) {
        console.log('⚠️ RUNNING IN DRY-RUN MODE. NO CHANGES WILL BE SAVED.\n');
    } else {
        console.log('⚠️ RUNNING IN PRODUCTION MODE. WRITING TO DB.\n');
    }

    console.log('Loading product data...\n');

    try {
        let allProducts: any[] = [];
        // Collect all JSON/Tarkett variants
        allProducts.push(...loader.getAllGerflorProducts());
        allProducts.push(...loader.getAllBloqCarpetProducts());
        allProducts.push(...loader.getAllTarkettLVTProducts());
        allProducts.push(...loader.getTarkettLVTCollections());
        allProducts.push(...loader.getAllDekingProducts());
        allProducts.push(...loader.getVinylCollectionProducts());
        allProducts.push(...loader.getEsdCollectionProducts());

        console.log(`Loaded ${allProducts.length} unique items to migrate.\n`);

        let successCount = 0;
        let errorCount = 0;
        const errors: any[] = [];

        // Migrate batches to avoid hammering the DB
        for (const product of allProducts) {
            if (!product.id || !product.slug) {
                console.warn('Skipping invalid product:', product.name);
                errorCount++;
                continue;
            }

            // Format payload for Supabase 'products' table
            const payload = {
                id: product.id,
                name: product.name,
                slug: product.slug,
                description: product.description || '',
                short_description: product.shortDescription || '',
                category_id: product.categoryId,
                brand_id: product.brandId || null,
                is_active: true,
                in_stock: product.inStock !== false,
                price: product.price || 0,
                price_unit: product.priceUnit || 'm²',
                images: product.images || [],
                specs: product.specs || [],
                collection_slug: product.collectionSlug || null,
                created_at: new Date().toISOString()
            };

            if (!isDryRun) {
                // Upsert into products
                const { error } = await supabase
                    .from('products')
                    .upsert(payload, { onConflict: 'id' });

                if (error) {
                    console.error(`❌ Failed to insert ${product.id}:`, error.message);
                    errors.push({ id: product.id, error: error.message });
                    errorCount++;
                } else {
                    console.log(`✅ Upserted ${product.id}`);
                    successCount++;
                }
            } else {
                console.log(`[DRY-RUN] Would upsert ${product.id}`);
                successCount++;
            }
        }

        console.log('\n--- MIGRATION RESULTS ---');
        console.log(`Total attempted: ${allProducts.length}`);
        console.log(`Successful: ${successCount}`);
        console.log(`Errors: ${errorCount}`);

        if (errors.length > 0) {
            console.log('\nError Log Preview (first 5):');
            console.log(errors.slice(0, 5));
        }

    } catch (err) {
        console.error('Migration crashed:', err);
    }
}

runMigration();
