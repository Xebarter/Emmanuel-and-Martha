-- Fix site_settings structure to ensure all required entries exist
-- Remove the is_public column if it exists (old structure) along with its dependencies
ALTER TABLE site_settings DROP COLUMN IF EXISTS is_public CASCADE;

-- Ensure all required keys exist with proper default values
INSERT INTO site_settings (key, value) VALUES
  ('couple_info', '{"names": "Emmanuel & Martha", "wedding_date": "2026-02-14", "location": "Kampala, Uganda", "hero_image": "", "tagline": "Join us as we celebrate our love", "wedding_time": "10:00"}'),
  ('next_meeting_id', 'null'),
  ('default_currency', '"UGX"')
ON CONFLICT (key) DO UPDATE SET 
  value = EXCLUDED.value,
  updated_at = NOW()
WHERE site_settings.key = EXCLUDED.key;

-- Ensure no rows have null values for the value column
UPDATE site_settings 
SET value = '{}'::jsonb 
WHERE value IS NULL;