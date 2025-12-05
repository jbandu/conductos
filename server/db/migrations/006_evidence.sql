-- Evidence management tables
CREATE TABLE IF NOT EXISTS evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id INTEGER REFERENCES cases(id) ON DELETE CASCADE,
  organization_id INTEGER REFERENCES organizations(id),
  file_name TEXT NOT NULL,
  original_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  storage_path TEXT NOT NULL,
  checksum TEXT NOT NULL,
  evidence_type TEXT NOT NULL CHECK (evidence_type IN (
    'document','email','chat_screenshot','image','video','audio','witness_statement','other'
  )),
  description TEXT,
  source TEXT,
  ai_summary TEXT,
  extracted_text TEXT,
  ai_relevance_score DECIMAL(3,2),
  key_findings JSONB,
  analyzed_at TIMESTAMPTZ,
  uploaded_by INTEGER REFERENCES users(id),
  access_level TEXT DEFAULT 'ic_only' CHECK (access_level IN ('ic_only','po_only','all_parties')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active','archived','redacted','deleted')),
  encryption_key_id TEXT,
  is_encrypted BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS evidence_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evidence_id UUID REFERENCES evidence(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  storage_path TEXT NOT NULL,
  checksum TEXT NOT NULL,
  change_type TEXT NOT NULL,
  change_description TEXT,
  changed_by INTEGER REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (evidence_id, version_number)
);

CREATE TABLE IF NOT EXISTS evidence_custody (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evidence_id UUID REFERENCES evidence(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN (
    'uploaded','viewed','downloaded','shared','analyzed','redacted','archived','deleted'
  )),
  performed_by INTEGER REFERENCES users(id),
  ip_address INET,
  user_agent TEXT,
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS evidence_access_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evidence_id UUID REFERENCES evidence(id),
  case_id INTEGER REFERENCES cases(id),
  requested_by INTEGER REFERENCES users(id),
  requester_role TEXT,
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','approved','denied','expired')),
  reviewed_by INTEGER REFERENCES users(id),
  review_notes TEXT,
  valid_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS evidence_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evidence_id UUID REFERENCES evidence(id) ON DELETE CASCADE,
  tag TEXT NOT NULL,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (evidence_id, tag)
);

CREATE INDEX IF NOT EXISTS idx_evidence_case ON evidence(case_id);
CREATE INDEX IF NOT EXISTS idx_evidence_type ON evidence(evidence_type);
CREATE INDEX IF NOT EXISTS idx_evidence_custody_evidence ON evidence_custody(evidence_id);
CREATE INDEX IF NOT EXISTS idx_evidence_access_case ON evidence_access_requests(case_id);
