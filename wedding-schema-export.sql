-- =====================================================
-- WEDDING WEBSITE DATABASE SCHEMA
-- =====================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLE: users
-- Admin and staff user profiles linked to auth
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE,
  full_name text NOT NULL,
  phone text,
  role text NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'finance', 'events', 'viewer')),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- =====================================================
-- TABLE: guests
-- Guest profiles for contributors and attendees
-- =====================================================
CREATE TABLE IF NOT EXISTS guests (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name text NOT NULL,
  phone text NOT NULL,
  email text,
  message text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_guests_phone ON guests(phone);
CREATE INDEX IF NOT EXISTS idx_guests_email ON guests(email);

-- =====================================================
-- TABLE: meetings
-- Wedding preparation meetings and events
-- =====================================================
CREATE TABLE IF NOT EXISTS meetings (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  description text,
  location text NOT NULL,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_meetings_starts_at ON meetings(starts_at);
CREATE INDEX IF NOT EXISTS idx_meetings_created_by ON meetings(created_by);

-- =====================================================
-- TABLE: attendances
-- Meeting registrations and attendance tracking
-- =====================================================
CREATE TABLE IF NOT EXISTS attendances (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  meeting_id uuid NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  guest_id uuid REFERENCES guests(id) ON DELETE SET NULL,
  name text NOT NULL,
  phone text NOT NULL,
  email text,
  status text DEFAULT 'registered' CHECK (status IN ('registered', 'attended', 'cancelled')),
  registered_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_attendances_meeting_id ON attendances(meeting_id);
CREATE INDEX IF NOT EXISTS idx_attendances_phone ON attendances(phone);
CREATE INDEX IF NOT EXISTS idx_attendances_guest_id ON attendances(guest_id);
CREATE INDEX IF NOT EXISTS idx_attendances_status ON attendances(status);

-- =====================================================
-- TABLE: contributions
-- Real monetary contributions via Pesapal
-- =====================================================
CREATE TABLE IF NOT EXISTS contributions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  guest_id uuid REFERENCES guests(id) ON DELETE SET NULL,
  amount numeric(12,2) NOT NULL CHECK (amount > 0),
  currency text DEFAULT 'UGX' NOT NULL,
  pesapal_reference text UNIQUE,
  pesapal_transaction_id text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contributions_guest_id ON contributions(guest_id);
CREATE INDEX IF NOT EXISTS idx_contributions_pesapal_ref ON contributions(pesapal_reference);
CREATE INDEX IF NOT EXISTS idx_contributions_status ON contributions(status);
CREATE INDEX IF NOT EXISTS idx_contributions_created_at ON contributions(created_at);

-- =====================================================
-- TABLE: pledges
-- Guest promises for money or items
-- =====================================================
CREATE TABLE IF NOT EXISTS pledges (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  guest_id uuid REFERENCES guests(id) ON DELETE SET NULL,
  type text NOT NULL CHECK (type IN ('money', 'item')),
  item_description text,
  amount numeric(12,2) CHECK (amount IS NULL OR amount > 0),
  quantity integer CHECK (quantity IS NULL OR quantity > 0),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'fulfilled', 'cancelled')),
  phone text NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now(),
  fulfilled_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_pledges_phone ON pledges(phone);
CREATE INDEX IF NOT EXISTS idx_pledges_guest_id ON pledges(guest_id);
CREATE INDEX IF NOT EXISTS idx_pledges_status ON pledges(status);
CREATE INDEX IF NOT EXISTS idx_pledges_type ON pledges(type);

-- =====================================================
-- TABLE: guest_messages
-- Guest book wishes and messages
-- =====================================================
CREATE TABLE IF NOT EXISTS guest_messages (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  guest_id uuid REFERENCES guests(id) ON DELETE SET NULL,
  message text NOT NULL,
  approved boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_guest_messages_approved ON guest_messages(approved);
CREATE INDEX IF NOT EXISTS idx_guest_messages_guest_id ON guest_messages(guest_id);

-- =====================================================
-- TABLE: uploads
-- Gallery and image metadata
-- =====================================================
CREATE TABLE IF NOT EXISTS uploads (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  guest_id uuid REFERENCES guests(id) ON DELETE SET NULL,
  filename text NOT NULL,
  url text NOT NULL,
  bucket text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  uploaded_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_uploads_guest_id ON uploads(guest_id);
CREATE INDEX IF NOT EXISTS idx_uploads_bucket ON uploads(bucket);

-- =====================================================
-- TABLE: audit_logs
-- Activity tracking for compliance and security
-- =====================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id bigserial PRIMARY KEY,
  actor_id uuid REFERENCES users(id) ON DELETE SET NULL,
  action text NOT NULL,
  details jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_id ON audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- =====================================================
-- TABLE: site_settings
-- Site-wide configuration
-- =====================================================
CREATE TABLE IF NOT EXISTS site_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamptz DEFAULT now()
);

-- Insert default site settings
INSERT INTO site_settings (key, value) VALUES
  ('couple_info', '{"names": "Emmanuel & Martha", "wedding_date": "2026-02-14", "location": "Kampala, Uganda", "hero_image": ""}'),
  ('next_meeting_id', 'null'),
  ('default_currency', '"UGX"')
ON CONFLICT (key) DO NOTHING;

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendances ENABLE ROW LEVEL SECURITY;
ALTER TABLE contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pledges ENABLE ROW LEVEL SECURITY;
ALTER TABLE guest_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- USERS TABLE POLICIES
-- =====================================================

CREATE POLICY "Admins can view all users"
  ON users FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can update users"
  ON users FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can insert users"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- =====================================================
-- GUESTS TABLE POLICIES
-- =====================================================

CREATE POLICY "Admins can view all guests"
  ON guests FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('admin', 'finance', 'events')
    )
  );

CREATE POLICY "Anyone can create guest profile"
  ON guests FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- =====================================================
-- MEETINGS TABLE POLICIES
-- =====================================================

CREATE POLICY "Anyone can view meetings"
  ON meetings FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admins can create meetings"
  ON meetings FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('admin', 'events')
    )
  );

CREATE POLICY "Admins can update meetings"
  ON meetings FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('admin', 'events')
    )
  );

CREATE POLICY "Admins can delete meetings"
  ON meetings FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('admin', 'events')
    )
  );

-- =====================================================
-- ATTENDANCES TABLE POLICIES
-- =====================================================

CREATE POLICY "Admins can view all attendances"
  ON attendances FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('admin', 'events')
    )
  );

CREATE POLICY "Anyone can register for meetings"
  ON attendances FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can update attendance status"
  ON attendances FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('admin', 'events')
    )
  );

-- =====================================================
-- CONTRIBUTIONS TABLE POLICIES
-- =====================================================

CREATE POLICY "Admins can view all contributions"
  ON contributions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('admin', 'finance')
    )
  );

CREATE POLICY "Anyone can create contribution"
  ON contributions FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- =====================================================
-- PLEDGES TABLE POLICIES
-- =====================================================

CREATE POLICY "Admins can view all pledges"
  ON pledges FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('admin', 'finance', 'events')
    )
  );

CREATE POLICY "Anyone can create pledge"
  ON pledges FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can update pledges"
  ON pledges FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('admin', 'finance', 'events')
    )
  );

-- =====================================================
-- GUEST_MESSAGES TABLE POLICIES
-- =====================================================

CREATE POLICY "Anyone can view approved messages"
  ON guest_messages FOR SELECT
  TO anon, authenticated
  USING (approved = true);

CREATE POLICY "Admins can view all messages"
  ON guest_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

CREATE POLICY "Anyone can create message"
  ON guest_messages FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can update messages"
  ON guest_messages FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- =====================================================
-- UPLOADS TABLE POLICIES
-- =====================================================

CREATE POLICY "Anyone can view uploads"
  ON uploads FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admins can manage uploads"
  ON uploads FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- =====================================================
-- AUDIT_LOGS TABLE POLICIES
-- =====================================================

CREATE POLICY "Admins can view audit logs"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

CREATE POLICY "Authenticated users can create audit logs"
  ON audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = actor_id);

-- =====================================================
-- SITE_SETTINGS TABLE POLICIES
-- =====================================================

CREATE POLICY "Anyone can view site settings"
  ON site_settings FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admins can update site settings"
  ON site_settings FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );