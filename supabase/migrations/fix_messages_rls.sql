-- This migration fixes the issue where messages sent by guests cannot be seen in the admin dashboard
-- by adjusting the Row Level Security policies on the guest_messages table

-- First, drop existing policies
DROP POLICY IF EXISTS "Public can submit messages" ON guest_messages;
DROP POLICY IF EXISTS "Public can view approved messages" ON guest_messages;
DROP POLICY IF EXISTS "Admins can manage messages" ON guest_messages;

-- Create a new policy that allows authenticated users to view all messages
-- This will enable the admin dashboard to display all messages regardless of approval status
CREATE POLICY "Authenticated users can view all messages" ON guest_messages
  FOR SELECT
  TO authenticated
  USING (true);

-- Keep the insert policy for public submissions
CREATE POLICY "Public can submit messages" ON guest_messages
  FOR INSERT
  WITH CHECK (true);

-- Allow authenticated users to update messages (for approval functionality)
CREATE POLICY "Authenticated users can update messages" ON guest_messages
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Allow authenticated users to delete messages
CREATE POLICY "Authenticated users can delete messages" ON guest_messages
  FOR DELETE
  TO authenticated
  USING (true);