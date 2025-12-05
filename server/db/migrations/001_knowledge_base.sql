-- Ensure a usable "vector" type. Prefer the extension when available,
-- but fall back to a compatible domain if the extension is not installed
-- (e.g., hosted Postgres instances without pgvector).
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'vector') THEN
    BEGIN
      CREATE EXTENSION IF NOT EXISTS vector;
    EXCEPTION
      WHEN undefined_file THEN
        RAISE NOTICE 'pgvector extension not available, creating vector domain for compatibility';
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'vector') THEN
          CREATE DOMAIN vector AS double precision[];
        END IF;
    END;
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS legal_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_type TEXT NOT NULL CHECK(document_type IN (
    'act', 'rules', 'case_law', 'guideline', 'circular', 'handbook'
  )),
  title TEXT NOT NULL,
  citation TEXT,
  source_url TEXT,
  effective_date DATE,
  jurisdiction TEXT DEFAULT 'India',
  full_text TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS legal_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES legal_documents(id) ON DELETE CASCADE,
  section_number TEXT,
  section_title TEXT,
  section_text TEXT NOT NULL,
  parent_section_id UUID REFERENCES legal_sections(id),
  section_order INTEGER,
  section_type TEXT CHECK(section_type IN (
    'section', 'subsection', 'clause', 'proviso', 'explanation', 'schedule'
  )),
  keywords TEXT[],
  embedding vector,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS case_law (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES legal_documents(id) ON DELETE CASCADE,
  case_name TEXT NOT NULL,
  citation TEXT NOT NULL,
  court TEXT NOT NULL,
  bench TEXT,
  decided_date DATE,
  case_type TEXT,
  facts_summary TEXT,
  issues TEXT[],
  holdings TEXT[],
  ratio_decidendi TEXT,
  obiter_dicta TEXT,
  sections_interpreted TEXT[],
  followed_by TEXT[],
  distinguished_by TEXT[],
  overruled_by TEXT,
  relevance_score INTEGER DEFAULT 5,
  embedding vector,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS playbooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL CHECK(category IN (
    'intake', 'conciliation', 'investigation', 'evidence',
    'witness_examination', 'report_writing', 'recommendations',
    'sensitive_situations', 'senior_stakeholder', 'retaliation'
  )),
  subcategory TEXT,
  title TEXT NOT NULL,
  scenario TEXT NOT NULL,
  recommended_approach TEXT NOT NULL,
  do_list TEXT[],
  dont_list TEXT[],
  legal_references TEXT[],
  sample_language TEXT,
  difficulty_level TEXT CHECK(difficulty_level IN ('basic', 'intermediate', 'advanced')),
  source TEXT DEFAULT 'KelpHR',
  embedding vector,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS checklists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  process_stage TEXT NOT NULL CHECK(process_stage IN (
    'complaint_receipt', 'initial_review', 'conciliation',
    'inquiry_initiation', 'witness_examination', 'evidence_review',
    'report_drafting', 'recommendation', 'appeal', 'annual_report'
  )),
  title TEXT NOT NULL,
  description TEXT,
  items JSONB NOT NULL,
  legal_basis TEXT[],
  template_documents TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_type TEXT NOT NULL CHECK(template_type IN (
    'notice_to_respondent', 'acknowledgment', 'summons',
    'mom_inquiry', 'mom_conciliation', 'inquiry_report',
    'recommendation_letter', 'annual_report', 'appeal_response'
  )),
  title TEXT NOT NULL,
  description TEXT,
  template_content TEXT NOT NULL,
  required_fields JSONB,
  legal_basis TEXT[],
  version INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS knowledge_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type TEXT NOT NULL,
  source_id UUID NOT NULL,
  target_type TEXT NOT NULL,
  target_id UUID NOT NULL,
  link_type TEXT CHECK(link_type IN (
    'interprets', 'implements', 'references', 'contradicts',
    'extends', 'examples', 'template_for'
  )),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(source_type, source_id, target_type, target_id, link_type)
);
