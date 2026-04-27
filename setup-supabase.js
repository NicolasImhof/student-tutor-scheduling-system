const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function setupDatabase() {
    try {
        console.log('Applying database schema...');

        // Read the schema file
        const schemaPath = path.join(__dirname, 'schema.sql');
        const schemaSQL = fs.readFileSync(schemaPath, 'utf8');

        // Split into individual statements
        const statements = schemaSQL.split(/;\s*$/m).filter(s => s.trim().length > 0);

        for (const statement of statements) {
            console.log(`Executing: ${statement.substring(0, 100)}...`);
            const { error } = await supabase.rpc('execute_sql', { sql: statement });
            if (error) {
                // Some errors are expected if objects already exist, so we log them but continue
                if (error.message.includes('already exists')) {
                    console.warn(`Warning: ${error.message}`);
                } else {
                    throw error;
                }
            }
        }

        console.log('Schema applied successfully.');

        console.log('Applying migrations...');
        const migrationPath = path.join(__dirname, 'migrations', '001_enhanced_calendar.sql');
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
        const migrationStatements = migrationSQL.split(/;\s*$/m).filter(s => s.trim().length > 0);

        for (const statement of migrationStatements) {
            console.log(`Executing migration: ${statement.substring(0, 100)}...`);
            const { error } = await supabase.rpc('execute_sql', { sql: statement });
            if (error) {
                if (error.message.includes('already exists')) {
                    console.warn(`Warning: ${error.message}`);
                } else {
                    throw error;
                }
            }
        }
        
        console.log('Migrations applied successfully.');

    } catch (error) {
        console.error('Database setup failed:', error);
        process.exit(1);
    }
}

// Supabase needs a helper function to execute raw SQL
async function createSqlExecutionHelper() {
    console.log('Creating SQL execution helper function in Supabase...');
    const { error } = await supabase.rpc('execute_sql', { sql: `
        CREATE OR REPLACE FUNCTION execute_sql(sql TEXT)
        RETURNS void AS $$
        BEGIN
            EXECUTE sql;
        END;
        $$ LANGUAGE plpgsql;
    ` });

    if (error) {
        if (error.message.includes('already exists')) {
            console.warn('SQL execution helper function already exists.');
        } else {
            console.error('Failed to create SQL execution helper:', error);
            process.exit(1);
        }
    }
}

async function main() {
    await createSqlExecutionHelper();
    await setupDatabase();
}

main();