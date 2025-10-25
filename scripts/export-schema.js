#!/usr/bin/env node

// Script to export database schema from a Supabase project
// Usage: node scripts/export-schema.js

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;

// You'll need to set these environment variables:
// SUPABASE_URL - URL of the source project (qrzgezfopfyvhynqgmyz)
// SUPABASE_SERVICE_ROLE_KEY - Service role key of the source project

async function exportSchema() {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables');
      process.exit(1);
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    
    // Get all tables in the public schema
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');
    
    if (tablesError) {
      console.error('Error fetching tables:', tablesError);
      process.exit(1);
    }
    
    let schemaSQL = `-- Exported schema from ${supabaseUrl}\n\n`;
    
    // Export each table's structure
    for (const table of tables) {
      const tableName = table.table_name;
      
      // Get table definition
      const { data: tableDef, error: tableError } = await supabase
        .rpc('pg_get_tabledef', { 
          tablename: tableName,
          schema: 'public'
        });
      
      if (tableError) {
        console.error(`Error getting definition for table ${tableName}:`, tableError);
        continue;
      }
      
      schemaSQL += `-- Table: ${tableName}\n`;
      schemaSQL += `${tableDef}\n\n`;
      
      // Get table policies
      const { data: policies, error: policiesError } = await supabase
        .from('supabase_policy_definition')
        .select('*')
        .eq('table_name', tableName);
      
      if (policiesError) {
        console.error(`Error getting policies for table ${tableName}:`, policiesError);
      } else if (policies && policies.length > 0) {
        schemaSQL += `-- Policies for ${tableName}\n`;
        policies.forEach(policy => {
          schemaSQL += `${policy.command_text}\n`;
        });
        schemaSQL += '\n';
      }
    }
    
    // Write schema to file
    await fs.writeFile('./schema-export.sql', schemaSQL);
    console.log('Schema exported successfully to schema-export.sql');
  } catch (error) {
    console.error('Error exporting schema:', error);
    process.exit(1);
  }
}

exportSchema();