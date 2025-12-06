-- Enhanced User Preferences and Authentication System
-- Migration 014: Comprehensive user profile settings for employees and IC members

-- ============================================================================
-- USER PREFERENCES TABLE
-- Stores all user-configurable settings with role-based options
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- ========================================================================
    -- COMMON PREFERENCES (All Users)
    -- ========================================================================

    -- Display & Accessibility
    theme VARCHAR(20) DEFAULT 'system' CHECK(theme IN ('light', 'dark', 'system')),
    language VARCHAR(10) DEFAULT 'en',
    timezone VARCHAR(50) DEFAULT 'UTC',
    date_format VARCHAR(20) DEFAULT 'YYYY-MM-DD',
    time_format VARCHAR(10) DEFAULT '24h' CHECK(time_format IN ('12h', '24h')),

    -- Notification Preferences (Common)
    email_notifications BOOLEAN DEFAULT TRUE,
    push_notifications BOOLEAN DEFAULT TRUE,
    notification_digest VARCHAR(20) DEFAULT 'instant' CHECK(notification_digest IN ('instant', 'daily', 'weekly', 'never')),
    quiet_hours_enabled BOOLEAN DEFAULT FALSE,
    quiet_hours_start TIME DEFAULT '22:00',
    quiet_hours_end TIME DEFAULT '08:00',

    -- Privacy Settings
    profile_visibility VARCHAR(20) DEFAULT 'organization' CHECK(profile_visibility IN ('private', 'organization', 'public')),
    show_online_status BOOLEAN DEFAULT TRUE,
    show_last_active BOOLEAN DEFAULT TRUE,

    -- Security Settings
    session_timeout_minutes INTEGER DEFAULT 60,
    require_reauthentication_for_sensitive BOOLEAN DEFAULT TRUE,

    -- ========================================================================
    -- EMPLOYEE-SPECIFIC PREFERENCES
    -- ========================================================================

    -- Incident Reporting Preferences
    default_anonymous_reporting BOOLEAN DEFAULT FALSE,
    preferred_contact_method VARCHAR(20) DEFAULT 'email' CHECK(preferred_contact_method IN ('email', 'in_app', 'phone')),
    save_draft_reports BOOLEAN DEFAULT TRUE,

    -- Employee Communication Preferences
    receive_case_updates BOOLEAN DEFAULT TRUE,
    receive_deadline_reminders BOOLEAN DEFAULT TRUE,
    reminder_days_before INTEGER DEFAULT 7,

    -- Support & Resources
    show_support_resources BOOLEAN DEFAULT TRUE,
    preferred_support_language VARCHAR(10) DEFAULT 'en',

    -- ========================================================================
    -- IC MEMBER-SPECIFIC PREFERENCES (Productivity Options)
    -- ========================================================================

    -- Case Management
    default_case_view VARCHAR(20) DEFAULT 'list' CHECK(default_case_view IN ('list', 'kanban', 'calendar', 'timeline')),
    cases_per_page INTEGER DEFAULT 20,
    auto_assign_cases BOOLEAN DEFAULT FALSE,
    show_case_priority_indicators BOOLEAN DEFAULT TRUE,

    -- Dashboard Customization
    dashboard_layout JSONB DEFAULT '{"widgets": ["active_cases", "deadlines", "recent_activity", "statistics"]}',
    pinned_cases INTEGER[] DEFAULT '{}',

    -- Workflow Preferences
    auto_advance_workflow BOOLEAN DEFAULT FALSE,
    require_notes_on_status_change BOOLEAN DEFAULT TRUE,
    default_investigation_checklist BOOLEAN DEFAULT TRUE,

    -- Review & Investigation Settings
    review_reminder_frequency VARCHAR(20) DEFAULT 'daily' CHECK(review_reminder_frequency IN ('none', 'daily', 'weekly', 'custom')),
    custom_reminder_days INTEGER[] DEFAULT '{1, 3, 7}',
    investigation_template_id INTEGER,

    -- Reporting Preferences
    default_report_format VARCHAR(10) DEFAULT 'pdf' CHECK(default_report_format IN ('pdf', 'docx', 'html')),
    include_timeline_in_reports BOOLEAN DEFAULT TRUE,
    auto_generate_summary BOOLEAN DEFAULT TRUE,

    -- Calendar & Scheduling
    calendar_integration_enabled BOOLEAN DEFAULT FALSE,
    calendar_provider VARCHAR(20) CHECK(calendar_provider IN ('google', 'outlook', 'apple', NULL)),
    working_hours_start TIME DEFAULT '09:00',
    working_hours_end TIME DEFAULT '18:00',
    working_days INTEGER[] DEFAULT '{1, 2, 3, 4, 5}', -- Monday=1, Sunday=7

    -- Team Collaboration
    show_team_availability BOOLEAN DEFAULT TRUE,
    allow_case_reassignment BOOLEAN DEFAULT TRUE,
    notify_on_team_mentions BOOLEAN DEFAULT TRUE,

    -- Quick Actions
    quick_actions JSONB DEFAULT '["new_note", "update_status", "schedule_meeting", "add_evidence"]',
    keyboard_shortcuts_enabled BOOLEAN DEFAULT TRUE,

    -- ========================================================================
    -- ADVANCED SETTINGS
    -- ========================================================================

    -- Data Management
    export_include_attachments BOOLEAN DEFAULT TRUE,
    default_export_date_range INTEGER DEFAULT 90, -- days

    -- Accessibility
    high_contrast_mode BOOLEAN DEFAULT FALSE,
    reduce_motion BOOLEAN DEFAULT FALSE,
    font_size VARCHAR(10) DEFAULT 'medium' CHECK(font_size IN ('small', 'medium', 'large', 'x-large')),

    -- Experimental Features
    beta_features_enabled BOOLEAN DEFAULT FALSE,

    -- Custom Metadata (for role-specific extensions)
    custom_settings JSONB DEFAULT '{}',

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- PASSWORD HISTORY TABLE (For security - prevent password reuse)
-- ============================================================================
CREATE TABLE IF NOT EXISTS password_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- SECURITY QUESTIONS TABLE (For password reset verification)
-- ============================================================================
CREATE TABLE IF NOT EXISTS security_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    question_1 TEXT NOT NULL,
    answer_1_hash TEXT NOT NULL,
    question_2 TEXT NOT NULL,
    answer_2_hash TEXT NOT NULL,
    question_3 TEXT,
    answer_3_hash TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- ============================================================================
-- TRUSTED DEVICES TABLE (For login security)
-- ============================================================================
CREATE TABLE IF NOT EXISTS trusted_devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    device_fingerprint TEXT NOT NULL,
    device_name TEXT,
    device_type VARCHAR(20) CHECK(device_type IN ('desktop', 'mobile', 'tablet', 'unknown')),
    browser TEXT,
    operating_system TEXT,
    ip_address INET,
    location TEXT,
    is_trusted BOOLEAN DEFAULT FALSE,
    trust_expires_at TIMESTAMPTZ,
    last_used_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, device_fingerprint)
);

-- ============================================================================
-- LOGIN HISTORY TABLE (For security audit)
-- ============================================================================
CREATE TABLE IF NOT EXISTS login_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    login_type VARCHAR(20) DEFAULT 'password' CHECK(login_type IN ('password', 'google', 'sso', 'mfa', 'magic_link')),
    status VARCHAR(20) NOT NULL CHECK(status IN ('success', 'failed', 'blocked', 'mfa_required')),
    ip_address INET,
    user_agent TEXT,
    device_fingerprint TEXT,
    location TEXT,
    failure_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- OAUTH CONNECTIONS TABLE (For Google Auth and future providers)
-- ============================================================================
CREATE TABLE IF NOT EXISTS oauth_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider VARCHAR(20) NOT NULL CHECK(provider IN ('google', 'microsoft', 'github')),
    provider_user_id TEXT NOT NULL,
    provider_email TEXT,
    access_token_encrypted TEXT,
    refresh_token_encrypted TEXT,
    token_expires_at TIMESTAMPTZ,
    profile_data JSONB DEFAULT '{}',
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, provider),
    UNIQUE(provider, provider_user_id)
);

-- ============================================================================
-- EMAIL VERIFICATION TOKENS TABLE (Enhanced)
-- ============================================================================
CREATE TABLE IF NOT EXISTS email_verification_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    token_hash TEXT NOT NULL,
    token_type VARCHAR(20) DEFAULT 'verification' CHECK(token_type IN ('verification', 'change_email')),
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- MAGIC LINK TOKENS TABLE (Passwordless login option)
-- ============================================================================
CREATE TABLE IF NOT EXISTS magic_link_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    token_hash TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    ip_address INET,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- PASSWORD RESET METHODS TABLE (Track which methods user can use)
-- ============================================================================
CREATE TABLE IF NOT EXISTS password_reset_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    email_enabled BOOLEAN DEFAULT TRUE,
    security_questions_enabled BOOLEAN DEFAULT FALSE,
    trusted_device_enabled BOOLEAN DEFAULT FALSE,
    admin_reset_enabled BOOLEAN DEFAULT TRUE,
    backup_codes_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- BACKUP CODES TABLE (For account recovery)
-- ============================================================================
CREATE TABLE IF NOT EXISTS backup_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    code_hash TEXT NOT NULL,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- ADD ENHANCED COLUMNS TO USERS TABLE
-- ============================================================================

-- Google OAuth fields
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id TEXT UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_provider VARCHAR(20) DEFAULT 'local' CHECK(auth_provider IN ('local', 'google', 'sso'));

-- Enhanced security fields
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_required BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS account_locked BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS lock_reason TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_password_change TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS force_logout_before TIMESTAMPTZ;

-- Welcome/onboarding fields
ALTER TABLE users ADD COLUMN IF NOT EXISTS welcome_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_step INTEGER DEFAULT 0;

-- ============================================================================
-- INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_user_preferences_user ON user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_password_history_user ON password_history(user_id);
CREATE INDEX IF NOT EXISTS idx_password_history_created ON password_history(created_at);
CREATE INDEX IF NOT EXISTS idx_security_questions_user ON security_questions(user_id);
CREATE INDEX IF NOT EXISTS idx_trusted_devices_user ON trusted_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_trusted_devices_fingerprint ON trusted_devices(device_fingerprint);
CREATE INDEX IF NOT EXISTS idx_login_history_user ON login_history(user_id);
CREATE INDEX IF NOT EXISTS idx_login_history_created ON login_history(created_at);
CREATE INDEX IF NOT EXISTS idx_oauth_connections_user ON oauth_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_oauth_connections_provider ON oauth_connections(provider, provider_user_id);
CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_user ON email_verification_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_hash ON email_verification_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_magic_link_tokens_hash ON magic_link_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_magic_link_tokens_email ON magic_link_tokens(email);
CREATE INDEX IF NOT EXISTS idx_backup_codes_user ON backup_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for user_preferences
DROP TRIGGER IF EXISTS update_user_preferences_updated_at ON user_preferences;
CREATE TRIGGER update_user_preferences_updated_at
    BEFORE UPDATE ON user_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to create default preferences for new users
CREATE OR REPLACE FUNCTION create_default_user_preferences()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_preferences (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;

    INSERT INTO password_reset_methods (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;

    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to auto-create preferences for new users
DROP TRIGGER IF EXISTS create_user_preferences_trigger ON users;
CREATE TRIGGER create_user_preferences_trigger
    AFTER INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION create_default_user_preferences();

-- Function to track password history
CREATE OR REPLACE FUNCTION track_password_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.password_hash IS DISTINCT FROM NEW.password_hash THEN
        INSERT INTO password_history (user_id, password_hash)
        VALUES (NEW.id, OLD.password_hash);

        NEW.last_password_change = NOW();

        -- Keep only last 10 passwords
        DELETE FROM password_history
        WHERE user_id = NEW.id
        AND id NOT IN (
            SELECT id FROM password_history
            WHERE user_id = NEW.id
            ORDER BY created_at DESC
            LIMIT 10
        );
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for password history
DROP TRIGGER IF EXISTS track_password_history ON users;
CREATE TRIGGER track_password_history
    BEFORE UPDATE OF password_hash ON users
    FOR EACH ROW
    EXECUTE FUNCTION track_password_change();

-- ============================================================================
-- INSERT DEFAULT PREFERENCES FOR EXISTING USERS
-- ============================================================================
INSERT INTO user_preferences (user_id)
SELECT id FROM users
WHERE id NOT IN (SELECT user_id FROM user_preferences)
ON CONFLICT DO NOTHING;

INSERT INTO password_reset_methods (user_id)
SELECT id FROM users
WHERE id NOT IN (SELECT user_id FROM password_reset_methods)
ON CONFLICT DO NOTHING;
