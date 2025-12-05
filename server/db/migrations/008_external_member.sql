-- External Member Portal schema

-- External member profiles
CREATE TABLE IF NOT EXISTS external_member_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id INTEGER REFERENCES users(id),
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    designation TEXT,
    organization_affiliation TEXT,
    bar_council_number TEXT,
    expertise_areas TEXT[],
    is_verified BOOLEAN DEFAULT FALSE,
    verified_by INTEGER REFERENCES users(id),
    verification_documents UUID[],
    verified_at TIMESTAMPTZ,
    bio TEXT,
    linkedin_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Appointments to organizations
CREATE TABLE IF NOT EXISTS external_member_appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    external_member_id UUID REFERENCES external_member_profiles(id),
    organization_id INTEGER REFERENCES organizations(id),
    role TEXT DEFAULT 'external_member' CHECK (role IN ('external_member', 'presiding_officer')),
    appointment_date DATE NOT NULL,
    appointment_letter_id UUID REFERENCES evidence(id),
    term_start DATE NOT NULL,
    term_end DATE,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'terminated', 'on_leave')),
    fee_per_meeting DECIMAL(10, 2),
    fee_currency TEXT DEFAULT 'INR',
    can_view_identities BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (external_member_id, organization_id)
);

-- Activity log for external members
CREATE TABLE IF NOT EXISTS external_member_activity (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    external_member_id UUID REFERENCES external_member_profiles(id),
    organization_id INTEGER REFERENCES organizations(id),
    case_id INTEGER REFERENCES cases(id),
    activity_type TEXT NOT NULL,
    activity_details JSONB,
    ip_address INET,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fee tracking
CREATE TABLE IF NOT EXISTS external_member_fees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id UUID REFERENCES external_member_appointments(id),
    case_id INTEGER REFERENCES cases(id),
    session_id UUID REFERENCES interview_sessions(id),
    fee_amount DECIMAL(10, 2) NOT NULL,
    fee_type TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'rejected')),
    invoice_number TEXT,
    paid_at TIMESTAMPTZ,
    payment_reference TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ext_appointments_member ON external_member_appointments(external_member_id);
CREATE INDEX IF NOT EXISTS idx_ext_appointments_org ON external_member_appointments(organization_id);
CREATE INDEX IF NOT EXISTS idx_ext_activity_member ON external_member_activity(external_member_id);
