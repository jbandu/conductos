-- Proactive insights schema for alerts and digests
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS insights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id INTEGER REFERENCES organizations(id),
  case_id INTEGER REFERENCES cases(id),
  insight_type TEXT NOT NULL CHECK(insight_type IN (
    'deadline_warning', 'stalled_case', 'risk_escalation',
    'compliance_gap', 'action_required', 'milestone_reached',
    'pattern_detected', 'benchmark_alert'
  )),
  severity TEXT NOT NULL CHECK(severity IN ('info', 'warning', 'critical')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  recommended_action TEXT,
  target_roles TEXT[],
  status TEXT DEFAULT 'active' CHECK(status IN ('active', 'acknowledged', 'resolved', 'dismissed')),
  acknowledged_by INTEGER REFERENCES users(id),
  acknowledged_at TIMESTAMPTZ,
  data JSONB DEFAULT '{}',
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS insight_deliveries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  insight_id UUID REFERENCES insights(id),
  user_id INTEGER REFERENCES users(id),
  delivery_channel TEXT,
  delivered_at TIMESTAMPTZ DEFAULT NOW(),
  read_at TIMESTAMPTZ,
  acted_on BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS insight_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id INTEGER REFERENCES organizations(id),
  schedule_type TEXT NOT NULL,
  cron_expression TEXT NOT NULL,
  last_run TIMESTAMPTZ,
  next_run TIMESTAMPTZ,
  config JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_insights_org ON insights(organization_id);
CREATE INDEX IF NOT EXISTS idx_insights_case ON insights(case_id);
CREATE INDEX IF NOT EXISTS idx_insights_status ON insights(status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_insights_severity ON insights(severity);
