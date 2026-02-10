// Run migration SQL against Supabase PostgreSQL
// Usage: node scripts/run-migration.mjs

import pg from 'pg';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Read migration SQL
const sqlPath = join(__dirname, '..', 'supabase', 'migration.sql');
const sql = readFileSync(sqlPath, 'utf-8');

console.log('Connecting to Supabase PostgreSQL...');
console.log(`SQL length: ${sql.length} chars`);

const client = new pg.Client({
    host: 'aws-0-eu-central-1.pooler.supabase.com',
    port: 5432,
    database: 'postgres',
    user: 'postgres.nnjmrfwepylrheykalik',
    password: 'Borivoje19.10.1992.',
    ssl: { rejectUnauthorized: false }
});

try {
    await client.connect();
    console.log('Connected! Running migration...\n');

    await client.query(sql);

    console.log('✅ Migration completed successfully!');

    // Verify tables were created
    const { rows } = await client.query(`
    SELECT table_name FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `);

    console.log('\nCreated tables:');
    rows.forEach(r => console.log(`  - ${r.table_name}`));

} catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
} finally {
    await client.end();
}
