#!/usr/bin/env node

// Script to import database schema to a Supabase project
// Usage: node scripts/import-schema.js

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;

// You'll need to set these environment variables:
// TARGET_SUPABASE_URL - URL of the target project (xlvxrbuxtfhbxbmieivr)
// TARGET_SUPABASE_SERVICE_ROLE_KEY - Service role key of the target project

async function importSchema() {
  try {
    const supabaseUrl = process.env.TARGET_SUPABASE_URL;
    const supabaseKey = process.env.TARGET_SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('Please set TARGET_SUPABASE_URL and TARGET_SUPABASE_SERVICE_ROLE_KEY environment variables');
      process.exit(1);
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    
    // Read the schema file
    const schemaSQL = await fs.readFile('./schema-export.sql', 'utf8');
    
    // Execute the schema SQL
    // Note: Supabase doesn't have a direct way to execute multiple statements
    // We'll need to split and execute them one by one
    const statements = schemaSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);
    
    console.log(`Executing ${statements.length} statements...`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';
      
      // Skip comments and empty statements
      if (statement.startsWith('--') || statement.trim() === ';') {
        continue;
      }
      
      try {
        // For CREATE statements, we'll use raw SQL execution
        const { error } = await supabase.rpc('execute_sql', { sql: statement });
        
        if (error) {
          console.error(`Error executing statement ${i + 1}:`, error);
        } else {
          console.log(`Executed statement ${i + 1} successfully`);
        }
      } catch (error) {
        console.error(`Error executing statement ${i + 1}:`, error);
      }
    }
    
    console.log('Schema import completed');
  } catch (error) {
    console.error('Error importing schema:', error);
    process.exit(1);
  }
}

importSchema();