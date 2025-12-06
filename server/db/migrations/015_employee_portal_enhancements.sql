-- Employee Portal Enhancements Migration
-- Adds support for secure messaging, complaint drafts, case timeline, and anonymous reporting

-- =============================================
-- CASE TABLE ENHANCEMENTS
-- =============================================

-- Add missing columns to cases table for enhanced employee portal
ALTER TABLE cases ADD COLUMN IF NOT EXISTS complainant_id INTEGER REFERENCES users(id);
ALTER TABLE cases ADD COLUMN IF NOT EXISTS complainant_phone TEXT;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS respondent_relationship TEXT;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS incident_location TEXT;

-- Create index for complainant lookups
CREATE INDEX IF NOT EXISTS idx_cases_complainant_id ON cases(complainant_id);

-- =============================================
-- CASE WITNESSES
-- =============================================

CREATE TABLE IF NOT EXISTS case_witnesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id INTEGER REFERENCES cases(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  contact TEXT,
  department TEXT,
  relationship TEXT,
  statement TEXT,
  added_by INTEGER REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_witnesses_case ON case_witnesses(case_id);

-- =============================================
-- SECURE MESSAGING
-- =============================================

CREATE TABLE IF NOT EXISTS case_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id INTEGER REFERENCES cases(id) ON DELETE CASCADE,

  -- Sender info
  sender_id INTEGER REFERENCES users(id),
  sender_type TEXT NOT NULL CHECK(sender_type IN ('employee', 'ic_member', 'system')),
  sender_display_name TEXT,

  -- Message content
  content TEXT NOT NULL,
  content_type TEXT DEFAULT 'text' CHECK(content_type IN ('text', 'system', 'notification')),

  -- Attachments (evidence IDs)
  attachments UUID[] DEFAULT '{}',

  -- Status
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,

  -- Threading (for replies)
  parent_message_id UUID REFERENCES case_messages(id),

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_case ON case_messages(case_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_unread ON case_messages(case_id, is_read) WHERE is_read = FALSE;
CREATE INDEX IF NOT EXISTS idx_messages_sender ON case_messages(sender_id);

-- =============================================
-- ANONYMOUS REPORTING
-- =============================================

CREATE TABLE IF NOT EXISTS anonymous_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id INTEGER REFERENCES cases(id) ON DELETE CASCADE,

  -- Anonymous identifier
  anonymous_code TEXT UNIQUE NOT NULL,

  -- Access control (hashed passphrase)
  passphrase_hash TEXT NOT NULL,
  passphrase_salt TEXT NOT NULL,

  -- Tracking
  last_accessed_at TIMESTAMPTZ,
  access_count INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_anonymous_code ON anonymous_cases(anonymous_code);
CREATE INDEX IF NOT EXISTS idx_anonymous_case_id ON anonymous_cases(case_id);

-- =============================================
-- COMPLAINT DRAFTS
-- =============================================

CREATE TABLE IF NOT EXISTS complaint_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  organization_id INTEGER REFERENCES organizations(id),

  -- Draft data (JSON)
  draft_data JSONB NOT NULL,

  -- Progress tracking
  current_step INTEGER DEFAULT 1,
  completed_steps INTEGER[] DEFAULT '{}',

  -- Status
  status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'submitted', 'abandoned')),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days')
);

CREATE INDEX IF NOT EXISTS idx_drafts_user ON complaint_drafts(user_id, status);
CREATE INDEX IF NOT EXISTS idx_drafts_expires ON complaint_drafts(expires_at) WHERE status = 'draft';

-- =============================================
-- CASE TIMELINE EVENTS
-- =============================================

CREATE TABLE IF NOT EXISTS case_timeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id INTEGER REFERENCES cases(id) ON DELETE CASCADE,

  -- Event info
  event_type TEXT NOT NULL,
  event_title TEXT NOT NULL,
  event_description TEXT,

  -- Actor
  actor_id INTEGER REFERENCES users(id),
  actor_type TEXT,

  -- Visibility
  visible_to_employee BOOLEAN DEFAULT TRUE,
  visible_to_ic BOOLEAN DEFAULT TRUE,

  -- Metadata
  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_timeline_case ON case_timeline(case_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_timeline_type ON case_timeline(event_type);

-- =============================================
-- EMPLOYEE RESOURCES (FAQ, Helplines)
-- =============================================

CREATE TABLE IF NOT EXISTS employee_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id INTEGER REFERENCES organizations(id),
  resource_type TEXT NOT NULL CHECK(resource_type IN ('faq', 'helpline', 'document', 'link')),
  title TEXT NOT NULL,
  content TEXT,
  url TEXT,
  phone_number TEXT,
  available_hours TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_resources_org ON employee_resources(organization_id, resource_type);

-- =============================================
-- HELPFUL VIEWS
-- =============================================

-- Employee case summary view
CREATE OR REPLACE VIEW employee_case_summary AS
SELECT
  c.id,
  c.case_code,
  c.status,
  c.description,
  c.created_at as filed_at,
  c.deadline_date,
  (c.deadline_date - CURRENT_DATE) as days_remaining,
  c.complainant_id,
  CASE
    WHEN c.is_anonymous THEN c.anonymous_alias
    ELSE c.complainant_name
  END as display_name,
  (SELECT COUNT(*) FROM case_messages m
   WHERE m.case_id = c.id AND m.sender_type = 'ic_member' AND m.is_read = FALSE
  ) as unread_messages,
  (SELECT COUNT(*) FROM evidence e WHERE e.case_id = c.id AND e.status = 'active') as evidence_count,
  (SELECT MAX(created_at) FROM case_timeline t WHERE t.case_id = c.id) as last_activity
FROM cases c;

-- =============================================
-- INSERT DEFAULT RESOURCES
-- =============================================

-- Insert default FAQs (only if table is empty)
INSERT INTO employee_resources (resource_type, title, content, sort_order)
SELECT * FROM (VALUES
  ('faq', 'What happens after I file a complaint?',
   'The IC will acknowledge your complaint within 7 working days. They may contact you for a preliminary discussion, offer conciliation, or initiate a formal inquiry.', 1),
  ('faq', 'How long does the process take?',
   'By law, the inquiry must be completed within 90 days from the date of complaint.', 2),
  ('faq', 'Will my identity be kept confidential?',
   'Yes. Under Section 16 of the PoSH Act, your identity and all case details are strictly confidential. Breach of confidentiality is punishable.', 3),
  ('faq', 'Can I withdraw my complaint?',
   'You may request withdrawal, but the IC will review whether to accept it based on the circumstances and ensure no coercion is involved.', 4),
  ('faq', 'What if I face retaliation?',
   'Retaliation against a complainant is prohibited under the PoSH Act. Report any retaliatory behavior immediately to the IC.', 5)
) AS defaults(resource_type, title, content, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM employee_resources WHERE resource_type = 'faq' LIMIT 1);

-- Insert default helplines
INSERT INTO employee_resources (resource_type, title, phone_number, available_hours, sort_order)
SELECT * FROM (VALUES
  ('helpline', 'Women Helpline', '1091', '24/7', 1),
  ('helpline', 'NCW Helpline', '7827-170-170', '9 AM - 5 PM', 2)
) AS defaults(resource_type, title, phone_number, available_hours, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM employee_resources WHERE resource_type = 'helpline' LIMIT 1);

-- =============================================
-- FUNCTIONS
-- =============================================

-- Function to generate anonymous case code
CREATE OR REPLACE FUNCTION generate_anonymous_code() RETURNS TEXT AS $$
DECLARE
  year_part TEXT;
  seq_num INTEGER;
  new_code TEXT;
BEGIN
  year_part := EXTRACT(YEAR FROM NOW())::TEXT;

  SELECT COALESCE(MAX(
    CASE
      WHEN anonymous_code ~ ('^ANON-' || year_part || '-[0-9]+$')
      THEN NULLIF(regexp_replace(anonymous_code, '^ANON-' || year_part || '-', ''), '')::INTEGER
      ELSE 0
    END
  ), 0) + 1
  INTO seq_num
  FROM anonymous_cases;

  new_code := 'ANON-' || year_part || '-' || LPAD(seq_num::TEXT, 3, '0');
  RETURN new_code;
END;
$$ LANGUAGE plpgsql;

-- Function to add timeline event
CREATE OR REPLACE FUNCTION add_case_timeline_event(
  p_case_id INTEGER,
  p_event_type TEXT,
  p_event_title TEXT,
  p_event_description TEXT DEFAULT NULL,
  p_actor_id INTEGER DEFAULT NULL,
  p_actor_type TEXT DEFAULT NULL,
  p_visible_to_employee BOOLEAN DEFAULT TRUE,
  p_visible_to_ic BOOLEAN DEFAULT TRUE,
  p_metadata JSONB DEFAULT '{}'
) RETURNS UUID AS $$
DECLARE
  event_id UUID;
BEGIN
  INSERT INTO case_timeline (
    case_id, event_type, event_title, event_description,
    actor_id, actor_type, visible_to_employee, visible_to_ic, metadata
  ) VALUES (
    p_case_id, p_event_type, p_event_title, p_event_description,
    p_actor_id, p_actor_type, p_visible_to_employee, p_visible_to_ic, p_metadata
  )
  RETURNING id INTO event_id;

  RETURN event_id;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- TRIGGERS
-- =============================================

-- Auto-update updated_at for drafts
CREATE OR REPLACE FUNCTION update_draft_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_draft_timestamp ON complaint_drafts;
CREATE TRIGGER trigger_update_draft_timestamp
  BEFORE UPDATE ON complaint_drafts
  FOR EACH ROW
  EXECUTE FUNCTION update_draft_timestamp();

-- Auto-add timeline event on case status change
CREATE OR REPLACE FUNCTION auto_timeline_on_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    PERFORM add_case_timeline_event(
      NEW.id,
      'status_changed',
      'Case status updated to ' || NEW.status,
      'Status changed from ' || COALESCE(OLD.status, 'new') || ' to ' || NEW.status,
      NULL,
      'system',
      TRUE,
      TRUE,
      jsonb_build_object('old_status', OLD.status, 'new_status', NEW.status)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_case_status_timeline ON cases;
CREATE TRIGGER trigger_case_status_timeline
  AFTER UPDATE ON cases
  FOR EACH ROW
  EXECUTE FUNCTION auto_timeline_on_status_change();
