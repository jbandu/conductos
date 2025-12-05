-- Witness and interview management tables
CREATE TABLE IF NOT EXISTS witnesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id INTEGER REFERENCES cases(id) ON DELETE CASCADE,
  witness_code TEXT NOT NULL,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  witness_type TEXT NOT NULL CHECK (witness_type IN (
    'complainant','respondent','witness_complainant','witness_respondent','neutral_witness','expert'
  )),
  relationship_to_parties TEXT,
  department TEXT,
  designation TEXT,
  status TEXT DEFAULT 'identified' CHECK (status IN (
    'identified','notified','scheduled','examined','declined','unavailable'
  )),
  examined_on TIMESTAMPTZ,
  statement_summary TEXT,
  credibility_notes TEXT,
  added_by INTEGER REFERENCES users(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS interview_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id INTEGER REFERENCES cases(id),
  scheduled_date DATE NOT NULL,
  scheduled_time TIME NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  location TEXT,
  meeting_link TEXT,
  witness_ids UUID[],
  ic_member_ids INTEGER[],
  status TEXT DEFAULT 'scheduled' CHECK (status IN (
    'scheduled','confirmed','in_progress','completed','cancelled','rescheduled','no_show'
  )),
  agenda TEXT,
  prepared_questions JSONB,
  documents_to_discuss UUID[],
  actual_duration_minutes INTEGER,
  session_notes TEXT,
  follow_up_required BOOLEAN DEFAULT FALSE,
  follow_up_notes TEXT,
  reminder_sent BOOLEAN DEFAULT FALSE,
  confirmation_received BOOLEAN DEFAULT FALSE,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cross_examination_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id INTEGER REFERENCES cases(id),
  session_id UUID REFERENCES interview_sessions(id),
  submitted_by TEXT NOT NULL,
  target_witness_id UUID REFERENCES witnesses(id),
  questions JSONB NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','approved','partially_approved','rejected')),
  reviewed_by INTEGER REFERENCES users(id),
  review_notes TEXT,
  approved_questions JSONB,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS witness_statements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES interview_sessions(id),
  witness_id UUID REFERENCES witnesses(id),
  statement_text TEXT NOT NULL,
  statement_type TEXT DEFAULT 'examination' CHECK (statement_type IN (
    'examination','cross_examination','re_examination','clarification'
  )),
  qa_pairs JSONB,
  witness_signed BOOLEAN DEFAULT FALSE,
  signed_at TIMESTAMPTZ,
  signature_document_id UUID REFERENCES evidence(id),
  audio_recording_id UUID REFERENCES evidence(id),
  transcription_status TEXT,
  recorded_by INTEGER REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS calendar_sync (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id INTEGER REFERENCES users(id),
  session_id UUID REFERENCES interview_sessions(id),
  provider TEXT NOT NULL,
  external_event_id TEXT,
  sync_status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  synced_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_witnesses_case ON witnesses(case_id);
CREATE INDEX IF NOT EXISTS idx_sessions_case ON interview_sessions(case_id);
CREATE INDEX IF NOT EXISTS idx_sessions_date ON interview_sessions(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_statements_session ON witness_statements(session_id);
