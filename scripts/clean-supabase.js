const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function cleanSupabase() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl) {
        console.error('Missing Supabase URL');
        process.exit(1);
    }

    const client = createClient(supabaseUrl, supabaseServiceKey || supabaseKey);
    console.log('Connected to Supabase. Checking categories...');

    const { data: allCats, error: fetchErr } = await client
        .from('categories')
        .select('*');

    if (fetchErr) {
        console.error('Error fetching categories:', fetchErr.message);
        process.exit(1);
    }

    // Let's see what categories we have
    const catsToKeepSlugs = ['lvt', 'vinil', 'linoleum', 'tekstilne-ploce', 'otiraci', 'elektroprovodni', 'laminat', 'parket', 'sinteticki-travnjaci', 'tepisi', 'deking', 'lajsne', 'podloge'];
    // Look for legacy egger categories 8, 9, 10 or others
    const catsToDelete = allCats.filter(c => !catsToKeepSlugs.includes(c.slug));

    if (catsToDelete.length === 0) {
        console.log('No legacy categories found to delete.');
        process.exit(0);
    }

    console.log(`Found ${catsToDelete.length} legacy categories to delete:`, catsToDelete.map(c => c.slug));

    const idsToDelete = catsToDelete.map(c => c.id);

    const { error: delErr } = await client
        .from('categories')
        .delete()
        .in('id', idsToDelete);

    if (delErr) {
        console.error('Error deleting categories:', delErr.message);
        process.exit(1);
    }

    console.log('Successfully deleted legacy categories.');
}

cleanSupabase().catch(console.error);
