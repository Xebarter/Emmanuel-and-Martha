-- Add pesapal_tracking_id column to contributions table
ALTER TABLE contributions 
ADD COLUMN IF NOT EXISTS pesapal_tracking_id text;

-- Create an index for better query performance
CREATE INDEX IF NOT EXISTS idx_contributions_pesapal_tracking_id 
ON contributions(pesapal_tracking_id);

-- Update existing contributions to have the same value in both columns for backward compatibility
UPDATE contributions 
SET pesapal_tracking_id = pesapal_reference 
WHERE pesapal_tracking_id IS NULL AND pesapal_reference IS NOT NULL;