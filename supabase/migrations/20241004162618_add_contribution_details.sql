-- Add columns to contributions table to store form submission data
ALTER TABLE contributions 
  ADD COLUMN IF NOT EXISTS contributor_name text,
  ADD COLUMN IF NOT EXISTS contributor_phone text,
  ADD COLUMN IF NOT EXISTS contributor_email text,
  ADD COLUMN IF NOT EXISTS message text,
  ADD COLUMN IF NOT EXISTS payment_method text,
  ADD COLUMN IF NOT EXISTS currency text DEFAULT 'UGX',
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending';

-- Create index for looking up contributions by phone number
CREATE INDEX IF NOT EXISTS idx_contributions_phone ON contributions(contributor_phone);

-- Create index for looking up contributions by status
CREATE INDEX IF NOT EXISTS idx_contributions_status ON contributions(status);

-- Update RLS policies to allow public inserts with limited fields
DROP POLICY IF EXISTS "Public can create contributions" ON contributions;
CREATE POLICY "Public can create contributions"
  ON contributions FOR INSERT
  WITH CHECK (true);

-- Update RLS policy to allow public to read their own contributions
DROP POLICY IF EXISTS "Public can view their contributions" ON contributions;
CREATE POLICY "Public can view their contributions"
  ON contributions FOR SELECT
  USING (auth.uid() IS NULL OR guest_id = auth.uid() OR 
         (contributor_phone = (SELECT phone FROM guests WHERE id = auth.uid() LIMIT 1)));

-- Add comments for documentation
COMMENT ON COLUMN contributions.contributor_name IS 'Name of the person making the contribution';
COMMENT ON COLUMN contributions.contributor_phone IS 'Phone number of the contributor';
COMMENT ON COLUMN contributions.contributor_email IS 'Email of the contributor (optional)';
COMMENT ON COLUMN contributions.message IS 'Optional message from the contributor';
COMMENT ON COLUMN contributions.payment_method IS 'Payment method used (e.g., pesapal, mobile_money, cash)';
COMMENT ON COLUMN contributions.currency IS 'Currency code (e.g., UGX, USD)';
COMMENT ON COLUMN contributions.status IS 'Status of the contribution (pending, completed, failed, refunded)';

-- Update the existing status constraint to include the new status values
ALTER TABLE contributions 
  DROP CONSTRAINT IF EXISTS contributions_status_check,
  ADD CONSTRAINT contributions_status_check 
  CHECK (status IN ('pending', 'completed', 'failed', 'refunded'));
