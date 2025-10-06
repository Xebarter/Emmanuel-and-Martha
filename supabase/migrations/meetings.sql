/*
  Additional Tables for Dashboard/Meetings Functionality
  ======================================================
  
  This SQL script adds additional tables to enhance the dashboard and meetings 
  functionality in the wedding website admin panel, working with the existing schema.
*/

-- Add status column to meetings table if it doesn't exist
ALTER TABLE meetings ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'scheduled' 
  CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled'));

-- Add virtual meeting fields if they don't exist
ALTER TABLE meetings ADD COLUMN IF NOT EXISTS is_virtual BOOLEAN DEFAULT FALSE;
ALTER TABLE meetings ADD COLUMN IF NOT EXISTS meeting_link TEXT;
ALTER TABLE meetings ADD COLUMN IF NOT EXISTS organizer VARCHAR(255);

-- Add updated_at column if it doesn't exist
ALTER TABLE meetings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- MEETING ATTENDEES TABLE
-- Tracks who is attending which meetings
CREATE TABLE IF NOT EXISTS meeting_attendees (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  meeting_id uuid REFERENCES meetings(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  guest_name VARCHAR(255), -- For non-user attendees
  guest_email VARCHAR(255),
  guest_phone VARCHAR(50),
  rsvp_status VARCHAR(50) DEFAULT 'pending' CHECK (rsvp_status IN ('pending', 'confirmed', 'declined', 'maybe')),
  attendance_status VARCHAR(50) DEFAULT 'not_attended' CHECK (attendance_status IN ('not_attended', 'attended', 'late')),
  notes TEXT,
  registered_at TIMESTAMPTZ DEFAULT NOW(),
  attended_at TIMESTAMPTZ,
  UNIQUE(meeting_id, user_id),
  UNIQUE(meeting_id, guest_email)
);

-- MEETING AGENDAS TABLE
-- Stores agenda items for meetings
CREATE TABLE IF NOT EXISTS meeting_agendas (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  meeting_id uuid REFERENCES meetings(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  order_number INTEGER,
  duration_minutes INTEGER,
  presenter uuid REFERENCES auth.users(id),
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- MEETING NOTES TABLE
-- Stores notes taken during meetings
CREATE TABLE IF NOT EXISTS meeting_notes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  meeting_id uuid REFERENCES meetings(id) ON DELETE CASCADE,
  agenda_item_id uuid REFERENCES meeting_agendas(id) ON DELETE SET NULL,
  author uuid REFERENCES auth.users(id),
  content TEXT NOT NULL,
  is_private BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- DASHBOARD WIDGETS TABLE
-- Stores configuration for dashboard widgets
CREATE TABLE IF NOT EXISTS dashboard_widgets (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  widget_type VARCHAR(100) NOT NULL,
  title VARCHAR(255) NOT NULL,
  config JSONB,
  position_x INTEGER,
  position_y INTEGER,
  width INTEGER DEFAULT 4,
  height INTEGER DEFAULT 4,
  is_visible BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- DASHBOARD REPORTS TABLE
-- Stores generated reports for dashboard display
CREATE TABLE IF NOT EXISTS dashboard_reports (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  report_type VARCHAR(100) NOT NULL,
  data JSONB,
  generated_by uuid REFERENCES auth.users(id),
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  period_start TIMESTAMPTZ,
  period_end TIMESTAMPTZ
);

-- ADMIN USERS TABLE
-- Extends auth.users with dashboard-specific information
CREATE TABLE IF NOT EXISTS admin_users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name VARCHAR(255) NOT NULL,
  department VARCHAR(100),
  role VARCHAR(50) DEFAULT 'viewer' CHECK (role IN ('admin', 'manager', 'editor', 'viewer')),
  phone VARCHAR(50),
  avatar_url TEXT,
  last_login TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- NOTIFICATIONS TABLE
-- System notifications for dashboard users
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipient_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT,
  type VARCHAR(50) DEFAULT 'info' CHECK (type IN ('info', 'warning', 'error', 'success')),
  is_read BOOLEAN DEFAULT FALSE,
  related_entity_type VARCHAR(100), -- 'meeting', 'report', etc.
  related_entity_id uuid,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_meetings_starts_at ON meetings(starts_at);
CREATE INDEX IF NOT EXISTS idx_meetings_status ON meetings(status) WHERE status IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_meetings_created_by ON meetings(created_by);
CREATE INDEX IF NOT EXISTS idx_meeting_attendees_meeting_id ON meeting_attendees(meeting_id);
CREATE INDEX IF NOT EXISTS idx_meeting_attendees_user_id ON meeting_attendees(user_id);
CREATE INDEX IF NOT EXISTS idx_meeting_attendees_rsvp_status ON meeting_attendees(rsvp_status);
CREATE INDEX IF NOT EXISTS idx_meeting_agendas_meeting_id ON meeting_agendas(meeting_id);
CREATE INDEX IF NOT EXISTS idx_meeting_agendas_status ON meeting_agendas(status);
CREATE INDEX IF NOT EXISTS idx_meeting_notes_meeting_id ON meeting_notes(meeting_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_widgets_user_id ON dashboard_widgets(user_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_widgets_visible ON dashboard_widgets(is_visible);
CREATE INDEX IF NOT EXISTS idx_dashboard_reports_type ON dashboard_reports(report_type);
CREATE INDEX IF NOT EXISTS idx_dashboard_reports_generated_by ON dashboard_reports(generated_by);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_id ON notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON admin_users(role);
CREATE INDEX IF NOT EXISTS idx_admin_users_is_active ON admin_users(is_active);

-- ENABLE ROW LEVEL SECURITY
ALTER TABLE meeting_attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_agendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_widgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- MEETING ATTENDEES POLICIES
CREATE POLICY "Users can view meeting attendees" ON meeting_attendees FOR SELECT USING (TRUE);
CREATE POLICY "Authenticated users can register for meetings" ON meeting_attendees FOR INSERT TO authenticated WITH CHECK (TRUE);
CREATE POLICY "Users can update their own attendance" ON meeting_attendees FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete their own attendance" ON meeting_attendees FOR DELETE USING (user_id = auth.uid());

-- MEETING AGENDAS POLICIES
CREATE POLICY "Users can view meeting agendas" ON meeting_agendas FOR SELECT USING (TRUE);
CREATE POLICY "Meeting organizers can manage agendas" ON meeting_agendas FOR ALL USING (
  EXISTS (
    SELECT 1 FROM meetings WHERE meetings.id = meeting_agendas.meeting_id AND meetings.created_by = auth.uid()
  )
);

-- MEETING NOTES POLICIES
CREATE POLICY "Users can view non-private meeting notes" ON meeting_notes FOR SELECT USING (is_private = FALSE OR author = auth.uid());
CREATE POLICY "Users can create meeting notes" ON meeting_notes FOR INSERT TO authenticated WITH CHECK (TRUE);
CREATE POLICY "Users can update their own notes" ON meeting_notes FOR UPDATE USING (author = auth.uid());
CREATE POLICY "Users can delete their own notes" ON meeting_notes FOR DELETE USING (author = auth.uid());

-- DASHBOARD WIDGETS POLICIES
CREATE POLICY "Users can view their own widgets" ON dashboard_widgets FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can manage their own widgets" ON dashboard_widgets FOR ALL USING (user_id = auth.uid());

-- DASHBOARD REPORTS POLICIES
CREATE POLICY "Users can view reports" ON dashboard_reports FOR SELECT USING (TRUE);
CREATE POLICY "Authenticated users can create reports" ON dashboard_reports FOR INSERT TO authenticated WITH CHECK (TRUE);

-- ADMIN USERS POLICIES
CREATE POLICY "Users can view their own admin profile" ON admin_users FOR SELECT USING (id = auth.uid());
CREATE POLICY "Users can update their own admin profile" ON admin_users FOR UPDATE USING (id = auth.uid());
CREATE POLICY "Admins can manage admin users" ON admin_users FOR ALL USING (
  EXISTS (
    SELECT 1 FROM admin_users au WHERE au.id = auth.uid() AND au.role = 'admin'
  )
);

-- NOTIFICATIONS POLICIES
CREATE POLICY "Users can view their own notifications" ON notifications FOR SELECT USING (recipient_id = auth.uid());
CREATE POLICY "System can create notifications" ON notifications FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Users can update their own notifications" ON notifications FOR UPDATE USING (recipient_id = auth.uid());

-- INITIAL DATA
INSERT INTO admin_users (id, full_name, role)
SELECT id, COALESCE(raw_user_meta_data->>'full_name', email) as full_name, 'admin'
FROM auth.users
WHERE id NOT IN (SELECT id FROM admin_users)
ON CONFLICT (id) DO UPDATE SET updated_at = NOW();

-- FUNCTION TO UPDATE updated_at COLUMN
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- TRIGGERS TO AUTO-UPDATE updated_at
-- Drop triggers if they exist and recreate them
DROP TRIGGER IF EXISTS update_meetings_updated_at ON meetings;
CREATE TRIGGER update_meetings_updated_at BEFORE UPDATE ON meetings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_meeting_agendas_updated_at ON meeting_agendas;
CREATE TRIGGER update_meeting_agendas_updated_at BEFORE UPDATE ON meeting_agendas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_meeting_notes_updated_at ON meeting_notes;
CREATE TRIGGER update_meeting_notes_updated_at BEFORE UPDATE ON meeting_notes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_dashboard_widgets_updated_at ON dashboard_widgets;
CREATE TRIGGER update_dashboard_widgets_updated_at BEFORE UPDATE ON dashboard_widgets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_admin_users_updated_at ON admin_users;
CREATE TRIGGER update_admin_users_updated_at BEFORE UPDATE ON admin_users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();