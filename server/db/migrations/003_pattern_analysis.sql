-- Pattern analysis schema for case insights and similarity matching
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS case_characteristics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id INTEGER REFERENCES cases(id),
  incident_type TEXT[],
  severity_indicators TEXT[],
  location_type TEXT,
  relationship_dynamic TEXT,
  witness_availability TEXT,
  evidence_strength TEXT,
  escalation_risk INTEGER,
  timeline_risk INTEGER,
  complexity_score INTEGER,
  retaliation_risk INTEGER,
  embedding vector,
  key_phrases TEXT[],
  analyzed_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(case_id)
);

CREATE TABLE IF NOT EXISTS case_patterns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pattern_name TEXT NOT NULL,
  pattern_type TEXT NOT NULL,
  characteristics JSONB NOT NULL,
  frequency INTEGER,
  typical_outcomes JSONB,
  avg_resolution_days INTEGER,
  success_factors TEXT[],
  risk_factors TEXT[],
  recommended_approach TEXT,
  common_pitfalls TEXT[],
  confidence DECIMAL(3,2),
  embedding vector,
  last_updated TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS case_similarities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id INTEGER REFERENCES cases(id),
  similar_pattern_id UUID REFERENCES case_patterns(id),
  similarity_score DECIMAL(3,2),
  matching_factors TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(case_id, similar_pattern_id)
);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'vector') THEN
    -- Fix embedding dimensionality before building IVFFlat indexes
    ALTER TABLE IF EXISTS case_characteristics
      ALTER COLUMN embedding TYPE vector(1536) USING embedding;

    ALTER TABLE IF EXISTS case_patterns
      ALTER COLUMN embedding TYPE vector(1536) USING embedding;

    CREATE INDEX IF NOT EXISTS idx_case_chars_embedding ON case_characteristics USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
  ELSE
    RAISE NOTICE 'Skipping case_characteristics vector index: pgvector extension not installed.';
  END IF;
END
$$;
CREATE INDEX IF NOT EXISTS idx_case_chars_case ON case_characteristics(case_id);
CREATE INDEX IF NOT EXISTS idx_patterns_type ON case_patterns(pattern_type);
