-- Allow unauthenticated access to site_settings table for wedding information
-- This enables the dashboard to update wedding date, venue, and tagline without authentication

-- First, disable RLS entirely on site_settings table
ALTER TABLE site_settings DISABLE ROW LEVEL SECURITY;

-- If you prefer to keep RLS but make it more permissive, uncomment the following section:
/*
-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view site settings" ON site_settings;
DROP POLICY IF EXISTS "Admins can update site settings" ON site_settings;

-- Create permissive policies for all operations
CREATE POLICY "Anyone can view site settings"
  ON site_settings FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can update site settings"
  ON site_settings FOR UPDATE
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can insert site settings"
  ON site_settings FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);
*/