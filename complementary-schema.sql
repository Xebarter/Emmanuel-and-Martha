/*
  # COMPLEMENTARY DATABASE SETUP FOR WEDDING WEBSITE (PERMISSIVE VERSION)
  
  This script adds the missing elements to complete the database setup
  for the wedding website with permissive policies that allow anyone
  to make edits, bypassing row-level security restrictions.
*/

-- =====================================================
-- STORAGE POLICIES (permissive)
-- =====================================================

-- Remove existing restrictive policies if they exist
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own uploads" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own uploads" ON storage.objects;

-- Create permissive policies for storage
CREATE POLICY "Allow read access to gallery bucket for all" 
  ON storage.objects FOR SELECT 
  USING (bucket_id = 'gallery');

CREATE POLICY "Allow insert to gallery bucket for all" 
  ON storage.objects FOR INSERT 
  WITH CHECK (bucket_id = 'gallery');

CREATE POLICY "Allow update to gallery bucket for all" 
  ON storage.objects FOR UPDATE 
  USING (bucket_id = 'gallery');

CREATE POLICY "Allow delete from gallery bucket for all" 
  ON storage.objects FOR DELETE 
  USING (bucket_id = 'gallery');

-- =====================================================
-- TABLE POLICIES (permissive)
-- =====================================================

-- Remove existing restrictive policies if they exist
DROP POLICY IF EXISTS "Enable read access for all users" ON public.gallery;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.gallery;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON public.gallery;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON public.gallery;

DROP POLICY IF EXISTS "Anyone can view meetings" ON meetings;
DROP POLICY IF EXISTS "Admins can create meetings" ON meetings;
DROP POLICY IF EXISTS "Admins can update meetings" ON meetings;
DROP POLICY IF EXISTS "Admins can delete meetings" ON meetings;

DROP POLICY IF EXISTS "Anyone can view approved messages" ON guest_messages;
DROP POLICY IF EXISTS "Admins can view all messages" ON guest_messages;
DROP POLICY IF EXISTS "Anyone can create message" ON guest_messages;
DROP POLICY IF EXISTS "Admins can update messages" ON guest_messages;

DROP POLICY IF EXISTS "Admins can view all guests" ON guests;
DROP POLICY IF EXISTS "Anyone can create guest profile" ON guests;

DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Admins can update users" ON users;
DROP POLICY IF EXISTS "Admins can insert users" ON users;

DROP POLICY IF EXISTS "Admins can view all attendances" ON attendances;
DROP POLICY IF EXISTS "Anyone can register for meetings" ON attendances;
DROP POLICY IF EXISTS "Admins can update attendance status" ON attendances;

DROP POLICY IF EXISTS "Admins can view all contributions" ON contributions;
DROP POLICY IF EXISTS "Anyone can create contribution" ON contributions;

DROP POLICY IF EXISTS "Admins can view all pledges" ON pledges;
DROP POLICY IF EXISTS "Anyone can create pledge" ON pledges;
DROP POLICY IF EXISTS "Admins can update pledges" ON pledges;

DROP POLICY IF EXISTS "Admins can manage uploads" ON uploads;
DROP POLICY IF EXISTS "Anyone can view uploads" ON uploads;

DROP POLICY IF EXISTS "Admins can view audit logs" ON audit_logs;
DROP POLICY IF EXISTS "Authenticated users can create audit logs" ON audit_logs;

DROP POLICY IF EXISTS "Anyone can view site settings" ON site_settings;
DROP POLICY IF EXISTS "Admins can update site settings" ON site_settings;

-- Create permissive policies for all tables
CREATE POLICY "Permissive read for gallery" 
  ON public.gallery FOR SELECT 
  USING (true);

CREATE POLICY "Permissive insert for gallery" 
  ON public.gallery FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Permissive update for gallery" 
  ON public.gallery FOR UPDATE 
  USING (true);

CREATE POLICY "Permissive delete for gallery" 
  ON public.gallery FOR DELETE 
  USING (true);

CREATE POLICY "Permissive read for meetings" 
  ON meetings FOR SELECT 
  USING (true);

CREATE POLICY "Permissive insert for meetings" 
  ON meetings FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Permissive update for meetings" 
  ON meetings FOR UPDATE 
  USING (true);

CREATE POLICY "Permissive delete for meetings" 
  ON meetings FOR DELETE 
  USING (true);

CREATE POLICY "Permissive read for guest_messages" 
  ON guest_messages FOR SELECT 
  USING (true);

CREATE POLICY "Permissive insert for guest_messages" 
  ON guest_messages FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Permissive update for guest_messages" 
  ON guest_messages FOR UPDATE 
  USING (true);

CREATE POLICY "Permissive delete for guest_messages" 
  ON guest_messages FOR DELETE 
  USING (true);

CREATE POLICY "Permissive read for guests" 
  ON guests FOR SELECT 
  USING (true);

CREATE POLICY "Permissive insert for guests" 
  ON guests FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Permissive update for guests" 
  ON guests FOR UPDATE 
  USING (true);

CREATE POLICY "Permissive delete for guests" 
  ON guests FOR DELETE 
  USING (true);

CREATE POLICY "Permissive read for users" 
  ON users FOR SELECT 
  USING (true);

CREATE POLICY "Permissive insert for users" 
  ON users FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Permissive update for users" 
  ON users FOR UPDATE 
  USING (true);

CREATE POLICY "Permissive delete for users" 
  ON users FOR DELETE 
  USING (true);

CREATE POLICY "Permissive read for attendances" 
  ON attendances FOR SELECT 
  USING (true);

CREATE POLICY "Permissive insert for attendances" 
  ON attendances FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Permissive update for attendances" 
  ON attendances FOR UPDATE 
  USING (true);

CREATE POLICY "Permissive delete for attendances" 
  ON attendances FOR DELETE 
  USING (true);

CREATE POLICY "Permissive read for contributions" 
  ON contributions FOR SELECT 
  USING (true);

CREATE POLICY "Permissive insert for contributions" 
  ON contributions FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Permissive update for contributions" 
  ON contributions FOR UPDATE 
  USING (true);

CREATE POLICY "Permissive delete for contributions" 
  ON contributions FOR DELETE 
  USING (true);

CREATE POLICY "Permissive read for pledges" 
  ON pledges FOR SELECT 
  USING (true);

CREATE POLICY "Permissive insert for pledges" 
  ON pledges FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Permissive update for pledges" 
  ON pledges FOR UPDATE 
  USING (true);

CREATE POLICY "Permissive delete for pledges" 
  ON pledges FOR DELETE 
  USING (true);

CREATE POLICY "Permissive read for uploads" 
  ON uploads FOR SELECT 
  USING (true);

CREATE POLICY "Permissive insert for uploads" 
  ON uploads FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Permissive update for uploads" 
  ON uploads FOR UPDATE 
  USING (true);

CREATE POLICY "Permissive delete for uploads" 
  ON uploads FOR DELETE 
  USING (true);

CREATE POLICY "Permissive read for audit_logs" 
  ON audit_logs FOR SELECT 
  USING (true);

CREATE POLICY "Permissive insert for audit_logs" 
  ON audit_logs FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Permissive update for audit_logs" 
  ON audit_logs FOR UPDATE 
  USING (true);

CREATE POLICY "Permissive delete for audit_logs" 
  ON audit_logs FOR DELETE 
  USING (true);

CREATE POLICY "Permissive read for site_settings" 
  ON site_settings FOR SELECT 
  USING (true);

CREATE POLICY "Permissive insert for site_settings" 
  ON site_settings FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Permissive update for site_settings" 
  ON site_settings FOR UPDATE 
  USING (true);

CREATE POLICY "Permissive delete for site_settings" 
  ON site_settings FOR DELETE 
  USING (true);

-- =====================================================
-- DEFAULT DATA INSERTION
-- =====================================================

-- Insert default gallery bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('gallery', 'gallery', true)
ON CONFLICT (id) DO NOTHING;

-- Insert default site settings if they don't exist
INSERT INTO site_settings (key, value) VALUES
  ('couple_info', '{"names": "Emmanuel & Martha", "wedding_date": "2026-02-14", "location": "Kampala, Uganda", "hero_image": ""}'),
  ('next_meeting_id', 'null'),
  ('default_currency', '"UGX"')
ON CONFLICT (key) DO NOTHING;

-- =====================================================
-- EXTENSIONS CHECK
-- =====================================================

-- Ensure uuid-ossp extension is available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- FUNCTION TO HELP WITH PESAPAL INTEGRATION
-- =====================================================

-- Create a function to generate a unique reference for Pesapal payments
CREATE OR REPLACE FUNCTION generate_pesapal_reference()
RETURNS TEXT AS $$
BEGIN
  RETURN 'WED-' || gen_random_uuid();
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- ADDITIONAL INDEXES FOR PERFORMANCE
-- =====================================================

-- Make sure all necessary indexes exist
CREATE INDEX IF NOT EXISTS idx_contributions_status ON contributions(status);
CREATE INDEX IF NOT EXISTS idx_contributions_created_at ON contributions(created_at);
CREATE INDEX IF NOT EXISTS idx_pledges_status ON pledges(status);
CREATE INDEX IF NOT EXISTS idx_pledges_type ON pledges(type);
CREATE INDEX IF NOT EXISTS idx_attendances_status ON attendances(status);
CREATE INDEX IF NOT EXISTS idx_meetings_starts_at ON meetings(starts_at);
CREATE INDEX IF NOT EXISTS idx_guest_messages_approved ON guest_messages(approved);
CREATE INDEX IF NOT EXISTS idx_uploads_bucket ON uploads(bucket);

-- =====================================================
-- TRIGGERS FOR UPDATED_AT FIELDS
-- =====================================================

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to gallery table if it doesn't have one
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_gallery_updated_at'
  ) THEN
    CREATE TRIGGER update_gallery_updated_at
      BEFORE UPDATE ON gallery
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;