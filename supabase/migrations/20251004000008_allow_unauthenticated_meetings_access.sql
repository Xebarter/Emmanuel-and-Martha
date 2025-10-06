-- Allow unauthenticated access to meetings and attendances tables
-- This enables the dashboard to manage meetings without authentication

-- Disable RLS on meetings table
ALTER TABLE meetings DISABLE ROW LEVEL SECURITY;

-- Disable RLS on attendances table
ALTER TABLE attendances DISABLE ROW LEVEL SECURITY;

-- If you prefer to keep RLS but make it more permissive, uncomment the following section:
/*
-- Drop existing policies for meetings
DROP POLICY IF EXISTS "Anyone can view meetings" ON meetings;
DROP POLICY IF EXISTS "Admins can create meetings" ON meetings;
DROP POLICY IF EXISTS "Admins can update meetings" ON meetings;
DROP POLICY IF EXISTS "Admins can delete meetings" ON meetings;

-- Create permissive policies for meetings table
CREATE POLICY "Anyone can view meetings"
  ON meetings FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can create meetings"
  ON meetings FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can update meetings"
  ON meetings FOR UPDATE
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can delete meetings"
  ON meetings FOR DELETE
  TO anon, authenticated
  USING (true);

-- Drop existing policies for attendances
DROP POLICY IF EXISTS "Admins can view all attendances" ON attendances;
DROP POLICY IF EXISTS "Anyone can register for meetings" ON attendances;
DROP POLICY IF EXISTS "Admins can update attendance status" ON attendances;

-- Create permissive policies for attendances table
CREATE POLICY "Anyone can view all attendances"
  ON attendances FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can register for meetings"
  ON attendances FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can update attendance status"
  ON attendances FOR UPDATE
  TO anon, authenticated
  USING (true);
*/