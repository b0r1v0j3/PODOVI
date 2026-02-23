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

async function uploadImage(localPath: string, destPath: string) {
    console.log(`Uploading ${localPath} to Supabase storage at products/${destPath}...`);
    const fileBuffer = fs.readFileSync(localPath);

    // Upload to 'product-images' bucket
    const { data, error } = await supabase.storage
        .from('product-images')
        .upload(`products/${destPath}`, fileBuffer, {
            contentType: 'image/jpeg',
            upsert: true
        });

    if (error) {
        console.error("Upload error:", error);
        return null;
    }

    const { data: publicUrlData } = supabase.storage
        .from('product-images')
        .getPublicUrl(`products/${destPath}`);

    return publicUrlData.publicUrl;
}

async function main() {
    const imagesToUpload = [
        { local: 'public/images/esd/mipolam-el5-lifestyle.jpg', dest: 'esd/mipolam-el5-lifestyle.jpg' },
        { local: 'public/images/esd/gti-el5-connect-lifestyle.jpg', dest: 'esd/gti-el5-connect-lifestyle.jpg' },
        { local: 'public/images/esd/gti-el5-cleantech-lifestyle.jpg', dest: 'esd/gti-el5-cleantech-lifestyle.jpg' },
        { local: 'public/images/esd/mipolam-biocontrol-el5-lifestyle.jpg', dest: 'esd/mipolam-biocontrol-el5-lifestyle.jpg' },
    ];

    for (const img of imagesToUpload) {
        if (!fs.existsSync(img.local)) {
            console.error(`File missing: ${img.local} (did the download fail?)`);
            // Try downloading it right now if missing
            continue;
        }
        const url = await uploadImage(img.local, img.dest);
        console.log(`Uploaded! Public URL: ${url}`);
    }
}

main();
