import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    console.log("Checking for ESD products in Supabase...");

    // UUID for Elektroprovodni category is ec9f1f00-34fa-4dc7-ba8c-859c7db9056d or we can just search by name
    const { data: products, error } = await supabase
        .from('products')
        .select('id, name, slug')
        .ilike('slug', 'gerflor-%el%');

    if (error) {
        console.error("Error fetching products:", error);
        return;
    }

    console.log("Found ESD products in Supabase:", products);
}

main();
