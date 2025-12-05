-- Monitoring and analytics tables
CREATE TABLE IF NOT EXISTS api_request_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  method TEXT NOT NULL,
  path TEXT NOT NULL,
  status_code INTEGER NOT NULL,
  response_time_ms INTEGER NOT NULL,
  user_id INTEGER REFERENCES users(id),
  organization_id INTEGER REFERENCES organizations(id),
  ip_address INET,
  user_agent TEXT,
  error_message TEXT,
  error_stack TEXT,
  request_size INTEGER,
  response_size INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id INTEGER REFERENCES organizations(id),
  user_id INTEGER REFERENCES users(id),
  case_id INTEGER REFERENCES cases(id),
  model TEXT NOT NULL,
  agent_type TEXT,
  input_tokens INTEGER NOT NULL,
  output_tokens INTEGER NOT NULL,
  total_tokens INTEGER GENERATED ALWAYS AS (input_tokens + output_tokens) STORED,
  estimated_cost_usd DECIMAL(10,6),
  response_time_ms INTEGER,
  tool_calls INTEGER DEFAULT 0,
  request_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS system_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_name TEXT NOT NULL,
  metric_value DECIMAL NOT NULL,
  metric_unit TEXT,
  tags JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS business_metrics_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id INTEGER REFERENCES organizations(id),
  metric_date DATE NOT NULL,
  total_cases INTEGER DEFAULT 0,
  new_cases INTEGER DEFAULT 0,
  closed_cases INTEGER DEFAULT 0,
  overdue_cases INTEGER DEFAULT 0,
  avg_resolution_days DECIMAL(5,1),
  compliance_score DECIMAL(5,2),
  on_time_completion_rate DECIMAL(5,2),
  copilot_interactions INTEGER DEFAULT 0,
  documents_generated INTEGER DEFAULT 0,
  evidence_uploaded INTEGER DEFAULT 0,
  active_ic_members INTEGER DEFAULT 0,
  sessions_conducted INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, metric_date)
);

CREATE TABLE IF NOT EXISTS monitoring_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('info','warning','critical')),
  triggered_value DECIMAL,
  threshold_value DECIMAL,
  organization_id INTEGER REFERENCES organizations(id),
  affected_resource TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active','acknowledged','resolved')),
  acknowledged_by INTEGER REFERENCES users(id),
  acknowledged_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  notification_sent BOOLEAN DEFAULT FALSE,
  notification_channels TEXT[],
  message TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS alert_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  metric_name TEXT NOT NULL,
  operator TEXT NOT NULL,
  threshold DECIMAL NOT NULL,
  evaluation_window_minutes INTEGER DEFAULT 5,
  severity TEXT NOT NULL,
  notification_channels TEXT[],
  organization_id INTEGER REFERENCES organizations(id),
  is_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_api_logs_created ON api_request_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_usage_created ON ai_usage_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_business_metrics_org_date ON business_metrics_daily(organization_id, metric_date DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_status ON monitoring_alerts(status, created_at DESC);
