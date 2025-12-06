-- Core ConductOS tables to support downstream migrations

CREATE TABLE IF NOT EXISTS organizations (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  industry TEXT,
  employee_count INTEGER,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT DEFAULT 'employee',
  department TEXT,
  organization_id INTEGER REFERENCES organizations(id),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cases (
  id SERIAL PRIMARY KEY,
  case_code TEXT UNIQUE NOT NULL,
  organization_id INTEGER REFERENCES organizations(id),
  status TEXT DEFAULT 'new',
  description TEXT,
  incident_date DATE,
  complainant_name TEXT,
  complainant_email TEXT,
  complainant_department TEXT,
  complainant_designation TEXT,
  respondent_name TEXT,
  respondent_department TEXT,
  respondent_designation TEXT,
  is_anonymous BOOLEAN DEFAULT FALSE,
  anonymous_alias TEXT,
  conciliation_requested BOOLEAN DEFAULT FALSE,
  resolution TEXT,
  deadline_date DATE,
  incident_types TEXT[],
  severity TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ic_members (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  organization_id INTEGER REFERENCES organizations(id),
  role TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  term_start_date DATE,
  term_end_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, organization_id)
);
