-- Fix missing columns in cases table from base schema
-- These columns should exist from base schema but may be missing in existing databases

-- Add organization_id if missing
ALTER TABLE cases ADD COLUMN IF NOT EXISTS organization_id INTEGER REFERENCES organizations(id);

-- Add incident_types if missing (TEXT array for multiple incident types)
ALTER TABLE cases ADD COLUMN IF NOT EXISTS incident_types TEXT[];

-- Add severity if missing
ALTER TABLE cases ADD COLUMN IF NOT EXISTS severity TEXT;

-- Add resolution if missing
ALTER TABLE cases ADD COLUMN IF NOT EXISTS resolution TEXT;

-- Add conciliation_requested if missing
ALTER TABLE cases ADD COLUMN IF NOT EXISTS conciliation_requested BOOLEAN DEFAULT FALSE;

-- Add anonymous_alias if missing
ALTER TABLE cases ADD COLUMN IF NOT EXISTS anonymous_alias TEXT;

-- Add deadline_date if missing
ALTER TABLE cases ADD COLUMN IF NOT EXISTS deadline_date DATE;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_cases_organization ON cases(organization_id);
CREATE INDEX IF NOT EXISTS idx_cases_status ON cases(status);
CREATE INDEX IF NOT EXISTS idx_cases_deadline ON cases(deadline_date);

-- Note: complainant_id, complainant_phone, respondent_relationship, and incident_location
-- are added in migration 015, so they should already be present
