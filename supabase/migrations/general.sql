-- =====================================================
-- 1. Enable necessary extensions
-- =====================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "moddatetime";
CREATE EXTENSION IF NOT EXISTS "pgjwt";

-- =====================================================
-- 2. Create custom types
-- =====================================================
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'finance', 'events', 'viewer');
    CREATE TYPE attendance_status AS ENUM ('registered', 'attended', 'cancelled', 'waiting');
    CREATE TYPE contribution_status AS ENUM ('pending', 'completed', 'failed', 'refunded');
    CREATE TYPE pledge_status AS ENUM ('pending', 'fulfilled', 'cancelled', 'partially_fulfilled');
    CREATE TYPE pledge_type AS ENUM ('money', 'item', 'service');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =====================================================
-- 3. Create tables
-- =====================================================

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE,
  full_name text NOT NULL,
  phone text,
  role user_role NOT NULL DEFAULT 'viewer',
  avatar_url text,
  last_login timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Guests table
CREATE TABLE IF NOT EXISTS guests (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name text NOT NULL,
  phone text NOT NULL,
  email text,
  address text,
  is_attending boolean DEFAULT false,
  plus_ones integer DEFAULT 0,
  dietary_restrictions text[],
  message text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT unique_guest_phone UNIQUE (phone)
);

-- Meetings table
CREATE TABLE IF NOT EXISTS meetings (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  description text,
  location text NOT NULL,
  address text,
  latitude numeric(10, 7),
  longitude numeric(10, 7),
  starts_at timestamptz NOT NULL,
  ends_at timestamptz,
  max_attendees integer,
  is_active boolean DEFAULT true,
  cover_image_url text,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_meeting_times CHECK (ends_at IS NULL OR starts_at < ends_at)
);

-- Attendances table
CREATE TABLE IF NOT EXISTS attendances (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  meeting_id uuid NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  guest_id uuid REFERENCES guests(id) ON DELETE SET NULL,
  name text NOT NULL,
  phone text NOT NULL,
  email text,
  status attendance_status DEFAULT 'registered',
  num_guests integer DEFAULT 0,
  special_requests text,
  registered_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT unique_meeting_guest UNIQUE (meeting_id, phone)
);

-- Contributions table
CREATE TABLE IF NOT EXISTS contributions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  guest_id uuid REFERENCES guests(id) ON DELETE SET NULL,
  amount numeric(12,2) NOT NULL CHECK (amount > 0),
  currency text DEFAULT 'UGX' NOT NULL,
  payment_method text,
  pesapal_reference text UNIQUE,
  pesapal_transaction_id text,
  status contribution_status DEFAULT 'pending',
  metadata jsonb DEFAULT '{}'::jsonb,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Pledges table
CREATE TABLE IF NOT EXISTS pledges (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  guest_id uuid REFERENCES guests(id) ON DELETE SET NULL,
  type pledge_type NOT NULL,
  item_description text,
  amount numeric(12,2) CHECK (amount IS NULL OR amount > 0),
  quantity integer CHECK (quantity IS NULL OR quantity > 0),
  status pledge_status DEFAULT 'pending',
  phone text NOT NULL,
  email text,
  notes text,
  deadline_date date,
  is_anonymous boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  fulfilled_at timestamptz,
  fulfilled_amount numeric(12,2) DEFAULT 0
);

-- Guest messages table
CREATE TABLE IF NOT EXISTS guest_messages (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  guest_id uuid REFERENCES guests(id) ON DELETE SET NULL,
  message text NOT NULL,
  is_approved boolean DEFAULT false,
  is_featured boolean DEFAULT false,
  ip_address inet,
  user_agent text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Gallery table
CREATE TABLE IF NOT EXISTS gallery (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  url text NOT NULL,
  title text NOT NULL,
  description text,
  category text,
  is_featured boolean DEFAULT false,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  action text NOT NULL,
  table_name text,
  record_id uuid,
  old_values jsonb,
  new_values jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- Site settings table
CREATE TABLE IF NOT EXISTS site_settings (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  key text NOT NULL UNIQUE,
  value jsonb NOT NULL,
  description text,
  is_public boolean DEFAULT false,
  updated_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =====================================================
-- 4. Create indexes for performance
-- =====================================================

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Guests indexes
CREATE INDEX IF NOT EXISTS idx_guests_phone ON guests(phone);
CREATE INDEX IF NOT EXISTS idx_guests_email ON guests(email);
CREATE INDEX IF NOT EXISTS idx_guests_attending ON guests(is_attending);

-- Meetings indexes
CREATE INDEX IF NOT EXISTS idx_meetings_starts_at ON meetings(starts_at);
CREATE INDEX IF NOT EXISTS idx_meetings_created_by ON meetings(created_by);
CREATE INDEX IF NOT EXISTS idx_meetings_active ON meetings(is_active);

-- Attendances indexes
CREATE INDEX IF NOT EXISTS idx_attendances_meeting_id ON attendances(meeting_id);
CREATE INDEX IF NOT EXISTS idx_attendances_phone ON attendances(phone);
CREATE INDEX IF NOT EXISTS idx_attendances_guest_id ON attendances(guest_id);
CREATE INDEX IF NOT EXISTS idx_attendances_status ON attendances(status);

-- Contributions indexes
CREATE INDEX IF NOT EXISTS idx_contributions_guest_id ON contributions(guest_id);
CREATE INDEX IF NOT EXISTS idx_contributions_pesapal_ref ON contributions(pesapal_reference);
CREATE INDEX IF NOT EXISTS idx_contributions_status ON contributions(status);
CREATE INDEX IF NOT EXISTS idx_contributions_created_at ON contributions(created_at);
CREATE INDEX IF NOT EXISTS idx_contributions_currency ON contributions(currency);

-- Pledges indexes
CREATE INDEX IF NOT EXISTS idx_pledges_phone ON pledges(phone);
CREATE INDEX IF NOT EXISTS idx_pledges_guest_id ON pledges(guest_id);
CREATE INDEX IF NOT EXISTS idx_pledges_status ON pledges(status);
CREATE INDEX IF NOT EXISTS idx_pledges_type ON pledges(type);
CREATE INDEX IF NOT EXISTS idx_pledges_deadline ON pledges(deadline_date);

-- Guest messages indexes
CREATE INDEX IF NOT EXISTS idx_guest_messages_guest_id ON guest_messages(guest_id);
CREATE INDEX IF NOT EXISTS idx_guest_messages_approved ON guest_messages(is_approved);
CREATE INDEX IF NOT EXISTS idx_guest_messages_featured ON guest_messages(is_featured);

-- Gallery indexes
CREATE INDEX IF NOT EXISTS idx_gallery_category ON gallery(category);
CREATE INDEX IF NOT EXISTS idx_gallery_featured ON gallery(is_featured);
CREATE INDEX IF NOT EXISTS idx_gallery_created_at ON gallery(created_at);

-- Audit logs indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_record ON audit_logs(table_name, record_id);

-- =====================================================
-- 5. Create functions
-- =====================================================

-- Function to update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to get guest statistics
CREATE OR REPLACE FUNCTION get_guest_statistics()
RETURNS TABLE (
  total_guests bigint,
  confirmed_guests bigint,
  pending_rsvp bigint,
  total_attending bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::bigint AS total_guests,
    COUNT(*) FILTER (WHERE is_attending IS NOT NULL)::bigint AS confirmed_guests,
    COUNT(*) FILTER (WHERE is_attending IS NULL)::bigint AS pending_rsvp,
    COALESCE(SUM(CASE WHEN is_attending THEN 1 + COALESCE(plus_ones, 0) ELSE 0 END), 0)::bigint AS total_attending
  FROM guests;
END;
$$ LANGUAGE plpgsql;

-- Function to get contribution statistics
CREATE OR REPLACE FUNCTION get_contribution_statistics()
RETURNS TABLE (
  total_contributions numeric,
  total_contributors bigint,
  currency text
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(amount), 0) AS total_contributions,
    COUNT(DISTINCT guest_id) AS total_contributors,
    COALESCE((SELECT value->>0 FROM jsonb_array_elements(ARRAY(
      SELECT value FROM site_settings WHERE key = 'default_currency'
    )::jsonb) LIMIT 1), 'UGX') AS currency
  FROM contributions
  WHERE status = 'completed';
END;
$$ LANGUAGE plpgsql;

-- Function to handle new user signups
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, phone, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1)),
    NEW.phone,
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'viewer'::user_role)
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    phone = EXCLUDED.phone;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log changes for audit
CREATE OR REPLACE FUNCTION log_changes()
RETURNS TRIGGER AS $$
DECLARE
  changes jsonb := '{}'::jsonb;
  old_data jsonb;
  new_data jsonb;
  user_id uuid;
  key text;
  key_record RECORD;
  has_changes boolean := false;
BEGIN
  -- Get the current user ID from the JWT
  BEGIN
    user_id := auth.uid();
  EXCEPTION WHEN OTHERS THEN
    user_id := NULL;
  END;

  -- Convert OLD and NEW to JSONB
  IF TG_OP = 'UPDATE' THEN
    old_data := to_jsonb(OLD);
    new_data := to_jsonb(NEW);
    
    -- Get all keys from new_data
    FOR key_record IN SELECT jsonb_object_keys(new_data) AS key_name LOOP
      key := key_record.key_name;
      IF (new_data->>key) IS DISTINCT FROM (old_data->>key) THEN
        changes := jsonb_set(
          changes,
          ARRAY[key],
          jsonb_build_array(new_data->key, old_data->key)
        );
        has_changes := true;
      END IF;
    END LOOP;
    
    -- Only log if there are changes
    IF has_changes THEN
      INSERT INTO audit_logs (
        user_id,
        action,
        table_name,
        record_id,
        old_values,
        new_values,
        ip_address,
        user_agent
      ) VALUES (
        user_id,
        TG_OP,
        TG_TABLE_NAME,
        (NEW).id,
        old_data,
        new_data,
        (current_setting('request.headers', true)::json->>'x-forwarded-for')::inet,
        current_setting('request.headers', true)::json->>'user-agent'
      );
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO audit_logs (
      user_id,
      action,
      table_name,
      record_id,
      old_values,
      ip_address,
      user_agent
    ) VALUES (
      user_id,
      TG_OP,
      TG_TABLE_NAME,
      (OLD).id,
      to_jsonb(OLD),
      (current_setting('request.headers', true)::json->>'x-forwarded-for')::inet,
      current_setting('request.headers', true)::json->>'user-agent'
    );
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO audit_logs (
      user_id,
      action,
      table_name,
      record_id,
      new_values,
      ip_address,
      user_agent
    ) VALUES (
      user_id,
      TG_OP,
      TG_TABLE_NAME,
      (NEW).id,
      to_jsonb(NEW),
      (current_setting('request.headers', true)::json->>'x-forwarded-for')::inet,
      current_setting('request.headers', true)::json->>'user-agent'
    );
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 6. Create triggers
-- =====================================================

-- Function to add audit trigger to a table
CREATE OR REPLACE FUNCTION add_audit_trigger(table_name text) RETURNS void AS $$
BEGIN
  EXECUTE format('
    DROP TRIGGER IF EXISTS %I ON %I;
    CREATE TRIGGER %I
    AFTER INSERT OR UPDATE OR DELETE ON %I
    FOR EACH ROW EXECUTE FUNCTION log_changes();
  ', 
    'audit_trigger_' || table_name, 
    table_name,
    'audit_trigger_' || table_name, 
    table_name
  );
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_guests_updated_at
BEFORE UPDATE ON guests
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_meetings_updated_at
BEFORE UPDATE ON meetings
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_attendances_updated_at
BEFORE UPDATE ON attendances
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contributions_updated_at
BEFORE UPDATE ON contributions
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pledges_updated_at
BEFORE UPDATE ON pledges
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_guest_messages_updated_at
BEFORE UPDATE ON guest_messages
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gallery_updated_at
BEFORE UPDATE ON gallery
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_site_settings_updated_at
BEFORE UPDATE ON site_settings
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add audit triggers
SELECT add_audit_trigger('users');
SELECT add_audit_trigger('guests');
SELECT add_audit_trigger('meetings');
SELECT add_audit_trigger('attendances');
SELECT add_audit_trigger('contributions');
SELECT add_audit_trigger('pledges');
SELECT add_audit_trigger('guest_messages');
SELECT add_audit_trigger('gallery');
SELECT add_audit_trigger('site_settings');

-- Add trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- 7. Set up Row Level Security (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendances ENABLE ROW LEVEL SECURITY;
ALTER TABLE contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pledges ENABLE ROW LEVEL SECURITY;
ALTER TABLE guest_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE
  USING (auth.uid() = id);

-- Guests policies
CREATE POLICY "Public can view guests" ON guests
  FOR SELECT
  USING (true);

CREATE POLICY "Guests can create their own profile" ON guests
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Guests can update their own profile" ON guests
  FOR UPDATE
  USING (phone IN (
    SELECT phone FROM auth.users
    WHERE id = auth.uid() AND phone IS NOT NULL
    UNION
    SELECT email FROM auth.users
    WHERE id = auth.uid() AND email IS NOT NULL
  ));

-- Meetings policies
CREATE POLICY "Public can view active meetings" ON meetings
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage meetings" ON meetings
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid() AND users.role = 'admin'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid() AND users.role = 'admin'
  ));

-- Attendances policies
CREATE POLICY "Public can register for meetings" ON attendances
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can view their own registrations" ON attendances
  FOR SELECT
  USING (
    phone IN (
      SELECT phone FROM auth.users WHERE id = auth.uid()
      UNION
      SELECT email FROM auth.users WHERE id = auth.uid()
    )
    OR guest_id IN (
      SELECT id FROM guests WHERE phone IN (
        SELECT phone FROM auth.users WHERE id = auth.uid()
        UNION
        SELECT email FROM auth.users WHERE id = auth.uid()
      )
    )
  );

-- Contributions policies
CREATE POLICY "Public can create contributions" ON contributions
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can view their own contributions" ON contributions
  FOR SELECT
  USING (
    guest_id IN (
      SELECT id FROM guests WHERE phone IN (
        SELECT phone FROM auth.users WHERE id = auth.uid()
        UNION
        SELECT email FROM auth.users WHERE id = auth.uid()
      )
    )
    OR guest_id IS NULL
  );

-- Pledges policies
CREATE POLICY "Public can create pledges" ON pledges
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can view their own pledges" ON pledges
  FOR SELECT
  USING (
    guest_id IN (
      SELECT id FROM guests WHERE phone IN (
        SELECT phone FROM auth.users WHERE id = auth.uid()
        UNION
        SELECT email FROM auth.users WHERE id = auth.uid()
      )
    )
    OR phone IN (
      SELECT phone FROM auth.users WHERE id = auth.uid()
      UNION
      SELECT email FROM auth.users WHERE id = auth.uid()
    )
    OR is_anonymous = false
  );

-- Guest messages policies
CREATE POLICY "Public can submit messages" ON guest_messages
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Public can view approved messages" ON guest_messages
  FOR SELECT
  USING (is_approved = true);

CREATE POLICY "Admins can manage messages" ON guest_messages
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid() AND users.role = 'admin'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid() AND users.role = 'admin'
  ));

-- Gallery policies
-- Allow public access to gallery
CREATE POLICY "Public can view gallery" ON gallery
  FOR SELECT
  USING (true);

CREATE POLICY "Public can add to gallery" ON gallery
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Public can update gallery" ON gallery
  FOR UPDATE
  USING (true);

CREATE POLICY "Public can delete from gallery" ON gallery
  FOR DELETE
  USING (true);

-- Site Settings policies
CREATE POLICY "Public can view public settings" ON site_settings
  FOR SELECT
  USING (is_public = true);

CREATE POLICY "Admins can manage settings" ON site_settings
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid() AND users.role = 'admin'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid() AND users.role = 'admin'
  ));
-- 8. Set up storage
-- =====================================================

-- Create storage bucket for gallery
INSERT INTO storage.buckets (id, name, public)
VALUES ('gallery', 'gallery', true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  public = EXCLUDED.public;

-- Set up storage policies for the gallery bucket
-- Allow public read access to gallery
CREATE POLICY "Public read access for gallery"
ON storage.objects FOR SELECT
USING (bucket_id = 'gallery');

-- Allow anyone to upload to gallery bucket
CREATE POLICY "Public uploads to gallery"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'gallery');

-- Allow anyone to update objects in gallery bucket
CREATE POLICY "Public updates to gallery"
ON storage.objects FOR UPDATE
USING (bucket_id = 'gallery');

-- Allow anyone to delete objects in gallery bucket
CREATE POLICY "Public deletes from gallery"
ON storage.objects FOR DELETE
USING (bucket_id = 'gallery');

-- =====================================================
-- 9. Insert default data
-- =====================================================

-- Insert default site settings
INSERT INTO site_settings (key, value, description, is_public) VALUES
  ('site_title', '"Emmanuel & Martha''s Wedding"', 'The main title of the wedding website', true),
  ('couple_names', '"Emmanuel & Martha"', 'Names of the couple', true),
  ('wedding_date', '"2026-02-14T15:00:00+03:00"', 'Wedding date and time', true),
  ('wedding_location', '{"name": "Kampala Serena Hotel", "address": "Kampala, Uganda", "latitude": 0.3163, "longitude": 32.5822}', 'Wedding venue details', true),
  ('default_currency', '"UGX"', 'Default currency for monetary values', true),
  ('contact_email', '"info@johnandpriscilla.com"', 'Contact email for inquiries', true),
  ('rsvp_deadline', '"2026-01-31T23:59:59+03:00"', 'RSVP deadline date and time', true),
  ('gallery_enabled', 'true', 'Whether the gallery section is enabled', true),
  ('guestbook_enabled', 'true', 'Whether the guestbook is enabled', true),
  ('contribution_enabled', 'true', 'Whether contributions are enabled', true)
ON CONFLICT (key) DO UPDATE SET 
  value = EXCLUDED.value,
  description = EXCLUDED.description,
  is_public = EXCLUDED.is_public,
  updated_at = now();

-- =====================================================
-- 10. Grant permissions
-- =====================================================

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO postgres, anon, authenticated, service_role;

-- Grant storage permissions
GRANT USAGE ON SCHEMA storage TO postgres, anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA storage TO postgres, anon, authenticated, service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA storage TO postgres, anon, authenticated, service_role;

-- =====================================================
-- 11. Enable webhooks if needed
-- =====================================================
-- ALTER SYSTEM commands removed as they cannot be run inside a transaction block
-- These settings should be configured at the database level by the administrator if needed

-- =====================================================
-- 12. Notify that setup is complete
-- =====================================================
DO $$ 
BEGIN
  RAISE NOTICE 'Database setup completed successfully!';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Create your first admin user through the Supabase Auth system';
  RAISE NOTICE '2. Update the site settings through the dashboard or SQL editor';
  RAISE NOTICE '3. Add your first meeting/event';
END $$;