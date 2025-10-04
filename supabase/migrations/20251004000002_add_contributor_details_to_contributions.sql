-- Add columns to store contributor details directly in contributions table
ALTER TABLE contributions 
ADD COLUMN IF NOT EXISTS contributor_name TEXT,
ADD COLUMN IF NOT EXISTS contributor_email TEXT,
ADD COLUMN IF NOT EXISTS contributor_phone TEXT,
ADD COLUMN IF NOT EXISTS message TEXT;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_contributions_contributor_name ON contributions(contributor_name);
CREATE INDEX IF NOT EXISTS idx_contributions_contributor_email ON contributions(contributor_email);
CREATE INDEX IF NOT EXISTS idx_contributions_contributor_phone ON contributions(contributor_phone);