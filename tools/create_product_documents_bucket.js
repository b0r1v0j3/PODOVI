const { getSupabase } = require('./lib/ingest-core.js');

(async () => {
  const supabase = getSupabase();
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();
  if (listError) throw listError;
  if (buckets.some((b) => b.name === 'product-documents')) {
    console.log('✅ Bucket product-documents već postoji.');
    return;
  }
  const { error } = await supabase.storage.createBucket('product-documents', { public: true });
  if (error) throw error;
  console.log('✅ Kreiran javni bucket product-documents.');
})().catch((err) => { console.error('❌', err.message); process.exit(1); });
