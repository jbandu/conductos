-- Agent orchestrator session and logging tables
CREATE TABLE IF NOT EXISTS agent_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL,
  user_id INTEGER REFERENCES users(id),
  organization_id INTEGER REFERENCES organizations(id),
  case_id INTEGER REFERENCES cases(id),
  user_message TEXT NOT NULL,
  detected_intent TEXT NOT NULL,
  intent_confidence DECIMAL(3,2),
  primary_agent TEXT NOT NULL,
  secondary_agents TEXT[],
  response TEXT NOT NULL,
  tools_used TEXT[],
  citations JSONB,
  processing_time_ms INTEGER,
  token_count INTEGER,
  user_rating INTEGER CHECK(user_rating BETWEEN 1 AND 5),
  user_feedback TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS agent_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_name TEXT UNIQUE NOT NULL,
  description TEXT,
  system_prompt TEXT NOT NULL,
  tools TEXT[],
  priority_intents TEXT[],
  is_active BOOLEAN DEFAULT TRUE,
  config JSONB DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS agent_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id INTEGER REFERENCES users(id),
  case_id INTEGER REFERENCES cases(id),
  conversation_history JSONB DEFAULT '[]',
  active_context JSONB DEFAULT '{}',
  last_agent TEXT,
  status TEXT DEFAULT 'active',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  last_activity TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_agent_interactions_session ON agent_interactions(session_id);
CREATE INDEX IF NOT EXISTS idx_agent_interactions_intent ON agent_interactions(detected_intent);
CREATE INDEX IF NOT EXISTS idx_agent_sessions_user ON agent_sessions(user_id);
