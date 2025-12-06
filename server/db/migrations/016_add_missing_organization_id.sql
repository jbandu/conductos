-- Fix missing columns in cases table from base schema (000_base_schema.sql)
-- These columns should exist from base schema but may be missing in existing databases

-- Core case identification
ALTER TABLE cases ADD COLUMN IF NOT EXISTS case_code TEXT;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS organization_id INTEGER REFERENCES organizations(id);
ALTER TABLE cases ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'new';

-- Case details
ALTER TABLE cases ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS incident_date DATE;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS incident_types TEXT[];
ALTER TABLE cases ADD COLUMN IF NOT EXISTS severity TEXT;

-- Complainant information
ALTER TABLE cases ADD COLUMN IF NOT EXISTS complainant_name TEXT;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS complainant_email TEXT;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS complainant_department TEXT;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS complainant_designation TEXT;

-- Respondent information
ALTER TABLE cases ADD COLUMN IF NOT EXISTS respondent_name TEXT;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS respondent_department TEXT;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS respondent_designation TEXT;

-- Anonymous reporting
ALTER TABLE cases ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN DEFAULT FALSE;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS anonymous_alias TEXT;

-- Case resolution
ALTER TABLE cases ADD COLUMN IF NOT EXISTS conciliation_requested BOOLEAN DEFAULT FALSE;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS resolution TEXT;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS deadline_date DATE;

-- Timestamps
ALTER TABLE cases ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE cases ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Create unique constraint on case_code if column was just added
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'cases_case_code_key'
    ) THEN
        ALTER TABLE cases ADD CONSTRAINT cases_case_code_key UNIQUE (case_code);
    END IF;
END $$;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_cases_organization ON cases(organization_id);
CREATE INDEX IF NOT EXISTS idx_cases_status ON cases(status);
CREATE INDEX IF NOT EXISTS idx_cases_deadline ON cases(deadline_date);
CREATE INDEX IF NOT EXISTS idx_cases_created ON cases(created_at);
CREATE INDEX IF NOT EXISTS idx_cases_complainant_email ON cases(complainant_email);

-- Note: The following columns are added by migration 015_employee_portal_enhancements.sql:
-- - complainant_id (INTEGER REFERENCES users(id))
-- - complainant_phone (TEXT)
-- - respondent_relationship (TEXT)
-- - incident_location (TEXT)
