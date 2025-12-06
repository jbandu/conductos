-- Enterprise SSO Integration Schema
-- Supports SAML 2.0, OAuth 2.0, and OpenID Connect (OIDC)
-- Compatible with Okta, Azure AD, OneLogin, Google Workspace, Ping Identity, and custom IdPs

-- Drop the placeholder sso_configurations table and recreate with full schema
DROP TABLE IF EXISTS sso_configurations CASCADE;

-- ============================================================================
-- SSO Identity Providers Configuration
-- ============================================================================
CREATE TABLE IF NOT EXISTS sso_identity_providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,

    -- Provider identification
    name TEXT NOT NULL,
    display_name TEXT NOT NULL,
    provider_type TEXT NOT NULL CHECK (provider_type IN ('saml', 'oidc', 'oauth2')),
    provider_vendor TEXT CHECK (provider_vendor IN ('okta', 'azure_ad', 'google', 'onelogin', 'ping', 'auth0', 'custom')),

    -- Status and priority
    is_active BOOLEAN DEFAULT FALSE,
    is_primary BOOLEAN DEFAULT FALSE,
    priority INTEGER DEFAULT 0,

    -- SAML 2.0 Configuration (when provider_type = 'saml')
    saml_entity_id TEXT,
    saml_sso_url TEXT,
    saml_slo_url TEXT,
    saml_certificate TEXT,
    saml_certificate_fingerprint TEXT,
    saml_signature_algorithm TEXT DEFAULT 'sha256',
    saml_digest_algorithm TEXT DEFAULT 'sha256',
    saml_authn_context TEXT DEFAULT 'urn:oasis:names:tc:SAML:2.0:ac:classes:PasswordProtectedTransport',
    saml_name_id_format TEXT DEFAULT 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress',
    saml_sign_requests BOOLEAN DEFAULT TRUE,
    saml_want_assertions_signed BOOLEAN DEFAULT TRUE,
    saml_want_response_signed BOOLEAN DEFAULT TRUE,
    saml_metadata_url TEXT,

    -- OAuth 2.0 / OIDC Configuration (when provider_type = 'oidc' or 'oauth2')
    oauth_client_id TEXT,
    oauth_client_secret_encrypted TEXT,
    oauth_authorization_url TEXT,
    oauth_token_url TEXT,
    oauth_userinfo_url TEXT,
    oauth_jwks_url TEXT,
    oauth_issuer TEXT,
    oauth_scopes TEXT[] DEFAULT ARRAY['openid', 'profile', 'email'],
    oauth_response_type TEXT DEFAULT 'code',
    oauth_pkce_enabled BOOLEAN DEFAULT TRUE,

    -- Attribute mapping (JSONB for flexibility)
    attribute_mapping JSONB DEFAULT '{
        "email": "email",
        "first_name": "given_name",
        "last_name": "family_name",
        "display_name": "name",
        "employee_id": "employee_id",
        "department": "department",
        "job_title": "job_title",
        "groups": "groups"
    }'::jsonb,

    -- Just-In-Time (JIT) Provisioning settings
    jit_enabled BOOLEAN DEFAULT TRUE,
    jit_default_role TEXT DEFAULT 'employee',
    jit_update_on_login BOOLEAN DEFAULT TRUE,
    jit_auto_activate BOOLEAN DEFAULT TRUE,

    -- Domain restrictions (allow login only from these domains)
    allowed_domains TEXT[] DEFAULT ARRAY[]::TEXT[],

    -- Group mapping (IdP groups -> application roles)
    group_mapping JSONB DEFAULT '{}'::jsonb,

    -- Session settings
    session_duration_minutes INTEGER DEFAULT 480,
    force_reauthentication BOOLEAN DEFAULT FALSE,

    -- Metadata and timestamps
    metadata JSONB DEFAULT '{}',
    last_metadata_sync_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by INTEGER REFERENCES users(id),
    updated_by INTEGER REFERENCES users(id)
);

-- ============================================================================
-- SSO Domain Verification
-- ============================================================================
CREATE TABLE IF NOT EXISTS sso_verified_domains (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
    domain TEXT NOT NULL,
    verification_method TEXT CHECK (verification_method IN ('dns_txt', 'dns_cname', 'email', 'manual')),
    verification_token TEXT,
    verification_record TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    verified_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by INTEGER REFERENCES users(id),
    UNIQUE (organization_id, domain)
);

-- ============================================================================
-- SSO User Identity Links
-- ============================================================================
CREATE TABLE IF NOT EXISTS sso_user_identities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    provider_id UUID REFERENCES sso_identity_providers(id) ON DELETE CASCADE,

    -- External identity information
    external_id TEXT NOT NULL,
    email TEXT,
    name_id TEXT,

    -- Profile data from IdP
    profile_data JSONB DEFAULT '{}',
    groups TEXT[] DEFAULT ARRAY[]::TEXT[],

    -- Provisioning info
    provisioned_at TIMESTAMPTZ DEFAULT NOW(),
    last_login_at TIMESTAMPTZ,
    login_count INTEGER DEFAULT 0,

    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    deactivated_at TIMESTAMPTZ,
    deactivation_reason TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE (provider_id, external_id)
);

-- ============================================================================
-- SSO Sessions
-- ============================================================================
CREATE TABLE IF NOT EXISTS sso_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    identity_id UUID REFERENCES sso_user_identities(id) ON DELETE CASCADE,
    provider_id UUID REFERENCES sso_identity_providers(id) ON DELETE CASCADE,

    -- Session identifiers
    session_index TEXT,
    name_id TEXT,

    -- SAML-specific session data
    saml_session_not_on_or_after TIMESTAMPTZ,

    -- OAuth/OIDC tokens (encrypted)
    access_token_encrypted TEXT,
    refresh_token_encrypted TEXT,
    id_token TEXT,
    token_expires_at TIMESTAMPTZ,

    -- Session metadata
    ip_address INET,
    user_agent TEXT,
    device_info JSONB,

    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    terminated_at TIMESTAMPTZ,
    termination_reason TEXT CHECK (termination_reason IN ('logout', 'timeout', 'forced', 'token_revoked', 'password_change'))
);

-- ============================================================================
-- SSO Authentication Requests (for CSRF protection and state tracking)
-- ============================================================================
CREATE TABLE IF NOT EXISTS sso_auth_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID REFERENCES sso_identity_providers(id) ON DELETE CASCADE,

    -- Request identifiers
    request_id TEXT NOT NULL UNIQUE,
    state TEXT NOT NULL,
    nonce TEXT,
    code_verifier TEXT,  -- For PKCE

    -- Request context
    redirect_uri TEXT,
    relay_state TEXT,
    requested_authn_context TEXT,

    -- Client info
    ip_address INET,
    user_agent TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    completed_at TIMESTAMPTZ,

    -- Status
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'expired'))
);

-- ============================================================================
-- SSO Audit Log
-- ============================================================================
CREATE TABLE IF NOT EXISTS sso_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id INTEGER REFERENCES organizations(id),
    user_id INTEGER REFERENCES users(id),
    provider_id UUID REFERENCES sso_identity_providers(id),
    identity_id UUID REFERENCES sso_user_identities(id),

    -- Event details
    event_type TEXT NOT NULL CHECK (event_type IN (
        'login_initiated', 'login_success', 'login_failed',
        'logout_initiated', 'logout_success', 'logout_failed',
        'token_refresh', 'token_revoked',
        'user_provisioned', 'user_updated', 'user_deactivated',
        'provider_configured', 'provider_updated', 'provider_activated', 'provider_deactivated',
        'domain_verified', 'domain_removed',
        'metadata_synced', 'certificate_updated',
        'session_created', 'session_terminated',
        'attribute_mapping_error', 'group_sync_error'
    )),
    event_status TEXT NOT NULL CHECK (event_status IN ('success', 'failure', 'warning')),

    -- Error details
    error_code TEXT,
    error_message TEXT,

    -- Context
    ip_address INET,
    user_agent TEXT,
    metadata JSONB DEFAULT '{}',

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- SSO Provider Certificates (for certificate rotation)
-- ============================================================================
CREATE TABLE IF NOT EXISTS sso_provider_certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID REFERENCES sso_identity_providers(id) ON DELETE CASCADE,

    certificate TEXT NOT NULL,
    fingerprint TEXT NOT NULL,
    not_before TIMESTAMPTZ,
    not_after TIMESTAMPTZ,

    is_active BOOLEAN DEFAULT TRUE,
    is_primary BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by INTEGER REFERENCES users(id)
);

-- ============================================================================
-- SCIM Provisioning Configuration (for enterprise user sync)
-- ============================================================================
CREATE TABLE IF NOT EXISTS scim_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,

    -- SCIM endpoint settings
    is_enabled BOOLEAN DEFAULT FALSE,
    bearer_token_hash TEXT,

    -- Provisioning settings
    create_users BOOLEAN DEFAULT TRUE,
    update_users BOOLEAN DEFAULT TRUE,
    deactivate_users BOOLEAN DEFAULT TRUE,
    sync_groups BOOLEAN DEFAULT TRUE,

    -- Attribute mapping
    attribute_mapping JSONB DEFAULT '{}'::jsonb,

    -- Rate limiting
    rate_limit_per_minute INTEGER DEFAULT 100,

    -- Metadata
    last_sync_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE (organization_id)
);

-- ============================================================================
-- Indexes for performance
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_sso_providers_org ON sso_identity_providers(organization_id);
CREATE INDEX IF NOT EXISTS idx_sso_providers_active ON sso_identity_providers(organization_id, is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_sso_providers_type ON sso_identity_providers(provider_type);

CREATE INDEX IF NOT EXISTS idx_sso_domains_org ON sso_verified_domains(organization_id);
CREATE INDEX IF NOT EXISTS idx_sso_domains_domain ON sso_verified_domains(domain);
CREATE INDEX IF NOT EXISTS idx_sso_domains_verified ON sso_verified_domains(domain, is_verified) WHERE is_verified = TRUE;

CREATE INDEX IF NOT EXISTS idx_sso_identities_user ON sso_user_identities(user_id);
CREATE INDEX IF NOT EXISTS idx_sso_identities_provider ON sso_user_identities(provider_id);
CREATE INDEX IF NOT EXISTS idx_sso_identities_external ON sso_user_identities(provider_id, external_id);
CREATE INDEX IF NOT EXISTS idx_sso_identities_email ON sso_user_identities(email);

CREATE INDEX IF NOT EXISTS idx_sso_sessions_user ON sso_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sso_sessions_active ON sso_sessions(user_id, is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_sso_sessions_provider ON sso_sessions(provider_id);

CREATE INDEX IF NOT EXISTS idx_sso_auth_requests_state ON sso_auth_requests(state);
CREATE INDEX IF NOT EXISTS idx_sso_auth_requests_pending ON sso_auth_requests(status, expires_at) WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_sso_audit_org ON sso_audit_log(organization_id);
CREATE INDEX IF NOT EXISTS idx_sso_audit_user ON sso_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_sso_audit_provider ON sso_audit_log(provider_id);
CREATE INDEX IF NOT EXISTS idx_sso_audit_type ON sso_audit_log(event_type);
CREATE INDEX IF NOT EXISTS idx_sso_audit_time ON sso_audit_log(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_sso_certs_provider ON sso_provider_certificates(provider_id);
CREATE INDEX IF NOT EXISTS idx_sso_certs_active ON sso_provider_certificates(provider_id, is_active) WHERE is_active = TRUE;

-- ============================================================================
-- Add SSO-related columns to users table
-- ============================================================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS sso_only BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_login_disabled BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS provisioned_via_sso BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS provisioned_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_sso_login_at TIMESTAMPTZ;

-- ============================================================================
-- Add SSO settings to organizations table
-- ============================================================================
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS sso_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS sso_enforced BOOLEAN DEFAULT FALSE;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS sso_bypass_allowed BOOLEAN DEFAULT FALSE;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS sso_settings JSONB DEFAULT '{}'::jsonb;

-- ============================================================================
-- Functions for SSO management
-- ============================================================================

-- Function to clean up expired SSO auth requests
CREATE OR REPLACE FUNCTION cleanup_expired_sso_auth_requests()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    UPDATE sso_auth_requests
    SET status = 'expired'
    WHERE status = 'pending' AND expires_at < NOW();

    DELETE FROM sso_auth_requests
    WHERE expires_at < NOW() - INTERVAL '24 hours';

    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get active provider for a domain
CREATE OR REPLACE FUNCTION get_sso_provider_for_domain(domain_name TEXT)
RETURNS UUID AS $$
DECLARE
    provider_id UUID;
BEGIN
    SELECT p.id INTO provider_id
    FROM sso_identity_providers p
    JOIN sso_verified_domains d ON p.organization_id = d.organization_id
    WHERE d.domain = domain_name
      AND d.is_verified = TRUE
      AND p.is_active = TRUE
    ORDER BY p.is_primary DESC, p.priority ASC
    LIMIT 1;

    RETURN provider_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Triggers
-- ============================================================================

-- Update timestamp trigger for sso_identity_providers
CREATE OR REPLACE FUNCTION update_sso_provider_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_sso_provider_timestamp
    BEFORE UPDATE ON sso_identity_providers
    FOR EACH ROW
    EXECUTE FUNCTION update_sso_provider_timestamp();

-- Update timestamp trigger for sso_user_identities
CREATE TRIGGER trigger_update_sso_identity_timestamp
    BEFORE UPDATE ON sso_user_identities
    FOR EACH ROW
    EXECUTE FUNCTION update_sso_provider_timestamp();

-- Ensure only one primary provider per organization
CREATE OR REPLACE FUNCTION ensure_single_primary_provider()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_primary = TRUE THEN
        UPDATE sso_identity_providers
        SET is_primary = FALSE
        WHERE organization_id = NEW.organization_id
          AND id != NEW.id
          AND is_primary = TRUE;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_ensure_single_primary_provider
    BEFORE INSERT OR UPDATE ON sso_identity_providers
    FOR EACH ROW
    WHEN (NEW.is_primary = TRUE)
    EXECUTE FUNCTION ensure_single_primary_provider();
