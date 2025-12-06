import pg from 'pg';
import { URL } from 'url';
import { config } from '../config.js';

const { Pool } = pg;

let pool = null;

// Parse DATABASE_URL manually to handle special characters in password
function parseConnectionString(connString) {
  if (!connString) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  const dbUrl = new URL(connString);

  // Enable SSL for production OR for Render databases (which always require SSL)
  const isRenderDb = dbUrl.hostname.includes('render.com');
  const requiresSsl = config.NODE_ENV === 'production' || isRenderDb;

  return {
    host: dbUrl.hostname,
    port: dbUrl.port,
    database: dbUrl.pathname.slice(1), // Remove leading '/'
    user: dbUrl.username,
    password: decodeURIComponent(dbUrl.password),
    ssl: requiresSsl ? { rejectUnauthorized: false } : undefined
  };
}

// Get or create connection pool
function getPool() {
  if (!pool) {
    pool = new Pool(parseConnectionString(config.DATABASE_URL));
  }
  return pool;
}

// Initialize database schema
export async function initializeDatabase() {
  const pool = getPool();
  const client = await pool.connect();

  try {
    console.log('Initializing database schema...');

    // Create organizations table first (referenced by users)
    await client.query(`
      CREATE TABLE IF NOT EXISTS organizations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        domain VARCHAR(255) UNIQUE,
        industry VARCHAR(100),
        employee_count INTEGER,
        address TEXT,
        city VARCHAR(100),
        state VARCHAR(100),
        district_officer_email VARCHAR(255),
        settings JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        full_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL CHECK(role IN ('employee', 'ic_member', 'hr_admin')),
        is_super_admin BOOLEAN DEFAULT FALSE,
        is_active BOOLEAN DEFAULT TRUE,
        organization_id INTEGER REFERENCES organizations(id),
        created_by INTEGER REFERENCES users(id),
        deactivated_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP
      )
    `);

    // Create index on email for faster lookups
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)
    `);

    // Migrate existing users table to add new columns (idempotent)
    try {
      await client.query(`
        ALTER TABLE users ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN DEFAULT FALSE
      `);
      await client.query(`
        ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE
      `);
      await client.query(`
        ALTER TABLE users ADD COLUMN IF NOT EXISTS organization_id INTEGER REFERENCES organizations(id)
      `);
      await client.query(`
        ALTER TABLE users ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES users(id)
      `);
      await client.query(`
        ALTER TABLE users ADD COLUMN IF NOT EXISTS deactivated_at TIMESTAMP
      `);

      // Update role constraint to include hr_admin
      await client.query(`
        ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check
      `);
      await client.query(`
        ALTER TABLE users ADD CONSTRAINT users_role_check
        CHECK(role IN ('employee', 'ic_member', 'hr_admin'))
      `);

      console.log('  ✓ Migrated users table with new columns');
    } catch (err) {
      // Columns might already exist, continue
      console.log('  ℹ Users table migration skipped (columns may already exist)');
    }

    // Create cases table
    await client.query(`
      CREATE TABLE IF NOT EXISTS cases (
        id SERIAL PRIMARY KEY,
        case_code VARCHAR(50) UNIQUE NOT NULL,
        status VARCHAR(50) DEFAULT 'new' CHECK(status IN ('new', 'under_review', 'conciliation', 'investigating', 'decision_pending', 'closed')),
        incident_date DATE NOT NULL,
        description TEXT NOT NULL,
        is_anonymous BOOLEAN DEFAULT FALSE,
        anonymous_alias VARCHAR(255),
        contact_method VARCHAR(255),
        complainant_name VARCHAR(255),
        complainant_email VARCHAR(255),
        conciliation_requested BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        deadline_date DATE NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create status_history table
    await client.query(`
      CREATE TABLE IF NOT EXISTS status_history (
        id SERIAL PRIMARY KEY,
        case_id INTEGER NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
        old_status VARCHAR(50),
        new_status VARCHAR(50) NOT NULL,
        changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        notes TEXT
      )
    `);

    // Create index on case_code for faster lookups
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_cases_case_code ON cases(case_code)
    `);

    // Create index on case_id in status_history
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_status_history_case_id ON status_history(case_id)
    `);

    // Create IC members table
    await client.query(`
      CREATE TABLE IF NOT EXISTS ic_members (
        id SERIAL PRIMARY KEY,
        organization_id INTEGER NOT NULL REFERENCES organizations(id),
        user_id INTEGER NOT NULL REFERENCES users(id),
        role VARCHAR(50) NOT NULL CHECK(role IN ('presiding_officer', 'internal_member', 'external_member')),
        is_active BOOLEAN DEFAULT TRUE,
        appointed_date DATE NOT NULL,
        term_end_date DATE,
        expertise VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by INTEGER REFERENCES users(id),
        UNIQUE(organization_id, user_id)
      )
    `);

    // Create admin audit log table
    await client.query(`
      CREATE TABLE IF NOT EXISTS admin_audit_log (
        id SERIAL PRIMARY KEY,
        admin_id INTEGER NOT NULL REFERENCES users(id),
        action VARCHAR(100) NOT NULL,
        target_type VARCHAR(50),
        target_id INTEGER,
        old_value JSONB,
        new_value JSONB,
        ip_address VARCHAR(45),
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create invitations table
    await client.query(`
      CREATE TABLE IF NOT EXISTS invitations (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL,
        token VARCHAR(255) UNIQUE NOT NULL,
        invited_by INTEGER NOT NULL REFERENCES users(id),
        organization_id INTEGER NOT NULL REFERENCES organizations(id),
        expires_at TIMESTAMP NOT NULL,
        accepted_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Ensure invitations schema aligns with index definitions when legacy tables exist
    await client.query(`
      ALTER TABLE invitations
        ADD COLUMN IF NOT EXISTS token VARCHAR(255);
    `);

    await client.query(`
      ALTER TABLE invitations
        ALTER COLUMN token DROP NOT NULL;
    `);

    // Create password reset tokens table
    await client.query(`
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token VARCHAR(255) UNIQUE NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        used_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Align password reset schema for legacy deployments
    await client.query(`
      ALTER TABLE password_reset_tokens
        ADD COLUMN IF NOT EXISTS token VARCHAR(255);
    `);

    await client.query(`
      ALTER TABLE password_reset_tokens
        ALTER COLUMN token DROP NOT NULL;
    `);

    // Create patterns table (Pattern Analysis feature)
    await client.query(`
      CREATE TABLE IF NOT EXISTS patterns (
        id SERIAL PRIMARY KEY,
        organization_id INTEGER NOT NULL REFERENCES organizations(id),
        pattern_type VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        severity VARCHAR(20) CHECK(severity IN ('low', 'medium', 'high', 'critical')),
        frequency_count INTEGER DEFAULT 0,
        related_cases INTEGER[],
        metadata JSONB DEFAULT '{}',
        detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status VARCHAR(50) DEFAULT 'active' CHECK(status IN ('active', 'monitoring', 'resolved'))
      )
    `);

    // Create insights table (Proactive Insights feature)
    await client.query(`
      CREATE TABLE IF NOT EXISTS insights (
        id SERIAL PRIMARY KEY,
        organization_id INTEGER NOT NULL REFERENCES organizations(id),
        insight_type VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        recommendations TEXT[],
        priority VARCHAR(20) CHECK(priority IN ('low', 'medium', 'high', 'critical')),
        status VARCHAR(50) DEFAULT 'new' CHECK(status IN ('new', 'acknowledged', 'in_progress', 'resolved', 'dismissed')),
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        acknowledged_by INTEGER REFERENCES users(id),
        acknowledged_at TIMESTAMP
      )
    `);

    // Create indexes for admin tables
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_ic_members_org ON ic_members(organization_id)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_ic_members_user ON ic_members(user_id)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_audit_log_admin ON admin_audit_log(admin_id)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_invitations_token ON invitations(token)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user ON password_reset_tokens(user_id)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_patterns_org ON patterns(organization_id)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_patterns_type ON patterns(pattern_type)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_insights_org ON insights(organization_id)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_insights_status ON insights(status)
    `);

    console.log('Database schema initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Create a Proxy that lazily creates the pool on first access
const poolProxy = new Proxy({}, {
  get(target, prop) {
    const pool = getPool();
    const value = pool[prop];
    return typeof value === 'function' ? value.bind(pool) : value;
  }
});

export default poolProxy;
