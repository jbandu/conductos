-- Indexes to support vector and full-text search for the knowledge base
CREATE INDEX IF NOT EXISTS idx_legal_sections_embedding ON legal_sections 
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

CREATE INDEX IF NOT EXISTS idx_case_law_embedding ON case_law 
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

CREATE INDEX IF NOT EXISTS idx_playbooks_embedding ON playbooks 
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

CREATE INDEX IF NOT EXISTS idx_legal_sections_fts ON legal_sections 
  USING gin(to_tsvector('english', section_text));

CREATE INDEX IF NOT EXISTS idx_case_law_fts ON case_law 
  USING gin(to_tsvector('english', coalesce(facts_summary, '') || ' ' || coalesce(ratio_decidendi, '')));

CREATE INDEX IF NOT EXISTS idx_playbooks_fts ON playbooks 
  USING gin(to_tsvector('english', coalesce(scenario, '') || ' ' || coalesce(recommended_approach, '')));
