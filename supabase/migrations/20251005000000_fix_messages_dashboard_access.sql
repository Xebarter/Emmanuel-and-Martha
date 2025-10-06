-- Migration to fix dashboard access to guest messages
-- This ensures authenticated users (admins) can view all messages in the dashboard

-- Drop existing policies
DROP POLICY IF EXISTS "Public can view approved messages" ON guest_messages;
DROP POLICY IF EXISTS "Admins can manage messages" ON guest_messages;

-- Create policy allowing authenticated users to view all messages
-- This enables the admin dashboard to display all messages regardless of approval status
CREATE POLICY "Authenticated users can view all messages" ON guest_messages
  FOR SELECT
  TO authenticated
  USING (true);

-- Ensure insert policy exists for public submissions
CREATE POLICY "Public can submit messages" ON guest_messages
  FOR INSERT
  WITH CHECK (true);

-- Ensure authenticated users can update messages (for approval functionality)
CREATE POLICY "Authenticated users can update messages" ON guest_messages
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Ensure authenticated users can delete messages
CREATE POLICY "Authenticated users can delete messages" ON guest_messages
  FOR DELETE
  TO authenticated
  USING (true);