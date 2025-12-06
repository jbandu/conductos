-- Fix missing organization_id column in cases table
-- This column should exist from base schema but may be missing in existing databases

ALTER TABLE cases ADD COLUMN IF NOT EXISTS organization_id INTEGER REFERENCES organizations(id);

-- Create index for organization lookups
CREATE INDEX IF NOT EXISTS idx_cases_organization ON cases(organization_id);

-- If there are existing cases without organization_id, set it to null or a default org
-- (This is safe because the column is nullable)
