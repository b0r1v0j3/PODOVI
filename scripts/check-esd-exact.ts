import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl!, supabaseKey!);

async function main() {
    // Let's get all products that have "el5" or "el7" in their slug or name
    const { data: products, error } = await supabase
        .from('products')
        .select('id, name, slug, category_id, sku')
        .or('slug.ilike.%el5%,slug.ilike.%el7%,name.ilike.%el5%,name.ilike.%el7%');

    console.log("Supabase EL5/EL7 Products:", products);
}

main();
