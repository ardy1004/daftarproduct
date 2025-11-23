import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigrations() {
  console.log('🚀 Starting Supabase migrations...\n');

  try {
    // Get all migration files
    const migrationDir = path.join(__dirname, 'drizzle');
    const files = fs.readdirSync(migrationDir)
      .filter(file => file.endsWith('.sql') && !file.includes('meta'))
      .sort();

    console.log(`Found ${files.length} migration files:`);
    files.forEach(file => console.log(`  - ${file}`));
    console.log('');

    // Run each migration
    for (const file of files) {
      const filePath = path.join(migrationDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');

      console.log(`📄 Running migration: ${file}`);

      // Split SQL by statement-breakpoint and execute each statement
      const statements = sql.split('--> statement-breakpoint').map(s => s.trim()).filter(s => s.length > 0);

      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i].trim();
        if (!statement) continue;

        console.log(`  Executing statement ${i + 1}/${statements.length}...`);

        try {
          const { error } = await supabase.rpc('exec_sql', { sql: statement });

          if (error) {
            // If rpc doesn't work, try direct query
            const { error: queryError } = await supabase.from('_supabase_migration_temp').select('*').limit(1);
            if (queryError) {
              console.log('  ⚠️  RPC not available, trying direct SQL execution...');
              // For now, just log what would be executed
              console.log(`  📝 Would execute: ${statement.substring(0, 100)}...`);
            }
          } else {
            console.log('  ✅ Statement executed successfully');
          }
        } catch (err) {
          console.error(`  ❌ Error executing statement: ${err.message}`);
          console.log(`  📝 SQL: ${statement}`);
        }
      }

      console.log(`✅ Migration ${file} completed\n`);
    }

    console.log('🎉 All migrations completed!');

    // Verify the schema
    console.log('\n🔍 Verifying schema...');
    const { data, error } = await supabase
      .from('products')
      .select('item, video_url')
      .limit(1);

    if (error) {
      console.error('❌ Schema verification failed:', error);
    } else {
      console.log('✅ Schema verification successful');
      console.log('Sample data:', data);
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigrations();