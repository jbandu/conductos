-- Add missing contact_method on cases and enforce unique pattern names

-- Add contact_method if absent (used for anonymous case intake)
ALTER TABLE IF EXISTS cases
  ADD COLUMN IF NOT EXISTS contact_method TEXT;

-- Ensure case_patterns has a uniqueness constraint for ON CONFLICT upserts
CREATE UNIQUE INDEX IF NOT EXISTS idx_case_patterns_pattern_name
  ON case_patterns(pattern_name);
