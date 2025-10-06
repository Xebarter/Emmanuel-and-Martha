-- Check current policies on guest_messages table
\dt guest_messages;

-- Show current policies
SELECT * FROM pg_policy WHERE polrelid = 'guest_messages'::regclass;

-- Enable RLS if not already enabled
ALTER TABLE guest_messages ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies on guest_messages
DROP POLICY IF EXISTS "Public can submit messages" ON guest_messages;
DROP POLICY IF EXISTS "Public can view approved messages" ON guest_messages;
DROP POLICY IF EXISTS "Admins can manage messages" ON guest_messages;
DROP POLICY IF EXISTS "Authenticated users can view all messages" ON guest_messages;
DROP POLICY IF EXISTS "Authenticated users can update messages" ON guest_messages;
DROP POLICY IF EXISTS "Authenticated users can delete messages" ON guest_messages;

-- Create new policies for proper access
-- Allow anyone to insert messages
CREATE POLICY "Public can submit messages" ON guest_messages
  FOR INSERT
  WITH CHECK (true);

-- Allow authenticated users to view all messages (needed for dashboard)
CREATE POLICY "Allow authenticated users to view all messages" ON guest_messages
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to update messages
CREATE POLICY "Allow authenticated users to update messages" ON guest_messages
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Allow authenticated users to delete messages
CREATE POLICY "Allow authenticated users to delete messages" ON guest_messages
  FOR DELETE
  TO authenticated
  USING (true);

-- Grant necessary permissions
GRANT ALL ON guest_messages TO authenticated;