# Copying Database Schema Between Supabase Projects

This guide explains how to copy the database schema from one Supabase project to another. In your case, you want to copy from project `qrzgezfopfyvhynqgmyz` to `xlvxrbuxtfhbxbmieivr`.

## Method 1: Using Supabase CLI (Recommended)

### Prerequisites

1. Install [Supabase CLI](https://supabase.com/docs/guidelines-and-limitations/cli)
2. Make sure you have the necessary credentials for both projects

### Steps

1. Link your local project to the source Supabase project:
```bash
supabase link --project-ref qrzgezfopfyvhynqgmyz
```

2. Generate the current database types:
```bash
supabase gen types typescript --local > database.types.ts
```

3. Export the database schema:
```bash
supabase db pull
```

This will create a new migration file in `supabase/migrations/` folder.

4. Update your local `supabase/config.toml` to point to the target project:
```bash
supabase link --project-ref xlvxrbuxtfhbxbmieivr
```

5. Apply the schema to the target project:
```bash
supabase db push
```

## Method 2: Manual Export/Import

### Step 1: Export Schema from Source Project

1. Go to your source Supabase project dashboard (`qrzgezfopfyvhynqgmyz`)
2. Navigate to the SQL Editor
3. Run this query to get table definitions:
```sql
SELECT CONCAT(
  '-- Table: ', table_name, E'\n',
  'CREATE TABLE IF NOT EXISTS ', table_name, ' (', E'\n',
  STRING_AGG(
    column_name || ' ' || data_type || 
    CASE WHEN character_maximum_length IS NOT NULL 
         THEN '(' || character_maximum_length || ')' 
         ELSE '' END ||
    CASE WHEN is_nullable = 'NO' THEN ' NOT NULL' ELSE '' END,
    ',' || E'\n  ' ORDER BY ordinal_position
  ),
  E'\n);\n\n'
) AS table_definition
FROM information_schema.columns
WHERE table_schema = 'public'
GROUP BY table_name
ORDER BY table_name;
```

### Step 2: Export RLS Policies

Run this query to get Row Level Security policies:
```sql
SELECT CONCAT(
  '-- Policies for ', p.tablename, E'\n',
  STRING_AGG(p.definition, E'\n' ORDER BY p.cmd),
  E'\n\n'
) AS policy_definitions
FROM pg_policies p
WHERE schemaname = 'public'
GROUP BY p.tablename;
```

### Step 3: Import Schema to Target Project

1. Go to your target Supabase project dashboard (`xlvxrbuxtfhbxbmieivr`)
2. Navigate to the SQL Editor
3. Paste and run the exported schema and policies

## Method 3: Using Provided Scripts

We've included two Node.js scripts in the `scripts/` directory:

1. `export-schema.js` - Exports schema from source project
2. `import-schema.js` - Imports schema to target project

### Usage:

1. Install dependencies:
```bash
npm install @supabase/supabase-js
```

2. Export schema:
```bash
SUPABASE_URL=https://qrzgezfopfyvhynqgmyz.supabase.co \
SUPABASE_SERVICE_ROLE_KEY=your-source-service-role-key \
node scripts/export-schema.js
```

3. Import schema:
```bash
TARGET_SUPABASE_URL=https://xlvxrbuxtfhbxbmieivr.supabase.co \
TARGET_SUPABASE_SERVICE_ROLE_KEY=your-target-service-role-key \
node scripts/import-schema.js
```

## Important Notes

1. **Data vs Schema**: These methods copy only the schema (structure), not the actual data.

2. **Extensions**: Some PostgreSQL extensions might need to be enabled manually in the target project.

3. **Storage**: Storage buckets and policies are separate from the database schema.

4. **Auth**: Authentication settings are not part of the database schema.

5. **Functions**: Custom database functions would need to be migrated separately.

6. **Dependencies**: Make sure to create tables in the correct order respecting foreign key constraints.

## Troubleshooting

- If you encounter errors during import, check for missing extensions and enable them in the target project.
- Ensure the target project has the same PostgreSQL extensions enabled.
- Check that the service role keys have sufficient permissions.
- For large schemas, consider splitting the import into smaller chunks.

## References

- [Supabase CLI Documentation](https://supabase.com/docs/guidelines-and-limitations/cli)
- [Supabase Migration Guide](https://supabase.com/docs/guides/getting-started/local-development)