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

  return {
    host: dbUrl.hostname,
    port: dbUrl.port,
    database: dbUrl.pathname.slice(1), // Remove leading '/'
    user: dbUrl.username,
    password: decodeURIComponent(dbUrl.password),
    ssl: config.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined
  };
}

// Get or create connection pool
function getPool() {
  if (!pool) {
    console.log('Creating PostgreSQL connection pool...');
    console.log('DATABASE_URL:', config.DATABASE_URL ? 'Set' : 'NOT SET');
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

    // Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        full_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL CHECK(role IN ('employee', 'ic_member')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP
      )
    `);

    // Create index on email for faster lookups
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)
    `);

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
